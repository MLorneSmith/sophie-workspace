## ✅ Implementation Complete

### Summary
- Increased CI short timeout from 12000ms to 15000ms (25% increase) in `test-config.ts`
- Expanded CI auth retry intervals to include 35s delay for better timing distribution
- Added inline comments referencing #990 and #989 for future maintainers
- Verified fix with E2E tests: all auth and account tests pass

### Changes Made
1. **CI `short` timeout**: 12000ms → 15000ms
   - Provides headroom for React Query hydration delays
   - Handles auth API cold starts in CI environments
   
2. **CI auth retry intervals**: Added 35000ms interval
   - Previous: `[1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000]`
   - New: `[1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 35000]`
   - Slice increased from `maxRetries + 3` to `maxRetries + 4`

### Files Changed
```
apps/e2e/tests/utils/test-config.ts | 15 +++---
```

### Commits
```
78cdea335 fix(e2e): increase CI auth timeout to resolve server crash and auth failures
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 37 packages passed
- `pnpm lint:fix` - No issues found
- `pnpm format:fix` - No formatting changes needed
- `pnpm --filter web-e2e test:shard --shard=1/12 auth-simple` - 9 passed
- `pnpm --filter web-e2e test:shard --shard=1/12 account-simple` - 9 passed
- `pnpm --filter web-e2e test:shard --shard=1/12` - 12 passed, 1 skipped

### Note on Timeout Killer
The bug plan mentioned reviewing `safe-test-runner.sh` for timeout killer aggressiveness. After investigation, I found that:
- `safe-test-runner.sh` only manages output filtering, not timeout killing
- The actual timeout/retry logic is in `apps/e2e/tests/utils/test-config.ts`
- No changes were needed to the test infrastructure scripts

### Follow-up Items
- Monitor CI pass rate over next 5-10 runs to confirm stability
- If auth tests continue to flake, consider implementing server-side readiness signal (Option 3 from plan)

---
*Implementation completed by Claude*
