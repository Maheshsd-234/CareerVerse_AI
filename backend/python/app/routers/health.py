"""
app/routers/health.py
──────────────────────
GET /health — liveness / readiness probe.

Returns a JSON object indicating whether Qdrant is reachable and which LLM
model is configured as primary.  Does NOT make a real LLM call.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter
from qdrant_client import AsyncQdrantClient

from app.config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", summary="Liveness / readiness probe")
async def health() -> dict:
    """
    Return service health status.

    Response shape
    ──────────────
    {
        "status": "ok" | "degraded",
        "qdrant": "reachable" | "unreachable",
        "primary_llm": "<model name>",
        "fallback_llm": "<model name>"
    }
    """
    cfg = get_settings()

    # Check Qdrant reachability
    qdrant_status = "unreachable"
    try:
        client = AsyncQdrantClient(
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key or None,
        )
        await client.get_collections()
        qdrant_status = "reachable"
    except Exception as exc:
        logger.warning("Health check — Qdrant unreachable: %s", exc)

    overall = "ok" if qdrant_status == "reachable" else "degraded"

    return {
        "status": overall,
        "qdrant": qdrant_status,
        "primary_llm": cfg.groq_model,
        "fallback_llm": cfg.gemini_model,
    }
