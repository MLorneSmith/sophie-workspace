"""
Unit tests for Context7 Pydantic models.

Tests model validation, serialization, and edge cases.
"""

import pytest
from pydantic import ValidationError

from .models import (
    DocumentationChunk,
    ErrorResponse,
    GetContextRequest,
    GetContextResponse,
    Library,
    LibraryState,
    LibraryVersion,
    ResponseFormat,
    SearchLibrariesRequest,
    SearchLibrariesResponse,
)


class TestResponseFormat:
    """Tests for ResponseFormat enum."""

    def test_valid_formats(self):
        """Test valid format values."""
        assert ResponseFormat.TXT == "txt"
        assert ResponseFormat.JSON == "json"

    def test_enum_from_string(self):
        """Test creating enum from string."""
        assert ResponseFormat("txt") == ResponseFormat.TXT
        assert ResponseFormat("json") == ResponseFormat.JSON


class TestLibraryState:
    """Tests for LibraryState enum."""

    def test_valid_states(self):
        """Test all valid state values."""
        assert LibraryState.FINALIZED == "finalized"
        assert LibraryState.INITIAL == "initial"
        assert LibraryState.PROCESSING == "processing"
        assert LibraryState.ERROR == "error"
        assert LibraryState.DELETE == "delete"


class TestGetContextRequest:
    """Tests for GetContextRequest model."""

    def test_valid_request(self):
        """Test creating request with valid parameters."""
        request = GetContextRequest(
            owner="vercel",
            repo="next.js",
            version="v15.1.8",
            topic="routing",
            tokens=5000,
            response_format=ResponseFormat.TXT,
        )

        assert request.owner == "vercel"
        assert request.repo == "next.js"
        assert request.version == "v15.1.8"
        assert request.topic == "routing"
        assert request.tokens == 5000
        assert request.response_format == ResponseFormat.TXT

    def test_minimal_request(self):
        """Test creating request with only required fields."""
        request = GetContextRequest(owner="vercel", repo="next.js")

        assert request.owner == "vercel"
        assert request.repo == "next.js"
        assert request.version is None
        assert request.topic is None
        assert request.tokens == 10000  # default
        assert request.response_format == ResponseFormat.TXT  # default

    def test_token_range_validation(self):
        """Test token count must be within 100-100,000."""
        # Valid values
        GetContextRequest(owner="vercel", repo="next.js", tokens=100)
        GetContextRequest(owner="vercel", repo="next.js", tokens=50000)
        GetContextRequest(owner="vercel", repo="next.js", tokens=100000)

        # Too low
        with pytest.raises(ValidationError):
            GetContextRequest(owner="vercel", repo="next.js", tokens=99)

        # Too high
        with pytest.raises(ValidationError):
            GetContextRequest(owner="vercel", repo="next.js", tokens=100001)

    def test_empty_owner_validation(self):
        """Test owner cannot be empty."""
        with pytest.raises(ValidationError):
            GetContextRequest(owner="", repo="next.js")

        with pytest.raises(ValidationError):
            GetContextRequest(owner="   ", repo="next.js")

    def test_empty_repo_validation(self):
        """Test repo cannot be empty."""
        with pytest.raises(ValidationError):
            GetContextRequest(owner="vercel", repo="")

        with pytest.raises(ValidationError):
            GetContextRequest(owner="vercel", repo="   ")

    def test_whitespace_trimming(self):
        """Test owner and repo are trimmed."""
        request = GetContextRequest(owner="  vercel  ", repo="  next.js  ")
        assert request.owner == "vercel"
        assert request.repo == "next.js"


class TestSearchLibrariesRequest:
    """Tests for SearchLibrariesRequest model."""

    def test_valid_request(self):
        """Test creating request with valid query."""
        request = SearchLibrariesRequest(query="next.js")
        assert request.query == "next.js"

    def test_empty_query_validation(self):
        """Test query cannot be empty."""
        with pytest.raises(ValidationError):
            SearchLibrariesRequest(query="")

        with pytest.raises(ValidationError):
            SearchLibrariesRequest(query="   ")

    def test_query_trimming(self):
        """Test query is trimmed."""
        request = SearchLibrariesRequest(query="  next.js  ")
        assert request.query == "next.js"


class TestDocumentationChunk:
    """Tests for DocumentationChunk model."""

    def test_valid_chunk(self):
        """Test creating chunk with all fields."""
        chunk = DocumentationChunk(
            title="Getting Started",
            content="Installation instructions...",
            source="docs/getting-started.md",
            url="https://nextjs.org/docs/getting-started",
        )

        assert chunk.title == "Getting Started"
        assert chunk.content == "Installation instructions..."
        assert chunk.source == "docs/getting-started.md"
        assert chunk.url == "https://nextjs.org/docs/getting-started"

    def test_chunk_without_url(self):
        """Test creating chunk without URL."""
        chunk = DocumentationChunk(
            title="API Reference",
            content="API documentation...",
            source="docs/api.md",
        )

        assert chunk.url is None


class TestGetContextResponse:
    """Tests for GetContextResponse model."""

    def test_txt_format_response(self):
        """Test response with text format."""
        response = GetContextResponse(
            library="/vercel/next.js",
            version="v15.1.8",
            topic="routing",
            tokens=2500,
            content="# Routing\n\nNext.js routing documentation...",
            metadata={"source": "api"},
        )

        assert response.library == "/vercel/next.js"
        assert response.version == "v15.1.8"
        assert response.topic == "routing"
        assert response.tokens == 2500
        assert response.content.startswith("# Routing")
        assert response.chunks is None
        assert response.metadata == {"source": "api"}

    def test_json_format_response(self):
        """Test response with JSON format (chunks)."""
        chunks = [
            DocumentationChunk(
                title="Routing Basics",
                content="Basic routing concepts...",
                source="docs/routing/basics.md",
            ),
            DocumentationChunk(
                title="Dynamic Routes",
                content="Dynamic routing...",
                source="docs/routing/dynamic.md",
            ),
        ]

        response = GetContextResponse(
            library="/vercel/next.js",
            version="v15.1.8",
            topic="routing",
            tokens=3000,
            content="",  # Empty for JSON format
            chunks=chunks,
        )

        assert response.chunks is not None
        assert len(response.chunks) == 2
        assert response.chunks[0].title == "Routing Basics"
        assert response.chunks[1].title == "Dynamic Routes"


class TestLibrary:
    """Tests for Library model."""

    def test_complete_library(self):
        """Test library with all fields."""
        versions = [
            LibraryVersion(version="v15.1.8", state=LibraryState.FINALIZED),
            LibraryVersion(version="v15.1.7", state=LibraryState.FINALIZED),
        ]

        library = Library(
            id="/vercel/next.js",
            title="Next.js",
            description="The React Framework for Production",
            branch="canary",
            stars=125000,
            trust_score=95.5,
            benchmark_score=92.3,
            versions=versions,
            tags=["react", "framework", "ssr"],
            state=LibraryState.FINALIZED,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-15T12:30:00Z",
        )

        assert library.id == "/vercel/next.js"
        assert library.title == "Next.js"
        assert library.description == "The React Framework for Production"
        assert library.stars == 125000
        assert library.trust_score == 95.5
        assert library.benchmark_score == 92.3
        assert len(library.versions) == 2
        assert len(library.tags) == 3
        assert library.state == LibraryState.FINALIZED

    def test_minimal_library(self):
        """Test library with only required fields."""
        library = Library(
            id="/vercel/next.js",
            title="Next.js",
            branch="main",
            state=LibraryState.INITIAL,
        )

        assert library.stars == 0  # default
        assert library.trust_score == 0.0  # default
        assert library.benchmark_score == 0.0  # default
        assert library.versions == []  # default
        assert library.tags == []  # default


class TestSearchLibrariesResponse:
    """Tests for SearchLibrariesResponse model."""

    def test_response_with_results(self):
        """Test search response with results."""
        libraries = [
            Library(
                id="/vercel/next.js",
                title="Next.js",
                branch="canary",
                stars=125000,
                trust_score=95.5,
                benchmark_score=92.3,
                state=LibraryState.FINALIZED,
            ),
            Library(
                id="/vercel/swr",
                title="SWR",
                branch="main",
                stars=30000,
                trust_score=88.0,
                benchmark_score=85.5,
                state=LibraryState.FINALIZED,
            ),
        ]

        response = SearchLibrariesResponse(
            results=libraries,
            total=2,
            metadata={"query": "vercel"},
        )

        assert len(response.results) == 2
        assert response.total == 2
        assert response.metadata["query"] == "vercel"

    def test_empty_response(self):
        """Test search response with no results."""
        response = SearchLibrariesResponse(
            results=[],
            total=0,
        )

        assert response.results == []
        assert response.total == 0
        assert response.metadata == {}  # default


class TestErrorResponse:
    """Tests for ErrorResponse model."""

    def test_error_with_retry_after(self):
        """Test error response with retry_after for rate limiting."""
        error = ErrorResponse(
            error="Rate limit exceeded",
            retry_after_seconds=60,
            status_code=429,
        )

        assert error.error == "Rate limit exceeded"
        assert error.retry_after_seconds == 60
        assert error.status_code == 429

    def test_error_without_retry_after(self):
        """Test error response without retry_after."""
        error = ErrorResponse(
            error="Resource not found",
            status_code=404,
        )

        assert error.error == "Resource not found"
        assert error.retry_after_seconds is None
        assert error.status_code == 404


class TestModelSerialization:
    """Tests for model serialization/deserialization."""

    def test_request_serialization(self):
        """Test serializing request to dict."""
        request = GetContextRequest(
            owner="vercel",
            repo="next.js",
            topic="routing",
            tokens=2000,
        )

        data = request.model_dump()
        assert data["owner"] == "vercel"
        assert data["repo"] == "next.js"
        assert data["topic"] == "routing"
        assert data["tokens"] == 2000

    def test_response_deserialization(self):
        """Test deserializing response from dict."""
        data = {
            "library": "/vercel/next.js",
            "version": "v15.1.8",
            "topic": None,
            "tokens": 2500,
            "content": "Documentation content",
            "chunks": None,
            "metadata": {},
        }

        response = GetContextResponse(**data)
        assert response.library == "/vercel/next.js"
        assert response.version == "v15.1.8"
        assert response.tokens == 2500
