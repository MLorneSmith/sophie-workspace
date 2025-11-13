# Hook Path Issue Solution

## Problem

After removing the worktree at `/home/msmith/projects/2025slideheroes-auth`, hooks are failing because Claude's session still references the old worktree path.

## Root Cause

Claude appears to cache the project directory from where the session was started. When you start Claude in a worktree and then remove that worktree, Claude continues trying to execute hooks from the non-existent path.

## Solution

### Immediate Fix

**Restart your Claude session from the main repository:**

```bash
cd /home/msmith/projects/2025slideheroes
# Then start a new Claude session
```

### How the Hooks Handle Paths

All ClaudeKit hooks have built-in fallbacks for finding the project root:

1. **Most hooks use:**

   ```bash
   PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
   ```

   This tries in order:
   - `CLAUDE_PROJECT_DIR` environment variable (if set by Claude)
   - Git repository root (works anywhere in the project)
   - Current working directory (fallback)

2. **Some simpler hooks use:**

   ```bash
   PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
   ```

   This uses:
   - `CLAUDE_PROJECT_DIR` environment variable (if set)
   - Current working directory (fallback)

### Best Practices for Worktrees

1. **When switching between worktrees:**
   - Always start a new Claude session in the worktree directory
   - The hooks will automatically adapt to the new location

2. **Before removing a worktree:**
   - Complete your Claude session
   - Or switch to the main repository and start a new session

3. **Testing hooks manually:**

   ```bash
   # From the project root
   cd /home/msmith/projects/2025slideheroes
   bash .claude/hooks/[hook-name].sh
   ```

## Verification

All hooks have been tested and work correctly when called from the proper directory:

- ✓ file-guard.sh
- ✓ biome-format-changed.sh
- ✓ biome-lint-changed.sh
- ✓ thinking-level.sh
- ✓ typecheck-changed.sh
- ✓ check-any-types.sh
- ✓ All other hooks follow the same pattern

## Note

The `${CLAUDE_PROJECT_DIR}` variable in `.claude/settings.json` is correct and should NOT be changed to absolute paths. This allows the hooks to work properly across different worktrees and environments.
