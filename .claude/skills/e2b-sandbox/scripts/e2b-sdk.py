#!/usr/bin/env python3
"""
E2B SDK Manager - Non-interactive sandbox and template management.

This script uses the E2B SDK directly (not the CLI) for reliable automation.
Works in CI/CD, background processes, and any non-TTY environment.

Usage:
    python e2b-sdk.py sandbox create [--template NAME] [--timeout SECS] [--metadata KEY=VAL]
    python e2b-sdk.py sandbox list [--json] [--state STATE]
    python e2b-sdk.py sandbox status <sandbox-id>
    python e2b-sdk.py sandbox kill <sandbox-id>
    python e2b-sdk.py sandbox kill-all [--confirm]
    python e2b-sdk.py sandbox exec <sandbox-id> "<command>" [--timeout SECS]
    python e2b-sdk.py sandbox files-read <sandbox-id> <path>
    python e2b-sdk.py sandbox files-write <sandbox-id> <path> <content>
    python e2b-sdk.py sandbox files-list <sandbox-id> <path>
    python e2b-sdk.py sandbox url <sandbox-id> [--port PORT]

    python e2b-sdk.py template list [--json]
    python e2b-sdk.py auth check

Exit Codes:
    0  - Success
    1  - General failure
    2  - Invalid arguments
    10 - Authentication failure
    11 - Resource not found
    12 - Execution timeout

Requirements:
    pip install e2b-code-interpreter
    export E2B_API_KEY=e2b_***
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# Exit codes
EXIT_SUCCESS = 0
EXIT_FAILURE = 1
EXIT_INVALID_ARGS = 2
EXIT_AUTH_FAILURE = 10
EXIT_NOT_FOUND = 11
EXIT_TIMEOUT = 12


@dataclass
class Result:
    """Structured result for script operations."""
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[list[str]] = None


def load_env_from_file(filepath: Path, var_name: str) -> Optional[str]:
    """Load a specific environment variable from a .env file."""
    if not filepath.exists():
        return None
    try:
        content = filepath.read_text()
        for line in content.splitlines():
            line = line.strip()
            if line.startswith(f"{var_name}="):
                value = line.split("=", 1)[1]
                # Remove surrounding quotes if present
                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                return value
    except Exception:
        pass
    return None


def ensure_api_key() -> str:
    """Ensure E2B_API_KEY is available, loading from .env files if needed."""
    api_key = os.environ.get("E2B_API_KEY")

    if not api_key:
        # Try to find project root
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent.parent.parent

        # Try project root .env
        api_key = load_env_from_file(project_root / ".env", "E2B_API_KEY")

        # Try apps/web/.env.local
        if not api_key:
            api_key = load_env_from_file(
                project_root / "apps" / "web" / ".env.local",
                "E2B_API_KEY"
            )

    if not api_key:
        print("Error: E2B_API_KEY not found", file=sys.stderr)
        print("Set via: export E2B_API_KEY=e2b_***", file=sys.stderr)
        print("Get key from: https://e2b.dev/dashboard", file=sys.stderr)
        sys.exit(EXIT_AUTH_FAILURE)

    # Set for SDK to use
    os.environ["E2B_API_KEY"] = api_key
    return api_key


def import_e2b():
    """Import E2B SDK with helpful error message if not installed."""
    try:
        from e2b_code_interpreter import Sandbox
        return Sandbox
    except ImportError:
        print("Error: E2B SDK not installed", file=sys.stderr)
        print("Install with: pip install e2b-code-interpreter", file=sys.stderr)
        sys.exit(EXIT_FAILURE)


# =============================================================================
# Sandbox Commands
# =============================================================================

def sandbox_create(args: argparse.Namespace) -> Result:
    """Create a new sandbox."""
    ensure_api_key()
    Sandbox = import_e2b()

    template = args.template or "base"
    timeout = args.timeout or 300

    metadata = {}
    if args.metadata:
        for item in args.metadata:
            if "=" in item:
                key, value = item.split("=", 1)
                metadata[key] = value

    try:
        sandbox = Sandbox(
            template=template,
            timeout=timeout,
            metadata=metadata if metadata else None,
        )

        result_data = {
            "sandbox_id": sandbox.sandbox_id,
            "template": template,
            "timeout": timeout,
            "metadata": metadata,
        }

        if args.json:
            print(json.dumps(result_data, indent=2))
        else:
            print(f"Created sandbox: {sandbox.sandbox_id}")
            print(f"  Template: {template}")
            print(f"  Timeout: {timeout}s")
            if metadata:
                print(f"  Metadata: {json.dumps(metadata)}")

        return Result(success=True, message="Sandbox created", data=result_data)

    except Exception as e:
        print(f"Error creating sandbox: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_list(args: argparse.Namespace) -> Result:
    """List running sandboxes."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandboxes = Sandbox.list()

        # Filter by state if specified
        if args.state:
            # Note: E2B SDK may not expose state directly, this is for API compatibility
            pass

        if not sandboxes:
            if args.json:
                print("[]")
            else:
                print("No running sandboxes found")
            return Result(success=True, message="No sandboxes", data=[])

        sandbox_list = []
        for s in sandboxes:
            sandbox_list.append({
                "id": s.sandbox_id,
                "template_id": getattr(s, "template_id", None),
                "started_at": s.started_at.isoformat() if hasattr(s, "started_at") and s.started_at else None,
                "metadata": getattr(s, "metadata", None),
            })

        if args.json:
            print(json.dumps(sandbox_list, indent=2))
        else:
            print(f"Found {len(sandbox_list)} sandbox(es):\n")
            print(f"{'ID':<40} {'Template':<25} {'Started':<25}")
            print("-" * 95)
            for s in sandbox_list:
                template = s["template_id"] or "default"
                started = s["started_at"][:19] if s["started_at"] else "N/A"
                print(f"{s['id']:<40} {template:<25} {started:<25}")

        return Result(success=True, message=f"Found {len(sandbox_list)} sandboxes", data=sandbox_list)

    except Exception as e:
        print(f"Error listing sandboxes: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_status(args: argparse.Namespace) -> Result:
    """Check sandbox status."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        is_running = sandbox.is_running()

        status = "running" if is_running else "stopped"

        if args.json:
            print(json.dumps({"sandbox_id": args.sandbox_id, "status": status}))
        else:
            print(f"Sandbox {args.sandbox_id}: {status.upper()}")

        return Result(success=True, message=status, data={"status": status})

    except Exception as e:
        print(f"Error checking sandbox: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_kill(args: argparse.Namespace) -> Result:
    """Kill a specific sandbox."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        sandbox.kill()

        if args.json:
            print(json.dumps({"sandbox_id": args.sandbox_id, "status": "killed"}))
        else:
            print(f"Killed sandbox: {args.sandbox_id}")

        return Result(success=True, message="Sandbox killed")

    except Exception as e:
        print(f"Error killing sandbox: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_kill_all(args: argparse.Namespace) -> Result:
    """Kill all running sandboxes."""
    ensure_api_key()
    Sandbox = import_e2b()

    if not args.confirm:
        print("Warning: This will kill ALL running sandboxes.", file=sys.stderr)
        print("Use --confirm to proceed.", file=sys.stderr)
        sys.exit(EXIT_INVALID_ARGS)

    try:
        sandboxes = Sandbox.list()

        if not sandboxes:
            print("No running sandboxes to kill")
            return Result(success=True, message="No sandboxes to kill")

        killed = 0
        failed = 0
        for s in sandboxes:
            try:
                sandbox = Sandbox.connect(s.sandbox_id)
                sandbox.kill()
                print(f"  Killed: {s.sandbox_id}")
                killed += 1
            except Exception:
                print(f"  Failed: {s.sandbox_id}")
                failed += 1

        print(f"\nKilled {killed}/{len(sandboxes)} sandboxes")

        return Result(
            success=failed == 0,
            message=f"Killed {killed}/{len(sandboxes)}",
            data={"killed": killed, "failed": failed}
        )

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_exec(args: argparse.Namespace) -> Result:
    """Execute a command in a sandbox."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)

        timeout_ms = (args.timeout or 120) * 1000

        result = sandbox.commands.run(
            args.command,
            timeout=timeout_ms,
        )

        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

        if result.exit_code != 0:
            sys.exit(result.exit_code)

        return Result(
            success=result.exit_code == 0,
            message=f"Exit code: {result.exit_code}",
            data={
                "exit_code": result.exit_code,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }
        )

    except Exception as e:
        print(f"Error executing command: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_files_read(args: argparse.Namespace) -> Result:
    """Read a file from sandbox."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        content = sandbox.files.read(args.path)
        print(content)
        return Result(success=True, message="File read", data=content)
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_files_write(args: argparse.Namespace) -> Result:
    """Write a file to sandbox."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        sandbox.files.write(args.path, args.content)
        print(f"Written: {args.path}")
        return Result(success=True, message="File written")
    except Exception as e:
        print(f"Error writing file: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_files_list(args: argparse.Namespace) -> Result:
    """List files in sandbox directory."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        files = sandbox.files.list(args.path)

        if args.json:
            print(json.dumps([{"name": f.name, "is_dir": f.is_dir} for f in files], indent=2))
        else:
            for f in files:
                prefix = "d" if f.is_dir else "-"
                print(f"{prefix} {f.name}")

        return Result(success=True, message=f"Listed {len(files)} items")
    except Exception as e:
        print(f"Error listing files: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


def sandbox_url(args: argparse.Namespace) -> Result:
    """Get public URL for a sandbox port."""
    ensure_api_key()
    Sandbox = import_e2b()

    try:
        sandbox = Sandbox.connect(args.sandbox_id)
        port = args.port or 3000
        host = sandbox.get_host(port)
        url = f"https://{host}"

        print(url)
        return Result(success=True, message=url, data={"url": url, "port": port})
    except Exception as e:
        print(f"Error getting URL: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


# =============================================================================
# Template Commands
# =============================================================================

def template_list(args: argparse.Namespace) -> Result:
    """List templates (requires CLI as SDK doesn't expose this directly)."""
    ensure_api_key()

    import subprocess

    try:
        cmd = ["e2b", "template", "list"]
        if args.json:
            cmd.append("--json")

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.stdout:
            print(result.stdout, end="")
        if result.stderr and result.returncode != 0:
            print(result.stderr, file=sys.stderr)

        return Result(
            success=result.returncode == 0,
            message="Templates listed"
        )
    except FileNotFoundError:
        print("Error: E2B CLI not found", file=sys.stderr)
        print("Install with: npm install -g @e2b/cli", file=sys.stderr)
        return Result(success=False, message="CLI not found")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return Result(success=False, message=str(e))


# =============================================================================
# Auth Commands
# =============================================================================

def auth_check(args: argparse.Namespace) -> Result:
    """Check authentication status."""
    try:
        api_key = ensure_api_key()
        Sandbox = import_e2b()

        # Try to list sandboxes as auth verification
        Sandbox.list()

        masked_key = api_key[:10] + "..." + api_key[-4:]

        if args.json:
            print(json.dumps({"authenticated": True, "key_prefix": api_key[:10]}))
        else:
            print("Authentication successful")
            print(f"  API Key: {masked_key}")

        return Result(success=True, message="Authenticated")

    except Exception as e:
        print(f"Authentication failed: {e}", file=sys.stderr)
        return Result(success=False, message=str(e), errors=[str(e)])


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="E2B SDK Manager - Non-interactive sandbox management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python e2b-sdk.py sandbox create --template base --timeout 300
    python e2b-sdk.py sandbox list --json
    python e2b-sdk.py sandbox exec abc123 "ls -la"
    python e2b-sdk.py sandbox kill abc123
    python e2b-sdk.py auth check
        """
    )

    subparsers = parser.add_subparsers(dest="category", help="Command category")

    # Sandbox commands
    sandbox_parser = subparsers.add_parser("sandbox", help="Sandbox operations")
    sandbox_sub = sandbox_parser.add_subparsers(dest="command", help="Sandbox command")

    # sandbox create
    create_p = sandbox_sub.add_parser("create", help="Create a new sandbox")
    create_p.add_argument("--template", "-t", help="Template name (default: base)")
    create_p.add_argument("--timeout", type=int, help="Timeout in seconds (default: 300)")
    create_p.add_argument("--metadata", "-m", action="append", help="Metadata KEY=VALUE")
    create_p.add_argument("--json", action="store_true", help="JSON output")

    # sandbox list
    list_p = sandbox_sub.add_parser("list", help="List sandboxes")
    list_p.add_argument("--json", action="store_true", help="JSON output")
    list_p.add_argument("--state", "-s", help="Filter by state")

    # sandbox status
    status_p = sandbox_sub.add_parser("status", help="Check sandbox status")
    status_p.add_argument("sandbox_id", help="Sandbox ID")
    status_p.add_argument("--json", action="store_true", help="JSON output")

    # sandbox kill
    kill_p = sandbox_sub.add_parser("kill", help="Kill a sandbox")
    kill_p.add_argument("sandbox_id", help="Sandbox ID")
    kill_p.add_argument("--json", action="store_true", help="JSON output")

    # sandbox kill-all
    kill_all_p = sandbox_sub.add_parser("kill-all", help="Kill all sandboxes")
    kill_all_p.add_argument("--confirm", action="store_true", help="Confirm action")

    # sandbox exec
    exec_p = sandbox_sub.add_parser("exec", help="Execute command in sandbox")
    exec_p.add_argument("sandbox_id", help="Sandbox ID")
    exec_p.add_argument("command", help="Command to execute")
    exec_p.add_argument("--timeout", type=int, help="Timeout in seconds (default: 120)")

    # sandbox files-read
    read_p = sandbox_sub.add_parser("files-read", help="Read file from sandbox")
    read_p.add_argument("sandbox_id", help="Sandbox ID")
    read_p.add_argument("path", help="File path")

    # sandbox files-write
    write_p = sandbox_sub.add_parser("files-write", help="Write file to sandbox")
    write_p.add_argument("sandbox_id", help="Sandbox ID")
    write_p.add_argument("path", help="File path")
    write_p.add_argument("content", help="File content")

    # sandbox files-list
    files_list_p = sandbox_sub.add_parser("files-list", help="List files in sandbox")
    files_list_p.add_argument("sandbox_id", help="Sandbox ID")
    files_list_p.add_argument("path", help="Directory path")
    files_list_p.add_argument("--json", action="store_true", help="JSON output")

    # sandbox url
    url_p = sandbox_sub.add_parser("url", help="Get public URL for port")
    url_p.add_argument("sandbox_id", help="Sandbox ID")
    url_p.add_argument("--port", type=int, help="Port number (default: 3000)")

    # Template commands
    template_parser = subparsers.add_parser("template", help="Template operations")
    template_sub = template_parser.add_subparsers(dest="command", help="Template command")

    # template list
    tpl_list_p = template_sub.add_parser("list", help="List templates")
    tpl_list_p.add_argument("--json", action="store_true", help="JSON output")

    # Auth commands
    auth_parser = subparsers.add_parser("auth", help="Authentication")
    auth_sub = auth_parser.add_subparsers(dest="command", help="Auth command")

    # auth check
    auth_check_p = auth_sub.add_parser("check", help="Check authentication")
    auth_check_p.add_argument("--json", action="store_true", help="JSON output")

    args = parser.parse_args()

    if not args.category:
        parser.print_help()
        sys.exit(0)

    # Route to appropriate handler
    handlers = {
        ("sandbox", "create"): sandbox_create,
        ("sandbox", "list"): sandbox_list,
        ("sandbox", "status"): sandbox_status,
        ("sandbox", "kill"): sandbox_kill,
        ("sandbox", "kill-all"): sandbox_kill_all,
        ("sandbox", "exec"): sandbox_exec,
        ("sandbox", "files-read"): sandbox_files_read,
        ("sandbox", "files-write"): sandbox_files_write,
        ("sandbox", "files-list"): sandbox_files_list,
        ("sandbox", "url"): sandbox_url,
        ("template", "list"): template_list,
        ("auth", "check"): auth_check,
    }

    handler = handlers.get((args.category, args.command))

    if handler:
        result = handler(args)
        sys.exit(EXIT_SUCCESS if result.success else EXIT_FAILURE)
    else:
        if args.category == "sandbox":
            sandbox_parser.print_help()
        elif args.category == "template":
            template_parser.print_help()
        elif args.category == "auth":
            auth_parser.print_help()
        else:
            parser.print_help()
        sys.exit(EXIT_INVALID_ARGS)


if __name__ == "__main__":
    main()
