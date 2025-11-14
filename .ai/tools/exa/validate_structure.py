#!/usr/bin/env python3
"""
Validation script for Exa integration structure.

Verifies that all files exist and have correct structure.
"""

import os
import sys


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists."""
    exists = os.path.isfile(filepath)
    status = "✓" if exists else "✗"
    print(f"  {status} {filepath}")
    return exists


def main():
    """Run validation checks."""
    print("Validating Exa Search API Integration Structure\n")
    print("=" * 80)

    base_path = "/home/msmith/projects/2025slideheroes/.ai/tools/exa"

    # Core implementation files
    print("\nCore Implementation Files:")
    core_files = [
        "__init__.py",
        "models.py",
        "client.py",
        "exceptions.py",
        "utils.py",
        "search.py",
        "get_contents.py",
        "find_similar.py",
        "answer.py",
    ]

    all_core = all(check_file_exists(os.path.join(base_path, f)) for f in core_files)

    # CLI scripts
    print("\nCLI Scripts:")
    cli_files = [
        "cli_search.py",
        "cli_get_contents.py",
        "cli_find_similar.py",
        "cli_answer.py",
    ]

    all_cli = all(check_file_exists(os.path.join(base_path, f)) for f in cli_files)

    # Test files
    print("\nTest Files:")
    test_files = [
        "test_models.py",
        "test_client.py",
        "test_search.py",
        "test_get_contents.py",
        "test_find_similar.py",
        "test_answer.py",
    ]

    all_tests = all(check_file_exists(os.path.join(base_path, f)) for f in test_files)

    # Documentation
    print("\nDocumentation:")
    doc_files = [
        "README.md",
    ]

    all_docs = all(check_file_exists(os.path.join(base_path, f)) for f in doc_files)

    # Examples
    print("\nExample Scripts:")
    example_files = [
        "examples/research_workflow.py",
    ]

    all_examples = all(check_file_exists(os.path.join(base_path, f)) for f in example_files)

    # Check file sizes
    print("\nFile Sizes:")
    all_files = core_files + cli_files + test_files + doc_files
    for filename in all_files:
        filepath = os.path.join(base_path, filename)
        if os.path.isfile(filepath):
            size = os.path.getsize(filepath)
            print(f"  {filename:30s} {size:>8,} bytes")

    # Summary
    print("\n" + "=" * 80)
    print("Summary:")
    print(f"  Core Files:    {all_core}")
    print(f"  CLI Scripts:   {all_cli}")
    print(f"  Test Files:    {all_tests}")
    print(f"  Documentation: {all_docs}")
    print(f"  Examples:      {all_examples}")

    all_valid = all_core and all_cli and all_tests and all_docs and all_examples

    if all_valid:
        print("\n✓ All files present and accounted for!")
        return 0
    else:
        print("\n✗ Some files are missing!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
