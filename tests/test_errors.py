from beanquest.errors import Conflict, NotFound, RateLimited, Unauthorized


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


def test_unauthorized_is_runtime_error():
    assert issubclass(Unauthorized, RuntimeError)


def test_unauthorized_accepts_message():
    exc = Unauthorized('invalid email or password')
    assert 'invalid email or password' in str(exc)


def test_unauthorized_can_be_raised_and_caught():
    try:
        raise Unauthorized('test')
    except RuntimeError as e:
        assert isinstance(e, Unauthorized)


def test_rate_limited_is_runtime_error():
    assert issubclass(RateLimited, RuntimeError)


def test_rate_limited_accepts_message_and_retry_after_seconds():
    exc = RateLimited('too many failed login attempts', 42)
    assert 'too many failed login attempts' in str(exc)
    assert exc.retry_after_seconds == 42


def test_rate_limited_can_be_raised_and_caught():
    try:
        raise RateLimited('test', 1)
    except RuntimeError as e:
        assert isinstance(e, RateLimited)
