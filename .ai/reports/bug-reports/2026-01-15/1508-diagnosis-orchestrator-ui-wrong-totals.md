# Bug Diagnosis: Alpha Orchestrator UI Shows Wrong Progress Totals (0/1)

**ID**: ISSUE-1508
**Created**: 2026-01-15T22:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When starting the Alpha Orchestrator with `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`, the UI displays incorrect progress totals ("0/1" for initiatives, features, and tasks) instead of the actual manifest values (0/4 initiatives, 0/13 features, 0/110 tasks). Sandboxes show "Waiting for work..." which is misleading since work should be available.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v20+
- **Last Working**: N/A (new system)

## Reproduction Steps

1. Have a decomposed spec in `.ai/alpha/specs/1362-Spec-user-dashboard-home/` with manifest showing 4 initiatives, 13 features, 110 tasks
2. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
3. Observe the UI showing "0/1" for all progress bars instead of correct totals
4. Observe sandboxes showing "Waiting for work..." during initialization

## Expected Behavior

UI should display correct totals from the manifest:
- Initiatives: 0/4
- Features: 0/13
- Tasks: 0/110

## Actual Behavior

UI displays hardcoded fallback values:
- Initiatives: 0/1
- Features: 0/1
- Tasks: 0/1

## Diagnostic Data

### Console Output
```
⚠️ Supabase CLI not configured (missing SUPABASE_ACCESS_TOKEN and SUPABASE_SANDBOX_PROJECT_REF)
   Database migration sync after features will be skipped
...
│  Initiatives:[░░░░░░░░░░░░░░░░░░░░░░░░░] 0/1
│  Features:   [░░░░░░░░░░░░░░░░░░░░░░░░░] 0/1
│  Tasks:      [░░░░░░░░░░░░░░░░░░░░░░░░░] 0/1
```

### Network Analysis
N/A - Local orchestrator issue

### Database Analysis
N/A - Not database related

### Performance Metrics
N/A

## Error Stack Traces
No errors - this is a timing/ordering issue

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 841-1053)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` (lines 1001-1019, 419-490)
  - `.ai/alpha/scripts/lib/manifest.ts` (writeOverallProgress)
- **Recent Changes**: None relevant
- **Suspected Functions**: `orchestrate()`, `createInitialState()`, `aggregateProgress()`

## Related Issues & Context

### Direct Predecessors
None - new issue

### Historical Context
This is a newly built system; the timing issue was not caught during initial development.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The UI is started BEFORE `overall-progress.json` is written, causing the UI to use hardcoded fallback values.

**Detailed Explanation**:

The orchestrator flow in `orchestrate()` (`.ai/alpha/scripts/lib/orchestrator.ts`) is:

1. **Line 841-883**: UI starts via `startOrchestratorUI()`
2. **Line 954-959**: Cleanup stale state - `saveManifest()` only called IF `cleanedCount > 0`
3. **Line 961-986**: Print spec info
4. **Line 994-1051**: Create sandboxes (async)
5. **Line 1053**: First unconditional `saveManifest()` call

When there's no stale state to clean (manifest already reset to "pending"), step 2 doesn't save the manifest. The UI starts polling for `overall-progress.json` but the file doesn't exist yet.

In `useProgressPoller.ts`, when `readOverallProgress()` returns `null` (line 766-767), the code falls back to `aggregateProgress()` (lines 882-888), which has:

```typescript
initiativesTotal: 1, // Specs have one initiative by design (line 483)
```

And since no sandbox has started working yet, `featuresTotal` and `tasksTotal` are 0.

Additionally, `createInitialState()` (lines 1001-1019) also hardcodes:
```typescript
initiativesTotal: 1,
featuresTotal: 0,
tasksTotal: 0,
```

**Supporting Evidence**:
- Progress directory is empty: `.ai/alpha/progress/` has no files
- Manifest shows correct values: 4 initiatives, 13 features, 110 tasks
- UI shows "0/1" for all bars, matching the hardcoded fallback

### How This Causes the Observed Behavior

1. User runs orchestrator
2. UI starts and begins polling
3. `overall-progress.json` doesn't exist
4. `readOverallProgress()` returns `null`
5. `aggregateProgress()` fallback is used with hardcoded `initiativesTotal: 1`
6. `featuresTotal` = 0 (no features seen yet), `tasksTotal` = 0
7. ProgressBar renders "0/1" for initiatives, "0/0" displayed as "0/1" for features/tasks

### Confidence Level

**Confidence**: High

**Reasoning**:
- Code path is clearly traceable
- Hardcoded values match observed behavior exactly
- Progress files are confirmed empty
- Manifest has correct values but UI doesn't read it directly

## Fix Approach (High-Level)

Call `saveManifest(manifest)` BEFORE starting the UI to ensure `overall-progress.json` exists with correct totals when the UI begins polling. This requires adding a single line around line 840 in `orchestrator.ts`:

```typescript
// Write initial progress file BEFORE starting UI
saveManifest(manifest, undefined, runId);

// Then start UI...
uiManager = startOrchestratorUI({...});
```

## Diagnosis Determination

The root cause has been definitively identified: the orchestrator starts the UI before writing `overall-progress.json`, causing the UI to display hardcoded fallback values instead of actual manifest totals. The fix is straightforward - call `saveManifest()` before starting the UI.

## Additional Context

The warning about missing Supabase tokens (`SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF`) is unrelated to this bug - it's informational and only affects post-feature migration sync.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (orchestrator.ts, useProgressPoller.ts, manifest.ts, database.ts, environment.ts), Bash (directory listings), Grep*
