#!/usr/bin/env python3
"""
Unit tests for event_reporter.py hook.

Tests the file-based event reporting functionality that enables real-time
tool activity display in the Alpha Orchestrator UI.

Run with: pytest .claude/hooks/test_event_reporter.py -v
"""

import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

# Add the hooks directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from event_reporter import (
    TOOL_DISPLAY,
    MAX_RECENT_OUTPUT,
    find_progress_file,
    format_event_for_output,
    update_progress_file,
)


class TestFormatEventForOutput:
    """Tests for format_event_for_output function."""

    def test_read_tool_with_file_path(self):
        """Read tool shows filename with emoji."""
        input_data = {
            "tool_name": "Read",
            "tool_input": {"file_path": "/home/user/project/src/dashboard.ts"},
        }
        result = format_event_for_output(input_data)
        assert result == "📖 Read: dashboard.ts"

    def test_write_tool_with_file_path(self):
        """Write tool shows filename with emoji."""
        input_data = {
            "tool_name": "Write",
            "tool_input": {"file_path": "/home/user/project/loader.ts"},
        }
        result = format_event_for_output(input_data)
        assert result == "📝 Write: loader.ts"

    def test_edit_tool_with_file_path(self):
        """Edit tool shows filename with emoji."""
        input_data = {
            "tool_name": "Edit",
            "tool_input": {"file_path": "src/components/Header.tsx"},
        }
        result = format_event_for_output(input_data)
        assert result == "✏️ Edit: Header.tsx"

    def test_bash_tool_with_short_command(self):
        """Bash tool shows short command."""
        input_data = {
            "tool_name": "Bash",
            "tool_input": {"command": "pnpm typecheck"},
        }
        result = format_event_for_output(input_data)
        assert result == "💻 Bash: pnpm typecheck"

    def test_bash_tool_with_long_command(self):
        """Bash tool truncates long commands."""
        input_data = {
            "tool_name": "Bash",
            "tool_input": {"command": "pnpm run build && pnpm test --coverage --watchAll=false"},
        }
        result = format_event_for_output(input_data)
        assert result == "💻 Bash: pnpm run build && pnpm test --..."
        assert len(result) < 50  # Should be truncated

    def test_grep_tool_with_pattern(self):
        """Grep tool shows search pattern."""
        input_data = {
            "tool_name": "Grep",
            "tool_input": {"pattern": "useEffect"},
        }
        result = format_event_for_output(input_data)
        assert result == "🔍 Grep: useEffect"

    def test_glob_tool_with_pattern(self):
        """Glob tool shows file pattern."""
        input_data = {
            "tool_name": "Glob",
            "tool_input": {"pattern": "**/*.tsx"},
        }
        result = format_event_for_output(input_data)
        assert result == "📁 Glob: **/*.tsx"

    def test_todowrite_with_tasks(self):
        """TodoWrite shows completion count."""
        input_data = {
            "tool_name": "TodoWrite",
            "tool_input": {
                "todos": [
                    {"content": "Task 1", "status": "completed"},
                    {"content": "Task 2", "status": "completed"},
                    {"content": "Task 3", "status": "in_progress"},
                    {"content": "Task 4", "status": "pending"},
                ]
            },
        }
        result = format_event_for_output(input_data)
        assert result == "📋 Todo: 2/4 done"

    def test_task_tool(self):
        """Task tool shows basic label."""
        input_data = {
            "tool_name": "Task",
            "tool_input": {"prompt": "Research codebase structure"},
        }
        result = format_event_for_output(input_data)
        assert result == "🤖 Task"

    def test_unknown_tool(self):
        """Unknown tools get generic emoji."""
        input_data = {
            "tool_name": "CustomTool",
            "tool_input": {},
        }
        result = format_event_for_output(input_data)
        assert result == "🔧 CustomTool"

    def test_missing_tool_name(self):
        """Returns None when tool_name is missing."""
        input_data = {"tool_input": {"file_path": "/some/path"}}
        result = format_event_for_output(input_data)
        assert result is None

    def test_empty_input(self):
        """Returns None for empty input."""
        result = format_event_for_output({})
        assert result is None

    def test_tool_with_path_key(self):
        """Handles 'path' key instead of 'file_path'."""
        input_data = {
            "tool_name": "Glob",
            "tool_input": {"path": "/home/user/project/src"},
        }
        result = format_event_for_output(input_data)
        assert result == "📁 Glob: src"

    def test_long_pattern_truncated(self):
        """Long patterns are truncated."""
        input_data = {
            "tool_name": "Grep",
            "tool_input": {"pattern": "this is a very long search pattern that should be truncated"},
        }
        result = format_event_for_output(input_data)
        assert "..." in result
        assert len(result) < 50


class TestUpdateProgressFile:
    """Tests for update_progress_file function."""

    def test_appends_to_existing_recent_output(self):
        """Appends new output to existing recent_output array."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {
                "feature": {"issue_number": 123, "title": "Test Feature"},
                "recent_output": ["📖 Read: file1.ts", "📝 Write: file2.ts"],
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            # Patch find_progress_file to return our test file
            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("💻 Bash: pnpm test")

            assert result is True

            # Verify file was updated
            with open(progress_file, "r") as f:
                updated = json.load(f)

            assert len(updated["recent_output"]) == 3
            assert updated["recent_output"][-1] == "💻 Bash: pnpm test"

    def test_creates_recent_output_if_missing(self):
        """Creates recent_output array if it doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {"feature": {"issue_number": 456, "title": "Another Feature"}}
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📖 Read: new-file.ts")

            assert result is True

            with open(progress_file, "r") as f:
                updated = json.load(f)

            assert "recent_output" in updated
            assert updated["recent_output"] == ["📖 Read: new-file.ts"]

    def test_rotates_at_max_capacity(self):
        """Keeps only last MAX_RECENT_OUTPUT items."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            # Fill with MAX_RECENT_OUTPUT items
            initial_progress = {
                "recent_output": [f"Line {i}" for i in range(MAX_RECENT_OUTPUT)]
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("New line")

            assert result is True

            with open(progress_file, "r") as f:
                updated = json.load(f)

            assert len(updated["recent_output"]) == MAX_RECENT_OUTPUT
            assert updated["recent_output"][-1] == "New line"
            # First item should be "Line 1" (Line 0 dropped)
            assert updated["recent_output"][0] == "Line 1"

    def test_returns_false_when_file_not_found(self):
        """Returns False when progress file doesn't exist."""
        with patch("event_reporter.find_progress_file", return_value=None):
            result = update_progress_file("Some output")
        assert result is False

    def test_returns_false_on_invalid_json(self):
        """Returns False when progress file contains invalid JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            with open(progress_file, "w") as f:
                f.write("not valid json {{{")

            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📖 Read: file.ts")

            assert result is False

    def test_atomic_write_preserves_other_fields(self):
        """Atomic write preserves all existing fields."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {
                "feature": {"issue_number": 789, "title": "Complex Feature"},
                "current_task": {"id": "T1", "name": "Implement login", "status": "in_progress"},
                "context_usage_percent": 45,
                "last_heartbeat": "2026-01-13T10:00:00Z",
                "recent_output": ["Existing line"],
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            with patch("event_reporter.find_progress_file", return_value=progress_file):
                update_progress_file("📖 Read: auth.ts")

            with open(progress_file, "r") as f:
                updated = json.load(f)

            # All original fields preserved
            assert updated["feature"]["issue_number"] == 789
            assert updated["current_task"]["id"] == "T1"
            assert updated["context_usage_percent"] == 45
            assert updated["last_heartbeat"] == "2026-01-13T10:00:00Z"
            # New output added
            assert len(updated["recent_output"]) == 2


class TestFindProgressFile:
    """Tests for find_progress_file function."""

    def test_finds_file_in_cwd(self):
        """Finds progress file in current working directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            with open(progress_file, "w") as f:
                json.dump({}, f)

            # Change to temp directory
            original_cwd = os.getcwd()
            try:
                os.chdir(tmpdir)
                result = find_progress_file()
                assert result == ".initiative-progress.json"
            finally:
                os.chdir(original_cwd)

    def test_returns_none_when_not_found(self):
        """Returns None when no progress file exists."""
        with tempfile.TemporaryDirectory() as tmpdir:
            original_cwd = os.getcwd()
            try:
                os.chdir(tmpdir)
                # Ensure no progress file exists
                result = find_progress_file()
                # May or may not find home directory file, so just ensure no crash
                assert result is None or result.endswith(".initiative-progress.json")
            finally:
                os.chdir(original_cwd)


class TestToolDisplayMapping:
    """Tests for TOOL_DISPLAY constant."""

    def test_all_common_tools_have_mapping(self):
        """All commonly used tools have emoji mappings."""
        expected_tools = [
            "Read", "Write", "Edit", "Bash", "Grep", "Glob",
            "TodoWrite", "Task", "WebFetch", "WebSearch",
            "AskUserQuestion", "LSP", "NotebookEdit", "Skill",
        ]
        for tool in expected_tools:
            assert tool in TOOL_DISPLAY, f"Missing mapping for {tool}"
            assert TOOL_DISPLAY[tool].startswith(("📖", "📝", "✏️", "💻", "🔍", "📁", "📋", "🤖", "🌐", "🔎", "❓", "🔧", "📓", "⚡"))

    def test_mapping_has_emoji_and_name(self):
        """Each mapping includes emoji and tool name."""
        for tool, display in TOOL_DISPLAY.items():
            # Should have emoji followed by space and name
            parts = display.split(" ", 1)
            assert len(parts) == 2, f"Invalid format for {tool}: {display}"
            assert len(parts[0]) <= 4  # Emoji is 1-4 chars


class TestHookBehavior:
    """Tests for overall hook behavior."""

    def test_silent_failure_on_file_error(self):
        """Hook fails silently when file operations fail."""
        # Permission denied simulation - returns False, no exception
        with patch("event_reporter.find_progress_file", return_value="/nonexistent/path/.progress.json"):
            result = update_progress_file("Some output")
        assert result is False

    def test_max_recent_output_constant(self):
        """MAX_RECENT_OUTPUT is set to reasonable value."""
        assert MAX_RECENT_OUTPUT == 10  # Reduced from 20 to minimize memory footprint
        assert isinstance(MAX_RECENT_OUTPUT, int)


class TestDeduplication:
    """Tests for consecutive duplicate event deduplication."""

    def test_deduplicates_consecutive_identical_events(self):
        """Skips appending when identical to last entry."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {
                "recent_output": ["📖 Read: file1.ts", "📝 Write: file2.ts"],
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            # Try to add duplicate of last entry
            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📝 Write: file2.ts")

            assert result is True  # Returns True (success) but doesn't duplicate

            with open(progress_file, "r") as f:
                updated = json.load(f)

            # Should still have only 2 entries (duplicate not added)
            assert len(updated["recent_output"]) == 2
            assert updated["recent_output"] == ["📖 Read: file1.ts", "📝 Write: file2.ts"]

    def test_allows_different_events_after_same_tool(self):
        """Allows different events even from same tool."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {
                "recent_output": ["📖 Read: file1.ts"],
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            # Add different file with same tool
            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📖 Read: file2.ts")

            assert result is True

            with open(progress_file, "r") as f:
                updated = json.load(f)

            # Should have both entries (different content)
            assert len(updated["recent_output"]) == 2
            assert updated["recent_output"] == ["📖 Read: file1.ts", "📖 Read: file2.ts"]

    def test_allows_non_consecutive_duplicates(self):
        """Allows duplicates that are not consecutive."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {
                "recent_output": ["📖 Read: file1.ts", "📝 Write: file2.ts"],
            }
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            # Add same as first entry (not consecutive duplicate)
            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📖 Read: file1.ts")

            assert result is True

            with open(progress_file, "r") as f:
                updated = json.load(f)

            # Should have 3 entries (non-consecutive duplicate allowed)
            assert len(updated["recent_output"]) == 3
            assert updated["recent_output"][-1] == "📖 Read: file1.ts"

    def test_dedup_on_empty_list_appends(self):
        """Appends to empty list without error."""
        with tempfile.TemporaryDirectory() as tmpdir:
            progress_file = os.path.join(tmpdir, ".initiative-progress.json")
            initial_progress = {"recent_output": []}
            with open(progress_file, "w") as f:
                json.dump(initial_progress, f)

            with patch("event_reporter.find_progress_file", return_value=progress_file):
                result = update_progress_file("📖 Read: first.ts")

            assert result is True

            with open(progress_file, "r") as f:
                updated = json.load(f)

            assert len(updated["recent_output"]) == 1
            assert updated["recent_output"] == ["📖 Read: first.ts"]
