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
CORE_API = "http://localhost:3008/api"


# ===============================
# TECH SKILL ONTOLOGY (STRICT)
# ===============================
TECH_SKILLS = {

  
  "python", "java", "javascript", "typescript", "c", "c++", "c#",
  "go", "scala", "ruby", "php", "swift", "kotlin", "rust", "bash",
   "node.js", "node js", "express", "express.js",
  "fastapi", "flask", "django",
  "spring", "spring boot", "nestjs",
  "laravel", "rails", "koa", "hapi", "micronaut",
"react", "react.js", "angular", "vue", "vue.js",
  "next.js", "nuxt", "svelte",
  "redux", "tailwind", "bootstrap",
  "jquery", "webpack", "vite", "babel",
  "sql", "postgresql", "mysql", "sqlite",
  "oracle", "mssql", "sql server",
  "cockroachdb", "mariadb", "snowflake",
  "mongodb", "redis", "cassandra",
  "dynamodb", "firebase", "neo4j",
  "couchdb", "elasticsearch",
  "opensearch", "arangodb",
  "rest api", "restful api", "graphql",
  "grpc", "websocket",
  "soap", "json", "xml",
  "openapi", "swagger",
  "jwt", "oauth", "oauth2", "sso",
  "bcrypt", "argon2",
  "ssl", "tls",
  "keycloak", "auth0",
  "docker", "kubernetes", "helm",
  "terraform", "ansible",
  "jenkins", "github actions",
  "gitlab ci", "circleci", "argo cd",
  "aws", "azure", "gcp",
  "ec2", "s3", "lambda",
  "cloud functions",
  "cloud run", "eks", "aks",
  "pandas", "numpy", "scikit-learn",
  "tensorflow", "pytorch",
  "keras", "xgboost",
  "lightgbm", "matplotlib", "seaborn",
  "kafka", "rabbitmq", "activemq",
  "redis pubsub", "nats",
  "pytest", "jest", "mocha", "junit", "selenium",
  "git", "github", "gitlab", "bitbucket", "postman",'postman'


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

    # 1️⃣ Normal text extraction
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
# SKILL EXTRACTION (ZERO NOISE)
# ===============================
def extract_skills_from_resume(text: str) -> list[str]:
    text = normalize(text)
    found = set()

    for skill in TECH_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", text):
            found.add(skill)

    return list(found)


# ===============================
# PDF SKILL GAP ENDPOINT ✅
# ===============================
@app.post("/skill-gap/analyze-pdf")
async def analyze_skill_gap_pdf(
    resume: UploadFile = File(...),
    job_id: int = Form(...)
):
    # 1️⃣ Read PDF
    pdf_bytes = await resume.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text.strip():
        return {
            "extracted_resume_skills": [],
            "matched_skills": [],
            "missing_skills": [],
            "raw_coverage_percent": 0,
            "ml_match_percentage": 0,
            "note": "Could not extract text from resume"
        }

    # 2️⃣ Extract resume skills (STRICT)
    student_skills = extract_skills_from_resume(resume_text)
    print("🔍 EXTRACTED RESUME SKILLS:", student_skills)

    if not student_skills:
        return {
            "extracted_resume_skills": [],
            "matched_skills": [],
            "missing_skills": [],
            "raw_coverage_percent": 0,
            "ml_match_percentage": 0,
            "note": "No relevant technical skills detected"
        }

    # 3️⃣ Fetch job details (DATASET)
    job = requests.get(f"{CORE_API}/jobs/{job_id}").json()
    job_skills = job.get("skills", [])

    # 4️⃣ Skill comparison
    matched = list(set(student_skills) & set(job_skills))
    missing = list(set(job_skills) - set(student_skills))

    # 5️⃣ ML features
    features = [[
        len(matched) / max(len(job_skills), 1),
        len(matched),
        len(missing),
        len(student_skills),
        len(job_skills)
    ]]

    score = float(np.clip(model.predict(features)[0], 0, 1))

    # 6️⃣ Final response
    return {
        "extracted_resume_skills": student_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "raw_coverage_percent": round(len(matched) / max(len(job_skills), 1) * 100, 2),
        "ml_match_percentage": round(score * 100, 2)
    }
