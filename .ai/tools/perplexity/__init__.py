"""
Perplexity API Integration for SlideHeroes

This package provides a comprehensive Python client for the Perplexity API,
including Search and Chat Completions capabilities.

Usage:
    from perplexity import PerplexityClient, SearchRequest, ChatRequest

    client = PerplexityClient()

    # Search API
    results = client.search(SearchRequest(query="AI latest research"))

    # Chat Completions API
    response = client.chat(ChatRequest(
        model="sonar",
        messages=[{"role": "user", "content": "Explain quantum computing"}]
    ))

Author: SlideHeroes Development Team
Version: 1.0.0
"""

__version__ = "1.0.0"

from .client import PerplexityClient
from .exceptions import (
    PerplexityAPIError,
    PerplexityAuthenticationError,
    PerplexityConnectionError,
    PerplexityRateLimitError,
    PerplexityTimeoutError,
    PerplexityValidationError,
)
from .models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Citation,
    RecencyFilter,
    SearchRequest,
    SearchResponse,
    SearchResult,
)

__all__ = [
    "PerplexityClient",
    "PerplexityAPIError",
    "PerplexityAuthenticationError",
    "PerplexityConnectionError",
    "PerplexityRateLimitError",
    "PerplexityTimeoutError",
    "PerplexityValidationError",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "Citation",
    "RecencyFilter",
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
]
