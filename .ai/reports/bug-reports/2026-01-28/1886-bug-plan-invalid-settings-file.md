# Bug Fix: Invalid Settings File - Plugin Installation Path Mismatch

**Related Diagnosis**: #1884
**Severity**: low
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `installed_plugins.json` references non-existent plugin path `/unknown` while orphaned cache exists at different location
- **Fix Approach**: Remove corrupted plugin entry from registry and delete orphaned cache
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Claude Code displays "Found 1 invalid settings file" in the statusline because the plugin registry (`~/.claude/plugins/installed_plugins.json`) contains a broken entry for `example-skills@anthropic-agent-skills` with:
- `installPath` pointing to non-existent `/unknown` directory
- `version` set to `"unknown"` indicating incomplete installation
- Orphaned cache at different path with `.orphaned_at` marker

The project's `.claude/settings.json` references this plugin as enabled, causing validation to fail.

For full details, see diagnosis issue #1884.

### Solution Approaches Considered

#### Option 1: Remove Corrupted Plugin Entry ⭐ RECOMMENDED

**Description**: Delete the broken plugin entry from `~/.claude/plugins/installed_plugins.json` and remove the orphaned cache directory. This is the simplest solution for a corrupted installation that's not actively used.

**Pros**:
- Simplest fix (delete 2 things: registry entry + cache directory)
- No risk of re-introducing the broken state
- Immediately resolves the validation error
- User can reinstall the plugin later if needed
- Zero impact on other functionality

**Cons**:
- User loses access to the plugin (though it was broken anyway)
- Requires manual action from user

**Risk Assessment**: Low - only removes broken entries that are already non-functional

**Complexity**: simple - straightforward file deletion

#### Option 2: Repair the Plugin Entry

**Description**: Update the `installed_plugins.json` entry to point to the actual cache location and fix the version field.

**Pros**:
- Preserves the plugin installation
- Keeps the cached plugin data

**Cons**:
- The cache is marked orphaned (`.orphaned_at`), indicating it's disconnected
- Updating the path is a band-aid that doesn't fix the underlying corruption
- Risk of the plugin not working properly even after repair attempt
- More complex than just removing it

**Why Not Chosen**: Band-aid approach that doesn't address the root corruption. The `.orphaned_at` marker suggests the plugin system itself has flagged this as invalid. Better to clean up and let user reinstall fresh if needed.

#### Option 3: Uninstall via Plugin Manager

**Description**: Use Claude Code's plugin manager to officially uninstall the plugin, which would handle cleanup properly.

**Why Not Chosen**: The plugin system itself is in a broken state - it can't uninstall what's broken. Need to clean up manually first, then user can use plugin manager for future operations.

### Selected Solution: Remove Corrupted Plugin Entry

**Justification**: This is a corrupted, non-functional plugin installation. The cleanest fix is to remove the broken registry entry and orphaned cache. This:
- Immediately resolves the validation error
- Prevents future issues from the corrupted entry
- Allows fresh reinstallation later if needed
- Has zero risk of side effects
- Requires minimal changes

**Technical Approach**:
1. Remove the `example-skills@anthropic-agent-skills` entry from `~/.claude/plugins/installed_plugins.json`
2. Delete the orphaned cache directory at `~/.claude/plugins/cache/anthropic-agent-skills/example-skills/`
3. Optionally, remove the plugin reference from `.claude/settings.json` (safest approach)
4. Restart Claude Code to verify the error is gone

**Architecture Changes**: None - this is purely user-level configuration cleanup

**Migration Strategy**: Not needed - this is a cleanup operation

## Implementation Plan

### Affected Files

- `~/.claude/plugins/installed_plugins.json` - Remove broken `example-skills@anthropic-agent-skills` entry
- `~/.claude/plugins/cache/anthropic-agent-skills/example-skills/` - Delete entire orphaned directory
- `.claude/settings.json` (optional) - Remove `"example-skills@anthropic-agent-skills": true` from `enabledPlugins` if user wants to keep settings clean

### New Files

None

### Step-by-Step Tasks

IMPORTANT: Execute every step in order. The fix only requires steps 1-2; steps 3-4 are optional enhancements.

#### Step 1: Remove Plugin Entry from Registry

Update `~/.claude/plugins/installed_plugins.json` to remove the broken plugin entry.

- Read the current `installed_plugins.json` file
- Locate the `example-skills@anthropic-agent-skills` entry
- Delete the entire entry (including the surrounding array item)
- Verify the JSON is still valid after removal

**Why this step first**: The registry entry is what causes the validation error. Removing it stops the error immediately.

**Note**: This step modifies a user-level file, not project code.

#### Step 2: Delete Orphaned Cache Directory

Remove the orphaned cache directory that contains the broken plugin files.

- Delete directory: `~/.claude/plugins/cache/anthropic-agent-skills/example-skills/`
- Verify directory is removed

**Why this step**: Cleans up orphaned files and prevents confusion about the broken state.

#### Step 3: (Optional) Remove Plugin Reference from Project Settings

Edit `.claude/settings.json` to remove the plugin reference.

- Edit `.claude/settings.json`
- Remove `"example-skills@anthropic-agent-skills": true` from the `enabledPlugins` object (but keep other plugins)
- Verify JSON is valid

**Why optional**: With the registry entry and cache removed, this becomes a no-op (Claude Code will ignore the missing plugin). However, removing it keeps settings clean.

#### Step 4: Verify Fix

Restart Claude Code and confirm the error is gone.

- Restart Claude Code in the project directory
- Check that statusline no longer shows "Found 1 invalid settings file"
- Verify no other issues have appeared

## Testing Strategy

### Verification Steps

Before fix:
- [ ] Reproduce original issue: Start Claude Code, see "Found 1 invalid settings file" in statusline

After fix (Steps 1-2):
- [ ] Verify registry entry is removed: `jq '.plugins | keys' ~/.claude/plugins/installed_plugins.json` should not list `example-skills@anthropic-agent-skills`
- [ ] Verify cache directory is deleted: `ls ~/.claude/plugins/cache/anthropic-agent-skills/` should show no `example-skills` directory (or show "No such file")
- [ ] Restart Claude Code and verify statusline error is gone
- [ ] Verify JSON syntax is valid: `jq . ~/.claude/plugins/installed_plugins.json` should succeed

After optional Step 3:
- [ ] Verify enabledPlugins is valid JSON: `jq '.enabledPlugins' .claude/settings.json` should show valid object
- [ ] Verify other plugins in settings are still enabled (if any)

### Manual Testing Checklist

- [ ] Run `jq . ~/.claude/plugins/installed_plugins.json` - should show valid JSON without the broken plugin
- [ ] Run `jq . .claude/settings.json` - should show valid JSON
- [ ] Start Claude Code - should start normally without validation errors
- [ ] Check statusline - should not display "Found 1 invalid settings file"
- [ ] Run `/doctor` command - should complete without mentioning invalid settings
- [ ] Verify project still works normally - no regressions

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Incomplete cleanup**: User deletes registry entry but not cache, or vice versa
   - **Likelihood**: Medium (manual steps)
   - **Impact**: Low (settings error would persist or cache would linger, but harmless)
   - **Mitigation**: Provide clear shell commands to do cleanup; use Find/Replace for JSON editing to ensure correct removal

2. **Invalid JSON after editing**: User accidentally breaks JSON syntax while removing plugin entry
   - **Likelihood**: Medium (manual JSON editing)
   - **Impact**: Medium (Claude Code might fail to start or show different errors)
   - **Mitigation**: Provide exact JSON snippets to remove; validate with `jq` before restarting

3. **Removing wrong entry**: User deletes a different plugin entry by mistake
   - **Likelihood**: Low (instructions are clear)
   - **Impact**: Low-Medium (would break a different plugin)
   - **Mitigation**: Provide specific search strings for the exact entry to remove

**Rollback Plan**:

If something goes wrong:

1. Restore `~/.claude/plugins/installed_plugins.json` from backup or git history (if backed up)
2. Restore cache directory from backup (if backed up)
3. Restart Claude Code
4. Try again more carefully, or ask for manual help

If no backup exists:
1. Simply restart Claude Code (it should auto-recover or show different errors)
2. Worst case: Reinstall Claude Code to reset plugin state

**Monitoring**: None needed - this is a one-time cleanup

## Performance Impact

**Expected Impact**: None

No performance implications. This only affects startup validation and error display.

## Security Considerations

**Security Impact**: None

The corrupted plugin cannot execute (path doesn't exist), so there's no security risk. Removal is purely protective.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check Claude Code statusline shows error
claude --version  # Start Claude Code, observe statusline

# Verify broken registry entry exists
jq '.plugins["example-skills@anthropic-agent-skills"]' ~/.claude/plugins/installed_plugins.json

# Verify orphaned cache exists
ls -la ~/.claude/plugins/cache/anthropic-agent-skills/example-skills/
```

**Expected Result**:
- Statusline shows "Found 1 invalid settings file"
- Registry entry returns a non-empty object with `installPath` containing `/unknown`
- Cache directory exists at `f23222824449`

### After Fix (Bug Should Be Resolved)

```bash
# Validate JSON syntax
jq . ~/.claude/plugins/installed_plugins.json

# Validate project settings
jq . .claude/settings.json

# Verify broken entry is gone
jq '.plugins | keys' ~/.claude/plugins/installed_plugins.json | grep -c example-skills  # Should return 0 or grep should find nothing

# Verify cache is removed
ls ~/.claude/plugins/cache/anthropic-agent-skills/example-skills/ 2>&1 | grep -i "no such file"  # Should show "No such file"

# Start Claude Code and check statusline
claude --version  # Observe statusline has no error
```

**Expected Result**:
- All validation commands succeed
- No "invalid settings file" error in statusline
- Plugin entry is removed from registry
- Cache directory is removed or empty

### Regression Prevention

```bash
# Verify other plugins still work
jq '.plugins | keys' ~/.claude/plugins/installed_plugins.json  # Should show remaining plugins

# Verify no new settings issues
jq 'keys' ~/.claude/plugins/installed_plugins.json  # Should show valid structure

# Quick settings validation
jq 'keys' ~/.claude/settings.json .claude/settings.json .claude/settings.local.json 2>/dev/null  # All should be valid
```

## Dependencies

**No new dependencies required**

This fix only requires:
- `jq` (for JSON validation) - already available
- Shell commands (`rm`, `ls`, `grep`) - standard utilities

## Database Changes

**No database changes required**

This only affects Claude Code's local plugin registry and cache.

## Deployment Considerations

**Deployment Risk**: None

This is a user-level tool configuration fix, not a code deployment.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained

The project code is unaffected. The fix only cleans up corrupted local tool state.

## Success Criteria

The fix is complete when:
- [ ] `installed_plugins.json` no longer contains `example-skills@anthropic-agent-skills` entry
- [ ] Orphaned cache directory at `~/.claude/plugins/cache/anthropic-agent-skills/example-skills/` is deleted
- [ ] Claude Code starts without "Found 1 invalid settings file" error in statusline
- [ ] JSON validation passes: `jq . ~/.claude/plugins/installed_plugins.json`
- [ ] Settings validation passes: `jq . .claude/settings.json`
- [ ] `/doctor` command completes without mentioning invalid settings (if run interactively)
- [ ] No regressions: All other Claude Code functionality works normally

## Notes

- This fix is specific to the user's local Claude Code environment, not project code
- The `example-skills@anthropic-agent-skills` plugin can be reinstalled later if needed through Claude Code's plugin manager
- Similar issues can occur with other plugins if their installations become corrupted; the same cleanup approach applies
- The `.orphaned_at` marker indicates Claude Code detected the corruption; cleanup prevents future issues

**Related Documentation**:
- Claude Code CLI reference and settings documentation
- Plugin system documentation in Claude Code's official docs

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1884*
