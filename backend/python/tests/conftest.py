"""
tests/conftest.py
──────────────────
Shared pytest fixtures and environment setup.

All required env vars are injected via monkeypatch so no real .env is needed
to run the test suite.
"""
from __future__ import annotations

from collections.abc import Generator

import pytest


@pytest.fixture(autouse=True)
def patch_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    Inject all required environment variables before each test.
    Prevents Settings() from raising ValidationError for missing fields.
    """
    env = {
        "FIREBASE_SERVICE_ACCOUNT_PATH": "./fake-service-account.json",
        "QDRANT_URL": "http://localhost:6333",
        "QDRANT_API_KEY": "",
        "QDRANT_COLLECTION": "test_careerverse",
        "HF_EMBEDDING_MODEL": "BAAI/bge-small-en-v1.5",
        "EMBEDDING_MODEL": "BAAI/bge-small-en-v1.5",
        "EMBEDDING_DEVICE": "cpu",
        "EMBEDDING_BATCH_SIZE": "32",
        "EMBEDDING_QUERY_INSTRUCTION": "Represent this sentence for searching relevant passages: ",
        "GROQ_API_KEY": "gsk_test",
        "GROQ_MODEL": "openai/gpt-oss-20b",
        "GROQ_MAX_TOKENS": "4096",
        "GROQ_TEMPERATURE": "0.7",
        "GEMINI_API_KEY": "AIza_test",
        "GEMINI_MODEL": "gemini-3.8-flash",
        "CORS_ORIGINS": '["http://localhost:5173"]',
        "LOG_LEVEL": "DEBUG",
        "RAG_TOP_K": "3",
        "RETRIEVAL_MIN_SCORE": "0.45",
        "RATE_LIMIT_REQUESTS": "30",
        "RATE_LIMIT_WINDOW_SECONDS": "60",
        "MAX_HISTORY_TURNS": "6",
        "QUERY_CONDENSE_TIMEOUT_SECONDS": "5.0",
        "INTENT_CLASSIFIER_TIMEOUT_SECONDS": "3.5",
    }
    for key, value in env.items():
        monkeypatch.setenv(key, value)

    # Clear lru_cache so Settings is re-instantiated with the patched env vars
    from app.config import get_settings
    get_settings.cache_clear()

    # Clear embedder cache so it re-reads the patched HF model setting
    try:
        from app.embeddings.huggingface import get_embedder
        get_embedder.cache_clear()
    except Exception:
        pass

    # Clear rag/embeddings model cache for clean test isolation
    try:
        from app.rag.embeddings import _load_model
        _load_model.cache_clear()
    except Exception:
        pass


@pytest.fixture(autouse=True)
def reset_sse_starlette_app_status() -> Generator[None, None, None]:
    """Reset sse_starlette AppStatus should_exit_event across asyncio test loops."""
    try:
        from sse_starlette.sse import AppStatus
        AppStatus.should_exit_event = None
    except Exception:
        pass
    yield
    try:
        from sse_starlette.sse import AppStatus
        AppStatus.should_exit_event = None
    except Exception:
        pass
