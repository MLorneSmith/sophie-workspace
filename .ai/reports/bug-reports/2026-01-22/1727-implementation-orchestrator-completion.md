## ✅ Implementation Complete

### Summary
- Extended event-emitter types with 6 new completion phase events (`completion_phase_start`, `sandbox_killing`, `review_sandbox_creating`, `dev_server_starting`, `dev_server_ready`, `dev_server_failed`)
- Updated orchestrator completion phase to kill ALL implementation sandboxes (sbx-a, sbx-b, sbx-c) instead of keeping sbx-a alive
- Added event emission for all completion phase transitions providing visibility in UI Recent Events log
- Creates fresh review sandbox with clean resources for reliable dev server startup
- Fixed UI ANSI code truncation by stripping escape sequences before rendering output
- Added `destroySandbox()` helper function for reusable sandbox destruction
- Fixed flaky timing test using fake timers

### Files Changed
```
 .ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts  |  13 ++-
 .ai/alpha/scripts/lib/event-emitter.ts                   |  31 ++++-
 .ai/alpha/scripts/lib/orchestrator.ts                    | 130 +++++++++++----------
 .ai/alpha/scripts/lib/sandbox.ts                         |  59 +++++++++-
 .ai/alpha/scripts/ui/components/SandboxColumn.tsx        |  22 +++-
 5 files changed, 184 insertions(+), 71 deletions(-)
```

### Commits
```
e43560245 fix(tooling): resolve orchestrator completion phase issues
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 39 tasks successful
- `pnpm biome check --write` - Fixed import sorting, all files pass
- `pnpm biome format` - All modified files pass formatting

### Key Changes

**Event Emitter (`event-emitter.ts`)**:
- Added `OrchestratorCompletionEventType` with 6 new event types
- Created combined `OrchestratorEventType` union type
- Updated emit function signatures to use combined type

**Orchestrator (`orchestrator.ts`)**:
- Complete rewrite of completion phase logic
- Emit `completion_phase_start` when entering completion phase
- Kill ALL sandboxes with `sandbox_killing` events for each
- Emit `review_sandbox_creating` before creating review sandbox
- Emit `dev_server_starting/ready/failed` events for dev server lifecycle
- Removed fallback to implementation sandbox (all are killed)

**Sandbox (`sandbox.ts`)**:
- Added `destroySandbox()` helper function with proper error handling
- Added `destroySandboxes()` for parallel sandbox destruction
- Returns structured `DestroySandboxResult` with success/failure status

**UI (`SandboxColumn.tsx`)**:
- Added `strip-ansi` import for ANSI code removal
- Created `stripAndTruncate()` function to clean output before display
- Updated Recent Output rendering to use new function

### Follow-up Items
- None - all four issues from diagnosis resolved

---
*Implementation completed by Claude*
