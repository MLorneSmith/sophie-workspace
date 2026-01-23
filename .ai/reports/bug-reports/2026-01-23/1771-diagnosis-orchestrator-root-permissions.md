# Bug Diagnosis: Alpha Orchestrator Claude Code Root Permissions Error

**ID**: ISSUE-pending
**Created**: 2026-01-23T17:45:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: regression

## Summary

The Alpha spec orchestrator fails to implement any tasks due to Claude Code CLI refusing to run with `--dangerously-skip-permissions` in the E2B sandbox environment. The error "cannot be used with root/sudo privileges for security reasons" occurs repeatedly, causing an infinite retry loop that consumes 100% CPU for 33+ minutes without completing any work.

## Environment

- **Application Version**: Current dev branch (commit a3e027b99)
- **Environment**: Development (E2B sandboxes)
- **Node Version**: 20.x
- **E2B SDK Version**: 2.8.2
- **Claude Code CLI Version**: 2.0.10+ (with root restriction)
- **Last Working**: Before Claude Code 2.0.10 introduced root/sudo restriction

## Reproduction Steps

1. Start the spec orchestrator: `tsx spec-orchestrator.ts 1692`
2. Wait for sandbox creation and feature assignment
3. Observe sbx-a log showing repeated failures with root permissions error
4. Note 100% CPU usage on sbx-a with no task completion after 33 minutes

## Expected Behavior

Claude Code should execute `/alpha:implement` commands in the E2B sandbox and complete tasks.

## Actual Behavior

Claude Code immediately exits with:
```
--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons
```

The orchestrator's retry mechanism then spawns a new PTY session repeatedly (706 times in the log), consuming CPU and never making progress. Sandboxes sbx-b and sbx-c remain idle waiting for S1692.I1.F1 to complete.

## Diagnostic Data

### Console Output
```
[PTY] Creating PTY session at 2026-01-23T17:20:36.926Z
[PTY] PTY created with PID 8008
[PTY] Sending command: run-claude "/alpha:implement S1692.I1.F1"
/home/user/project $ run-claude "/alpha:implement S1692.I1.F1"
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement S1692.I1.F1
--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons
/home/user/project $ exit $?
logout
```

### Progress Files
sbx-a-progress.json:
```json
{
  "sandbox_id": "i2ffpoawvov68036vdlbv",
  "status": "running",
  "phase": "executing",
  "recent_output": [
    "--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons"
  ]
}
```

sbx-b-progress.json / sbx-c-progress.json:
```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (18 features blocked)"
}
```

### Error Stack Traces
No stack trace - Claude Code exits immediately with exit code 1 before starting.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/environment.ts` - Missing `IS_SANDBOX=1` env var
  - `.ai/alpha/scripts/lib/feature.ts:470-476` - PTY envs passed without IS_SANDBOX
  - `packages/e2b/e2b-template/template.ts:95` - run-claude script uses --dangerously-skip-permissions
- **Recent Changes**: Claude Code CLI version 2.0.10 introduced root/sudo restriction (GitHub issue anthropics/claude-code#9184)
- **Suspected Functions**: `getAllEnvVars()` in environment.ts

## Related Issues & Context

### External Reference
- [anthropics/claude-code#9184](https://github.com/anthropics/claude-code/issues/9184): "--dangerously-skip-permissions cannot be used with root/sudo privileges"
  - **Workaround documented**: Set `IS_SANDBOX=1` environment variable

### Historical Context
This is a regression caused by an upstream Claude Code CLI security change, not a change in the orchestrator code itself.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `getAllEnvVars()` function in `environment.ts` does not include `IS_SANDBOX=1`, which is required by Claude Code CLI 2.0.10+ to allow `--dangerously-skip-permissions` when running in a root-like environment.

**Detailed Explanation**:

1. Claude Code CLI version 2.0.10+ added a security restriction that prevents `--dangerously-skip-permissions` from being used when running as root or with sudo privileges.

2. E2B sandboxes run with elevated privileges by default (even when the PTY shows `user@e2b`, the environment is detected as root-like by Claude Code).

3. The `run-claude` helper script in the E2B template uses `--dangerously-skip-permissions`:
   ```bash
   unbuffer bash -c "echo \"$1\" | claude -p --setting-sources user,project --dangerously-skip-permissions"
   ```

4. Claude Code provides a documented workaround: setting `IS_SANDBOX=1` environment variable signals to Claude Code that the environment is intentionally sandboxed and the user accepts the risk.

5. The `getAllEnvVars()` function that provides environment variables to the sandbox does NOT include `IS_SANDBOX=1`.

**Supporting Evidence**:
- Log shows 706 occurrences of the error message
- GitHub issue anthropics/claude-code#9184 documents the workaround
- Comment from user @sammrai: "`IS_SANDBOX=1 claude --dangerously-skip-permissions` works fine for me" (20+ thumbs up)

### How This Causes the Observed Behavior

1. Orchestrator creates sandbox and assigns feature S1692.I1.F1
2. PTY session created with envs from `getAllEnvVars()` (missing IS_SANDBOX)
3. `run-claude` script invokes Claude Code with `--dangerously-skip-permissions`
4. Claude Code detects elevated privileges and rejects the flag
5. Claude Code exits immediately with error
6. PTY completes but feature status remains "in_progress" or "undefined"
7. Orchestrator detects timeout/failure and retries with new PTY
8. Steps 2-7 repeat indefinitely (~706 times in 33 minutes)
9. sbx-b and sbx-c remain idle waiting for F1 to complete (blocking entire spec)

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message is explicit and unambiguous
- The workaround is documented in the upstream GitHub issue with community confirmation
- The `getAllEnvVars()` function clearly does not include `IS_SANDBOX`
- The fix is straightforward and low-risk

## Fix Approach (High-Level)

Add `IS_SANDBOX=1` to the `getAllEnvVars()` function in `.ai/alpha/scripts/lib/environment.ts`:

```typescript
export function getAllEnvVars(): Record<string, string> {
    const envs: Record<string, string> = {};

    // Signal to Claude Code that this is a sandboxed environment
    // Required since Claude Code 2.0.10 to allow --dangerously-skip-permissions
    // See: https://github.com/anthropics/claude-code/issues/9184
    envs.IS_SANDBOX = "1";

    // ... rest of function
}
```

Alternatively, add it to the PTY envs in `feature.ts`:
```typescript
envs: {
    ...getAllEnvVars(),
    IS_SANDBOX: "1",  // Required for --dangerously-skip-permissions
    TERM: "xterm-256color",
    // ...
}
```

## Diagnosis Determination

Root cause conclusively identified: Missing `IS_SANDBOX=1` environment variable prevents Claude Code CLI from accepting `--dangerously-skip-permissions` in the E2B sandbox environment.

## Additional Context

- The issue is a regression from Claude Code CLI perspective, not from orchestrator code changes
- Other users have reported the same issue in the Claude Code GitHub repository
- The workaround has been validated by multiple community members
- 100% CPU usage is due to the rapid retry loop, not actual computation

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, WebSearch, Bash (gh issue view)*
