"""
app/routing
───────────
Intelligent routing, intent classification, and crisis safety net for CareerVerse AI.
"""
from app.routing.classifier import RouteIntent, classify_intent_fast
from app.routing.responses import (
    GENERAL_MENTOR_SYSTEM_PROMPT,
    get_needs_verified_source_response,
    get_off_topic_response,
    get_small_talk_response,
    get_wellbeing_response,
)
from app.routing.safety import check_crisis_language

__all__ = [
    "RouteIntent",
    "classify_intent_fast",
    "check_crisis_language",
    "get_wellbeing_response",
    "get_needs_verified_source_response",
    "get_small_talk_response",
    "get_off_topic_response",
    "GENERAL_MENTOR_SYSTEM_PROMPT",
]
