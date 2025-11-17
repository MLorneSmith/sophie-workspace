"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from ..models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Citation,
    RecencyFilter,
    SearchRequest,
    SearchResponse,
    SearchResult,
)


class TestSearchRequest:
    """Test SearchRequest model validation."""

    def test_valid_request(self):
        """Test valid search request."""
        request = SearchRequest(
            query="test query",
            num_results=5,
        )
        assert request.query == "test query"
        assert request.num_results == 5

    def test_query_validation(self):
        """Test query validation."""
        with pytest.raises(ValidationError):
            SearchRequest(query="", num_results=5)

    def test_domain_filter_limit(self):
        """Test domain filter max limit."""
        domains = [f"domain{i}.com" for i in range(21)]
        with pytest.raises(ValidationError):
            SearchRequest(query="test", domain_filter=domains)

    def test_language_filter_limit(self):
        """Test language filter max limit."""
        languages = [f"l{i}" for i in range(11)]
        with pytest.raises(ValidationError):
            SearchRequest(query="test", language_filter=languages)

    def test_language_filter_lowercase(self):
        """Test language codes are converted to lowercase."""
        request = SearchRequest(query="test", language_filter=["EN", "FR"])
        assert request.language_filter == ["en", "fr"]


class TestSearchResponse:
    """Test SearchResponse model."""

    def test_empty_results(self):
        """Test response with empty results."""
        response = SearchResponse(results=[])
        assert response.results == []

    def test_with_results(self):
        """Test response with results."""
        result = SearchResult(
            url="https://example.com",
            title="Test Title",
            snippet="Test snippet",
        )
        response = SearchResponse(results=[result])
        assert len(response.results) == 1
        assert response.results[0].url == "https://example.com"


class TestChatMessage:
    """Test ChatMessage model."""

    def test_valid_message(self):
        """Test valid chat message."""
        msg = ChatMessage(role="user", content="Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"

    def test_empty_content(self):
        """Test empty content validation."""
        with pytest.raises(ValidationError):
            ChatMessage(role="user", content="")

    def test_invalid_role(self):
        """Test invalid role."""
        with pytest.raises(ValidationError):
            ChatMessage(role="invalid", content="test")


class TestChatRequest:
    """Test ChatRequest model."""

    def test_valid_request(self):
        """Test valid chat request."""
        request = ChatRequest(
            model="sonar",
            messages=[ChatMessage(role="user", content="Test")],
        )
        assert request.model == "sonar"
        assert len(request.messages) == 1

    def test_empty_messages(self):
        """Test empty messages validation."""
        with pytest.raises(ValidationError):
            ChatRequest(model="sonar", messages=[])

    def test_temperature_range(self):
        """Test temperature must be in valid range."""
        # Valid temperatures
        ChatRequest(
            model="sonar",
            messages=[ChatMessage(role="user", content="test")],
            temperature=0.0,
        )
        ChatRequest(
            model="sonar",
            messages=[ChatMessage(role="user", content="test")],
            temperature=2.0,
        )

        # Invalid temperature
        with pytest.raises(ValidationError):
            ChatRequest(
                model="sonar",
                messages=[ChatMessage(role="user", content="test")],
                temperature=3.0,
            )


class TestCitation:
    """Test Citation model."""

    def test_citation(self):
        """Test citation creation."""
        citation = Citation(
            url="https://example.com",
            title="Example",
            snippet="Test snippet",
        )
        assert citation.url == "https://example.com"
        assert citation.title == "Example"
