## ✅ Implementation Complete

### Summary
- Fixed preemptive restart handler to reset `manifest.sandbox.created_at` and call `writeIdleProgress()` after restart
- Fixed stall timeout restart handler with the same changes
- Added 8 unit tests verifying restart behavior, timestamp reset, and progress file updates

### Files Changed
```
.ai/alpha/scripts/lib/orchestrator.ts              |  18 +
.ai/alpha/scripts/lib/__tests__/orchestrator.restart.spec.ts | 397 +++++++++++++++++++++
2 files changed, 415 insertions(+)
```

### Commits
```
1bd815f58 fix(tooling): reset sandbox created_at and write idle progress on restart
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages passed
- `pnpm biome lint` on changed files - No errors
- `pnpm biome format` on changed files - Formatted successfully
- `pnpm --filter @slideheroes/alpha-scripts test:lib` - All 341 tests passed (including 8 new restart tests)

### Follow-up Items
- None required - fix is complete and self-contained

---
*Implementation completed by Claude*
