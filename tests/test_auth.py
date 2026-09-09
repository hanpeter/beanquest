from datetime import datetime, timedelta, timezone

import jwt
import pytest
from pydantic import BaseModel, ConfigDict, ValidationError

from beanquest.auth import AccessTokenAuth, PasswordAuth, StrongPassword
from beanquest.errors import Unauthorized


class _PasswordModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

    password: StrongPassword


# ---------------------------------------------------------------------------
# PasswordAuth
# ---------------------------------------------------------------------------

def test_password_auth_create_returns_a_hash_not_the_plaintext():
    hashed = PasswordAuth().create('correct-horse-battery')
    assert hashed != 'correct-horse-battery'
    assert hashed.startswith('$2b$')


def test_password_auth_verify_correct_password():
    auth = PasswordAuth()
    hashed = auth.create('correct-horse-battery')
    assert auth.verify('correct-horse-battery', hashed) is True


def test_password_auth_verify_wrong_password():
    auth = PasswordAuth()
    hashed = auth.create('correct-horse-battery')
    assert auth.verify('wrong-password', hashed) is False


# ---------------------------------------------------------------------------
# AccessTokenAuth
# ---------------------------------------------------------------------------

def test_access_token_auth_create_and_verify_roundtrip():
    auth = AccessTokenAuth('test-secret', 3600)
    token = auth.create(42)
    assert auth.verify(token) == 42


def test_access_token_auth_verify_rejects_wrong_secret():
    token = AccessTokenAuth('secret-a', 3600).create(1)
    with pytest.raises(Unauthorized):
        AccessTokenAuth('secret-b', 3600).verify(token)


def test_access_token_auth_verify_rejects_expired_token():
    auth = AccessTokenAuth('test-secret', -1)
    token = auth.create(1)
    with pytest.raises(Unauthorized):
        auth.verify(token)


def test_access_token_auth_verify_rejects_garbage_token():
    auth = AccessTokenAuth('test-secret', 3600)
    with pytest.raises(Unauthorized):
        auth.verify('not-a-real-token')


def test_access_token_auth_verify_rejects_non_access_token_type():
    now = datetime.now(timezone.utc)
    payload = {'sub': '1', 'type': 'refresh', 'iat': now, 'exp': now + timedelta(seconds=60)}
    token = jwt.encode(payload, 'test-secret', algorithm='HS256')
    with pytest.raises(Unauthorized):
        AccessTokenAuth('test-secret', 3600).verify(token)


# ---------------------------------------------------------------------------
# StrongPassword
# ---------------------------------------------------------------------------

@pytest.mark.parametrize('password', [
    'lowercaseUPPER',   # lower + upper
    'lowercase12345',   # lower + digit
    'lowercase!!!!!',   # lower + special
    'UPPERCASE12345',   # upper + digit
])
def test_strong_password_accepts_two_categories(password):
    assert _PasswordModel(password=password).password == password


def test_strong_password_rejects_short_password():
    with pytest.raises(ValidationError):
        _PasswordModel(password='Sh0rt!')


def test_strong_password_rejects_single_category():
    with pytest.raises(ValidationError):
        _PasswordModel(password='alllowercase')
