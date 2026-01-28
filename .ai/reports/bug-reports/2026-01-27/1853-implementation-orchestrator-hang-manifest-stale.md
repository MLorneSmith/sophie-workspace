## ✅ Implementation Complete

### Summary
- Added `isFeatureFailed` import from `progress-file.ts` in `pty-wrapper.ts`
- Added Case 2.5 failure check in `attemptProgressFileRecovery()` after stale check
- When progress file shows `status: "failed"`, now throws `PTYTimeoutError` instead of returning `stillRunning: true`
- Bug reference comment links to #1852 diagnosis

### Files Changed
```
.ai/alpha/scripts/lib/pty-wrapper.ts | 13 ++++
1 file changed, 13 insertions(+)
```

### Commits
```
aa633fa89 fix(tooling): check failed status before stillRunning in PTY recovery
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - Passed (40 packages, all cached)
- `pnpm lint` - Passed (1673 files checked)

### Technical Details
The fix adds a new case in `attemptProgressFileRecovery()` between the stale check (Case 2) and completed check (Case 3):

```typescript
// Case 2.5: Feature explicitly failed - propagate failure
// Bug fix #1852: Check for failed status before checking if still running
if (isFeatureFailed(progressData)) {
    ptyTelemetry.recoveryFailed++;
    throw new PTYTimeoutError(
        sandboxId,
        progressData,
        timeoutMs,
        `Progress file indicates feature failed (status: ${progressData.status})`,
    );
}
```

---
*Implementation completed by Claude*
