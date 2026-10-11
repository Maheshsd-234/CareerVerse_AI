from unittest.mock import patch
import pytest
from firebase_admin.auth import (
    ExpiredIdTokenError,
    InvalidIdTokenError,
    RevokedIdTokenError,
)


def test_missing_token_returns_401(client):
    """Calling protected endpoint without Authorization header must return 401."""
    response = client.get("/me")
    assert response.status_code == 401
    assert "token is missing" in response.json()["detail"].lower() or "not authenticated" in response.json()["detail"].lower()


def test_empty_bearer_token_returns_401(client):
    """Calling protected endpoint with empty token string must return 401."""
    response = client.get("/me", headers={"Authorization": "Bearer "})
    assert response.status_code == 401


@patch("firebase_admin.auth.verify_id_token")
def test_valid_token_returns_200(mock_verify, client):
    """Calling protected endpoint with valid Firebase token returns 200 and user info."""
    mock_verify.return_value = {
        "uid": "test_uid_99",
        "email": "user@example.com",
        "admin": False,
    }

    response = client.get("/me", headers={"Authorization": "Bearer valid-mock-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test_uid_99"
    assert data["email"] == "user@example.com"
    assert data["admin"] is False


@patch("firebase_admin.auth.verify_id_token")
def test_invalid_token_returns_401(mock_verify, client):
    """Invalid token raises InvalidIdTokenError and returns 401."""
    mock_verify.side_effect = InvalidIdTokenError("Invalid token format")

    response = client.get("/me", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


@patch("firebase_admin.auth.verify_id_token")
def test_expired_token_returns_401(mock_verify, client):
    """Expired token raises ExpiredIdTokenError and returns 401."""
    mock_verify.side_effect = ExpiredIdTokenError("Token has expired", "cause")

    response = client.get("/me", headers={"Authorization": "Bearer expired-token"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


@patch("firebase_admin.auth.verify_id_token")
def test_revoked_token_returns_401(mock_verify, client):
    """Revoked token raises RevokedIdTokenError and returns 401."""
    mock_verify.side_effect = RevokedIdTokenError("Token was revoked")

    response = client.get("/me", headers={"Authorization": "Bearer revoked-token"})
    assert response.status_code == 401
    assert "revoked" in response.json()["detail"].lower()


@patch("firebase_admin.auth.verify_id_token")
def test_admin_claim_granted(mock_verify, client):
    """User with admin custom claim can access /admin/ping."""
    mock_verify.return_value = {
        "uid": "admin_uid_1",
        "email": "admin@careerverse.ai",
        "admin": True,
    }

    response = client.get(
        "/admin/ping",
        headers={"Authorization": "Bearer admin-mock-token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "admin_access_granted"
    assert data["uid"] == "admin_uid_1"


@patch("firebase_admin.auth.verify_id_token")
def test_admin_claim_denied_for_regular_user(mock_verify, client):
    """User without admin custom claim receives 403 Forbidden on /admin/ping."""
    mock_verify.return_value = {
        "uid": "regular_user_1",
        "email": "user@careerverse.ai",
        "admin": False,
    }

    response = client.get(
        "/admin/ping",
        headers={"Authorization": "Bearer regular-mock-token"},
    )
    assert response.status_code == 403
    assert "admin privileges required" in response.json()["detail"].lower()


@patch("firebase_admin.auth.verify_id_token")
def test_rate_limiter_blocks_excessive_requests(mock_verify, client):
    """Exceeding configured rate limit (5 requests) triggers 429 Too Many Requests."""
    mock_verify.return_value = {
        "uid": "rate_limited_user",
        "email": "spam@example.com",
    }

    headers = {"Authorization": "Bearer rapid-fire-token"}

    # First 5 requests should succeed
    for i in range(5):
        resp = client.get("/me", headers=headers)
        assert resp.status_code == 200

    # 6th request should be rate limited (429)
    resp = client.get("/me", headers=headers)
    assert resp.status_code == 429
    assert "rate limit exceeded" in resp.json()["detail"].lower()
