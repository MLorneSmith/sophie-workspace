#!/usr/bin/env python3
"""
Workspace Git Backup

Commits and pushes all changes in the clawd workspace to GitHub.
Runs daily via Linux cron.

Exit codes:
0 = Success (or nothing to commit)
1 = Error
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

WORKSPACE = Path.home() / "clawd"
LOG_FILE = Path.home() / "clawd" / "logs" / "cron-git-backup.log"


def log(message: str) -> None:
    """Log message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return result."""
    return subprocess.run(
        cmd,
        cwd=WORKSPACE,
        capture_output=True,
        text=True,
        check=check
    )


def main() -> int:
    log("Starting workspace git backup...")
    
    # Step 1: Check if we're in a git repo
    try:
        run(["git", "rev-parse", "--git-dir"])
    except subprocess.CalledProcessError:
        log("ERROR: Not a git repository")
        return 1
    
    # Step 2: Fetch latest (in case there are remote changes)
    try:
        result = run(["git", "fetch", "origin"], check=False)
        if result.returncode != 0:
            log(f"WARNING: git fetch failed: {result.stderr.strip()}")
    except Exception as e:
        log(f"WARNING: git fetch exception: {e}")
    
    # Step 3: Stage all changes
    try:
        run(["git", "add", "-A"])
    except subprocess.CalledProcessError as e:
        log(f"ERROR: git add failed: {e.stderr}")
        return 1
    
    # Step 4: Check if there's anything to commit
    try:
        result = run(["git", "diff", "--cached", "--quiet"], check=False)
        if result.returncode == 0:
            log("No changes to commit")
            return 0
    except Exception as e:
        log(f"WARNING: git diff check failed: {e}")
    
    # Step 5: Commit
    date_str = datetime.now().strftime("%Y-%m-%d")
    commit_msg = f"Daily backup {date_str}"
    
    try:
        run(["git", "commit", "-m", commit_msg])
        log(f"Committed: {commit_msg}")
    except subprocess.CalledProcessError as e:
        log(f"ERROR: git commit failed: {e.stderr}")
        return 1
    
    # Step 6: Push
    try:
        result = run(["git", "push", "origin", "main"], check=False)
        if result.returncode != 0:
            # Try with upstream set
            result = run(["git", "push", "-u", "origin", "main"], check=False)
            if result.returncode != 0:
                log(f"ERROR: git push failed: {result.stderr}")
                return 1
        log("Pushed to origin/main")
    except subprocess.CalledProcessError as e:
        log(f"ERROR: git push failed: {e.stderr}")
        return 1
    
    log("Backup complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
