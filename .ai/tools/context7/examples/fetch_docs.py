#!/usr/bin/env python3
"""
Simple example of fetching library documentation using Context7 API.

This script demonstrates basic usage of the get_documentation() function.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from context7 import get_documentation


def main() -> None:
    """Fetch and display documentation for Next.js routing."""
    print("Fetching Next.js routing documentation...")
    print("=" * 80)

    # Fetch documentation with topic filter
    docs = get_documentation(
        owner="vercel",
        repo="next.js",
        topic="routing",
        tokens=3000,  # Limit to 3000 tokens for focused content
    )

    # Display results
    print(f"\nLibrary: {docs.library}")
    print(f"Version: {docs.version}")
    print(f"Topic: {docs.topic}")
    print(f"Tokens: {docs.tokens}")
    print("\n" + "=" * 80)
    print("Documentation Content:")
    print("=" * 80 + "\n")
    print(docs.content)


if __name__ == "__main__":
    main()
