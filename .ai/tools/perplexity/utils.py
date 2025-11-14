"""
Utility functions for Perplexity API integration.

This module provides helper functions for common operations like environment
variable management, logging, and data transformation.
"""

import os
import re
from datetime import datetime
from typing import Any


def get_api_key() -> str:
    """
    Get the Perplexity API key from environment variables.

    Returns:
        The API key string

    Raises:
        ValueError: If PERPLEXITY_API_KEY is not set
    """
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise ValueError(
            "PERPLEXITY_API_KEY environment variable is not set. "
            "Please set it in your .env file or export it in your shell."
        )
    return api_key


def validate_api_key_format(api_key: str) -> bool:
    """
    Validate the format of a Perplexity API key.

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


def format_date_for_api(date: datetime | str | None) -> str | None:
    """
    Format a date for Perplexity API requests (MM/DD/YYYY format).

    Args:
        date: datetime object, string, or None

    Returns:
        Date formatted as MM/DD/YYYY or None

    Raises:
        ValueError: If date string is not in valid format
    """
    if date is None:
        return None

    if isinstance(date, datetime):
        return date.strftime("%m/%d/%Y")

    if isinstance(date, str):
        # Validate MM/DD/YYYY format
        pattern = r"^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\d{4}$"
        if not re.match(pattern, date):
            raise ValueError(
                f"Date string must be in MM/DD/YYYY format, got: {date}"
            )
        return date

    raise ValueError(f"Date must be datetime object or string, got: {type(date)}")


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


def validate_language_code(code: str) -> bool:
    """
    Validate an ISO 639-1 language code.

    Args:
        code: Two-letter language code (e.g., 'en', 'fr')

    Returns:
        True if valid

    Raises:
        ValueError: If code is not a valid ISO 639-1 format
    """
    if not code or not isinstance(code, str):
        raise ValueError("Language code must be a non-empty string")

    if not re.match(r"^[a-z]{2}$", code):
        raise ValueError(
            f"Language code must be a two-letter lowercase ISO 639-1 code, got: {code}"
        )

    return True


def validate_domain(domain: str) -> bool:
    """
    Validate a domain filter pattern.

    Args:
        domain: Domain pattern (e.g., 'example.com', '*.example.com')

    Returns:
        True if valid

    Raises:
        ValueError: If domain is not valid
    """
    if not domain or not isinstance(domain, str):
        raise ValueError("Domain must be a non-empty string")

    # Basic domain validation (supports wildcards)
    pattern = r"^(\*\.)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, domain):
        raise ValueError(f"Invalid domain format: {domain}")

    return True
