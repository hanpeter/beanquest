import pytest
from unittest.mock import MagicMock

from beanquest.application import Application
from beanquest.errors import Conflict, NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod


def _brewing(id=1):
    return BrewingMethod(id=id, method_name='Manual Espresso')


def _roasting(id=1):
    return RoastingMethod(id=id, roaster_name='Popcorn Popper')


def _log(id=1):
    return PastLog(
        id=id, bean_name='Guatemala', process='Washed',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 11', rating_score=4,
    )


# ===========================================================================
# BrewingMethod
# ===========================================================================

def test_get_brewing_method_returns_model():
    db = MagicMock()
    db.get_brewing_method.return_value = _brewing()
    app = Application(db)
    result = app.get_brewing_method(1)
    assert isinstance(result, BrewingMethod)
    db.get_brewing_method.assert_called_once_with(1)


def test_get_brewing_method_raises_not_found():
    db = MagicMock()
    db.get_brewing_method.return_value = None
    app = Application(db)
    with pytest.raises(NotFound):
        app.get_brewing_method(99)


def test_get_brewing_methods_returns_list():
    db = MagicMock()
    db.get_brewing_methods.return_value = [_brewing(1), _brewing(2)]
    app = Application(db)
    results = app.get_brewing_methods()
    assert len(results) == 2


def test_add_brewing_method_refetches_by_id():
    db = MagicMock()
    db.add_brewing_method.return_value = 5
    db.get_brewing_method.return_value = _brewing(5)
    app = Application(db)
    model = BrewingMethod(method_name='Pour-over')
    result = app.add_brewing_method(model)
    db.add_brewing_method.assert_called_once_with(model)
    db.get_brewing_method.assert_called_once_with(5)
    assert result.id == 5


def test_update_brewing_method_refetches_by_id():
    db = MagicMock()
    model = _brewing(3)
    db.get_brewing_method.return_value = model
    app = Application(db)
    result = app.update_brewing_method(model)
    db.update_brewing_method.assert_called_once_with(model)
    db.get_brewing_method.assert_called_once_with(3)
    assert result is model


def test_delete_brewing_method_delegates():
    db = MagicMock()
    app = Application(db)
    app.delete_brewing_method(1)
    db.delete_brewing_method.assert_called_once_with(1)


def test_delete_brewing_method_not_found_bubbles():
    db = MagicMock()
    db.delete_brewing_method.side_effect = NotFound('BrewingMethod 99 not found')
    app = Application(db)
    with pytest.raises(NotFound):
        app.delete_brewing_method(99)


def test_delete_brewing_method_conflict_bubbles():
    db = MagicMock()
    db.delete_brewing_method.side_effect = Conflict('referenced')
    app = Application(db)
    with pytest.raises(Conflict):
        app.delete_brewing_method(1)


# ===========================================================================
# RoastingMethod
# ===========================================================================

def test_get_roasting_method_returns_model():
    db = MagicMock()
    db.get_roasting_method.return_value = _roasting()
    app = Application(db)
    result = app.get_roasting_method(1)
    assert isinstance(result, RoastingMethod)


def test_get_roasting_method_raises_not_found():
    db = MagicMock()
    db.get_roasting_method.return_value = None
    app = Application(db)
    with pytest.raises(NotFound):
        app.get_roasting_method(99)


def test_get_roasting_methods_returns_list():
    db = MagicMock()
    db.get_roasting_methods.return_value = [_roasting(1), _roasting(2)]
    app = Application(db)
    assert len(app.get_roasting_methods()) == 2


def test_add_roasting_method_refetches_by_id():
    db = MagicMock()
    db.add_roasting_method.return_value = 8
    db.get_roasting_method.return_value = _roasting(8)
    app = Application(db)
    model = RoastingMethod(roaster_name='Drum')
    result = app.add_roasting_method(model)
    db.add_roasting_method.assert_called_once_with(model)
    db.get_roasting_method.assert_called_once_with(8)
    assert result.id == 8


def test_update_roasting_method_refetches_by_id():
    db = MagicMock()
    model = _roasting(2)
    db.get_roasting_method.return_value = model
    app = Application(db)
    result = app.update_roasting_method(model)
    db.update_roasting_method.assert_called_once_with(model)
    db.get_roasting_method.assert_called_once_with(2)
    assert result is model


def test_delete_roasting_method_delegates():
    db = MagicMock()
    app = Application(db)
    app.delete_roasting_method(2)
    db.delete_roasting_method.assert_called_once_with(2)


def test_delete_roasting_method_not_found_bubbles():
    db = MagicMock()
    db.delete_roasting_method.side_effect = NotFound('RoastingMethod 99 not found')
    app = Application(db)
    with pytest.raises(NotFound):
        app.delete_roasting_method(99)


def test_delete_roasting_method_conflict_bubbles():
    db = MagicMock()
    db.delete_roasting_method.side_effect = Conflict('referenced')
    app = Application(db)
    with pytest.raises(Conflict):
        app.delete_roasting_method(2)


# ===========================================================================
# PastLog
# ===========================================================================

def test_get_past_log_returns_model():
    db = MagicMock()
    db.get_past_log.return_value = _log()
    app = Application(db)
    result = app.get_past_log(1)
    assert isinstance(result, PastLog)


def test_get_past_log_raises_not_found():
    db = MagicMock()
    db.get_past_log.return_value = None
    app = Application(db)
    with pytest.raises(NotFound):
        app.get_past_log(99)


def test_get_past_logs_returns_list():
    db = MagicMock()
    db.get_past_logs.return_value = [_log(1), _log(2)]
    app = Application(db)
    assert len(app.get_past_logs()) == 2


def test_add_past_log_refetches_by_id():
    db = MagicMock()
    db.add_past_log.return_value = 15
    db.get_past_log.return_value = _log(15)
    app = Application(db)
    model = _log()
    result = app.add_past_log(model)
    db.add_past_log.assert_called_once_with(model)
    db.get_past_log.assert_called_once_with(15)
    assert result.id == 15


def test_update_past_log_refetches_by_id():
    db = MagicMock()
    model = _log(7)
    db.get_past_log.return_value = model
    app = Application(db)
    result = app.update_past_log(model)
    db.update_past_log.assert_called_once_with(model)
    db.get_past_log.assert_called_once_with(7)
    assert result is model


def test_delete_past_log_delegates():
    db = MagicMock()
    app = Application(db)
    app.delete_past_log(3)
    db.delete_past_log.assert_called_once_with(3)


def test_delete_past_log_not_found_bubbles():
    db = MagicMock()
    db.delete_past_log.side_effect = NotFound('PastLog 99 not found')
    app = Application(db)
    with pytest.raises(NotFound):
        app.delete_past_log(99)
