#!/usr/bin/env python3
"""
MC ↔ Todoist Sync Wrapper

Runs the bash sync script and reports results to Discord.
No LLM calls - just executes and reports.

Exit codes:
0 = Success (changes or no-op)
1 = Sync completed with changes
2 = Error occurred
"""

import subprocess
import sys
import json
import re
from pathlib import Path
from datetime import datetime

DISCORD_CHANNEL = "1466532593754312899"  # #general
SYNC_SCRIPT = Path.home() / "clawd" / "scripts" / "sync-mc-todoist.sh"


def run_sync() -> tuple[int, str]:
    """Run the sync script and capture output."""
    try:
        result = subprocess.run(
            ["bash", str(SYNC_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        return result.returncode, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return 2, "ERROR: Sync timed out after 5 minutes"
    except subprocess.SubprocessError as e:
        return 2, f"ERROR: Failed to run sync: {e}"


def parse_summary(output: str) -> dict:
    """Extract sync summary from output."""
    summary = {
        "todoist_to_mc": {},
        "mc_to_todoist": {},
        "deletions": {}
    }
    
    # Parse Todoist→MC line
    t2m_match = re.search(
        r"Todoist→MC: completed_in_mc=(\d+) renamed_in_mc=(\d+) moved_in_mc=(\d+) created_in_mc=(\d+) linked_existing=(\d+)",
        output
    )
    if t2m_match:
        summary["todoist_to_mc"] = {
            "completed": int(t2m_match.group(1)),
            "renamed": int(t2m_match.group(2)),
            "moved": int(t2m_match.group(3)),
            "created": int(t2m_match.group(4)),
            "linked": int(t2m_match.group(5))
        }
    
    # Parse MC→Todoist line
    m2t_match = re.search(
        r"MC→Todoist: created=(\d+) updated=(\d+) closed=(\d+) linked=(\d+) skipped=(\d+)",
        output
    )
    if m2t_match:
        summary["mc_to_todoist"] = {
            "created": int(m2t_match.group(1)),
            "updated": int(m2t_match.group(2)),
            "closed": int(m2t_match.group(3)),
            "linked": int(m2t_match.group(4)),
            "skipped": int(m2t_match.group(5))
        }
    
    # Parse deletions line
    del_match = re.search(r"MC deletions: closed_in_todoist=(\d+)", output)
    if del_match:
        summary["deletions"] = {
            "closed": int(del_match.group(1))
        }
    
    return summary


def has_changes(summary: dict) -> bool:
    """Check if any changes were made."""
    t2m = summary.get("todoist_to_mc", {})
    m2t = summary.get("mc_to_todoist", {})
    deletions = summary.get("deletions", {})
    
    return any([
        t2m.get("completed", 0) > 0,
        t2m.get("renamed", 0) > 0,
        t2m.get("moved", 0) > 0,
        t2m.get("created", 0) > 0,
        t2m.get("linked", 0) > 0,
        m2t.get("created", 0) > 0,
        m2t.get("updated", 0) > 0,
        m2t.get("closed", 0) > 0,
        m2t.get("linked", 0) > 0,
        deletions.get("closed", 0) > 0
    ])


def format_discord_message(summary: dict) -> str:
    """Format summary for Discord notification."""
    lines = ["🔄 **MC ↔ Todoist Sync**\n"]
    
    t2m = summary.get("todoist_to_mc", {})
    m2t = summary.get("mc_to_todoist", {})
    deletions = summary.get("deletions", {})
    
    # Todoist → MC
    if any(t2m.values()):
        lines.append("**Todoist → MC:**")
        if t2m.get("completed", 0) > 0:
            lines.append(f"  • {t2m['completed']} completed in MC")
        if t2m.get("renamed", 0) > 0:
            lines.append(f"  • {t2m['renamed']} renamed in MC")
        if t2m.get("moved", 0) > 0:
            lines.append(f"  • {t2m['moved']} moved in MC")
        if t2m.get("created", 0) > 0:
            lines.append(f"  • {t2m['created']} created in MC")
        if t2m.get("linked", 0) > 0:
            lines.append(f"  • {t2m['linked']} linked")
        lines.append("")
    
    # MC → Todoist
    if any(m2t.values()):
        lines.append("**MC → Todoist:**")
        if m2t.get("created", 0) > 0:
            lines.append(f"  • {m2t['created']} created in Todoist")
        if m2t.get("updated", 0) > 0:
            lines.append(f"  • {m2t['updated']} updated in Todoist")
        if m2t.get("closed", 0) > 0:
            lines.append(f"  • {m2t['closed']} closed in Todoist")
        if m2t.get("linked", 0) > 0:
            lines.append(f"  • {m2t['linked']} linked")
        lines.append("")
    
    # Deletions
    if deletions.get("closed", 0) > 0:
        lines.append(f"**Orphan cleanup:** {deletions['closed']} closed")
    
    # No changes
    if not has_changes(summary):
        return ""  # Empty message = no notification needed
    
    return "\n".join(lines)


def notify_discord(message: str) -> bool:
    """Send notification to Discord."""
    try:
        result = subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", DISCORD_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except subprocess.SubprocessError:
        return False


def main():
    # Run sync
    returncode, output = run_sync()
    
    # Print output for logs
    print(output)
    
    if returncode == 2:
        # Error occurred
        print("ERROR: Sync failed", file=sys.stderr)
        sys.exit(2)
    
    # Parse results
    summary = parse_summary(output)
    
    # Only notify if changes were made
    if has_changes(summary):
        message = format_discord_message(summary)
        if message:
            notify_discord(message)
            print(f"Sent Discord notification")
        sys.exit(1)  # Exit 1 = changes made
    else:
        print("No changes")
        sys.exit(0)


if __name__ == "__main__":
    main()
