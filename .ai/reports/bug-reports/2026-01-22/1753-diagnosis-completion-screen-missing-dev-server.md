# Bug Diagnosis: Completion Screen Missing Dev Server URL and Progress Events

**Date**: 2026-01-22
**Diagnosed by**: Claude Opus 4.5
**Severity**: Medium
**Status**: Ready for Bug Plan

## Problem Statement

After implementing Bug fixes #1736 (orchestrator completion events) and #1747 (UI delay), the Alpha workflow completion screen:
1. Does NOT show the dev server URL
2. Does NOT show any progress indication during review sandbox creation/dev server startup

## Root Cause Analysis

### Two-Phase Save Architecture Issue

The orchestrator uses a two-phase save approach (Bug fix #1746):

**Phase 1 (Line 1534 in orchestrator.ts):**
```typescript
saveManifest(manifest, [], runId);  // Empty reviewUrls
```
This immediately writes `overall-progress.json` with `status: "completed"` but **empty `reviewUrls`**.

**Phase 2 (Line 1716 in orchestrator.ts):**
```typescript
saveManifest(manifest, reviewUrls, runId);  // With populated reviewUrls
```
This writes after review sandbox operations complete (can take 2-10+ minutes).

### UI Race Condition

When the UI polls `overall-progress.json` and sees `status: "completed"`:
1. It immediately transitions to `CompletionUI` (line 451-461 in index.tsx)
2. The `CompletionUI` only shows `reviewUrls` if `reviewUrls && reviewUrls.length > 0` (line 210)
3. At Phase 1 save time, `reviewUrls` is empty, so nothing is shown

### Evidence from Test Run (S0000-Spec-debug-completion)

**spec-manifest.json:**
- `status: "completed"`
- `completed_at: "2026-01-22T19:24:10.962Z"` (feature completion time)
- `last_checkpoint: "2026-01-22T19:34:37.043Z"` (10 minutes later)
- `sandbox_ids: []` (empty - review sandbox was cleaned up or never created)

**overall-progress.json:**
- `status: "completed"`
- No `reviewUrls` field present

**File timestamps:**
- Both files modified at exact same time: `14:34:37.038...`
- This suggests Phase 2 ran but with empty `reviewUrls` (review sandbox failed)

### Completion Phase Event Flow

Events are emitted but not displayed on completion screen:
1. `completion_phase_start` - Emitted at line 1544
2. `review_sandbox_creating` - Emitted at line 1595
3. `dev_server_starting` - Emitted at line 1629
4. `dev_server_ready` OR `dev_server_failed` - Emitted at lines 1652/1661

The `CompletionUI` component does NOT display these events - it only shows static completion info.

## Impact

- Users see the completion screen without:
  - Dev server URL for testing
  - VS Code URL for code review
  - Any indication that sandbox operations are still running
- Users may think the workflow is broken or exit prematurely

## Technical Details

### Files Involved

1. **orchestrator.ts** (lines 1517-1720)
   - Two-phase save approach creates race condition
   - Review sandbox/dev server operations run AFTER Phase 1 save

2. **OrchestratorUI.tsx** (lines 155-240)
   - `CompletionUI` only shows static info
   - No support for streaming events or progress indication

3. **index.tsx** (lines 451-461)
   - Immediate transition to completed state when `status === "completed"`
   - No intermediate "completing" state for sandbox operations

4. **manifest.ts** (lines 818-890)
   - `writeOverallProgress()` only writes `reviewUrls` if provided and non-empty
   - Phase 1 call passes empty array, so no field is written

### Possible Root Causes for Empty reviewUrls

1. **Review sandbox creation failed** - Timeout or E2B API error
2. **Dev server failed to start** - 200-second timeout exceeded
3. **Orphaned ID cleanup** - Lines 1697-1708 remove sandbox IDs not in `runningSandboxIds`

## Proposed Solution

### Fix 1: Add "Setting Up Review Environment" State

Create intermediate UI state between "in_progress" and "completed":

```typescript
// In index.tsx, add new state:
case "completing":
  return (
    <CompletingUI
      specId={specId}
      progress={enhancedState.overallProgress}
      events={enhancedState.events}
      elapsed={getElapsedTime()}
    />
  );
```

The orchestrator would set `status: "completing"` in Phase 1, then `status: "completed"` in Phase 2.

### Fix 2: Show Events on Completion Screen

Modify `CompletionUI` to display completion phase events:

```typescript
// Add events prop to CompletionUI
reviewEvents?: UIEvent[];

// Show events section
{reviewEvents && reviewEvents.length > 0 && (
  <Box marginTop={1}>
    <Text bold>Setting up review environment...</Text>
    {reviewEvents.map(event => (
      <Text key={event.id}>{event.message}</Text>
    ))}
  </Box>
)}
```

### Fix 3: Poll for reviewUrls After Completion

Continue polling `overall-progress.json` after showing completion screen until `reviewUrls` is populated or a timeout is reached:

```typescript
// In useProgressPoller.ts
if (overallProgress.status === "completed" && !overallProgress.reviewUrls) {
  // Continue polling for reviewUrls
  return;
}
```

## Recommended Approach

**Fix 1 + Fix 2** is the recommended approach:

1. Add `"completing"` status to show user that review sandbox is being set up
2. Display completion phase events on the UI
3. Transition to full `"completed"` only when `reviewUrls` is populated or review operations fail

This provides:
- Clear user feedback during the 2-10 minute review sandbox setup
- All event information visible (review_sandbox_creating, dev_server_starting, etc.)
- Graceful handling of review sandbox failures

## Files to Modify

1. `.ai/alpha/scripts/lib/orchestrator.ts` - Add "completing" status
2. `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx` - Add CompletingUI or enhance CompletionUI
3. `.ai/alpha/scripts/ui/index.tsx` - Handle "completing" state
4. `.ai/alpha/scripts/ui/types.ts` - Add "completing" to status enum
5. `.ai/alpha/scripts/lib/manifest.ts` - Update OverallProgress type

## Verification Steps

1. Run spec orchestrator: `pnpm ts-node .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui`
2. Verify "completing" state shows during review sandbox creation
3. Verify events are displayed (review_sandbox_creating, dev_server_starting)
4. Verify completion screen shows dev server URL when ready
5. Verify graceful handling when review sandbox fails

## Related Issues

- #1746 - Two-phase manifest save (created this race condition)
- #1747 - UI delay fix (relies on Phase 1 save)
- #1727 - Complete lifecycle redesign
- #1720 - Frozen UI bug (original motivation for two-phase save)
