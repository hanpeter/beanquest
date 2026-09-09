from datetime import timedelta

import pytest
from pydantic import ValidationError

from beanquest.models import AuthIdentity, BrewingMethod, LoginAttempt, PastLog, RoastingMethod, User
from beanquest.models.validator import _coerce_null_text


# ---------------------------------------------------------------------------
# OptionalText validator
# ---------------------------------------------------------------------------

def test_coerce_null_text_none():
    assert _coerce_null_text(None) == ''


def test_coerce_null_text_str():
    assert _coerce_null_text('hello') == 'hello'


def test_coerce_null_text_int_raises():
    with pytest.raises(ValueError):
        _coerce_null_text(42)


def test_coerce_null_text_dict_raises():
    with pytest.raises(ValueError):
        _coerce_null_text({'key': 'value'})


def test_coerce_null_text_list_raises():
    with pytest.raises(ValueError):
        _coerce_null_text([1, 2, 3])


# ---------------------------------------------------------------------------
# BrewingMethod
# ---------------------------------------------------------------------------

def test_brewing_method_valid():
    m = BrewingMethod(user_id=1, method_name='Manual Espresso')
    assert m.method_name == 'Manual Espresso'
    assert m.machine_used == ''
    assert m.grinder_used == ''
    assert m.id is None
    assert m.created_at is None
    assert m.modified_at is None


def test_brewing_method_all_fields():
    m = BrewingMethod(
        id=1,
        user_id=2,
        method_name='Manual Espresso (IMS)',
        machine_used='Breville Barista Express',
        grinder_used='Timemore C2',
    )
    assert m.id == 1
    assert m.user_id == 2
    assert m.machine_used == 'Breville Barista Express'


def test_brewing_method_missing_user_id_rejected():
    with pytest.raises(ValidationError):
        BrewingMethod(method_name='x')


def test_brewing_method_optional_text_coerces_none():
    m = BrewingMethod(user_id=1, method_name='x', machine_used=None, grinder_used=None)
    assert m.machine_used == ''
    assert m.grinder_used == ''


def test_brewing_method_extra_field_rejected():
    with pytest.raises(ValidationError):
        BrewingMethod(user_id=1, method_name='x', unknown_field='y')


def test_brewing_method_server_fields():
    assert 'created_at' in BrewingMethod.SERVER_FIELDS
    assert 'modified_at' in BrewingMethod.SERVER_FIELDS


def test_brewing_method_sql_references_table():
    assert 'brewing_methods' in BrewingMethod.BASE_SELECT
    assert 'brewing_methods' in BrewingMethod.INSERT
    assert 'brewing_methods' in BrewingMethod.UPDATE


def test_brewing_method_select_all_scoped_by_user():
    assert BrewingMethod.BASE_SELECT in BrewingMethod.SELECT_ALL
    assert 'WHERE user_id = %s' in BrewingMethod.SELECT_ALL


def test_brewing_method_select_one_scoped_by_user():
    assert BrewingMethod.BASE_SELECT in BrewingMethod.SELECT_ONE
    assert 'WHERE id = %s AND user_id = %s' in BrewingMethod.SELECT_ONE


def test_brewing_method_update_scoped_by_user():
    assert 'WHERE id = %(id)s AND user_id = %(user_id)s' in BrewingMethod.UPDATE


def test_brewing_method_delete_sql():
    assert 'brewing_methods' in BrewingMethod.DELETE
    assert 'WHERE id = %s AND user_id = %s' in BrewingMethod.DELETE


# ---------------------------------------------------------------------------
# RoastingMethod
# ---------------------------------------------------------------------------

def test_roasting_method_valid():
    m = RoastingMethod(user_id=1, roaster_name='Modified Popcorn Popper')
    assert m.roaster_name == 'Modified Popcorn Popper'
    assert m.description == ''
    assert m.id is None


def test_roasting_method_all_fields():
    m = RoastingMethod(id=2, user_id=3, roaster_name='Popper', description='Modified for heat control')
    assert m.id == 2
    assert m.user_id == 3
    assert m.description == 'Modified for heat control'


def test_roasting_method_missing_user_id_rejected():
    with pytest.raises(ValidationError):
        RoastingMethod(roaster_name='x')


def test_roasting_method_optional_text_coerces_none():
    m = RoastingMethod(user_id=1, roaster_name='x', description=None)
    assert m.description == ''


def test_roasting_method_extra_field_rejected():
    with pytest.raises(ValidationError):
        RoastingMethod(user_id=1, roaster_name='x', bad='y')


def test_roasting_method_server_fields():
    assert 'created_at' in RoastingMethod.SERVER_FIELDS
    assert 'modified_at' in RoastingMethod.SERVER_FIELDS


def test_roasting_method_sql_references_table():
    assert 'roasting_methods' in RoastingMethod.BASE_SELECT
    assert 'roasting_methods' in RoastingMethod.INSERT
    assert 'roasting_methods' in RoastingMethod.UPDATE


def test_roasting_method_select_all_scoped_by_user():
    assert RoastingMethod.BASE_SELECT in RoastingMethod.SELECT_ALL
    assert 'WHERE user_id = %s' in RoastingMethod.SELECT_ALL


def test_roasting_method_select_one_scoped_by_user():
    assert RoastingMethod.BASE_SELECT in RoastingMethod.SELECT_ONE
    assert 'WHERE id = %s AND user_id = %s' in RoastingMethod.SELECT_ONE


def test_roasting_method_delete_sql():
    assert 'roasting_methods' in RoastingMethod.DELETE
    assert 'WHERE id = %s AND user_id = %s' in RoastingMethod.DELETE


# ---------------------------------------------------------------------------
# PastLog
# ---------------------------------------------------------------------------

def _valid_past_log_kwargs(**overrides):
    base = dict(
        user_id=1,
        bean_name='Guatemala Huehuetenango',
        process='Washed',
        roasting_method_id=1,
        brewing_method_id=1,
        grinder_setting='Step 11',
        rating_score=4,
    )
    base.update(overrides)
    return base


def test_past_log_valid():
    m = PastLog(**_valid_past_log_kwargs())
    assert m.bean_name == 'Guatemala Huehuetenango'
    assert m.rating_score == 4
    assert m.brewing_method_name == ''
    assert m.roasting_method_name == ''
    assert m.date_logged is None


def test_past_log_missing_user_id_rejected():
    kwargs = _valid_past_log_kwargs()
    del kwargs['user_id']
    with pytest.raises(ValidationError):
        PastLog(**kwargs)


@pytest.mark.parametrize('score', [0, 1, 2, 3, 4, 5])
def test_past_log_rating_score_valid(score):
    m = PastLog(**_valid_past_log_kwargs(rating_score=score))
    assert m.rating_score == score


def test_past_log_rating_score_below_range_rejected():
    with pytest.raises(ValidationError):
        PastLog(**_valid_past_log_kwargs(rating_score=-1))


def test_past_log_rating_score_above_range_rejected():
    with pytest.raises(ValidationError):
        PastLog(**_valid_past_log_kwargs(rating_score=6))


def test_past_log_extra_field_rejected():
    with pytest.raises(ValidationError):
        PastLog(**_valid_past_log_kwargs(unknown='x'))


def test_past_log_server_fields():
    assert 'brewing_method_name' in PastLog.SERVER_FIELDS
    assert 'roasting_method_name' in PastLog.SERVER_FIELDS
    assert 'date_logged' not in PastLog.SERVER_FIELDS


def test_past_log_joined_fields_subset_of_server_fields():
    assert PastLog._JOINED_FIELDS <= PastLog.SERVER_FIELDS


def test_past_log_optional_text_coerces_none():
    m = PastLog(**_valid_past_log_kwargs(
        target_roast_level=None,
        roasting_notes=None,
        general_notes=None,
    ))
    assert m.target_roast_level == ''
    assert m.roasting_notes == ''
    assert m.general_notes == ''


def test_past_log_sql_has_inner_joins():
    assert 'INNER JOIN brewing_methods' in PastLog.BASE_SELECT
    assert 'INNER JOIN roasting_methods' in PastLog.BASE_SELECT


def test_past_log_select_all_scoped_by_user():
    assert PastLog.BASE_SELECT in PastLog.SELECT_ALL
    assert 'WHERE past_logs.user_id = %s' in PastLog.SELECT_ALL


def test_past_log_select_one_scoped_by_user():
    assert PastLog.BASE_SELECT in PastLog.SELECT_ONE
    assert 'WHERE past_logs.id = %s AND past_logs.user_id = %s' in PastLog.SELECT_ONE


def test_past_log_insert_references_table():
    assert 'past_logs' in PastLog.INSERT
    assert 'rating_score' in PastLog.INSERT
    assert 'user_id' in PastLog.INSERT


def test_past_log_insert_coalesces_date_logged():
    assert 'date_logged' in PastLog.INSERT
    assert 'COALESCE(%(date_logged)s, now())' in PastLog.INSERT


def test_past_log_update_coalesces_date_logged():
    assert 'COALESCE(%(date_logged)s, date_logged)' in PastLog.UPDATE


def test_past_log_update_scoped_by_user():
    assert 'WHERE id = %(id)s AND user_id = %(user_id)s' in PastLog.UPDATE


def test_past_log_delete_sql():
    assert 'past_logs' in PastLog.DELETE
    assert 'WHERE id = %s AND user_id = %s' in PastLog.DELETE


def test_past_log_model_dump_excludes_joined_fields():
    m = PastLog(**_valid_past_log_kwargs())
    dumped = m.model_dump(exclude=PastLog._JOINED_FIELDS)
    assert 'brewing_method_name' not in dumped
    assert 'roasting_method_name' not in dumped
    assert 'rating_score' in dumped


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

def test_user_valid():
    u = User(first_name='Ada', last_name='Lovelace', email='ada@example.com')
    assert u.first_name == 'Ada'
    assert u.email == 'ada@example.com'
    assert u.id is None
    assert u.created_at is None
    assert u.modified_at is None


def test_user_extra_field_rejected():
    with pytest.raises(ValidationError):
        User(first_name='Ada', last_name='Lovelace', email='ada@example.com', password='x')


def test_user_server_fields():
    assert 'created_at' in User.SERVER_FIELDS
    assert 'modified_at' in User.SERVER_FIELDS


def test_user_sql_references_table():
    assert 'users' in User.SELECT_ALL
    assert 'users' in User.INSERT
    assert 'users' in User.DELETE


def test_user_select_one_extends_all():
    assert User.SELECT_ALL in User.SELECT_ONE
    assert 'WHERE id = %s' in User.SELECT_ONE


def test_user_select_by_email_extends_all():
    assert User.SELECT_ALL in User.SELECT_BY_EMAIL
    assert 'WHERE LOWER(email) = LOWER(%s)' in User.SELECT_BY_EMAIL


def test_user_insert_excludes_password_hash():
    assert 'password_hash' not in User.INSERT


def test_user_delete_sql():
    assert 'users' in User.DELETE
    assert 'WHERE id = %s' in User.DELETE


# ---------------------------------------------------------------------------
# AuthIdentity
# ---------------------------------------------------------------------------

def test_auth_identity_password_provider():
    identity = AuthIdentity(user_id=1, provider='password', password_hash='$2b$...')
    assert identity.provider == 'password'
    assert identity.provider_uid is None
    assert identity.password_hash == '$2b$...'


def test_auth_identity_oauth_provider_has_no_password_hash():
    identity = AuthIdentity(user_id=1, provider='google', provider_uid='google-sub-123')
    assert identity.provider_uid == 'google-sub-123'
    assert identity.password_hash is None


def test_auth_identity_extra_field_rejected():
    with pytest.raises(ValidationError):
        AuthIdentity(user_id=1, provider='password', unknown='y')


def test_auth_identity_missing_user_id_rejected():
    with pytest.raises(ValidationError):
        AuthIdentity(provider='password')


def test_auth_identity_sql_references_table():
    assert 'auth_identities' in AuthIdentity.INSERT
    assert 'auth_identities' in AuthIdentity.SELECT_BY_USER_AND_PROVIDER


def test_auth_identity_select_by_user_and_provider_params():
    assert 'WHERE user_id = %s AND provider = %s' in AuthIdentity.SELECT_BY_USER_AND_PROVIDER


# ---------------------------------------------------------------------------
# LoginAttempt
# ---------------------------------------------------------------------------

def test_login_attempt_valid():
    attempt = LoginAttempt(email='a@b.com', failure_count=1)
    assert attempt.email == 'a@b.com'
    assert attempt.failure_count == 1
    assert attempt.locked_until is None


def test_login_attempt_extra_field_rejected():
    with pytest.raises(ValidationError):
        LoginAttempt(email='a@b.com', failure_count=1, unknown='y')


def test_login_attempt_sql_references_table():
    assert 'login_attempts' in LoginAttempt.SELECT_ONE
    assert 'login_attempts' in LoginAttempt.UPSERT_FAILURE
    assert 'login_attempts' in LoginAttempt.DELETE


def test_login_attempt_upsert_binds_threshold_and_lockout_duration():
    """MAX_FAILURES/LOCK_DURATION are bound as query parameters, never
    string-interpolated into the SQL — so neither is an injection surface,
    even if either becomes config/env-driven later."""
    assert '%(max_failures)s' in LoginAttempt.UPSERT_FAILURE
    assert '%(lock_duration)s' in LoginAttempt.UPSERT_FAILURE
    assert '5' not in LoginAttempt.UPSERT_FAILURE
    assert 'INTERVAL' not in LoginAttempt.UPSERT_FAILURE


def test_login_attempt_max_failures_value():
    assert LoginAttempt.MAX_FAILURES == 5


def test_login_attempt_queries_normalize_email_via_parameter():
    """email is matched/stored via LOWER(%s) on the *parameter*, not LOWER(email)
    on the column — this still uses the plain PRIMARY KEY index (unlike wrapping
    the column, which would need a matching functional index) while making every
    query here self-normalizing, independent of whether the caller already
    passed a NormalizedEmail."""
    assert 'WHERE email = LOWER(%s)' in LoginAttempt.SELECT_ONE
    assert 'VALUES (LOWER(%(email)s), 1, NULL, CURRENT_TIMESTAMP)' in LoginAttempt.UPSERT_FAILURE
    assert LoginAttempt.DELETE == 'DELETE FROM login_attempts WHERE email = LOWER(%s)'


def test_login_attempt_upsert_resets_stale_rows_via_updated_at():
    """A row idle for at least one lock_duration since its last failure starts
    fresh on this failure, whether or not it was ever actually locked — this
    is what stops an expired lock from re-arming itself on the very next
    attempt. Checked via updated_at, not a separate locked_until branch."""
    assert (
        'login_attempts.updated_at < CURRENT_TIMESTAMP - %(lock_duration)s'
        in LoginAttempt.UPSERT_FAILURE
    )
    # Both the failure_count and locked_until CASEs key off it.
    assert LoginAttempt.UPSERT_FAILURE.count(
        'login_attempts.updated_at < CURRENT_TIMESTAMP - %(lock_duration)s'
    ) == 2


def test_login_attempt_lock_duration_value():
    assert LoginAttempt.LOCK_DURATION == timedelta(minutes=5)


def test_login_attempt_upsert_guards_against_extending_existing_lock():
    assert 'WHERE login_attempts.locked_until IS NULL OR login_attempts.locked_until < CURRENT_TIMESTAMP' \
        in LoginAttempt.UPSERT_FAILURE
