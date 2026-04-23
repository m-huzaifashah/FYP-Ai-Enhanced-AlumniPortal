"""
xgb_predictor.py
----------------
Phase 8 — XGBoost ATS Score Predictor (Inference)

Loads the trained XGBoost model + scaler and produces a blended
ATS score combining:

  final_score = (SBERT_score × 0.60) + (XGBoost_score × 0.40)

The XGBoost model acts as a calibration layer — it picks up on
structured signals (section presence, word count, seniority match,
formatting penalties) that SBERT alone cannot capture well.

If the model file is not found (not yet trained), it gracefully
falls back to the SBERT-based score from Phase 4.
"""

import logging
import numpy as np
import joblib
from pathlib import Path
from typing import Optional

from models.feature_extractor import ATSFeatureExtractor

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model file paths
# ---------------------------------------------------------------------------
MODELS_DIR    = Path(__file__).parent
MODEL_PATH    = MODELS_DIR / "xgb_ats_regressor.joblib"
SCALER_PATH   = MODELS_DIR / "feature_scaler.joblib"

# Blending weights
W_SBERT  = 0.60
W_XGB    = 0.40


class XGBPredictor:
    """
    Blended ATS score predictor.

    Combines the SBERT semantic score (Phase 4) with an XGBoost
    regression prediction (Phase 8) for a more calibrated final score.

    Usage:
        predictor = XGBPredictor()
        result    = predictor.predict(pipeline_outputs)
    """

    def __init__(self):
        self.feature_extractor = ATSFeatureExtractor()
        self._model  = None
        self._scaler = None
        self._model_available = False

        self._load_model()

    def _load_model(self):
        """Attempt to load trained model. Silently degrade if not found."""
        if MODEL_PATH.exists() and SCALER_PATH.exists():
            try:
                self._model  = joblib.load(MODEL_PATH)
                self._scaler = joblib.load(SCALER_PATH)
                self._model_available = True
                logger.info("XGBoost model loaded successfully.")
            except Exception as e:
                logger.warning(f"Failed to load XGBoost model: {e}. Using SBERT fallback.")
        else:
            logger.info(
                "XGBoost model not found. Run 'python models/train_xgb.py' to train. "
                "Using SBERT-only score in the meantime."
            )

    def predict(
        self,
        parsed:       dict,
        entities:     dict,
        jd_entities:  dict,
        score_result: dict,
        fmt_result:   dict,
    ) -> dict:
        """
        Produce blended ATS score.

        Args:
            parsed, entities, jd_entities: from pipeline phases 2/3
            score_result: from SemanticScorer (Phase 4)
            fmt_result:   from FormatChecker  (Phase 4)

        Returns:
        {
            "final_score":      int,         # blended 0–100
            "final_grade":      str,         # A/B/C/D/F
            "sbert_score":      int,         # Phase 4 SBERT score
            "xgb_score":        int | None,  # XGBoost prediction
            "blend_weights":    dict,        # {"sbert": 0.6, "xgb": 0.4}
            "model_used":       str,         # "blended" | "sbert_only"
            "feature_vector":   dict,        # named feature values (for debugging)
            "confidence":       str,         # "high" | "medium" | "low"
        }
        """
        sbert_score = score_result.get("ats_score", 0)

        # Extract features regardless (useful for logging/debug)
        try:
            feature_vector = self.feature_extractor.extract(
                parsed, entities, jd_entities, score_result, fmt_result
            )
            feature_dict = self.feature_extractor.vector_to_dict(feature_vector)
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}", exc_info=True)
            feature_vector = None
            feature_dict   = {}

        # ── XGBoost prediction ────────────────────────────────────────────
        xgb_score    = None
        model_used   = "sbert_only"
        final_score  = sbert_score

        if self._model_available and feature_vector is not None:
            try:
                X_scaled   = self._scaler.transform(feature_vector.reshape(1, -1))
                xgb_raw    = float(self._model.predict(X_scaled)[0])
                xgb_score  = int(np.clip(round(xgb_raw), 0, 100))

                # Blend: weighted average
                blended    = (W_SBERT * sbert_score) + (W_XGB * xgb_score)
                final_score = int(np.clip(round(blended), 0, 100))
                model_used  = "blended"

                logger.info(
                    f"XGB Prediction | sbert={sbert_score} xgb={xgb_score} "
                    f"blended={final_score}"
                )

            except Exception as e:
                logger.error(f"XGBoost inference failed: {e}. Falling back to SBERT score.")
                final_score = sbert_score
                model_used  = "sbert_only"

        # ── Confidence ────────────────────────────────────────────────────
        confidence = self._assess_confidence(
            parsed, entities, feature_dict, model_used
        )

        return {
            "final_score":    final_score,
            "final_grade":    self._grade(final_score),
            "sbert_score":    sbert_score,
            "xgb_score":      xgb_score,
            "blend_weights":  {
                "sbert": W_SBERT if model_used == "blended" else 1.0,
                "xgb":   W_XGB   if model_used == "blended" else 0.0,
            },
            "model_used":     model_used,
            "feature_vector": feature_dict,
            "confidence":     confidence,
        }

    # -----------------------------------------------------------------------
    # Feature importance for explainability
    # -----------------------------------------------------------------------

    def get_feature_importance(self) -> Optional[dict]:
        """
        Returns XGBoost feature importances sorted by importance.
        Returns None if model not available.
        """
        if not self._model_available:
            return None

        try:
            from models.train_xgb import FEATURE_NAMES
            importances = self._model.feature_importances_
            feat_imp = dict(zip(FEATURE_NAMES, importances.tolist()))
            return dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))
        except Exception as e:
            logger.error(f"Could not get feature importances: {e}")
            return None

    def get_score_explanation(self, feature_dict: dict) -> list[dict]:
        """
        Returns a human-readable explanation of what's driving the score up or down.
        Used for explainable AI (XAI) in the final report.
        """
        if not feature_dict:
            return []

        explanations = []

        # Positive drivers
        if feature_dict.get("semantic_cosine", 0) >= 0.7:
            explanations.append({
                "driver": "Strong semantic match with JD",
                "direction": "positive",
                "value": round(feature_dict["semantic_cosine"], 2),
            })

        if feature_dict.get("keyword_coverage", 0) >= 0.7:
            explanations.append({
                "driver": "Good keyword coverage",
                "direction": "positive",
                "value": round(feature_dict["keyword_coverage"] * 100),
            })

        if feature_dict.get("has_quantified_achiev", 0) == 1.0:
            explanations.append({
                "driver": "Quantified achievements detected",
                "direction": "positive",
                "value": None,
            })

        if feature_dict.get("seniority_match", 0) == 1.0:
            explanations.append({
                "driver": "Experience level matches JD seniority",
                "direction": "positive",
                "value": None,
            })

        # Negative drivers
        if feature_dict.get("is_scanned", 0) == 1.0:
            explanations.append({
                "driver": "Scanned PDF — ATS cannot read it",
                "direction": "negative",
                "value": None,
            })

        if feature_dict.get("format_penalty_norm", 0) >= 0.3:
            explanations.append({
                "driver": "High formatting penalty",
                "direction": "negative",
                "value": round(feature_dict["format_penalty_norm"] * 60),
            })

        if feature_dict.get("keyword_coverage", 0) < 0.4:
            explanations.append({
                "driver": "Low keyword coverage — many JD skills missing",
                "direction": "negative",
                "value": round(feature_dict["keyword_coverage"] * 100),
            })

        if feature_dict.get("missing_required_norm", 0) > 0:
            missing_count = round(feature_dict["missing_required_norm"] * 3)
            explanations.append({
                "driver": f"{missing_count} required section(s) missing",
                "direction": "negative",
                "value": missing_count,
            })

        if feature_dict.get("word_count_norm", 0) < 0.25:  # < 150 words
            explanations.append({
                "driver": "Resume is too short",
                "direction": "negative",
                "value": round(feature_dict["word_count_norm"] * 600),
            })

        return explanations

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _grade(self, score: int) -> str:
        if score >= 80: return "A"
        if score >= 65: return "B"
        if score >= 50: return "C"
        if score >= 35: return "D"
        return "F"

    def _assess_confidence(
        self,
        parsed:       dict,
        entities:     dict,
        feature_dict: dict,
        model_used:   str,
    ) -> str:
        """
        Assess how confident we are in the score.
        High confidence = rich resume data available.
        """
        if parsed.get("is_scanned") or not parsed.get("raw_text"):
            return "low"

        signals = [
            parsed.get("word_count", 0) > 200,
            len(entities.get("skills", [])) >= 5,
            bool(parsed.get("sections", {}).get("experience")),
            bool(parsed.get("sections", {}).get("education")),
            model_used == "blended",
        ]
        score = sum(signals)

        if score >= 4: return "high"
        if score >= 2: return "medium"
        return "low"

    @property
    def is_model_available(self) -> bool:
        return self._model_available