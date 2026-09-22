import re
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from pydantic import AfterValidator

from beanquest.errors import Unauthorized

_JWT_ALGORITHM = 'HS256'
_SPECIAL_CHAR = re.compile(r'[^A-Za-z0-9]')


def _validate_password_strength(v: str) -> str:
    """At least 10 characters, and 2+ of: lowercase, uppercase, number, special."""
    if len(v) < 10:
        raise ValueError('password must be at least 10 characters long')
    categories_met = sum([
        any(c.islower() for c in v),
        any(c.isupper() for c in v),
        any(c.isdigit() for c in v),
        bool(_SPECIAL_CHAR.search(v)),
    ])
    if categories_met < 2:
        raise ValueError(
            'password must include at least 2 of: lowercase, uppercase, number, special character'
        )
    return v


# Only for setting/changing a password (signup, future password-change) —
# never for login, where the password must be checked as originally set.
StrongPassword = Annotated[str, AfterValidator(_validate_password_strength)]


_MAX_EMAIL_LENGTH = 255  # matches the users/login_attempts VARCHAR(255) columns


def _normalize_email(v: str) -> str:
    v = v.strip().lower()
    if len(v) > _MAX_EMAIL_LENGTH:
        raise ValueError(f'email must be at most {_MAX_EMAIL_LENGTH} characters long')
    return v


# Canonical form for every user-supplied address. Applied at the API boundary so
# both the users unique constraint and the login_attempts key (which rate limiting
# depends on) see one spelling per account.
NormalizedEmail = Annotated[str, AfterValidator(_normalize_email)]


class PasswordAuth:
    def create(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()

    def verify(self, password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode(), password_hash.encode())


class AccessTokenAuth:
    """Mints and verifies access tokens, given a signing secret and TTL the
    caller reads once at startup (api.py's lifespan) rather than this module
    reaching into the environment itself on every call.

    `type: access` rides along in the payload so a future refresh token (a
    separate, longer-lived, server-tracked credential) can share verify()'s
    shape while staying distinguishable from an access token.
    """

    def __init__(self, secret: str, ttl_seconds: int):
        self._secret = secret
        self._ttl_seconds = ttl_seconds

    def create(self, user_id: int) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            'sub': str(user_id),
            'type': 'access',
            'iat': now,
            'exp': now + timedelta(seconds=self._ttl_seconds),
        }
        return jwt.encode(payload, self._secret, algorithm=_JWT_ALGORITHM)

    def verify(self, token: str) -> int:
        try:
            payload = jwt.decode(token, self._secret, algorithms=[_JWT_ALGORITHM])
        except jwt.InvalidTokenError as e:
            raise Unauthorized('invalid or expired token') from e
        if payload.get('type') != 'access':
            raise Unauthorized('invalid or expired token')
        return int(payload['sub'])
