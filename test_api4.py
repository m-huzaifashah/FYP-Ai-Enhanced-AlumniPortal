import sys
sys.path.append("/home/huzafia/Desktop/alumni portal/ml/resume_analyzer")
from scoring.semantic_scorer import SemanticScorer

scorer = SemanticScorer()
print("Using fallback?", scorer.model is None)
