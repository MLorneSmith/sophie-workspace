"""
Pydantic models for Perplexity API requests and responses.

This module defines all data models used for validating and serializing
requests to and responses from the Perplexity API endpoints (Search and Chat Completions).
"""

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class RecencyFilter(str, Enum):
    """Time-based recency filter for search results."""

    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class SearchRequest(BaseModel):
    """Request model for Perplexity Search API."""

    query: str = Field(..., min_length=1, description="Search query")
    num_results: int = Field(
        default=10, ge=1, le=100, description="Number of results to return (1-100)"
    )
    recency_filter: Optional[RecencyFilter] = Field(
        default=None,
        description="Filter results by recency (mutually exclusive with date filters)",
    )
    domain_filter: Optional[list[str]] = Field(
        default=None,
        max_length=20,
        description="Filter by specific domains (max 20)",
    )
    language_filter: Optional[list[str]] = Field(
        default=None,
        max_length=10,
        description="Filter by ISO 639-1 language codes (max 10)",
    )
    search_after_date: Optional[str] = Field(
        default=None,
        description="Filter results published after this date (MM/DD/YYYY)",
    )
    search_before_date: Optional[str] = Field(
        default=None,
        description="Filter results published before this date (MM/DD/YYYY)",
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()

    @field_validator("domain_filter")
    @classmethod
    def validate_domain_filter(cls, v: list[str] | None) -> list[str] | None:
        """Validate domain filter doesn't exceed max limit."""
        if v and len(v) > 20:
            raise ValueError("Maximum 20 domains allowed in domain_filter")
        return v

    @field_validator("language_filter")
    @classmethod
    def validate_language_filter(cls, v: list[str] | None) -> list[str] | None:
        """Validate language filter doesn't exceed max limit and uses lowercase."""
        if v:
            if len(v) > 10:
                raise ValueError("Maximum 10 languages allowed in language_filter")
            # Ensure all codes are lowercase
            return [code.lower() for code in v]
        return v


class SearchResult(BaseModel):
    """Individual search result from Perplexity API."""

    url: str = Field(..., description="URL of the result")
    title: str = Field(..., description="Page title")
    snippet: Optional[str] = Field(default=None, description="Text snippet from the page")
    published_date: Optional[str] = Field(
        default=None, description="Publication date"
    )


class SearchResponse(BaseModel):
    """Response model for Perplexity Search API."""

    results: list[SearchResult] = Field(
        default_factory=list, description="Search results"
    )
    request_id: Optional[str] = Field(default=None, description="Request ID for debugging")


class ChatMessage(BaseModel):
    """A single message in a chat conversation."""

    role: Literal["system", "user", "assistant"] = Field(
        ..., description="Role of the message sender"
    )
    content: str = Field(..., min_length=1, description="Message content")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content is not empty."""
        if not v.strip():
            raise ValueError("Message content cannot be empty")
        return v.strip()


class ChatRequest(BaseModel):
    """Request model for Perplexity Chat Completions API."""

    model: Literal[
        "sonar",
        "sonar-pro",
        "sonar-reasoning",
    ] = Field(
        default="sonar", description="Model to use for chat completion"
    )
    messages: list[ChatMessage] = Field(
        ..., min_length=1, description="Conversation messages"
    )
    stream: bool = Field(default=False, description="Enable streaming responses")
    max_tokens: Optional[int] = Field(
        default=None,
        ge=1,
        description="Maximum tokens in response",
    )
    temperature: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=2.0,
        description="Sampling temperature (0-2)",
    )
    top_p: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Nucleus sampling threshold (0-1)",
    )
    return_citations: bool = Field(
        default=True, description="Return citations for grounded responses"
    )
    return_images: bool = Field(
        default=False, description="Return images in the response"
    )

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        """Validate messages list is not empty."""
        if not v:
            raise ValueError("At least one message is required")
        return v


class Citation(BaseModel):
    """Citation from a grounded chat response."""

    url: str = Field(..., description="Source URL")
    title: Optional[str] = Field(default=None, description="Page title")
    snippet: Optional[str] = Field(default=None, description="Cited text snippet")

    @classmethod
    def from_url(cls, url: str) -> "Citation":
        """Create a Citation from just a URL string."""
        return cls(url=url)


class ChatChoice(BaseModel):
    """A single choice in the chat completion response."""

    message: ChatMessage = Field(..., description="The generated message")
    finish_reason: Optional[str] = Field(
        default=None, description="Reason for completion finish"
    )
    index: int = Field(default=0, description="Choice index")


class Usage(BaseModel):
    """Token usage statistics for the chat completion."""

    prompt_tokens: int = Field(..., description="Tokens in the prompt")
    completion_tokens: int = Field(..., description="Tokens in the completion")
    total_tokens: int = Field(..., description="Total tokens used")


class ChatResponse(BaseModel):
    """Response model for Perplexity Chat Completions API."""

    id: str = Field(..., description="Unique response ID")
    model: str = Field(..., description="Model used for completion")
    choices: list[ChatChoice] = Field(..., description="Generated completions")
    usage: Optional[Usage] = Field(default=None, description="Token usage statistics")
    citations: Optional[list[Citation | str]] = Field(
        default=None, description="Citations for grounded responses (URLs or Citation objects)"
    )
    created: Optional[int] = Field(default=None, description="Unix timestamp of creation")


class ErrorResponse(BaseModel):
    """Error response from Perplexity API."""

    error: str = Field(..., description="Error message")
    status: int = Field(..., description="HTTP status code")
    request_id: Optional[str] = Field(default=None, description="Request ID for debugging")
