import json
import logging
import argparse
import numpy as np
import joblib
from pathlib import Path
from collections import defaultdict
import random

try:
    from lightgbm import LGBMRanker
except ImportError:
    LGBMRanker = None

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR    = Path(__file__).parent
MODEL_PATH    = MODELS_DIR / "lgbm_ats_ranker.joblib"

# Using the strict 12-dimensional schema defined in feature_builder.py
FEATURE_NAMES = [
    "semantic_score", 
    "skill_coverage_ratio", 
    "skill_precision",
    "missing_critical_skills", 
    "skill_category_diversity", 
    "semantic_title_match",
    "experience_years_norm", 
    "experience_seniority_match",
    "management_score", 
    "degree_match_score", 
    "education_level_score",
    "structural_completeness"
]
N_FEATURES = len(FEATURE_NAMES)

def generate_mock_pointwise_dataset(n_jds=50, max_resumes_per_jd=50):
    """
    Generates synthetic JD groups for LambdaRank training.
    In LambdaRank, the dataset must be pointwise (X, y) with a 'group' array
    so the model can generate its own intra-JD pairs natively.
    """
    X, y, groups = [], [], []
    
    for jd_idx in range(n_jds):
        num_resumes = random.randint(10, max_resumes_per_jd)
        groups.append(num_resumes)
        
        for r_idx in range(num_resumes):
            # Synthetic features mimicking the 12-dim feature builder output
            feats = np.random.uniform(0, 1, size=(N_FEATURES,))
            # Hardcode some logical correlations for the ranking relevance (y)
            relevance_proxy = (
                0.4 * feats[0] +  # semantic score
                0.3 * feats[1] +  # coverage
                0.2 * feats[6] +  # exp match
                0.1 * feats[11]   # completeness
            )
            # Relevance must be an integer or grade for LambdaRank (e.g., 0 to 4)
            relevance_grade = int(np.clip(relevance_proxy * 5, 0, 4))
            
            X.append(feats)
            y.append(relevance_grade)
            
    return np.array(X), np.array(y), np.array(groups)


def train_ranker():
    logger.info("=" * 60)
    logger.info("  Training LGBMRanker (LambdaRank) — Production ATS")
    logger.info("=" * 60)

    if not LGBMRanker:
        logger.error("lightgbm is not installed. Run: pip install lightgbm")
        return

    # 1. Generate/Load Dataset
    # Split train/val by JD (Group), NOT by rows!
    X_train, y_train, groups_train = generate_mock_pointwise_dataset(n_jds=80)
    X_val, y_val, groups_val = generate_mock_pointwise_dataset(n_jds=20)
    
    logger.info(f"Train JDs: {len(groups_train)} | Train Resumes: {len(X_train)}")
    logger.info(f"Val JDs:   {len(groups_val)} | Val Resumes:   {len(X_val)}")

    # 2. Production LGBMRanker Configuration
    model = LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        ndcg_eval_at=[1, 3, 5, 10],  # Strongly penalize top-3 errors
        learning_rate=0.05,
        n_estimators=800,
        max_depth=6,
        num_leaves=31,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )

    # 3. Fit Model with Early Stopping
    logger.info("Starting LambdaRank Training...")
    
    model.fit(
        X_train,
        y_train,
        group=groups_train,
        eval_set=[(X_val, y_val)],
        eval_group=[groups_val],
        callbacks=[] # Add early stopping callback here if desired (early_stopping(30))
    )

    # 4. Save Artifacts
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    logger.info(f"\nSaved ranker model → {MODEL_PATH}")

    # 5. Evaluate and Log Feature Importance
    feat_imp = sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: x[1], reverse=True)
    logger.info("\n── Feature Importances (LambdaRank) ──")
    for f, imp in feat_imp:
        logger.info(f"  {f:<30} {imp}")

if __name__ == "__main__":
    train_ranker()
