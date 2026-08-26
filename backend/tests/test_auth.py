import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token


def test_password_hashing_and_verification():
    raw_password = "SecureYouthAthlete2026!"
    hashed = get_password_hash(raw_password)
    
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False


def test_jwt_token_generation_and_decoding():
    user_id = 42
    extra_claims = {"role": "athlete", "email": "test@sportx.ai"}
    token = create_access_token(subject=user_id, extra_claims=extra_claims)
    
    decoded = decode_token(token)
    assert decoded["sub"] == str(user_id)
    assert decoded["role"] == "athlete"
    assert decoded["email"] == "test@sportx.ai"
    assert "exp" in decoded
