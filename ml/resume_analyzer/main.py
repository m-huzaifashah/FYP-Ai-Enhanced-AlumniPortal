"""
main.py
-------
Resume Analyzer Microservice — FastAPI Entry Point
Phase 8 (XGBoost Regressor) — Final version, all phases active

Run with:
    uvicorn main:app --reload --port 8001

Train XGBoost model first (optional but recommended):
    python models/train_xgb.py
"""

import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from parsers.resume_parser    import ResumeParser
from nlp.ner_extractor        import NERExtractor
from nlp.skill_matcher        import SkillMatcher, JDSkillExtractor
from scoring.semantic_scorer  import SemanticScorer
from scoring.format_checker   import FormatChecker
from reporting.report_builder import ReportBuilder

# New Production Architecture Imports
from scoring.feature_builder  import FeatureBuilder
from scoring.ats_scorer       import build_ats_response
from models.xgb_predictor   import XGBPredictor
import joblib
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resume Analyzer API",
    description="AI-powered ATS resume analyzer — Alumni Portal FYP",
    version="3.0.0 — XGBoost + SBERT Blended Scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singletons — loaded once at startup
# ---------------------------------------------------------------------------
parser         = ResumeParser()
ner_extractor  = NERExtractor()
skill_matcher  = SkillMatcher()
jd_extractor   = JDSkillExtractor()
scorer         = SemanticScorer()
fmt_checker    = FormatChecker()
report_builder = ReportBuilder()

feature_builder = FeatureBuilder()
xgb_predictor   = XGBPredictor()
try:
    lgbm_ranker = joblib.load("models/lgbm_ats_ranker.joblib")
    is_ranker_loaded = True
except:
    lgbm_ranker = None
    is_ranker_loaded = False


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class ParseResponse(BaseModel):
    filename: str
    file_type: str
    is_scanned: bool
    word_count: int
    has_contact_info: bool
    sections_found: list[str]
    warnings: list[str]

class ExtractResponse(BaseModel):
    skills: list[str]
    skill_categories: dict
    degrees: list[dict]
    organizations: list[str]
    designations: list[str]
    years_experience: Optional[int]
    gpa: Optional[dict]
    raw_entity_count: int

class SkillMatchResponse(BaseModel):
    matched_skills: list[str]
    missing_skills: list[str]
    extra_skills: list[str]
    match_score: float
    weighted_score: float
    coverage_percent: int
    matched_count: int
    required_count: int

class AnalyzeResponse(BaseModel):
    filename: str
    analyzed_at: str
    # Blended score (XGBoost + SBERT)
    ats_score: int
    grade: str
    score_label: str
    score_potential: int
    # Score details
    breakdown: dict
    xgb_detail: dict           # XGBoost-specific info
    skills: dict
    profile: dict
    job_description: dict
    formatting: dict
    suggestions: list[dict]
    quick_wins: list[str]
    semantic: dict
    radar_chart_b64: Optional[str]
    warnings: list[str]

class HealthResponse(BaseModel):
    status: str
    version: str
    phases_active: list[str]
    xgb_model_loaded: bool


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_model=HealthResponse)
async def health_check():
    return {
        "status":           "running",
        "version":          "3.0.0",
        "xgb_model_loaded": is_ranker_loaded,
        "phases_active": [
            "Phase 2 — Parsing",
            "Phase 3 — NER Feature Extraction",
            "Phase 4 — Semantic ATS Scoring (SBERT)",
            "Phase 5 — Improvement Suggestions (YAKE!)",
            "Phase 6 — Report Builder",
            "Phase 8 — Dual-Head ATS (Diagnostic + LGBMRanker)",
        ],
    }


# ── Phase 2 ──────────────────────────────────────────────────────────────────

@app.post("/parse", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    """Phase 2 — Parse resume. Returns structural metadata."""
    contents = await file.read()
    _validate_file(file.filename, contents)
    try:
        result = parser.parse(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse failed: {str(e)}")
    return ParseResponse(
        filename=result["filename"],
        file_type=result["file_type"],
        is_scanned=result["is_scanned"],
        word_count=result["word_count"],
        has_contact_info=result["has_contact_info"],
        sections_found=[k for k, v in result["sections"].items() if v.strip()],
        warnings=result["warnings"],
    )


# ── Phase 3 ──────────────────────────────────────────────────────────────────

@app.post("/extract", response_model=ExtractResponse)
async def extract_entities(file: UploadFile = File(...)):
    """Phase 3 — Extract NER entities from resume."""
    contents = await file.read()
    _validate_file(file.filename, contents)
    try:
        parsed   = parser.parse(contents, file.filename)
        entities = ner_extractor.extract(parsed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    return ExtractResponse(**entities)


@app.post("/match-skills", response_model=SkillMatchResponse)
async def match_skills(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    """Phase 3 — Resume vs JD skill gap analysis."""
    contents = await file.read()
    _validate_file(file.filename, contents)
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description required.")
    try:
        parsed          = parser.parse(contents, file.filename)
        resume_entities = ner_extractor.extract(parsed)
        jd_info         = jd_extractor.extract(job_description)
        jd_skills       = jd_info["required_skills"] + jd_info["preferred_skills"]
        result          = skill_matcher.compare(resume_entities["skills"], jd_skills)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")
    return SkillMatchResponse(**result)


# ── Phase 8 — PRIMARY ENDPOINT ───────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    ★ PRIMARY ENDPOINT — Full ATS Resume Analysis ★

    Complete 8-phase pipeline:
      Phase 2: Parse resume (PDF/DOCX)
      Phase 3: NER entity extraction (skills, degrees, orgs)
      Phase 4: SBERT semantic scoring + format compliance
      Phase 5: Improvement suggestions (YAKE! keyword analysis)
      Phase 6: Report assembly + radar chart
      Phase 8: XGBoost score calibration (blended with SBERT)

    Score formula:
      final = (SBERT_score × 60%) + (XGBoost_score × 40%)

    If XGBoost model is not trained yet → uses SBERT score only.

    Multipart body:
      file:            resume PDF/DOCX (max 5MB)
      job_description: raw JD text
    """
    contents = await file.read()
    _validate_file(file.filename, contents)
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="job_description is required.")

    try:
        # ── Run full pipeline ──────────────────────────────────────────────
        pipeline = _run_pipeline(contents, file.filename, job_description)

        # ── Feature Construction ───────────────────────────────────────────
        resume_skills = set(pipeline["entities"].get("skills", []))
        jd_skills_req = pipeline["jd_entities"].get("required_skills", [])
        jd_skills_pref = pipeline["jd_entities"].get("preferred_skills", [])
        jd_skills = set(jd_skills_req + jd_skills_pref)
        
        matched_skills = set(pipeline["score_result"]["keyword_detail"].get("matched_skills", []))
        missing_required = set(pipeline["score_result"]["keyword_detail"].get("missing_skills", []))
        extra_skills = resume_skills - jd_skills
        
        req_years = pipeline["jd_entities"].get("years_experience", 0)
        res_years = pipeline["entities"].get("years_experience", 0)

        # Title similarity (Jaccard fallback)
        res_titles = set(t.lower() for t in pipeline["entities"].get("designations", []))
        jd_title = (pipeline["jd_entities"].get("job_title") or "").lower()
        title_sim = 1.0 if any(jd_title in rt for rt in res_titles) else 0.0

        # Compute true keyword mentions density
        raw_text_lower = pipeline["parsed"].get("raw_text", "").lower()
        import re
        mentions_count = 0
        for skill in matched_skills:
            pattern = re.compile(rf"\b{re.escape(skill.lower())}\b")
            mentions_count += len(pattern.findall(raw_text_lower))
        
        features = feature_builder.build_vector(
            semantic_score=pipeline["score_result"]["semantic_detail"]["cosine_similarity"],
            matched_skills=matched_skills,
            missing_required=missing_required,
            extra_skills=extra_skills,
            resume_skills=resume_skills,
            jd_skills=jd_skills,
            required_years=float(req_years) if req_years else 0.0,
            resume_years=float(res_years) if res_years else 0.0,
            title_similarity=title_sim,
            matched_mentions_count=mentions_count,
            total_words=pipeline["parsed"].get("word_count", 0),
            section_score=pipeline["score_result"]["breakdown"]["section_score"] / 100.0,
            format_score=pipeline["fmt_result"].get("formatting_score", 100) / 100.0
        )

        # ── Candidate Diagnostic Scorer (Head 1) ───────────────────────────
        ats_diagnostic = build_ats_response(features, list(missing_required))

        # ── Inject blended score back into score_result for report builder ─
        pipeline["score_result"]["ats_score"] = ats_diagnostic["ats_score"]
        
        if ats_diagnostic["ats_score"] >= 80: grade = "A"
        elif ats_diagnostic["ats_score"] >= 65: grade = "B"
        elif ats_diagnostic["ats_score"] >= 50: grade = "C"
        elif ats_diagnostic["ats_score"] >= 35: grade = "D"
        else: grade = "F"
        pipeline["score_result"]["grade"] = grade

        # ── Build base report ──────────────────────────────────────────────
        report = report_builder.build(pipeline, job_description)

        # ── Override frontend fields with new Diagnostic Schema ────────────
        report["score_potential"] = min(100, ats_diagnostic["ats_score"] + 15)
        
        report["breakdown"]["semantic_score"] = int(ats_diagnostic["breakdown"]["semantic"] * 100)
        report["breakdown"]["keyword_score"] = int(ats_diagnostic["breakdown"]["skills"] * 100)
        report["breakdown"]["formatting_score"] = int(ats_diagnostic["breakdown"]["format"] * 100)
        report["breakdown"]["section_score"] = int(ats_diagnostic["breakdown"]["experience"] * 100) # Reusing field
        
        # ── XGBoost Regressor (Head 2) ─────────────────────────────────────
        xgb_result = xgb_predictor.predict(
            parsed=pipeline["parsed"],
            entities=pipeline["entities"],
            jd_entities=pipeline["jd_entities"],
            score_result=pipeline["score_result"],
            fmt_result=pipeline["fmt_result"],
        )
        
        report["xgb_detail"] = {
            "model_used": xgb_result["model_used"],
            "confidence": xgb_result["confidence"],
            "blend_weights": xgb_result["blend_weights"],
            "sbert_score": xgb_result["sbert_score"],
            "xgb_score": xgb_result["xgb_score"],
            "explanations": xgb_predictor.get_score_explanation(xgb_result["feature_vector"])
        }
        
        # Format actionable suggestions for frontend and append to YAKE suggestions
        for s in ats_diagnostic["suggestions"]:
            report["suggestions"].append({
                "priority": "high",
                "category": "Actionable Fix",
                "title": s,
                "detail": "Derived from candidate diagnostic scorer.",
                "example": "",
                "impact": "+5-10 pts"
            })
            
        # Re-sort suggestions by priority (critical, high, medium, low)
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        report["suggestions"].sort(key=lambda x: priority_order.get(x["priority"], 99))
        
        # Merge quick wins
        report["quick_wins"] = list(set(report["quick_wins"] + ats_diagnostic["suggestions"][:2]))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"/analyze error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    return AnalyzeResponse(**report)


@app.get("/model/status")
async def model_status():
    """Phase 8 — Dual-Head Status"""
    return {
        "model_available": is_ranker_loaded,
        "model_type":      "Dual-Head (LGBMRanker + Deterministic Scorer)",
        "blend_weights":   {"sbert": 0.35, "skills": 0.30, "experience": 0.15, "format": 0.20},
        "feature_importance": "Manual Weights used for Diagnostic Scorer.",
        "train_command":   "python models/train_ranker.py",
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _run_pipeline(file_bytes: bytes, filename: str, jd_text: str) -> dict:
    parsed          = parser.parse(file_bytes, filename)
    fmt_result      = fmt_checker.check(parsed)
    resume_entities = ner_extractor.extract(parsed)
    jd_entities     = jd_extractor.extract(jd_text)
    score_result    = scorer.score(
        parsed_resume   = parsed,
        resume_entities = resume_entities,
        jd_text         = jd_text,
        jd_entities     = jd_entities,
        format_issues   = fmt_result["issues"],
    )
    return {
        "parsed":       parsed,
        "entities":     resume_entities,
        "jd_entities":  jd_entities,
        "fmt_result":   fmt_result,
        "score_result": score_result,
    }


def _validate_file(filename: Optional[str], contents: bytes):
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB.")
    if not filename.lower().endswith((".pdf", ".docx", ".doc")):
        raise HTTPException(status_code=415, detail="Upload PDF or DOCX only.")