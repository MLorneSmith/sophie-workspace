#!/usr/bin/env python3
"""
Neo PR Merge Sync — When Sophie's PRs get merged, update MC tasks to done
and remove labels from GitHub issues.

Cron: Every 10 minutes during work hours
Schedule: */10 8-23 * * *
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, BOT_LOGIN, STATE_DIR,
    gh, log, load_json, save_json, notify_neo_channel, should_skip,
)

STATE_FILE = STATE_DIR / "merge-sync-state.json"
MC_API = os.environ.get("MC_API_URL", "https://internal.slideheroes.com/api/v1")


def get_recently_merged_prs():
    """Get PRs merged in the last 24 hours by Sophie."""
    prs = gh(
        "pr", "list",
        "--repo", REPO,
        "--state", "merged",
        "--author", BOT_LOGIN,
        "--json", "number,title,body,mergedAt,headRefName",
        "--limit", "20",
    )
    return prs or []


def extract_issue_numbers(pr_body: str, pr_title: str) -> list[int]:
    """Extract issue numbers from PR body (Closes #NNN, Fixes #NNN, etc.)."""
    text = (pr_body or "") + " " + (pr_title or "")
    patterns = [
        r'(?:closes|fixes|resolves)\s+#(\d+)',
        r'(?:close|fix|resolve)\s+#(\d+)',
        r'#(\d+)',
    ]
    issues = set()
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            issues.add(int(match.group(1)))
    return sorted(issues)


def update_mc_task_done(issue_number: int, pr_number: int):
    """Find MC task linked to this issue and mark as done."""
    # Load CF Access creds from .secrets.env
    cf_id = os.environ.get("CF_ACCESS_CLIENT_ID", "")
    cf_secret = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")

    if not cf_id or not cf_secret:
        secrets_file = Path.home() / ".openclaw" / ".secrets.env"
        if secrets_file.exists():
            for line in secrets_file.read_text().splitlines():
                if line.startswith("CF_ACCESS_CLIENT_ID="):
                    cf_id = line.split("=", 1)[1].strip()
                elif line.startswith("CF_ACCESS_CLIENT_SECRET="):
                    cf_secret = line.split("=", 1)[1].strip()

    if not cf_id or not cf_secret:
        log(f"  No CF Access creds, skipping MC update for issue #{issue_number}")
        return False

    # Search for task with this GitHub issue
    try:
        req = urllib.request.Request(
            f"{MC_API}/tasks?search=%23{issue_number}",
            headers={
                "CF-Access-Client-Id": cf_id,
                "CF-Access-Client-Secret": cf_secret,
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tasks = json.loads(resp.read())
    except Exception as e:
        log(f"  MC search failed: {e}")
        return False

    if not tasks:
        log(f"  No MC task found for issue #{issue_number}")
        return False

    # Update first matching task
    task = tasks[0] if isinstance(tasks, list) else None
    if not task:
        return False

    task_id = task.get("id")
    try:
        data = json.dumps({
            "status": "done",
            "activity_note": f"PR #{pr_number} merged. Auto-closed."
        }).encode()
        req = urllib.request.Request(
            f"{MC_API}/tasks/{task_id}",
            data=data,
            method="PATCH",
            headers={
                "CF-Access-Client-Id": cf_id,
                "CF-Access-Client-Secret": cf_secret,
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        log(f"  MC task #{task_id} → done (issue #{issue_number}, PR #{pr_number})")
        return True
    except Exception as e:
        log(f"  MC update failed for task #{task_id}: {e}")
        return False


def close_issue_labels(issue_number: int):
    """Remove in-progress label from closed issue."""
    gh("issue", "edit", str(issue_number), "--repo", REPO,
       "--remove-label", "in-progress",
       json_output=False)


def main():
    log("=== Neo PR Merge Sync ===")

    if should_skip():
        return

    state = load_json(STATE_FILE, {"synced_prs": []})
    synced = set(state.get("synced_prs", []))

    prs = get_recently_merged_prs()
    if not prs:
        log("No recently merged PRs")
        return

    log(f"Checking {len(prs)} merged PRs")
    updated = 0

    for pr in prs:
        num = pr["number"]
        if num in synced:
            continue

        title = pr.get("title", "")
        body = pr.get("body", "")
        issues = extract_issue_numbers(body, title)

        if not issues:
            log(f"  PR #{num}: no linked issues found")
            synced.add(num)
            continue

        log(f"  PR #{num}: linked issues {issues}")

        for issue_num in issues:
            update_mc_task_done(issue_num, num)
            close_issue_labels(issue_num)

        synced.add(num)
        updated += 1
        notify_neo_channel(f"✅ PR #{num} merged → MC tasks updated for issues {issues}")

    # Keep last 100 synced PRs
    state["synced_prs"] = sorted(synced)[-100:]
    state["last_run"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    save_json(STATE_FILE, state)

    log(f"Done. Updated: {updated}")


if __name__ == "__main__":
    main()
