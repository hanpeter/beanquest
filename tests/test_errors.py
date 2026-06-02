from beanquest.errors import Conflict, NotFound


def test_not_found_is_lookup_error():
    assert issubclass(NotFound, LookupError)


def test_not_found_accepts_message():
    exc = NotFound('BrewingMethod 99 not found')
    assert 'BrewingMethod 99' in str(exc)


def test_not_found_can_be_raised_and_caught():
    try:
        raise NotFound('test')
    except LookupError as e:
        assert isinstance(e, NotFound)


def test_conflict_is_runtime_error():
    assert issubclass(Conflict, RuntimeError)


def test_conflict_accepts_message():
    exc = Conflict('BrewingMethod 1 is referenced by existing past_logs')
    assert 'BrewingMethod 1' in str(exc)


def test_conflict_can_be_raised_and_caught():
    try:
        raise Conflict('test')
    except RuntimeError as e:
        assert isinstance(e, Conflict)
