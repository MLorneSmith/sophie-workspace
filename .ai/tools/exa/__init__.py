"""
Exa Search API Integration.

This package provides direct access to Exa Search API endpoints without requiring
the Exa MCP server. It includes standalone Python scripts for semantic web search,
content retrieval, similar link discovery, and AI-powered answers.

Main exports:
    - search_web: Search the web with neural/keyword search
    - get_contents: Retrieve full content from URLs
    - find_similar: Find pages similar to a given URL
    - get_answer: Generate AI-powered answers with citations
"""

from .search import search_web
from .get_contents import get_contents
from .find_similar import find_similar
from .answer import get_answer
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
)
from .exceptions import (
    ExaAPIError,
    ExaAuthenticationError,
    ExaRateLimitError,
    ExaNotFoundError,
    ExaTimeoutError,
)

__all__ = [
    # Core functions
    "search_web",
    "get_contents",
    "find_similar",
    "get_answer",
    # Models
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
    "GetContentsRequest",
    "GetContentsResponse",
    "ContentResult",
    "FindSimilarRequest",
    "FindSimilarResponse",
    "AnswerRequest",
    "AnswerResponse",
    "Citation",
    "ContentOptions",
    "SearchType",
    "LivecrawlOption",
    # Exceptions
    "ExaAPIError",
    "ExaAuthenticationError",
    "ExaRateLimitError",
    "ExaNotFoundError",
    "ExaTimeoutError",
]
