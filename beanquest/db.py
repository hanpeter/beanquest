from contextlib import contextmanager, nullcontext

import psycopg
from psycopg.rows import dict_row

from beanquest.errors import Conflict, NotFound
from beanquest.models import AuthIdentity, BrewingMethod, LoginAttempt, PastLog, RoastingMethod, User


class Database:
    def __init__(self, pool):
        self._pool = pool

    @contextmanager
    def transaction(self):
        with self._pool.connection() as conn:
            yield conn

    def _select_all(self, sql, params=()) -> list[dict]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql, params)
                return list(cur)

    def _select_one(self, sql, params) -> dict | None:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql, params)
                return cur.fetchone()

    # -------------------------------------------------------------------------
    # User
    # -------------------------------------------------------------------------

    def get_users(self) -> list[User]:
        return [User.model_validate(row) for row in self._select_all(User.SELECT_ALL)]

    def get_user(self, id: int) -> User | None:
        row = self._select_one(User.SELECT_ONE, [id])
        return User.model_validate(row) if row else None

    def get_user_by_email(self, email: str) -> User | None:
        row = self._select_one(User.SELECT_BY_EMAIL, [email])
        return User.model_validate(row) if row else None

    def add_user(self, user: User, conn=None) -> int:
        try:
            with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
                with conn.cursor() as cur:
                    cur.execute(User.INSERT, user.model_dump())
                    return cur.fetchone()[0]
        except psycopg.errors.UniqueViolation as e:
            raise Conflict(f'User with email {user.email} already exists') from e

    def delete_user(self, id: int, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(User.DELETE, [id])
                if cur.rowcount == 0:
                    raise NotFound(f'User {id} not found')

    # -------------------------------------------------------------------------
    # AuthIdentity
    # -------------------------------------------------------------------------

    def get_auth_identity(self, user_id: int, provider: str) -> AuthIdentity | None:
        row = self._select_one(AuthIdentity.SELECT_BY_USER_AND_PROVIDER, [user_id, provider])
        return AuthIdentity.model_validate(row) if row else None

    def add_auth_identity(self, identity: AuthIdentity, conn=None) -> int:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(AuthIdentity.INSERT, identity.model_dump())
                return cur.fetchone()[0]

    # -------------------------------------------------------------------------
    # LoginAttempt
    # -------------------------------------------------------------------------

    def get_login_attempt(self, email: str) -> LoginAttempt | None:
        row = self._select_one(LoginAttempt.SELECT_ONE, [email])
        return LoginAttempt.model_validate(row) if row else None

    def record_login_failure(self, email: str) -> LoginAttempt | None:
        """Atomically reserves this attempt and records it as a failure.
        Returns None if the account is already locked — an already-locked
        row is left untouched, so hammering it can't extend the lock. A row
        idle for at least one LOCK_DURATION since its last failure starts
        fresh instead of continuing its old count (see UPSERT_FAILURE).
        """
        params = {
            'email': email,
            'max_failures': LoginAttempt.MAX_FAILURES,
            'lock_duration': LoginAttempt.LOCK_DURATION,
        }
        row = self._select_one(LoginAttempt.UPSERT_FAILURE, params)
        return LoginAttempt.model_validate(row) if row else None

    def reset_login_attempts(self, email: str) -> None:
        with self._pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(LoginAttempt.DELETE, [email])

    # -------------------------------------------------------------------------
    # BrewingMethod
    # -------------------------------------------------------------------------

    def get_brewing_methods(self, user_id: int) -> list[BrewingMethod]:
        rows = self._select_all(BrewingMethod.SELECT_ALL, [user_id])
        return [BrewingMethod.model_validate(row) for row in rows]

    def get_brewing_method(self, id: int, user_id: int) -> BrewingMethod | None:
        row = self._select_one(BrewingMethod.SELECT_ONE, [id, user_id])
        return BrewingMethod.model_validate(row) if row else None

    def add_brewing_method(self, brewing_method: BrewingMethod, conn=None) -> int:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(BrewingMethod.INSERT, brewing_method.model_dump())
                return cur.fetchone()[0]

    def update_brewing_method(self, brewing_method: BrewingMethod, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(BrewingMethod.UPDATE, brewing_method.model_dump())
                if cur.rowcount == 0:
                    raise NotFound(f'BrewingMethod {brewing_method.id} not found')

    def delete_brewing_method(self, id: int, user_id: int, conn=None) -> None:
        try:
            with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
                with conn.cursor() as cur:
                    cur.execute(BrewingMethod.DELETE, [id, user_id])
                    if cur.rowcount == 0:
                        raise NotFound(f'BrewingMethod {id} not found')
        except psycopg.errors.ForeignKeyViolation as e:
            raise Conflict(f'BrewingMethod {id} is referenced by existing past_logs') from e

    # -------------------------------------------------------------------------
    # RoastingMethod
    # -------------------------------------------------------------------------

    def get_roasting_methods(self, user_id: int) -> list[RoastingMethod]:
        rows = self._select_all(RoastingMethod.SELECT_ALL, [user_id])
        return [RoastingMethod.model_validate(row) for row in rows]

    def get_roasting_method(self, id: int, user_id: int) -> RoastingMethod | None:
        row = self._select_one(RoastingMethod.SELECT_ONE, [id, user_id])
        return RoastingMethod.model_validate(row) if row else None

    def add_roasting_method(self, roasting_method: RoastingMethod, conn=None) -> int:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(RoastingMethod.INSERT, roasting_method.model_dump())
                return cur.fetchone()[0]

    def update_roasting_method(self, roasting_method: RoastingMethod, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(RoastingMethod.UPDATE, roasting_method.model_dump())
                if cur.rowcount == 0:
                    raise NotFound(f'RoastingMethod {roasting_method.id} not found')

    def delete_roasting_method(self, id: int, user_id: int, conn=None) -> None:
        try:
            with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
                with conn.cursor() as cur:
                    cur.execute(RoastingMethod.DELETE, [id, user_id])
                    if cur.rowcount == 0:
                        raise NotFound(f'RoastingMethod {id} not found')
        except psycopg.errors.ForeignKeyViolation as e:
            raise Conflict(f'RoastingMethod {id} is referenced by existing past_logs') from e

    # -------------------------------------------------------------------------
    # PastLog
    # -------------------------------------------------------------------------

    def get_past_logs(self, user_id: int) -> list[PastLog]:
        rows = self._select_all(PastLog.SELECT_ALL, [user_id])
        return [PastLog.model_validate(row) for row in rows]

    def get_past_log(self, id: int, user_id: int) -> PastLog | None:
        row = self._select_one(PastLog.SELECT_ONE, [id, user_id])
        return PastLog.model_validate(row) if row else None

    def add_past_log(self, past_log: PastLog, conn=None) -> int:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(PastLog.INSERT, past_log.model_dump(exclude=PastLog._JOINED_FIELDS))
                return cur.fetchone()[0]

    def update_past_log(self, past_log: PastLog, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(PastLog.UPDATE, past_log.model_dump(exclude=PastLog._JOINED_FIELDS))
                if cur.rowcount == 0:
                    raise NotFound(f'PastLog {past_log.id} not found')

    def delete_past_log(self, id: int, user_id: int, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(PastLog.DELETE, [id, user_id])
                if cur.rowcount == 0:
                    raise NotFound(f'PastLog {id} not found')
