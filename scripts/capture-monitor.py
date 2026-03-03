#!/usr/bin/env python3
"""
Capture Monitor v2

Monitors #capture channel for new links, fetches content,
and saves to Mission Control captures API.

Exit codes:
0 = Success (no new items or items processed)
1 = Error
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

DISCORD_CHANNEL = "1468019433854210259"  # #capture
INBOX_CHANNEL = "1468015498330308621"  # #inbox-sophie
STATE_FILE = Path.home() / "clawd" / "state" / "capture-state.json"

# MC API config
MC_BASE_URL = "https://internal.slideheroes.com/api/v1"
CF_CLIENT_ID = os.environ.get("CF_ACCESS_CLIENT_ID", "")
CF_CLIENT_SECRET = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")


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


def get_recent_messages(channel: str, limit: int = 10) -> list[dict]:
    """Get recent messages from Discord channel via openclaw CLI."""
    try:
        result = subprocess.run(
            [
                "openclaw", "message", "read",
                "--channel", "discord",
                "--target", channel,
                "--limit", str(limit),
                "--json",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            print(f"Failed to get messages: {result.stderr}", file=sys.stderr)
            return []

        # Parse output — could be JSON array or JSONL
        # Strip non-JSON log lines (e.g. "[plugins] openclaw-mem0: ...")
        lines = result.stdout.split("\n")
        filtered = [l for l in lines if not l.startswith("[")]
        stdout = "\n".join(filtered).strip()
        if not stdout:
            return []

        # Try JSON object/array
        try:
            data = json.loads(stdout)
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                # openclaw outputs: { payload: { messages: [...] } }
                if "payload" in data and isinstance(data["payload"], dict):
                    msgs = data["payload"].get("messages", [])
                    if isinstance(msgs, list):
                        return msgs
                if "messages" in data:
                    return data["messages"]
            return [data]
        except json.JSONDecodeError:
            pass

        # Try JSONL
        messages = []
        for line in stdout.split("\n"):
            line = line.strip()
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
    url_pattern = r"https?://[^\s<>\"{}|\\^`\[\]]+"
    return re.findall(url_pattern, text)


def fetch_content(url: str) -> dict:
    """Fetch page content via curl + basic extraction."""
    try:
        result = subprocess.run(
            ["curl", "-sL", "-m", "15", "-A",
             "Mozilla/5.0 (compatible; CaptureBot/1.0)", url],
            capture_output=True,
            text=True,
            timeout=20,
        )
        if result.returncode == 0 and result.stdout.strip():
            html = result.stdout
            # Extract <title>
            title_match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
            title = title_match.group(1).strip()[:200] if title_match else None
            # Strip HTML tags for raw content (basic)
            text = re.sub(r"<[^>]+>", " ", html)
            text = re.sub(r"\s+", " ", text).strip()[:5000]
            return {"title": title, "rawContent": text}
    except (subprocess.TimeoutExpired, subprocess.SubprocessError):
        pass
    return {"title": None, "rawContent": None}


def detect_source_type(url: str) -> str:
    """Guess source type from URL."""
    url_lower = url.lower()
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "video"
    if "twitter.com" in url_lower or "x.com" in url_lower:
        return "social"
    if "linkedin.com" in url_lower:
        return "social"
    if "substack.com" in url_lower or "newsletter" in url_lower:
        return "newsletter"
    if url_lower.endswith(".pdf"):
        return "pdf"
    return "article"


def post_to_mc(capture_data: dict) -> dict | None:
    """Post capture to Mission Control API."""
    try:
        result = subprocess.run(
            [
                "curl", "-s",
                "-X", "POST",
                f"{MC_BASE_URL}/captures",
                "-H", "Content-Type: application/json",
                "-H", f"CF-Access-Client-Id: {CF_CLIENT_ID}",
                "-H", f"CF-Access-Client-Secret: {CF_CLIENT_SECRET}",
                "-d", json.dumps(capture_data),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            resp = json.loads(result.stdout)
            if "id" in resp:
                return resp
            print(f"MC API error: {result.stdout[:200]}", file=sys.stderr)
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, json.JSONDecodeError) as e:
        print(f"Error posting to MC: {e}", file=sys.stderr)
    return None


def notify_discord(message: str) -> bool:
    """Send notification to Discord."""
    try:
        result = subprocess.run(
            [
                "openclaw", "message", "send",
                "--channel", "discord",
                "--target", INBOX_CHANNEL,
                "--message", message,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return result.returncode == 0
    except subprocess.SubprocessError:
        return False


def main():
    print(f"=== Capture Monitor v2 ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Check MC API auth
    if not CF_CLIENT_ID or not CF_CLIENT_SECRET:
        print("ERROR: CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET not set", file=sys.stderr)
        sys.exit(1)

    state = load_state()

    # Get recent messages from #capture
    messages = get_recent_messages(DISCORD_CHANNEL, limit=10)

    if not messages:
        print("No messages found (or failed to fetch)")
        sys.exit(0)

    print(f"Found {len(messages)} recent message(s)")

    # Find new link messages
    processed_ids = set(state.get("processed_ids", []))
    new_captures = []

    for msg in reversed(messages):  # Oldest first
        msg_id = str(msg.get("id", ""))
        if not msg_id or msg_id in processed_ids:
            continue

        content = msg.get("content", "")
        links = extract_links(content)

        if not links:
            processed_ids.add(msg_id)
            continue

        author = msg.get("author", {}).get("username", "Unknown")

        # Extract user note (text that isn't a URL)
        user_note = re.sub(r"https?://[^\s]+", "", content).strip()

        for link in links:
            source_type = detect_source_type(link)

            # Fetch page content
            fetched = fetch_content(link)

            capture_data = {
                "url": link,
                "title": fetched.get("title"),
                "sourceType": source_type,
                "rawContent": fetched.get("rawContent"),
                "note": user_note if user_note else None,
                "captureSource": "discord",
                "status": "unprocessed",
            }

            # Post to MC
            result = post_to_mc(capture_data)
            if result:
                new_captures.append({
                    "mc_id": result["id"],
                    "url": link,
                    "title": fetched.get("title", link[:60]),
                })
                print(f"  ✅ Captured: {link[:80]} → MC #{result['id']}")
            else:
                print(f"  ❌ Failed to capture: {link[:80]}")

        processed_ids.add(msg_id)

    if not new_captures:
        print("No new links found")
        save_state({"processed_ids": list(processed_ids)[-200:]})
        sys.exit(0)

    # Save state
    state["processed_ids"] = list(processed_ids)[-200:]
    save_state(state)

    # Notify Sophie's inbox
    lines = [f"📥 **{len(new_captures)} new capture(s) saved to MC**\n"]
    for cap in new_captures[:5]:
        title = cap.get("title") or cap["url"][:60]
        lines.append(f"• #{cap['mc_id']}: {title}")
    if len(new_captures) > 5:
        lines.append(f"• ...and {len(new_captures) - 5} more")

    notify_discord("\n".join(lines))

    print(f"\nProcessed {len(new_captures)} new capture(s)")
    sys.exit(0)


if __name__ == "__main__":
    main()
