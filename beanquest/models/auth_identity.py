from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class AuthIdentity(BaseModel):
    """A user's linked login method (password, google, ...). Internal only —
    never a response_model, so password_hash never risks leaking in a response.
    """

    model_config = ConfigDict(extra='forbid')

    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO auth_identities (user_id, provider, provider_uid, password_hash)
        VALUES (%(user_id)s, %(provider)s, %(provider_uid)s, %(password_hash)s)
        RETURNING id
    ''')
    SELECT_BY_USER_AND_PROVIDER: ClassVar[str] = (
        'SELECT id, user_id, provider, provider_uid, password_hash, created_at, modified_at '
        'FROM auth_identities WHERE user_id = %s AND provider = %s'
    )

    id: int | None = None
    user_id: int
    provider: str
    provider_uid: str | None = None
    password_hash: str | None = None
    created_at: datetime | None = None
    modified_at: datetime | None = None
