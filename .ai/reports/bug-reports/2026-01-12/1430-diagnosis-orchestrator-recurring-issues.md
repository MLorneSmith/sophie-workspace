# Bug Diagnosis: Alpha Orchestrator Recurring Issues (UI Output, Sandbox Management, Feature Assignment)

**ID**: ISSUE-1430
**Created**: 2026-01-12T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator has three persistent issues that were supposedly fixed in issues #1426/#1427 and #1428/#1429 but have recurred. All three sandboxes are being assigned to the same feature (#1367), the UI output columns remain frozen after initial startup messages, and sandbox management is creating excessive instances.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v22.x
- **Platform**: Linux (WSL2)
- **Last Working**: Issues were reported fixed in #1427 and #1429

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI dashboard
3. Notice output columns only show "Using OAuth authentication..." and "Running Claude Code with prompt..."
4. After ~9 minutes, observe all three sandboxes assigned to feature #1367
5. Check `spec-manifest.json` to see error field persisting

## Expected Behavior

1. Output columns should stream Claude Code's actual output (task progress, file operations, etc.)
2. Each sandbox should work on different features concurrently
3. Only 3 sandboxes should exist at any time

## Actual Behavior

1. Output columns freeze after showing only 2 startup lines
2. All three sandboxes (sbx-a, sbx-b, sbx-c) work on the same feature #1367
3. At 9 minutes: 9 sandboxes had been created (according to user report)

## Diagnostic Data

### Progress File Evidence

**sbx-a-progress.json**:
```json
{
  "sandbox_id": "ihf9exfoybs66w5k1t22r",
  "feature": { "issue_number": 1367, "title": "Dashboard Page & Grid Layout" },
  "completed_tasks": ["T1", "T2", ..., "T15"],
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

**sbx-b-progress.json**:
```json
{
  "sandbox_id": "im388k1ybbmibi0iup6fm",
  "feature": { "issue_number": 1367, "title": "Dashboard Page & Grid Layout" },
  "completed_tasks": [],
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

**sbx-c-progress.json**:
```json
{
  "sandbox_id": "ic4ml9lmgbcgdosiaka6f",
  "feature": { "issue_number": 1367, "title": "Dashboard Page & Grid Layout" },
  "completed_tasks": ["T1", "T2", ..., "T15"],
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

**ALL THREE sandboxes show the same feature #1367 with identical frozen output.**

### Manifest Evidence

**spec-manifest.json** (feature #1367):
```json
{
  "id": 1367,
  "status": "in_progress",
  "assigned_sandbox": "sbx-c",
  "assigned_at": 1768234062028,
  "error": "signal: terminated"
}
```

**Critical observation**: Feature has BOTH `status: "in_progress"` AND `error: "signal: terminated"` - this is the inconsistent state that triggers the race condition.

### Log File Evidence

**93-byte log files** (e.g., `sbx-c-2026-01-12T16-07-43-333Z.log`):
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367
```

**2KB+ log files** (e.g., `sbx-a-2026-01-12T15-34-16-432Z.log`):
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367
## Summary: Feature #1367 Implementation Complete
...
```

**Key insight**: The larger log files contain a complete summary that appears to have been received all at once when the process completed, NOT streamed incrementally.

## Root Cause Analysis

### Issue A: UI Output Not Updating

**Summary**: E2B's `onStdout` callback receives the startup messages from the `run-claude` shell script, but Claude Code's actual output is buffered and not streamed until process completion.

**Detailed Explanation**:

The `onStdout` callback in `feature.ts:241-274` correctly captures output and adds it to `recentOutput[]`:

```typescript
onStdout: (data) => {
  capturedStdout += data;
  logStream.write(data);

  const lines = data.split("\n");
  for (const line of lines) {
    if (line.trim()) {
      recentOutput.push(line);
      // ...
    }
  }
}
```

However, the E2B SDK's stdout streaming behavior depends on the underlying process:
1. The `run-claude` script outputs startup messages immediately (not buffered)
2. Claude Code CLI uses Node.js which applies output buffering by default
3. The buffered output is only flushed when the process exits or buffer fills

**Supporting Evidence**:
- Log files show either 93 bytes (2 lines) OR complete summaries (received at end)
- No intermediate output captured during execution
- The `unbuffer` tool mentioned in code comments doesn't work with Node.js processes

**File**: `.ai/alpha/scripts/lib/feature.ts:236-280`

### Issue B & C: Multiple Sandboxes on Same Feature (Root Cause)

**Summary**: The `error` field is NEVER cleared when a feature is re-assigned, causing the "inconsistent state" handler to reset features that are actively being worked on.

**Detailed Explanation**:

The bug is a combination of two code paths:

**Path 1 - Sandbox Expiration** (`orchestrator.ts:342-350`):
```typescript
// Reset any in-progress feature assigned to this sandbox
if (feature) {
  feature.status = "pending";
  feature.assigned_sandbox = undefined;
  feature.assigned_at = undefined;
  feature.error = "Preemptive restart before expiration";  // Sets error!
  saveManifest(manifest);
}
```

**Path 2 - Feature Assignment** (`work-queue.ts:173-180`):
```typescript
feature.status = "in_progress";
feature.assigned_sandbox = sandboxLabel;
feature.assigned_at = now;
// NOTE: Does NOT clear feature.error!
saveManifest(manifest);
```

**Path 3 - Inconsistent State Handler** (`work-queue.ts:66-74`):
```typescript
// Handle inconsistent state: in_progress with error
if (feature.status === "in_progress" && feature.error) {
  console.log(`🔧 Fixing inconsistent state...`);
  feature.status = "failed";
  feature.assigned_sandbox = undefined;
  feature.assigned_at = undefined;
}
```

**Race Condition Flow**:
1. Feature #1367 starts on sbx-a
2. Sandbox expires → `error = "Preemptive restart..."` + `status = "pending"`
3. Feature reassigned to sbx-b → `status = "in_progress"` (error NOT cleared)
4. sbx-c calls `getNextAvailableFeature()`
5. Sees `status = "in_progress"` AND `error = "..."` → inconsistent state handler triggers
6. Feature reset to `status = "failed"`, `assigned_sandbox = undefined`
7. Feature returned as available → sbx-c claims it
8. Now sbx-b AND sbx-c both think they own feature #1367
9. Repeat indefinitely

**Supporting Evidence**:
- All three progress files show feature #1367
- Manifest shows `assigned_sandbox: "sbx-c"` (last to write) but error field persists
- sbx-a and sbx-c both have completed_tasks T1-T15 (reading same shared progress file)

**Files**:
- `.ai/alpha/scripts/lib/work-queue.ts:66-74` (inconsistent state handler)
- `.ai/alpha/scripts/lib/work-queue.ts:173-180` (assignment - missing error clear)
- `.ai/alpha/scripts/lib/orchestrator.ts:342-350` (expiration - sets error)

### How This Causes the Observed Behavior

1. **Multiple sandboxes on same feature**: The race condition allows multiple sandboxes to claim the same feature because the inconsistent state handler resets actively-assigned features
2. **Too many sandboxes**: Each time features get reassigned, sandboxes may be restarted, creating new IDs
3. **Frozen output**: The output streaming issue is separate but compounds the problem by hiding what's actually happening

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code paths are clear and reproducible
- The evidence (progress files, manifest, logs) directly supports the diagnosis
- The race condition can be traced step-by-step through the code

## Fix Approach (High-Level)

### Issue A: Output Streaming

**Option 1**: Force line buffering in the `run-claude` script using `stdbuf -oL` or `script` command
**Option 2**: Use PTY allocation via `unbuffer` more aggressively
**Option 3**: Accept buffered output and poll the sandbox's `.initiative-progress.json` more frequently for status (current workaround partially does this)

Recommended: Option 3 is already partially implemented. Enhance by showing task progress from the progress file instead of relying on stdout.

### Issue B & C: Race Condition

**Fix 1**: Clear the `error` field when assigning a feature:
```typescript
// In assignFeatureToSandbox():
feature.status = "in_progress";
feature.assigned_sandbox = sandboxLabel;
feature.assigned_at = now;
feature.error = undefined;  // ADD THIS LINE
```

**Fix 2**: Make the inconsistent state handler less aggressive - only trigger if the feature has been in that state for > 60 seconds:
```typescript
if (feature.status === "in_progress" && feature.error) {
  // Only reset if this isn't a recent assignment
  const timeSinceAssignment = feature.assigned_at ? now - feature.assigned_at : Infinity;
  if (timeSinceAssignment > 60000) {  // 60 seconds
    // Reset feature...
  }
}
```

Recommended: Both fixes should be applied together.

## Affected Files

- `.ai/alpha/scripts/lib/work-queue.ts` - Add error clearing in `assignFeatureToSandbox()`, modify inconsistent state handler
- `.ai/alpha/scripts/lib/orchestrator.ts` - Consider removing error field setting on expiration (use status alone)
- `.ai/alpha/scripts/lib/feature.ts` - Consider alternative approaches for output display

## Related Issues & Context

### Direct Predecessors
- #1428 (CLOSED): "Bug Diagnosis: Alpha Orchestrator Multiple Issues" - Same issues diagnosed but fix was incomplete
- #1429 (CLOSED): "Bug Fix: Alpha Orchestrator Multiple Issues" - Attempted fix but missed the error field clearing

### Why Previous Fix Didn't Work
The previous fix (#1429) addressed:
- Progress counter overflow (fixed correctly)
- Sandbox ID cleanup (fixed correctly)
- Feature assignment atomicity (added `saveManifest()` inside `assignFeatureToSandbox()`)

But it MISSED:
- The `error` field not being cleared on re-assignment
- The overly aggressive inconsistent state handler

## Diagnosis Determination

The root cause of all three issues has been identified:

1. **Output not updating**: E2B stdout buffering for Node.js processes - this is a limitation of the E2B SDK's streaming behavior with Claude Code CLI
2. **Multiple sandboxes on same feature**: The `error` field persists through re-assignment, causing the inconsistent state handler to reset actively-assigned features
3. **Too many sandboxes**: A consequence of issue #2 - features keep getting reassigned, triggering sandbox restarts

The fix requires:
1. Adding `feature.error = undefined;` to `assignFeatureToSandbox()`
2. Optionally making the inconsistent state handler time-aware

## Additional Context

The user reported that at 8 minutes there were 7 sandboxes, and at 9 minutes there were 9 sandboxes with all three working on #1367. This matches the race condition pattern where features continuously get reset and reassigned.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Glob for log analysis and code inspection*
