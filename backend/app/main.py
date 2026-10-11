from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_user, initialize_firebase, rate_limited_user, require_admin
from app.config import Settings, get_settings
from app.schemas import AuthUser, HealthResponse, MeResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    settings = get_settings()
    initialize_firebase(settings)
    yield


settings = get_settings()

app = FastAPI(
    title="CareerVerse AI API",
    description="Production-grade FastAPI backend for CareerVerse AI RAG and Agent services.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Public health check endpoint returning service status."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        environment=settings.environment,
    )


@app.get("/me", response_model=MeResponse, tags=["Authentication"])
async def get_me(user: AuthUser = Depends(rate_limited_user)) -> MeResponse:
    """
    Protected endpoint returning authenticated user identity.
    Protected by Firebase authentication and per-uid rate limiting.
    """
    return MeResponse(
        uid=user.uid,
        email=user.email,
        admin=user.admin,
    )


@app.get("/admin/ping", tags=["Admin"])
async def admin_ping(user: AuthUser = Depends(require_admin)) -> dict:
    """Protected admin endpoint verifying custom admin claim."""
    return {
        "status": "admin_access_granted",
        "uid": user.uid,
        "email": user.email,
    }
