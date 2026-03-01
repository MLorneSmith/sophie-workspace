#!/usr/bin/env python3
"""
Morning Brief v2 — Fully deterministic, zero LLM tokens.

Gathers data from all sources, fills HTML template, sends email + Discord summary.
Designed to run from Linux cron: `0 7 * * * /home/ubuntu/clawd/scripts/morning-brief-v2.py`

Exit codes: 0=success, 1=partial (brief sent with some sections missing), 2=fatal
"""

import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError
import hmac
import hashlib
import base64

# ─── Config ──────────────────────────────────────────────────
TEMPLATE = Path.home() / "clawd" / "templates" / "morning-brief-v2.html"
OUTPUT = Path("/tmp/morning-brief-v2.html")
QUOTES_FILE = Path.home() / "clawd" / "data" / "quotes.json"
CAPTURE_LOG = Path.home() / "clawd" / "data" / "capture-activity.log"
CREDIT_FILE = Path.home() / "clawd" / "state" / "credit-status.md"
UPDATE_FILE = Path.home() / "clawd" / "state" / "openclaw-update.md"
SECRETS_ENV = Path.home() / ".openclaw" / ".secrets.env"
DISCORD_CHANNEL = "channel:1466532593754312899"
EMAIL_TO = "msmith@slideheroes.com"
FEEDBACK_BASE = "https://slideheroes-feedback.slideheroes.workers.dev"
MC_BASE = "http://localhost:3001"

CALENDAR_IDS = [
    "primary",
    "c_8ca5bd26aab60736029ff25bdadca4c72d1302e061a64a5b504d99a659eb2649@group.calendar.google.com",
    "michael@slideheroes.com",
    "michael.lorne.smith@gmail.com",
    "c_10dc7df94029097685011ec009e327370504a62ea79bce9abea83f5b3a934cc4@group.calendar.google.com",
]

TODAY = datetime.now()
YESTERDAY = TODAY - timedelta(days=1)
TOMORROW = TODAY + timedelta(days=1)

errors = []  # Track non-fatal errors


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr)


def run_cmd(cmd, timeout=15):
    """Run a shell command with timeout. Returns stdout or None on failure."""
    env = os.environ.copy()
    # Ensure cron has full PATH for gog, openclaw, etc.
    extra_paths = ["/usr/local/bin", "/home/ubuntu/.npm-global/bin", "/usr/bin", "/bin"]
    existing = env.get("PATH", "")
    for p in extra_paths:
        if p not in existing:
            existing = p + ":" + existing
    env["PATH"] = existing
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, env=env)
        if r.returncode == 0:
            return r.stdout.strip()
        log(f"  cmd failed (rc={r.returncode}): {r.stderr.strip()[:200]}")
        return None
    except (subprocess.TimeoutExpired, Exception) as e:
        log(f"  cmd exception: {e}")
        return None


def http_get(url, timeout=10):
    """HTTP GET with timeout. Returns response text or None."""
    try:
        req = Request(url, headers={"User-Agent": "MorningBrief/2.0"})
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except Exception:
        return None


def esc(text):
    """Escape HTML."""
    if not text:
        return ""
    return (str(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


# ─── Data Gatherers ─────────────────────────────────────────

def get_weather():
    """Get weather from Open-Meteo (primary) with wttr.in fallback."""
    log("Gathering weather...")

    # Primary: Open-Meteo (free, fast, reliable)
    data = http_get(
        "https://api.open-meteo.com/v1/forecast?"
        "latitude=43.65&longitude=-79.38"
        "&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m"
        "&timezone=America/Toronto"
    )
    if data:
        try:
            j = json.loads(data)
            c = j["current"]
            # WMO weather codes to descriptions
            wmo = {
                0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
                55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
                71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
                80: "Light showers", 81: "Showers", 82: "Heavy showers",
                85: "Light snow showers", 86: "Snow showers",
                95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
            }
            code = c.get("weathercode", 0)
            return {
                "temp": f"{c['temperature_2m']:.0f}°C",
                "feels": f"{c['apparent_temperature']:.0f}°C",
                "condition": wmo.get(code, f"Code {code}"),
                "wind": f"{c['windspeed_10m']:.0f} km/h",
                "humidity": f"{c['relativehumidity_2m']}%",
            }
        except (KeyError, json.JSONDecodeError):
            pass

    # Fallback: wttr.in JSON format
    data = http_get("https://wttr.in/Toronto?format=j1", timeout=8)
    if data:
        try:
            j = json.loads(data)
            cc = j["current_condition"][0]
            return {
                "temp": f"{cc['temp_C']}°C",
                "feels": f"{cc['FeelsLikeC']}°C",
                "condition": cc.get("weatherDesc", [{}])[0].get("value", "Unknown"),
                "wind": f"{cc['windspeedKmph']} km/h",
                "humidity": f"{cc['humidity']}%",
            }
        except (KeyError, json.JSONDecodeError):
            pass

    errors.append("Weather: both Open-Meteo and wttr.in failed")
    return {"temp": "N/A", "feels": "N/A", "condition": "Unavailable", "wind": "N/A", "humidity": "N/A"}


def get_quote():
    """Get next quote from rotating quotes file."""
    log("Getting quote...")
    if not QUOTES_FILE.exists():
        return {"text": "The best way to predict the future is to create it.", "author": "Peter Drucker"}

    try:
        with open(QUOTES_FILE) as f:
            data = json.load(f)
        last_idx = data.get("lastUsedIndex", 0)
        total = len(data["quotes"])
        next_idx = (last_idx + 1) % total
        q = data["quotes"][next_idx]

        # Update index
        data["lastUsedIndex"] = next_idx
        with open(QUOTES_FILE, "w") as f:
            json.dump(data, f, indent=2)

        return {"text": q["text"], "author": q["author"]}
    except Exception:
        return {"text": "The best way to predict the future is to create it.", "author": "Peter Drucker"}


def get_calendar_events(date_str, next_date_str, label="today"):
    """Get calendar events for a date range across all calendars."""
    log(f"Getting {label} calendar...")
    all_events = []

    def fetch_cal(cal_id):
        raw = run_cmd(
            f'gog calendar events "{cal_id}" '
            f'--from "{date_str}T05:00:00Z" --to "{next_date_str}T05:00:00Z" --json',
            timeout=10
        )
        if raw:
            try:
                data = json.loads(raw)
                return data.get("events", [])
            except json.JSONDecodeError:
                pass
        return []

    # Parallel fetch with 10s per-request timeout
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(fetch_cal, cid): cid for cid in CALENDAR_IDS}
        for future in futures:
            try:
                events = future.result(timeout=15)
                all_events.extend(events)
            except Exception:
                pass

    # Deduplicate by ID and sort
    seen = set()
    unique = []
    for e in all_events:
        eid = e.get("id", id(e))
        if eid not in seen:
            seen.add(eid)
            unique.append(e)

    unique.sort(key=lambda e: e.get("start", {}).get("dateTime", e.get("start", {}).get("date", "")))

    if not unique:
        return '<div class="cal-empty">No meetings scheduled</div>'

    html = []
    for e in unique:
        start = e.get("start", {})
        dt = start.get("dateTime", "")
        if dt and "T" in dt:
            time_str = dt.split("T")[1][:5]
        else:
            time_str = "All day"
        summary = esc(e.get("summary", "Untitled"))
        html.append(f'<div class="cal-item"><span class="cal-time">{time_str}</span><span class="cal-name">{summary}</span></div>')

    return "\n".join(html)


def get_feed_items():
    """Get feed monitor picks with signed feedback URLs."""
    log("Getting feed items...")
    raw = http_get(f"{MC_BASE}/api/feed-monitor/use-cases", timeout=10)
    if not raw:
        errors.append("Feed Monitor: API unreachable")
        return '<div class="cal-empty">Feed data unavailable</div>'

    try:
        data = json.loads(raw)
        items = data.get("useCases", [])[:7]
    except json.JSONDecodeError:
        errors.append("Feed Monitor: invalid JSON")
        return '<div class="cal-empty">Feed data unavailable</div>'

    if not items:
        return '<div class="cal-empty">No feed items today</div>'

    # Load feedback secret for signed URLs
    feedback_secret = ""
    if SECRETS_ENV.exists():
        for line in SECRETS_ENV.read_text().splitlines():
            if line.startswith("FEEDBACK_SECRET="):
                feedback_secret = line.split("=", 1)[1].strip().strip("'\"").replace("\r", "")
                break

    html = []
    for item in items:
        inner = item.get("item", {})
        title = esc(inner.get("title", "Untitled"))
        url = inner.get("link", "#")
        score = item.get("useCaseScore", 0)
        snippet = esc(item.get("useCaseSnippet", "")[:120])
        item_id = inner.get("id", "")

        actions = ""
        if feedback_secret and item_id:
            def make_sig(payload):
                return base64.urlsafe_b64encode(
                    hmac.new(feedback_secret.encode(), payload.encode(), hashlib.sha256).digest()
                ).rstrip(b"=").decode()

            up_sig = make_sig(f"{item_id}:1")
            down_sig = make_sig(f"{item_id}:-1")
            actions = (
                f'<div class="feed-actions">'
                f'<a href="{FEEDBACK_BASE}/rate?item={item_id}&r=1&sig={up_sig}" class="btn-up">👍 Useful</a>'
                f'<a href="{FEEDBACK_BASE}/rate?item={item_id}&r=-1&sig={down_sig}" class="btn-down">👎 Not useful</a>'
                f'</div>'
            )

        html.append(
            f'<div class="feed-item">'
            f'<a href="{url}" class="feed-title">{title}</a>'
            f'<div class="feed-meta">Score: {score}</div>'
            f'<div class="feed-snippet">{snippet}</div>'
            f'{actions}'
            f'</div>'
        )

    return "\n".join(html)


def get_model_usage():
    """Get model usage from the shell script."""
    log("Getting model usage...")
    raw = run_cmd("~/clawd/scripts/get-model-usage.sh", timeout=20)
    if not raw:
        errors.append("Model usage: script failed")
        return '<div class="cal-empty">Usage data unavailable</div>'

    try:
        items = json.loads(raw)
        if not items:
            return '<div class="cal-empty">No usage data</div>'
    except json.JSONDecodeError:
        return '<div class="cal-empty">Usage data unavailable</div>'

    # Find max for percentage calc
    max_tokens = max(m.get("tokens", 1) for m in items[:6])

    html = []
    for m in items[:6]:
        model = esc(m.get("model", "Unknown"))
        # Shorten model names
        model_short = model.split("/")[-1] if "/" in model else model
        tokens = m.get("tokens", 0)
        msgs = m.get("messages", 0)
        pct = min(int((tokens / max_tokens) * 100), 100) if max_tokens > 0 else 0
        token_str = f"{tokens:,}" if tokens < 1_000_000 else f"{tokens/1_000_000:.1f}M"

        html.append(
            f'<div class="usage-item">'
            f'<div class="usage-label"><span>{model_short}</span><span>{token_str} tokens · {msgs} msgs</span></div>'
            f'<div class="usage-bar-bg"><div class="usage-bar-fill" style="width:{pct}%"></div></div>'
            f'</div>'
        )

    return "\n".join(html)


def get_capture_count():
    """Count captures from yesterday."""
    if not CAPTURE_LOG.exists():
        return "0"
    yesterday_str = YESTERDAY.strftime("%Y-%m-%d")
    try:
        count = sum(1 for line in CAPTURE_LOG.read_text().splitlines() if line.startswith(yesterday_str))
        return str(count)
    except Exception:
        return "0"


def get_aws_costs():
    """Get AWS costs."""
    log("Getting AWS costs...")
    raw = run_cmd("~/clawd/scripts/get-ec2-daily-cost.sh", timeout=20)
    if not raw:
        errors.append("AWS costs: script failed")
        return "N/A", "N/A"

    try:
        data = json.loads(raw)
        daily = f"${data.get('total', 0):.2f}"

        # Get MTD
        mtd_start = TODAY.replace(day=1).strftime("%Y-%m-%d")
        mtd_end = TODAY.strftime("%Y-%m-%d")
        mtd_raw = run_cmd(
            f'aws ce get-cost-and-usage --time-period Start={mtd_start},End={mtd_end} '
            f'--granularity MONTHLY --metrics "UnblendedCost" --output json',
            timeout=15
        )
        if mtd_raw:
            mtd_data = json.loads(mtd_raw)
            mtd_amount = float(mtd_data["ResultsByTime"][0]["Total"]["UnblendedCost"]["Amount"])
            mtd = f"${mtd_amount:.2f}"
        else:
            mtd = "N/A"

        return daily, mtd
    except Exception:
        return "N/A", "N/A"


def get_system_status():
    """Get system health, OpenClaw status, credit status."""
    log("Getting system status...")
    parts = []

    # Disk check
    disk = run_cmd("~/clawd/scripts/check-disk-space.sh", timeout=5)
    if disk:
        parts.append(f'<div class="status status-warn">⚠️ {esc(disk)}</div>')
    else:
        parts.append('<div class="status status-ok">✅ Disk OK</div>')

    # Uptime / load
    load = run_cmd("uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}'", timeout=3)
    uptime = run_cmd("uptime -p", timeout=3)
    if load:
        load_val = float(load.strip())
        cls = "status-ok" if load_val < 1.0 else "status-warn"
        parts.append(f'<div class="status {cls}">⚙️ Load: {load.strip()} · {uptime or "?"}</div>')

    # OpenClaw update
    if UPDATE_FILE.exists():
        parts.append('<div class="status status-ok">🔄 OpenClaw updated overnight</div>')
    else:
        parts.append('<div class="status status-ok">🔄 OpenClaw up to date</div>')

    # Credit status
    if CREDIT_FILE.exists():
        credit = CREDIT_FILE.read_text().strip()
        cls = "status-warn" if "limited" in credit.lower() or "exceeded" in credit.lower() else "status-ok"
        parts.append(f'<div class="status {cls}">💳 {esc(credit)}</div>')

    return "\n".join(parts) if parts else '<div class="status status-ok">✅ All systems healthy</div>'


def get_overnight_work():
    """Get overnight work from cron jobs, memory file, and git commits."""
    log("Getting overnight work...")
    items = []

    # 1. Check OpenClaw cron job results from overnight
    #    Jobs that ran between 11pm yesterday and 7am today
    try:
        cron_out = run_cmd(
            'openclaw cron list --json 2>/dev/null',
            timeout=10
        )
        if cron_out:
            cron_data = json.loads(cron_out)
            cron_jobs = cron_data if isinstance(cron_data, list) else cron_data.get("jobs", [])
            yesterday_11pm = int((datetime.combine(YESTERDAY.date(), datetime.min.time().replace(hour=23))).timestamp() * 1000)
            today_7am = int((datetime.combine(TODAY.date(), datetime.min.time().replace(hour=7))).timestamp() * 1000)

            for job in cron_jobs:
                state = job.get("state", {})
                last_run = state.get("lastRunAtMs", 0)
                if yesterday_11pm <= last_run <= today_7am:
                    name = job.get("name", "Unknown job")
                    status = state.get("lastRunStatus", state.get("lastStatus", "unknown"))
                    duration = state.get("lastDurationMs", 0)
                    dur_str = f"{duration // 60000}m" if duration > 60000 else f"{duration // 1000}s"
                    icon = "✅" if status == "ok" else "❌"
                    items.append(f"{icon} {name} ({dur_str})")
    except Exception:
        pass

    # 2. Check today's memory file for pre-7am entries
    mem_file = Path.home() / "clawd" / "memory" / f"{TODAY.strftime('%Y-%m-%d')}.md"
    if mem_file.exists():
        for line in mem_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("## [") and "]" in line:
                bracket_end = line.index("]")
                time_str = line[3:bracket_end]
                title = line[bracket_end+1:].strip().lstrip("— -").strip()
                try:
                    hour = int(time_str.split(":")[0])
                    if hour < 7:
                        items.append(title)
                except ValueError:
                    pass

    # 3. Check yesterday's memory file for post-11pm entries
    mem_yesterday = Path.home() / "clawd" / "memory" / f"{YESTERDAY.strftime('%Y-%m-%d')}.md"
    if mem_yesterday.exists():
        for line in mem_yesterday.read_text().splitlines():
            line = line.strip()
            if line.startswith("## [") and "]" in line:
                bracket_end = line.index("]")
                time_str = line[3:bracket_end]
                title = line[bracket_end+1:].strip().lstrip("— -").strip()
                try:
                    hour = int(time_str.split(":")[0])
                    if hour >= 23:
                        items.append(title)
                except ValueError:
                    pass

    # 4. Check git commits from overnight (both repos)
    for repo in ["slideheroes-internal-tools", "2025slideheroes-sophie"]:
        repo_path = Path.home() / ("clawd" / Path(repo) if repo == "slideheroes-internal-tools" else Path(repo))
        if repo_path.exists():
            commits = run_cmd(
                f'git -C {repo_path} log --since="yesterday 23:00" --until="today 07:00" '
                f'--oneline --no-merges 2>/dev/null | head -3',
                timeout=5
            )
            if commits:
                for line in commits.splitlines():
                    if line.strip():
                        items.append(f"Commit ({repo.split('-')[0]}): {line.strip()[:60]}")

    # 5. Check notifications file
    noti_file = Path.home() / "clawd" / "state" / "notifications.jsonl"
    if noti_file.exists() and noti_file.stat().st_size > 0:
        try:
            for line in noti_file.read_text().splitlines()[-5:]:
                n = json.loads(line)
                items.append(n.get("summary", n.get("message", ""))[:80])
        except Exception:
            pass

    if not items:
        return '<div class="cal-empty">No overnight activity detected</div>'

    return "\n".join(
        f'<div class="task-item"><span class="task-bullet">→</span>{esc(item)}</div>'
        for item in items[:8]
    )


def get_mc_tasks(endpoint, fallback_msg):
    """Get tasks from Mission Control."""
    log(f"Getting MC tasks: {endpoint}...")
    raw = http_get(f"{MC_BASE}{endpoint}", timeout=10)
    if not raw:
        return f'<div class="cal-empty">{fallback_msg}</div>'

    try:
        tasks = json.loads(raw)
        if not tasks:
            return f'<div class="cal-empty">None</div>'
    except json.JSONDecodeError:
        return f'<div class="cal-empty">{fallback_msg}</div>'

    html = []
    for t in tasks[:5]:
        name = esc(t.get("name", "Untitled"))
        priority = t.get("priority", "").lower()
        cls = f"task-{priority}" if priority in ("high", "medium") else ""
        html.append(f'<div class="task-item {cls}"><span class="task-bullet">→</span>{name}</div>')

    return "\n".join(html)


# ─── Build HTML ──────────────────────────────────────────────

def build_html():
    """Gather all data and fill template."""
    log("Starting morning brief generation...")

    # Parallel data gathering for slow operations
    with ThreadPoolExecutor(max_workers=4) as pool:
        f_weather = pool.submit(get_weather)
        f_aws = pool.submit(get_aws_costs)
        f_feed = pool.submit(get_feed_items)
        f_usage = pool.submit(get_model_usage)

        weather = f_weather.result(timeout=30)
        aws_daily, aws_mtd = f_aws.result(timeout=30)
        feed_html = f_feed.result(timeout=30)
        usage_html = f_usage.result(timeout=30)

    # Sequential (fast)
    quote = get_quote()
    today_str = TODAY.strftime("%Y-%m-%d")
    tomorrow_str = TOMORROW.strftime("%Y-%m-%d")
    day_after = (TOMORROW + timedelta(days=1)).strftime("%Y-%m-%d")

    cal_today = get_calendar_events(today_str, tomorrow_str, "today")
    cal_tomorrow = get_calendar_events(tomorrow_str, day_after, "tomorrow")
    capture_count = get_capture_count()
    system_status = get_system_status()
    overnight = get_overnight_work()

    # MC tasks — Sophie backlog (exclude Board 2) and Mike review queue
    sophie_tasks = get_mc_tasks(
        "/api/v1/tasks?assigned=true&status=backlog",
        "Backlog unavailable"
    )
    mike_tasks = get_mc_tasks(
        "/api/v1/tasks?status=mike_review",
        "Review queue unavailable"
    )

    # Filter Sophie tasks to exclude Board 2 (product) — do it via the API response
    # The MC API may not support boardId filter, so we just show top 5

    # Fill template
    html = TEMPLATE.read_text()
    replacements = {
        "{{DATE_LONG}}": TODAY.strftime("%B %-d, %Y"),
        "{{DAY_OF_WEEK}}": TODAY.strftime("%A"),
        "{{TIMESTAMP}}": TODAY.strftime("%Y-%m-%d %H:%M"),
        "{{WEATHER_TEMP}}": weather["temp"],
        "{{WEATHER_FEELS}}": weather["feels"],
        "{{WEATHER_CONDITION}}": weather["condition"],
        "{{WEATHER_WIND}}": weather["wind"],
        "{{WEATHER_HUMIDITY}}": weather["humidity"],
        "{{QUOTE_TEXT}}": esc(quote["text"]),
        "{{QUOTE_AUTHOR}}": esc(quote["author"]),
        "{{CALENDAR_TODAY}}": cal_today,
        "{{CALENDAR_TOMORROW}}": cal_tomorrow,
        "{{FEED_ITEMS}}": feed_html,
        "{{MODEL_USAGE}}": usage_html,
        "{{CAPTURE_COUNT}}": capture_count,
        "{{AWS_DAILY}}": aws_daily,
        "{{AWS_MTD}}": aws_mtd,
        "{{SYSTEM_STATUS}}": system_status,
        "{{OVERNIGHT_WORK}}": overnight,
        "{{SOPHIE_TASKS}}": sophie_tasks,
        "{{MIKE_TASKS}}": mike_tasks,
    }

    for key, value in replacements.items():
        html = html.replace(key, str(value))

    return html


# ─── Delivery ────────────────────────────────────────────────

def send_email(html):
    """Send brief via gog gmail."""
    log("Sending email...")
    subject = f"Morning Brief — {TODAY.strftime('%A, %B %-d, %Y')}"

    # Write HTML to temp file and pipe to gog
    tmp = Path("/tmp/morning-brief-v2-email.html")
    tmp.write_text(html)

    # --body-html takes inline string; use --body-file for plain but we need HTML
    # Read the file content and pass as --body-html (escaped for shell)
    # Safer: write a small wrapper that reads from file
    result = run_cmd(
        f"python3 -c \""
        f"import subprocess, pathlib; "
        f"html = pathlib.Path('{tmp}').read_text(); "
        f"subprocess.run(['gog','gmail','send','--to','{EMAIL_TO}',"
        f"'--subject','{subject}','--body-html',html,'--no-input'], check=True)"
        f"\"",
        timeout=30
    )
    if result is not None:
        log("✅ Email sent")
        return True
    else:
        errors.append("Email delivery failed")
        log("❌ Email failed")
        return False


def post_discord_summary():
    """Post a concise summary to Discord via openclaw CLI."""
    log("Posting Discord summary...")
    lines = [
        f"☀️ **Morning Brief — {TODAY.strftime('%A, %B %-d')}**",
        "📧 Full brief sent to email.",
    ]
    if errors:
        lines.append(f"⚠️ Issues: {', '.join(errors[:3])}")

    summary = "\n".join(lines)

    # Use openclaw message send
    result = run_cmd(
        f"openclaw message send --channel discord -t 1466532593754312899 -m '{summary.replace(chr(39), chr(39)+chr(92)+chr(39)+chr(39))}'",
        timeout=15
    )
    if result is not None:
        log("✅ Discord posted")
    else:
        # Fallback: just print it
        print(summary)
        log("⚠️ Discord post failed, printed to stdout")


# ─── Main ────────────────────────────────────────────────────

def main():
    try:
        html = build_html()
    except Exception as e:
        log(f"FATAL: {e}")
        sys.exit(2)

    # Save HTML
    OUTPUT.write_text(html)
    log(f"HTML saved: {OUTPUT}")

    # Send email
    send_email(html)

    # Post Discord summary via openclaw CLI
    post_discord_summary()

    if errors:
        log(f"Completed with {len(errors)} warnings: {errors}")
        sys.exit(1)
    else:
        log("Completed successfully")
        sys.exit(0)


if __name__ == "__main__":
    main()
