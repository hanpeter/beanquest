import os
from unittest.mock import MagicMock, patch, sentinel

import pytest
from fastapi.testclient import TestClient

from beanquest.api import app, get_application
from beanquest.application import Application
from beanquest.errors import Conflict, NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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


@pytest.fixture
def client():
    mock_app = MagicMock(spec=Application)
    app.dependency_overrides[get_application] = lambda: mock_app
    env = {'DATABASE_URL': 'postgresql://test'}
    with patch('psycopg_pool.ConnectionPool'), patch.dict(os.environ, env):
        with TestClient(app, raise_server_exceptions=True) as c:
            try:
                yield c, mock_app
            finally:
                app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# App-level
# ---------------------------------------------------------------------------

def test_missing_database_url(monkeypatch):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    with pytest.raises(RuntimeError, match='DATABASE_URL environment variable is required'):
        with TestClient(app):
            pass


def test_get_application_returns_from_state():
    request = MagicMock()
    request.app.state.application = sentinel.application
    assert get_application(request) is sentinel.application


# ---------------------------------------------------------------------------
# OpenAPI smoke
# ---------------------------------------------------------------------------

def test_openapi_lists_all_routes(client):
    c, _ = client
    paths = c.get('/openapi.json').json()['paths']
    assert '/api/v1/brewing-methods' in paths
    assert '/api/v1/brewing-methods/{id}' in paths
    assert '/api/v1/roasting-methods' in paths
    assert '/api/v1/roasting-methods/{id}' in paths
    assert '/api/v1/past-logs' in paths
    assert '/api/v1/past-logs/{id}' in paths


# ---------------------------------------------------------------------------
# Brewing methods
# ---------------------------------------------------------------------------

def test_list_brewing_methods(client):
    c, mock = client
    mock.get_brewing_methods.return_value = [_brewing(1), _brewing(2)]
    r = c.get('/api/v1/brewing-methods')
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_brewing_method(client):
    c, mock = client
    mock.get_brewing_method.return_value = _brewing()
    r = c.get('/api/v1/brewing-methods/1')
    assert r.status_code == 200
    assert r.json()['method_name'] == 'Manual Espresso'


def test_get_brewing_method_not_found(client):
    c, mock = client
    mock.get_brewing_method.side_effect = NotFound('BrewingMethod 99 not found')
    r = c.get('/api/v1/brewing-methods/99')
    assert r.status_code == 404


def test_create_brewing_method(client):
    c, mock = client
    mock.add_brewing_method.return_value = _brewing()
    r = c.post('/api/v1/brewing-methods', json={'method_name': 'Manual Espresso'})
    assert r.status_code == 201
    assert r.json()['id'] == 1


def test_create_brewing_method_missing_required(client):
    c, _ = client
    r = c.post('/api/v1/brewing-methods', json={})
    assert r.status_code == 422


def test_update_brewing_method(client):
    c, mock = client
    mock.update_brewing_method.return_value = _brewing()
    r = c.put('/api/v1/brewing-methods/1', json={'method_name': 'Updated'})
    assert r.status_code == 200
    updated = mock.update_brewing_method.call_args[0][0]
    assert updated.id == 1


def test_update_brewing_method_not_found(client):
    c, mock = client
    mock.update_brewing_method.side_effect = NotFound('BrewingMethod 99 not found')
    r = c.put('/api/v1/brewing-methods/99', json={'method_name': 'X'})
    assert r.status_code == 404


def test_delete_brewing_method(client):
    c, mock = client
    mock.delete_brewing_method.return_value = None
    r = c.delete('/api/v1/brewing-methods/1')
    assert r.status_code == 204


def test_delete_brewing_method_not_found(client):
    c, mock = client
    mock.delete_brewing_method.side_effect = NotFound('BrewingMethod 99 not found')
    r = c.delete('/api/v1/brewing-methods/99')
    assert r.status_code == 404


def test_delete_brewing_method_conflict(client):
    c, mock = client
    mock.delete_brewing_method.side_effect = Conflict('in use')
    r = c.delete('/api/v1/brewing-methods/1')
    assert r.status_code == 409


# ---------------------------------------------------------------------------
# Roasting methods
# ---------------------------------------------------------------------------

def test_list_roasting_methods(client):
    c, mock = client
    mock.get_roasting_methods.return_value = [_roasting(1), _roasting(2)]
    r = c.get('/api/v1/roasting-methods')
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_roasting_method(client):
    c, mock = client
    mock.get_roasting_method.return_value = _roasting()
    r = c.get('/api/v1/roasting-methods/1')
    assert r.status_code == 200
    assert r.json()['roaster_name'] == 'Popcorn Popper'


def test_get_roasting_method_not_found(client):
    c, mock = client
    mock.get_roasting_method.side_effect = NotFound('RoastingMethod 99 not found')
    r = c.get('/api/v1/roasting-methods/99')
    assert r.status_code == 404


def test_create_roasting_method(client):
    c, mock = client
    mock.add_roasting_method.return_value = _roasting()
    r = c.post('/api/v1/roasting-methods', json={'roaster_name': 'Popcorn Popper'})
    assert r.status_code == 201
    assert r.json()['id'] == 1


def test_create_roasting_method_missing_required(client):
    c, _ = client
    r = c.post('/api/v1/roasting-methods', json={})
    assert r.status_code == 422


def test_update_roasting_method(client):
    c, mock = client
    mock.update_roasting_method.return_value = _roasting()
    r = c.put('/api/v1/roasting-methods/1', json={'roaster_name': 'Updated'})
    assert r.status_code == 200
    updated = mock.update_roasting_method.call_args[0][0]
    assert updated.id == 1


def test_update_roasting_method_not_found(client):
    c, mock = client
    mock.update_roasting_method.side_effect = NotFound('RoastingMethod 99 not found')
    r = c.put('/api/v1/roasting-methods/99', json={'roaster_name': 'X'})
    assert r.status_code == 404


def test_delete_roasting_method(client):
    c, mock = client
    mock.delete_roasting_method.return_value = None
    r = c.delete('/api/v1/roasting-methods/1')
    assert r.status_code == 204


def test_delete_roasting_method_not_found(client):
    c, mock = client
    mock.delete_roasting_method.side_effect = NotFound('RoastingMethod 99 not found')
    r = c.delete('/api/v1/roasting-methods/99')
    assert r.status_code == 404


def test_delete_roasting_method_conflict(client):
    c, mock = client
    mock.delete_roasting_method.side_effect = Conflict('in use')
    r = c.delete('/api/v1/roasting-methods/1')
    assert r.status_code == 409


# ---------------------------------------------------------------------------
# Past logs
# ---------------------------------------------------------------------------

_LOG_BODY = {
    'bean_name': 'Guatemala',
    'process': 'Washed',
    'roasting_method_id': 1,
    'brewing_method_id': 1,
    'grinder_setting': 'Step 11',
    'rating_score': 4,
}


def test_list_past_logs(client):
    c, mock = client
    mock.get_past_logs.return_value = [_log(1), _log(2)]
    r = c.get('/api/v1/past-logs')
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_past_log(client):
    c, mock = client
    mock.get_past_log.return_value = _log()
    r = c.get('/api/v1/past-logs/1')
    assert r.status_code == 200
    assert r.json()['bean_name'] == 'Guatemala'


def test_get_past_log_not_found(client):
    c, mock = client
    mock.get_past_log.side_effect = NotFound('PastLog 99 not found')
    r = c.get('/api/v1/past-logs/99')
    assert r.status_code == 404


def test_create_past_log(client):
    c, mock = client
    mock.add_past_log.return_value = _log()
    r = c.post('/api/v1/past-logs', json=_LOG_BODY)
    assert r.status_code == 201
    assert r.json()['id'] == 1


def test_create_past_log_missing_required(client):
    c, _ = client
    r = c.post('/api/v1/past-logs', json={})
    assert r.status_code == 422


def test_create_past_log_rating_too_high(client):
    c, _ = client
    r = c.post('/api/v1/past-logs', json={**_LOG_BODY, 'rating_score': 6})
    assert r.status_code == 422


def test_create_past_log_rating_too_low(client):
    c, _ = client
    r = c.post('/api/v1/past-logs', json={**_LOG_BODY, 'rating_score': -1})
    assert r.status_code == 422


def test_update_past_log(client):
    c, mock = client
    mock.update_past_log.return_value = _log()
    r = c.put('/api/v1/past-logs/1', json=_LOG_BODY)
    assert r.status_code == 200
    updated = mock.update_past_log.call_args[0][0]
    assert updated.id == 1


def test_update_past_log_not_found(client):
    c, mock = client
    mock.update_past_log.side_effect = NotFound('PastLog 99 not found')
    r = c.put('/api/v1/past-logs/99', json=_LOG_BODY)
    assert r.status_code == 404


def test_delete_past_log(client):
    c, mock = client
    mock.delete_past_log.return_value = None
    r = c.delete('/api/v1/past-logs/1')
    assert r.status_code == 204


def test_delete_past_log_not_found(client):
    c, mock = client
    mock.delete_past_log.side_effect = NotFound('PastLog 99 not found')
    r = c.delete('/api/v1/past-logs/99')
    assert r.status_code == 404
