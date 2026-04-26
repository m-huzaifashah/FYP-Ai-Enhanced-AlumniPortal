# ats_scorer.py

from typing import Dict, List
import numpy as np

FEATURE_SCHEMA_VERSION = "v2.0"

# Mapped precisely to feature_builder.py (12-dim vector)
FEATURE_INDEX = {
    "semantic_score": 0,
    "skill_coverage_ratio": 1,
    "missing_critical_skills": 3,
    "experience_gap": 5,
    "keyword_density": 8,
    "format_quality": 11,
}

WEIGHTS = {
    "semantic_score": 0.35,
    "skill_coverage_ratio": 0.30,
    "experience": 0.15,
    "keyword_density": 0.10,
    "format_quality": 0.10,
}

def normalize_experience_gap(gap: float) -> float:
    # gap = max(0, required - actual)
    return float(np.clip(1 - (gap / 5.0), 0.0, 1.0))

def compute_ats_score(features: np.ndarray) -> Dict:
    # Handles both (12,) and (1, 12) shapes
    flat_features = features.flatten()
    assert flat_features.shape == (12,), f"Expected 12 features, got {flat_features.shape}"
    assert np.isfinite(flat_features).all()

    semantic = float(flat_features[FEATURE_INDEX["semantic_score"]])
    skills   = float(flat_features[FEATURE_INDEX["skill_coverage_ratio"]])
    gap      = float(flat_features[FEATURE_INDEX["experience_gap"]])
    keywords = float(flat_features[FEATURE_INDEX["keyword_density"]])
    format_q = float(flat_features[FEATURE_INDEX["format_quality"]])

    exp_score = normalize_experience_gap(gap)

    raw_score = (
        WEIGHTS["semantic_score"] * semantic +
        WEIGHTS["skill_coverage_ratio"] * skills +
        WEIGHTS["experience"] * exp_score +
        WEIGHTS["keyword_density"] * keywords +
        WEIGHTS["format_quality"] * format_q
    )

    score = int(np.clip(raw_score * 100, 0, 100))

    return {
        "score": score,
        "components": {
            "semantic": semantic,
            "skills": skills,
            "experience": exp_score,
            "keywords": keywords,
            "format": format_q
        }
    }

def extract_strengths(f: Dict) -> List[str]:
    strengths = []
    if f["skills"] > 0.75:
        strengths.append("Strong alignment with required technical skills")
    if f["semantic"] > 0.8:
        strengths.append("Resume content is highly relevant to the job role")
    if f["keywords"] > 0.65:
        strengths.append("Effective use of job-specific keywords")
    if f["experience"] > 0.8:
        strengths.append("Experience level matches job expectations")
    return strengths[:3]

def extract_weaknesses(f: Dict, missing_skills: List[str]) -> List[str]:
    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Missing critical skills: {', '.join(missing_skills[:3])}")
    if f["skills"] < 0.5:
        weaknesses.append("Low overall skill match with job requirements")
    if f["semantic"] < 0.6:
        weaknesses.append("Resume is not well aligned with the job description")
    if f["experience"] < 0.5:
        weaknesses.append("Experience level is below job requirements")
    if f["keywords"] < 0.4:
        weaknesses.append("Insufficient use of relevant keywords")
    return weaknesses[:4]

def generate_suggestions(f: Dict, missing_skills: List[str]) -> List[str]:
    suggestions = []
    if missing_skills:
        suggestions.append(
            f"Add or highlight experience with: {', '.join(missing_skills[:3])}"
        )
    if f["skills"] < 0.6:
        suggestions.append(
            "Align your skills section more closely with the job requirements"
        )
    if f["semantic"] < 0.65:
        suggestions.append(
            "Rewrite your summary to better reflect the job responsibilities"
        )
    if f["keywords"] < 0.5:
        suggestions.append(
            "Incorporate more keywords from the job description into your resume"
        )
    if f["experience"] < 0.6:
        suggestions.append(
            "Emphasize relevant experience or add projects demonstrating required skills"
        )
        
    if not suggestions:
        suggestions.append("Minor improvements needed — consider refining formatting and keyword usage")
        
    return suggestions[:5]

def build_ats_response(features: np.ndarray, missing_skills: List[str]) -> Dict:
    missing_skills = list(set(missing_skills))[:10]
    
    score_data = compute_ats_score(features)
    f = score_data["components"]

    strengths = extract_strengths(f)
    weaknesses = extract_weaknesses(f, missing_skills)
    suggestions = generate_suggestions(f, missing_skills)

    return {
        "ats_score": score_data["score"],
        "breakdown": f,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "schema_version": FEATURE_SCHEMA_VERSION
    }
