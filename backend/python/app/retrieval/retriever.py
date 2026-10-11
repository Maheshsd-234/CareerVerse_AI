"""
app/retrieval/retriever.py
──────────────────────────
Retrieval layer that interfaces with Qdrant, applies metadata filtering,
sanitizes source URLs (preventing server-path leakage), filters by relevance cutoff,
and groups chunks by document for citation matching.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, List, Optional

from app.config import get_settings
from app.rag.store import RagStore, RagSearchResult
from app.vectorstore.qdrant import QdrantStore, SearchResult

logger = logging.getLogger(__name__)


def sanitize_url(raw_url: Optional[str]) -> Optional[str]:
    """
    Return the URL only if it is a real web link (http:// or https://).
    All local filesystem paths (e.g. E:\\... or /sample_docs/...) are scrubbed to None
    to prevent server path leakage.
    """
    if not raw_url:
        return None
    trimmed = raw_url.strip()
    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        return trimmed
    return None


@dataclass(frozen=True)
class RetrievedChunk:
    """Immutable single chunk returned from the vector store."""

    text: str
    doc_id: str
    title: str
    category: str
    stage: str
    last_verified: str
    url: Optional[str]  # Real http(s) URL or None
    score: float
    chunk_index: int = 0


@dataclass
class RetrievedDocument:
    """Grouped document containing all matching chunks from a unique doc_id."""

    index: int  # 1-based index matching [n] citations
    doc_id: str
    title: str
    category: str
    stage: str
    last_verified: str
    url: Optional[str]
    max_score: float
    chunks: List[RetrievedChunk] = field(default_factory=list)

    def to_source_dict(self) -> dict[str, Any]:
        """Format for SSE `sources` event."""
        return {
            "index": self.index,
            "title": self.title or self.doc_id,
            "category": self.category,
            "last_verified": self.last_verified,
            "url": self.url,
        }


class Retriever:
    """
    Retrieve and filter relevant chunks from the vector store.

    Parameters
    ----------
    store : RagStore | QdrantStore | Any
        The vector store client to query.
    """

    def __init__(self, store: Any) -> None:
        self._store = store

    async def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        category: Optional[str] = None,
        stage: Optional[str] = None,
        min_score: Optional[float] = None,
    ) -> List[RetrievedChunk]:
        """
        Retrieve and score relevant chunks for `query`.

        Filters out chunks with score < min_score (defaults to settings.retrieval_min_score).
        """
        cfg = get_settings()
        k = top_k if top_k is not None else cfg.retrieval_top_k
        cutoff = min_score if min_score is not None else cfg.retrieval_min_score

        raw_results = await self._search_store(query=query, top_k=k, category=category, stage=stage)

        chunks: List[RetrievedChunk] = []
        for r in raw_results:
            chunk = self._normalize_result(r)
            if chunk.score >= cutoff:
                chunks.append(chunk)
            else:
                logger.debug(
                    "Filtered out chunk from doc_id='%s' (score=%.3f < cutoff=%.3f)",
                    chunk.doc_id,
                    chunk.score,
                    cutoff,
                )

        logger.info(
            "Retrieved %d relevant chunks (cutoff=%.3f) for query='%.60s...'",
            len(chunks),
            cutoff,
            query,
        )
        return chunks

    async def _search_store(
        self,
        query: str,
        top_k: int,
        category: Optional[str],
        stage: Optional[str],
    ) -> List[Any]:
        """Search store handling both RagStore and legacy QdrantStore interfaces."""
        if hasattr(self._store, "search"):
            try:
                results = await self._store.search(
                    query=query, top_k=top_k, category=category, stage=stage
                )
            except TypeError:
                results = await self._store.search(query=query, top_k=top_k)
        return list(results) if results else []

    @staticmethod
    def _normalize_result(r: Any) -> RetrievedChunk:
        """Convert varied result types into a standardized RetrievedChunk."""
        if isinstance(r, RagSearchResult):
            return RetrievedChunk(
                text=r.text,
                doc_id=r.doc_id or "doc_unknown",
                title=r.title or (r.doc_id.replace("careerverse_", "").replace("_", " ").title() if r.doc_id else "Career Guide"),
                category=r.category or "other",
                stage=r.stage or "all",
                last_verified=r.payload.get("last_verified", "") if r.payload else "",
                url=sanitize_url(r.source_url),
                score=r.score,
                chunk_index=r.chunk_index,
            )

        if isinstance(r, SearchResult):
            meta = r.metadata or {}
            source_raw = meta.get("source_url") or meta.get("source") or ""
            doc_id = meta.get("doc_id") or "doc_unknown"
            return RetrievedChunk(
                text=r.text,
                doc_id=doc_id,
                title=meta.get("title") or doc_id.replace("careerverse_", "").replace("_", " ").title(),
                category=meta.get("category", "other"),
                stage=meta.get("stage", "all"),
                last_verified=meta.get("last_verified", ""),
                url=sanitize_url(source_raw),
                score=r.score,
                chunk_index=meta.get("chunk_index", 0),
            )

        # Generic dict or object fallback
        if isinstance(r, dict):
            return RetrievedChunk(
                text=r.get("text", ""),
                doc_id=r.get("doc_id", "doc_unknown"),
                title=r.get("title", "Career Guide"),
                category=r.get("category", "other"),
                stage=r.get("stage", "all"),
                last_verified=r.get("last_verified", ""),
                url=sanitize_url(r.get("source_url") or r.get("url")),
                score=float(r.get("score", 0.0)),
                chunk_index=int(r.get("chunk_index", 0)),
            )

        # Fallback for mock objects in tests
        text = getattr(r, "text", "")
        score = getattr(r, "score", 0.0)
        doc_id = getattr(r, "doc_id", getattr(r, "source", "doc_unknown"))
        title = getattr(r, "title", doc_id)
        category = getattr(r, "category", "other")
        stage = getattr(r, "stage", "all")
        last_verified = getattr(r, "last_verified", "")
        url = sanitize_url(getattr(r, "source_url", getattr(r, "url", None)))
        return RetrievedChunk(
            text=text,
            doc_id=doc_id,
            title=title,
            category=category,
            stage=stage,
            last_verified=last_verified,
            url=url,
            score=score,
        )

    @staticmethod
    def group_by_document(chunks: List[RetrievedChunk]) -> List[RetrievedDocument]:
        """
        Group retrieved chunks by doc_id to create numbered documents [1], [2], ...
        This ensures every [n] in the answer maps 1-to-1 to an entry in the sources list.
        """
        doc_map: dict[str, RetrievedDocument] = {}
        index_counter = 1

        for chunk in chunks:
            if chunk.doc_id not in doc_map:
                doc_map[chunk.doc_id] = RetrievedDocument(
                    index=index_counter,
                    doc_id=chunk.doc_id,
                    title=chunk.title,
                    category=chunk.category,
                    stage=chunk.stage,
                    last_verified=chunk.last_verified,
                    url=chunk.url,
                    max_score=chunk.score,
                    chunks=[chunk],
                )
                index_counter += 1
            else:
                existing = doc_map[chunk.doc_id]
                existing.chunks.append(chunk)
                if chunk.score > existing.max_score:
                    existing.max_score = chunk.score

        # Return documents sorted by their highest chunk score
        docs = list(doc_map.values())
        docs.sort(key=lambda d: d.max_score, reverse=True)
        # Re-index from 1 to N after sorting
        for i, doc in enumerate(docs, start=1):
            doc.index = i
        return docs
