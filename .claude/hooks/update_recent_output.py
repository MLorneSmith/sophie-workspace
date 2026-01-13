#!/usr/bin/env python3
"""
PostToolUse hook to update recent_output in progress JSON files.

Updates the sandbox progress file's recent_output field with the most recent
tool calls, providing real-time visibility into Claude's activity.

This hook maintains a rolling buffer of the last 10 tool activities to
prevent file bloat while keeping the UI updated.

Input (JSON from stdin):
{
    "tool_name": "Write",
    "tool_input": {...},
    "session_id": "abc123"
}

Output: None (exit 0 for success)
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configuration
MAX_RECENT_ITEMS = 10  # Keep last N items in rolling buffer
ALPHA_PROGRESS_DIR = Path(".ai/alpha/progress")

# Tool name display mapping for cleaner output
TOOL_DISPLAY_NAMES = {
    "Read": "📖 Read",
    "Write": "📝 Write",
    "Edit": "✏️ Edit",
    "Bash": "💻 Bash",
    "Grep": "🔍 Grep",
    "Glob": "📁 Glob",
    "TodoWrite": "📋 TodoWrite",
    "Task": "🤖 Task",
    "WebFetch": "🌐 WebFetch",
    "WebSearch": "🔎 WebSearch",
    "AskUserQuestion": "❓ AskUser",
    "LSP": "🔧 LSP",
}


def get_sandbox_id() -> str | None:
    """Get the sandbox ID from environment."""
    return os.environ.get("E2B_SANDBOX_ID")


def get_progress_file_path(sandbox_id: str) -> Path | None:
    """Find the progress file for this sandbox."""
    # Map sandbox ID prefixes to file names
    # Format: sbx-a-progress.json, sbx-b-progress.json, etc.
    if not ALPHA_PROGRESS_DIR.exists():
        return None

    # Try to find a matching progress file
    for progress_file in ALPHA_PROGRESS_DIR.glob("sbx-*-progress.json"):
        try:
            content = json.loads(progress_file.read_text())
            if content.get("sandbox_id") == sandbox_id:
                return progress_file
        except Exception:
            continue

    return None


def format_tool_activity(input_data: dict) -> str | None:
    """Format tool activity into a human-readable string."""
    tool_name = input_data.get("tool_name", "unknown")
    tool_input = input_data.get("tool_input", {})

    # Get display name with emoji
    display_name = TOOL_DISPLAY_NAMES.get(tool_name, f"🔧 {tool_name}")

    # Format based on tool type
    if tool_name in ("Read", "Write", "Edit"):
        # File operations - show file path
        file_path = tool_input.get("file_path", tool_input.get("path", ""))
        if file_path:
            # Shorten path for display
            short_path = Path(file_path).name if len(file_path) > 40 else file_path
            return f"{display_name}: {short_path}"
        return display_name

    elif tool_name == "Bash":
        # Shell commands - show truncated command
        command = tool_input.get("command", "")
        if command:
            # Truncate long commands
            short_cmd = command[:50] + "..." if len(command) > 50 else command
            # Remove newlines for single-line display
            short_cmd = short_cmd.replace("\n", " ").strip()
            return f"{display_name}: {short_cmd}"
        return display_name

    elif tool_name in ("Grep", "Glob"):
        # Search operations - show pattern
        pattern = tool_input.get("pattern", "")
        if pattern:
            short_pattern = pattern[:30] + "..." if len(pattern) > 30 else pattern
            return f"{display_name}: {short_pattern}"
        return display_name

    elif tool_name == "TodoWrite":
        # Todo operations - show task summary
        todos = tool_input.get("todos", [])
        if todos:
            in_progress = sum(1 for t in todos if t.get("status") == "in_progress")
            completed = sum(1 for t in todos if t.get("status") == "completed")
            return f"{display_name}: {completed}/{len(todos)} done, {in_progress} active"
        return display_name

    elif tool_name == "Task":
        # Agent tasks - show agent type
        agent_type = tool_input.get("subagent_type", "")
        description = tool_input.get("description", "")
        if agent_type:
            return f"{display_name}: {agent_type} - {description[:30]}"
        return display_name

    else:
        # Default - just show tool name
        return display_name


def update_progress_file(progress_file: Path, new_activity: str) -> bool:
    """Update the progress file with new activity."""
    try:
        # Read existing progress
        content = json.loads(progress_file.read_text())

        # Initialize recent_output if missing
        if "recent_output" not in content:
            content["recent_output"] = []

        # Add new activity to the end
        content["recent_output"].append(new_activity)

        # Keep only the last N items (rolling buffer)
        if len(content["recent_output"]) > MAX_RECENT_ITEMS:
            content["recent_output"] = content["recent_output"][-MAX_RECENT_ITEMS:]

        # Update timestamp
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        content["last_output_update"] = now

        # Write atomically using temp file + rename
        temp_file = progress_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(content, indent="\t"))
        temp_file.rename(progress_file)

        return True

    except Exception as e:
        print(f"Error updating progress file: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point."""
    # Get sandbox ID - exit silently if not in sandbox
    sandbox_id = get_sandbox_id()
    if not sandbox_id:
        # Not running in E2B sandbox, exit silently
        sys.exit(0)

    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # No valid input, exit silently
        sys.exit(0)
    except Exception:
        sys.exit(0)

    # Find progress file for this sandbox
    progress_file = get_progress_file_path(sandbox_id)
    if not progress_file:
        # No progress file found, exit silently
        sys.exit(0)

    # Format the tool activity
    activity = format_tool_activity(input_data)
    if not activity:
        sys.exit(0)

    # Update the progress file
    update_progress_file(progress_file, activity)

    # Always exit 0 to avoid blocking Claude
    sys.exit(0)


if __name__ == "__main__":
    main()
