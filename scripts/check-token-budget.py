#!/usr/bin/env python3
"""
check-token-budget.py — Alert when daily token usage exceeds budget.

Usage:
    python3 check-token-budget.py [--threshold N] [--date YYYY-MM-DD]

Default threshold: 10M tokens (configurable via TOKEN_BUDGET_M env var)
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path

# Config
THRESHOLD_M = float(os.environ.get("TOKEN_BUDGET_M", "10"))
THRESHOLD = int(THRESHOLD_M * 1_000_000)
MC_API = "http://localhost:3001/api/v1"
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL")

def get_token_usage(date: str) -> dict:
    """Fetch token usage from Mission Control API."""
    try:
        resp = requests.get(f"{MC_API}/model-usage", params={"date": date}, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error fetching token usage: {e}")
        return {}

def format_tokens(tokens: int) -> str:
    """Format token count with M suffix."""
    if tokens >= 1_000_000:
        return f"{tokens / 1_000_000:.1f}M"
    elif tokens >= 1_000:
        return f"{tokens / 1_000:.0f}K"
    return str(tokens)

def send_discord_alert(date: str, total_tokens: int, models: list):
    """Send alert to Discord via webhook."""
    if not DISCORD_WEBHOOK:
        print("No Discord webhook configured, skipping alert")
        return False
    
    # Build model breakdown
    model_lines = []
    for m in sorted(models, key=lambda x: x.get("tokens", 0), reverse=True)[:5]:
        model_name = m.get("model", "unknown")
        tokens = m.get("tokens", 0)
        model_lines.append(f"- **{model_name}**: {format_tokens(tokens)}")
    
    payload = {
        "content": "⚠️ **Token Budget Exceeded**",
        "embeds": [{
            "title": f"Daily usage: {format_tokens(total_tokens)} (budget: {format_tokens(THRESHOLD)})",
            "description": f"**Date:** {date}\n\n**Top models:**\n" + "\n".join(model_lines),
            "color": 15158332,  # Red
            "timestamp": datetime.utcnow().isoformat()
        }]
    }
    
    try:
        resp = requests.post(DISCORD_WEBHOOK, json=payload, timeout=10)
        resp.raise_for_status()
        print(f"Discord alert sent")
        return True
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")
        return False

def main():
    # Get date (default: today)
    date = sys.argv[sys.argv.index("--date") + 1] if "--date" in sys.argv else datetime.now().strftime("%Y-%m-%d")
    
    # Get threshold from CLI if provided
    threshold = THRESHOLD
    if "--threshold" in sys.argv:
        idx = sys.argv.index("--threshold")
        threshold = int(sys.argv[idx + 1]) * 1_000_000
    
    print(f"Checking token usage for {date} (threshold: {format_tokens(threshold)})")
    
    # Fetch usage
    data = get_token_usage(date)
    if not data:
        print("No data available")
        sys.exit(1)
    
    total_tokens = data.get("totalTokens", 0)
    models = data.get("models", [])
    
    print(f"Total tokens: {format_tokens(total_tokens)}")
    
    if total_tokens > threshold:
        print(f"⚠️ Budget exceeded!")
        send_discord_alert(date, total_tokens, models)
        sys.exit(2)  # Exit code 2 = budget exceeded
    else:
        print(f"✅ Within budget ({format_tokens(total_tokens)} / {format_tokens(threshold)})")
        sys.exit(0)

if __name__ == "__main__":
    main()
