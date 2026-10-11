"""
app/config.py
─────────────
Single source of truth for all runtime configuration.
Every value is read from environment variables (or a .env file).
No secret is ever hard-coded here.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Pydantic-Settings model.
    Field names map 1-to-1 to environment variable names (case-insensitive).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    # ── Retrieval & History ───────────────────────────────────────────────────
    retrieval_top_k: int = 5
    retrieval_min_score: float = 0.70      # calibrated cutoff: in-domain >= 0.71, general/hostel/off-topic < 0.70
    max_history_turns: int = 6
    query_condense_timeout_seconds: float = 5.0
    intent_classifier_timeout_seconds: float = 3.5

    # ── Wellbeing / Safety Resources (India) ──────────────────────────────────
    wellbeing_helpline_name: str = "Tele-MANAS (Govt of India)"
    wellbeing_helpline_number: str = "14416 / 1800-891-4416"
    wellbeing_helpline_additional: str = "KIRAN: 1800-599-0019 | Vandrevala Foundation: +91 9999 666 555"

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    # ── Firebase ──────────────────────────────────────────────────────────────
    firebase_service_account_path: str = "./firebase-service-account.json"
    firebase_project_id: str = "careerverse-ai-21c80"

    # ── Qdrant ────────────────────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""          # empty string = no auth (local Docker)
    qdrant_collection: str = "careerverse_rag"

    # ── HuggingFace local embeddings ──────────────────────────────────────────
    # Model is downloaded once and cached locally by sentence-transformers.
    # No API key needed. Runs completely offline after first download.
    # Recommended free models (all 384-dim, great for RAG):
    #   BAAI/bge-small-en-v1.5   ~130 MB — best retrieval accuracy (default)
    #   sentence-transformers/all-MiniLM-L6-v2  ~90 MB — fastest option
    hf_embedding_model: str = "BAAI/bge-small-en-v1.5"

    # ── Embedding settings (used by rag/embeddings.py and ingest.py) ──────────
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_device: str = "cpu"
    embedding_batch_size: int = 32
    embedding_query_instruction: str = (
        "Represent this sentence for searching relevant passages: "
    )

    # ── Groq (primary LLM) ───────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    groq_max_tokens: int = 4096
    groq_temperature: float = 0.7

    # ── Gemini (fallback LLM + optional Gemini embeddings) ───────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # ── App ───────────────────────────────────────────────────────────────────
    # Accepts either a JSON array string or a comma-separated plain string:
    #   '["http://localhost:5173"]'  OR  'http://localhost:5173,http://localhost:3000'
    cors_origins: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]
    log_level: str = "INFO"
    rag_top_k: int = 5

    @field_validator("cors_origins", mode="after")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Accept both a JSON array string and a plain comma-separated string."""
        if isinstance(v, list):
            return v  # already a list (e.g. from default)
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                return json.loads(stripped)  # JSON array
            return [o.strip() for o in stripped.split(",") if o.strip()]
        return list(v)  # type: ignore[arg-type]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()  # type: ignore[call-arg]


# Module-level alias — lets rag/embeddings.py use `from app.config import settings`
settings = get_settings
