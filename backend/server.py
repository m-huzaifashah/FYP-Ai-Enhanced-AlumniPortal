from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
import requests
import fitz  # PyMuPDF
import re

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# OCR
import pytesseract
from pdf2image import convert_from_bytes

# ===============================
# FASTAPI APP
# ===============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# LOAD MODELS
# ===============================
model = joblib.load("skill_gap_xgb_model.pkl")
sbert = SentenceTransformer(
    "all-MiniLM-L6-v2",
    device="cpu"
)

CORE_API = "http://localhost:3008/api"

# ===============================
# TECH SKILL ONTOLOGY
# ===============================
TECH_SKILLS = {
    "c","c++","c#","java","python","javascript","typescript",
    "sql","mysql","postgresql","sqlite","mongodb","redis",
    "node js","express","spring","spring boot","django","flask","fastapi",
    "react","angular","vue","redux",
    "docker","kubernetes","helm","terraform",
    "aws","azure","gcp","ec2","s3","lambda",
    "git","github","gitlab","bitbucket",
    "rest api","restful api","graphql","grpc",
    "jwt","oauth","oauth2",
    "kafka","rabbitmq","nats",
    "tensorflow","pytorch","keras","xgboost",
    "pandas","numpy","matplotlib","seaborn",
    "jenkins","github actions","gitlab ci",
    "selenium","pytest","jest","junit",
    "firebase","dynamodb","cassandra","neo4j"
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
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception:
        pass

    if text.strip():
        return text.lower()

    try:
        images = convert_from_bytes(file_bytes)
        return " ".join(
            pytesseract.image_to_string(img) for img in images
        ).lower()
    except Exception:
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
    level: str = Form(...)
):
    # 1️⃣ Resume text
    pdf_bytes = await resume.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text.strip():
        return {"error": "Could not extract text from resume"}

    # 2️⃣ Resume skills
    student_skills = extract_skills_from_resume(resume_text)
    if not student_skills:
        return {"error": "No relevant skills detected"}

    # 3️⃣ Required skills
    try:
        resp = requests.get(
            f"{CORE_API}/skills/by-role-level",
            params={"role": role, "level": level},
            timeout=10
        )
        required_skills = resp.json()
    except Exception:
        return {"error": "Failed to fetch skills"}

    if not required_skills:
        return {"error": "No skills found for role & level"}

    # 4️⃣ Match / Missing
    matched = list(set(student_skills) & set(required_skills))
    missing = list(set(required_skills) - set(student_skills))

    # 5️⃣ SBERT SEMANTIC SIMILARITY (CRITICAL)
    job_embeds = sbert.encode(required_skills, show_progress_bar=False)
    resume_embeds = sbert.encode(student_skills, show_progress_bar=False)

    sim_matrix = cosine_similarity(job_embeds, resume_embeds)
    sims = [sim_matrix[i].max() for i in range(len(required_skills))]
    avg_similarity = float(np.mean(sims)) if sims else 0.0


    # 6️⃣ XGBOOST FEATURES (EXACT TRAINING ORDER)
    features = [[
        avg_similarity,
        len(matched),
        len(missing),
        len(student_skills),
        len(required_skills)
    ]]


    raw_model_score = float(np.clip(model.predict(features)[0], 0, 1))

    final_ai_score = (
    0.6 * raw_model_score +
    0.4 * avg_similarity
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
    "ml_match_percentage": round(final_ai_score * 100, 2)
}