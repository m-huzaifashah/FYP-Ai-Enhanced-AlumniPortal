"""
report_builder.py
-----------------
Phase 6 — Final Report Builder

Assembles all pipeline outputs into a single clean, structured report
that the frontend renders. This is the final output of the microservice.

Output structure mirrors what the /analyze endpoint returns.
"""

import logging
from datetime import datetime, timezone

from reporting.suggestions import SuggestionsGenerator
from reporting.radar_chart  import RadarChartGenerator

logger = logging.getLogger(__name__)

# Singleton instances (created once per process)
_suggestions_gen  = SuggestionsGenerator()
_radar_gen        = RadarChartGenerator()


# ===========================================================================
# ReportBuilder
# ===========================================================================

class ReportBuilder:
    """
    Assembles the full analysis report from all pipeline outputs.

    Usage:
        builder = ReportBuilder()
        report  = builder.build(pipeline_outputs)
    """

    def build(self, pipeline: dict, job_description: str = "") -> dict:
        """
        Build the complete analysis report.

        Args:
            pipeline: output of main.full_pipeline()
                keys: parsed, entities, jd_entities, fmt_result, score_result
            job_description: raw JD text (for suggestions + keyword extraction)

        Returns the full report dict consumed by the /analyze endpoint.
        """
        parsed       = pipeline["parsed"]
        entities     = pipeline["entities"]
        jd_entities  = pipeline["jd_entities"]
        fmt_result   = pipeline["fmt_result"]
        score_result = pipeline["score_result"]

        # ── Generate suggestions ───────────────────────────────────────────
        suggestion_output = _suggestions_gen.generate(
            parsed_resume   = parsed,
            resume_entities = entities,
            jd_text         = job_description,
            jd_entities     = jd_entities,
            score_result    = score_result,
            fmt_result      = fmt_result,
        )

        # ── Generate radar chart ───────────────────────────────────────────
        radar_b64 = _radar_gen.generate(
            resume_entities = entities,
            jd_entities     = jd_entities,
            title           = "Skill Gap Analysis",
        )

        # ── Assemble report ────────────────────────────────────────────────
        report = {
            # ── Identity ────────────────────────────────────────────────────
            "filename":       parsed.get("filename", ""),
            "analyzed_at":    datetime.now(timezone.utc).isoformat(),

            # ── Score ────────────────────────────────────────────────────────
            "ats_score":      score_result["ats_score"],
            "grade":          score_result["grade"],
            "score_label":    self._score_label(score_result["ats_score"]),
            "score_potential": suggestion_output["score_potential"],

            # ── Score breakdown ──────────────────────────────────────────────
            "breakdown": {
                "semantic_score":   score_result["breakdown"]["semantic_score"],
                "keyword_score":    score_result["breakdown"]["keyword_score"],
                "formatting_score": score_result["breakdown"]["formatting_score"],
                "section_score":    score_result["breakdown"]["section_score"],
                "weights":          score_result["weights"],
            },

            # ── Skills ───────────────────────────────────────────────────────
            "skills": {
                "resume_skills":    entities.get("skills", []),
                "skill_categories": entities.get("skill_categories", {}),
                "matched_skills":   score_result["keyword_detail"].get("matched_skills", []),
                "missing_skills":   score_result["keyword_detail"].get("missing_skills", []),
                "jd_required":      jd_entities.get("required_skills", []),
                "jd_preferred":     jd_entities.get("preferred_skills", []),
                "coverage_percent": score_result["keyword_detail"].get(
                    "coverage_percent",
                    round((len(score_result["keyword_detail"].get("matched_skills", [])) /
                           max(len(jd_entities.get("required_skills", [])), 1)) * 100)
                ),
            },

            # ── Profile ──────────────────────────────────────────────────────
            "profile": {
                "degrees":           entities.get("degrees", []),
                "organizations":     entities.get("organizations", []),
                "designations":      entities.get("designations", []),
                "years_experience":  entities.get("years_experience"),
                "gpa":               entities.get("gpa"),
                "word_count":        parsed.get("word_count", 0),
                "has_contact_info":  parsed.get("has_contact_info", False),
                "is_scanned":        parsed.get("is_scanned", False),
                "sections_found":    [k for k, v in parsed.get("sections", {}).items() if v.strip()],
            },

            # ── JD Info ──────────────────────────────────────────────────────
            "job_description": {
                "seniority_level":  jd_entities.get("seniority_level", "unspecified"),
                "job_title":        jd_entities.get("job_title"),
                "top_keywords":     suggestion_output["jd_keywords"],
            },

            # ── Formatting ───────────────────────────────────────────────────
            "formatting": {
                "score":         fmt_result.get("formatting_score", 100),
                "issues":        fmt_result.get("issues", []),
                "passed_checks": fmt_result.get("passed_checks", []),
                "issue_count":   fmt_result.get("issue_count", 0),
            },

            # ── Suggestions ──────────────────────────────────────────────────
            "suggestions":  suggestion_output["suggestions"],
            "quick_wins":   suggestion_output["quick_wins"],

            # ── Semantic detail ──────────────────────────────────────────────
            "semantic": {
                "cosine_similarity":    score_result["semantic_detail"]["cosine_similarity"],
                "resume_length_tokens": score_result["semantic_detail"]["resume_length_tokens"],
                "jd_length_tokens":     score_result["semantic_detail"]["jd_length_tokens"],
            },

            # ── Visualization ────────────────────────────────────────────────
            "radar_chart_b64": radar_b64,  # base64 PNG or null

            # ── Parse warnings ───────────────────────────────────────────────
            "warnings": parsed.get("warnings", []),
        }

        logger.info(
            f"Report built | score={report['ats_score']} ({report['grade']}) | "
            f"suggestions={len(report['suggestions'])} | "
            f"radar={'yes' if radar_b64 else 'no'}"
        )

        return report

    def _score_label(self, score: int) -> str:
        if score >= 80: return "Excellent — High chance of passing ATS"
        if score >= 65: return "Good — Likely to pass ATS with minor improvements"
        if score >= 50: return "Average — Needs improvement to pass ATS"
        if score >= 35: return "Below Average — Significant changes needed"
        return "Poor — Resume needs major revision"