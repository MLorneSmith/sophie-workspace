"""
Custom exception classes for Context7 API errors.

This module defines a hierarchy of exceptions for different error scenarios
when interacting with the Context7 API.
"""


class Context7APIError(Exception):
    """Base exception for all Context7 API errors."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class Context7AuthenticationError(Context7APIError):
    """Raised when API authentication fails (401)."""

    def __init__(self, message: str = "Invalid or missing API key"):
        super().__init__(message, status_code=401)


class Context7NotFoundError(Context7APIError):
    """Raised when a requested resource is not found (404)."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class Context7RateLimitError(Context7APIError):
    """Raised when API rate limit is exceeded (429)."""

    def __init__(self, message: str, retry_after_seconds: int | None = None):
        super().__init__(message, status_code=429)
        self.retry_after_seconds = retry_after_seconds


class Context7ValidationError(Context7APIError):
    """Raised when request validation fails (400)."""

    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class Context7TimeoutError(Context7APIError):
    """Raised when a request times out."""

    def __init__(self, message: str = "Request timed out"):
        super().__init__(message)


class Context7ServerError(Context7APIError):
    """Raised when server returns 5xx error."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, status_code=status_code)
