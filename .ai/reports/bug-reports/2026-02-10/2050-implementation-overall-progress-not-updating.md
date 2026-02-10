## ✅ Implementation Complete

### Summary
- Added `syncSandboxProgressToManifest()` function to bridge the data flow gap between sandbox progress files and the manifest
- Called this function at the start of `writeOverallProgress()` so real-time task counts are available before computing overall progress
- Added 8 unit tests covering: basic sync, multi-sandbox, completed features, no-sandbox edge case, non-regression, missing/malformed files, and integration with `writeOverallProgress()`
- Exported the new function from `lib/index.ts` for testability

### Root Cause
`manifest.feature_queue[].tasks_completed` was only set at `feature.ts:750` after feature execution completed. During execution, it stayed at `0`. The sandbox progress files (`sbx-{label}-progress.json`) had accurate real-time counts from the progress poller, but this data never flowed into the manifest's aggregate calculation.

### Fix Approach
Before calculating overall progress in `writeOverallProgress()`, read each in-progress feature's assigned sandbox progress file and update `feature.tasks_completed` with the real-time count. This is a one-way sync that never regresses counts (always takes the higher value).

### Files Changed
```
.ai/alpha/scripts/lib/manifest.ts               | +49 (new syncSandboxProgressToManifest function + call site)
.ai/alpha/scripts/lib/index.ts                   | +1  (export new function)
.ai/alpha/scripts/lib/__tests__/manifest.spec.ts | +367 (8 new tests)
```

### Commits
```
a80f752cb fix(tooling): sync sandbox progress to manifest during polling (#2050)
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 39/39 tasks passed (FULL TURBO)
- `pnpm lint:fix` - 0 errors, 20 pre-existing warnings
- `pnpm format:fix` - 1724 files checked
- `pnpm --filter web test` - 725/725 tests passed
- Manifest tests: 37/37 passed (including 8 new tests)
- Progress tests: 24/24 passed (no regressions)

### Regression Prevention
- Never regresses counts (only updates if sandbox shows higher count)
- Skips completed features entirely (doesn't overwrite their count)
- Gracefully handles missing/malformed sandbox progress files
- Maintains manifest-authoritative design from #1688
- No changes to status transitions (#1955, #1957)
- No changes to UI poller (#1699, #1701)

### Follow-up Items
- Integration test during live spec execution recommended (manual testing checklist in plan)
- No technical debt created

---
*Implementation completed by Claude*
