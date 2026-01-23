# Bug Diagnosis: Alpha Orchestrator Completion Handling Issues

**ID**: ISSUE-1719
**Created**: 2026-01-22T15:30:00Z
**Reporter**: user (manual report)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator has multiple issues related to completion handling and UI display. When a Spec finishes execution (all features/tasks complete), the completion screen is not shown, event messages stop appearing, sandbox count unexpectedly drops, and there are formatting issues in sandbox columns when output contains ANSI escape codes.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development (local)
- **Node Version**: v22.x
- **Database**: PostgreSQL (via Supabase)
- **Last Working**: Unknown (new feature debugging)

## Reproduction Steps

1. Create a debug spec (S0000-Spec-debug-completion) with a trivial feature
2. Run the orchestrator: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui`
3. Wait for the single feature to complete
4. Observe that:
   - UI shows 100% progress but stays on "IN PROGRESS"
   - Completion screen never appears
   - No "Spec completed!" event in event log
   - Only 2 sandboxes visible (expected: designed behavior)
   - Sandbox output columns show garbled characters from ANSI codes

## Expected Behavior

1. When all features complete, the orchestrator should:
   - Set `manifest.progress.status = "completed"`
   - Write updated overall-progress.json with status: "completed"
   - UI should transition to CompletionUI screen
   - Event log should show "Spec #S0 completed!" message
2. ANSI escape codes should be stripped from output before display

## Actual Behavior

1. `manifest.progress.status` remains `"in_progress"` even though:
   - `feature.status = "completed"`
   - `initiative.status = "completed"`
   - All tasks show as complete
2. UI stays on the main dashboard (never shows CompletionUI)
3. No completion event is generated
4. Sandbox output columns display raw ANSI escape codes causing layout breaks

## Diagnostic Data

### Overall Progress File
```json
{
  "specId": "S0",
  "specName": "debug completion",
  "status": "in_progress",  // <-- Should be "completed"
  "initiativesCompleted": 1,
  "initiativesTotal": 1,
  "featuresCompleted": 1,
  "featuresTotal": 1,
  "tasksCompleted": 2,
  "tasksTotal": 2
}
```

### Spec Manifest Progress Section
```json
"progress": {
  "status": "in_progress",  // <-- Not updated to "completed"
  "initiatives_completed": 0,  // <-- Not updated
  "features_completed": 0,  // <-- Not updated
  "tasks_completed": 0,  // <-- Not updated
  "last_completed_feature_id": "S0000.I1.F1"  // <-- This IS updated
}
```

### Sandbox Progress (sbx-a)
```json
{
  "status": "completed",
  "phase": "completed",
  "completed_tasks": ["task-1", "task-2"],
  "recent_output": [
    "...\u001b[<u\u001b[?1004l\u001b[?2004l\u001b[?25h",  // ANSI codes!
    "\u001b[?2004h\u001b]0;user@e2b: ~/project\u0007..."
  ]
}
```

### Console Output
The implementation command couldn't find the feature due to a path issue but exited with code 0, causing the orchestrator to consider it completed.

## Error Stack Traces
No explicit errors - the orchestrator is still running and blocked.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1501-1670)
  - `.ai/alpha/scripts/lib/manifest.ts` (`writeOverallProgress`)
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (lines 290-300)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` (lines 710-723)

- **Suspected Functions**:
  - `createReviewSandbox()` - may be blocking/hanging
  - `startDevServer()` - may be blocking/hanging
  - Output display lacking ANSI code stripping

## Root Cause Analysis

### Issue A: Completion Screen Not Shown

**Root Cause**: The orchestrator sets `manifest.progress.status = "completed"` at line 1617 only AFTER:
1. Work loop completes
2. Sandboxes are killed (sbx-b, sbx-c)
3. Review sandbox is created
4. Dev server is started

If any of these post-work-loop steps hangs or takes too long, the status is never set to "completed". The orchestrator is likely stuck at `createReviewSandbox()` or `startDevServer()`.

**Evidence**:
- `overall-progress.json` shows `status: "in_progress"`
- But all features, initiatives, and tasks show as completed in their individual entries
- The orchestrator is still running (per user observation)

**Confidence**: High

### Issue B: Sandbox Count Reduction (3→2)

**Root Cause**: This is **intentional behavior**, not a bug. At lines 1531-1539 of orchestrator.ts:
```typescript
// Kill non-primary implementation sandboxes (sbx-b, sbx-c, etc.)
for (const instance of otherInstances) {
  await instance.sandbox.kill();
}
```

The orchestrator intentionally kills sbx-b and sbx-c after the work loop to:
1. Keep only sbx-a for code inspection via VS Code
2. Create a fresh review sandbox for the dev server

**Confidence**: High (this is documented in code comments)

### Issue C: Missing Event Messages After Completion

**Root Cause**: The "Spec completed!" event is generated in `useProgressPoller.ts` (lines 710-723) only when:
```typescript
previousState.overallProgress.status === "in_progress" &&
newState.overallProgress.status === "completed"
```

Since the `overall-progress.json` never transitions to `status: "completed"` (see Issue A), the completion event is never generated.

**Confidence**: High

### Issue D: Sandbox Column Formatting Issues

**Root Cause**: The `recent_output` array in sandbox progress files contains raw terminal output with ANSI escape codes (e.g., `\u001b[?2004h`). The SandboxColumn component displays these without stripping the codes:

```tsx
{state.recentOutput.slice(0, 6).map((line) => (
  <Text key={line} dimColor>
    {truncate(line, 28)}  // truncate doesn't strip ANSI
  </Text>
))}
```

ANSI codes are invisible but occupy character positions, causing:
- Incorrect truncation (cuts mid-sequence)
- Layout breaking (sequences interpreted by terminal)
- Visual garbage when sequences partially render

**Evidence**: `recent_output` in sbx-a-progress.json contains sequences like:
- `\u001b[<u\u001b[?1004l\u001b[?2004l`
- `\u001b[01;32muser@e2b\u001b[00m`

**Confidence**: High

## Fix Approach (High-Level)

### Issue A Fix
The orchestrator's post-work-loop operations (createReviewSandbox, startDevServer) should have:
1. Timeout handling to prevent infinite blocking
2. Status should be set to "completed" immediately after work loop exits, with reviewUrls populated asynchronously
3. Or: Move status update before review sandbox creation with proper error handling

### Issue B Fix
No fix needed - this is intentional behavior. Consider adding a UI event/message to clarify what's happening (e.g., "Shutting down worker sandboxes, preparing review environment...")

### Issue C Fix
This will be automatically fixed when Issue A is fixed, as the completion event depends on status transition.

### Issue D Fix
Add ANSI escape code stripping before displaying recent_output:
```typescript
function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}
```

Apply in SandboxColumn or in the progress file writer before storing.

## Diagnosis Determination

The primary root cause is that the orchestrator's completion flow is blocked somewhere after the work loop exits. The code at line 1617 that sets `manifest.progress.status = "completed"` is never reached because either `createReviewSandbox()` or `startDevServer()` is hanging.

Secondary issue is ANSI codes in output not being stripped before display in the UI.

## Additional Context

- The debug spec S0000 was created to test completion flow
- The implementation command failed to find the feature but exited with code 0
- The orchestrator interpreted exit code 0 as success and marked feature complete
- This suggests the feature finding logic in the sandbox has a separate issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash*
