# Bash Working Directory Management

## Overview

The `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR` environment variable controls how Claude handles directory changes during bash command execution.

## Current Setting

```bash
export CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1
```

## What It Does

When set to `1`, this flag ensures that the working directory remains constant across all bash commands in a Claude session. This prevents confusion where Claude might execute `cd some-directory && command` and then subsequent commands unexpectedly run from the changed directory.

## The Worktree Challenge

While this flag improves general stability, it creates challenges when working with git worktrees:

### Problem

- Commands like `cd /path/to/worktree` don't persist
- The working directory always resets to the original project root
- This makes it difficult to work in alternate worktrees

### Solution Patterns

1. **Use Subshells** (Recommended)

   ```bash
   (cd /path/to/worktree && command)
   ```

2. **Enable Worktree Mode**

   ```bash
   source ~/.zshrc && claude-wt
   export CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=0
   cd /path/to/worktree
   ```

3. **Update Scripts**
   - Avoid bare `cd` commands in scripts
   - Use subshells for directory-specific operations
   - Example fix applied to `create-worktree-enhanced.sh`:

   ```bash
   # Before (problematic)
   cd "$WORKTREE_PATH"
   pnpm install --frozen-lockfile
   
   # After (fixed)
   (cd "$WORKTREE_PATH" && pnpm install --frozen-lockfile)
   ```

## Key Learnings

1. **Default Behavior**: Keep `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1` as default for stability
2. **Worktree Operations**: Use subshells or temporarily disable the flag when needed
3. **Script Design**: Always use subshells in scripts that need to change directories
4. **Explicit Paths**: When in doubt, use absolute paths instead of relying on directory changes

## Best Practices

### For General Use

- Keep the flag enabled (`=1`) for predictable behavior
- Use absolute paths when referencing files
- Group directory-dependent commands in subshells

### For Worktree Operations

```bash
# Pattern 1: Quick operations
(cd /path/to/worktree && git status)

# Pattern 2: Extended work
source ~/.zshrc && claude-wt  # Enables worktree mode
cd /path/to/worktree           # Now persists
# ... do work ...
```

### For Script Development

- Always test scripts with the flag enabled
- Use subshells for any directory changes
- Document when a script requires specific directory context

## Related Scripts

- `.claude/scripts/worktree/create-worktree-enhanced.sh` - Updated to handle this flag
- `.claude/scripts/worktree/change-worktree.sh` - Outputs path for manual navigation
- `.claude/scripts/worktree/remove-worktree.sh` - Uses subshells for directory operations

## References

- Original issue discovered: Directory changes in worktree setup not persisting
- Solution source: Claude's bash execution environment documentation
- Implementation date: September 11, 2025
