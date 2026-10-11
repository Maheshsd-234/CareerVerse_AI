"""
app/auth/firebase.py
────────────────────
Firebase ID-token verification and in-memory rate limiting.

The frontend calls `auth.currentUser.getIdToken()` and sends the result as a
Bearer token. We verify it server-side so no unauthenticated or abusive request
reaches the RAG pipeline.
"""
from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict, deque
from typing import Annotated

import firebase_admin
import firebase_admin.auth as fb_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=True)


# ── Rate Limiter ──────────────────────────────────────────────────────────────


class InMemoryRateLimiter:
    """Thread-safe in-memory sliding window rate limiter per user ID."""

    def __init__(self) -> None:
        self._records = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request for key is allowed within the rate limit window."""
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._records[key]
            # Evict expired timestamps
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= max_requests:
                return False

            timestamps.append(now)
            return True

    def reset(self) -> None:
        """Reset all rate limiter tracking records (useful for testing)."""
        with self._lock:
            self._records.clear()


# Global in-memory rate limiter singleton
rate_limiter = InMemoryRateLimiter()


# ── Dependencies ──────────────────────────────────────────────────────────────


def _ensure_firebase_initialized() -> None:
    """Ensure Firebase Admin is initialized before verifying tokens."""
    if not firebase_admin._apps:
        import os
        import firebase_admin.credentials as fb_creds

        cfg = get_settings()
        try:
            sa_path = cfg.firebase_service_account_path
            if not os.path.exists(sa_path) and os.path.exists(f"{sa_path}.json"):
                sa_path = f"{sa_path}.json"

            if os.path.exists(sa_path):
                cred = fb_creds.Certificate(sa_path)
                if cred.project_id == cfg.firebase_project_id:
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK initialised with service account key (%s).", sa_path)
                else:
                    logger.warning(
                        "Service account key project '%s' does not match '%s'. Using public certs for '%s'.",
                        cred.project_id,
                        cfg.firebase_project_id,
                        cfg.firebase_project_id,
                    )
                    firebase_admin.initialize_app(options={"projectId": cfg.firebase_project_id})
            else:
                firebase_admin.initialize_app(options={"projectId": cfg.firebase_project_id})
                logger.info(
                    "Firebase Admin SDK initialised for project '%s' (verifying tokens via public certificates).",
                    cfg.firebase_project_id,
                )
        except Exception as exc:
            logger.warning("Firebase Admin initialization fallback warning: %s", exc)


async def verify_firebase_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """
    FastAPI dependency.

    Verifies the Firebase ID token in the `Authorization: Bearer <token>`
    header and returns the authenticated user's UID.

    Raises
    ------
    HTTPException 401
        When the token is missing, expired, or invalid.
    """
    _ensure_firebase_initialized()
    token = credentials.credentials
    cfg = get_settings()

    # Attempt 1: Try Firebase Admin SDK
    try:
        decoded = fb_auth.verify_id_token(token, check_revoked=False)
        uid: str = decoded["uid"]
        logger.debug("Authenticated uid=%s via Firebase Admin SDK", uid)
        return uid
    except fb_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
        )
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh and retry.",
        )
    except Exception as exc:
        # InvalidIdTokenError (e.g. audience mismatch from different project service account)
        # or DefaultCredentialsError -> Fallback to direct public-certificate token verification
        logger.debug("Firebase Admin SDK check failed (%s). Falling back to Google public certs verification.", exc)

    # Attempt 2: Verify against Google public x509 certificates (no service account or ADC required)
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        req = google_requests.Request()
        payload = google_id_token.verify_firebase_token(
            token,
            request=req,
            audience=cfg.firebase_project_id,
        )
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
            )
        uid = payload.get("user_id") or payload.get("sub") or payload.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user ID.",
            )
        logger.debug("Authenticated uid=%s via Google public certs", uid)
        return str(uid)
    except HTTPException:
        raise
    except Exception as exc:
        err_msg = str(exc).lower()
        if "expired" in err_msg or "too early" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please refresh and retry.",
            )
        logger.warning("Token verification failed via public certs: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )


async def rate_limited_user(
    uid: str = Depends(verify_firebase_token),
) -> str:
    """
    FastAPI dependency combining Firebase authentication with per-uid rate limiting.

    Raises
    ------
    HTTPException 429
        If the authenticated user has exceeded their request quota.
    """
    cfg = get_settings()
    allowed = rate_limiter.check(
        key=uid,
        max_requests=cfg.rate_limit_requests,
        window_seconds=cfg.rate_limit_window_seconds,
    )
    if not allowed:
        logger.warning("Rate limit exceeded for uid=%s", uid)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    return uid
