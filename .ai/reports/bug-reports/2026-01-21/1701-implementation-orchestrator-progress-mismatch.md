## ✅ Implementation Complete

### Summary
- Fixed E2B PTY timeout configuration - set `timeoutMs: FEATURE_TIMEOUT_MS` instead of E2B's 60-second default
- Fixed task count calculation - removed double-counting of in-progress tasks in UI poller
- Updated tests to reflect new task counting behavior
- Added comprehensive test coverage for task count fix

### Root Causes Addressed

**Bug #1: PTY Stream Stoppage (UI Hang)**
- E2B SDK default PTY timeout is 60 seconds (`timeoutMs: 60_000`)
- This caused silent stream disconnection without error events after 60s
- Fix: Explicitly set `timeoutMs: FEATURE_TIMEOUT_MS` (30 minutes)

**Bug #2: Task Count Mismatch**
- `useProgressPoller.ts` was adding sandbox `inProgressTasks` on top of manifest's task count
- But `manifest.ts` already includes tasks from ALL features (fix from #1688)
- This caused double-counting when sandboxes were "busy"
- And under-counting when sandboxes changed to other statuses (ready/completed)
- Fix: Use manifest's authoritative task count directly

### Files Changed
```
.ai/alpha/scripts/lib/__tests__/manifest.spec.ts   |  4 +-
.ai/alpha/scripts/lib/__tests__/ui-progress-poller.spec.ts | 67 +++++++++++++++++++
.ai/alpha/scripts/lib/feature.ts                   | 13 ++++-
.ai/alpha/scripts/ui/hooks/useProgressPoller.ts    | 28 +++------
4 files changed, 91 insertions(+), 21 deletions(-)
```

### Commits
```
42865155b fix(tooling): resolve orchestrator progress count mismatch and PTY timeout
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 39/39 tasks successful
- `pnpm test` (alpha-scripts) - 333/333 tests passed
- `pnpm test` (orchestrator-ui) - 28/28 tests passed
- `pnpm lint:fix` - No errors
- `pnpm format:fix` - No fixes needed

### Deviations from Plan
- **Skipped Steps 2-3** (PTY Health Monitor): The PTY timeout fix addresses the root cause directly. Health monitoring is a nice-to-have resilience improvement but not required for the fix.
- The diagnosis mentioned sandbox timeout extension (`sandbox.setTimeout(24h)`), but the existing keepalive mechanism already handles this. The key fix was the PTY timeout.

### Follow-up Items
- Consider adding PTY health monitoring in a future enhancement for additional resilience
- Monitor orchestrator runs to verify the fix resolves UI hangs

---
*Implementation completed by Claude*
