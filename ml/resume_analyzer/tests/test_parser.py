"""
test_parser.py
--------------
Unit tests for Phase 2 — Resume Parser

Run with:
    pytest test_parser.py -v
"""

import pytest
from parsers.resume_parser import (
    TextNormalizer,
    SectionDetector,
    ResumeParser,
)


# ===========================================================================
# TextNormalizer Tests
# ===========================================================================

class TestTextNormalizer:

    def setup_method(self):
        self.normalizer = TextNormalizer()

    def test_preserves_cpp(self):
        text = "Experienced in C++ and C# development"
        result = self.normalizer.normalize(text)
        assert "C++" in result
        assert "C#" in result

    def test_preserves_dotnet(self):
        text = "Built APIs using .NET and ASP.NET"
        result = self.normalizer.normalize(text)
        assert ".NET" in result
        assert "ASP.NET" in result

    def test_preserves_nodejs(self):
        text = "Backend: Node.js, Express.js, Next.js"
        result = self.normalizer.normalize(text)
        assert "Node.js" in result

    def test_collapses_extra_spaces(self):
        text = "Python    developer   with    5   years"
        result = self.normalizer.normalize(text)
        assert "  " not in result

    def test_fixes_encoding_artifacts(self):
        text = "Pro\ufb01le\u2014Senior Developer"
        result = self.normalizer.normalize(text)
        assert "\ufb01" not in result
        assert "\u2014" not in result

    def test_preserves_cicd(self):
        text = "Worked with CI/CD pipelines and REST APIs"
        result = self.normalizer.normalize(text)
        assert "CI/CD" in result


# ===========================================================================
# SectionDetector Tests
# ===========================================================================

class TestSectionDetector:

    def setup_method(self):
        self.detector = SectionDetector()

    def test_detects_education(self):
        text = "EDUCATION\nBSc Computer Science, FAST NUCES 2021"
        sections = self.detector.detect_sections(text)
        assert "Computer Science" in sections["education"]

    def test_detects_skills(self):
        text = "TECHNICAL SKILLS\nPython, Django, PostgreSQL, Docker"
        sections = self.detector.detect_sections(text)
        assert "Python" in sections["skills"]

    def test_detects_experience(self):
        text = "WORK EXPERIENCE\nSoftware Engineer at Systems Ltd 2022-Present"
        sections = self.detector.detect_sections(text)
        assert "Systems Ltd" in sections["experience"]

    def test_detects_projects(self):
        text = "Projects\nAlumni Portal — Django + React FYP"
        sections = self.detector.detect_sections(text)
        assert "Alumni Portal" in sections["projects"]

    def test_handles_mixed_case_headings(self):
        text = "Education\nBSc Computer Science"
        sections = self.detector.detect_sections(text)
        assert "Computer Science" in sections["education"]


# ===========================================================================
# Integration: ResumeParser with synthetic DOCX-like text
# ===========================================================================

class TestResumeParserSynthetic:
    """
    Since we can't ship actual PDF files in tests, we test
    the parser internals with raw text injection.
    """

    def setup_method(self):
        self.parser = ResumeParser()

    def test_contact_detection_with_email(self):
        text = "Ali Hassan\nali.hassan@gmail.com\n+92-300-1234567"
        result = self.parser._detect_contact_info(text)
        assert result is True

    def test_contact_detection_without_email(self):
        text = "Software Engineer with 3 years experience"
        result = self.parser._detect_contact_info(text)
        assert result is False

    def test_contact_detection_phone_only(self):
        text = "Reach me at 0300-1234567"
        result = self.parser._detect_contact_info(text)
        assert result is True

    def test_unsupported_format_returns_warning(self):
        result = self.parser.parse(b"dummy content", "resume.txt")
        assert any("Unsupported" in w for w in result["warnings"])
        assert result["file_type"] == "unknown"

    def test_empty_pdf_flags_as_scanned_or_empty(self):
        # An empty bytes PDF would either be scanned or fail gracefully
        result = self.parser.parse(b"", "resume.pdf")
        # Should not raise — should return warnings
        assert isinstance(result["warnings"], list)


# ===========================================================================
# Section Pattern Coverage
# ===========================================================================

class TestSectionPatternCoverage:
    """Ensure all common resume section headings are detected."""

    def setup_method(self):
        self.detector = SectionDetector()

    @pytest.mark.parametrize("heading,expected_key", [
        ("EDUCATION", "education"),
        ("Academic Background", "education"),
        ("WORK EXPERIENCE", "experience"),
        ("Employment History", "experience"),
        ("TECHNICAL SKILLS", "skills"),
        ("Competencies", "skills"),
        ("CERTIFICATIONS", "certifications"),
        ("Licenses", "certifications"),
        ("PROJECTS", "projects"),
        ("Portfolio", "projects"),
        ("SUMMARY", "summary"),
        ("Career Objective", "summary"),
        ("AWARDS", "awards"),
        ("Achievements", "awards"),
        ("REFERENCES", "references"),
        ("LANGUAGES", "languages"),
    ])
    def test_heading_detection(self, heading, expected_key):
        text = f"{heading}\nSome content here"
        sections = self.detector.detect_sections(text)
        assert sections.get(expected_key), (
            f"Expected '{heading}' to map to section '{expected_key}'"
        )