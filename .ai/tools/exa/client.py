"""
Base client for Exa Search API.

This module provides the ExaClient class that handles authentication,
request execution, retry logic, and error handling for all Exa API endpoints.
"""

import logging
import time
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import (
    ExaAPIError,
    ExaAuthenticationError,
    ExaNotFoundError,
    ExaRateLimitError,
    ExaTimeoutError,
    ExaValidationError,
)
from .utils import get_api_key, redact_api_key, validate_api_key_format

# Configure logging
logger = logging.getLogger(__name__)


class ExaClient:
    """
    Base client for interacting with the Exa Search API.

    Handles authentication, request execution, retry logic, and error handling.
    """

    BASE_URL = "https://api.exa.ai"
    DEFAULT_TIMEOUT = 30
    MAX_RETRIES = 3

    def __init__(self, api_key: str | None = None, timeout: int = DEFAULT_TIMEOUT):
        """
        Initialize the Exa API client.

        Args:
            api_key: Exa API key. If None, reads from EXA_API_KEY environment variable.
            timeout: Request timeout in seconds (default: 30)

        Raises:
            ValueError: If API key is invalid or not provided
        """
        self.api_key = api_key or get_api_key()
        validate_api_key_format(self.api_key)
        self.timeout = timeout

        # Create session with retry logic
        self.session = self._create_session()

        logger.info(
            "Initialized Exa client with API key: %s", redact_api_key(self.api_key)
        )

    def _create_session(self) -> requests.Session:
        """
        Create a requests session with retry logic and connection pooling.

        Returns:
            Configured requests.Session instance
        """
        session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=self.MAX_RETRIES,
            backoff_factor=1,  # 1s, 2s, 4s delays
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
        )

        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=10)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _get_headers(self) -> dict[str, str]:
        """
        Get request headers with authentication.

        Returns:
            Dictionary of headers
        """
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Make an HTTP request to the Exa API.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path (e.g., "/search")
            data: Request body data
            params: URL query parameters

        Returns:
            Parsed JSON response

        Raises:
            ExaAuthenticationError: If authentication fails
            ExaRateLimitError: If rate limit is exceeded
            ExaNotFoundError: If resource is not found
            ExaTimeoutError: If request times out
            ExaValidationError: If request validation fails
            ExaAPIError: For other API errors
        """
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()

        logger.debug(
            "Making %s request to %s (timeout: %ds)", method, endpoint, self.timeout
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
            )
            elapsed_time = time.time() - start_time

            logger.debug(
                "Request completed in %.2fs with status %d", elapsed_time, response.status_code
            )

            # Handle successful responses
            if response.status_code == 200:
                return response.json()

            # Handle error responses
            self._handle_error_response(response)

        except requests.exceptions.Timeout as e:
            logger.error("Request timed out after %ds", self.timeout)
            raise ExaTimeoutError(
                f"Request timed out after {self.timeout} seconds"
            ) from e

        except requests.exceptions.ConnectionError as e:
            logger.error("Connection error: %s", str(e))
            raise ExaAPIError(f"Connection error: {str(e)}") from e

        except requests.exceptions.RequestException as e:
            logger.error("Request exception: %s", str(e))
            raise ExaAPIError(f"Request failed: {str(e)}") from e

    def _handle_error_response(self, response: requests.Response) -> None:
        """
        Handle error responses from the API.

        Args:
            response: requests.Response object with error status

        Raises:
            ExaAuthenticationError: For 401 errors
            ExaNotFoundError: For 404 errors
            ExaRateLimitError: For 429 errors
            ExaValidationError: For 400/422 errors
            ExaTimeoutError: For 408/504 errors
            ExaAPIError: For other errors
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
            raise ExaAuthenticationError(error_message, request_id=request_id)

        if status_code == 404:
            raise ExaNotFoundError(error_message, request_id=request_id)

        if status_code == 429:
            retry_after = response.headers.get("Retry-After")
            retry_after_int = int(retry_after) if retry_after else None
            raise ExaRateLimitError(
                error_message, retry_after=retry_after_int, request_id=request_id
            )

        if status_code in (400, 422):
            raise ExaValidationError(error_message, request_id=request_id)

        if status_code in (408, 504):
            raise ExaTimeoutError(error_message, request_id=request_id)

        # Generic API error for other status codes
        raise ExaAPIError(error_message, status_code=status_code, request_id=request_id)

    def search(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute a search request.

        Args:
            data: Search request data

        Returns:
            Search response data
        """
        return self._make_request("POST", "/search", data=data)

    def get_contents(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Get contents for URLs.

        Args:
            data: Get contents request data

        Returns:
            Contents response data
        """
        return self._make_request("POST", "/contents", data=data)

    def find_similar(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Find similar links.

        Args:
            data: Find similar request data

        Returns:
            Similar links response data
        """
        return self._make_request("POST", "/findSimilar", data=data)

    def get_answer(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Get an AI-powered answer.

        Args:
            data: Answer request data

        Returns:
            Answer response data
        """
        return self._make_request("POST", "/answer", data=data)

    def close(self) -> None:
        """Close the HTTP session."""
        if self.session:
            self.session.close()
            logger.debug("Closed HTTP session")

    def __enter__(self) -> "ExaClient":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        self.close()
