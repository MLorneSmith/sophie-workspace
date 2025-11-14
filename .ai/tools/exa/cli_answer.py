#!/usr/bin/env python3
"""
CLI script for Exa Answer API.

Provides command-line access to AI-powered answer generation.
"""

import argparse
import json
import sys

from .answer import get_answer


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate AI-powered answers with citations using Exa API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "What is the latest in AI research?"
  %(prog)s "How does quantum computing work?" --text
  %(prog)s "What are the best practices for API design?" --json
        """,
    )

    # Required arguments
    parser.add_argument(
        "query",
        nargs="?",
        help="Question to answer (if not provided, enters interactive mode)",
    )

    # Content options
    parser.add_argument(
        "--text",
        action="store_true",
        help="Include full text content in citations",
    )

    # Output options
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Enter interactive mode for multiple questions",
    )

    args = parser.parse_args()

    try:
        if args.interactive or not args.query:
            _interactive_mode(args)
        else:
            _single_query_mode(args)

    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _single_query_mode(args) -> None:
    """Execute a single query and display results."""
    response = get_answer(
        query=args.query,
        text=args.text,
    )

    if args.json:
        print(response.model_dump_json(indent=2))
    else:
        _print_answer(response)


def _interactive_mode(args) -> None:
    """Enter interactive mode for multiple questions."""
    print("Exa Answer - Interactive Mode")
    print("Type your questions and press Enter. Type 'exit' or 'quit' to exit.\n")

    while True:
        try:
            query = input("Question: ").strip()

            if not query:
                continue

            if query.lower() in ("exit", "quit", "q"):
                break

            response = get_answer(
                query=query,
                text=args.text,
            )

            if args.json:
                print(response.model_dump_json(indent=2))
            else:
                _print_answer(response)

            print()

        except KeyboardInterrupt:
            print("\n")
            break


def _print_answer(response) -> None:
    """Print answer in human-readable format."""
    print("\nAnswer:")
    print("=" * 80)
    print(response.answer)
    print("=" * 80)

    if response.citations:
        print(f"\nSources ({len(response.citations)} citations):\n")
        for i, citation in enumerate(response.citations, 1):
            print(f"{i}. {citation.title or 'No title'}")
            print(f"   URL: {citation.url}")

            if citation.text:
                # Show first 200 characters of cited text
                text_preview = citation.text[:200] + "..." if len(citation.text) > 200 else citation.text
                print(f"   Excerpt: {text_preview}")

            print()


if __name__ == "__main__":
    main()
