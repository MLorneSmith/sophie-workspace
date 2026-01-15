## ✅ Implementation Complete

### Summary
- Added cleanup of `assigned_sandbox` and `assigned_at` fields in orchestrator.ts error handler (lines 719-722)
- Added inline comment explaining why the cleanup is needed (prevents stall when errors bypass feature.ts handler)
- Created unit tests for error handler cleanup behavior (6 tests)
- Created integration tests for stall prevention scenarios (7 tests)
- All validation commands pass (typecheck, lint, format)

### Files Changed
```
.ai/alpha/scripts/lib/orchestrator.ts                                   | 4 lines added
.ai/alpha/scripts/lib/__tests__/orchestrator-error-handler.spec.ts      | 256 lines (new file)
.ai/alpha/scripts/lib/__tests__/orchestrator-stall-prevention.spec.ts   | 296 lines (new file)
```

### Commits
```
a00fecc48 fix(tooling): clear assigned_sandbox in orchestrator error handler
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - passed
- `pnpm lint` - passed (no errors, 17 warnings unrelated to changes)
- `pnpm format` - passed
- Orchestrator unit tests - 154 tests passed

### Technical Notes
The fix mirrors the cleanup pattern already used in feature.ts (lines 678-679). When errors are caught by the orchestrator's error handler (e.g., PTY SIGTERM, Promise rejections), the feature's sandbox assignment is now properly cleared, allowing it to be retried.

---
*Implementation completed by Claude*
