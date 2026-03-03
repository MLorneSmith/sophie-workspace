#!/usr/bin/env python3
"""
Email Capture Channel

Monitors sophie@slideheroes.com inbox for forwarded emails from Mike,
extracts links and content, posts to MC captures API.

Workflow:
1. Mike forwards any email to sophie@slideheroes.com
2. This script picks up new messages from Mike
3. Extracts links + content → posts to MC captures API as "unprocessed"
4. Archives the message in Sophie's inbox
5. Classification pipeline (capture-classify.py) handles the rest

Exit codes:
0 = Success
1 = Error
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# MC API config
MC_BASE_URL = "https://internal.slideheroes.com/api/v1"
CF_CLIENT_ID = os.environ.get("CF_ACCESS_CLIENT_ID", "")
CF_CLIENT_SECRET = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")

# Mike's known email addresses
MIKE_EMAILS = ["michael@slideheroes.com", "msmith@slideheroes.com"]

STATE_FILE = Path.home() / "clawd" / "state" / "capture-email-state.json"


def load_state() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed_ids": []}


def save_state(state: dict):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def search_messages(query: str, max_results: int = 10) -> list[dict]:
    """Search Sophie's Gmail via gog CLI."""
    try:
        result = subprocess.run(
            ["gog", "gmail", "messages", "search", query,
             "--max", str(max_results), "--json"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            print(f"gog search failed: {result.stderr}", file=sys.stderr)
            return []

        data = json.loads(result.stdout)
        messages = data.get("messages") or []
        return messages

    except (subprocess.SubprocessError, json.JSONDecodeError) as e:
        print(f"Error searching Gmail: {e}", file=sys.stderr)
        return []


def extract_links(text: str) -> list[str]:
    """Extract URLs from text, filtering out email infrastructure."""
    url_pattern = r"https?://[^\s<>\"{}|\\^`\[\])']+"
    urls = re.findall(url_pattern, text)
    filtered = [u for u in urls if not any(skip in u.lower() for skip in [
        "unsubscribe", "manage-preferences", "mailchimp", "list-manage",
        "email.mg.", "click.convertkit", "tracking.", "googleapis.com",
        "google.com/maps", "support.google", "accounts.google",
    ])]
    return filtered


def extract_forwarded_subject(body: str, subject: str) -> str:
    """Try to extract the original subject from a forwarded email."""
    # Look for "Subject: ..." in the forwarded content
    match = re.search(r"Subject:\s*(.+?)(?:\n|$)", body)
    if match:
        return match.group(1).strip()[:200]
    # Fall back to the email subject (strip Fwd: prefix)
    clean = re.sub(r"^(Fwd?:|Fw:)\s*", "", subject, flags=re.IGNORECASE).strip()
    return clean[:200] if clean else subject[:200]


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
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            resp = json.loads(result.stdout)
            if "id" in resp:
                return resp
    except (subprocess.SubprocessError, json.JSONDecodeError) as e:
        print(f"MC POST error: {e}", file=sys.stderr)
    return None


def notify_discord(message: str):
    """Send notification to Discord #inbox-sophie."""
    try:
        subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", "1468015498330308621",
             "--message", message],
            capture_output=True, text=True, timeout=30,
        )
    except subprocess.SubprocessError:
        pass


def main():
    print(f"=== Email Capture Channel ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    if not CF_CLIENT_ID or not CF_CLIENT_SECRET:
        print("ERROR: CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET not set", file=sys.stderr)
        sys.exit(1)

    state = load_state()
    processed_ids = set(state.get("processed_ids", []))

    # Search for recent emails from Mike (forwarded emails)
    # Gmail query: from Mike, in inbox, newer than 1 day
    from_queries = " OR ".join(f"from:{email}" for email in MIKE_EMAILS)
    query = f"({from_queries}) in:inbox newer_than:1d"

    messages = search_messages(query, max_results=10)

    if not messages:
        print("No new emails from Mike")
        sys.exit(0)

    print(f"Found {len(messages)} message(s) from Mike")

    new_captures = []

    for msg in messages:
        msg_id = str(msg.get("id", ""))
        if not msg_id or msg_id in processed_ids:
            continue

        subject = msg.get("subject", "") or msg.get("snippet", "")[:100] or "Untitled"
        sender = msg.get("from", "") or ""
        body = msg.get("body", "") or msg.get("snippet", "") or ""

        # Skip if it doesn't look like a forward or capture-worthy content
        is_forward = bool(re.search(r"^(Fwd?:|Fw:)", subject, re.IGNORECASE))
        has_links = bool(extract_links(body))

        if not is_forward and not has_links:
            # Regular email from Mike to Sophie — not a capture
            processed_ids.add(msg_id)
            continue

        original_subject = extract_forwarded_subject(body, subject)
        print(f"\n--- Email: {original_subject[:80]} ---")

        links = extract_links(body)

        if links:
            for link in links[:5]:
                capture_data = {
                    "url": link,
                    "title": original_subject,
                    "sourceType": "article",
                    "rawContent": body[:5000],
                    "note": f"Forwarded by Mike: {original_subject}",
                    "captureSource": "email",
                    "status": "unprocessed",
                }
                result = post_to_mc(capture_data)
                if result:
                    new_captures.append({"mc_id": result["id"], "title": original_subject[:60], "url": link})
                    print(f"  ✅ {link[:80]} → MC #{result['id']}")
                else:
                    print(f"  ❌ Failed: {link[:80]}")
        else:
            # Forward with no links — capture the content itself
            capture_data = {
                "url": f"email://{msg_id}",
                "title": original_subject,
                "sourceType": "newsletter",
                "rawContent": body[:5000],
                "note": f"Forwarded by Mike (no links): {original_subject}",
                "captureSource": "email",
                "status": "unprocessed",
            }
            result = post_to_mc(capture_data)
            if result:
                new_captures.append({"mc_id": result["id"], "title": original_subject[:60]})
                print(f"  ✅ Content captured → MC #{result['id']}")

        processed_ids.add(msg_id)

    # Save state
    state["processed_ids"] = list(processed_ids)[-500:]
    save_state(state)

    if new_captures:
        lines = [f"📧 **{len(new_captures)} email capture(s) saved to MC**\n"]
        for cap in new_captures[:5]:
            url_note = f" — {cap['url'][:50]}" if "url" in cap else ""
            lines.append(f"• #{cap['mc_id']}: {cap['title']}{url_note}")
        notify_discord("\n".join(lines))

    print(f"\n=== Done: {len(new_captures)} captured ===")
    sys.exit(0)


if __name__ == "__main__":
    main()
