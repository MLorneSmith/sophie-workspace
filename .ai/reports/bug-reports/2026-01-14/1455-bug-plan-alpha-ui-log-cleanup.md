# Bug Fix: Alpha Orchestrator UI Shows Stale Log Data on Startup

**Related Diagnosis**: #1454
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Log files from previous orchestrator runs persist and are read as fallback when JSON progress files are empty
- **Fix Approach**: Clear log files during orchestrator initialization to prevent stale data display
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha orchestrator starts with UI enabled, it displays "RETRY ATTEMPT 3/3" messages in sandbox output sections immediately, before any sandboxes are even created. These messages come from previous failed runs' log files that persist in `.ai/alpha/logs/`.

The root cause: `clearUIProgress()` only clears JSON progress files, not log files. The UI's progress poller falls back to reading log files when JSON is empty (which happens on startup before sandboxes write progress), exposing stale data from previous runs.

For full details, see diagnosis issue #1454.

### Solution Approaches Considered

#### Option 1: Clear Log Files on Startup ⭐ RECOMMENDED

**Description**: Extend `clearUIProgress()` to also delete old log files, or create a separate `clearLogs()` function. This removes stale data at the source before the UI starts polling.

**Pros**:
- Simple and straightforward implementation
- Prevents stale data from being read at the source
- No UI logic changes needed
- Minimal risk of side effects
- Clean state for each orchestrator run
- Fixes both the retry messages AND any other stale log data

**Cons**:
- Deletes logs that might be useful for debugging previous runs
- One-way operation (can't recover deleted logs)

**Risk Assessment**: low - Only deletes files at orchestrator start, doesn't affect running sessions

**Complexity**: simple - ~10 lines of code

#### Option 2: Filter Log Files by Session Timestamp

**Description**: Modify `readRecentLogs()` in `useProgressPoller.ts` to only read log files created after the current session started (by comparing file timestamp with session start time).

**Pros**:
- Preserves old log files for debugging
- More surgical fix (only affects log reading logic)
- No data loss

**Cons**:
- Adds logic complexity to the UI hook
- Requires parsing timestamps from filenames
- Doesn't prevent the fallback to log files during startup
- More fragile (depends on filename timestamp format being consistent)

**Why Not Chosen**: Option 1 is simpler and cleaner. Preserving logs from failed runs is less valuable than having a clean UI state.

#### Option 3: Use Only Recent Output from JSON, Never Fall Back to Logs

**Description**: Remove the log file fallback entirely and rely only on JSON progress files' `recent_output` field.

**Pros**:
- Completely eliminates stale data
- UI is always showing current data

**Cons**:
- Breaks backward compatibility if JSON progress files don't exist
- Requires JSON to always be written from start
- More risky for edge cases

**Why Not Chosen**: Option 1 is safer and doesn't require changing the fallback mechanism.

### Selected Solution: Clear Log Files on Startup

**Justification**: This is the simplest, safest, and most direct fix. It removes the stale data at the source before the UI even starts. The log files from previous runs have minimal debugging value since the orchestrator keeps a manifest of what happened. A clean log directory for each run is better than mixing old and new data.

**Technical Approach**:
- Add log file cleanup to the orchestrator initialization sequence
- Clear log files in the same location where JSON progress files are cleared
- Use glob pattern to identify log files safely: `sbx-*.log`
- This happens before the UI starts, so no race conditions

**Architecture Changes**: None - existing pattern is to clear progress on startup

**Migration Strategy**: None needed - log files are ephemeral

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/progress.ts` - Extend `clearUIProgress()` to also clear log files
- `.ai/alpha/scripts/lib/orchestrator.ts` - Already calls `clearUIProgress()` at line 781 (no changes needed if we extend clearUIProgress)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current Progress Cleanup

Review the current `clearUIProgress()` function to understand the pattern:

- Location: `.ai/alpha/scripts/lib/progress.ts:249-262`
- Currently clears: Files matching `*-progress.json` pattern
- Directory: `UI_PROGRESS_DIR` path
- Handles errors gracefully with try/catch

**Why this step first**: Ensures we follow the existing pattern for consistency and safety

#### Step 2: Extend clearUIProgress() to Clear Log Files

Modify `clearUIProgress()` function to also clear log files:

- Add log file cleanup logic after JSON file cleanup
- Use `LOGS_DIR` constant instead of creating a new path
- Match pattern: `sbx-*.log` (sandboxes write logs with this prefix)
- Use same try/catch error handling pattern
- Keep both cleanups in the same function for atomic operation

**Specific changes**:
- After line 261 (after JSON cleanup loop), add log cleanup loop
- Iterate through files in `LOGS_DIR` matching pattern `sbx-*.log`
- Delete each matched file with `fs.unlinkSync()`
- Wrap in try/catch to ignore deletion errors

#### Step 3: Verify Configuration Constants

Ensure `LOGS_DIR` constant is properly defined:

- Check `.ai/alpha/scripts/config/index.ts` for `LOGS_DIR` export
- Verify path is correct and consistent with where logs are written

#### Step 4: Add/Update Tests

Create unit test to verify log cleanup:

- **Test file**: `.ai/alpha/scripts/lib/__tests__/progress.test.ts` (create if doesn't exist)
- **Test case**: "clearUIProgress() should delete log files matching pattern"
- **Verification**:
  - Create test log files with pattern `sbx-a-*.log`, `sbx-b-*.log`, etc.
  - Call `clearUIProgress()`
  - Assert all matching log files are deleted
  - Assert non-matching files are preserved

#### Step 5: Verify Fix in Integration

Test the complete startup sequence:

- Run orchestrator with UI: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
- Verify sandbox output sections show "Waiting for work..." with no output
- Confirm no "RETRY ATTEMPT" messages appear
- Check that log files are created fresh during the run

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `clearUIProgress()` deletes JSON files matching `*-progress.json`
- ✅ `clearUIProgress()` deletes log files matching `sbx-*.log`
- ✅ `clearUIProgress()` ignores missing directories gracefully
- ✅ `clearUIProgress()` doesn't delete unrelated files
- ✅ Regression test: Old log files with "RETRY ATTEMPT" don't reappear in UI

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/progress.test.ts` - Unit tests for clearUIProgress()

### Integration Tests

Manual integration test:

1. Create old log files with retry messages:
   ```bash
   mkdir -p .ai/alpha/logs
   echo "=== RETRY ATTEMPT 3/3 ===" > .ai/alpha/logs/sbx-a-old.log
   ```

2. Start orchestrator with UI:
   ```bash
   pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui
   ```

3. Verify:
   - Old log file is deleted before UI starts
   - Sandbox output shows "Waiting for work..." not retry messages
   - Fresh logs are created during execution

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create stale log files with "RETRY ATTEMPT" messages
- [ ] Run orchestrator with UI: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
- [ ] Verify UI shows "Waiting for work..." immediately (no retry messages)
- [ ] Verify old log files are gone from `.ai/alpha/logs/`
- [ ] Verify new log files are created as feature runs
- [ ] Check that fix works with multiple runs (run orchestrator twice)
- [ ] Verify no errors in console output

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Accidentally delete important logs**: Deleted old logs might be useful
   - **Likelihood**: low - Logs are ephemeral and orchestrator maintains manifest
   - **Impact**: low - Can reproduce by running orchestrator again
   - **Mitigation**: Only delete `sbx-*.log` pattern, not all logs. Consider archiving old logs if needed in future.

2. **Race condition if logs are written during cleanup**: Logs start being written as cleanup happens
   - **Likelihood**: very low - Cleanup happens before sandboxes are created
   - **Impact**: low - Would just miss first few lines of new logs
   - **Mitigation**: Cleanup happens in single-threaded Node.js synchronously before async operations start

3. **Permission errors deleting logs**: Can't delete files due to permissions
   - **Likelihood**: very low - Process owns the logs directory
   - **Impact**: low - Existing code handles with try/catch
   - **Mitigation**: Reuse existing error handling pattern from JSON cleanup

**Rollback Plan**:

If this causes issues:
1. Revert the changes to `clearUIProgress()` in `.ai/alpha/scripts/lib/progress.ts`
2. Log files will stop being cleared on startup
3. Users can manually clean logs if needed: `rm -f .ai/alpha/logs/sbx-*.log`

**Monitoring** (if needed):
- Monitor for any issues with log availability during debugging
- Track if users need to archive logs for later analysis

## Performance Impact

**Expected Impact**: none

Clearing log files is an O(n) file system operation where n = number of log files. This happens once at startup before any heavy operations. Impact is negligible (typically < 100ms for directory with 100 files).

## Security Considerations

**Security Impact**: none

Deleting local log files has no security implications. Process owns the files and directory.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Create stale log file with retry message
mkdir -p .ai/alpha/logs
echo "=== RETRY ATTEMPT 3/3 ===" > .ai/alpha/logs/sbx-a-2026-01-01T00-00-00Z.log

# Run orchestrator with UI
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui
```

**Expected Result**: Sandbox column shows "=== RETRY ATTEMPT 3/3 ===" in output section

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Create stale log file with retry message
mkdir -p .ai/alpha/logs
echo "=== RETRY ATTEMPT 3/3 ===" > .ai/alpha/logs/sbx-a-2026-01-01T00-00-00Z.log

# Verify file exists
ls -la .ai/alpha/logs/sbx-a-2026-01-01T00-00-00Z.log

# Run orchestrator briefly (can be short run for testing)
timeout 10 pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui || true

# Verify stale log file was deleted (this is the fix)
ls -la .ai/alpha/logs/sbx-a-2026-01-01T00-00-00Z.log 2>&1 | grep "No such file"
```

**Expected Result**:
- Stale log file is deleted by orchestrator cleanup
- Sandbox output shows "Waiting for work..." not retry messages
- Fresh logs are created during execution
- All validation commands pass

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter @project/alpha test

# Manual verification of the specific scenario
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui --dry-run
# Verify this completes without errors
```

## Dependencies

### New Dependencies

**No new dependencies required** - Uses existing Node.js fs module

## Database Changes

**No database changes required** - This only affects local log file cleanup

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is local-only cleanup

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes, just removes stale files

## Success Criteria

The fix is complete when:
- [ ] `clearUIProgress()` extended to clear log files
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Unit tests added and passing
- [ ] Manual testing confirms stale logs are deleted
- [ ] Manual testing confirms "RETRY ATTEMPT" messages don't appear on startup
- [ ] Zero regressions (orchestrator still runs correctly)
- [ ] Log files are created fresh for each run

## Notes

The secondary issue mentioned in the diagnosis (flashing messages from WebSocket errors in useEventStream) is a separate concern and can be addressed in a follow-up issue. This fix addresses the primary issue: stale log data display.

The `clearUIProgress()` pattern in the codebase suggests this is the appropriate place for cleanup. By keeping both JSON and log cleanup in the same function, we ensure both happen atomically at the same time.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1454*
