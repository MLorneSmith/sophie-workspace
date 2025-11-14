"""
Unit tests for Exa Answer endpoint.

Tests answer generation functionality, request building, and response parsing.
"""

from unittest.mock import Mock, patch

import pytest

from .answer import get_answer, _build_answer_request_data, _parse_answer_response
from .models import AnswerRequest


class TestBuildAnswerRequestData:
    """Tests for building answer request data."""

    def test_minimal_request(self):
        """Test building request with minimal parameters."""
        request = AnswerRequest(query="What is AI?")
        data = _build_answer_request_data(request)

        assert data["query"] == "What is AI?"
        assert "text" not in data
        assert "stream" not in data

    def test_request_with_options(self):
        """Test building request with all options."""
        request = AnswerRequest(
            query="What is AI?",
            text=True,
            stream=True,
        )
        data = _build_answer_request_data(request)

        assert data["query"] == "What is AI?"
        assert data["text"] is True
        assert data["stream"] is True


class TestParseAnswerResponse:
    """Tests for parsing answer responses."""

    def test_response_without_citations(self):
        """Test parsing response without citations."""
        response_data = {
            "answer": "AI is artificial intelligence.",
            "citations": [],
        }
        response = _parse_answer_response(response_data)

        assert response.answer == "AI is artificial intelligence."
        assert len(response.citations) == 0

    def test_response_with_citations(self):
        """Test parsing response with citations."""
        response_data = {
            "answer": "AI is artificial intelligence.",
            "citations": [
                {
                    "url": "https://example.com",
                    "title": "AI Guide",
                    "text": "Artificial intelligence is...",
                },
                {
                    "url": "https://example.org",
                    "title": "AI Basics",
                },
            ],
            "requestId": "req-123",
        }
        response = _parse_answer_response(response_data)

        assert response.answer == "AI is artificial intelligence."
        assert len(response.citations) == 2
        assert response.citations[0].url == "https://example.com"
        assert response.citations[0].title == "AI Guide"
        assert response.request_id == "req-123"


class TestGetAnswer:
    """Tests for get_answer function."""

    @patch("exa.answer.ExaClient")
    def test_minimal_get_answer(self, mock_client_class):
        """Test get answer with minimal parameters."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.get_answer.return_value = {
            "answer": "AI is artificial intelligence.",
            "citations": [],
        }
        mock_client_class.return_value = mock_client

        response = get_answer("What is AI?")

        assert response.answer == "AI is artificial intelligence."
        assert len(response.citations) == 0
        mock_client.get_answer.assert_called_once()

    @patch("exa.answer.ExaClient")
    def test_get_answer_with_text(self, mock_client_class):
        """Test get answer with text option."""
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=None)
        mock_client.get_answer.return_value = {
            "answer": "AI is artificial intelligence.",
            "citations": [
                {
                    "url": "https://example.com",
                    "title": "AI Guide",
                    "text": "Full text content",
                }
            ],
        }
        mock_client_class.return_value = mock_client

        response = get_answer("What is AI?", text=True)

        assert len(response.citations) == 1
        assert response.citations[0].text == "Full text content"

        # Verify the request data
        call_args = mock_client.get_answer.call_args[0][0]
        assert call_args["text"] is True
