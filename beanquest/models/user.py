from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(extra='forbid')

    # password_hash is intentionally never selected, so it can't leak into
    # an API response even if this model is used as a response_model as-is.
    SELECT_ALL: ClassVar[str] = (
        'SELECT id, first_name, last_name, email, created_at FROM users'
    )
    SELECT_ONE: ClassVar[str] = SELECT_ALL + ' WHERE id = %s'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES (%(first_name)s, %(last_name)s, %(email)s, %(password_hash)s)
        RETURNING id
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM users WHERE id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({'created_at'})

    id: int | None = None
    first_name: str
    last_name: str
    email: str
    # Write-only: plaintext input for account creation. Hashed by Database
    # before it ever reaches SQL; never populated back onto a fetched model.
    # Optional because OAuth-only users (planned) will have no password.
    password: str | None = None
    created_at: datetime | None = None
