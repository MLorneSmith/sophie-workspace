"""
Exa Find Similar Links API endpoint implementation.

This module provides the find_similar function for discovering pages similar
to a given URL using the Exa API.
"""

from datetime import datetime
from typing import Any

from .client import ExaClient
from .models import FindSimilarRequest, FindSimilarResponse, SearchResult, ContentOptions
from .utils import format_datetime_for_api


def find_similar(
    url: str,
    num_results: int = 10,
    category: str | None = None,
    include_domains: list[str] | None = None,
    exclude_domains: list[str] | None = None,
    start_crawl_date: datetime | None = None,
    end_crawl_date: datetime | None = None,
    start_published_date: datetime | None = None,
    end_published_date: datetime | None = None,
    text: bool = False,
    highlights: bool = False,
    summary: bool = False,
    api_key: str | None = None,
) -> FindSimilarResponse:
    """
    Find pages similar to a given URL.

    Args:
        url: Source URL to find similar pages for
        num_results: Number of results to return (1-1000)
        category: Content category filter
        include_domains: Only include results from these domains
        exclude_domains: Exclude results from these domains
        start_crawl_date: Earliest crawl date for results
        end_crawl_date: Latest crawl date for results
        start_published_date: Earliest publication date for results
        end_published_date: Latest publication date for results
        text: Include full text content in results
        highlights: Include highlighted snippets in results
        summary: Include AI-generated summaries in results
        api_key: Optional API key (defaults to EXA_API_KEY env var)

    Returns:
        FindSimilarResponse with similar pages

    Raises:
        ExaAPIError: If the API request fails
        ValidationError: If request parameters are invalid

    Example:
        >>> similar = find_similar(
        ...     "https://example.com",
        ...     num_results=5,
        ...     text=True
        ... )
        >>> for result in similar.results:
        ...     print(f"{result.title}: {result.url}")
    """
    # Build content options if any content retrieval is requested
    contents = None
    if text or highlights or summary:
        contents = ContentOptions(text=text, highlights=highlights, summary=summary)

    # Create and validate request
    request = FindSimilarRequest(
        url=url,
        num_results=num_results,
        category=category,
        include_domains=include_domains,
        exclude_domains=exclude_domains,
        start_crawl_date=start_crawl_date,
        end_crawl_date=end_crawl_date,
        start_published_date=start_published_date,
        end_published_date=end_published_date,
        contents=contents,
    )

    # Convert to API format
    request_data = _build_find_similar_request_data(request)

    # Execute request
    with ExaClient(api_key=api_key) as client:
        response_data = client.find_similar(request_data)

    # Parse and return response
    return _parse_find_similar_response(response_data)


def _build_find_similar_request_data(request: FindSimilarRequest) -> dict[str, Any]:
    """
    Convert FindSimilarRequest model to API request format.

    Args:
        request: Validated FindSimilarRequest instance

    Returns:
        Dictionary in Exa API format
    """
    data: dict[str, Any] = {
        "url": request.url,
        "numResults": request.num_results,
    }

    # Add optional fields
    if request.category:
        data["category"] = request.category

    if request.include_domains:
        data["includeDomains"] = request.include_domains

    if request.exclude_domains:
        data["excludeDomains"] = request.exclude_domains

    if request.start_crawl_date:
        data["startCrawlDate"] = format_datetime_for_api(request.start_crawl_date)

    if request.end_crawl_date:
        data["endCrawlDate"] = format_datetime_for_api(request.end_crawl_date)

    if request.start_published_date:
        data["startPublishedDate"] = format_datetime_for_api(request.start_published_date)

    if request.end_published_date:
        data["endPublishedDate"] = format_datetime_for_api(request.end_published_date)

    # Add content options if present
    if request.contents:
        contents_data: dict[str, Any] = {}

        if request.contents.text:
            contents_data["text"] = True

        if request.contents.highlights:
            contents_data["highlights"] = True

        if request.contents.summary:
            contents_data["summary"] = True

        if request.contents.livecrawl:
            contents_data["livecrawl"] = request.contents.livecrawl.value

        if request.contents.subpages is not None:
            contents_data["subpages"] = request.contents.subpages

        if request.contents.subpage_target is not None:
            contents_data["subpageTarget"] = request.contents.subpage_target

        if contents_data:
            data["contents"] = contents_data

    return data


def _parse_find_similar_response(response_data: dict[str, Any]) -> FindSimilarResponse:
    """
    Parse API response into FindSimilarResponse model.

    Args:
        response_data: Raw API response dictionary

    Returns:
        Validated FindSimilarResponse instance
    """
    # Parse results
    results = []
    for result_data in response_data.get("results", []):
        result = SearchResult(
            url=result_data["url"],
            title=result_data.get("title"),
            id=result_data["id"],
            score=result_data.get("score"),
            published_date=result_data.get("publishedDate"),
            author=result_data.get("author"),
            text=result_data.get("text"),
            highlights=result_data.get("highlights"),
            highlight_scores=result_data.get("highlightScores"),
            summary=result_data.get("summary"),
        )
        results.append(result)

    return FindSimilarResponse(
        results=results,
        request_id=response_data.get("requestId"),
    )
