"""
tests/test_ingest.py
─────────────────────
Unit tests for app/rag/ingest.ingest_document().

Tests cover:
- hash-skip (unchanged doc): ingest called twice → second call skips (chunks_created=0)
- re-ingest (changed doc): old vectors deleted, new vectors upserted
- new doc: upserted fresh, changed=True
- empty document: graceful handling
- invalid path: FileNotFoundError propagated correctly

Mocking strategy
────────────────
The RagStore is fully mocked — no real Qdrant needed.
The embedding function is NOT called here (that's in test_embeddings.py).
We mock embed_documents/embed_query so ingest_document is pure unit-testable.
"""
from __future__ import annotations

import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.rag.ingest import ingest_document, IngestResult, content_hash, chunk_text


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_mock_store(existing_hash: str | None = None) -> MagicMock:
    """
    Build a mock RagStore.

    Parameters
    ----------
    existing_hash : Simulated stored content_hash for the doc_id.
                    None = document does not exist in Qdrant yet.
    """
    store = MagicMock()
    store.ensure_collection = AsyncMock()
    store.get_content_hash = AsyncMock(return_value=existing_hash)
    store.delete_by_doc_id = AsyncMock()
    store.upsert_chunks = AsyncMock()
    return store


def _write_temp_md(content: str) -> str:
    """Write content to a temporary .md file and return its path."""
    f = tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", encoding="utf-8", delete=False
    )
    f.write(content)
    f.close()
    return f.name


# ── Test: new document is ingested ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_ingest_new_document():
    """A document with no prior entry in Qdrant is fully ingested."""
    content = (
        "## Introduction\n\n"
        "This is a test document for CareerVerse AI RAG.\n\n"
        "## Section Two\n\n"
        "More content here for testing purposes.\n"
    )
    path = _write_temp_md(content)
    store = _make_mock_store(existing_hash=None)  # no prior entry

    try:
        result = await ingest_document(
            path_or_url=path,
            metadata={"doc_id": "test_doc_001", "category": "other", "stage": "all"},
            store=store,
        )
    finally:
        os.unlink(path)

    assert result.doc_id == "test_doc_001"
    assert result.changed is True
    assert result.chunks_created > 0
    assert result.chunks_skipped == 0
    store.upsert_chunks.assert_called_once()
    store.delete_by_doc_id.assert_not_called()  # new doc — no delete needed


# ── Test: unchanged document is skipped ──────────────────────────────────────


@pytest.mark.asyncio
async def test_ingest_unchanged_document_is_skipped():
    """Calling ingest_document twice on the same file returns chunks_skipped=N on 2nd call."""
    content = (
        "## JEE Guide\n\n"
        "JEE is the entrance exam for IITs in India.\n\n"
        "## Preparation Tips\n\n"
        "Study every day and solve mock tests.\n"
    )
    path = _write_temp_md(content)

    # Compute the hash that would be stored after first ingest
    from app.rag.ingest import clean_text, content_hash as ch
    cleaned = clean_text(content)
    stored_hash = ch(cleaned)

    # Store already has this exact hash → should be skipped
    store = _make_mock_store(existing_hash=stored_hash)

    try:
        result = await ingest_document(
            path_or_url=path,
            metadata={"doc_id": "test_doc_skip", "category": "exam", "stage": "school"},
            store=store,
        )
    finally:
        os.unlink(path)

    assert result.changed is False
    assert result.chunks_created == 0
    assert result.chunks_skipped > 0
    store.upsert_chunks.assert_not_called()
    store.delete_by_doc_id.assert_not_called()


# ── Test: changed document deletes old vectors and re-upserts ─────────────────


@pytest.mark.asyncio
async def test_ingest_changed_document_deletes_and_reupserts():
    """When content_hash changes, old vectors are deleted and new ones are upserted."""
    content = "## Updated Guide\n\nThis is the updated content for the document.\n"
    path = _write_temp_md(content)

    # Simulate a DIFFERENT hash already stored (old version of the doc)
    old_hash = "abc123def456" * 5  # obviously different from actual content hash

    store = _make_mock_store(existing_hash=old_hash)

    try:
        result = await ingest_document(
            path_or_url=path,
            metadata={"doc_id": "test_doc_changed", "category": "role", "stage": "placement"},
            store=store,
        )
    finally:
        os.unlink(path)

    assert result.changed is True
    assert result.chunks_created > 0
    # Old vectors MUST be deleted before re-ingest
    store.delete_by_doc_id.assert_called_once_with("test_doc_changed")
    store.upsert_chunks.assert_called_once()


# ── Test: empty document handled gracefully ───────────────────────────────────


@pytest.mark.asyncio
async def test_ingest_empty_document_returns_zero_chunks():
    """An empty .md file results in 0 chunks_created and no Qdrant calls."""
    path = _write_temp_md("   \n\n   \n")  # whitespace only
    store = _make_mock_store(existing_hash=None)

    try:
        result = await ingest_document(
            path_or_url=path,
            metadata={"doc_id": "test_doc_empty"},
            store=store,
        )
    finally:
        os.unlink(path)

    assert result.chunks_created == 0
    assert result.changed is False
    store.upsert_chunks.assert_not_called()


# ── Test: missing file raises FileNotFoundError ───────────────────────────────


@pytest.mark.asyncio
async def test_ingest_missing_file_raises():
    """ingest_document raises FileNotFoundError for non-existent paths."""
    store = _make_mock_store(existing_hash=None)

    with pytest.raises(FileNotFoundError):
        await ingest_document(
            path_or_url="/does/not/exist.md",
            metadata={"doc_id": "test_missing"},
            store=store,
        )


# ── Test: doc_id is required in metadata ─────────────────────────────────────


@pytest.mark.asyncio
async def test_ingest_without_doc_id_raises_value_error():
    """ingest_document raises ValueError if metadata is missing doc_id."""
    content = "## Test\n\nSome content.\n"
    path = _write_temp_md(content)
    store = _make_mock_store(existing_hash=None)

    try:
        with pytest.raises(ValueError, match="doc_id"):
            await ingest_document(
                path_or_url=path,
                metadata={"title": "No doc_id here"},
                store=store,
            )
    finally:
        os.unlink(path)


# ── Test: chunk metadata fields are populated correctly ───────────────────────


@pytest.mark.asyncio
async def test_ingest_chunk_metadata_populated():
    """Verify that upsert_chunks is called with correctly populated RagChunk objects."""
    content = "## My Document\n\nThis document has some content for testing.\n"
    path = _write_temp_md(content)
    store = _make_mock_store(existing_hash=None)

    try:
        await ingest_document(
            path_or_url=path,
            metadata={
                "doc_id": "test_meta_check",
                "title": "My Document",
                "category": "exam",
                "stage": "puc",
                "last_verified": "2025-01-15",
                "source_url": "https://example.com/doc",
            },
            store=store,
        )
    finally:
        os.unlink(path)

    store.upsert_chunks.assert_called_once()
    chunks_passed = store.upsert_chunks.call_args[0][0]  # positional arg

    for chunk in chunks_passed:
        assert chunk.doc_id == "test_meta_check"
        assert chunk.category == "exam"
        assert chunk.stage == "puc"
        assert chunk.last_verified == "2025-01-15"
        assert chunk.source_url == "https://example.com/doc"
        assert len(chunk.content_hash) == 64  # SHA-256 hex
        assert chunk.text.strip() != ""
