#!/usr/bin/env python3
"""
Universal event reporter hook for Alpha Orchestrator.

Primary method: Write events to .initiative-progress.json file (file-based)
Fallback method: POST events to the orchestrator's event server (HTTP)

The file-based approach is used because E2B sandboxes cannot reach localhost
on the orchestrator machine - they are isolated cloud VMs. The orchestrator
polls progress files via E2B APIs (same mechanism as heartbeats).

Uses only stdlib to avoid dependency issues in E2B sandboxes.

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
MAX_RECENT_OUTPUT = 10  # Keep only last N output lines (reduced from 20 to minimize memory footprint)


# =============================================================================
# File-Based Event Reporting (Primary Method)
# =============================================================================

# Tool display names with emoji icons (mirrors UI formatting in ui/index.tsx)
TOOL_DISPLAY = {
    "Read": "📖 Read",
    "Write": "📝 Write",
    "Edit": "✏️ Edit",
    "Bash": "💻 Bash",
    "Grep": "🔍 Grep",
    "Glob": "📁 Glob",
    "TodoWrite": "📋 Todo",
    "Task": "🤖 Task",
    "WebFetch": "🌐 WebFetch",
    "WebSearch": "🔎 Search",
    "AskUserQuestion": "❓ AskUser",
    "LSP": "🔧 LSP",
    "NotebookEdit": "📓 Notebook",
    "Skill": "⚡ Skill",
}


def find_progress_file() -> str | None:
    """Find .initiative-progress.json in workspace or sandboxed project.

    Searches common locations where the progress file might exist.
    Returns the first path that exists, or None if not found.
    """
    candidates = [
        ".initiative-progress.json",
        "/home/user/project/.initiative-progress.json",
        os.path.expanduser("~/.initiative-progress.json"),
        os.path.join(os.getcwd(), ".initiative-progress.json"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def format_event_for_output(input_data: dict) -> str | None:
    """Format event for output display (matching UI formatting).

    Args:
        input_data: Hook input containing tool_name, tool_input, etc.

    Returns:
        Formatted string like "📖 Read: filename.ts" or None if not displayable.
    """
    tool_name = input_data.get("tool_name")
    if not tool_name:
        return None

    display_name = TOOL_DISPLAY.get(tool_name, f"🔧 {tool_name}")

    # Extract file path from tool_input if available
    tool_input = input_data.get("tool_input")
    if isinstance(tool_input, dict):
        # For file operations, include the path
        file_path = tool_input.get("file_path") or tool_input.get("path")
        if file_path:
            # Shorten long paths to just filename
            short_path = file_path.split("/")[-1] if "/" in file_path else file_path
            if len(file_path) > 40:
                return f"{display_name}: {short_path}"
            return f"{display_name}: {short_path}"

        # For TodoWrite, include task summary
        if "todos" in tool_input:
            todos = tool_input["todos"]
            completed = sum(1 for t in todos if t.get("status") == "completed")
            total = len(todos)
            return f"{display_name}: {completed}/{total} done"

        # For Bash, include short command preview
        command = tool_input.get("command")
        if command:
            # Truncate long commands
            short_cmd = command[:30] + "..." if len(command) > 30 else command
            return f"{display_name}: {short_cmd}"

        # For Grep/Glob, include pattern
        pattern = tool_input.get("pattern")
        if pattern:
            short_pattern = pattern[:25] + "..." if len(pattern) > 25 else pattern
            return f"{display_name}: {short_pattern}"

    return display_name


def update_progress_file(new_output: str) -> bool:
    """Append output line to progress file's recent_output array.

    Uses atomic writes via temp file + os.replace() to prevent corruption
    from concurrent hook executions.

    Args:
        new_output: Formatted output line to append.

    Returns:
        True on success, False on any error (fails silently).
    """
    try:
        progress_file = find_progress_file()
        if not progress_file:
            return False

        # Read existing progress
        try:
            with open(progress_file, "r") as f:
                progress = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # File doesn't exist or is invalid - skip update
            return False

        # Initialize recent_output if missing
        if "recent_output" not in progress:
            progress["recent_output"] = []

        # Deduplicate: skip if identical to last entry (prevents consecutive duplicates)
        if progress["recent_output"] and progress["recent_output"][-1] == new_output:
            return True  # Already present, skip append

        # Append new output
        progress["recent_output"].append(new_output)

        # Keep only last MAX_RECENT_OUTPUT items (FIFO rotation)
        if len(progress["recent_output"]) > MAX_RECENT_OUTPUT:
            progress["recent_output"] = progress["recent_output"][-MAX_RECENT_OUTPUT:]

        # Atomic write via temp file
        temp_file = f"{progress_file}.tmp"
        with open(temp_file, "w") as f:
            json.dump(progress, f)
        os.replace(temp_file, progress_file)

        return True
    except Exception:
        # Fail silently - don't block Claude
        return False


# =============================================================================
# HTTP Event Reporting (Fallback Method)
# =============================================================================


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
    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # No valid input, exit silently
        sys.exit(0)
    except Exception:
        sys.exit(0)

    # PRIMARY METHOD: Write to progress file (works in E2B sandboxes)
    # This is the main event reporting mechanism since sandboxes can't reach
    # localhost on the orchestrator. The orchestrator polls these files via E2B API.
    output_line = format_event_for_output(input_data)
    if output_line:
        update_progress_file(output_line)

    # FALLBACK METHOD: HTTP POST (works when orchestrator is locally accessible)
    # Kept for backwards compatibility and potential future use with tunnels
    orchestrator_url = get_orchestrator_url()
    if orchestrator_url:
        event = build_event(input_data)
        post_event(orchestrator_url, event)

    # Always exit 0 to avoid blocking Claude
    sys.exit(0)


if __name__ == "__main__":
    main()
