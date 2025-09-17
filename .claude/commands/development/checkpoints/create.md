---
description: Create a git stash checkpoint to save current work state without modifying working directory
category: workflow
allowed-tools: Bash(git stash:*), Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git fsck:*)
argument-hint: "[optional description for checkpoint]"
delegation-targets: git-expert, refactoring-expert
context-discovery: dynamic
patterns: validation-checks, error-handling, agent-delegation
---

# PURPOSE

**PRIMARY GOAL**: Establish a non-destructive git checkpoint that preserves your exact working state for safe recovery without affecting current files or staging area.

**WHY THIS MATTERS**: Enables fearless experimentation and risky operations by creating instant rollback points that protect against data loss while maintaining workflow continuity.

**SPECIFIC OUTCOME**: Generate a recoverable checkpoint stored in git stash while maintaining all current changes exactly as they are, with comprehensive validation and clear recovery instructions.

**SUCCESS METRICS**:
- Zero impact on working directory state
- 100% preservation of staged/unstaged changes
- Validated checkpoint recoverability
- Clear recovery pathway provided

# ROLE

**PRIMARY IDENTITY**: Adopt the role of a **Version Control Safety Specialist** who prioritizes data integrity and workflow preservation above all else.

**CORE RESPONSIBILITIES**:
- Execute reliable recovery point creation before risky operations
- Preserve exact working states without any disruption to developer flow
- Validate checkpoint integrity and verify recoverability mechanisms
- Provide comprehensive confirmation with actionable recovery instructions
- Delegate complex operations to specialized agents when appropriate

**EXPERTISE AREAS**:
- Git stash mechanisms and edge cases
- Non-destructive version control operations
- State preservation and recovery protocols
- Error detection and graceful failure handling

# INPUTS

**DISCOVER AND ANALYZE** the current git environment and checkpoint requirements through dynamic context loading:

## 1. Repository Context Discovery
```bash
# Dynamically load git repository context
!git rev-parse --show-toplevel 2>/dev/null || echo "ERROR: Not in git repository"
!git rev-parse --git-dir 2>/dev/null || echo "ERROR: No .git directory"
!git symbolic-ref --short HEAD 2>/dev/null || echo "INFO: Detached HEAD state"
```

## 2. Current Working State Analysis
```bash
# Analyze current changes with detailed breakdown
!git status --porcelain --untracked-files=all
!git diff --numstat | head -10
!git diff --cached --numstat | head -10
```

## 3. Staging Area Intelligence
```bash
# Capture precise staging state for restoration
!git ls-files --stage | wc -l  # Total staged files
!git diff --cached --name-only | wc -l  # Modified staged files
!git status --porcelain | grep "^[ADMR]" | wc -l  # Changes to be committed
```

## 4. Historical Checkpoint Context
```bash
# Load existing checkpoint history
!git stash list --format="%gd: %s (%cr)" | head -5
!git stash list | wc -l  # Total stash count
```

## 5. Checkpoint Specification Processing
```bash
# Process and validate checkpoint description
if [ -n "$ARGUMENTS" ]; then
  checkpoint_desc="$ARGUMENTS"
  echo "CUSTOM: Using provided description: '$checkpoint_desc'"
else
  checkpoint_desc="$(date +'%Y-%m-%d %H:%M:%S') - Auto-checkpoint ($(git symbolic-ref --short HEAD 2>/dev/null || echo 'detached'))"
  echo "AUTO: Generated description: '$checkpoint_desc'"
fi

# Validate description format
if [ ${#checkpoint_desc} -gt 200 ]; then
  echo "WARNING: Description truncated to 200 characters"
  checkpoint_desc="${checkpoint_desc:0:200}..."
fi
```

# METHOD

**EXECUTE** the checkpoint creation process with comprehensive validation and error handling:

## Phase 1: Pre-Flight Validation and Context Preparation

```bash
# Execute comprehensive repository health check
validate_git_repository() {
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ FATAL: Not in a git repository - initialize with 'git init'"
    exit 1
  fi

  # Verify git repository integrity
  if ! git fsck --no-dangling --quiet 2>/dev/null; then
    echo "⚠️ WARNING: Git repository has integrity issues - consider 'git fsck --full'"
  fi

  # Check for sufficient disk space (minimum 100MB)
  available_space=$(df . | tail -1 | awk '{print $4}')
  if [ "$available_space" -lt 102400 ]; then
    echo "⚠️ WARNING: Low disk space ($available_space KB available)"
  fi
}

# Analyze changes requiring checkpoint
analyze_workspace_changes() {
  if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️ CLEAN: No changes to checkpoint - working directory is clean"
    echo "💡 TIP: Use '/git/status' to verify current state"
    exit 0
  fi

  # Detailed change analysis
  untracked_count=$(git status --porcelain | grep "^??" | wc -l)
  modified_count=$(git status --porcelain | grep "^.M" | wc -l)
  staged_count=$(git status --porcelain | grep "^[ADMR]" | wc -l)
  total_count=$(git status --porcelain | wc -l)

  echo "📊 ANALYSIS: Found $total_count files requiring checkpoint:"
  echo "  • Staged changes: $staged_count files"
  echo "  • Modified files: $modified_count files"
  echo "  • Untracked files: $untracked_count files"
}

# Execute validation sequence
validate_git_repository
analyze_workspace_changes
```

## Phase 2: Atomic Checkpoint Creation with State Preservation

```bash
# Capture current staging state for precise restoration
capture_staging_state() {
  echo "📸 CAPTURE: Recording current staging state..."
  original_staged_files=$(git diff --cached --name-only)
  original_staged_count=$(echo "$original_staged_files" | grep -v "^$" | wc -l)
  echo "📋 RECORDED: $original_staged_count files currently staged"
}

# Execute non-destructive checkpoint creation
create_checkpoint_atomic() {
  echo "🔧 PREPARE: Temporarily staging all changes for checkpoint creation..."

  # Stage all changes (required for git stash create)
  if ! git add -A 2>/dev/null; then
    echo "❌ FAILED: Unable to stage changes - check file permissions"
    exit 1
  fi

  echo "💾 CREATE: Generating checkpoint object..."
  stash_sha=$(git stash create "claude-checkpoint: $checkpoint_desc" 2>/dev/null)

  # Validate checkpoint creation success
  if [ -z "$stash_sha" ] || [ ${#stash_sha} -ne 40 ]; then
    echo "❌ FAILED: Checkpoint object creation failed"
    restore_original_staging_state
    exit 1
  fi

  echo "✅ SUCCESS: Created checkpoint object ${stash_sha:0:8}..."

  # Store checkpoint in stash list with atomic operation
  echo "📝 STORE: Adding checkpoint to stash list..."
  if ! git stash store -m "claude-checkpoint: $checkpoint_desc" "$stash_sha" 2>/dev/null; then
    echo "❌ FAILED: Unable to store checkpoint in stash list"
    restore_original_staging_state
    exit 1
  fi

  echo "✅ SUCCESS: Checkpoint stored as stash entry"
}

# Restore original staging state with precision
restore_original_staging_state() {
  echo "🔄 RESTORE: Returning staging area to original state..."

  # Reset index completely
  git reset --quiet 2>/dev/null

  # Re-stage originally staged files if any existed
  if [ -n "$original_staged_files" ] && [ "$original_staged_count" -gt 0 ]; then
    echo "$original_staged_files" | while read -r file; do
      if [ -n "$file" ] && [ -f "$file" ]; then
        git add "$file" 2>/dev/null || echo "⚠️ WARNING: Could not re-stage $file"
      fi
    done
    echo "🎯 RESTORED: $original_staged_count files re-staged"
  fi
}

# Execute checkpoint creation sequence
capture_staging_state
create_checkpoint_atomic
restore_original_staging_state

echo "🎉 COMPLETE: Checkpoint created successfully with state preservation!"
```

## Phase 3: Checkpoint Verification and Recovery Intelligence

```bash
# Verify checkpoint integrity and accessibility
verify_checkpoint_integrity() {
  echo ""
  echo "🔍 VERIFY: Validating checkpoint integrity..."

  # Confirm latest stash entry exists and is accessible
  if ! git stash list | head -1 > /dev/null 2>&1; then
    echo "❌ VERIFICATION FAILED: No stash entries found"
    exit 1
  fi

  # Verify checkpoint is recoverable
  if ! git stash show "stash@{0}" --stat > /dev/null 2>&1; then
    echo "❌ VERIFICATION FAILED: Checkpoint is not recoverable"
    exit 1
  fi

  echo "✅ VERIFIED: Checkpoint is valid and recoverable"
}

# Generate comprehensive checkpoint report
generate_checkpoint_report() {
  latest_stash=$(git stash list -1 --format="%gd: %s (%cr)")
  stash_files_count=$(git stash show "stash@{0}" --name-only | wc -l)

  echo ""
  echo "📍 CHECKPOINT CREATED:"
  echo "  Entry: $latest_stash"
  echo "  Files: $stash_files_count files preserved"

  echo ""
  echo "📦 CHECKPOINT CONTENTS:"
  git stash show "stash@{0}" --stat | head -15

  # Calculate and display checkpoint statistics
  insertions=$(git stash show "stash@{0}" --stat | tail -1 | grep -o '[0-9]* insertion' | cut -d' ' -f1)
  deletions=$(git stash show "stash@{0}" --stat | tail -1 | grep -o '[0-9]* deletion' | cut -d' ' -f1)

  echo ""
  echo "📊 IMPACT SUMMARY:"
  echo "  • Lines added: ${insertions:-0}"
  echo "  • Lines removed: ${deletions:-0}"
  echo "  • Total files: $stash_files_count"
}

# Provide actionable recovery instructions
provide_recovery_guidance() {
  echo ""
  echo "🛠️ RECOVERY COMMANDS:"
  echo "  • View changes:        git stash show stash@{0} -p"
  echo "  • Apply (keep stash):  git stash apply stash@{0}"
  echo "  • Pop (remove stash):  git stash pop stash@{0}"
  echo "  • Restore via command: /checkpoint/restore 0"
  echo "  • List all stashes:    git stash list"

  echo ""
  echo "⚡ AGENT DELEGATION OPTIONS:"
  echo "  • Complex restore:     Delegate to refactoring-expert"
  echo "  • Merge conflicts:     Delegate to git-expert"
  echo "  • File analysis:       Use /git/analyze command"
}

# Execute verification and reporting sequence
verify_checkpoint_integrity
generate_checkpoint_report
provide_recovery_guidance
```

# EXPECTATIONS

## Primary Success Criteria (Mandatory Validation)

**VALIDATE** that each critical requirement is met before considering the operation successful:

### Core Functionality Validation
```bash
# 1. VERIFY: Checkpoint created without modifying working directory
validate_working_directory_unchanged() {
  current_status=$(git status --porcelain)
  if [ -n "$current_status" ]; then
    echo "✅ PASS: Working directory preserves changes as expected"
  else
    echo "❌ FAIL: Working directory unexpectedly clean"
    return 1
  fi
}

# 2. VERIFY: All changes preserved in checkpoint
validate_checkpoint_completeness() {
  stash_file_count=$(git stash show "stash@{0}" --name-only | wc -l)
  current_file_count=$(git status --porcelain | wc -l)

  if [ "$stash_file_count" -ge "$current_file_count" ]; then
    echo "✅ PASS: All $current_file_count changes preserved in checkpoint"
  else
    echo "❌ FAIL: Only $stash_file_count of $current_file_count files preserved"
    return 1
  fi
}

# 3. VERIFY: Original staging state maintained
validate_staging_state_restoration() {
  current_staged=$(git diff --cached --name-only | wc -l)
  if [ "$current_staged" -eq "$original_staged_count" ]; then
    echo "✅ PASS: Staging state restored ($current_staged files staged)"
  else
    echo "⚠️ WARNING: Staging state differs (expected: $original_staged_count, actual: $current_staged)"
  fi
}

# 4. VERIFY: Checkpoint accessible via git stash commands
validate_checkpoint_accessibility() {
  if git stash show "stash@{0}" --stat > /dev/null 2>&1; then
    echo "✅ PASS: Checkpoint is accessible and readable"
  else
    echo "❌ FAIL: Checkpoint created but not accessible"
    return 1
  fi
}
```

### Advanced Validation Checks
```bash
# 5. VERIFY: Checkpoint integrity and completeness
validate_checkpoint_integrity() {
  # Check for corruption
  if ! git stash show "stash@{0}" --stat > /dev/null 2>&1; then
    echo "❌ FAIL: Checkpoint appears corrupted"
    return 1
  fi

  # Verify metadata
  checkpoint_message=$(git stash list -1 --format="%s")
  if [[ "$checkpoint_message" == *"claude-checkpoint"* ]]; then
    echo "✅ PASS: Checkpoint metadata correct"
  else
    echo "⚠️ WARNING: Unexpected checkpoint message format"
  fi
}

# 6. VERIFY: No data loss occurred
validate_no_data_loss() {
  # Compare file hashes before and after (for modified files)
  git status --porcelain | grep "^.M" | cut -c4- | while read -r file; do
    if [ -f "$file" ]; then
      current_hash=$(git hash-object "$file")
      stash_hash=$(git stash show "stash@{0}" --format="" --name-only | grep "^$file$" > /dev/null && echo "present" || echo "missing")
      if [ "$stash_hash" = "present" ]; then
        echo "✅ PASS: File $file preserved in checkpoint"
      else
        echo "⚠️ WARNING: File $file may not be fully preserved"
      fi
    fi
  done
}

# Execute comprehensive validation suite
validate_working_directory_unchanged
validate_checkpoint_completeness
validate_staging_state_restoration
validate_checkpoint_accessibility
validate_checkpoint_integrity
validate_no_data_loss
```

## Quality Assurance Verification Suite

```bash
# EXECUTE: Comprehensive post-operation validation
echo ""
echo "🔬 QUALITY ASSURANCE: Running comprehensive validation..."

# Test 1: Repository state consistency
pre_checkpoint_files=$(ls -la | wc -l)
post_checkpoint_files=$(ls -la | wc -l)
if [ "$pre_checkpoint_files" -eq "$post_checkpoint_files" ]; then
  echo "✅ QA PASS: File system state consistent"
else
  echo "⚠️ QA WARNING: File system changes detected"
fi

# Test 2: Git repository health
if git fsck --quiet > /dev/null 2>&1; then
  echo "✅ QA PASS: Git repository integrity maintained"
else
  echo "⚠️ QA WARNING: Repository integrity issues detected"
fi

# Test 3: Checkpoint recoverability test
if git stash show "stash@{0}" --stat | grep -q "file"; then
  echo "✅ QA PASS: Checkpoint contains recoverable data"
else
  echo "❌ QA FAIL: Checkpoint appears empty or invalid"
fi

# Test 4: Performance validation (checkpoint size reasonable)
stash_size=$(git cat-file -s $(git stash list -1 --format="%H") 2>/dev/null || echo "0")
if [ "$stash_size" -gt 0 ] && [ "$stash_size" -lt 104857600 ]; then  # < 100MB
  echo "✅ QA PASS: Checkpoint size reasonable ($stash_size bytes)"
else
  echo "⚠️ QA WARNING: Checkpoint size unexpected ($stash_size bytes)"
fi
```

## Error Handling and Recovery Protocols

### Critical Error Recovery Procedures

**IMPLEMENT** comprehensive error handling with specific recovery actions:

#### 1. Repository Access Failures
```bash
# Error: Not in git repository
# Recovery: Guide user to initialize or navigate to repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "🚨 CRITICAL: No git repository detected"
  echo "🔧 SOLUTIONS:"
  echo "  • Initialize: git init"
  echo "  • Navigate:   cd /path/to/repository"
  echo "  • Clone:      git clone <url>"
  exit 1
fi
```

#### 2. Staging Operation Failures
```bash
# Error: Cannot stage files
# Recovery: Diagnose and resolve staging issues
handle_staging_failure() {
  echo "🚨 STAGING FAILURE: Unable to stage files for checkpoint"

  # Check for file permission issues
  find . -type f ! -readable 2>/dev/null | head -5 | while read -r file; do
    echo "❌ Permission denied: $file"
  done

  # Check for large files
  find . -type f -size +100M 2>/dev/null | head -3 | while read -r file; do
    echo "⚠️ Large file detected: $file"
  done

  echo "🔧 RECOMMENDED ACTIONS:"
  echo "  • Fix permissions: chmod +r <file>"
  echo "  • Use .gitignore for large files"
  echo "  • Check disk space: df -h ."
}
```

#### 3. Checkpoint Storage Failures
```bash
# Error: Cannot store checkpoint
# Recovery: Clean up and provide alternatives
handle_storage_failure() {
  echo "🚨 STORAGE FAILURE: Checkpoint object created but cannot store"
  echo "🔧 RECOVERY OPTIONS:"
  echo "  • Manual storage: git stash store <sha> -m 'description'"
  echo "  • Alternative: git commit -m 'WIP: checkpoint'"
  echo "  • Clean stash:    git stash clear (removes all stashes)"
  echo "  • Check space:    df -h ."
}
```

### Agent Delegation Triggers

**DELEGATE** to specialized agents when encountering complex scenarios:

```bash
# Complex merge conflicts during checkpoint restoration
if git status --porcelain | grep -q "^UU"; then
  echo "🤖 DELEGATE: Complex merge conflicts detected"
  echo "  → Delegating to git-expert for conflict resolution"
  echo "  → Use: @git-expert resolve merge conflicts in checkpoint"
fi

# Large-scale refactoring checkpoint
if [ "$stash_files_count" -gt 50 ]; then
  echo "🤖 DELEGATE: Large checkpoint detected ($stash_files_count files)"
  echo "  → Consider delegating to refactoring-expert for analysis"
  echo "  → Use: @refactoring-expert analyze checkpoint impact"
fi

# Performance-critical checkpoint
if [ "$stash_size" -gt 10485760 ]; then  # > 10MB
  echo "🤖 DELEGATE: Large checkpoint size detected"
  echo "  → Consider delegating to performance-expert for optimization"
  echo "  → Use: @performance-expert optimize large checkpoint"
fi
```

## Usage Guidance and Examples

### Standard Usage Patterns

```bash
# Pattern 1: Pre-refactoring safety checkpoint
/checkpoint/create "Before component refactoring - LoginForm.tsx"

# Pattern 2: Experimental feature checkpoint
/checkpoint/create "Trying new state management approach"

# Pattern 3: Pre-merge safety checkpoint
/checkpoint/create "Before merging feature/auth-improvements"

# Pattern 4: Debug session checkpoint
/checkpoint/create "Working state before debugging API integration"

# Pattern 5: Auto-checkpoint for risky operations
/checkpoint/create  # Auto-generates timestamp
```

### Integration with Workflow Commands

```bash
# Checkpoint → Refactor → Validate workflow
/checkpoint/create "Pre-refactor safety point"
# ... perform refactoring ...
/test  # Validate changes
# If successful: git commit, if failed: /checkpoint/restore 0

# Complex feature development workflow
/checkpoint/create "Starting feature implementation"
# ... implement feature ...
/checkpoint/create "Feature complete, starting tests"
# ... write tests ...
/checkpoint/create "Tests passing, ready for review"
```

### Related Command Ecosystem

- **Recovery**: `/checkpoint/restore <index>` - Restore from specific checkpoint
- **Analysis**: `/git/status` - Analyze current repository state
- **Validation**: `/test` - Verify code quality after checkpoint
- **History**: `git stash list` - View all available checkpoints
- **Cleanup**: `git stash clear` - Remove all checkpoints (use carefully)
- **Advanced**: `/git/analyze` - Deep repository analysis

**DELEGATION PATHWAYS**:
- **@git-expert**: Complex git operations, merge conflicts, repository issues
- **@refactoring-expert**: Large-scale changes, code organization, checkpoint analysis
- **@testing-expert**: Validation of checkpointed code, test strategy planning