#!/usr/bin/env python3
"""
Example: Research Workflow with Perplexity API

This script demonstrates a complete research workflow combining
Search and Chat Completions APIs to research a topic and generate
a comprehensive summary with citations.
"""

import sys

sys.path.insert(0, ".ai/tools")

from perplexity import chat, search
from perplexity.exceptions import PerplexityAPIError


def research_topic(topic: str, max_sources: int = 10) -> dict:
    """
    Research a topic using Perplexity Search and Chat APIs.

    Args:
        topic: Topic to research
        max_sources: Maximum number of sources to find

    Returns:
        Dictionary with search results, summary, and citations
    """
    print(f"\n🔍 Researching: {topic}\n")

    try:
        # Step 1: Search for recent sources
        print("Step 1: Finding relevant sources...")
        search_results = search(
            query=topic,
            num_results=max_sources,
            recency_filter="month",  # Recent sources only
            language_filter=["en"],  # English only
        )

        print(f"  ✓ Found {len(search_results.results)} sources\n")

        # Display search results
        print("📚 Top Sources:")
        for i, result in enumerate(search_results.results[:5], 1):
            print(f"  {i}. {result.title}")
            print(f"     {result.url}")
            if result.snippet:
                print(f"     {result.snippet[:100]}...")
            print()

        # Step 2: Get AI-powered summary with citations
        print("Step 2: Generating comprehensive summary...")
        chat_response = chat(
            query=f"Provide a comprehensive overview of: {topic}",
            model="sonar-pro",  # Use pro model for quality
            system_message=(
                "You are a research assistant. Provide a clear, "
                "well-structured summary with key points and insights."
            ),
            max_tokens=1000,
            temperature=0.3,  # Lower temperature for factual content
            return_citations=True,
        )

        summary = chat_response.choices[0].message.content
        citations = chat_response.citations or []

        print(f"  ✓ Generated summary ({len(summary)} chars)\n")

        # Step 3: Display results
        print("=" * 80)
        print(f"RESEARCH SUMMARY: {topic}")
        print("=" * 80)
        print()
        print(summary)
        print()

        if citations:
            print("=" * 80)
            print(f"CITATIONS ({len(citations)})")
            print("=" * 80)
            print()
            for i, citation in enumerate(citations, 1):
                print(f"{i}. {citation.title or 'Untitled'}")
                print(f"   {citation.url}")
                if citation.snippet:
                    print(f"   \"{citation.snippet[:150]}...\"")
                print()

        # Return structured results
        return {
            "topic": topic,
            "search_results": [
                {
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet,
                }
                for r in search_results.results
            ],
            "summary": summary,
            "citations": [
                {
                    "title": c.title,
                    "url": c.url,
                    "snippet": c.snippet,
                }
                for c in citations
            ],
            "token_usage": (
                {
                    "prompt": chat_response.usage.prompt_tokens,
                    "completion": chat_response.usage.completion_tokens,
                    "total": chat_response.usage.total_tokens,
                }
                if chat_response.usage
                else None
            ),
        }

    except PerplexityAPIError as e:
        print(f"❌ Error: {e.message} (Status: {e.status_code})")
        if e.request_id:
            print(f"   Request ID: {e.request_id}")
        sys.exit(1)

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


def compare_topics(topic1: str, topic2: str) -> None:
    """Compare two topics side-by-side."""
    print("\n🔬 Comparative Research\n")

    # Research both topics
    research1 = research_topic(topic1, max_sources=5)
    print("\n" + "=" * 80 + "\n")
    research2 = research_topic(topic2, max_sources=5)

    # Generate comparison
    print("\n🤔 Generating comparison...")
    comparison = chat(
        query=f"Compare and contrast: {topic1} vs {topic2}",
        model="sonar-pro",
        system_message="You are a research analyst. Provide a balanced comparison.",
        return_citations=True,
    )

    print("\n" + "=" * 80)
    print(f"COMPARISON: {topic1} vs {topic2}")
    print("=" * 80)
    print()
    print(comparison.choices[0].message.content)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Research a topic using Perplexity API"
    )
    parser.add_argument("topic", help="Topic to research")
    parser.add_argument(
        "--max-sources",
        type=int,
        default=10,
        help="Maximum number of sources to find",
    )
    parser.add_argument(
        "--compare-with",
        help="Compare with another topic",
    )

    args = parser.parse_args()

    if args.compare_with:
        compare_topics(args.topic, args.compare_with)
    else:
        research_topic(args.topic, args.max_sources)


if __name__ == "__main__":
    main()
