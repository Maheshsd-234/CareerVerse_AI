import json
import logging
import os
import threading
import time
from collections import defaultdict, deque
from typing import Optional

import firebase_admin
from firebase_admin import auth as fb_auth, credentials
from firebase_admin.auth import (
    ExpiredIdTokenError,
    InvalidIdTokenError,
    RevokedIdTokenError,
)
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.schemas import AuthUser

logger = logging.getLogger(__name__)

# Security scheme for reading Bearer token
security = HTTPBearer(auto_error=False)


def initialize_firebase(settings: Settings) -> None:
    """Initialize Firebase Admin SDK idempotently."""
    if firebase_admin._apps:
        return

    try:
        if settings.firebase_credentials_path and os.path.exists(settings.firebase_credentials_path):
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from credentials file.")
        elif settings.firebase_credentials_json:
            try:
                cert_dict = json.loads(settings.firebase_credentials_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized from inline JSON credentials.")
            except Exception as e:
                logger.warning("Failed to parse firebase_credentials_json: %s. Using default credentials.", e)
                firebase_admin.initialize_app()
        else:
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default credentials.")
    except Exception as e:
        logger.warning("Firebase Admin initialization fallback: %s", e)


async def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> AuthUser:
    """
    FastAPI dependency to verify Firebase ID token and extract user identity.
    Raises 401 Unauthorized for missing, invalid, or expired tokens.
    """
    if auth_header is None or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is empty",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded_token = fb_auth.verify_id_token(token, check_revoked=True)
    except ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (InvalidIdTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase ID token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        logger.error("Unexpected error verifying Firebase ID token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

    uid = decoded_token.get("uid") or decoded_token.get("user_id")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = decoded_token.get("email")
    is_admin = bool(decoded_token.get("admin", False))

    return AuthUser(
        uid=uid,
        email=email,
        admin=is_admin,
        claims=decoded_token,
    )


async def require_admin(
    user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """
    FastAPI dependency that enforces admin privileges based on Firebase custom claims.
    Raises 403 Forbidden if the user is not an admin.
    """
    if not user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


class InMemoryRateLimiter:
    """Thread-safe in-memory sliding window rate limiter per user ID."""

    def __init__(self):
        self._records = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request for key is allowed within the rate limit window."""
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._records[key]
            # Remove expired timestamps
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


# Global in-memory rate limiter instance
rate_limiter = InMemoryRateLimiter()


async def rate_limited_user(
    user: AuthUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    """
    FastAPI dependency combining authentication and per-uid rate limiting.
    Raises 429 Too Many Requests if rate limit is exceeded.
    """
    allowed = rate_limiter.check(
        key=user.uid,
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    return user
