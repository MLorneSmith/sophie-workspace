"""
Unit tests for Exa Search endpoint.

Tests search functionality, request building, and response parsing.
"""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from .models import SearchType, ContentOptions
from .search import search_web, _build_search_request_data, _parse_search_response
from .models import SearchRequest


class TestBuildSearchRequestData:
    """Tests for building search request data."""

    def test_minimal_request(self):
        """Test building request with minimal parameters."""
        request = SearchRequest(query="test query")
        data = _build_search_request_data(request)

        assert data["query"] == "test query"
        assert data["type"] == "auto"
        assert data["numResults"] == 10

    def test_full_request(self):
        """Test building request with all parameters."""
        request = SearchRequest(
            query="AI development",
            type=SearchType.NEURAL,
            num_results=20,
            category="research",
            include_domains=["example.com"],
            exclude_domains=["spam.com"],
            start_crawl_date=datetime(2024, 1, 1),
            end_crawl_date=datetime(2024, 12, 31),
            use_autoprompt=True,
            contents=ContentOptions(text=True, highlights=True, summary=True),
        )
        data = _build_search_request_data(request)

        assert data["query"] == "AI development"
        assert data["type"] == "neural"
        assert data["numResults"] == 20
        assert data["category"] == "research"
        assert data["includeDomains"] == ["example.com"]
        assert data["excludeDomains"] == ["spam.com"]
        assert data["useAutoprompt"] is True
        assert "contents" in data
        assert data["contents"]["text"] is True
        assert data["contents"]["highlights"] is True
        assert data["contents"]["summary"] is True


class TestParseSearchResponse:
    """Tests for parsing search responses."""

    def test_empty_response(self):
        """Test parsing empty response."""
        response_data = {"results": []}
        response = _parse_search_response(response_data)

        assert len(response.results) == 0
        assert response.autoprompt_string is None

    def test_response_with_results(self):
        """Test parsing response with results."""
        response_data = {
            "results": [
                {
                    "url": "https://example.com",
                    "id": "1",
                    "title": "Example Page",
                    "score": 0.95,
                },
                {
                    "url": "https://example.org",
                    "id": "2",
                    "title": "Another Page",
                },
            ],
            "autopromptString": "enhanced query",
            "requestId": "req-123",
        }
        response = _parse_search_response(response_data)

        assert len(response.results) == 2
        assert response.results[0].url == "https://example.com"
        assert response.results[0].score == 0.95
        assert response.autoprompt_string == "enhanced query"
        assert response.request_id == "req-123"

    def test_response_with_content(self):
        """Test parsing response with text content."""
        response_data = {
            "results": [
                {
                    "url": "https://example.com",
                    "id": "1",
                    "text": "Full text content",
                    "highlights": ["highlight 1", "highlight 2"],
                    "summary": "This is a summary",
                }
            ]
        }
        response = _parse_search_response(response_data)

        assert response.results[0].text == "Full text content"
        assert len(response.results[0].highlights) == 2
        assert response.results[0].summary == "This is a summary"


class TestSearchWeb:
    """Tests for search_web function."""

    @patch("exa.search.ExaClient")
    def test_minimal_search(self, mock_client_class):
        """Test search with minimal parameters."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.search.return_value = {"results": []}
        mock_client_class.return_value = mock_client

        response = search_web("test query")

        assert len(response.results) == 0
        mock_client.search.assert_called_once()

    @patch("exa.search.ExaClient")
    def test_search_with_options(self, mock_client_class):
        """Test search with various options."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.search.return_value = {
            "results": [
                {
                    "url": "https://example.com",
                    "id": "1",
                    "title": "Test Result",
                }
            ]
        }
        mock_client_class.return_value = mock_client

        response = search_web(
            query="AI development",
            type=SearchType.NEURAL,
            num_results=5,
            text=True,
            highlights=True,
        )

        assert len(response.results) == 1
        assert response.results[0].title == "Test Result"

        # Verify the request data included content options
        call_args = mock_client.search.call_args[0][0]
        assert "contents" in call_args
        assert call_args["contents"]["text"] is True

    @patch("exa.search.ExaClient")
    def test_search_with_domain_filters(self, mock_client_class):
        """Test search with domain filtering."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.search.return_value = {"results": []}
        mock_client_class.return_value = mock_client

        response = search_web(
            query="test",
            include_domains=["example.com"],
            exclude_domains=["spam.com"],
        )

        call_args = mock_client.search.call_args[0][0]
        assert call_args["includeDomains"] == ["example.com"]
        assert call_args["excludeDomains"] == ["spam.com"]
