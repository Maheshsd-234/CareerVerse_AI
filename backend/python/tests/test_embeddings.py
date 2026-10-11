"""
tests/test_embeddings.py
─────────────────────────
Unit tests for app/embeddings/huggingface.py — HuggingFaceEmbedder.

SentenceTransformer is mocked so no model is downloaded during tests.
"""
from __future__ import annotations

import numpy as np
from unittest.mock import MagicMock, patch

import pytest

from app.embeddings.huggingface import HuggingFaceEmbedder


def _make_embedder(fake_vectors: list[list[float]]) -> HuggingFaceEmbedder:
    """Build a HuggingFaceEmbedder whose SentenceTransformer is fully mocked."""
    mock_model = MagicMock()
    # encode() returns a numpy array (as sentence-transformers does)
    mock_model.encode.return_value = np.array(fake_vectors, dtype="float32")

    with patch("app.embeddings.huggingface.SentenceTransformer", return_value=mock_model):
        embedder = HuggingFaceEmbedder()

    return embedder


@pytest.mark.asyncio
async def test_embed_query_returns_vector():
    """embed_query returns a list of floats for a single string."""
    fake_vector = [0.1, 0.2, 0.3]
    embedder = _make_embedder([fake_vector])

    result = await embedder.embed_query("test query")

    assert len(result) == 3
    assert all(isinstance(v, float) for v in result)


@pytest.mark.asyncio
async def test_embed_documents_returns_multiple_vectors():
    """embed_documents returns one vector per document."""
    vectors = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]
    embedder = _make_embedder(vectors)

    results = await embedder.embed_documents(["doc1", "doc2", "doc3"])

    assert len(results) == 3
    assert len(results[0]) == 2


@pytest.mark.asyncio
async def test_embed_documents_calls_encode_once():
    """embed_documents calls model.encode() exactly once (sentence-transformers batches internally)."""
    vectors = [[0.1, 0.2], [0.3, 0.4]]
    embedder = _make_embedder(vectors)

    await embedder.embed_documents(["doc1", "doc2"])

    # encode should have been called exactly once — sentence-transformers handles batching
    embedder._model.encode.assert_called_once()


@pytest.mark.asyncio
async def test_embed_uses_normalize_embeddings():
    """Embedder passes normalize_embeddings=True so vectors are unit-length."""
    vectors = [[0.1, 0.2]]
    embedder = _make_embedder(vectors)

    await embedder.embed_query("normalize test")

    call_kwargs = embedder._model.encode.call_args.kwargs
    assert call_kwargs.get("normalize_embeddings") is True


@pytest.mark.asyncio
async def test_embed_model_name_from_settings():
    """HuggingFaceEmbedder reads the model name from settings (never hardcoded)."""
    mock_model = MagicMock()
    mock_model.encode.return_value = np.array([[0.1, 0.2]], dtype="float32")

    with patch("app.embeddings.huggingface.SentenceTransformer", return_value=mock_model) as mock_st:
        embedder = HuggingFaceEmbedder()
        # conftest sets HF_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
        mock_st.assert_called_once_with("BAAI/bge-small-en-v1.5")
