#!/usr/bin/env python3
"""
Rabbit Status — Show the full pipeline state at a glance.

Usage: python3 rabbit-status.py
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, BOT_LOGIN, STATE_DIR, SPAWN_QUEUE,
    gh, load_json,
)


def main():
    print("=" * 60)
    print("🐇 RABBIT PIPELINE STATUS")
    print("=" * 60)

    # 1. Issues with plan-me (waiting for CodeRabbit)
    print("\n📋 ISSUES AWAITING CODERABBIT PLAN (plan-me label):")
    issues = gh("issue", "list", "--repo", REPO, "--label", "plan-me",
                "--state", "open", "--json", "number,title", "--limit", "20")
    if issues:
        for i in issues:
            print(f"  #{i['number']}: {i['title']}")
    else:
        print("  (none)")

    # 2. Issues in-progress (Neo working)
    print("\n🔧 ISSUES IN PROGRESS (in-progress label):")
    in_prog = gh("issue", "list", "--repo", REPO, "--label", "in-progress",
                 "--state", "open", "--json", "number,title", "--limit", "20")
    if in_prog:
        for i in in_prog:
            print(f"  #{i['number']}: {i['title']}")
    else:
        print("  (none)")

    # 3. Open PRs by Sophie
    print("\n🔀 OPEN PRs (by Sophie):")
    prs = gh("pr", "list", "--repo", REPO, "--state", "open",
             "--author", BOT_LOGIN, "--json", "number,title,headRefName",
             "--limit", "20")
    if prs:
        for pr in prs:
            print(f"  PR #{pr['number']}: {pr['title']} ({pr['headRefName']})")
    else:
        print("  (none)")

    # 4. CI status on open PRs
    if prs:
        print("\n🔍 CI STATUS:")
        for pr in prs:
            num = pr["number"]
            commits = gh("pr", "view", str(num), "--repo", REPO,
                        "--json", "commits")
            if commits and commits.get("commits"):
                sha = commits["commits"][-1]["oid"]
                checks = gh("api",
                           f"repos/{REPO}/commits/{sha}/check-runs",
                           "--jq", ".check_runs")
                if checks and isinstance(checks, list):
                    failed = [c for c in checks if c.get("conclusion") == "failure"]
                    passed = [c for c in checks if c.get("conclusion") == "success"]
                    pending = [c for c in checks if c.get("status") in ("queued", "in_progress")]
                    skipped = [c for c in checks if c.get("conclusion") == "skipped"]
                    status = f"✅{len(passed)} ❌{len(failed)} ⏳{len(pending)} ⏭️{len(skipped)}"
                    print(f"  PR #{num}: {status}")
                    if failed:
                        for f in failed:
                            print(f"    ❌ {f['name']}")
                else:
                    print(f"  PR #{num}: (no checks)")

    # 5. Spawn queue
    print("\n📬 SPAWN QUEUE:")
    if SPAWN_QUEUE.exists() and SPAWN_QUEUE.stat().st_size > 0:
        with open(SPAWN_QUEUE) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        req = json.loads(line)
                        print(f"  [{req.get('task_type', '?')}] PR #{req.get('pr_number', '?')}: {req.get('label', '?')}")
                    except json.JSONDecodeError:
                        pass
    else:
        print("  (empty)")

    # 6. Active ACP session
    print("\n🏃 ACTIVE SESSION:")
    active_file = STATE_DIR / "active-acp.json"
    if active_file.exists():
        try:
            active = json.loads(active_file.read_text())
            started = active.get("started", "?")
            label = active.get("label", "?")
            pid = active.get("pid", "?")
            print(f"  {label} (PID {pid}, started {started})")
        except Exception:
            print("  (corrupt state)")
    else:
        print("  (none)")

    # 7. Cooldowns
    print("\n⏱️ ACTIVE COOLDOWNS:")
    cooldown_file = STATE_DIR / "cooldown.json"
    cooldowns = load_json(cooldown_file, {})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    active_cooldowns = {k: v for k, v in cooldowns.items()
                        if v.get("date") == today and v.get("attempts", 0) > 0}
    if active_cooldowns:
        for key, val in active_cooldowns.items():
            escalated = " ⚠️ ESCALATED" if val.get("escalated") else ""
            print(f"  {key}: {val['attempts']}/3 attempts{escalated}")
    else:
        print("  (none)")

    # 8. Recent completions
    print("\n📦 RECENT COMPLETIONS (last 5):")
    archive_dir = STATE_DIR / "archive"
    if archive_dir.exists():
        archives = sorted(archive_dir.glob("completed-*.json"), reverse=True)[:5]
        for a in archives:
            try:
                data = json.loads(a.read_text())
                result = data.get("result", "?")
                label = data.get("label", "?")
                completed = data.get("completed_at", "?")[:19]
                icon = "✅" if result == "success" else "❌"
                print(f"  {icon} {label} ({completed})")
            except Exception:
                pass
    else:
        print("  (none)")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
