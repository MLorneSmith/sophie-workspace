---
description: Removes an existing git worktree and its associated branch
allowed-tools: [Bash, Read]
argument-hint: [<worktree-name>]
---

# Remove Worktree

Safely removes a git worktree and its associated feature branch with multiple modes of operation.

## Key Features
- **Self-healing:** Automatically fixes line ending issues
- **Interactive mode:** Select from list when no arguments provided
- **Non-interactive mode:** Specify worktree name via command line
- **Safety checks:** Validates uncommitted changes before removal
- **Flexible options:** Force mode, keep branch, auto-confirm
- **Error resilient:** Handles various edge cases gracefully

## Command Line Options
- `-n, --name NAME`: Specify worktree to remove
- `-y, --yes`: Non-interactive mode (auto-confirm)
- `-f, --force`: Force removal even with uncommitted changes
- `-k, --keep-branch`: Keep branch after removing worktree
- `-h, --help`: Show help message

## Recommended Parameters
```yml
temperature: 0.3  # Lower temperature for consistent, deterministic execution
verbosity: "low"  # Minimal output, focus on task completion
```

## Prompt
```markdown
<role>
You are a git worktree cleanup assistant that safely removes worktrees and their branches.
</role>

<instructions>
Your task is to remove an existing git worktree with these specific steps:

1. First, ensure the script at `.claude/scripts/worktree/remove-worktree.sh` exists and has proper line endings
2. Check if the user provided a worktree name in their message
3. Execute the script with appropriate flags:
   - If user specified a worktree name: use `-n <name> -y` for non-interactive removal
   - If no name specified: run interactively
   - Add `-f` if user mentions forcing or has uncommitted changes
   - Add `-k` if user wants to keep the branch
4. Handle any errors that occur during execution
5. Report the results concisely

The script automatically handles line ending issues, so no manual conversion is needed.

Always use the script for worktree removal. Never attempt to remove worktrees manually.
</instructions>

<script_content>
#!/bin/bash
# Git Worktree Removal Script
# Location: .claude/scripts/worktree/remove-worktree.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get main repository path
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"

# Validate we're in a git repository
if [ -z "$MAIN_REPO_PATH" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Get list of worktrees (excluding main)
echo "Fetching worktree list..."
WORKTREES=$(git worktree list --porcelain | grep "^worktree" | sed 's/^worktree //' | grep -v "^$MAIN_REPO_PATH$" || true)

if [ -z "$WORKTREES" ]; then
    echo -e "${YELLOW}No worktrees found to remove.${NC}"
    echo "Only the main repository exists at: $MAIN_REPO_PATH"
    exit 0
fi

# Display worktrees with numbers
echo ""
echo "Available worktrees:"
echo "===================="
IFS=$'\n'
WORKTREE_ARRAY=($WORKTREES)
for i in "${!WORKTREE_ARRAY[@]}"; do
    WORKTREE_PATH="${WORKTREE_ARRAY[$i]}"
    # Extract branch name from worktree path
    BRANCH_NAME=$(git worktree list --porcelain | grep -A 2 "^worktree $WORKTREE_PATH" | grep "^branch" | sed 's/^branch refs\/heads\///')
    echo "$((i+1)). $WORKTREE_PATH"
    echo "   Branch: $BRANCH_NAME"
done

# Get user selection
echo ""
read -p "Select worktree to remove (1-${#WORKTREE_ARRAY[@]}) or 'q' to quit: " selection

# Handle quit
if [ "$selection" = "q" ] || [ "$selection" = "Q" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#WORKTREE_ARRAY[@]}" ]; then
    echo -e "${RED}Invalid selection.${NC}"
    exit 1
fi

# Get selected worktree and branch
SELECTED_INDEX=$((selection - 1))
WORKTREE_PATH="${WORKTREE_ARRAY[$SELECTED_INDEX]}"
BRANCH_NAME=$(git worktree list --porcelain | grep -A 2 "^worktree $WORKTREE_PATH" | grep "^branch" | sed 's/^branch refs\/heads\///')

echo ""
echo "Selected worktree: $WORKTREE_PATH"
echo "Associated branch: $BRANCH_NAME"

# Check for uncommitted changes if worktree still exists
if [ -d "$WORKTREE_PATH" ]; then
    cd "$WORKTREE_PATH"
    if ! git diff --quiet || ! git diff --staged --quiet; then
        echo ""
        echo -e "${YELLOW}Warning: Uncommitted changes detected in worktree!${NC}"
        git status --short
        echo ""
        read -p "Do you want to proceed anyway? (y/N): " proceed
        if [ "$proceed" != "y" ] && [ "$proceed" != "Y" ]; then
            echo "Operation cancelled."
            exit 0
        fi
    fi
    cd "$MAIN_REPO_PATH"
fi

# Final confirmation
echo ""
echo -e "${YELLOW}This will permanently delete:${NC}"
echo "  - Worktree at: $WORKTREE_PATH"
echo "  - Branch: $BRANCH_NAME"
echo ""
read -p "Are you sure you want to continue? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Remove the worktree
echo ""
echo "Removing worktree..."
if git worktree remove "$WORKTREE_PATH" 2>/dev/null; then
    echo -e "${GREEN}✓ Worktree removed successfully${NC}"
else
    # Force removal if normal removal fails
    echo -e "${YELLOW}Normal removal failed, attempting force removal...${NC}"
    git worktree remove --force "$WORKTREE_PATH"
    echo -e "${GREEN}✓ Worktree force removed${NC}"
fi

# Delete the branch
echo "Deleting branch: $BRANCH_NAME"
if git branch -d "$BRANCH_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ Branch deleted successfully${NC}"
else
    # Force delete if normal delete fails (e.g., unmerged changes)
    echo -e "${YELLOW}Branch has unmerged changes. Force deleting...${NC}"
    git branch -D "$BRANCH_NAME"
    echo -e "${GREEN}✓ Branch force deleted${NC}"
fi

# Success message
echo ""
echo -e "${GREEN}✅ Successfully removed worktree and branch!${NC}"
echo "   Removed worktree: $WORKTREE_PATH"
echo "   Deleted branch: $BRANCH_NAME"
</script_content>

<execution_tips>
- Keep responses brief and action-focused
- Let the script handle all user interaction
- If the script fails, report the exact error message
- Focus on successful task completion
</execution_tips>
```