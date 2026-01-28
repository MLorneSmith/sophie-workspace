## ✅ Implementation Complete

### Summary
- Added E2B API verification to `reconnectToStoredSandboxes()` to validate sandbox IDs exist before attempting reconnection
- Updated `restartFailedSandbox()` in work-loop.ts to reset in-progress features to pending when sandbox dies
- Added `resetFeatureForRetryOnSandboxDeath()` helper method that increments retry count and only marks as failed after max retries (3)
- Improved deadlock handler to retry ANY failed features with retries remaining (not just "blocking" features)

### Files Changed
```
 .ai/alpha/scripts/lib/deadlock-handler.ts | 46 ++++++++++-
 .ai/alpha/scripts/lib/sandbox.ts          | 96 ++++++++++++++++++++--
 .ai/alpha/scripts/lib/work-loop.ts        | 74 +++++++++++++++--
 3 files changed, 200 insertions(+), 16 deletions(-)
```

### Commits
```
08a1408cf fix(tooling): improve orchestrator sandbox validation and feature recovery
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 40 packages passed
- `pnpm lint` - No errors (pre-existing unrelated warnings only)
- Pre-commit hooks passed (TruffleHog, Biome, TypeScript)

### Technical Details

**1. Sandbox Verification (sandbox.ts)**
- Added `getActiveSandboxIds()` function that queries E2B API to get list of running sandboxes
- Updated `reconnectToStoredSandboxes()` to verify stored IDs exist in E2B before attempting connection
- Sandboxes not found in E2B are logged and skipped

**2. Feature Reset on Sandbox Death (work-loop.ts)**
- Updated `restartFailedSandbox()` to reset in-progress features to pending
- Added `resetFeatureForRetryOnSandboxDeath()` with retry logic
- Only marks features as `failed` after DEFAULT_MAX_RETRIES (3) exceeded
- Updated `runFeatureWork()` error handler to use retry logic

**3. Deadlock Handler Enhancement (deadlock-handler.ts)**
- Added fallback retry logic for ANY failed features when no work is available
- Previously only retried "blocking" features, now retries all retryable features
- This breaks deadlock cycles where sandboxes are idle with retryable failed features

### Follow-up Items
- Manual testing of full orchestrator resume scenario recommended
- Consider adding unit tests for new helper functions in future PR

---
*Implementation completed by Claude*
