"""
app/rag/store.py
─────────────────
Qdrant vector-store layer for the RAG ingestion pipeline.

Responsibilities
────────────────
- ensure_collection  : create the collection + payload indexes if missing.
- upsert_chunks      : embed + upsert chunks with full CareerVerse metadata.
- delete_by_doc_id   : delete all vectors for a given doc_id (for re-ingest).
- search             : embed query and return top-k results.

Payload schema per point
────────────────────────
Each Qdrant point carries these payload fields:

  doc_id          str   Stable identifier for the source document.
  chunk_index     int   Zero-based position of this chunk within the document.
  text            str   Raw chunk text (used for context injection).
  source_url      str   URL or file path the document came from.
  title           str   Document/section title.
  category        str   One of: exam | degree | role | salary | roadmap | other
  stage           str   One of: school | puc | degree | placement | all
  last_verified   str   ISO 8601 date the doc was last validated (YYYY-MM-DD).
  content_hash    str   SHA-256 of the full document text (for change detection).

Payload indexes
───────────────
doc_id, category, and stage are indexed so Qdrant can filter efficiently
(e.g. "only search role docs for placement-stage students").

Embedding
─────────
Delegates to app.rag.embeddings (HuggingFace, local, free).  Dimension is
detected at runtime from the first probe — never hard-coded.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.rag.embeddings import async_embed_documents, async_embed_query, get_dimension

logger = logging.getLogger(__name__)

# ── Valid controlled-vocabulary values ───────────────────────────────────────

VALID_CATEGORIES = frozenset({"exam", "degree", "role", "salary", "roadmap", "other"})
VALID_STAGES = frozenset({"school", "puc", "degree", "placement", "all"})


# ── Typed chunk dataclass ─────────────────────────────────────────────────────


@dataclass
class RagChunk:
    """
    A text chunk ready to be stored in Qdrant.

    All metadata fields are required so every point in the collection is
    uniformly queryable.  Use sensible defaults where exact values are unknown.
    """

    text: str
    doc_id: str
    chunk_index: int
    source_url: str = ""
    title: str = ""
    category: str = "other"       # exam | degree | role | salary | roadmap | other
    stage: str = "all"            # school | puc | degree | placement | all
    last_verified: str = ""       # ISO date, e.g. "2025-01-15"
    content_hash: str = ""        # SHA-256 of the parent document text
    extra: Dict[str, Any] = field(default_factory=dict)


# ── Search result ─────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class RagSearchResult:
    """A single chunk returned by a similarity search."""

    text: str
    doc_id: str
    chunk_index: int
    source_url: str
    title: str
    category: str
    stage: str
    score: float
    payload: Dict[str, Any]


# ── Store ─────────────────────────────────────────────────────────────────────


class RagStore:
    """Async Qdrant wrapper for the RAG ingestion + retrieval pipeline."""

    def __init__(self) -> None:
        cfg = get_settings()
        self._collection = cfg.qdrant_collection
        self._client = AsyncQdrantClient(
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key or None,
            timeout=30.0,
        )
        self._vector_size: Optional[int] = None

    # ── Collection bootstrap ──────────────────────────────────────────────────

    async def ensure_collection(self) -> None:
        """
        Create the Qdrant collection (cosine distance) and payload indexes if
        the collection does not already exist.

        The vector dimension is probed from the embedding model at runtime.
        """
        collections = await self._client.get_collections()
        existing = {c.name for c in collections.collections}

        if self._collection in existing:
            logger.info("Collection '%s' already exists — skipping creation.", self._collection)
            self._vector_size = get_dimension()
            return

        # Probe dimension from model
        self._vector_size = get_dimension()
        logger.info("Detected embedding dimension: %d", self._vector_size)

        await self._client.create_collection(
            collection_name=self._collection,
            vectors_config=qmodels.VectorParams(
                size=self._vector_size,
                distance=qmodels.Distance.COSINE,
            ),
        )
        logger.info("Created collection '%s' (dim=%d).", self._collection, self._vector_size)

        # Create payload indexes for efficient filtered search
        await self._create_payload_indexes()

    async def _create_payload_indexes(self) -> None:
        """Create keyword indexes on doc_id, category, and stage."""
        indexes = [
            ("doc_id", qmodels.PayloadSchemaType.KEYWORD),
            ("category", qmodels.PayloadSchemaType.KEYWORD),
            ("stage", qmodels.PayloadSchemaType.KEYWORD),
        ]
        for field_name, schema_type in indexes:
            try:
                await self._client.create_payload_index(
                    collection_name=self._collection,
                    field_name=field_name,
                    field_schema=schema_type,
                )
                logger.info("Created payload index on field '%s'.", field_name)
            except Exception as exc:
                logger.warning("Could not create index for '%s': %s", field_name, exc)

    # ── Upsert ────────────────────────────────────────────────────────────────

    async def upsert_chunks(self, chunks: List[RagChunk]) -> None:
        """
        Embed and upsert a list of RagChunks into Qdrant.

        Point IDs are stable UUIDs derived from (doc_id, chunk_index) so
        re-running ingest for the same chunk always overwrites the same point.
        """
        if not chunks:
            logger.debug("upsert_chunks called with empty list — nothing to do.")
            return

        texts = [c.text for c in chunks]
        vectors = await async_embed_documents(texts)

        points = [
            qmodels.PointStruct(
                # Stable point ID: hash of doc_id + chunk_index
                id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{chunk.doc_id}:{chunk.chunk_index}")),
                vector=vector,
                payload={
                    "text": chunk.text,
                    "doc_id": chunk.doc_id,
                    "chunk_index": chunk.chunk_index,
                    "source_url": chunk.source_url,
                    "title": chunk.title,
                    "category": chunk.category if chunk.category in VALID_CATEGORIES else "other",
                    "stage": chunk.stage if chunk.stage in VALID_STAGES else "all",
                    "last_verified": chunk.last_verified,
                    "content_hash": chunk.content_hash,
                    **chunk.extra,
                },
            )
            for chunk, vector in zip(chunks, vectors)
        ]

        await self._client.upsert(
            collection_name=self._collection,
            points=points,
            wait=True,
        )
        logger.info("Upserted %d chunks (doc_id=%s) into '%s'.",
                    len(chunks), chunks[0].doc_id if chunks else "?", self._collection)

    # ── Delete by doc_id ──────────────────────────────────────────────────────

    async def delete_by_doc_id(self, doc_id: str) -> None:
        """
        Delete all Qdrant points belonging to a given doc_id.

        Used by the re-ingest path: when a document's content_hash changes, old
        vectors are removed before new ones are upserted.
        """
        await self._client.delete(
            collection_name=self._collection,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="doc_id",
                            match=qmodels.MatchValue(value=doc_id),
                        )
                    ]
                )
            ),
            wait=True,
        )
        logger.info("Deleted all vectors for doc_id='%s'.", doc_id)

    # ── Query: get stored content_hash for a doc_id ───────────────────────────

    async def get_content_hash(self, doc_id: str) -> Optional[str]:
        """
        Return the content_hash stored for any chunk of doc_id, or None if not found.

        Used by ingest.py to decide whether the document has changed.
        """
        result = await self._client.scroll(
            collection_name=self._collection,
            scroll_filter=qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="doc_id",
                        match=qmodels.MatchValue(value=doc_id),
                    )
                ]
            ),
            limit=1,
            with_payload=["content_hash"],
            with_vectors=False,
        )
        points, _ = result
        if not points:
            return None
        payload = points[0].payload or {}
        return payload.get("content_hash")

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(
        self,
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> List[RagSearchResult]:
        """
        Embed `query` and return the top-k most similar chunks.

        Parameters
        ----------
        query    : Natural-language query string.
        top_k    : Number of results to return.
        category : Optional filter (exam | degree | role | salary | roadmap | other).
        stage    : Optional filter (school | puc | degree | placement | all).
        """
        query_vector = await async_embed_query(query)

        # Build optional filter
        must_conditions = []
        if category and category in VALID_CATEGORIES:
            must_conditions.append(
                qmodels.FieldCondition(key="category", match=qmodels.MatchValue(value=category))
            )
        if stage and stage in VALID_STAGES:
            must_conditions.append(
                qmodels.FieldCondition(key="stage", match=qmodels.MatchValue(value=stage))
            )
        qdrant_filter = qmodels.Filter(must=must_conditions) if must_conditions else None

        hits = None
        for attempt in range(2):
            try:
                hits = await self._client.search(
                    collection_name=self._collection,
                    query_vector=query_vector,
                    limit=top_k,
                    with_payload=True,
                    query_filter=qdrant_filter,
                )
                break
            except Exception as exc:
                if attempt == 0 and ("timeout" in str(exc).lower() or "connect" in str(exc).lower()):
                    logger.warning("Qdrant search timeout on attempt 1, retrying: %s", exc)
                    continue
                raise

        if hits is None:
            hits = []

        return [
            RagSearchResult(
                text=hit.payload.get("text", "") if hit.payload else "",
                doc_id=hit.payload.get("doc_id", "") if hit.payload else "",
                chunk_index=hit.payload.get("chunk_index", 0) if hit.payload else 0,
                source_url=hit.payload.get("source_url", "") if hit.payload else "",
                title=hit.payload.get("title", "") if hit.payload else "",
                category=hit.payload.get("category", "other") if hit.payload else "other",
                stage=hit.payload.get("stage", "all") if hit.payload else "all",
                score=hit.score,
                payload=hit.payload or {},
            )
            for hit in hits
        ]
