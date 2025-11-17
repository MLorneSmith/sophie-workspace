"""
Search Libraries endpoint implementation for Context7 API.

This module provides functions to search for libraries by name or topic,
returning metadata including stars, trust scores, and available versions.
"""

import logging

from .cache import get_cache
from .client import Context7Client
from .models import SearchLibrariesRequest, SearchLibrariesResponse
from .utils import sanitize_query

logger = logging.getLogger(__name__)


def search_libraries(
    query: str,
    use_cache: bool = True,
    api_key: str | None = None,
) -> SearchLibrariesResponse:
    """
    Search for libraries on Context7.

    Args:
        query: Library name to search for
        use_cache: Use cached results if available, default True
        api_key: Context7 API key (reads from CONTEXT7_API_KEY env if not provided)

    Returns:
        SearchLibrariesResponse with matching libraries

    Raises:
        Context7AuthenticationError: Invalid or missing API key
        Context7ValidationError: Invalid query
        Context7APIError: Other API errors

    Example:
        >>> results = search_libraries("next.js")
        >>> for lib in results.results:
        ...     print(f"{lib.title}: {lib.stars} stars")
    """
    # Validate and sanitize request
    request = SearchLibrariesRequest(query=sanitize_query(query))

    # Check cache if enabled
    cache = get_cache()
    cache_key = {"query": request.query}

    if use_cache:
        cached = cache.get(**cache_key)
        if cached:
            logger.info(f"Cache hit for search query: {request.query}")
            return SearchLibrariesResponse(**cached)

    # Make API request
    logger.info(f"Searching libraries for: {request.query}")

    with Context7Client(api_key=api_key) as client:
        # Build endpoint URL
        endpoint = "/search"

        # Build query parameters
        params = {"query": request.query}

        # Execute request
        response_data = client.get(endpoint, params=params)

    # Parse response
    response = SearchLibrariesResponse(**response_data)

    # Set total if not provided
    if response.total is None:
        response.total = len(response.results)

    # Sort results by benchmark score (highest first)
    response.results.sort(key=lambda lib: lib.benchmark_score, reverse=True)

    logger.info(f"Found {response.total} libraries matching '{request.query}'")

    # Cache the result
    if use_cache:
        cache.set(response.model_dump(), **cache_key)
        logger.debug(f"Cached search results for: {request.query}")

    return response
