"""
Base client for Perplexity API.

This module provides the PerplexityClient class that handles authentication,
request execution, retry logic, and error handling for all Perplexity API endpoints.
"""

import logging
import time
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import (
    PerplexityAPIError,
    PerplexityAuthenticationError,
    PerplexityConnectionError,
    PerplexityRateLimitError,
    PerplexityTimeoutError,
    PerplexityValidationError,
)
from .utils import get_api_key, redact_api_key, validate_api_key_format

# Configure logging
logger = logging.getLogger(__name__)


class PerplexityClient:
    """
    Base client for interacting with the Perplexity API.

    Handles authentication, request execution, retry logic, and error handling
    for both Search and Chat Completions endpoints.
    """

    BASE_URL = "https://api.perplexity.ai"
    DEFAULT_TIMEOUT = 60  # Perplexity may take longer for LLM responses
    MAX_RETRIES = 3

    def __init__(self, api_key: str | None = None, timeout: int = DEFAULT_TIMEOUT):
        """
        Initialize the Perplexity API client.

        Args:
            api_key: Perplexity API key. If None, reads from PERPLEXITY_API_KEY environment variable.
            timeout: Request timeout in seconds (default: 60)

        Raises:
            ValueError: If API key is invalid or not provided
        """
        self.api_key = api_key or get_api_key()
        validate_api_key_format(self.api_key)
        self.timeout = timeout

        # Track rate limit info from headers
        self.rate_limit_remaining: int | None = None
        self.rate_limit_reset: int | None = None

        # Create session with retry logic
        self.session = self._create_session()

        logger.info(
            "Initialized Perplexity client with API key: %s", redact_api_key(self.api_key)
        )

    def _create_session(self) -> requests.Session:
        """
        Create a requests session with retry logic and connection pooling.

        Returns:
            Configured requests.Session instance
        """
        session = requests.Session()

        # Configure retry strategy with exponential backoff
        retry_strategy = Retry(
            total=self.MAX_RETRIES,
            backoff_factor=1,  # 1s, 2s, 4s delays
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
        )

        # Connection pooling (50-100 keepalive connections as per spec)
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=50,
            pool_maxsize=100,
        )
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _get_headers(self) -> dict[str, str]:
        """
        Get request headers with authentication.

        Returns:
            Dictionary of headers with Bearer token
        """
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _update_rate_limit_info(self, response: requests.Response) -> None:
        """
        Update rate limit information from response headers.

        Args:
            response: Response object to extract headers from
        """
        remaining = response.headers.get("X-RateLimit-Remaining")
        reset = response.headers.get("X-RateLimit-Reset")

        if remaining:
            self.rate_limit_remaining = int(remaining)

        if reset:
            self.rate_limit_reset = int(reset)

        if remaining or reset:
            logger.debug(
                "Rate limit info: %s remaining, reset at %s",
                self.rate_limit_remaining,
                self.rate_limit_reset,
            )

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        stream: bool = False,
    ) -> dict[str, Any] | requests.Response:
        """
        Make an HTTP request to the Perplexity API.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path (e.g., "/search")
            data: Request body data
            params: URL query parameters
            stream: If True, return streaming Response object instead of JSON

        Returns:
            Parsed JSON response or streaming Response object

        Raises:
            PerplexityAuthenticationError: If authentication fails
            PerplexityRateLimitError: If rate limit is exceeded
            PerplexityTimeoutError: If request times out
            PerplexityValidationError: If request validation fails
            PerplexityConnectionError: If network connection fails
            PerplexityAPIError: For other API errors
        """
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()

        logger.debug(
            "Making %s request to %s (timeout: %ds, stream: %s)",
            method,
            endpoint,
            self.timeout,
            stream,
        )

        try:
            start_time = time.time()
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=headers,
                timeout=self.timeout,
                stream=stream,
            )
            elapsed_time = time.time() - start_time

            logger.debug(
                "Request completed in %.2fs with status %d",
                elapsed_time,
                response.status_code,
            )

            # Update rate limit info
            self._update_rate_limit_info(response)

            # Handle successful responses
            if response.status_code == 200:
                if stream:
                    return response  # Return response object for streaming
                return response.json()

            # Handle error responses
            self._handle_error_response(response)

        except requests.exceptions.Timeout as e:
            logger.error("Request timed out after %ds", self.timeout)
            raise PerplexityTimeoutError(
                f"Request timed out after {self.timeout} seconds"
            ) from e

        except requests.exceptions.ConnectionError as e:
            logger.error("Connection error: %s", str(e))
            raise PerplexityConnectionError(
                f"Failed to connect to Perplexity API: {str(e)}"
            ) from e

        except requests.exceptions.RequestException as e:
            logger.error("Request exception: %s", str(e))
            raise PerplexityAPIError(f"Request failed: {str(e)}") from e

    def _handle_error_response(self, response: requests.Response) -> None:
        """
        Handle error responses from the API.

        Args:
            response: requests.Response object with error status

        Raises:
            PerplexityAuthenticationError: For 401 errors
            PerplexityRateLimitError: For 429 errors
            PerplexityValidationError: For 400/422 errors
            PerplexityTimeoutError: For 408/504 errors
            PerplexityAPIError: For other errors
        """
        status_code = response.status_code
        request_id = response.headers.get("x-request-id")

        # Try to parse error message from response
        try:
            error_data = response.json()
            error_message = error_data.get("error", error_data.get("message", response.text))
        except ValueError:
            error_message = response.text or f"HTTP {status_code} error"

        logger.error(
            "API error: %s (status: %d, request_id: %s)",
            error_message,
            status_code,
            request_id,
        )

        # Map status codes to specific exceptions
        if status_code == 401:
            raise PerplexityAuthenticationError(error_message, request_id=request_id)

        if status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_after_int = int(retry_after) if retry_after else None
            raise PerplexityRateLimitError(
                error_message, retry_after=retry_after_int, request_id=request_id
            )

        if status_code in (400, 422):
            raise PerplexityValidationError(error_message, request_id=request_id)

        if status_code in (408, 504):
            raise PerplexityTimeoutError(error_message, request_id=request_id)

        # Generic API error for other status codes
        raise PerplexityAPIError(error_message, status_code=status_code, request_id=request_id)

    def search(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute a search request.

        Args:
            data: Search request data

        Returns:
            Search response data
        """
        return self._make_request("POST", "/search", data=data)

    def chat(self, data: dict[str, Any], stream: bool = False) -> dict[str, Any] | requests.Response:
        """
        Execute a chat completion request.

        Args:
            data: Chat request data
            stream: If True, return streaming response

        Returns:
            Chat response data or streaming Response object
        """
        return self._make_request("POST", "/chat/completions", data=data, stream=stream)

    def close(self) -> None:
        """Close the HTTP session."""
        if self.session:
            self.session.close()
            logger.debug("Closed HTTP session")

    def __enter__(self) -> "PerplexityClient":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()
