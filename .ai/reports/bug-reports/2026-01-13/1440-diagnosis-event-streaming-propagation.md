# Bug Diagnosis: Alpha Event Streaming - Hook Events Not Propagated to UI Progress Files

**ID**: ISSUE-1440
**Created**: 2026-01-13T20:15:00Z
**Reporter**: User-reported
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI fails to display real-time tool activity in the "Output:" section of sandbox columns despite the #1439 fix being implemented. The hook (`event_reporter.py`) correctly writes tool events to `.initiative-progress.json` inside the E2B sandbox, but the orchestrator's progress polling code ignores the `recent_output` field from the sandbox file and instead only uses stdout capture, which only contains 2 initial startup lines.

## Environment

- **Application Version**: Dev branch (post #1439 fix)
- **Environment**: Development (E2B sandboxes + local orchestrator)
- **Node Version**: 20.x
- **E2B SDK**: Latest
- **UI Framework**: Ink (React for CLI)

## Reproduction Steps

1. Start the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Wait for sandboxes to start and begin work
3. Observe the sandbox columns in the UI
4. Notice the "Output:" section shows only initial 2 lines and never updates

## Expected Behavior

The "Output:" section of each sandbox column should display real-time tool activity as Claude executes tools, showing entries like:
- `📖 Read: dashboard.types.ts`
- `📝 Write: loader.ts`
- `💻 Bash: pnpm typecheck`

## Actual Behavior

The "Output:" section shows only the initial startup lines and never updates:
```
Output:
Using OAuth authenticatio...
Running Claude Code with ...
```

## Diagnostic Data

### Data Flow Analysis

The event streaming system has two mechanisms for `recent_output`:

**Mechanism 1: Hook-based (Sandbox-side)** - Working correctly
1. Claude Code executes tools in sandbox
2. `event_reporter.py` hook fires on `PostToolUse` events
3. Hook writes formatted events to `.initiative-progress.json` under `recent_output` array
4. Sandbox file contains tool events (verified working in #1439)

**Mechanism 2: Orchestrator Progress Writing** - **BROKEN**
1. Orchestrator polls sandbox's `.initiative-progress.json` via E2B API
2. Progress data is read and parsed into `SandboxProgress` object
3. `writeUIProgress()` writes to local `.ai/alpha/progress/sbx-*-progress.json`
4. UI poller reads local progress files and displays `recent_output`

**The Bug**: Step 3 **does NOT include** `progress.recent_output` from the sandbox file!

### Root Cause Evidence

**File**: `.ai/alpha/scripts/lib/progress.ts`, line 186

```typescript
const uiProgress = {
    // ... other fields from progress object ...
    last_tool: progress?.last_tool,
    last_commit: progress?.last_commit,
    session_id: instance.id,
    // BUG: Uses outputTracker (stdout capture) instead of progress.recent_output (hook events)
    recent_output: outputTracker?.recentOutput?.slice(-20) || [],
};
```

The `recent_output` field is populated from `outputTracker.recentOutput`, which is the stdout capture from `feature.ts`, NOT from `progress.recent_output` which contains the tool events written by the hook inside the sandbox.

**File**: `.ai/alpha/scripts/types/orchestrator.types.ts`, lines 136-162

The `SandboxProgress` interface does NOT include `recent_output`:
```typescript
export interface SandboxProgress {
    feature?: { ... };
    current_task?: { ... };
    completed_tasks?: string[];
    failed_tasks?: string[];
    current_group?: { ... };
    context_usage_percent?: number;
    status?: string;
    last_commit?: string;
    last_heartbeat?: string;
    last_tool?: string;
    phase?: string;
    // MISSING: recent_output?: string[];
}
```

### Progress File Contents

**Sandbox file** (inside E2B - contains hook events):
```json
{
  "recent_output": [
    "📖 Read: dashboard.ts",
    "📝 Write: loader.ts",
    "💻 Bash: pnpm typecheck"
  ]
}
```

**Local UI progress file** (orchestrator machine - missing hook events):
```json
{
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

### Console Output

Current progress files on orchestrator show only stdout capture:
```
$ cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output'
[
  "Using OAuth authentication (Max plan)",
  "Running Claude Code with prompt: /alpha:implement 1367"
]
```

## Related Issues & Context

### Direct Predecessors
- #1438 (CLOSED): "Bug Diagnosis: Alpha Event Streaming - Network Unreachable from E2B Sandboxes" - Identified network issue
- #1439 (CLOSED): "Bug Fix: Alpha Event Streaming UI Output Not Updating" - Implemented file-based event reporting, but didn't wire sandbox events to UI

### Root Cause Relationship

Issue #1439 solved **half** the problem - getting tool events INTO the sandbox's progress file. But the orchestrator's progress writing code was never updated to READ those events and propagate them to the UI progress files.

The #1439 fix:
- ✅ Added `recent_output` writing to `event_reporter.py` hook
- ✅ Hook writes tool events to sandbox's `.initiative-progress.json`
- ❌ Did NOT update `SandboxProgress` type to include `recent_output`
- ❌ Did NOT update `writeUIProgress()` to use `progress.recent_output`

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator's `writeUIProgress()` function ignores `recent_output` from the sandbox's progress file and uses only stdout capture, which contains only 2 initial startup lines.

**Detailed Explanation**:

The data flow has a missing link:

1. Hook writes events → Sandbox `.initiative-progress.json` (✅ Working)
2. Orchestrator polls sandbox file via E2B API (✅ Working)
3. **Progress data is parsed but `recent_output` is ignored** (❌ Bug)
4. UI progress file is written without hook events (❌ Result)
5. UI displays stale output (❌ User-visible symptom)

Two specific issues:

1. **Type mismatch**: `SandboxProgress` interface doesn't include `recent_output` field, so even if we tried to access `progress.recent_output`, TypeScript would error.

2. **Wrong data source**: `writeUIProgress()` uses `outputTracker.recentOutput` (stdout capture from `feature.ts` callback) instead of `progress.recent_output` (hook events from sandbox file).

**Supporting Evidence**:
- `.ai/alpha/scripts/lib/progress.ts:186`: Uses `outputTracker?.recentOutput` not `progress?.recent_output`
- `.ai/alpha/scripts/types/orchestrator.types.ts:136-162`: `SandboxProgress` lacks `recent_output` field
- Progress files confirm: local files have only stdout, sandbox files have tool events

### How This Causes the Observed Behavior

1. `event_reporter.py` hook writes "📖 Read: dashboard.ts" to sandbox file ✅
2. Orchestrator polls sandbox via `cat ${WORKSPACE_DIR}/${PROGRESS_FILE}` ✅
3. `SandboxProgress` object is created but lacks `recent_output` type ✅
4. `writeUIProgress()` writes to local file with `outputTracker.recentOutput` (stdout) ❌
5. Local file has ["Using OAuth...", "Running Claude Code..."] ❌
6. UI reads local file and displays only 2 lines ❌

### Confidence Level

**Confidence**: High

**Reasoning**:
- Code clearly shows `outputTracker.recentOutput` is used, not `progress.recent_output`
- Type definition confirms `SandboxProgress` lacks `recent_output` field
- Progress file contents confirm data divergence
- Fix is obvious and minimal (add field to type, use correct source in writeUIProgress)

## Fix Approach (High-Level)

The fix requires two changes:

1. **Add `recent_output` to `SandboxProgress` type** (`.ai/alpha/scripts/types/orchestrator.types.ts`):
   ```typescript
   export interface SandboxProgress {
       // ... existing fields ...
       recent_output?: string[];  // ADD THIS
   }
   ```

2. **Update `writeUIProgress()` to merge hook events** (`.ai/alpha/scripts/lib/progress.ts`):
   ```typescript
   // Merge hook events (progress.recent_output) with stdout capture (outputTracker)
   // Prefer hook events if available (more granular), fall back to stdout
   recent_output: progress?.recent_output?.length
       ? progress.recent_output.slice(-20)
       : outputTracker?.recentOutput?.slice(-20) || [],
   ```

Alternatively, merge both sources:
```typescript
// Combine both sources, dedupe, keep most recent 20
const hookOutput = progress?.recent_output || [];
const stdoutOutput = outputTracker?.recentOutput || [];
recent_output: [...hookOutput, ...stdoutOutput].slice(-20),
```

## Diagnosis Determination

The root cause is definitively identified: **The orchestrator ignores `recent_output` from sandbox progress files and uses only stdout capture for UI display.**

This is a straightforward bug where the #1439 implementation was incomplete. The hook side was fixed but the orchestrator side was not updated to consume the new data.

## Additional Context

### Why This Was Missed in #1439

The #1439 implementation focused on the sandbox side:
- Correctly identified network isolation as blocking HTTP POST
- Correctly implemented file-based event reporting
- Added tool formatting and atomic writes

But the orchestrator-side changes were either forgotten or assumed to work automatically:
- The progress polling code WAS reading the sandbox file
- But it wasn't extracting the new `recent_output` field
- And it wasn't propagating it to the UI progress files

### Two-Part Fix Incomplete

The fix in #1439 completed only Part 1 of a two-part fix:

**Part 1** (Done in #1439): Write events to sandbox file
- `event_reporter.py` writes to `.initiative-progress.json`
- Events are formatted with emoji icons
- Atomic writes prevent corruption

**Part 2** (Missing): Read events and propagate to UI
- `SandboxProgress` type needs `recent_output` field
- `writeUIProgress()` needs to use `progress.recent_output`
- UI polling will then display the events

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash*
