# Bug Diagnosis: Invalid Settings File - Plugin Installation Path Mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-28T16:40:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: error

## Summary

Claude Code displays "Found 1 invalid settings file" in the statusline because the `installed_plugins.json` file references a plugin installation path that doesn't exist on the filesystem. The `example-skills@anthropic-agent-skills` plugin is registered with `installPath: "/home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/unknown"` but this directory doesn't exist - the actual cache is at a different hash-named directory (`f23222824449`).

## Environment

- **Application Version**: Claude Code CLI (current)
- **Environment**: development
- **Platform**: Linux (WSL2)
- **Node Version**: Current system version
- **Last Working**: Unknown

## Reproduction Steps

1. Start Claude Code in the project directory
2. Observe the statusline showing "Found 1 invalid settings file · /doctor for details"
3. Attempt to run `/doctor` (which cannot provide details non-interactively)

## Expected Behavior

The statusline should not show any invalid settings file warnings.

## Actual Behavior

Statusline displays: "Found 1 invalid settings file · /doctor for details"

## Diagnostic Data

### Plugin Installation Registry
```json
// ~/.claude/plugins/installed_plugins.json
{
  "version": 2,
  "plugins": {
    "example-skills@anthropic-agent-skills": [
      {
        "scope": "user",
        "installPath": "/home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/unknown",
        "version": "unknown",
        "installedAt": "2025-10-24T21:44:37.679Z",
        "lastUpdated": "2025-10-24T21:44:37.679Z",
        "gitCommitSha": "c74d647e56e6daa12029b6acb11a821348ad044b",
        "isLocal": true
      }
    ],
    "typescript-lsp@claude-plugins-official": [
      {
        "scope": "user",
        "installPath": "/home/msmith/.claude/plugins/cache/claude-plugins-official/typescript-lsp/1.0.0",
        "version": "1.0.0",
        "installedAt": "2026-01-06T14:57:31.443Z",
        "lastUpdated": "2026-01-06T14:57:31.443Z",
        "isLocal": true
      }
    ]
  }
}
```

### Filesystem State
```bash
$ ls -la /home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/unknown
"/home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/unknown": No such file or directory

$ ls -la /home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/
drwxr-xr-x - msmith 22 Jan 12:29 f23222824449

# The actual cache directory contains an orphan marker:
$ cat ~/.claude/plugins/cache/anthropic-agent-skills/example-skills/f23222824449/.orphaned_at
1769102993928
```

### Settings Files Validated
All settings JSON files are syntactically valid:
- `~/.claude/settings.json` - Valid JSON, valid schema
- `.claude/settings.json` - Valid JSON, valid schema
- `.claude/settings.local.json` - Valid JSON, valid schema

### Plugin Reference in Settings
```json
// .claude/settings.json
{
  "enabledPlugins": {
    "example-skills@anthropic-agent-skills": true
  }
}
```

## Related Code
- **Affected Files**:
  - `~/.claude/plugins/installed_plugins.json` - Contains invalid path reference
  - `.claude/settings.json` - References the affected plugin
  - `~/.claude/plugins/cache/anthropic-agent-skills/example-skills/` - Orphaned cache directory
- **Recent Changes**: Plugin was originally installed on 2025-10-24, cache appears to have been orphaned/recreated
- **Suspected Functions**: Claude Code's plugin validation/loading system

## Related Issues & Context

### Historical Context
The plugin installation appears to have become corrupted at some point:
- Original install: 2025-10-24 with `version: "unknown"` and path to `/unknown`
- Cache directory was later recreated at hash `f23222824449` on 2026-01-22
- The orphaned_at marker indicates the cache knows it's disconnected from the registry

This suggests the plugin registry and cache became out of sync, possibly due to:
- Failed plugin update
- Manual cache cleanup
- Plugin system migration between Claude Code versions

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `installed_plugins.json` registry references a plugin installation path (`/unknown`) that doesn't exist on the filesystem, causing Claude Code's settings validation to fail.

**Detailed Explanation**:
The `example-skills@anthropic-agent-skills` plugin entry in `~/.claude/plugins/installed_plugins.json` has two issues:
1. The `installPath` points to `/home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/unknown` which doesn't exist
2. The `version` field is set to `"unknown"` indicating the installation was incomplete or corrupted

Meanwhile, there's an orphaned cache directory at `/home/msmith/.claude/plugins/cache/anthropic-agent-skills/example-skills/f23222824449` with a `.orphaned_at` marker, indicating the plugin system knows there's a disconnected cache but hasn't cleaned it up or reconnected it.

When Claude Code validates the settings, it loads `.claude/settings.json` which references `"example-skills@anthropic-agent-skills": true` in `enabledPlugins`. The validation then checks `installed_plugins.json` to verify the plugin exists, finds the broken path reference, and reports "invalid settings file."

**Supporting Evidence**:
- Path verification showing `/unknown` doesn't exist
- `installed_plugins.json` showing `version: "unknown"` and invalid path
- Orphaned cache with `.orphaned_at` marker at different hash location
- Project settings referencing this plugin as enabled

### How This Causes the Observed Behavior

1. User starts Claude Code
2. Claude Code loads project settings from `.claude/settings.json`
3. Settings include `enabledPlugins: { "example-skills@anthropic-agent-skills": true }`
4. Claude Code validates the plugin reference against `installed_plugins.json`
5. The registry shows `installPath` to a non-existent directory
6. Validation fails, triggering the "Found 1 invalid settings file" warning
7. Warning appears in statusline

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct filesystem verification shows the path mismatch
- The `version: "unknown"` in the registry confirms an incomplete/corrupted installation
- The orphaned cache marker corroborates the broken state
- All other settings files validate correctly (JSON syntax and schema)
- The project settings explicitly reference this plugin

## Fix Approach (High-Level)

Two options to resolve:

**Option A - Reinstall the plugin** (Recommended):
1. Remove the corrupted plugin entry from `installed_plugins.json`
2. Delete the orphaned cache directory
3. Reinstall `example-skills@anthropic-agent-skills` via Claude Code's plugin manager

**Option B - Remove the plugin reference**:
1. Edit `.claude/settings.json` to remove `"example-skills@anthropic-agent-skills": true` from `enabledPlugins`
2. Clean up the orphaned cache and registry entry

## Diagnosis Determination

The "Found 1 invalid settings file" error is caused by a corrupted plugin installation entry in `~/.claude/plugins/installed_plugins.json`. The `example-skills@anthropic-agent-skills` plugin has an `installPath` pointing to a non-existent directory (`/unknown`), while the actual cached plugin data exists at a different location but is marked as orphaned.

The fix requires either reinstalling the plugin to repair the registry entry, or removing the plugin reference from the project settings entirely.

## Additional Context

- The `/doctor` command cannot provide details when run non-interactively (requires raw terminal mode)
- This is a user-level plugin configuration issue, not a project code issue
- The settings files themselves are all valid JSON with correct schema - the validation failure is due to the referenced plugin's broken installation state

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (jq, ls, find, cat), Read, Task (claude-code-guide agent)*
