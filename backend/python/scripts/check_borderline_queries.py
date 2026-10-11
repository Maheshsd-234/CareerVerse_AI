"""
scripts/check_borderline_queries.py
───────────────────────────────────
Test the specified borderline queries against live Qdrant retrieval and report:
- Top similarity score
- Best matching document title & category
- Selected routing path
"""
import asyncio
import os
import sys

# Ensure backend/python is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.rag.store import RagStore
from app.routing.classifier import RouteIntent, classify_intent_fast
from app.routing.safety import check_crisis_language

QUERIES = [
    "how to stay focused for long hours",
    "how to manage exam stress",
    "how to build a resume",
    "what is the JEE Advanced 2027 cutoff for CSE at IIT Bombay",
    "hi",
    "how to bake a cake",
]

async def evaluate():
    cfg = get_settings()
    store = RagStore()
    
    thresholds = [0.45, 0.60, 0.70, 0.74]
    
    for t in thresholds:
        print("\n" + "=" * 105)
        print(f"BORDERLINE RETRIEVAL EVALUATION (RETRIEVAL_MIN_SCORE = {t:.2f})")
        print("=" * 105)
        print(f"{'Query':<55} | {'Top Score':<10} | {'Matched Doc':<22} | {'Route Chosen'}")
        print("-" * 105)

        for q in QUERIES:
            if check_crisis_language(q):
                print(f"{q:<55} | {'N/A':<10} | {'[Safety Net]':<22} | {RouteIntent.WELLBEING.value}")
                continue

            results = await store.search(query=q, top_k=3)
            top_score = results[0].score if results else 0.0
            top_doc = results[0].title if results else "None"

            if results and top_score >= t:
                route = RouteIntent.GROUNDED.value
            else:
                intent, _ = await classify_intent_fast(query=q)
                route = intent.value

            print(f"{q:<55} | {top_score:<10.4f} | {top_doc[:22]:<22} | {route}")

        print("=" * 105)

if __name__ == "__main__":
    asyncio.run(evaluate())
