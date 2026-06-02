from contextlib import contextmanager, nullcontext

import psycopg
from psycopg.rows import dict_row

from beanquest.errors import Conflict, NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod


class Database:
    def __init__(self, pool):
        self._pool = pool

    @contextmanager
    def transaction(self):
        with self._pool.connection() as conn:
            yield conn

    # -------------------------------------------------------------------------
    # BrewingMethod
    # -------------------------------------------------------------------------

    def get_brewing_methods(self) -> list[BrewingMethod]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(BrewingMethod.SELECT_ALL)
                return [BrewingMethod.model_validate(row) for row in cur]

    def get_brewing_method(self, id: int) -> BrewingMethod | None:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(BrewingMethod.SELECT_ONE, [id])
                row = cur.fetchone()
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

    def delete_brewing_method(self, id: int, conn=None) -> None:
        try:
            with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
                with conn.cursor() as cur:
                    cur.execute(BrewingMethod.DELETE, [id])
                    if cur.rowcount == 0:
                        raise NotFound(f'BrewingMethod {id} not found')
        except psycopg.errors.ForeignKeyViolation as e:
            raise Conflict(f'BrewingMethod {id} is referenced by existing past_logs') from e

    # -------------------------------------------------------------------------
    # RoastingMethod
    # -------------------------------------------------------------------------

    def get_roasting_methods(self) -> list[RoastingMethod]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(RoastingMethod.SELECT_ALL)
                return [RoastingMethod.model_validate(row) for row in cur]

    def get_roasting_method(self, id: int) -> RoastingMethod | None:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(RoastingMethod.SELECT_ONE, [id])
                row = cur.fetchone()
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

    def delete_roasting_method(self, id: int, conn=None) -> None:
        try:
            with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
                with conn.cursor() as cur:
                    cur.execute(RoastingMethod.DELETE, [id])
                    if cur.rowcount == 0:
                        raise NotFound(f'RoastingMethod {id} not found')
        except psycopg.errors.ForeignKeyViolation as e:
            raise Conflict(f'RoastingMethod {id} is referenced by existing past_logs') from e

    # -------------------------------------------------------------------------
    # PastLog
    # -------------------------------------------------------------------------

    def get_past_logs(self) -> list[PastLog]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(PastLog.SELECT_ALL)
                return [PastLog.model_validate(row) for row in cur]

    def get_past_log(self, id: int) -> PastLog | None:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(PastLog.SELECT_ONE, [id])
                row = cur.fetchone()
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

    def delete_past_log(self, id: int, conn=None) -> None:
        with (nullcontext(conn) if conn is not None else self._pool.connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(PastLog.DELETE, [id])
                if cur.rowcount == 0:
                    raise NotFound(f'PastLog {id} not found')
