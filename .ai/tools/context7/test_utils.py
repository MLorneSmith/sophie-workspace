"""
Unit tests for Context7 utility functions.

Tests API key validation, library ID formatting, and other utilities.
"""

import os

import pytest

from .utils import (
    format_library_id,
    get_api_key,
    parse_library_id,
    redact_api_key,
    sanitize_query,
    validate_api_key_format,
)


class TestGetApiKey:
    """Tests for get_api_key() function."""

    def test_get_api_key_from_env(self, monkeypatch):
        """Test retrieving API key from environment."""
        monkeypatch.setenv("CONTEXT7_API_KEY", "test-api-key-12345")
        api_key = get_api_key()
        assert api_key == "test-api-key-12345"

    def test_get_api_key_not_set(self, monkeypatch):
        """Test error when API key not set."""
        monkeypatch.delenv("CONTEXT7_API_KEY", raising=False)
        with pytest.raises(ValueError, match="CONTEXT7_API_KEY environment variable not set"):
            get_api_key()


class TestValidateApiKeyFormat:
    """Tests for validate_api_key_format() function."""

    def test_valid_api_key(self):
        """Test validation passes for valid API keys."""
        assert validate_api_key_format("sk-1234567890")
        assert validate_api_key_format("test-api-key-with-sufficient-length")

    def test_invalid_api_key_too_short(self):
        """Test validation fails for short keys."""
        assert not validate_api_key_format("short")
        assert not validate_api_key_format("12345")

    def test_invalid_api_key_empty(self):
        """Test validation fails for empty keys."""
        assert not validate_api_key_format("")
        assert not validate_api_key_format("   ")

    def test_invalid_api_key_none(self):
        """Test validation fails for None."""
        assert not validate_api_key_format(None)

    def test_invalid_api_key_wrong_type(self):
        """Test validation fails for non-string types."""
        assert not validate_api_key_format(12345)
        assert not validate_api_key_format([])


class TestRedactApiKey:
    """Tests for redact_api_key() function."""

    def test_redact_normal_key(self):
        """Test redacting a normal-length API key."""
        redacted = redact_api_key("sk-1234567890abcdef")
        assert redacted == "sk-1...cdef"
        assert "234567890abcd" not in redacted

    def test_redact_long_key(self):
        """Test redacting a long API key."""
        key = "this-is-a-very-long-api-key-with-many-characters"
        redacted = redact_api_key(key)
        assert redacted == "this...ters"
        assert "is-a-very-long-api-key-with-many-charac" not in redacted

    def test_redact_short_key(self):
        """Test redacting a short key (less than 8 chars)."""
        assert redact_api_key("short") == "****"
        assert redact_api_key("1234567") == "****"

    def test_redact_empty_key(self):
        """Test redacting empty or None key."""
        assert redact_api_key("") == "****"
        assert redact_api_key(None) == "****"


class TestFormatLibraryId:
    """Tests for format_library_id() function."""

    def test_format_library_id(self):
        """Test formatting owner and repo into library ID."""
        assert format_library_id("vercel", "next.js") == "/vercel/next.js"
        assert format_library_id("facebook", "react") == "/facebook/react"

    def test_format_with_special_chars(self):
        """Test formatting with special characters."""
        assert format_library_id("owner-name", "repo.name") == "/owner-name/repo.name"


class TestParseLibraryId:
    """Tests for parse_library_id() function."""

    def test_parse_library_id_with_slash(self):
        """Test parsing library ID with leading slash."""
        owner, repo = parse_library_id("/vercel/next.js")
        assert owner == "vercel"
        assert repo == "next.js"

    def test_parse_library_id_without_slash(self):
        """Test parsing library ID without leading slash."""
        owner, repo = parse_library_id("vercel/next.js")
        assert owner == "vercel"
        assert repo == "next.js"

    def test_parse_library_id_invalid_format(self):
        """Test parsing invalid library ID format."""
        with pytest.raises(ValueError, match="Invalid library ID format"):
            parse_library_id("invalid")

        with pytest.raises(ValueError, match="Invalid library ID format"):
            parse_library_id("too/many/parts")

    def test_parse_library_id_empty_parts(self):
        """Test parsing library ID with empty parts."""
        with pytest.raises(ValueError, match="Invalid library ID"):
            parse_library_id("/owner/")

        with pytest.raises(ValueError, match="Invalid library ID"):
            parse_library_id("//repo")


class TestSanitizeQuery:
    """Tests for sanitize_query() function."""

    def test_sanitize_normal_query(self):
        """Test sanitizing normal query string."""
        assert sanitize_query("next.js") == "next.js"
        assert sanitize_query("react framework") == "react framework"

    def test_sanitize_query_with_whitespace(self):
        """Test sanitizing query with extra whitespace."""
        assert sanitize_query("  next.js  ") == "next.js"
        assert sanitize_query("react   framework") == "react framework"
        assert sanitize_query("  multiple   spaces   here  ") == "multiple spaces here"

    def test_sanitize_query_empty(self):
        """Test sanitizing empty query."""
        assert sanitize_query("") == ""
        assert sanitize_query("   ") == ""

    def test_sanitize_query_with_newlines(self):
        """Test sanitizing query with newlines."""
        assert sanitize_query("next\njs") == "next js"
        assert sanitize_query("react\n\nframework") == "react framework"


class TestIntegration:
    """Integration tests for utility functions."""

    def test_format_parse_roundtrip(self):
        """Test formatting and parsing library ID roundtrip."""
        original_owner = "vercel"
        original_repo = "next.js"

        # Format to library ID
        library_id = format_library_id(original_owner, original_repo)
        assert library_id == "/vercel/next.js"

        # Parse back to owner and repo
        parsed_owner, parsed_repo = parse_library_id(library_id)
        assert parsed_owner == original_owner
        assert parsed_repo == original_repo

    def test_api_key_validation_and_redaction(self, monkeypatch):
        """Test API key validation and redaction together."""
        monkeypatch.setenv("CONTEXT7_API_KEY", "sk-1234567890abcdef")

        # Get API key
        api_key = get_api_key()

        # Validate format
        assert validate_api_key_format(api_key)

        # Redact for logging
        redacted = redact_api_key(api_key)
        assert redacted == "sk-1...cdef"
        assert api_key != redacted
