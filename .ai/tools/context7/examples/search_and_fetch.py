#!/usr/bin/env python3
"""
Example showing how to search for libraries and then fetch their documentation.

This demonstrates the typical workflow: search -> select -> fetch docs.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from context7 import get_documentation, search_libraries


def main() -> None:
    """Search for libraries and fetch documentation for the top result."""
    query = "next.js"

    print(f"Searching for libraries matching '{query}'...")
    print("=" * 80)

    # Search for libraries
    results = search_libraries(query)

    if not results.results:
        print("No libraries found.")
        return

    # Display top 3 results
    print(f"\nFound {results.total} libraries. Top 3 results:\n")
    for i, lib in enumerate(results.results[:3], 1):
        print(f"{i}. {lib.id}")
        print(f"   Title: {lib.title}")
        if lib.description:
            print(f"   Description: {lib.description}")
        print(f"   Stars: {lib.stars}, Trust: {lib.trust_score}, Score: {lib.benchmark_score}")
        print(f"   State: {lib.state.value}")
        if lib.versions:
            print(f"   Versions: {len(lib.versions)} available")
        print()

    # Fetch documentation for top result
    top_lib = results.results[0]
    owner, repo = top_lib.id.lstrip("/").split("/", 1)

    print("=" * 80)
    print(f"Fetching documentation for {top_lib.id}...")
    print("=" * 80 + "\n")

    docs = get_documentation(
        owner=owner,
        repo=repo,
        tokens=2000,  # Get a reasonable amount of documentation
    )

    print(f"Library: {docs.library}")
    print(f"Version: {docs.version}")
    print(f"Tokens: {docs.tokens}")
    print("\n" + "=" * 80)
    print("Documentation Preview (first 500 characters):")
    print("=" * 80 + "\n")
    print(docs.content[:500] + "..." if len(docs.content) > 500 else docs.content)


if __name__ == "__main__":
    main()
