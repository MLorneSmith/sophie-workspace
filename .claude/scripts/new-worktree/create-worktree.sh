#!/bin/bash
# Git Worktree Creation Script
# Location: .claude/scripts/new-worktree/create-worktree.sh

set -e

# Configuration
WORKTREE_BASE="$HOME/projects/worktrees"
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"

# Validate we're in a git repository
if [ -z "$MAIN_REPO_PATH" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Get feature name from argument
if [ -z "$1" ]; then
    echo "Error: Feature name required"
    echo "Usage: $0 <feature-name>"
    exit 1
fi

FEATURE_NAME="$1"
BRANCH_NAME="feature-${FEATURE_NAME}"
WORKTREE_PATH="${WORKTREE_BASE}/${BRANCH_NAME}"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo "Error: Branch '${BRANCH_NAME}' already exists"
    echo "Please choose a different feature name or delete the existing branch"
    exit 1
fi

# Create worktree base directory if it doesn't exist
if [ ! -d "$WORKTREE_BASE" ]; then
    echo "Creating worktree base directory: $WORKTREE_BASE"
    mkdir -p "$WORKTREE_BASE"
fi

# Fetch latest changes
echo "Fetching latest changes from origin..."
git fetch origin dev --quiet

# Create the worktree with new branch
echo "Creating worktree at: $WORKTREE_PATH"
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/dev

# Open in VS Code (new window)
echo "Opening worktree in VS Code..."
code -n "$WORKTREE_PATH"

# Success message
echo ""
echo "✅ Successfully created worktree!"
echo "   Branch: $BRANCH_NAME"
echo "   Location: $WORKTREE_PATH"
echo "   Based on: dev"
echo ""
echo "To switch to this worktree in terminal:"
echo "   cd $WORKTREE_PATH"