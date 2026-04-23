"""
semantic_scorer.py
------------------
Phase 4 — Semantic ATS Scoring Engine

Uses Sentence-BERT (SBERT) to create contextual embeddings of the resume
and job description, then computes cosine similarity. This solves the
legacy ATS problem where "predictive models" != "Machine Learning".

Final ATS Score Formula (from research paper):
  score = (semantic_match   × 0.45)
        + (keyword_coverage × 0.25)
        + (formatting_score × 0.15)
        + (section_complete × 0.15)

All sub-scores are 0–100. Final score is 0–100.
"""

import logging
import re
import numpy as np
from typing import Optional

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    SentenceTransformer = None
    cosine_similarity = None

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Weights (must sum to 1.0)
# ---------------------------------------------------------------------------
WEIGHT_SEMANTIC   = 0.45
WEIGHT_KEYWORD    = 0.25
WEIGHT_FORMATTING = 0.15
WEIGHT_SECTIONS   = 0.15

# SBERT model — fast, accurate, good for short-to-medium text
SBERT_MODEL = "all-MiniLM-L6-v2"

# Section completeness config
REQUIRED_SECTIONS  = ["experience", "education", "skills"]       # must have
IMPORTANT_SECTIONS = ["summary", "projects", "certifications"]   # bonus
PENALTY_PER_MISSING_REQUIRED  = 20   # out of 100
BONUS_PER_IMPORTANT_SECTION   = 10   # out of 100, capped at 30


# ===========================================================================
# SemanticScorer
# ===========================================================================

class SemanticScorer:
    """
    Computes a semantic similarity score between a resume and a job description
    using Sentence-BERT embeddings + cosine similarity.

    Usage:
        scorer = SemanticScorer()
        result = scorer.score(parsed_resume, entities, jd_text, jd_entities, format_issues)
    """

    def __init__(self, model_name: str = SBERT_MODEL):
        self.model = None
        self.model_name = model_name

        if SentenceTransformer is None:
            logger.warning(
                "sentence-transformers is not installed. "
                "Semantic scoring will use a keyword-overlap fallback."
            )
            return

        logger.info(f"Loading SBERT model: {model_name}")
        try:
            self.model = SentenceTransformer(model_name)
            logger.info("SBERT model loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Failed to load SBERT model '{model_name}'. "
                f"Using fallback semantic scorer instead. Error: {e}"
            )

    # -----------------------------------------------------------------------
    # Main scoring method
    # -----------------------------------------------------------------------

    def score(
        self,
        parsed_resume: dict,
        resume_entities: dict,
        jd_text: str,
        jd_entities: dict,
        format_issues: list[dict],
    ) -> dict:
        """
        Compute the full ATS score breakdown.

        Args:
            parsed_resume   : output of ResumeParser.parse()
            resume_entities : output of NERExtractor.extract()
            jd_text         : raw job description text
            jd_entities     : output of JDSkillExtractor.extract()
            format_issues   : list of issue dicts from FormatChecker (Phase 5)

        Returns:
        {
            "ats_score": int,               # final 0-100
            "grade": str,                   # A / B / C / D / F
            "breakdown": {
                "semantic_score": int,      # SBERT cosine similarity × 100
                "keyword_score": int,       # skill coverage %
                "formatting_score": int,    # 100 minus penalties
                "section_score": int,       # section completeness
            },
            "weights": {...},
            "semantic_detail": {
                "cosine_similarity": float,
                "resume_length_tokens": int,
                "jd_length_tokens": int,
            },
            "keyword_detail": {
                "matched_count": int,
                "required_count": int,
                "matched_skills": [...],
                "missing_skills": [...],
            },
            "section_detail": {
                "present": [...],
                "missing_required": [...],
                "bonus_sections": [...],
            },
        }
        """
        resume_text = parsed_resume.get("raw_text", "")
        sections    = parsed_resume.get("sections", {})

        # Guard: empty resume
        if not resume_text.strip():
            return self._zero_score("Resume text is empty or unreadable.")

        # ── Sub-score 1: Semantic similarity (SBERT) ──────────────────────
        semantic_score, semantic_detail = self._compute_semantic_score(
            resume_text, jd_text
        )

        # ── Sub-score 2: Keyword / skill coverage ─────────────────────────
        keyword_score, keyword_detail = self._compute_keyword_score(
            resume_entities, jd_entities
        )

        # ── Sub-score 3: Formatting (from Phase 5 FormatChecker) ──────────
        formatting_score = self._compute_formatting_score(format_issues)

        # ── Sub-score 4: Section completeness ─────────────────────────────
        section_score, section_detail = self._compute_section_score(sections)

        # ── Weighted final score ───────────────────────────────────────────
        raw = (
            semantic_score   * WEIGHT_SEMANTIC   +
            keyword_score    * WEIGHT_KEYWORD    +
            formatting_score * WEIGHT_FORMATTING +
            section_score    * WEIGHT_SECTIONS
        )
        ats_score = min(100, max(0, round(raw)))
        grade = self._grade(ats_score)

        logger.info(
            f"ATS Score={ats_score} ({grade}) | "
            f"semantic={semantic_score} keyword={keyword_score} "
            f"formatting={formatting_score} sections={section_score}"
        )

        return {
            "ats_score": ats_score,
            "grade": grade,
            "breakdown": {
                "semantic_score":   round(semantic_score),
                "keyword_score":    round(keyword_score),
                "formatting_score": round(formatting_score),
                "section_score":    round(section_score),
            },
            "weights": {
                "semantic":   WEIGHT_SEMANTIC,
                "keyword":    WEIGHT_KEYWORD,
                "formatting": WEIGHT_FORMATTING,
                "sections":   WEIGHT_SECTIONS,
            },
            "semantic_detail":  semantic_detail,
            "keyword_detail":   keyword_detail,
            "section_detail":   section_detail,
        }

    # -----------------------------------------------------------------------
    # Sub-score 1: SBERT Semantic Similarity
    # -----------------------------------------------------------------------

    def _compute_semantic_score(
        self, resume_text: str, jd_text: str
    ) -> tuple[float, dict]:
        """
        Encode both texts with SBERT and compute cosine similarity.
        Returns (score_0_to_100, detail_dict).
        """
        # Truncate to avoid excessive compute (SBERT handles up to ~512 tokens)
        resume_chunk = self._smart_truncate(resume_text, max_chars=3000)
        jd_chunk     = self._smart_truncate(jd_text, max_chars=2000)

        if self.model is None or cosine_similarity is None:
            overlap = self._fallback_similarity(resume_chunk, jd_chunk)
            detail = {
                "cosine_similarity": round(overlap, 4),
                "resume_length_tokens": len(resume_chunk.split()),
                "jd_length_tokens": len(jd_chunk.split()),
                "method": "token_overlap_fallback",
            }
            return round(overlap * 100, 2), detail

        try:
            embeddings = self.model.encode(
                [resume_chunk, jd_chunk],
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True,   # L2 normalize for cosine
            )
            resume_vec = embeddings[0].reshape(1, -1)
            jd_vec     = embeddings[1].reshape(1, -1)
            cosine     = float(cosine_similarity(resume_vec, jd_vec)[0][0])

            # Cosine similarity is -1 to 1; clamp to 0-1 then scale to 0-100
            # In practice resume vs JD similarity ranges ~0.3–0.95
            # We rescale: 0.3 → 0, 0.95 → 100 (linear)
            rescaled = self._rescale_cosine(cosine, low=0.30, high=0.92)
            score = round(rescaled * 100, 2)

        except Exception as e:
            logger.error(f"SBERT encoding failed: {e}")
            cosine = 0.0
            score  = 0.0

        detail = {
            "cosine_similarity":    round(cosine, 4),
            "resume_length_tokens": len(resume_chunk.split()),
            "jd_length_tokens":     len(jd_chunk.split()),
            "method":               "sbert",
        }
        return score, detail

    def _rescale_cosine(
        self, value: float, low: float = 0.30, high: float = 0.92
    ) -> float:
        """Linearly rescale cosine from [low, high] → [0, 1]."""
        clamped = max(low, min(high, value))
        return (clamped - low) / (high - low)

    def _smart_truncate(self, text: str, max_chars: int) -> str:
        """
        Truncate to max_chars but try to end at a sentence boundary.
        """
        if len(text) <= max_chars:
            return text
        chunk = text[:max_chars]
        last_period = chunk.rfind(".")
        if last_period > max_chars * 0.7:
            return chunk[:last_period + 1]
        return chunk

    def _fallback_similarity(self, resume_text: str, jd_text: str) -> float:
        """
        Lightweight semantic fallback when SBERT is unavailable.
        Uses Jaccard overlap on normalized word sets.
        """
        token_pattern = r"[a-zA-Z][a-zA-Z0-9+#.\-/]+"
        resume_tokens = set(re.findall(token_pattern, resume_text.lower()))
        jd_tokens = set(re.findall(token_pattern, jd_text.lower()))

        if not resume_tokens or not jd_tokens:
            return 0.0

        intersection = len(resume_tokens & jd_tokens)
        union = len(resume_tokens | jd_tokens)
        return intersection / union if union else 0.0

    # -----------------------------------------------------------------------
    # Sub-score 2: Keyword / Skill Coverage
    # -----------------------------------------------------------------------

    def _compute_keyword_score(
        self, resume_entities: dict, jd_entities: dict
    ) -> tuple[float, dict]:
        """
        Compares resume skills against required JD skills.
        Uses the weighted_score from SkillMatcher (already computed in Phase 3).
        """
        resume_skills  = set(s.lower() for s in resume_entities.get("skills", []))
        required       = jd_entities.get("required_skills", [])
        preferred      = jd_entities.get("preferred_skills", [])

        if not required and not preferred:
            # No JD skills found — use moderate score, don't penalize
            return 50.0, {
                "matched_count": 0,
                "required_count": 0,
                "matched_skills": [],
                "missing_skills": [],
                "note": "No skills detected in job description.",
            }

        matched  = []
        missing  = []

        for skill in required:
            skill_lower = skill.lower()
            # Check direct match or partial match
            found = (
                skill_lower in resume_skills or
                any(skill_lower in rs or rs in skill_lower for rs in resume_skills)
            )
            (matched if found else missing).append(skill)

        # Preferred skills give a small bonus (half weight)
        preferred_matched = sum(
            1 for s in preferred
            if s.lower() in resume_skills or
               any(s.lower() in rs or rs in s.lower() for rs in resume_skills)
        )

        total_required = len(required)
        if total_required == 0:
            base_score = 50.0
        else:
            base_score = (len(matched) / total_required) * 100

        # Preferred bonus: up to +10 pts
        preferred_bonus = (preferred_matched / max(len(preferred), 1)) * 10 if preferred else 0
        score = min(100.0, base_score + preferred_bonus)

        detail = {
            "matched_count":    len(matched),
            "required_count":   total_required,
            "preferred_matched": preferred_matched,
            "preferred_total":  len(preferred),
            "matched_skills":   sorted(matched),
            "missing_skills":   sorted(missing),
        }
        return score, detail

    # -----------------------------------------------------------------------
    # Sub-score 3: Formatting Score
    # -----------------------------------------------------------------------

    def _compute_formatting_score(self, format_issues: list[dict]) -> float:
        """
        Start at 100, subtract penalties for each formatting issue.
        format_issues is a list of {"issue": str, "penalty": int, "severity": str}
        """
        if not format_issues:
            return 100.0

        total_penalty = sum(issue.get("penalty", 0) for issue in format_issues)
        score = max(0.0, 100.0 - total_penalty)
        return score

    # -----------------------------------------------------------------------
    # Sub-score 4: Section Completeness
    # -----------------------------------------------------------------------

    def _compute_section_score(
        self, sections: dict
    ) -> tuple[float, dict]:
        """
        Start at 100:
          - Deduct PENALTY_PER_MISSING_REQUIRED for each missing required section
          - Add BONUS_PER_IMPORTANT_SECTION for each bonus section (capped)
        """
        present_sections = [k for k, v in sections.items() if v and v.strip()]

        missing_required = [
            s for s in REQUIRED_SECTIONS if s not in present_sections
        ]
        bonus_sections = [
            s for s in IMPORTANT_SECTIONS if s in present_sections
        ]

        score = 100.0
        score -= len(missing_required) * PENALTY_PER_MISSING_REQUIRED
        bonus = min(len(bonus_sections) * BONUS_PER_IMPORTANT_SECTION, 30)
        score = min(100.0, max(0.0, score + bonus))

        detail = {
            "present":          present_sections,
            "missing_required": missing_required,
            "bonus_sections":   bonus_sections,
        }
        return score, detail

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _grade(self, score: int) -> str:
        if score >= 80: return "A"
        if score >= 65: return "B"
        if score >= 50: return "C"
        if score >= 35: return "D"
        return "F"

    def _zero_score(self, reason: str) -> dict:
        return {
            "ats_score": 0,
            "grade": "F",
            "breakdown": {
                "semantic_score": 0,
                "keyword_score": 0,
                "formatting_score": 0,
                "section_score": 0,
            },
            "weights": {
                "semantic":   WEIGHT_SEMANTIC,
                "keyword":    WEIGHT_KEYWORD,
                "formatting": WEIGHT_FORMATTING,
                "sections":   WEIGHT_SECTIONS,
            },
            "semantic_detail":  {"cosine_similarity": 0.0, "resume_length_tokens": 0, "jd_length_tokens": 0},
            "keyword_detail":   {"matched_count": 0, "required_count": 0, "matched_skills": [], "missing_skills": []},
            "section_detail":   {"present": [], "missing_required": REQUIRED_SECTIONS, "bonus_sections": []},
            "error": reason,
        }
