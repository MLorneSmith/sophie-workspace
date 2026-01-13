#!/usr/bin/env python3
"""
Universal event reporter hook for Alpha Orchestrator.

POSTs events to the orchestrator's event server for real-time streaming.
Uses only stdlib (urllib.request) to avoid dependency issues in E2B sandboxes.

Environment variables:
    ORCHESTRATOR_URL - Base URL of the event server (e.g., http://host.docker.internal:9000)
    E2B_SANDBOX_ID - Sandbox identifier (e.g., sbx-abc123)
    HOOK_EVENT_TYPE - Event type (post_tool_use, subagent_stop, stop, heartbeat)

Input (JSON from stdin):
    Hook-specific payload from Claude Code

Output:
    Writes to stderr on error, always exits 0 (fail silently)
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Configuration
TIMEOUT_SECONDS = 2  # Short timeout to avoid blocking Claude
DEFAULT_PORT = 9000


def get_orchestrator_url() -> str | None:
    """Get the orchestrator URL from environment."""
    url = os.environ.get("ORCHESTRATOR_URL")
    if url:
        return url.rstrip("/")
    return None


def get_sandbox_id() -> str:
    """Get the sandbox ID from environment."""
    return os.environ.get("E2B_SANDBOX_ID", "unknown-sandbox")


def get_event_type() -> str:
    """Get the event type from environment."""
    return os.environ.get("HOOK_EVENT_TYPE", "unknown")


def build_event(input_data: dict) -> dict:
    """Build event payload from hook input."""
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    event = {
        "sandbox_id": get_sandbox_id(),
        "event_type": get_event_type(),
        "timestamp": now,
        "session_id": input_data.get("session_id"),
    }

    # Add tool-specific data
    if "tool_name" in input_data:
        event["tool_name"] = input_data["tool_name"]

    if "tool_input" in input_data:
        # Include a summary, not the full input (to avoid large payloads)
        tool_input = input_data["tool_input"]
        if isinstance(tool_input, dict):
            # For file operations, include the path
            if "file_path" in tool_input:
                event["file_path"] = tool_input["file_path"]
            elif "path" in tool_input:
                event["file_path"] = tool_input["path"]
            # For TodoWrite, include task summary
            if "todos" in tool_input:
                todos = tool_input["todos"]
                event["todo_summary"] = {
                    "completed": sum(1 for t in todos if t.get("status") == "completed"),
                    "in_progress": sum(1 for t in todos if t.get("status") == "in_progress"),
                    "pending": sum(1 for t in todos if t.get("status") == "pending"),
                    "total": len(todos),
                }

    # Add tool result summary if present
    if "tool_result" in input_data:
        result = input_data["tool_result"]
        if isinstance(result, dict):
            event["result_success"] = result.get("success", True)
            if "error" in result:
                event["result_error"] = str(result["error"])[:200]

    # For subagent events
    if "subagent_id" in input_data:
        event["subagent_id"] = input_data["subagent_id"]
    if "subagent_type" in input_data:
        event["subagent_type"] = input_data["subagent_type"]

    # For stop events
    if "exit_reason" in input_data:
        event["exit_reason"] = input_data["exit_reason"]
    if "exit_code" in input_data:
        event["exit_code"] = input_data["exit_code"]

    return event


def post_event(url: str, event: dict) -> bool:
    """POST event to the server. Returns True on success."""
    try:
        data = json.dumps(event).encode("utf-8")
        request = Request(
            f"{url}/api/events",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )

        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            if response.status == 200:
                return True
            else:
                print(f"Event server returned status {response.status}", file=sys.stderr)
                return False

    except HTTPError as e:
        print(f"HTTP error posting event: {e.code} {e.reason}", file=sys.stderr)
        return False
    except URLError as e:
        print(f"URL error posting event: {e.reason}", file=sys.stderr)
        return False
    except TimeoutError:
        print("Timeout posting event", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error posting event: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point."""
    # Get orchestrator URL - exit silently if not configured
    orchestrator_url = get_orchestrator_url()
    if not orchestrator_url:
        # Event streaming not configured, exit silently
        sys.exit(0)

    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # No valid input, exit silently
        sys.exit(0)
    except Exception:
        sys.exit(0)

    # Build and send event
    event = build_event(input_data)
    post_event(orchestrator_url, event)

    # Always exit 0 to avoid blocking Claude
    sys.exit(0)


if __name__ == "__main__":
    main()
