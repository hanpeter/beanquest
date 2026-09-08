from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class LoginAttempt(BaseModel):
    """Tracks failed password-login attempts per email for rate limiting.
    Internal only — never a response_model.
    """

    model_config = ConfigDict(extra='forbid')

    SELECT_ONE: ClassVar[str] = (
        'SELECT email, failure_count, locked_until, updated_at '
        'FROM login_attempts WHERE email = %s'
    )
    # Reserves this attempt and records it as a failure in one atomic step,
    # run *before* the password is checked — see Application.verify_password_login.
    # The WHERE guard evaluates against the row's pre-update state, so an
    # already-locked row is left untouched (RETURNING yields nothing) rather
    # than having its lock extended or its count bumped further.
    UPSERT_FAILURE: ClassVar[str] = dedent('''\
        INSERT INTO login_attempts (email, failure_count, locked_until, updated_at)
        VALUES (%s, 1, NULL, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
            failure_count = login_attempts.failure_count + 1,
            locked_until = CASE
                WHEN login_attempts.failure_count + 1 >= 5
                THEN CURRENT_TIMESTAMP + INTERVAL '5 minutes'
                ELSE login_attempts.locked_until
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE login_attempts.locked_until IS NULL OR login_attempts.locked_until < CURRENT_TIMESTAMP
        RETURNING email, failure_count, locked_until, updated_at
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM login_attempts WHERE email = %s'

    email: str
    failure_count: int
    locked_until: datetime | None = None
    updated_at: datetime | None = None
