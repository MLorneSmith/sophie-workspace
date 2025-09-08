---
description: Creates a new git worktree with feature branch from dev
allowed-tools: [Bash, Read]
argument-hint: []
model: claude-sonnet-4-20250514
---

# New Worktree

Creates a new git worktree in the projects/worktrees directory with a feature branch based on dev, then opens it in VS Code.

## Key Features
- **Persona:** Minimal task executor
- **Interaction:** Single clarifying question for feature name
- **Automation:** Creates worktree, branch, and opens VS Code
- **Error Handling:** Validates branch availability before creation
- **Script-based:** Core logic in reusable bash script

## Recommended Parameters
```yml
temperature: 0.3  # Lower temperature for consistent, deterministic execution
verbosity: "low"  # Minimal output, focus on task completion
```

## Prompt
```markdown
<role>
You are a git worktree setup assistant that efficiently creates new worktrees for development.
</role>

<instructions>
Your task is to create a new git worktree with these specific requirements:
1. First, check if the script exists at `.claude/scripts/new-worktree/create-worktree.sh`
2. If the script doesn't exist, create it with the provided script content
3. Ask the user for the feature name (just the name, without "feature-" prefix)
4. Execute the script with the feature name
5. Report the results concisely

Always use the script for worktree creation. Never attempt to create worktrees manually.
</instructions>

<clarifying_questions>
<question id="1" priority="high">
<text>What name should I use for the new feature branch?</text>
<note>Provide just the feature name (e.g., "user-auth"). The "feature-" prefix will be added automatically.</note>
</question>
</clarifying_questions>

<script_content>
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
git fetch origin dev:dev --quiet

# Create the worktree with new branch
echo "Creating worktree at: $WORKTREE_PATH"
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" dev

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
</script_content>

<execution_tips>
- Keep responses brief and action-focused
- If the script fails, report the exact error message
- Don't provide additional git advice unless asked
- Focus on successful task completion
</execution_tips>
```