import numpy as np
from typing import List, Dict, Any, Tuple
import random
import logging
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

MAX_RESUMES_PER_JD = 50
MAX_PAIRS_PER_JD = 1000
MAX_PAIR_OCCURRENCE_PER_RESUME = 20
COSINE_DEDUPLICATION_THRESHOLD = 0.98

class PairGenerator:
    """
    Production-grade Pair Generator for Hybrid ATS XGBoost LambdaRank.
    Enforces intra-JD comparisons, deduplication, and difficulty stratification.
    """
    
    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(self.seed)
        np.random.seed(self.seed)

    def _proxy_score(self, features: np.ndarray) -> float:
        """
        Heuristic proxy score solely for ordering the resume pool before pair generation.
        Feature indices based on v2.0 schema:
        0: semantic, 1: coverage, 6: exp_match, 10: section
        """
        return float(
            0.4 * features[0] +
            0.3 * features[1] +
            0.2 * features[6] +
            0.1 * features[10]
        )

    def _generate_jd_pairs(self, jd_id: str, resumes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generates balanced pairs for a single JD."""
        
        # Enforce max resumes per JD
        if len(resumes) > MAX_RESUMES_PER_JD:
            resumes = random.sample(resumes, MAX_RESUMES_PER_JD)
            
        n = len(resumes)
        if n < 2:
            return []

        # Sort resumes by proxy score descending
        for r in resumes:
            r['proxy_score'] = self._proxy_score(r['features'])
            
        resumes = sorted(resumes, key=lambda x: x['proxy_score'], reverse=True)

        buckets = {'easy': [], 'medium': [], 'hard': []}

        for i in range(n):
            for j in range(i + 1, n):
                res_a = resumes[i]
                res_b = resumes[j]

                # Hard constraints
                if res_a['resume_id'] == res_b['resume_id']:
                    continue
                if abs(res_a['proxy_score'] - res_b['proxy_score']) < 1e-6:
                    continue
                    
                # NaN check
                if np.isnan(res_a['features']).any() or np.isnan(res_b['features']).any():
                    continue

                # Deduplication check
                # Assuming 'embedding' is passed in the dict for semantic deduplication.
                # If missing, fall back to feature vector cosine.
                emb_a = res_a.get('embedding', res_a['features']).reshape(1, -1)
                emb_b = res_b.get('embedding', res_b['features']).reshape(1, -1)
                
                cos_sim = float(cosine_similarity(emb_a, emb_b)[0][0])
                if cos_sim > COSINE_DEDUPLICATION_THRESHOLD:
                    continue

                # Assign difficulty
                delta = j - i
                if delta >= 0.7 * n:
                    bucket = 'easy'
                elif delta >= 0.3 * n:
                    bucket = 'medium'
                else:
                    bucket = 'hard'
                    
                # Anti-Bias: Position shuffle
                if random.random() > 0.5:
                    pair = {
                        "jd_id": jd_id,
                        "resume_a_id": res_b["resume_id"],
                        "resume_b_id": res_a["resume_id"],
                        "features_a": res_b["features"],
                        "features_b": res_a["features"],
                        "label": 0,
                        "difficulty": bucket
                    }
                else:
                    pair = {
                        "jd_id": jd_id,
                        "resume_a_id": res_a["resume_id"],
                        "resume_b_id": res_b["resume_id"],
                        "features_a": res_a["features"],
                        "features_b": res_b["features"],
                        "label": 1,
                        "difficulty": bucket
                    }

                buckets[bucket].append(pair)

        # Stratified Sampling Strategy
        total_valid_pairs = sum(len(b) for b in buckets.values())
        target_total = min(total_valid_pairs, MAX_PAIRS_PER_JD)
        
        if target_total == 0:
            return []

        # Target counts
        t_easy = int(0.50 * target_total)
        t_medium = int(0.30 * target_total)
        t_hard = target_total - t_easy - t_medium

        # Shuffle pools
        for b in buckets.values():
            random.shuffle(b)

        selected_pairs = []
        resume_usage_count = defaultdict(int)

        def add_pairs(pool, target_count):
            added = 0
            for pair in pool:
                if added >= target_count:
                    break
                r_a = pair['resume_a_id']
                r_b = pair['resume_b_id']
                
                if (resume_usage_count[r_a] >= MAX_PAIR_OCCURRENCE_PER_RESUME or 
                    resume_usage_count[r_b] >= MAX_PAIR_OCCURRENCE_PER_RESUME):
                    continue
                    
                selected_pairs.append(pair)
                resume_usage_count[r_a] += 1
                resume_usage_count[r_b] += 1
                added += 1

        add_pairs(buckets['easy'], t_easy)
        add_pairs(buckets['medium'], t_medium)
        add_pairs(buckets['hard'], t_hard)

        return selected_pairs

    def generate_dataset(self, jd_to_resumes: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """
        Main entry point. 
        Input structure: { "jd_123": [ {"resume_id": "r1", "features": np.array(12), "embedding": np.array(384)}, ... ] }
        """
        full_dataset = []
        
        for jd_id, resumes in jd_to_resumes.items():
            jd_pairs = self._generate_jd_pairs(jd_id, resumes)
            full_dataset.extend(jd_pairs)
            
        logger.info(f"Generated {len(full_dataset)} total training pairs across {len(jd_to_resumes)} JDs.")
        
        if len(full_dataset) > 0:
            # Validation Layer
            easy_count = sum(1 for p in full_dataset if p['difficulty'] == 'easy')
            medium_count = sum(1 for p in full_dataset if p['difficulty'] == 'medium')
            hard_count = sum(1 for p in full_dataset if p['difficulty'] == 'hard')
            
            total = len(full_dataset)
            easy_ratio = easy_count / total
            medium_ratio = medium_count / total
            hard_ratio = hard_count / total
            
            logger.info(f"Difficulty Distribution - Easy: {easy_ratio:.2f}, Medium: {medium_ratio:.2f}, Hard: {hard_ratio:.2f}")
            
            # Note: Strict assertions relaxed slightly for small datasets, but logged.
            if abs(easy_ratio - 0.5) >= 0.1:
                logger.warning("Easy pair ratio deviated significantly from target 0.5.")
                
        return full_dataset
