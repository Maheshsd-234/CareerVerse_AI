"""
scripts/calibrate_retrieval.py
──────────────────────────────
Relevance score calibration tool for CareerVerse AI RAG retrieval.

Usage
─────
    cd backend/python
    python -m scripts.calibrate_retrieval

What it does
────────────
1. Queries your active Qdrant collection with a curated test suite of:
   - In-Domain Queries (direct exam, degree, salary, and career questions)
   - Conversational Follow-up Queries (pronoun/context dependent questions)
   - Off-Topic Queries (unrelated non-career questions)
2. Prints per-query similarity scores and best matched documents.
3. Calculates summary percentiles (Min, Max, Mean, Median) for each group
   so you can choose the optimal `RETRIEVAL_MIN_SCORE` in `.env`.
"""
from __future__ import annotations

import asyncio
import logging
import statistics
import sys
from pathlib import Path
from typing import List, NamedTuple

# Allow running as `python -m scripts.calibrate_retrieval`
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.store import RagStore

logging.basicConfig(level=logging.WARNING)


class QueryCase(NamedTuple):
    query: str
    category: str  # "In-Domain", "Follow-up", "Off-Topic"


TEST_QUERIES: List[QueryCase] = [
    # ── In-Domain Queries ─────────────────────────────────────────────────────
    QueryCase("What is the eligibility criteria and exam pattern for JEE Advanced?", "In-Domain"),
    QueryCase("NEET UG marking scheme and total marks", "In-Domain"),
    QueryCase("What is KCET exam and who can write it in Karnataka?", "In-Domain"),
    QueryCase("GATE exam eligibility and benefits for PSU recruitment", "In-Domain"),
    QueryCase("CAT exam syllabus and top IIM selection criteria", "In-Domain"),
    QueryCase("Software engineer salary in India for freshers vs seniors", "In-Domain"),
    QueryCase("How to become an AI ML engineer after B.Tech in India?", "In-Domain"),
    QueryCase("What career options are available after 12th science PCB?", "In-Domain"),
    QueryCase("Campus placement preparation guide and resume tips", "In-Domain"),
    QueryCase("Difference between B.Tech CSE and Information Technology", "In-Domain"),

    # ── Follow-up Style Queries ───────────────────────────────────────────────
    QueryCase("What is the registration fee for it?", "Follow-up"),
    QueryCase("How much does this role pay on average?", "Follow-up"),
    QueryCase("What are the minimum marks needed to qualify?", "Follow-up"),
    QueryCase("Which colleges accept this score?", "Follow-up"),

    # ── Off-Topic Queries ─────────────────────────────────────────────────────
    QueryCase("How to bake a chocolate cake at home?", "Off-Topic"),
    QueryCase("What is the capital of France and its population?", "Off-Topic"),
    QueryCase("How to fix a flat tyre on a mountain bicycle?", "Off-Topic"),
    QueryCase("Explain the quantum mechanics of black holes", "Off-Topic"),
    QueryCase("Who won the FIFA World Cup in 2022?", "Off-Topic"),
    QueryCase("Recipe for authentic South Indian masala dosa", "Off-Topic"),
]


async def run_calibration() -> None:
    print("\n" + "=" * 95)
    print(" [*] CareerVerse AI -- Retrieval Score Calibration")
    print("=" * 95)
    print(" Connecting to vector store...")

    store = RagStore()
    try:
        await store.ensure_collection()
    except Exception as exc:
        print(f"\n[X] Error connecting to Qdrant: {exc}")
        print("Please ensure Qdrant is running or check your QDRANT_URL in .env")
        return

    print("\nRunning queries against live collection...\n")
    print(f"{'#':<3} {'Type':<12} {'Score':>7}  {'Query':<42} {'Matched Document':<26}")
    print("-" * 95)

    scores_by_type: dict[str, list[float]] = {
        "In-Domain": [],
        "Follow-up": [],
        "Off-Topic": [],
    }

    for i, case in enumerate(TEST_QUERIES, start=1):
        try:
            results = await store.search(case.query, top_k=1)
            if results:
                top_hit = results[0]
                score = top_hit.score
                title = top_hit.title or top_hit.doc_id
            else:
                score = 0.0
                title = "(No Match)"
        except Exception as exc:
            score = 0.0
            title = f"Error: {exc}"

        scores_by_type[case.category].append(score)

        query_display = (case.query[:39] + "...") if len(case.query) > 42 else case.query
        title_display = (title[:23] + "...") if len(title) > 26 else title

        print(f"{i:<3} {case.category:<12} {score:>7.4f}  {query_display:<42} {title_display:<26}")

    # ── Summary Statistics ────────────────────────────────────────────────────
    print("\n" + "=" * 95)
    print(" [=] Score Distribution Summary")
    print("=" * 95)
    print(f"{'Category':<15} {'Count':>6} {'Min':>8} {'Max':>8} {'Mean':>8} {'Median':>8}")
    print("-" * 95)

    for cat_name, scores in scores_by_type.items():
        if scores:
            min_s = min(scores)
            max_s = max(scores)
            mean_s = statistics.mean(scores)
            med_s = statistics.median(scores)
            print(f"{cat_name:<15} {len(scores):>6} {min_s:>8.4f} {max_s:>8.4f} {mean_s:>8.4f} {med_s:>8.4f}")
        else:
            print(f"{cat_name:<15} {0:>6} {'-':>8} {'-':>8} {'-':>8} {'-':>8}")

    print("=" * 95)
    print("\n Recommendation for RETRIEVAL_MIN_SCORE:")
    if scores_by_type["In-Domain"] and scores_by_type["Off-Topic"]:
        in_min = min(scores_by_type["In-Domain"])
        off_max = max(scores_by_type["Off-Topic"])
        print(f"   - Lowest In-Domain score:   {in_min:.4f}")
        print(f"   - Highest Off-Topic score:  {off_max:.4f}")
        if in_min > off_max:
            suggested = round((in_min + off_max) / 2, 2)
            print(f"   - Clear separation gap found! A threshold of ~{suggested:.2f} cleanly separates them.")
        else:
            print(f"   - Overlap detected between edge cases. Consider a threshold around ~0.45 - 0.55.")
    print("   Update RETRIEVAL_MIN_SCORE=<value> in your backend/python/.env file.\n")


if __name__ == "__main__":
    asyncio.run(run_calibration())
