from unittest.mock import patch


def test_health_endpoint_public(client):
    """GET /health is public and returns 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "environment" in data


def test_me_endpoint_requires_auth(client):
    """GET /me requires authentication and returns 401 when no token is provided."""
    response = client.get("/me")
    assert response.status_code == 401


@patch("firebase_admin.auth.verify_id_token")
def test_me_endpoint_returns_user_profile(mock_verify, client):
    """GET /me returns user uid, email, and admin flag when authenticated."""
    mock_verify.return_value = {
        "uid": "user_abc_123",
        "email": "candidate@careerverse.ai",
        "admin": False,
    }

    response = client.get("/me", headers={"Authorization": "Bearer sample-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "user_abc_123"
    assert data["email"] == "candidate@careerverse.ai"
    assert data["admin"] is False


def test_cors_preflight(client):
    """CORS preflight request from allowed origin returns proper headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
