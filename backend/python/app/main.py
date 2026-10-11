"""
app/main.py
───────────
FastAPI application factory.

Startup sequence
────────────────
1. Validate Settings (fails fast if env vars missing).
2. Initialise Firebase Admin SDK.
3. Preload local embedding model (off event loop) & ensure Qdrant collection.
4. Register health and chat routers.
5. Mount CORS middleware with configured origins.
"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import firebase_admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.rag.embeddings import get_dimension
from app.rag.store import RagStore
from app.routers import chat, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run startup / shutdown tasks."""
    cfg = get_settings()

    # ── Logging ───────────────────────────────────────────────────────────────
    logging.basicConfig(level=cfg.log_level.upper())

    # ── Firebase Admin ────────────────────────────────────────────────────────
    if not firebase_admin._apps:  # avoid re-init during tests
        try:
            import os
            import firebase_admin.credentials as fb_creds

            sa_path = cfg.firebase_service_account_path
            if not os.path.exists(sa_path) and os.path.exists(f"{sa_path}.json"):
                sa_path = f"{sa_path}.json"

            if os.path.exists(sa_path):
                cred = fb_creds.Certificate(sa_path)
                if cred.project_id == cfg.firebase_project_id:
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK initialised with service account key (%s).", sa_path)
                else:
                    logger.warning(
                        "Service account key project '%s' does not match '%s'. Using public certs for '%s'.",
                        cred.project_id,
                        cfg.firebase_project_id,
                        cfg.firebase_project_id,
                    )
                    firebase_admin.initialize_app(options={"projectId": cfg.firebase_project_id})
            else:
                firebase_admin.initialize_app(options={"projectId": cfg.firebase_project_id})
                logger.info(
                    "Firebase Admin SDK initialised for project '%s' (verifying tokens via public certificates).",
                    cfg.firebase_project_id,
                )
        except Exception as exc:
            logger.warning("Firebase Admin initialization skipped / failed: %s", exc)

    # ── Embedding Model Preload & Vector Store Bootstrap ──────────────────────
    try:
        # Load embedding model in worker thread so event loop is not blocked
        dim = await asyncio.to_thread(get_dimension)
        logger.info("Embedding model '%s' loaded (dimension=%d).", cfg.hf_embedding_model, dim)

        store = RagStore()
        await store.ensure_collection()
        logger.info("Qdrant collection '%s' ready.", cfg.qdrant_collection)
    except Exception as exc:
        logger.warning("Vector store / embedding bootstrap deferred: %s", exc)

    yield  # application runs here

    # ── Shutdown (graceful) ───────────────────────────────────────────────────
    logger.info("CareerVerse RAG backend shutting down.")


def create_app() -> FastAPI:
    """Build and return the FastAPI application."""
    cfg = get_settings()

    app = FastAPI(
        title="CareerVerse AI — RAG Backend",
        version="1.0.0",
        description="Production-grade RAG backend for CareerVerse AI career chatbot.",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router, tags=["Health"])
    app.include_router(chat.router, prefix="/chat", tags=["Chat"])

    return app


# Single top-level app instance consumed by uvicorn
app = create_app()
