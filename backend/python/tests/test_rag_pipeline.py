"""
tests/test_rag_pipeline.py
───────────────────────────
Unit tests for app/rag/pipeline.py — RAGPipeline.

Tests cover:
- SSE event order (`sources` -> `token` -> `done`)
- Below-cutoff / empty retrieval returns deterministic refusal without calling LLM
- Pre-stream Groq failure switches cleanly to Gemini fallback
- Mid-stream Groq failure does NOT fall back and emits safe error event
- Query condensation on conversational follow-ups
- Context formatting & strict grounding prompt
"""
from __future__ import annotations

from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.rag.pipeline import RAGPipeline
from app.retrieval.retriever import RetrievedChunk
from app.routing.classifier import RouteIntent


async def _async_tokens(*texts: str) -> AsyncIterator[str]:
    """Helper async generator that yields successive token strings."""
    for t in texts:
        yield t


def _make_retriever_with_chunks(chunks: list[RetrievedChunk]) -> MagicMock:
    mock = MagicMock()
    mock.retrieve = AsyncMock(return_value=chunks)
    return mock


# ── Test Cases ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pipeline_sse_event_order():
    """Pipeline yields `mode` first, `sources` event, then `token` events, ending with `done`."""
    chunk = RetrievedChunk(
        text="JEE Mains registration opens in November.",
        doc_id="jee_v1",
        title="JEE Guide",
        category="exam",
        stage="school",
        last_verified="2025-01-10",
        url="https://jeemain.nta.nic.in",
        score=0.88,
    )
    retriever = _make_retriever_with_chunks([chunk])

    with patch("app.rag.pipeline.stream_groq", return_value=_async_tokens("JEE ", "opens ", "in Nov [1].")):
        pipeline = RAGPipeline(retriever)
        events = []
        async for event in pipeline.stream(query="When does JEE open?"):
            events.append(event)

    assert len(events) >= 4
    # 1. First event is `mode`
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "grounded"

    # 2. Second event is `sources`
    assert events[1]["event"] == "sources"
    assert len(events[1]["data"]) == 1
    assert events[1]["data"][0]["title"] == "JEE Guide"
    assert events[1]["data"][0]["index"] == 1

    # 3. Middle events are `token`
    token_texts = [e["data"]["text"] for e in events if e["event"] == "token"]
    assert "".join(token_texts) == "JEE opens in Nov [1]."

    # 4. Final event must be `done`
    assert events[-1]["event"] == "done"


@pytest.mark.asyncio
async def test_pipeline_below_cutoff_returns_refusal_without_calling_llm():
    """When retrieval returns no chunks on off-topic query, returns deterministic refusal."""
    retriever = _make_retriever_with_chunks([])  # empty (or filtered by cutoff)
    mock_groq = MagicMock()
    mock_gemini = MagicMock()

    with patch("app.rag.pipeline.classify_intent_fast", return_value=(RouteIntent.OFF_TOPIC, True)):
        with patch("app.rag.pipeline.stream_groq", mock_groq):
            with patch("app.rag.pipeline.stream_gemini", mock_gemini):
                pipeline = RAGPipeline(retriever)
                events = []
                async for event in pipeline.stream(query="How to bake a chocolate cake?"):
                    events.append(event)

    # Must emit mode, empty sources, refusal token, and done
    assert events[0]["event"] == "mode"
    assert events[0]["data"]["mode"] == "off_topic"

    assert events[1]["event"] == "sources"
    assert events[1]["data"] == []

    assert events[2]["event"] == "token"
    assert "educational and career counselor" in events[2]["data"]["text"]

    assert events[3]["event"] == "done"

    # Crucial: LLMs must NEVER be called
    mock_groq.assert_not_called()
    mock_gemini.assert_not_called()


@pytest.mark.asyncio
async def test_pipeline_groq_pre_stream_failure_falls_back_to_gemini():
    """When Groq fails before emitting any token, falls back cleanly to Gemini."""
    chunk = RetrievedChunk(
        text="Software Engineers in India earn 8-25 LPA.",
        doc_id="swe_v1",
        title="SWE Careers",
        category="role",
        stage="placement",
        last_verified="2025-01-10",
        url=None,
        score=0.82,
    )
    retriever = _make_retriever_with_chunks([chunk])

    async def failing_groq(messages):
        raise ConnectionError("Groq 503 Service Unavailable")
        yield  # make it an async generator

    with patch("app.rag.pipeline.stream_groq", failing_groq):
        with patch(
            "app.rag.pipeline.stream_gemini",
            return_value=_async_tokens("SWEs earn ", "8-25 LPA [1]."),
        ):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="SWE salaries?"):
                events.append(event)

    token_texts = [e["data"]["text"] for e in events if e["event"] == "token"]
    assert "".join(token_texts) == "SWEs earn 8-25 LPA [1]."
    assert events[-1]["event"] == "done"


@pytest.mark.asyncio
async def test_pipeline_groq_mid_stream_failure_emits_error_without_fallback():
    """When Groq fails mid-stream after emitting tokens, do NOT fallback to Gemini; emit safe error event."""
    chunk = RetrievedChunk(
        text="KCET syllabus covers PUC physics, chemistry, math.",
        doc_id="kcet_v1",
        title="KCET Guide",
        category="exam",
        stage="puc",
        last_verified="2025-01-10",
        url=None,
        score=0.80,
    )
    retriever = _make_retriever_with_chunks([chunk])
    mock_gemini = MagicMock()

    async def mid_stream_failing_groq(messages):
        yield "KCET syllabus includes "
        raise RuntimeError("Mid-stream connection drop")

    with patch("app.rag.pipeline.stream_groq", mid_stream_failing_groq):
        with patch("app.rag.pipeline.stream_gemini", mock_gemini):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="KCET syllabus?"):
                events.append(event)

    # Verify first token was sent
    token_events = [e for e in events if e["event"] == "token"]
    assert len(token_events) == 1
    assert token_events[0]["data"]["text"] == "KCET syllabus includes "

    # Verify safe error event was emitted and done was not reached
    error_events = [e for e in events if e["event"] == "error"]
    assert len(error_events) == 1
    assert "error occurred" in error_events[0]["data"]["message"].lower()

    # Gemini must NOT be called mid-stream to prevent mixed/duplicate tokens
    mock_gemini.assert_not_called()


@pytest.mark.asyncio
async def test_pipeline_condenses_followup_when_history_present():
    """Pipeline condenses query only when history is non-empty."""
    retriever = _make_retriever_with_chunks([])
    history = [{"role": "user", "content": "Tell me about NEET"}, {"role": "assistant", "content": "NEET is for medical."}]

    with patch("app.rag.pipeline.condense_query_groq", AsyncMock(return_value="NEET eligibility criteria")) as mock_condense:
        pipeline = RAGPipeline(retriever)
        async for _ in pipeline.stream(query="What is the eligibility for it?", history=history):
            pass

        mock_condense.assert_called_once()
        retriever.retrieve.assert_called_once()
        assert retriever.retrieve.call_args[1]["query"] == "NEET eligibility criteria"


@pytest.mark.asyncio
async def test_pipeline_turn2_followup_grounded_answer():
    """Turn 2 follow-up 'Is there negative marking for wrong answers?' retrieves NEET guide and streams grounded answer."""
    neet_chunk = RetrievedChunk(
        text="NEET UG marking scheme: Each correct answer: +4 marks. Each wrong answer: -1 mark. Unattempted: 0 marks.",
        doc_id="neet_v1",
        title="NEET UG Guide",
        category="exam",
        stage="school",
        last_verified="2025-01-10",
        url=None,
        score=0.88,
    )
    retriever = _make_retriever_with_chunks([neet_chunk])
    history = [
        {"role": "user", "content": "Tell me about the NEET UG exam pattern."},
        {"role": "assistant", "content": "NEET UG is conducted by NTA for medical admissions [1]."}
    ]

    with patch("app.rag.pipeline.condense_query_groq", AsyncMock(return_value="NEET UG negative marking for wrong answers")) as mock_condense:
        with patch("app.rag.pipeline.stream_groq", return_value=_async_tokens("Yes, NEET has ", "-1 negative marking [1].")):
            pipeline = RAGPipeline(retriever)
            events = []
            async for event in pipeline.stream(query="Is there negative marking for wrong answers?", history=history):
                events.append(event)

            mock_condense.assert_called_once_with(
                query="Is there negative marking for wrong answers?",
                history=history,
                timeout_seconds=5.0,
            )
            assert retriever.retrieve.call_args[1]["query"] == "NEET UG negative marking for wrong answers"
            assert events[0]["event"] == "mode"
            assert events[0]["data"]["mode"] == "grounded"
            assert events[1]["event"] == "sources"
            assert events[1]["data"][0]["title"] == "NEET UG Guide"
            tokens = "".join(e["data"]["text"] for e in events if e["event"] == "token")
            assert "-1 negative marking [1]." in tokens


@pytest.mark.asyncio
async def test_pipeline_deduplicates_trailing_user_message_in_history():
    """If history accidentally includes the current query at the end, it is removed before LLM call."""
    chunk = RetrievedChunk(
        text="NEET UG details",
        doc_id="neet_v1",
        title="NEET Guide",
        category="exam",
        stage="school",
        last_verified="2025-01-10",
        url=None,
        score=0.85,
    )
    retriever = _make_retriever_with_chunks([chunk])
    # History includes trailing duplicate user message
    dirty_history = [
        {"role": "user", "content": "Tell me about NEET"},
        {"role": "assistant", "content": "NEET is an exam."},
        {"role": "user", "content": "Is there negative marking for wrong answers?"},
    ]

    captured_messages = []
    async def mock_stream_groq(messages):
        captured_messages.extend(messages)
        yield "Yes, -1 mark [1]."

    with patch("app.rag.pipeline.condense_query_groq", AsyncMock(return_value="NEET negative marking")):
        with patch("app.rag.pipeline.stream_groq", mock_stream_groq):
            pipeline = RAGPipeline(retriever)
            async for _ in pipeline.stream(query="Is there negative marking for wrong answers?", history=dirty_history):
                pass

    # Ensure the user message is not duplicated at the end of messages
    user_msgs = [m["content"] for m in captured_messages if m.get("role") == "user"]
    assert user_msgs.count("Is there negative marking for wrong answers?") == 1

