"""
test_scoring.py
---------------
Unit tests for Phase 4 — Semantic Scorer & Format Checker

Run with:
    pytest tests/test_scoring.py -v

Note: SemanticScorer tests require sentence-transformers installed.
FormatChecker tests work with no ML dependencies.
"""

import pytest
from scoring.format_checker import FormatChecker


# ===========================================================================
# FormatChecker Tests (no ML required)
# ===========================================================================

class TestFormatChecker:

    def setup_method(self):
        self.checker = FormatChecker()

    def _make_parsed(self, overrides: dict = {}) -> dict:
        """Build a default valid parsed resume dict."""
        base = {
            "raw_text": (
                "John Doe | john@example.com | +92-300-1234567\n\n"
                "SUMMARY\nSoftware Engineer with 3 years of experience.\n\n"
                "EXPERIENCE\n"
                "Developed and deployed REST APIs using Django. "
                "Reduced response time by 40%. Served 5,000+ users daily.\n\n"
                "EDUCATION\nBSc Computer Science, FAST NUCES 2022\n\n"
                "SKILLS\nPython, Django, PostgreSQL, Docker, React\n\n"
                "PROJECTS\nAlumni Portal — Django + React, Jan 2024 – Present"
            ),
            "sections": {
                "summary":     "Software Engineer with 3 years of experience.",
                "experience":  "Developed and deployed REST APIs using Django. Reduced response time by 40%.",
                "education":   "BSc Computer Science, FAST NUCES 2022",
                "skills":      "Python, Django, PostgreSQL, Docker, React",
                "projects":    "Alumni Portal — Django + React",
                "other":       "",
            },
            "file_type":        "pdf",
            "is_scanned":       False,
            "word_count":       120,
            "has_contact_info": True,
        }
        base.update(overrides)
        return base

    # ── Core checks ──────────────────────────────────────────────────────

    def test_clean_resume_high_score(self):
        parsed = self._make_parsed({"word_count": 400})
        result = self.checker.check(parsed)
        assert result["formatting_score"] >= 70
        assert result["issue_count"] == 0

    def test_scanned_pdf_penalized(self):
        parsed = self._make_parsed({"is_scanned": True})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "scanned_pdf" in codes
        assert result["formatting_score"] <= 70

    def test_missing_contact_penalized(self):
        parsed = self._make_parsed({"has_contact_info": False})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "no_contact_info" in codes

    def test_missing_experience_section(self):
        parsed = self._make_parsed()
        parsed["sections"]["experience"] = ""
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "missing_required_section" in codes

    def test_missing_skills_section(self):
        parsed = self._make_parsed()
        parsed["sections"]["skills"] = ""
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "missing_required_section" in codes

    def test_missing_education_section(self):
        parsed = self._make_parsed()
        parsed["sections"]["education"] = ""
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "missing_required_section" in codes

    def test_old_doc_format_penalized(self):
        parsed = self._make_parsed({"file_type": "doc"})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "old_doc_format" in codes

    def test_too_short_resume_penalized(self):
        parsed = self._make_parsed({"word_count": 80})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "resume_too_short" in codes

    def test_too_long_resume_penalized(self):
        parsed = self._make_parsed({"word_count": 1200})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "resume_too_long" in codes

    def test_ideal_word_count_no_length_issue(self):
        parsed = self._make_parsed({"word_count": 450})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "resume_too_short" not in codes
        assert "resume_too_long" not in codes

    # ── Table layout detection ────────────────────────────────────────────

    def test_table_layout_detected(self):
        table_text = (
            "Name | Email | Phone\n"
            "John | john@x.com | 123\n"
            "Skills | Python | Django\n"
            "Exp | 3 years | Systems Ltd\n"
            "Extra | row | here\n"
        )
        parsed = self._make_parsed({"raw_text": table_text})
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "table_layout" in codes

    def test_clean_text_no_table_flag(self):
        parsed = self._make_parsed()
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "table_layout" not in codes

    # ── Action verbs ──────────────────────────────────────────────────────

    def test_no_action_verbs_flagged(self):
        parsed = self._make_parsed()
        parsed["sections"]["experience"] = (
            "Was responsible for the system. Had to do things with the team."
        )
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "no_action_verbs" in codes

    def test_action_verbs_present_passes(self):
        parsed = self._make_parsed({"word_count": 400})
        # Experience already has "Developed" in default
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "no_action_verbs" not in codes

    # ── Quantifiable achievements ─────────────────────────────────────────

    def test_no_achievements_flagged(self):
        parsed = self._make_parsed()
        parsed["raw_text"] = (
            "john@example.com\nEXPERIENCE\nDeveloped systems and worked on projects.\n"
            "EDUCATION\nBSc CS\nSKILLS\nPython"
        )
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "no_quantifiable_achievements" in codes

    def test_percentage_counts_as_achievement(self):
        parsed = self._make_parsed({"word_count": 400})
        # Default raw_text has "40%" — should pass
        result = self.checker.check(parsed)
        codes = [i["code"] for i in result["issues"]]
        assert "no_quantifiable_achievements" not in codes

    # ── Issue structure ───────────────────────────────────────────────────

    def test_issue_has_all_required_fields(self):
        parsed = self._make_parsed({"is_scanned": True, "has_contact_info": False})
        result = self.checker.check(parsed)
        for issue in result["issues"]:
            assert "code"       in issue
            assert "issue"      in issue
            assert "severity"   in issue
            assert "penalty"    in issue
            assert "suggestion" in issue

    def test_severity_values_are_valid(self):
        parsed = self._make_parsed({"is_scanned": True, "word_count": 50})
        result = self.checker.check(parsed)
        valid = {"critical", "major", "minor"}
        for issue in result["issues"]:
            assert issue["severity"] in valid

    def test_score_never_below_zero(self):
        # Worst possible resume
        parsed = self._make_parsed({
            "is_scanned": True,
            "has_contact_info": False,
            "file_type": "doc",
            "word_count": 10,
            "sections": {k: "" for k in ["experience", "education", "skills", "summary", "projects", "other"]},
            "raw_text": "",
        })
        result = self.checker.check(parsed)
        assert result["formatting_score"] >= 0

    def test_score_never_above_100(self):
        parsed = self._make_parsed({"word_count": 400})
        result = self.checker.check(parsed)
        assert result["formatting_score"] <= 100


# ===========================================================================
# SemanticScorer Tests (require sentence-transformers)
# ===========================================================================

try:
    from sentence_transformers import SentenceTransformer
    SBERT_AVAILABLE = True
except ImportError:
    SBERT_AVAILABLE = False

sbert_required = pytest.mark.skipif(
    not SBERT_AVAILABLE,
    reason="sentence-transformers not installed — run: pip install sentence-transformers"
)


@sbert_required
class TestSemanticScorer:

    def setup_method(self):
        from scoring.semantic_scorer import SemanticScorer
        self.scorer = SemanticScorer()

    def _make_inputs(self, resume_text="", jd_text="", sections=None):
        parsed_resume = {
            "raw_text": resume_text,
            "sections": sections or {
                "experience": resume_text,
                "education":  "",
                "skills":     "",
                "summary":    "",
                "projects":   "",
                "other":      "",
            },
            "file_type":        "pdf",
            "is_scanned":       False,
            "word_count":       len(resume_text.split()),
            "has_contact_info": True,
        }
        resume_entities = {
            "skills": ["Python", "Django", "REST API", "PostgreSQL"],
            "skill_categories": {},
            "degrees": [],
            "organizations": [],
            "designations": [],
            "years_experience": 3,
            "gpa": None,
        }
        jd_entities = {
            "required_skills": ["Python", "Django", "Docker"],
            "preferred_skills": ["Kubernetes"],
        }
        format_issues = []
        return parsed_resume, resume_entities, jd_text, jd_entities, format_issues

    def test_score_returns_dict_with_required_keys(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="Experienced Python Django developer with REST API skills.",
            jd_text="Looking for Python Django developer."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        assert "ats_score" in result
        assert "grade" in result
        assert "breakdown" in result
        assert "semantic_detail" in result

    def test_score_is_0_to_100(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="Python developer with 3 years experience in Django and PostgreSQL.",
            jd_text="We need a Python backend developer."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        assert 0 <= result["ats_score"] <= 100

    def test_grade_values_valid(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="Senior software engineer Python machine learning.",
            jd_text="Hire senior Python engineer with ML background."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        assert result["grade"] in {"A", "B", "C", "D", "F"}

    def test_relevant_resume_scores_higher_than_irrelevant(self):
        """A matching resume should score higher than a completely unrelated one."""
        jd = "We need a Python Django backend developer with PostgreSQL experience."

        relevant_text = (
            "Python developer with 4 years of Django experience. "
            "Built REST APIs and worked with PostgreSQL. "
            "Deployed applications on AWS using Docker."
        )
        irrelevant_text = (
            "Graphic designer specializing in Adobe Illustrator and Photoshop. "
            "Experienced in brand identity and print design for luxury fashion brands."
        )

        p1, e1, _, je, f = self._make_inputs(resume_text=relevant_text, jd_text=jd)
        p2, e2, _, _,  _ = self._make_inputs(resume_text=irrelevant_text, jd_text=jd)

        r1 = self.scorer.score(p1, e1, jd, je, f)
        r2 = self.scorer.score(p2, e2, jd, je, f)

        assert r1["breakdown"]["semantic_score"] > r2["breakdown"]["semantic_score"]

    def test_empty_resume_returns_zero_score(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="",
            jd_text="Python developer needed."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        assert result["ats_score"] == 0
        assert result["grade"] == "F"

    def test_breakdown_sub_scores_in_range(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="Python Django developer 3 years REST API PostgreSQL.",
            jd_text="Hiring Python Django developer."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        for key, val in result["breakdown"].items():
            assert 0 <= val <= 100, f"{key}={val} out of range"

    def test_formatting_issues_reduce_score(self):
        """Same resume — with format issues should score lower."""
        resume_text = "Python developer with Django experience."
        jd_text = "Python Django developer needed."

        p1, e1, _, je, _ = self._make_inputs(resume_text=resume_text, jd_text=jd_text)
        p2, e2, _, _,  _ = self._make_inputs(resume_text=resume_text, jd_text=jd_text)

        no_issues    = []
        many_issues  = [
            {"penalty": 30, "severity": "critical"},
            {"penalty": 15, "severity": "major"},
            {"penalty": 10, "severity": "major"},
        ]

        r1 = self.scorer.score(p1, e1, jd_text, je, no_issues)
        r2 = self.scorer.score(p2, e2, jd_text, je, many_issues)

        assert r1["ats_score"] > r2["ats_score"]

    def test_weights_sum_to_one(self):
        parsed, entities, jd_text, jd_entities, fmt = self._make_inputs(
            resume_text="Python developer.", jd_text="Python needed."
        )
        result = self.scorer.score(parsed, entities, jd_text, jd_entities, fmt)
        total = sum(result["weights"].values())
        assert abs(total - 1.0) < 0.001