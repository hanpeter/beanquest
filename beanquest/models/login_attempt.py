from datetime import datetime, timedelta
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict


class LoginAttempt(BaseModel):
    """Tracks failed password-login attempts per email for rate limiting.
    Internal only — never a response_model.
    """

    model_config = ConfigDict(extra='forbid')

    # Single source of truth for the lockout rule — bound into UPSERT_FAILURE
    # as query parameters (never string-interpolated into the SQL itself, so
    # neither value is an injection surface even if either becomes
    # config/env-driven later), and read back by Application to compute
    # attempts_left, so the limit is never restated in two places.
    MAX_FAILURES: ClassVar[int] = 5
    LOCK_DURATION: ClassVar[timedelta] = timedelta(minutes=5)

    # email is matched/stored via LOWER(%s) on the *parameter*, not LOWER(email)
    # on the column — this still hits the plain PRIMARY KEY index (the planner
    # reduces LOWER($1) to a single constant before comparing, since there's no
    # column reference inside it) while making every query here self-normalizing,
    # independent of whether the caller already passed a NormalizedEmail. That
    # matters here specifically: unlike `users`, this table has no case-insensitive
    # guarantee of its own otherwise, and a caller that bypassed normalization
    # would otherwise fragment one account's lockout counter across casings.
    SELECT_ONE: ClassVar[str] = (
        'SELECT email, failure_count, locked_until, updated_at '
        'FROM login_attempts WHERE email = LOWER(%s)'
    )
    # Reserves this attempt and records it as a failure in one atomic step,
    # run *before* the password is checked — see Application.verify_password_login.
    # The WHERE guard evaluates against the row's pre-update state, so an
    # already-locked row is left untouched (RETURNING yields nothing) rather
    # than having its lock extended or its count bumped further.
    # max_failures/lock_duration are bound params, not interpolated — psycopg
    # adapts a timedelta straight to an INTERVAL, so no INTERVAL '...' string
    # literal is needed for lock_duration.
    #
    # A row idle for at least one lock_duration since its last failure starts
    # over on this failure — checked via updated_at rather than a separate
    # "was this locked" branch, since for any row that was ever locked,
    # locked_until = last_failure_time + lock_duration by construction, so
    # `updated_at < now - lock_duration` and `locked_until < now` are the same
    # statement. This is what stops an expired lock from re-arming itself on
    # the very next attempt (the count used to just keep incrementing from
    # its already-at-threshold value); it also forgives a stale count that
    # never reached the threshold at all (e.g. 3 failures, then a long gap).
    UPSERT_FAILURE: ClassVar[str] = dedent('''\
        INSERT INTO login_attempts (email, failure_count, locked_until, updated_at)
        VALUES (LOWER(%(email)s), 1, NULL, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
            failure_count = CASE
                WHEN login_attempts.updated_at < CURRENT_TIMESTAMP - %(lock_duration)s THEN 1
                ELSE login_attempts.failure_count + 1
            END,
            locked_until = CASE
                WHEN login_attempts.updated_at < CURRENT_TIMESTAMP - %(lock_duration)s THEN NULL
                WHEN login_attempts.failure_count + 1 >= %(max_failures)s
                THEN CURRENT_TIMESTAMP + %(lock_duration)s
                ELSE login_attempts.locked_until
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE login_attempts.locked_until IS NULL OR login_attempts.locked_until < CURRENT_TIMESTAMP
        RETURNING email, failure_count, locked_until, updated_at
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM login_attempts WHERE email = LOWER(%s)'

    email: str
    failure_count: int
    locked_until: datetime | None = None
    updated_at: datetime | None = None
