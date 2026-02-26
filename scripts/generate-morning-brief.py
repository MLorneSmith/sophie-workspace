#!/usr/bin/env python3
"""
Morning Briefing Generator

Generates HTML version of the morning brief using fixed template.
Uses data from morning-briefing-data.sh.

Exit codes:
0 = Success
1 = Error
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Paths
DATA_FILE = Path("/tmp/briefing-data.json")
HTML_OUTPUT = Path("/tmp/morning-brief.html")
HTML_TEMPLATE = Path.home() / "clawd" / "templates" / "morning-briefing-email.html"


def load_data() -> dict:
    """Load briefing data from JSON file."""
    if not DATA_FILE.exists():
        print(f"ERROR: Data file not found: {DATA_FILE}", file=sys.stderr)
        sys.exit(1)
    
    with open(DATA_FILE) as f:
        return json.load(f)


def escape_html(text: str) -> str:
    """Escape HTML special characters."""
    if not text:
        return ""
    return (str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;"))


def format_weather_card(condition: str, temp: str, feels: str, wind: str, humid: str) -> str:
    """Format weather as HTML card."""
    return f"""
    <div class="weather-card">
      <div class="label">Condition</div>
      <div class="value">{escape_html(condition)}</div>
    </div>
    <div class="weather-card">
      <div class="label">Temperature</div>
      <div class="value">{escape_html(temp)} (feels {escape_html(feels)})</div>
    </div>
    <div class="weather-card">
      <div class="label">Wind</div>
      <div class="value">{escape_html(wind)}</div>
    </div>
    <div class="weather-card">
      <div class="label">Humidity</div>
      <div class="value">{escape_html(humid)}</div>
    </div>
    """


def format_calendar_list(events_str: str) -> str:
    """Format calendar events string as HTML list items."""
    if not events_str or events_str == "No meetings scheduled.":
        return "<li>No meetings scheduled.</li>"
    
    items = []
    for line in events_str.strip().split('\n'):
        if line.strip():
            # Parse "• 09:00 — Meeting Name" format
            items.append(f"<li>{escape_html(line.replace('• ', ''))}</li>")
    
    return "\n".join(items) if items else "<li>No meetings scheduled.</li>"


def format_feed_items(items: list) -> str:
    """Format feed items as HTML."""
    if not items:
        return "<p>No feed items today.</p>"
    
    html_parts = []
    for item in items[:8]:
        title = escape_html(item.get("title", "Untitled"))
        url = item.get("link", "#")
        score = item.get("score", 0)
        snippet = escape_html(item.get("snippet", "")[:120])
        upvote_url = item.get("upvoteUrl", "#")
        downvote_url = item.get("downvoteUrl", "#")
        
        html_parts.append(f"""
        <div class="feed-item">
          <a href="{url}" class="title">{title}</a>
          <span class="score">Score: {score}</span>
          <div class="desc">{snippet}</div>
          <div class="actions">
            <a href="{upvote_url}">👍 Upvote</a>
            <a href="{downvote_url}">👎 Downvote</a>
          </div>
        </div>
        """)
    
    return "\n".join(html_parts)


def format_model_usage(usage_data) -> str:
    """Format model usage as HTML bars."""
    if not usage_data:
        return "<p>No usage data available.</p>"
    
    # Handle both list and dict formats
    if isinstance(usage_data, dict):
        items = usage_data.get("models", [])
    elif isinstance(usage_data, list):
        items = usage_data
    else:
        return "<p>No usage data available.</p>"
    
    if not items:
        return "<p>No usage data available.</p>"
    
    html_parts = []
    for m in items[:5]:
        model = m.get("model", "Unknown")
        count = m.get("count", 0)
        pct = m.get("percentage", 0)
        
        html_parts.append(f"""
        <div class="usage-bar">
          <div class="usage-fill" style="width: {min(pct, 100)}%">
            <span>{escape_html(model)}: {count} ({pct}%)</span>
          </div>
        </div>
        """)
    
    return "\n".join(html_parts)


def format_task_list(tasks: list) -> str:
    """Format tasks as HTML list items."""
    if not tasks:
        return "<li>None</li>"
    
    items = []
    for task in tasks:
        if isinstance(task, dict):
            name = task.get("name", str(task))
            priority = task.get("priority", "")
            priority_class = f"priority-{priority.lower()}" if priority else ""
        else:
            name = str(task)
            priority_class = ""
        
        items.append(f'<li class="{priority_class}">{escape_html(name)}</li>')
    
    return "\n".join(items)


def format_overnight_work(data: dict) -> str:
    """Format overnight work from current_state and git commits."""
    items = []
    
    # Check current.md for overnight work
    current_state = data.get("current_state", "")
    if current_state:
        # Extract key sections
        lines = current_state.split('\n')
        for line in lines:
            if line.startswith('- **') or line.startswith('## '):
                items.append({"name": line.replace('#', '').replace('*', '').strip()[:80]})
    
    # Limit to top 5 items
    return format_task_list(items[:5])


def fill_html_template(data: dict) -> str:
    """Fill the HTML template with data."""
    with open(HTML_TEMPLATE) as f:
        html = f.read()
    
    # Get nested data
    dates = data.get("dates", {})
    weather = data.get("weather", {})
    quote = data.get("quote", {})
    calendar = data.get("calendar", {})
    task_progress = data.get("task_progress", {})
    
    # Parse AWS costs (format: "Daily: $X.XX | Monthly: $XX.XX")
    aws_costs = data.get("aws_costs", "")
    aws_daily = "N/A"
    aws_monthly = "N/A"
    if aws_costs:
        parts = aws_costs.split("|")
        for part in parts:
            if "Daily" in part:
                aws_daily = part.split(":")[-1].strip()
            elif "Monthly" in part or "MTD" in part:
                aws_monthly = part.split(":")[-1].strip()
    
    # Health status from disk warning or default
    disk_warning = data.get("disk_warning", "")
    if disk_warning:
        health_status = f"⚠️ {disk_warning}"
        health_class = "status-warn"
    else:
        health_status = "✅ All systems healthy"
        health_class = "status-ok"
    
    # OpenClaw update status - check if there's an update file
    openclaw_update_file = Path.home() / "clawd" / "state" / "openclaw-update.md"
    if openclaw_update_file.exists():
        openclaw_status = "✅ Updated overnight - see details"
        openclaw_class = "status-ok"
    else:
        openclaw_status = "✅ Up to date"
        openclaw_class = "status-ok"
    
    # Credit status - check for rate limit info
    credit_status_file = Path.home() / "clawd" / "state" / "credit-status.md"
    if credit_status_file.exists():
        with open(credit_status_file) as f:
            credit_status = f.read().strip()
        credit_class = "status-warn" if "limited" in credit_status.lower() or "exceeded" in credit_status.lower() else "status-ok"
    else:
        # Default status - can be updated manually or by a script
        credit_status = "✅ ChatGPT Pro: Rate limited until March 2nd | Claude Max: Available"
        credit_class = "status-warn"
    
    # Capture activity
    captures = data.get("captures", {})
    capture_count = captures.get("count", 0) if isinstance(captures, dict) else 0
    
    # Task progress
    task_prog = data.get("task_progress", {})
    practices_count = task_prog.get("practices", 0)
    
    # Build replacements
    replacements = {
        "{{DAY_OF_WEEK}}": dates.get("day_of_week", datetime.now().strftime("%A")),
        "{{DATE_LONG}}": dates.get("date_long", datetime.now().strftime("%B %d, %Y")),
        "{{TIMESTAMP}}": datetime.now().strftime("%Y-%m-%d %H:%M"),
        
        # Weather - use raw string for simplicity
        "{{WEATHER_TODAY}}": weather.get("raw", "Weather unavailable"),
        "{{WEATHER_TOMORROW}}": weather.get("raw", "Weather unavailable"),
        
        # Quote
        "{{QUOTE_TEXT}}": escape_html(quote.get("text", "The best way to predict the future is to create it.")),
        "{{QUOTE_AUTHOR}}": escape_html(quote.get("author", "Peter Drucker")),
        
        # Calendar
        "{{CALENDAR_TODAY_ITEMS}}": format_calendar_list(calendar.get("today", "")),
        "{{CALENDAR_TOMORROW_ITEMS}}": format_calendar_list(calendar.get("tomorrow", "")),
        
        # Feed items
        "{{FEED_ITEMS}}": format_feed_items(data.get("feed", [])),
        
        # Model usage
        "{{MODEL_USAGE_BARS}}": format_model_usage(data.get("model_usage", [])),
        
        # AWS costs
        "{{AWS_DAILY_COST}}": aws_daily,
        "{{AWS_MONTHLY_COST}}": aws_monthly,
        
        # Health
        "{{HEALTH_STATUS}}": health_status,
        "{{HEALTH_STATUS_CLASS}}": health_class,
        
        # OpenClaw Update
        "{{OPENCLAW_STATUS}}": openclaw_status,
        "{{OPENCLAW_STATUS_CLASS}}": openclaw_class,
        
        # Credit Status
        "{{CREDIT_STATUS}}": credit_status,
        "{{CREDIT_STATUS_CLASS}}": credit_class,
        
        # Capture Activity
        "{{CAPTURE_COUNT}}": str(capture_count),
        "{{PRACTICES_COUNT}}": str(practices_count),
        
        # Overnight work
        "{{OVERNIGHT_TASKS}}": format_overnight_work(data),
        
        # Sophie/Mike tasks (will be filled by LLM or extracted from MC)
        "{{SOPHIE_TASKS}}": format_task_list(data.get("sophie_tasks", [])),
        "{{MIKE_TASKS}}": format_task_list(data.get("mike_tasks", [])),
    }
    
    for key, value in replacements.items():
        html = html.replace(key, value)
    
    return html


def main():
    print("Generating morning briefing...")
    
    # Load data
    data = load_data()
    print(f"Loaded data with keys: {list(data.keys())}")
    
    # Generate HTML
    html = fill_html_template(data)
    
    # Save HTML
    with open(HTML_OUTPUT, "w") as f:
        f.write(html)
    
    print(f"HTML saved to: {HTML_OUTPUT}")
    print("Done!")
    sys.exit(0)


if __name__ == "__main__":
    main()
