#!/usr/bin/env python3
"""
Tests for agent_loop/common.py shared infrastructure.

Tests the AgentLoop class including:
- MC task polling (query by assigned_agent)
- Spawn queue management
- Safety rails (concurrency, cooldown, memory gate, hours)
- Discord notifications (parameterized)
"""

import json
import os
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


class TestAgentLoopBasics:
    """Test basic AgentLoop functionality."""

    def test_agent_loop_initialization(self):
        """Test AgentLoop instance is created with correct defaults."""
        from agent_loop.common import AgentLoop

        loop = AgentLoop(
            agent="test-agent",
            discord_channel="channel:123",
            operating_hours=(9, 17),
            dedup_window_min=60,
            max_daily_attempts=5,
        )

        assert loop.agent == "test-agent"
        assert loop.discord_channel == "channel:123"
        assert loop.operating_hours == (9, 17)
        assert loop.dedup_window_min == 60
        assert loop.max_daily_attempts == 5

    def test_state_directory_created(self):
        """Test state directory is created on initialization."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent")

                # State dir should be created
                assert loop.state_dir.exists()
                assert "test-agent-loop" in str(loop.state_dir)


class TestSafetyRails:
    """Test safety rail functions."""

    def test_should_skip_outside_hours(self):
        """Test should_skip returns True outside operating hours."""
        from agent_loop.common import AgentLoop
        import zoneinfo

        loop = AgentLoop(agent="test-agent", operating_hours=(9, 17))

        # Mock to return a time outside operating hours (8 AM)
        mock_tz = zoneinfo.ZoneInfo("America/Toronto")

        # Create a mock datetime that returns hour 8
        with patch("agent_loop.common.datetime") as mock_datetime:
            mock_now = datetime(2024, 1, 1, 8, 0, 0, tzinfo=mock_tz)
            mock_datetime.now.return_value = mock_now

            result = loop.should_skip()
            assert result is True

    def test_check_memory_insufficient(self):
        """Test check_memory returns False when memory is low."""
        from agent_loop.common import AgentLoop

        loop = AgentLoop(agent="test-agent", min_memory_mb=1000)

        with patch("agent_loop.common.get_available_memory_mb", return_value=500):
            result = loop.check_memory()
            assert result is False

    def test_check_memory_sufficient(self):
        """Test check_memory returns True when memory is OK."""
        from agent_loop.common import AgentLoop

        loop = AgentLoop(agent="test-agent", min_memory_mb=500)

        with patch("agent_loop.common.get_available_memory_mb", return_value=1000):
            result = loop.check_memory()
            assert result is True


class TestConcurrencyLocks:
    """Test concurrency lock functionality."""

    def test_set_and_clear_active_run(self):
        """Test setting and clearing active runs."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent")

                # Set an active run
                loop.set_active_run("task-123", "ci-fix")
                runs = loop.get_active_runs()
                assert "task-123" in runs

                # Clear the active run
                loop.clear_active_run("task-123")
                runs = loop.get_active_runs()
                assert "task-123" not in runs

    def test_is_active_expired(self):
        """Test is_active returns False for expired locks."""
        from agent_loop.common import AgentLoop, save_json

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent", lock_expire_min=1)

                # Set a run with an old timestamp (timezone-aware to match code)
                old_time = datetime(2020, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
                runs = {"task-old": {"type": "ci-fix", "started": old_time.isoformat()}}
                save_json(loop.lock_file, runs)

                # Should return False (expired)
                result = loop.is_active("task-old")
                assert result is False

    def test_is_active_valid(self):
        """Test is_active returns True for valid locks."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent", lock_expire_min=60)

                # Set a run with current timestamp
                loop.set_active_run("task-current", "ci-fix")

                result = loop.is_active("task-current")
                assert result is True


class TestCooldownTracking:
    """Test cooldown tracking functionality."""

    def test_check_cooldown_new_day(self):
        """Test check_cooldown returns True on a new day."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent", max_daily_attempts=3)

                # Should return True (no attempts yet today)
                result = loop.check_cooldown("new-task")
                assert result is True

    def test_record_attempt(self):
        """Test recording spawn attempts."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent")

                # Record an attempt
                loop.record_attempt("task-123")

                # Check cooldown tracking
                cooldowns = loop.check_cooldown("task-123")
                # Should still be OK (1 attempt, 3 max)
                assert cooldowns is True


class TestSpawnQueue:
    """Test spawn queue functionality."""

    def test_queue_spawn(self):
        """Test adding a task to the spawn queue."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                with patch.object(loop := AgentLoop(agent="test-agent"), "notify"):
                    with patch.object(loop, "_trigger_processor"):
                        result = loop.queue_spawn(
                            task="Fix bug",
                            label="fix-bug-123",
                            task_key="PR#123-fix",
                            task_type="fix",
                        )

                        assert result is True
                        # Queue should have the task
                        assert loop.spawn_queue.exists()

    def test_queue_spawn_duplicate(self):
        """Test duplicate spawns are skipped."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                with patch.object(loop := AgentLoop(agent="test-agent"), "notify"):
                    with patch.object(loop, "_trigger_processor"):
                        # First queue
                        loop.queue_spawn(
                            task="Fix bug",
                            label="fix-bug-123",
                            task_key="PR#123-fix",
                            task_type="fix",
                        )

                        # Second queue should be skipped (dedup)
                        result = loop.queue_spawn(
                            task="Fix bug again",
                            label="fix-bug-123",
                            task_key="PR#123-fix",
                            task_type="fix",
                        )

                        assert result is False

    def test_is_recently_queued(self):
        """Test checking if task was recently queued."""
        from agent_loop.common import AgentLoop

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(Path, "home", return_value=Path(tmpdir)):
                loop = AgentLoop(agent="test-agent")

                # Write directly to queue
                with open(loop.spawn_queue, "w") as f:
                    f.write(json.dumps({
                        "task_key": "test-task",
                        "requested_at": datetime.now(timezone.utc).isoformat(),
                    }) + "\n")

                result = loop.is_recently_queued("test-task")
                assert result is True


class TestMCTaskPolling:
    """Test Mission Control task polling."""

    @patch("urllib.request.urlopen")
    def test_get_mc_tasks(self, mock_urlopen):
        """Test fetching MC tasks."""
        from agent_loop.common import AgentLoop

        # Mock response
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([
            {"id": 1, "name": "Task 1", "assignedAgent": "neo"},
            {"id": 2, "name": "Task 2", "assignedAgent": "neo"},
        ])
        mock_urlopen.return_value.__enter__ = MagicMock(return_value=mock_response)
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        tasks = AgentLoop.get_mc_tasks(agent="neo", status="backlog")

        assert len(tasks) == 2
        assert tasks[0]["id"] == 1
        assert tasks[1]["id"] == 2

    @patch("urllib.request.urlopen")
    def test_get_mc_tasks_empty(self, mock_urlopen):
        """Test fetching MC tasks when none exist."""
        from agent_loop.common import AgentLoop

        # Mock empty response
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([])
        mock_urlopen.return_value.__enter__ = MagicMock(return_value=mock_response)
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        tasks = AgentLoop.get_mc_tasks(agent="neo", status="backlog")

        assert tasks == []

    @patch("urllib.request.urlopen")
    def test_get_mc_tasks_error(self, mock_urlopen):
        """Test fetching MC tasks handles errors gracefully."""
        from agent_loop.common import AgentLoop

        mock_urlopen.side_effect = Exception("Connection error")

        tasks = AgentLoop.get_mc_tasks(agent="neo", status="backlog")

        assert tasks == []

    @patch("urllib.request.urlopen")
    def test_update_mc_task(self, mock_urlopen):
        """Test updating an MC task."""
        from agent_loop.common import AgentLoop

        # Mock response
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({"id": 1, "status": "done"})
        mock_urlopen.return_value.__enter__ = MagicMock(return_value=mock_response)
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        result = AgentLoop.update_mc_task(1, status="done")

        assert result["status"] == "done"


class TestNotifications:
    """Test Discord notification functionality."""

    def test_notify_no_channel(self):
        """Test notify is skipped when no channel configured."""
        from agent_loop.common import AgentLoop

        loop = AgentLoop(agent="test-agent", discord_channel=None)

        # Should not raise, just skip
        loop.notify("Test message")

    @patch("subprocess.run")
    def test_notify_with_channel(self, mock_run):
        """Test notify sends message to Discord."""
        from agent_loop.common import AgentLoop

        loop = AgentLoop(agent="test-agent", discord_channel="channel:123")

        loop.notify("Test message")

        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert "openclaw" in args
        assert "message" in args
        assert "send" in args


class TestHelperFunctions:
    """Test helper functions."""

    def test_load_json(self):
        """Test loading JSON from file."""
        from agent_loop.common import load_json

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump({"key": "value"}, f)
            f.flush()

            result = load_json(Path(f.name))
            assert result == {"key": "value"}

            Path(f.name).unlink()

    def test_load_json_default(self):
        """Test load_json returns default for missing file."""
        from agent_loop.common import load_json

        result = load_json(Path("/nonexistent/file.json"), {"default": True})
        assert result == {"default": True}

    def test_save_json(self):
        """Test saving JSON to file."""
        from agent_loop.common import save_json

        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test.json"
            save_json(path, {"key": "value"})

            assert path.exists()
            with open(path) as f:
                result = json.load(f)
            assert result == {"key": "value"}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
