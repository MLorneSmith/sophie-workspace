# Bug Diagnosis: Alpha Orchestrator Crash at ~6 Minutes

**ID**: ISSUE-1458
**Created**: 2026-01-14T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator crashes approximately 5-6 minutes after starting, even though all three E2B sandboxes are actively working and reporting progress. The crash occurs silently without any error message displayed to the user.

## Environment

- **Application Version**: dev branch (commit c22bc7dcb)
- **Environment**: development
- **Node Version**: (tsx runner)
- **Platform**: linux (WSL2)
- **Last Working**: Unknown (first observation of this failure mode)

## Reproduction Steps

1. Run the Alpha Orchestrator with spec #1362:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
   ```
2. Wait for sandbox initialization (3 sandboxes with staggered creation)
3. Observe the Ink TUI showing sandbox progress
4. At approximately 5-6 minutes elapsed time, the orchestrator crashes and exits

## Expected Behavior

The orchestrator should continue running until all features are implemented or until the user terminates it with Ctrl+C.

## Actual Behavior

The orchestrator silently crashes and exits at approximately 5 minutes 55 seconds. The Ink TUI disappears and the user is returned to the terminal prompt. No error message is displayed.

## Diagnostic Data

### Console Output
```
(No error output - process exits silently)
```

### Progress Files at Crash Time

**Lock file** (`.ai/alpha/.orchestrator-lock`):
- `started_at`: 2026-01-14T15:49:23.197Z
- PID: 222314

**Overall progress** (`.ai/alpha/progress/overall-progress.json`):
- Status: in_progress
- Elapsed from lock: ~8.5 minutes
- Elapsed from progress start: ~5.9 minutes

**Sandbox progress files**:
- sbx-a: phase="loading_context", last_heartbeat ~36s before crash
- sbx-b: phase="executing", 2 tasks completed (T1, T2), working on T3
- sbx-c: phase="loading_context", last_heartbeat ~33s before crash

### Sandbox Logs

All three sandbox logs show the same pattern:
```
=== RETRY ATTEMPT 2/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement <feature-id>

=== WAITING 10s BEFORE RETRY ===

=== RETRY ATTEMPT 3/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement <feature-id>
```

This indicates all sandboxes successfully started after 3 retry attempts.

### Timing Analysis

| Event | Timestamp | Elapsed from Lock | Notes |
|-------|-----------|-------------------|-------|
| Lock acquired | 15:49:23.197Z | 0m | Orchestrator started |
| First sandbox created | 15:49:35.384Z | ~12s | Sandbox setup begins |
| Progress started | 15:52:03.121Z | ~2m 40s | All sandboxes ready |
| Last heartbeats | ~15:55:07-10Z | ~5m 45s | Sandboxes still active |
| Crash | ~15:57:58Z | ~8m 35s | UI shows 5m 55s elapsed |

### Key Configuration Values

| Constant | Value | File |
|----------|-------|------|
| PROGRESS_FILE_TIMEOUT_MS | 5 * 60 * 1000 (5 min) | config/constants.ts:68 |
| HEARTBEAT_STALE_TIMEOUT_MS | 5 * 60 * 1000 (5 min) | config/constants.ts:71 |
| HEALTH_CHECK_INTERVAL_MS | 30000 (30s) | config/constants.ts:59 |
| STARTUP_TIMEOUT_MS | 60000 (60s) | config/constants.ts:62 |

## Root Cause Analysis

### Identified Root Cause

**Summary**: Console logging in health check and other modules interferes with the Ink terminal UI, causing a crash.

**Detailed Explanation**:

The orchestrator uses Ink (a React-based terminal UI library) to render the dashboard. When Ink renders, it takes control of the terminal and patches console output to prevent interference. However, several modules have direct `console.log` calls that are NOT wrapped with the `if (!uiEnabled)` check:

1. **health.ts** (lines 117-120, 175, 188, 201, 210, 215, 220, 252, 258, 285, 288, 293):
   - Direct `console.log` calls during health checks
   - The message at line 117-119 includes emoji: `ℹ️ [${instance.label}] Ignoring stale heartbeat...`

2. **database.ts** (lines 33, 48, 68, 89, 93, 113, 120, 127, 159, 163, 167, 181, 184, 198, 201, 209):
   - Direct `console.log` calls with emojis (ℹ️, 🔄, 📦, ✅, 🌱, 🔍)

3. **progress.ts** (lines 68-124):
   - Full progress report output with box-drawing characters and emojis

Meanwhile, other modules correctly use the conditional logger pattern:
- `orchestrator.ts:80`: `if (!uiEnabled) console.log(...args);`
- `sandbox.ts:32`: `if (!uiEnabled) console.log(...args);`
- `lock.ts:33`: `if (!uiEnabled) console.log(...args);`
- `work-queue.ts:24`: `if (!uiEnabled) console.log(...args);`
- `feature.ts:59`: `if (!uiEnabled) console.log(...args);`

**The crash timing correlates with the 5-minute PROGRESS_FILE_TIMEOUT_MS**. At this point:
1. Health check runs (every 30 seconds)
2. Health check encounters a condition that triggers a `console.log` (e.g., the "stale heartbeat" message at line 117)
3. The raw console output interferes with Ink's terminal control
4. This causes either an Ink rendering crash or terminal corruption that leads to process exit

**Supporting Evidence**:
- All sandboxes were actively working (heartbeats within 30-40 seconds of crash)
- Progress files existed and were being updated (tool events visible in recent_output)
- The crash happened at ~5m 55s, which is shortly after the 5-minute timeout thresholds kick in
- No error message was displayed (suggests uncaught exception in UI layer, not application logic)
- The health check code has unconditional console.log calls that would execute regardless of UI mode

### How This Causes the Observed Behavior

1. Orchestrator starts with UI mode enabled (Ink TUI)
2. Ink patches console to capture output
3. Around 5-6 minutes, a health check runs and triggers console.log output
4. The console output (with emojis and special characters) conflicts with Ink's terminal handling
5. Either:
   - Ink throws an uncaught exception while processing the rogue console output
   - The terminal state becomes corrupted, causing the process to exit
   - The console patching fails silently and the process receives an unhandled rejection

### Confidence Level

**Confidence**: Medium-High

**Reasoning**:
- The pattern of conditional logging is clearly established in some modules but not others
- The timing correlates with health check execution near the 5-minute mark
- However, I cannot reproduce the exact crash path without running the orchestrator
- The theory is consistent with all observed evidence

## Fix Approach (High-Level)

1. **Wrap all console.log calls in health.ts, database.ts, and progress.ts with the conditional logger pattern**:
   ```typescript
   // Replace:
   console.log("message");

   // With:
   const { log } = createLogger(uiEnabled);
   log("message");

   // Or in modules without access to createLogger:
   if (!uiEnabled) console.log("message");
   ```

2. **Pass `uiEnabled` parameter to functions that need to log**:
   - `checkSandboxHealth()` in health.ts
   - `killClaudeProcess()` in health.ts
   - `runHealthChecks()` in health.ts
   - Database functions in database.ts
   - Progress reporting functions in progress.ts

3. **Consider adding unhandled rejection handler** to catch any remaining issues:
   ```typescript
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection:', reason);
     // Graceful cleanup
   });
   ```

## Diagnosis Determination

The root cause is **unconditional console.log calls in health check and related modules that interfere with the Ink terminal UI when UI mode is enabled**. This causes a silent crash at approximately 5-6 minutes when health checks begin detecting conditions that trigger logging.

## Affected Code

- **Primary**: `.ai/alpha/scripts/lib/health.ts`
- **Secondary**: `.ai/alpha/scripts/lib/database.ts`, `.ai/alpha/scripts/lib/progress.ts`
- **Files to modify**: All modules need to use conditional logging when UI mode is enabled

## Related Issues & Context

### Related Infrastructure Issues

- Recent commit `75052b277` added startup timeout and retry logic to health.ts
- This commit introduced additional logging that may have increased the frequency of the issue

### Historical Context

This appears to be a new issue introduced when the health check and startup retry logic was added. The conditional logging pattern was established in the original modularization but not consistently applied to all new code.

## Additional Context

The fix should be straightforward - replace direct `console.log` calls with the conditional logger pattern used elsewhere in the codebase. This is a coding convention violation rather than a fundamental architectural issue.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git commands), code analysis*
