"""
radar_chart.py
--------------
Phase 5 — Skill Gap Radar Chart Generator

Generates a radar/spider chart comparing the candidate's skills
against the JD's required skill clusters. Returns a base64-encoded
PNG that can be embedded directly in the API response and rendered
on the frontend.
"""

import io
import base64
import logging
import math
from typing import Optional

import matplotlib
matplotlib.use("Agg")   # Non-interactive backend (server-safe)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

logger = logging.getLogger(__name__)

# Skill categories to display on the radar chart
# Maps category key → display label
RADAR_CATEGORIES = {
    "programming_languages": "Languages",
    "web_frontend":          "Frontend",
    "web_backend":           "Backend",
    "databases":             "Databases",
    "devops_cloud":          "DevOps/Cloud",
    "machine_learning_ai":   "ML/AI",
    "data_science":          "Data Science",
    "mobile":                "Mobile",
    "testing":               "Testing",
    "version_control":       "Version Control",
}

# Chart styling
RESUME_COLOR = "#4F8EF7"    # Blue
JD_COLOR     = "#F76B4F"    # Orange-red
BG_COLOR     = "#0F1117"    # Dark background
GRID_COLOR   = "#2A2D3E"
TEXT_COLOR   = "#E8E8E8"


class RadarChartGenerator:
    """
    Generates a radar chart comparing resume skill coverage
    against job description requirements.

    Usage:
        gen = RadarChartGenerator()
        b64_png = gen.generate(resume_entities, jd_entities)
    """

    def generate(
        self,
        resume_entities: dict,
        jd_entities:     dict,
        title:           str = "Skill Gap Analysis",
    ) -> Optional[str]:
        """
        Generate the radar chart and return as base64 PNG string.

        Args:
            resume_entities: from NERExtractor.extract()
            jd_entities:     from JDSkillExtractor.extract()
            title:           chart title

        Returns:
            base64-encoded PNG string, or None on failure.
        """
        try:
            resume_scores, jd_scores, labels = self._compute_scores(
                resume_entities, jd_entities
            )

            if not labels:
                logger.warning("No skill categories to plot.")
                return None

            return self._draw_chart(resume_scores, jd_scores, labels, title)

        except Exception as e:
            logger.error(f"Radar chart generation failed: {e}", exc_info=True)
            return None

    # -----------------------------------------------------------------------
    # Score computation
    # -----------------------------------------------------------------------

    def _compute_scores(
        self,
        resume_entities: dict,
        jd_entities:     dict,
    ) -> tuple[list, list, list]:
        """
        For each radar category:
          - JD score:     fraction of that category's skills in the JD  (0-100)
          - Resume score: fraction of that category's skills in resume  (0-100)

        Returns (resume_scores, jd_scores, labels)
        """
        resume_cats  = resume_entities.get("skill_categories", {})
        jd_required  = set(s.lower() for s in jd_entities.get("required_skills", []))
        jd_preferred = set(s.lower() for s in jd_entities.get("preferred_skills", []))
        jd_all       = jd_required | jd_preferred

        all_resume_skills = set(s.lower() for s in resume_entities.get("skills", []))

        labels         = []
        resume_scores  = []
        jd_scores      = []

        for cat_key, cat_label in RADAR_CATEGORIES.items():
            # Resume skills in this category
            resume_in_cat = set(
                s.lower() for s in resume_cats.get(cat_key, [])
            )

            # JD skills in this category (from jd_entities skill_categories)
            jd_cats       = jd_entities.get("skill_categories", {})
            jd_in_cat     = set(s.lower() for s in jd_cats.get(cat_key, []))

            # Only include categories where either the resume or JD has skills
            if not resume_in_cat and not jd_in_cat:
                continue

            labels.append(cat_label)

            # JD score: how many JD skills in this category does the JD require?
            # Normalize to 0-100 based on total JD skills in this category vs 5 (baseline)
            jd_score = min(100, (len(jd_in_cat) / max(len(jd_in_cat), 1)) * 100) if jd_in_cat else 0

            # Resume score: how many of the JD skills in this category does the resume have?
            if jd_in_cat:
                matched = resume_in_cat & jd_in_cat
                resume_score = (len(matched) / len(jd_in_cat)) * 100
            else:
                # No JD requirement — show resume skill breadth (0-100, max at 5 skills)
                resume_score = min(100, (len(resume_in_cat) / 5) * 100)
                jd_score     = 0

            resume_scores.append(round(resume_score))
            jd_scores.append(round(jd_score))

        return resume_scores, jd_scores, labels

    # -----------------------------------------------------------------------
    # Chart drawing
    # -----------------------------------------------------------------------

    def _draw_chart(
        self,
        resume_scores: list,
        jd_scores:     list,
        labels:        list,
        title:         str,
    ) -> str:
        N = len(labels)
        if N < 3:
            # Pad to at least 3 categories for a visible polygon
            while len(labels) < 3:
                labels.append("")
                resume_scores.append(0)
                jd_scores.append(0)
            N = len(labels)

        # Angles for each axis
        angles = [n / float(N) * 2 * math.pi for n in range(N)]
        angles += angles[:1]   # close the polygon

        resume_vals = resume_scores + resume_scores[:1]
        jd_vals     = jd_scores     + jd_scores[:1]

        # ── Figure setup ──────────────────────────────────────────────────
        fig = plt.figure(figsize=(7, 7), facecolor=BG_COLOR)
        ax  = fig.add_subplot(111, polar=True, facecolor=BG_COLOR)

        # ── Grid styling ──────────────────────────────────────────────────
        ax.set_facecolor(BG_COLOR)
        ax.spines["polar"].set_color(GRID_COLOR)
        ax.grid(color=GRID_COLOR, linewidth=0.8, linestyle="--", alpha=0.6)
        ax.set_yticks([20, 40, 60, 80, 100])
        ax.set_yticklabels(
            ["20", "40", "60", "80", "100"],
            color=TEXT_COLOR, fontsize=7, alpha=0.5
        )
        ax.set_ylim(0, 100)

        # ── Axis labels ───────────────────────────────────────────────────
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(
            labels,
            color=TEXT_COLOR,
            fontsize=9,
            fontweight="bold",
        )
        ax.tick_params(axis="x", pad=14)

        # ── JD requirements polygon ───────────────────────────────────────
        ax.plot(
            angles, jd_vals,
            color=JD_COLOR, linewidth=2,
            linestyle="solid", alpha=0.9,
        )
        ax.fill(angles, jd_vals, color=JD_COLOR, alpha=0.15)

        # ── Resume skills polygon ─────────────────────────────────────────
        ax.plot(
            angles, resume_vals,
            color=RESUME_COLOR, linewidth=2.5,
            linestyle="solid", alpha=0.95,
        )
        ax.fill(angles, resume_vals, color=RESUME_COLOR, alpha=0.25)

        # ── Data point dots ───────────────────────────────────────────────
        ax.scatter(angles[:-1], resume_scores, s=50, color=RESUME_COLOR, zorder=5)
        ax.scatter(angles[:-1], jd_scores,     s=40, color=JD_COLOR,     zorder=4, alpha=0.8)

        # ── Legend ────────────────────────────────────────────────────────
        legend_elements = [
            mpatches.Patch(facecolor=RESUME_COLOR, alpha=0.7, label="Your Resume"),
            mpatches.Patch(facecolor=JD_COLOR,     alpha=0.7, label="JD Requirements"),
        ]
        ax.legend(
            handles=legend_elements,
            loc="upper right",
            bbox_to_anchor=(1.35, 1.15),
            framealpha=0.2,
            edgecolor=GRID_COLOR,
            labelcolor=TEXT_COLOR,
            fontsize=9,
        )

        # ── Title ─────────────────────────────────────────────────────────
        fig.suptitle(
            title,
            color=TEXT_COLOR,
            fontsize=13,
            fontweight="bold",
            y=0.98,
        )

        # ── Export to base64 ──────────────────────────────────────────────
        buf = io.BytesIO()
        plt.savefig(
            buf,
            format="png",
            dpi=150,
            bbox_inches="tight",
            facecolor=BG_COLOR,
        )
        plt.close(fig)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return b64