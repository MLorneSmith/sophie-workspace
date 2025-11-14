#!/usr/bin/env python3
"""
CLI script for Exa Get Contents API.

Provides command-line access to content retrieval capabilities.
"""

import argparse
import json
import sys

from .get_contents import get_contents
from .models import LivecrawlOption


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Retrieve full content from URLs using Exa API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s https://example.com --text --summary
  %(prog)s https://example.com https://example.org --text
  %(prog)s https://example.com --highlights --json
        """,
    )

    # Required arguments
    parser.add_argument(
        "urls",
        nargs="+",
        help="URLs to fetch content for",
    )

    # Content options
    parser.add_argument(
        "--text",
        action="store_true",
        help="Include cleaned HTML text content",
    )
    parser.add_argument(
        "--highlights",
        action="store_true",
        help="Include highlighted snippets",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Include AI-generated summary",
    )

    # Crawl options
    parser.add_argument(
        "--livecrawl",
        choices=["always", "never", "fallback"],
        help="Livecrawl configuration",
    )
    parser.add_argument(
        "--subpages",
        type=int,
        help="Number of subpages to crawl (0-10)",
    )
    parser.add_argument(
        "--subpage-target",
        type=int,
        help="Target number of subpages to return (0-10)",
    )

    # Output options
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    parser.add_argument(
        "--save",
        help="Save content to file",
    )

    args = parser.parse_args()

    try:
        # Parse livecrawl option
        livecrawl = LivecrawlOption(args.livecrawl) if args.livecrawl else None

        # Execute get contents
        response = get_contents(
            urls=args.urls,
            text=args.text,
            highlights=args.highlights,
            summary=args.summary,
            livecrawl=livecrawl,
            subpages=args.subpages,
            subpage_target=args.subpage_target,
        )

        # Output results
        if args.json:
            output = response.model_dump_json(indent=2)
            if args.save:
                with open(args.save, "w") as f:
                    f.write(output)
                print(f"Saved to {args.save}")
            else:
                print(output)
        else:
            _print_results(response, args)
            if args.save:
                _save_results(response, args.save)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _print_results(response, args) -> None:
    """Print content results in human-readable format."""
    print(f"\nRetrieved content for {len(response.results)} URLs\n")

    for i, result in enumerate(response.results, 1):
        print(f"{i}. {result.title or 'No title'}")
        print(f"   URL: {result.url}")

        if result.author:
            print(f"   Author: {result.author}")

        if result.published_date:
            print(f"   Published: {result.published_date}")

        if result.summary:
            print(f"\n   Summary:")
            print(f"   {result.summary}\n")

        if result.text:
            text_length = len(result.text)
            print(f"   Text: {text_length} characters")
            # Show first 500 characters
            text_preview = result.text[:500] + "..." if text_length > 500 else result.text
            print(f"   {text_preview}\n")

        if result.highlights:
            print("   Highlights:")
            for highlight in result.highlights:
                print(f"     - {highlight}")
            print()

        print("-" * 80)
        print()


def _save_results(response, filename: str) -> None:
    """Save content results to a file."""
    with open(filename, "w") as f:
        for i, result in enumerate(response.results, 1):
            f.write(f"# {i}. {result.title or 'No title'}\n\n")
            f.write(f"URL: {result.url}\n\n")

            if result.author:
                f.write(f"Author: {result.author}\n")

            if result.published_date:
                f.write(f"Published: {result.published_date}\n")

            if result.summary:
                f.write(f"\n## Summary\n\n{result.summary}\n\n")

            if result.text:
                f.write(f"## Content\n\n{result.text}\n\n")

            if result.highlights:
                f.write("## Highlights\n\n")
                for highlight in result.highlights:
                    f.write(f"- {highlight}\n")
                f.write("\n")

            f.write("\n" + "=" * 80 + "\n\n")

    print(f"Saved content to {filename}")


if __name__ == "__main__":
    main()
