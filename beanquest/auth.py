from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from beanquest.errors import Unauthorized

_JWT_ALGORITHM = 'HS256'


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
