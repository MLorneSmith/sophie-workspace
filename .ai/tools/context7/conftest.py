"""
Pytest configuration and fixtures for Context7 tests.
"""

import pytest


@pytest.fixture
def mock_api_key():
    """Fixture providing a mock API key for testing."""
    return "test-api-key-1234567890abcdef"


@pytest.fixture
def sample_library_data():
    """Fixture providing sample library data for testing."""
    return {
        "id": "/vercel/next.js",
        "title": "Next.js",
        "description": "The React Framework for Production",
        "branch": "canary",
        "stars": 125000,
        "trust_score": 95.5,
        "benchmark_score": 92.3,
        "versions": [
            {"version": "v15.1.8", "state": "finalized"},
            {"version": "v15.1.7", "state": "finalized"},
        ],
        "tags": ["react", "framework", "ssr"],
        "state": "finalized",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T12:30:00Z",
    }


@pytest.fixture
def sample_documentation_response():
    """Fixture providing sample documentation response for testing."""
    return {
        "library": "/vercel/next.js",
        "version": "v15.1.8",
        "topic": "routing",
        "tokens": 2500,
        "content": "# Routing\n\nNext.js routing documentation...",
        "chunks": None,
        "metadata": {"source": "api"},
    }
