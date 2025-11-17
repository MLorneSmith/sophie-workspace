"""
Search functionality for Perplexity API.

This module provides high-level functions for performing web searches
using the Perplexity Search API with various filtering options.
"""

import logging
from typing import Any

from .client import PerplexityClient
from .models import SearchRequest, SearchResponse
from .utils import format_date_for_api, parse_list_argument

logger = logging.getLogger(__name__)


def search(
    query: str,
    num_results: int = 10,
    recency_filter: str | None = None,
    domain_filter: str | list[str] | None = None,
    language_filter: str | list[str] | None = None,
    search_after_date: str | None = None,
    search_before_date: str | None = None,
    api_key: str | None = None,
    timeout: int = 60,
) -> SearchResponse:
    """
    Perform a web search using the Perplexity Search API.

    Args:
        query: Search query string
        num_results: Number of results to return (1-100)
        recency_filter: Filter by recency (day, week, month, year)
        domain_filter: Domain(s) to filter by (comma-separated or list)
        language_filter: Language code(s) to filter by (comma-separated or list)
        search_after_date: Filter results published after this date (MM/DD/YYYY)
        search_before_date: Filter results published before this date (MM/DD/YYYY)
        api_key: Perplexity API key (uses env var if not provided)
        timeout: Request timeout in seconds

    Returns:
        SearchResponse with results

    Raises:
        ValueError: If parameters are invalid
        PerplexityAPIError: If API request fails

    Example:
        >>> from perplexity import search
        >>> response = search(
        ...     query="AI breakthroughs 2025",
        ...     num_results=5,
        ...     domain_filter="arxiv.org,github.com",
        ...     language_filter="en"
        ... )
        >>> for result in response.results:
        ...     print(f"{result.title}: {result.url}")
    """
    # Parse list arguments
    domains = parse_list_argument(domain_filter) if domain_filter else None
    languages = parse_list_argument(language_filter) if language_filter else None

    # Validate date filtering logic
    if recency_filter and (search_after_date or search_before_date):
        raise ValueError(
            "Cannot use recency_filter with date filters (search_after_date, search_before_date)"
        )

    # Format dates if provided
    after_date = format_date_for_api(search_after_date) if search_after_date else None
    before_date = format_date_for_api(search_before_date) if search_before_date else None

    # Create and validate request model
    request = SearchRequest(
        query=query,
        num_results=num_results,
        recency_filter=recency_filter,
        domain_filter=domains,
        language_filter=languages,
        search_after_date=after_date,
        search_before_date=before_date,
    )

    logger.info(
        "Executing search: query=%s, num_results=%d, filters=%s",
        query,
        num_results,
        {
            "recency": recency_filter,
            "domains": domains,
            "languages": languages,
            "after": after_date,
            "before": before_date,
        },
    )

    # Execute search request
    with PerplexityClient(api_key=api_key, timeout=timeout) as client:
        # Convert request to dict, excluding None values
        request_data = request.model_dump(exclude_none=True)

        try:
            response_data = client.search(request_data)

            # Parse response into Pydantic model
            response = SearchResponse(**response_data)

            logger.info("Search completed: %d results returned", len(response.results))

            return response

        except Exception as e:
            logger.error("Search failed: %s", str(e))
            raise
