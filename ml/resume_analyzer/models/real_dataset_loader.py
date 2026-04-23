"""
real_dataset_loader.py
----------------------
Loads and processes the REAL dataset CSV into the 23-feature vector
format that train_xgb.py expects.

Your CSV columns:
  resume_text         — raw resume text
  job_description     — raw JD text
  resume_skills       — list as string e.g. "['python', 'sql', 'java']"
  jd_skills           — list as string
  matched_skills      — list as string
  missing_skills      — list as string
  semantic_similarity — float 0–1 (this IS your cosine similarity)
  skill_overlap_ratio — float 0–1 (matched / total jd skills)
  embedding_distance  — float (1 - cosine, so 1 - semantic_similarity)
  resume_length       — int (word count of resume)
  jd_length           — int (word count of JD)
  label_score         — float 0–1  ← YOUR GROUND TRUTH (we scale to 0–100)

Run:
    python models/real_dataset_loader.py --csv your_data.csv
    # Outputs: models/real_training_data.csv  (ready for train_xgb.py)
"""

import ast
import re
import json
import logging
import argparse
import numpy as np
import pandas as pd
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Must match FEATURE_NAMES in train_xgb.py exactly ──────────────────────
FEATURE_NAMES = [
    "semantic_cosine",
    "keyword_coverage",
    "weighted_keyword_score",
    "section_count",
    "has_experience",
    "has_education",
    "has_skills",
    "has_summary",
    "has_projects",
    "has_certifications",
    "word_count_norm",
    "years_experience_norm",
    "has_gpa",
    "gpa_norm",
    "skill_count_norm",
    "jd_skill_count_norm",
    "missing_required_norm",
    "format_penalty_norm",
    "seniority_match",
    "is_scanned",
    "has_contact_info",
    "action_verb_present",
    "has_quantified_achiev",
]

# ── Action verbs for experience quality check ──────────────────────────────
ACTION_VERBS = [
    "developed", "designed", "implemented", "built", "created", "led",
    "managed", "architected", "optimized", "improved", "reduced",
    "increased", "delivered", "launched", "deployed", "integrated",
    "automated", "migrated", "engineered", "resolved", "streamlined",
    "established", "spearheaded", "achieved", "exceeded", "collaborated",
]

# ── Section heading patterns ───────────────────────────────────────────────
SECTION_PATTERNS = {
    "experience":     r"\b(experience|employment|work history|internship|career)\b",
    "education":      r"\b(education|academic|degree|qualification|university|college)\b",
    "skills":         r"\b(skills|technical skills|competencies|technologies|tools)\b",
    "summary":        r"\b(summary|objective|profile|about me|overview)\b",
    "projects":       r"\b(projects|portfolio|personal projects|academic projects)\b",
    "certifications": r"\b(certification|certificate|licenses?|courses?)\b",
}

# ── Quantifiable achievement patterns ─────────────────────────────────────
ACHIEVEMENT_PATTERNS = [
    r"\d+%",
    r"\$[\d,]+",
    r"\d+\s*(?:million|billion|k\b)",
    r"(?:reduced|improved|increased|saved|generated)\s+by\s+\d+",
    r"\d+\s*(?:users|clients|customers|projects|teams|members)",
]

# ── Seniority detection ────────────────────────────────────────────────────
SENIORITY_MAP = {
    "junior":  (0, 2),
    "mid":     (2, 5),
    "senior":  (5, 9),
    "lead":    (7, 99),
}


# ===========================================================================
# Feature engineering functions
# ===========================================================================

def parse_skill_list(raw) -> list:
    """Safely parse a skill list from string representation."""
    if isinstance(raw, list):
        return [str(s).strip().lower() for s in raw]
    if isinstance(raw, float) or raw is None:
        return []
    try:
        parsed = ast.literal_eval(str(raw))
        return [str(s).strip().lower() for s in parsed]
    except Exception:
        # Fallback: split by comma
        cleaned = str(raw).strip("[]'\" ")
        return [s.strip().strip("'\"") for s in cleaned.split(",") if s.strip()]


def detect_sections(text: str) -> dict:
    """Detect which sections are present in the resume text."""
    text_lower = text.lower()
    return {
        sec: bool(re.search(pattern, text_lower))
        for sec, pattern in SECTION_PATTERNS.items()
    }


def extract_years_experience(text: str) -> int:
    """Extract years of professional experience from text."""
    patterns = [
        r"(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience",
        r"(\d+)\+?\s*years?\s+experience",
        r"experience\s+of\s+(\d+)\+?\s*years?",
        r"(\d+)\+?\s*yrs?\s+(?:of\s+)?experience",
    ]
    found = []
    for p in patterns:
        for m in re.findall(p, text, re.IGNORECASE):
            try:
                found.append(int(m))
            except ValueError:
                pass

    # Date range heuristic
    import datetime
    cur = datetime.datetime.now().year
    for m in re.finditer(r"(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|present|current|now)", text, re.IGNORECASE):
        start = int(m.group(1))
        end_s = m.group(2).lower()
        end = cur if end_s in ("present", "current", "now") else int(end_s)
        dur = end - start
        if 0 < dur < 40:
            found.append(dur)

    return max(found) if found else 0


def extract_gpa(text: str):
    """Extract GPA/CGPA from text. Returns (score, out_of) or None."""
    patterns = [
        r"(?:cgpa|gpa)\s*[:\-]?\s*(\d+\.?\d*)\s*/\s*(\d+\.?\d*)",
        r"(\d+\.\d+)\s*/\s*4(?:\.0)?",
        r"(\d+\.\d+)\s*/\s*5(?:\.0)?",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            try:
                score  = float(m.group(1))
                out_of = float(m.group(2)) if m.lastindex >= 2 else 4.0
                if 0 < score <= out_of:
                    return score, out_of
            except Exception:
                pass
    return None


def detect_seniority(jd_text: str) -> str:
    t = jd_text.lower()
    if any(w in t for w in ["lead", "principal", "staff", "architect"]):
        return "lead"
    if any(w in t for w in ["senior", "sr.", "5+ years", "7+ years"]):
        return "senior"
    if any(w in t for w in ["junior", "entry level", "entry-level", "fresh", "graduate"]):
        return "junior"
    if any(w in t for w in ["mid", "3+ years", "2+ years"]):
        return "mid"
    return "unspecified"


def seniority_match(years_exp: int, jd_text: str) -> float:
    level = detect_seniority(jd_text)
    low, high = SENIORITY_MAP.get(level, (0, 99))
    if low <= years_exp <= high:
        return 1.0
    if (years_exp >= low - 1) and (years_exp <= high + 1):
        return 0.5
    return 0.0


def has_contact_info(text: str) -> bool:
    email = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    phone = r"(\+?\d[\d\s\-().]{7,}\d)"
    return bool(re.search(email, text)) or bool(re.search(phone, text))


def compute_format_penalty(text: str, sections: dict) -> float:
    """
    Estimate formatting penalty score (0–1, normalized at 60 pts).
    Works on raw text without the full FormatChecker pipeline.
    """
    penalty = 0
    word_count = len(text.split())

    # Missing required sections
    for sec in ["experience", "education", "skills"]:
        if not sections.get(sec):
            penalty += 10

    # No contact info
    if not has_contact_info(text):
        penalty += 10

    # Too short
    if word_count < 150:
        penalty += 8

    # No action verbs
    text_lower = text.lower()
    if not any(v in text_lower for v in ACTION_VERBS):
        penalty += 5

    # No quantified achievements
    if not any(re.search(p, text, re.IGNORECASE) for p in ACHIEVEMENT_PATTERNS):
        penalty += 5

    return min(penalty / 60.0, 1.0)


def weighted_keyword_score(
    matched: list, resume_skills: list, jd_skills: list
) -> float:
    """
    Compute a weighted keyword score.
    Technical skills weighted 1.5x, others 1.0x.
    """
    TECHNICAL_INDICATORS = {
        "python", "java", "javascript", "typescript", "c++", "go", "rust",
        "django", "react", "node", "fastapi", "spring", "docker", "kubernetes",
        "aws", "gcp", "azure", "sql", "postgresql", "mongodb", "redis",
        "tensorflow", "pytorch", "spark", "kafka", "git", "ci/cd",
    }

    if not jd_skills:
        return 0.0

    total_w   = 0.0
    matched_w = 0.0

    for skill in jd_skills:
        w = 1.5 if any(t in skill.lower() for t in TECHNICAL_INDICATORS) else 1.0
        total_w += w
        if skill in matched:
            matched_w += w

    return matched_w / total_w if total_w > 0 else 0.0


# ===========================================================================
# Main feature builder
# ===========================================================================

def build_features(row: pd.Series) -> np.ndarray:
    """
    Convert one CSV row into the 23-feature vector.
    Maps your existing columns + derives the rest from raw text.
    """
    resume_text = str(row.get("resume_text", ""))
    jd_text     = str(row.get("job_description", ""))

    # ── Parse list columns ────────────────────────────────────────────────
    resume_skills  = parse_skill_list(row.get("resume_skills",  []))
    jd_skills      = parse_skill_list(row.get("jd_skills",      []))
    matched_skills = parse_skill_list(row.get("matched_skills", []))
    missing_skills = parse_skill_list(row.get("missing_skills", []))

    # ── [0] Semantic cosine — directly from your column ───────────────────
    semantic_cosine = float(row.get("semantic_similarity", 0.0))
    semantic_cosine = max(0.0, min(1.0, semantic_cosine))

    # ── [1] Keyword coverage — directly from your column ─────────────────
    keyword_coverage = float(row.get("skill_overlap_ratio", 0.0))
    keyword_coverage = max(0.0, min(1.0, keyword_coverage))

    # ── [2] Weighted keyword score — derived ──────────────────────────────
    wt_kw = weighted_keyword_score(matched_skills, resume_skills, jd_skills)

    # ── [3] Section count + [4–9] section flags ───────────────────────────
    sections     = detect_sections(resume_text)
    section_count = float(sum(sections.values()))
    has_exp   = float(sections["experience"])
    has_edu   = float(sections["education"])
    has_skl   = float(sections["skills"])
    has_sum   = float(sections["summary"])
    has_proj  = float(sections["projects"])
    has_cert  = float(sections["certifications"])

    # ── [10] Word count normalized ────────────────────────────────────────
    wc_raw = int(row.get("resume_length", len(resume_text.split())))
    wc_norm = min(wc_raw / 600.0, 2.0)

    # ── [11] Years experience normalized ─────────────────────────────────
    yrs      = extract_years_experience(resume_text)
    yrs_norm = min(yrs / 10.0, 1.5)

    # ── [12–13] GPA ───────────────────────────────────────────────────────
    gpa_result = extract_gpa(resume_text)
    has_gpa    = float(gpa_result is not None)
    gpa_norm   = (gpa_result[0] / gpa_result[1]) if gpa_result else 0.0

    # ── [14] Skill count normalized ───────────────────────────────────────
    skill_cnt_norm = min(len(resume_skills) / 20.0, 2.0)

    # ── [15] JD skill count normalized ───────────────────────────────────
    jd_skill_norm = min(len(jd_skills) / 20.0, 2.0)

    # ── [16] Missing required sections normalized ─────────────────────────
    missing_req  = sum(1 for s in ["experience", "education", "skills"] if not sections[s])
    missing_norm = missing_req / 3.0

    # ── [17] Format penalty normalized ───────────────────────────────────
    fmt_penalty_norm = compute_format_penalty(resume_text, sections)

    # ── [18] Seniority match ──────────────────────────────────────────────
    sen_match = seniority_match(yrs, jd_text)

    # ── [19] Is scanned (not detectable from text — assume 0) ────────────
    is_scanned = 0.0   # CSV data is already text, so not scanned

    # ── [20] Has contact info ─────────────────────────────────────────────
    has_contact = float(has_contact_info(resume_text))

    # ── [21] Action verb present ──────────────────────────────────────────
    rt_lower = resume_text.lower()
    action_verb = float(any(v in rt_lower for v in ACTION_VERBS))

    # ── [22] Quantified achievements ─────────────────────────────────────
    has_quant = float(
        any(re.search(p, resume_text, re.IGNORECASE) for p in ACHIEVEMENT_PATTERNS)
    )

    return np.array([
        semantic_cosine, keyword_coverage, wt_kw,
        section_count,
        has_exp, has_edu, has_skl, has_sum, has_proj, has_cert,
        wc_norm, yrs_norm, has_gpa, gpa_norm,
        skill_cnt_norm, jd_skill_norm,
        missing_norm, fmt_penalty_norm,
        sen_match, is_scanned, has_contact,
        action_verb, has_quant,
    ], dtype=np.float32)


# ===========================================================================
# Main loader
# ===========================================================================

def load_real_dataset(csv_path: str) -> tuple:
    """
    Load the CSV, build feature matrix and label array.

    Returns:
        X : np.ndarray (n_samples, 23)
        y : np.ndarray (n_samples,)  — ATS scores 0–100
    """
    logger.info(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)

    logger.info(f"Raw shape: {df.shape}")
    logger.info(f"Columns: {list(df.columns)}")

    # ── Validate required columns ─────────────────────────────────────────
    required = [
        "resume_text", "job_description",
        "resume_skills", "jd_skills",
        "matched_skills", "missing_skills",
        "semantic_similarity", "skill_overlap_ratio",
        "resume_length", "label_score",
    ]
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing columns in CSV: {missing_cols}")

    # ── Drop rows with null label ─────────────────────────────────────────
    before = len(df)
    df = df.dropna(subset=["label_score"])
    dropped = before - len(df)
    if dropped > 0:
        logger.warning(f"Dropped {dropped} rows with null label_score")

    # ── Scale label: your labels are 0–1, model expects 0–100 ────────────
    label_max = df["label_score"].max()
    if label_max <= 1.0:
        logger.info(f"label_score range [{df['label_score'].min():.3f}, {label_max:.3f}] → scaling to 0–100")
        df["label_score"] = df["label_score"] * 100.0
    else:
        logger.info(f"label_score already in 0–100 range [{df['label_score'].min():.1f}, {label_max:.1f}]")

    # ── Build feature matrix ──────────────────────────────────────────────
    logger.info("Building feature vectors...")
    rows  = []
    skipped = 0

    for idx, row in df.iterrows():
        try:
            vec = build_features(row)
            if not np.all(np.isfinite(vec)):
                logger.warning(f"Row {idx}: non-finite values, skipping")
                skipped += 1
                continue
            rows.append(vec)
        except Exception as e:
            logger.warning(f"Row {idx}: error building features: {e}")
            skipped += 1

    if skipped > 0:
        logger.warning(f"Skipped {skipped} rows due to errors")

    # Align labels with successfully processed rows
    valid_mask = []
    for idx, row in df.iterrows():
        try:
            vec = build_features(row)
            valid_mask.append(np.all(np.isfinite(vec)))
        except Exception:
            valid_mask.append(False)

    df_valid = df[valid_mask].reset_index(drop=True)

    X = np.array(rows, dtype=np.float32)
    y = df_valid["label_score"].values.astype(np.float32)

    logger.info(f"Final dataset: X={X.shape}, y={y.shape}")
    logger.info(f"Label range: [{y.min():.1f}, {y.max():.1f}]  mean={y.mean():.1f}  std={y.std():.1f}")

    return X, y


def save_processed_csv(csv_path: str, output_path: str):
    """
    Save the processed feature matrix as a CSV for inspection.
    """
    X, y = load_real_dataset(csv_path)
    df_out = pd.DataFrame(X, columns=FEATURE_NAMES)
    df_out["ats_score"] = y
    df_out.to_csv(output_path, index=False)
    logger.info(f"Saved processed features to: {output_path}")
    return df_out


# ===========================================================================
# CLI
# ===========================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process real dataset CSV for XGBoost training")
    parser.add_argument("--csv",    required=True,  help="Path to your raw CSV file")
    parser.add_argument("--output", default="models/real_training_data.csv",
                        help="Where to save the processed feature CSV")
    parser.add_argument("--analyze", action="store_true",
                        help="Print detailed dataset analysis")
    args = parser.parse_args()

    df_out = save_processed_csv(args.csv, args.output)

    if args.analyze:
        print("\n── Feature Statistics ──────────────────────────────────")
        print(df_out.describe().round(3).to_string())
        print("\n── Label Distribution ──────────────────────────────────")
        bins = [0, 20, 35, 50, 65, 80, 100]
        labels = ["F (0-20)", "D (20-35)", "C (35-50)", "B (50-65)", "B+ (65-80)", "A (80-100)"]
        df_out["grade_band"] = pd.cut(df_out["ats_score"], bins=bins, labels=labels)
        print(df_out["grade_band"].value_counts().sort_index().to_string())

    print(f"\nProcessed CSV saved to: {args.output}")
    print("Now run: python models/train_xgb.py --real --csv models/real_training_data.csv")