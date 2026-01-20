#!/usr/bin/env python3
"""
Unit tests for task_progress.py hook.

Tests the task ID extraction and fallback logic that ensures
consistent task IDs in the orchestrator UI.

Run with: pytest .claude/hooks/test_task_progress.py -v
"""

import sys
from pathlib import Path

import pytest

# Add the hooks directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from task_progress import extract_task_id


class TestExtractTaskId:
    """Tests for extract_task_id function."""

    def test_extracts_T_number_with_colon(self):
        """Extracts task ID from 'T1: Task name' format."""
        result = extract_task_id("T1: Implement feature")
        assert result == "T1"

    def test_extracts_T_number_with_space(self):
        """Extracts task ID from 'T1 Task name' format."""
        result = extract_task_id("T1 Implement feature")
        assert result == "T1"

    def test_extracts_T_number_in_brackets(self):
        """Extracts task ID from '[T1] Task name' format."""
        result = extract_task_id("[T1] Implement feature")
        assert result == "T1"

    def test_extracts_multi_digit_task_id(self):
        """Extracts task ID with multiple digits."""
        result = extract_task_id("T12: Long task description")
        assert result == "T12"

    def test_returns_none_for_no_match(self):
        """Returns None when no task ID pattern found."""
        result = extract_task_id("Load feature context and tasks.json")
        assert result is None

    def test_returns_none_for_empty_string(self):
        """Returns None for empty string."""
        result = extract_task_id("")
        assert result is None

    def test_returns_none_for_none_input(self):
        """Returns None for None input."""
        result = extract_task_id(None)
        assert result is None

    def test_extracts_from_active_form(self):
        """Extracts task ID from activeForm field content."""
        result = extract_task_id("Implementing T5 feature component")
        assert result == "T5"

    def test_ignores_non_task_T_prefixes(self):
        """Does not extract non-task T patterns."""
        # 'The' starts with T but is not a task ID
        result = extract_task_id("The quick brown fox")
        assert result is None

    def test_extracts_task_at_start(self):
        """Extracts task ID when at start of string."""
        result = extract_task_id("T3: Third task")
        assert result == "T3"

    def test_extracts_task_in_middle(self):
        """Extracts task ID when in middle of string."""
        result = extract_task_id("Working on T7 now")
        assert result == "T7"

    def test_handles_task_with_brackets_and_colon(self):
        """Handles mixed format '[T1]: Task name'."""
        result = extract_task_id("[T2]: Another task")
        assert result == "T2"
