import pytest
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    verify_password,
)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def test_hash_password_round_trip():
    hashed = hash_password("supersecret")
    assert hashed != "supersecret"
    assert verify_password("supersecret", hashed)


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("supersecret")
    assert not verify_password("wrongpassword", hashed)


def test_hash_password_produces_different_hashes_each_time():
    assert hash_password("supersecret") != hash_password("supersecret")


# ---------------------------------------------------------------------------
# Token creation
# ---------------------------------------------------------------------------

def test_create_access_token_contains_subject_and_expiry():
    token = create_access_token(42)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == "42"
    assert "exp" in payload


def test_create_refresh_token_expires_later_than_access_token():
    access_payload = jwt.decode(
        create_access_token(1), settings.SECRET_KEY, algorithms=["HS256"]
    )
    refresh_payload = jwt.decode(
        create_refresh_token(1), settings.SECRET_KEY, algorithms=["HS256"]
    )
    assert refresh_payload["exp"] > access_payload["exp"]


def test_expired_access_token_fails_decode_after_expiry():
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    with pytest.raises(Exception):
        jwt.decode(expired, settings.SECRET_KEY, algorithms=["HS256"])


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

def test_get_current_user_returns_user_for_valid_token(db, test_user):
    token = create_access_token(test_user.id)
    user = get_current_user(token=token, db=db)
    assert user.id == test_user.id


def test_get_current_user_rejects_malformed_token(db):
    with pytest.raises(Exception) as exc_info:
        get_current_user(token="not-a-real-token", db=db)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_token_with_wrong_signature(db, test_user):
    bad_token = jwt.encode(
        {"sub": str(test_user.id), "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "wrong-secret-key",
        algorithm="HS256",
    )
    with pytest.raises(Exception) as exc_info:
        get_current_user(token=bad_token, db=db)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_unknown_user_id(db):
    token = create_access_token(999999)
    with pytest.raises(Exception) as exc_info:
        get_current_user(token=token, db=db)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_inactive_user(db, test_user):
    test_user.is_active = False
    db.flush()
    token = create_access_token(test_user.id)
    with pytest.raises(Exception) as exc_info:
        get_current_user(token=token, db=db)
    assert exc_info.value.status_code == 401
