---
description: Execute intelligent git push with comprehensive safety validation and automatic conflict resolution
category: workflow
allowed-tools: [Bash(git:*), Task, Read, Glob, TodoWrite, mcp__github__*]
argument-hint: [--force|--tags|--all] - optional push flags
mcp-tools: mcp__code-reasoning__code-reasoning, mcp__github__*
---

# Git Push Command

Execute intelligent git push operations with comprehensive safety checks, automatic branch management, and conflict resolution strategies using the PRIME framework.

## Key Features
- **Safety Validation**: Zero data loss with comprehensive pre-push checks
- **Parallel Execution**: Simultaneous status operations for 3x faster analysis
- **Intelligent Strategy**: Automatic push strategy selection based on context
- **Conflict Detection**: Proactive divergence analysis and resolution
- **GitHub Integration**: Issue linking and CI/CD trigger awareness
- **Recovery Patterns**: Comprehensive error handling with actionable solutions

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read CLAUDE.md

## Prompt

<role>
You are a **Git Remote Operations Expert** with mastery of repository synchronization, branch tracking, conflict detection, and Git protocol optimization. You have full control over push operations with decision authority for branch tracking setup and veto power on destructive operations.
</role>

<instructions>
# Git Push Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Execute** all validation checks before any push operation
- **Prevent** data loss through comprehensive safety validation
- **Apply** parallel execution for status operations
- **Ensure** operation completes in <3 seconds for standard push
- **Provide** clear, actionable feedback for all outcomes

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** strategic objectives and measurable success criteria:

1. **Primary Objective**: Push local commits to remote repository with zero data loss and intelligent branch management
2. **Success Criteria**:
   - ✅ All commits pushed successfully (100% success rate)
   - ✅ No uncommitted changes lost
   - ✅ Branch tracking configured correctly
   - ✅ Conflicts detected and resolved appropriately
   - ✅ Operation completes in <3 seconds for standard push
3. **Scope Boundaries**:
   - **Include**: Push commits, branch setup, safety validation, conflict detection, CI/CD awareness
   - **Exclude**: Complex merge conflict resolution, rebase operations, repository migration
4. **Key Features**: Safety validation, parallel analysis, intelligent strategy, recovery patterns
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** Git expertise and decision authority:

1. **Expertise Domain**: Git remote operations, branch management, conflict resolution
2. **Experience Level**: Expert with deep knowledge of Git internals and protocols
3. **Decision Authority**:
   - **Autonomous**: Branch tracking setup, push strategy selection, safety checks
   - **Advisory**: Conflict resolution strategies, force push operations
   - **Veto Power**: Destructive operations without explicit confirmation
4. **Approach Style**: Pragmatic, safety-first, performance-optimized
</role_definition>

### Phase I - INPUTS
<inputs>
#### Essential Context Loading
**Load** critical documentation:
```bash
# Read project-specific git conventions
if [ -f CLAUDE.md ]; then
  READ_CLAUDE=true
fi

# Check for git-specific configuration
if [ -f .claude/context/git/push-config.md ]; then
  READ_CONFIG=true
fi
```

#### Dynamic Context Discovery
**Delegate** to context-discovery-expert for adaptive loading:
```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for git push operation"
- prompt: "Find relevant context for git push workflow.
          Command type: git-push
          Token budget: 3000
          Focus on: git workflows, CI/CD integration, branch protection, team conventions
          Priority: push policies, protected branches, automation hooks"

Expert returns prioritized Read commands for execution.
```

#### Parameter Collection
**Parse** command arguments:
```bash
# Collect push flags
PUSH_FLAGS="$@"
FORCE_PUSH=false
PUSH_TAGS=false
PUSH_ALL=false

# Parse flags
for flag in $PUSH_FLAGS; do
  case "$flag" in
    --force|--force-with-lease) FORCE_PUSH=true ;;
    --tags) PUSH_TAGS=true ;;
    --all) PUSH_ALL=true ;;
  esac
done
```

#### Repository State Gathering
**Execute** parallel status operations:
```bash
# CRITICAL: Execute all status checks simultaneously for 3x faster analysis
# Send all these commands in ONE message:
parallel_status() {
  git status --porcelain=v1 && echo "---STATUS---" &
  git branch -vv | grep "^\*" && echo "---BRANCH---" &
  git remote -v | head -2 && echo "---REMOTE---" &
  git log --oneline @{u}..HEAD 2>/dev/null || echo "NO_UPSTREAM" &
  wait
}
```
</inputs>

### Phase M - METHOD
<method>
**Execute** systematic push workflow with decision logic:

#### Step 1: Pre-Push Validation
**Validate** repository state comprehensively:
```bash
# Execute parallel validation checks
**Run** status validation:
  - Check for uncommitted changes
  - Verify current branch status
  - Confirm remote accessibility
  - Count pending commits

IF uncommitted changes exist:
  → **Abort** with safety warning
  → THEN **Suggest** stash or commit
ELSE IF no upstream configured:
  → **Prepare** upstream setup
  → THEN **Proceed** with -u flag
ELSE:
  → **Continue** to conflict check
```

#### Step 2: Conflict Detection
**Analyze** potential conflicts:
```bash
# Fetch without merging
**Execute** dry-run fetch:
  git fetch --dry-run 2>&1

# Check divergence with upstream
**Calculate** divergence:
  git rev-list --left-right --count HEAD...@{u} 2>/dev/null

IF branch is behind:
  → **Warn** about outdated branch
  → THEN **Suggest** pull --rebase
ELSE IF branches diverged:
  → **Analyze** conflict severity
  → THEN **Recommend** resolution strategy
ELSE:
  → **Proceed** to strategy determination
```

#### Step 3: Push Strategy Selection
**Determine** optimal push strategy:
```
Decision Tree for Push Strategy:

IF no upstream exists:
  → **Execute** git push -u origin <branch>
  → THEN **Configure** tracking
ELSE IF fast-forward possible:
  → **Execute** git push
  → THEN **Verify** success
ELSE IF force push requested AND safe:
  → **Execute** git push --force-with-lease
  → THEN **Confirm** remote state
ELSE IF protected branch:
  → **Delegate** to GitHub integration
  → THEN **Create** pull request
ELSE:
  → **Abort** with explanation
  → THEN **Provide** resolution steps
```

#### Step 4: Push Execution
**Execute** appropriate push command:
```bash
# Use TodoWrite for complex operations
IF multiple branches OR force push:
  todos = [
    {content: "Validate all branches", status: "completed", activeForm: "Validating"},
    {content: "Execute push operation", status: "in_progress", activeForm: "Pushing"},
    {content: "Verify remote state", status: "pending", activeForm: "Verifying"}
  ]

# Execute with progress tracking
**Push** with appropriate flags:
  git push --progress $PUSH_FLAGS 2>&1

# Capture and parse output
**Monitor** push progress
**Detect** any errors or warnings
```

#### Step 5: Post-Push Actions
**Verify** success and trigger integrations:
```bash
# Verify push success
**Confirm** remote state:
  git log --oneline -n 1 @{u}

# Check for CI/CD triggers
**Detect** automation hooks:
  - GitHub Actions triggers
  - Jenkins webhooks
  - Custom post-push hooks

# Update tracking information
**Refresh** branch status:
  git branch -vv | grep "^\*"
```

#### Parallel Execution Pattern
**Launch** simultaneous operations when beneficial:
```bash
# When to use: Multiple independent checks
# Implementation: Background processes with wait

parallel_push_validation() {
  echo "🔍 Running parallel validation..."

  # Launch all checks simultaneously
  check_status &
  check_conflicts &
  check_hooks &
  check_ci_status &

  # Wait for all to complete
  wait
  echo "✅ Validation complete"
}
```

#### Agent Delegation Pattern
**Delegate** to specialized agents when needed:
```
When to use: Complex scenarios requiring expertise

IF complex merge conflict:
  Use Task tool with:
  - subagent_type: "git-expert"
  - description: "Resolve complex push conflict"
  - prompt: "Analyze and resolve push conflict with upstream"

IF GitHub integration needed:
  Use mcp__github__* tools for:
  - Creating pull requests
  - Checking CI status
  - Managing branch protection
```
</method>

### Phase E - EXPECTATIONS
<expectations>
#### Output Specification
**Define** expected output format:

```text
🔍 Pre-Push Analysis
====================
Branch: feature/new-api → origin/feature/new-api
Status: ✅ Ready to push
Commits: 3 commits ahead
Conflicts: None detected

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
CI/CD: Triggered (GitHub Actions)
```

#### Validation Checks
**Verify** operation quality:
```bash
# Validation criteria
VALIDATIONS=(
  "No uncommitted changes"
  "Upstream configured correctly"
  "Push completed successfully"
  "Remote refs updated"
  "No data loss occurred"
)

# Execute validation
for check in "${VALIDATIONS[@]}"; do
  **Validate** "$check"
  if validation_failed; then
    **Report** failure with recovery steps
  fi
done
```

#### Performance Benchmarks
**Assert** performance standards:
- Pre-push checks: <1 second (via parallel execution)
- Standard push: <3 seconds
- Large push (>100MB): <30 seconds
- Error recovery: <5 seconds

#### Error Handling Matrix
**Handle** failures by category:

| Error Type | Detection | Resolution | Recovery Time |
|------------|-----------|------------|---------------|
| Non-fast-forward | Push rejected | Pull --rebase first | <10s |
| No upstream | Reference error | Push -u origin branch | <5s |
| Protected branch | Permission denied | Create PR via GitHub | <15s |
| Network failure | Timeout/connection | Retry with backoff | <30s |
| Authentication | 401/403 error | Refresh credentials | <20s |

#### Success Reporting
**Report** completion with metrics:
```
✅ **Git Push Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: Push operation achieved with zero data loss
✅ Role: Git expertise applied for optimal strategy
✅ Inputs: 4 parallel checks executed in 0.8s
✅ Method: Fast-forward push strategy selected
✅ Expectations: All validation criteria met

**Performance Metrics:**
- Pre-checks: 0.8s (3x faster via parallel)
- Push operation: 2.1s
- Total time: 2.9s (under 3s target)

**Next Steps:**
- Monitor CI/CD pipeline status
- Review PR if created
- Pull on other machines to sync
```
</expectations>

## Error Handling
<error_handling>
### Purpose Phase Errors
- **Unclear objectives**: **Request** specific push goals
- **Missing criteria**: **Apply** default safety standards

### Role Phase Errors
- **Authority unclear**: **Default** to safety-first approach
- **Expertise gap**: **Delegate** to git-expert agent

### Inputs Phase Errors
- **Context loading fails**: **Continue** with essential context only
- **Status check fails**: **Retry** with individual commands
- **Network issues**: **Implement** exponential backoff

### Method Phase Errors
- **Push rejected**: **Analyze** cause and **Provide** specific resolution
- **Conflicts detected**: **Suggest** rebase or merge strategy
- **Hook failure**: **Display** hook output with fix suggestions

### Expectations Phase Errors
- **Validation fails**: **Report** specific failures with recovery steps
- **Performance degrades**: **Analyze** repository size and network
- **Output corrupted**: **Retry** with verbose logging

### Common Recovery Procedures
```bash
# Recover from failed push
recover_failed_push() {
  echo "🔄 Recovering from failed push..."

  # Save current state
  git branch backup-$(date +%Y%m%d-%H%M%S)

  # Fetch latest
  git fetch origin

  # Attempt rebase
  if git rebase origin/$(git branch --show-current); then
    echo "✅ Rebased successfully, retrying push..."
    git push
  else
    echo "⚠️ Rebase conflicts detected, manual resolution required"
    git rebase --abort
  fi
}

# Handle force push safely
safe_force_push() {
  echo "⚠️ Force push requested, validating safety..."

  # Check if we're behind
  BEHIND=$(git rev-list --count HEAD..@{u})
  if [ "$BEHIND" -gt 0 ]; then
    echo "❌ Remote has $BEHIND commits not in local, aborting"
    echo "Run: git pull --rebase first"
    return 1
  fi

  # Use force-with-lease for safety
  git push --force-with-lease
}
```
</error_handling>
</instructions>

<patterns>
### Push Strategy Patterns
- **Fast-Forward**: Default for linear history
- **Force-with-Lease**: Safer alternative to --force
- **Upstream Setup**: For new branches with -u
- **Protected Branch**: Delegate to PR workflow

### Parallel Execution Patterns
- **Status Checks**: Run all readonly operations simultaneously
- **Validation Suite**: Parallel pre-push validations
- **Multi-Remote**: Push to multiple remotes in parallel

### Integration Patterns
- **CI/CD Triggers**: Detect and report pipeline starts
- **PR Creation**: Automatic for protected branches
- **Hook Execution**: Pre-push and post-push automation
- **Issue Linking**: GitHub issue reference detection
</patterns>

<help>
🚀 **Intelligent Git Push Assistant**

Push commits to remote with comprehensive safety checks and smart conflict resolution.

**Usage:**
- `/git/push` - Standard push with all safety checks
- `/git/push --force` - Force push with lease protection
- `/git/push --tags` - Push with tags included
- `/git/push --all` - Push all branches

**PRIME Process:**
1. **Purpose**: Safe, fast push with zero data loss
2. **Role**: Git operations expert with safety focus
3. **Inputs**: Parallel status gathering (3x faster)
4. **Method**: Smart strategy selection and execution
5. **Expectations**: Validated success with metrics

**Features:**
- Parallel validation checks for speed
- Automatic upstream configuration
- Protected branch detection
- CI/CD integration awareness
- Comprehensive error recovery

Push with confidence - safety and speed combined!
</help>