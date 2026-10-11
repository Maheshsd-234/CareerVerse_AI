"""
tests/test_config.py
─────────────────────
Unit tests for app/config.py — Settings class.
"""
from __future__ import annotations

import pytest

from app.config import Settings, get_settings


def test_settings_reads_env_vars() -> None:
    """Settings correctly reads all required fields from environment."""
    cfg = get_settings()
    assert cfg.groq_model == "openai/gpt-oss-20b"
    assert cfg.gemini_model == "gemini-3.8-flash"
    assert cfg.hf_embedding_model == "BAAI/bge-small-en-v1.5"
    assert cfg.qdrant_collection == "test_careerverse"
    assert cfg.rag_top_k == 3


def test_settings_groq_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """groq_api_key is correctly loaded from env."""
    get_settings.cache_clear()
    monkeypatch.setenv("GROQ_API_KEY", "gsk_my_key")
    cfg = Settings()  # type: ignore[call-arg]
    assert cfg.groq_api_key == "gsk_my_key"


def test_settings_cors_origins_list() -> None:
    """cors_origins is parsed into a list of strings."""
    cfg = get_settings()
    assert isinstance(cfg.cors_origins, list)
    assert "http://localhost:5173" in cfg.cors_origins


def test_settings_hf_model_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """hf_embedding_model reads from env — never hardcoded."""
    get_settings.cache_clear()
    monkeypatch.setenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    cfg = Settings()  # type: ignore[call-arg]
    assert cfg.hf_embedding_model == "sentence-transformers/all-MiniLM-L6-v2"
