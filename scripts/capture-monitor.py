#!/usr/bin/env python3
"""
Capture Monitor

Monitors #capture channel for new links and processes them.
No LLM calls for the monitoring part - just fetches and queues.

Exit codes:
0 = Success (no new items)
1 = New items found and queued
2 = Error
"""

import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

DISCORD_CHANNEL = "1468019433854210259"  # #capture
INBOX_CHANNEL = "1468015498330308621"  # #inbox-sophie
STATE_FILE = Path.home() / "clawd" / "state" / "capture-state.json"
QUEUE_FILE = Path.home() / "clawd" / "state" / "capture-queue.json"


def load_state() -> dict:
    """Load capture state."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"last_message_id": None, "processed_ids": []}


def save_state(state: dict):
    """Save capture state."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def load_queue() -> list[dict]:
    """Load capture queue."""
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE) as f:
            return json.load(f)
    return []


def save_queue(queue: list[dict]):
    """Save capture queue."""
    QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=2)


def get_recent_messages(channel: str, limit: int = 10) -> list[dict]:
    """Get recent messages from Discord channel."""
    try:
        result = subprocess.run(
            ["openclaw", "discord", "messages", "--channel", channel, "--limit", str(limit), "--json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"Failed to get messages: {result.stderr}", file=sys.stderr)
            return []
        
        # Parse output
        messages = []
        for line in result.stdout.strip().split("\n"):
            if line.startswith("{"):
                try:
                    messages.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return messages
    except subprocess.TimeoutExpired:
        print("Timeout getting messages", file=sys.stderr)
        return []
    except subprocess.SubprocessError as e:
        print(f"Error getting messages: {e}", file=sys.stderr)
        return []


def extract_links(text: str) -> list[str]:
    """Extract URLs from text."""
    import re
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.findall(url_pattern, text)


def is_link_message(message: dict) -> bool:
    """Check if message contains a link."""
    content = message.get("content", "")
    return bool(extract_links(content))


def notify_discord(message: str) -> bool:
    """Send notification to Discord."""
    try:
        result = subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", INBOX_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except subprocess.SubprocessError:
        return False


def main():
    print(f"=== Capture Monitor ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    state = load_state()
    queue = load_queue()
    
    # Get recent messages from #capture
    messages = get_recent_messages(DISCORD_CHANNEL, limit=10)
    
    if not messages:
        print("No messages found")
        sys.exit(0)
    
    print(f"Found {len(messages)} recent message(s)")
    
    # Find new link messages
    processed_ids = set(state.get("processed_ids", []))
    new_items = []
    
    for msg in reversed(messages):  # Oldest first
        msg_id = msg.get("id")
        
        if msg_id in processed_ids:
            continue
        
        if is_link_message(msg):
            content = msg.get("content", "")
            links = extract_links(content)
            author = msg.get("author", {}).get("username", "Unknown")
            
            for link in links:
                new_items.append({
                    "id": msg_id,
                    "link": link,
                    "author": author,
                    "content": content,
                    "captured_at": datetime.now().isoformat()
                })
            
            processed_ids.add(msg_id)
    
    if not new_items:
        print("No new links found")
        sys.exit(0)
    
    print(f"Found {len(new_items)} new link(s)")
    
    # Add to queue
    queue.extend(new_items)
    save_queue(queue)
    
    # Update state
    state["processed_ids"] = list(processed_ids)[-100:]  # Keep last 100
    save_state(state)
    
    # Notify
    lines = [f"📥 **Capture Queue Updated**\n"]
    lines.append(f"Added {len(new_items)} new link(s) to queue:")
    for item in new_items[:5]:
        lines.append(f"• {item['link'][:60]}...")
    
    notify_discord("\n".join(lines))
    
    print(f"Queued {len(new_items)} new link(s)")
    sys.exit(1)


if __name__ == "__main__":
    main()
