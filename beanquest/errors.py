class NotFound(LookupError):
    """Raised when a requested entity does not exist."""


class Conflict(RuntimeError):
    """Raised when a write conflicts with existing state (e.g. FK violation)."""


class Unauthorized(RuntimeError):
    """Raised when authentication is missing, invalid, or expired."""


class InvalidCredentials(Unauthorized):
    """Raised when an email/password login fails. Carries how many attempts
    remain before the account locks, so the client can warn before it happens.
    """

    def __init__(self, message: str, attempts_left: int):
        super().__init__(message)
        self.attempts_left = attempts_left


class RateLimited(RuntimeError):
    """Raised when an action is temporarily blocked due to rate limiting."""

    def __init__(self, message: str, retry_after_seconds: int):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds
