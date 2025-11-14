"""
Pydantic models for Exa Search API requests and responses.

This module defines all data models used for validating and serializing
requests to and responses from the Exa Search API endpoints.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SearchType(str, Enum):
    """Search type for Exa Search API."""

    NEURAL = "neural"
    KEYWORD = "keyword"
    AUTO = "auto"


class LivecrawlOption(str, Enum):
    """Livecrawl configuration options."""

    ALWAYS = "always"
    NEVER = "never"
    FALLBACK = "fallback"


class ContentOptions(BaseModel):
    """Options for content retrieval in search results."""

    text: Optional[bool] = Field(
        default=False, description="Include cleaned HTML text content"
    )
    highlights: Optional[bool] = Field(
        default=False,
        description="Include highlighted snippets matching the query",
    )
    summary: Optional[bool] = Field(
        default=False, description="Include AI-generated summary"
    )
    livecrawl: Optional[LivecrawlOption] = Field(
        default=None, description="Livecrawl configuration"
    )
    subpages: Optional[int] = Field(
        default=None,
        ge=0,
        le=10,
        description="Number of subpages to crawl (0-10)",
    )
    subpage_target: Optional[int] = Field(
        default=None,
        ge=0,
        le=10,
        description="Target number of subpages to return (0-10)",
    )


class SearchRequest(BaseModel):
    """Request model for Exa Search API."""

    query: str = Field(..., min_length=1, description="Search query")
    type: SearchType = Field(
        default=SearchType.AUTO, description="Search algorithm type"
    )
    num_results: int = Field(
        default=10, ge=1, le=1000, description="Number of results to return"
    )
    category: Optional[str] = Field(
        default=None, description="Content category filter"
    )
    include_domains: Optional[list[str]] = Field(
        default=None, description="Only include results from these domains"
    )
    exclude_domains: Optional[list[str]] = Field(
        default=None, description="Exclude results from these domains"
    )
    start_crawl_date: Optional[datetime] = Field(
        default=None, description="Earliest crawl date for results"
    )
    end_crawl_date: Optional[datetime] = Field(
        default=None, description="Latest crawl date for results"
    )
    start_published_date: Optional[datetime] = Field(
        default=None, description="Earliest publication date for results"
    )
    end_published_date: Optional[datetime] = Field(
        default=None, description="Latest publication date for results"
    )
    use_autoprompt: Optional[bool] = Field(
        default=None, description="Use AI to enhance the search query"
    )
    contents: Optional[ContentOptions] = Field(
        default=None, description="Content retrieval options"
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class SearchResult(BaseModel):
    """Individual search result from Exa API."""

    url: str = Field(..., description="URL of the result")
    title: Optional[str] = Field(default=None, description="Page title")
    id: str = Field(..., description="Unique result ID")
    score: Optional[float] = Field(default=None, description="Relevance score")
    published_date: Optional[datetime] = Field(
        default=None, description="Publication date"
    )
    author: Optional[str] = Field(default=None, description="Content author")
    text: Optional[str] = Field(default=None, description="Full text content")
    highlights: Optional[list[str]] = Field(
        default=None, description="Highlighted snippets"
    )
    highlight_scores: Optional[list[float]] = Field(
        default=None, description="Scores for each highlight"
    )
    summary: Optional[str] = Field(default=None, description="AI summary")


class SearchResponse(BaseModel):
    """Response model for Exa Search API."""

    results: list[SearchResult] = Field(
        default_factory=list, description="Search results"
    )
    autoprompt_string: Optional[str] = Field(
        default=None, description="AI-enhanced query string if autoprompt was used"
    )
    request_id: Optional[str] = Field(default=None, description="Request ID")


class GetContentsRequest(BaseModel):
    """Request model for Exa Get Contents API."""

    urls: list[str] = Field(..., min_length=1, description="URLs to fetch content for")
    text: Optional[bool] = Field(
        default=False, description="Include cleaned HTML text"
    )
    highlights: Optional[bool] = Field(
        default=False, description="Include highlighted snippets"
    )
    summary: Optional[bool] = Field(default=False, description="Include AI summary")
    livecrawl: Optional[LivecrawlOption] = Field(
        default=None, description="Livecrawl configuration"
    )
    subpages: Optional[int] = Field(
        default=None, ge=0, le=10, description="Number of subpages to crawl"
    )
    subpage_target: Optional[int] = Field(
        default=None,
        ge=0,
        le=10,
        description="Target number of subpages to return",
    )

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: list[str]) -> list[str]:
        """Validate URLs are not empty."""
        if not v:
            raise ValueError("At least one URL is required")
        return v


class ContentResult(BaseModel):
    """Individual content result from Exa Get Contents API."""

    url: str = Field(..., description="URL of the content")
    id: str = Field(..., description="Unique content ID")
    title: Optional[str] = Field(default=None, description="Page title")
    text: Optional[str] = Field(default=None, description="Full text content")
    highlights: Optional[list[str]] = Field(
        default=None, description="Highlighted snippets"
    )
    summary: Optional[str] = Field(default=None, description="AI summary")
    author: Optional[str] = Field(default=None, description="Content author")
    published_date: Optional[datetime] = Field(
        default=None, description="Publication date"
    )


class GetContentsResponse(BaseModel):
    """Response model for Exa Get Contents API."""

    results: list[ContentResult] = Field(
        default_factory=list, description="Content results"
    )
    request_id: Optional[str] = Field(default=None, description="Request ID")


class FindSimilarRequest(BaseModel):
    """Request model for Exa Find Similar Links API."""

    url: str = Field(..., description="Source URL to find similar pages for")
    num_results: int = Field(
        default=10, ge=1, le=1000, description="Number of results to return"
    )
    category: Optional[str] = Field(
        default=None, description="Content category filter"
    )
    include_domains: Optional[list[str]] = Field(
        default=None, description="Only include results from these domains"
    )
    exclude_domains: Optional[list[str]] = Field(
        default=None, description="Exclude results from these domains"
    )
    start_crawl_date: Optional[datetime] = Field(
        default=None, description="Earliest crawl date for results"
    )
    end_crawl_date: Optional[datetime] = Field(
        default=None, description="Latest crawl date for results"
    )
    start_published_date: Optional[datetime] = Field(
        default=None, description="Earliest publication date for results"
    )
    end_published_date: Optional[datetime] = Field(
        default=None, description="Latest publication date for results"
    )
    contents: Optional[ContentOptions] = Field(
        default=None, description="Content retrieval options"
    )


class FindSimilarResponse(BaseModel):
    """Response model for Exa Find Similar Links API."""

    results: list[SearchResult] = Field(
        default_factory=list, description="Similar pages"
    )
    request_id: Optional[str] = Field(default=None, description="Request ID")


class Citation(BaseModel):
    """Citation for an answer from Exa Answer API."""

    url: str = Field(..., description="Source URL")
    title: Optional[str] = Field(default=None, description="Page title")
    text: Optional[str] = Field(default=None, description="Cited text snippet")


class AnswerRequest(BaseModel):
    """Request model for Exa Answer API."""

    query: str = Field(..., min_length=1, description="Question to answer")
    text: Optional[bool] = Field(
        default=False, description="Include full text content in citations"
    )
    stream: Optional[bool] = Field(
        default=False, description="Enable streaming responses"
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class AnswerResponse(BaseModel):
    """Response model for Exa Answer API."""

    answer: str = Field(..., description="AI-generated answer")
    citations: list[Citation] = Field(
        default_factory=list, description="Source citations"
    )
    request_id: Optional[str] = Field(default=None, description="Request ID")


class ErrorResponse(BaseModel):
    """Error response from Exa API."""

    error: str = Field(..., description="Error message")
    status: int = Field(..., description="HTTP status code")
    request_id: Optional[str] = Field(default=None, description="Request ID")
