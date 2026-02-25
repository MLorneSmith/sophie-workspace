#!/usr/bin/env python3
"""
Calendar Check

Checks for upcoming calendar events and notifies Discord.
No LLM calls - just uses gog CLI.

Exit codes:
0 = Success
2 = Error
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta

DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie


def get_upcoming_events(hours: int = 24) -> list[dict]:
    """Get upcoming calendar events using gog CLI."""
    try:
        result = subprocess.run(
            ["gog", "cal", "list", "--hours", str(hours), "--json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"gog cal list failed: {result.stderr}", file=sys.stderr)
            return []
        
        # Parse output
        events = []
        for line in result.stdout.strip().split("\n"):
            if line.startswith("{"):
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return events
    except subprocess.TimeoutExpired:
        print("gog cal list timed out", file=sys.stderr)
        return []
    except subprocess.SubprocessError as e:
        print(f"gog cal list error: {e}", file=sys.stderr)
        return []


def format_event(event: dict) -> str:
    """Format an event for display."""
    time = event.get("time", "All day")
    summary = event.get("summary", "Untitled")
    return f"• {time}: {summary}"


def is_soon(event: dict, within_minutes: int = 30) -> bool:
    """Check if an event is starting soon."""
    start = event.get("start")
    if not start:
        return False
    
    try:
        # Parse ISO format
        start_time = datetime.fromisoformat(start.replace("Z", "+00:00"))
        now = datetime.now(start_time.tzinfo)
        delta = start_time - now
        return timedelta(0) <= delta <= timedelta(minutes=within_minutes)
    except (ValueError, TypeError):
        return False


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
    import argparse
    
    parser = argparse.ArgumentParser(description="Calendar Check")
    parser.add_argument("--hours", type=int, default=24, help="Hours to look ahead")
    parser.add_argument("--notify-soon", action="store_true", help="Notify for events starting within 30 min")
    args = parser.parse_args()
    
    print(f"=== Calendar Check ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Looking ahead: {args.hours}h")
    print()
    
    events = get_upcoming_events(args.hours)
    
    if not events:
        print("No upcoming events")
        sys.exit(0)
    
    print(f"Found {len(events)} upcoming event(s)")
    
    for e in events:
        print(f"  {format_event(e)}")
    
    # Check for events starting soon
    if args.notify_soon:
        soon = [e for e in events if is_soon(e)]
        
        if soon:
            lines = [f"📅 **Upcoming Meeting**\n"]
            for e in soon[:3]:
                lines.append(format_event(e))
            
            notify_discord("\n".join(lines))
            print(f"\nNotified about {len(soon)} event(s) starting soon")
    
    sys.exit(0)


if __name__ == "__main__":
    main()
