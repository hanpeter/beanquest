class NotFound(LookupError):
    """Raised when a requested entity does not exist."""


class Conflict(RuntimeError):
    """Raised when a write conflicts with existing state (e.g. FK violation)."""


class Unauthorized(RuntimeError):
    """Raised when authentication is missing, invalid, or expired."""


class RateLimited(RuntimeError):
    """Raised when an action is temporarily blocked due to rate limiting."""

    def __init__(self, message: str, retry_after_seconds: int):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds
