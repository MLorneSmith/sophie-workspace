"""
Utility functions for Context7 API integration.

This module provides helper functions for API key management, library ID formatting,
and other common operations.
"""

import os
import re
from pathlib import Path


def get_api_key() -> str:
    """
    Retrieve Context7 API key from environment.

    Attempts to load from .env files in the following order:
    1. .ai/.env
    2. Project root .env
    3. Environment variable CONTEXT7_API_KEY

    Returns:
        API key string

    Raises:
        ValueError: If CONTEXT7_API_KEY environment variable is not set
    """
    # Try to load from .env files
    try:
        from dotenv import load_dotenv

        # Try .ai/.env first
        ai_env = Path(__file__).parent.parent / ".env"
        if ai_env.exists():
            load_dotenv(ai_env)

        # Try project root .env
        project_root = Path(__file__).parent.parent.parent.parent
        root_env = project_root / ".env"
        if root_env.exists():
            load_dotenv(root_env)
    except ImportError:
        # dotenv not available, just use environment variables
        pass

    api_key = os.getenv("CONTEXT7_API_KEY")
    if not api_key:
        raise ValueError(
            "CONTEXT7_API_KEY environment variable not set. "
            "Please set it to your Context7 API key."
        )
    return api_key


def validate_api_key_format(api_key: str) -> bool:
    """
    Validate API key format.

    Args:
        api_key: API key to validate

    Returns:
        True if valid format, False otherwise
    """
    if not api_key or not isinstance(api_key, str):
        return False

    # API key should be non-empty string with minimum length
    return len(api_key.strip()) >= 10


def redact_api_key(api_key: str) -> str:
    """
    Redact API key for logging, showing only first and last 4 characters.

    Args:
        api_key: API key to redact

    Returns:
        Redacted API key string (e.g., "sk-1234...7890")
    """
    if not api_key or len(api_key) < 8:
        return "****"

    return f"{api_key[:4]}...{api_key[-4:]}"


def format_library_id(owner: str, repo: str) -> str:
    """
    Format owner and repo into library ID.

    Args:
        owner: Repository owner
        repo: Repository name

    Returns:
        Library ID in format "/owner/repo"
    """
    return f"/{owner}/{repo}"


def parse_library_id(library_id: str) -> tuple[str, str]:
    """
    Parse library ID into owner and repo components.

    Args:
        library_id: Library ID in format "/owner/repo"

    Returns:
        Tuple of (owner, repo)

    Raises:
        ValueError: If library_id format is invalid
    """
    # Remove leading slash if present
    clean_id = library_id.lstrip("/")

    parts = clean_id.split("/")
    if len(parts) != 2:
        raise ValueError(
            f"Invalid library ID format: {library_id}. "
            "Expected format: /owner/repo or owner/repo"
        )

    owner, repo = parts
    if not owner or not repo:
        raise ValueError(f"Invalid library ID: owner and repo must be non-empty")

    return owner, repo


def sanitize_query(query: str) -> str:
    """
    Sanitize search query string.

    Args:
        query: Raw query string

    Returns:
        Sanitized query string
    """
    # Strip whitespace
    clean = query.strip()

    # Remove excessive whitespace
    clean = re.sub(r"\s+", " ", clean)

    return clean
