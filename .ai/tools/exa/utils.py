"""
Utility functions for Exa Search API integration.

This module provides helper functions for common operations like environment
variable management, logging, and data transformation.
"""

import os
from typing import Any


def get_api_key() -> str:
    """
    Get the Exa API key from environment variables.

    Returns:
        The API key string

    Raises:
        ValueError: If EXA_API_KEY is not set
    """
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        raise ValueError(
            "EXA_API_KEY environment variable is not set. "
            "Please set it in your .env file or export it in your shell."
        )
    return api_key


def validate_api_key_format(api_key: str) -> bool:
    """
    Validate the format of an Exa API key.

    Args:
        api_key: The API key to validate

    Returns:
        True if the API key format is valid

    Raises:
        ValueError: If the API key format is invalid
    """
    if not api_key or not isinstance(api_key, str):
        raise ValueError("API key must be a non-empty string")

    if len(api_key) < 10:
        raise ValueError("API key appears to be too short")

    return True


def redact_api_key(api_key: str) -> str:
    """
    Redact an API key for logging purposes.

    Args:
        api_key: The API key to redact

    Returns:
        Redacted API key showing only first and last 4 characters
    """
    if len(api_key) <= 8:
        return "****"
    return f"{api_key[:4]}...{api_key[-4:]}"


def format_datetime_for_api(dt: Any) -> str | None:
    """
    Format a datetime object for Exa API requests.

    Args:
        dt: datetime object or None

    Returns:
        ISO 8601 formatted string or None
    """
    if dt is None:
        return None

    if hasattr(dt, "isoformat"):
        return dt.isoformat()

    return str(dt)


def parse_list_argument(value: str | list[str] | None) -> list[str] | None:
    """
    Parse a list argument that might be a comma-separated string.

    Args:
        value: String, list, or None

    Returns:
        List of strings or None
    """
    if value is None:
        return None

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]

    return None
