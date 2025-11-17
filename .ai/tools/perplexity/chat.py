"""
Chat Completions functionality for Perplexity API.

This module provides high-level functions for interacting with the
Perplexity Chat Completions API (Sonar models) for grounded AI responses.
"""

import json
import logging
from typing import Iterator

from .client import PerplexityClient
from .models import ChatMessage, ChatRequest, ChatResponse
from .utils import get_api_key

logger = logging.getLogger(__name__)


def chat(
    query: str,
    model: str = "sonar",
    system_message: str | None = None,
    conversation_history: list[dict[str, str]] | None = None,
    stream: bool = False,
    max_tokens: int | None = None,
    temperature: float | None = None,
    top_p: float | None = None,
    return_citations: bool = True,
    return_images: bool = False,
    api_key: str | None = None,
    timeout: int = 60,
) -> ChatResponse | Iterator[dict]:
    """
    Get an AI-powered response using the Perplexity Chat Completions API.

    Args:
        query: User query or question
        model: Model to use (sonar, sonar-pro, sonar-reasoning)
        system_message: Optional system message to set context
        conversation_history: Previous messages in conversation (list of {role, content} dicts)
        stream: Enable streaming responses
        max_tokens: Maximum tokens in response
        temperature: Sampling temperature (0-2)
        top_p: Nucleus sampling threshold (0-1)
        return_citations: Return citations for grounded responses
        return_images: Return images in the response
        api_key: Perplexity API key (uses env var if not provided)
        timeout: Request timeout in seconds

    Returns:
        ChatResponse with answer and citations, or iterator of streaming chunks

    Raises:
        ValueError: If parameters are invalid
        PerplexityAPIError: If API request fails

    Example:
        >>> from perplexity import chat
        >>> response = chat(
        ...     query="What are the latest developments in quantum computing?",
        ...     model="sonar-pro",
        ...     return_citations=True
        ... )
        >>> print(response.choices[0].message.content)
        >>> for citation in response.citations:
        ...     print(f"- {citation.title}: {citation.url}")
    """
    # Build messages array
    messages = []

    # Add system message if provided
    if system_message:
        messages.append(ChatMessage(role="system", content=system_message))

    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            messages.append(
                ChatMessage(
                    role=msg.get("role", "user"),
                    content=msg.get("content", ""),
                )
            )

    # Add current user query
    messages.append(ChatMessage(role="user", content=query))

    # Create and validate request model
    request = ChatRequest(
        model=model,
        messages=messages,
        stream=stream,
        max_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p,
        return_citations=return_citations,
        return_images=return_images,
    )

    logger.info(
        "Executing chat: model=%s, messages=%d, stream=%s",
        model,
        len(messages),
        stream,
    )

    # Execute chat request
    with PerplexityClient(api_key=api_key, timeout=timeout) as client:
        # Convert request to dict, excluding None values
        request_data = request.model_dump(exclude_none=True)

        try:
            if stream:
                # Return streaming response
                response = client.chat(request_data, stream=True)
                return _stream_response(response)
            else:
                # Return complete response
                response_data = client.chat(request_data, stream=False)

                # Parse response into Pydantic model
                response = ChatResponse(**response_data)

                logger.info(
                    "Chat completed: model=%s, tokens=%s, citations=%d",
                    response.model,
                    response.usage.total_tokens if response.usage else "N/A",
                    len(response.citations) if response.citations else 0,
                )

                return response

        except Exception as e:
            logger.error("Chat failed: %s", str(e))
            raise


def _stream_response(response) -> Iterator[dict]:
    """
    Process streaming response from chat API.

    Args:
        response: Streaming Response object

    Yields:
        Chunks of the streaming response as dicts

    Example:
        >>> for chunk in chat(query="test", stream=True):
        ...     if "choices" in chunk and chunk["choices"]:
        ...         delta = chunk["choices"][0].get("delta", {})
        ...         if "content" in delta:
        ...             print(delta["content"], end="", flush=True)
    """
    try:
        for line in response.iter_lines():
            if line:
                # Decode bytes to string
                line_str = line.decode("utf-8")

                # Skip empty lines and "data: " prefix
                if line_str.startswith("data: "):
                    data_str = line_str[6:]

                    # Skip [DONE] marker
                    if data_str.strip() == "[DONE]":
                        break

                    try:
                        # Parse JSON chunk
                        chunk = json.loads(data_str)
                        yield chunk
                    except json.JSONDecodeError:
                        logger.warning("Failed to decode streaming chunk: %s", data_str)
                        continue

    except Exception as e:
        logger.error("Streaming error: %s", str(e))
        raise
    finally:
        response.close()
