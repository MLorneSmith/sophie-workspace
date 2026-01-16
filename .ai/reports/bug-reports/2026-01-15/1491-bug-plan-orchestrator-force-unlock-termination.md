# Bug Fix: Orchestrator force-unlock process termination

**ID**: ISSUE-1491
**Related Diagnosis**: #1490 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: `--force-unlock` flag releases lock file but doesn't terminate existing orchestrator process, allowing multiple processes to run simultaneously
- **Fix Approach**: Read existing lock PID and terminate that process before acquiring new lock
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When `--force-unlock` is used, the lock file is deleted but the old orchestrator process continues running. Both processes write to the same progress files, with the older process overwriting current progress data with stale sandbox IDs and "idle" status. This causes the UI to display incorrect progress information.

For full details, see diagnosis issue #1490.

### Solution Approaches Considered

#### Option 1: Process Termination with Graceful Fallback ⭐ RECOMMENDED

**Description**: When `--force-unlock` is used and a lock file exists with a PID, attempt graceful termination (SIGTERM) with a short timeout, followed by force termination (SIGKILL) if the process is still running. Only then acquire the new lock.

**Pros**:
- **Safest approach**: Allows existing process to clean up gracefully
- **Deterministic**: Guarantees old process is dead before new one starts
- **Cross-platform**: Works on Linux, macOS, Windows (with platform-specific handling)
- **User-friendly**: Clear feedback about termination status

**Cons**:
- **Slightly more complex**: Requires timeout logic and platform detection
- **Minor delay**: 2-3 second wait for graceful shutdown

**Risk Assessment**: low - This is the standard pattern for process management. SIGTERM allows cleanup, SIGKILL is failsafe.

**Complexity**: moderate - Requires platform-specific kill logic and timeout handling

#### Option 2: Immediate Force Kill (SIGKILL)

**Description**: Read PID from lock file and immediately send SIGKILL without attempting graceful shutdown.

**Pros**:
- **Simple implementation**: No timeout or retry logic needed
- **Fast**: No waiting for graceful shutdown
- **Guaranteed**: SIGKILL cannot be ignored

**Cons**:
- **No cleanup**: Existing process can't release resources or save state
- **Potential data loss**: Progress files may be in inconsistent state
- **Aggressive**: Doesn't follow Unix best practices (SIGTERM before SIGKILL)

**Why Not Chosen**: Doesn't allow the existing process to perform cleanup operations. The graceful approach (Option 1) is only slightly more complex but significantly safer.

#### Option 3: Lock File with Heartbeat + Auto-Stale Detection

**Description**: Instead of relying on `--force-unlock`, add heartbeat timestamps to the lock file and automatically consider locks stale if heartbeat is old (e.g., >10 minutes).

**Pros**:
- **Automatic recovery**: No manual intervention needed for crashed processes
- **Eliminates need for force-unlock**: System self-heals

**Cons**:
- **Ongoing maintenance**: Requires heartbeat updates throughout orchestration
- **More complex**: Needs periodic heartbeat writing
- **Doesn't solve manual override case**: User may still want to force-unlock a legitimately running process
- **Doesn't address current issue**: Still need process termination logic

**Why Not Chosen**: This would be a good long-term enhancement but doesn't directly solve the immediate problem. The heartbeat approach could be added later as an improvement. Option 1 is simpler and addresses the bug directly.

### Selected Solution: Process Termination with Graceful Fallback

**Justification**: This approach follows Unix best practices (SIGTERM before SIGKILL), provides clear user feedback, and ensures the old process is definitely terminated before the new one starts. The slightly increased complexity is worth the safety and reliability.

**Technical Approach**:
- Check if lock file exists when `--force-unlock` is used
- Extract PID from lock file
- Verify process is running (avoid killing unrelated PIDs from process recycling)
- Send SIGTERM (graceful shutdown signal)
- Wait up to 2 seconds for process to exit
- If still running, send SIGKILL (force kill)
- Only then acquire the new lock and continue

**Architecture Changes**: None - this only modifies the lock acquisition logic in `lock.ts`.

**Migration Strategy**: N/A - no data migration needed, this is a behavioral change in the lock mechanism.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/lock.ts` - Add process termination logic to `acquireLock()` function
- `.ai/alpha/scripts/spec-orchestrator.ts` - Pass `forceUnlock` flag to `acquireLock()` function (line ~843)
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - (Optional) Improve "Blocked:" semantic clarity in UI

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add process termination helper function

Add a new helper function to `lock.ts` to handle cross-platform process termination.

- Add `isProcessRunning(pid: number): boolean` function to check if PID exists
- Add `terminateProcess(pid: number, uiEnabled: boolean): Promise<boolean>` function
  - Try SIGTERM first (graceful)
  - Wait 2 seconds
  - Check if process still running
  - If yes, send SIGKILL (force)
  - Return true if successfully terminated
  - Handle platform differences (Windows vs Unix)
  - Log each step for user visibility

**Why this step first**: Foundation for the fix - we need the termination logic before we can use it in `acquireLock()`.

#### Step 2: Modify acquireLock() to accept forceUnlock parameter

Update the `acquireLock()` function signature to accept a `forceUnlock` parameter.

- Add `forceUnlock?: boolean` parameter to function signature
- Update all callers to pass this parameter
- Add conditional logic: if `forceUnlock` and lock exists, call `terminateProcess()` before acquiring new lock
- Add user-friendly logging about termination status
- Only proceed to write new lock after successful termination

#### Step 3: Update orchestrator to pass forceUnlock flag

Modify `spec-orchestrator.ts` to pass the `forceUnlock` option to `acquireLock()`.

- Extract `--force-unlock` from command line args
- Pass it to `acquireLock(specId, uiEnabled, forceUnlock)` call
- Ensure flag is properly parsed from CLI arguments

#### Step 4: Add tests for process termination logic

Add unit tests for the new process termination functions.

- Test `isProcessRunning()` with valid/invalid PIDs
- Test `terminateProcess()` happy path (successful termination)
- Test `terminateProcess()` with non-existent process
- Test `terminateProcess()` with process that ignores SIGTERM (requires SIGKILL)
- Mock `process.kill()` to avoid actually killing processes in tests

#### Step 5: Optional UI improvement - clarify "Blocked:" semantics

Update `SandboxColumn.tsx` to make the "Blocked:" display clearer.

- Change label from "Blocked: #1371, #1372" to "Awaiting deps: #1371, #1372"
- OR: Show what's BLOCKING instead of what IS blocked
- OR: Remove the display entirely when sandbox is idle (less confusing)
- Update tooltip/help text to clarify meaning

#### Step 6: Validation

Run all validation commands and manual testing.

- Verify lock file mechanism works correctly
- Test force-unlock terminates existing process
- Test graceful shutdown (SIGTERM) works
- Test force kill (SIGKILL) works when SIGTERM fails
- Verify UI displays correct progress after termination
- Test edge cases: non-existent PID, PID from different process

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `isProcessRunning()` returns true for valid PID
- ✅ `isProcessRunning()` returns false for invalid PID
- ✅ `terminateProcess()` sends SIGTERM first
- ✅ `terminateProcess()` waits for graceful shutdown
- ✅ `terminateProcess()` sends SIGKILL if process still running
- ✅ `terminateProcess()` returns true on successful termination
- ✅ `terminateProcess()` handles non-existent process gracefully
- ✅ `acquireLock()` calls `terminateProcess()` when forceUnlock=true
- ✅ `acquireLock()` doesn't call `terminateProcess()` when forceUnlock=false
- ✅ Regression test: Original bug (multiple processes) should not reoccur

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/lock.test.ts` - Unit tests for lock management and process termination

### Integration Tests

Integration test for end-to-end lock behavior:
- ✅ Start orchestrator without force-unlock (acquires lock)
- ✅ Attempt second orchestrator without force-unlock (should fail)
- ✅ Attempt second orchestrator with force-unlock (should terminate first and succeed)
- ✅ Verify first orchestrator is no longer running
- ✅ Verify progress files show correct data from second orchestrator

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-lock-integration.test.ts` - Integration test for multi-process lock behavior

### E2E Tests

N/A - This is an orchestrator-level feature, not a user-facing UI feature.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator normally (no force-unlock)
- [ ] Attempt to start second orchestrator without force-unlock → should fail with clear error message
- [ ] Start second orchestrator WITH force-unlock → should succeed and terminate first process
- [ ] Verify first process is no longer running (`ps aux | grep orchestrator`)
- [ ] Verify UI shows correct progress from second orchestrator (correct sandbox IDs, run IDs)
- [ ] Test with stale lock file (old PID that doesn't exist) → should clean up and proceed
- [ ] Test with lock file from different host → should warn but allow force-unlock
- [ ] Verify graceful shutdown works (check logs for SIGTERM, 2s wait, no SIGKILL needed)
- [ ] Simulate hung process (ignore SIGTERM) → verify SIGKILL is sent after timeout
- [ ] Test on Linux (primary platform)
- [ ] Test on macOS (if available)
- [ ] Verify no data corruption in progress files or manifest

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Process termination kills wrong process**:
   - **Likelihood**: low
   - **Impact**: high (could kill unrelated process)
   - **Mitigation**:
     - Validate PID exists and is a running orchestrator process before killing
     - Check process start time matches lock timestamp (if possible)
     - Consider adding process name/command validation
     - Log PID and process info before termination for debugging

2. **SIGTERM/SIGKILL not supported on Windows**:
   - **Likelihood**: medium (if users run on Windows)
   - **Impact**: medium (force-unlock won't work)
   - **Mitigation**:
     - Use `process.kill(pid, 'SIGTERM')` which Node.js polyfills on Windows
     - Test on Windows if available or document limitation
     - Fallback to lock file deletion only on Windows (accept stale progress)

3. **Race condition: Lock released but old process still writing**:
   - **Likelihood**: low
   - **Impact**: medium (brief period of stale data)
   - **Mitigation**:
     - Wait for SIGKILL to complete before proceeding
     - Use synchronous operations where possible
     - Add small delay (100ms) after SIGKILL before writing new lock

4. **User terminates orchestrator mid-kill-operation**:
   - **Likelihood**: low
   - **Impact**: low (both processes might be dead, restart needed)
   - **Mitigation**:
     - Make termination operation atomic where possible
     - Clear documentation that force-unlock may take a few seconds
     - Lock file cleanup on orchestrator exit

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to `lock.ts` (restore original `acquireLock()` implementation)
2. Remove `forceUnlock` parameter from orchestrator call
3. Document workaround: manually kill process before using `--force-unlock`
4. Git: `git revert <commit-hash>`
5. Redeploy previous version

**Monitoring**:
- No specific monitoring needed (this is a development tool, not production service)
- Watch GitHub issues for reports of lock/force-unlock problems
- Check orchestrator logs for SIGTERM/SIGKILL messages

## Performance Impact

**Expected Impact**: minimal

The process termination adds a 2-second delay when using `--force-unlock`, which is acceptable since:
- Force-unlock is rare (only used after crashes or when manually overriding)
- 2 seconds is reasonable for graceful shutdown
- This is a development tool, not a production critical path
- Normal operation (without force-unlock) has zero performance impact

**Performance Testing**:
- Measure orchestrator startup time with and without force-unlock
- Verify no slowdown in normal operation (should be identical)
- Confirm 2-second graceful shutdown window is sufficient (can adjust if needed)

## Security Considerations

**Security Impact**: low

**Process termination risks**:
- **PID reuse**: On Unix systems, PIDs can be reused. If the orchestrator dies and a new unrelated process gets the same PID, force-unlock could kill that process.
  - **Mitigation**: Check process start time if available, validate it's actually an orchestrator process
- **Privilege escalation**: Cannot kill processes owned by other users (OS protection)
- **Denial of service**: Malicious user could repeatedly force-unlock to disrupt orchestration
  - **Mitigation**: This is a local development tool, not exposed to network. Limited to users with file system access.

Security review needed: no
Penetration testing needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Terminal 1: Start first orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Terminal 2: Start second orchestrator with force-unlock (while first is running)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock

# Check that both processes are running
ps aux | grep spec-orchestrator

# Bug: Both processes writing to progress files with different sandbox IDs
cat .ai/alpha/progress/sbx-a-progress.json
# Will show old sandbox ID from first process
```

**Expected Result**: Two orchestrator processes running simultaneously, progress files contain stale data.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests
pnpm test .ai/alpha/scripts/lib/__tests__/lock.test.ts

# Integration tests
pnpm test .ai/alpha/scripts/__tests__/orchestrator-lock-integration.test.ts

# Build
pnpm build

# Manual verification
# Terminal 1: Start first orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Terminal 2: Start second orchestrator with force-unlock
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock
# Should see: "Terminating existing orchestrator process (PID: xxxxx)..."
# Should see: "Process terminated successfully"

# Verify only one process running
ps aux | grep spec-orchestrator
# Should show only the second process

# Verify progress files have correct sandbox IDs
cat .ai/alpha/progress/sbx-a-progress.json
# Should show sandbox ID matching current run

# Verify UI shows correct progress (not stale "Waiting for work...")
# Watch the orchestrator UI dashboard - should show active work
```

**Expected Result**: All commands succeed, only one orchestrator process running, progress files contain current data, UI displays correct progress.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify lock mechanism still works without force-unlock
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 &
# Wait 5 seconds
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Should fail with "Another orchestration run is active" message

# Verify stale lock detection still works
# Create a stale lock file manually with old timestamp
# Should automatically override without needing force-unlock

# Verify force-unlock logs are clear and informative
# Start orchestrator, force-unlock from another terminal, check logs
# Should see SIGTERM → wait → SIGKILL sequence clearly logged
```

## Dependencies

**No new dependencies required**

Node.js built-in modules used:
- `process.kill()` - For sending signals to processes
- `process.pid` - For getting current process ID
- `fs` - For reading/writing lock file (already used)

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a development tool (orchestrator script), not a production service. Changes only affect local development environments.

**Special deployment steps**:
- No special steps needed
- Users will get the fix automatically when they pull the latest code
- Existing running orchestrators should be terminated before pulling

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking API changes)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (force-unlock terminates old process)
- [ ] Unit tests pass (process termination logic)
- [ ] Integration tests pass (multi-process lock behavior)
- [ ] Manual testing checklist complete
- [ ] Only one orchestrator process runs when force-unlock is used
- [ ] Progress files contain correct sandbox IDs after force-unlock
- [ ] UI displays correct progress (not stale "Waiting for work...")
- [ ] Graceful shutdown (SIGTERM) works correctly
- [ ] Force kill (SIGKILL) works as fallback
- [ ] Code review approved (if applicable)

## Notes

### Platform-Specific Considerations

**Linux/macOS (Unix-like)**:
- `process.kill(pid, 'SIGTERM')` sends graceful shutdown signal
- `process.kill(pid, 'SIGKILL')` sends force kill signal
- PIDs are recycled but relatively slowly
- Can check `/proc/<pid>/cmdline` to validate process is orchestrator

**Windows**:
- Node.js polyfills SIGTERM/SIGKILL but behavior differs
- SIGTERM on Windows immediately terminates (no graceful shutdown)
- PID validation more difficult (no `/proc` filesystem)
- Consider using `tasklist` command for validation if needed

### Alternative Approaches for Future Enhancement

While not part of this fix, consider these improvements for the future:

1. **Process validation**: Before killing, verify the PID actually belongs to an orchestrator process by checking command line
2. **Heartbeat-based staleness**: Auto-detect stale locks without requiring force-unlock
3. **Lock upgrade mechanism**: Allow "requesting" lock with notification to current holder
4. **Multi-machine coordination**: Handle locks across different machines (hostname check)
5. **Lock file with more metadata**: Store process start time, user, more info for debugging

### Related Documentation

- Node.js `process.kill()` documentation: https://nodejs.org/api/process.html#processkillpid-signal
- Unix signals reference: https://man7.org/linux/man-pages/man7/signal.7.html
- E2B sandbox lifecycle: `.ai/alpha/docs/alpha-implementation-system.md`
- Lock file format: See `OrchestratorLock` type in `.ai/alpha/scripts/types/index.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1490*
