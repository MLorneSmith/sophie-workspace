"""
Unit tests for Context7 API client.

Tests client initialization, authentication, and error handling with mocked requests.
"""

import pytest
from unittest.mock import Mock, patch
from requests.exceptions import RequestException, Timeout

from .client import Context7Client
from .exceptions import (
    Context7APIError,
    Context7AuthenticationError,
    Context7NotFoundError,
    Context7RateLimitError,
    Context7ServerError,
    Context7TimeoutError,
    Context7ValidationError,
)


class TestClientInitialization:
    """Tests for Context7Client initialization."""

    def test_init_with_api_key(self):
        """Test initializing client with explicit API key."""
        client = Context7Client(api_key="test-key-1234567890")
        assert client.api_key == "test-key-1234567890"
        assert client.timeout == 30  # default

    def test_init_with_custom_timeout(self):
        """Test initializing client with custom timeout."""
        client = Context7Client(api_key="test-key-1234567890", timeout=60)
        assert client.timeout == 60

    def test_init_with_env_api_key(self, monkeypatch):
        """Test initializing client with API key from environment."""
        monkeypatch.setenv("CONTEXT7_API_KEY", "env-key-1234567890")
        client = Context7Client()
        assert client.api_key == "env-key-1234567890"

    def test_init_invalid_api_key(self, monkeypatch):
        """Test initialization fails with invalid API key."""
        # Clear environment variable to prevent fallback
        monkeypatch.delenv("CONTEXT7_API_KEY", raising=False)

        with pytest.raises(ValueError, match="Invalid API key format"):
            Context7Client(api_key="short")

        with pytest.raises(ValueError):
            Context7Client(api_key="")

    def test_context_manager(self):
        """Test using client as context manager."""
        with Context7Client(api_key="test-key-1234567890") as client:
            assert client.api_key == "test-key-1234567890"


class TestClientRequests:
    """Tests for making HTTP requests."""

    @patch("requests.Session.request")
    def test_successful_get_request(self, mock_request):
        """Test successful GET request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b'{"data": "test"}'
        mock_response.json.return_value = {"data": "test"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")
        result = client.get("/test", params={"query": "value"})

        assert result == {"data": "test"}
        mock_request.assert_called_once()

    @patch("requests.Session.request")
    def test_successful_post_request(self, mock_request):
        """Test successful POST request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b'{"result": "created"}'
        mock_response.json.return_value = {"result": "created"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")
        result = client.post("/test", json_data={"field": "value"})

        assert result == {"result": "created"}

    @patch("requests.Session.request")
    def test_authentication_error_401(self, mock_request):
        """Test 401 authentication error."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.content = b'{"error": "Invalid API key"}'
        mock_response.json.return_value = {"error": "Invalid API key"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7AuthenticationError, match="Invalid API key"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_validation_error_400(self, mock_request):
        """Test 400 validation error."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.content = b'{"error": "Invalid parameters"}'
        mock_response.json.return_value = {"error": "Invalid parameters"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7ValidationError, match="Invalid parameters"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_not_found_error_404(self, mock_request):
        """Test 404 not found error."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.content = b'{"error": "Resource not found"}'
        mock_response.json.return_value = {"error": "Resource not found"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7NotFoundError, match="Resource not found"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_rate_limit_error_429(self, mock_request):
        """Test 429 rate limit error."""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.content = b'{"error": "Rate limit exceeded", "retryAfterSeconds": 60}'
        mock_response.json.return_value = {
            "error": "Rate limit exceeded",
            "retryAfterSeconds": 60,
        }
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7RateLimitError) as exc_info:
            client.get("/test")

        assert exc_info.value.retry_after_seconds == 60

    @patch("requests.Session.request")
    def test_server_error_500(self, mock_request):
        """Test 500 server error."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.content = b'{"error": "Internal server error"}'
        mock_response.json.return_value = {"error": "Internal server error"}
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7ServerError, match="Internal server error"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_timeout_error(self, mock_request):
        """Test request timeout."""
        mock_request.side_effect = Timeout("Request timed out")

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7TimeoutError, match="Request timed out after 30s"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_request_exception(self, mock_request):
        """Test generic request exception."""
        mock_request.side_effect = RequestException("Connection error")

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7APIError, match="Request failed: Connection error"):
            client.get("/test")

    @patch("requests.Session.request")
    def test_error_response_parsing_fallback(self, mock_request):
        """Test error response parsing when JSON parsing fails."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.content = b"Plain text error message"
        mock_response.json.side_effect = Exception("JSON parse error")
        mock_response.text = "Plain text error message"
        mock_request.return_value = mock_response

        client = Context7Client(api_key="test-key-1234567890")

        with pytest.raises(Context7ValidationError, match="Plain text error message"):
            client.get("/test")


class TestClientSession:
    """Tests for HTTP session management."""

    def test_session_creation(self):
        """Test session is created with retry configuration."""
        client = Context7Client(api_key="test-key-1234567890")
        assert client.session is not None

    def test_session_close(self):
        """Test session can be closed."""
        client = Context7Client(api_key="test-key-1234567890")
        client.close()

    def test_context_manager_closes_session(self):
        """Test context manager closes session on exit."""
        with patch.object(Context7Client, "close") as mock_close:
            with Context7Client(api_key="test-key-1234567890") as client:
                pass
            mock_close.assert_called_once()
