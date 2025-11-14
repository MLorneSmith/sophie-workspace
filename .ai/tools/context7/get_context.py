"""
Get Context endpoint implementation for Context7 API.

This module provides functions to retrieve library documentation with filtering
by topic and token limits.
"""

import logging
from typing import Any

from .cache import get_cache
from .client import Context7Client
from .models import GetContextRequest, GetContextResponse, ResponseFormat
from .utils import format_library_id

logger = logging.getLogger(__name__)


def get_documentation(
    owner: str,
    repo: str,
    version: str | None = None,
    topic: str | None = None,
    tokens: int = 10000,
    response_format: ResponseFormat = ResponseFormat.TXT,
    use_cache: bool = True,
    api_key: str | None = None,
) -> GetContextResponse:
    """
    Retrieve library documentation from Context7 API.

    Args:
        owner: Repository owner (e.g., 'vercel')
        repo: Repository name (e.g., 'next.js')
        version: Specific version (e.g., 'v15.1.8') or None for latest
        topic: Filter by topic (e.g., 'routing', 'authentication')
        tokens: Maximum token count for response (100-100,000), default 10,000
        response_format: Response format (TXT or JSON), default TXT
        use_cache: Use cached results if available, default True
        api_key: Context7 API key (reads from CONTEXT7_API_KEY env if not provided)

    Returns:
        GetContextResponse with documentation content

    Raises:
        Context7AuthenticationError: Invalid or missing API key
        Context7NotFoundError: Library or version not found
        Context7ValidationError: Invalid parameters
        Context7APIError: Other API errors

    Example:
        >>> docs = get_documentation("vercel", "next.js", topic="routing", tokens=2000)
        >>> print(docs.content)
    """
    # Validate request parameters
    request = GetContextRequest(
        owner=owner,
        repo=repo,
        version=version,
        topic=topic,
        tokens=tokens,
        response_format=response_format,
    )

    # Check cache if enabled
    cache = get_cache()
    cache_key = {
        "owner": request.owner,
        "repo": request.repo,
        "version": request.version or "latest",
        "topic": request.topic or "all",
        "tokens": request.tokens,
        "format": request.response_format.value,
    }

    if use_cache:
        cached = cache.get(**cache_key)
        if cached:
            logger.info(
                f"Cache hit for {format_library_id(owner, repo)} "
                f"version={version or 'latest'} topic={topic or 'all'}"
            )
            return GetContextResponse(**cached)

    # Make API request
    logger.info(
        f"Fetching documentation for {format_library_id(owner, repo)} "
        f"version={version or 'latest'} topic={topic or 'all'} "
        f"tokens={tokens} format={response_format.value}"
    )

    with Context7Client(api_key=api_key) as client:
        # Build endpoint URL
        endpoint = f"/{request.owner}/{request.repo}"

        # Build query parameters
        params: dict[str, Any] = {
            "tokens": request.tokens,
            "format": request.response_format.value,
        }

        if request.version:
            params["version"] = request.version

        if request.topic:
            params["topic"] = request.topic

        # Execute request
        response_data = client.get(endpoint, params=params)

    # Parse response
    response = GetContextResponse(**response_data)

    # Cache the result
    if use_cache:
        cache.set(response.model_dump(), **cache_key)
        logger.debug(f"Cached documentation for {format_library_id(owner, repo)}")

    return response
