"""Git operations for ADW composable architecture.

Provides centralized git operations that build on top of github.py module.
"""

import subprocess
import json
import logging
from typing import Optional, Tuple, List

# Import GitHub functions from existing module
from adw_modules.github import get_repo_url, extract_repo_path, make_issue_comment

# Maximum allowed deletions before blocking commit
MAX_ALLOWED_DELETIONS = 5


def get_staged_changes_summary() -> Tuple[int, int, int, List[str]]:
    """Get summary of staged changes.

    Returns (added, modified, deleted, deleted_files) tuple.
    """
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-status"],
        capture_output=True, text=True
    )

    added = 0
    modified = 0
    deleted = 0
    deleted_files: List[str] = []

    if result.returncode == 0 and result.stdout.strip():
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) >= 2:
                status = parts[0][0]  # First character of status
                filename = parts[1]
                if status == "A":
                    added += 1
                elif status == "M":
                    modified += 1
                elif status == "D":
                    deleted += 1
                    deleted_files.append(filename)

    return added, modified, deleted, deleted_files


def get_unstaged_changes_summary() -> Tuple[int, int, int, List[str]]:
    """Get summary of unstaged changes (what would be staged by git add -A).

    Returns (added, modified, deleted, deleted_files) tuple.
    """
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True
    )

    added = 0
    modified = 0
    deleted = 0
    deleted_files: List[str] = []

    if result.returncode == 0 and result.stdout.strip():
        for line in result.stdout.strip().split("\n"):
            if not line or len(line) < 3:
                continue
            # Porcelain format: XY filename
            # X = index status, Y = worktree status
            index_status = line[0]
            worktree_status = line[1]
            filename = line[3:]  # Skip "XY "

            # Count based on what would happen after staging
            if index_status == "?" or worktree_status == "?":
                added += 1  # Untracked file
            elif index_status == "D" or worktree_status == "D":
                deleted += 1
                deleted_files.append(filename)
            elif index_status in ["M", "A"] or worktree_status in ["M", "A"]:
                if index_status == "A":
                    added += 1
                else:
                    modified += 1

    return added, modified, deleted, deleted_files


def get_current_branch() -> str:
    """Get current git branch name."""
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True, text=True
    )
    return result.stdout.strip()


def push_branch(branch_name: str) -> Tuple[bool, Optional[str]]:
    """Push current branch to remote. Returns (success, error_message)."""
    result = subprocess.run(
        ["git", "push", "-u", "origin", branch_name],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return False, result.stderr
    return True, None


def check_pr_exists(branch_name: str) -> Optional[str]:
    """Check if PR exists for branch. Returns PR URL if exists."""
    # Use github.py functions to get repo info
    try:
        repo_url = get_repo_url()
        repo_path = extract_repo_path(repo_url)
    except Exception as e:
        return None
    
    result = subprocess.run(
        ["gh", "pr", "list", "--repo", repo_path, "--head", branch_name, "--json", "url"],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        prs = json.loads(result.stdout)
        if prs:
            return prs[0]["url"]
    return None


def create_branch(branch_name: str) -> Tuple[bool, Optional[str]]:
    """Create and checkout a new branch. Returns (success, error_message)."""
    # Create branch
    result = subprocess.run(
        ["git", "checkout", "-b", branch_name],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        # Check if error is because branch already exists
        if "already exists" in result.stderr:
            # Try to checkout existing branch
            result = subprocess.run(
                ["git", "checkout", branch_name],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                return False, result.stderr
            return True, None
        return False, result.stderr
    return True, None


def commit_changes(
    message: str,
    files: Optional[List[str]] = None,
    allow_deletions: bool = False
) -> Tuple[bool, Optional[str]]:
    """Stage changes and commit with safety checks.

    Args:
        message: Commit message
        files: Optional list of specific files to stage. If None, stages all changes.
        allow_deletions: If True, bypass deletion limit check. Default False.

    Returns (success, error_message).

    Safety features:
    - Blocks commits with more than 5 deletions (unless allow_deletions=True)
    - Reports summary of changes before committing
    """
    # Check if there are changes to commit
    result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if not result.stdout.strip():
        return True, None  # No changes to commit

    # Check for deletions BEFORE staging
    _, _, pending_deletions, deleted_files = get_unstaged_changes_summary()

    if not allow_deletions and pending_deletions > MAX_ALLOWED_DELETIONS:
        error_msg = (
            f"Commit blocked: {pending_deletions} deletions detected (max allowed: {MAX_ALLOWED_DELETIONS}). "
            f"Deleted files: {', '.join(deleted_files[:10])}"
            f"{'...' if len(deleted_files) > 10 else ''}. "
            "Use allow_deletions=True to override or review changes manually."
        )
        return False, error_msg

    # Stage changes
    if files:
        # Stage specific files only
        for file in files:
            result = subprocess.run(["git", "add", file], capture_output=True, text=True)
            if result.returncode != 0:
                # File might not exist, skip silently
                pass
    else:
        # Stage all changes
        result = subprocess.run(["git", "add", "-A"], capture_output=True, text=True)
        if result.returncode != 0:
            return False, result.stderr

    # Verify staged changes don't exceed deletion limit
    added, modified, deleted, deleted_files = get_staged_changes_summary()

    if not allow_deletions and deleted > MAX_ALLOWED_DELETIONS:
        # Unstage everything and report error
        subprocess.run(["git", "reset", "HEAD"], capture_output=True, text=True)
        error_msg = (
            f"Commit blocked after staging: {deleted} deletions detected (max allowed: {MAX_ALLOWED_DELETIONS}). "
            f"Deleted files: {', '.join(deleted_files[:10])}"
            f"{'...' if len(deleted_files) > 10 else ''}. "
            "Changes have been unstaged. Review manually or use allow_deletions=True."
        )
        return False, error_msg

    # Commit
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return False, result.stderr

    return True, None


def finalize_git_operations(state: 'ADWState', logger: logging.Logger) -> None:
    """Standard git finalization: push branch and create/update PR."""
    branch_name = state.get("branch_name")
    if not branch_name:
        # Fallback: use current git branch if not main
        current_branch = get_current_branch()
        if current_branch and current_branch != "main":
            logger.warning(f"No branch name in state, using current branch: {current_branch}")
            branch_name = current_branch
        else:
            logger.error("No branch name in state and current branch is main, skipping git operations")
            return
    
    # Always push
    success, error = push_branch(branch_name)
    if not success:
        logger.error(f"Failed to push branch: {error}")
        return
    
    logger.info(f"Pushed branch: {branch_name}")
    
    # Handle PR
    pr_url = check_pr_exists(branch_name)
    issue_number = state.get("issue_number")
    adw_id = state.get("adw_id")
    
    if pr_url:
        logger.info(f"Found existing PR: {pr_url}")
        # Post PR link for easy reference
        if issue_number and adw_id:
            make_issue_comment(
                issue_number,
                f"{adw_id}_ops: ✅ Pull request: {pr_url}"
            )
    else:
        # Create new PR - fetch issue data first
        if issue_number:
            try:
                repo_url = get_repo_url()
                repo_path = extract_repo_path(repo_url)
                from adw_modules.github import fetch_issue
                issue = fetch_issue(issue_number, repo_path)
                
                from adw_modules.workflow_ops import create_pull_request
                pr_url, error = create_pull_request(branch_name, issue, state, logger)
            except Exception as e:
                logger.error(f"Failed to fetch issue for PR creation: {e}")
                pr_url, error = None, str(e)
        else:
            pr_url, error = None, "No issue number in state"
        
        if pr_url:
            logger.info(f"Created PR: {pr_url}")
            # Post new PR link
            if issue_number and adw_id:
                make_issue_comment(
                    issue_number,
                    f"{adw_id}_ops: ✅ Pull request created: {pr_url}"
                )
        else:
            logger.error(f"Failed to create PR: {error}")