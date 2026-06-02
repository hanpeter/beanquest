class NotFound(LookupError):
    """Raised when a requested entity does not exist."""


class Conflict(RuntimeError):
    """Raised when a write conflicts with existing state (e.g. FK violation)."""
