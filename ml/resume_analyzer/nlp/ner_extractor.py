"""
ner_extractor.py
----------------
Phase 3 — NLP Feature Extraction

Uses a two-pronged approach from the research paper:
  1. spaCy NER — extracts DEGREE, ORG, DESIGNATION, DATE entities
  2. Hybrid PhraseMatcher — catches skill variants
     (ReactJS = React.js = React → normalized to "React")

Outputs a clean structured entity dict ready for the scoring engine.
"""

import re
import json
import logging
from pathlib import Path
from typing import Optional

import spacy
from spacy.matcher import PhraseMatcher, Matcher
from spacy.tokens import Doc

logger = logging.getLogger(__name__)

# Path to lexicon
LEXICON_PATH = Path(__file__).parent.parent / "data" / "skills_lexicon.json"

# ---------------------------------------------------------------------------
# Skill alias map — maps variants → canonical form
# This is the "Hybrid Matching" layer from the paper
# ---------------------------------------------------------------------------
SKILL_ALIASES = {
    # React variants
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",

    # Node variants
    "nodejs": "Node.js",
    "node js": "Node.js",
    "node": "Node.js",

    # Vue variants
    "vuejs": "Vue.js",
    "vue js": "Vue.js",

    # Angular variants
    "angularjs": "Angular",
    "angular js": "Angular",
    "angular 2+": "Angular",

    # Next.js
    "nextjs": "Next.js",
    "next js": "Next.js",

    # Express
    "expressjs": "Express",
    "express.js": "Express",

    # Kubernetes
    "k8s": "Kubernetes",

    # Machine Learning
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "artificial intelligence": "Artificial Intelligence",

    # NLP
    "natural language processing": "NLP",

    # sklearn
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",

    # Databases
    "mongo": "MongoDB",
    "mongo db": "MongoDB",
    "postgres": "PostgreSQL",
    "postgressql": "PostgreSQL",
    "mysql server": "MySQL",
    "mssql": "SQL Server",
    "ms sql": "SQL Server",

    # Cloud
    "amazon web services": "AWS",
    "google cloud platform": "GCP",
    "google cloud": "GCP",
    "microsoft azure": "Azure",

    # CSS frameworks
    "tailwind": "Tailwind CSS",
    "bootstrap 5": "Bootstrap",
    "material-ui": "Material UI",
    "mui": "Material UI",

    # TypeScript
    "ts": "TypeScript",
    "js": "JavaScript",

    # CI/CD
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    "continuous delivery": "CI/CD",

    # PyTorch
    "pytorch": "PyTorch",
    "torch": "PyTorch",

    # TensorFlow
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",

    # Flutter
    "flutter dart": "Flutter",

    # C variants
    "c plus plus": "C++",
    "cplusplus": "C++",
    "c sharp": "C#",
    "csharp": "C#",
    "dotnet": ".NET",
    "dot net": ".NET",
    "asp.net core": "ASP.NET",
    "asp net": "ASP.NET",

    # Spring
    "spring framework": "Spring",
    "spring mvc": "Spring",
    "springboot": "Spring Boot",

    # Testing
    "tdd": "Test Driven Development",
    "bdd": "Behavior Driven Development",
    "e2e testing": "End-to-End Testing",
    "end to end testing": "End-to-End Testing",

    # Misc
    "rest apis": "REST API",
    "restful apis": "REST API",
    "restful api": "REST API",
    "restful": "REST API",
    "graphql api": "GraphQL",
    "git hub": "GitHub",
    "git lab": "GitLab",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "ui ux": "UI/UX",
    "ui/ux design": "UI/UX",
    "full stack": "Full Stack Developer",
    "fullstack": "Full Stack Developer",
    "front end": "Frontend Developer",
    "back end": "Backend Developer",
    "devops": "DevOps",
    "dev ops": "DevOps",
}

# ---------------------------------------------------------------------------
# Patterns for extracting years of experience from text
# e.g. "3+ years of experience", "5 years experience", "2 years"
# ---------------------------------------------------------------------------
EXPERIENCE_PATTERNS = [
    r"(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience",
    r"(\d+)\+?\s*years?\s+experience",
    r"experience\s+of\s+(\d+)\+?\s*years?",
    r"(\d+)\+?\s*yrs?\s+(?:of\s+)?experience",
]

# Patterns for GPA / CGPA
GPA_PATTERNS = [
    r"(?:cgpa|gpa|grade\s+point)\s*[:\-]?\s*(\d+\.?\d*)\s*/\s*(\d+\.?\d*)",
    r"(\d+\.\d+)\s*/\s*4(?:\.0)?",
    r"(\d+\.\d+)\s*/\s*5(?:\.0)?",
]


# ===========================================================================
# NERExtractor — Main Class
# ===========================================================================

class NERExtractor:
    """
    Extracts structured entities from normalized resume text.

    Entities extracted:
      - skills         : list of normalized skill names
      - degrees        : list of detected academic degrees
      - organizations  : list of companies/universities
      - designations   : list of job titles
      - years_experience: int or None
      - gpa            : dict {"score": float, "out_of": float} or None
      - languages      : list of programming + spoken languages detected
      - skill_categories: dict mapping category → list of skills

    Usage:
        extractor = NERExtractor()
        entities = extractor.extract(parsed_resume_dict)
    """

    def __init__(self, spacy_model: str = "en_core_web_lg"):
        logger.info(f"Loading spaCy model: {spacy_model}")
        try:
            self.nlp = spacy.load(spacy_model)
        except OSError:
            logger.warning(
                f"Model '{spacy_model}' not found. Falling back to en_core_web_sm. "
                f"Run: python -m spacy download {spacy_model}"
            )
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning(
                    "No packaged spaCy model found. Falling back to blank English pipeline. "
                    "Run: python -m spacy download en_core_web_lg for better ORG/NER quality."
                )
                self.nlp = spacy.blank("en")

        self.lexicon = self._load_lexicon()
        self.phrase_matcher = self._build_phrase_matcher()
        self.rule_matcher = self._build_rule_matcher()

        logger.info(
            f"NERExtractor ready | "
            f"lexicon_skills={sum(len(v) for v in self.lexicon.values())} | "
            f"aliases={len(SKILL_ALIASES)}"
        )

    # -----------------------------------------------------------------------
    # Setup
    # -----------------------------------------------------------------------

    def _load_lexicon(self) -> dict:
        with open(LEXICON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def _build_phrase_matcher(self) -> PhraseMatcher:
        """
        Build a spaCy PhraseMatcher from the skills lexicon.
        LOWER attribute = case-insensitive matching.
        """
        matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")

        for category, terms in self.lexicon.items():
            # Skip non-skill categories for the PhraseMatcher
            skip = {"degree_keywords", "designation_keywords", "soft_skills"}
            if category in skip:
                continue
            patterns = [self.nlp.make_doc(term) for term in terms]
            matcher.add(category, patterns)

        return matcher

    def _build_rule_matcher(self) -> Matcher:
        """
        Rule-based Matcher for patterns like:
          - "X years of experience"
          - Degree patterns: "B.Sc in Computer Science"
          - Version numbers: "Python 3.10", "Java 17"
        """
        matcher = Matcher(self.nlp.vocab)

        # Pattern: number + "years" + optional "of" + "experience"
        matcher.add("YEARS_EXP", [
            [{"LIKE_NUM": True}, {"LOWER": {"IN": ["year", "years", "yr", "yrs"]}},
             {"LOWER": "of", "OP": "?"}, {"LOWER": "experience", "OP": "?"}],
        ])

        return matcher

    # -----------------------------------------------------------------------
    # Main extraction
    # -----------------------------------------------------------------------

    def extract(self, parsed_resume: dict) -> dict:
        """
        Main entry point.

        Args:
            parsed_resume: dict from ResumeParser.parse()

        Returns:
            {
                "skills": [...],
                "skill_categories": {...},
                "degrees": [...],
                "organizations": [...],
                "designations": [...],
                "years_experience": int | None,
                "gpa": {"score": float, "out_of": float} | None,
                "raw_entity_count": int
            }
        """
        raw_text = parsed_resume.get("raw_text", "")
        sections = parsed_resume.get("sections", {})

        # Focus skill extraction on the skills section + full text
        skills_text = sections.get("skills", "") + "\n" + raw_text
        exp_text = sections.get("experience", "") + "\n" + raw_text
        edu_text = sections.get("education", "") + "\n" + raw_text

        # --- Extract each entity type ---
        skills, skill_categories = self._extract_skills(skills_text)
        degrees = self._extract_degrees(edu_text)
        organizations = self._extract_organizations(raw_text)
        designations = self._extract_designations(raw_text, sections)
        years_exp = self._extract_years_experience(exp_text)
        gpa = self._extract_gpa(edu_text)

        total_entities = (
            len(skills) + len(degrees) + len(organizations) + len(designations)
        )

        logger.info(
            f"Extracted | skills={len(skills)} | degrees={len(degrees)} | "
            f"orgs={len(organizations)} | designations={len(designations)} | "
            f"years_exp={years_exp} | gpa={gpa}"
        )

        return {
            "skills": skills,
            "skill_categories": skill_categories,
            "degrees": degrees,
            "organizations": organizations,
            "designations": designations,
            "years_experience": years_exp,
            "gpa": gpa,
            "raw_entity_count": total_entities,
        }

    # -----------------------------------------------------------------------
    # Skills Extraction
    # -----------------------------------------------------------------------

    def _extract_skills(self, text: str) -> tuple[list, dict]:
        """
        Two-pronged extraction:
        1. PhraseMatcher on the lexicon
        2. Alias normalization for variants

        Returns (skills_list, skills_by_category)
        """
        doc = self.nlp(text[:50000])  # spaCy limit guard
        found_skills = {}  # canonical_name → category

        # --- Pass 1: PhraseMatcher ---
        matches = self.phrase_matcher(doc)
        for match_id, start, end in matches:
            category = self.nlp.vocab.strings[match_id]
            span_text = doc[start:end].text
            canonical = self._canonicalize(span_text)
            if canonical:
                found_skills[canonical] = category

        # --- Pass 2: Alias matching on lowercased text ---
        text_lower = text.lower()
        for alias, canonical in SKILL_ALIASES.items():
            if alias in text_lower:
                # Only add if the canonical form isn't already present
                if canonical not in found_skills:
                    category = self._get_category(canonical)
                    found_skills[canonical] = category

        # --- Pass 3: Token-level check for short known skills ---
        short_skills = {"R", "Go", "C", "SQL", "AWS", "GCP", "AI", "ML", "NLP"}
        tokens = set(token.text for token in doc if not token.is_stop)
        for skill in short_skills:
            if skill in tokens and skill not in found_skills:
                found_skills[skill] = self._get_category(skill)

        # Build category map
        skill_categories: dict[str, list] = {}
        for skill, cat in found_skills.items():
            skill_categories.setdefault(cat, []).append(skill)

        # Sort alphabetically within each category
        for cat in skill_categories:
            skill_categories[cat].sort()

        return sorted(found_skills.keys()), skill_categories

    def _canonicalize(self, raw: str) -> Optional[str]:
        """Normalize a matched skill to its canonical name."""
        lower = raw.lower().strip()

        # Check alias map first
        if lower in SKILL_ALIASES:
            return SKILL_ALIASES[lower]

        # Find exact match in lexicon (case-insensitive)
        for terms in self.lexicon.values():
            for term in terms:
                if term.lower() == lower:
                    return term  # Return the correctly-cased version

        # Return title-cased version as fallback
        return raw.strip() if raw.strip() else None

    def _get_category(self, skill: str) -> str:
        """Find which lexicon category a skill belongs to."""
        skill_lower = skill.lower()
        for category, terms in self.lexicon.items():
            if any(t.lower() == skill_lower for t in terms):
                return category
        return "other"

    # -----------------------------------------------------------------------
    # Degree Extraction
    # -----------------------------------------------------------------------

    def _extract_degrees(self, text: str) -> list[dict]:
        """
        Extract academic degrees with field of study.
        e.g. {"degree": "BSc", "field": "Computer Science", "institution": "FAST"}
        """
        degrees = []
        degree_keywords = self.lexicon.get("degree_keywords", [])

        # Pattern: degree + optional "in" + field
        degree_pattern = re.compile(
            r"(bachelor|master|b\.?sc?\.?|m\.?sc?\.?|b\.?e\.?|m\.?e\.?|"
            r"b\.?s\.?|m\.?s\.?|ph\.?d\.?|mba|bcs|mcs|be|me|bs|ms|hnd)"
            r"(?:\s+of|\s+in)?\s+"
            r"(?:science\s+in\s+|engineering\s+in\s+|arts?\s+in\s+)?"
            r"([a-z\s]+?)(?=\s*(?:from|at|,|\n|$|\())",
            re.IGNORECASE,
        )

        for match in degree_pattern.finditer(text):
            degree_abbr = match.group(1).strip()
            field = match.group(2).strip()

            # Clean up field
            field = re.sub(r"\s+", " ", field).title()
            if len(field) > 60 or len(field) < 3:
                continue

            degrees.append({
                "degree": degree_abbr.upper().replace(".", ""),
                "field": field,
            })

        # Deduplicate
        seen = set()
        unique_degrees = []
        for d in degrees:
            key = (d["degree"], d["field"])
            if key not in seen:
                seen.add(key)
                unique_degrees.append(d)

        return unique_degrees

    # -----------------------------------------------------------------------
    # Organization Extraction (spaCy NER)
    # -----------------------------------------------------------------------

    def _extract_organizations(self, text: str) -> list[str]:
        """Use spaCy's built-in ORG NER to extract companies/universities."""
        doc = self.nlp(text[:50000])
        orgs = set()

        for ent in doc.ents:
            if ent.label_ == "ORG":
                org_text = ent.text.strip()
                # Filter noise
                if (len(org_text) > 2 and
                    len(org_text) < 80 and
                    not org_text.isdigit() and
                    "\n" not in org_text):
                    orgs.add(org_text)

        return sorted(orgs)

    # -----------------------------------------------------------------------
    # Designation Extraction
    # -----------------------------------------------------------------------

    def _extract_designations(self, text: str, sections: dict) -> list[str]:
        """
        Extract job titles from experience section + spaCy NER.
        Cross-references with designation keywords from lexicon.
        """
        designations = set()
        designation_keywords = self.lexicon.get("designation_keywords", [])

        # Approach 1: Keyword matching in experience section
        exp_text = sections.get("experience", "") + "\n" + text
        exp_lower = exp_text.lower()

        for title in designation_keywords:
            if title.lower() in exp_lower:
                designations.add(title)

        # Approach 2: spaCy NER for PERSON-adjacent titles
        # (spaCy sometimes tags job titles under ORG or misses them)
        job_title_pattern = re.compile(
            r"(?:as\s+(?:a\s+|an\s+)?|worked\s+as\s+(?:a\s+|an\s+)?|"
            r"position\s*:\s*|role\s*:\s*|title\s*:\s*)"
            r"([A-Z][a-zA-Z\s/]+?)(?=\s*(?:at|@|,|\n|$))",
            re.MULTILINE,
        )
        for match in job_title_pattern.finditer(text):
            title = match.group(1).strip()
            if 3 < len(title) < 50:
                designations.add(title)

        return sorted(designations)

    # -----------------------------------------------------------------------
    # Years of Experience
    # -----------------------------------------------------------------------

    def _extract_years_experience(self, text: str) -> Optional[int]:
        """
        Extract total years of experience mentioned in the resume.
        Returns the highest number found (most likely total exp).
        """
        years_found = []

        for pattern in EXPERIENCE_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    years_found.append(int(match))
                except (ValueError, TypeError):
                    pass

        # Also try to infer from date ranges in experience section
        date_range_pattern = re.compile(
            r"(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|present|current|now)",
            re.IGNORECASE,
        )
        import datetime
        current_year = datetime.datetime.now().year

        for match in date_range_pattern.finditer(text):
            start_year = int(match.group(1))
            end_str = match.group(2).lower()
            end_year = current_year if end_str in ("present", "current", "now") else int(end_str)
            duration = end_year - start_year
            if 0 < duration < 40:
                years_found.append(duration)

        return max(years_found) if years_found else None

    # -----------------------------------------------------------------------
    # GPA Extraction
    # -----------------------------------------------------------------------

    def _extract_gpa(self, text: str) -> Optional[dict]:
        """Extract CGPA/GPA from education section."""
        for pattern in GPA_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    score = float(match.group(1))
                    out_of = float(match.group(2)) if match.lastindex >= 2 else 4.0
                    if 0 < score <= out_of:
                        return {"score": score, "out_of": out_of}
                except (ValueError, IndexError):
                    pass
        return None
