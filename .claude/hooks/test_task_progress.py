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


class TestExtractSemanticTaskId:
    """Tests for semantic task ID extraction (S#.I#.F#.T# format)."""

    def test_extracts_semantic_id_in_brackets(self):
        """Extracts semantic task ID from '[S1692.I1.F1.T1] Task name' format."""
        result = extract_task_id("[S1692.I1.F1.T1] Create dashboard types")
        assert result == "S1692.I1.F1.T1"

    def test_extracts_semantic_id_with_colon(self):
        """Extracts semantic task ID from 'S1692.I1.F1.T1: Task name' format."""
        result = extract_task_id("S1692.I1.F1.T1: Create dashboard types")
        assert result == "S1692.I1.F1.T1"

    def test_extracts_semantic_id_with_space(self):
        """Extracts semantic task ID from 'S1692.I1.F1.T1 Task name' format."""
        result = extract_task_id("S1692.I1.F1.T1 Create dashboard types")
        assert result == "S1692.I1.F1.T1"

    def test_semantic_id_priority_over_legacy(self):
        """Semantic IDs have priority over legacy T# IDs."""
        # Contains both semantic and legacy, semantic should be extracted
        result = extract_task_id("[S1692.I1.F1.T1] T5 Create types")
        assert result == "S1692.I1.F1.T1"

    def test_extracts_multi_digit_semantic_components(self):
        """Extracts semantic IDs with multi-digit components."""
        result = extract_task_id("[S9999.I12.F345.T67] Multi-digit task")
        assert result == "S9999.I12.F345.T67"

    def test_extracts_from_active_form_semantic(self):
        """Extracts semantic ID from activeForm-style content."""
        result = extract_task_id("[S1692.I1.F1.T3] Creating dashboard skeleton")
        assert result == "S1692.I1.F1.T3"

    def test_does_not_match_partial_semantic_id(self):
        """Does not match partial semantic patterns."""
        # Missing .T# suffix
        result = extract_task_id("S1692.I1.F1 Create types")
        assert result is None

    def test_extracts_semantic_in_middle_of_string(self):
        """Extracts semantic ID when in middle of string."""
        result = extract_task_id("Working on [S1692.I1.F2.T4] data loader")
        assert result == "S1692.I1.F2.T4"

    def test_handles_mixed_format_legacy_fallback(self):
        """Falls back to legacy format when no semantic ID present."""
        result = extract_task_id("[T3] Create data loader")
        assert result == "T3"
