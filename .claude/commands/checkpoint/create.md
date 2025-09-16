---
description: Create a git stash checkpoint to save current work state without modifying working directory
category: workflow
allowed-tools: Bash(git stash:*), Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)
argument-hint: "[optional description for checkpoint]"
delegation-targets: git-expert
---

# PURPOSE

Create a non-destructive git checkpoint that preserves your exact working state for safe recovery without affecting current files or staging area.

**OUTCOME**: A recoverable checkpoint stored in git stash while maintaining all current changes exactly as they are.

# ROLE

Adopt the role of a **Version Control Safety Expert** who:
- Creates reliable recovery points before risky operations
- Preserves exact working states without disruption
- Validates checkpoint integrity and recoverability
- Provides clear confirmation of what was saved

# INPUTS

Analyze the current git state and checkpoint requirements:

## 1. Current Git Status
!`git status --short`

## 2. Working Directory Changes
!`git diff --stat`

## 3. Staged Changes
!`git diff --cached --stat`

## 4. Recent Checkpoints
!`git stash list --date=relative | head -5`

## 5. Checkpoint Description
```bash
# Parse user-provided description or generate timestamp
if [ -n "$ARGUMENTS" ]; then
  checkpoint_desc="$ARGUMENTS"
else
  checkpoint_desc="$(date +'%Y-%m-%d %H:%M:%S') - Auto-checkpoint"
fi
echo "Checkpoint description: $checkpoint_desc"
```

# METHOD

Execute the checkpoint creation process:

## Phase 1: Pre-Checkpoint Validation

```bash
# Verify git repository exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Check for changes to checkpoint
if [ -z "$(git status --porcelain)" ]; then
  echo "ℹ️ No changes to checkpoint - working directory is clean"
  exit 0
fi

# Count affected files
change_count=$(git status --porcelain | wc -l)
echo "📊 Found $change_count files with changes to checkpoint"
```

## Phase 2: Create Non-Destructive Checkpoint

```bash
# Step 1: Stage all changes temporarily (required for stash create)
echo "📌 Staging all changes for checkpoint..."
git add -A

# Step 2: Create stash object without modifying working directory
echo "💾 Creating checkpoint object..."
stash_sha=$(git stash create "claude-checkpoint: $checkpoint_desc")

if [ -z "$stash_sha" ]; then
  echo "❌ Failed to create checkpoint object"
  git reset  # Unstage files
  exit 1
fi

echo "✅ Created checkpoint object: ${stash_sha:0:8}"

# Step 3: Store the stash object with descriptive message
echo "📝 Storing checkpoint in stash list..."
git stash store -m "claude-checkpoint: $checkpoint_desc" "$stash_sha"

if [ $? -ne 0 ]; then
  echo "❌ Failed to store checkpoint"
  git reset  # Unstage files
  exit 1
fi

# Step 4: Reset index to restore original staging state
echo "🔄 Restoring original staging state..."
git reset

echo "✅ Checkpoint created successfully!"
```

## Phase 3: Verify Checkpoint

```bash
# Show the created checkpoint
latest_stash=$(git stash list -1 --format="%gd: %s")
echo ""
echo "📍 Latest checkpoint:"
echo "  $latest_stash"

# Show checkpoint contents summary
echo ""
echo "📦 Checkpoint contents:"
git stash show "stash@{0}" --stat | head -10

# Calculate checkpoint size
stash_size=$(git stash show "stash@{0}" --stat | tail -1)
echo ""
echo "📊 Checkpoint summary: $stash_size"

# Provide recovery instructions
echo ""
echo "💡 Recovery commands:"
echo "  • View checkpoint:     git stash show stash@{0} -p"
echo "  • Apply checkpoint:    git stash apply stash@{0}"
echo "  • Restore checkpoint:  /checkpoint/restore 0"
```

# EXPECTATIONS

## Success Criteria
- ✅ Checkpoint created without modifying working directory
- ✅ All changes preserved in checkpoint
- ✅ Original staging state maintained
- ✅ Checkpoint accessible via git stash commands
- ✅ Clear confirmation with recovery instructions

## Verification Commands
```bash
# Verify checkpoint was created
git stash list | head -1

# Verify working directory unchanged
git status --short

# Verify checkpoint is recoverable
git stash show stash@{0} > /dev/null && echo "✅ Checkpoint is valid and recoverable"
```

## Error Handling

### Common Issues and Recovery

1. **No git repository**
   - Solution: Initialize git with `git init`

2. **No changes to checkpoint**
   - This is informational, not an error

3. **Stash creation fails**
   - Check disk space: `df -h .`
   - Verify git health: `git fsck`

4. **Previous checkpoints exist**
   - List all: `git stash list`
   - Clean old: `git stash drop stash@{n}`

## Help

### Usage Examples

```bash
# Create checkpoint with auto-generated timestamp
/checkpoint/create

# Create checkpoint with description
/checkpoint/create "Before major refactor"

# Create checkpoint before risky operation
/checkpoint/create "Pre-database migration backup"
```

### Related Commands
- `/checkpoint/restore` - Restore from a checkpoint
- `/git/status` - View current changes
- `git stash list` - View all checkpoints
- `git stash show -p stash@{0}` - View checkpoint details