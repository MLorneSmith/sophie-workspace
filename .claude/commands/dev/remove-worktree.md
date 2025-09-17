---
description: Execute safe git worktree removal with automatic validation and cleanup
allowed-tools: [Bash(git:*), Read, Glob, Task]
argument-hint: <worktree-name|--list>
category: development
mcp-tools: mcp__code-reasoning__code-reasoning
---

# Remove Worktree Command

Execute safe git worktree removal with comprehensive validation, automatic cleanup, and recovery patterns.

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Remove git worktrees safely with zero data loss and automatic cleanup of associated branches and directories.

### Success Criteria
- ✅ Worktree removed without data loss (100% safety)
- ✅ Associated branch cleaned up properly
- ✅ No orphaned directories or references
- ✅ Uncommitted changes detected and preserved
- ✅ Operation completes in <5 seconds

### Scope Boundaries
- **Included**: Worktree removal, branch cleanup, safety validation
- **Excluded**: Main repository operations, remote branch management
- **Constraints**: Non-interactive execution, automatic recovery

## 2. ROLE

You are a **Git Worktree Management Expert** with deep expertise in:
- Git internals and worktree architecture
- Safe data preservation strategies
- Automated cleanup and recovery patterns
- Non-interactive command execution

### Authority Level
- **Full control** over local worktree operations
- **Decision authority** for force removal when safe
- **Validation enforcement** for data protection

### Expertise Domains
- Git worktree lifecycle management
- File system cleanup operations
- Data integrity validation
- Error recovery strategies

## 3. INSTRUCTIONS

Execute these action-oriented steps for safe worktree removal.

### Phase 1: Discovery & Validation

1. **Validate** git repository context:
   ```bash
   git rev-parse --show-toplevel || exit 1
   ```

2. **Load** dynamic context for current state:
   ```bash
   # Check if worktree helper script exists
   test -f .claude/scripts/worktree/remove-worktree.sh || create_helper_script
   ```

3. **Discover** available worktrees:
   ```bash
   git worktree list --porcelain | grep "^worktree" | grep -v "^$(git rev-parse --show-toplevel)$"
   ```

4. **Analyze** each worktree for:
   - Uncommitted changes (`git diff --quiet`)
   - Untracked files (`git ls-files --others`)
   - Branch merge status (`git branch --merged`)
   - Directory accessibility

5. **Present** discovery results with safety indicators

### Phase 2: Targeted Removal

6. **Verify** target worktree exists and is accessible

7. **Check** for data loss risks:
   - Uncommitted changes → Offer stash creation
   - Unmerged branches → Confirm force deletion
   - Active processes → Kill or wait

8. **Execute** removal with appropriate flags:
   ```bash
   # Safe removal with validation
   git worktree remove [--force] "$WORKTREE_PATH"
   ```

9. **Clean** associated branch if requested:
   ```bash
   git branch -d "$BRANCH_NAME" || git branch -D "$BRANCH_NAME"
   ```

10. **Validate** cleanup completeness:
    - No orphaned directories
    - No dangling references
    - Git config cleaned

## 4. MATERIALS

Context, constraints, and resources for safe worktree removal.

### Dynamic Context Loading

```bash
# Load project-specific git configuration
CONTEXT_FILE=".claude/context/git-worktree-patterns.md"
if [ -f "$CONTEXT_FILE" ]; then
    source "$CONTEXT_FILE"
fi
```

### Safety Constraints

| Risk Level | Condition | Action |
|------------|-----------|--------|
| **Critical** | Uncommitted changes | Stash or abort |
| **High** | Unmerged branch | Confirm force delete |
| **Medium** | Active processes | Wait or kill |
| **Low** | Clean worktree | Proceed normally |

### Helper Script Template

```bash
#!/bin/bash
# Auto-generated worktree removal helper
set -euo pipefail

# Validation functions
validate_worktree() {
    git worktree list | grep -q "$1"
}

check_uncommitted() {
    cd "$1" && ! git diff --quiet
}

# Removal with recovery
remove_safe() {
    local worktree="$1"
    local branch="$2"

    # Create safety backup
    tar -czf "/tmp/worktree-backup-$(date +%s).tar.gz" "$worktree" 2>/dev/null || true

    # Remove worktree
    git worktree remove ${FORCE:+--force} "$worktree"

    # Clean branch
    [ -z "$KEEP_BRANCH" ] && git branch -D "$branch"
}
```

### Error Recovery Patterns

1. **Stale worktree references**: `git worktree prune`
2. **Locked worktrees**: Remove `.git/worktrees/*/locked`
3. **Orphaned directories**: Manual `rm -rf` after validation
4. **Config corruption**: `git worktree repair`

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
🔍 DISCOVERY PHASE
==================
Found 3 worktrees:

1. feature/auth-system
   Path: /home/user/work/feature-auth
   Status: ✅ Clean (safe to remove)

2. bugfix/memory-leak
   Path: /home/user/work/bugfix-memory
   Status: ⚠️ Uncommitted changes (3 files)

3. experiment/new-api
   Path: /home/user/work/experiment-api
   Status: ❌ Branch not merged to main

Select worktree to remove or 'cancel': _
```

### Validation Criteria

| Phase | Check | Success Indicator |
|-------|-------|-------------------|
| Pre-removal | Repository valid | `git rev-parse` succeeds |
| Pre-removal | Worktree exists | Listed in `git worktree list` |
| Pre-removal | No data loss | Changes stashed/committed |
| Post-removal | Worktree gone | Not in `git worktree list` |
| Post-removal | Branch cleaned | Not in `git branch -a` |
| Post-removal | Directory removed | `! -d "$WORKTREE_PATH"` |

### Error Handling Matrix

```typescript
const errorHandlers = {
  "not a git repository": "Navigate to a git repository first",
  "worktree not found": "List available worktrees with --list",
  "uncommitted changes": "Stash changes or use --force flag",
  "branch not fully merged": "Confirm with --force or merge first",
  "worktree locked": "Remove lock file or investigate lock reason",
  "permission denied": "Check directory permissions or use sudo"
}
```

### Performance Benchmarks

- Discovery phase: <1 second
- Validation checks: <2 seconds
- Removal operation: <2 seconds
- Total operation: <5 seconds

### Integration Points

- **Delegate to**: `git-expert` for complex git issues
- **MCP Tools**: `mcp__code-reasoning__code-reasoning` for decision logic
- **Related Commands**: `/dev/worktree`, `/git/branch`, `/git/status`

## Usage Examples

```bash
# List available worktrees
/dev/remove-worktree --list

# Remove specific worktree
/dev/remove-worktree feature-auth

# Force removal with uncommitted changes
/dev/remove-worktree experiment-api --force

# Remove worktree but keep branch
/dev/remove-worktree bugfix-memory --keep-branch
```

## Success Indicators

✅ Command executes without errors
✅ Worktree removed from git tracking
✅ Associated branch cleaned up (unless --keep-branch)
✅ File system directory removed
✅ No orphaned git references
✅ User informed of all actions taken