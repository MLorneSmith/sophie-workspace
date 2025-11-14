"""
Custom exceptions for Perplexity API operations.

This module defines exception classes for handling different types of errors
that can occur when interacting with the Perplexity API (Search and Chat Completions).
"""


class PerplexityAPIError(Exception):
    """Base exception for all Perplexity API errors."""

    def __init__(self, message: str, status_code: int = 500, request_id: str | None = None):
        """
        Initialize PerplexityAPIError.

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


class PerplexityAuthenticationError(PerplexityAPIError):
    """Raised when authentication fails (401)."""

    def __init__(
        self,
        message: str = "Authentication failed. Check your PERPLEXITY_API_KEY.",
        request_id: str | None = None,
    ):
        """
        Initialize PerplexityAuthenticationError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=401, request_id=request_id)


class PerplexityRateLimitError(PerplexityAPIError):
    """Raised when rate limit is exceeded (429)."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please retry after some time.",
        retry_after: int | None = None,
        request_id: str | None = None,
    ):
        """
        Initialize PerplexityRateLimitError.

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


class PerplexityValidationError(PerplexityAPIError):
    """Raised when request validation fails (400, 422)."""

    def __init__(
        self,
        message: str = "Request validation failed.",
        request_id: str | None = None,
    ):
        """
        Initialize PerplexityValidationError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=400, request_id=request_id)


class PerplexityTimeoutError(PerplexityAPIError):
    """Raised when a request times out (408, 504)."""

    def __init__(
        self,
        message: str = "Request timed out.",
        request_id: str | None = None,
    ):
        """
        Initialize PerplexityTimeoutError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=408, request_id=request_id)


class PerplexityConnectionError(PerplexityAPIError):
    """Raised when a network connection error occurs."""

    def __init__(
        self,
        message: str = "Failed to connect to Perplexity API.",
        request_id: str | None = None,
    ):
        """
        Initialize PerplexityConnectionError.

        Args:
            message: Error message
            request_id: Optional request ID for debugging
        """
        super().__init__(message, status_code=503, request_id=request_id)
