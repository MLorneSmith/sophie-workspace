"""
Pydantic models for Context7 API requests and responses.

This module defines all data structures used for interacting with the Context7 API,
including request parameters, response models, and supporting types.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ResponseFormat(str, Enum):
    """Response format for documentation content."""

    TXT = "txt"
    JSON = "json"


class LibraryState(str, Enum):
    """Processing state of a library in Context7."""

    FINALIZED = "finalized"
    INITIAL = "initial"
    PROCESSING = "processing"
    ERROR = "error"
    DELETE = "delete"


class DocumentationChunk(BaseModel):
    """A single chunk of documentation content."""

    title: str = Field(..., description="Title of the documentation section")
    content: str = Field(..., description="Documentation content")
    source: str = Field(..., description="Source file path")
    url: Optional[str] = Field(None, description="URL to the documentation source")


class GetContextRequest(BaseModel):
    """Request parameters for retrieving library documentation."""

    owner: str = Field(..., description="Repository owner (e.g., 'vercel')")
    repo: str = Field(..., description="Repository name (e.g., 'next.js')")
    version: Optional[str] = Field(
        None, description="Specific version (e.g., 'v15.1.8') or None for latest"
    )
    topic: Optional[str] = Field(
        None, description="Filter by topic (e.g., 'routing', 'authentication')"
    )
    tokens: int = Field(
        10000,
        description="Maximum token count for response",
        ge=100,
        le=100000,
    )
    response_format: ResponseFormat = Field(
        ResponseFormat.TXT, description="Response format (txt or json)"
    )

    @field_validator("owner", "repo")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        """Validate that owner and repo are non-empty strings."""
        if not v or not v.strip():
            raise ValueError("Owner and repo must be non-empty strings")
        return v.strip()


class GetContextResponse(BaseModel):
    """Response containing library documentation."""

    library: str = Field(..., description="Library identifier (/owner/repo)")
    version: str = Field(..., description="Documentation version")
    topic: Optional[str] = Field(None, description="Topic filter applied")
    tokens: int = Field(..., description="Token count of response")
    content: str = Field(..., description="Documentation content (if format=txt)")
    chunks: Optional[list[DocumentationChunk]] = Field(
        None, description="Documentation chunks (if format=json)"
    )
    metadata: dict[str, str | int | float] = Field(
        default_factory=dict, description="Additional metadata"
    )


class LibraryVersion(BaseModel):
    """Information about a specific library version."""

    version: str = Field(..., description="Version identifier")
    state: LibraryState = Field(..., description="Processing state of this version")
    created_at: Optional[str] = Field(None, description="Creation timestamp")


class Library(BaseModel):
    """Library search result with metadata."""

    id: str = Field(..., description="Library identifier (/owner/repo)")
    title: str = Field(..., description="Library title")
    description: Optional[str] = Field(None, description="Library description")
    branch: str = Field(..., description="Default branch")
    stars: int = Field(0, description="GitHub star count")
    trust_score: float = Field(0.0, description="Trust score (0-100)")
    benchmark_score: float = Field(0.0, description="Benchmark score (0-100)")
    versions: list[LibraryVersion] = Field(
        default_factory=list, description="Available versions"
    )
    tags: list[str] = Field(default_factory=list, description="Library tags")
    state: LibraryState = Field(..., description="Current processing state")
    created_at: Optional[str] = Field(None, description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")


class SearchLibrariesRequest(BaseModel):
    """Request parameters for searching libraries."""

    query: str = Field(..., min_length=1, description="Library name to search for")

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate that query is non-empty."""
        if not v or not v.strip():
            raise ValueError("Query must be a non-empty string")
        return v.strip()


class SearchLibrariesResponse(BaseModel):
    """Response containing library search results."""

    results: list[Library] = Field(..., description="Matching libraries")
    total: int = Field(..., description="Total number of results")
    metadata: dict[str, str | int | float] = Field(
        default_factory=dict, description="Additional metadata"
    )


class ErrorResponse(BaseModel):
    """Error response from Context7 API."""

    error: str = Field(..., description="Error message")
    retry_after_seconds: Optional[int] = Field(
        None, description="Seconds to wait before retrying (for 429 errors)"
    )
    status_code: Optional[int] = Field(None, description="HTTP status code")
