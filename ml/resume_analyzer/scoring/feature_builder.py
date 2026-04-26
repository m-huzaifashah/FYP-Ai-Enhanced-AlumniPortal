import numpy as np
import logging
from typing import Set, Dict, Any, Union

logger = logging.getLogger(__name__)

FEATURE_SCHEMA_VERSION = "v2.0"

class FeatureBuilder:
    """
    Constructs the 12-dimensional feature vector for the Hybrid ATS XGBoost model.
    Deterministic, pure function with strict bounds and clipping.
    """
    
    def __init__(self):
        pass

    def build_vector(
        self,
        semantic_score: float,
        matched_skills: Set[str],
        missing_required: Set[str],
        extra_skills: Set[str],
        resume_skills: Set[str],
        jd_skills: Set[str],
        required_years: float,
        resume_years: float,
        title_similarity: float,
        matched_mentions_count: int,
        total_words: int,
        section_score: float,
        format_score: float
    ) -> np.ndarray:
        """
        Builds and validates the exact 12-dimensional feature vector for XGBoost.
        """
        
        # 1. Semantic Layer
        v_semantic = float(semantic_score)
        
        # 2. Skill Matching Core
        num_jd = max(len(jd_skills), 1)
        v_coverage = len(matched_skills) / float(num_jd)
        
        num_resume = max(len(resume_skills), 1)
        v_precision = len(matched_skills) / float(num_resume)
        
        v_missing_critical = float(len(missing_required))
        v_extra = float(len(extra_skills))
        
        # 3. Experience Alignment
        v_exp_gap = max(0.0, float(required_years - resume_years))
        v_exp_match = min(resume_years / float(max(required_years, 1.0)), 1.0)
        
        # 4. Title/Role Similarity
        v_title_sim = float(title_similarity)
        
        # 5. Keyword Density Signals
        v_density = matched_mentions_count / float(max(total_words, 1))
        
        num_matched_mentions = max(matched_mentions_count, 1)
        v_diversity = len(matched_skills) / float(num_matched_mentions)
        
        # 6. Structural Signals
        v_section = float(section_score)
        v_format = float(format_score)
        
        # Assemble
        vector = np.array([
            v_semantic,           # 0
            v_coverage,           # 1
            v_precision,          # 2
            v_missing_critical,   # 3
            v_extra,              # 4
            v_exp_gap,            # 5
            v_exp_match,          # 6
            v_title_sim,          # 7
            v_density,            # 8
            v_diversity,          # 9
            v_section,            # 10
            v_format              # 11
        ], dtype=np.float32)
        
        # Hard Constraints (Clipping)
        # Bounded [0, 1] for indices 0, 1, 2, 6, 7, 8, 9, 10, 11
        clip_01_indices = [0, 1, 2, 6, 7, 8, 9, 10, 11]
        vector[clip_01_indices] = np.clip(vector[clip_01_indices], 0.0, 1.0)
        
        # Max bound counts
        vector[3] = min(vector[3], 20.0) # missing_critical
        vector[4] = min(vector[4], 50.0) # extra
        vector[5] = min(vector[5], 20.0) # exp_gap
        
        # NaN / Inf assertions
        assert not np.isnan(vector).any(), f"NaN found in feature vector: {vector}"
        assert np.isfinite(vector).all(), f"Inf found in feature vector: {vector}"
        
        # Feature Drift Logging
        logger.info(
            "Feature Vector v2.0 generated",
            extra={
                "features": {
                    "semantic": float(vector[0]),
                    "coverage": float(vector[1]),
                    "precision": float(vector[2]),
                    "missing_critical": int(vector[3]),
                    "extra_skills": int(vector[4]),
                    "experience_gap": float(vector[5]),
                    "title_similarity": float(vector[7])
                }
            }
        )
        
        # Reshape to (1, 12) to match XGBoost batch requirements
        return vector.reshape(1, -1)
