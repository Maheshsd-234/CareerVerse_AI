"""
app/llm/groq_llm.py
────────────────────
Groq streaming LLM client (primary) and fast query condensation helper.

`stream_groq` is an async generator that yields text chunks from the Groq API.
`condense_query_groq` rewrites conversational follow-up questions into standalone search queries.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncIterator, List, Sequence, Union, cast

from groq import AsyncGroq
from groq.types.chat import ChatCompletionMessageParam

from app.config import get_settings

logger = logging.getLogger(__name__)

# Type alias for a chat message dict
ChatMessage = Union[ChatCompletionMessageParam, dict[str, Any]]


async def stream_groq(messages: Sequence[ChatMessage]) -> AsyncIterator[str]:
    """
    Stream a chat completion from Groq and yield text chunks.

    Parameters
    ----------
    messages : Sequence[ChatMessage]
        Full conversation history in OpenAI/Groq chat format.

    Yields
    ------
    str
        Successive text delta chunks as they arrive.

    Raises
    ------
    groq.APIError
        Propagated to caller so the RAG pipeline can fall back to Gemini.
    """
    cfg = get_settings()
    client = AsyncGroq(api_key=cfg.groq_api_key)

    logger.debug("Calling Groq model=%s", cfg.groq_model)

    stream = await client.chat.completions.create(
        model=cfg.groq_model,
        messages=cast(List[ChatCompletionMessageParam], list(messages)),
        temperature=cfg.groq_temperature,
        max_tokens=cfg.groq_max_tokens,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def condense_query_groq(
    query: str,
    history: List[ChatMessage],
    timeout_seconds: float = 3.0,
) -> str:
    """
    Rephrase a conversational follow-up into a standalone retrieval search query.
    Falls back to original `query` on any error or timeout.
    """
    if not history:
        return query

    cfg = get_settings()
    if not cfg.groq_api_key:
        return query

    client = AsyncGroq(api_key=cfg.groq_api_key)

    history_snippet = "\n".join(
        f"{m.get('role', 'user')}: {m.get('content', '')}"
        for m in history[-4:]  # last few turns only
    )

    system_prompt = (
        "You are an expert search query condenser for a student career guidance database.\n"
        "Given the recent conversation history and follow-up question, rephrase the follow-up "
        "into a single, standalone search query that captures the user's intent.\n"
        "Rules:\n"
        "- Output ONLY the standalone search query.\n"
        "- Do NOT answer the question.\n"
        "- Keep it under 15 words.\n"
        "- Do NOT add quotes or explanations."
    )

    user_content = f"Conversation History:\n{history_snippet}\n\nFollow-up question: {query}"

    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=cfg.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.1,
                max_tokens=300,
            ),
            timeout=timeout_seconds,
        )
        msg = response.choices[0].message
        condensed = msg.content or ""
        # If content is empty (e.g. truncated reasoning), check if reasoning has condensed query
        if not condensed.strip() and hasattr(msg, "reasoning") and msg.reasoning:
            lines = [l.strip() for l in msg.reasoning.splitlines() if l.strip()]
            if lines:
                condensed = lines[-1]

        if condensed and condensed.strip():
            cleaned = condensed.strip().strip('"\'`')
            logger.info("Condensed follow-up query: '%s' -> '%s'", query, cleaned)
            return cleaned
    except Exception as exc:
        logger.warning("Query condensation skipped/failed (%s); using original query.", exc)

    return query
