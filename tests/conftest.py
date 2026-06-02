import pytest


class FakeCursor:
    def __init__(self, rows=None, fetchone_val=None):
        self.calls = []
        self._rows = rows or []
        self._fetchone_val = fetchone_val

    def execute(self, sql, params=None):
        self.calls.append((sql, params))

    def fetchone(self):
        return self._fetchone_val

    def __iter__(self):
        return iter(self._rows)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


class FakeConnection:
    def __init__(self, rows=None, fetchone_val=None):
        self._rows = rows
        self._fetchone_val = fetchone_val
        self._cursors = []

    def cursor(self, row_factory=None):
        cur = FakeCursor(rows=self._rows, fetchone_val=self._fetchone_val)
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
    def __init__(self, rows=None, fetchone_val=None):
        self._rows = rows
        self._fetchone_val = fetchone_val
        self._connections = []

    def connection(self):
        conn = FakeConnection(rows=self._rows, fetchone_val=self._fetchone_val)
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
    def _factory(rows=None, fetchone_val=None):
        return FakePool(rows=rows, fetchone_val=fetchone_val)
    return _factory


@pytest.fixture
def make_conn():
    def _factory(rows=None, fetchone_val=None):
        return FakeConnection(rows=rows, fetchone_val=fetchone_val)
    return _factory
