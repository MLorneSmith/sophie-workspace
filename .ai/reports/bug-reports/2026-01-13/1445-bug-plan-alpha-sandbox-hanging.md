# Bug Fix: Alpha Sandbox Hanging During Claude Code CLI Startup

**Related Diagnosis**: #1444 (REQUIRED)
**Severity**: high
**Bug Type**: performance/integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Claude Code CLI hangs during initialization in E2B sandboxes due to OAuth token issues, API rate limiting, or startup race conditions when multiple sandboxes start simultaneously
- **Fix Approach**: Add startup timeout detection with automatic retry, implement output buffering capture to detect hangs, stagger sandbox creation more aggressively, and add keepalive during long-running operations
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2B sandboxes running the Alpha Implementation System experience a ~64% failure rate where Claude Code CLI accepts the prompt but never produces output. Failed sandboxes emit only the initial startup message ("Using OAuth authentication") and then hang indefinitely. Analysis shows the hang occurs during Claude CLI initialization, likely due to API connection timing issues, OAuth token validation failures, or race conditions when multiple sandboxes start Claude simultaneously within seconds of each other.

For full details, see diagnosis issue #1444.

### Solution Approaches Considered

#### Option 1: Startup Timeout with Automatic Retry + Output Detection ⭐ RECOMMENDED

**Description**: Wrap the Claude Code CLI invocation with a timeout mechanism (60 seconds) that monitors for meaningful output. If no output is produced within the timeout, kill the process and retry with exponential backoff (5 seconds, 10 seconds, 30 seconds). Also implement output buffering to detect whether bytes are actually flowing. Additionally, stagger sandbox startup times more aggressively (30-60 seconds between creation) to avoid simultaneous API requests.

**Pros**:
- Directly addresses the root cause (startup hangs)
- Automatic recovery without manual intervention
- Exponential backoff prevents thundering herd problem
- Low complexity - only changes the execution wrapper
- Can be deployed immediately without architectural changes
- Preserves all existing functionality while adding resilience
- Matches cloud architecture best practices for transient failures

**Cons**:
- Still relies on OAuth tokens which may have session limits
- Doesn't prevent the hang, just detects and retries
- May consume additional API quota on retries
- Timeouts need tuning to avoid false positives

**Risk Assessment**: Low - This is a wrapper approach that adds retry logic without modifying the underlying system. Retry logic is standard cloud practice.

**Complexity**: Moderate - Requires bash script modifications, timeout logic, output buffering, and integration with health monitoring.

#### Option 2: Switch to API Key Authentication (Medium-term)

**Description**: Replace OAuth tokens with Anthropic API keys for sandbox authentication. API keys are simpler, more reliable, and don't have session limits. This requires environment variable changes in the template and credentials management updates.

**Pros**:
- Eliminates OAuth session limit issues entirely
- API keys are stateless and more reliable
- Better for automated systems
- Simpler token management

**Cons**:
- Requires credentials infrastructure changes
- May need to update local development workflows
- Larger scope change (not just sandbox fix)
- Requires Anthropic API key management
- Not backward compatible with existing workflows

**Why Not Chosen**: This is a better long-term solution but requires infrastructure changes beyond the scope of this bug fix. Should be captured as a follow-up task after this immediate fix is deployed.

#### Option 3: Implement Process Pool / Sandbox Queue with Rate Limiting

**Description**: Rather than creating 3 sandboxes in quick succession, use a queue system that creates sandboxes one at a time with a 60-second minimum interval between creation. This prevents the API thundering herd problem entirely.

**Pros**:
- Prevents simultaneous startup conflicts entirely
- Addresses potential API rate limiting

**Cons**:
- Significantly increases total execution time (3 × 60s = 3 minutes more)
- Reduces parallelism advantage of multi-sandbox approach
- More complex orchestration changes
- May not be needed if staggering + retry works

**Why Not Chosen**: Option 1 combines staggering with retry, providing both prevention and recovery while maintaining parallelism benefits.

### Selected Solution: Startup Timeout with Automatic Retry + Output Detection

**Justification**: This approach directly addresses the root cause (Claude CLI not producing output within startup window) by:

1. **Detecting hangs early** - Monitors for output within 60 seconds
2. **Recovering automatically** - Retries with exponential backoff without manual intervention
3. **Preventing thundering herd** - Staggers sandbox creation to reduce simultaneous API requests
4. **Low risk** - Wrapper approach doesn't modify core system
5. **Quick deployment** - Can be implemented in 2-3 hours
6. **Proven pattern** - Matches standard cloud retry patterns

This provides immediate relief while leaving room for long-term improvements (API key migration).

**Technical Approach**:

1. **Modify run-claude script** (`packages/e2b/e2b-template/template.ts` lines 42-86):
   - Wrap Claude invocation with timeout mechanism (60 seconds)
   - Add output buffering to detect if data is flowing
   - Capture stderr for better error diagnostics
   - Return exit code indicating timeout vs. normal completion

2. **Implement retry logic** in `sandbox.ts`:
   - Catch timeout errors from run-claude
   - Retry up to 3 times with exponential backoff (5s, 10s, 30s)
   - Log each retry attempt with timestamp
   - Fail after max retries exceeded

3. **Add output detection** in `health.ts`:
   - Track `hasReceivedOutput` flag (sets to true after first 100+ bytes)
   - Track `outputLineCount` to measure output volume
   - Use these metrics in health checks to detect startup hangs

4. **Stagger sandbox creation** in `orchestrator.ts`:
   - Add 20-30 second delay between sandbox creation calls
   - Reduces chance of simultaneous Claude CLI initialization
   - Prevents API rate limit issues

5. **Improve error diagnostics**:
   - Capture Claude CLI stderr to diagnose failures
   - Log OAuth token status (without exposing token values)
   - Record timestamp of all startup phases

**Architecture Changes** (if any):

- No breaking changes to the sandbox API
- Addition of optional `retryConfig` parameter to `runClaudeImplement()`
- New `StartupConfig` type with retry parameters
- Health check logic enhanced but backward compatible

**Migration Strategy** (if needed):

- No data migration required
- Existing progress files continue to work
- New features are additive, not breaking
- Can be rolled out with feature flag if needed

## Implementation Plan

### Affected Files

- `packages/e2b/e2b-template/template.ts` (lines 42-86) - Modify run-claude script with timeout wrapper
- `.ai/alpha/scripts/lib/sandbox.ts` (runClaudeImplement function) - Add retry logic
- `.ai/alpha/scripts/lib/health.ts` (checkSandboxHealth function) - Enhance output detection
- `.ai/alpha/scripts/lib/orchestrator.ts` (sandbox creation loop) - Add staggering delays
- `.ai/alpha/scripts/lib/types/index.ts` - Add new configuration types
- `.ai/alpha/scripts/lib/config/index.ts` - Add startup retry configuration constants

### New Files

- `.ai/alpha/scripts/lib/startup-monitor.ts` - Reusable startup timeout detection with output buffering
- (Tests) `.ai/alpha/scripts/__tests__/startup-monitor.spec.ts` - Unit tests for startup monitoring

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Startup Monitoring Utility

Create a reusable startup timeout detection module that can be used by both the run-claude script and the health monitor.

- Create `startup-monitor.ts` with functions:
  - `monitorStartup(process, timeoutMs, minOutput)` - Wraps a process and returns Promise with output stats
  - `detectStartupHang(lineCount, byteCount, timeSinceStart)` - Checks if startup is hung
  - Configuration for MIN_STARTUP_OUTPUT_BYTES (100), STARTUP_TIMEOUT_MS (60000)

**Why this step first**: Ensures we have reusable logic before integrating into multiple places

#### Step 2: Modify run-claude Script in E2B Template

Update the run-claude script in `packages/e2b/e2b-template/template.ts` to wrap Claude CLI invocation with timeout detection:

- Wrap the `unbuffer bash -c "echo ... | claude ..."` command with timeout logic
- Add `timeout 60s` wrapper to the command invocation
- Capture both stdout and stderr
- Exit with code 124 if timeout occurs (standard timeout exit code)
- Log output byte count before exit for diagnostics
- Add trap to clean up zombie processes on timeout

Example wrapper (after line 85):
```bash
# Timeout wrapper: 60 second startup limit
(timeout 60 unbuffer bash -c "echo \"$1\" | claude -p ...") &
PID=$!
# Monitor output in real-time to detect hangs
# If no output after 30s, kill early
...
wait $PID
EXIT_CODE=$?
if [ $EXIT_CODE -eq 124 ]; then
  echo "[STARTUP_TIMEOUT] Claude hung during startup" >&2
  exit 124
fi
```

**Why this step here**: Must be done before integrating retry logic, ensures timeout detection works at source

#### Step 3: Add Retry Logic to runClaudeImplement Function

Modify `.ai/alpha/scripts/lib/sandbox.ts` to implement exponential backoff retry:

- Wrap `runClaudeImplement()` call in retry loop
- Define `MAX_STARTUP_RETRIES = 3` and `RETRY_DELAYS = [5000, 10000, 30000]` (ms)
- On exit code 124 or no output: wait, then retry
- Log each attempt with timestamp: "Retry 2/3 after 10s..."
- After max retries, mark feature as failed with specific error message
- Record total time spent on startup attempts

Code snippet location: `.ai/alpha/scripts/lib/sandbox.ts` around `runClaudeImplement()` function

#### Step 4: Enhance Health Monitoring for Output Detection

Update `.ai/alpha/scripts/lib/health.ts` to better detect startup hangs:

- Add `outputLineCount` and `outputByteCount` tracking to SandboxInstance
- Implement `trackOutputStats()` function that reads recent output
- In `checkSandboxHealth()`, add early detection for startup hung:
  - If `timeSinceStart > 3 minutes` AND `outputLineCount < 5` → mark unhealthy
  - If `outputByteCount < 50 bytes` after 2 minutes → mark unhealthy
- Provide specific error messages for different failure types
- Use these stats to guide decision to retry vs. terminate

Code location: `.ai/alpha/scripts/lib/health.ts` around line 56-78

#### Step 5: Add Staggered Sandbox Creation

Modify `.ai/alpha/scripts/lib/orchestrator.ts` to add delays between sandbox creation:

- Find the sandbox creation loop
- Add `await sleep(30000)` (30 seconds) between each `Sandbox.create()` call
- Log the stagger: "Creating sandbox 2/3 (waiting 30s from previous)..."
- This is a cheap, simple way to reduce API thundering herd

Code location: In the orchestrator where sandboxes are created in a loop

#### Step 6: Add Configuration Constants

Update `.ai/alpha/scripts/lib/config/index.ts` with new startup configuration:

```typescript
// Startup retry configuration
export const STARTUP_TIMEOUT_MS = 60 * 1000; // 60 seconds
export const STARTUP_RETRY_DELAYS_MS = [5 * 1000, 10 * 1000, 30 * 1000]; // 5s, 10s, 30s
export const MAX_STARTUP_RETRIES = 3;
export const STARTUP_STAGGER_DELAY_MS = 30 * 1000; // 30 seconds between sandbox creation
export const MIN_STARTUP_OUTPUT_BYTES = 100; // Minimum bytes to consider startup successful
export const MIN_STARTUP_OUTPUT_LINES = 5; // Minimum lines before 3-min mark
```

**Why this step here**: Constants should be centralized before being used in multiple files

#### Step 7: Add TypeScript Types

Update `.ai/alpha/scripts/lib/types/index.ts` with new types:

```typescript
export interface StartupMonitorResult {
  success: boolean;
  outputBytes: number;
  outputLines: number;
  elapsedMs: number;
  error?: string;
}

export interface StartupConfig {
  timeoutMs: number;
  retryDelays: number[];
  maxRetries: number;
  minOutputBytes: number;
}
```

#### Step 8: Update Progress Tracking

Modify `.ai/alpha/scripts/lib/progress.ts` to track startup attempts:

- Add `startupAttempts` field to progress file
- Record which attempt succeeded (or all failed)
- Update format: `{"startup_attempts": 2, "startup_succeeded_on_attempt": 2, ...}`
- This helps with diagnostics and understanding retry behavior

#### Step 9: Add Comprehensive Logging

Add detailed startup logging to help diagnose issues:

- Log every startup attempt with: timestamp, attempt #, sandbox ID, timeout value
- Log successful startup with: byte count, line count, elapsed time
- Log failed startup with: exit code, output received, last error
- Log retry decision with: reason, delay before next attempt, estimated total time
- Use consistent format for parsing: `[STARTUP_ATTEMPT_N] message`

#### Step 10: Add and Update Tests

Create unit tests for the new startup monitoring logic:

- Test startup timeout detection with mock process
- Test output buffering with various input sizes
- Test retry exponential backoff timing
- Test failure after max retries exceeded
- Integration test: verify retry loop with sandbox
- Test staggering delays between sandbox creation

Files:
- `.ai/alpha/scripts/__tests__/startup-monitor.spec.ts` (new)
- `.ai/alpha/scripts/__tests__/sandbox.spec.ts` (update existing)
- `.ai/alpha/scripts/__tests__/health.spec.ts` (update existing)

#### Step 11: Manual Testing and Validation

Execute manual tests before considering the fix complete:

- Test 1: Verify single sandbox starts successfully (baseline)
- Test 2: Create 3 sandboxes and observe 30s stagger delays
- Test 3: Simulate timeout (run test with short timeout threshold) and verify retry
- Test 4: Verify health checks detect startup hangs
- Test 5: Run full spec orchestrator and verify no 64% failure rate
- Test 6: Check logs for proper startup attempt tracking
- Test 7: Verify progress files updated correctly after retries

#### Step 12: Validation Commands

Run all validation commands to ensure no regressions:

- Type checking passes
- All new tests pass
- Existing tests still pass
- No console errors during startup

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `monitorStartup()` detects successful startup (>100 bytes within 60s)
- ✅ `monitorStartup()` detects startup hung (<100 bytes after 60s)
- ✅ Exponential backoff retry timing (5s, 10s, 30s delays)
- ✅ Max retries termination (fails after 3rd attempt)
- ✅ Output buffering captures complete output
- ✅ Exit code 124 triggers retry
- ✅ Stagger delay prevents simultaneous creation
- ✅ Health check detects startup hung condition
- ✅ Progress file updated on each retry attempt
- ✅ Regression test: normal successful startup still works (no retry)

**Test files**:
- `packages/e2b/e2b-template/__tests__/template.spec.ts` - Test run-claude script
- `.ai/alpha/scripts/__tests__/startup-monitor.spec.ts` - Test startup monitoring
- `.ai/alpha/scripts/__tests__/sandbox.spec.ts` - Test retry logic in sandbox creation
- `.ai/alpha/scripts/__tests__/health.spec.ts` - Test health monitoring enhancements
- `.ai/alpha/scripts/__tests__/orchestrator.spec.ts` - Test stagger delays

### Integration Tests

- ✅ Full feature implementation with 3 sandboxes (verifies staggering works)
- ✅ One sandbox times out and retries successfully
- ✅ Multiple sandboxes timeout simultaneously and recover
- ✅ Progress file updated correctly through retries
- ✅ Git operations succeed after delayed startup

**Test files**:
- `.ai/alpha/scripts/__tests__/integration/e2e-sandbox-startup.spec.ts` (new)

### E2E Tests

- ✅ Run `/alpha:implement` with spec containing 3 features
- ✅ Observe all 3 sandboxes start and complete
- ✅ Verify 0% failure rate (vs. current 64%)
- ✅ Check that all output is captured in progress files
- ✅ Verify no stalled tasks (heartbeats continue updating)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Single sandbox creates and completes successfully (no retry needed)
- [ ] Verify startup output is captured in logs (at least 500 bytes)
- [ ] Verify 30-second stagger between creating sandboxes 1 → 2 → 3
- [ ] Manually test timeout: `timeout 10 /path/to/run-claude "test"` exits with 124
- [ ] Verify health check detects startup hung after 3 minutes with <100 bytes
- [ ] Run 3-feature spec and observe all 3 complete (not all fail at 64%)
- [ ] Run 10-feature spec to ensure staggering works at scale
- [ ] Check logs contain retry information with timestamps
- [ ] Verify exit codes are correct (0 success, 124 timeout, non-zero errors)
- [ ] Verify progress files exist and are updated after retries
- [ ] Ensure no zombie processes left after timeout/retry cycles
- [ ] Test with both OAuth (existing) and API key (future) authentication
- [ ] Verify backoff works: 1st retry at 5s, 2nd at 10s, 3rd at 30s
- [ ] Run `pnpm typecheck` to verify no type errors introduced
- [ ] Run `pnpm test` to verify all tests pass

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Retry logic masks underlying issues**: If we keep retrying, we might hide authentication or network problems that should fail fast.
   - **Likelihood**: Low - We have explicit logs showing each attempt
   - **Impact**: Medium - Could consume API quota on repeated failures
   - **Mitigation**: After 3 retries, fail with clear error. Log all attempts for analysis.

2. **Timeout detection false positives**: Very fast successful sandboxes might be killed if timeout threshold is too low.
   - **Likelihood**: Low - 60-second timeout is very conservative
   - **Impact**: Medium - Would trigger retries unnecessarily
   - **Mitigation**: Use MIN_STARTUP_OUTPUT_BYTES (100) + timeout, not just timeout alone. Successful sandboxes produce >500 bytes immediately.

3. **Staggering increases total execution time**: 30 × 3 sandboxes = 60+ seconds added to spec execution.
   - **Likelihood**: High - This is intentional
   - **Impact**: Low - Slower execution is better than 64% failure rate
   - **Mitigation**: Can be reduced to 15-20 seconds if retries alone solve the issue. Monitor and adjust.

4. **Exponential backoff delays cause very slow recovery**: If all retries needed, worst case is 5 + 10 + 30 = 45 seconds per sandbox.
   - **Likelihood**: Low - Most failures should succeed on 2nd attempt
   - **Impact**: Medium - Total delay could be several minutes
   - **Mitigation**: Accept this tradeoff. Slow recovery is better than permanent failure.

5. **Race conditions in progress file updates**: Multiple retry attempts might cause progress file corruption.
   - **Likelihood**: Low - Progress file is append-only
   - **Impact**: High - Loss of execution history
   - **Mitigation**: Use file locking or atomic writes. Test thoroughly.

**Rollback Plan**:

If this fix causes issues in production:

1. **Quick rollback** (5 minutes):
   - Revert to previous template commit
   - Restart any active sandboxes
   - Verify old version works

2. **Diagnostic steps** (15 minutes):
   - Check log files for error patterns
   - Identify which retry configuration caused issues
   - Adjust timeouts/delays in config

3. **Soft rollback** (if partial failure):
   - Disable retry logic: set `MAX_STARTUP_RETRIES = 0`
   - Keep staggering: still helps with thundering herd
   - Keep health monitoring: helps detect issues

4. **Long-term solution**:
   - Switch to API key authentication (Option 2)
   - Removes reliance on OAuth token sessions
   - Addresses root cause more fundamentally

**Monitoring** (if needed):

- Monitor startup attempt distribution: Track histogram of attempts (1, 2, 3)
- Monitor startup timing: Track median time to first successful startup
- Monitor timeout rate: Track what % of sandboxes hit startup timeout
- Alert on excessive retries: If >50% of sandboxes need retries, investigate
- Compare 64% failure rate before vs. after (target: <10% failure rate)

## Performance Impact

**Expected Impact**: Minimal to Slight Increase in Total Execution Time

**Analysis**:

- **Staggering overhead**: 30 seconds × 2 intervals = 60 seconds added to total spec execution (sequential wait between sandbox creations)
- **Successful startup**: No additional overhead (timeout check is passive, doesn't slow down success case)
- **Retry case**: 5-45 seconds per failed sandbox (exponential backoff)
- **Net result**: If retry rate drops from 64% to <10%, small staggering overhead is worth it

**Before fix** (estimated):
- 3 sandboxes created immediately (concurrent)
- ~1.9 fail (64% of 3)
- Total execution time: ~10-15 minutes (after retries/recovery attempts)
- Success rate: 36%

**After fix** (projected):
- 3 sandboxes created with 30s stagger (sequential)
- ~0.3 fail (10% of 3) due to retries
- Total execution time: ~8-12 minutes (staggering + fewer failures)
- Success rate: 95%+

**Trade-off is favorable**: +60s staggering overhead for -2-3 failures and 59% success rate improvement.

**Performance Testing**:

- Baseline: Run spec without fix, measure total time and success rate
- After fix: Run same spec, compare metrics
- Target: 90%+ first-attempt success rate, <12 minute execution time for 3-feature spec

## Security Considerations

**Security Impact**: None - Low Risk

**Analysis**:

- Retry logic operates entirely within sandbox boundaries
- No credential exposure in logs (we log OAuth status but not token values)
- Timeout mechanism is secure (standard Unix timeout command)
- No external communication changes
- No permission elevation
- No privilege changes

**Security checklist**:
- Credentials not logged: ✅ (checked)
- Timeout doesn't expose internals: ✅ (standard shell feature)
- No bypass of auth checks: ✅ (retry occurs before auth)
- Error messages safe: ✅ (no sensitive data in errors)
- Progress files contain no secrets: ✅ (only status/metrics)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run a spec with multiple features to see high failure rate
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Check logs - should see 64% small files (failed sandboxes)
ls -lh .ai/alpha/logs/ | tail -20
# Expected: many files ~93 bytes (failed), some 500+ bytes (succeeded)
```

**Expected Result**: High failure rate (64%), inconsistent success/failure pattern

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (startup monitoring, retry logic)
pnpm --filter @slideheroes/alpha test:unit startup-monitor.spec.ts
pnpm --filter @slideheroes/alpha test:unit sandbox.spec.ts

# Integration tests (full sandbox creation with retry)
pnpm --filter @slideheroes/alpha test:integration e2e-sandbox-startup.spec.ts

# Build
pnpm build

# Manual verification - run spec again
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Verify improved success rate
ls -lh .ai/alpha/logs/ | tail -20
# Expected: most files 500+ bytes (succeeded), <10% small files

# Check progress files show startup attempts
cat .ai/alpha/logs/.initiative-progress.json | jq '.startupAttempts'
```

**Expected Result**: All commands pass, startup success rate >90%, startup attempts logged, zero regressions

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check for zombie processes after timeout tests
ps aux | grep -E "(timeout|claude)" | grep -v grep
# Expected: empty (all cleaned up)

# Verify health checks still work
pnpm --filter @slideheroes/alpha test:unit health.spec.ts

# Ensure existing features still work
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --quick
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - All functionality uses existing Node.js built-ins:
- `child_process.spawn()` for process monitoring
- `setTimeout()` for delays
- `fs` operations for progress file updates

### Existing Dependencies Used

- `@e2b/code-interpreter` - Sandbox creation (no changes needed)
- Node.js `child_process` module (already used)
- Node.js `fs` module (already used)
- Node.js `timers` module (already used)

## Database Changes

**No database changes required**

- No schema modifications
- No migrations needed
- Existing progress file format extended (backward compatible)
- No RLS policy changes
- Progress files remain compatible with existing code

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- No database migrations needed
- No environment variable changes (unless switching to API key long-term)
- No breaking changes to existing code
- Can be deployed as regular code update
- No special warmup or validation steps

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained
- Existing sandboxes continue to work
- Progress files format extended, not changed
- Old logs remain valid
- No API changes

**Monitoring after deployment**:
- Watch startup success rate (target: 95%+)
- Monitor retry distribution
- Check for timeout-related errors
- Verify progress files update correctly
- Ensure no zombie processes accumulate

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Startup success rate improves from 36% to 95%+
- [ ] Retries work correctly (exponential backoff verified)
- [ ] Health checks detect startup hangs accurately
- [ ] Staggering prevents simultaneous startup
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Progress files track startup attempts
- [ ] Logs are comprehensive and useful for diagnostics
- [ ] No zombie processes after timeouts
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Key Insights from Diagnosis**:

- The 64% failure rate is highly consistent (93 bytes exactly), suggesting the hang occurs at the exact same point in all failures
- Successful sandboxes produce output immediately (500+ bytes), showing the system CAN work
- Feature #1376 got further (into task execution), showing secondary hang is also real
- No error messages suggest silent hangs, not crashes
- Intermittent success suggests external factor (API rate limits, OAuth session limits, or timing-dependent race condition)

**Why This Fix Works**:

1. **Detects the hang** - Monitors for output within 60s timeout
2. **Recovers automatically** - Retries with exponential backoff
3. **Prevents cascading failures** - Staggering reduces simultaneous API load
4. **Low-risk** - Wrapper approach, doesn't change core logic
5. **Proven pattern** - Matches industry standard retry strategies
6. **Quick win** - Can be implemented and tested in one day
7. **Instrumented for future** - Logs show what's happening for API key migration

**Future Improvements**:

After this fix is deployed and validated:
1. Switch to API key authentication (eliminates OAuth session limits)
2. Implement adaptive timeout based on sandbox performance history
3. Add metrics dashboard for startup success rate
4. Consider process pool implementation if staggering becomes bottleneck

**Related Documentation**:

- Architecture Overview: `.ai/ai_docs/context-docs/development/architecture-overview.md`
- E2B Sandbox Setup: `.ai/ai_docs/context-docs/infrastructure/docker-setup.md`
- Auth Overview: `.ai/ai_docs/context-docs/infrastructure/auth-overview.md`
- Similar issue: #1443 (sandbox accumulation - recently fixed)

---
*Generated by Claude Bug Fix Planning Assistant*
*Based on diagnosis: #1444*
*Planning approach: Startup timeout with automatic retry + output detection + aggressive staggering*
