"""
app/embeddings/nvidia.py  ← compatibility shim
────────────────────────────────────────────────
Nvidia NIM embeddings have been replaced by free local HuggingFace embeddings
via sentence-transformers.

This module is kept as a shim so any existing imports don't break.
All symbols are re-exported from huggingface.py.
"""
from app.embeddings.huggingface import HuggingFaceEmbedder as NvidiaEmbedder  # noqa: F401
from app.embeddings.huggingface import get_embedder  # noqa: F401

__all__ = ["NvidiaEmbedder", "get_embedder"]
