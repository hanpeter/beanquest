from beanquest.errors import NotFound


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
