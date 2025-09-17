---
description: Restore project files to a previous checkpoint with automatic backup of current changes
category: workflow
allowed-tools: Bash(git stash:*), Bash(git status:*), Bash(git reset:*), Bash(grep:*), Bash(head:*), Bash(git diff:*)
argument-hint: "[checkpoint-number|latest]"
delegation-targets: git-expert
---

# PURPOSE

Safely restore your project to a previous checkpoint while automatically preserving any current uncommitted changes for recovery.

**OUTCOME**: Project state restored to selected checkpoint with current changes safely backed up.

# ROLE

Adopt the role of a **State Recovery Specialist** who:
- Safely transitions between project states
- Preserves all work through automatic backups
- Handles conflicts and edge cases gracefully
- Provides clear recovery paths for all scenarios

# INPUTS

Analyze available checkpoints and current state:

## 1. Available Checkpoints
!`git stash list | grep "claude-checkpoint" | nl -v 0`

## 2. Current Working State
!`git status --short`

## 3. Uncommitted Changes
!`git diff --stat`

## 4. Target Checkpoint
```bash
# Parse checkpoint selection
if [ -z "$ARGUMENTS" ] || [ "$ARGUMENTS" = "latest" ]; then
  # Find most recent claude-checkpoint
  target_ref=$(git stash list | grep -m1 "claude-checkpoint" | cut -d: -f1)
  if [ -z "$target_ref" ]; then
    echo "❌ No checkpoints found. Create one with /checkpoint/create"
    exit 1
  fi
  echo "Target: Latest checkpoint ($target_ref)"
elif [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  # Validate numeric reference
  target_ref="stash@{$ARGUMENTS}"
  checkpoint_check=$(git stash list "$target_ref" 2>/dev/null | grep "claude-checkpoint")
  if [ -z "$checkpoint_check" ]; then
    echo "❌ stash@{$ARGUMENTS} is not a valid claude-checkpoint"
    git stash list | grep "claude-checkpoint" | head -5
    exit 1
  fi
  echo "Target: Checkpoint #$ARGUMENTS ($target_ref)"
else
  echo "❌ Invalid argument: $ARGUMENTS"
  echo "Use a number (0-9) or 'latest'"
  exit 1
fi
```

# METHOD

Execute the restore process with safety checks:

## Phase 1: Pre-Restore Safety

```bash
# Check for uncommitted changes that need backup
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Found uncommitted changes - creating safety backup..."

  # Create timestamped backup
  backup_time=$(date +"%Y-%m-%d_%H:%M:%S")
  git stash push -m "claude-restore-backup: $backup_time" --include-untracked

  if [ $? -eq 0 ]; then
    echo "✅ Current changes backed up as: stash@{0}"
    echo "   Message: claude-restore-backup: $backup_time"
    backup_created=true
    # Adjust target reference due to new stash
    if [[ "$target_ref" =~ stash@\{([0-9]+)\} ]]; then
      new_index=$((${BASH_REMATCH[1]} + 1))
      target_ref="stash@{$new_index}"
      echo "📍 Adjusted target to: $target_ref"
    fi
  else
    echo "❌ Failed to create backup - aborting restore"
    exit 1
  fi
else
  echo "ℹ️ Working directory is clean - no backup needed"
  backup_created=false
fi
```

## Phase 2: Apply Checkpoint

```bash
# Display checkpoint details before applying
echo ""
echo "📋 Restoring checkpoint:"
git stash list "$target_ref" --format="%gd: %s"

echo ""
echo "📦 Checkpoint contents:"
git stash show "$target_ref" --stat | head -10

# Apply the checkpoint (preserve it with apply, not pop)
echo ""
echo "🔄 Applying checkpoint..."
git stash apply "$target_ref"

if [ $? -eq 0 ]; then
  echo "✅ Checkpoint restored successfully!"
else
  echo "⚠️ Conflicts detected during restore"
  echo ""
  echo "Conflict resolution options:"
  echo "1. Resolve conflicts manually in affected files"
  echo "2. Abort restore: git reset --hard && git stash pop stash@{0}"
  echo "3. Accept checkpoint version: git checkout --theirs ."
  echo "4. Keep current version: git checkout --ours ."
fi
```

## Phase 3: Post-Restore Verification

```bash
# Show restoration results
echo ""
echo "📊 Restoration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━"

# List restored checkpoint
restored_msg=$(git stash list "$target_ref" --format="%s" | sed 's/claude-checkpoint: //')
echo "✅ Restored to: $restored_msg"

# Show current state
echo ""
echo "📂 Current working state:"
git status --short | head -10

# Provide recovery information if backup was created
if [ "$backup_created" = true ]; then
  echo ""
  echo "💾 Recovery Information:"
  echo "━━━━━━━━━━━━━━━━━━━━━━"
  echo "Your previous changes are safely backed up."
  echo ""
  echo "Recovery commands:"
  echo "  • View backup:    git stash show stash@{0} -p"
  echo "  • Apply backup:   git stash apply stash@{0}"
  echo "  • Merge backup:   git stash pop stash@{0}"
fi

# List other available checkpoints
echo ""
echo "📍 Other available checkpoints:"
git stash list | grep "claude-checkpoint" | head -5 | nl -v 0
```

# EXPECTATIONS

## Success Criteria
- ✅ Target checkpoint correctly identified
- ✅ Current changes backed up if present
- ✅ Checkpoint applied without data loss
- ✅ Clear recovery paths provided
- ✅ Conflicts handled gracefully

## Verification Commands
```bash
# Verify restoration
git status

# Check if backup exists (if created)
git stash list | head -1

# Confirm checkpoint still available
git stash list | grep "claude-checkpoint"
```

## Error Handling

### Common Scenarios

1. **No checkpoints exist**
   - Solution: Create checkpoint first with `/checkpoint/create`

2. **Merge conflicts during restore**
   - View conflicts: `git status`
   - Resolve manually or use `git checkout --theirs/--ours`

3. **Wrong checkpoint restored**
   - Revert: `git reset --hard`
   - Restore backup: `git stash pop stash@{0}`
   - Try again with correct number

4. **Stash index confusion**
   - List all: `git stash list | nl -v 0`
   - Use explicit references

## Help

### Usage Examples

```bash
# Restore to latest checkpoint
/checkpoint/restore

# Restore to specific checkpoint
/checkpoint/restore 2

# Restore after viewing list
git stash list | grep claude-checkpoint
/checkpoint/restore 3
```

### Recovery Workflows

```bash
# Undo a restore
git reset --hard
git stash pop stash@{0}  # Restore your backup

# Apply multiple checkpoints
/checkpoint/restore 2
git stash apply stash@{3}  # Layer another checkpoint

# Clean up old checkpoints
git stash list | grep -v claude-checkpoint | wc -l
git stash clear  # Remove all (use with caution)
```

### Related Commands
- `/checkpoint/create` - Create new checkpoints
- `/git/status` - View current state
- `git stash list` - View all stashes
- `git reflog` - View git history for recovery