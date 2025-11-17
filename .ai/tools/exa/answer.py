"""
Exa Answer API endpoint implementation.

This module provides the get_answer function for generating AI-powered answers
with citations using the Exa API.
"""

from typing import Any

from .client import ExaClient
from .models import AnswerRequest, AnswerResponse, Citation


def get_answer(
    query: str,
    text: bool = False,
    stream: bool = False,
    api_key: str | None = None,
) -> AnswerResponse:
    """
    Generate an AI-powered answer with citations.

    Args:
        query: Question to answer
        text: Include full text content in citations
        stream: Enable streaming responses (not yet supported)
        api_key: Optional API key (defaults to EXA_API_KEY env var)

    Returns:
        AnswerResponse with answer and citations

    Raises:
        ExaAPIError: If the API request fails
        ValidationError: If request parameters are invalid

    Example:
        >>> answer = get_answer("What is the latest in AI research?")
        >>> print(answer.answer)
        >>> for citation in answer.citations:
        ...     print(f"Source: {citation.url}")

    Note:
        Streaming responses are not yet fully implemented in this version.
    """
    # Create and validate request
    request = AnswerRequest(
        query=query,
        text=text,
        stream=stream,
    )

    # Convert to API format
    request_data = _build_answer_request_data(request)

    # Execute request
    with ExaClient(api_key=api_key) as client:
        response_data = client.get_answer(request_data)

    # Parse and return response
    return _parse_answer_response(response_data)


def _build_answer_request_data(request: AnswerRequest) -> dict[str, Any]:
    """
    Convert AnswerRequest model to API request format.

    Args:
        request: Validated AnswerRequest instance

    Returns:
        Dictionary in Exa API format
    """
    data: dict[str, Any] = {
        "query": request.query,
    }

    # Add optional fields
    if request.text:
        data["text"] = True

    if request.stream:
        data["stream"] = True

    return data


def _parse_answer_response(response_data: dict[str, Any]) -> AnswerResponse:
    """
    Parse API response into AnswerResponse model.

    Args:
        response_data: Raw API response dictionary

    Returns:
        Validated AnswerResponse instance
    """
    # Parse citations
    citations = []
    for citation_data in response_data.get("citations", []):
        citation = Citation(
            url=citation_data["url"],
            title=citation_data.get("title"),
            text=citation_data.get("text"),
        )
        citations.append(citation)

    return AnswerResponse(
        answer=response_data["answer"],
        citations=citations,
        request_id=response_data.get("requestId"),
    )
