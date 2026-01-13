# Bug Diagnosis: Alpha Orchestrator - UI Output Not Updating, Race Conditions, and Timeout Handling Failures

**ID**: ISSUE-pending (will be assigned after GitHub issue creation)
**Created**: 2026-01-12T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator exhibited four distinct but related issues during the execution of Spec #1362 (user dashboard home): (A) UI output columns not updating during sandbox execution, (B) duplicate feature assignment where two sandboxes worked on the same feature #1375, (C) sandbox-b making no progress on feature #1372, and (D) orchestrator failing to handle sandbox timeout/expiration at 1 hour despite keepalive mechanisms being in place.

## Environment

- **Application Version**: dev branch (commit d71645afa)
- **Environment**: development
- **Node Version**: 20.x
- **Spec**: #1362 - user dashboard home
- **Sandboxes**: 3 (sbx-a, sbx-b, sbx-c)
- **E2B Template**: slideheroes-claude-agent-dev

## Reproduction Steps

1. Run the orchestrator with UI mode enabled: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --spec 1362 --ui`
2. Observe the sandbox columns in the UI showing static output ("Using OAuth authenticatio...", "Running Claude Code with ...")
3. Wait until sandbox-a finishes feature #1375
4. Observe sandbox-c starting work on the same feature #1375 (duplicate assignment)
5. Observe sandbox-b assigned to feature #1372 but making no progress
6. Wait approximately 1 hour for sandboxes to expire
7. Orchestrator exits without recovery despite keepalive mechanisms

## Expected Behavior

1. UI columns should update in real-time with stdout from Claude Code execution
2. Each feature should be assigned to only one sandbox at a time
3. All sandboxes should make progress on their assigned features
4. Sandboxes should be kept alive via periodic timeout extensions, or be restarted upon expiration

## Actual Behavior

1. UI columns show only initial output lines, never updating during execution
2. Feature #1375 was assigned to both sandbox-a and sandbox-c
3. Sandbox-b was assigned feature #1372 but the log file shows no progress beyond initial Claude Code launch
4. At ~1 hour, all sandboxes expired and orchestrator exited without attempting restart

## Diagnostic Data

### Log File Analysis

**sbx-a-2026-01-10T00-40-28-324Z.log** (54 lines - feature #1375 COMPLETED):
- Shows full implementation summary with 12 tasks completed
- Made 4 commits
- Completed successfully

**sbx-b-2026-01-10T00-54-41-660Z.log** (3 lines - feature #1372 NO PROGRESS):
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1372
```
No additional output - Claude Code appears to have hung or never started producing output.

**sbx-c-2026-01-10T00-57-31-093Z.log** (3 lines - feature #1375 DUPLICATE):
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1375
```
Started same feature that sandbox-a had already completed.

### Manifest State

From `spec-manifest.json`:
- Feature #1375: `status: "completed"` with `error: "Stall detected and recovered: signal: terminated"`
- Feature #1372: `status: "in_progress"` with `assigned_sandbox: "sbx-b"`, `error: "2: [unknown] terminated"`, `tasks_completed: 0`
- This shows the manifest was not properly updated when sandbox-a completed #1375, allowing sandbox-c to pick it up again

### Progress File State

From `sbx-a-progress.json`:
- Shows idle state with `phase: "waiting"` and `waiting_reason: "No available features"`

### Console Output Pattern

The UI showed static output because:
1. `recentOutput` in progress files is populated from the `OutputTracker` in `feature.ts`
2. The `onStdout` callback captures output and pushes to `recentOutput` array
3. The UI poller reads from progress files written by `writeUIProgress()`
4. However, **progress polling only reads the progress file on disk**, not the in-memory `recentOutput`

## Error Stack Traces

From manifest errors:
- Feature #1372: `error: "2: [unknown] terminated"` - Indicates the Claude Code process was terminated unexpectedly
- Feature #1375: `error: "Stall detected and recovered: signal: terminated"` - Stall detection triggered process kill

## Related Code

### Affected Files
- `.ai/alpha/scripts/lib/feature.ts:218-256` - onStdout callback and recentOutput tracking
- `.ai/alpha/scripts/lib/progress.ts:151-194` - writeUIProgress function
- `.ai/alpha/scripts/lib/orchestrator.ts:400-426` - Feature assignment in work loop
- `.ai/alpha/scripts/lib/orchestrator.ts:299-374` - Keepalive interval handling
- `.ai/alpha/scripts/lib/work-queue.ts:26-98` - getNextAvailableFeature logic
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:741-752` - Log file reading

### Recent Changes
- Commit d71645afa: "chore(tooling): update orchestrator event tracking state"
- Commit 19005f5fd: "fix(tooling): enable real-time stdout streaming in E2B sandbox CLI"

## Related Issues & Context

### Similar Symptoms
- The E2B sandbox stdout streaming was recently addressed in commit 19005f5fd, suggesting this is a recurring problem area

## Root Cause Analysis

### Identified Root Causes

**Issue A: UI Output Not Updating**

**Root Cause**: The `writeUIProgress()` function receives an `outputTracker` parameter containing `recentOutput`, but the UI progress poller (`readRecentLogs`) reads from **log files on disk** rather than the progress JSON files. The progress JSON does include `recent_output` array, but the poller is reading from a **different source** (raw log files).

**Evidence**:
- `progress.ts:186`: `recent_output: outputTracker?.recentOutput?.slice(-20) || []`
- `useProgressPoller.ts:751`: `reader.readRecentLogs(label, logsDir, 3)` - reads from .log files
- The log files on disk only show initial lines because they're written via the `logStream` which buffers

**Fix Approach**: The UI poller should read `recent_output` from the progress JSON files instead of reading from raw log files. Alternatively, ensure log files are flushed more frequently.

---

**Issue B: Duplicate Feature Assignment (#1375)**

**Root Cause**: Race condition in `getNextAvailableFeature()`. When sandbox-a completed feature #1375, it set `feature.status = "completed"` and `feature.assigned_sandbox = undefined`. However, if the manifest wasn't saved to disk fast enough, or if another sandbox was already in the process of calling `getNextAvailableFeature()`, the feature could be returned again.

The key issue is in `orchestrator.ts:424-426`:
```typescript
feature.status = "in_progress";
feature.assigned_sandbox = instance.label;
saveManifest(manifest);
```

This marks the feature BEFORE starting the async work, but `getNextAvailableFeature()` checks `assigned_sandbox` which could be stale if the manifest read was from disk.

**Evidence**:
- Both sbx-a and sbx-c logs show `/alpha:implement 1375`
- Manifest shows #1375 completed with stall recovery error from sbx-a
- sbx-c started the same feature ~17 minutes after sbx-a started

**Fix Approach**: Add a lock/mutex on feature assignment, or ensure `getNextAvailableFeature()` always reads from in-memory manifest state rather than disk. Consider adding a `last_assigned_at` timestamp to detect stale assignments.

---

**Issue C: Sandbox-b No Progress on #1372**

**Root Cause**: The Claude Code process in sandbox-b either hung on startup or encountered an unlogged error. The log file shows only the initial 2 lines from `run-claude` but no subsequent output. This could be:
1. Claude Code CLI hanging during authentication or context loading
2. PTY allocation issues with `unbuffer` not properly streaming output
3. The feature's tasks.json having an issue that caused infinite loop during loading

**Evidence**:
- Log file has only 3 lines after ~10+ minutes
- Manifest shows `tasks_completed: 0` and error `"2: [unknown] terminated"`
- Error code 2 suggests the process received a signal (SIGINT=2)

**Fix Approach**: Add timeout detection for initial progress file creation. If no progress file appears within `PROGRESS_FILE_TIMEOUT_MS` (5 minutes per config), the health check should kill and restart the Claude process. The health check code exists (`checkSandboxHealth`), but it may not have been triggered properly.

---

**Issue D: Sandbox Timeout Without Recovery**

**Root Cause**: The keepalive interval is set to `SANDBOX_KEEPALIVE_INTERVAL_MS = 30 * 60 * 1000` (30 minutes), but E2B sandbox default timeout is 1 hour. The keepalive logic attempts to extend timeouts, but:

1. `extendSandboxTimeout()` calls `sandbox.setTimeout(timeoutMs)` but doesn't verify success
2. If the sandbox is already expired, `setTimeout` will fail silently
3. The restart logic in the keepalive handler (`orchestrator.ts:327-364`) attempts to restart, but if all sandboxes expire simultaneously, the loop may not have time to recover

**Evidence**:
- Sandboxes expired at ~1 hour
- Manifest shows sandbox IDs that were never updated (same IDs from initial creation)
- No restart events logged

**Fix Approach**:
1. Reduce keepalive interval to 15-20 minutes (half the timeout)
2. Add explicit timeout extension verification
3. Implement proactive sandbox health pinging separate from keepalive
4. Add exponential backoff for restart attempts

### Confidence Level

**Confidence**: High

**Reasoning**: The log files, manifest state, and code analysis all point to the same root causes. The issues are structural problems in the orchestration logic rather than transient bugs.

## Fix Approach (High-Level)

1. **UI Output**: Modify `useProgressPoller.ts` to read `recent_output` from progress JSON files instead of (or in addition to) raw log files
2. **Race Condition**: Add atomic feature assignment with timestamp-based conflict detection or use file-based locking
3. **Hung Processes**: Add startup timeout detection and automatic Claude process restart
4. **Keepalive**: Reduce interval, add verification, implement staggered restart on mass expiration

## Diagnosis Determination

The orchestrator has four related bugs stemming from:
1. **Data flow mismatch**: UI reads logs from wrong source
2. **Concurrency bugs**: No atomic feature assignment
3. **Missing timeouts**: No startup progress detection
4. **Inadequate recovery**: Keepalive interval too long, no verification

All issues can be fixed with targeted code changes. The most critical is the race condition (Issue B) which could cause wasted compute by running duplicate features.

## Additional Context

The orchestrator was recently refactored (commit 1413) from a 2663-line monolith into modules. Some of these bugs may have been introduced during the refactor due to state management changes between modules.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (log files, source code, manifest), Glob (file discovery), Bash (GitHub issue search)*
