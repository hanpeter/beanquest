import pytest
import psycopg.errors

from beanquest.db import Database
from beanquest.errors import Conflict, NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod

# ---------------------------------------------------------------------------
# Shared row factories
# ---------------------------------------------------------------------------

BREWING_ROW = {
    'id': 1, 'method_name': 'Manual Espresso', 'machine_used': 'Breville',
    'grinder_used': 'Timemore', 'created_at': None, 'modified_at': None,
}
ROASTING_ROW = {
    'id': 2, 'roaster_name': 'Popcorn Popper', 'description': 'Modified',
    'created_at': None, 'modified_at': None,
}
PAST_LOG_ROW = {
    'id': 3, 'bean_name': 'Guatemala', 'process': 'Washed',
    'target_roast_level': 'City+', 'roasting_method_id': 2, 'brewing_method_id': 1,
    'roasting_notes': '', 'grinder_setting': 'Step 11', 'rating_score': 4,
    'general_notes': '', 'date_logged': None,
    'brewing_method_name': 'Manual Espresso', 'roasting_method_name': 'Popcorn Popper',
}


# ===========================================================================
# BrewingMethod
# ===========================================================================

def test_get_brewing_methods(make_pool):
    pool = make_pool(rows=[BREWING_ROW])
    db = Database(pool)
    results = db.get_brewing_methods()
    assert len(results) == 1
    assert isinstance(results[0], BrewingMethod)
    assert results[0].method_name == 'Manual Espresso'
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == BrewingMethod.SELECT_ALL


def test_get_brewing_method_found(make_pool):
    pool = make_pool(rows=[BREWING_ROW], fetchone_val=BREWING_ROW)
    db = Database(pool)
    result = db.get_brewing_method(1)
    assert isinstance(result, BrewingMethod)
    assert result.id == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == BrewingMethod.SELECT_ONE
    assert params == [1]


def test_get_brewing_method_not_found(make_pool):
    pool = make_pool(fetchone_val=None)
    db = Database(pool)
    result = db.get_brewing_method(999)
    assert result is None


def test_add_brewing_method_acquires_pool(make_pool):
    pool = make_pool(fetchone_val=(42,))
    db = Database(pool)
    model = BrewingMethod(method_name='Aeropress')
    result = db.add_brewing_method(model)
    assert result == 42
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == BrewingMethod.INSERT
    assert params['method_name'] == 'Aeropress'


def test_add_brewing_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn(fetchone_val=(7,))
    db = Database(pool)
    model = BrewingMethod(method_name='Pour-over')
    result = db.add_brewing_method(model, conn=conn)
    assert result == 7
    assert pool.connection_count == 0


def test_update_brewing_method_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    model = BrewingMethod(id=1, method_name='Updated')
    db.update_brewing_method(model)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == BrewingMethod.UPDATE
    assert params['method_name'] == 'Updated'
    assert params['id'] == 1


def test_update_brewing_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    model = BrewingMethod(id=1, method_name='x')
    db.update_brewing_method(model, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_update_brewing_method_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    with pytest.raises(NotFound):
        db.update_brewing_method(BrewingMethod(id=99, method_name='x'))


def test_delete_brewing_method_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    db.delete_brewing_method(1)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == BrewingMethod.DELETE
    assert params == [1]


def test_delete_brewing_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    db.delete_brewing_method(1, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_delete_brewing_method_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    with pytest.raises(NotFound):
        db.delete_brewing_method(99)


def test_delete_brewing_method_fk_violation_raises_conflict(make_pool):
    exc = psycopg.errors.ForeignKeyViolation('mock fk violation')
    pool = make_pool(execute_raises=exc)
    db = Database(pool)
    with pytest.raises(Conflict) as exc_info:
        db.delete_brewing_method(1)
    assert '1' in str(exc_info.value)


# ===========================================================================
# RoastingMethod
# ===========================================================================

def test_get_roasting_methods(make_pool):
    pool = make_pool(rows=[ROASTING_ROW])
    db = Database(pool)
    results = db.get_roasting_methods()
    assert len(results) == 1
    assert isinstance(results[0], RoastingMethod)
    assert results[0].roaster_name == 'Popcorn Popper'
    sql, _ = pool.last_conn.last_cursor.calls[0]
    assert sql == RoastingMethod.SELECT_ALL


def test_get_roasting_method_found(make_pool):
    pool = make_pool(fetchone_val=ROASTING_ROW)
    db = Database(pool)
    result = db.get_roasting_method(2)
    assert isinstance(result, RoastingMethod)
    assert result.id == 2
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == RoastingMethod.SELECT_ONE
    assert params == [2]


def test_get_roasting_method_not_found(make_pool):
    pool = make_pool(fetchone_val=None)
    db = Database(pool)
    assert db.get_roasting_method(999) is None


def test_add_roasting_method_acquires_pool(make_pool):
    pool = make_pool(fetchone_val=(5,))
    db = Database(pool)
    model = RoastingMethod(roaster_name='Drum Roaster')
    result = db.add_roasting_method(model)
    assert result == 5
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == RoastingMethod.INSERT
    assert params['roaster_name'] == 'Drum Roaster'


def test_add_roasting_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn(fetchone_val=(3,))
    db = Database(pool)
    model = RoastingMethod(roaster_name='x')
    result = db.add_roasting_method(model, conn=conn)
    assert result == 3
    assert pool.connection_count == 0


def test_update_roasting_method_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    model = RoastingMethod(id=2, roaster_name='New Name')
    db.update_roasting_method(model)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == RoastingMethod.UPDATE
    assert params['roaster_name'] == 'New Name'


def test_update_roasting_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    model = RoastingMethod(id=2, roaster_name='x')
    db.update_roasting_method(model, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_update_roasting_method_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    with pytest.raises(NotFound):
        db.update_roasting_method(RoastingMethod(id=99, roaster_name='x'))


def test_delete_roasting_method_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    db.delete_roasting_method(2)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == RoastingMethod.DELETE
    assert params == [2]


def test_delete_roasting_method_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    db.delete_roasting_method(2, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_delete_roasting_method_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    with pytest.raises(NotFound):
        db.delete_roasting_method(99)


def test_delete_roasting_method_fk_violation_raises_conflict(make_pool):
    exc = psycopg.errors.ForeignKeyViolation('mock fk violation')
    pool = make_pool(execute_raises=exc)
    db = Database(pool)
    with pytest.raises(Conflict) as exc_info:
        db.delete_roasting_method(2)
    assert '2' in str(exc_info.value)


# ===========================================================================
# PastLog
# ===========================================================================

def test_get_past_logs(make_pool):
    pool = make_pool(rows=[PAST_LOG_ROW])
    db = Database(pool)
    results = db.get_past_logs()
    assert len(results) == 1
    assert isinstance(results[0], PastLog)
    assert results[0].bean_name == 'Guatemala'
    sql, _ = pool.last_conn.last_cursor.calls[0]
    assert sql == PastLog.SELECT_ALL


def test_get_past_log_found(make_pool):
    pool = make_pool(fetchone_val=PAST_LOG_ROW)
    db = Database(pool)
    result = db.get_past_log(3)
    assert isinstance(result, PastLog)
    assert result.id == 3
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == PastLog.SELECT_ONE
    assert params == [3]


def test_get_past_log_not_found(make_pool):
    pool = make_pool(fetchone_val=None)
    db = Database(pool)
    assert db.get_past_log(999) is None


def test_add_past_log_acquires_pool(make_pool):
    pool = make_pool(fetchone_val=(10,))
    db = Database(pool)
    model = PastLog(
        bean_name='Sumatra', process='Natural',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 12', rating_score=1,
    )
    result = db.add_past_log(model)
    assert result == 10
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == PastLog.INSERT
    assert params['bean_name'] == 'Sumatra'
    assert 'brewing_method_name' not in params
    assert 'roasting_method_name' not in params


def test_add_past_log_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn(fetchone_val=(11,))
    db = Database(pool)
    model = PastLog(
        bean_name='Kenya', process='Washed',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 10', rating_score=5,
    )
    result = db.add_past_log(model, conn=conn)
    assert result == 11
    assert pool.connection_count == 0


def test_update_past_log_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    model = PastLog(
        id=3, bean_name='Ethiopia', process='Anaerobic',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 9', rating_score=3,
    )
    db.update_past_log(model)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == PastLog.UPDATE
    assert params['bean_name'] == 'Ethiopia'
    assert 'brewing_method_name' not in params
    assert 'roasting_method_name' not in params


def test_update_past_log_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    model = PastLog(
        id=3, bean_name='x', process='Honey',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='1', rating_score=2,
    )
    db.update_past_log(model, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_update_past_log_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    model = PastLog(
        id=99, bean_name='x', process='Washed',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='1', rating_score=0,
    )
    with pytest.raises(NotFound):
        db.update_past_log(model)


def test_delete_past_log_acquires_pool(make_pool):
    pool = make_pool()
    db = Database(pool)
    db.delete_past_log(3)
    assert pool.connection_count == 1
    sql, params = pool.last_conn.last_cursor.calls[0]
    assert sql == PastLog.DELETE
    assert params == [3]


def test_delete_past_log_uses_existing_conn(make_pool, make_conn):
    pool = make_pool()
    conn = make_conn()
    db = Database(pool)
    db.delete_past_log(3, conn=conn)
    assert pool.connection_count == 0
    assert len(conn.last_cursor.calls) == 1


def test_delete_past_log_not_found(make_pool):
    pool = make_pool(rowcount=0)
    db = Database(pool)
    with pytest.raises(NotFound):
        db.delete_past_log(99)


def test_transaction_yields_connection(make_pool):
    pool = make_pool()
    db = Database(pool)
    with db.transaction() as conn:
        assert conn is pool.last_conn
