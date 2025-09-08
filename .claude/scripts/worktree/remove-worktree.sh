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