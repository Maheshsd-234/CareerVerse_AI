"""
app/llm/gemini_llm.py
──────────────────────
Gemini streaming LLM client (fallback).

Used when Groq is rate-limited or unavailable.
Model and API key come from the Settings class — never hard-coded.
"""
from __future__ import annotations

import logging
from typing import AsyncIterator, List

import google.generativeai as genai

from app.config import get_settings

logger = logging.getLogger(__name__)

ChatMessage = dict  # {"role": "user"|"model", "content": str}


def _to_gemini_history(messages: List[ChatMessage]) -> tuple[list, str]:
    """
    Convert OpenAI-style message list to Gemini's (history, last_user_msg) format.

    Gemini SDK expects:
    - history: list of {"role": "user"|"model", "parts": [str]}
    - the final user turn is passed separately to send_message_async.
    """
    history = []
    last_user_content = ""

    for msg in messages:
        role = "model" if msg["role"] == "assistant" else msg["role"]
        if role == "system":
            # Prepend system prompt as a user turn (Gemini has no system role)
            history.append({"role": "user", "parts": [msg["content"]]})
            history.append({"role": "model", "parts": ["Understood."]})
        else:
            history.append({"role": role, "parts": [msg["content"]]})

    # Pop the last user message to pass separately
    if history and history[-1]["role"] == "user":
        last_user_content = history.pop()["parts"][0]

    return history, last_user_content


async def stream_gemini(messages: List[ChatMessage]) -> AsyncIterator[str]:
    """
    Stream a chat completion from Gemini and yield text chunks.

    Parameters
    ----------
    messages : list[dict]
        Full conversation history in OpenAI chat format.

    Yields
    ------
    str
        Successive text delta chunks as they arrive.
    """
    cfg = get_settings()
    genai.configure(api_key=cfg.gemini_api_key)
    model = genai.GenerativeModel(cfg.gemini_model)

    history, user_msg = _to_gemini_history(messages)
    chat = model.start_chat(history=history)

    logger.debug("Calling Gemini model=%s", cfg.gemini_model)

    response = await chat.send_message_async(user_msg, stream=True)

    async for chunk in response:
        text = chunk.text
        if text:
            yield text
