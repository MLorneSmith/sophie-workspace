## Implementation Complete

### Summary
- Added `sandbox.kill()` calls in health check restart path (~line 376)
- Added `sandbox.kill()` calls in keepalive expired restart path (~line 553)
- Both additions wrapped in try/catch to handle already-dead sandboxes
- Matches existing pattern from preemptive restart path (lines 461-465)

### Files Changed
```
.ai/alpha/scripts/lib/orchestrator.ts | 16 ++++++++++++++++
1 file changed, 15 insertions(+), 1 deletion(-)
```

### Commits
```
20174ce62 fix(tooling): kill old sandboxes before restart to prevent accumulation
```

### Validation Results
All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages passed
- `pnpm lint:fix` - No errors, code formatted correctly

### Follow-up Items
- Manual testing recommended: monitor E2B sandbox count during orchestrator restarts

---
*Implementation completed by Claude*
