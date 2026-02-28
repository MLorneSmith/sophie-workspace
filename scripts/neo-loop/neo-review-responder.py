#!/usr/bin/env python3
"""
Neo Review Responder — Scans Sophie's open PRs for new review comments
(from CodeRabbit or Mike) that haven't been addressed. Queues Neo to fix them.

Cron: Every 15 minutes during work hours
Schedule: */15 8-23 * * *
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    REPO, BOT_LOGIN, STATE_DIR,
    gh, log, load_json, save_json, queue_spawn,
)

STATE_FILE = STATE_DIR / "review-responder-state.json"

# Review authors we respond to
RESPOND_TO = {"coderabbitai", "slideheroes"}  # CodeRabbit + Mike


def get_our_open_prs():
    """Get open PRs authored by Sophie."""
    prs = gh(
        "pr", "list",
        "--repo", REPO,
        "--state", "open",
        "--author", BOT_LOGIN,
        "--json", "number,title,headRefName,url",
        "--limit", "20",
    )
    return prs or []


def get_review_comments(pr_number: int) -> list[dict]:
    """Get review comments on a PR. Returns list of {id, author, body, path, createdAt}."""
    # Get review threads (inline comments)
    result = gh(
        "api",
        f"repos/{REPO}/pulls/{pr_number}/comments",
        "--jq", ".",
    )
    if not result:
        return []

    comments = []
    for c in result if isinstance(result, list) else []:
        author = c.get("user", {}).get("login", "")
        if author not in RESPOND_TO:
            continue
        comments.append({
            "id": c.get("id"),
            "author": author,
            "body": c.get("body", ""),
            "path": c.get("path", ""),
            "line": c.get("original_line") or c.get("line"),
            "created_at": c.get("created_at", ""),
            "diff_hunk": c.get("diff_hunk", "")[:500],
        })

    # Also get top-level review bodies (not just inline)
    reviews = gh(
        "api",
        f"repos/{REPO}/pulls/{pr_number}/reviews",
        "--jq", ".",
    )
    if reviews and isinstance(reviews, list):
        for r in reviews:
            author = r.get("user", {}).get("login", "")
            body = r.get("body", "")
            if author not in RESPOND_TO or not body.strip():
                continue
            comments.append({
                "id": r.get("id"),
                "author": author,
                "body": body,
                "path": "",
                "line": None,
                "created_at": r.get("submitted_at", ""),
                "diff_hunk": "",
            })

    return comments


def build_task_prompt(pr_number: int, pr_title: str, branch: str, new_comments: list[dict]) -> str:
    """Build task prompt for Neo to address review comments."""
    comment_text = ""
    for i, c in enumerate(new_comments, 1):
        loc = f" ({c['path']}:{c['line']})" if c.get("path") else ""
        comment_text += f"\n### Comment {i} by @{c['author']}{loc}\n"
        if c.get("diff_hunk"):
            comment_text += f"```diff\n{c['diff_hunk']}\n```\n"
        comment_text += f"{c['body']}\n"

    return f"""Address {len(new_comments)} review comment(s) on PR #{pr_number}: {pr_title}

## Instructions

1. `cd ~/2025slideheroes-sophie`
2. `git fetch origin && git checkout {branch} && git pull origin {branch}`
3. Read the full PR: `gh pr view {pr_number} --repo slideheroes/2025slideheroes`
4. Address each review comment below
5. Run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing
6. Commit with: `git commit -m "fix: address review comments on PR #{pr_number}"`
7. Push: `git push origin {branch}`

## Review Comments to Address
{comment_text}

## Important
- Address ALL comments, not just some
- If a comment is a question, add a code comment or fix as appropriate
- If a comment suggests a different approach, implement it
- Do NOT force push — always add new commits
"""


def main():
    log("=== Neo Review Responder ===")

    state = load_json(STATE_FILE, {"seen_comment_ids": []})
    seen_ids = set(state.get("seen_comment_ids", []))

    prs = get_our_open_prs()
    if not prs:
        log("No open PRs")
        return

    log(f"Checking {len(prs)} open PRs")
    spawned = 0

    for pr in prs:
        num = pr["number"]
        title = pr["title"]
        branch = pr["headRefName"]

        all_comments = get_review_comments(num)
        new_comments = [c for c in all_comments if c["id"] not in seen_ids]

        if not new_comments:
            log(f"  PR #{num}: no new comments")
            continue

        log(f"  PR #{num}: {len(new_comments)} new comment(s)")

        # Queue spawn
        label = f"neo-review-{num}"
        task = build_task_prompt(num, title, branch, new_comments)
        queued = queue_spawn(task, label, num, "review-response")

        if queued:
            # Mark all comments (including old ones) as seen
            for c in all_comments:
                seen_ids.add(c["id"])
            spawned += 1

    # Save state
    # Keep seen_ids bounded (last 500)
    seen_list = sorted(seen_ids)[-500:]
    state["seen_comment_ids"] = seen_list
    state["last_run"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    save_json(STATE_FILE, state)

    log(f"Done. Spawned: {spawned}")


if __name__ == "__main__":
    main()
