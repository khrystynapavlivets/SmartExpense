from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings
from app.core.security import create_refresh_token, hash_password

# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------


def test_register_creates_user_and_returns_tokens(auth_client):
    response = auth_client.post(
        "/auth/register", json={"email": "new@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_rejects_duplicate_email(auth_client, test_user):
    response = auth_client.post(
        "/auth/register", json={"email": test_user.email, "password": "password123"}
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_register_rejects_invalid_email(auth_client):
    response = auth_client.post(
        "/auth/register", json={"email": "not-an-email", "password": "password123"}
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------


def test_login_success_returns_tokens(auth_client, test_user):
    response = auth_client.post(
        "/auth/login", data={"username": test_user.email, "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_rejects_wrong_password(auth_client, test_user):
    response = auth_client.post(
        "/auth/login", data={"username": test_user.email, "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_rejects_unknown_email(auth_client):
    response = auth_client.post(
        "/auth/login", data={"username": "nobody@example.com", "password": "whatever"}
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------


def test_refresh_returns_new_tokens(auth_client, test_user):
    refresh_token = create_refresh_token(test_user.id)
    response = auth_client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_refresh_rejects_invalid_token(auth_client):
    response = auth_client.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token"


def test_refresh_rejects_expired_token(auth_client, test_user):
    expired = jwt.encode(
        {
            "sub": str(test_user.id),
            "exp": datetime.now(timezone.utc) - timedelta(days=1),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    response = auth_client.post("/auth/refresh", json={"refresh_token": expired})
    assert response.status_code == 401


def test_refresh_rejects_unknown_user(auth_client):
    token = create_refresh_token(999999)
    response = auth_client.post("/auth/refresh", json={"refresh_token": token})
    assert response.status_code == 401


def test_refresh_rejects_inactive_user(auth_client, test_user, db):
    test_user.is_active = False
    db.flush()
    token = create_refresh_token(test_user.id)
    response = auth_client.post("/auth/refresh", json={"refresh_token": token})
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------


def test_me_returns_current_user_with_valid_token(auth_client, test_user):
    login_response = auth_client.post(
        "/auth/login", data={"username": test_user.email, "password": "testpass"}
    )
    access_token = login_response.json()["access_token"]

    response = auth_client.get(
        "/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["is_active"] is True


def test_me_rejects_missing_token(auth_client):
    response = auth_client.get("/auth/me")
    assert response.status_code == 401


def test_me_rejects_invalid_token(auth_client):
    response = auth_client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401
