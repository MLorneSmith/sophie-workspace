#!/usr/bin/env python3
"""
CLI script for searching libraries on Context7.

Usage:
    uv run tools/context7/cli_search_libraries.py "next.js"
    uv run tools/context7/cli_search_libraries.py "react" --json
"""

import argparse
import json
import logging
import sys

from .search_libraries import search_libraries

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(levelname)s: %(message)s", stream=sys.stderr
)


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Search for libraries on Context7",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search for Next.js libraries
  %(prog)s "next.js"

  # Search with JSON output
  %(prog)s "react" --json

  # Bypass cache
  %(prog)s "vue" --no-cache
        """,
    )

    parser.add_argument(
        "query",
        help="Library name to search for",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Bypass cache and fetch fresh data",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )
    parser.add_argument(
        "--limit",
        "-n",
        type=int,
        help="Limit number of results to display",
    )

    args = parser.parse_args()

    # Set logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Search libraries
        response = search_libraries(
            query=args.query,
            use_cache=not args.no_cache,
        )

        # Apply limit if specified
        results = response.results
        if args.limit:
            results = results[: args.limit]

        # Output results
        if args.json:
            # Full JSON output
            output = response.model_dump()
            if args.limit:
                output["results"] = [r.model_dump() for r in results]
            print(json.dumps(output, indent=2))
        else:
            # Human-readable table output
            print(f"\nFound {response.total} libraries matching '{args.query}'")
            if args.limit and len(results) < response.total:
                print(f"Showing top {len(results)} results\n")
            else:
                print()

            if not results:
                print("No results found.")
                return

            # Print table header
            print(f"{'Library':<40} {'Stars':<8} {'Trust':<8} {'Score':<8} {'State':<12}")
            print("=" * 85)

            # Print each result
            for lib in results:
                # Format library ID (remove leading /)
                lib_id = lib.id.lstrip("/")

                # Truncate long IDs
                if len(lib_id) > 38:
                    lib_id = lib_id[:35] + "..."

                # Format scores
                trust = f"{lib.trust_score:.1f}"
                score = f"{lib.benchmark_score:.1f}"

                print(
                    f"{lib_id:<40} {lib.stars:<8} {trust:<8} {score:<8} {lib.state.value:<12}"
                )

            print()

            # Show available versions for top result
            if results and results[0].versions:
                top_lib = results[0]
                print(f"\nTop result: {top_lib.id}")
                if top_lib.description:
                    print(f"Description: {top_lib.description}")
                print(f"Available versions ({len(top_lib.versions)}):")
                for version in top_lib.versions[:5]:  # Show first 5 versions
                    print(f"  - {version.version} ({version.state.value})")
                if len(top_lib.versions) > 5:
                    print(f"  ... and {len(top_lib.versions) - 5} more")

    except Exception as e:
        logging.error(f"Failed to search libraries: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
