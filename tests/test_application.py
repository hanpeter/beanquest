from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

from beanquest.application import Application
from beanquest.errors import Conflict, NotFound, RateLimited, Unauthorized
from beanquest.models import AuthIdentity, BrewingMethod, LoginAttempt, PastLog, RoastingMethod, User


def _user(id=1, email='a@b.com'):
    return User(id=id, first_name='A', last_name='B', email=email)


def _identity(user_id=1, password_hash='$2b$hashed'):
    return AuthIdentity(id=1, user_id=user_id, provider='password', password_hash=password_hash)


def _brewing(id=1, user_id=10):
    return BrewingMethod(id=id, user_id=user_id, method_name='Manual Espresso')


def _roasting(id=1, user_id=10):
    return RoastingMethod(id=id, user_id=user_id, roaster_name='Popcorn Popper')


def _log(id=1, user_id=10):
    return PastLog(
        id=id, user_id=user_id, bean_name='Guatemala', process='Washed',
        roasting_method_id=1, brewing_method_id=1,
        grinder_setting='Step 11', rating_score=4,
    )


def _make_app(db=None, password_auth=None):
    return Application(db or MagicMock(), password_auth or MagicMock())


# ===========================================================================
# User / auth
# ===========================================================================

def test_get_user_returns_model():
    db = MagicMock()
    db.get_user.return_value = _user()
    app = _make_app(db)
    result = app.get_user(1)
    assert isinstance(result, User)
    db.get_user.assert_called_once_with(1)


def test_get_user_raises_not_found():
    db = MagicMock()
    db.get_user.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.get_user(99)


def test_create_user_with_password_hashes_and_links_identity():
    db = MagicMock()
    password_auth = MagicMock()
    password_auth.create.return_value = '$2b$hashed'
    db.add_user.return_value = 5
    db.get_user.return_value = _user(id=5)
    app = _make_app(db, password_auth)

    user_in = User(first_name='A', last_name='B', email='a@b.com')
    result = app.create_user_with_password(user_in, 'plaintext-password')

    password_auth.create.assert_called_once_with('plaintext-password')
    conn = db.transaction.return_value.__enter__.return_value
    db.add_user.assert_called_once_with(user_in, conn=conn)
    added_identity = db.add_auth_identity.call_args.args[0]
    assert added_identity.user_id == 5
    assert added_identity.provider == 'password'
    assert added_identity.password_hash == '$2b$hashed'
    assert db.add_auth_identity.call_args.kwargs['conn'] is conn
    db.get_user.assert_called_once_with(5)
    assert result.id == 5


def test_verify_password_login_success_resets_attempts():
    db = MagicMock()
    password_auth = MagicMock()
    db.record_login_failure.return_value = LoginAttempt(email='a@b.com', failure_count=1)
    db.get_user_by_email.return_value = _user(email='a@b.com')
    db.get_auth_identity.return_value = _identity()
    password_auth.verify.return_value = True
    app = _make_app(db, password_auth)

    result = app.verify_password_login('a@b.com', 'correct-password')

    assert result.email == 'a@b.com'
    password_auth.verify.assert_called_once_with('correct-password', '$2b$hashed')
    db.reset_login_attempts.assert_called_once_with('a@b.com')


def test_verify_password_login_rate_limited_before_password_check():
    db = MagicMock()
    password_auth = MagicMock()
    db.record_login_failure.return_value = None
    locked_until = datetime.now(timezone.utc) + timedelta(seconds=42)
    db.get_login_attempt.return_value = LoginAttempt(
        email='a@b.com', failure_count=5, locked_until=locked_until,
    )
    app = _make_app(db, password_auth)

    with pytest.raises(RateLimited) as exc_info:
        app.verify_password_login('a@b.com', 'anything')

    assert exc_info.value.retry_after_seconds > 0
    db.get_user_by_email.assert_not_called()
    password_auth.verify.assert_not_called()


def test_verify_password_login_retry_after_defaults_to_one_second_when_attempt_missing():
    db = MagicMock()
    db.record_login_failure.return_value = None
    db.get_login_attempt.return_value = None
    app = _make_app(db, MagicMock())
    with pytest.raises(RateLimited) as exc_info:
        app.verify_password_login('a@b.com', 'x')
    assert exc_info.value.retry_after_seconds == 1


def test_verify_password_login_retry_after_defaults_to_one_second_when_not_locked():
    db = MagicMock()
    db.record_login_failure.return_value = None
    db.get_login_attempt.return_value = LoginAttempt(email='a@b.com', failure_count=3, locked_until=None)
    app = _make_app(db, MagicMock())
    with pytest.raises(RateLimited) as exc_info:
        app.verify_password_login('a@b.com', 'x')
    assert exc_info.value.retry_after_seconds == 1


def test_verify_password_login_unknown_email_raises_unauthorized():
    db = MagicMock()
    db.record_login_failure.return_value = LoginAttempt(email='a@b.com', failure_count=1)
    db.get_user_by_email.return_value = None
    app = _make_app(db, MagicMock())
    with pytest.raises(Unauthorized):
        app.verify_password_login('a@b.com', 'x')
    db.reset_login_attempts.assert_not_called()


def test_verify_password_login_no_password_identity_raises_unauthorized():
    db = MagicMock()
    db.record_login_failure.return_value = LoginAttempt(email='a@b.com', failure_count=1)
    db.get_user_by_email.return_value = _user()
    db.get_auth_identity.return_value = None
    app = _make_app(db, MagicMock())
    with pytest.raises(Unauthorized):
        app.verify_password_login('a@b.com', 'x')
    db.reset_login_attempts.assert_not_called()


def test_verify_password_login_identity_without_password_hash_raises_unauthorized():
    db = MagicMock()
    db.record_login_failure.return_value = LoginAttempt(email='a@b.com', failure_count=1)
    db.get_user_by_email.return_value = _user()
    db.get_auth_identity.return_value = AuthIdentity(user_id=1, provider='google', provider_uid='sub-1')
    app = _make_app(db, MagicMock())
    with pytest.raises(Unauthorized):
        app.verify_password_login('a@b.com', 'x')
    db.reset_login_attempts.assert_not_called()


def test_verify_password_login_wrong_password_raises_unauthorized():
    db = MagicMock()
    password_auth = MagicMock()
    db.record_login_failure.return_value = LoginAttempt(email='a@b.com', failure_count=1)
    db.get_user_by_email.return_value = _user()
    db.get_auth_identity.return_value = _identity()
    password_auth.verify.return_value = False
    app = _make_app(db, password_auth)
    with pytest.raises(Unauthorized):
        app.verify_password_login('a@b.com', 'wrong')
    db.reset_login_attempts.assert_not_called()


# ===========================================================================
# BrewingMethod
# ===========================================================================

def test_get_brewing_method_returns_model():
    db = MagicMock()
    db.get_brewing_method.return_value = _brewing()
    app = _make_app(db)
    result = app.get_brewing_method(1, 10)
    assert isinstance(result, BrewingMethod)
    db.get_brewing_method.assert_called_once_with(1, 10)


def test_get_brewing_method_raises_not_found():
    db = MagicMock()
    db.get_brewing_method.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.get_brewing_method(99, 10)


def test_get_brewing_methods_returns_list():
    db = MagicMock()
    db.get_brewing_methods.return_value = [_brewing(1), _brewing(2)]
    app = _make_app(db)
    results = app.get_brewing_methods(10)
    assert len(results) == 2
    db.get_brewing_methods.assert_called_once_with(10)


def test_add_brewing_method_refetches_by_id():
    db = MagicMock()
    db.add_brewing_method.return_value = 5
    db.get_brewing_method.return_value = _brewing(5)
    app = _make_app(db)
    model = BrewingMethod(user_id=10, method_name='Pour-over')
    result = app.add_brewing_method(model)
    db.add_brewing_method.assert_called_once_with(model)
    db.get_brewing_method.assert_called_once_with(5, 10)
    assert result.id == 5


def test_update_brewing_method_refetches_by_id():
    db = MagicMock()
    model = _brewing(3)
    db.get_brewing_method.return_value = model
    app = _make_app(db)
    result = app.update_brewing_method(model)
    db.update_brewing_method.assert_called_once_with(model)
    db.get_brewing_method.assert_called_once_with(3, 10)
    assert result is model


def test_delete_brewing_method_delegates():
    db = MagicMock()
    app = _make_app(db)
    app.delete_brewing_method(1, 10)
    db.delete_brewing_method.assert_called_once_with(1, 10)


def test_delete_brewing_method_not_found_bubbles():
    db = MagicMock()
    db.delete_brewing_method.side_effect = NotFound('BrewingMethod 99 not found')
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.delete_brewing_method(99, 10)


def test_delete_brewing_method_conflict_bubbles():
    db = MagicMock()
    db.delete_brewing_method.side_effect = Conflict('referenced')
    app = _make_app(db)
    with pytest.raises(Conflict):
        app.delete_brewing_method(1, 10)


# ===========================================================================
# RoastingMethod
# ===========================================================================

def test_get_roasting_method_returns_model():
    db = MagicMock()
    db.get_roasting_method.return_value = _roasting()
    app = _make_app(db)
    result = app.get_roasting_method(1, 10)
    assert isinstance(result, RoastingMethod)


def test_get_roasting_method_raises_not_found():
    db = MagicMock()
    db.get_roasting_method.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.get_roasting_method(99, 10)


def test_get_roasting_methods_returns_list():
    db = MagicMock()
    db.get_roasting_methods.return_value = [_roasting(1), _roasting(2)]
    app = _make_app(db)
    assert len(app.get_roasting_methods(10)) == 2


def test_add_roasting_method_refetches_by_id():
    db = MagicMock()
    db.add_roasting_method.return_value = 8
    db.get_roasting_method.return_value = _roasting(8)
    app = _make_app(db)
    model = RoastingMethod(user_id=10, roaster_name='Drum')
    result = app.add_roasting_method(model)
    db.add_roasting_method.assert_called_once_with(model)
    db.get_roasting_method.assert_called_once_with(8, 10)
    assert result.id == 8


def test_update_roasting_method_refetches_by_id():
    db = MagicMock()
    model = _roasting(2)
    db.get_roasting_method.return_value = model
    app = _make_app(db)
    result = app.update_roasting_method(model)
    db.update_roasting_method.assert_called_once_with(model)
    db.get_roasting_method.assert_called_once_with(2, 10)
    assert result is model


def test_delete_roasting_method_delegates():
    db = MagicMock()
    app = _make_app(db)
    app.delete_roasting_method(2, 10)
    db.delete_roasting_method.assert_called_once_with(2, 10)


def test_delete_roasting_method_not_found_bubbles():
    db = MagicMock()
    db.delete_roasting_method.side_effect = NotFound('RoastingMethod 99 not found')
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.delete_roasting_method(99, 10)


def test_delete_roasting_method_conflict_bubbles():
    db = MagicMock()
    db.delete_roasting_method.side_effect = Conflict('referenced')
    app = _make_app(db)
    with pytest.raises(Conflict):
        app.delete_roasting_method(2, 10)


# ===========================================================================
# PastLog
# ===========================================================================

def test_get_past_log_returns_model():
    db = MagicMock()
    db.get_past_log.return_value = _log()
    app = _make_app(db)
    result = app.get_past_log(1, 10)
    assert isinstance(result, PastLog)


def test_get_past_log_raises_not_found():
    db = MagicMock()
    db.get_past_log.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.get_past_log(99, 10)


def test_get_past_logs_returns_list():
    db = MagicMock()
    db.get_past_logs.return_value = [_log(1), _log(2)]
    app = _make_app(db)
    assert len(app.get_past_logs(10)) == 2


def test_add_past_log_refetches_by_id():
    db = MagicMock()
    db.get_brewing_method.return_value = _brewing()
    db.get_roasting_method.return_value = _roasting()
    db.add_past_log.return_value = 15
    db.get_past_log.return_value = _log(15)
    app = _make_app(db)
    model = _log()
    result = app.add_past_log(model)
    db.get_brewing_method.assert_called_once_with(model.brewing_method_id, model.user_id)
    db.get_roasting_method.assert_called_once_with(model.roasting_method_id, model.user_id)
    db.add_past_log.assert_called_once_with(model)
    db.get_past_log.assert_called_once_with(15, model.user_id)
    assert result.id == 15


def test_add_past_log_raises_not_found_when_brewing_method_not_owned():
    db = MagicMock()
    db.get_brewing_method.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.add_past_log(_log())
    db.add_past_log.assert_not_called()


def test_add_past_log_raises_not_found_when_roasting_method_not_owned():
    db = MagicMock()
    db.get_brewing_method.return_value = _brewing()
    db.get_roasting_method.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.add_past_log(_log())
    db.add_past_log.assert_not_called()


def test_update_past_log_refetches_by_id():
    db = MagicMock()
    db.get_brewing_method.return_value = _brewing()
    db.get_roasting_method.return_value = _roasting()
    model = _log(7)
    db.get_past_log.return_value = model
    app = _make_app(db)
    result = app.update_past_log(model)
    db.update_past_log.assert_called_once_with(model)
    db.get_past_log.assert_called_once_with(7, model.user_id)
    assert result is model


def test_update_past_log_raises_not_found_when_method_not_owned():
    db = MagicMock()
    db.get_brewing_method.return_value = None
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.update_past_log(_log(7))
    db.update_past_log.assert_not_called()


def test_delete_past_log_delegates():
    db = MagicMock()
    app = _make_app(db)
    app.delete_past_log(3, 10)
    db.delete_past_log.assert_called_once_with(3, 10)


def test_delete_past_log_not_found_bubbles():
    db = MagicMock()
    db.delete_past_log.side_effect = NotFound('PastLog 99 not found')
    app = _make_app(db)
    with pytest.raises(NotFound):
        app.delete_past_log(99, 10)
