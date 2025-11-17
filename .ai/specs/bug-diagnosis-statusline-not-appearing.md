# Bug Diagnosis: Claude Code Statusline Not Appearing

**ID**: ISSUE-TBD (pending GitHub issue creation)
**Created**: 2025-11-15T16:30:00Z
**Reporter**: msmith
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The custom Claude Code statusline implemented in `.claude/statusline/statusline.sh` is not appearing when running Claude Code, despite being properly configured in the `.claude/statusline/` directory. Restarting Claude Code did not resolve the issue. The root cause is that the statusline script lacks execute permissions, preventing Claude Code from running it.

## Environment

- **Application Version**: Claude Code (latest)
- **Environment**: development
- **OS**: Linux (WSL2) - Linux 6.6.87.2-microsoft-standard-WSL2
- **Platform**: linux
- **Git Branch**: dev
- **Last Commit**: 8d7f23303 docs(tooling): reorganize tool documentation and update integrations
- **Last Working**: Never worked - newly implemented statusline

## Reproduction Steps

1. Implement custom statusline script at `.claude/statusline/statusline.sh`
2. Open Claude Code in the project directory
3. Observe that the custom statusline does not appear
4. Restart Claude Code
5. Statusline still does not appear

## Expected Behavior

The custom statusline should display:

- Model name (e.g., "claude sonnet 4.5")
- Current git branch (e.g., "⎇ dev")
- Build status (🟢/🟡/🔴 indicators)
- Test status
- Codecheck status
- Docker status
- CI/CD status
- PR status

Example expected output:

```
claude sonnet 4.5 | ⎇ dev | 🟢 build (5m) | 🟢 codecheck (5m) | 🟢 docker (3/3) | 🟢 test (10m)
```

## Actual Behavior

No custom statusline appears in Claude Code. The default statusline (if any) is shown instead.

## Diagnostic Data

### File Permissions Check

```bash
$ ls -la .claude/statusline/statusline.sh
.rw-r--r-- 19k msmith 15 Nov 11:39 .claude/statusline/statusline.sh
```

**Key Finding**: File has permissions `-rw-r--r--` (644), which does NOT include execute permission.

### Script Execution Test

```bash
$ echo '{"model":{"display_name":"Claude Sonnet 4.5"}}' | .claude/statusline/statusline.sh
Exit code 126
(eval):1: permission denied: .claude/statusline/statusline.sh
```

**Result**: Permission denied error confirms the script is not executable.

### Configuration Check

**`.claude/settings.json` status**: File exists but does NOT contain statusline configuration.

Current configuration only includes:

- permissions (allow/deny lists)
- hooks (PreToolUse, PostToolUse, Notification, Stop, SubagentStop)

**Missing configuration**: No `statusLine` configuration block.

According to Claude Code documentation, the required configuration should be:

```json
{
  "statusLine": {
    "type": "command",
    "command": ".claude/statusline/statusline.sh",
    "padding": 0
  }
}
```

## Error Stack Traces

```
Permission denied when attempting to execute .claude/statusline/statusline.sh
Exit code: 126
```

## Related Code

- **Affected Files**:
  - `.claude/statusline/statusline.sh` (main statusline script - lacks execute permission)
  - `.claude/settings.json` (missing statusLine configuration)
  - `.claude/statusline/lib/status-common.sh` (shared library)
  - `.claude/statusline/aliases.sh` (shell aliases)
  - `.claude/statusline/*-wrapper.sh` (build, test, codecheck wrappers)

- **Recent Changes**:
  - `8d7f23303` - docs(tooling): reorganize tool documentation and update integrations
  - `752dcccd2` - chore(tooling): archive legacy .claude directory files
  - Statusline implementation appears to be recent addition

- **Suspected Functions**: None (configuration issue, not code issue)

## Related Issues & Context

### Direct Predecessors

- #440 (CLOSED): "Docker-health component in Claude Code statusline not refreshing" - Previous statusline functionality issue, shows statusline was working before

### Related Infrastructure Issues

- #423 (CLOSED): "Task: Add statusline integration with emoji indicators" - Original statusline implementation task
- #416 (CLOSED): "Feature: docker-health - Real-time Docker container monitoring in statusline" - Docker monitoring feature

### Similar Symptoms

- #602 (CLOSED): "Bug Fix: MCP Servers Not Appearing in Claude Code" - Similar configuration/visibility issue
- #601 (CLOSED): "Bug Diagnosis: MCP Servers Not Appearing in Claude Code" - Similar pattern of feature not appearing

### Historical Context

The project has had a working statusline implementation previously (evidenced by issues #440, #423, #416). Recent reorganization of tool documentation (commit 8d7f23303) and archiving of legacy .claude files (commit 752dcccd2) may have resulted in:

1. Loss of execute permissions during file reorganization
2. Missing statusLine configuration in `.claude/settings.json`

## Root Cause Analysis

### Identified Root Cause

**Summary**: The statusline script is not appearing because it lacks both (1) execute permissions and (2) configuration in `.claude/settings.json`.

**Detailed Explanation**:

There are TWO separate issues preventing the statusline from appearing:

1. **Missing Execute Permissions**: The `.claude/statusline/statusline.sh` file has permissions `644` (`-rw-r--r--`) instead of `755` (`-rwxr-xr-x`). According to Claude Code documentation: "If your status line doesn't appear, check that your script is executable (`chmod +x`)". When attempting to execute the script, it returns error code 126 (permission denied).

2. **Missing Configuration**: The `.claude/settings.json` file does not contain a `statusLine` configuration block. According to Claude Code documentation, the statusline must be configured in `.claude/settings.json`:

   ```json
   {
     "statusLine": {
       "type": "command",
       "command": ".claude/statusline/statusline.sh",
       "padding": 0
     }
   }
   ```

   Without this configuration, Claude Code doesn't know to use the custom statusline script.

**Supporting Evidence**:

1. File permissions output shows `644` instead of `755`:

   ```
   .rw-r--r-- 19k msmith 15 Nov 11:39 .claude/statusline/statusline.sh
   ```

2. Direct execution fails with permission error:

   ```
   Exit code 126
   permission denied: .claude/statusline/statusline.sh
   ```

3. `.claude/settings.json` inspection shows no `statusLine` configuration block (file contains only `permissions` and `hooks` sections)

4. Claude Code official documentation states execute permissions and settings.json configuration are required

5. Git history shows recent reorganization (`8d7f23303`, `752dcccd2`) that may have affected file permissions and configuration

### How This Causes the Observed Behavior

The causal chain is straightforward:

1. User implemented custom statusline script in `.claude/statusline/statusline.sh`
2. Claude Code starts and reads `.claude/settings.json`
3. No `statusLine` configuration is found, so Claude Code does not attempt to use custom statusline
4. Even if configuration were present, the script lacks execute permission (644), so Claude Code could not run it (would receive permission denied error)
5. Claude Code falls back to default behavior (no custom statusline)
6. User sees no custom statusline in the interface

### Confidence Level

**Confidence**: High

**Reasoning**:

1. **Verified execute permission issue**: Direct test confirms permission denied error (exit code 126)
2. **Verified missing configuration**: Inspection of `.claude/settings.json` confirms no `statusLine` block exists
3. **Official documentation confirms requirements**: Claude Code docs explicitly state both execute permission and settings.json configuration are required
4. **Reproducible test**: Simple test command definitively proves the script cannot execute
5. **Common pattern**: This matches the #1 troubleshooting tip in Claude Code documentation for statusline issues

This is not a symptom - these are the actual root causes. Both issues must be fixed for the statusline to appear.

## Fix Approach (High-Level)

Two changes are required to fix this issue:

1. **Add execute permissions**: Run `chmod +x .claude/statusline/statusline.sh` to make the script executable (change from 644 to 755 permissions)

2. **Add statusline configuration**: Add the following configuration block to `.claude/settings.json`:

   ```json
   {
     "statusLine": {
       "type": "command",
       "command": ".claude/statusline/statusline.sh",
       "padding": 0
     }
   }
   ```

After both changes, restart Claude Code to load the new configuration and display the custom statusline.

## Diagnosis Determination

**Root cause definitively identified**: The statusline is not appearing due to two configuration issues:

1. The statusline script file (`.claude/statusline/statusline.sh`) lacks execute permissions (has 644 instead of 755)
2. The `.claude/settings.json` file is missing the required `statusLine` configuration block

Both issues were confirmed through:

- Direct file permission inspection (`ls -la`)
- Execution test showing permission denied error (exit code 126)
- Configuration file inspection showing missing `statusLine` block
- Cross-reference with official Claude Code documentation requirements

The fix is straightforward: add execute permissions and add the configuration block to settings.json.

## Additional Context

### Related Files to Update

When fixing this issue, also ensure execute permissions on related scripts:

- `.claude/statusline/lib/status-common.sh`
- `.claude/statusline/build-wrapper.sh`
- `.claude/statusline/test-wrapper.sh`
- `.claude/statusline/codecheck-wrapper.sh`

These scripts are referenced in the statusline ecosystem and should also be executable.

### Verification Steps

After applying the fix:

1. Verify permissions: `ls -la .claude/statusline/*.sh` should show `-rwxr-xr-x`
2. Test script execution: `echo '{"model":{"display_name":"Claude Sonnet 4.5"}}' | .claude/statusline/statusline.sh` should output statusline text
3. Verify configuration: `.claude/settings.json` contains `statusLine` block
4. Restart Claude Code
5. Confirm custom statusline appears in the Claude Code interface

---
*Generated by Claude Debug Assistant*
*Tools Used: ls, git, gh, Read, Bash, WebFetch (Claude Code documentation)*
