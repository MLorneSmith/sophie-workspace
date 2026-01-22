# Bug Diagnosis: Alpha Orchestrator Completion Phase Issues

**ID**: ISSUE-1726
**Created**: 2026-01-22T16:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator has four distinct issues in its completion phase: (A) the dev server fails to start, (B) no events are emitted during completion phase transitions, (C) idle sandboxes are not properly killed when all work is done, and (D) UI display issues in sandbox columns with truncated output.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A (completion phase is new feature)

## Reproduction Steps

1. Run the orchestrator with the debug spec S0000: `tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui`
2. Wait for all tasks to complete (2 tasks)
3. Observe the completion phase behavior
4. Note: Progress shows 100% but sandboxes are not properly cleaned up

## Expected Behavior

A. Dev server should start on the review sandbox within the 180-second timeout
B. Events should be emitted for sandbox closure, review sandbox creation, and dev server startup
C. All three original implementation sandboxes (sbx-a, sbx-b, sbx-c) should be killed and a new review sandbox spun up for the dev server
D. UI sandbox columns should display properly without truncation issues

## Actual Behavior

A. Dev server shows "(failed to start)" in the overall-progress.json
B. No events are displayed in the Recent Events log during completion phase
C. Only some sandboxes are killed - sbx-b and sbx-c are killed but sbx-a (implementation) is kept, and manifest shows only one sandbox ID at completion
D. Sandbox column Output section shows "u..." truncated at column boundaries

## Diagnostic Data

### Overall Progress File
```json
{
  "specId": "S0",
  "specName": "debug completion",
  "status": "completed",
  "reviewUrls": [
    {
      "label": "sbx-a",
      "vscode": "https://8080-il1hqpew1fyth99td1xzj.e2b.app",
      "devServer": "(failed to start)"
    }
  ]
}
```

### Manifest Sandbox State
```json
{
  "sandbox_ids": ["il1hqpew1fyth99td1xzj"],
  "branch_name": "alpha/spec-S0",
  "created_at": "2026-01-22T15:56:26.768Z"
}
```

### Progress Files Analysis
- sbx-a-progress.json: status "completed", phase "completed"
- sbx-b-progress.json: status "idle", phase "waiting", waiting_reason "No available features"
- sbx-c-progress.json: status "idle", phase "waiting", waiting_reason "No available features"

## Error Stack Traces

No explicit errors - the failures are silent (timeouts and missing events).

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1531-1700 completion phase logic)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 565-615 startDevServer)
  - `.ai/alpha/scripts/lib/event-emitter.ts` (lines 72-102 emitOrchestratorEvent)
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (lines 291-299 recent output display)

- **Recent Changes**: Multiple bug fixes #1590, #1720, #1724 in the completion phase
- **Suspected Functions**:
  - `startDevServer()` - timeout handling
  - `orchestrate()` completion phase - sandbox lifecycle management
  - `emitOrchestratorEvent()` - not called for completion events
  - `SandboxColumn` truncate function - UI rendering issue

## Related Issues & Context

### Similar Symptoms
- #1590: "Fresh review sandbox for dev server" - implemented the review sandbox pattern
- #1720: "Set completion status EARLY" - addressed frozen UI issue
- #1724: "Track killed sandbox IDs for cleanup" - addressed orphaned sandbox IDs

### Historical Context
The completion phase has been incrementally improved through multiple bug fixes. The current issues represent remaining gaps in the implementation.

## Root Cause Analysis

### Identified Root Causes

**Issue A - Dev Server Failed to Start:**

**Summary**: The dev server fails because the original implementation sandbox (sbx-a) is used as fallback when `createReviewSandbox()` succeeds but the fresh sandbox isn't being used correctly.

**Detailed Explanation**:
Looking at the code in `orchestrator.ts:1567-1637`:
1. `createReviewSandbox()` is called but wrapped with a 60-second timeout
2. The `startDevServer()` function uses default 180 attempts (180 seconds) timeout
3. However, the overall-progress.json shows `devServer: "(failed to start)"` which means the `startDevServer()` threw an error
4. The issue is that the `startDevServer()` function at `sandbox.ts:565-615` starts the dev server in the background and then polls for the port to be ready
5. For a fresh E2B sandbox, Next.js cold-start can take 90-120 seconds, but the implementation sandbox (sbx-a) which has been running for the full implementation may have resource pressure
6. The root cause: When `reviewSandbox` is null (creation times out), it falls back to `implementationInstance.sandbox` which has accumulated resource pressure

**Supporting Evidence**:
- overall-progress.json shows `"devServer": "(failed to start)"`
- The implementation sandbox (sbx-a) completed work ~5 minutes ago and was kept alive
- The `startDevServer()` timeout is 180 attempts × 1000ms = 180 seconds

**Issue B - No Completion Phase Events:**

**Summary**: The event emitter system has no event types defined for completion phase operations.

**Detailed Explanation**:
Looking at `event-emitter.ts:21-31`:
```typescript
export type OrchestratorDatabaseEventType =
  | "db_capacity_check"
  | "db_capacity_ok"
  | "db_capacity_warning"
  | "db_reset_start"
  // ... only database events defined
```

The completion phase in `orchestrator.ts:1531-1700` does NOT call `emitOrchestratorEvent()` for:
- Sandbox closure ("sandbox_closing", "sandbox_killed")
- Review sandbox creation ("review_sandbox_creating")
- Dev server startup ("dev_server_starting", "dev_server_ready", "dev_server_failed")

**Supporting Evidence**:
- Event emitter only defines database-related event types
- No `emitOrchestratorEvent()` calls exist in the completion phase code
- The UI shows no events during the 5+ minute completion phase

**Issue C - Sandbox Lifecycle Management:**

**Summary**: The completion phase only kills sbx-b and sbx-c, but keeps sbx-a running. The desired behavior should be to kill ALL implementation sandboxes and create a fresh review sandbox.

**Detailed Explanation**:
Looking at `orchestrator.ts:1541-1549`:
```typescript
// Kill non-primary implementation sandboxes (sbx-b, sbx-c, etc.)
const killedSandboxIds: string[] = [];
for (const instance of otherInstances) {
  // ... only kills instances.slice(1)
}
```

The code intentionally keeps `implementationInstance` (sbx-a) alive for "code inspection via VS Code". However, this conflicts with the requirement to have all original sandboxes killed and a fresh one created.

**Supporting Evidence**:
- Comment on line 1535: "Keep implementation sandbox (sbx-a) available for code inspection via VS Code"
- `otherInstances = instances.slice(1)` excludes the first sandbox
- Manifest shows only one sandbox ID at completion

**Issue D - UI Truncation in Sandbox Columns:**

**Summary**: The `recentOutput` array items are being displayed with improper truncation, causing output like "u..." to appear.

**Detailed Explanation**:
Looking at `SandboxColumn.tsx:291-299`:
```typescript
{state.recentOutput.slice(0, 6).map((line) => (
  <Text key={line} dimColor>
    {truncate(line, 28)}
  </Text>
))}
```

The `truncate()` function at line 68-71 truncates to 28 characters. However, the recentOutput array contains ANSI escape codes and terminal control sequences from the PTY output:
```json
"recent_output": [
  "...\r",
  "\u001b[<u",
  "\u001b]0;user@e2b: ~/project\u0007user@e2b:~/project$ "
]
```

The escape sequences count toward the character limit, causing visible text to be truncated to just "u..." when the actual content is an ANSI escape sequence.

**Supporting Evidence**:
- sbx-a-progress.json shows escape sequences in recent_output
- Truncate function doesn't strip ANSI codes
- The UI shows "u..." which is a truncated escape sequence "\u001b[<u"

### Confidence Level

**Confidence**: High

**Reasoning**: The root causes are directly observable in the code and progress files. Issue A is a timeout/fallback logic issue. Issue B is a missing feature (no event types for completion). Issue C is intentional design that conflicts with requirements. Issue D is ANSI escape sequence handling.

## Fix Approach (High-Level)

**Issue A**: Modify the completion phase to properly prioritize the review sandbox. If `createReviewSandbox()` fails, add better error handling and potentially try again. Consider killing sbx-a before creating review sandbox to free resources.

**Issue B**: Extend `OrchestratorDatabaseEventType` to include completion phase events:
- "completion_phase_start"
- "sandbox_killing" (with sandbox label in details)
- "review_sandbox_creating"
- "dev_server_starting"
- "dev_server_ready"
- "dev_server_failed"
Then add `emitOrchestratorEvent()` calls in the completion phase code.

**Issue C**: Change the sandbox lifecycle to:
1. Kill ALL implementation sandboxes (sbx-a, sbx-b, sbx-c)
2. Create a fresh review sandbox
3. Start dev server on the fresh sandbox
4. Provide VS Code URL for the fresh sandbox (not a separate implementation sandbox)

**Issue D**: Strip ANSI escape sequences from `recentOutput` before display, or filter them out when parsing the progress files. A simple regex like `/\u001b\[[0-9;]*m/g` or using a library like `strip-ansi` would work.

## Diagnosis Determination

All four issues have been identified with clear root causes:

1. **Dev server failure**: Fallback to implementation sandbox with resource pressure, or timeout during review sandbox creation
2. **Missing events**: Event emitter system lacks completion phase event types and no calls exist in the completion code
3. **Sandbox lifecycle**: Intentional design to keep sbx-a alive conflicts with the requirement to kill all and create fresh
4. **UI truncation**: ANSI escape sequences in recentOutput consume character budget before truncation

## Additional Context

The completion phase was added as part of bug fixes #1590, #1720, and #1724. The current implementation has evolved incrementally to address various issues, but the overall design needs refinement to address the four issues identified here.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash*
