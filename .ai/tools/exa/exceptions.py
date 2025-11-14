"""
Custom exceptions for Exa Search API operations.

This module defines exception classes for handling different types of errors
that can occur when interacting with the Exa Search API.
"""


class ExaAPIError(Exception):
    """Base exception for all Exa API errors."""

    def __init__(self, message: str, status_code: int = 500, request_id: str | None = None):
        """
        Initialize ExaAPIError.

        Args:
            message: Error message
            status_code: HTTP status code
            request_id: Optional request ID for debugging
        """
        self.message = message
        self.status_code = status_code
        self.request_id = request_id
        super().__init__(self.message)

    def __str__(self) -> str:
        """Return string representation of the error."""
        base_msg = f"[{self.status_code}] {self.message}"
        if self.request_id:
            return f"{base_msg} (Request ID: {self.request_id})"
        return base_msg


class ExaAuthenticationError(ExaAPIError):
    """Raised when authentication fails (401)."""

    def __init__(self, message: str = "Authentication failed. Check your EXA_API_KEY.", request_id: str | None = None):
        """
        Initialize ExaAuthenticationError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=401, request_id=request_id)


class ExaRateLimitError(ExaAPIError):
    """Raised when rate limit is exceeded (429)."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please retry after some time.",
        retry_after: int | None = None,
        request_id: str | None = None,
    ):
        """
        Initialize ExaRateLimitError.

        Args:
            message: Error message
            retry_after: Seconds to wait before retrying
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=429, request_id=request_id)
        self.retry_after = retry_after

    def __str__(self) -> str:
        """Return string representation of the error."""
        base_msg = super().__str__()
        if self.retry_after:
            return f"{base_msg} (Retry after {self.retry_after}s)"
        return base_msg


class ExaNotFoundError(ExaAPIError):
    """Raised when a resource is not found (404)."""

    def __init__(self, message: str = "Resource not found.", request_id: str | None = None):
        """
        Initialize ExaNotFoundError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=404, request_id=request_id)


class ExaTimeoutError(ExaAPIError):
    """Raised when a request times out (408, 504)."""

    def __init__(self, message: str = "Request timed out.", request_id: str | None = None):
        """
        Initialize ExaTimeoutError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=408, request_id=request_id)


class ExaValidationError(ExaAPIError):
    """Raised when request validation fails (400, 422)."""

    def __init__(self, message: str = "Request validation failed.", request_id: str | None = None):
        """
        Initialize ExaValidationError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=400, request_id=request_id)
