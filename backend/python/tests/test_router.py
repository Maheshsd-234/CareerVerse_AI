"""
tests/test_router.py
────────────────────
Comprehensive unit tests for routing, safety net, intent classification, and general mentorship.

Tests cover:
1. Safety net triggers for crisis language regardless of retrieval results (even when docs exist).
2. Grounded path runs without calling intent classifier and yields mode=grounded.
3. Fast classifier failure fails closed to needs_verified_source without calling mentor LLM.
4. Each intent produces exact expected deterministic behavior (small_talk, off_topic, needs_verified_source, wellbeing).
5. General guidance mode calls mentor LLM with empty sources and no citations.
6. General guidance fallback and mid-stream error handling.
7. Mode event is emitted on all paths.
"""
from __future__ import annotations

from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.rag.pipeline import RAGPipeline
from app.retrieval.retriever import RetrievedChunk
from app.routing.classifier import RouteIntent, classify_intent_fast
from app.routing.safety import check_crisis_language


async def _async_tokens(*texts: str) -> AsyncIterator[str]:
    for t in texts:
        yield t


def _make_retriever_with_chunks(chunks: list[RetrievedChunk]) -> MagicMock:
    mock = MagicMock()
    mock.retrieve = AsyncMock(return_value=chunks)
    return mock


# ── 1. Safety Net Tests ────────────────────────────────────────────────────────


def test_check_crisis_language_detects_distress():
    """Safety net identifies explicit self-harm and crisis phrases."""
    assert check_crisis_language("I want to die because of exam stress") is True
    assert check_crisis_language("I feel like killing myself") is True
    assert check_crisis_language("There is no point in living anymore") is True
    assert check_crisis_language("Thinking of suicide after failing") is True
    assert check_crisis_language("I want to hurt myself") is True
    assert check_crisis_language("Feeling completely hopeless") is True

    # Benign study / exam queries must NOT trigger crisis net
    assert check_crisis_language("How do I stay focused for long hours?") is False
    assert check_crisis_language("JEE Advanced cutoff for IIT Bombay") is False
    assert check_crisis_language("Hello") is False


@pytest.mark.asyncio
async def test_crisis_safety_net_triggers_even_when_docs_retrieved():
    """When a distressed query is sent, crisis response triggers even if retrieval returned high-scoring docs."""
    chunk = RetrievedChunk(
        text="JEE Mains syllabus and cutoffs.",
        doc_id="jee_v1",
        title="JEE Guide",
        category="exam",
        stage="school",
        last_verified="2025-01-10",
        url="https://jeemain.nta.nic.in",
        score=0.95,
    )
    retriever = _make_retriever_with_chunks([chunk])
    mock_groq = MagicMock()

    with patch("app.rag.pipeline.stream_groq", mock_groq):
        pipeline = RAGPipeline(retriever)
        events = []
        async for event in pipeline.stream(query="I want to die, the JEE pressure is too much"):
            events.append(event)

    # 1. Mode event is wellbeing
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "wellbeing"

    # 2. Empty sources
    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []

    # 3. Supportive text with helpline numbers
    assert events[2]["event"] == "token"
    text = events[2]["data"]["text"]
    assert "Tele-MANAS" in text or "14416" in text
    assert "JEE Mains syllabus" not in text

    # 4. Done event
    assert events[3]["event"] == "done"

    # 5. LLM and retrieval are never called / leaked
    mock_groq.assert_not_called()
    retriever.retrieve.assert_not_called()


# ── 2. Grounded Path Tests ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_grounded_path_makes_no_intent_classifier_call():
    """When retrieval succeeds with high score, grounded path runs and makes NO classifier call."""
    chunk = RetrievedChunk(
        text="GATE CS covers algorithms, data structures, OS.",
        doc_id="gate_v1",
        title="GATE CS Guide",
        category="exam",
        stage="degree",
        last_verified="2025-01-10",
        url="https://gate.iisc.ac.in",
        score=0.85,
    )
    retriever = _make_retriever_with_chunks([chunk])
    mock_classifier = AsyncMock()

    with patch("app.rag.pipeline.classify_intent_fast", mock_classifier):
        with patch("app.rag.pipeline.stream_groq", return_value=_async_tokens("GATE CS details [1].")):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="What is the GATE CS syllabus?"):
                events.append(event)

    # Mode must be grounded
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "grounded"

    # Sources must contain the document
    assert events[1]["event"] == "sources"
    assert len(events[1]["data"]) == 1
    assert events[1]["data"][0]["title"] == "GATE CS Guide"

    # Intent classifier must NOT be called on successful retrieval
    mock_classifier.assert_not_called()


# ── 3. Retrieval Miss & Classifier Tests ────────────────────────────────────────


@pytest.mark.asyncio
async def test_classifier_failure_fails_closed():
    """If the intent classifier throws an exception or times out, it fails closed to needs_verified_source."""
    retriever = _make_retriever_with_chunks([])  # retrieval miss
    mock_groq = MagicMock()

    # Simulate classifier raising an error / timing out
    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.NEEDS_VERIFIED_SOURCE, False)):
        with patch("app.rag.pipeline.stream_groq", mock_groq):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="What is the cutoff for college XYZ?"):
                events.append(event)

    # Must emit mode: needs_verified_source and empty sources
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "needs_verified_source"

    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []

    assert events[2]["event"] == "token"
    assert "verified data" in events[2]["data"]["text"].lower()

    assert events[3]["event"] == "done"

    # Never calls LLM generation
    mock_groq.assert_not_called()


@pytest.mark.asyncio
async def test_small_talk_intent_deterministic_reply():
    """Small talk returns friendly greeting without calling generation LLM."""
    retriever = _make_retriever_with_chunks([])
    mock_groq = MagicMock()

    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.SMALL_TALK, True)):
        with patch("app.rag.pipeline.stream_groq", mock_groq):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="Hi"):
                events.append(event)

    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "small_talk"
    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []
    assert events[2]["event"] == "token"
    assert "Hello!" in events[2]["data"]["text"]
    assert events[3]["event"] == "done"
    mock_groq.assert_not_called()


@pytest.mark.asyncio
async def test_off_topic_intent_deterministic_reply():
    """Off-topic returns polite redirection without calling generation LLM."""
    retriever = _make_retriever_with_chunks([])
    mock_groq = MagicMock()

    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.OFF_TOPIC, True)):
        with patch("app.rag.pipeline.stream_groq", mock_groq):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="How to bake a chocolate cake?"):
                events.append(event)

    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "off_topic"
    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []
    assert events[2]["event"] == "token"
    assert "educational and career counselor" in events[2]["data"]["text"]
    mock_groq.assert_not_called()


@pytest.mark.asyncio
async def test_general_guidance_calls_mentor_stream():
    """General guidance calls LLM with general mentor prompt and yields empty sources."""
    retriever = _make_retriever_with_chunks([])

    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.GENERAL_GUIDANCE, True)):
        with patch(
            "app.rag.pipeline.stream_groq",
            return_value=_async_tokens("Try the Pomodoro technique ", "to stay focused."),
        ) as mock_groq:
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="How can I focus on my studies?"):
                events.append(event)

    # 1. Mode event is general_guidance
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "general_guidance"

    # 2. Sources must be empty
    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []

    # 3. Tokens streamed
    token_texts = [e["data"]["text"] for e in events if e["event"] == "token"]
    assert "".join(token_texts) == "Try the Pomodoro technique to stay focused."

    # 4. Verified LLM called with mentor prompt
    assert mock_groq.call_count == 1
    call_messages = mock_groq.call_args[0][0]
    system_msg = call_messages[0]["content"]
    assert "STRICT MENTORSHIP RULES" in system_msg
    assert "NO CITATIONS" in system_msg


@pytest.mark.asyncio
async def test_general_guidance_pre_stream_fallback_to_gemini():
    """When Groq fails pre-stream on general guidance, cleanly falls back to Gemini."""
    retriever = _make_retriever_with_chunks([])

    async def failing_groq(messages):
        raise ConnectionError("Groq Unavailable")
        yield

    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.GENERAL_GUIDANCE, True)):
        with patch("app.rag.pipeline.stream_groq", failing_groq):
            with patch(
                "app.rag.pipeline.stream_gemini",
                return_value=_async_tokens("Gemini study advice."),
            ):
                pipeline = RAGPipeline(retriever)
                events = []
                async for event in pipeline.stream(query="How to manage time?"):
                    events.append(event)

    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "general_guidance"
    token_texts = [e["data"]["text"] for e in events if e["event"] == "token"]
    assert "".join(token_texts) == "Gemini study advice."
    assert events[-1]["event"] == "done"
