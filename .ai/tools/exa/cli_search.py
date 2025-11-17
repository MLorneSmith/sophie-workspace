#!/usr/bin/env python3
"""
CLI script for Exa Search API.

Provides command-line access to semantic web search capabilities.
"""

import argparse
import json
import sys
from datetime import datetime

from .models import SearchType
from .search import search_web


def parse_date(date_string: str) -> datetime:
    """Parse date string in ISO format."""
    try:
        return datetime.fromisoformat(date_string)
    except ValueError as e:
        raise ValueError(f"Invalid date format: {date_string}. Use ISO format (YYYY-MM-DD)") from e


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Search the web using Exa's semantic search API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "AI agents and automation" --type neural --num-results 5
  %(prog)s "Python testing" --include-domains python.org,pytest.org
  %(prog)s "Machine learning" --text --summary --json
        """,
    )

    # Required arguments
    parser.add_argument("query", help="Search query")

    # Search options
    parser.add_argument(
        "--type",
        choices=["neural", "keyword", "auto"],
        default="auto",
        help="Search algorithm type (default: auto)",
    )
    parser.add_argument(
        "--num-results",
        type=int,
        default=10,
        help="Number of results to return (default: 10)",
    )
    parser.add_argument("--category", help="Content category filter")

    # Domain filtering
    parser.add_argument(
        "--include-domains",
        help="Comma-separated list of domains to include",
    )
    parser.add_argument(
        "--exclude-domains",
        help="Comma-separated list of domains to exclude",
    )

    # Date filtering
    parser.add_argument(
        "--start-crawl-date",
        help="Earliest crawl date (ISO format: YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end-crawl-date",
        help="Latest crawl date (ISO format: YYYY-MM-DD)",
    )
    parser.add_argument(
        "--start-published-date",
        help="Earliest publication date (ISO format: YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end-published-date",
        help="Latest publication date (ISO format: YYYY-MM-DD)",
    )

    # Content options
    parser.add_argument(
        "--text",
        action="store_true",
        help="Include full text content in results",
    )
    parser.add_argument(
        "--highlights",
        action="store_true",
        help="Include highlighted snippets in results",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Include AI-generated summaries in results",
    )
    parser.add_argument(
        "--autoprompt",
        action="store_true",
        help="Use AI to enhance the search query",
    )

    # Output options
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )

    args = parser.parse_args()

    try:
        # Parse domain lists
        include_domains = None
        if args.include_domains:
            include_domains = [d.strip() for d in args.include_domains.split(",")]

        exclude_domains = None
        if args.exclude_domains:
            exclude_domains = [d.strip() for d in args.exclude_domains.split(",")]

        # Parse dates
        start_crawl_date = parse_date(args.start_crawl_date) if args.start_crawl_date else None
        end_crawl_date = parse_date(args.end_crawl_date) if args.end_crawl_date else None
        start_published_date = parse_date(args.start_published_date) if args.start_published_date else None
        end_published_date = parse_date(args.end_published_date) if args.end_published_date else None

        # Execute search
        response = search_web(
            query=args.query,
            type=SearchType(args.type),
            num_results=args.num_results,
            category=args.category,
            include_domains=include_domains,
            exclude_domains=exclude_domains,
            start_crawl_date=start_crawl_date,
            end_crawl_date=end_crawl_date,
            start_published_date=start_published_date,
            end_published_date=end_published_date,
            use_autoprompt=args.autoprompt or None,
            text=args.text,
            highlights=args.highlights,
            summary=args.summary,
        )

        # Output results
        if args.json:
            print(response.model_dump_json(indent=2))
        else:
            _print_results(response, args)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _print_results(response, args) -> None:
    """Print search results in human-readable format."""
    print(f"\nFound {len(response.results)} results for: {args.query}")

    if response.autoprompt_string:
        print(f"Enhanced query: {response.autoprompt_string}")

    print()

    for i, result in enumerate(response.results, 1):
        print(f"{i}. {result.title or 'No title'}")
        print(f"   URL: {result.url}")

        if result.score is not None:
            print(f"   Score: {result.score:.4f}")

        if result.published_date:
            print(f"   Published: {result.published_date}")

        if result.author:
            print(f"   Author: {result.author}")

        if result.summary:
            print(f"   Summary: {result.summary}")

        if result.text:
            # Show first 200 characters of text
            text_preview = result.text[:200] + "..." if len(result.text) > 200 else result.text
            print(f"   Text: {text_preview}")

        if result.highlights:
            print("   Highlights:")
            for highlight in result.highlights[:3]:  # Show max 3 highlights
                print(f"     - {highlight}")

        print()


if __name__ == "__main__":
    main()
