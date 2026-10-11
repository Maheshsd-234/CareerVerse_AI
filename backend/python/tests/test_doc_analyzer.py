"""
tests/test_doc_analyzer.py
───────────────────────────
Tests for document text extraction and document analysis SSE streaming.
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.rag.doc_analyzer import extract_text_from_file, stream_document_analysis


def test_extract_text_from_txt():
    content = b"This is a test career document on NEET UG preparation."
    text, pages = extract_text_from_file("notes.txt", content)
    assert "NEET UG" in text
    assert pages == 1


def test_extract_text_from_markdown():
    content = b"# Syllabus\n- Physics: Mechanics\n- Chemistry: Organic"
    text, pages = extract_text_from_file("syllabus.md", content)
    assert "Physics: Mechanics" in text
    assert pages == 1


def test_extract_unsupported_format_raises():
    with pytest.raises(ValueError, match="Unsupported file format"):
        extract_text_from_file("image.png", b"fake binary data")


def test_extract_empty_file_raises():
    with pytest.raises(ValueError, match="empty"):
        extract_text_from_file("empty.txt", b"")


@pytest.mark.asyncio
async def test_stream_document_analysis_yields_expected_events():
    fake_chunks = ["### Top 5 Questions\n\n", "1. **What is the NEET UG marking scheme?**"]

    async def mock_groq(messages):
        for c in fake_chunks:
            yield c

    with patch("app.rag.doc_analyzer.stream_groq", side_effect=mock_groq):
        events = []
        async for event in stream_document_analysis(
            filename="neet_guide.md",
            text="NEET Guide content here",
            page_count=1,
            user_prompt="Give top 5 questions",
        ):
            events.append(event)

        event_names = [e["event"] for e in events]
        assert "mode" in event_names
        assert "sources" in event_names
        assert "token" in event_names
        assert "done" in event_names

        tokens = [e["data"]["text"] for e in events if e["event"] == "token"]
        assert "".join(tokens) == "### Top 5 Questions\n\n1. **What is the NEET UG marking scheme?**"
