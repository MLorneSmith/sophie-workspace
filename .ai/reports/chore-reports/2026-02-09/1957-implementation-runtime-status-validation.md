## ✅ Implementation Complete

### Summary
- Added `validateProgressStatus()` function in `progress-file.ts` that validates and normalizes status values from progress files
- Applied validation at all 4 parse sites: `readProgressFile()`, `feature.ts` direct parse, `health.ts`, and `progress.ts` polling
- Removed the critical `"blocked"` propagation path in `feature.ts` (the root cause of #1952)
- Narrowed `SandboxProgress.status` type from `string` to `"in_progress" | "completed" | "failed"` union
- Narrowed `ProgressFileData.status` to `ValidProgressStatus` (removed `"blocked"` from the union)
- Added comprehensive unit tests for the validation function

### Remapping Rules
- `"blocked"` → `"failed"` (enables retry via deadlock handler)
- Unknown values → `"in_progress"` (safe fallback, health checks detect stuck features)
- Valid values (`"in_progress"`, `"completed"`, `"failed"`) pass through unchanged

### Files Changed
```
 .ai/alpha/scripts/lib/__tests__/orchestrator.restart.spec.ts |  2 +-
 .ai/alpha/scripts/lib/__tests__/progress-file.spec.ts        | 42 +++++++++++ (new)
 .ai/alpha/scripts/lib/__tests__/progress.spec.ts             |  6 +-
 .ai/alpha/scripts/lib/feature.ts                             | 29 ++++----
 .ai/alpha/scripts/lib/health.ts                              |  9 ++-
 .ai/alpha/scripts/lib/progress-file.ts                       | 55 ++++++++++++-
 .ai/alpha/scripts/lib/progress.ts                            | 11 ++-
 .ai/alpha/scripts/test-orchestrator-ui.ts                    |  2 +-
 .ai/alpha/scripts/types/orchestrator.types.ts                |  2 +-
 9 files changed, 132 insertions(+), 25 deletions(-)
```

### Validation Results
✅ All validation commands passed:
- `pnpm typecheck` — 39/39 tasks passed
- `pnpm vitest run .ai/alpha/scripts/lib/__tests__/` — 550 tests passed, 3 skipped
- `pnpm lint:fix` — No issues
- `pnpm format:fix` — Clean
- `grep 'status = "blocked"' feature.ts` — No matches (eliminated)
- `validateProgressStatus` verified at all 4 parse sites
- `SandboxProgress.status` verified as narrowed union type

### Follow-up Items
- UI poller (`useProgressPoller.ts`) was intentionally left without validation (display-only, does not affect orchestrator state)
- This is complementary to P1 (centralized state transitions, #1963 already merged). P1 prevents invalid feature.status transitions; P3 prevents invalid values from entering the system.

---
*Implementation completed by Claude*
