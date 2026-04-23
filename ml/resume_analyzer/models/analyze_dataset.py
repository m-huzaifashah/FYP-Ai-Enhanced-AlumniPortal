"""
analyze_dataset.py
------------------
Exploratory Data Analysis for your real resume dataset.
Run this BEFORE training to understand your data quality.

Usage:
    python models/analyze_dataset.py --csv your_data.csv
"""

import ast
import re
import argparse
import logging
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def parse_list_col(val) -> list:
    if isinstance(val, list): return val
    if not val or (isinstance(val, float) and np.isnan(val)): return []
    try:
        return ast.literal_eval(str(val))
    except Exception:
        return []


def analyze(csv_path: str):
    df = pd.read_csv(csv_path)

    print("\n" + "="*60)
    print("  DATASET ANALYSIS REPORT")
    print("="*60)

    # ── 1. Basic info ──────────────────────────────────────────────────────
    print(f"\n[1] SHAPE")
    print(f"    Rows    : {len(df):,}")
    print(f"    Columns : {len(df.columns)}")
    print(f"    Columns : {list(df.columns)}")

    # ── 2. Missing values ──────────────────────────────────────────────────
    print(f"\n[2] MISSING VALUES")
    nulls = df.isnull().sum()
    for col, n in nulls[nulls > 0].items():
        print(f"    {col:<35} {n:>5} missing  ({n/len(df)*100:.1f}%)")
    if nulls.sum() == 0:
        print("    No missing values found.")

    # ── 3. Label distribution ──────────────────────────────────────────────
    print(f"\n[3] LABEL DISTRIBUTION (label_score)")
    if "label_score" in df.columns:
        y = df["label_score"].dropna()
        label_max = y.max()
        if label_max <= 1.0:
            print(f"    Range : [{y.min():.4f}, {y.max():.4f}]  (will be scaled ×100)")
            y = y * 100
        else:
            print(f"    Range : [{y.min():.1f}, {y.max():.1f}]")

        print(f"    Mean  : {y.mean():.2f}")
        print(f"    Median: {y.median():.2f}")
        print(f"    Std   : {y.std():.2f}")

        bins   = [0, 20, 35, 50, 65, 80, 101]
        labels = ["F (0–20)", "D (20–35)", "C (35–50)", "B (50–65)", "B+ (65–80)", "A (80–100)"]
        bands  = pd.cut(y, bins=bins, labels=labels, right=False)
        print(f"\n    Grade distribution:")
        for band, cnt in bands.value_counts().sort_index().items():
            pct = cnt / len(y) * 100
            bar = "█" * int(pct / 2)
            print(f"      {band:<15} {cnt:>5}  ({pct:.1f}%)  {bar}")

    # ── 4. Semantic similarity ─────────────────────────────────────────────
    print(f"\n[4] SEMANTIC SIMILARITY")
    if "semantic_similarity" in df.columns:
        ss = df["semantic_similarity"].dropna()
        print(f"    Range : [{ss.min():.4f}, {ss.max():.4f}]")
        print(f"    Mean  : {ss.mean():.4f}")
        print(f"    Std   : {ss.std():.4f}")

        low  = (ss < 0.3).sum()
        mid  = ((ss >= 0.3) & (ss < 0.6)).sum()
        high = (ss >= 0.6).sum()
        print(f"    Low   (<0.3) : {low:>5}  ({low/len(ss)*100:.1f}%)")
        print(f"    Mid  (0.3–0.6): {mid:>5}  ({mid/len(ss)*100:.1f}%)")
        print(f"    High  (>0.6) : {high:>5}  ({high/len(ss)*100:.1f}%)")

    # ── 5. Skill overlap ──────────────────────────────────────────────────
    print(f"\n[5] SKILL OVERLAP RATIO")
    if "skill_overlap_ratio" in df.columns:
        so = df["skill_overlap_ratio"].dropna()
        print(f"    Range : [{so.min():.4f}, {so.max():.4f}]")
        print(f"    Mean  : {so.mean():.4f}")
        print(f"    Zero overlap (0.0): {(so == 0).sum()} rows  ({(so==0).mean()*100:.1f}%)")
        print(f"    Full overlap (1.0): {(so == 1).sum()} rows  ({(so==1).mean()*100:.1f}%)")

    # ── 6. Resume length ──────────────────────────────────────────────────
    print(f"\n[6] RESUME LENGTH (words)")
    if "resume_length" in df.columns:
        rl = df["resume_length"].dropna()
        print(f"    Range : [{rl.min():.0f}, {rl.max():.0f}]")
        print(f"    Mean  : {rl.mean():.0f}")
        print(f"    Median: {rl.median():.0f}")
        short = (rl < 150).sum()
        ideal = ((rl >= 150) & (rl <= 800)).sum()
        long_ = (rl > 800).sum()
        print(f"    Short (<150 words): {short} ({short/len(rl)*100:.1f}%)")
        print(f"    Ideal (150–800)   : {ideal} ({ideal/len(rl)*100:.1f}%)")
        print(f"    Long  (>800 words): {long_} ({long_/len(rl)*100:.1f}%)")

    # ── 7. Skills analysis ────────────────────────────────────────────────
    print(f"\n[7] SKILLS ANALYSIS")
    if "resume_skills" in df.columns:
        all_skills = []
        for v in df["resume_skills"]:
            all_skills.extend(parse_list_col(v))
        skill_counts = pd.Series(all_skills).value_counts()
        print(f"    Unique skills in dataset : {len(skill_counts)}")
        print(f"    Top 15 resume skills:")
        for skill, cnt in skill_counts.head(15).items():
            bar = "█" * int(cnt / max(skill_counts) * 30)
            print(f"      {str(skill):<25} {cnt:>5}  {bar}")

    # ── 8. Matched vs missing ─────────────────────────────────────────────
    print(f"\n[8] MATCHED vs MISSING SKILLS")
    if "matched_skills" in df.columns and "missing_skills" in df.columns:
        matched_lens = df["matched_skills"].apply(lambda x: len(parse_list_col(x)))
        missing_lens = df["missing_skills"].apply(lambda x: len(parse_list_col(x)))
        print(f"    Avg matched skills per resume : {matched_lens.mean():.2f}")
        print(f"    Avg missing skills per resume : {missing_lens.mean():.2f}")
        print(f"    Resumes with 0 matches        : {(matched_lens == 0).sum()}")

    # ── 9. Correlation with label ─────────────────────────────────────────
    print(f"\n[9] FEATURE CORRELATIONS WITH label_score")
    numeric_cols = ["semantic_similarity", "skill_overlap_ratio",
                    "resume_length", "jd_length", "embedding_distance"]
    if "label_score" in df.columns:
        for col in numeric_cols:
            if col in df.columns:
                corr = df[col].corr(df["label_score"])
                direction = "↑" if corr > 0 else "↓"
                bar = "█" * int(abs(corr) * 30)
                print(f"    {col:<35} {corr:>+.4f}  {direction}  {bar}")

    # ── 10. Data quality warnings ─────────────────────────────────────────
    print(f"\n[10] DATA QUALITY WARNINGS")
    warnings = 0

    if len(df) < 100:
        print(f"    ⚠  Only {len(df)} rows — model may overfit. Use --augment flag.")
        warnings += 1

    if "label_score" in df.columns:
        y = df["label_score"].dropna()
        if y.max() <= 1.0:
            y = y * 100
        if y.std() < 8:
            print(f"    ⚠  Label std={y.std():.2f} is very low — not enough score diversity.")
            warnings += 1
        if (y > 90).mean() > 0.5:
            print(f"    ⚠  >50% of labels are >90 — possible label inflation.")
            warnings += 1
        if (y < 20).mean() > 0.5:
            print(f"    ⚠  >50% of labels are <20 — possible label deflation.")
            warnings += 1

    if "semantic_similarity" in df.columns:
        ss = df["semantic_similarity"].dropna()
        if ss.max() > 1.0 or ss.min() < 0.0:
            print(f"    ⚠  semantic_similarity out of [0,1] range!")
            warnings += 1

    if warnings == 0:
        print("    ✓ No major data quality issues found.")

    # ── 11. Recommended next steps ────────────────────────────────────────
    print(f"\n[11] RECOMMENDED NEXT STEPS")
    if len(df) < 300:
        print(f"    → Your dataset has {len(df)} rows. Use --augment to mix with synthetic data:")
        print(f"       python models/train_xgb.py --real --csv your_data.csv --augment")
    else:
        print(f"    → Dataset size looks good ({len(df)} rows). Train directly:")
        print(f"       python models/train_xgb.py --real --csv your_data.csv")

    print(f"\n    → To pre-process and inspect feature matrix:")
    print(f"       python models/real_dataset_loader.py --csv {csv_path} --analyze")

    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="Path to your dataset CSV")
    args = ap.parse_args()
    analyze(args.csv)