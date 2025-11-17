"""
Unit tests for Exa Get Contents endpoint.

Tests content retrieval functionality, request building, and response parsing.
"""

from unittest.mock import Mock, patch

import pytest

from .get_contents import get_contents, _build_get_contents_request_data, _parse_get_contents_response
from .models import GetContentsRequest, LivecrawlOption


class TestBuildGetContentsRequestData:
    """Tests for building get contents request data."""

    def test_minimal_request(self):
        """Test building request with minimal parameters."""
        request = GetContentsRequest(urls=["https://example.com"])
        data = _build_get_contents_request_data(request)

        assert data["urls"] == ["https://example.com"]
        assert "text" not in data

    def test_request_with_options(self):
        """Test building request with all content options."""
        request = GetContentsRequest(
            urls=["https://example.com", "https://example.org"],
            text=True,
            highlights=True,
            summary=True,
            livecrawl=LivecrawlOption.ALWAYS,
            subpages=5,
            subpage_target=3,
        )
        data = _build_get_contents_request_data(request)

        assert len(data["urls"]) == 2
        assert data["text"] is True
        assert data["highlights"] is True
        assert data["summary"] is True
        assert data["livecrawl"] == "always"
        assert data["subpages"] == 5
        assert data["subpageTarget"] == 3


class TestParseGetContentsResponse:
    """Tests for parsing get contents responses."""

    def test_empty_response(self):
        """Test parsing empty response."""
        response_data = {"results": []}
        response = _parse_get_contents_response(response_data)

        assert len(response.results) == 0

    def test_response_with_results(self):
        """Test parsing response with results."""
        response_data = {
            "results": [
                {
                    "url": "https://example.com",
                    "id": "1",
                    "title": "Example Page",
                    "text": "Full text content",
                    "summary": "This is a summary",
                },
                {
                    "url": "https://example.org",
                    "id": "2",
                    "title": "Another Page",
                },
            ],
            "requestId": "req-123",
        }
        response = _parse_get_contents_response(response_data)

        assert len(response.results) == 2
        assert response.results[0].url == "https://example.com"
        assert response.results[0].text == "Full text content"
        assert response.request_id == "req-123"


class TestGetContents:
    """Tests for get_contents function."""

    @patch("exa.get_contents.ExaClient")
    def test_minimal_get_contents(self, mock_client_class):
        """Test get contents with minimal parameters."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.get_contents.return_value = {"results": []}
        mock_client_class.return_value = mock_client

        response = get_contents(["https://example.com"])

        assert len(response.results) == 0
        mock_client.get_contents.assert_called_once()

    @patch("exa.get_contents.ExaClient")
    def test_get_contents_with_options(self, mock_client_class):
        """Test get contents with various options."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.get_contents.return_value = {
            "results": [
                {
                    "url": "https://example.com",
                    "id": "1",
                    "title": "Test Page",
                    "text": "Content",
                }
            ]
        }
        mock_client_class.return_value = mock_client

        response = get_contents(
            urls=["https://example.com"],
            text=True,
            summary=True,
        )

        assert len(response.results) == 1
        assert response.results[0].title == "Test Page"

        # Verify the request data included content options
        call_args = mock_client.get_contents.call_args[0][0]
        assert call_args["text"] is True
        assert call_args["summary"] is True
