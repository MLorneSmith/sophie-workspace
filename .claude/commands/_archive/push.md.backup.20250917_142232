---
description: Execute intelligent git push with comprehensive safety validation and automatic conflict resolution
category: workflow
allowed-tools: Bash(git:*), Task, Read, Glob
argument-hint: [--force|--tags|--all]
mcp-tools: mcp__code-reasoning__code-reasoning
---

# Git Push Command

Execute intelligent git push operations with comprehensive safety checks, automatic branch management, and conflict resolution strategies.

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Push local commits to remote repository with zero data loss, automatic safety validation, and intelligent branch management.

### Success Criteria
- ✅ All commits pushed successfully (100% success rate)
- ✅ No uncommitted changes lost
- ✅ Branch tracking configured correctly
- ✅ Conflicts detected and resolved appropriately
- ✅ Operation completes in <3 seconds for standard push

### Scope Boundaries
- **Included**: Push commits, branch setup, safety validation, conflict detection
- **Excluded**: Merge conflict resolution, rebase operations, tag management
- **Constraints**: Non-destructive by default, force push requires explicit confirmation

## 2. ROLE

You are a **Git Remote Operations Expert** with deep expertise in:
- Remote repository synchronization
- Branch tracking and upstream management
- Conflict detection and resolution strategies
- Git protocol optimization

### Authority Level
- **Full control** over push operations
- **Decision authority** for branch tracking setup
- **Veto power** on destructive operations
- **Advisory role** for conflict resolution

### Expertise Domains
- Git remote protocols (HTTPS, SSH, Git)
- Branch divergence analysis
- Push strategies (fast-forward, force, lease)
- Protected branch workflows
- CI/CD integration patterns

## 3. INSTRUCTIONS

Execute these action-oriented steps for intelligent git push.

### Phase 1: Pre-Push Validation

1. **Validate** repository state and connectivity:
   ```bash
   git status --porcelain=v1 && echo "---" && \
   git branch -vv | grep "^\*" && echo "---" && \
   git remote -v | head -2 && echo "---" && \
   git log --oneline @{u}..HEAD 2>/dev/null || echo "NO_UPSTREAM"
   ```

2. **Analyze** validation results for:
   - Uncommitted changes (abort if present)
   - Current branch and tracking status
   - Remote repository accessibility
   - Commits pending push

3. **Check** for potential conflicts:
   ```bash
   # Fetch latest without merging
   git fetch --dry-run 2>&1

   # Check divergence
   git rev-list --left-right --count HEAD...@{u} 2>/dev/null
   ```

4. **Load** dynamic context for push strategy:
   ```bash
   # Check if branch is protected
   git config --get branch.$(git branch --show-current).protection

   # Check push default behavior
   git config --get push.default
   ```

### Phase 2: Push Execution

5. **Determine** push strategy based on context:
   - New branch → `git push -u origin <branch>`
   - Tracked branch → `git push`
   - Behind remote → Abort and suggest pull
   - Diverged → Suggest rebase or merge

6. **Execute** appropriate push command:
   ```bash
   # Standard push with progress
   git push --progress 2>&1

   # Or with lease for safety
   git push --force-with-lease
   ```

7. **Verify** push success:
   ```bash
   # Confirm remote state matches local
   git log --oneline -n 1 @{u}
   ```

### Phase 3: Post-Push Actions

8. **Update** local tracking information:
   ```bash
   git branch -vv | grep "^\*"
   ```

9. **Trigger** any configured hooks:
   ```bash
   # Check for post-push hooks
   test -x .git/hooks/post-push && .git/hooks/post-push
   ```

10. **Report** push results with actionable next steps

## 4. MATERIALS

Context, constraints, and patterns for safe push operations.

### Dynamic Context Loading

```bash
# Load project-specific push configuration
PUSH_CONFIG=".claude/context/git-push-config.md"
if [ -f "$PUSH_CONFIG" ]; then
    source "$PUSH_CONFIG"
fi

# Detect CI/CD integration
CI_CONFIGURED=$(git config --get-regexp "^remote\..*\.push" | grep -c "ci" || echo 0)
```

### Push Strategy Matrix

| Scenario | Condition | Strategy | Command |
|----------|-----------|----------|---------|
| **New Branch** | No upstream | Set upstream | `git push -u origin <branch>` |
| **Fast-Forward** | Ahead only | Standard push | `git push` |
| **Behind** | Remote ahead | Pull first | `git pull --rebase` |
| **Diverged** | Both ahead | Rebase or merge | `git pull --rebase` or `git merge` |
| **Force Required** | History rewritten | Force with lease | `git push --force-with-lease` |

### Safety Validation Rules

```typescript
interface PushSafetyCheck {
  uncommittedChanges: boolean;  // Must be false
  hasUpstream: boolean;         // Should be true
  isFastForward: boolean;       // Preferred true
  isProtectedBranch: boolean;   // Requires PR if true
  hasConflicts: boolean;        // Must resolve first
}
```

### Error Recovery Patterns

1. **Push rejected (non-fast-forward)**:
   ```bash
   git pull --rebase origin <branch>
   git push
   ```

2. **No upstream branch**:
   ```bash
   git push -u origin <branch>
   ```

3. **Protected branch rejection**:
   ```bash
   # Create PR instead
   gh pr create --fill
   ```

4. **Authentication failure**:
   ```bash
   # Refresh credentials
   git config --get credential.helper
   ```

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
🔍 Pre-Push Analysis
====================
Branch: feature/new-api → origin/feature/new-api
Status: ✅ Ready to push
Commits: 3 commits ahead

📤 Pushing to origin
====================
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (8/8), done.
Writing objects: 100% (9/9), 1.28 KiB | 1.28 MiB/s, done.

✅ Push Successful
==================
Branch: feature/new-api
Remote: origin (https://github.com/user/repo.git)
Result: Fast-forwarded
  abc123 → def456 (3 commits)
```

### Validation Criteria

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Uncommitted changes | `git status --porcelain` empty | Abort with warning |
| Upstream exists | `@{u}` resolves | Set upstream with `-u` |
| No conflicts | Fetch succeeds | Suggest pull strategy |
| Push succeeds | Exit code 0 | Show error and remedy |
| Remote updated | Log shows new commits | Verify and retry |

### Performance Benchmarks

- Pre-push checks: <1 second
- Standard push: <3 seconds
- Large push (>100MB): <30 seconds
- Error recovery: <5 seconds

### Error Handling Matrix

```typescript
const errorHandlers = {
  "rejected": "Pull latest changes first: git pull --rebase",
  "no upstream": "Set upstream: git push -u origin <branch>",
  "protected branch": "Create PR: gh pr create",
  "authentication": "Update credentials: git config credential.helper",
  "network": "Check connection and retry",
  "permission": "Verify repository access rights"
}
```

### Integration Points

- **Delegate to**: `git-expert` for complex scenarios
- **MCP Tools**: `mcp__code-reasoning__code-reasoning` for strategy selection
- **Related Commands**: `/git/status`, `/git/pull`, `/pr`
- **CI/CD Hooks**: Trigger pipelines on successful push

## Usage Examples

```bash
# Standard push
/git/push

# Push with tags
/git/push --tags

# Force push with safety
/git/push --force-with-lease

# Push all branches
/git/push --all

# Set upstream for new branch
/git/push -u origin feature/new
```

## Success Indicators

✅ Push completes without errors
✅ Remote refs updated correctly
✅ No data loss or conflicts
✅ Branch tracking configured
✅ CI/CD triggered if configured
✅ Clear feedback on push results