#!/usr/bin/env python3
"""
CLI script for Perplexity Search API.

Provides command-line access to Perplexity's web search capabilities
with advanced filtering options.
"""

import argparse
import json
import sys

from .search import search


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Search the web using Perplexity's Search API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "AI breakthroughs 2025" --num-results 5
  %(prog)s "quantum computing" --domains arxiv.org,github.com
  %(prog)s "climate change" --languages en,fr --recency week
  %(prog)s "machine learning" --after-date 01/01/2025 --before-date 03/01/2025 --json
        """,
    )

    # Required arguments
    parser.add_argument("query", help="Search query")

    # Search options
    parser.add_argument(
        "--num-results",
        type=int,
        default=10,
        help="Number of results to return (1-100, default: 10)",
    )

    # Recency filtering
    parser.add_argument(
        "--recency",
        choices=["day", "week", "month", "year"],
        help="Filter by recency (mutually exclusive with date filters)",
    )

    # Domain filtering
    parser.add_argument(
        "--domains",
        help="Comma-separated list of domains to filter by (max 20)",
    )

    # Language filtering
    parser.add_argument(
        "--languages",
        help="Comma-separated list of ISO 639-1 language codes (max 10)",
    )

    # Date filtering
    parser.add_argument(
        "--after-date",
        help="Filter results published after this date (MM/DD/YYYY)",
    )
    parser.add_argument(
        "--before-date",
        help="Filter results published before this date (MM/DD/YYYY)",
    )

    # Output options
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Configure logging
    if args.verbose:
        import logging

        logging.basicConfig(level=logging.DEBUG)

    try:
        # Execute search
        response = search(
            query=args.query,
            num_results=args.num_results,
            recency_filter=args.recency,
            domain_filter=args.domains,
            language_filter=args.languages,
            search_after_date=args.after_date,
            search_before_date=args.before_date,
        )

        # Output results
        if args.json:
            # JSON output
            print(json.dumps(response.model_dump(), indent=2, default=str))
        else:
            # Human-readable output
            print(f"\n=== Search Results for: {args.query} ===\n")
            print(f"Found {len(response.results)} results\n")

            for i, result in enumerate(response.results, 1):
                print(f"{i}. {result.title}")
                print(f"   URL: {result.url}")
                if result.snippet:
                    print(f"   Snippet: {result.snippet}")
                if result.published_date:
                    print(f"   Published: {result.published_date}")
                print()

    except ValueError as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        if args.verbose:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
