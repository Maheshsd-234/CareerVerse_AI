"""
app/vectorstore/qdrant.py
─────────────────────────
Qdrant vector-store wrapper.

Responsibilities
────────────────
- ensure_collection  : create the collection if it doesn't exist.
- upsert_chunks      : embed + upsert a list of text chunks with metadata.
- search             : embed a query and return top-k results.

The embedding dimension is discovered at runtime from the first embedding call
so we don't have to hard-code a magic number.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.embeddings.huggingface import get_embedder

logger = logging.getLogger(__name__)

# ── Typed chunk schema ────────────────────────────────────────────────────────


class DocumentChunk:
    """A text chunk with its associated metadata."""

    __slots__ = ("text", "metadata")

    def __init__(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self.text = text
        self.metadata: Dict[str, Any] = metadata or {}


class SearchResult:
    """A single retrieved chunk with its relevance score."""

    __slots__ = ("text", "metadata", "score")

    def __init__(self, text: str, metadata: Dict[str, Any], score: float) -> None:
        self.text = text
        self.metadata = metadata
        self.score = score


# ── Store ─────────────────────────────────────────────────────────────────────


class QdrantStore:
    """Async Qdrant client wrapper."""

    def __init__(self) -> None:
        cfg = get_settings()
        self._collection = cfg.qdrant_collection
        self._client = AsyncQdrantClient(
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key or None,  # None = no auth
            timeout=30.0,
        )
        self._embedder = get_embedder()
        self._vector_size: Optional[int] = None

    # ── Collection bootstrap ──────────────────────────────────────────────────

    async def ensure_collection(self) -> None:
        """
        Create the Qdrant collection with cosine distance if it doesn't exist.

        The vector size is probed by embedding a single placeholder string so
        we don't hard-code the dimension.
        """
        collections = await self._client.get_collections()
        existing = {c.name for c in collections.collections}
        if self._collection in existing:
            logger.info("Collection '%s' already exists.", self._collection)
            return

        probe = await self._embedder.embed_query("probe")
        self._vector_size = len(probe)

        await self._client.create_collection(
            collection_name=self._collection,
            vectors_config=qmodels.VectorParams(
                size=self._vector_size,
                distance=qmodels.Distance.COSINE,
            ),
        )
        logger.info(
            "Created collection '%s' (dim=%d).",
            self._collection,
            self._vector_size,
        )

    # ── Upsert ────────────────────────────────────────────────────────────────

    async def upsert_chunks(self, chunks: List[DocumentChunk]) -> None:
        """
        Embed and upsert a list of DocumentChunks into Qdrant.

        Each chunk is assigned a stable UUID derived from its text content so
        re-running ingest is idempotent.
        """
        if not chunks:
            return

        texts = [c.text for c in chunks]
        vectors = await self._embedder.embed_documents(texts)

        points = [
            qmodels.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.text[:200])),
                vector=vector,
                payload={"text": chunk.text, **chunk.metadata},
            )
            for chunk, vector in zip(chunks, vectors)
        ]

        await self._client.upsert(
            collection_name=self._collection,
            points=points,
            wait=True,
        )
        logger.info("Upserted %d chunks into '%s'.", len(chunks), self._collection)

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """
        Embed `query` and return the top-k most similar chunks.

        Returns
        -------
        list[SearchResult]
            Ordered by descending relevance score.
        """
        query_vector = await self._embedder.embed_query(query)

        hits = await self._client.search(
            collection_name=self._collection,
            query_vector=query_vector,
            limit=top_k,
            with_payload=True,
        )

        return [
            SearchResult(
                text=hit.payload.get("text", "") if hit.payload else "",
                metadata={k: v for k, v in (hit.payload or {}).items() if k != "text"},
                score=hit.score,
            )
            for hit in hits
        ]
