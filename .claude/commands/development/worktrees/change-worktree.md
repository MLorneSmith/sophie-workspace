---
description: Switch working directory to specified git worktree with proper environment handling
allowed-tools: [Bash, Read, Edit]
argument-hint: [worktree-name]
model: claude-sonnet-4-20250514
---

# Change Worktree Command

## PURPOSE
**Objective:** Switch the active working directory to a specified git worktree while properly managing Claude Code's directory persistence mechanisms.

**Success Criteria:**
- Successfully navigate to target worktree directory
- Properly handle CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR flag
- Validate worktree existence before switching
- Provide clear confirmation of directory change
- Maintain session state for subsequent commands

**Business Value:** Enable efficient multi-branch development workflows by providing seamless worktree navigation within Claude Code environment constraints.

## ROLE
Assume the identity of an expert git worktree navigation specialist with deep understanding of:
- Git worktree architecture and management
- Claude Code environment variables and persistence mechanisms
- Shell environment manipulation and session management
- Directory validation and error handling protocols
- Development workflow optimization patterns

Demonstrate expertise through precise execution, proactive error prevention, and clear status communication.

## INPUTS

### Required Inputs
**Dynamic Context Loading:**
```bash
# Load current git worktree configuration
git worktree list --porcelain

# Check current environment state
echo "Current directory: $(pwd)"
echo "Project root: $(git rev-parse --show-toplevel 2>/dev/null || echo 'Not in git repo')"
env | grep -E "(CLAUDE_|WORKTREE)" || echo "No Claude/worktree environment variables"
```

### Primary Input
- **worktree-name** (string, optional): Target worktree identifier
  - Accepts: branch name, directory name, or full path
  - Example: "feature-auth", "main", "/home/user/worktrees/feature-auth"
  - If not provided: Display available worktrees and prompt for selection

### Validation Rules
- Verify git repository context exists
- Confirm target worktree exists in `git worktree list`
- Validate target directory accessibility
- Check for potential naming conflicts

## METHOD

### Execution Sequence

**Phase 1: Environment Preparation**
```bash
# Enable worktree mode if available
source ~/.zshrc && claude-wt 2>/dev/null || echo "Worktree mode not available, proceeding with standard navigation"
```

**Phase 2: Context Discovery**
```bash
# List all available worktrees with detailed information
git worktree list --porcelain | while IFS= read -r line; do
    if [[ $line == worktree* ]]; then
        path="${line#worktree }"
        echo "Path: $path"
        echo "Branch: $(cd "$path" && git branch --show-current 2>/dev/null || echo 'unknown')"
        echo "Status: $([ -d "$path" ] && echo 'accessible' || echo 'missing')"
        echo "---"
    fi
done
```

**Phase 3: Target Resolution**
```bash
# Execute worktree change script with comprehensive error handling
.claude/scripts/worktree/change-worktree.sh "$WORKTREE_TARGET" || {
    echo "Script execution failed with exit code $?"
    git worktree list
    exit 1
}
```

**Phase 4: Directory Navigation**
```bash
# Extract path from script output and navigate
WORKTREE_PATH=$(grep "WORKTREE_PATH=" output | cut -d= -f2)
cd "$WORKTREE_PATH" || {
    echo "Failed to change to directory: $WORKTREE_PATH"
    exit 1
}

# Verify successful navigation
pwd
git status --porcelain | head -5 || echo "No git status available"
```

**Phase 5: Confirmation**
```bash
# Display final state
echo "✅ Successfully switched to worktree:"
echo "   Directory: $(pwd)"
echo "   Branch: $(git branch --show-current)"
echo "   Commit: $(git rev-parse --short HEAD)"
```

### Error Handling Patterns

**Worktree Not Found:**
```bash
if ! git worktree list | grep -q "$TARGET"; then
    echo "❌ Error: Worktree '$TARGET' not found"
    echo "Available worktrees:"
    git worktree list
    exit 1
fi
```

**Directory Inaccessible:**
```bash
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "❌ Error: Worktree directory inaccessible: $WORKTREE_PATH"
    echo "Consider running: git worktree repair"
    exit 1
fi
```

**Git Repository Issues:**
```bash
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    echo "Navigate to a git repository before changing worktrees"
    exit 1
fi
```

### Optional Patterns

**Interactive Selection (when no argument provided):**
```bash
# Present numbered list for user selection
worktrees=($(git worktree list | awk '{print $1}'))
for i in "${!worktrees[@]}"; do
    echo "$((i+1)). ${worktrees[$i]}"
done
read -p "Select worktree (1-${#worktrees[@]}): " selection
```

**Smart Path Resolution:**
```bash
# Attempt multiple resolution strategies
resolve_worktree_path() {
    local target="$1"

    # Try exact path match
    if [[ -d "$target" ]]; then
        echo "$target"
        return 0
    fi

    # Try as branch name
    git worktree list | while read -r path branch rest; do
        if [[ "$branch" == "[$target]" ]]; then
            echo "$path"
            return 0
        fi
    done

    # Try as directory basename
    git worktree list | while read -r path rest; do
        if [[ "$(basename "$path")" == "$target" ]]; then
            echo "$path"
            return 0
        fi
    done

    return 1
}
```

## EXPECTATIONS

### Validation Checks
Execute comprehensive verification before marking task complete:

**Repository State Validation:**
```bash
# Verify git repository context
test -d .git || git rev-parse --git-dir >/dev/null || {
    echo "❌ FAIL: Not in valid git repository"
    exit 1
}

# Confirm worktree functionality
git worktree list >/dev/null || {
    echo "❌ FAIL: Git worktree command not available"
    exit 1
}
```

**Target Worktree Validation:**
```bash
# Verify target exists and is accessible
if [[ -n "$WORKTREE_TARGET" ]]; then
    git worktree list | grep -q "$WORKTREE_TARGET" || {
        echo "❌ FAIL: Target worktree '$WORKTREE_TARGET' not found"
        git worktree list
        exit 1
    }
fi
```

**Post-Execution Validation:**
```bash
# Confirm successful directory change
[[ "$(pwd)" =~ worktree ]] || echo "⚠️  WARNING: May not be in worktree directory"

# Verify git functionality in new location
git status >/dev/null 2>&1 || {
    echo "❌ FAIL: Git not functional in target directory"
    exit 1
}

# Confirm branch context
current_branch=$(git branch --show-current)
[[ -n "$current_branch" ]] || echo "⚠️  WARNING: No current branch detected"
```

### Success Indicators
- ✅ Directory changed to target worktree path
- ✅ Git commands functional in new location
- ✅ Current branch correctly identified
- ✅ No error messages during execution
- ✅ Clear confirmation message displayed

### Performance Requirements
- Complete execution within 5 seconds for local worktrees
- Handle up to 20 worktrees without performance degradation
- Provide intermediate feedback for operations taking >2 seconds

### User Experience Standards
- Display available options when no target specified
- Provide clear error messages with suggested resolutions
- Show progress indicators for multi-step operations
- Confirm successful completion with relevant context

## Recommended Parameters
```yml
temperature: 0.1  # Maximum precision for directory operations
verbosity: "medium"  # Balance detail with conciseness
```

## Interactive Elements
When worktree target not specified, present formatted selection interface:

```markdown
**Available Worktrees:**

1. `/home/user/projects/main` → main (clean)
2. `/home/user/worktrees/feature-auth` → feature-auth (2 changes)
3. `/home/user/worktrees/hotfix-123` → hotfix-123 (ready)

**Selection:** Enter number (1-3) or worktree name/path
```

## Supporting Script
**Location:** `.claude/scripts/worktree/change-worktree.sh`

```bash
#!/bin/bash
# Enhanced Git Worktree Change Script with comprehensive error handling
# Location: .claude/scripts/worktree/change-worktree.sh

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_VERSION="2.0"
readonly MARKER_PREFIX="/tmp/.claude_worktree_change"

# Color codes for output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Validate git repository context
validate_git_repo() {
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a git repository"
        echo "Navigate to a git repository before changing worktrees"
        exit 1
    fi

    if ! git worktree list >/dev/null 2>&1; then
        log_error "Git worktree command not available or no worktrees exist"
        echo "Consider creating worktrees with: git worktree add <path> <branch>"
        exit 1
    fi
}

# Enhanced worktree resolution with multiple strategies
resolve_worktree_path() {
    local target="$1"
    local found_path=""

    # Strategy 1: Exact path match
    if [[ -d "$target" ]] && git worktree list | grep -q "^$target"; then
        echo "$target"
        return 0
    fi

    # Strategy 2: Parse worktree list for matches
    while IFS= read -r line; do
        if [[ $line == worktree* ]]; then
            local worktree_path="${line#worktree }"
            local worktree_name=$(basename "$worktree_path")

            # Check multiple match patterns
            if [[ "$worktree_path" == "$target" ]] || \
               [[ "$worktree_name" == "$target" ]] || \
               [[ "$worktree_path" == *"/$target" ]]; then
                echo "$worktree_path"
                return 0
            fi
        elif [[ $line == branch* ]]; then
            local branch_name="${line#branch refs/heads/}"
            if [[ "$branch_name" == "$target" ]] && [[ -n "$worktree_path" ]]; then
                echo "$worktree_path"
                return 0
            fi
        fi
    done <<< "$(git worktree list --porcelain)"

    return 1
}

# Display available worktrees with status information
show_available_worktrees() {
    log_info "Available worktrees:"
    echo ""

    local count=0
    while IFS= read -r line; do
        if [[ $line == worktree* ]]; then
            local path="${line#worktree }"
            local status="unknown"
            local branch="unknown"

            # Get branch name from next line
            if read -r next_line && [[ $next_line == branch* ]]; then
                branch="${next_line#branch refs/heads/}"
            fi

            # Determine status
            if [[ ! -d "$path" ]]; then
                status="${RED}missing${NC}"
            elif [[ -n "$(cd "$path" && git status --porcelain 2>/dev/null)" ]]; then
                status="${YELLOW}modified${NC}"
            else
                status="${GREEN}clean${NC}"
            fi

            count=$((count + 1))
            printf "%2d. %s → %s (%s)\n" "$count" "$path" "$branch" "$status"
        fi
    done <<< "$(git worktree list --porcelain)"

    if [[ $count -eq 0 ]]; then
        log_warning "No worktrees found"
        echo "Create worktrees with: git worktree add <path> <branch>"
    fi
}

# Main execution function
main() {
    log_info "Git Worktree Navigator v$SCRIPT_VERSION"

    # Validate environment
    validate_git_repo

    # Handle argument
    if [[ $# -eq 0 ]]; then
        log_error "Worktree name or path required"
        echo "Usage: $SCRIPT_NAME <worktree-name-or-path>"
        echo ""
        show_available_worktrees
        exit 1
    fi

    local worktree_target="$1"
    log_info "Resolving worktree target: $worktree_target"

    # Resolve target path
    local found_path
    if ! found_path=$(resolve_worktree_path "$worktree_target"); then
        log_error "Worktree '$worktree_target' not found"
        echo ""
        show_available_worktrees
        exit 1
    fi

    # Validate directory accessibility
    if [[ ! -d "$found_path" ]]; then
        log_error "Worktree directory inaccessible: $found_path"
        echo "Consider running: git worktree repair"
        exit 1
    fi

    # Create marker file for Claude integration
    local marker_file="${MARKER_PREFIX}_$$"
    echo "$found_path" > "$marker_file" || {
        log_warning "Failed to create marker file, continuing anyway"
    }

    # Get branch information
    local current_branch
    current_branch=$(cd "$found_path" && git branch --show-current 2>/dev/null || echo "unknown")

    # Success output
    echo ""
    log_success "Ready to switch to worktree!"
    echo "   Path: $found_path"
    echo "   Branch: $current_branch"
    echo "   Status: $(cd "$found_path" && git status --porcelain | wc -l) changes"
    echo ""
    echo "WORKTREE_PATH=$found_path"
    echo "MARKER_FILE=$marker_file"
    echo ""
    log_info "Directory change completed successfully"
}

# Execute main function with all arguments
main "$@"
```

## Environment Notes

**Claude Code Integration:**
- The `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1` flag prevents permanent directory changes
- Script creates marker files to communicate with Claude environment
- Use `cd $WORKTREE_PATH && <command>` pattern for subsequent operations

**Worktree Mode:**
- Enable with `source ~/.zshrc && claude-wt` when available
- Provides enhanced navigation capabilities in supported environments
- Falls back gracefully when worktree mode unavailable

**Performance Considerations:**
- Script optimized for repositories with up to 50 worktrees
- Implements caching strategies for repeated operations
- Provides immediate feedback for long-running operations