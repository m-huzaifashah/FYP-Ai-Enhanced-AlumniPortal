from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
import requests
import fitz  # PyMuPDF

app = FastAPI()

# ===============================
# CORS (IMPORTANT)
# ===============================
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

CORE_API = "http://localhost:3008/api"

# ===============================
# PDF TEXT EXTRACTION
# ===============================
def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.lower()

# ===============================
# SIMPLE SKILL EXTRACTION
# ===============================
def extract_skills(text: str, skill_vocab: list[str]) -> list[str]:
    found = []
    for skill in skill_vocab:
        if skill in text:
            found.append(skill)
    return list(set(found))

# ===============================
# PDF SKILL GAP ENDPOINT ✅
# ===============================
@app.post("/skill-gap/analyze-pdf")
async def analyze_skill_gap_pdf(
    resume: UploadFile = File(...),
    job_id: int = None
):
    # 1️⃣ Read PDF
    pdf_bytes = await resume.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text.strip():
        return {
            "matched_skills": [],
            "missing_skills": [],
            "raw_coverage_percent": 0,
            "ml_match_percentage": 0,
            "note": "Could not extract text from resume"
        }

    # 2️⃣ Fetch skill vocabulary
    skill_vocab = requests.get(f"{CORE_API}/skills").json()

    # 3️⃣ Extract resume skills
    student_skills = extract_skills(resume_text, skill_vocab)

    if not student_skills:
        return {
            "matched_skills": [],
            "missing_skills": [],
            "raw_coverage_percent": 0,
            "ml_match_percentage": 0,
            "note": "No relevant skills detected in resume"
        }

    # 4️⃣ Fetch job skills
    job = requests.get(f"{CORE_API}/jobs/{job_id}").json()
    job_skills = job.get("skills", [])

    # 5️⃣ Compare
    matched = list(set(student_skills) & set(job_skills))
    missing = list(set(job_skills) - set(student_skills))

    # 6️⃣ ML Features
    features = [[
        len(matched) / max(len(job_skills), 1),
        len(matched),
        len(missing),
        len(student_skills),
        len(job_skills)
    ]]

    score = float(np.clip(model.predict(features)[0], 0, 1))

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "raw_coverage_percent": round(len(matched) / max(len(job_skills), 1) * 100, 2),
        "ml_match_percentage": round(score * 100, 2)
    }
