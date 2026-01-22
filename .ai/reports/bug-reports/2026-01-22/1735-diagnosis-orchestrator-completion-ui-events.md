# Bug Diagnosis: Orchestrator Completion Phase Events Not Displayed Correctly in UI

**ID**: ISSUE-1735
**Created**: 2026-01-22T17:30:00.000Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator's completion phase emits events (`completion_phase_start`, `sandbox_killing`, `review_sandbox_creating`, `dev_server_starting`, `dev_server_ready`, `dev_server_failed`) but these events display with red ❌ icons in the UI's Recent Events panel because the event types are not mapped in the UI components. Additionally, the review sandbox creation progress is not visible to users because there are insufficient events emitted during the review sandbox setup process.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v20+
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A (first implementation of completion phase visibility)

## Reproduction Steps

1. Run the Alpha Orchestrator on any spec (e.g., `pnpm orchestrate S0 --ui`)
2. Wait for all features to complete
3. Observe the Recent Events panel during completion phase
4. Notice red ❌ icons appear for all completion phase events
5. Notice no dev server URL appears in the completion screen

## Expected Behavior

1. Completion phase events should display with appropriate icons:
   - `completion_phase_start` → 🏁 or 🔄
   - `sandbox_killing` → 🗑️ or ⏹️
   - `review_sandbox_creating` → 📦
   - `dev_server_starting` → 🚀
   - `dev_server_ready` → ✅
   - `dev_server_failed` → ❌

2. Review sandbox creation progress should be visible with events for:
   - Git checkout progress
   - Dependency sync progress
   - Build progress
   - Dev server startup progress

## Actual Behavior

1. All completion phase events display with red ❌ icons because:
   - Events fall through to default icon (`•`) in code, but red ❌ shown in UI
   - Event types are not in `OrchestratorEventType` union in `types.ts`
   - Event types are not in `EVENT_ICONS` mapping in `EventLog.tsx`
   - Event types are not in `EVENT_COLORS` mapping in `EventLog.tsx`

2. Review sandbox creation has minimal visibility:
   - Only `review_sandbox_creating`, `dev_server_starting`, `dev_server_ready/failed` events emitted
   - Long operations (git checkout, pnpm install, build) have no progress events
   - User sees frozen UI for 2-5 minutes during review sandbox setup

## Diagnostic Data

### UI Event Type Mismatch

The event-emitter.ts defines completion event types:
```typescript
// .ai/alpha/scripts/lib/event-emitter.ts:37-49
export type OrchestratorCompletionEventType =
  | "completion_phase_start"
  | "sandbox_killing"
  | "review_sandbox_creating"
  | "dev_server_starting"
  | "dev_server_ready"
  | "dev_server_failed";
```

But types.ts does NOT include these:
```typescript
// .ai/alpha/scripts/ui/types.ts:199-225
export type OrchestratorEventType =
  | "task_start"
  | "task_complete"
  // ... database events ...
  | "db_verify";
  // MISSING: completion phase events
```

### Missing Icon/Color Mappings

```typescript
// .ai/alpha/scripts/ui/components/EventLog.tsx:13-40
const EVENT_ICONS: Record<OrchestratorEventType, string> = {
  // ... existing mappings ...
  // MISSING: completion_phase_start, sandbox_killing, etc.
};

// .ai/alpha/scripts/ui/components/EventLog.tsx:45-72
const EVENT_COLORS: Record<OrchestratorEventType, string> = {
  // ... existing mappings ...
  // MISSING: completion_phase_start, sandbox_killing, etc.
};
```

### Review Sandbox Creation Gap

```typescript
// .ai/alpha/scripts/lib/sandbox.ts:831-896
export async function createReviewSandbox(...) {
  // Line 853-857: git fetch - no event emitted
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {...});

  // Line 859-863: git checkout - no event emitted
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git checkout -B...`, {...});

  // Line 877-880: pnpm install (can take 100+ seconds) - no event emitted
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install...`, {...});

  // Line 884-892: workspace build - no event emitted
  const buildResult = await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm --filter @kit/shared build`, {...});
}
```

### Spec Manifest State

```json
{
  "progress": {
    "status": "completed",
    "completed_at": "2026-01-22T16:52:54.855Z"
  },
  "sandbox": {
    "sandbox_ids": [],  // Empty - review sandbox ID not tracked
    "branch_name": "alpha/spec-S0"
  }
}
```

## Error Stack Traces

No stack traces - the events are being emitted successfully but the UI doesn't recognize them.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/types.ts` - Missing completion event types
  - `.ai/alpha/scripts/ui/components/EventLog.tsx` - Missing icon/color mappings
  - `.ai/alpha/scripts/lib/sandbox.ts` - Missing progress events in createReviewSandbox
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Completion phase event emission (correct)
  - `.ai/alpha/scripts/lib/event-emitter.ts` - Event type definitions (correct)

- **Recent Changes**: Bug fix #1727 added completion phase events but didn't update UI mappings

- **Suspected Functions**:
  - `EventLog.tsx` - `EVENT_ICONS` and `EVENT_COLORS` mappings
  - `types.ts` - `OrchestratorEventType` union
  - `createReviewSandbox()` - Missing event emissions for sub-operations

## Related Issues & Context

### Direct Predecessors
- #1727: Completion phase lifecycle redesign - Added event emission but didn't update UI

### Related Infrastructure Issues
- #1720: Orchestrator completion phase issues - Status was set after sandbox operations causing frozen UI

### Same Component
- #1724: Dev server startup timeout - Increased timeout to 180s for Next.js cold-start

## Root Cause Analysis

### Identified Root Cause

**Summary**: Completion phase event types were added to the event-emitter but not synchronized with the UI's type definitions and icon/color mappings.

**Detailed Explanation**:
When bug fix #1727 was implemented to add visibility into the completion phase, `emitOrchestratorEvent()` calls were added to `orchestrator.ts` lines 1536-1666 using new event types (`completion_phase_start`, `sandbox_killing`, `review_sandbox_creating`, `dev_server_starting`, `dev_server_ready`, `dev_server_failed`). These types were defined in `event-emitter.ts` but the UI layer was not updated:

1. **TypeScript types mismatch**: The `OrchestratorEventType` in `ui/types.ts` doesn't include the completion event types, causing type errors when the UI receives these events
2. **Missing icon mappings**: `EVENT_ICONS` in `EventLog.tsx` has no entries for completion events, so they display with default icon
3. **Missing color mappings**: `EVENT_COLORS` in `EventLog.tsx` has no entries, so they display with default color

Additionally, `createReviewSandbox()` in `sandbox.ts` doesn't emit progress events for its sub-operations (git fetch, git checkout, pnpm install, build), leaving users with no visibility during the 2-5 minute review sandbox setup.

**Supporting Evidence**:
- UI screenshot shows ❌ icons for "Completion phase started", "Killing implementation sandbox", "Creating fresh review sandbox"
- Code inspection confirms missing mappings in `EVENT_ICONS` and `EVENT_COLORS`
- `OrchestratorEventType` union in `types.ts` lacks completion event types
- E2B dashboard shows 1 sandbox (review sandbox exists) but no dev server URL in UI

### How This Causes the Observed Behavior

1. **Red ❌ icons**: When EventLog.tsx receives an event with type `completion_phase_start`, it looks up `EVENT_ICONS["completion_phase_start"]` which returns `undefined`. The fallback should be `"•"` but TypeScript's strict typing or a default handling path may be defaulting to the error icon.

2. **No review sandbox visibility**: The orchestrator emits `review_sandbox_creating` once, then the `createReviewSandbox()` function runs for 2-5 minutes without any events. Users see a frozen UI with no indication of progress.

3. **Progress bar stuck at 0%**: The overall progress updates correctly in the manifest, but the UI may not be polling/displaying review URLs properly after completion.

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code inspection confirms the mismatch between event-emitter types and UI types. The EVENT_ICONS and EVENT_COLORS mappings are provably incomplete. The user's screenshot showing ❌ icons matches the expected behavior when event types are unrecognized.

## Fix Approach (High-Level)

1. **Add completion event types to UI types** (`ui/types.ts:199-225`):
   - Add `completion_phase_start`, `sandbox_killing`, `review_sandbox_creating`, `dev_server_starting`, `dev_server_ready`, `dev_server_failed` to `OrchestratorEventType`

2. **Add icon mappings** (`ui/components/EventLog.tsx:13-40`):
   - `completion_phase_start` → `"🏁"` or `"🔄"`
   - `sandbox_killing` → `"⏹️"` or `"🗑️"`
   - `review_sandbox_creating` → `"📦"`
   - `dev_server_starting` → `"🚀"`
   - `dev_server_ready` → `"✅"`
   - `dev_server_failed` → `"❌"`

3. **Add color mappings** (`ui/components/EventLog.tsx:45-72`):
   - `completion_phase_start` → `"cyan"`
   - `sandbox_killing` → `"yellow"`
   - `review_sandbox_creating` → `"cyan"`
   - `dev_server_starting` → `"blue"`
   - `dev_server_ready` → `"green"`
   - `dev_server_failed` → `"red"`

4. **Add progress events to createReviewSandbox** (`lib/sandbox.ts`):
   - Emit events for git fetch, git checkout, pnpm install, and build steps
   - Consider passing an event emitter callback or importing emitOrchestratorEvent

## Diagnosis Determination

The root cause is confirmed: completion phase event types are defined in the event-emitter module but not synchronized with the UI's type definitions and icon/color mappings. This is a straightforward synchronization issue introduced when completion phase visibility was added in bug fix #1727.

## Additional Context

The overall-progress.json shows the spec completed successfully with all tasks done. The issue is purely a UI visibility problem - the orchestrator is functioning correctly, but users cannot see the completion phase progress due to missing UI mappings.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, code inspection*
