# Bug Diagnosis: Alpha Orchestrator UI Shows Stale "RETRY ATTEMPT 3/3" on Startup

**ID**: ISSUE-1454
**Created**: 2026-01-14T15:45:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator UI displays stale "RETRY ATTEMPT 3/3" messages in the sandbox output sections immediately on startup, even before the orchestrator begins creating sandboxes 2 and 3. Additionally, messages occasionally flash above the UI and then disappear.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v20.x
- **Last Working**: Unknown

## Reproduction Steps

1. Run the Alpha orchestrator with UI enabled: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
2. Observe the sandbox columns immediately show "RETRY ATTEMPT 3/3" in the Output section
3. This appears before sandboxes are even created, indicating stale data

## Expected Behavior

On startup, the sandbox columns should either:
1. Show "Waiting for work..." with no output, or
2. Show fresh output from the current session only

## Actual Behavior

1. Sandbox columns immediately display "=== RETRY ATTEMPT 3/3 ===" from previous orchestrator runs
2. Messages occasionally flash above the TUI and disappear (likely WebSocket errors)

## Diagnostic Data

### Log File Evidence

Recent log files contain retry messages from previous failed runs:
```
/home/msmith/projects/2025slideheroes/.ai/alpha/logs/sbx-a-2026-01-14T14-50-57-207Z.log:
=== RETRY ATTEMPT 3/3 ===

/home/msmith/projects/2025slideheroes/.ai/alpha/logs/sbx-a-2026-01-14T15-08-51-505Z.log:
=== RETRY ATTEMPT 2/3 ===
```

### Progress File State

Current progress files show active sessions with valid data, but the UI reads from log files during startup when JSON files are empty:
```json
{
    "sandbox_id": "iivbkwdmlxd1fhbncmqih",
    "feature": { "issue_number": 1367, "title": "Dashboard Page & Grid Layout" },
    "status": "running",
    "recent_output": ["📻 Bash: find .ai/alpha/specs -name \"*1..."]
}
```

## Related Code

### Affected Files
- `.ai/alpha/scripts/lib/progress.ts:249-262` - `clearUIProgress()` only clears JSON files, not log files
- `.ai/alpha/scripts/lib/orchestrator.ts:780-814` - UI starts immediately after clearing JSON files
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:821-845` - Log file fallback when JSON is empty
- `.ai/alpha/scripts/ui/hooks/useEventStream.ts:175,181,221` - `console.error` calls cause flashing messages

### Root Cause Code Path

```typescript
// orchestrator.ts:780-814
// 1. Clear JSON progress files (NOT log files)
clearUIProgress();

// 2. UI starts immediately with logsDir reference
uiManager = startOrchestratorUI({
    progressDir,
    logsDir,  // <-- Old log files still exist here
    // ...
});

// useProgressPoller.ts:786-795
// 3. UI polls and finds empty JSON files
if (result.data?.recent_output?.length > 0) {
    recentOutput = result.data.recent_output.slice(-3);
} else {
    // 4. Falls back to reading log files
    needsLogFallback.push({ index: i, label: result.label });
}

// useProgressPoller.ts:821-845
// 5. Reads stale log files containing "RETRY ATTEMPT 3/3"
const logsResults = await Promise.all(
    needsLogFallback.map(({ label }) =>
        reader.readRecentLogs(label, logsDir, 3),
    ),
);
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: Log files from previous orchestrator runs persist and are read by the UI as a fallback when JSON progress files are empty on startup.

**Detailed Explanation**:

The UI's progress polling system uses a two-tier data source strategy:
1. **Primary**: JSON progress files (`sbx-{label}-progress.json`) with `recent_output` field
2. **Fallback**: Log files (`sbx-{label}-{timestamp}.log`) when JSON is unavailable

On orchestrator startup:
1. `clearUIProgress()` (line 781) deletes JSON progress files
2. UI starts immediately (line 793) and begins polling
3. JSON files don't exist yet (sandboxes haven't started)
4. UI falls back to reading log files (line 821-845)
5. Log files from previous runs contain "RETRY ATTEMPT" messages
6. These stale messages are displayed in the UI

**Supporting Evidence**:
- Log files `sbx-a-2026-01-14T14-50-57-207Z.log` contain "RETRY ATTEMPT 3/3"
- `clearUIProgress()` only deletes files matching `*-progress.json` (line 253)
- `readRecentLogs()` reads the most recent log file by filename timestamp

### How This Causes the Observed Behavior

1. User starts orchestrator with `--ui` flag
2. `clearUIProgress()` clears JSON files but leaves old log files
3. UI renders and immediately polls for progress
4. Empty JSON triggers log file fallback
5. UI displays content from most recent log file (which contains retry messages from previous run)
6. User sees "RETRY ATTEMPT 3/3" before any sandboxes are even created

### Secondary Issue: Flashing Messages

The `useEventStream` hook contains `console.error()` calls at lines 175, 181, and 221. When WebSocket connection fails or messages fail to parse, these errors are written to stderr. While the UI uses `patchConsole: true` to capture console output, there may be timing issues where errors flash before the TUI captures them.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Direct correlation between log file contents and UI display
2. Code path clearly shows fallback to log files when JSON is empty
3. `clearUIProgress()` explicitly only targets JSON files
4. Timing analysis shows UI starts before sandboxes write progress

## Fix Approach (High-Level)

1. **Clear log files on startup**: Add a `clearLogs()` function that removes old log files, or clears log files in `clearUIProgress()`
2. **Filter log files by session**: Modify `readRecentLogs()` to only read log files created after the current session started (using timestamp in filename)
3. **Replace console.error with error state**: In `useEventStream.ts`, replace `console.error()` calls with state updates that can be displayed in the UI properly

## Diagnosis Determination

The root cause is definitively identified as the lack of log file cleanup during orchestrator initialization. The log file fallback mechanism in the UI's progress poller reads stale data from previous runs because:

1. `clearUIProgress()` does not clear log files
2. No session filtering is applied to log file reads
3. The UI starts before sandboxes create new log files

The fix is straightforward: either clear log files on startup or add session-based filtering to `readRecentLogs()`.

## Additional Context

The retry messages come from the startup hang recovery system in `feature.ts` which writes "=== RETRY ATTEMPT X/3 ===" to log files when Claude CLI hangs during startup. This is expected behavior for the retry system, but the messages should not appear in subsequent orchestrator runs.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash*
