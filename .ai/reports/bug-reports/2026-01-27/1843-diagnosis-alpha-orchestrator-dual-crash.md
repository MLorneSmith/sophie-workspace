# Bug Diagnosis: Alpha Orchestrator Stream Crash & Workflow Cancellation

**ID**: ISSUE-[pending]
**Created**: 2026-01-27T04:35:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Two separate but related bugs in the Alpha Implementation System:

1. **Stream Crash**: The orchestrator crashes with `ERR_STREAM_WRITE_AFTER_END` when the PTY `onData` callback attempts to write to a closed log stream after feature completion
2. **Workflow Cancellation**: Despite Issue #1837 fix (`cancel-in-progress: false`), GitHub Actions still cancels older pending runs due to the concurrency group's "at most one pending" limitation

## Environment

- **Application Version**: Spec S1823 (user dashboard)
- **Environment**: Development
- **Node Version**: v22.16.0
- **E2B SDK**: 2.10.4
- **Last Working**: Unknown (new issue)
- **Branch**: alpha/spec-S1823

## Reproduction Steps

### Bug A: Stream Crash

1. Run the orchestrator: `tsx spec-orchestrator.ts 1823`
2. Wait for multiple features to complete (approximately 20-30 minutes)
3. Observe crash when PTY receives data after log stream is closed

### Bug B: Workflow Cancellation

1. Run orchestrator with 3 parallel sandboxes
2. Observe multiple pushes to `alpha/spec-S1823` in quick succession
3. Check GitHub Actions - runs continue to be cancelled despite `cancel-in-progress: false`

## Expected Behavior

### Bug A
- Orchestrator should gracefully handle PTY data received after feature completion
- Log streams should remain open until all PTY events are processed

### Bug B
- All workflow runs should queue and eventually complete
- No runs should be cancelled during orchestration

## Actual Behavior

### Bug A
- Crash occurs with `Error [ERR_STREAM_WRITE_AFTER_END]: write after end`
- Stack trace points to `.ai/alpha/scripts/lib/feature.ts:434` in the `onData` callback

### Bug B
- Runs are cancelled with message: "Canceling since a higher priority waiting request for alpha-validation-refs/heads/alpha/spec-S1823 exists"
- Multiple workflow runs cancelled (8 out of 12 recent runs)

## Diagnostic Data

### Console Output (Bug A)

```
Error [ERR_STREAM_WRITE_AFTER_END]: write after end
    at _write (node:internal/streams/writable:489:11)
    at Writable.write (node:internal/streams/writable:510:10)
    at CommandHandle.onData (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/feature.ts:434:16)
    at CommandHandle.handleEvents (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:233:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
Emitted 'error' event on WriteStream instance at:
    at emitErrorNT (node:internal/streams/destroy:170:8)
    at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'ERR_STREAM_WRITE_AFTER_END'
}
```

### GitHub Actions Analysis (Bug B)

Recent workflow runs on `alpha/spec-S1823`:
```
23:44:56Z - success    - feat(web): add AssessmentSpiderWidget
23:43:44Z - cancelled  - feat(web): add Cal.com foundation
23:43:16Z - cancelled  - feat(web): implement PresentationTableWidget
23:40:41Z - success    - feat(web): add CourseProgressWidget
23:40:04Z - cancelled  - mark S1823.I1.F4 skeleton loading tasks
23:38:51Z - cancelled  - add kanban summary widget
23:38:15Z - cancelled  - complete skeleton loading states
```

## Error Stack Traces

### Bug A

```
Error [ERR_STREAM_WRITE_AFTER_END]: write after end
    at _write (node:internal/streams/writable:489:11)
    at Writable.write (node:internal/streams/writable:510:10)
    at CommandHandle.onData (.ai/alpha/scripts/lib/feature.ts:434:16)
```

## Related Code

### Bug A - Affected Files
- `.ai/alpha/scripts/lib/feature.ts:434` - `onData` callback writes to `logStream`
- `.ai/alpha/scripts/lib/feature.ts:625-634` - Log stream closed in cleanup block

### Bug B - Affected Files
- `.github/workflows/alpha-validation.yml:8-10` - Concurrency configuration

## Related Issues & Context

### Direct Predecessors
- #1837 (CLOSED): "Bug Fix: Alpha validation workflow cancellation during orchestration" - Fixed `cancel-in-progress` but did not address the "at most one pending" limitation

### Related Infrastructure Issues
- #1699, #1701: PTY timeout issues
- #1767, #1786: PTY recovery and heartbeat monitoring

### Same Component
- Spec orchestrator system (`.ai/alpha/scripts/`)
- GitHub Actions alpha validation workflow

## Root Cause Analysis

### Bug A: Stream Write After End

**Summary**: The PTY `onData` callback continues to fire after `logStream.end()` is called, causing Node.js stream error.

**Detailed Explanation**:

The crash occurs due to a **race condition** in the E2B PTY event handling:

1. When a feature completes (line 617-624), the code enters the cleanup block
2. At line 634, `logStream.end()` is called to close the log file stream
3. However, the PTY's `onData` callback (registered at line 427) may still receive pending data from the E2B SDK's internal event buffer
4. The E2B SDK's `CommandHandle.handleEvents()` (line 233 in SDK) processes buffered events asynchronously
5. When `onData` is called at line 434, it attempts `logStream.write(data)` on a closed stream
6. Node.js throws `ERR_STREAM_WRITE_AFTER_END` which is not caught, crashing the orchestrator

**Code Location** (feature.ts:420-477):
```typescript
const ptyHandle = await instance.sandbox.pty.create({
  // ... config ...
  onData: (output: Uint8Array) => {
    const data = new TextDecoder().decode(output);
    capturedStdout += data;
    logStream.write(data);  // LINE 434 - CRASH HERE
    // ... rest of callback ...
  },
  // ...
});
```

**Why it happens now**: The PTY has a long timeout (`FEATURE_TIMEOUT_MS`), and the E2B SDK may buffer and deliver events even after the PTY session appears complete. When features complete quickly in succession, the cleanup code closes the stream while the SDK still has pending events.

**Supporting Evidence**:
- Stack trace shows crash at `feature.ts:434` (exactly the `logStream.write` call)
- Error type `ERR_STREAM_WRITE_AFTER_END` confirms write to closed stream
- Crash occurred after 21+ minutes with multiple features completing

### Bug B: Workflow Still Cancelled

**Summary**: GitHub Actions concurrency groups allow **at most one pending job** per group - newer pushes cancel the pending (not running) job, regardless of `cancel-in-progress` setting.

**Detailed Explanation**:

The `cancel-in-progress: false` setting from Issue #1837 only prevents cancellation of **currently running** jobs. However, GitHub's concurrency model has an additional constraint documented as:

> "there can be at most one running and one pending job in a concurrency group at any time"

When multiple pushes occur in quick succession (typical with 3 parallel sandboxes):
1. Push A triggers workflow run (starts running)
2. Push B triggers workflow run (queued as pending)
3. Push C triggers workflow run - **Push B's pending run is cancelled** to make room for Push C
4. This is NOT affected by `cancel-in-progress: false`

The message "Canceling since a higher priority waiting request...exists" confirms this behavior - GitHub treats the newest pending job as "higher priority" than older pending jobs.

**Evidence**:
- 8 of 12 recent runs cancelled despite `cancel-in-progress: false`
- Cancellation message specifically mentions "higher priority waiting request"
- Successful runs are the ones that completed before another push occurred

**Confidence Level**: **High**

Both root causes are confirmed by:
1. Stack traces matching exactly the problematic code
2. Documentation confirming GitHub's "at most one pending" behavior
3. Evidence from logs and workflow run history

## Fix Approach (High-Level)

### Bug A Fix (Stream Crash)

1. **Check stream state before writing**: Add a guard in `onData` to check `logStream.writableEnded` before calling `write()`
2. **OR use a flag**: Set a `streamClosed` boolean flag before calling `logStream.end()`, check in callback
3. **Graceful error handling**: Wrap the `logStream.write()` in try-catch to prevent crashes from late-arriving data

Example:
```typescript
onData: (output: Uint8Array) => {
  const data = new TextDecoder().decode(output);
  capturedStdout += data;

  // Guard against writing to closed stream
  if (!logStream.writableEnded) {
    logStream.write(data);
  }
  // ... rest of callback ...
}
```

### Bug B Fix (Workflow Cancellation)

Two approaches:

**Option 1 - Remove concurrency group entirely**:
```yaml
# Delete these lines:
# concurrency:
#   group: alpha-validation-${{ github.ref }}
#   cancel-in-progress: false
```
This allows unlimited parallel runs (may hit GitHub Actions concurrent job limits).

**Option 2 - Use unique concurrency group per commit**:
```yaml
concurrency:
  group: alpha-validation-${{ github.sha }}  # Unique per commit
  cancel-in-progress: false
```
Each commit gets its own group, so no cancellation occurs.

**Option 3 - Increase orchestrator push spacing** (workaround):
Add a delay between feature completion and the next feature start to reduce push collision frequency. This is a workaround, not a fix.

## Diagnosis Determination

Both bugs have been identified with high confidence:

1. **Bug A (Stream Crash)**: Race condition where E2B SDK delivers PTY data after the orchestrator has closed the log stream during cleanup. The fix requires defensive programming in the `onData` callback.

2. **Bug B (Workflow Cancellation)**: GitHub Actions' concurrency limitation of "at most one pending" job per group means the `cancel-in-progress: false` fix only protects running jobs, not pending ones. The fix requires either removing the concurrency group or making it unique per commit.

## Additional Context

- The orchestrator was running Spec S1823 with 3 parallel sandboxes
- Progress at crash: 2/5 initiatives, 7/17 features, 32/117 tasks
- The crash occurs non-deterministically based on timing of PTY events vs cleanup

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log, gh issue view, gh run list, gh api)*
