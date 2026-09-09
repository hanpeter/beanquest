import os
from unittest.mock import MagicMock, patch, sentinel

import pytest
from fastapi.testclient import TestClient

from beanquest.api import app, get_application, get_auth, get_current_user_id
from beanquest.application import Application
from beanquest.auth import AccessTokenAuth
from beanquest.errors import Conflict, NotFound, RateLimited, Unauthorized
from beanquest.models import BrewingMethod, PastLog, RoastingMethod, User

TEST_USER_ID = 7
AUTH_SECRET = 'test-secret-for-auth-tests'


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _brewing(id=1, user_id=TEST_USER_ID):
    return BrewingMethod(id=id, user_id=user_id, method_name='Manual Espresso')


def _roasting(id=1, user_id=TEST_USER_ID):
    return RoastingMethod(id=id, user_id=user_id, roaster_name='Popcorn Popper')


def _log(id=1, user_id=TEST_USER_ID):
    return PastLog(
        id=id, user_id=user_id, bean_name='Guatemala', process='Washed',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 11', rating_score=4,
    )


def _user(id=TEST_USER_ID):
    return User(id=id, first_name='A', last_name='B', email='a@b.com')


def _bearer(token):
    return {'Authorization': f'Bearer {token}'}


def _make_token(secret=AUTH_SECRET, user_id=TEST_USER_ID, ttl=3600):
    return AccessTokenAuth(secret, ttl).create(user_id)


@pytest.fixture
def client():
    """For routes where auth mechanics themselves aren't under test —
    get_current_user_id is overridden to a fixed id, same as get_application.
    """
    mock_app = MagicMock(spec=Application)
    app.dependency_overrides[get_application] = lambda: mock_app
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    env = {'DATABASE_URL': 'postgresql://test', 'JWT_SECRET': AUTH_SECRET}
    with patch('psycopg_pool.ConnectionPool'), patch.dict(os.environ, env):
        with TestClient(app, raise_server_exceptions=True) as c:
            try:
                yield c, mock_app
            finally:
                app.dependency_overrides.clear()


@pytest.fixture
def auth_client():
    """For the auth flow itself — get_current_user_id is NOT overridden, so
    real tokens are minted/verified through the real dependency chain."""
    mock_app = MagicMock(spec=Application)
    app.dependency_overrides[get_application] = lambda: mock_app
    env = {'DATABASE_URL': 'postgresql://test', 'JWT_SECRET': AUTH_SECRET}
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
    monkeypatch.setenv('JWT_SECRET', 'x')
    with pytest.raises(RuntimeError, match='DATABASE_URL environment variable is required'):
        with TestClient(app):
            pass


def test_missing_jwt_secret(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', 'postgresql://test')
    monkeypatch.delenv('JWT_SECRET', raising=False)
    with pytest.raises(RuntimeError, match='JWT_SECRET environment variable is required'):
        with TestClient(app):
            pass


def test_get_application_returns_from_state():
    request = MagicMock()
    request.app.state.application = sentinel.application
    assert get_application(request) is sentinel.application


def test_get_auth_returns_from_state():
    request = MagicMock()
    request.app.state.auth = sentinel.auth
    assert get_auth(request) is sentinel.auth


# ---------------------------------------------------------------------------
# OpenAPI smoke
# ---------------------------------------------------------------------------

def test_openapi_lists_all_routes(client):
    c, _ = client
    paths = c.get('/openapi.json').json()['paths']
    assert '/api/v1/auth/signup' in paths
    assert '/api/v1/auth/login' in paths
    assert '/api/v1/auth/me' in paths
    assert '/api/v1/brewing-methods' in paths
    assert '/api/v1/brewing-methods/{id}' in paths
    assert '/api/v1/roasting-methods' in paths
    assert '/api/v1/roasting-methods/{id}' in paths
    assert '/api/v1/past-logs' in paths
    assert '/api/v1/past-logs/{id}' in paths


# ---------------------------------------------------------------------------
# Auth: signup / login / me
# ---------------------------------------------------------------------------

_SIGNUP_BODY = {
    'first_name': 'A', 'last_name': 'B', 'email': 'a@b.com', 'password': 'GoodPassw0rd',
}


def test_signup_returns_token(auth_client):
    c, mock = auth_client
    mock.create_user_with_password.return_value = _user()
    r = c.post('/api/v1/auth/signup', json=_SIGNUP_BODY)
    assert r.status_code == 201
    body = r.json()
    assert body['token_type'] == 'bearer'
    assert AccessTokenAuth(AUTH_SECRET, 3600).verify(body['access_token']) == TEST_USER_ID


def test_signup_password_too_short(auth_client):
    c, _ = auth_client
    r = c.post('/api/v1/auth/signup', json={**_SIGNUP_BODY, 'password': 'Short1!'})
    assert r.status_code == 422


def test_signup_password_single_category(auth_client):
    c, _ = auth_client
    r = c.post('/api/v1/auth/signup', json={**_SIGNUP_BODY, 'password': 'alllowercase'})
    assert r.status_code == 422


def test_signup_missing_required(auth_client):
    c, _ = auth_client
    r = c.post('/api/v1/auth/signup', json={})
    assert r.status_code == 422


def test_signup_duplicate_email_conflict(auth_client):
    c, mock = auth_client
    mock.create_user_with_password.side_effect = Conflict('User with email a@b.com already exists')
    r = c.post('/api/v1/auth/signup', json=_SIGNUP_BODY)
    assert r.status_code == 409


def test_login_returns_token(auth_client):
    c, mock = auth_client
    mock.verify_password_login.return_value = _user()
    r = c.post('/api/v1/auth/login', json={'email': 'a@b.com', 'password': 'whatever'})
    assert r.status_code == 200
    body = r.json()
    assert AccessTokenAuth(AUTH_SECRET, 3600).verify(body['access_token']) == TEST_USER_ID


def test_login_invalid_credentials(auth_client):
    c, mock = auth_client
    mock.verify_password_login.side_effect = Unauthorized('invalid email or password')
    r = c.post('/api/v1/auth/login', json={'email': 'a@b.com', 'password': 'wrong'})
    assert r.status_code == 401


def test_login_rate_limited_sets_retry_after_header(auth_client):
    c, mock = auth_client
    mock.verify_password_login.side_effect = RateLimited('too many failed login attempts', 42)
    r = c.post('/api/v1/auth/login', json={'email': 'a@b.com', 'password': 'wrong'})
    assert r.status_code == 429
    assert r.headers['retry-after'] == '42'


def test_login_missing_required(auth_client):
    c, _ = auth_client
    r = c.post('/api/v1/auth/login', json={})
    assert r.status_code == 422


def test_get_me_returns_current_user(auth_client):
    c, mock = auth_client
    mock.get_user.return_value = _user()
    r = c.get('/api/v1/auth/me', headers=_bearer(_make_token()))
    assert r.status_code == 200
    assert r.json()['id'] == TEST_USER_ID
    mock.get_user.assert_called_once_with(TEST_USER_ID)


def test_get_me_missing_authorization_header(auth_client):
    c, _ = auth_client
    r = c.get('/api/v1/auth/me')
    assert r.status_code == 401


def test_get_me_invalid_token(auth_client):
    c, _ = auth_client
    r = c.get('/api/v1/auth/me', headers=_bearer('garbage'))
    assert r.status_code == 401


def test_get_me_token_signed_with_wrong_secret(auth_client):
    c, _ = auth_client
    r = c.get('/api/v1/auth/me', headers=_bearer(_make_token(secret='wrong-secret')))
    assert r.status_code == 401


def test_get_me_expired_token(auth_client):
    c, _ = auth_client
    expired_token = _make_token(ttl=-1)
    r = c.get('/api/v1/auth/me', headers=_bearer(expired_token))
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Brewing methods
# ---------------------------------------------------------------------------

def test_list_brewing_methods(client):
    c, mock = client
    mock.get_brewing_methods.return_value = [_brewing(1), _brewing(2)]
    r = c.get('/api/v1/brewing-methods')
    assert r.status_code == 200
    assert len(r.json()) == 2
    mock.get_brewing_methods.assert_called_once_with(TEST_USER_ID)


def test_get_brewing_method(client):
    c, mock = client
    mock.get_brewing_method.return_value = _brewing()
    r = c.get('/api/v1/brewing-methods/1')
    assert r.status_code == 200
    assert r.json()['method_name'] == 'Manual Espresso'
    mock.get_brewing_method.assert_called_once_with(1, TEST_USER_ID)


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
    created = mock.add_brewing_method.call_args[0][0]
    assert created.user_id == TEST_USER_ID


def test_create_brewing_method_ignores_client_supplied_user_id(client):
    c, mock = client
    mock.add_brewing_method.return_value = _brewing()
    r = c.post('/api/v1/brewing-methods', json={'method_name': 'x', 'user_id': 99999})
    assert r.status_code == 201
    created = mock.add_brewing_method.call_args[0][0]
    assert created.user_id == TEST_USER_ID


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
    assert updated.user_id == TEST_USER_ID


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
    mock.delete_brewing_method.assert_called_once_with(1, TEST_USER_ID)


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
    mock.get_roasting_methods.assert_called_once_with(TEST_USER_ID)


def test_get_roasting_method(client):
    c, mock = client
    mock.get_roasting_method.return_value = _roasting()
    r = c.get('/api/v1/roasting-methods/1')
    assert r.status_code == 200
    assert r.json()['roaster_name'] == 'Popcorn Popper'
    mock.get_roasting_method.assert_called_once_with(1, TEST_USER_ID)


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
    created = mock.add_roasting_method.call_args[0][0]
    assert created.user_id == TEST_USER_ID


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
    assert updated.user_id == TEST_USER_ID


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
    mock.delete_roasting_method.assert_called_once_with(1, TEST_USER_ID)


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
    mock.get_past_logs.assert_called_once_with(TEST_USER_ID)


def test_get_past_log(client):
    c, mock = client
    mock.get_past_log.return_value = _log()
    r = c.get('/api/v1/past-logs/1')
    assert r.status_code == 200
    assert r.json()['bean_name'] == 'Guatemala'
    mock.get_past_log.assert_called_once_with(1, TEST_USER_ID)


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
    created = mock.add_past_log.call_args[0][0]
    assert created.user_id == TEST_USER_ID


def test_create_past_log_passes_date_logged(client):
    c, mock = client
    mock.add_past_log.return_value = _log()
    r = c.post('/api/v1/past-logs', json={**_LOG_BODY, 'date_logged': '2026-01-15'})
    assert r.status_code == 201
    created = mock.add_past_log.call_args[0][0]
    assert created.date_logged.isoformat() == '2026-01-15T00:00:00'


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
    assert updated.user_id == TEST_USER_ID


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
    mock.delete_past_log.assert_called_once_with(1, TEST_USER_ID)


def test_delete_past_log_not_found(client):
    c, mock = client
    mock.delete_past_log.side_effect = NotFound('PastLog 99 not found')
    r = c.delete('/api/v1/past-logs/99')
    assert r.status_code == 404


def test_spa_fallback(client):
    c, _ = client
    r = c.get('/some/spa/route')
    assert r.status_code == 200
    assert 'text/html' in r.headers['content-type']
