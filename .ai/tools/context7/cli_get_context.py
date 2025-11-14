#!/usr/bin/env python3
"""
CLI script for fetching library documentation from Context7 API.

Usage:
    uv run -m tools.context7.cli_get_context vercel next.js --topic routing --tokens 2000
    uv run -m tools.context7.cli_get_context vercel next.js --version v15.1.8 --format json
"""

import argparse
import json
import logging
import sys

from tools.context7.get_context import get_documentation
from tools.context7.models import ResponseFormat

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(levelname)s: %(message)s", stream=sys.stderr
)


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Fetch library documentation from Context7 API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch latest Next.js documentation
  %(prog)s vercel next.js

  # Fetch specific version with topic filter
  %(prog)s vercel next.js --version v15.1.8 --topic routing

  # Limit response to 2000 tokens
  %(prog)s vercel next.js --tokens 2000

  # Get JSON format response
  %(prog)s vercel next.js --format json

  # Bypass cache
  %(prog)s vercel next.js --no-cache
        """,
    )

    parser.add_argument("owner", help="Repository owner (e.g., 'vercel')")
    parser.add_argument("repo", help="Repository name (e.g., 'next.js')")
    parser.add_argument(
        "--version", "-v", help="Specific version (e.g., 'v15.1.8') or latest"
    )
    parser.add_argument(
        "--topic",
        "-t",
        help="Filter by topic (e.g., 'routing', 'authentication')",
    )
    parser.add_argument(
        "--tokens",
        type=int,
        default=10000,
        help="Maximum token count (100-100,000), default: 10000",
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["txt", "json"],
        default="txt",
        help="Response format, default: txt",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Bypass cache and fetch fresh data",
    )
    parser.add_argument(
        "--json-output",
        action="store_true",
        help="Output response as JSON",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args()

    # Set logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Fetch documentation
        response = get_documentation(
            owner=args.owner,
            repo=args.repo,
            version=args.version,
            topic=args.topic,
            tokens=args.tokens,
            response_format=ResponseFormat(args.format),
            use_cache=not args.no_cache,
        )

        # Output results
        if args.json_output:
            # Full JSON output
            print(json.dumps(response.model_dump(), indent=2))
        else:
            # Human-readable output
            print(f"\n{'=' * 80}")
            print(f"Library: {response.library}")
            print(f"Version: {response.version}")
            if response.topic:
                print(f"Topic: {response.topic}")
            print(f"Tokens: {response.tokens}")
            print(f"{'=' * 80}\n")

            if args.format == "txt":
                print(response.content)
            else:
                # JSON format - print formatted chunks
                if response.chunks:
                    for i, chunk in enumerate(response.chunks, 1):
                        print(f"\n{'─' * 80}")
                        print(f"[{i}] {chunk.title}")
                        if chunk.source:
                            print(f"Source: {chunk.source}")
                        if chunk.url:
                            print(f"URL: {chunk.url}")
                        print(f"{'─' * 80}")
                        print(chunk.content)

    except Exception as e:
        logging.error(f"Failed to fetch documentation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
