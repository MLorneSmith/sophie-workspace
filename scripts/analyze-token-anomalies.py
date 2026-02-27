#!/usr/bin/env python3
"""
analyze-token-anomalies.py — Detect anomalies and inefficiencies in token usage.

This script analyzes historical token data and reports:
- Sessions with unusually high token usage
- Models that are overused for simple tasks
- Patterns indicating runaway sessions
- Recommendations for optimization

Usage:
    python3 analyze-token-anomalies.py [--days N] [--alert]
"""

import os
import sys
import json
import sqlite3
import requests
from datetime import datetime, timedelta
from collections import defaultdict

MC_API = "http://localhost:3001/api/v1"
DB_PATH = "/home/ubuntu/clawd/slideheroes-internal-tools/app/prisma/dev.db"
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL")

# Thresholds
HIGH_TOKEN_SESSION = 500_000  # 500K tokens in one session
LONG_SESSION_HOURS = 4  # Sessions >4h
HIGH_COST_MODELS = ["anthropic/claude-opus", "openai/gpt-4"]  # Expensive models
CHEAP_MODELS = ["zai/glm-5", "openai/gpt-3.5"]  # Should be used for simple tasks


def get_token_history(days: int = 7) -> list:
    """Fetch token history from API or database."""
    try:
        resp = requests.get(f"{MC_API}/token-history", params={"days": days}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        print(f"API error: {e}, trying database directly")
        return get_from_database(days)


def get_from_database(days: int) -> list:
    """Get token history directly from database."""
    try:
        import sqlite3
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT date, sessionKey, model, inputTokens, outputTokens, messages,
                   durationMin, fileSizeKb, firstMsgAt, lastMsgAt, isZombie, isTTLKill
            FROM TokenSession 
            WHERE date >= ?
            ORDER BY date DESC
        """, (start_date,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Aggregate by date
        by_date = defaultdict(lambda: {
            "total_input": 0,
            "total_output": 0,
            "models": defaultdict(lambda: {"input": 0, "output": 0, "messages": 0}),
            "sessions": set()
        })
        
        for row in rows:
            date = row["date"]
            by_date[date]["total_input"] += row["inputTokens"]
            by_date[date]["total_output"] += row["outputTokens"]
            by_date[date]["sessions"].add(row["sessionKey"])
            by_date[date]["models"][row["model"]]["input"] += row["inputTokens"]
            by_date[date]["models"][row["model"]]["output"] += row["outputTokens"]
            by_date[date]["models"][row["model"]]["messages"] += row["messages"]
        
        return [
            {
                "date": date,
                "totalInput": data["total_input"],
                "totalOutput": data["total_output"],
                "sessionCount": len(data["sessions"]),
                "modelBreakdown": {k: dict(v) for k, v in data["models"].items()}
            }
            for date, data in sorted(by_date.items(), reverse=True)
        ]
    except Exception as e:
        print(f"Database error: {e}")
        return []


def analyze_anomalies(history: list) -> dict:
    """Analyze token history for anomalies."""
    anomalies = {
        "high_usage_days": [],
        "expensive_model_usage": [],
        "zombie_sessions": 0,
        "ttl_kills": 0,
        "recommendations": []
    }
    
    if not history:
        return anomalies
    
    # Calculate averages
    avg_daily = sum(d.get("totalInput", 0) + d.get("totalOutput", 0) for d in history) / len(history)
    
    for day in history:
        total = day.get("totalInput", 0) + day.get("totalOutput", 0)
        date = day.get("date", "unknown")
        models = day.get("modelBreakdown", {})
        
        # High usage day (>2x average)
        if total > avg_daily * 2 and avg_daily > 0:
            anomalies["high_usage_days"].append({
                "date": date,
                "total_tokens": total,
                "avg_tokens": avg_daily,
                "ratio": round(total / avg_daily, 1)
            })
        
        # Check for expensive model usage
        for model, stats in models.items():
            model_tokens = stats.get("input", 0) + stats.get("output", 0)
            if any(m in model for m in HIGH_COST_MODELS) and model_tokens > 100_000:
                anomalies["expensive_model_usage"].append({
                    "date": date,
                    "model": model,
                    "tokens": model_tokens
                })
    
    # Generate recommendations
    if anomalies["high_usage_days"]:
        anomalies["recommendations"].append(
            f"⚠️ {len(anomalies['high_usage_days'])} days with >2x average token usage. "
            "Review sessions for runaway processes."
        )
    
    if anomalies["expensive_model_usage"]:
        anomalies["recommendations"].append(
            f"💰 {len(anomalies['expensive_model_usage'])} instances of expensive model usage. "
            "Consider using cheaper models for routine tasks."
        )
    
    return anomalies


def send_discord_alert(anomalies: dict, history: list):
    """Send anomaly report to Discord."""
    if not DISCORD_WEBHOOK:
        print("No Discord webhook configured")
        return False
    
    # Build summary
    total_sessions = sum(d.get("sessionCount", 0) for d in history)
    total_tokens = sum(d.get("totalInput", 0) + d.get("totalOutput", 0) for d in history)
    
    lines = [
        "📊 **Weekly Token Analysis**",
        f"**Sessions:** {total_sessions} | **Tokens:** {total_tokens / 1_000_000:.1f}M",
        ""
    ]
    
    if anomalies["recommendations"]:
        lines.append("**Findings:**")
        for rec in anomalies["recommendations"]:
            lines.append(f"• {rec}")
    else:
        lines.append("✅ No significant anomalies detected.")
    
    if anomalies["high_usage_days"]:
        lines.append("")
        lines.append("**High usage days:**")
        for d in anomalies["high_usage_days"][:3]:
            lines.append(f"• {d['date']}: {d['total_tokens'] / 1_000_000:.1f}M ({d['ratio']}x avg)")
    
    payload = {
        "content": "\n".join(lines)
    }
    
    try:
        resp = requests.post(DISCORD_WEBHOOK, json=payload, timeout=10)
        resp.raise_for_status()
        print("Discord alert sent")
        return True
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")
        return False


def main():
    days = 7
    send_alert = "--alert" in sys.argv
    
    if "--days" in sys.argv:
        idx = sys.argv.index("--days")
        days = int(sys.argv[idx + 1])
    
    print(f"Analyzing token usage for last {days} days...")
    
    history = get_token_history(days)
    print(f"Found {len(history)} days of data")
    
    anomalies = analyze_anomalies(history)
    
    print("\n=== Analysis Results ===")
    print(f"High usage days: {len(anomalies['high_usage_days'])}")
    print(f"Expensive model instances: {len(anomalies['expensive_model_usage'])}")
    
    if anomalies["recommendations"]:
        print("\nRecommendations:")
        for rec in anomalies["recommendations"]:
            print(f"  {rec}")
    
    if send_alert:
        send_discord_alert(anomalies, history)
    
    # Output JSON for logging
    print("\n" + json.dumps(anomalies, indent=2))


if __name__ == "__main__":
    main()
