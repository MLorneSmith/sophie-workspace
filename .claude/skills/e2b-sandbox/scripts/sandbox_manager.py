#!/usr/bin/env python3
"""
E2B Sandbox Manager - CLI tool for managing E2B cloud sandboxes.

Usage:
    python sandbox_manager.py create [--timeout SECONDS] [--metadata KEY=VALUE]
    python sandbox_manager.py list [--format json|table]
    python sandbox_manager.py status <sandbox-id>
    python sandbox_manager.py kill <sandbox-id>
    python sandbox_manager.py kill-all [--confirm]

Requires:
    pip install e2b-code-interpreter
    export E2B_API_KEY=e2b_***
"""

import argparse
import json
import os
import sys
from datetime import datetime

try:
    from e2b import Sandbox
    from e2b.exceptions import AuthenticationException, SandboxException
except ImportError:
    print("Error: e2b package not installed. Run: pip install e2b-code-interpreter")
    sys.exit(1)


def check_api_key():
    """Verify E2B_API_KEY is set."""
    if not os.environ.get("E2B_API_KEY"):
        print("Error: E2B_API_KEY environment variable not set")
        print("Get your API key from: https://e2b.dev/dashboard")
        sys.exit(1)


def create_sandbox(args):
    """Create a new sandbox."""
    check_api_key()

    metadata = {}
    if args.metadata:
        for item in args.metadata:
            key, value = item.split("=", 1)
            metadata[key] = value

    try:
        sandbox = Sandbox.create(
            timeout=args.timeout,
            metadata=metadata if metadata else None,
        )
        print(f"Created sandbox: {sandbox.sandbox_id}")
        print(f"Timeout: {args.timeout} seconds")
        if metadata:
            print(f"Metadata: {json.dumps(metadata)}")
        return sandbox.sandbox_id
    except AuthenticationException:
        print("Error: Invalid API key")
        sys.exit(1)
    except SandboxException as e:
        print(f"Error creating sandbox: {e}")
        sys.exit(1)


def list_sandboxes(args):
    """List all running sandboxes."""
    check_api_key()

    try:
        sandboxes = Sandbox.list()

        if not sandboxes:
            print("No running sandboxes found")
            return

        if args.format == "json":
            output = [
                {
                    "id": s.sandbox_id,
                    "template_id": s.template_id,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "metadata": s.metadata,
                }
                for s in sandboxes
            ]
            print(json.dumps(output, indent=2))
        else:
            print(f"{'ID':<40} {'Template':<20} {'Started':<25} {'Metadata'}")
            print("-" * 100)
            for s in sandboxes:
                started = s.started_at.strftime("%Y-%m-%d %H:%M:%S") if s.started_at else "N/A"
                meta = json.dumps(s.metadata) if s.metadata else "{}"
                print(f"{s.sandbox_id:<40} {s.template_id or 'default':<20} {started:<25} {meta}")

    except AuthenticationException:
        print("Error: Invalid API key")
        sys.exit(1)


def check_status(args):
    """Check if a sandbox is running."""
    check_api_key()

    try:
        sandbox = Sandbox.connect(sandbox_id=args.sandbox_id)
        is_running = sandbox.is_running()
        print(f"Sandbox {args.sandbox_id}: {'running' if is_running else 'stopped'}")
        return is_running
    except SandboxException as e:
        print(f"Error: {e}")
        sys.exit(1)


def kill_sandbox(args):
    """Kill a specific sandbox."""
    check_api_key()

    try:
        sandbox = Sandbox.connect(sandbox_id=args.sandbox_id)
        result = sandbox.kill()
        if result:
            print(f"Killed sandbox: {args.sandbox_id}")
        else:
            print(f"Sandbox not found or already stopped: {args.sandbox_id}")
    except SandboxException as e:
        print(f"Error killing sandbox: {e}")
        sys.exit(1)


def kill_all_sandboxes(args):
    """Kill all running sandboxes."""
    check_api_key()

    if not args.confirm:
        print("Warning: This will kill ALL running sandboxes.")
        response = input("Type 'yes' to confirm: ")
        if response.lower() != "yes":
            print("Aborted")
            return

    try:
        sandboxes = Sandbox.list()
        if not sandboxes:
            print("No running sandboxes to kill")
            return

        killed = 0
        for s in sandboxes:
            try:
                sandbox = Sandbox.connect(sandbox_id=s.sandbox_id)
                sandbox.kill()
                print(f"Killed: {s.sandbox_id}")
                killed += 1
            except SandboxException:
                print(f"Failed to kill: {s.sandbox_id}")

        print(f"\nKilled {killed}/{len(sandboxes)} sandboxes")

    except AuthenticationException:
        print("Error: Invalid API key")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="E2B Sandbox Manager - Manage cloud sandboxes for AI workflows"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new sandbox")
    create_parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Sandbox timeout in seconds (default: 300)",
    )
    create_parser.add_argument(
        "--metadata",
        action="append",
        help="Metadata as KEY=VALUE (can be repeated)",
    )

    # List command
    list_parser = subparsers.add_parser("list", help="List running sandboxes")
    list_parser.add_argument(
        "--format",
        choices=["json", "table"],
        default="table",
        help="Output format (default: table)",
    )

    # Status command
    status_parser = subparsers.add_parser("status", help="Check sandbox status")
    status_parser.add_argument("sandbox_id", help="Sandbox ID to check")

    # Kill command
    kill_parser = subparsers.add_parser("kill", help="Kill a sandbox")
    kill_parser.add_argument("sandbox_id", help="Sandbox ID to kill")

    # Kill-all command
    kill_all_parser = subparsers.add_parser("kill-all", help="Kill all sandboxes")
    kill_all_parser.add_argument(
        "--confirm",
        action="store_true",
        help="Skip confirmation prompt",
    )

    args = parser.parse_args()

    if args.command == "create":
        create_sandbox(args)
    elif args.command == "list":
        list_sandboxes(args)
    elif args.command == "status":
        check_status(args)
    elif args.command == "kill":
        kill_sandbox(args)
    elif args.command == "kill-all":
        kill_all_sandboxes(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
