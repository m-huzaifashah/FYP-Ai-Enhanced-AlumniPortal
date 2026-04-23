"""
train_xgb.py
------------
Phase 8 — XGBoost ATS Score Regressor — Training Script

Usage:
    # Synthetic (default, works immediately)
    python models/train_xgb.py

    # Your real CSV (recommended)
    python models/train_xgb.py --real --csv path/to/data.csv

    # Small real dataset — mix with synthetic
    python models/train_xgb.py --real --csv data.csv --augment
"""

import json
import logging
import argparse
import numpy as np
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing   import StandardScaler
from sklearn.metrics          import mean_absolute_error, mean_squared_error, r2_score
from xgboost                  import XGBRegressor

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR    = Path(__file__).parent
MODEL_PATH    = MODELS_DIR / "xgb_ats_regressor.joblib"
SCALER_PATH   = MODELS_DIR / "feature_scaler.joblib"
FEATURES_PATH = MODELS_DIR / "feature_names.json"

FEATURE_NAMES = [
    "semantic_cosine",        "keyword_coverage",        "weighted_keyword_score",
    "section_count",          "has_experience",           "has_education",
    "has_skills",             "has_summary",              "has_projects",
    "has_certifications",     "word_count_norm",          "years_experience_norm",
    "has_gpa",                "gpa_norm",                 "skill_count_norm",
    "jd_skill_count_norm",    "missing_required_norm",    "format_penalty_norm",
    "seniority_match",        "is_scanned",               "has_contact_info",
    "action_verb_present",    "has_quantified_achiev",
]
N_FEATURES = len(FEATURE_NAMES)


def synthetic_dataset(n_samples=5000, seed=42):
    rng = np.random.default_rng(seed)
    rows, scores = [], []
    for _ in range(n_samples):
        q        = rng.beta(2, 2)
        sem      = float(np.clip(rng.normal(q*0.75, 0.12), 0, 1))
        kw       = float(np.clip(rng.normal(q*0.80, 0.15), 0, 1))
        wt       = float(np.clip(kw * rng.uniform(0.85, 1.1), 0, 1))
        ns       = int(rng.choice([2,3,4,5,6,7], p=[0.05,0.1,0.2,0.3,0.25,0.1]))
        he,hd,hs = int(ns>=3), int(ns>=2), int(ns>=3)
        hsum     = int(ns>=4 and rng.random()>0.3)
        hpr      = int(ns>=5 and rng.random()>0.35)
        hce      = int(ns>=6 and rng.random()>0.5)
        wc       = int(np.clip(rng.normal(q*500+100, 120), 50, 1200))
        yrs      = int(rng.choice([0,1,2,3,4,5,6,8,10], p=[0.15,0.1,0.15,0.15,0.15,0.1,0.1,0.07,0.03]))
        hg       = int(rng.random()>0.45)
        gn       = float(rng.uniform(0.6,1.0)) if hg else 0.0
        sk       = float(np.clip(rng.normal(q*0.7,0.15), 0, 1))
        jsk      = float(rng.uniform(0.2,0.8))
        mr       = max(0, 3-(he+hd+hs))
        isc      = int(rng.random()<0.08)
        fp       = min((isc*30+mr*10+int(rng.random()<0.15)*15+int(rng.random()<0.10)*10+int(wc<150)*8)/60, 1.0)
        hc       = int(not isc and rng.random()>0.08)
        sm       = int(rng.random()>0.4)
        av       = int(he and rng.random()>0.25)
        hq       = int(he and rng.random()>0.4)
        raw      = (sem*45+kw*25+(1-fp)*15+(1-mr/3)*15+hsum*3+hpr*3+hce*2+hq*3+av*2+sm*2+gn*3-isc*25-(1-hc)*8)
        score    = float(np.clip(raw + rng.normal(0,3.5), 0, 100))
        rows.append([sem,kw,wt,ns,he,hd,hs,hsum,hpr,hce,wc/600,yrs/10,hg,gn,sk,jsk,mr/3,fp,sm,isc,hc,av,hq])
        scores.append(score)
    return np.array(rows, dtype=np.float32), np.array(scores, dtype=np.float32)


def real_dataset(csv_path: str):
    import pandas as pd
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    if "ats_score" in df.columns and all(f in df.columns for f in FEATURE_NAMES):
        logger.info("Format A detected — pre-processed feature CSV")
        X = df[FEATURE_NAMES].values.astype(np.float32)
        y = df["ats_score"].values.astype(np.float32)
    elif "label_score" in df.columns and "resume_text" in df.columns:
        logger.info("Format B detected — raw CSV, auto-processing...")
        from models.real_dataset_loader import load_real_dataset
        X, y = load_real_dataset(csv_path)
    else:
        raise ValueError(
            "Unrecognized CSV format.\n"
            "  Format A: 23 feature columns + 'ats_score'\n"
            "  Format B: 'resume_text', 'job_description', ..., 'label_score'"
        )

    assert X.shape[1] == N_FEATURES, f"Expected {N_FEATURES} features, got {X.shape[1]}"
    assert np.all(np.isfinite(X)), "NaN/Inf in feature matrix"
    logger.info(f"Real dataset ready: {X.shape} | score [{y.min():.1f}, {y.max():.1f}] | mean={y.mean():.1f}")
    return X, y


def augment_with_synthetic(X_real, y_real, weight=0.3):
    n_syn = int(len(X_real) * weight / (1 - weight))
    if n_syn < 50:
        return X_real, y_real
    logger.info(f"Augmenting {len(X_real)} real + {n_syn} synthetic samples")
    X_s, y_s = synthetic_dataset(n_samples=n_syn)
    return np.vstack([X_real, X_s]), np.concatenate([y_real, y_s])


def train(use_real=False, csv_path=None, augment=False):
    logger.info("=" * 55)
    logger.info(f"  XGBoost Training — {'REAL DATA' if use_real else 'SYNTHETIC'}")
    logger.info("=" * 55)

    if use_real and csv_path:
        X, y = real_dataset(csv_path)
        if augment and len(X) < 500:
            X, y = augment_with_synthetic(X, y, weight=0.3)
    else:
        logger.info("Generating synthetic dataset...")
        X, y = synthetic_dataset(n_samples=5000)

    logger.info(f"Total samples: {len(X)}")

    test_size = 0.15 if len(X) >= 100 else 0.2
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=test_size, random_state=42)

    scaler   = StandardScaler()
    X_tr_s   = scaler.fit_transform(X_tr)
    X_te_s   = scaler.transform(X_te)

    max_depth    = 4 if len(X) < 300 else 5
    n_estimators = 200 if len(X) < 300 else 400

    model = XGBRegressor(
        n_estimators=n_estimators, max_depth=max_depth,
        learning_rate=0.05, subsample=0.85, colsample_bytree=0.85,
        min_child_weight=3, reg_alpha=0.2, reg_lambda=1.5,
        objective="reg:squarederror", eval_metric="rmse",
        early_stopping_rounds=30, random_state=42, n_jobs=-1, verbosity=0,
    )
    model.fit(X_tr_s, y_tr, eval_set=[(X_te_s, y_te)], verbose=False)
    logger.info(f"Best iteration: {model.best_iteration}")

    n_splits = 5 if len(X) >= 100 else 3
    cv = cross_val_score(
        XGBRegressor(n_estimators=model.best_iteration or n_estimators,
                     max_depth=max_depth, learning_rate=0.05,
                     random_state=42, verbosity=0),
        scaler.transform(X), y,
        scoring="neg_mean_absolute_error", cv=KFold(n_splits=n_splits, shuffle=True, random_state=42),
    )
    logger.info(f"{n_splits}-Fold CV MAE: {-cv.mean():.2f} ± {cv.std():.2f}")

    y_pred = np.clip(model.predict(X_te_s), 0, 100)
    mae    = mean_absolute_error(y_te, y_pred)
    rmse   = float(mean_squared_error(y_te, y_pred) ** 0.5)
    r2     = r2_score(y_te, y_pred)

    logger.info(f"\n── Test Metrics ──────────────────────────────")
    logger.info(f"  MAE  : {mae:.2f}  (avg pts off)")
    logger.info(f"  RMSE : {rmse:.2f}")
    logger.info(f"  R²   : {r2:.4f}")

    feat_imp = sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: x[1], reverse=True)
    logger.info(f"\n── Top 10 Feature Importances ────────────────")
    for f, imp in feat_imp[:10]:
        logger.info(f"  {f:<35} {imp:.4f}  {'█' * int(imp*200)}")

    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    with open(FEATURES_PATH, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    logger.info(f"\n  Saved → {MODEL_PATH}")

    return model, scaler, {"mae": mae, "rmse": rmse, "r2": r2}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--real",    action="store_true")
    ap.add_argument("--csv",     type=str, default=None)
    ap.add_argument("--augment", action="store_true")
    args = ap.parse_args()
    if args.real and not args.csv:
        ap.error("--csv required with --real")
    train(use_real=args.real, csv_path=args.csv, augment=args.augment)