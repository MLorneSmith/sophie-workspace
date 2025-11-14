"""
Unit tests for Exa API Pydantic models.

Tests model validation, serialization, and edge cases.
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from .models import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    GetContentsRequest,
    GetContentsResponse,
    ContentResult,
    FindSimilarRequest,
    FindSimilarResponse,
    AnswerRequest,
    AnswerResponse,
    Citation,
    ContentOptions,
    SearchType,
    LivecrawlOption,
    ErrorResponse,
)


class TestSearchType:
    """Tests for SearchType enum."""

    def test_valid_search_types(self):
        """Test that all valid search types are accepted."""
        assert SearchType.NEURAL == "neural"
        assert SearchType.KEYWORD == "keyword"
        assert SearchType.AUTO == "auto"

    def test_invalid_search_type(self):
        """Test that invalid search types raise an error."""
        with pytest.raises(ValueError):
            SearchType("invalid")


class TestLivecrawlOption:
    """Tests for LivecrawlOption enum."""

    def test_valid_livecrawl_options(self):
        """Test that all valid livecrawl options are accepted."""
        assert LivecrawlOption.ALWAYS == "always"
        assert LivecrawlOption.NEVER == "never"
        assert LivecrawlOption.FALLBACK == "fallback"


class TestContentOptions:
    """Tests for ContentOptions model."""

    def test_default_content_options(self):
        """Test default values for content options."""
        options = ContentOptions()
        assert options.text is False
        assert options.highlights is False
        assert options.summary is False
        assert options.livecrawl is None
        assert options.subpages is None

    def test_content_options_with_values(self):
        """Test content options with specified values."""
        options = ContentOptions(
            text=True,
            highlights=True,
            summary=True,
            livecrawl=LivecrawlOption.ALWAYS,
            subpages=5,
        )
        assert options.text is True
        assert options.highlights is True
        assert options.summary is True
        assert options.livecrawl == LivecrawlOption.ALWAYS
        assert options.subpages == 5

    def test_subpages_validation(self):
        """Test that subpages is validated within range."""
        # Valid range
        ContentOptions(subpages=0)
        ContentOptions(subpages=10)
        ContentOptions(subpages=5)

        # Invalid range
        with pytest.raises(ValidationError):
            ContentOptions(subpages=-1)
        with pytest.raises(ValidationError):
            ContentOptions(subpages=11)


class TestSearchRequest:
    """Tests for SearchRequest model."""

    def test_minimal_search_request(self):
        """Test search request with only required fields."""
        req = SearchRequest(query="test query")
        assert req.query == "test query"
        assert req.type == SearchType.AUTO
        assert req.num_results == 10

    def test_full_search_request(self):
        """Test search request with all fields."""
        req = SearchRequest(
            query="AI development",
            type=SearchType.NEURAL,
            num_results=20,
            category="research",
            include_domains=["example.com"],
            exclude_domains=["spam.com"],
            start_crawl_date=datetime(2024, 1, 1),
            end_crawl_date=datetime(2024, 12, 31),
            use_autoprompt=True,
            contents=ContentOptions(text=True),
        )
        assert req.query == "AI development"
        assert req.type == SearchType.NEURAL
        assert req.num_results == 20
        assert req.category == "research"
        assert req.include_domains == ["example.com"]

    def test_query_validation(self):
        """Test that empty queries are rejected."""
        with pytest.raises(ValidationError):
            SearchRequest(query="")

        with pytest.raises(ValidationError):
            SearchRequest(query="   ")

    def test_query_trimming(self):
        """Test that queries are trimmed."""
        req = SearchRequest(query="  test query  ")
        assert req.query == "test query"

    def test_num_results_validation(self):
        """Test that num_results is validated within range."""
        # Valid range
        SearchRequest(query="test", num_results=1)
        SearchRequest(query="test", num_results=1000)

        # Invalid range
        with pytest.raises(ValidationError):
            SearchRequest(query="test", num_results=0)
        with pytest.raises(ValidationError):
            SearchRequest(query="test", num_results=1001)


class TestSearchResult:
    """Tests for SearchResult model."""

    def test_minimal_search_result(self):
        """Test search result with only required fields."""
        result = SearchResult(url="https://example.com", id="123")
        assert result.url == "https://example.com"
        assert result.id == "123"
        assert result.title is None

    def test_full_search_result(self):
        """Test search result with all fields."""
        result = SearchResult(
            url="https://example.com",
            id="123",
            title="Example Page",
            score=0.95,
            published_date=datetime(2024, 1, 1),
            author="John Doe",
            text="Full text content",
            highlights=["highlight 1", "highlight 2"],
            highlight_scores=[0.9, 0.8],
            summary="This is a summary",
        )
        assert result.title == "Example Page"
        assert result.score == 0.95
        assert len(result.highlights) == 2


class TestSearchResponse:
    """Tests for SearchResponse model."""

    def test_empty_search_response(self):
        """Test search response with no results."""
        response = SearchResponse()
        assert response.results == []
        assert response.autoprompt_string is None

    def test_search_response_with_results(self):
        """Test search response with results."""
        response = SearchResponse(
            results=[
                SearchResult(url="https://example.com", id="1"),
                SearchResult(url="https://example.org", id="2"),
            ],
            autoprompt_string="enhanced query",
            request_id="req-123",
        )
        assert len(response.results) == 2
        assert response.autoprompt_string == "enhanced query"


class TestGetContentsRequest:
    """Tests for GetContentsRequest model."""

    def test_minimal_get_contents_request(self):
        """Test get contents request with only required fields."""
        req = GetContentsRequest(urls=["https://example.com"])
        assert req.urls == ["https://example.com"]
        assert req.text is False

    def test_get_contents_with_options(self):
        """Test get contents request with content options."""
        req = GetContentsRequest(
            urls=["https://example.com", "https://example.org"],
            text=True,
            highlights=True,
            summary=True,
            livecrawl=LivecrawlOption.ALWAYS,
        )
        assert len(req.urls) == 2
        assert req.text is True

    def test_empty_urls_validation(self):
        """Test that empty URLs list is rejected."""
        with pytest.raises(ValidationError):
            GetContentsRequest(urls=[])


class TestContentResult:
    """Tests for ContentResult model."""

    def test_minimal_content_result(self):
        """Test content result with only required fields."""
        result = ContentResult(url="https://example.com", id="123")
        assert result.url == "https://example.com"
        assert result.id == "123"

    def test_full_content_result(self):
        """Test content result with all fields."""
        result = ContentResult(
            url="https://example.com",
            id="123",
            title="Example",
            text="Full text",
            highlights=["highlight"],
            summary="Summary",
            author="Author",
            published_date=datetime(2024, 1, 1),
        )
        assert result.title == "Example"
        assert result.text == "Full text"


class TestGetContentsResponse:
    """Tests for GetContentsResponse model."""

    def test_empty_get_contents_response(self):
        """Test get contents response with no results."""
        response = GetContentsResponse()
        assert response.results == []

    def test_get_contents_response_with_results(self):
        """Test get contents response with results."""
        response = GetContentsResponse(
            results=[ContentResult(url="https://example.com", id="1")],
            request_id="req-123",
        )
        assert len(response.results) == 1


class TestFindSimilarRequest:
    """Tests for FindSimilarRequest model."""

    def test_minimal_find_similar_request(self):
        """Test find similar request with only required fields."""
        req = FindSimilarRequest(url="https://example.com")
        assert req.url == "https://example.com"
        assert req.num_results == 10

    def test_full_find_similar_request(self):
        """Test find similar request with all fields."""
        req = FindSimilarRequest(
            url="https://example.com",
            num_results=20,
            category="research",
            include_domains=["example.com"],
            exclude_domains=["spam.com"],
            contents=ContentOptions(text=True),
        )
        assert req.url == "https://example.com"
        assert req.num_results == 20


class TestFindSimilarResponse:
    """Tests for FindSimilarResponse model."""

    def test_empty_find_similar_response(self):
        """Test find similar response with no results."""
        response = FindSimilarResponse()
        assert response.results == []

    def test_find_similar_response_with_results(self):
        """Test find similar response with results."""
        response = FindSimilarResponse(
            results=[SearchResult(url="https://example.com", id="1")],
            request_id="req-123",
        )
        assert len(response.results) == 1


class TestCitation:
    """Tests for Citation model."""

    def test_minimal_citation(self):
        """Test citation with only required fields."""
        citation = Citation(url="https://example.com")
        assert citation.url == "https://example.com"
        assert citation.title is None

    def test_full_citation(self):
        """Test citation with all fields."""
        citation = Citation(
            url="https://example.com", title="Example", text="Cited text"
        )
        assert citation.title == "Example"
        assert citation.text == "Cited text"


class TestAnswerRequest:
    """Tests for AnswerRequest model."""

    def test_minimal_answer_request(self):
        """Test answer request with only required fields."""
        req = AnswerRequest(query="What is AI?")
        assert req.query == "What is AI?"
        assert req.text is False
        assert req.stream is False

    def test_answer_request_with_options(self):
        """Test answer request with options."""
        req = AnswerRequest(query="What is AI?", text=True, stream=True)
        assert req.text is True
        assert req.stream is True

    def test_query_validation(self):
        """Test that empty queries are rejected."""
        with pytest.raises(ValidationError):
            AnswerRequest(query="")

    def test_query_trimming(self):
        """Test that queries are trimmed."""
        req = AnswerRequest(query="  What is AI?  ")
        assert req.query == "What is AI?"


class TestAnswerResponse:
    """Tests for AnswerResponse model."""

    def test_minimal_answer_response(self):
        """Test answer response with only required fields."""
        response = AnswerResponse(answer="AI is artificial intelligence.")
        assert response.answer == "AI is artificial intelligence."
        assert response.citations == []

    def test_answer_response_with_citations(self):
        """Test answer response with citations."""
        response = AnswerResponse(
            answer="AI is artificial intelligence.",
            citations=[
                Citation(url="https://example.com", title="AI Guide"),
                Citation(url="https://example.org", title="AI Basics"),
            ],
            request_id="req-123",
        )
        assert len(response.citations) == 2
        assert response.request_id == "req-123"


class TestErrorResponse:
    """Tests for ErrorResponse model."""

    def test_minimal_error_response(self):
        """Test error response with required fields."""
        error = ErrorResponse(error="Not found", status=404)
        assert error.error == "Not found"
        assert error.status == 404
        assert error.request_id is None

    def test_error_response_with_request_id(self):
        """Test error response with request ID."""
        error = ErrorResponse(error="Not found", status=404, request_id="req-123")
        assert error.request_id == "req-123"
