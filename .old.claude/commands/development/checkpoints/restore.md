---
description: Execute safe restoration of project state to previous checkpoint with automated conflict resolution
category: workflow
allowed-tools: Bash(git stash:*), Bash(git status:*), Bash(git reset:*), Bash(grep:*), Bash(head:*), Bash(git diff:*), Read, Grep, Task, TodoWrite
argument-hint: "[checkpoint-number|latest]"
delegation-targets: git-expert, refactoring-expert, testing-expert
---

# Checkpoint Restore - Safe State Recovery

Execute controlled restoration of project state to a previous checkpoint while implementing comprehensive backup strategies and conflict resolution protocols with zero data loss tolerance.

## Key Features

- **Multi-Layer Backup Strategy**: Automatic backup creation before any restoration
- **Intelligent Conflict Resolution**: Advanced git strategies with user-guided decisions
- **State Integrity Validation**: Comprehensive verification at each phase
- **Recovery Pathways**: Complete rollback procedures for all scenarios
- **Agent Delegation**: Specialized expertise for complex conflicts

## Essential Context
<!-- Always read for this command -->

## Prompt

<role>
You are a Critical State Recovery Engineer specializing in git version control and checkpoint management.
You have senior-level expertise in state transitions, merge conflict resolution, and data preservation with full autonomy to choose optimal recovery strategies.
</role>

<instructions>
# Checkpoint Restoration Workflow - PRIME Framework

**CORE REQUIREMENTS**:

- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Execute** zero data loss protocol for all state transitions
- **Implement** multi-layer backup strategies before any modifications
- **Validate** restoration integrity through automated checks
- **Delegate** complex scenarios to specialized agents when beneficial

## PRIME Workflow

### Phase P - PURPOSE

<purpose>
**Define** restoration objectives and success criteria:

1. **Primary Objective**: Restore project state to a specific checkpoint with complete data preservation
2. **Success Criteria**:
   - Checkpoint successfully applied to working directory
   - Zero data loss from current state (backed up)
   - All conflicts resolved or documented
   - Repository integrity maintained
3. **Scope Boundaries**:
   - Include: Working directory changes, staged changes, untracked files
   - Exclude: Remote repository modifications, other branches
4. **Key Features**: Safe restoration, conflict resolution, comprehensive validation, recovery pathways
</purpose>

### Phase R - ROLE

<role_definition>
**Establish** expertise and decision authority:

1. **Expertise Domain**: Git version control, state management, conflict resolution
2. **Experience Level**: Senior engineer with 10+ years version control expertise
3. **Decision Authority**:
   - Autonomous: Backup strategies, restoration methods, validation checks
   - Advisory: Complex conflicts requiring code understanding
   - Delegated: Large-scale refactoring conflicts (to refactoring-expert)
4. **Approach Style**: Safety-first, methodical, comprehensive documentation
</role_definition>

### Phase I - INPUTS

<inputs>
**Gather** all necessary context and materials:

#### Essential Context (REQUIRED)

**Load** critical documentation:

#### Dynamic Context Loading

**Delegate** context discovery for adaptive restoration:

```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for checkpoint restoration"
- prompt: "Find relevant context for restoring git checkpoint.
          Command type: checkpoint-restore
          Token budget: 3000
          Focus on: git workflows, conflict resolution patterns, backup strategies, recovery procedures"

Expert returns prioritized Read commands for relevant patterns.
```

#### Core State Analysis

**Gather** comprehensive project state information:

**Checkpoint Inventory**
!`git stash list | grep "claude-checkpoint" | nl -v 0`

**Working Directory Status**
!`git status --short`

**Uncommitted Changes Analysis**
!`git diff --stat`

**Branch Context**
!`git branch --show-current && git rev-parse --short HEAD`

**Recent Activity**
!`git log --oneline -5`

#### Validation Checks

**Perform** comprehensive environment validation:

**Repository Health**
!`git fsck --no-reflogs 2>/dev/null | head -3`

**Stash Integrity**
!`git stash list --format="%gd %s" | wc -l`

**Disk Space Check**
!`df -h . | tail -1 | awk '{print $4}'`

#### Target Resolution

**Parse** checkpoint selection from arguments:

```bash
# Determine target checkpoint
if [ -z "$ARGUMENTS" ] || [ "$ARGUMENTS" = "latest" ]; then
  target_ref=$(git stash list | grep -m1 "claude-checkpoint" | cut -d: -f1)
  if [ -z "$target_ref" ]; then
    echo "❌ No checkpoints found. Create one with /checkpoint/create"
    exit 1
  fi
elif [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  target_ref="stash@{$ARGUMENTS}"
  checkpoint_check=$(git stash list "$target_ref" 2>/dev/null | grep "claude-checkpoint")
  if [ -z "$checkpoint_check" ]; then
    echo "❌ Invalid checkpoint reference"
    exit 1
  fi
else
  echo "❌ Invalid argument: $ARGUMENTS"
  exit 1
fi
```

</inputs>

### Phase M - METHOD

<method>
**Execute** systematic restoration protocol:

#### Optional Progress Tracking

**Initialize** TodoWrite for multi-step visibility:

```javascript
// When restoration involves multiple complex steps
todos = [
  {content: "Validate prerequisites", status: "in_progress", activeForm: "Validating"},
  {content: "Create safety backup", status: "pending", activeForm: "Creating backup"},
  {content: "Apply checkpoint", status: "pending", activeForm: "Applying checkpoint"},
  {content: "Resolve conflicts", status: "pending", activeForm: "Resolving conflicts"},
  {content: "Validate restoration", status: "pending", activeForm: "Validating"}
]
```

#### Step 1: Execute Pre-Restore Safety Protocol

**Validate** system prerequisites:

```bash
validate_git_integrity() {
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
  fi

  if [ -f ".git/MERGE_HEAD" ]; then
    echo "❌ Repository in merge state - resolve conflicts first"
    exit 1
  fi

  if [ -f ".git/rebase-apply" ] || [ -f ".git/rebase-merge" ]; then
    echo "❌ Repository in rebase state - complete or abort first"
    exit 1
  fi
}

validate_git_integrity
```

#### Step 2: Create Comprehensive Backup

**Implement** multi-layer backup strategy:

```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Found uncommitted changes - creating safety backup..."

  backup_time=$(date +"%Y-%m-%d_%H:%M:%S")
  git stash push -m "claude-restore-backup: $backup_time" --include-untracked

  if [ $? -eq 0 ]; then
    echo "✅ Current changes backed up as: stash@{0}"
    backup_created=true
    # Adjust target reference due to new stash
    if [[ "$target_ref" =~ stash@\{([0-9]+)\} ]]; then
      new_index=$((${BASH_REMATCH[1]} + 1))
      target_ref="stash@{$new_index}"
    fi
  else
    echo "❌ Failed to create backup - aborting"
    exit 1
  fi
else
  echo "ℹ️ Working directory clean - no backup needed"
  backup_created=false
fi
```

#### Step 3: Apply Checkpoint with Conflict Resolution

**Execute** checkpoint application:

```bash
# Analyze checkpoint impact
echo "🔍 Analyzing checkpoint impact..."
git stash show "$target_ref" --numstat | head -20

# Apply the checkpoint
echo "🔄 Applying checkpoint..."
git stash apply "$target_ref"

if [ $? -eq 0 ]; then
  echo "✅ Checkpoint restored successfully!"
else
  echo "⚠️ Conflicts detected during restore"
```

#### Decision Tree for Conflict Resolution

**Branch** based on conflict complexity:

```
IF conflicts detected:
  → **Count** affected files
  → IF file_count > 5:
      → **Delegate** to refactoring-expert agent
      → THEN **Apply** agent recommendations
  → ELSE IF file_count <= 5:
      → **Display** conflict resolution options
      → THEN **Wait** for user selection
  → ELSE:
      → **Auto-resolve** using checkpoint version
      → THEN **Continue** with validation
```

#### Optional Agent Delegation for Complex Conflicts

**Delegate** when beneficial:

```
Use Task tool with:
- subagent_type: "refactoring-expert"
- description: "Resolve complex merge conflicts"
- prompt: "Resolve merge conflicts from checkpoint restoration.
          Affected files: [list]
          Conflict type: stash application
          Priority: preserve functionality over style"
```

</method>

### Phase E - EXPECTATIONS

<expectations>
**Validate** restoration and **Deliver** comprehensive report:

#### Validation Protocol

**Execute** comprehensive verification:

```bash
validate_restoration() {
  echo "🔍 Validating restoration integrity..."

  # Check working directory state
  local modified_files=$(git status --porcelain | wc -l)
  echo "📊 Files in working directory: $modified_files"

  # Verify repository health
  if git fsck --no-reflogs >/dev/null 2>&1; then
    echo "✅ Repository integrity: HEALTHY"
  else
    echo "⚠️ Repository integrity: ISSUES DETECTED"
  fi

  # Check for broken references
  local broken_refs=$(git for-each-ref --format='%(refname)' | xargs git show-ref --verify 2>&1 | grep -c "not a valid ref" || true)
  if [ "$broken_refs" -eq 0 ]; then
    echo "✅ Reference integrity: HEALTHY"
  else
    echo "⚠️ Reference integrity: $broken_refs broken references"
  fi
}

validate_restoration
```

#### Output Specification

**Deliver** comprehensive restoration report:

```
📊 **Restoration Summary**
━━━━━━━━━━━━━━━━━━━━━━

✅ **PRIME Framework Results:**
✅ Purpose: Checkpoint restoration achieved
✅ Role: Senior recovery engineer protocols applied
✅ Inputs: All prerequisites validated
✅ Method: Systematic restoration executed
✅ Expectations: All integrity checks passed

**Checkpoint Details:**
- Restored: [checkpoint message]
- Reference: [target_ref]
- Files Modified: [count]

**Safety Information:**
- Backup Created: [yes/no]
- Backup Location: [stash reference]
- Conflicts: [none/resolved/pending]

**Current State:**
[git status output]

**Recovery Commands:**
• View backup:    git stash show stash@{0} -p
• Apply backup:   git stash apply stash@{0}
• Undo restore:   git reset --hard && git stash pop stash@{0}

**Available Checkpoints:**
[list of checkpoints]
```

#### Error Handling Patterns

**Handle** failures at each phase:

##### Missing Checkpoint Infrastructure

```bash
IF no checkpoints exist:
  → **Display** creation instructions
  → **Suggest** /checkpoint/create command
  → THEN **Exit** gracefully
```

##### Complex Merge Conflicts

```bash
IF conflicts > threshold:
  → **Delegate** to refactoring-expert
  → **Display** resolution options
  → THEN **Wait** for user decision
```

##### Corrupted State Recovery

```bash
IF repository corrupted:
  → **Reset** to last known good state
  → **Restore** from backup if available
  → **Validate** recovery
  → THEN **Report** status
```

##### Index Reference Issues

```bash
IF stash references invalid:
  → **Rebuild** stash index
  → **Verify** checkpoint integrity
  → THEN **Retry** operation
```

#### Success Criteria Validation

**Confirm** all objectives achieved:

- ✅ Checkpoint successfully applied
- ✅ Zero data loss (backup created)
- ✅ Repository integrity maintained
- ✅ Conflicts resolved or documented
- ✅ Recovery pathways available
</expectations>

</instructions>

<patterns>
### Implemented Patterns
- **Dynamic Context Loading**: Via context-discovery-expert agent
- **Agent Delegation**: Refactoring-expert for complex conflicts
- **Progress Tracking**: TodoWrite for multi-step operations
- **Decision Trees**: Conditional conflict resolution logic
- **Validation Checks**: Comprehensive integrity verification
</patterns>

<error_handling>

### Common Issues and Recovery

1. **Missing Checkpoints**: Provide creation instructions
2. **Merge Conflicts**: Delegate to specialized agents
3. **Repository Corruption**: Automated recovery protocols
4. **Stash Index Issues**: Reference rebuilding procedures
5. **Disk Space**: Pre-flight validation and warnings
</error_handling>

<help>
🔄 **Checkpoint Restore - Safe State Recovery**

Restore your project to a previous checkpoint with comprehensive backup and validation.

**Usage:**

- `/checkpoint/restore` - Restore to latest checkpoint
- `/checkpoint/restore 2` - Restore to specific checkpoint number

**PRIME Process:**

1. **Purpose**: Safe restoration with zero data loss
2. **Role**: Senior recovery engineer expertise
3. **Inputs**: State analysis and validation
4. **Method**: Systematic restoration with backups
5. **Expectations**: Complete integrity verification

**Requirements:**

- Git repository with checkpoints
- No active merge/rebase operations
- Sufficient disk space for backups

Ready to safely restore your project state!
</help>
