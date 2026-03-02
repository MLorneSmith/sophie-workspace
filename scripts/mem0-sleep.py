#!/usr/bin/env python3
"""
Mem0 Sleep Mode — Nightly memory maintenance.

Reads daily log files, extracts facts/preferences/decisions that auto-capture
may have missed, and stores them via OpenClaw's memory_store tool.
Generates a daily digest in memory/digests/.

Runs as a cron job at 3am EST.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

CLAWD_DIR = Path.home() / "clawd"
MEMORY_DIR = CLAWD_DIR / "memory"
DIGEST_DIR = MEMORY_DIR / "digests"
SECRETS_ENV = Path.home() / ".openclaw" / ".secrets.env"

def load_secrets():
    """Load secrets from .secrets.env"""
    secrets = {}
    if SECRETS_ENV.exists():
        for line in SECRETS_ENV.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                secrets[key.strip()] = value.strip().strip("'\"").replace("\r", "").replace("\n", "")
    return secrets

def get_daily_log(date_str: str) -> str | None:
    """Read daily memory log for a given date."""
    log_path = MEMORY_DIR / f"{date_str}.md"
    if log_path.exists():
        return log_path.read_text()
    return None

def extract_facts(log_content: str, api_key: str) -> list[dict]:
    """Use gpt-4o-mini to extract facts, preferences, and decisions from a daily log."""
    import urllib.request

    prompt = """You are a memory extraction agent. Given a daily activity log from an AI assistant, 
extract important facts, preferences, decisions, and lessons that should be remembered long-term.

For each item, output a JSON object with:
- "text": the fact/preference/decision in a clear, standalone sentence
- "category": one of "preference", "decision", "fact", "lesson", "person", "project"

Only extract things worth remembering across sessions. Skip routine status updates, 
timestamps, and transient task details.

Output a JSON array of objects. If nothing worth extracting, output [].

Daily log:
"""

    data = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You extract structured memories from daily logs. Output only valid JSON."},
            {"role": "user", "content": prompt + log_content}
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            # Handle both {"memories": [...]} and [...] formats
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "memories" in parsed:
                return parsed["memories"]
            elif isinstance(parsed, dict) and "items" in parsed:
                return parsed["items"]
            return []
    except Exception as e:
        print(f"Error extracting facts: {e}", file=sys.stderr)
        return []

def store_memory(text: str, api_key: str):
    """Store a memory via Mem0 Python SDK or OpenAI-compatible embedding + local storage."""
    import urllib.request

    # Use OpenClaw gateway's memory_store endpoint
    gateway_token = load_secrets().get("OPENCLAW_GATEWAY_TOKEN", "")
    data = json.dumps({"text": text, "longTerm": True}).encode()
    
    req = urllib.request.Request(
        "http://127.0.0.1:18789/api/memory/store",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {gateway_token}"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"  ✓ Stored: {text[:80]}...")
    except urllib.error.HTTPError as e:
        # Fallback: use openclaw CLI
        try:
            result = subprocess.run(
                ["openclaw", "mem0", "store", text],
                capture_output=True, text=True, timeout=30,
                env={**os.environ, "PATH": os.environ.get("PATH", "") + ":/home/ubuntu/.npm-global/bin"}
            )
            if result.returncode == 0:
                print(f"  ✓ Stored (CLI): {text[:80]}...")
            else:
                print(f"  ✗ Failed: {e}", file=sys.stderr)
        except Exception as e2:
            print(f"  ✗ Error: {e2}", file=sys.stderr)
    except Exception as e:
        print(f"  ✗ Error: {e}", file=sys.stderr)

def search_existing(query: str, api_key: str) -> bool:
    """Check if a similar memory already exists (avoid duplicates)."""
    try:
        result = subprocess.run(
            ["openclaw", "mem0", "search", query],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "PATH": os.environ.get("PATH", "") + ":/home/ubuntu/.npm-global/bin"}
        )
        # If we get results with high similarity, skip
        if result.returncode == 0 and "score:" in result.stdout:
            for line in result.stdout.splitlines():
                if "score:" in line:
                    try:
                        score = float(line.split("score:")[1].strip().rstrip("%")) / 100
                        if score > 0.7:
                            return True
                    except (ValueError, IndexError):
                        pass
        return False
    except Exception:
        return False

def generate_digest(date_str: str, facts: list[dict], log_content: str):
    """Generate a daily digest markdown file."""
    DIGEST_DIR.mkdir(parents=True, exist_ok=True)
    digest_path = DIGEST_DIR / f"{date_str}-digest.md"
    
    lines = [f"# Daily Digest — {date_str}\n"]
    lines.append(f"**Memories extracted:** {len(facts)}\n")
    
    if facts:
        lines.append("## New Memories\n")
        for fact in facts:
            category = fact.get("category", "fact")
            text = fact.get("text", "")
            lines.append(f"- [{category}] {text}")
    
    lines.append(f"\n## Log Size\n")
    lines.append(f"- {len(log_content)} characters")
    lines.append(f"- {len(log_content.splitlines())} lines")
    
    digest_path.write_text("\n".join(lines) + "\n")
    print(f"Digest saved: {digest_path}")

def main():
    # Process yesterday's log (running at 3am, so yesterday is complete)
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Allow override via argument
    date_str = sys.argv[1] if len(sys.argv) > 1 else yesterday
    
    print(f"🧠 Mem0 Sleep Mode — Processing {date_str}")
    
    log_content = get_daily_log(date_str)
    if not log_content:
        print(f"No log found for {date_str}. Nothing to process.")
        return
    
    print(f"Log: {len(log_content)} chars, {len(log_content.splitlines())} lines")
    
    secrets = load_secrets()
    api_key = secrets.get("OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY", ""))
    if not api_key:
        print("ERROR: No OPENAI_API_KEY found", file=sys.stderr)
        sys.exit(1)
    
    # Extract facts
    print("Extracting facts...")
    facts = extract_facts(log_content, api_key)
    print(f"Found {len(facts)} potential memories")
    
    stored = 0
    skipped = 0
    
    for fact in facts:
        text = fact.get("text", "")
        if not text:
            continue
        
        # Simple dedup: check if very similar memory exists
        # (Skip for now — Mem0 handles dedup internally)
        store_memory(text, api_key)
        stored += 1
    
    print(f"\n✅ Done: {stored} stored, {skipped} skipped (duplicates)")
    
    # Generate digest
    generate_digest(date_str, facts, log_content)

if __name__ == "__main__":
    main()
