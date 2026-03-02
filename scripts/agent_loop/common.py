"""
Shared utilities for all Agent Loop detection scripts.

Every agent's detection scripts (neo, kvoth, hemingway, etc.) import from here
for spawn queue management, safety rails, Discord notifications, and system checks.

Agent-specific logic (e.g., Neo's GitHub polling) stays in agent-specific files.

Usage:
    from agent_loop import AgentLoop

    loop = AgentLoop("neo", discord_channel="channel:1477061196795478199")
    if loop.should_skip():
        sys.exit(0)
    if not loop.check_memory():
        sys.exit(0)
    loop.queue_spawn(task="...", label="fix-ci-123", task_key="PR#123-ci-fix")
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Low-level helpers (stateless)
# ---------------------------------------------------------------------------

def log(msg: str):
    """Timestamped log to stdout."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def load_json(path: Path, default=None):
    if default is None:
        default = {}
    if path.exists():
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return default
    return default


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def get_available_memory_mb() -> int:
    """Get available system memory in MB from /proc/meminfo."""
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) // 1024
    except Exception:
        pass
    return 9999  # Assume OK if can't read


def get_env_with_path() -> dict:
    """Return os.environ with PATH that includes npm-global and standard dirs."""
    return {
        **os.environ,
        "PATH": "/usr/local/bin:/home/ubuntu/.npm-global/bin:/usr/bin:/bin:"
                + os.environ.get("PATH", ""),
    }


# ---------------------------------------------------------------------------
# AgentLoop — per-agent instance with shared safety rails
# ---------------------------------------------------------------------------

class AgentLoop:
    """
    Encapsulates shared agent loop infrastructure for a single agent.

    Each agent creates one instance with their name and Discord channel.
    All state files live under ~/clawd/state/{agent}-loop/.

    Parameters:
        agent: Agent identifier (e.g., "neo", "kvoth", "hemingway")
        discord_channel: Discord channel target for notifications.
            Can be a channel ID like "channel:123456" or a name like "#kvoth".
            If None, notifications are skipped.
        min_memory_mb: Minimum available MB to allow spawning (default 500)
        operating_hours: Tuple of (start_hour, end_hour) in ET (default 8-23)
        dedup_window_min: Minutes within which duplicate queue entries are skipped (default 30)
        max_daily_attempts: Max spawn attempts per task_key per day before cooldown (default 3)
        lock_expire_min: Minutes after which active run locks auto-expire (default 45)
        default_model: Model to use for spawned sessions
        default_timeout: Default timeout in seconds for spawned sessions
    """

    def __init__(
        self,
        agent: str,
        discord_channel: str | None = None,
        min_memory_mb: int = 500,
        operating_hours: tuple[int, int] = (8, 23),
        dedup_window_min: int = 30,
        max_daily_attempts: int = 3,
        lock_expire_min: int = 45,
        default_model: str = "minimax/MiniMax-M2.5-highspeed",
        default_timeout: int = 1800,
    ):
        self.agent = agent
        self.discord_channel = discord_channel
        self.min_memory_mb = min_memory_mb
        self.operating_hours = operating_hours
        self.dedup_window_min = dedup_window_min
        self.max_daily_attempts = max_daily_attempts
        self.lock_expire_min = lock_expire_min
        self.default_model = default_model
        self.default_timeout = default_timeout

        # State directory
        self.state_dir = Path.home() / "clawd" / "state" / f"{agent}-loop"
        self.state_dir.mkdir(parents=True, exist_ok=True)

        # State files
        self.spawn_queue = self.state_dir / "spawn-queue.jsonl"
        self.lock_file = self.state_dir / "active-runs.json"
        self.cooldown_file = self.state_dir / "cooldown.json"
        self.archive_dir = self.state_dir / "archive"

        # Spawn queue processor (agent-specific if exists, else shared)
        agent_processor = Path.home() / "clawd" / "scripts" / f"{agent}-loop" / "process-spawn-queue.py"
        shared_processor = Path(__file__).parent / "process-spawn-queue.py"
        self.spawn_queue_script = agent_processor if agent_processor.exists() else shared_processor

    # -------------------------------------------------------------------
    # Pre-flight checks
    # -------------------------------------------------------------------

    def should_skip(self) -> bool:
        """Check if outside operating hours (ET). Returns True if should skip."""
        try:
            from zoneinfo import ZoneInfo
            et = ZoneInfo("America/Toronto")
        except ImportError:
            import pytz
            et = pytz.timezone("America/Toronto")
        now = datetime.now(et)
        start, end = self.operating_hours
        if now.hour < start or now.hour > end:
            log(f"[{self.agent}] Outside operating hours ({now.hour}:00 ET), skipping")
            return True
        return False

    def check_memory(self) -> bool:
        """Check if enough memory is available. Returns True if OK."""
        avail = get_available_memory_mb()
        if avail < self.min_memory_mb:
            log(f"[{self.agent}] Low memory ({avail}MB free, need {self.min_memory_mb}MB), skipping")
            return False
        return True

    # -------------------------------------------------------------------
    # Concurrency locks (active runs)
    # -------------------------------------------------------------------

    def get_active_runs(self) -> dict:
        """Get currently active runs. Keys are task_keys."""
        return load_json(self.lock_file, {})

    def set_active_run(self, task_key: str, task_type: str = ""):
        """Mark a task_key as having an active run."""
        runs = self.get_active_runs()
        runs[task_key] = {
            "type": task_type,
            "started": datetime.now(timezone.utc).isoformat(),
        }
        save_json(self.lock_file, runs)

    def clear_active_run(self, task_key: str):
        """Clear active run for a task_key."""
        runs = self.get_active_runs()
        runs.pop(task_key, None)
        save_json(self.lock_file, runs)

    def is_active(self, task_key: str) -> bool:
        """Check if a task_key already has an active run (with auto-expire)."""
        runs = self.get_active_runs()
        entry = runs.get(task_key)
        if not entry:
            return False
        started = datetime.fromisoformat(entry["started"])
        age_min = (datetime.now(timezone.utc) - started).total_seconds() / 60
        if age_min > self.lock_expire_min:
            log(f"[{self.agent}] Run for '{task_key}' expired ({age_min:.0f}m), clearing")
            self.clear_active_run(task_key)
            return False
        return True

    # -------------------------------------------------------------------
    # Cooldown tracking
    # -------------------------------------------------------------------

    def check_cooldown(self, task_key: str) -> bool:
        """Check if we've hit the daily cooldown limit. Returns True if OK."""
        cooldowns = load_json(self.cooldown_file, {})
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        entry = cooldowns.get(task_key, {})
        if entry.get("date") != today:
            return True  # New day, reset
        attempts = entry.get("attempts", 0)
        if attempts >= self.max_daily_attempts:
            if not entry.get("escalated"):
                self.notify(
                    f"⚠️ **Cooldown hit:** {task_key} failed {attempts}x today. "
                    f"Needs manual intervention."
                )
                self.wake_sophie(
                    f"🚨 {self.agent} cooldown: {task_key} failed {attempts}x. "
                    f"Please investigate or reassign."
                )
                entry["escalated"] = True
                cooldowns[task_key] = entry
                save_json(self.cooldown_file, cooldowns)
            return False
        return True

    def record_attempt(self, task_key: str):
        """Record a spawn attempt for cooldown tracking."""
        cooldowns = load_json(self.cooldown_file, {})
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        entry = cooldowns.get(task_key, {})
        if entry.get("date") != today:
            entry = {"date": today, "attempts": 0}
        entry["attempts"] = entry.get("attempts", 0) + 1
        cooldowns[task_key] = entry
        save_json(self.cooldown_file, cooldowns)

    # -------------------------------------------------------------------
    # Deduplication
    # -------------------------------------------------------------------

    def is_recently_queued(self, task_key: str) -> bool:
        """Check if a spawn was already queued for this task_key recently."""
        if not self.spawn_queue.exists():
            return False
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=self.dedup_window_min)
        try:
            with open(self.spawn_queue) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        req = json.loads(line)
                        if req.get("task_key") == task_key and req.get("requested_at"):
                            req_time = datetime.fromisoformat(req["requested_at"])
                            if req_time > cutoff:
                                return True
                    except (json.JSONDecodeError, ValueError):
                        continue
        except IOError:
            pass
        return False

    # -------------------------------------------------------------------
    # Spawn queue
    # -------------------------------------------------------------------

    def queue_spawn(
        self,
        task: str,
        label: str,
        task_key: str,
        task_type: str = "",
        model: str | None = None,
        timeout_seconds: int | None = None,
        extra: dict | None = None,
    ) -> bool:
        """
        Queue a spawn request with full safety checks.

        Parameters:
            task: The prompt/instructions for the agent session
            label: Short human-readable label (used in logs and filenames)
            task_key: Unique key for dedup/cooldown/lock (e.g., "PR#123-ci-fix" or "MC#456")
            task_type: Category of work (e.g., "ci-fix", "review", "research")
            model: Model override (defaults to self.default_model)
            timeout_seconds: Session timeout (defaults to self.default_timeout)
            extra: Additional fields to include in the queue entry

        Returns True if queued, False if skipped.
        """
        # Safety checks
        if self.is_active(task_key):
            log(f"[{self.agent}] '{task_key}' already has an active run, skipping")
            return False

        if not self.check_cooldown(task_key):
            log(f"[{self.agent}] '{task_key}' hit daily cooldown, skipping")
            return False

        if self.is_recently_queued(task_key):
            log(f"[{self.agent}] '{task_key}' already queued in last {self.dedup_window_min}m, skipping")
            return False

        request = {
            "agent": self.agent,
            "task": task,
            "label": label,
            "task_key": task_key,
            "task_type": task_type,
            "requested_at": datetime.now(timezone.utc).isoformat(),
            "model": model or self.default_model,
            "timeout_seconds": timeout_seconds or self.default_timeout,
        }
        if extra:
            request.update(extra)

        # Write to queue
        with open(self.spawn_queue, "a") as f:
            f.write(json.dumps(request) + "\n")

        # Record attempt + set lock
        self.record_attempt(task_key)
        self.set_active_run(task_key, task_type)

        log(f"[{self.agent}] Queued spawn: {label} ({task_key})")

        # Notify agent's Discord channel
        emoji = {"neo": "🧑‍💻", "kvoth": "🔍", "hemingway": "✍️",
                 "michelangelo": "🎨", "viral": "🚀"}.get(self.agent, "🤖")
        self.notify(f"{emoji} **{self.agent.capitalize()} queued:** {label}")

        # Trigger spawn queue processor (non-blocking)
        self._trigger_processor()

        return True

    def _trigger_processor(self):
        """Trigger the spawn queue processor in background."""
        if not self.spawn_queue_script.exists():
            log(f"[{self.agent}] No spawn queue processor found, waking Sophie instead")
            self.wake_sophie(f"🤖 {self.agent} has queued work — process spawn queue")
            return
        try:
            cmd = [sys.executable, str(self.spawn_queue_script)]
            # Shared processor needs --agent flag; agent-specific ones don't
            if "agent_loop" in str(self.spawn_queue_script):
                cmd += ["--agent", self.agent]
            subprocess.Popen(
                cmd,
                stdout=open(self.state_dir / "spawn-queue-runner.log", "a"),
                stderr=subprocess.STDOUT,
                start_new_session=True,
                env=get_env_with_path(),
            )
            log(f"[{self.agent}] Spawn queue processor triggered")
        except Exception as e:
            log(f"[{self.agent}] Failed to trigger spawn queue: {e}")
            self.wake_sophie(f"🤖 {self.agent} has queued work — spawn processor failed")

    # -------------------------------------------------------------------
    # Notifications
    # -------------------------------------------------------------------

    def notify(self, message: str):
        """Post a message to the agent's Discord channel."""
        if not self.discord_channel:
            log(f"[{self.agent}] No Discord channel configured, skipping notification")
            return
        try:
            subprocess.run(
                ["openclaw", "message", "send",
                 "--channel", "discord",
                 "--target", self.discord_channel,
                 "--message", message],
                capture_output=True,
                text=True,
                timeout=10,
                env=get_env_with_path(),
            )
        except Exception as e:
            log(f"[{self.agent}] Discord notification failed: {e}")

    def wake_sophie(self, message: str):
        """Send a cron wake event to Sophie's main session."""
        try:
            subprocess.run(
                ["openclaw", "cron", "wake", "--text", message, "--mode", "now"],
                capture_output=True,
                text=True,
                timeout=10,
                env=get_env_with_path(),
            )
            log(f"[{self.agent}] Wake sent: {message[:80]}")
        except Exception as e:
            log(f"[{self.agent}] Wake failed: {e}")
            # Fallback: write to notifications file
            notif_file = Path.home() / "clawd" / "state" / "notifications.jsonl"
            try:
                with open(notif_file, "a") as f:
                    f.write(json.dumps({
                        "type": f"{self.agent}_loop_spawn",
                        "message": message,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }) + "\n")
            except IOError:
                pass

    # -------------------------------------------------------------------
    # Mission Control helpers
    # -------------------------------------------------------------------

    @staticmethod
    def get_mc_tasks(agent: str = None, status: str = "backlog") -> list:
        """Fetch tasks from Mission Control, optionally filtered by agent and status."""
        import urllib.request
        params = [f"status={status}"]
        if agent:
            params.append(f"assignedAgent={agent}")
        url = f"http://localhost:3001/api/v1/tasks?{'&'.join(params)}"
        try:
            # Include CF Access headers if available
            headers = {}
            cf_id = os.environ.get("CF_ACCESS_CLIENT_ID")
            cf_secret = os.environ.get("CF_ACCESS_CLIENT_SECRET")
            if cf_id and cf_secret:
                headers["CF-Access-Client-Id"] = cf_id
                headers["CF-Access-Client-Secret"] = cf_secret
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                tasks = json.loads(resp.read())
            # Client-side filter: MC API doesn't always respect assignedAgent param
            if agent and isinstance(tasks, list):
                tasks = [t for t in tasks if t.get("assignedAgent") == agent]
            return tasks
        except Exception as e:
            log(f"Failed to fetch MC tasks: {e}")
            return []

    @staticmethod
    def update_mc_task(task_id: int, **fields):
        """Update a Mission Control task."""
        import urllib.request
        url = f"http://localhost:3001/api/v1/tasks/{task_id}"
        headers = {"Content-Type": "application/json"}
        cf_id = os.environ.get("CF_ACCESS_CLIENT_ID")
        cf_secret = os.environ.get("CF_ACCESS_CLIENT_SECRET")
        if cf_id and cf_secret:
            headers["CF-Access-Client-Id"] = cf_id
            headers["CF-Access-Client-Secret"] = cf_secret
        data = json.dumps(fields).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method="PATCH")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read())
        except Exception as e:
            log(f"Failed to update MC task #{task_id}: {e}")
            return None
