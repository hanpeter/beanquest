from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(extra='forbid')

    SELECT_ALL: ClassVar[str] = (
        'SELECT id, first_name, last_name, email, created_at, modified_at FROM users'
    )
    SELECT_ONE: ClassVar[str] = SELECT_ALL + ' WHERE id = %s'
    # LOWER(email) on the column so this matches users_email_lower_idx (a
    # functional index) — a plain `email = %s` predicate can't use it, no
    # matter how the data is stored. LOWER(%s) on the parameter too, so the
    # match itself doesn't depend on the caller already having normalized —
    # both LOWER()s still reduce to the same index lookup, verified live.
    SELECT_BY_EMAIL: ClassVar[str] = SELECT_ALL + ' WHERE LOWER(email) = LOWER(%s)'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO users (first_name, last_name, email)
        VALUES (%(first_name)s, %(last_name)s, %(email)s)
        RETURNING id
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM users WHERE id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({'created_at', 'modified_at'})

    id: int | None = None
    first_name: str
    last_name: str
    email: str
    created_at: datetime | None = None
    modified_at: datetime | None = None
