"""
Unit tests for Exa Find Similar Links endpoint.

Tests similar page discovery functionality, request building, and response parsing.
"""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from .find_similar import find_similar, _build_find_similar_request_data, _parse_find_similar_response
from .models import FindSimilarRequest, ContentOptions


class TestBuildFindSimilarRequestData:
    """Tests for building find similar request data."""

    def test_minimal_request(self):
        """Test building request with minimal parameters."""
        request = FindSimilarRequest(url="https://example.com")
        data = _build_find_similar_request_data(request)

        assert data["url"] == "https://example.com"
        assert data["numResults"] == 10

    def test_full_request(self):
        """Test building request with all parameters."""
        request = FindSimilarRequest(
            url="https://example.com",
            num_results=20,
            category="research",
            include_domains=["example.com"],
            exclude_domains=["spam.com"],
            start_crawl_date=datetime(2024, 1, 1),
            end_crawl_date=datetime(2024, 12, 31),
            contents=ContentOptions(text=True, summary=True),
        )
        data = _build_find_similar_request_data(request)

        assert data["url"] == "https://example.com"
        assert data["numResults"] == 20
        assert data["category"] == "research"
        assert data["includeDomains"] == ["example.com"]
        assert "contents" in data


class TestParseFindSimilarResponse:
    """Tests for parsing find similar responses."""

    def test_empty_response(self):
        """Test parsing empty response."""
        response_data = {"results": []}
        response = _parse_find_similar_response(response_data)

        assert len(response.results) == 0

    def test_response_with_results(self):
        """Test parsing response with results."""
        response_data = {
            "results": [
                {
                    "url": "https://similar1.com",
                    "id": "1",
                    "title": "Similar Page 1",
                    "score": 0.92,
                },
                {
                    "url": "https://similar2.com",
                    "id": "2",
                    "title": "Similar Page 2",
                    "score": 0.85,
                },
            ],
            "requestId": "req-123",
        }
        response = _parse_find_similar_response(response_data)

        assert len(response.results) == 2
        assert response.results[0].score == 0.92
        assert response.request_id == "req-123"


class TestFindSimilar:
    """Tests for find_similar function."""

    @patch("exa.find_similar.ExaClient")
    def test_minimal_find_similar(self, mock_client_class):
        """Test find similar with minimal parameters."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.find_similar.return_value = {"results": []}
        mock_client_class.return_value = mock_client

        response = find_similar("https://example.com")

        assert len(response.results) == 0
        mock_client.find_similar.assert_called_once()

    @patch("exa.find_similar.ExaClient")
    def test_find_similar_with_options(self, mock_client_class):
        """Test find similar with various options."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.find_similar.return_value = {
            "results": [
                {
                    "url": "https://similar.com",
                    "id": "1",
                    "title": "Similar Page",
                    "score": 0.9,
                }
            ]
        }
        mock_client_class.return_value = mock_client

        response = find_similar(
            url="https://example.com",
            num_results=5,
            text=True,
        )

        assert len(response.results) == 1
        assert response.results[0].title == "Similar Page"

        # Verify the request data
        call_args = mock_client.find_similar.call_args[0][0]
        assert call_args["numResults"] == 5
