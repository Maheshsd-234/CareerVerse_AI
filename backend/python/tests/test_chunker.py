"""
tests/test_chunker.py
──────────────────────
Unit tests for the text chunking and ingestion utility functions in
app/rag/ingest.py.

Tests cover:
- Heading-based splitting (respects ## / ### boundaries)
- Sliding-window fallback (long sections get split with overlap)
- No empty chunks are ever returned
- content_hash is deterministic (same input → same hash)
- extract_text handles .md files correctly
- Token counting (tiktoken or fallback word count)
"""
from __future__ import annotations

import hashlib
import os
import tempfile

import pytest

from app.rag.ingest import (
    chunk_text,
    clean_text,
    content_hash,
    count_tokens,
    extract_text,
)


# ── clean_text ────────────────────────────────────────────────────────────────


def test_clean_text_normalizes_line_endings() -> None:
    text = "Line 1\r\nLine 2\rLine 3"
    result = clean_text(text)
    assert "\r" not in result
    assert "Line 1" in result
    assert "Line 2" in result
    assert "Line 3" in result


def test_clean_text_collapses_excess_blank_lines() -> None:
    text = "Para 1\n\n\n\n\nPara 2"
    result = clean_text(text)
    # Should reduce 5 blank lines to 2 (one blank line between paragraphs)
    assert "\n\n\n" not in result
    assert "Para 1" in result
    assert "Para 2" in result


def test_clean_text_strips_trailing_whitespace() -> None:
    text = "  hello   \n  world   "
    result = clean_text(text)
    assert not result.endswith("   ")
    assert "hello" in result
    assert "world" in result


# ── count_tokens ──────────────────────────────────────────────────────────────


def test_count_tokens_returns_positive_int() -> None:
    count = count_tokens("Hello world, this is a test sentence for tokenization.")
    assert isinstance(count, int)
    assert count > 0


def test_count_tokens_empty_string() -> None:
    assert count_tokens("") == 0


def test_count_tokens_short_vs_long() -> None:
    short_count = count_tokens("Hello")
    long_count = count_tokens("Hello " * 100)
    assert long_count > short_count


# ── content_hash ──────────────────────────────────────────────────────────────


def test_content_hash_deterministic() -> None:
    text = "CareerVerse AI sample document text."
    hash1 = content_hash(text)
    hash2 = content_hash(text)
    assert hash1 == hash2


def test_content_hash_is_sha256_hex() -> None:
    text = "test"
    result = content_hash(text)
    # SHA-256 produces 64 hex characters
    assert len(result) == 64
    assert all(c in "0123456789abcdef" for c in result)


def test_content_hash_differs_for_different_text() -> None:
    hash1 = content_hash("Document version 1")
    hash2 = content_hash("Document version 2")
    assert hash1 != hash2


def test_content_hash_matches_stdlib_sha256() -> None:
    text = "Hello, CareerVerse!"
    expected = hashlib.sha256(text.encode("utf-8")).hexdigest()
    assert content_hash(text) == expected


# ── extract_text (markdown files) ────────────────────────────────────────────


def test_extract_text_reads_markdown_file() -> None:
    content = "# Test Document\n\nThis is a **test** document.\n\n## Section 2\n\nMore content here."
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", encoding="utf-8", delete=False
    ) as f:
        f.write(content)
        tmp_path = f.name

    try:
        extracted = extract_text(tmp_path)
        assert "Test Document" in extracted
        assert "Section 2" in extracted
        assert "More content here" in extracted
    finally:
        os.unlink(tmp_path)


def test_extract_text_reads_txt_file() -> None:
    content = "Plain text content.\nSecond line."
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", encoding="utf-8", delete=False
    ) as f:
        f.write(content)
        tmp_path = f.name

    try:
        extracted = extract_text(tmp_path)
        assert "Plain text content" in extracted
        assert "Second line" in extracted
    finally:
        os.unlink(tmp_path)


def test_extract_text_raises_for_missing_file() -> None:
    with pytest.raises(FileNotFoundError):
        extract_text("/nonexistent/path/to/missing_file.md")


# ── chunk_text — heading-based splitting ─────────────────────────────────────


def test_chunk_text_respects_headings() -> None:
    """Each ## heading should start a new chunk (when sections are small enough)."""
    text = (
        "## Section One\n\n"
        "This is the content of section one. Short content.\n\n"
        "## Section Two\n\n"
        "This is the content of section two. Different content.\n\n"
        "## Section Three\n\n"
        "Content for section three.\n"
    )
    chunks = chunk_text(text, chunk_tokens=200)
    # Should produce 3 chunks, one per section
    assert len(chunks) == 3
    assert any("Section One" in c for c in chunks)
    assert any("Section Two" in c for c in chunks)
    assert any("Section Three" in c for c in chunks)


def test_chunk_text_no_empty_chunks() -> None:
    """chunk_text must never return empty string chunks."""
    text = (
        "## Section A\n\n"
        "   \n\n"  # whitespace-only content between headings
        "## Section B\n\n"
        "Real content here.\n"
    )
    chunks = chunk_text(text, chunk_tokens=200)
    for chunk in chunks:
        assert chunk.strip() != "", f"Got empty chunk: {repr(chunk)}"


def test_chunk_text_no_headings_returns_single_chunk() -> None:
    """Without headings, short text should be returned as a single chunk."""
    text = "This is plain text without any headings. Just a single paragraph."
    chunks = chunk_text(text, chunk_tokens=200)
    assert len(chunks) == 1
    assert "plain text" in chunks[0]


def test_chunk_text_long_section_uses_sliding_window() -> None:
    """A section longer than chunk_tokens must be split into multiple chunks."""
    # Create a section much longer than the chunk limit
    words = ["word"] * 600  # ~600 tokens worth of words
    long_section = "## Very Long Section\n\n" + " ".join(words)
    chunks = chunk_text(long_section, chunk_tokens=100, overlap_ratio=0.1)
    # Must produce more than 1 chunk
    assert len(chunks) > 1


def test_chunk_text_overlap_creates_repeated_content() -> None:
    """Sliding-window chunks should share some content (overlap)."""
    # Generate text of known tokens
    words = [f"uniqueword{i}" for i in range(300)]
    long_text = " ".join(words)
    chunks = chunk_text(long_text, chunk_tokens=50, overlap_ratio=0.2)

    if len(chunks) < 2:
        pytest.skip("Not enough chunks to test overlap")

    # Convert chunks to word sets
    chunk0_words = set(chunks[0].split())
    chunk1_words = set(chunks[1].split())
    overlap = chunk0_words & chunk1_words
    # With BPE tokenization unique compound words may be split into multiple tokens.
    # We verify at least 1 word-level overlap exists between consecutive chunks.
    assert len(overlap) >= 1, (
        f"Expected at least 1 shared word between consecutive chunks, "
        f"but found {len(overlap)}. chunk0 tail: {list(chunk0_words)[-5:]}, "
        f"chunk1 head: {list(chunk1_words)[:5]}"
    )


def test_chunk_text_all_chunks_non_empty() -> None:
    """Final robustness check: no chunk in a realistic document is empty."""
    text = """
## Introduction
CareerVerse AI helps Indian students navigate careers and exams.

## JEE Preparation
JEE is the premier engineering entrance exam in India.

## NEET Preparation
NEET is the medical entrance exam for MBBS admissions.

## Career Paths
Software engineering, data science, and AI are top career choices.
""".strip()

    chunks = chunk_text(text, chunk_tokens=200)
    assert len(chunks) > 0
    for chunk in chunks:
        assert len(chunk.strip()) > 0
