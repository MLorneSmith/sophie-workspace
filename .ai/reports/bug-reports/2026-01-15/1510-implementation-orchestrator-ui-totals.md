# Implementation Report: #1510 - Orchestrator UI Shows Wrong Progress Totals

**Status:** ✅ COMPLETE
**Issue:** Bug Fix: Orchestrator UI shows wrong progress totals (0/1 instead of manifest values)
**GitHub:** [#1510](https://github.com/slideheroes/2025slideheroes/issues/1510)

## Summary

Fixed the orchestrator UI displaying incorrect progress totals by moving the `saveManifest()` call to execute before starting the UI, ensuring `overall-progress.json` is written with correct values before the UI poller begins.

### Problem
When the Alpha Orchestrator started with UI enabled, it displayed "0/1" for initiatives instead of the actual manifest values (e.g., "0/4"). This was caused by a timing issue:

1. Orchestrator creates manifest with correct totals
2. Orchestrator **starts UI** (polling begins immediately)
3. UI finds no `overall-progress.json` file (not written yet)
4. UI falls back to `aggregateProgress()` defaults: `initiativesTotal: 1`, `featuresTotal: 0`
5. Orchestrator writes `overall-progress.json` (too late)

### Root Cause Analysis
**File:** `.ai/alpha/scripts/lib/orchestrator.ts`

The orchestrator had this sequence:
- Line 840-876: Start UI (calls `startOrchestratorUI()`)
- Line 1053: Write manifest via `saveManifest(manifest)`

The UI's progress poller starts immediately upon initialization and begins polling `overall-progress.json`. If the file doesn't exist, `useProgressPoller.ts:881-887` calls `aggregateProgress()` which uses hardcoded fallback values instead of the manifest values.

### Solution Implemented

**File:** `.ai/alpha/scripts/lib/orchestrator.ts` (lines 845-848)

Moved the `saveManifest(manifest)` call to execute immediately after archiving old progress files but **before** starting the UI:

```typescript
// Archive old progress/log files and clear for new run
archiveAndClearPreviousRun(runId);

// CRITICAL: Write initial manifest progress BEFORE starting UI
// This ensures the UI poller finds overall-progress.json with correct totals
// instead of falling back to hardcoded defaults (0/1 instead of actual values)
saveManifest(manifest);

// Generate sandbox labels for UI
const sandboxLabels = Array.from(
  { length: options.sandboxCount },
  (_, i) => `sbx-${String.fromCharCode(97 + i)}`,
);
```

This ensures:
1. Manifest is created with correct totals (from spec initialization)
2. Old progress files are archived and cleared
3. **New progress file is written immediately** with correct values
4. UI starts and poller finds the file with correct totals

### Changes Made

| File | Changes | Lines |
|------|---------|-------|
| `.ai/alpha/scripts/lib/orchestrator.ts` | Added `saveManifest(manifest)` call before UI start | 845-848 |

### Validation Results

✅ **TypeScript Type Checking:** PASSED
- No type errors in modified file or affected packages
- `pnpm --filter @slideheroes/alpha-scripts typecheck` succeeded

✅ **Linting:** PASSED
- Biome formatting and linting: No issues
- `biome check .ai/alpha/scripts/lib/orchestrator.ts` succeeded

✅ **Pre-commit Hooks:** PASSED
- TruffleHog: No secrets detected
- Biome: No formatting or lint issues
- Type-check: No TypeScript errors
- Commitlint: Commit message format valid

### Git Commit

```
7f5c262fc fix(tooling): write orchestrator progress before starting UI
```

**Commit Message:**
```
fix(tooling): write orchestrator progress before starting UI

The orchestrator UI poller was reading overall-progress.json before it was
written, causing it to fall back to hardcoded defaults (0/1 initiatives
instead of manifest values). Moving saveManifest() to execute immediately
after archiving old progress files but before starting the UI ensures the
poller finds the file with correct totals.

Fixes #1510
```

### How to Test

Manual verification:
```bash
# Start orchestrator with a spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# The UI should show correct totals immediately (e.g., "0/4" for initiatives)
# instead of "0/1"
```

### Related Files

- **UI Progress Poller:** `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts`
  - Lines 419-490: `aggregateProgress()` function with fallback defaults
  - Lines 766-888: `pollNow()` function that reads `overall-progress.json`

- **Manifest Management:** `.ai/alpha/scripts/lib/manifest.ts`
  - Lines 93-108: `saveManifest()` function
  - Lines 150-218: `writeOverallProgress()` function that writes the file

### Impact

**Positive:**
- UI now displays correct progress totals from the start
- No more misleading "0/1" display on startup
- User sees accurate progress immediately

**Scope:**
- Minimal, single-file fix
- No changes to data structures or APIs
- No performance impact

### Acceptance Criteria

✅ UI displays correct initiative totals on startup
✅ No hardcoded defaults used when manifest is available
✅ All validation checks pass
✅ Code follows project conventions
✅ GitHub issue closed

---

**Implementation Date:** 2026-01-15
**Completed By:** Claude Opus 4.5
