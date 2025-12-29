from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
import requests
import fitz  # PyMuPDF
import re

# OCR imports
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
# LOAD ML MODEL
# ===============================
model = joblib.load("skill_gap_xgb_model.pkl")

# CORE BACKEND BASE URL
CORE_API = "http://localhost:3008/api"


# ===============================
# TECH SKILL ONTOLOGY (STRICT)
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
# TEXT NORMALIZATION
# ===============================
def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9+ ]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ===============================
# PDF TEXT EXTRACTION (TEXT + OCR)
# ===============================
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""

    # 1️⃣ Normal PDF text
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception:
        pass

    if text.strip():
        return text.lower()

    # 2️⃣ OCR fallback
    try:
        images = convert_from_bytes(file_bytes)
        ocr_text = ""
        for img in images:
            ocr_text += pytesseract.image_to_string(img)
        return ocr_text.lower()
    except Exception:
        return ""


# ===============================
# SKILL EXTRACTION FROM RESUME
# ===============================
def extract_skills_from_resume(text: str) -> list[str]:
    text = normalize(text)
    found = set()

    for skill in TECH_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", text):
            found.add(skill)

    return list(found)


# =====================================================
# 🔥 FINAL ENDPOINT: ROLE + LEVEL BASED SKILL GAP
# =====================================================
@app.post("/skill-gap/analyze-role-level")
async def analyze_skill_gap_role_level(
    resume: UploadFile = File(...),
    role: str = Form(...),
    level: str = Form(...)
):
    # 1️⃣ Read resume
    pdf_bytes = await resume.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text.strip():
        return {
            "error": "Could not extract text from resume"
        }

    # 2️⃣ Extract resume skills
    student_skills = extract_skills_from_resume(resume_text)

    if not student_skills:
        return {
            "error": "No relevant technical skills detected in resume"
        }

    # 3️⃣ Fetch REQUIRED SKILLS from CORE BACKEND
    try:
        resp = requests.get(
            f"{CORE_API}/skills/by-role-level",
            params={"role": role, "level": level},
            timeout=10
        )
        required_skills = resp.json()
    except Exception:
        return {
            "error": "Failed to fetch skills from core backend"
        }

    if not required_skills:
        return {
            "error": "No skills found for selected role and level"
        }

    # 4️⃣ Skill comparison
    matched = list(set(student_skills) & set(required_skills))
    missing = list(set(required_skills) - set(student_skills))

    # 5️⃣ ML FEATURES (same model – no retraining needed)
    features = [[
        len(matched) / max(len(required_skills), 1),
        len(matched),
        len(missing),
        len(student_skills),
        len(required_skills)
    ]]

    score = float(np.clip(model.predict(features)[0], 0, 1))

    # 6️⃣ FINAL RESPONSE
    return {
        "role": role,
        "level": level,
        "required_skills": required_skills,
        "extracted_resume_skills": student_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "raw_coverage_percent": round(len(matched) / max(len(required_skills), 1) * 100, 2),
        "ml_match_percentage": round(score * 100, 2)
    }
