"""
app/routers/chat.py
────────────────────
POST /chat — Authenticated, rate-limited, SSE streaming RAG chat endpoint.

SSE Contract
────────────
- `event: sources` -> JSON array: `[{"index": 1, "title": "...", "category": "...", "last_verified": "...", "url": null | "http..."}]`
- `event: token`   -> JSON object: `{"text": "..."}`
- `event: done`    -> JSON object: `{}`
- `event: error`   -> JSON object: `{"message": "<safe generic message>"}`
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.auth.firebase import rate_limited_user
from app.config import get_settings
from app.rag.doc_analyzer import extract_text_from_file, stream_document_analysis
from app.rag.pipeline import ChatMessage, RAGPipeline
from app.rag.store import RagStore
from app.retrieval.retriever import Retriever

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request / Response schemas ────────────────────────────────────────────────


class HistoryItem(BaseModel):
    """A single prior conversation turn."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    """Incoming chat request body."""

    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[List[HistoryItem]] = Field(default_factory=list)
    category: Optional[str] = Field(default=None, description="Optional category filter (exam, degree, role, salary, roadmap)")
    stage: Optional[str] = Field(default=None, description="Optional stage filter (school, puc, degree, placement, all)")


# ── Dependency: build pipeline per request ────────────────────────────────────


def get_pipeline() -> RAGPipeline:
    """Create a RAGPipeline using the active RagStore and Retriever."""
    store = RagStore()
    retriever = Retriever(store)
    return RAGPipeline(retriever)


# ── SSE event generator ───────────────────────────────────────────────────────


async def _sse_generator(
    pipeline: RAGPipeline,
    query: str,
    history: list[ChatMessage],
    category: Optional[str] = None,
    stage: Optional[str] = None,
    uid: str = "",
) -> AsyncIterator[dict]:
    """
    Consume events from RAGPipeline and format them according to the SSE contract.
    """
    try:
        async for event in pipeline.stream(
            query=query,
            history=history,
            category=category,
            stage=stage,
            uid=uid,
        ):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"]),
            }
    except asyncio.CancelledError:
        logger.info("SSE stream cancelled by client uid=%s.", uid)
        return
    except Exception as exc:
        # Log full internal error server-side with UID; return safe generic error to client
        logger.error("Chat streaming failure for uid=%s: %s", uid, exc, exc_info=True)
        yield {
            "event": "error",
            "data": json.dumps({"message": "An error occurred while processing your request. Please try again."}),
        }


# ── Route ─────────────────────────────────────────────────────────────────────


@router.post(
    "",
    summary="RAG Chat (SSE Streaming)",
    response_description="Server-Sent Events stream with sources, token, done, and error events",
)
async def chat(
    request: Request,
    body: ChatRequest,
    uid: str = Depends(rate_limited_user),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> EventSourceResponse:
    """
    Authenticated RAG chat endpoint.

    Validates the Firebase ID token, enforces per-uid rate limits, truncates
    conversation history server-side to the last N turns, and streams response tokens.
    """
    cfg = get_settings()
    logger.info("Chat request received from uid=%s (msg_len=%d)", uid, len(body.message))

    # Truncate history to the last N turns (configured in settings)
    raw_history = body.history or []
    # Defense-in-depth: If client passed the current message at the end of history, drop it
    if (
        raw_history
        and raw_history[-1].role == "user"
        and raw_history[-1].content.strip() == body.message.strip()
    ):
        raw_history = raw_history[:-1]

    if len(raw_history) > cfg.max_history_turns:
        logger.debug(
            "Truncating history from %d to %d turns for uid=%s",
            len(raw_history),
            cfg.max_history_turns,
            uid,
        )
        raw_history = raw_history[-cfg.max_history_turns:]

    history: List[ChatMessage] = [
        {"role": item.role, "content": item.content}
        for item in raw_history
    ]

    return EventSourceResponse(
        _sse_generator(
            pipeline=pipeline,
            query=body.message,
            history=history,
            category=body.category,
            stage=body.stage,
            uid=uid,
        ),
        media_type="text/event-stream",
    )


@router.post(
    "/analyze-doc",
    summary="Analyze Uploaded Document or PDF (SSE Streaming)",
    response_description="Server-Sent Events stream with document analysis and questions",
)
async def analyze_doc(
    request: Request,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    uid: str = Depends(rate_limited_user),
) -> EventSourceResponse:
    """
    Authenticated document analysis endpoint.
    Extracts text from PDF/TXT/MD, runs question generation or summary, and streams SSE events.
    """
    MAX_FILE_BYTES = 15 * 1024 * 1024  # 15MB
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 15MB limit.",
        )

    filename = file.filename or "uploaded_document.pdf"
    logger.info("Doc analysis requested by uid=%s for file='%s' (size=%d bytes)", uid, filename, len(content))

    try:
        extracted_text, page_count = extract_text_from_file(filename, content)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    async def _doc_sse_generator() -> AsyncIterator[dict]:
        try:
            async for event in stream_document_analysis(
                filename=filename,
                text=extracted_text,
                page_count=page_count,
                user_prompt=prompt,
                uid=uid,
            ):
                yield {
                    "event": event["event"],
                    "data": json.dumps(event["data"]),
                }
        except asyncio.CancelledError:
            logger.info("Doc analysis stream cancelled by client uid=%s.", uid)
            return
        except Exception as exc:
            logger.error("Doc analysis streaming failure for uid=%s: %s", uid, exc, exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"message": "An error occurred while analyzing the document. Please try again."}),
            }

    return EventSourceResponse(
        _doc_sse_generator(),
        media_type="text/event-stream",
    )

