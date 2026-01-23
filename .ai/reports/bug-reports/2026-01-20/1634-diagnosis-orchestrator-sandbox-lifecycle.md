# Bug Diagnosis: Orchestrator Fails to Handle Expired E2B Sandboxes

**ID**: ISSUE-1634
**Created**: 2026-01-20T17:10:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator hangs indefinitely when E2B sandboxes expire (1-hour limit) because it lacks sandbox liveness verification. On restart, it attempts to reconnect to stored sandbox IDs without checking if they're still alive, causing the orchestrator to hang at "Connecting to sandboxes..." indefinitely.

## Environment

- **Application Version**: Alpha Orchestrator v1.0
- **Environment**: development
- **Node Version**: 22.x
- **E2B SDK**: Latest
- **E2B Sandbox Lifetime**: 60 minutes (hard limit)
- **Last Working**: N/A (design gap, not regression)

## Reproduction Steps

1. Start the Alpha orchestrator with `tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>`
2. Let it run for 60+ minutes (E2B sandbox lifetime limit)
3. Sandboxes expire at the 1-hour mark
4. Orchestrator hangs on post-completion tasks (git push, dev server start)
5. Kill and restart the orchestrator
6. Orchestrator hangs at "Connecting to sandboxes..." trying to reconnect to expired sandbox IDs stored in the manifest

## Expected Behavior

1. Orchestrator should detect when sandboxes are expired/unreachable
2. On restart, should verify stored sandbox IDs are alive before attempting reconnect
3. If sandboxes are dead, should automatically create new ones
4. Should provide clear error messages about sandbox expiration

## Actual Behavior

1. Orchestrator hangs indefinitely trying to communicate with expired sandboxes
2. No timeout or error handling for sandbox connection failures
3. No liveness check before reconnection attempts
4. User must manually clear sandbox IDs from manifest to recover

## Diagnostic Data

### Console Output

```
tsx .ai/alpha/scripts/spec-orchestrator.ts 1607

                    ALPHA ORCHESTRATOR

                 Connecting to sandboxes...

[hangs indefinitely - no timeout, no error]
```

### Manifest State (showing expired sandbox IDs)

```json
{
  "sandbox": {
    "sandbox_ids": [
      "ipeyu8r86mk4myo6epnuw",
      "iwywtqn5d1cv3zmtbpavv",
      "idkl9pfhrxi9o47rrbc2y"
    ],
    "branch_name": "alpha/spec-S1607",
    "created_at": "2026-01-20T15:56:40.976Z"  // Created 65+ minutes ago
  }
}
```

### Timeline Evidence

- Sandboxes created: 15:56:40 UTC
- Expected expiration: 16:56:40 UTC (1 hour later)
- Work completed: ~16:55 UTC
- Orchestrator stuck: 16:55+ UTC (post-completion steps hanging)
- Restart attempted: ~17:05 UTC
- Restart hung at: "Connecting to sandboxes..."

## Error Stack Traces

No stack trace - the orchestrator hangs without throwing an error. This is part of the problem - there's no timeout or error handling.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration logic, sandbox connection
  - `.ai/alpha/scripts/lib/sandbox.ts` - Sandbox creation and management
  - `.ai/alpha/scripts/spec-orchestrator.ts` - Entry point

- **Recent Changes**: N/A (design gap from initial implementation)

- **Suspected Functions**:
  - `orchestrate()` in orchestrator.ts - No liveness check before using stored sandbox IDs
  - `Sandbox.connect()` - E2B SDK call that hangs on expired sandbox
  - Post-completion code - No timeout handling for sandbox commands

## Related Issues & Context

### Same Component

- #1633: "Progress Poller Race Condition" - Another orchestrator bug discovered in same session
- Both issues relate to orchestrator robustness

### Historical Context

This is the first time the orchestrator has run long enough to hit the 1-hour sandbox limit. Previous runs completed within the time limit.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator stores sandbox IDs in the manifest and attempts to reconnect to them on restart without verifying they're still alive, and has no timeout handling for sandbox operations.

**Detailed Explanation**:

The orchestrator has THREE related gaps:

1. **No liveness check on reconnect** (`.ai/alpha/scripts/lib/orchestrator.ts`):
   ```typescript
   // Current code blindly uses stored sandbox IDs
   const sandboxIds = manifest.sandbox.sandbox_ids;
   // Attempts to connect without checking if alive
   const sandbox = await Sandbox.connect(sandboxId); // Hangs if expired
   ```

2. **No expiration awareness**:
   - Sandbox `created_at` is stored but never checked
   - No comparison against E2B's 60-minute lifetime
   - No proactive renewal before expiration

3. **No timeout on sandbox operations**:
   - Post-completion steps (git push, dev server) use sandboxes
   - No timeout wrapper around `Sandbox.connect()` or sandbox commands
   - When sandbox expires mid-operation, command hangs forever

**Supporting Evidence**:
- Manifest shows `created_at: "2026-01-20T15:56:40.976Z"` (65+ minutes old)
- Orchestrator hung at "Connecting to sandboxes..." on restart
- No error thrown, no timeout triggered
- Manual inspection of code confirms no liveness check exists

### How This Causes the Observed Behavior

1. User runs orchestrator for 60+ minutes
2. E2B sandboxes expire at the 1-hour mark (E2B enforced limit)
3. Orchestrator tries to run post-completion commands on expired sandbox → hangs
4. User kills and restarts orchestrator
5. Orchestrator reads stored sandbox IDs from manifest
6. Calls `Sandbox.connect(expiredId)` → hangs indefinitely
7. No timeout → no recovery → user stuck

### Confidence Level

**Confidence**: High

**Reasoning**:
- Directly observed the hang behavior
- Verified sandbox creation timestamp vs current time (65+ minutes)
- Confirmed no liveness check exists in codebase
- E2B documentation confirms 60-minute sandbox lifetime

## Fix Approach (High-Level)

Four-part fix required:

1. **Add liveness check on startup**: Before reconnecting to stored sandbox IDs, verify they respond to a health check command with a 5-second timeout. If any fail, clear all IDs and create fresh sandboxes.

2. **Add expiration awareness**: Compare `sandbox.created_at` against current time. If > 55 minutes old, proactively create new sandboxes instead of reconnecting.

3. **Add timeout wrapper**: Wrap all `Sandbox.connect()` and sandbox command calls with a timeout (30 seconds for connect, varies for commands). On timeout, treat sandbox as dead.

4. **Add graceful recovery**: When sandbox death is detected mid-execution, create replacement sandbox and continue (or mark feature for retry).

## Diagnosis Determination

The root cause is confirmed: The Alpha orchestrator lacks sandbox lifecycle management. It stores sandbox IDs but never validates they're alive, has no awareness of the 60-minute E2B limit, and has no timeout handling for sandbox operations. This causes indefinite hangs when sandboxes expire.

The fix requires adding defensive programming around all sandbox interactions: liveness checks, expiration awareness, timeouts, and graceful recovery.

## Additional Context

- E2B sandbox lifetime is a hard limit (60 minutes) that cannot be extended
- This issue will occur on ANY orchestrator run exceeding 60 minutes
- The current workaround is to manually delete `sandbox.sandbox_ids` from the manifest before restarting
- A future enhancement could track sandbox age and proactively renew before expiration

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (process inspection, file reads), Read (manifest, orchestrator code), Grep (code search)*
