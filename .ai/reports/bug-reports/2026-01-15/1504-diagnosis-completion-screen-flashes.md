# Bug Diagnosis: Orchestrator completion screen flashes briefly and disappears

**ID**: ISSUE-1504
**Created**: 2026-01-15T22:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When the Alpha orchestrator completes implementing a Spec, it displays a completion screen containing the preview URL. However, this completion screen only appears for a fraction of a second before disappearing, and the main orchestrator UI reappears. Users cannot view or click the preview URLs because the screen is visible for too short a time.

## Environment

- **Application Version**: dev branch (commit `e9807e807`)
- **Environment**: development (CLI)
- **Node Version**: 20.x
- **UI Framework**: Ink (React for CLIs)
- **Last Working**: Never (inherited design flaw)

## Reproduction Steps

1. Set up a Spec with multiple features (e.g., Spec #1362)
2. Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
3. Wait for all features to complete
4. Observe: Completion screen appears briefly showing preview URLs
5. Observe: Within ~1 second, the completion screen disappears and the main orchestrator UI (running view) reappears

## Expected Behavior

1. Completion screen should appear and stay visible until user presses 'q' or Enter
2. User should have time to view and copy preview URLs
3. Process should exit only after user confirmation

## Actual Behavior

1. Completion screen appears briefly (fraction of a second)
2. Screen flickers and switches back to the main "running" UI
3. User cannot interact with the completion screen or view preview URLs

## Diagnostic Data

### Console Output
```
# No explicit errors - the UI just flickers
```

### Code Flow Analysis

**Phase Transition Chain (Bug Location)**

1. Progress poller reads `overall-progress.json` with `status: "completed"`
2. `onStateChange` callback fires in `OrchestratorApp` (index.tsx:167-170)
3. `setPhase("completed")` is called - CompletionUI renders
4. Meanwhile, `pollNow` callback reference changes due to dependency changes
5. This causes `startPolling` callback to get new reference
6. The `useEffect` in index.tsx:186-194 re-runs because `startPolling` changed
7. `setPhase("running")` is called unconditionally - OrchestratorUI re-renders!

## Error Stack Traces

No error - this is a timing/rendering bug caused by React callback dependency changes.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/index.tsx` - Lines 186-194 (problematic useEffect)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Lines 939-950 (`pollNow` dependencies)

- **Recent Changes**: Commit `e9807e807` attempted to fix this by adding `waitForExit()` but didn't address the underlying phase change issue

- **Suspected Functions**:
  - `OrchestratorApp` component - useEffect with `[startPolling]` dependency
  - `useProgressPoller` hook - `pollNow` and `startPolling` callback references

## Related Issues & Context

### Direct Predecessors
- #1501: Preview URL not displayed (related fix attempted in commit e9807e807)

### Historical Context
The fix in #1501 correctly changed `uiManager.stop()` to `await uiManager.waitForExit()`, but the underlying issue is that the phase gets reset to "running" by a useEffect re-running due to callback reference changes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `useEffect` in `index.tsx` that starts polling unconditionally calls `setPhase("running")`, and re-runs whenever `startPolling` callback reference changes, overwriting the "completed" phase.

**Detailed Explanation**:

The bug is in `index.tsx` lines 186-194:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    startPolling();
    setPhase("running");  // PROBLEM: Unconditionally sets phase to "running"
  }, 500);

  return () => clearTimeout(timer);
}, [startPolling]);  // Re-runs when startPolling reference changes
```

The `startPolling` callback depends on `pollNow` (line 963 of useProgressPoller.ts):
```tsx
}, [pollNow, pollInterval]);
```

And `pollNow` depends on many values including `error` (line 949):
```tsx
], [
  sandboxLabels,
  progressDir,
  logsDir,
  reader,
  specId,
  specName,
  state.sessionStartTime,
  onStateChange,
  onError,
  error,  // <-- This changes!
]);
```

When a poll succeeds after an error condition, `error` changes from a value to `null` (lines 931-933):
```tsx
if (error !== null) {
  setError(null);
}
```

This dependency chain causes:
1. `error` changes → `pollNow` gets new reference
2. `pollNow` changes → `startPolling` gets new reference
3. `startPolling` changes → useEffect re-runs
4. useEffect calls `setPhase("running")` → CompletionUI disappears!

**Supporting Evidence**:
- The user describes seeing the completion screen "flash" briefly - consistent with a re-render
- The main orchestrator UI "reappears" - consistent with phase changing from "completed" to "running"
- The behavior is not affected by user input - consistent with programmatic state change

### How This Causes the Observed Behavior

1. Spec completes → manifest status set to "completed" → progress file written
2. Poller reads "completed" status → `onStateChange` fires → `setPhase("completed")`
3. CompletionUI renders (user sees it briefly)
4. On same or next poll cycle, error state clears (if there was any) or other dependencies change
5. `pollNow` gets new reference → `startPolling` gets new reference
6. useEffect re-runs → `setPhase("running")` called
7. OrchestratorUI renders again (user sees main UI return)
8. `waitForExit()` may resolve or continue waiting, but UI shows wrong screen

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and follows React's dependency tracking behavior
- The symptom ("flashes briefly then disappears") matches exactly what would happen if `setPhase("running")` is called after `setPhase("completed")`
- The useEffect dependency on `startPolling` is the only place that unconditionally sets "running" phase after initial mount

## Fix Approach (High-Level)

Two options to fix this:

**Option A (Recommended)**: Add a guard in the useEffect to not set "running" if already "completed":
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    startPolling();
    // Only transition to running if not already completed
    setPhase(prev => prev === 'loading' ? 'running' : prev);
  }, 500);

  return () => clearTimeout(timer);
}, [startPolling]);
```

**Option B**: Use a ref to track if this is the initial run, so the effect only fires once:
```tsx
const hasStartedRef = useRef(false);

useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;

  const timer = setTimeout(() => {
    startPolling();
    setPhase("running");
  }, 500);

  return () => clearTimeout(timer);
}, [startPolling]);
```

Option A is cleaner and preserves React's proper dependency tracking.

## Diagnosis Determination

The completion screen disappears because a React useEffect unconditionally resets the UI phase to "running" whenever the `startPolling` callback reference changes. This is a design flaw in how the phase state is managed - the useEffect should only transition from "loading" to "running", not from "completed" to "running".

## Additional Context

The fix attempt in commit `e9807e807` was correct in spirit (wait for user exit) but didn't address this root cause because `waitForExit()` would still be waiting while the UI shows the wrong screen. The user is stuck looking at the running UI instead of the completion UI, unable to see preview URLs.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, git log, git show*
