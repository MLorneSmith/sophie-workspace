#!/usr/bin/env python3
"""
Neo CI Fix — Scans Sophie's open PRs for failing CI on the latest commit.
Fetches failure logs and queues Neo to diagnose and fix.

Cron: Every 10 minutes during work hours
Schedule: */10 8-23 * * *
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, BOT_LOGIN, STATE_DIR,
    gh, log, load_json, save_json, queue_spawn,
)

STATE_FILE = STATE_DIR / "ci-fix-state.json"


def get_our_open_prs():
    """Get open PRs authored by Sophie with head SHA."""
    prs = gh(
        "pr", "list",
        "--repo", REPO,
        "--state", "open",
        "--author", BOT_LOGIN,
        "--json", "number,title,headRefName,commits",
        "--limit", "20",
    )
    if not prs:
        return []

    # Get head SHA for each PR
    enriched = []
    for pr in prs:
        commits = pr.get("commits", [])
        head_sha = commits[-1]["oid"] if commits else None
        enriched.append({
            "number": pr["number"],
            "title": pr["title"],
            "branch": pr["headRefName"],
            "head_sha": head_sha,
        })
    return enriched


def get_check_runs(head_sha: str, branch: str = None) -> list[dict]:
    """Get CI status for a commit via GitHub Actions API.
    
    Falls back to actions/runs by branch since SophieLegerPA's PAT
    doesn't have checks:read scope (403 on check-runs endpoint).
    """
    if not head_sha and not branch:
        return []

    # Use actions/runs API (works with Triage role)
    endpoint = f"repos/{REPO}/actions/runs?per_page=5"
    if branch:
        endpoint += f"&branch={branch}"
    elif head_sha:
        endpoint += f"&head_sha={head_sha}"

    result = gh("api", endpoint, "--jq", ".workflow_runs")
    if not result or not isinstance(result, list):
        return []

    # Convert to check-run-like format for compatibility
    checks = []
    for run in result:
        checks.append({
            "name": run.get("name", "unknown"),
            "conclusion": run.get("conclusion"),
            "status": run.get("status"),
            "details_url": run.get("html_url", ""),
            "app": {"slug": "github-actions"},
            "run_id": run.get("id"),
        })
    return checks


def get_failed_run_logs(run_id: int) -> str:
    """Get the last 200 lines of a failed GitHub Actions job log."""
    # Get the run's jobs
    result = gh(
        "api",
        f"repos/{REPO}/actions/runs/{run_id}/jobs",
        "--jq", ".jobs",
    )
    if not result or not isinstance(result, list):
        return "(could not fetch jobs)"

    failed_logs = []
    for job in result:
        if job.get("conclusion") != "failure":
            continue
        job_id = job.get("id")
        job_name = job.get("name", "unknown")

        # Get job logs
        log_text = gh(
            "api",
            f"repos/{REPO}/actions/jobs/{job_id}/logs",
            json_output=False,
        )
        if log_text:
            lines = log_text.strip().split("\n")
            tail = "\n".join(lines[-200:])
            failed_logs.append(f"### Job: {job_name}\n```\n{tail}\n```")

    return "\n\n".join(failed_logs) if failed_logs else "(no failure logs captured)"


def get_actions_run_id_from_checks(checks: list[dict]) -> int | None:
    """Extract the GitHub Actions run ID from check runs."""
    for check in checks:
        # Direct run_id (from our actions/runs API conversion)
        if check.get("conclusion") == "failure" and check.get("run_id"):
            return check["run_id"]
        # Fallback: parse from details_url
        app = check.get("app", {}).get("slug", "")
        if app == "github-actions" and check.get("conclusion") == "failure":
            url = check.get("details_url", "")
            parts = url.split("/actions/runs/")
            if len(parts) == 2:
                run_id = parts[1].split("/")[0]
                try:
                    return int(run_id)
                except ValueError:
                    pass
    return None


def build_task_prompt(pr_number: int, pr_title: str, branch: str, failure_logs: str) -> str:
    """Build task prompt for Neo to fix CI."""
    return f"""Fix failing CI on PR #{pr_number}: {pr_title}

## Instructions

1. `cd ~/2025slideheroes-sophie`
2. `git fetch origin && git checkout {branch} && git pull origin {branch}`
3. Analyze the CI failure logs below
4. Diagnose the root cause
5. Fix the issue
6. Run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` locally to verify
7. Run ONLY the specific test files related to your changes — NEVER run `pnpm test` (full suite). Use `cd apps/web && pnpm vitest run <specific-test-file>` instead
8. Commit with: `git commit -m "fix: CI failure on PR #{pr_number}"`
9. Push: `git push origin {branch}`

## CI Failure Logs

{failure_logs[:8000]}

## Important
- ONLY fix errors caused by changes in THIS PR. Check `git diff upstream/dev...HEAD --name-only` to see what this PR changed
- If a CI failure is in a file NOT touched by this PR, SKIP IT — it's a pre-existing issue
- Read the FULL error output carefully before changing anything
- The fix should address the root cause, not just suppress the error
- If the failure is a flaky test (not deterministic), note that in your commit message
- Do NOT force push — always add new commits
- Do NOT run `pnpm test` — only run specific test files related to your changes
"""


def main():
    log("=== Neo CI Fix ===")

    state = load_json(STATE_FILE, {"fixed_shas": []})
    fixed_shas = set(state.get("fixed_shas", []))

    prs = get_our_open_prs()
    if not prs:
        log("No open PRs")
        return

    log(f"Checking CI on {len(prs)} open PRs")
    spawned = 0

    for pr in prs:
        num = pr["number"]
        title = pr["title"]
        branch = pr["branch"]
        sha = pr["head_sha"]

        if not sha:
            log(f"  PR #{num}: no head SHA, skipping")
            continue

        if sha in fixed_shas:
            log(f"  PR #{num}: SHA {sha[:8]} already attempted fix, skipping")
            continue

        checks = get_check_runs(sha, branch=branch)
        if not checks:
            log(f"  PR #{num}: no check runs yet")
            continue

        # Check status
        failed = [c for c in checks if c.get("conclusion") == "failure"]
        pending = [c for c in checks if c.get("status") in ("queued", "in_progress")]
        success = [c for c in checks if c.get("conclusion") == "success"]

        if pending:
            log(f"  PR #{num}: {len(pending)} checks still running, waiting")
            continue

        if not failed:
            log(f"  PR #{num}: all checks passing ✅")
            continue

        log(f"  PR #{num}: {len(failed)} failed check(s)")

        # Get failure logs
        run_id = get_actions_run_id_from_checks(checks)
        if run_id:
            failure_logs = get_failed_run_logs(run_id)
        else:
            # Fallback: use check run output
            logs_parts = []
            for check in failed:
                name = check.get("name", "unknown")
                output = check.get("output", {})
                summary = output.get("summary", "") or output.get("text", "") or ""
                logs_parts.append(f"### {name}\n{summary[:2000]}")
            failure_logs = "\n\n".join(logs_parts) if logs_parts else "(no logs available)"

        # Queue spawn — only mark SHA if queue succeeds
        label = f"neo-ci-{num}"
        task = build_task_prompt(num, title, branch, failure_logs)
        queued = queue_spawn(task, label, num, "ci-fix")

        if queued:
            fixed_shas.add(sha)
            spawned += 1
        else:
            log(f"  PR #{num}: queue failed, SHA NOT marked (will retry next cycle)")

    # Save state — keep last 200 SHAs
    state["fixed_shas"] = sorted(fixed_shas)[-200:]
    state["last_run"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    save_json(STATE_FILE, state)

    log(f"Done. Spawned: {spawned}")


if __name__ == "__main__":
    main()
