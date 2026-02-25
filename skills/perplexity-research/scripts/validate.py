#!/usr/bin/env python3
"""
Validation script for Perplexity Research skill.

Verifies that the Perplexity API integration is properly configured
and all components are working correctly.

Exit Codes:
    0  - All checks passed
    1  - General failure
    10 - API key not configured
    11 - CLI scripts not found
    12 - Python import failure
    13 - API connection failure
"""

import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class Result:
    """Standard result pattern for script outputs."""
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None


def get_project_root() -> Path:
    """Get the project root directory."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "CLAUDE.md").exists():
            return parent
        if (parent / ".git").exists():
            return parent
    return current.parent.parent.parent.parent.parent


def check_api_key() -> Result:
    """Check if PERPLEXITY_API_KEY is configured."""
    project_root = get_project_root()
    env_file = project_root / ".ai" / ".env"

    # Check environment variable first
    api_key = os.environ.get("PERPLEXITY_API_KEY")

    # Fall back to .env file
    if not api_key and env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith("PERPLEXITY_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if not api_key:
        return Result(
            success=False,
            message="PERPLEXITY_API_KEY not found",
            error="Set PERPLEXITY_API_KEY in .ai/.env or environment"
        )

    # Validate format (should start with pplx-)
    if not api_key.startswith("pplx-"):
        return Result(
            success=False,
            message="Invalid API key format",
            error="API key should start with 'pplx-'"
        )

    # Redact for display
    redacted = f"{api_key[:8]}...{api_key[-4:]}"
    return Result(
        success=True,
        message=f"API key configured: {redacted}",
        data={"key_prefix": api_key[:8]}
    )


def check_cli_scripts() -> Result:
    """Check if CLI scripts exist and are executable."""
    project_root = get_project_root()
    scripts = [
        project_root / ".ai" / "bin" / "perplexity-chat",
        project_root / ".ai" / "bin" / "perplexity-search",
    ]

    missing = []
    not_executable = []

    for script in scripts:
        if not script.exists():
            missing.append(script.name)
        elif not os.access(script, os.X_OK):
            not_executable.append(script.name)

    if missing:
        return Result(
            success=False,
            message=f"Missing CLI scripts: {', '.join(missing)}",
            error="CLI scripts not found in .ai/bin/"
        )

    if not_executable:
        return Result(
            success=False,
            message=f"Non-executable scripts: {', '.join(not_executable)}",
            error="Run chmod +x on the scripts"
        )

    return Result(
        success=True,
        message="CLI scripts found and executable",
        data={"scripts": [s.name for s in scripts]}
    )


def check_python_imports() -> Result:
    """Check if Python modules can be imported."""
    project_root = get_project_root()
    tools_path = project_root / ".ai" / "tools"

    # Add tools path to sys.path
    if str(tools_path) not in sys.path:
        sys.path.insert(0, str(tools_path))

    try:
        from perplexity import PerplexityClient, SearchRequest, ChatRequest
        from perplexity.exceptions import PerplexityAPIError
        from perplexity.models import SearchResponse, ChatResponse

        return Result(
            success=True,
            message="Python modules imported successfully",
            data={"modules": ["PerplexityClient", "SearchRequest", "ChatRequest"]}
        )
    except ImportError as e:
        return Result(
            success=False,
            message="Failed to import Python modules",
            error=str(e)
        )


def check_api_connection() -> Result:
    """Test API connection with a minimal request."""
    project_root = get_project_root()
    tools_path = project_root / ".ai" / "tools"

    if str(tools_path) not in sys.path:
        sys.path.insert(0, str(tools_path))

    try:
        # Load environment
        env_file = project_root / ".ai" / ".env"
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if "=" in line and not line.startswith("#"):
                        key, value = line.strip().split("=", 1)
                        os.environ[key] = value.strip('"').strip("'")

        from perplexity.search import search

        # Make a minimal test request
        response = search(
            query="test",
            num_results=1,
        )

        return Result(
            success=True,
            message="API connection successful",
            data={"results": len(response.results)}
        )
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Authentication" in error_msg:
            return Result(
                success=False,
                message="API authentication failed",
                error="Check your PERPLEXITY_API_KEY"
            )
        elif "429" in error_msg or "Rate" in error_msg:
            return Result(
                success=False,
                message="API rate limit exceeded",
                error="Wait before retrying"
            )
        else:
            return Result(
                success=False,
                message="API connection failed",
                error=error_msg
            )


def main() -> int:
    """Run all validation checks."""
    print("=" * 60)
    print("Perplexity Research Skill Validation")
    print("=" * 60)
    print()

    checks = [
        ("API Key", check_api_key, 10),
        ("CLI Scripts", check_cli_scripts, 11),
        ("Python Imports", check_python_imports, 12),
        ("API Connection", check_api_connection, 13),
    ]

    all_passed = True
    exit_code = 0

    for name, check_func, error_code in checks:
        print(f"Checking {name}...", end=" ")
        try:
            result = check_func()

            if result.success:
                print(f"PASS")
                print(f"  {result.message}")
            else:
                print(f"FAIL")
                print(f"  {result.message}")
                if result.error:
                    print(f"  Error: {result.error}")
                all_passed = False
                if exit_code == 0:
                    exit_code = error_code
        except Exception as e:
            print(f"ERROR")
            print(f"  Unexpected error: {e}")
            all_passed = False
            if exit_code == 0:
                exit_code = 1
        print()

    print("=" * 60)
    if all_passed:
        print("All checks PASSED")
        print()
        print("Quick test commands:")
        print("  .ai/bin/perplexity-chat \"test\" --show-citations")
        print("  .ai/bin/perplexity-search \"test\" --num-results 3")
    else:
        print("Some checks FAILED")
        print(f"Exit code: {exit_code}")
    print("=" * 60)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
