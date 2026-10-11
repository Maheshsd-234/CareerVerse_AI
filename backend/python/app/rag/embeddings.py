"""
app/rag/embeddings.py
──────────────────────
Embedding wrapper for the RAG ingestion pipeline.

Uses sentence-transformers (HuggingFace) for local, free, offline embeddings.
The embedding model name, device, batch size, and query instruction are all
read from Settings — nothing is hard-coded.

Why HuggingFace here?
─────────────────────
- Zero API cost, no rate limits, no keys.
- BAAI/bge-small-en-v1.5 (~384 dim) is state-of-art for RAG retrieval.
- Works entirely offline after first model download (~130 MB cached locally).
- Identical embeddings between ingest and query time → correct similarity.

Vector dimension
────────────────
get_dimension() probes the model's actual output size at runtime so we never
hard-code a magic number (avoids mismatch if the model changes).

Threading note
──────────────
encode() is CPU-bound and synchronous.  All async wrappers use
asyncio.run_in_executor so they never block the event loop.
"""
from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_model() -> SentenceTransformer:
    """Load and cache the SentenceTransformer model (downloaded once)."""
    cfg = get_settings()
    model_name = cfg.embedding_model
    logger.info("Loading embedding model '%s' on device='%s'…", model_name, cfg.embedding_device)
    model = SentenceTransformer(model_name, device=cfg.embedding_device)
    model.max_seq_length = 512
    logger.info("Embedding model ready (dim=%d).", model.get_sentence_embedding_dimension())
    return model


# ── Sync helpers (used directly by ingest scripts) ───────────────────────────


def embed_documents(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of document texts.

    Parameters
    ----------
    texts : list of strings to embed (document passages, not queries).

    Returns
    -------
    list of float vectors, same length as `texts`.
    """
    if not texts:
        return []
    cfg = get_settings()
    model = _load_model()
    vecs = model.encode(
        texts,
        batch_size=cfg.embedding_batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vecs.tolist()


def embed_query(text: str) -> List[float]:
    """
    Embed a single query string.

    BGE retrieval convention: prepend the query instruction to the query only
    (never to document chunks) to align query and passage representation.

    Parameters
    ----------
    text : Raw user query string.
    """
    cfg = get_settings()
    model = _load_model()
    # Prepend retrieval instruction (BGE convention — query side only)
    full_text = cfg.embedding_query_instruction + text
    vec = model.encode(full_text, normalize_embeddings=True)
    return vec.tolist()


def get_dimension() -> int:
    """
    Return the embedding dimension of the configured model.
    Probed at runtime — never hard-coded.
    """
    return _load_model().get_sentence_embedding_dimension()


# ── Async wrappers (used by QdrantStore / pipeline) ──────────────────────────


async def async_embed_documents(texts: List[str]) -> List[List[float]]:
    """Non-blocking version of embed_documents for use in async contexts."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, embed_documents, texts)


async def async_embed_query(text: str) -> List[float]:
    """Non-blocking version of embed_query for use in async contexts."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, embed_query, text)
