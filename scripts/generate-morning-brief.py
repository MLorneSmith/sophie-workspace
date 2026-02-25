#!/usr/bin python3
"""
Morning Briefing Generator

Generates both Markdown and HTML versions of the morning brief.
Uses fixed templates for consistent formatting.
Only uses LLM for composition sections (quotes, headlines, Sophie/Mike tasks).

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
MD_OUTPUT = Path("/tmp/morning-brief.md")
HTML_OUTPUT = Path("/tmp/morning-brief.html")
MD_TEMPLATE = Path.home() / "clawd" / "templates" / "morning-briefing.md"
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
    return (text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;"))


def format_calendar_events(events: list) -> str:
    """Format calendar events as HTML list items."""
    if not events:
        return "<li>No meetings scheduled.</li>"
    
    items = []
    for event in events:
        time = event.get("time", "All day")
        summary = event.get("summary", "Untitled")
        items.append(f"<li>{escape_html(time)} — {escape_html(summary)}</li>")
    
    return "\n".join(items)


def format_feed_items(items: list) -> str:
    """Format feed items as HTML."""
    if not items:
        return "<p>No feed items.</p>"
    
    html_parts = []
    for i, item in enumerate(items[:8], 1):
        title = escape_html(item.get("title", "Untitled"))
        url = item.get("link", "#")
        score = item.get("score", 0)
        description = escape_html(item.get("description", "")[:100])
        upvote_url = item.get("upvoteUrl", "#")
        downvote_url = item.get("downvoteUrl", "#")
        
        html_parts.append(f"""
        <div class="feed-item">
          <strong><a href="{url}">{title}</a></strong>
          <div class="feed-meta">Score: {score} · <a href="{upvote_url}">👍</a> · <a href="{downvote_url}">👎</a></div>
        </div>
        """)
    
    return "\n".join(html_parts)


def format_task_list(tasks: list) -> str:
    """Format tasks as HTML list items."""
    if not tasks:
        return "<li>None</li>"
    
    items = []
    for task in tasks:
        name = task.get("name", task) if isinstance(task, dict) else str(task)
        items.append(f"<li>{escape_html(name)}</li>")
    
    return "\n".join(items)


def fill_html_template(data: dict) -> str:
    """Fill the HTML template with data."""
    with open(HTML_TEMPLATE) as f:
        html = f.read()
    
    # Get weather data
    weather = data.get("weather", {})
    weather_today = weather.get("forecast_today", {})
    weather_tomorrow = weather.get("forecast_tomorrow", {})
    
    weather_summary = f"""
    <p><strong>Today:</strong> {escape_html(weather_today.get('condition', 'N/A'))} · {escape_html(weather_today.get('temperature', 'N/A'))}</p>
    <p><strong>Tomorrow:</strong> {escape_html(weather_tomorrow.get('condition', 'N/A'))} · {escape_html(weather_tomorrow.get('temperature', 'N/A'))}</p>
    """
    
    # Get calendar data
    cal_today = data.get("calendar", {}).get("today", [])
    cal_tomorrow = data.get("calendar", {}).get("tomorrow", [])
    
    # Get feed items
    feed_items = data.get("feed_items", [])
    
    # Get model usage
    model_usage = data.get("model_usage", [])
    model_usage_html = "<ul>"
    for m in model_usage[:5]:
        model_usage_html += f"<li>{escape_html(m.get('model', 'Unknown'))}: {m.get('count', 0)} calls ({m.get('percentage', 0)}%)</li>"
    model_usage_html += "</ul>"
    
    # Get AWS costs
    aws = data.get("aws_costs", {})
    
    # Get health check
    health = data.get("healthcheck", {})
    health_status = "✅ All systems healthy" if health.get("healthy", True) else "⚠️ Issues detected"
    health_class = "health-ok" if health.get("healthy", True) else "health-warning"
    
    # Get overnight work
    overnight = data.get("overnight", {})
    backlog_tasks = overnight.get("backlog_progress", {}).get("tasks", [])
    initiative_tasks = overnight.get("new_initiatives", {}).get("tasks", [])
    git_commits = overnight.get("git_commits", [])
    all_overnight = backlog_tasks + initiative_tasks + [{"name": c} for c in git_commits]
    
    # Get Sophie/Mike tasks (these would be composed by LLM or extracted from MC)
    sophie_tasks = data.get("sophie_tasks", ["Review overnight work", "Check emails", "Monitor cron jobs"])
    mike_tasks = data.get("mike_tasks", ["Review PRs", "Check Mission Control"])
    
    # Get quote
    quote = data.get("quote", {})
    
    # Replace placeholders
    replacements = {
        "{{DAY_OF_WEEK}}": datetime.now().strftime("%A"),
        "{{DATE_LONG}}": datetime.now().strftime("%B %d, %Y"),
        "{{TIMESTAMP}}": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "{{WEATHER_SUMMARY}}": weather_summary,
        "{{CALENDAR_TODAY_ITEMS}}": format_calendar_events(cal_today),
        "{{CALENDAR_TOMORROW_ITEMS}}": format_calendar_events(cal_tomorrow),
        "{{FEED_ITEMS}}": format_feed_items(feed_items),
        "{{MODEL_USAGE_BARS}}": model_usage_html,
        "{{AWS_DAILY_COST}}": f"${aws.get('daily', 'N/A')}",
        "{{AWS_MONTHLY_COST}}": f"${aws.get('monthly', 'N/A')}",
        "{{HEALTH_STATUS}}": health_status,
        "{{HEALTH_STATUS_CLASS}}": health_class,
        "{{OVERNIGHT_TASKS}}": format_task_list(all_overnight),
        "{{SOPHIE_TASKS}}": format_task_list(sophie_tasks),
        "{{MIKE_TASKS}}": format_task_list(mike_tasks),
        "{{QUOTE_TEXT}}": escape_html(quote.get("text", "The best way to predict the future is to create it.")),
        "{{QUOTE_AUTHOR}}": escape_html(quote.get("author", "Peter Drucker")),
    }
    
    for key, value in replacements.items():
        html = html.replace(key, value)
    
    return html


def main():
    print("Generating morning briefing...")
    
    # Load data
    data = load_data()
    
    # Generate HTML
    html = fill_html_template(data)
    
    # Save HTML
    with open(HTML_OUTPUT, "w") as f:
        f.write(html)
    
    print(f"HTML saved to: {HTML_OUTPUT}")
    
    # Note: Markdown version would still need LLM for composition
    # For now, just output the HTML
    print("Done!")
    sys.exit(0)


if __name__ == "__main__":
    main()
