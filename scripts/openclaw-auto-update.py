#!/usr/bin/env python3
"""
OpenClaw Auto-Update

Checks for OpenClaw updates daily and installs if available.
Notifies via Discord webhook if an update occurs.

Exit codes:
0 = Success (no update needed, or update successful)
1 = Error
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / "clawd" / "logs" / "cron-openclaw-update.log"
STATE_FILE = Path.home() / "clawd" / "state" / "openclaw-update.md"
DISCORD_WEBHOOK_FILE = Path.home() / ".clawdbot" / "discord-webhook.txt"


def log(message: str) -> None:
    """Log message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return result."""
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=check
    )


def get_current_version() -> str | None:
    """Get currently installed OpenClaw version."""
    # Try multiple methods since installation location varies
    for cmd in [
        ["openclaw", "--version"],
        ["/home/ubuntu/.npm-global/bin/openclaw", "--version"],
        ["/home/ubuntu/.local/share/pnpm/openclaw", "--version"],
    ]:
        try:
            result = run(cmd, check=False)
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except Exception:
            pass
    return None


def get_latest_version() -> str | None:
    """Get latest available OpenClaw version from npm."""
    try:
        result = run(["npm", "view", "openclaw", "version"], check=False)
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        log(f"ERROR checking latest version: {e}")
    return None


def get_release_notes() -> str:
    """Fetch latest release notes from GitHub."""
    try:
        result = run([
            "gh", "api", "repos/openclaw/openclaw/releases/latest",
            "--jq", ".body"
        ], check=False)
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        log(f"WARNING: Could not fetch release notes: {e}")
    return "Release notes unavailable."


def send_discord_notification(old_version: str, new_version: str, notes: str) -> None:
    """Send update notification to Discord via webhook."""
    webhook_url = None
    if DISCORD_WEBHOOK_FILE.exists():
        webhook_url = DISCORD_WEBHOOK_FILE.read_text().strip()
    
    if not webhook_url:
        log("No Discord webhook configured, skipping notification")
        return
    
    # Truncate notes if too long
    if len(notes) > 1000:
        notes = notes[:1000] + "..."
    
    payload = {
        "content": f"🔄 **OpenClaw Updated**\n\n**{old_version}** → **{new_version}**\n\n**Release Notes:**\n```\n{notes}\n```"
    }
    
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", "-H", "Content-Type: application/json",
             "-d", json.dumps(payload), webhook_url],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            log("Discord notification sent")
        else:
            log(f"WARNING: Discord notification failed: {result.stderr}")
    except Exception as e:
        log(f"WARNING: Discord notification error: {e}")


def write_state_file(old_version: str, new_version: str, notes: str) -> None:
    """Write update summary to state file for morning brief."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    content = f"""# OpenClaw Update - {datetime.now().strftime("%Y-%m-%d")}

**Previous Version:** {old_version}
**New Version:** {new_version}

## Release Notes

{notes}
"""
    STATE_FILE.write_text(content)
    log(f"State file written to {STATE_FILE}")


def main() -> int:
    log("Checking for OpenClaw updates...")
    
    # Get versions
    current = get_current_version()
    if not current:
        log("ERROR: Could not determine current version")
        return 1
    
    latest = get_latest_version()
    if not latest:
        log("ERROR: Could not determine latest version")
        return 1
    
    log(f"Current: {current}, Latest: {latest}")
    
    # Check if update needed
    if current == latest:
        log("OpenClaw is up to date")
        # Remove state file if it exists (no update today)
        if STATE_FILE.exists():
            STATE_FILE.unlink()
        return 0
    
    log(f"Update available: {current} → {latest}")
    
    # Fetch release notes before updating
    notes = get_release_notes()
    
    # Update OpenClaw
    log("Installing update...")
    try:
        # Use npm since that's the most reliable update method
        result = run(["npm", "install", "-g", "openclaw@latest"], check=False)
        if result.returncode != 0:
            log(f"ERROR: install failed: {result.stderr}")
            return 1
    except Exception as e:
        log(f"ERROR: npm install exception: {e}")
        return 1
    
    # Run openclaw doctor to migrate config
    log("Running openclaw doctor...")
    try:
        result = run(["openclaw", "doctor"], check=False)
        if result.returncode != 0:
            log(f"WARNING: openclaw doctor returned non-zero: {result.stderr}")
    except Exception as e:
        log(f"WARNING: openclaw doctor exception: {e}")
    
    # Write state file for morning brief
    write_state_file(current, latest, notes)
    
    # Restart gateway
    log("Restarting gateway...")
    try:
        result = run(["openclaw", "gateway", "restart"], check=False)
        if result.returncode != 0:
            log(f"WARNING: gateway restart returned non-zero: {result.stderr}")
    except Exception as e:
        log(f"WARNING: gateway restart exception: {e}")
    
    # Send Discord notification
    send_discord_notification(current, latest, notes)
    
    log(f"Update complete: {current} → {latest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
