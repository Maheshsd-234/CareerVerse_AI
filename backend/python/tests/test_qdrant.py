"""
tests/test_qdrant.py
─────────────────────
Unit tests for app/vectorstore/qdrant.py — QdrantStore.

The Qdrant client and embedder are mocked — no real Qdrant needed.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.vectorstore.qdrant import DocumentChunk, QdrantStore, SearchResult


def _make_store_with_mocks() -> tuple[QdrantStore, MagicMock, MagicMock]:
    """Return (store, mock_qdrant_client, mock_embedder)."""
    mock_embedder = MagicMock()
    mock_embedder.embed_query = AsyncMock(return_value=[0.1, 0.2, 0.3])
    mock_embedder.embed_documents = AsyncMock(return_value=[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])

    mock_client = MagicMock()
    mock_client.get_collections = AsyncMock(return_value=MagicMock(collections=[]))
    mock_client.create_collection = AsyncMock()
    mock_client.upsert = AsyncMock()
    mock_client.search = AsyncMock(return_value=[])

    with patch("app.vectorstore.qdrant.AsyncQdrantClient", return_value=mock_client):
        with patch("app.vectorstore.qdrant.get_embedder", return_value=mock_embedder):
            store = QdrantStore()

    return store, mock_client, mock_embedder


@pytest.mark.asyncio
async def test_ensure_collection_creates_when_missing():
    """ensure_collection creates the collection when it doesn't exist."""
    store, mock_client, mock_embedder = _make_store_with_mocks()
    await store.ensure_collection()
    mock_client.create_collection.assert_called_once()


@pytest.mark.asyncio
async def test_ensure_collection_skips_when_existing():
    """ensure_collection does NOT create if collection already exists."""
    mock_embedder = MagicMock()
    mock_embedder.embed_query = AsyncMock(return_value=[0.1, 0.2, 0.3])

    # Simulate existing collection — use a simple object with .name attr,
    # NOT MagicMock(name=...) because that sets the mock's internal name.
    existing_collection = MagicMock(spec=["name"])
    existing_collection.name = "test_careerverse"

    mock_client = MagicMock()
    mock_client.get_collections = AsyncMock(
        return_value=MagicMock(collections=[existing_collection])
    )
    mock_client.create_collection = AsyncMock()

    with patch("app.vectorstore.qdrant.AsyncQdrantClient", return_value=mock_client):
        with patch("app.vectorstore.qdrant.get_embedder", return_value=mock_embedder):
            store = QdrantStore()

    await store.ensure_collection()
    mock_client.create_collection.assert_not_called()


@pytest.mark.asyncio
async def test_upsert_chunks_calls_embed_and_upsert():
    """upsert_chunks embeds and upserts the right number of points."""
    store, mock_client, mock_embedder = _make_store_with_mocks()
    chunks = [
        DocumentChunk("text one", {"source": "role:dev"}),
        DocumentChunk("text two", {"source": "skill:python"}),
    ]
    await store.upsert_chunks(chunks)
    mock_embedder.embed_documents.assert_called_once_with(["text one", "text two"])
    mock_client.upsert.assert_called_once()


@pytest.mark.asyncio
async def test_upsert_empty_list_is_noop():
    """upsert_chunks with an empty list makes no API calls."""
    store, mock_client, mock_embedder = _make_store_with_mocks()
    await store.upsert_chunks([])
    mock_embedder.embed_documents.assert_not_called()
    mock_client.upsert.assert_not_called()


@pytest.mark.asyncio
async def test_search_returns_search_results():
    """search returns correctly typed SearchResult objects."""
    store, mock_client, mock_embedder = _make_store_with_mocks()

    hit = MagicMock()
    hit.payload = {"text": "AI Engineer info", "source": "role:ai-engineer"}
    hit.score = 0.95
    mock_client.search.return_value = [hit]

    results = await store.search("AI Engineer", top_k=3)

    assert len(results) == 1
    assert isinstance(results[0], SearchResult)
    assert results[0].text == "AI Engineer info"
    assert results[0].score == 0.95
