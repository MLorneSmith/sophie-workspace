#!/usr/bin/env python3
"""
Neo Issue Pickup — Scans for issues with 'plan-me' label that have a
CodeRabbit Coding Plan comment but no linked PR yet. Queues a Neo spawn
to implement the plan.

Supports multiple repos via WATCHED_REPOS config.

Cron: Every 30 minutes during work hours
Schedule: */30 8-23 * * *
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, FORK, BOT_LOGIN, STATE_DIR, WATCHED_REPOS,
    gh, log, load_json, save_json, queue_spawn,
)

STATE_FILE = STATE_DIR / "issue-pickup-state.json"


def get_plan_me_issues(repo: str):
    """Get open issues with plan-me label for a given repo."""
    issues = gh(
        "issue", "list",
        "--repo", repo,
        "--label", "plan-me",
        "--state", "open",
        "--json", "number,title,body,labels",
        "--limit", "20",
    )
    return issues or []


def has_coderabbit_plan(issue_number: int, repo: str) -> str | None:
    """Check if issue has a CodeRabbit coding plan comment. Returns plan text or None."""
    comments = gh(
        "issue", "view", str(issue_number),
        "--repo", repo,
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


def has_linked_pr(issue_number: int, repo: str) -> bool:
    """Check if any open PR references this issue (by our bot)."""
    prs = gh(
        "pr", "list",
        "--repo", repo,
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
        "--repo", repo,
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


def build_task_prompt_fork(issue_number: int, issue_title: str, plan_text: str, repo_config: dict) -> str:
    """Build task prompt for fork-based repos (2025slideheroes)."""
    repo = repo_config["repo"]
    local_dir = repo_config["local_dir"]
    base_branch = repo_config["base_branch"]
    upstream_id = repo_config["upstream_repo_id"]
    fork_id = repo_config["fork_repo_id"]

    return f"""Implement the CodeRabbit Coding Plan for issue #{issue_number}: {issue_title}

## Instructions

1. `cd {local_dir}`
2. `git fetch upstream && git checkout upstream/{base_branch} && git checkout -b sophie/issue-{issue_number}`
3. Read the full issue: `gh issue view {issue_number} --repo {repo}`
4. Implement according to the Coding Plan below
5. Run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing
6. Commit with: `git commit -m "feat: {issue_title} (#{issue_number})"`
7. Push: `git push origin sophie/issue-{issue_number}`
8. Open PR via GraphQL (same-org fork — `gh pr create` doesn't work):

```bash
gh api graphql -f query='
mutation CreatePR {{
  createPullRequest(input: {{
    repositoryId: "{upstream_id}"
    baseRefName: "{base_branch}"
    headRefName: "sophie/issue-{issue_number}"
    headRepositoryId: "{fork_id}"
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


def build_task_prompt_direct(issue_number: int, issue_title: str, plan_text: str, repo_config: dict) -> str:
    """Build task prompt for direct-push repos (internal-tools)."""
    repo = repo_config["repo"]
    local_dir = repo_config["local_dir"]
    base_branch = repo_config["base_branch"]

    return f"""Implement the CodeRabbit Coding Plan for issue #{issue_number}: {issue_title}

## Instructions

1. `cd {local_dir}`
2. `git fetch origin && git checkout origin/{base_branch} && git checkout -b sophie/issue-{issue_number}`
3. Read the full issue: `gh issue view {issue_number} --repo {repo}`
4. Implement according to the Coding Plan below
5. Run the project's lint/typecheck commands before committing
6. Commit with: `git commit -m "feat: {issue_title} (#{issue_number})"`
7. Push: `git push origin sophie/issue-{issue_number}`
8. Open PR:

```bash
gh pr create --repo {repo} \\
  --base {base_branch} \\
  --head sophie/issue-{issue_number} \\
  --title "feat: {issue_title}" \\
  --body "Closes #{issue_number}

Implemented per CodeRabbit Coding Plan."
```

**IMPORTANT:** After merging, always `git push origin {base_branch}` — this repo deploys on push.

## CodeRabbit Coding Plan

{plan_text[:6000]}
"""


def build_task_prompt(issue_number: int, issue_title: str, plan_text: str, repo_config: dict) -> str:
    """Route to the correct prompt builder based on workflow type."""
    if repo_config["workflow"] == "fork":
        return build_task_prompt_fork(issue_number, issue_title, plan_text, repo_config)
    else:
        return build_task_prompt_direct(issue_number, issue_title, plan_text, repo_config)


def main():
    log("=== Neo Issue Pickup ===")

    state = load_json(STATE_FILE, {"processed_issues": []})
    processed = set(state.get("processed_issues", []))
    spawned = 0
    total_issues = 0

    for repo_config in WATCHED_REPOS:
        repo = repo_config["repo"]
        repo_short = repo.split("/")[-1]
        issues = get_plan_me_issues(repo)

        if not issues:
            continue

        total_issues += len(issues)
        log(f"Found {len(issues)} plan-me issues in {repo_short}")

        for issue in issues:
            num = issue["number"]
            title = issue["title"]
            # Use repo-scoped key to avoid collisions between repos
            scoped_key = f"{repo_short}:{num}"

            if scoped_key in processed or num in processed:
                log(f"  #{num} ({repo_short}) already processed, skipping")
                continue

            # Check for CR plan
            plan = has_coderabbit_plan(num, repo)
            if not plan:
                log(f"  #{num} ({repo_short}) no CodeRabbit plan yet, skipping")
                continue

            # Check for existing PR
            if has_linked_pr(num, repo):
                log(f"  #{num} ({repo_short}) already has a linked PR, marking processed")
                processed.add(scoped_key)
                continue

            # Queue the spawn
            label = f"neo-issue-{repo_short}-{num}" if repo != REPO else f"neo-issue-{num}"
            task = build_task_prompt(num, title, plan, repo_config)
            queued = queue_spawn(task, label, num, "issue-pickup")

            if queued:
                processed.add(scoped_key)
                spawned += 1
                log(f"  #{num} ({repo_short}) queued for Neo: {title}")
                # Update labels
                gh("issue", "edit", str(num), "--repo", repo,
                   "--remove-label", "plan-me", "--add-label", "status:in-progress",
                   json_output=False)

    if total_issues == 0:
        log("No plan-me issues found across all repos")

    # Save state
    state["processed_issues"] = list(processed)
    state["last_run"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    save_json(STATE_FILE, state)

    log(f"Done. Spawned: {spawned}")


if __name__ == "__main__":
    main()
