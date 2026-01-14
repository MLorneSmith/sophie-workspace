# Bug Diagnosis: Alpha Orchestrator Console Messages Appearing Above UI

**ID**: ISSUE-1456
**Created**: 2026-01-14T00:00:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

When running the Alpha Spec Orchestrator with UI mode enabled, several console.log messages appear above the Ink UI dashboard and then disappear. These messages include lock acquisition, feature assignment logs, and race condition warnings. The messages are visually disruptive and indicate that some console output is escaping the Ink UI framework's control.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Browser**: N/A (CLI tool)
- **Node Version**: Current
- **Database**: N/A
- **Last Working**: Never worked correctly (design oversight)

## Reproduction Steps

1. Ensure you have a spec with multiple features ready for implementation
2. Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
3. Observe that messages appear above the UI box before the UI renders:
   ```
   🔒 Acquired orchestrator lock
   ✅ Feature #1367 assigned to sbx-a at 1768404760495
   ✅ Feature #1373 assigned to sbx-b at 1768404760496
   ✅ Feature #1376 assigned to sbx-c at 1768404760496
   ```
4. The UI then renders and these messages either stay visible above it or get partially overwritten

## Expected Behavior

When UI mode is enabled (`options.ui = true`), NO console output should appear outside the Ink UI framework. All status messages should be displayed within the UI dashboard components.

## Actual Behavior

Multiple console.log statements in `work-queue.ts` and `lock.ts` output directly to stdout without checking if UI mode is enabled, causing messages to appear above/outside the Ink UI dashboard.

## Diagnostic Data

### Console Output
```
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
🔒 Acquired orchestrator lock
✅ Feature #1367 assigned to sbx-a at 1768404760495
✅ Feature #1373 assigned to sbx-b at 1768404760496
✅ Feature #1376 assigned to sbx-c at 1768404760496
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  ALPHA ORCHESTRATOR - Spec #1362                                          ║
...
```

### Network Analysis
N/A - Local CLI tool

### Database Analysis
N/A - UI rendering issue

### Performance Metrics
N/A - UI rendering issue

### Screenshots
N/A - Terminal-based UI

## Error Stack Traces
No errors - this is a logging behavior issue, not a crash.

## Related Code

### Affected Files

1. **`.ai/alpha/scripts/lib/work-queue.ts`** - Primary source of escaped console.log calls
   - Line 76: `console.log(\`🔧 Fixing inconsistent state...\`)`
   - Lines 101-102: `console.log(\`⏳ Feature #${feature.id} was recently assigned...\`)`
   - Lines 161-165: Race lost log
   - Lines 174-176: Race detected log
   - Lines 192-194: **`console.log(\`✅ Feature #${feature.id} assigned to ${sandboxLabel}...\`)`** - This is the message in the reproduction
   - Lines 235-238: Stale in_progress reset log
   - Lines 262: Marking for retry log

2. **`.ai/alpha/scripts/lib/lock.ts`** - Lock acquisition messages
   - `🔒 Acquired orchestrator lock` message

### Recent Changes
N/A - This is an existing design pattern issue

### Suspected Functions

1. `assignFeatureToSandbox()` in work-queue.ts - calls console.log without UI mode check
2. `getNextAvailableFeature()` in work-queue.ts - calls console.log for state fixes
3. `cleanupStaleState()` in work-queue.ts - calls console.log for cleanup messages
4. `acquireLock()` in lock.ts - calls console.log without UI mode check

## Related Issues & Context

### Direct Predecessors
None found - this appears to be an undiscovered issue.

### Related Infrastructure Issues
None - this is purely a UI/logging concern.

### Similar Symptoms
None found.

### Same Component
None found related to Alpha Orchestrator UI.

### Historical Context
This appears to be an original design oversight. Other modules (orchestrator.ts, sandbox.ts, feature.ts, progress.ts) correctly use a `createLogger(uiEnabled)` pattern that conditionally suppresses output when UI mode is active. The work-queue.ts and lock.ts modules were not updated to follow this pattern.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `work-queue.ts` and `lock.ts` modules use raw `console.log()` calls instead of the conditional logger pattern used elsewhere in the codebase, causing messages to escape Ink UI control.

**Detailed Explanation**:

The Alpha Orchestrator UI uses Ink (a React-based terminal UI framework) that takes control of stdout to render its dashboard. Other modules in the orchestrator follow a consistent pattern:

```typescript
function createLogger(uiEnabled: boolean) {
    return {
        log: (...args: unknown[]) => {
            if (!uiEnabled) console.log(...args);
        },
    };
}
```

However, `work-queue.ts` was written without awareness of this pattern and uses direct `console.log()` calls for:
1. Feature assignment confirmations (line 192-194)
2. Race condition detection/warnings (lines 101-102, 161-165, 174-176)
3. State cleanup notifications (lines 235-238, 262)
4. Inconsistent state fixes (line 76)

Similarly, `lock.ts` outputs lock acquisition messages directly.

**Supporting Evidence**:
- In `orchestrator.ts:77-87`, the `createLogger()` function is defined and used throughout
- In `sandbox.ts:29-35`, the same `createLogger()` pattern is implemented
- In `feature.ts:56-62`, the same `createLogger()` pattern is implemented
- In `progress.ts:337`, progress updates check `if (!uiEnabled)` before calling `displayProgressUpdate()`
- In `work-queue.ts`, there is NO `createLogger()` function and NO `uiEnabled` parameter

The specific message `✅ Feature #1367 assigned to sbx-a at 1768404760495` comes from `work-queue.ts:192-194`:
```typescript
console.log(
    `✅ Feature #${feature.id} assigned to ${sandboxLabel} at ${now}`,
);
```

### How This Causes the Observed Behavior

1. Orchestrator starts with `options.ui = true`
2. Before Ink UI fully initializes, or in code paths that don't have access to `uiEnabled` flag, `work-queue.ts` functions are called
3. These functions use raw `console.log()` which writes directly to stdout
4. Ink starts and takes control of the terminal, but the previous output remains visible above the UI
5. As Ink redraws, the old output may get partially overwritten or remain as artifacts

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code clearly shows `console.log()` calls without any UI mode checking in work-queue.ts
2. Other modules in the same codebase correctly implement the conditional logging pattern
3. The exact message in the reproduction (`✅ Feature #... assigned to ...`) matches line 192-194 of work-queue.ts
4. The behavior is consistent with how Ink terminal UI works - output before Ink initialization remains visible

## Fix Approach (High-Level)

1. Add `uiEnabled` parameter to functions in `work-queue.ts` that need to log
2. Create a conditional logger in `work-queue.ts` following the pattern from other modules
3. Replace all `console.log()` calls with conditional logger calls
4. Pass `uiEnabled` through the call chain from `orchestrator.ts` to `work-queue.ts` functions
5. Similarly update `lock.ts` to accept and use a `uiEnabled` parameter

Alternatively, since `work-queue.ts` functions are called from `orchestrator.ts` which knows the `uiEnabled` state:
- Export a module-level `setUiEnabled(enabled: boolean)` function in work-queue.ts
- Call it at orchestrator startup before any work queue operations
- Use that flag in a module-scoped conditional logger

## Diagnosis Determination

The root cause has been positively identified: raw `console.log()` calls in `work-queue.ts` and `lock.ts` that don't respect the UI mode flag used throughout the rest of the orchestrator codebase. This is a design oversight where these modules weren't updated to follow the conditional logging pattern established in other modules.

## Additional Context

This issue is cosmetic/UX in nature - it doesn't affect the actual functionality of the orchestrator. Features are still assigned correctly, the UI still works, and orchestration proceeds normally. However, the visual artifacts reduce the polish of the UI experience.

The fix is straightforward and follows an established pattern in the codebase. The main consideration is ensuring the `uiEnabled` flag is properly propagated to all the logging call sites.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob*
