"""
suggestions.py
--------------
Phase 5 — Improvement Suggestions Generator

Uses YAKE! (Yet Another Keyword Extractor) to identify the most salient
terms in the JD, then cross-references with the resume to generate
prioritized, actionable improvement suggestions.

Suggestion categories (in priority order):
  1. CRITICAL  — scanned PDF, no text layer
  2. HIGH      — missing required sections, no contact info
  3. MEDIUM    — missing high-value skills, weak formatting
  4. LOW       — style improvements, optional enhancements
"""

import re
import logging
from typing import Optional

import yake

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# YAKE configuration
# ---------------------------------------------------------------------------
YAKE_LANGUAGE        = "en"
YAKE_MAX_NGRAM_SIZE  = 3      # extract up to 3-word phrases
YAKE_DEDUP_THRESHOLD = 0.9
YAKE_NUM_KEYWORDS    = 15     # top N keywords from JD

# ---------------------------------------------------------------------------
# Priority levels
# ---------------------------------------------------------------------------
PRIORITY_CRITICAL = "critical"
PRIORITY_HIGH     = "high"
PRIORITY_MEDIUM   = "medium"
PRIORITY_LOW      = "low"

PRIORITY_ORDER = {
    PRIORITY_CRITICAL: 0,
    PRIORITY_HIGH:     1,
    PRIORITY_MEDIUM:   2,
    PRIORITY_LOW:      3,
}

# Skill categories that matter most for ATS ranking
HIGH_VALUE_CATEGORIES = {
    "programming_languages", "machine_learning_ai",
    "web_backend", "web_frontend", "databases",
    "devops_cloud", "data_science", "mobile",
}

# Action verbs for bullet-point suggestions
STRONG_ACTION_VERBS = [
    "Developed", "Engineered", "Architected", "Designed", "Built",
    "Implemented", "Deployed", "Optimized", "Reduced", "Improved",
    "Automated", "Led", "Managed", "Delivered", "Launched",
    "Integrated", "Migrated", "Streamlined", "Collaborated", "Resolved",
]


# ===========================================================================
# SuggestionsGenerator
# ===========================================================================

class SuggestionsGenerator:
    """
    Generates a prioritized list of improvement suggestions for a resume.

    Usage:
        gen = SuggestionsGenerator()
        suggestions = gen.generate(
            parsed_resume, resume_entities,
            jd_text, jd_entities,
            score_result, fmt_result
        )
    """

    def __init__(self):
        self._yake = yake.KeywordExtractor(
            lan=YAKE_LANGUAGE,
            n=YAKE_MAX_NGRAM_SIZE,
            dedupLim=YAKE_DEDUP_THRESHOLD,
            top=YAKE_NUM_KEYWORDS,
            features=None,
        )
        logger.info("SuggestionsGenerator ready.")

    # -----------------------------------------------------------------------
    # Main entry point
    # -----------------------------------------------------------------------

    def generate(
        self,
        parsed_resume:   dict,
        resume_entities: dict,
        jd_text:         str,
        jd_entities:     dict,
        score_result:    dict,
        fmt_result:      dict,
    ) -> dict:
        """
        Generate all improvement suggestions.

        Returns:
        {
            "suggestions": [
                {
                    "priority":    "critical"|"high"|"medium"|"low",
                    "category":    str,
                    "title":       str,
                    "detail":      str,
                    "example":     str | None,
                    "impact":      str,   # "Adds +X pts to ATS score"
                }
            ],
            "jd_keywords":      [str],   # Top YAKE! terms from JD
            "quick_wins":       [str],   # Top 3 highest-impact fixes
            "score_potential":  int,     # Estimated score if all fixes applied
        }
        """
        suggestions = []

        raw_text    = parsed_resume.get("raw_text", "")
        sections    = parsed_resume.get("sections", {})
        fmt_issues  = fmt_result.get("issues", [])
        breakdown   = score_result.get("breakdown", {})
        kw_detail   = score_result.get("keyword_detail", {})
        sec_detail  = score_result.get("section_detail", {})
        ats_score   = score_result.get("ats_score", 0)

        resume_skills = set(s.lower() for s in resume_entities.get("skills", []))
        missing_skills = kw_detail.get("missing_skills", [])

        # ── 1. Critical formatting issues ─────────────────────────────────
        suggestions += self._suggest_critical_format(fmt_issues)

        # ── 2. Missing required sections ──────────────────────────────────
        suggestions += self._suggest_missing_sections(sec_detail)

        # ── 3. Missing high-value skills (from JD) ────────────────────────
        jd_keywords = self._extract_jd_keywords(jd_text)
        suggestions += self._suggest_missing_skills(
            missing_skills, jd_keywords, jd_entities, resume_skills
        )

        # ── 4. Formatting improvements ────────────────────────────────────
        suggestions += self._suggest_format_improvements(fmt_issues)

        # ── 5. Content quality improvements ───────────────────────────────
        suggestions += self._suggest_content_quality(
            sections, raw_text, resume_entities
        )

        # ── 6. ATS keyword density ────────────────────────────────────────
        suggestions += self._suggest_keyword_density(
            raw_text, jd_keywords, jd_text
        )

        # ── 7. Section-specific tips ──────────────────────────────────────
        suggestions += self._suggest_section_tips(sections, resume_entities)

        # Sort by priority
        suggestions.sort(key=lambda s: PRIORITY_ORDER.get(s["priority"], 99))

        # Deduplicate by title
        seen_titles = set()
        unique_suggestions = []
        for s in suggestions:
            if s["title"] not in seen_titles:
                seen_titles.add(s["title"])
                unique_suggestions.append(s)

        # Quick wins = top 3 high/critical suggestions
        quick_wins = [
            s["title"]
            for s in unique_suggestions
            if s["priority"] in (PRIORITY_CRITICAL, PRIORITY_HIGH)
        ][:3]

        # Score potential: estimate points if all issues fixed
        score_potential = self._estimate_potential(unique_suggestions, ats_score)

        logger.info(
            f"Generated {len(unique_suggestions)} suggestions | "
            f"score_potential={score_potential}"
        )

        return {
            "suggestions":     unique_suggestions,
            "jd_keywords":     jd_keywords,
            "quick_wins":      quick_wins,
            "score_potential": score_potential,
        }

    # -----------------------------------------------------------------------
    # Section 1: Critical formatting
    # -----------------------------------------------------------------------

    def _suggest_critical_format(self, fmt_issues: list) -> list:
        suggestions = []
        for issue in fmt_issues:
            if issue.get("severity") != "critical":
                continue
            suggestions.append({
                "priority": PRIORITY_CRITICAL,
                "category": "Formatting",
                "title":    issue["issue"],
                "detail":   issue["suggestion"],
                "example":  None,
                "impact":   f"Fixes -{issue['penalty']} pt penalty. ATS cannot read your resume without this.",
            })
        return suggestions

    # -----------------------------------------------------------------------
    # Section 2: Missing sections
    # -----------------------------------------------------------------------

    def _suggest_missing_sections(self, sec_detail: dict) -> list:
        suggestions = []
        missing = sec_detail.get("missing_required", [])

        section_tips = {
            "experience": (
                "Add a 'Work Experience' section with your internships, "
                "part-time roles, or academic projects if you have no formal experience.",
                "Software Engineer Intern — Systems Ltd (Jun 2023 – Aug 2023)\n"
                "• Developed REST APIs using Django serving 2,000+ requests/day\n"
                "• Reduced query response time by 35% via PostgreSQL indexing",
            ),
            "education": (
                "Add an 'Education' section with your degree, institution, and graduation year.",
                "BSc Computer Science — FAST NUCES, Lahore (2020–2024) | CGPA: 3.6/4.0",
            ),
            "skills": (
                "Add a 'Technical Skills' section with a clean list of your tools and technologies.",
                "Languages: Python, JavaScript, Java\n"
                "Frameworks: Django, React, Node.js\n"
                "Databases: PostgreSQL, MongoDB\n"
                "Tools: Docker, Git, AWS",
            ),
        }

        for section in missing:
            tip, example = section_tips.get(section, ("Add this section.", None))
            suggestions.append({
                "priority": PRIORITY_HIGH,
                "category": "Missing Section",
                "title":    f"Add '{section.capitalize()}' section",
                "detail":   tip,
                "example":  example,
                "impact":   "Missing required sections cost -10 pts each. ATS may auto-reject.",
            })
        return suggestions

    # -----------------------------------------------------------------------
    # Section 3: Missing skills
    # -----------------------------------------------------------------------

    def _suggest_missing_skills(
        self,
        missing_skills: list,
        jd_keywords:    list,
        jd_entities:    dict,
        resume_skills:  set,
    ) -> list:
        suggestions = []
        if not missing_skills:
            return suggestions

        # Split missing into high-value vs normal
        required  = jd_entities.get("required_skills", [])
        preferred = jd_entities.get("preferred_skills", [])

        required_set  = set(s.lower() for s in required)
        preferred_set = set(s.lower() for s in preferred)

        high_value_missing  = []
        normal_missing      = []
        preferred_missing   = []

        for skill in missing_skills:
            sl = skill.lower()
            if sl in required_set:
                high_value_missing.append(skill)
            elif sl in preferred_set:
                preferred_missing.append(skill)
            else:
                normal_missing.append(skill)

        # Critical missing required skills (top 5)
        if high_value_missing:
            skills_str = ", ".join(high_value_missing[:5])
            more = len(high_value_missing) - 5
            detail = (
                f"Your resume is missing these required skills from the job description: "
                f"{skills_str}"
                + (f" (and {more} more)." if more > 0 else ".")
            )
            suggestions.append({
                "priority": PRIORITY_HIGH,
                "category": "Missing Skills",
                "title":    f"Add {len(high_value_missing)} required skill(s) to your resume",
                "detail":   detail,
                "example":  (
                    f"Add to your Skills section:\n"
                    f"{chr(10).join('• ' + s for s in high_value_missing[:5])}"
                ),
                "impact":   (
                    f"Each matched required skill improves your keyword score. "
                    f"Currently missing {len(high_value_missing)}/{len(required)} required skills."
                ),
            })

        # Preferred skills (medium priority)
        if preferred_missing:
            skills_str = ", ".join(preferred_missing[:3])
            suggestions.append({
                "priority": PRIORITY_MEDIUM,
                "category": "Preferred Skills",
                "title":    f"Consider adding preferred skills: {skills_str}",
                "detail":   (
                    f"The JD lists these as 'nice-to-have': {', '.join(preferred_missing)}. "
                    "Adding them increases your chance of standing out."
                ),
                "example":  None,
                "impact":   "Preferred skills give a bonus score boost of up to +10 pts.",
            })

        return suggestions

    # -----------------------------------------------------------------------
    # Section 4: Formatting improvements (major/minor issues)
    # -----------------------------------------------------------------------

    def _suggest_format_improvements(self, fmt_issues: list) -> list:
        suggestions = []
        for issue in fmt_issues:
            if issue.get("severity") == "critical":
                continue  # already handled above
            priority = (
                PRIORITY_HIGH if issue["severity"] == "major" else PRIORITY_LOW
            )
            suggestions.append({
                "priority": priority,
                "category": "Formatting",
                "title":    issue["issue"],
                "detail":   issue["suggestion"],
                "example":  None,
                "impact":   f"Removes -{issue['penalty']} pt formatting penalty.",
            })
        return suggestions

    # -----------------------------------------------------------------------
    # Section 5: Content quality
    # -----------------------------------------------------------------------

    def _suggest_content_quality(
        self,
        sections: dict,
        raw_text: str,
        resume_entities: dict,
    ) -> list:
        suggestions = []

        exp_text = sections.get("experience", "").lower()

        # Action verbs check
        weak_phrases = [
            r"\bresponsible for\b",
            r"\bwas involved in\b",
            r"\bhelped with\b",
            r"\bworked on\b",
            r"\bassisted in\b",
            r"\bparticipated in\b",
        ]
        weak_found = [p for p in weak_phrases if re.search(p, exp_text)]

        if weak_found:
            suggestions.append({
                "priority": PRIORITY_MEDIUM,
                "category": "Content Quality",
                "title":    "Replace weak phrases with strong action verbs",
                "detail":   (
                    f"Detected passive/weak phrases like 'responsible for', 'worked on'. "
                    "ATS and recruiters prefer active, impact-driven language."
                ),
                "example":  (
                    "❌ 'Was responsible for building the API'\n"
                    "✅ 'Engineered a RESTful API handling 5,000 daily requests'"
                ),
                "impact":   "Strong verbs improve readability score and recruiter engagement.",
            })

        # Quantifiable achievements
        has_numbers = bool(re.search(r"\d+%|\$[\d,]+|\d+\s*(?:users|clients|projects)", raw_text))
        if not has_numbers and exp_text:
            suggestions.append({
                "priority": PRIORITY_MEDIUM,
                "category": "Content Quality",
                "title":    "Add quantifiable achievements to your experience",
                "detail":   (
                    "Your resume doesn't mention measurable results. "
                    "Numbers make your impact concrete and memorable."
                ),
                "example":  (
                    "❌ 'Improved application performance'\n"
                    "✅ 'Reduced API response time by 45%, improving user retention by 20%'\n\n"
                    "❌ 'Worked on the mobile app'\n"
                    "✅ 'Built a React Native app with 10,000+ downloads in 3 months'"
                ),
                "impact":   "Quantified achievements increase recruiter callback rate significantly.",
            })

        # Summary section
        if not sections.get("summary", "").strip():
            suggestions.append({
                "priority": PRIORITY_MEDIUM,
                "category": "Content Quality",
                "title":    "Add a professional summary at the top",
                "detail":   (
                    "A 2–3 line summary at the top helps ATS categorize your profile "
                    "and gives recruiters immediate context."
                ),
                "example":  (
                    "Results-driven Software Engineer with 3+ years building scalable "
                    "web applications using Python and React. Experienced in REST API "
                    "design, cloud deployment (AWS), and Agile development. "
                    "Seeking to leverage full-stack expertise in a product-focused team."
                ),
                "impact":   "Summary helps ATS classify your resume into the right domain.",
            })

        # GPA — if present and high, suggest making it prominent
        gpa = resume_entities.get("gpa")
        if gpa:
            score = gpa.get("score", 0)
            out_of = gpa.get("out_of", 4.0)
            ratio = score / out_of if out_of else 0
            if ratio >= 0.85:
                suggestions.append({
                    "priority": PRIORITY_LOW,
                    "category": "Content Quality",
                    "title":    f"Highlight your strong GPA ({score}/{out_of})",
                    "detail":   (
                        "Your CGPA is above 85% — make it prominent in your Education section. "
                        "Many employers filter on academic performance."
                    ),
                    "example":  f"BSc Computer Science | CGPA: {score}/{out_of} (Dean's List)",
                    "impact":   "Prominent GPA strengthens academic credibility.",
                })

        return suggestions

    # -----------------------------------------------------------------------
    # Section 6: JD keyword density
    # -----------------------------------------------------------------------

    def _suggest_keyword_density(
        self,
        raw_text:    str,
        jd_keywords: list,
        jd_text:     str,
    ) -> list:
        suggestions = []
        if not jd_keywords:
            return suggestions

        text_lower = raw_text.lower()
        missing_kw = [
            kw for kw in jd_keywords
            if kw.lower() not in text_lower
        ]

        if missing_kw:
            kw_str = ", ".join(f'"{kw}"' for kw in missing_kw[:6])
            suggestions.append({
                "priority": PRIORITY_MEDIUM,
                "category": "Keyword Optimization",
                "title":    f"Naturally include {len(missing_kw)} high-frequency JD terms",
                "detail":   (
                    f"YAKE! keyword analysis found these important terms in the JD "
                    f"that are absent from your resume: {kw_str}. "
                    "Include them naturally in your experience or skills section."
                ),
                "example":  (
                    "Don't keyword-stuff — integrate them naturally:\n"
                    f"'Led development of {missing_kw[0] if missing_kw else 'feature'} "
                    "module, collaborating with cross-functional teams...'"
                ),
                "impact":   "JD keyword presence directly improves both keyword and semantic scores.",
            })

        return suggestions

    # -----------------------------------------------------------------------
    # Section 7: Section-specific tips
    # -----------------------------------------------------------------------

    def _suggest_section_tips(
        self,
        sections: dict,
        resume_entities: dict,
    ) -> list:
        suggestions = []

        # Projects section
        if not sections.get("projects", "").strip():
            suggestions.append({
                "priority": PRIORITY_LOW,
                "category": "Sections",
                "title":    "Add a Projects section",
                "detail":   (
                    "For fresh graduates and juniors, a Projects section compensates "
                    "for limited work experience. Include your FYP, academic projects, "
                    "or personal side projects with tech stack and impact."
                ),
                "example":  (
                    "Alumni Portal (FYP) | Django, React, PostgreSQL, SBERT\n"
                    "• Built AI-powered resume analyzer with 85%+ ATS matching accuracy\n"
                    "• Deployed on AWS EC2 with Docker, serving 500+ alumni users"
                ),
                "impact":   "Projects demonstrate practical skills to ATS and recruiters alike.",
            })

        # Certifications
        if not sections.get("certifications", "").strip():
            suggestions.append({
                "priority": PRIORITY_LOW,
                "category": "Sections",
                "title":    "Add relevant certifications",
                "detail":   (
                    "Industry certifications boost credibility. Even free online "
                    "certificates (Coursera, Google, AWS) are valued by ATS systems."
                ),
                "example":  (
                    "• AWS Certified Cloud Practitioner (2024)\n"
                    "• Meta Back-End Developer Certificate — Coursera (2023)\n"
                    "• Google Data Analytics Certificate (2023)"
                ),
                "impact":   "Certifications add keyword matches and signal continuous learning.",
            })

        # Skills section formatting tip
        skills_text = sections.get("skills", "")
        if skills_text and len(skills_text.split(",")) < 5:
            suggestions.append({
                "priority": PRIORITY_LOW,
                "category": "Skills Section",
                "title":    "Expand your Skills section",
                "detail":   (
                    "Your Skills section appears short. List all technologies, "
                    "tools, frameworks, and methodologies you know — "
                    "organized by category for better ATS parsing."
                ),
                "example":  (
                    "Languages:   Python, JavaScript, SQL\n"
                    "Frameworks:  Django, React, FastAPI\n"
                    "Databases:   PostgreSQL, MongoDB, Redis\n"
                    "DevOps:      Docker, Git, GitHub Actions\n"
                    "Soft Skills: Agile, Scrum, Technical Writing"
                ),
                "impact":   "More skills = more keyword matches against any JD.",
            })

        return suggestions

    # -----------------------------------------------------------------------
    # YAKE! keyword extraction
    # -----------------------------------------------------------------------

    def _extract_jd_keywords(self, jd_text: str) -> list[str]:
        """
        Use YAKE! to extract the most salient keyphrases from the JD.
        Returns list of keyword strings (lowercased, cleaned).
        """
        if not jd_text.strip():
            return []

        try:
            keywords = self._yake.extract_keywords(jd_text)
            # YAKE returns (keyword, score) — lower score = more important
            cleaned = []
            seen = set()
            for kw, score in keywords:
                kw_clean = kw.strip().lower()
                # Filter noise
                if (
                    len(kw_clean) > 2 and
                    len(kw_clean) < 50 and
                    kw_clean not in seen and
                    not kw_clean.isdigit()
                ):
                    cleaned.append(kw_clean)
                    seen.add(kw_clean)
            return cleaned[:10]

        except Exception as e:
            logger.warning(f"YAKE extraction failed: {e}")
            return []

    # -----------------------------------------------------------------------
    # Score potential estimator
    # -----------------------------------------------------------------------

    def _estimate_potential(
        self, suggestions: list, current_score: int
    ) -> int:
        """
        Estimate ATS score if all suggestions were applied.
        Each suggestion category has an estimated score boost.
        """
        boost_map = {
            PRIORITY_CRITICAL: 20,
            PRIORITY_HIGH:     10,
            PRIORITY_MEDIUM:    5,
            PRIORITY_LOW:       2,
        }
        total_boost = sum(
            boost_map.get(s["priority"], 0) for s in suggestions
        )
        potential = min(98, current_score + total_boost)
        return potential