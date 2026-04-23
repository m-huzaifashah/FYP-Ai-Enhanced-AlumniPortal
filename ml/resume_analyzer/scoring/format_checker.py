"""
format_checker.py
-----------------
Phase 4 — ATS Formatting & Compatibility Checker

Acts as a candidate-side ATS checker. Evaluates the resume's formatting
for compatibility with real-world ATS parsers and returns:
  - list of issues with severity + penalty
  - total formatting score (0–100)
  - actionable fix suggestions

Penalty table (research paper recommendations):
  Issue                                     Penalty
  ─────────────────────────────────────────────────
  Scanned / image PDF (no text layer)         -30
  Missing required section (per section)     -10
  Text in tables (layout tables)             -15
  Missing contact info                       -10
  Unusual / decorative fonts (heuristic)      -5
  No clear section headings detected          -8
  Resume too short  (<150 words)              -8
  Resume too long   (>800 words)              -5
  File is .doc (old format)                   -5
  Missing action verbs in experience          -5
  No quantifiable achievements detected       -5
  Inconsistent date format                    -3
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Penalty values
# ---------------------------------------------------------------------------
PENALTIES = {
    "scanned_pdf":              30,
    "missing_required_section": 10,   # per section
    "table_layout":             15,
    "no_contact_info":          10,
    "unusual_font_heuristic":    5,
    "no_section_headings":       8,
    "resume_too_short":          8,
    "resume_too_long":           5,
    "old_doc_format":            5,
    "no_action_verbs":           5,
    "no_quantifiable_achievements": 5,
    "inconsistent_dates":        3,
}

# Required sections for ATS compatibility
REQUIRED_SECTIONS = ["experience", "education", "skills"]

# Strong action verbs commonly used in industry resumes
ACTION_VERBS = [
    "developed", "designed", "implemented", "built", "created", "led",
    "managed", "architected", "optimized", "improved", "reduced", "increased",
    "delivered", "launched", "deployed", "integrated", "automated", "migrated",
    "engineered", "maintained", "collaborated", "coordinated", "analyzed",
    "researched", "published", "presented", "trained", "mentored", "resolved",
    "established", "streamlined", "spearheaded", "achieved", "exceeded",
]

# Quantifiable achievement indicators
ACHIEVEMENT_PATTERNS = [
    r"\d+%",                           # percentages
    r"\$[\d,]+",                       # dollar amounts
    r"\d+\s*(?:million|billion|k\b)",  # large numbers
    r"(?:reduced|improved|increased|saved|generated)\s+by\s+\d+",
    r"\d+\s*(?:users|clients|customers|projects|teams|members)",
    r"(?:top|rank|first|second)\s+\d+",
]

# Common date formats — we want consistency
DATE_FORMAT_PATTERNS = [
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b",
    r"\b\d{1,2}/\d{4}\b",
    r"\b\d{4}\s*[-–]\s*\d{4}\b",
    r"\b\d{4}\s*[-–]\s*(?:present|current|now)\b",
    r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b",
]


# ===========================================================================
# FormatChecker
# ===========================================================================

class FormatChecker:
    """
    Evaluates a parsed resume for ATS formatting compliance.

    Usage:
        checker = FormatChecker()
        result = checker.check(parsed_resume)
    """

    def check(self, parsed_resume: dict) -> dict:
        """
        Run all formatting checks.

        Args:
            parsed_resume: output dict from ResumeParser.parse()

        Returns:
        {
            "formatting_score": int,     # 0-100
            "issues": [
                {
                    "code": str,
                    "issue": str,
                    "severity": "critical" | "major" | "minor",
                    "penalty": int,
                    "suggestion": str,
                }
            ],
            "passed_checks": [str],      # checks that passed cleanly
            "issue_count": int,
        }
        """
        issues = []
        passed = []

        raw_text    = parsed_resume.get("raw_text", "")
        sections    = parsed_resume.get("sections", {})
        file_type   = parsed_resume.get("file_type", "")
        is_scanned  = parsed_resume.get("is_scanned", False)
        word_count  = parsed_resume.get("word_count", 0)
        has_contact = parsed_resume.get("has_contact_info", False)

        # ── Check 1: Scanned PDF ───────────────────────────────────────────
        if is_scanned:
            issues.append(self._issue(
                code="scanned_pdf",
                issue="Resume is a scanned image — no text layer detected.",
                severity="critical",
                penalty=PENALTIES["scanned_pdf"],
                suggestion=(
                    "Save your resume as a text-based PDF (File → Save As PDF from Word/Google Docs). "
                    "ATS systems cannot read scanned images at all."
                ),
            ))
        else:
            passed.append("Text layer detected — resume is machine-readable.")

        # ── Check 2: Old .doc format ───────────────────────────────────────
        if file_type == "doc":
            issues.append(self._issue(
                code="old_doc_format",
                issue="File is in old .doc format.",
                severity="minor",
                penalty=PENALTIES["old_doc_format"],
                suggestion="Save as .docx or export as PDF for full ATS compatibility.",
            ))
        else:
            passed.append(f"File format ({file_type}) is ATS-compatible.")

        # ── Check 3: Contact information ──────────────────────────────────
        if not has_contact:
            issues.append(self._issue(
                code="no_contact_info",
                issue="No email address or phone number detected.",
                severity="major",
                penalty=PENALTIES["no_contact_info"],
                suggestion=(
                    "Add your email and phone number at the top of the resume. "
                    "ATS systems use this to populate candidate profiles."
                ),
            ))
        else:
            passed.append("Contact information found.")

        # ── Check 4: Required sections ────────────────────────────────────
        for section in REQUIRED_SECTIONS:
            if not sections.get(section, "").strip():
                issues.append(self._issue(
                    code="missing_required_section",
                    issue=f"Section '{section.capitalize()}' is missing or empty.",
                    severity="major",
                    penalty=PENALTIES["missing_required_section"],
                    suggestion=(
                        f"Add a clearly labeled '{section.capitalize()}' section. "
                        f"ATS systems look for this heading explicitly."
                    ),
                ))
            else:
                passed.append(f"Section '{section.capitalize()}' found.")

        # ── Check 5: Section headings detectable ──────────────────────────
        present_sections = [k for k, v in sections.items() if v and v.strip()]
        if len(present_sections) < 2:
            issues.append(self._issue(
                code="no_section_headings",
                issue="Very few section headings were detected.",
                severity="major",
                penalty=PENALTIES["no_section_headings"],
                suggestion=(
                    "Use clear, standard section headings like 'Experience', 'Education', "
                    "'Skills' in plain text. Avoid headers embedded in images or text boxes."
                ),
            ))
        else:
            passed.append(f"{len(present_sections)} section headings detected.")

        # ── Check 6: Table layout detection ───────────────────────────────
        if self._has_table_layout(raw_text):
            issues.append(self._issue(
                code="table_layout",
                issue="Resume appears to use a table-based layout.",
                severity="major",
                penalty=PENALTIES["table_layout"],
                suggestion=(
                    "Replace table layouts with plain text columns or simple bullet points. "
                    "Many ATS systems scramble text extracted from tables."
                ),
            ))
        else:
            passed.append("No table-based layout detected.")

        # ── Check 7: Word count (length) ──────────────────────────────────
        if word_count < 150:
            issues.append(self._issue(
                code="resume_too_short",
                issue=f"Resume is too short ({word_count} words).",
                severity="major",
                penalty=PENALTIES["resume_too_short"],
                suggestion=(
                    "Expand your resume to at least 300 words. Add project details, "
                    "responsibilities, and quantifiable achievements."
                ),
            ))
        elif word_count > 800:
            issues.append(self._issue(
                code="resume_too_long",
                issue=f"Resume is very long ({word_count} words). Consider condensing.",
                severity="minor",
                penalty=PENALTIES["resume_too_long"],
                suggestion=(
                    "Aim for 400–600 words (1–2 pages). Remove outdated or irrelevant content. "
                    "Recruiters typically spend 6–10 seconds on initial screening."
                ),
            ))
        else:
            passed.append(f"Resume length ({word_count} words) is within ideal range.")

        # ── Check 8: Action verbs in experience ───────────────────────────
        exp_text = sections.get("experience", "").lower()
        if exp_text and not self._has_action_verbs(exp_text):
            issues.append(self._issue(
                code="no_action_verbs",
                issue="Experience section lacks strong action verbs.",
                severity="minor",
                penalty=PENALTIES["no_action_verbs"],
                suggestion=(
                    "Start each bullet point with a strong action verb: "
                    "'Developed', 'Built', 'Led', 'Optimized', 'Reduced', 'Delivered'."
                ),
            ))
        elif exp_text:
            passed.append("Action verbs found in experience section.")

        # ── Check 9: Quantifiable achievements ───────────────────────────
        if exp_text and not self._has_quantifiable_achievements(raw_text):
            issues.append(self._issue(
                code="no_quantifiable_achievements",
                issue="No quantifiable achievements detected (numbers, %, $).",
                severity="minor",
                penalty=PENALTIES["no_quantifiable_achievements"],
                suggestion=(
                    "Add measurable impact: 'Reduced load time by 40%', "
                    "'Served 10,000+ users', 'Cut infrastructure costs by $2,000/month'."
                ),
            ))
        elif exp_text:
            passed.append("Quantifiable achievements found.")

        # ── Check 10: Date format consistency ─────────────────────────────
        date_inconsistency = self._check_date_inconsistency(raw_text)
        if date_inconsistency:
            issues.append(self._issue(
                code="inconsistent_dates",
                issue="Inconsistent date formats detected.",
                severity="minor",
                penalty=PENALTIES["inconsistent_dates"],
                suggestion=(
                    "Use one consistent date format throughout, e.g. 'Jan 2022 – Present' "
                    "or '01/2022 – Present'. Mixing formats looks unprofessional."
                ),
            ))
        else:
            passed.append("Date formatting appears consistent.")

        # ── Compute final score ───────────────────────────────────────────
        total_penalty = sum(i["penalty"] for i in issues)
        formatting_score = max(0, 100 - total_penalty)

        logger.info(
            f"FormatChecker | score={formatting_score} | "
            f"issues={len(issues)} | passed={len(passed)}"
        )

        return {
            "formatting_score": formatting_score,
            "issues":           issues,
            "passed_checks":    passed,
            "issue_count":      len(issues),
        }

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _issue(
        self,
        code: str,
        issue: str,
        severity: str,
        penalty: int,
        suggestion: str,
    ) -> dict:
        return {
            "code":       code,
            "issue":      issue,
            "severity":   severity,    # critical / major / minor
            "penalty":    penalty,
            "suggestion": suggestion,
        }

    def _has_table_layout(self, text: str) -> bool:
        """
        Heuristic: tables often produce lines with " | " separators
        (from our DOCXParser) or lines that look like grid cells.
        """
        pipe_lines = sum(1 for line in text.split("\n") if " | " in line)
        # If more than 3 lines have pipe separators, likely a table layout
        return pipe_lines > 3

    def _has_action_verbs(self, exp_text: str) -> bool:
        """Check if experience text starts bullet points with action verbs."""
        return any(verb in exp_text for verb in ACTION_VERBS)

    def _has_quantifiable_achievements(self, text: str) -> bool:
        """Check if any quantifiable achievement patterns exist."""
        return any(
            re.search(pattern, text, re.IGNORECASE)
            for pattern in ACHIEVEMENT_PATTERNS
        )

    def _check_date_inconsistency(self, text: str) -> bool:
        """
        Returns True if multiple different date formats are used.
        """
        formats_found = set()
        for pattern in DATE_FORMAT_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                formats_found.add(pattern)
        # More than 2 different date format styles = inconsistent
        return len(formats_found) > 2