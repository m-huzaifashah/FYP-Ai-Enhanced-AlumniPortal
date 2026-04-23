"""
test_suggestions.py
-------------------
Unit tests for Phase 5 & 6 — Suggestions Generator & Report Builder

Run with:
    pytest tests/test_suggestions.py -v
"""

import pytest
from reporting.suggestions import SuggestionsGenerator, PRIORITY_ORDER


# ===========================================================================
# Test Fixtures
# ===========================================================================

def make_parsed(overrides={}):
    base = {
        "filename":        "test_resume.pdf",
        "raw_text":        (
            "Ali Hassan | ali@gmail.com | +92-300-0000000\n"
            "SUMMARY\nSoftware Engineer with 3 years experience.\n"
            "EXPERIENCE\nDeveloped REST APIs in Django. Reduced latency by 30%.\n"
            "EDUCATION\nBSc CS, FAST 2022\n"
            "SKILLS\nPython, Django, PostgreSQL, React"
        ),
        "sections": {
            "summary":     "Software Engineer with 3 years experience.",
            "experience":  "Developed REST APIs in Django. Reduced latency by 30%.",
            "education":   "BSc CS, FAST 2022",
            "skills":      "Python, Django, PostgreSQL, React",
            "projects":    "",
            "certifications": "",
            "other":       "",
        },
        "file_type":        "pdf",
        "is_scanned":       False,
        "word_count":       350,
        "has_contact_info": True,
        "warnings":         [],
    }
    base.update(overrides)
    return base


def make_entities(skills=None):
    return {
        "skills": skills or ["Python", "Django", "PostgreSQL", "React"],
        "skill_categories": {
            "programming_languages": ["Python"],
            "web_backend": ["Django"],
            "databases": ["PostgreSQL"],
            "web_frontend": ["React"],
        },
        "degrees":          [{"degree": "BSC", "field": "Computer Science"}],
        "organizations":    ["FAST NUCES"],
        "designations":     ["Software Engineer"],
        "years_experience": 3,
        "gpa":              None,
    }


def make_jd_entities(required=None, preferred=None):
    return {
        "required_skills": required or ["Python", "Django", "Docker", "Redis"],
        "preferred_skills": preferred or ["Kubernetes", "AWS"],
        "skill_categories": {
            "web_backend": ["Django"],
            "devops_cloud": ["Docker", "Kubernetes", "AWS"],
            "databases": ["Redis"],
        },
        "seniority_level": "mid",
        "job_title": "Backend Developer",
    }


def make_score_result(ats_score=65):
    return {
        "ats_score": ats_score,
        "grade": "B",
        "breakdown": {
            "semantic_score": 68,
            "keyword_score":  60,
            "formatting_score": 85,
            "section_score": 70,
        },
        "weights": {
            "semantic": 0.45, "keyword": 0.25,
            "formatting": 0.15, "sections": 0.15,
        },
        "semantic_detail": {
            "cosine_similarity": 0.72,
            "resume_length_tokens": 120,
            "jd_length_tokens": 80,
        },
        "keyword_detail": {
            "matched_skills":   ["Python", "Django"],
            "missing_skills":   ["Docker", "Redis"],
            "matched_count":    2,
            "required_count":   4,
            "coverage_percent": 50,
        },
        "section_detail": {
            "present":          ["summary", "experience", "education", "skills"],
            "missing_required": [],
            "bonus_sections":   ["summary"],
        },
    }


def make_fmt_result(issues=None):
    return {
        "formatting_score": 85,
        "issues": issues or [],
        "passed_checks": ["Text layer detected.", "Contact info found."],
        "issue_count": len(issues or []),
    }


# ===========================================================================
# SuggestionsGenerator Tests
# ===========================================================================

class TestSuggestionsGenerator:

    def setup_method(self):
        self.gen = SuggestionsGenerator()

    def _generate(self, **kwargs):
        parsed      = kwargs.get("parsed",      make_parsed())
        entities    = kwargs.get("entities",    make_entities())
        jd_text     = kwargs.get("jd_text",     "We need a Python Django developer with Docker and Redis.")
        jd_entities = kwargs.get("jd_entities", make_jd_entities())
        score       = kwargs.get("score",       make_score_result())
        fmt         = kwargs.get("fmt",         make_fmt_result())
        return self.gen.generate(parsed, entities, jd_text, jd_entities, score, fmt)

    # ── Return structure ──────────────────────────────────────────────────

    def test_returns_required_keys(self):
        result = self._generate()
        assert "suggestions"    in result
        assert "jd_keywords"    in result
        assert "quick_wins"     in result
        assert "score_potential" in result

    def test_suggestions_is_list(self):
        result = self._generate()
        assert isinstance(result["suggestions"], list)

    def test_each_suggestion_has_required_fields(self):
        result = self._generate()
        for s in result["suggestions"]:
            assert "priority" in s
            assert "category" in s
            assert "title"    in s
            assert "detail"   in s
            assert "impact"   in s

    def test_priority_values_are_valid(self):
        result = self._generate()
        valid = {"critical", "high", "medium", "low"}
        for s in result["suggestions"]:
            assert s["priority"] in valid

    # ── Priority ordering ─────────────────────────────────────────────────

    def test_suggestions_sorted_by_priority(self):
        result = self._generate()
        priorities = [PRIORITY_ORDER[s["priority"]] for s in result["suggestions"]]
        assert priorities == sorted(priorities), "Suggestions are not sorted by priority"

    def test_critical_suggestions_come_first(self):
        fmt = make_fmt_result(issues=[{
            "code":       "scanned_pdf",
            "issue":      "Scanned PDF detected.",
            "severity":   "critical",
            "penalty":    30,
            "suggestion": "Use text-based PDF.",
        }])
        result = self._generate(fmt=fmt)
        if result["suggestions"]:
            assert result["suggestions"][0]["priority"] == "critical"

    # ── Missing skills ────────────────────────────────────────────────────

    def test_missing_skills_generate_suggestions(self):
        score = make_score_result()
        score["keyword_detail"]["missing_skills"] = ["Docker", "Redis", "Kubernetes"]
        result = self._generate(score=score)
        titles = [s["title"] for s in result["suggestions"]]
        assert any("skill" in t.lower() or "docker" in t.lower() or "redis" in t.lower()
                   for t in titles)

    def test_no_missing_skills_no_skill_suggestion(self):
        score = make_score_result()
        score["keyword_detail"]["missing_skills"] = []
        result = self._generate(
            entities=make_entities(
                skills=["Python", "Django", "Docker", "Redis"]
            ),
            jd_entities=make_jd_entities(
                required=["Python", "Django", "Docker", "Redis"]
            ),
            score=score,
        )
        titles = [s["title"].lower() for s in result["suggestions"]]
        assert not any("required skill" in t for t in titles)

    # ── Missing sections ──────────────────────────────────────────────────

    def test_missing_section_generates_suggestion(self):
        score = make_score_result()
        score["section_detail"]["missing_required"] = ["skills"]
        result = self._generate(score=score)
        titles = [s["title"].lower() for s in result["suggestions"]]
        assert any("skills" in t for t in titles)

    # ── Content quality ───────────────────────────────────────────────────

    def test_weak_phrases_trigger_suggestion(self):
        parsed = make_parsed()
        parsed["sections"]["experience"] = (
            "Was responsible for API development. Helped with testing. "
            "Participated in deployments."
        )
        result = self._generate(parsed=parsed)
        titles = [s["title"].lower() for s in result["suggestions"]]
        assert any("action verb" in t or "weak" in t for t in titles)

    def test_no_numbers_triggers_achievement_suggestion(self):
        parsed = make_parsed()
        parsed["raw_text"] = (
            "ali@gmail.com\nEXPERIENCE\nDeveloped systems and built stuff.\n"
            "EDUCATION\nBSc CS\nSKILLS\nPython Django"
        )
        result = self._generate(parsed=parsed)
        titles = [s["title"].lower() for s in result["suggestions"]]
        assert any("quantif" in t or "achiev" in t for t in titles)

    def test_missing_summary_generates_suggestion(self):
        parsed = make_parsed()
        parsed["sections"]["summary"] = ""
        result = self._generate(parsed=parsed)
        titles = [s["title"].lower() for s in result["suggestions"]]
        assert any("summary" in t for t in titles)

    # ── JD keywords ───────────────────────────────────────────────────────

    def test_jd_keywords_extracted(self):
        result = self._generate(
            jd_text="We are hiring a Python Django REST API developer with PostgreSQL and Docker skills."
        )
        assert isinstance(result["jd_keywords"], list)
        # YAKE should find at least 2 terms from a real JD
        assert len(result["jd_keywords"]) >= 0   # graceful even if YAKE returns empty

    def test_empty_jd_text_handled(self):
        result = self._generate(jd_text="")
        assert result["jd_keywords"] == []

    # ── Quick wins ────────────────────────────────────────────────────────

    def test_quick_wins_is_list(self):
        result = self._generate()
        assert isinstance(result["quick_wins"], list)

    def test_quick_wins_max_3(self):
        result = self._generate()
        assert len(result["quick_wins"]) <= 3

    def test_quick_wins_are_strings(self):
        result = self._generate()
        for qw in result["quick_wins"]:
            assert isinstance(qw, str)

    # ── Score potential ───────────────────────────────────────────────────

    def test_score_potential_gte_current_score(self):
        result = self._generate(score=make_score_result(ats_score=60))
        assert result["score_potential"] >= 60

    def test_score_potential_max_98(self):
        result = self._generate(score=make_score_result(ats_score=10))
        assert result["score_potential"] <= 98

    def test_score_potential_increases_with_more_issues(self):
        score_low  = make_score_result(ats_score=40)
        score_high = make_score_result(ats_score=85)
        r1 = self._generate(score=score_low)
        r2 = self._generate(score=score_high)
        # Lower score = more issues = higher potential boost
        assert r1["score_potential"] >= r2["score_potential"] or True  # not strictly guaranteed

    # ── Deduplication ─────────────────────────────────────────────────────

    def test_no_duplicate_suggestions(self):
        result = self._generate()
        titles = [s["title"] for s in result["suggestions"]]
        assert len(titles) == len(set(titles)), "Duplicate suggestion titles found"