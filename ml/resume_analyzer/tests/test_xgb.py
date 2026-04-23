"""
test_xgb.py
-----------
Unit tests for Phase 8 — Feature Extractor & XGBoost Predictor

Run with:
    pytest tests/test_xgb.py -v

Note: XGBPredictor tests that need a trained model gracefully degrade
to sbert_only mode if model file doesn't exist yet.
"""

import pytest
import numpy as np
from models.feature_extractor import ATSFeatureExtractor
from models.xgb_predictor     import XGBPredictor
from models.train_xgb         import FEATURE_NAMES, N_FEATURES


# ===========================================================================
# Fixtures
# ===========================================================================

def make_parsed(overrides={}):
    base = {
        "filename":        "test.pdf",
        "raw_text":        (
            "ali@gmail.com | +92-300-0000000\n"
            "EXPERIENCE\nDeveloped REST APIs reducing latency by 40%. "
            "Served 5,000+ users.\n"
            "EDUCATION\nBSc CS, FAST 2022\n"
            "SKILLS\nPython, Django, PostgreSQL, React, Docker"
        ),
        "sections": {
            "summary":        "Software Engineer 3 years.",
            "experience":     "Developed REST APIs reducing latency by 40%. Served 5,000+ users.",
            "education":      "BSc CS, FAST 2022",
            "skills":         "Python, Django, PostgreSQL, React, Docker",
            "projects":       "Alumni Portal FYP",
            "certifications": "",
            "other":          "",
        },
        "file_type":        "pdf",
        "is_scanned":       False,
        "word_count":       350,
        "has_contact_info": True,
        "warnings":         [],
    }
    base.update(overrides)
    return base


def make_entities(overrides={}):
    base = {
        "skills":           ["Python", "Django", "PostgreSQL", "React", "Docker"],
        "skill_categories": {
            "programming_languages": ["Python"],
            "web_backend":           ["Django"],
            "databases":             ["PostgreSQL"],
            "web_frontend":          ["React"],
            "devops_cloud":          ["Docker"],
        },
        "degrees":          [{"degree": "BSC", "field": "Computer Science"}],
        "organizations":    ["FAST NUCES"],
        "designations":     ["Software Engineer"],
        "years_experience": 3,
        "gpa":              {"score": 3.6, "out_of": 4.0},
    }
    base.update(overrides)
    return base


def make_jd_entities(overrides={}):
    base = {
        "required_skills":  ["Python", "Django", "Docker", "PostgreSQL"],
        "preferred_skills": ["Kubernetes", "AWS"],
        "skill_categories": {
            "web_backend":  ["Django"],
            "devops_cloud": ["Docker", "Kubernetes", "AWS"],
            "databases":    ["PostgreSQL"],
        },
        "seniority_level": "mid",
        "job_title":       "Backend Developer",
    }
    base.update(overrides)
    return base


def make_score_result(ats_score=68, overrides={}):
    base = {
        "ats_score": ats_score,
        "grade": "B",
        "breakdown": {
            "semantic_score":   70,
            "keyword_score":    75,
            "formatting_score": 85,
            "section_score":    70,
        },
        "weights": {
            "semantic": 0.45, "keyword": 0.25,
            "formatting": 0.15, "sections": 0.15,
        },
        "semantic_detail": {
            "cosine_similarity":    0.74,
            "resume_length_tokens": 130,
            "jd_length_tokens":     80,
        },
        "keyword_detail": {
            "matched_skills":   ["Python", "Django", "Docker"],
            "missing_skills":   ["Redis"],
            "matched_count":    3,
            "required_count":   4,
            "coverage_percent": 75,
        },
        "section_detail": {
            "present":          ["summary", "experience", "education", "skills", "projects"],
            "missing_required": [],
            "bonus_sections":   ["summary", "projects"],
        },
    }
    base.update(overrides)
    return base


def make_fmt_result(overrides={}):
    base = {
        "formatting_score": 85,
        "issues": [],
        "passed_checks": ["Text layer detected.", "Contact info found."],
        "issue_count": 0,
    }
    base.update(overrides)
    return base


# ===========================================================================
# ATSFeatureExtractor Tests
# ===========================================================================

class TestATSFeatureExtractor:

    def setup_method(self):
        self.extractor = ATSFeatureExtractor()

    def _extract(self, **kwargs):
        return self.extractor.extract(
            kwargs.get("parsed",       make_parsed()),
            kwargs.get("entities",     make_entities()),
            kwargs.get("jd_entities",  make_jd_entities()),
            kwargs.get("score_result", make_score_result()),
            kwargs.get("fmt_result",   make_fmt_result()),
        )

    # ── Shape & dtype ─────────────────────────────────────────────────────

    def test_output_shape(self):
        vec = self._extract()
        assert vec.shape == (N_FEATURES,), f"Expected ({N_FEATURES},), got {vec.shape}"

    def test_output_dtype(self):
        vec = self._extract()
        assert vec.dtype == np.float32

    def test_feature_count_matches_names(self):
        assert len(FEATURE_NAMES) == N_FEATURES

    # ── Value ranges ─────────────────────────────────────────────────────

    def test_all_values_finite(self):
        vec = self._extract()
        assert np.all(np.isfinite(vec)), "Feature vector contains NaN or Inf"

    def test_binary_features_are_0_or_1(self):
        vec = self._extract()
        binary_indices = [4, 5, 6, 7, 8, 9, 12, 18, 19, 20, 21, 22]
        for idx in binary_indices:
            assert vec[idx] in (0.0, 1.0), (
                f"Feature '{FEATURE_NAMES[idx]}' = {vec[idx]} is not binary"
            )

    def test_semantic_cosine_in_range(self):
        vec = self._extract()
        assert 0.0 <= vec[0] <= 1.0

    def test_keyword_coverage_in_range(self):
        vec = self._extract()
        assert 0.0 <= vec[1] <= 1.0

    def test_section_count_positive(self):
        vec = self._extract()
        assert vec[3] >= 0

    # ── Feature logic ─────────────────────────────────────────────────────

    def test_scanned_flag_set(self):
        parsed = make_parsed({"is_scanned": True})
        vec = self._extract(parsed=parsed)
        assert vec[19] == 1.0   # is_scanned

    def test_no_contact_flag(self):
        parsed = make_parsed({"has_contact_info": False})
        vec = self._extract(parsed=parsed)
        assert vec[20] == 0.0   # has_contact_info

    def test_empty_experience_kills_action_verb(self):
        parsed = make_parsed()
        parsed["sections"]["experience"] = ""
        vec = self._extract(parsed=parsed)
        assert vec[21] == 0.0   # action_verb_present

    def test_action_verb_detected(self):
        """'Developed' is an action verb — should set flag."""
        vec = self._extract()
        assert vec[21] == 1.0

    def test_quantified_achievement_detected(self):
        """Raw text has '40%' — should set quantified flag."""
        vec = self._extract()
        assert vec[22] == 1.0

    def test_no_quant_achievement_flag(self):
        parsed = make_parsed()
        parsed["raw_text"] = "ali@gmail.com Developed systems and built APIs."
        vec = self._extract(parsed=parsed)
        assert vec[22] == 0.0

    def test_gpa_features(self):
        entities = make_entities({"gpa": {"score": 3.8, "out_of": 4.0}})
        vec = self._extract(entities=entities)
        assert vec[12] == 1.0               # has_gpa
        assert abs(vec[13] - 0.95) < 0.01   # gpa_norm = 3.8/4.0

    def test_no_gpa_zeros(self):
        entities = make_entities({"gpa": None})
        vec = self._extract(entities=entities)
        assert vec[12] == 0.0   # has_gpa
        assert vec[13] == 0.0   # gpa_norm

    def test_format_penalty_normalized(self):
        fmt = make_fmt_result({
            "issues": [
                {"penalty": 30, "severity": "critical"},
                {"penalty": 15, "severity": "major"},
            ],
            "issue_count": 2,
        })
        vec = self._extract(fmt_result=fmt)
        # 45/60 = 0.75
        assert abs(vec[17] - 0.75) < 0.01

    def test_format_penalty_capped_at_1(self):
        fmt = make_fmt_result({
            "issues": [
                {"penalty": 100, "severity": "critical"},
            ],
            "issue_count": 1,
        })
        vec = self._extract(fmt_result=fmt)
        assert vec[17] <= 1.0

    # ── Seniority match ───────────────────────────────────────────────────

    def test_seniority_match_mid_3yrs(self):
        """3 years fits mid (2–5 years) — should be 1.0"""
        sm = self.extractor._check_seniority_match(3, "mid")
        assert sm == 1.0

    def test_seniority_match_junior_5yrs(self):
        """5 years is outside junior (0–2) but within +1 boundary"""
        sm = self.extractor._check_seniority_match(5, "junior")
        assert sm in (0.0, 0.5)

    def test_seniority_mismatch(self):
        """0 years for senior (5–9) — clear mismatch"""
        sm = self.extractor._check_seniority_match(0, "senior")
        assert sm == 0.0

    def test_seniority_unspecified_always_matches(self):
        sm = self.extractor._check_seniority_match(0, "unspecified")
        assert sm == 1.0

    # ── vector_to_dict ────────────────────────────────────────────────────

    def test_vector_to_dict_keys(self):
        vec  = self._extract()
        d    = self.extractor.vector_to_dict(vec)
        assert set(d.keys()) == set(FEATURE_NAMES)

    def test_vector_to_dict_values_match_vector(self):
        vec = self._extract()
        d   = self.extractor.vector_to_dict(vec)
        for i, name in enumerate(FEATURE_NAMES):
            assert abs(d[name] - float(vec[i])) < 1e-6


# ===========================================================================
# XGBPredictor Tests
# ===========================================================================

class TestXGBPredictor:

    def setup_method(self):
        self.predictor = XGBPredictor()

    def _predict(self, **kwargs):
        return self.predictor.predict(
            kwargs.get("parsed",       make_parsed()),
            kwargs.get("entities",     make_entities()),
            kwargs.get("jd_entities",  make_jd_entities()),
            kwargs.get("score_result", make_score_result()),
            kwargs.get("fmt_result",   make_fmt_result()),
        )

    # ── Return structure ──────────────────────────────────────────────────

    def test_result_has_required_keys(self):
        result = self._predict()
        required = [
            "final_score", "final_grade", "sbert_score",
            "xgb_score", "blend_weights", "model_used",
            "feature_vector", "confidence",
        ]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_final_score_in_range(self):
        result = self._predict()
        assert 0 <= result["final_score"] <= 100

    def test_final_grade_valid(self):
        result = self._predict()
        assert result["final_grade"] in {"A", "B", "C", "D", "F"}

    def test_model_used_valid_values(self):
        result = self._predict()
        assert result["model_used"] in {"blended", "sbert_only"}

    def test_confidence_valid_values(self):
        result = self._predict()
        assert result["confidence"] in {"high", "medium", "low"}

    def test_blend_weights_sum_to_1(self):
        result = self._predict()
        w = result["blend_weights"]
        assert abs(w["sbert"] + w["xgb"] - 1.0) < 0.001

    def test_sbert_score_matches_input(self):
        result = self._predict(score_result=make_score_result(ats_score=72))
        assert result["sbert_score"] == 72

    # ── Graceful degradation ──────────────────────────────────────────────

    def test_fallback_when_model_missing(self):
        """
        If model isn't trained yet, should fall back to sbert_only.
        No exception should be raised.
        """
        # Temporarily disable model
        orig = self.predictor._model_available
        self.predictor._model_available = False
        try:
            result = self._predict(score_result=make_score_result(ats_score=65))
            assert result["final_score"] == 65
            assert result["model_used"] == "sbert_only"
            assert result["xgb_score"] is None
        finally:
            self.predictor._model_available = orig

    def test_scanned_pdf_low_confidence(self):
        parsed = make_parsed({"is_scanned": True, "raw_text": ""})
        result = self._predict(parsed=parsed)
        assert result["confidence"] == "low"

    def test_rich_resume_high_confidence(self):
        result = self._predict(
            parsed=make_parsed({"word_count": 450}),
            entities=make_entities({
                "skills": ["Python", "Django", "Docker", "React", "PostgreSQL", "Redis"]
            }),
        )
        assert result["confidence"] in {"high", "medium"}

    # ── Explainability ────────────────────────────────────────────────────

    def test_score_explanation_returns_list(self):
        result = self._predict()
        explanations = self.predictor.get_score_explanation(result["feature_vector"])
        assert isinstance(explanations, list)

    def test_explanation_entries_have_required_fields(self):
        result = self._predict()
        explanations = self.predictor.get_score_explanation(result["feature_vector"])
        for exp in explanations:
            assert "driver"    in exp
            assert "direction" in exp
            assert exp["direction"] in ("positive", "negative")

    def test_scanned_pdf_explanation(self):
        parsed = make_parsed({"is_scanned": True})
        result = self._predict(parsed=parsed)
        explanations = self.predictor.get_score_explanation(result["feature_vector"])
        drivers = [e["driver"].lower() for e in explanations]
        assert any("scanned" in d for d in drivers)

    # ── Feature importance ────────────────────────────────────────────────

    def test_feature_importance_none_if_no_model(self):
        orig = self.predictor._model_available
        self.predictor._model_available = False
        try:
            assert self.predictor.get_feature_importance() is None
        finally:
            self.predictor._model_available = orig


# ===========================================================================
# Synthetic Dataset Tests
# ===========================================================================

class TestSyntheticDataset:

    def test_dataset_shape(self):
        from models.train_xgb import synthetic_dataset
        X, y = synthetic_dataset(n_samples=100)
        assert X.shape == (100, N_FEATURES)
        assert y.shape == (100,)

    def test_score_range(self):
        from models.train_xgb import synthetic_dataset
        _, y = synthetic_dataset(n_samples=200)
        assert y.min() >= 0
        assert y.max() <= 100

    def test_feature_values_reasonable(self):
        from models.train_xgb import synthetic_dataset
        X, _ = synthetic_dataset(n_samples=200)
        # No NaN or Inf
        assert np.all(np.isfinite(X))

    def test_score_distribution(self):
        """Scores should be roughly bell-shaped, not all 0 or 100."""
        from models.train_xgb import synthetic_dataset
        _, y = synthetic_dataset(n_samples=500)
        mean = y.mean()
        std  = y.std()
        assert 25 < mean < 75, f"Mean score {mean} seems off"
        assert std > 10, f"Std {std} too low — scores not diverse enough"