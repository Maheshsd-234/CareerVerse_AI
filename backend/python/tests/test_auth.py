"""
tests/test_auth.py
───────────────────
Unit tests for app/auth/firebase.py — token verification dependency.

We mock firebase_admin.auth so no real Firebase project is needed.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth.firebase import verify_firebase_token


@pytest.mark.asyncio
async def test_valid_token_returns_uid():
    """A valid Firebase token returns the uid."""
    fake_decoded = {"uid": "user-abc-123"}
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")

    with patch("app.auth.firebase.fb_auth.verify_id_token", return_value=fake_decoded):
        uid = await verify_firebase_token(credentials)

    assert uid == "user-abc-123"


@pytest.mark.asyncio
async def test_expired_token_raises_401():
    """An expired token raises HTTP 401."""
    import firebase_admin.auth as fb_auth_module

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired_token")

    with patch(
        "app.auth.firebase.fb_auth.verify_id_token",
        side_effect=fb_auth_module.ExpiredIdTokenError("expired", None),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(credentials)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_invalid_token_raises_401():
    """An invalid token raises HTTP 401."""
    import firebase_admin.auth as fb_auth_module

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad_token")

    with patch(
        "app.auth.firebase.fb_auth.verify_id_token",
        side_effect=fb_auth_module.InvalidIdTokenError("bad token"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(credentials)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_revoked_token_raises_401():
    """A revoked token raises HTTP 401."""
    import firebase_admin.auth as fb_auth_module

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="revoked_token")

    with patch(
        "app.auth.firebase.fb_auth.verify_id_token",
        side_effect=fb_auth_module.RevokedIdTokenError("revoked"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(credentials)

    assert exc_info.value.status_code == 401
    assert "revoked" in exc_info.value.detail.lower()
