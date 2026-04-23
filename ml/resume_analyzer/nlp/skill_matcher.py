"""
skill_matcher.py
----------------
Phase 3 — Skill Matching Utilities

Provides:
  1. SkillMatcher     — compare resume skills vs JD skills
  2. JDSkillExtractor — pull required skills from a job description

Used by Phase 4 (Scoring) and Phase 6 (Suggestions).
"""

import re
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

LEXICON_PATH = Path(__file__).parent.parent / "data" / "skills_lexicon.json"

# Skills that should be weighted higher (core technical)
HIGH_VALUE_CATEGORIES = {
    "programming_languages",
    "machine_learning_ai",
    "web_backend",
    "web_frontend",
    "databases",
    "devops_cloud",
    "data_science",
    "mobile",
}


class SkillMatcher:
    """
    Compares a candidate's extracted skills against a Job Description's
    required skills. Returns match analysis used by the scoring engine.

    Usage:
        matcher = SkillMatcher()
        result = matcher.compare(resume_skills, jd_skills)
    """

    def __init__(self):
        self.lexicon = self._load_lexicon()
        self._build_alias_lookup()

    def _load_lexicon(self) -> dict:
        with open(LEXICON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def _build_alias_lookup(self):
        """Build reverse lookup: canonical_lower → canonical."""
        self._canonical_lookup = {}
        for terms in self.lexicon.values():
            for term in terms:
                self._canonical_lookup[term.lower()] = term

    def compare(
        self,
        resume_skills: list[str],
        jd_skills: list[str],
    ) -> dict:
        """
        Compare resume skills to JD required skills.

        Returns:
        {
            "matched_skills": [...],       # Skills present in both
            "missing_skills": [...],       # JD skills not in resume
            "extra_skills": [...],         # Resume skills not in JD
            "match_score": float,          # 0.0-1.0 keyword coverage
            "weighted_score": float,       # 0.0-1.0 weighted by category importance
            "coverage_percent": int,       # 0-100
            "matched_count": int,
            "required_count": int,
        }
        """
        if not jd_skills:
            return self._empty_result()

        resume_lower = {s.lower(): s for s in resume_skills}
        jd_lower = {s.lower(): s for s in jd_skills}

        matched = []
        missing = []

        for jd_skill_lower, jd_skill in jd_lower.items():
            # Direct match
            if jd_skill_lower in resume_lower:
                matched.append(jd_skill)
                continue

            # Fuzzy match via shared canonical form
            canonical = self._canonical_lookup.get(jd_skill_lower)
            if canonical:
                canonical_lower = canonical.lower()
                if canonical_lower in resume_lower:
                    matched.append(jd_skill)
                    continue

            # Partial match (e.g. "Python 3" matches "Python")
            partial_found = False
            for resume_skill_lower in resume_lower:
                if (jd_skill_lower in resume_skill_lower or
                        resume_skill_lower in jd_skill_lower):
                    matched.append(jd_skill)
                    partial_found = True
                    break

            if not partial_found:
                missing.append(jd_skill)

        extra = [
            s for s_lower, s in resume_lower.items()
            if s_lower not in jd_lower
        ]

        # Basic coverage score
        match_score = len(matched) / len(jd_skills) if jd_skills else 0.0

        # Weighted score — high-value categories count more
        weighted_score = self._calculate_weighted_score(matched, jd_skills)

        return {
            "matched_skills": sorted(matched),
            "missing_skills": sorted(missing),
            "extra_skills": sorted(extra),
            "match_score": round(match_score, 3),
            "weighted_score": round(weighted_score, 3),
            "coverage_percent": round(match_score * 100),
            "matched_count": len(matched),
            "required_count": len(jd_skills),
        }

    def _calculate_weighted_score(
        self, matched: list[str], required: list[str]
    ) -> float:
        """
        Weight matched skills higher if they belong to core technical categories.
        High-value category skills worth 1.5x, others worth 1.0x.
        """
        if not required:
            return 0.0

        total_weight = 0.0
        matched_weight = 0.0

        for skill in required:
            weight = self._get_skill_weight(skill)
            total_weight += weight
            if skill in matched:
                matched_weight += weight

        return matched_weight / total_weight if total_weight > 0 else 0.0

    def _get_skill_weight(self, skill: str) -> float:
        skill_lower = skill.lower()
        for category, terms in self.lexicon.items():
            if any(t.lower() == skill_lower for t in terms):
                return 1.5 if category in HIGH_VALUE_CATEGORIES else 1.0
        return 1.0

    def _empty_result(self) -> dict:
        return {
            "matched_skills": [],
            "missing_skills": [],
            "extra_skills": [],
            "match_score": 0.0,
            "weighted_score": 0.0,
            "coverage_percent": 0,
            "matched_count": 0,
            "required_count": 0,
        }


class JDSkillExtractor:
    """
    Extracts required skills from a raw Job Description text.
    Reuses the NERExtractor pipeline on JD text.

    Usage:
        extractor = JDSkillExtractor()
        jd_skills = extractor.extract(jd_text)
    """

    def __init__(self):
        # Lazy import to avoid circular dependency
        from nlp.ner_extractor import NERExtractor
        self._ner = NERExtractor()

    def extract(self, jd_text: str) -> dict:
        """
        Extract skills and requirements from a job description.

        Returns:
        {
            "required_skills": [...],
            "preferred_skills": [...],     # "nice to have" skills
            "skill_categories": {...},
            "seniority_level": str,        # junior/mid/senior/lead
            "job_title": str | None,
        }
        """
        # Wrap JD in a fake parsed-resume format for NERExtractor
        fake_parsed = {
            "raw_text": jd_text,
            "sections": {"skills": jd_text, "experience": jd_text},
        }
        entities = self._ner.extract(fake_parsed)

        # Separate required vs preferred skills
        required, preferred = self._split_required_preferred(
            jd_text, entities["skills"]
        )

        seniority = self._detect_seniority(jd_text)
        job_title = self._detect_job_title(jd_text, entities["designations"])

        return {
            "required_skills": required,
            "preferred_skills": preferred,
            "skill_categories": entities["skill_categories"],
            "seniority_level": seniority,
            "job_title": job_title,
        }

    def _split_required_preferred(
        self, jd_text: str, all_skills: list[str]
    ) -> tuple[list, list]:
        """
        Heuristic: skills mentioned near "preferred", "nice to have",
        "bonus", "plus" → preferred. All others → required.
        """
        preferred_keywords = r"(preferred|nice\s+to\s+have|bonus|plus|advantage|desirable)"

        # Find sentences containing preferred language
        sentences = re.split(r"[.\n]", jd_text)
        preferred_sentences = set()
        for i, sent in enumerate(sentences):
            if re.search(preferred_keywords, sent, re.IGNORECASE):
                preferred_sentences.add(i)

        preferred_skills = []
        required_skills = []

        jd_lower = jd_text.lower()
        for skill in all_skills:
            skill_lower = skill.lower()
            # Find which sentence the skill appears in
            found_in_preferred = False
            char_pos = jd_lower.find(skill_lower)
            if char_pos != -1:
                # Roughly map char pos to sentence index
                text_before = jd_text[:char_pos]
                approx_sent_idx = text_before.count(".") + text_before.count("\n")
                if approx_sent_idx in preferred_sentences:
                    found_in_preferred = True

            if found_in_preferred:
                preferred_skills.append(skill)
            else:
                required_skills.append(skill)

        return required_skills, preferred_skills

    def _detect_seniority(self, jd_text: str) -> str:
        text_lower = jd_text.lower()
        if any(w in text_lower for w in ["lead", "principal", "staff", "architect"]):
            return "lead"
        if any(w in text_lower for w in ["senior", "sr.", "sr ", "5+ years", "7+ years"]):
            return "senior"
        if any(w in text_lower for w in ["junior", "jr.", "jr ", "entry level", "entry-level", "graduate", "fresh"]):
            return "junior"
        if any(w in text_lower for w in ["mid", "mid-level", "3+ years", "2+ years"]):
            return "mid"
        return "unspecified"

    def _detect_job_title(
        self, jd_text: str, designations: list[str]
    ) -> Optional[str]:
        """Extract the primary job title from the JD."""
        # First try: look for explicit title field
        title_pattern = re.compile(
            r"(?:job\s+title|position|role)\s*[:\-]\s*(.+?)(?:\n|$)",
            re.IGNORECASE,
        )
        match = title_pattern.search(jd_text)
        if match:
            return match.group(1).strip()

        # Second try: first designation found
        if designations:
            return designations[0]

        # Third try: first line of JD
        first_line = jd_text.strip().split("\n")[0].strip()
        if len(first_line) < 80:
            return first_line

        return None