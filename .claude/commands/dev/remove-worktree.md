---
description: Removes an existing git worktree and its associated branch
allowed-tools: [Bash, Read]
argument-hint: [<worktree-name>]
---

# Remove Worktree

Safely removes a git worktree and its associated feature branch using a two-phase approach optimized for Claude's non-interactive bash execution.

## Key Features
- **Two-phase approach:** Discovery first, then confirmed removal
- **Self-healing:** Automatically fixes line ending issues
- **Discovery mode:** Lists available worktrees for user selection
- **Non-interactive removal:** Executes removal with specific worktree name
- **Safety checks:** Validates uncommitted changes before removal
- **Flexible options:** Force mode, keep branch, auto-confirm
- **Error resilient:** Handles various edge cases gracefully

## Command Line Options
- `--list`: Discovery mode - list available worktrees only
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
You are a git worktree cleanup assistant that safely removes worktrees and their branches using a two-phase discovery and removal approach.
</role>

<instructions>
Your task is to remove an existing git worktree using a two-phase approach optimized for Claude's non-interactive environment:

**PHASE 1: Discovery**
1. First, ensure the script at `.claude/scripts/worktree/remove-worktree.sh` exists and has proper line endings
2. Run the script with `--list` flag to discover available worktrees
3. Present the available options to the user in your response (not in bash)
4. Ask the user to confirm which worktree they want to remove

**PHASE 2: Removal** (only after user confirmation)
5. Execute the script with specific flags based on user's choice:
   - Use `-n <worktree-name> -y` for non-interactive removal
   - Add `-f` if user mentions forcing or has uncommitted changes
   - Add `-k` if user wants to keep the branch
6. Handle any errors that occur during execution
7. After successful removal, return to main mode: source ~/.zshrc && claude-main
8. Report the results concisely

**Key Rules:**
- NEVER use interactive mode (no `read` commands)
- ALWAYS get user confirmation through Claude chat, not bash prompts
- Use the `--list` flag for discovery phase
- Use `-n <name> -y` for confirmed removal
- The script automatically handles line ending issues

Always use the script for worktree removal. Never attempt to remove worktrees manually.
</instructions>

<script_content>
#!/bin/bash
# Git Worktree Removal Script
# Location: .claude/scripts/worktree/remove-worktree.sh

set -e

# Self-heal line endings if needed
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if file has CRLF line endings
    if file "$0" 2>/dev/null | grep -q "CRLF" || od -c "$0" 2>/dev/null | head -1 | grep -q '\\r'; then
        echo "Fixing line endings in script..."
        TEMP_FILE=$(mktemp)
        tr -d '\r' < "$0" > "$TEMP_FILE"
        cat "$TEMP_FILE" > "$0"
        rm "$TEMP_FILE"
        echo "Line endings fixed. Re-executing..."
        exec "$0" "$@"
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
FORCE_MODE=false
NON_INTERACTIVE=false
TARGET_WORKTREE=""
SKIP_BRANCH_DELETE=false
LIST_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --list)
            LIST_ONLY=true
            shift
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        -y|--yes)
            NON_INTERACTIVE=true
            shift
            ;;
        -n|--name)
            TARGET_WORKTREE="$2"
            shift 2
            ;;
        -k|--keep-branch)
            SKIP_BRANCH_DELETE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --list              List available worktrees only (discovery mode)"
            echo "  -f, --force         Force removal even with uncommitted changes"
            echo "  -y, --yes          Non-interactive mode (auto-confirm)"
            echo "  -n, --name NAME    Specify worktree name/path to remove"
            echo "  -k, --keep-branch  Keep the branch after removing worktree"
            echo "  -h, --help         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --list                             # Discovery mode - list worktrees"
            echo "  $0 -n feature-ccpm -y                 # Remove specific worktree"
            echo "  $0 -n feature-ccpm -y -f              # Force remove with uncommitted changes"
            echo "  $0 -n feature-ccpm -y -k              # Remove worktree but keep branch"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get main repository path
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"

# Validate we're in a git repository
if [ -z "$MAIN_REPO_PATH" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Get list of worktrees (excluding main)
WORKTREES=$(git worktree list --porcelain | grep "^worktree" | sed 's/^worktree //' | grep -v "^$MAIN_REPO_PATH$" || true)

if [ -z "$WORKTREES" ]; then
    echo -e "${YELLOW}No worktrees found to remove.${NC}"
    echo "Only the main repository exists at: $MAIN_REPO_PATH"
    exit 0
fi

# Convert to array
IFS=$'\n'
WORKTREE_ARRAY=($WORKTREES)

# Handle list-only mode (discovery phase)
if [ "$LIST_ONLY" = true ]; then
    echo "Available worktrees:"
    echo "===================="
    for i in "${!WORKTREE_ARRAY[@]}"; do
        WORKTREE_PATH="${WORKTREE_ARRAY[$i]}"
        # Extract branch name from worktree path
        BRANCH_NAME=$(git worktree list --porcelain | grep -A 2 "^worktree $WORKTREE_PATH" | grep "^branch" | sed 's/^branch refs\/heads\///')
        echo "$((i+1)). $WORKTREE_PATH"
        echo "   Branch: $BRANCH_NAME"
        
        # Check for uncommitted changes
        if [ -d "$WORKTREE_PATH" ]; then
            cd "$WORKTREE_PATH"
            if ! git diff --quiet || ! git diff --staged --quiet; then
                echo -e "   ${YELLOW}⚠ Has uncommitted changes${NC}"
            fi
            cd "$MAIN_REPO_PATH"
        fi
    done
    exit 0
fi

# Handle target worktree if specified
if [ -n "$TARGET_WORKTREE" ]; then
    WORKTREE_PATH=""
    
    # Try to find matching worktree
    for wt in "${WORKTREE_ARRAY[@]}"; do
        if [[ "$wt" == *"$TARGET_WORKTREE"* ]] || [[ "$wt" == "$TARGET_WORKTREE" ]]; then
            WORKTREE_PATH="$wt"
            break
        fi
    done
    
    if [ -z "$WORKTREE_PATH" ]; then
        echo -e "${RED}Error: Worktree '$TARGET_WORKTREE' not found${NC}"
        echo ""
        echo "Available worktrees:"
        for wt in "${WORKTREE_ARRAY[@]}"; do
            echo "  - $wt"
        done
        exit 1
    fi
    
    BRANCH_NAME=$(git worktree list --porcelain | grep -A 2 "^worktree $WORKTREE_PATH" | grep "^branch" | sed 's/^branch refs\/heads\///')
    
else
    echo -e "${RED}Error: No worktree specified for removal${NC}"
    echo "Use --list to see available worktrees, then specify with -n option"
    exit 1
fi

echo ""
echo "Selected worktree: $WORKTREE_PATH"
echo "Associated branch: $BRANCH_NAME"

# Check for uncommitted changes if worktree still exists
if [ -d "$WORKTREE_PATH" ] && [ "$FORCE_MODE" = false ]; then
    cd "$WORKTREE_PATH"
    if ! git diff --quiet || ! git diff --staged --quiet; then
        echo ""
        echo -e "${YELLOW}Warning: Uncommitted changes detected in worktree!${NC}"
        git status --short
        echo ""
        
        if [ "$NON_INTERACTIVE" = true ]; then
            echo -e "${RED}Cannot proceed in non-interactive mode with uncommitted changes.${NC}"
            echo "Use --force to override this check."
            exit 1
        fi
    fi
    cd "$MAIN_REPO_PATH"
fi

# Remove the worktree
echo ""
echo "Removing worktree..."
if [ "$FORCE_MODE" = true ]; then
    git worktree remove --force "$WORKTREE_PATH"
    echo -e "${GREEN}✓ Worktree force removed${NC}"
else
    if git worktree remove "$WORKTREE_PATH" 2>/dev/null; then
        echo -e "${GREEN}✓ Worktree removed successfully${NC}"
    else
        # Try force removal if normal removal fails
        echo -e "${YELLOW}Normal removal failed, attempting force removal...${NC}"
        git worktree remove --force "$WORKTREE_PATH"
        echo -e "${GREEN}✓ Worktree force removed${NC}"
    fi
fi

# Delete the branch (unless skipped)
if [ "$SKIP_BRANCH_DELETE" = false ]; then
    echo "Deleting branch: $BRANCH_NAME"
    if [ "$FORCE_MODE" = true ]; then
        git branch -D "$BRANCH_NAME"
        echo -e "${GREEN}✓ Branch force deleted${NC}"
    else
        if git branch -d "$BRANCH_NAME" 2>/dev/null; then
            echo -e "${GREEN}✓ Branch deleted successfully${NC}"
        else
            # Force delete if normal delete fails (e.g., unmerged changes)
            echo -e "${YELLOW}Branch has unmerged changes. Force deleting...${NC}"
            git branch -D "$BRANCH_NAME"
            echo -e "${GREEN}✓ Branch force deleted${NC}"
        fi
    fi
fi

# Success message
echo ""
echo -e "${GREEN}✅ Successfully removed worktree!${NC}"
echo "   Removed worktree: $WORKTREE_PATH"
if [ "$SKIP_BRANCH_DELETE" = false ]; then
    echo "   Deleted branch: $BRANCH_NAME"
else
    echo "   Branch kept: $BRANCH_NAME"
fi
</script_content>

<execution_tips>
**Two-Phase Execution:**

**Phase 1 - Discovery:**
- Run: `bash .claude/scripts/worktree/remove-worktree.sh --list`
- Present results to user in your response
- Ask user to confirm which worktree to remove

**Phase 2 - Removal:** 
- Only execute after user confirmation
- Use: `bash .claude/scripts/worktree/remove-worktree.sh -n <worktree-name> -y`
- Add `-f` for force mode if needed
- Add `-k` to keep branch if requested
- After successful removal, run: `source ~/.zshrc && claude-main`

**Key Points:**
- Keep responses brief and action-focused
- Handle all user interaction through Claude chat, not bash prompts
- Always use the `--list` flag first for discovery
- Never use interactive mode with `read` commands
- After removal, return to main mode with `claude-main`
- If the script fails, report the exact error message
</execution_tips>
```