"""
Unit tests for Exa API client.

Tests client initialization, authentication, error handling, and retry logic.
"""

import os
from unittest.mock import Mock, patch

import pytest
import requests

from .client import ExaClient
from .exceptions import (
    ExaAPIError,
    ExaAuthenticationError,
    ExaNotFoundError,
    ExaRateLimitError,
    ExaTimeoutError,
    ExaValidationError,
)


class TestExaClient:
    """Tests for ExaClient class."""

    @patch.dict(os.environ, {"EXA_API_KEY": "test-api-key-1234567890"})
    def test_client_initialization_from_env(self):
        """Test client initialization from environment variable."""
        client = ExaClient()
        assert client.api_key == "test-api-key-1234567890"
        assert client.timeout == ExaClient.DEFAULT_TIMEOUT

    def test_client_initialization_with_api_key(self):
        """Test client initialization with explicit API key."""
        client = ExaClient(api_key="test-api-key-1234567890")
        assert client.api_key == "test-api-key-1234567890"

    @patch.dict(os.environ, {}, clear=True)
    def test_client_initialization_without_api_key(self):
        """Test that client initialization fails without API key."""
        with pytest.raises(ValueError, match="EXA_API_KEY"):
            ExaClient()

    def test_client_initialization_with_invalid_api_key(self):
        """Test that client initialization fails with invalid API key."""
        with pytest.raises(ValueError):
            ExaClient(api_key="short")

    def test_client_with_custom_timeout(self):
        """Test client initialization with custom timeout."""
        client = ExaClient(api_key="test-api-key-1234567890", timeout=60)
        assert client.timeout == 60

    def test_get_headers(self):
        """Test that headers are correctly formatted."""
        client = ExaClient(api_key="test-api-key-1234567890")
        headers = client._get_headers()

        assert headers["x-api-key"] == "test-api-key-1234567890"
        assert headers["Content-Type"] == "application/json"
        assert headers["Accept"] == "application/json"

    @patch("requests.Session.request")
    def test_successful_request(self, mock_request):
        """Test successful API request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")
        response = client._make_request("POST", "/search", data={"query": "test"})

        assert response == {"results": []}
        mock_request.assert_called_once()

    @patch("requests.Session.request")
    def test_authentication_error(self, mock_request):
        """Test handling of 401 authentication error."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": "Invalid API key"}
        mock_response.headers = {}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaAuthenticationError) as exc_info:
            client._make_request("POST", "/search", data={"query": "test"})

        assert "Invalid API key" in str(exc_info.value)
        assert exc_info.value.status_code == 401

    @patch("requests.Session.request")
    def test_not_found_error(self, mock_request):
        """Test handling of 404 not found error."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"error": "Resource not found"}
        mock_response.headers = {}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaNotFoundError) as exc_info:
            client._make_request("POST", "/search", data={"query": "test"})

        assert exc_info.value.status_code == 404

    @patch("requests.Session.request")
    def test_rate_limit_error(self, mock_request):
        """Test handling of 429 rate limit error."""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.json.return_value = {"error": "Rate limit exceeded"}
        mock_response.headers = {"Retry-After": "60"}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaRateLimitError) as exc_info:
            client._make_request("POST", "/search", data={"query": "test"})

        assert exc_info.value.status_code == 429
        assert exc_info.value.retry_after == 60

    @patch("requests.Session.request")
    def test_validation_error(self, mock_request):
        """Test handling of 400 validation error."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": "Invalid request"}
        mock_response.headers = {}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaValidationError) as exc_info:
            client._make_request("POST", "/search", data={"query": "test"})

        assert exc_info.value.status_code == 400

    @patch("requests.Session.request")
    def test_timeout_error(self, mock_request):
        """Test handling of request timeout."""
        mock_request.side_effect = requests.exceptions.Timeout()

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaTimeoutError):
            client._make_request("POST", "/search", data={"query": "test"})

    @patch("requests.Session.request")
    def test_connection_error(self, mock_request):
        """Test handling of connection error."""
        mock_request.side_effect = requests.exceptions.ConnectionError()

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaAPIError, match="Connection error"):
            client._make_request("POST", "/search", data={"query": "test"})

    @patch("requests.Session.request")
    def test_generic_api_error(self, mock_request):
        """Test handling of generic API error."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.return_value = {"error": "Internal server error"}
        mock_response.headers = {}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaAPIError) as exc_info:
            client._make_request("POST", "/search", data={"query": "test"})

        assert exc_info.value.status_code == 500

    @patch("requests.Session.request")
    def test_error_response_with_text_fallback(self, mock_request):
        """Test error handling when JSON parsing fails."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_response.text = "Internal Server Error"
        mock_response.headers = {}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")

        with pytest.raises(ExaAPIError, match="Internal Server Error"):
            client._make_request("POST", "/search", data={"query": "test"})

    def test_context_manager(self):
        """Test client as context manager."""
        with ExaClient(api_key="test-api-key-1234567890") as client:
            assert client.api_key == "test-api-key-1234567890"

    def test_close(self):
        """Test closing the client session."""
        client = ExaClient(api_key="test-api-key-1234567890")
        client.close()
        # Session should be closed, but we can't directly verify this

    @patch("requests.Session.request")
    def test_search_method(self, mock_request):
        """Test search method."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")
        response = client.search({"query": "test"})

        assert response == {"results": []}
        assert "/search" in str(mock_request.call_args)

    @patch("requests.Session.request")
    def test_get_contents_method(self, mock_request):
        """Test get_contents method."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")
        response = client.get_contents({"urls": ["https://example.com"]})

        assert response == {"results": []}
        assert "/contents" in str(mock_request.call_args)

    @patch("requests.Session.request")
    def test_find_similar_method(self, mock_request):
        """Test find_similar method."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")
        response = client.find_similar({"url": "https://example.com"})

        assert response == {"results": []}
        assert "/findSimilar" in str(mock_request.call_args)

    @patch("requests.Session.request")
    def test_get_answer_method(self, mock_request):
        """Test get_answer method."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"answer": "Test answer", "citations": []}
        mock_request.return_value = mock_response

        client = ExaClient(api_key="test-api-key-1234567890")
        response = client.get_answer({"query": "What is AI?"})

        assert response == {"answer": "Test answer", "citations": []}
        assert "/answer" in str(mock_request.call_args)
