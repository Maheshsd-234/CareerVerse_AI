"""
app/embeddings/huggingface.py
──────────────────────────────
HuggingFace local embedding client using sentence-transformers.

Why sentence-transformers?
- 100% free, no API key, no rate limits, no cost.
- Model is downloaded once (~130 MB for BAAI/bge-small-en-v1.5) and cached.
- Works completely offline after first run.
- BAAI/bge-small-en-v1.5 is purpose-built for retrieval (RAG) tasks and
  outperforms many larger/paid models on MTEB retrieval benchmarks.

The model name is read from settings.hf_embedding_model — never hard-coded.

Threading note
──────────────
SentenceTransformer.encode() is synchronous. We run it in a thread-pool
executor so it never blocks the asyncio event loop.
"""
from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = logging.getLogger(__name__)


class HuggingFaceEmbedder:
    """
    Local embedding client backed by sentence-transformers.

    Usage
    -----
    embedder = HuggingFaceEmbedder()
    vector  = await embedder.embed_query("How do I become an AI engineer?")
    vectors = await embedder.embed_documents(["doc1 text", "doc2 text"])
    """

    def __init__(self) -> None:
        cfg = get_settings()
        model_name: str = cfg.hf_embedding_model
        logger.info(
            "Loading HuggingFace embedding model '%s' (downloads on first run)…",
            model_name,
        )
        # SentenceTransformer loads / downloads the model here.
        # Subsequent calls use the local HuggingFace cache (~/.cache/huggingface).
        self._model = SentenceTransformer(model_name)
        self._loop = asyncio.get_event_loop
        logger.info("Embedding model '%s' ready.", model_name)

    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query string and return its vector."""
        return (await self._encode([text]))[0]

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of document strings.

        Large lists are processed in one batch — sentence-transformers handles
        internal batching automatically.
        """
        return await self._encode(texts)

    async def _encode(self, texts: List[str]) -> List[List[float]]:
        """Run synchronous encode() in a thread-pool to avoid blocking the loop."""
        loop = asyncio.get_event_loop()
        # normalize_embeddings=True gives unit vectors, which improves cosine similarity scores
        vectors = await loop.run_in_executor(
            None,
            lambda: self._model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False,
            ).tolist(),
        )
        return vectors  # type: ignore[return-value]


@lru_cache(maxsize=1)
def get_embedder() -> HuggingFaceEmbedder:
    """Return a cached singleton HuggingFaceEmbedder."""
    return HuggingFaceEmbedder()
