"""
app/routing/safety.py
─────────────────────
Zero-latency rule-based safety net for detecting crisis and self-harm language.

Runs on every incoming message BEFORE any routing or retrieval.
"""
from __future__ import annotations

import re

# Curated crisis phrases & regex patterns (erring on high sensitivity)
_CRISIS_PATTERNS = [
    r"\b(?:kill|killing|killed|end|ending|take|taking)\s+(?:my\s*life|myself)\b",
    r"\b(?:want|feel\s+like|thinking\s+of|going)\s+(?:to\s+)?(?:die|dying|end\s+it\s+all)\b",
    r"\b(?:commit|attempt|attempting)\s+suicide\b",
    r"\bsuicid(?:e|al|ing)\b",
    r"\bself[\s-]?harm\b",
    r"\bhurt(?:ing)?\s+myself\b",
    r"\bno\s+(?:point|reason)\s+(?:in\s+living|to\s+live)\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bcan['’]?t\s+(?:go\s+on|take\s+this|survive|live)\s+anymore\b",
    r"\bi\s+(?:hate\s+my\s+life|want\s+everything\s+to\s+end)\b",
    r"\bfeeling\s+completely\s+hopeless\b",
    r"\bgive\s+up\s+on\s+life\b",
]

_COMPILED_CRISIS_RE = re.compile(
    "|".join(f"(?:{p})" for p in _CRISIS_PATTERNS),
    re.IGNORECASE,
)


def check_crisis_language(text: str) -> bool:
    """
    Check if the user input contains explicit crisis or self-harm language.

    Parameters
    ----------
    text : str
        The raw user query.

    Returns
    -------
    bool
        True if crisis indicators are detected, False otherwise.
    """
    if not text or not text.strip():
        return False

    return bool(_COMPILED_CRISIS_RE.search(text))
