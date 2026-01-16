## ✅ Implementation Complete

### Summary
- Added `--project=payload` flag to `test:shard7` command
- Added `--project=payload` flag to `test:shard8` command
- Added `--project=payload` flag to `test:group:payload` command

### Root Cause Confirmed
Without the project flag, Playwright ran global setup for all projects concurrently, causing authentication file race conditions that deadlocked test execution at 1203+ seconds.

### Validation Results
✅ **Global setup race condition resolved** - setup now completes in ~10 seconds
✅ **Tests execute** - `Running 12 tests using 4 workers` (previously hung indefinitely)
✅ **Tests complete with results** - 7/12 tests passed on database spec, others had individual timeouts (functional issues, not the hanging bug)

### Files Changed
```
apps/e2e/package.json | 6 +++---
1 file changed, 3 insertions(+), 3 deletions(-)
```

### Commits
```
42054260b fix(e2e): add --project=payload flag to Payload test commands
```

### Note
Some individual Payload tests have their own timeout issues (UI elements not found, etc.) which are separate functional bugs - not related to the global setup race condition this fix addresses.

---
*Implementation completed by Claude*
