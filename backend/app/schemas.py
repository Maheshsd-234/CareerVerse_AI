from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AuthUser(BaseModel):
    """Authenticated user representation extracted from Firebase ID token."""

    uid: str
    email: Optional[str] = None
    admin: bool = False
    claims: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """Response schema for public health check endpoint."""

    status: str = "ok"
    version: str = "1.0.0"
    environment: str = "development"


class MeResponse(BaseModel):
    """Response schema for protected /me endpoint."""

    uid: str
    email: Optional[str] = None
    admin: bool = False
