#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""Test script to verify Claude Code authentication setup."""

import sys
from agent import check_claude_auth, get_claude_env

def main():
    """Test authentication configuration."""
    print("=" * 60)
    print("ADWS Authentication Test")
    print("=" * 60)
    print()

    # Check authentication
    has_auth, auth_type = check_claude_auth()

    if has_auth:
        print(f"✅ Authentication found: {auth_type}")
        if auth_type == "session":
            print("   Using Claude Max plan session authentication")
        elif auth_type == "api_key":
            print("   Using Anthropic API key")
    else:
        print("❌ No authentication found")
        print()
        print("Please set up authentication using one of these methods:")
        print()
        print("Option 1: Claude Max Plan (Recommended)")
        print("  1. Run: claude")
        print("  2. Follow prompts to log in with Max credentials")
        print()
        print("Option 2: API Key")
        print("  1. Set: export ANTHROPIC_API_KEY='sk-ant-...'")
        print()
        return 1

    print()
    print("-" * 60)
    print("Environment Configuration")
    print("-" * 60)

    # Get environment configuration
    env = get_claude_env()

    # Show relevant env vars (hiding sensitive values)
    important_vars = [
        "HOME",
        "PATH",
        "CLAUDE_CODE_PATH",
        "ANTHROPIC_API_KEY",
        "GITHUB_PAT",
        "GH_TOKEN",
    ]

    for var in important_vars:
        if var in env:
            value = env[var]
            # Hide sensitive values
            if var in ["ANTHROPIC_API_KEY", "GITHUB_PAT", "GH_TOKEN"]:
                if value:
                    value = f"{value[:10]}...{value[-4:]}" if len(value) > 14 else "***"
            print(f"  {var}: {value}")
        else:
            print(f"  {var}: (not set)")

    print()
    print("=" * 60)
    print("✅ Authentication test complete")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  - Run: uv run adw_plan_build.py <issue_number>")
    print("  - Or: uv run trigger_cron.py")
    print()

    return 0

if __name__ == "__main__":
    sys.exit(main())
