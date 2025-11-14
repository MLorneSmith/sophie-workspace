#!/usr/bin/env python3
"""
Syntax validation for all Exa integration files.

Validates that all Python files have correct syntax without running them.
"""

import os
import py_compile
import sys


def validate_syntax(filepath: str) -> tuple[bool, str]:
    """
    Validate Python file syntax.

    Args:
        filepath: Path to Python file

    Returns:
        Tuple of (success, error_message)
    """
    try:
        py_compile.compile(filepath, doraise=True)
        return True, ""
    except py_compile.PyCompileError as e:
        return False, str(e)


def main():
    """Run syntax validation on all Python files."""
    print("Validating Python Syntax for Exa Integration\n")
    print("=" * 80)

    base_path = "/home/msmith/projects/2025slideheroes/.ai/tools/exa"

    # Get all Python files
    python_files = []
    for root, dirs, files in os.walk(base_path):
        # Skip __pycache__
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))

    print(f"\nFound {len(python_files)} Python files to validate\n")

    all_valid = True
    errors = []

    for filepath in sorted(python_files):
        rel_path = os.path.relpath(filepath, base_path)
        valid, error = validate_syntax(filepath)

        if valid:
            print(f"  ✓ {rel_path}")
        else:
            print(f"  ✗ {rel_path}")
            all_valid = False
            errors.append((rel_path, error))

    print("\n" + "=" * 80)

    if all_valid:
        print(f"\n✓ All {len(python_files)} files have valid syntax!")
        return 0
    else:
        print(f"\n✗ {len(errors)} file(s) have syntax errors:\n")
        for filepath, error in errors:
            print(f"  {filepath}:")
            print(f"    {error}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
