"""
tests/test_retriever.py
────────────────────────
Unit tests for app/retrieval/retriever.py — Retriever, URL sanitization, and document grouping.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.rag.store import RagSearchResult
from app.retrieval.retriever import (
    Retriever,
    RetrievedChunk,
    RetrievedDocument,
    sanitize_url,
)


def _make_mock_store(results: list[RagSearchResult]) -> MagicMock:
    store = MagicMock()
    store.search = AsyncMock(return_value=results)
    return store


# ── URL Sanitization ──────────────────────────────────────────────────────────


def test_sanitize_url_scrubs_local_paths():
    """Local server file paths must be converted to None, while web links are kept."""
    # Local paths (Windows or Unix)
    assert sanitize_url("E:\\CareerVerse_AI-main\\sample_docs\\jee.md") is None
    assert sanitize_url("C:/Users/app/sample.md") is None
    assert sanitize_url("/home/ubuntu/data/guide.txt") is None
    assert sanitize_url("./relative/path.md") is None
    assert sanitize_url("") is None
    assert sanitize_url(None) is None

    # Real web URLs
    assert sanitize_url("https://jeemain.nta.nic.in") == "https://jeemain.nta.nic.in"
    assert sanitize_url("http://example.com/guide") == "http://example.com/guide"


# ── Retriever Score Filtering ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_retrieve_filters_below_min_score():
    """Chunks below min_score cutoff must be filtered out."""
    fake_results = [
        RagSearchResult(
            text="High relevance JEE info",
            doc_id="jee_001",
            chunk_index=0,
            source_url="https://nta.ac.in",
            title="JEE Guide",
            category="exam",
            stage="school",
            score=0.85,
            payload={"last_verified": "2025-01-10"},
        ),
        RagSearchResult(
            text="Irrelevant baking text",
            doc_id="baking_001",
            chunk_index=0,
            source_url="",
            title="Baking",
            category="other",
            stage="all",
            score=0.32,  # below cutoff
            payload={},
        ),
    ]
    store = _make_mock_store(fake_results)
    retriever = Retriever(store)

    chunks = await retriever.retrieve("JEE syllabus", min_score=0.50)

    assert len(chunks) == 1
    assert chunks[0].doc_id == "jee_001"
    assert chunks[0].score == 0.85
    assert chunks[0].url == "https://nta.ac.in"


# ── Document Grouping & Numbering ─────────────────────────────────────────────


def test_group_by_document_numbers_and_deduplicates():
    """Group multiple chunks from the same doc_id into a single numbered Document [n]."""
    chunks = [
        RetrievedChunk(
            text="JEE Physics syllabus",
            doc_id="doc_jee",
            title="JEE Complete Guide",
            category="exam",
            stage="school",
            last_verified="2025-01-10",
            url="https://jeemain.nta.nic.in",
            score=0.88,
            chunk_index=0,
        ),
        RetrievedChunk(
            text="NEET Biology syllabus",
            doc_id="doc_neet",
            title="NEET Complete Guide",
            category="exam",
            stage="school",
            last_verified="2025-01-10",
            url=None,  # Local path sanitized
            score=0.75,
            chunk_index=0,
        ),
        RetrievedChunk(
            text="JEE Chemistry syllabus",
            doc_id="doc_jee",  # same doc_id
            title="JEE Complete Guide",
            category="exam",
            stage="school",
            last_verified="2025-01-10",
            url="https://jeemain.nta.nic.in",
            score=0.92,  # higher score
            chunk_index=1,
        ),
    ]

    docs: list[RetrievedDocument] = Retriever.group_by_document(chunks)

    # Should have 2 unique documents, ordered by highest chunk score
    assert len(docs) == 2
    assert docs[0].index == 1
    assert docs[0].doc_id == "doc_jee"
    assert len(docs[0].chunks) == 2
    assert docs[0].max_score == 0.92
    assert docs[0].url == "https://jeemain.nta.nic.in"

    assert docs[1].index == 2
    assert docs[1].doc_id == "doc_neet"
    assert len(docs[1].chunks) == 1
    assert docs[1].url is None

    # Check to_source_dict output for SSE event
    source_dict = docs[0].to_source_dict()
    assert source_dict == {
        "index": 1,
        "title": "JEE Complete Guide",
        "category": "exam",
        "last_verified": "2025-01-10",
        "url": "https://jeemain.nta.nic.in",
    }


@pytest.mark.asyncio
async def test_retrieve_passes_filters_to_store():
    """Retriever passes category and stage filters to the store."""
    store = _make_mock_store([])
    retriever = Retriever(store)

    await retriever.retrieve(
        query="SWE careers",
        top_k=5,
        category="role",
        stage="placement",
        min_score=0.40,
    )

    store.search.assert_called_once_with(
        query="SWE careers",
        top_k=5,
        category="role",
        stage="placement",
    )
