"""
scripts/ingest.py
──────────────────
One-shot ingestion script.

Usage
─────
    cd backend/python
    python -m scripts.ingest

What it does
────────────
1. Loads data/careerverse_docs.json
2. Embeds each document chunk via Nvidia NIM
3. Upserts into Qdrant (idempotent — safe to re-run)

The collection is created automatically if it does not exist.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Allow running as `python -m scripts.ingest` from backend/python/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.vectorstore.qdrant import DocumentChunk, QdrantStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest")

DATA_FILE = Path(__file__).parent.parent / "data" / "careerverse_docs.json"


async def run() -> None:
    """Load JSON docs, embed, upsert into Qdrant."""
    logger.info("Loading knowledge base from %s", DATA_FILE)
    with DATA_FILE.open(encoding="utf-8") as f:
        raw_docs: list[dict] = json.load(f)

    chunks = [
        DocumentChunk(
            text=doc["text"],
            metadata={"source": doc.get("source", ""), "doc_id": doc.get("id", "")},
        )
        for doc in raw_docs
    ]

    logger.info("Loaded %d document chunks.", len(chunks))

    store = QdrantStore()
    await store.ensure_collection()
    await store.upsert_chunks(chunks)

    logger.info("✅ Ingestion complete — %d chunks stored in Qdrant.", len(chunks))


if __name__ == "__main__":
    asyncio.run(run())
