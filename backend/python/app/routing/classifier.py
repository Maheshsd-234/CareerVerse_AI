"""
app/routing/classifier.py
─────────────────────────
Fast intent classification for retrieval-miss queries.
"""
from __future__ import annotations

import asyncio
from enum import Enum
import logging
from typing import Any, List, Optional, Tuple

from groq import AsyncGroq

from app.config import get_settings

logger = logging.getLogger(__name__)


class RouteIntent(str, Enum):
    """Routing intents for query processing."""
    GROUNDED = "grounded"
    GENERAL_GUIDANCE = "general_guidance"
    NEEDS_VERIFIED_SOURCE = "needs_verified_source"
    SMALL_TALK = "small_talk"
    OFF_TOPIC = "off_topic"
    WELLBEING = "wellbeing"


_INTENT_SYSTEM_PROMPT = """\
You are an ultra-fast query intent classifier for a student career & education guidance chatbot.

Given the user's latest query (and recent context), classify it into EXACTLY ONE category:

1. general_guidance: Study habits, focus, motivation, time management, exam prep strategies, resume building, interview etiquette, college transition, career decision-making concepts.
2. needs_verified_source: Questions requiring specific official facts, dates, cutoffs, admission criteria, fees, eligibility rules, exact syllabus, official rankings, or placement statistics.
3. small_talk: Greetings (hi, hello), thanks, goodbyes, basic polite check-ins.
4. off_topic: Completely unrelated to students, careers, exams, or college life (e.g. recipes, sports trivia, movies, weather, coding assignments, homework problems).
5. wellbeing: Expressions of distress, burnout, severe overwhelm, anxiety, depression, hopelessness, or emotional struggle.

Output ONLY the category name in lowercase (e.g. "general_guidance" or "needs_verified_source"). Do NOT include any other text or punctuation.
"""


async def classify_intent_fast(
    query: str,
    history: Optional[List[dict[str, Any]]] = None,
    timeout_seconds: Optional[float] = None,
) -> Tuple[RouteIntent, bool]:
    """
    Fast, lightweight LLM classification for queries that had no verified retrieval match.

    Parameters
    ----------
    query : str
        The latest user query.
    history : Optional[List[dict]]
        Optional conversation history snippet.
    timeout_seconds : Optional[float]
        Maximum seconds to wait for classification.

    Returns
    -------
    Tuple[RouteIntent, bool]
        (detected_intent, success_flag)
        If classification fails or times out, fails closed to (RouteIntent.NEEDS_VERIFIED_SOURCE, False).
    """
    cfg = get_settings()
    timeout = timeout_seconds if timeout_seconds is not None else cfg.intent_classifier_timeout_seconds

    if not cfg.groq_api_key:
        logger.warning("Groq API key not set — failing closed to NEEDS_VERIFIED_SOURCE.")
        return RouteIntent.NEEDS_VERIFIED_SOURCE, False

    history_list = history or []
    history_snippet = ""
    if history_list:
        history_snippet = "Recent context:\n" + "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}"
            for m in history_list[-3:]
        ) + "\n\n"

    user_prompt = f"{history_snippet}User query: {query}"

    try:
        client = AsyncGroq(api_key=cfg.groq_api_key)
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=cfg.groq_model,
                messages=[
                    {"role": "system", "content": _INTENT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.0,
                max_tokens=300,
            ),
            timeout=timeout,
        )

        msg = response.choices[0].message
        raw_output = msg.content or ""
        if not raw_output.strip() and hasattr(msg, "reasoning") and msg.reasoning:
            raw_output = msg.reasoning
        cleaned = raw_output.strip().lower()

        for intent in RouteIntent:
            if intent.value in cleaned:
                return intent, True

        logger.warning("Unknown intent string returned by classifier: '%s'", cleaned)
        return RouteIntent.NEEDS_VERIFIED_SOURCE, False

    except Exception as exc:
        logger.warning("Intent classification failed or timed out (%s) — failing closed.", exc)
        return RouteIntent.NEEDS_VERIFIED_SOURCE, False
