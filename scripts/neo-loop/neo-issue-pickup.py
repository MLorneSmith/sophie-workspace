#!/usr/bin/env python3
"""
Neo Issue Pickup — Scans for issues with 'plan-me' label that have a
CodeRabbit Coding Plan comment but no linked PR yet. Queues a Neo spawn
to implement the plan.

Cron: Every 30 minutes during work hours
Schedule: */30 8-23 * * *
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, FORK, BOT_LOGIN, STATE_DIR,
    gh, log, load_json, save_json, queue_spawn,
)

STATE_FILE = STATE_DIR / "issue-pickup-state.json"


def get_plan_me_issues():
    """Get open issues with plan-me label."""
    issues = gh(
        "issue", "list",
        "--repo", REPO,
        "--label", "plan-me",
        "--state", "open",
        "--json", "number,title,body,labels",
        "--limit", "20",
    )
    return issues or []


def has_coderabbit_plan(issue_number: int) -> str | None:
    """Check if issue has a CodeRabbit coding plan comment. Returns plan text or None."""
    comments = gh(
        "issue", "view", str(issue_number),
        "--repo", REPO,
        "--json", "comments",
    )
    if not comments:
        return None

    for comment in comments.get("comments", []):
        author = comment.get("author", {}).get("login", "")
        body = comment.get("body", "")
        if author == "coderabbitai" and ("Coding Plan" in body or "coding plan" in body or "## Implementation" in body):
            return body
    return None


def has_linked_pr(issue_number: int) -> bool:
    """Check if any open PR references this issue (by our bot)."""
    prs = gh(
        "pr", "list",
        "--repo", REPO,
        "--state", "open",
        "--author", BOT_LOGIN,
        "--json", "number,title,body",
        "--limit", "50",
    )
    if not prs:
        return False

    for pr in prs:
        body = pr.get("body", "") or ""
        title = pr.get("title", "") or ""
        ref = f"#{issue_number}"
        if ref in body or ref in title:
            return True

    # Also check closed/merged PRs from the last batch
    prs_closed = gh(
        "pr", "list",
        "--repo", REPO,
        "--state", "merged",
        "--author", BOT_LOGIN,
        "--json", "number,title,body",
        "--limit", "20",
    )
    if prs_closed:
        for pr in prs_closed:
            body = pr.get("body", "") or ""
            title = pr.get("title", "") or ""
            ref = f"#{issue_number}"
            if ref in body or ref in title:
                return True

    return False


def build_task_prompt(issue_number: int, issue_title: str, plan_text: str) -> str:
    """Build the task prompt for Neo."""
    return f"""Implement the CodeRabbit Coding Plan for issue #{issue_number}: {issue_title}

## Instructions

1. `cd ~/2025slideheroes-sophie`
2. `git fetch upstream && git checkout upstream/dev && git checkout -b sophie/issue-{issue_number}`
3. Read the full issue: `gh issue view {issue_number} --repo slideheroes/2025slideheroes`
4. Implement according to the Coding Plan below
5. Run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing
6. Commit with: `git commit -m "feat: {issue_title} (#{issue_number})"`
7. Push: `git push origin sophie/issue-{issue_number}`
8. Open PR via GraphQL (same-org fork — `gh pr create` doesn't work):

```bash
gh api graphql -f query='
mutation CreatePR {{
  createPullRequest(input: {{
    repositoryId: "R_kgDON3X_Ow"
    baseRefName: "dev"
    headRefName: "sophie/issue-{issue_number}"
    headRepositoryId: "R_kgDORH2m4g"
    title: "feat: {issue_title}"
    body: "Closes #{issue_number}\\n\\nImplemented per CodeRabbit Coding Plan."
  }}) {{
    pullRequest {{ url number }}
  }}
}}'
```

## CodeRabbit Coding Plan

{plan_text[:6000]}
"""


def main():
    log("=== Neo Issue Pickup ===")

    state = load_json(STATE_FILE, {"processed_issues": []})
    processed = set(state.get("processed_issues", []))
    issues = get_plan_me_issues()

    if not issues:
        log("No plan-me issues found")
        return

    log(f"Found {len(issues)} plan-me issues")
    spawned = 0

    for issue in issues:
        num = issue["number"]
        title = issue["title"]

        if num in processed:
            log(f"  #{num} already processed, skipping")
            continue

        # Check for CR plan
        plan = has_coderabbit_plan(num)
        if not plan:
            log(f"  #{num} no CodeRabbit plan yet, skipping")
            continue

        # Check for existing PR
        if has_linked_pr(num):
            log(f"  #{num} already has a linked PR, marking processed")
            processed.add(num)
            continue

        # Queue the spawn
        label = f"neo-issue-{num}"
        task = build_task_prompt(num, title, plan)
        queued = queue_spawn(task, label, num, "issue-pickup")

        if queued:
            processed.add(num)
            spawned += 1
            log(f"  #{num} queued for Neo: {title}")

    # Save state
    state["processed_issues"] = list(processed)
    state["last_run"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    save_json(STATE_FILE, state)

    log(f"Done. Spawned: {spawned}")


if __name__ == "__main__":
    main()
