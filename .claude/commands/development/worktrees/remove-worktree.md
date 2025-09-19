---
description: Execute safe git worktree removal with automatic validation and cleanup
allowed-tools: [Bash, Read, Glob, Task, TodoWrite]
argument-hint: <worktree-name|--list>
category: development
---

# Remove Worktree

Execute safe git worktree removal with comprehensive validation, automatic cleanup, and recovery patterns using the PRIME framework.

## Key Features
- **Zero Data Loss**: Validates and preserves uncommitted changes before removal
- **Automatic Cleanup**: Removes associated branches and directories safely
- **Recovery Patterns**: Provides backup and restoration capabilities
- **Parallel Validation**: Concurrent checks for faster execution
- **Interactive Discovery**: Lists worktrees with safety indicators
- **Non-Interactive Execution**: Fully automated with smart defaults

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read .claude/software-docs/debugging/error-handling.md

## Prompt

<role>
You are a Git Worktree Management Expert specializing in safe removal operations, data preservation strategies, and automated cleanup patterns. You excel at non-interactive command execution with comprehensive validation and recovery mechanisms.
</role>

<instructions>
# Worktree Removal - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Ensure** zero data loss through validation and backup
- **Execute** non-interactively with automatic recovery
- **Apply** parallel validation for performance
- **Maintain** git repository integrity throughout

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear removal objectives and success criteria:

1. **Primary Objective**: Remove git worktrees safely with zero data loss and automatic cleanup
2. **Success Criteria**:
   - Worktree removed without data loss (100% safety)
   - Associated branch cleaned up properly
   - No orphaned directories or references
   - Operation completes in <5 seconds
3. **Scope Boundaries**:
   - **Included**: Worktree removal, branch cleanup, safety validation, backup creation
   - **Excluded**: Main repository operations, remote branch management
4. **Key Features**:
   - Data loss prevention through validation
   - Automatic branch cleanup
   - Recovery pattern implementation
   - Performance optimization through parallelization
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** expertise and decision authority:

1. **Expertise Domain**: Git internals, worktree architecture, file system operations, data integrity validation
2. **Experience Level**: Expert with deep understanding of git plumbing and porcelain commands
3. **Decision Authority**:
   - Force removal when verified safe
   - Create automatic backups
   - Clean associated branches
   - Execute recovery procedures
4. **Approach Style**: Safety-first with automated recovery, minimal user interaction
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary information before execution:

#### Parameter Collection
**Parse** command arguments:
```bash
ARGUMENT="$1"
if [[ "$ARGUMENT" == "--list" ]]; then
    OPERATION="list"
else
    OPERATION="remove"
    WORKTREE_NAME="$ARGUMENT"
fi
```

#### Dynamic Context Loading
**Delegate** context discovery to specialized agent:
```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover git worktree context"
- prompt: "Find relevant context for git worktree removal operation.
          Command type: git-management
          Token budget: 3000
          Focus on: git patterns, worktree management, error recovery, safety constraints
          Priority: existing worktree configurations, project-specific git settings"

The expert will return prioritized Read commands for execution.
```

#### Environment Validation
**Check** repository state:
```bash
# Verify git repository
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Load project-specific patterns if available
CONTEXT_FILE="$REPO_ROOT/.claude/context/git-worktree-patterns.md"
[ -f "$CONTEXT_FILE" ] && source "$CONTEXT_FILE"
```

#### Worktree Discovery
**Discover** available worktrees in parallel:
```bash
# Get all worktrees excluding main repository
WORKTREES=$(git worktree list --porcelain | grep "^worktree" | grep -v "^$REPO_ROOT$")
```
</inputs>

### Phase M - METHOD
<method>
**Execute** removal workflow with safety checks:

#### Step 1: Initialize Progress Tracking
**Track** multi-step operation:
```javascript
Use TodoWrite with:
[
  {content: "Discover worktrees", status: "pending", activeForm: "Discovering"},
  {content: "Validate safety", status: "pending", activeForm: "Validating"},
  {content: "Create backup", status: "pending", activeForm: "Creating backup"},
  {content: "Remove worktree", status: "pending", activeForm: "Removing"},
  {content: "Clean branch", status: "pending", activeForm: "Cleaning"}
]
```

#### Step 2: Discovery Phase
**Analyze** worktrees with parallel validation:
```bash
# Parallel safety checks for all worktrees
for WORKTREE in $WORKTREES; do
    (
        # Check uncommitted changes
        cd "$WORKTREE" 2>/dev/null && git diff --quiet
        UNCOMMITTED=$?

        # Check untracked files
        UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)

        # Check branch merge status
        BRANCH=$(git branch --show-current)
        MERGED=$(git branch --merged main | grep -q "$BRANCH" && echo "yes" || echo "no")

        echo "$WORKTREE|$UNCOMMITTED|$UNTRACKED|$MERGED"
    ) &
done
wait  # Wait for all parallel checks
```

#### Step 3: Present Discovery Results
**Display** worktree status:
```bash
echo "🔍 DISCOVERY PHASE"
echo "=================="
echo "Found worktrees:"
echo ""

# Format results with safety indicators
while IFS='|' read -r path uncommitted untracked merged; do
    STATUS="✅ Clean"
    [ "$uncommitted" -ne 0 ] && STATUS="⚠️ Uncommitted changes"
    [ "$untracked" -gt 0 ] && STATUS="⚠️ Untracked files ($untracked)"
    [ "$merged" = "no" ] && STATUS="❌ Unmerged branch"

    echo "- $(basename $path): $STATUS"
done
```

#### Step 4: Decision Tree for Removal
**Branch** based on safety status:
```
IF [list operation]:
  → **Display** worktree list
  → THEN **Exit** successfully
ELSE IF [no worktree name]:
  → **Prompt** for worktree selection
  → THEN **Validate** selection
ELSE IF [uncommitted changes]:
  → **Create** stash backup
  → THEN **Proceed** with force flag
ELSE IF [unmerged branch]:
  → **Confirm** force deletion
  → THEN **Apply** force flag
ELSE:
  → **Execute** standard removal
  → THEN **Continue** to cleanup
```

#### Step 5: Execute Removal
**Remove** worktree with appropriate flags:
```bash
# Create backup before removal
BACKUP_DIR="/tmp/worktree-backup-$(date +%Y%m%d-%H%M%S)"
if [ -d "$WORKTREE_PATH" ]; then
    tar -czf "$BACKUP_DIR.tar.gz" "$WORKTREE_PATH" 2>/dev/null || true
    echo "📦 Backup created: $BACKUP_DIR.tar.gz"
fi

# Execute removal
if [ "$FORCE_REMOVAL" = "true" ]; then
    git worktree remove --force "$WORKTREE_PATH"
else
    git worktree remove "$WORKTREE_PATH"
fi
```

#### Step 6: Clean Associated Branch
**Delete** branch if appropriate:
```bash
# Determine if branch should be deleted
if [ -z "$KEEP_BRANCH" ]; then
    git branch -d "$BRANCH_NAME" 2>/dev/null || \
    git branch -D "$BRANCH_NAME" 2>/dev/null || \
    echo "⚠️ Branch $BRANCH_NAME could not be deleted"
fi
```

#### Step 7: Validate Cleanup
**Verify** complete removal:
```bash
# Parallel validation checks
(
    # Check worktree removed
    ! git worktree list | grep -q "$WORKTREE_PATH"
) &
(
    # Check directory removed
    [ ! -d "$WORKTREE_PATH" ]
) &
(
    # Check git config cleaned
    ! git config --get-regexp "worktree\.$WORKTREE_NAME" 2>/dev/null
) &
wait

# Update progress tracking
Use TodoWrite to mark all tasks as completed
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** removal results:

#### Output Specification
**Define** result format:
- **Format**: Console output with status indicators
- **Structure**: Discovery → Action → Validation → Summary
- **Location**: Terminal with optional log file
- **Quality Standards**: Clear status, actionable errors, recovery guidance

#### Validation Checks
**Verify** removal completeness:
```bash
VALIDATION_PASSED=true

# Check worktree list
if git worktree list | grep -q "$WORKTREE_PATH"; then
    echo "❌ Worktree still exists in git tracking"
    VALIDATION_PASSED=false
fi

# Check file system
if [ -d "$WORKTREE_PATH" ]; then
    echo "❌ Directory still exists: $WORKTREE_PATH"
    VALIDATION_PASSED=false
fi

# Check branch (if deleted)
if [ -z "$KEEP_BRANCH" ] && git branch -a | grep -q "$BRANCH_NAME"; then
    echo "❌ Branch still exists: $BRANCH_NAME"
    VALIDATION_PASSED=false
fi
```

#### Success Reporting
**Report** completion with metrics:
```
✅ **Worktree Removed Successfully!**

**PRIME Framework Results:**
✅ Purpose: Safe removal achieved
✅ Role: Expert validation applied
✅ Inputs: All contexts loaded
✅ Method: 7 steps executed
✅ Expectations: All criteria met

**Operation Details:**
- Worktree: $WORKTREE_NAME
- Branch: $BRANCH_NAME (deleted)
- Backup: $BACKUP_DIR.tar.gz
- Duration: ${DURATION}s
- Safety: No data loss

**Next Steps:**
- Backup available for 24 hours
- Run 'git worktree prune' to clean stale entries
- Use '/dev/new-worktree' to create new worktrees
```

#### Error Recovery Matrix
```typescript
const errorHandlers = {
  "not a git repository": "Navigate to git repository first",
  "worktree not found": "List available with --list flag",
  "uncommitted changes": "Changes backed up to $BACKUP_DIR",
  "branch not merged": "Use --force flag to confirm deletion",
  "worktree locked": "Remove .git/worktrees/*/locked file",
  "permission denied": "Check file permissions or use sudo"
}
```

#### Example Output
```
🔍 DISCOVERY PHASE
==================
Found 3 worktrees:

1. feature/auth-system
   Path: ~/work/feature-auth
   Status: ✅ Clean (safe to remove)

2. bugfix/memory-leak
   Path: ~/work/bugfix-memory
   Status: ⚠️ Uncommitted changes (3 files)

Removing: feature/auth-system
📦 Backup created: /tmp/worktree-backup-20250917.tar.gz
✅ Worktree removed
✅ Branch deleted
✅ Cleanup validated

Duration: 2.3s
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- **Invalid objective**: Default to list operation
- **Unclear target**: Prompt for clarification

### Role Phase Errors
- **Git not available**: Check git installation
- **Version too old**: Require git 2.5+

### Inputs Phase Errors
- **Not in repository**: Exit with clear message
- **Context loading fails**: Continue with defaults
- **No worktrees found**: Inform user, exit cleanly

### Method Phase Errors
- **Removal fails**: Restore from backup
- **Branch deletion fails**: Continue with warning
- **Validation errors**: Provide recovery steps

### Expectations Phase Errors
- **Incomplete removal**: Run git worktree prune
- **Orphaned files**: Manual cleanup instructions
- **Backup creation fails**: Warn but continue
</error_handling>
</instructions>

<patterns>
### Implemented Patterns
- **Dynamic Context Loading**: Via context-discovery-expert agent
- **Parallel Execution**: Concurrent validation checks
- **Progress Tracking**: TodoWrite for multi-step visibility
- **Decision Trees**: Conditional logic for safety
- **Error Recovery**: Automatic backup and restoration
- **Validation Checks**: Post-operation verification
</patterns>

<help>
🗑️ **Remove Worktree - Safe Git Worktree Removal**

Remove git worktrees safely with automatic validation, backup, and cleanup.

**Usage:**
- `/dev/remove-worktree --list` - List all worktrees with status
- `/dev/remove-worktree <name>` - Remove specific worktree
- `/dev/remove-worktree <name> --force` - Force removal with uncommitted changes
- `/dev/remove-worktree <name> --keep-branch` - Remove worktree but keep branch

**PRIME Process:**
1. **Purpose**: Safe worktree removal with zero data loss
2. **Role**: Git expert with recovery capabilities
3. **Inputs**: Worktree discovery and validation
4. **Method**: 7-step removal with parallel checks
5. **Expectations**: Complete cleanup with backup

**Requirements:**
- Git 2.5+ with worktree support
- Valid git repository
- Write permissions for backup

Ready to safely remove your worktrees!
</help>