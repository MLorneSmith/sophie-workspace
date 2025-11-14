"""
Exa Get Contents API endpoint implementation.

This module provides the get_contents function for retrieving full content
from specific URLs using the Exa API.
"""

from typing import Any

from .client import ExaClient
from .models import GetContentsRequest, GetContentsResponse, ContentResult, LivecrawlOption


def get_contents(
    urls: list[str],
    text: bool = False,
    highlights: bool = False,
    summary: bool = False,
    livecrawl: LivecrawlOption | None = None,
    subpages: int | None = None,
    subpage_target: int | None = None,
    api_key: str | None = None,
) -> GetContentsResponse:
    """
    Retrieve full content from specific URLs.

    Args:
        urls: List of URLs to fetch content for
        text: Include cleaned HTML text content
        highlights: Include highlighted snippets
        summary: Include AI-generated summary
        livecrawl: Livecrawl configuration (always, never, fallback)
        subpages: Number of subpages to crawl (0-10)
        subpage_target: Target number of subpages to return (0-10)
        api_key: Optional API key (defaults to EXA_API_KEY env var)

    Returns:
        GetContentsResponse with content results

    Raises:
        ExaAPIError: If the API request fails
        ValidationError: If request parameters are invalid

    Example:
        >>> content = get_contents(
        ...     ["https://example.com"],
        ...     text=True,
        ...     summary=True
        ... )
        >>> for result in content.results:
        ...     print(f"{result.title}: {len(result.text)} chars")
    """
    # Create and validate request
    request = GetContentsRequest(
        urls=urls,
        text=text,
        highlights=highlights,
        summary=summary,
        livecrawl=livecrawl,
        subpages=subpages,
        subpage_target=subpage_target,
    )

    # Convert to API format
    request_data = _build_get_contents_request_data(request)

    # Execute request
    with ExaClient(api_key=api_key) as client:
        response_data = client.get_contents(request_data)

    # Parse and return response
    return _parse_get_contents_response(response_data)


def _build_get_contents_request_data(request: GetContentsRequest) -> dict[str, Any]:
    """
    Convert GetContentsRequest model to API request format.

    Args:
        request: Validated GetContentsRequest instance

    Returns:
        Dictionary in Exa API format
    """
    data: dict[str, Any] = {
        "urls": request.urls,
    }

    # Add content options
    if request.text:
        data["text"] = True

    if request.highlights:
        data["highlights"] = True

    if request.summary:
        data["summary"] = True

    if request.livecrawl:
        data["livecrawl"] = request.livecrawl.value

    if request.subpages is not None:
        data["subpages"] = request.subpages

    if request.subpage_target is not None:
        data["subpageTarget"] = request.subpage_target

    return data


def _parse_get_contents_response(response_data: dict[str, Any]) -> GetContentsResponse:
    """
    Parse API response into GetContentsResponse model.

    Args:
        response_data: Raw API response dictionary

    Returns:
        Validated GetContentsResponse instance
    """
    # Parse results
    results = []
    for result_data in response_data.get("results", []):
        result = ContentResult(
            url=result_data["url"],
            id=result_data["id"],
            title=result_data.get("title"),
            text=result_data.get("text"),
            highlights=result_data.get("highlights"),
            summary=result_data.get("summary"),
            author=result_data.get("author"),
            published_date=result_data.get("publishedDate"),
        )
        results.append(result)

    return GetContentsResponse(
        results=results,
        request_id=response_data.get("requestId"),
    )
