## ✅ Implementation Complete

### Summary
- Fixed overall progress calculation in `manifest.ts` to include tasks from **all** features (not just completed), resolving the 101/101 vs 18/19 mismatch
- Removed fallback task ID generation in `useProgressPoller.ts` that created misleading "T21" references - now uses "Unknown" for tasks without IDs
- Fixed tasksTotal calculation to use authoritative count from `current_group.tasks_total` when available
- Added stuck task detection in `orchestrator.ts` to prevent indefinite stalls when sandbox is idle but feature has pending tasks with satisfied dependencies

### Files Changed
```
 .ai/alpha/scripts/lib/manifest.ts               | 12 ++++--
 .ai/alpha/scripts/lib/orchestrator.ts           | 56 +++++++++++++++++++++++++
 .ai/alpha/scripts/ui/hooks/useProgressPoller.ts | 49 ++++++++++++++--------
 3 files changed, 96 insertions(+), 21 deletions(-)
```

### Commits
```
b661a31a9 fix(tooling): resolve Alpha orchestrator progress UI mismatch and stall detection
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - No errors
- `pnpm lint` - No errors  
- `pnpm format` - Fixed 2 files (formatting only)
- TypeScript direct check on alpha-scripts and orchestrator-ui packages - No errors

### Technical Details

**Issue A Fix (Progress Mismatch):** The `writeOverallProgress()` function in manifest.ts was only counting `tasks_completed` from features with `status === "completed"`. Changed to count from ALL features regardless of status.

**Issue B Fix (Task T21):** The `progressToSandboxState()` function had a fallback `T${completedCount + 1}` for tasks without IDs. Removed this fallback - now uses "Unknown" to clearly indicate missing metadata.

**Issue C Fix (18/19 vs 5/19):** The `tasksTotal` calculation was inferring from visible state. Changed to prefer authoritative `current_group.tasks_total` when available.

**Issue D Fix (Stall Detection):** Added detection loop in the work loop that identifies features where:
1. Status is "in_progress" with assigned sandbox
2. Sandbox status is not "busy"
3. Feature has remaining tasks
4. Assignment is older than 60 seconds

When detected, the feature is reset to "pending" for reassignment.

### Follow-up Items
- None required - fix is self-contained

---
*Implementation completed by Claude*
