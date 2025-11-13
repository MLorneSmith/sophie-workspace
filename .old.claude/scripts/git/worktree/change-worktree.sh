#!/bin/bash
# Git Worktree Change Script
# Location: .claude/scripts/worktree/change-worktree.sh

set -e

# Get worktree target from argument
if [ -z "$1" ]; then
    echo "Error: Worktree name or path required"
    echo "Usage: $0 <worktree-name-or-path>"
    exit 1
fi

WORKTREE_TARGET="$1"

# List all worktrees to find the target
WORKTREES=$(git worktree list --porcelain)

# Parse worktrees to find matching path
FOUND_PATH=""
while IFS= read -r line; do
    if [[ $line == worktree* ]]; then
        WORKTREE_PATH="${line#worktree }"
        # Check if target matches the path or the last part of the path
        WORKTREE_NAME=$(basename "$WORKTREE_PATH")
        if [[ "$WORKTREE_PATH" == "$WORKTREE_TARGET" ]] || \
           [[ "$WORKTREE_NAME" == "$WORKTREE_TARGET" ]] || \
           [[ "$WORKTREE_PATH" == *"/$WORKTREE_TARGET" ]]; then
            FOUND_PATH="$WORKTREE_PATH"
            break
        fi
    fi
done <<< "$WORKTREES"

if [ -z "$FOUND_PATH" ]; then
    echo "Error: Worktree '$WORKTREE_TARGET' not found"
    echo ""
    echo "Available worktrees:"
    git worktree list
    exit 1
fi

# Check if directory exists
if [ ! -d "$FOUND_PATH" ]; then
    echo "Error: Worktree directory does not exist: $FOUND_PATH"
    exit 1
fi

# Store the worktree path for Claude to reference
echo "$FOUND_PATH" > /tmp/.claude_current_worktree

# Export the path for Claude to use
echo ""
echo "✅ Worktree located successfully!"
echo "   Path: $FOUND_PATH"
echo "   Branch: $(cd "$FOUND_PATH" && git branch --show-current)"
echo ""
echo "WORKTREE_PATH=$FOUND_PATH"