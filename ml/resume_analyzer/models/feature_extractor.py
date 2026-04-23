"""
feature_extractor.py
--------------------
Phase 8 — ATS Feature Extractor

Converts all pipeline outputs (parsed resume, NER entities, scoring results)
into a fixed-length numeric feature vector for the XGBoost regressor.

This is the critical bridge between the NLP pipeline and the ML model.
Feature order MUST match FEATURE_NAMES in train_xgb.py exactly.
"""

import re
import logging
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)

# Action verbs — reused from format_checker for consistency
ACTION_VERBS = [
    "developed", "designed", "implemented", "built", "created", "led",
    "managed", "architected", "optimized", "improved", "reduced",
    "increased", "delivered", "launched", "deployed", "integrated",
    "automated", "migrated", "engineered", "maintained", "resolved",
    "streamlined", "spearheaded", "achieved", "exceeded", "established",
]

ACHIEVEMENT_PATTERNS = [
    r"\d+%",
    r"\$[\d,]+",
    r"\d+\s*(?:million|billion|k\b)",
    r"(?:reduced|improved|increased|saved|generated)\s+by\s+\d+",
    r"\d+\s*(?:users|clients|customers|projects|teams|members)",
]

# Map JD seniority level → expected minimum years
SENIORITY_YEARS = {
    "junior":      (0, 2),
    "mid":         (2, 5),
    "senior":      (5, 9),
    "lead":        (7, 99),
    "unspecified": (0, 99),
}


class ATSFeatureExtractor:
    """
    Extracts a 23-dimensional numeric feature vector from pipeline outputs.

    Feature vector (in order — must stay stable across train/inference):
      [0]  semantic_cosine
      [1]  keyword_coverage
      [2]  weighted_keyword_score
      [3]  section_count
      [4]  has_experience
      [5]  has_education
      [6]  has_skills
      [7]  has_summary
      [8]  has_projects
      [9]  has_certifications
      [10] word_count_norm
      [11] years_experience_norm
      [12] has_gpa
      [13] gpa_norm
      [14] skill_count_norm
      [15] jd_skill_count_norm
      [16] missing_required_norm
      [17] format_penalty_norm
      [18] seniority_match
      [19] is_scanned
      [20] has_contact_info
      [21] action_verb_present
      [22] has_quantified_achiev

    Usage:
        extractor = ATSFeatureExtractor()
        vector    = extractor.extract(parsed, entities, jd_entities, score_result, fmt_result)
    """

    def extract(
        self,
        parsed:       dict,
        entities:     dict,
        jd_entities:  dict,
        score_result: dict,
        fmt_result:   dict,
    ) -> np.ndarray:
        """
        Build and return the feature vector as float32 numpy array of shape (23,).
        """
        raw_text  = parsed.get("raw_text", "")
        sections  = parsed.get("sections", {})
        breakdown = score_result.get("breakdown", {})
        kw_detail = score_result.get("keyword_detail", {})
        sem_detail= score_result.get("semantic_detail", {})

        # ── [0] Semantic cosine similarity ────────────────────────────────
        semantic_cosine = float(
            sem_detail.get("cosine_similarity", 0.0)
        )

        # ── [1] Keyword coverage (0–1) ────────────────────────────────────
        matched  = kw_detail.get("matched_count", 0)
        required = kw_detail.get("required_count", 1)
        keyword_coverage = matched / max(required, 1)

        # ── [2] Weighted keyword score (from score_result, normalized) ────
        weighted_kw = breakdown.get("keyword_score", 0) / 100.0

        # ── [3] Section count ─────────────────────────────────────────────
        present_sections = [k for k, v in sections.items() if v and v.strip()]
        section_count    = float(len(present_sections))

        # ── [4–9] Binary section flags ────────────────────────────────────
        def sec(key): return float(bool(sections.get(key, "").strip()))
        has_experience    = sec("experience")
        has_education     = sec("education")
        has_skills        = sec("skills")
        has_summary       = sec("summary")
        has_projects      = sec("projects")
        has_certifications= sec("certifications")

        # ── [10] Word count (normalized at 600) ───────────────────────────
        word_count_norm = min(parsed.get("word_count", 0) / 600.0, 2.0)

        # ── [11] Years experience (normalized at 10) ──────────────────────
        yrs = entities.get("years_experience")
        years_experience_norm = (yrs / 10.0) if yrs else 0.0
        years_experience_norm = min(years_experience_norm, 1.5)

        # ── [12–13] GPA ───────────────────────────────────────────────────
        gpa       = entities.get("gpa")
        has_gpa   = float(gpa is not None)
        if gpa:
            gpa_norm = float(gpa.get("score", 0)) / float(gpa.get("out_of", 4.0) or 4.0)
            gpa_norm = min(max(gpa_norm, 0.0), 1.0)
        else:
            gpa_norm = 0.0

        # ── [14] Skill count (normalized at 20) ───────────────────────────
        skill_count_norm = min(len(entities.get("skills", [])) / 20.0, 2.0)

        # ── [15] JD skill count (normalized at 20) ────────────────────────
        jd_skills     = jd_entities.get("required_skills", []) + jd_entities.get("preferred_skills", [])
        jd_skill_norm = min(len(jd_skills) / 20.0, 2.0)

        # ── [16] Missing required sections (normalized at 3) ──────────────
        sec_detail    = score_result.get("section_detail", {})
        missing_req   = len(sec_detail.get("missing_required", []))
        missing_norm  = missing_req / 3.0

        # ── [17] Format penalty (normalized at 60) ────────────────────────
        total_penalty     = sum(i.get("penalty", 0) for i in fmt_result.get("issues", []))
        format_penalty_norm = min(total_penalty / 60.0, 1.0)

        # ── [18] Seniority match ──────────────────────────────────────────
        seniority_match = self._check_seniority_match(
            yrs or 0,
            jd_entities.get("seniority_level", "unspecified")
        )

        # ── [19] Is scanned ───────────────────────────────────────────────
        is_scanned = float(parsed.get("is_scanned", False))

        # ── [20] Has contact info ─────────────────────────────────────────
        has_contact = float(parsed.get("has_contact_info", False))

        # ── [21] Action verb present ──────────────────────────────────────
        exp_text = sections.get("experience", "").lower()
        action_verb_present = float(
            any(verb in exp_text for verb in ACTION_VERBS)
        )

        # ── [22] Has quantified achievements ─────────────────────────────
        has_quant = float(
            any(re.search(p, raw_text, re.IGNORECASE) for p in ACHIEVEMENT_PATTERNS)
        )

        # ── Assemble vector ───────────────────────────────────────────────
        vector = np.array([
            semantic_cosine,
            keyword_coverage,
            weighted_kw,
            section_count,
            has_experience,
            has_education,
            has_skills,
            has_summary,
            has_projects,
            has_certifications,
            word_count_norm,
            years_experience_norm,
            has_gpa,
            gpa_norm,
            skill_count_norm,
            jd_skill_norm,
            missing_norm,
            format_penalty_norm,
            seniority_match,
            is_scanned,
            has_contact,
            action_verb_present,
            has_quant,
        ], dtype=np.float32)

        logger.debug(f"Feature vector shape: {vector.shape} | values: {vector}")
        return vector

    def _check_seniority_match(
        self, years_exp: int, seniority_level: str
    ) -> float:
        """
        Returns 1.0 if candidate's experience fits the JD's seniority band,
        0.5 if slightly outside, 0.0 if clearly mismatched.
        """
        low, high = SENIORITY_YEARS.get(seniority_level, (0, 99))

        if low <= years_exp <= high:
            return 1.0
        # Within 1 year of the band boundary = partial match
        if (years_exp >= low - 1) and (years_exp <= high + 1):
            return 0.5
        return 0.0

    def vector_to_dict(self, vector: np.ndarray) -> dict:
        """
        Utility: convert feature vector back to named dict for debugging/logging.
        """
        from models.train_xgb import FEATURE_NAMES
        return {name: float(val) for name, val in zip(FEATURE_NAMES, vector)}