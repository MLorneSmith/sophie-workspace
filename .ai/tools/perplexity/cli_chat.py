#!/usr/bin/env python3
"""
CLI script for Perplexity Chat Completions API.

Provides command-line access to Perplexity's grounded AI chat capabilities
with citation support.
"""

import argparse
import json
import sys

from .chat import chat


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Get AI-powered answers using Perplexity's Chat Completions API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "What are the latest AI breakthroughs in 2025?"
  %(prog)s "Explain quantum computing" --model sonar-pro --show-citations
  %(prog)s "Latest news in renewable energy" --stream
  %(prog)s "Tell me about Python 3.13" --system "You are a Python expert" --max-tokens 500
        """,
    )

    # Required arguments
    parser.add_argument("query", help="User query or question")

    # Model selection
    parser.add_argument(
        "--model",
        choices=["sonar", "sonar-pro", "sonar-reasoning"],
        default="sonar",
        help="Model to use for chat completion (default: sonar)",
    )

    # Context options
    parser.add_argument(
        "--system",
        help="System message to set context for the conversation",
    )

    # Generation parameters
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Enable streaming responses",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        help="Maximum tokens in response",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        help="Sampling temperature (0-2, higher = more creative)",
    )
    parser.add_argument(
        "--top-p",
        type=float,
        help="Nucleus sampling threshold (0-1)",
    )

    # Output options
    parser.add_argument(
        "--show-citations",
        action="store_true",
        help="Display citations from grounded sources",
    )
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
        # Execute chat request
        response = chat(
            query=args.query,
            model=args.model,
            system_message=args.system,
            stream=args.stream,
            max_tokens=args.max_tokens,
            temperature=args.temperature,
            top_p=args.top_p,
            return_citations=True,  # Always fetch citations for potential display
        )

        # Handle streaming vs non-streaming
        if args.stream:
            # Stream response chunks
            print("\n=== Streaming Response ===\n", flush=True)

            full_content = ""
            for chunk in response:
                if "choices" in chunk and chunk["choices"]:
                    delta = chunk["choices"][0].get("delta", {})
                    if "content" in delta:
                        content = delta["content"]
                        full_content += content
                        print(content, end="", flush=True)

            print("\n")  # New line after streaming

        else:
            # Output complete response
            if args.json:
                # JSON output
                print(json.dumps(response.model_dump(), indent=2, default=str))
            else:
                # Human-readable output
                print(f"\n=== Response from {response.model} ===\n")

                # Display answer
                if response.choices and len(response.choices) > 0:
                    answer = response.choices[0].message.content
                    print(answer)
                    print()

                # Display token usage
                if response.usage:
                    print(f"\n--- Token Usage ---")
                    print(f"Prompt: {response.usage.prompt_tokens}")
                    print(f"Completion: {response.usage.completion_tokens}")
                    print(f"Total: {response.usage.total_tokens}")
                    print()

                # Display citations if requested
                if args.show_citations and response.citations:
                    print(f"\n--- Citations ({len(response.citations)}) ---")
                    for i, citation in enumerate(response.citations, 1):
                        print(f"{i}. {citation.title or 'Untitled'}")
                        print(f"   {citation.url}")
                        if citation.snippet:
                            print(f"   \"{citation.snippet[:150]}...\"")
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
