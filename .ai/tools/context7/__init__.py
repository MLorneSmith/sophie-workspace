"""
Context7 API Integration Tools

This package provides direct access to Context7 API endpoints for fetching library
documentation and searching libraries without consuming context window tokens through
the MCP server.

Example usage:
    from context7 import get_documentation, search_libraries

    # Fetch documentation for a library
    docs = get_documentation("vercel", "next.js", topic="routing", tokens=2000)

    # Search for libraries
    results = search_libraries("next.js")
"""

from .exceptions import (
    Context7APIError,
    Context7AuthenticationError,
    Context7NotFoundError,
    Context7RateLimitError,
    Context7ServerError,
    Context7TimeoutError,
    Context7ValidationError,
)
from .get_context import get_documentation
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
from .search_libraries import search_libraries

__all__ = [
    # Main functions
    "get_documentation",
    "search_libraries",
    # Exceptions
    "Context7APIError",
    "Context7AuthenticationError",
    "Context7NotFoundError",
    "Context7RateLimitError",
    "Context7ServerError",
    "Context7TimeoutError",
    "Context7ValidationError",
    # Models
    "DocumentationChunk",
    "ErrorResponse",
    "GetContextRequest",
    "GetContextResponse",
    "Library",
    "LibraryState",
    "LibraryVersion",
    "ResponseFormat",
    "SearchLibrariesRequest",
    "SearchLibrariesResponse",
]
