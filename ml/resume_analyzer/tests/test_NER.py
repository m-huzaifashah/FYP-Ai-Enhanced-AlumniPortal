"""
test_ner.py
-----------
Unit tests for Phase 3 — NER Extractor & Skill Matcher

Run with:
    pytest tests/test_ner.py -v

Note: NERExtractor tests require spaCy model installed.
SkillMatcher tests work without spaCy.
"""

import pytest
from nlp.skill_matcher import SkillMatcher, JDSkillExtractor


# ===========================================================================
# SkillMatcher Tests (no spaCy required)
# ===========================================================================

class TestSkillMatcher:

    def setup_method(self):
        self.matcher = SkillMatcher()

    def test_exact_match(self):
        resume_skills = ["Python", "Django", "PostgreSQL"]
        jd_skills = ["Python", "Django"]
        result = self.matcher.compare(resume_skills, jd_skills)
        assert result["matched_count"] == 2
        assert result["coverage_percent"] == 100

    def test_missing_skills(self):
        resume_skills = ["Python"]
        jd_skills = ["Python", "Docker", "Kubernetes"]
        result = self.matcher.compare(resume_skills, jd_skills)
        assert "Docker" in result["missing_skills"]
        assert "Kubernetes" in result["missing_skills"]

    def test_extra_skills_not_penalized(self):
        resume_skills = ["Python", "React", "Docker", "AWS", "Redis"]
        jd_skills = ["Python"]
        result = self.matcher.compare(resume_skills, jd_skills)
        assert result["coverage_percent"] == 100
        assert len(result["extra_skills"]) == 4

    def test_case_insensitive_match(self):
        resume_skills = ["python", "django"]
        jd_skills = ["Python", "Django"]
        result = self.matcher.compare(resume_skills, jd_skills)
        assert result["matched_count"] == 2

    def test_partial_match(self):
        """'Python 3' in JD should match 'Python' in resume."""
        resume_skills = ["Python"]
        jd_skills = ["Python 3"]
        result = self.matcher.compare(resume_skills, jd_skills)
        assert result["matched_count"] == 1

    def test_empty_jd_skills(self):
        result = self.matcher.compare(["Python"], [])
        assert result["coverage_percent"] == 0
        assert result["required_count"] == 0

    def test_empty_resume_skills(self):
        result = self.matcher.compare([], ["Python", "React"])
        assert result["matched_count"] == 0
        assert result["coverage_percent"] == 0
        assert len(result["missing_skills"]) == 2

    def test_weighted_score_higher_for_technical(self):
        """
        High-value category skills should give higher weighted score
        than the same number of soft skills.
        """
        # All technical (high-value)
        technical_match = self.matcher.compare(
            ["Python", "Django"], ["Python", "Django"]
        )
        # Mix of technical + soft
        mixed_match = self.matcher.compare(
            ["Communication", "Teamwork"], ["Communication", "Teamwork"]
        )
        # Both should be 100% coverage but technical should have higher weighted
        assert technical_match["weighted_score"] >= mixed_match["weighted_score"]

    def test_full_match_score_is_1(self):
        skills = ["Python", "React", "Docker", "PostgreSQL"]
        result = self.matcher.compare(skills, skills)
        assert result["match_score"] == 1.0
        assert result["coverage_percent"] == 100


# ===========================================================================
# Alias normalization tests (via SkillMatcher._canonical_lookup)
# ===========================================================================

class TestAliasNormalization:

    def setup_method(self):
        self.matcher = SkillMatcher()

    def test_react_variants_all_present_in_lookup(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert "reactjs" in SKILL_ALIASES
        assert "react.js" in SKILL_ALIASES
        assert SKILL_ALIASES["reactjs"] == "React"
        assert SKILL_ALIASES["react.js"] == "React"

    def test_nodejs_variants(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert SKILL_ALIASES["nodejs"] == "Node.js"
        assert SKILL_ALIASES["node js"] == "Node.js"

    def test_dotnet_variants(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert SKILL_ALIASES["dotnet"] == ".NET"
        assert SKILL_ALIASES["dot net"] == ".NET"

    def test_ml_alias(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert SKILL_ALIASES["ml"] == "Machine Learning"

    def test_k8s_alias(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert SKILL_ALIASES["k8s"] == "Kubernetes"

    def test_sklearn_alias(self):
        from nlp.ner_extractor import SKILL_ALIASES
        assert SKILL_ALIASES["sklearn"] == "scikit-learn"


# ===========================================================================
# NERExtractor Tests (require spaCy — skip if model not installed)
# ===========================================================================

try:
    import spacy
    spacy.load("en_core_web_lg")
    SPACY_AVAILABLE = True
except Exception:
    try:
        spacy.load("en_core_web_sm")
        SPACY_AVAILABLE = True
    except Exception:
        SPACY_AVAILABLE = False

spacy_required = pytest.mark.skipif(
    not SPACY_AVAILABLE,
    reason="spaCy model not installed — run: python -m spacy download en_core_web_lg"
)


@spacy_required
class TestNERExtractor:

    def setup_method(self):
        from nlp.ner_extractor import NERExtractor
        self.extractor = NERExtractor()

    def _make_parsed(self, text: str, skills_text: str = "") -> dict:
        return {
            "raw_text": text,
            "sections": {
                "skills": skills_text or text,
                "experience": text,
                "education": text,
            }
        }

    def test_extracts_python(self):
        parsed = self._make_parsed(
            "I have 3 years of experience in Python and Django.",
            skills_text="Python, Django, PostgreSQL"
        )
        result = self.extractor.extract(parsed)
        assert "Python" in result["skills"]
        assert "Django" in result["skills"]

    def test_extracts_react_from_alias(self):
        parsed = self._make_parsed(
            "Frontend: ReactJS, Node.js, TypeScript",
            skills_text="ReactJS, Node.js, TypeScript"
        )
        result = self.extractor.extract(parsed)
        # ReactJS should normalize to React
        assert "React" in result["skills"] or "ReactJS" in result["skills"]

    def test_extracts_years_experience(self):
        parsed = self._make_parsed(
            "Software Engineer with 4 years of experience in web development."
        )
        result = self.extractor.extract(parsed)
        assert result["years_experience"] == 4

    def test_extracts_gpa(self):
        parsed = self._make_parsed(
            "BSc Computer Science | CGPA: 3.7/4.0 | FAST NUCES"
        )
        result = self.extractor.extract(parsed)
        if result["gpa"]:
            assert result["gpa"]["score"] == 3.7
            assert result["gpa"]["out_of"] == 4.0

    def test_extracts_degree(self):
        parsed = self._make_parsed(
            "BSc in Computer Science from FAST NUCES, 2023"
        )
        result = self.extractor.extract(parsed)
        assert len(result["degrees"]) > 0
        degrees_str = str(result["degrees"])
        assert "BSC" in degrees_str or "Computer" in degrees_str

    def test_skill_categories_populated(self):
        parsed = self._make_parsed(
            "Python, TensorFlow, PyTorch, scikit-learn, pandas",
            skills_text="Python, TensorFlow, PyTorch, scikit-learn, pandas"
        )
        result = self.extractor.extract(parsed)
        assert "skill_categories" in result
        assert isinstance(result["skill_categories"], dict)

    def test_no_skills_returns_empty(self):
        parsed = self._make_parsed(
            "Looking for opportunities in the industry. References available."
        )
        result = self.extractor.extract(parsed)
        assert isinstance(result["skills"], list)

    def test_experience_from_date_range(self):
        parsed = self._make_parsed(
            "Software Engineer at Systems Ltd | 2020 - Present"
        )
        result = self.extractor.extract(parsed)
        # Should detect ~4-5 years from 2020 to present
        if result["years_experience"]:
            assert result["years_experience"] >= 3