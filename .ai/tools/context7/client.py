"""
Base client for Context7 API interactions.

This module provides the core HTTP client with authentication, retry logic,
and error handling for all Context7 API endpoints.
"""

import logging
import time
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import (
    Context7APIError,
    Context7AuthenticationError,
    Context7NotFoundError,
    Context7RateLimitError,
    Context7ServerError,
    Context7TimeoutError,
    Context7ValidationError,
)
from .models import ErrorResponse
from .utils import get_api_key, redact_api_key

# Configure logging
logger = logging.getLogger(__name__)


class Context7Client:
    """
    Base client for Context7 API.

    Handles authentication, request execution, retry logic, and error handling.
    """

    BASE_URL = "https://context7.com/api/v1"
    DEFAULT_TIMEOUT = 30  # seconds

    def __init__(self, api_key: str | None = None, timeout: int | None = None):
        """
        Initialize Context7 client.

        Args:
            api_key: Context7 API key (reads from CONTEXT7_API_KEY env if not provided)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_key = api_key or get_api_key()
        self.timeout = timeout or self.DEFAULT_TIMEOUT

        # Validate API key format
        if not self.api_key or len(self.api_key.strip()) < 10:
            raise ValueError("Invalid API key format")

        # Create session with retry configuration
        self.session = self._create_session()

        logger.debug(
            f"Initialized Context7Client with API key: {redact_api_key(self.api_key)}"
        )

    def _create_session(self) -> requests.Session:
        """
        Create requests session with retry configuration.

        Returns:
            Configured requests Session
        """
        session = requests.Session()

        # Configure retry strategy
        # Retry on connection errors, timeouts, and 5xx server errors
        retry_strategy = Retry(
            total=3,  # Maximum number of retries
            backoff_factor=1,  # Wait 1s, 2s, 4s between retries
            status_forcelist=[500, 502, 503, 504],  # Retry on these HTTP codes
            allowed_methods=["GET", "POST"],  # Retry on these HTTP methods
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Execute HTTP request to Context7 API.

        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint path (without base URL)
            params: URL query parameters
            json_data: JSON request body

        Returns:
            Parsed JSON response

        Raises:
            Context7AuthenticationError: For 401 errors
            Context7ValidationError: For 400 errors
            Context7NotFoundError: For 404 errors
            Context7RateLimitError: For 429 errors
            Context7ServerError: For 5xx errors
            Context7TimeoutError: For timeout errors
            Context7APIError: For other errors
        """
        url = f"{self.BASE_URL}{endpoint}"

        # Prepare headers
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Log request (with redacted API key)
        logger.debug(
            f"{method} {url} params={params} "
            f"headers={{...Authorization: Bearer {redact_api_key(self.api_key)}...}}"
        )

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                headers=headers,
                timeout=self.timeout,
            )

            # Log response
            logger.debug(
                f"Response: {response.status_code} {len(response.content)} bytes"
            )

            # Handle different HTTP status codes
            if response.status_code == 200:
                return response.json()

            # Error responses
            error_data = self._parse_error_response(response)

            if response.status_code == 401:
                raise Context7AuthenticationError(error_data.error)

            if response.status_code == 400:
                raise Context7ValidationError(error_data.error)

            if response.status_code == 404:
                raise Context7NotFoundError(error_data.error)

            if response.status_code == 429:
                raise Context7RateLimitError(
                    error_data.error,
                    retry_after_seconds=error_data.retry_after_seconds,
                )

            if response.status_code >= 500:
                raise Context7ServerError(
                    error_data.error, status_code=response.status_code
                )

            # Other errors
            raise Context7APIError(
                f"Unexpected status code {response.status_code}: {error_data.error}",
                status_code=response.status_code,
            )

        except requests.exceptions.Timeout as e:
            logger.error(f"Request timeout: {e}")
            raise Context7TimeoutError(f"Request timed out after {self.timeout}s")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise Context7APIError(f"Request failed: {str(e)}")

    def _parse_error_response(self, response: requests.Response) -> ErrorResponse:
        """
        Parse error response from API.

        Args:
            response: HTTP response object

        Returns:
            ErrorResponse model
        """
        try:
            error_json = response.json()
            return ErrorResponse(
                error=error_json.get("error", response.text or "Unknown error"),
                retry_after_seconds=error_json.get("retryAfterSeconds"),
                status_code=response.status_code,
            )
        except Exception:
            # Fallback if JSON parsing fails
            return ErrorResponse(
                error=response.text or "Unknown error",
                status_code=response.status_code,
            )

    def get(
        self, endpoint: str, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Execute GET request.

        Args:
            endpoint: API endpoint path
            params: URL query parameters

        Returns:
            Parsed JSON response
        """
        return self._make_request("GET", endpoint, params=params)

    def post(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Execute POST request.

        Args:
            endpoint: API endpoint path
            params: URL query parameters
            json_data: JSON request body

        Returns:
            Parsed JSON response
        """
        return self._make_request("POST", endpoint, params=params, json_data=json_data)

    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()

    def __enter__(self) -> "Context7Client":
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        self.close()
