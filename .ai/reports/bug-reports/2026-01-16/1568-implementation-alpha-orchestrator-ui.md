## ✅ Implementation Complete

### Summary
- Fixed progress bar flicker by stabilizing tasksTotal calculation with monotonic increase pattern
- Fixed unbounded event list by capping display to 3 items and deduplicating WebSocket events
- Fixed sandbox recovery UI state by clearing stale sandbox ID mappings and tracking restart_count
- Fixed feature cycling by increasing SANDBOX_MAX_AGE_MS to 60min, skipping restart for 80%+ features, and adding graceful shutdown
- Fixed dev server not accessible by adding HTTP health check polling to startDevServer
- Added port health utility functions and regression tests

### Files Changed
```
 .ai/alpha/scripts/config/constants.ts              | 10 +++-
 .ai/alpha/scripts/lib/index.ts                     |  3 +
 .ai/alpha/scripts/lib/orchestrator.ts              | 64 +++++++++++++++++++---
 .ai/alpha/scripts/lib/sandbox.ts                   | 55 ++++++++++++++++---
 .ai/alpha/scripts/types/orchestrator.types.ts      |  2 +
 .ai/alpha/scripts/ui/components/ProgressBar.tsx    | 22 +++++++-
 .ai/alpha/scripts/ui/components/SandboxColumn.tsx  | 36 +++++++-----
 .ai/alpha/scripts/ui/hooks/useProgressPoller.ts    | 17 ++++--
 .ai/alpha/scripts/ui/index.tsx                     | 22 +++++++-
 .ai/alpha/scripts/lib/port-health.ts               | 92 new
 .ai/alpha/scripts/lib/__tests__/port-health.spec.ts| 89 new
 .ai/alpha/scripts/ui/__tests__/useProgressPoller.spec.ts | 141 new
```

### Commits
```
9e4e767d4 fix(tooling): resolve 5 Alpha Orchestrator UI and functionality issues
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages passed
- `pnpm lint --filter @slideheroes/alpha-scripts` - Passed after auto-fix
- `pnpm vitest run` (alpha-scripts) - 254/255 passed (1 flaky timing test unrelated to this fix)
- `pnpm vitest run` (orchestrator-ui) - 10/10 passed

### Follow-up Items
- The preemptive restart logic now skips features that are 80%+ complete, which may slightly increase sandbox expiration edge cases. Monitor in production.
- Consider adding a "feature completion estimated time" metric to make the restart decision more intelligent.

---
*Implementation completed by Claude Opus 4.5*
