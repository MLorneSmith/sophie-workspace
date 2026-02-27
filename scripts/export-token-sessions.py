#!/usr/bin/env python3
"""
export-token-sessions.py — Export session token data to database before cleanup.

This script scans session files and records their token usage to the database,
so we have historical data even after sessions are deleted.

Usage:
    python3 export-token-sessions.py [--date YYYY-MM-DD] [--mark-zombie] [--mark-ttl]
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from collections import defaultdict

SESSION_DIR = Path("/home/ubuntu/.openclaw/agents/main/sessions")
DB_PATH = "/home/ubuntu/clawd/slideheroes-internal-tools/app/prisma/dev.db"

def get_session_stats(filepath: Path) -> dict:
    """Extract token stats from a session file."""
    stats = {
        "session_key": filepath.stem,
        "file_size_kb": filepath.stat().st_size // 1024,
        "first_msg_at": None,
        "last_msg_at": None,
        "duration_min": 0,
        "models": defaultdict(lambda: {"input_tokens": 0, "output_tokens": 0, "messages": 0}),
    }
    
    try:
        content = filepath.read_text()
        
        # Get all timestamps
        timestamps = []
        for line in content.split("\n"):
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
                if entry.get("type") == "message":
                    ts = entry.get("timestamp")
                    if ts:
                        timestamps.append(ts)
            except json.JSONDecodeError:
                continue
        
        if timestamps:
            stats["first_msg_at"] = timestamps[0]
            stats["last_msg_at"] = timestamps[-1]
            
            # Calculate duration
            if len(timestamps) >= 2:
                first = datetime.fromisoformat(timestamps[0].replace("Z", "+00:00"))
                last = datetime.fromisoformat(timestamps[-1].replace("Z", "+00:00"))
                stats["duration_min"] = int((last - first).total_seconds() / 60)
        
        # Get per-model token usage from assistant messages
        for line in content.split("\n"):
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
                if entry.get("type") == "message":
                    msg = entry.get("message", {})
                    if msg.get("role") == "assistant":
                        provider = msg.get("provider", "unknown")
                        model = msg.get("model", "unknown")
                        full_model = f"{provider}/{model}" if provider != "unknown" else model
                        
                        usage = msg.get("usage", {})
                        input_tokens = usage.get("input", 0)
                        output_tokens = usage.get("output", 0)
                        
                        stats["models"][full_model]["input_tokens"] += input_tokens
                        stats["models"][full_model]["output_tokens"] += output_tokens
                        stats["models"][full_model]["messages"] += 1
            except json.JSONDecodeError:
                continue
                
    except Exception as e:
        print(f"  Error processing {filepath.name}: {e}")
        
    return stats

def save_to_database(stats: dict, date: str, is_zombie: bool = False, is_ttl: bool = False) -> bool:
    """Save session stats to database via SQLite."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        saved = 0
        now = datetime.utcnow().isoformat()
        
        for model, model_stats in stats.get("models", {}).items():
            if model_stats["input_tokens"] == 0 and model_stats["output_tokens"] == 0:
                continue
            
            # Generate a unique ID
            import uuid
            record_id = str(uuid.uuid4())
            
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO TokenSession 
                    (id, date, sessionKey, model, inputTokens, outputTokens, messages, 
                     durationMin, fileSizeKb, firstMsgAt, lastMsgAt, isZombie, isTTLKill, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record_id,
                    date,
                    stats["session_key"][:50],
                    model[:100],
                    model_stats.get("input_tokens", 0),
                    model_stats.get("output_tokens", 0),
                    model_stats.get("messages", 0),
                    stats.get("duration_min", 0),
                    stats["file_size_kb"],
                    stats.get("first_msg_at"),
                    stats.get("last_msg_at"),
                    1 if is_zombie else 0,
                    1 if is_ttl else 0,
                    now
                ))
                if cursor.rowcount > 0:
                    saved += 1
            except sqlite3.IntegrityError:
                pass  # Already exists
            except Exception as e:
                print(f"    Warning: {e}")
        
        conn.commit()
        conn.close()
        return saved > 0
        
    except Exception as e:
        print(f"  Database error: {e}")
        return False

def main():
    # Parse args
    date = datetime.now().strftime("%Y-%m-%d")
    is_zombie = "--mark-zombie" in sys.argv
    is_ttl = "--mark-ttl" in sys.argv
    
    if "--date" in sys.argv:
        idx = sys.argv.index("--date")
        date = sys.argv[idx + 1]
    
    print(f"Exporting token sessions for {date}")
    if is_zombie:
        print("  (marking as zombie cleanup)")
    if is_ttl:
        print("  (marking as TTL kill)")
    
    if not SESSION_DIR.exists():
        print(f"Session directory not found: {SESSION_DIR}")
        sys.exit(1)
    
    exported = 0
    skipped = 0
    
    for filepath in sorted(SESSION_DIR.glob("*.jsonl")):
        # Skip probe sessions
        if filepath.stem.startswith("probe-"):
            skipped += 1
            continue
        
        stats = get_session_stats(filepath)
        
        if stats.get("models"):
            if save_to_database(stats, date, is_zombie, is_ttl):
                exported += 1
                total_tokens = sum(m["input_tokens"] + m["output_tokens"] for m in stats["models"].values())
                print(f"  ✓ {filepath.stem[:25]}... {len(stats['models'])} models, {total_tokens//1000}K tokens")
        else:
            skipped += 1
    
    print(f"\nExported: {exported}, Skipped: {skipped}")

if __name__ == "__main__":
    main()
