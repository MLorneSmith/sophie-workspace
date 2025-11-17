"""Tests for utility functions."""

import os
from datetime import datetime

import pytest

from ..utils import (
    format_date_for_api,
    get_api_key,
    parse_list_argument,
    redact_api_key,
    validate_api_key_format,
    validate_domain,
    validate_language_code,
)


class TestAPIKeyFunctions:
    """Test API key utility functions."""

    def test_validate_api_key_format_valid(self):
        """Test valid API key format."""
        assert validate_api_key_format("valid_api_key_123456789")

    def test_validate_api_key_format_too_short(self):
        """Test API key too short."""
        with pytest.raises(ValueError, match="too short"):
            validate_api_key_format("short")

    def test_validate_api_key_format_empty(self):
        """Test empty API key."""
        with pytest.raises(ValueError):
            validate_api_key_format("")

    def test_redact_api_key(self):
        """Test API key redaction."""
        api_key = "test_api_key_12345678"
        redacted = redact_api_key(api_key)
        assert redacted == "test...5678"

    def test_redact_short_api_key(self):
        """Test redacting short API key."""
        assert redact_api_key("short") == "****"


class TestDateFormatting:
    """Test date formatting functions."""

    def test_format_datetime_object(self):
        """Test formatting datetime object."""
        dt = datetime(2025, 3, 15)
        formatted = format_date_for_api(dt)
        assert formatted == "03/15/2025"

    def test_format_valid_string(self):
        """Test formatting valid date string."""
        formatted = format_date_for_api("01/15/2025")
        assert formatted == "01/15/2025"

    def test_format_invalid_string(self):
        """Test invalid date string format."""
        with pytest.raises(ValueError, match="MM/DD/YYYY"):
            format_date_for_api("2025-01-15")

    def test_format_none(self):
        """Test formatting None."""
        assert format_date_for_api(None) is None


class TestListParsing:
    """Test list argument parsing."""

    def test_parse_comma_separated(self):
        """Test parsing comma-separated string."""
        result = parse_list_argument("a,b,c")
        assert result == ["a", "b", "c"]

    def test_parse_with_spaces(self):
        """Test parsing with spaces."""
        result = parse_list_argument("a, b , c")
        assert result == ["a", "b", "c"]

    def test_parse_list(self):
        """Test parsing already a list."""
        result = parse_list_argument(["a", "b", "c"])
        assert result == ["a", "b", "c"]

    def test_parse_none(self):
        """Test parsing None."""
        assert parse_list_argument(None) is None


class TestLanguageValidation:
    """Test language code validation."""

    def test_valid_language_code(self):
        """Test valid language codes."""
        assert validate_language_code("en")
        assert validate_language_code("fr")

    def test_invalid_uppercase(self):
        """Test uppercase is invalid."""
        with pytest.raises(ValueError):
            validate_language_code("EN")

    def test_invalid_length(self):
        """Test invalid length."""
        with pytest.raises(ValueError):
            validate_language_code("eng")


class TestDomainValidation:
    """Test domain validation."""

    def test_valid_domain(self):
        """Test valid domains."""
        assert validate_domain("example.com")
        assert validate_domain("subdomain.example.com")
        assert validate_domain("*.example.com")

    def test_invalid_domain(self):
        """Test invalid domains."""
        with pytest.raises(ValueError):
            validate_domain("not a domain")
