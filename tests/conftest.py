import pathlib

import pytest

# Create a minimal static dir stub so SPA routes are registered at module import
# time. Vite's emptyOutDir:true replaces these when the frontend is actually built.
_static = pathlib.Path(__file__).parent.parent / 'beanquest' / 'static'
_static.mkdir(parents=True, exist_ok=True)
(_static / 'index.html').touch(exist_ok=True)
(_static / 'assets').mkdir(exist_ok=True)


class FakeCursor:
    def __init__(self, rows=None, fetchone_val=None, execute_raises=None, rowcount=1):
        self.calls = []
        self._rows = rows or []
        self._fetchone_val = fetchone_val
        self._execute_raises = execute_raises
        self.rowcount = rowcount

    def execute(self, sql, params=None):
        self.calls.append((sql, params))
        if self._execute_raises is not None:
            raise self._execute_raises

    def fetchone(self):
        return self._fetchone_val

    def __iter__(self):
        return iter(self._rows)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


class FakeConnection:
    def __init__(self, rows=None, fetchone_val=None, execute_raises=None, rowcount=1):
        self._rows = rows
        self._fetchone_val = fetchone_val
        self._execute_raises = execute_raises
        self._rowcount = rowcount
        self._cursors = []

    def cursor(self, row_factory=None):
        cur = FakeCursor(
            rows=self._rows,
            fetchone_val=self._fetchone_val,
            execute_raises=self._execute_raises,
            rowcount=self._rowcount,
        )
        self._cursors.append(cur)
        return cur

    @property
    def last_cursor(self):
        return self._cursors[-1]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


class FakePool:
    def __init__(self, rows=None, fetchone_val=None, execute_raises=None, rowcount=1):
        self._rows = rows
        self._fetchone_val = fetchone_val
        self._execute_raises = execute_raises
        self._rowcount = rowcount
        self._connections = []

    def connection(self):
        conn = FakeConnection(
            rows=self._rows,
            fetchone_val=self._fetchone_val,
            execute_raises=self._execute_raises,
            rowcount=self._rowcount,
        )
        self._connections.append(conn)
        return conn

    @property
    def last_conn(self):
        return self._connections[-1]

    @property
    def connection_count(self):
        return len(self._connections)


@pytest.fixture
def make_pool():
    def _factory(rows=None, fetchone_val=None, execute_raises=None, rowcount=1):
        return FakePool(rows=rows, fetchone_val=fetchone_val, execute_raises=execute_raises, rowcount=rowcount)
    return _factory


@pytest.fixture
def make_conn():
    def _factory(rows=None, fetchone_val=None, execute_raises=None, rowcount=1):
        return FakeConnection(rows=rows, fetchone_val=fetchone_val, execute_raises=execute_raises, rowcount=rowcount)
    return _factory
