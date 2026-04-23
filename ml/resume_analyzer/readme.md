# Resume Analyzer Microservice — v1.0.0

AI-powered ATS resume analyzer for the Alumni Portal FYP.

---

## Complete Project Structure

```
resume_analyzer/
├── main.py                          # FastAPI app — all endpoints
├── requirements.txt
│
├── parsers/
│   ├── __init__.py
│   └── resume_parser.py             # Phase 2 — PDF/DOCX ingestion
│
├── nlp/
│   ├── __init__.py
│   ├── ner_extractor.py             # Phase 3 — spaCy NER + PhraseMatcher
│   └── skill_matcher.py             # Phase 3 — Resume vs JD comparison
│
├── scoring/
│   ├── __init__.py
│   ├── semantic_scorer.py           # Phase 4 — SBERT + weighted score
│   └── format_checker.py            # Phase 4 — ATS formatting rules
│
├── reporting/
│   ├── __init__.py
│   ├── suggestions.py               # Phase 5 — YAKE! + suggestions engine
│   ├── radar_chart.py               # Phase 5 — Skill gap radar chart
│   └── report_builder.py            # Phase 6 — Final report assembler
│
├── data/
│   └── skills_lexicon.json          # 500+ categorized industry skills
│
└── tests/
    ├── test_parser.py               # Phase 2 tests (18 tests)
    ├── test_ner.py                  # Phase 3 tests (20 tests)
    ├── test_scoring.py              # Phase 4 tests (25 tests)
    └── test_suggestions.py          # Phase 5/6 tests (22 tests)
```

---

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download spaCy model
python -m spacy download en_core_web_lg

# 4. Run microservice
uvicorn main:app --reload --port 8001
```

API docs: `http://localhost:8001/docs`

---

## Endpoints

| Method | Endpoint       | Phase | Description |
|--------|----------------|-------|-------------|
| GET    | `/`            | —     | Health check |
| POST   | `/parse`       | 2     | Parse resume structure |
| POST   | `/extract`     | 3     | Extract NER entities |
| POST   | `/match-skills`| 3     | Resume vs JD skill gap |
| POST   | `/score`       | 4     | ATS score breakdown |
| POST   | `/analyze`     | 6     | **Full analysis — primary endpoint** |

---

## Primary Endpoint: POST /analyze

Your frontend/backend calls this single endpoint:

**Request (multipart/form-data):**
```
file:            resume.pdf  (or .docx)
job_description: "We are hiring a Python Django developer with Docker..."
```

**Response:**
```json
{
  "filename": "ali_resume.pdf",
  "analyzed_at": "2024-01-15T10:30:00Z",
  "ats_score": 74,
  "grade": "B",
  "score_label": "Good — Likely to pass ATS with minor improvements",
  "score_potential": 89,
  "breakdown": {
    "semantic_score": 71,
    "keyword_score": 75,
    "formatting_score": 85,
    "section_score": 70,
    "weights": { "semantic": 0.45, "keyword": 0.25, "formatting": 0.15, "sections": 0.15 }
  },
  "skills": {
    "resume_skills": ["Python", "Django", "React", "PostgreSQL"],
    "matched_skills": ["Python", "Django"],
    "missing_skills": ["Docker", "Redis"],
    "jd_required": ["Python", "Django", "Docker", "Redis"],
    "coverage_percent": 50
  },
  "profile": {
    "degrees": [{ "degree": "BSC", "field": "Computer Science" }],
    "organizations": ["FAST NUCES"],
    "years_experience": 3,
    "gpa": { "score": 3.7, "out_of": 4.0 }
  },
  "formatting": {
    "score": 85,
    "issues": [
      {
        "code": "no_action_verbs",
        "issue": "Experience section lacks strong action verbs.",
        "severity": "minor",
        "penalty": 5,
        "suggestion": "Start each bullet with: Developed, Built, Led..."
      }
    ]
  },
  "suggestions": [
    {
      "priority": "high",
      "category": "Missing Skills",
      "title": "Add 2 required skill(s) to your resume",
      "detail": "Missing: Docker, Redis",
      "example": "Add to Skills section:\n• Docker\n• Redis",
      "impact": "Improves keyword score from 50% to 100%"
    }
  ],
  "quick_wins": [
    "Add 2 required skill(s) to your resume",
    "Add quantifiable achievements to your experience"
  ],
  "radar_chart_b64": "iVBORw0KGgoAAAANS...",
  "warnings": []
}
```

---

## ATS Score Formula

```
ATS Score =
  SBERT Semantic Similarity  × 45%
+ Skill Keyword Coverage     × 25%
+ Formatting Compliance      × 15%
+ Section Completeness       × 15%
```

## Running Tests

```bash
# All tests
pytest tests/ -v

# Individual phase tests
pytest tests/test_parser.py     -v   # Phase 2
pytest tests/test_ner.py        -v   # Phase 3
pytest tests/test_scoring.py    -v   # Phase 4
pytest tests/test_suggestions.py -v  # Phase 5/6
```