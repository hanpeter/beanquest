import pytest
from pydantic import ValidationError

from beanquest.models import BrewingMethod, PastLog, RoastingMethod
from beanquest.models.validator import OptionalText, _coerce_null_text


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
    m = BrewingMethod(method_name='Manual Espresso')
    assert m.method_name == 'Manual Espresso'
    assert m.machine_used == ''
    assert m.grinder_used == ''
    assert m.id is None
    assert m.created_at is None
    assert m.modified_at is None


def test_brewing_method_all_fields():
    m = BrewingMethod(
        id=1,
        method_name='Manual Espresso (IMS)',
        machine_used='Breville Barista Express',
        grinder_used='Timemore C2',
    )
    assert m.id == 1
    assert m.machine_used == 'Breville Barista Express'


def test_brewing_method_optional_text_coerces_none():
    m = BrewingMethod(method_name='x', machine_used=None, grinder_used=None)
    assert m.machine_used == ''
    assert m.grinder_used == ''


def test_brewing_method_extra_field_rejected():
    with pytest.raises(ValidationError):
        BrewingMethod(method_name='x', unknown_field='y')


def test_brewing_method_server_fields():
    assert 'created_at' in BrewingMethod.SERVER_FIELDS
    assert 'modified_at' in BrewingMethod.SERVER_FIELDS


def test_brewing_method_sql_references_table():
    assert 'brewing_methods' in BrewingMethod.SELECT_ALL
    assert 'brewing_methods' in BrewingMethod.INSERT
    assert 'brewing_methods' in BrewingMethod.UPDATE


def test_brewing_method_select_one_extends_all():
    assert BrewingMethod.SELECT_ALL in BrewingMethod.SELECT_ONE
    assert 'WHERE id = %s' in BrewingMethod.SELECT_ONE


# ---------------------------------------------------------------------------
# RoastingMethod
# ---------------------------------------------------------------------------

def test_roasting_method_valid():
    m = RoastingMethod(roaster_name='Modified Popcorn Popper')
    assert m.roaster_name == 'Modified Popcorn Popper'
    assert m.description == ''
    assert m.id is None


def test_roasting_method_all_fields():
    m = RoastingMethod(id=2, roaster_name='Popper', description='Modified for heat control')
    assert m.id == 2
    assert m.description == 'Modified for heat control'


def test_roasting_method_optional_text_coerces_none():
    m = RoastingMethod(roaster_name='x', description=None)
    assert m.description == ''


def test_roasting_method_extra_field_rejected():
    with pytest.raises(ValidationError):
        RoastingMethod(roaster_name='x', bad='y')


def test_roasting_method_server_fields():
    assert 'created_at' in RoastingMethod.SERVER_FIELDS
    assert 'modified_at' in RoastingMethod.SERVER_FIELDS


def test_roasting_method_sql_references_table():
    assert 'roasting_methods' in RoastingMethod.SELECT_ALL
    assert 'roasting_methods' in RoastingMethod.INSERT
    assert 'roasting_methods' in RoastingMethod.UPDATE


# ---------------------------------------------------------------------------
# PastLog
# ---------------------------------------------------------------------------

def _valid_past_log_kwargs(**overrides):
    base = dict(
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
    assert 'date_logged' in PastLog.SERVER_FIELDS


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
    assert 'INNER JOIN brewing_methods' in PastLog.SELECT_ALL
    assert 'INNER JOIN roasting_methods' in PastLog.SELECT_ALL


def test_past_log_select_one_has_where():
    assert 'WHERE past_logs.id = %s' in PastLog.SELECT_ONE


def test_past_log_insert_references_table():
    assert 'past_logs' in PastLog.INSERT
    assert 'rating_score' in PastLog.INSERT


def test_past_log_model_dump_excludes_joined_fields():
    m = PastLog(**_valid_past_log_kwargs())
    dumped = m.model_dump(exclude=PastLog._JOINED_FIELDS)
    assert 'brewing_method_name' not in dumped
    assert 'roasting_method_name' not in dumped
    assert 'rating_score' in dumped
