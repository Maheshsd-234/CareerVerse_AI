"""
scripts/ingest_samples.py
──────────────────────────
Ingest all sample documents in backend/python/sample_docs/ into Qdrant.

Usage
─────
    cd backend/python
    python -m scripts.ingest_samples

    # Run twice — unchanged docs are skipped automatically:
    python -m scripts.ingest_samples

What it does
────────────
1. Connects to Qdrant (configured via QDRANT_URL / QDRANT_API_KEY in .env).
2. Creates the collection if it doesn't exist.
3. Reads every .md file in sample_docs/.
4. Calls app.rag.ingest.ingest_document() for each file with structured metadata.
5. Prints a summary table showing chunks_created / chunks_skipped per document.

Idempotency
──────────
Running the script twice does NOT duplicate data.  If a document's text has not
changed since the last run, it is detected via content_hash and skipped entirely.
If the file changes, old vectors for that doc_id are deleted and fresh chunks
are upserted.
"""
from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

# Allow running as `python -m scripts.ingest_samples` from backend/python/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.ingest import ingest_document, IngestResult
from app.rag.store import RagStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("ingest_samples")

SAMPLE_DOCS_DIR = Path(__file__).parent.parent / "sample_docs"

# ── Document metadata ─────────────────────────────────────────────────────────
# Each entry maps a filename to its structured metadata.
# category: exam | degree | role | salary | roadmap | other
# stage:    school | puc | degree | placement | all

METADATA_MAP = {
    "jee_guide.md": {
        "doc_id": "careerverse_jee_guide_v1",
        "title": "JEE Mains & Advanced: Complete Guide for Indian Students",
        "category": "exam",
        "stage": "school",
        "last_verified": "2025-01-10",
    },
    "neet_guide.md": {
        "doc_id": "careerverse_neet_guide_v1",
        "title": "NEET UG: Complete Guide for Medical Aspirants",
        "category": "exam",
        "stage": "school",
        "last_verified": "2025-01-10",
    },
    "kcet_guide.md": {
        "doc_id": "careerverse_kcet_guide_v1",
        "title": "KCET 2025: Karnataka Common Entrance Test Guide",
        "category": "exam",
        "stage": "puc",
        "last_verified": "2025-01-10",
    },
    "gate_guide.md": {
        "doc_id": "careerverse_gate_guide_v1",
        "title": "GATE 2025: Graduate Aptitude Test in Engineering",
        "category": "exam",
        "stage": "degree",
        "last_verified": "2025-01-10",
    },
    "cat_guide.md": {
        "doc_id": "careerverse_cat_guide_v1",
        "title": "CAT 2025: MBA Entrance Exam Complete Guide",
        "category": "exam",
        "stage": "degree",
        "last_verified": "2025-01-10",
    },
    "software_engineering_careers.md": {
        "doc_id": "careerverse_swe_careers_v1",
        "title": "Software Engineering Careers in India: Roles & Salaries",
        "category": "role",
        "stage": "placement",
        "last_verified": "2025-01-10",
    },
    "engineering_salaries.md": {
        "doc_id": "careerverse_eng_salaries_v1",
        "title": "Indian Engineering Salaries 2025: Comprehensive Overview",
        "category": "salary",
        "stage": "placement",
        "last_verified": "2025-01-10",
    },
    "aiml_career_roadmap.md": {
        "doc_id": "careerverse_aiml_roadmap_v1",
        "title": "AI/ML Career Roadmap: From Student to Practitioner",
        "category": "roadmap",
        "stage": "all",
        "last_verified": "2025-01-10",
    },
    "after_class12_careers.md": {
        "doc_id": "careerverse_class12_careers_v1",
        "title": "After Class 12: Career Paths for Science Students in India",
        "category": "roadmap",
        "stage": "school",
        "last_verified": "2025-01-10",
    },
    "campus_placement_guide.md": {
        "doc_id": "careerverse_placement_guide_v1",
        "title": "Campus Placement Guide: How to Get Hired Before Graduation",
        "category": "roadmap",
        "stage": "placement",
        "last_verified": "2025-01-10",
    },
    "btech_degree_guide.md": {
        "doc_id": "careerverse_btech_guide_v1",
        "title": "B.Tech Degree Guide: Choosing the Right Stream and College",
        "category": "degree",
        "stage": "school",
        "last_verified": "2025-01-10",
    },
}


async def run() -> None:
    """Ingest all sample documents into Qdrant."""

    if not SAMPLE_DOCS_DIR.exists():
        logger.error("sample_docs/ directory not found at %s", SAMPLE_DOCS_DIR)
        logger.error("Please create it and add .md files.")
        sys.exit(1)

    # Create and prepare the Qdrant store once (shared for all documents)
    store = RagStore()
    await store.ensure_collection()

    md_files = sorted(SAMPLE_DOCS_DIR.glob("*.md"))
    if not md_files:
        logger.warning("No .md files found in %s", SAMPLE_DOCS_DIR)
        return

    logger.info("Found %d sample documents to process.", len(md_files))

    results: list[IngestResult] = []

    for md_file in md_files:
        metadata = METADATA_MAP.get(md_file.name)
        if metadata is None:
            logger.warning(
                "No metadata defined for '%s' — using defaults.", md_file.name
            )
            metadata = {
                "doc_id": f"careerverse_{md_file.stem}_v1",
                "title": md_file.stem.replace("_", " ").title(),
                "category": "other",
                "stage": "all",
                "last_verified": "",
            }

        # Add source_url as local file path
        full_metadata = {**metadata, "source_url": str(md_file)}

        logger.info("Ingesting '%s' (doc_id=%s)…", md_file.name, full_metadata["doc_id"])
        force_flag = "--force" in sys.argv
        result = await ingest_document(
            path_or_url=str(md_file),
            metadata=full_metadata,
            store=store,
            force=force_flag,
        )
        results.append(result)

    # ── Print summary table ────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f"{'Document':<35} {'Created':>8} {'Skipped':>8} {'Changed':>8}")
    print("-" * 70)
    total_created = 0
    total_skipped = 0
    for r in results:
        doc_display = r.doc_id.replace("careerverse_", "")[:33]
        print(
            f"{doc_display:<35} {r.chunks_created:>8} {r.chunks_skipped:>8} {str(r.changed):>8}"
        )
        total_created += r.chunks_created
        total_skipped += r.chunks_skipped
    print("=" * 70)
    print(f"{'TOTAL':<35} {total_created:>8} {total_skipped:>8}")
    print()

    if total_created > 0:
        logger.info("✅ Ingestion complete — %d new chunks stored.", total_created)
    else:
        logger.info("✅ All documents unchanged — %d chunks already up to date.", total_skipped)


if __name__ == "__main__":
    asyncio.run(run())
