import os
import re
import logging

import numpy as np
import joblib
import httpx
import fitz  # PyMuPDF

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# OCR
import pytesseract
from pdf2image import convert_from_bytes

# ===============================
# LOGGING
# ===============================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ===============================
# ENV
# ===============================
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

CORE_API = os.getenv("CORE_API_URL", "http://127.0.0.1:3008/api")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# ===============================
# FASTAPI APP
# ===============================
app = FastAPI(title="Skill Gap Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# LOAD MODELS
# ===============================
try:
    model = joblib.load(
        os.path.join(os.path.dirname(__file__), "models", "skill_gap_xgb_model.pkl")
    )
    logger.info("XGBoost model loaded successfully")
except Exception as e:
    logger.error("Failed to load XGBoost model: %s", e)
    raise SystemExit("Cannot start without the XGBoost model") from e

try:
    sbert = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    logger.info("SBERT model loaded successfully")
except Exception as e:
    logger.error("Failed to load SBERT model: %s", e)
    raise SystemExit("Cannot start without the SBERT model") from e

# ===============================
# TECH SKILL ONTOLOGY
# ===============================
TECH_SKILLS = {
    "c", "c++", "c#", "java", "python", "javascript", "typescript",
    "sql", "mysql", "postgresql", "sqlite", "mongodb", "redis",
    "node js", "express", "spring", "spring boot", "django", "flask", "fastapi",
    "react", "angular", "vue", "redux",
    "docker", "kubernetes", "helm", "terraform",
    "aws", "azure", "gcp", "ec2", "s3", "lambda",
    "git", "github", "gitlab", "bitbucket",
    "rest api", "restful api", "graphql", "grpc",
    "jwt", "oauth", "oauth2",
    "kafka", "rabbitmq", "nats",
    "tensorflow", "pytorch", "keras", "xgboost",
    "pandas", "numpy", "matplotlib", "seaborn",
    "jenkins", "github actions", "gitlab ci",
    "selenium", "pytest", "jest", "junit",
    "firebase", "dynamodb", "cassandra", "neo4j",
}

# ===============================
# UTILS
# ===============================

def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9+ ]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF, falling back to OCR for scanned docs."""
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s", e)

    if text.strip():
        return text.lower()

    # Fallback to OCR for image-based PDFs
    try:
        logger.info("Falling back to OCR for text extraction")
        images = convert_from_bytes(file_bytes)
        return " ".join(
            pytesseract.image_to_string(img) for img in images
        ).lower()
    except Exception as e:
        logger.error("OCR extraction also failed: %s", e)
        return ""


def extract_skills_from_resume(text: str) -> list[str]:
    text = normalize(text)
    found = set()
    for skill in TECH_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", text):
            found.add(skill)
    return list(found)


# ===============================
# MAIN ENDPOINT
# ===============================
@app.post("/skill-gap/analyze-role-level")
async def analyze_skill_gap_role_level(
    resume: UploadFile = File(...),
    role: str = Form(...),
    level: str = Form(...),
):
    # ── Input validation ──────────────────────────────────
    if not role.strip() or not level.strip():
        raise HTTPException(status_code=422, detail="'role' and 'level' must not be empty")

    if resume.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    pdf_bytes = await resume.read()

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_FILE_SIZE // (1024*1024)} MB)",
        )

    # 1️⃣ Resume text
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from resume")

    # 2️⃣ Resume skills
    student_skills = extract_skills_from_resume(resume_text)
    if not student_skills:
        raise HTTPException(status_code=422, detail="No relevant skills detected in resume")

    # 3️⃣ Required skills (async HTTP)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{CORE_API}/skills/by-role-level",
                params={"role": role, "level": level},
            )
            resp.raise_for_status()
            required_skills = resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("Node API returned %s: %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch skills from core API")
    except Exception as e:
        logger.error("Failed to reach core API: %s", e)
        raise HTTPException(status_code=502, detail="Failed to fetch skills from core API")

    if not required_skills:
        raise HTTPException(status_code=404, detail="No skills found for the given role & level")

    # 4️⃣ Match / Missing
    matched = list(set(student_skills) & set(required_skills))
    missing = list(set(required_skills) - set(student_skills))

    # 5️⃣ SBERT semantic similarity
    job_embeds = sbert.encode(required_skills, show_progress_bar=False)
    resume_embeds = sbert.encode(student_skills, show_progress_bar=False)

    sim_matrix = cosine_similarity(job_embeds, resume_embeds)
    sims = [sim_matrix[i].max() for i in range(len(required_skills))]
    avg_similarity = float(np.mean(sims)) if sims else 0.0

    # 6️⃣ XGBoost features (exact training order)
    features = [[
        avg_similarity,
        len(matched),
        len(missing),
        len(student_skills),
        len(required_skills),
    ]]

    raw_model_score = float(np.clip(model.predict(features)[0], 0, 1))

    final_ai_score = 0.6 * raw_model_score + 0.4 * avg_similarity

    logger.info(
        "Analysis complete for role=%s level=%s — match=%.1f%%",
        role, level, final_ai_score * 100,
    )

    return {
        "role": role,
        "level": level,
        "required_skills": required_skills,
        "extracted_resume_skills": student_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "raw_coverage_percent": round(len(matched) / len(required_skills) * 100, 2),
        "semantic_similarity_percent": round(avg_similarity * 100, 2),
        "raw_model_score_percent": round(raw_model_score * 100, 2),
        "ml_match_percentage": round(final_ai_score * 100, 2),
    }