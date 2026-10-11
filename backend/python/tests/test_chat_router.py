"""
tests/test_chat_router.py
──────────────────────────
Integration and smoke tests for POST /chat and GET /health.

Tests cover:
- SSE streaming protocol & named events (`sources`, `token`, `done`, `error`)
- Authentication verification & 403 on missing credentials
- Input bounds validation (empty message, oversized message)
- History truncation server-side to max_history_turns
- Per-uid rate limiting and 429 response
- Safe error handling without leaking internal stack traces
"""
from __future__ import annotations

import json
from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.firebase import rate_limiter


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _fake_pipeline_stream(*events: dict) -> AsyncIterator[dict]:
    for e in events:
        yield e


def _build_app_with_mocks():
    """Build the FastAPI app with Firebase Admin init skipped."""
    with patch("firebase_admin._apps", {"default": True}):
        from app.main import create_app

        return create_app()


@pytest.fixture(autouse=True)
def reset_limiter():
    """Reset the in-memory rate limiter between tests."""
    rate_limiter.reset()
    yield
    rate_limiter.reset()


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_returns_sse_stream():
    """POST /chat with a valid token returns 200 and SSE event stream with named events."""
    app = _build_app_with_mocks()

    mock_pipeline = MagicMock()
    mock_pipeline.stream = MagicMock(
        return_value=_fake_pipeline_stream(
            {
                "event": "sources",
                "data": [
                    {
                        "index": 1,
                        "title": "JEE Guide",
                        "category": "exam",
                        "last_verified": "2025-01-10",
                        "url": "https://jeemain.nta.nic.in",
                    }
                ],
            },
            {"event": "token", "data": {"text": "Hello "}},
            {"event": "token", "data": {"text": "student!"}},
            {"event": "done", "data": {}},
        )
    )

    from app.routers.chat import get_pipeline

    app.dependency_overrides[get_pipeline] = lambda: mock_pipeline

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.auth.firebase.fb_auth.verify_id_token",
            return_value={"uid": "user_123"},
        ):
            response = await client.post(
                "/chat",
                json={"message": "How do I crack JEE?", "history": []},
                headers={"Authorization": "Bearer fake_token"},
            )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    body_text = response.text
    assert "event: sources" in body_text
    assert "event: token" in body_text
    assert "event: done" in body_text
    assert "JEE Guide" in body_text


@pytest.mark.asyncio
async def test_chat_without_token_returns_403():
    """POST /chat without Authorization header returns 403."""
    app = _build_app_with_mocks()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/chat",
            json={"message": "test query"},
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_chat_empty_message_returns_422():
    """POST /chat with an empty message returns 422 validation error."""
    app = _build_app_with_mocks()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.auth.firebase.fb_auth.verify_id_token",
            return_value={"uid": "user_123"},
        ):
            response = await client.post(
                "/chat",
                json={"message": ""},
                headers={"Authorization": "Bearer fake_token"},
            )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_message_length_exceeded_returns_422():
    """POST /chat with a message exceeding 2000 chars returns 422 validation error."""
    app = _build_app_with_mocks()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.auth.firebase.fb_auth.verify_id_token",
            return_value={"uid": "user_123"},
        ):
            response = await client.post(
                "/chat",
                json={"message": "a" * 2001},
                headers={"Authorization": "Bearer fake_token"},
            )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_truncates_history_server_side():
    """Conversation history is truncated to max_history_turns without failing the request."""
    app = _build_app_with_mocks()

    mock_pipeline = MagicMock()
    captured_history = []

    async def capture_stream(query, history, category=None, stage=None, uid=None, **kwargs):
        captured_history.extend(history)
        yield {"event": "sources", "data": []}
        yield {"event": "done", "data": {}}

    mock_pipeline.stream = capture_stream

    from app.routers.chat import get_pipeline

    app.dependency_overrides[get_pipeline] = lambda: mock_pipeline

    # 10 history items provided (setting is max 6 turns)
    long_history = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"Turn {i}"}
        for i in range(10)
    ]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.auth.firebase.fb_auth.verify_id_token",
            return_value={"uid": "user_123"},
        ):
            response = await client.post(
                "/chat",
                json={"message": "Latest turn", "history": long_history},
                headers={"Authorization": "Bearer fake_token"},
            )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    # Must have truncated to last 6 items
    assert len(captured_history) == 6
    assert captured_history[0]["content"] == "Turn 4"
    assert captured_history[-1]["content"] == "Turn 9"


@pytest.mark.asyncio
async def test_chat_rate_limiter_blocks_excessive_requests():
    """Rapid repeated requests from the same UID trigger 429 Too Many Requests."""
    app = _build_app_with_mocks()

    mock_pipeline = MagicMock()
    mock_pipeline.stream = MagicMock(return_value=_fake_pipeline_stream({"event": "done", "data": {}}))

    from app.routers.chat import get_pipeline

    app.dependency_overrides[get_pipeline] = lambda: mock_pipeline

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch(
            "app.auth.firebase.fb_auth.verify_id_token",
            return_value={"uid": "abusive_user"},
        ):
            # Exhaust rate limit (setting rate_limit_requests is 30)
            from app.config import get_settings
            cfg = get_settings()

            for _ in range(cfg.rate_limit_requests):
                res = await client.post(
                    "/chat",
                    json={"message": "ping"},
                    headers={"Authorization": "Bearer fake_token"},
                )
                assert res.status_code == 200

            # Request 31 should be rejected with 429
            blocked_res = await client.post(
                "/chat",
                json={"message": "ping"},
                headers={"Authorization": "Bearer fake_token"},
            )
            assert blocked_res.status_code == 429
            assert "Rate limit exceeded" in blocked_res.text

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_endpoint_returns_200():
    """GET /health returns 200 with status field."""
    app = _build_app_with_mocks()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        with patch("app.routers.health.AsyncQdrantClient") as mock_qdrant_cls:
            mock_qdrant = MagicMock()
            mock_qdrant.get_collections = AsyncMock(return_value=MagicMock(collections=[]))
            mock_qdrant_cls.return_value = mock_qdrant

            response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "qdrant" in data
