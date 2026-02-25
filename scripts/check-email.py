#!/usr/bin/env python3
"""
Email Check

Checks for unread emails and notifies Discord of urgent ones.
No LLM calls - just uses gog CLI.

Exit codes:
0 = Success (no urgent emails)
1 = Urgent emails found
2 = Error
"""

import json
import subprocess
import sys
from datetime import datetime

DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie


def get_unread_emails() -> list[dict]:
    """Get unread emails using gog CLI."""
    try:
        result = subprocess.run(
            ["gog", "gmail", "list", "--unread", "--json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"gog gmail list failed: {result.stderr}", file=sys.stderr)
            return []
        
        # Parse output
        emails = []
        for line in result.stdout.strip().split("\n"):
            if line.startswith("{"):
                try:
                    emails.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return emails
    except subprocess.TimeoutExpired:
        print("gog gmail list timed out", file=sys.stderr)
        return []
    except subprocess.SubprocessError as e:
        print(f"gog gmail list error: {e}", file=sys.stderr)
        return []


def is_urgent(email: dict) -> bool:
    """Determine if an email is urgent."""
    sender = email.get("from", "").lower()
    subject = email.get("subject", "").lower()
    
    # Urgent senders
    urgent_senders = [
        "michael@slideheroes.com",
        "mike@slideheroes.com",
        "msmith@",
        "urgent",
        "critical",
        "action required",
        "asap",
    ]
    
    # Urgent keywords in subject
    urgent_keywords = [
        "urgent",
        "critical",
        "action required",
        "asap",
        "important",
        "deadline",
        "time sensitive",
    ]
    
    for s in urgent_senders:
        if s in sender:
            return True
    
    for k in urgent_keywords:
        if k in subject:
            return True
    
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
    print(f"=== Email Check ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    emails = get_unread_emails()
    
    if not emails:
        print("No unread emails")
        sys.exit(0)
    
    print(f"Found {len(emails)} unread email(s)")
    
    # Check for urgent
    urgent = [e for e in emails if is_urgent(e)]
    
    if urgent:
        print(f"Found {len(urgent)} urgent email(s)")
        
        lines = [f"📧 **Urgent Email Alert** ({len(urgent)} unread)\n"]
        for e in urgent[:5]:  # Max 5
            sender = e.get("from", "Unknown")
            subject = e.get("subject", "No subject")
            lines.append(f"• **{sender}**: {subject}")
        
        notify_discord("\n".join(lines))
        sys.exit(1)
    
    print("No urgent emails")
    sys.exit(0)


if __name__ == "__main__":
    main()
