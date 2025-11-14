#!/usr/bin/env python3
"""
Example: Research Workflow using Exa Search API.

Demonstrates how to use search and get_contents for research tasks.
"""

import sys
import os

# Add tools directory to path
tools_path = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, tools_path)

from exa import search_web, get_contents, SearchType


def research_topic(topic: str, num_sources: int = 5) -> None:
    """
    Research a topic using Exa Search.

    Args:
        topic: Topic to research
        num_sources: Number of sources to retrieve
    """
    print(f"Researching: {topic}\n")
    print("=" * 80)

    # Step 1: Search for relevant sources
    print(f"\n1. Searching for top {num_sources} sources...")
    search_results = search_web(
        query=topic,
        type=SearchType.NEURAL,
        num_results=num_sources,
        use_autoprompt=True,
    )

    if search_results.autoprompt_string:
        print(f"   Enhanced query: {search_results.autoprompt_string}")

    print(f"   Found {len(search_results.results)} results\n")

    # Step 2: Get full content from top sources
    print("2. Retrieving full content from sources...")
    urls = [result.url for result in search_results.results]

    content_results = get_contents(
        urls=urls,
        text=True,
        summary=True,
    )

    # Step 3: Display research summary
    print("\n3. Research Summary\n")
    print("=" * 80)

    for i, (search_result, content) in enumerate(
        zip(search_results.results, content_results.results), 1
    ):
        print(f"\n{i}. {search_result.title or 'No title'}")
        print(f"   URL: {search_result.url}")

        if search_result.score:
            print(f"   Relevance: {search_result.score:.2%}")

        if content.summary:
            print(f"\n   Summary:")
            print(f"   {content.summary}\n")

        if content.text:
            word_count = len(content.text.split())
            print(f"   Content: {word_count} words")

    print("\n" + "=" * 80)
    print(f"\nResearch complete! Retrieved {len(content_results.results)} sources.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        topic = " ".join(sys.argv[1:])
    else:
        topic = "Latest developments in AI agents"

    research_topic(topic)
