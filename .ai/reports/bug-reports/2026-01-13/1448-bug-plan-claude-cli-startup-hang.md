# Bug Fix: Claude CLI Startup Hang in E2B Sandboxes

**Related Diagnosis**: #1448
**Severity**: high
**Bug Type**: performance
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Claude CLI hangs during API initialization in E2B sandbox environment due to OAuth session limits, API rate limiting, and/or PTY allocation issues with `unbuffer`
- **Fix Approach**: Multi-pronged solution: reduce concurrent load via stagger, simplify auth with API key, and improve terminal handling with native E2B PTY API
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Claude CLI consistently hangs during startup in E2B sandboxes, producing only 2 lines of output before becoming unresponsive. The retry mechanism is working correctly but cannot overcome the underlying environmental startup failure. Sandboxes fail with ~64% frequency, then eventually recover without code changes, suggesting external rate limiting or session limits.

For full details, see diagnosis issue #1448.

### Solution Approaches Considered

#### Option 1: Increase Stagger + Switch to API Key Auth + Use Native PTY ⭐ RECOMMENDED

**Description**:
- Increase sandbox stagger from 30s to 60s to reduce concurrent API connections
- Switch from OAuth to API key authentication (simpler, more reliable for automation)
- Use E2B's native `sandbox.pty.create()` API instead of wrapping with `unbuffer` command
- Keep existing retry mechanism unchanged (it's working correctly)

**Pros**:
- Addresses root cause directly: reduces concurrent load on OAuth/API
- API key auth is simpler and more reliable for automated systems
- E2B native PTY is more robust in containerized environments
- No breaking changes, backwards compatible
- Sandboxes will start more reliably without external rate limit issues
- Lower operational overhead than circuit breaker pattern
- Can be implemented incrementally

**Cons**:
- Requires ANTHROPIC_API_KEY environment variable setup
- Slower feature development (60s stagger adds startup time)
- OAuth token (Max plan) becomes unused in sandboxes
- Slightly higher compute cost if stagger becomes bottleneck

**Risk Assessment**: Low - All changes are environmental, no business logic changes

**Complexity**: Moderate - Requires changes to template, script invocation, and environment variable handling

#### Option 2: OAuth-Only Fix with Increased Stagger + Health Check

**Description**: Keep OAuth but increase stagger to 60s, add pre-startup health check with `claude --version`, and improve output monitoring.

**Pros**:
- Minimal code changes required
- Preserves existing OAuth setup
- Health check provides fast feedback on token issues

**Cons**:
- Doesn't address the fundamental issue: OAuth may have session limits
- Additional health check adds 2-3 seconds per startup
- Still relies on `unbuffer` which may be problematic
- May still experience 20-30% failure rate if auth is bottleneck
- Requires tuning stagger time empirically

**Why Not Chosen**: Doesn't address root cause (OAuth session limits) and doesn't improve PTY handling. Still leaves system fragile.

#### Option 3: Circuit Breaker Pattern with Exponential Backoff

**Description**: Add circuit breaker that pauses all sandboxes for 5 minutes if all 3 fail simultaneously.

**Pros**:
- Prevents rapid cycling that exacerbates rate limiting
- Gives system time to recover from quota resets
- Graceful degradation signal to user

**Cons**:
- Doesn't fix underlying issue, just masks it
- Adds complexity to orchestrator logic
- 5-minute pause could be too long in some cases
- User sees "degraded mode" warnings frequently

**Why Not Chosen**: Treats symptom, not cause. Combined with Option 1 as secondary improvement.

### Selected Solution: Increase Stagger + API Key Auth + Native PTY

**Justification**:
This approach directly addresses the three identified root causes:
1. **OAuth session limits** → Solved by switching to API key authentication (simpler, no session management)
2. **API rate limiting with concurrent connections** → Solved by increasing stagger from 30s to 60s
3. **PTY allocation issues with `unbuffer`** → Solved by using E2B's native `sandbox.pty.create()` API

API key authentication is standard practice for automated systems and eliminates the OAuth complexity. The longer stagger ensures sandboxes don't pile up on API endpoints simultaneously. Native PTY handling is more robust in containerized environments.

This solution is low-risk because:
- No changes to core business logic or feature implementation
- Changes are isolated to sandbox startup infrastructure
- Can be tested in parallel with existing OAuth-based sandboxes
- Rollback is simple (revert stagger and auth method)
- Existing retry mechanism remains unchanged and keeps working

**Technical Approach**:

1. **Environment Variable Setup**:
   - Add `ANTHROPIC_API_KEY` as alternative to `CLAUDE_CODE_OAUTH_TOKEN`
   - Claude CLI automatically uses API key if both are set and OAuth is unavailable
   - Environment variables injected at sandbox startup

2. **Increase Stagger Timing**:
   - Change `SANDBOX_STAGGER_DELAY_MS` from 30,000ms (30s) to 60,000ms (60s)
   - Prevents 3 sandboxes from hitting API simultaneously
   - Aligns with typical API rate limit windows (60-120s)

3. **Use E2B Native PTY**:
   - Replace `unbuffer bash -c "..."` with E2B's `sandbox.pty.create()` API
   - More reliable output streaming in containerized environments
   - Better handling of terminal control sequences

4. **Update run-claude Script**:
   - Modify template's `run-claude` script to use native PTY
   - Set `TERM=dumb` and `CI=true` environment variables for non-interactive mode
   - Remove dependency on `unbuffer` command

5. **Add Startup Health Signal** (Secondary):
   - Claude CLI will output "Ready" signal within 30 seconds
   - Startup detection can key off this instead of arbitrary byte count
   - More robust than counting output lines

**Architecture Changes**:
- None to application code
- Changes isolated to sandbox startup infrastructure in `.ai/alpha/scripts/`
- Changes to E2B template configuration

**Migration Strategy**:
No migration needed. Existing OAuth-based execution continues to work. API key becomes the primary method for Alpha feature development workflow.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/config/constants.ts` - SANDBOX_STAGGER_DELAY_MS constant
- `.ai/alpha/scripts/lib/feature.ts` - Sandbox startup and Claude invocation
- `.ai/alpha/scripts/lib/startup-monitor.ts` - Startup hang detection
- `packages/e2b/e2b-template/template.ts` - `run-claude` script definition in template
- `apps/web/.env.example` - Add ANTHROPIC_API_KEY example

### New Files

- None required (using existing E2B SDK APIs)

### Step-by-Step Tasks

#### Step 1: Prepare Environment Variables and Template Configuration

Update configuration to support API key authentication and adjust sandbox timing.

- Update `.ai/alpha/scripts/config/constants.ts` to increase SANDBOX_STAGGER_DELAY_MS from 30,000 to 60,000
- Verify ANTHROPIC_API_KEY is added to sandbox environment variable injection in `getAllEnvVars()` function
- Update `packages/e2b/e2b-template/template.ts` to pass ANTHROPIC_API_KEY to sandbox
- Update `apps/web/.env.example` to document ANTHROPIC_API_KEY requirement for Alpha workflow
- Add comments explaining the stagger timing and why 60s is necessary

**Why this step first**: Foundation for all other changes. Must have proper environment setup before modifying startup behavior.

#### Step 2: Update run-claude Script to Use Native E2B PTY

Replace `unbuffer` wrapper with E2B native PTY allocation for more reliable terminal handling.

- Locate `run-claude` script definition in `packages/e2b/e2b-template/template.ts`
- Replace `unbuffer bash -c "..."` with E2B SDK `sandbox.pty.create()` call
- Set environment variables: `TERM=dumb`, `CI=true` for non-interactive execution
- Ensure `NO_COLOR=1` is set to prevent color code output that may confuse monitoring
- Add error handling for PTY creation failures with fallback to regular execution

**Why this step second**: Changes how Claude CLI is invoked. Step 1 must be complete before this works.

#### Step 3: Implement Startup Health Signal Detection (Optional)

Improve startup detection to key off actual "ready" signal instead of output byte count.

- Modify startup detection in `startup-monitor.ts` to look for "Ready" or similar signal from Claude CLI
- Add timeout of 30 seconds for health signal (faster than current 60s)
- Fall back to existing byte-counting method if signal not received within 30s
- Log which detection method was used for debugging

**Why this step optional**: Improves robustness but current detection works. Can be implemented in follow-up if needed.

#### Step 4: Add Logging and Monitoring

Enhance logging to track startup success/failure rates and timing.

- Add metrics logging in feature.ts: stagger delays, startup attempts, success rates
- Log which auth method was used (OAuth vs API key) in startup attempts
- Log PTY creation success/failure
- Track time from sandbox creation to first output

**Why this step important**: Needed to verify the fix is working and to detect future issues.

#### Step 5: Test and Validate

Comprehensive testing to ensure fix resolves the issue without introducing regressions.

- Run spec orchestrator multiple times and verify failure rate drops below 5%
- Monitor logs for successful API key authentication
- Verify PTY creation succeeds consistently
- Test that OAuth-based sandboxes (if any remain) still work
- Verify feature completion times are acceptable with 60s stagger
- Check that retry mechanism still works if startup fails

**Why this step last**: Validates entire solution end-to-end.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Stagger timing calculation is 60 seconds
- ✅ API key environment variable is properly injected
- ✅ PTY creation is attempted before fallback to regular execution
- ✅ Startup detection timeout is 30 seconds (if implementing health signal)
- ✅ Existing retry logic continues to work unchanged

**Test files**:
- `.ai/alpha/scripts/__tests__/feature.test.ts` - Startup and retry behavior
- `.ai/alpha/scripts/__tests__/startup-monitor.test.ts` - Health signal detection

### Integration Tests

Test the full startup flow in controlled environment:
- Verify API key authentication works end-to-end
- Verify sandbox can execute Claude commands successfully
- Verify retry loop engages if startup fails
- Verify stagger prevents simultaneous sandbox creation

**Test files**:
- `.ai/alpha/scripts/__tests__/e2b-startup.integration.test.ts` - E2B sandbox startup

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Set ANTHROPIC_API_KEY in local `.env.local`
- [ ] Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe 3 sandboxes created with 60s stagger between each
- [ ] Verify each sandbox starts Claude CLI successfully (no hangs)
- [ ] Check logs show API key authentication being used
- [ ] Verify feature progress files update with tasks completing
- [ ] Monitor for 10+ cycles (~10 minutes) with 0-1 failed startups (previously 2-3 failures)
- [ ] Verify retry mechanism still works if a startup does fail
- [ ] Check performance is acceptable (60s stagger may slow feature development)
- [ ] Test OAuth fallback still works if ANTHROPIC_API_KEY not set

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Slower Feature Development Due to 60s Stagger**:
   - Description: Increasing stagger from 30s to 60s adds 60 seconds to total workflow time for 3 features
   - Likelihood**: Low
   - Impact**: Medium - Slightly slower dev cycles, not critical
   - Mitigation: 60s is necessary to prevent API rate limiting. Once API infrastructure improves, can lower stagger back to 30s or use adaptive stagger

2. **ANTHROPIC_API_KEY Not Available in Production**:
   - Description: If API key is not set in production sandboxes, fallback to OAuth still works but may have same issues
   - Likelihood**: Medium
   - Impact**: Medium - Some startups may fail, but retries still work
   - Mitigation: Ensure ANTHROPIC_API_KEY is properly set in deployment config. OAuth fallback ensures no breaking change

3. **E2B PTY API Behavior Different Than unbuffer**:
   - Description: Native PTY may handle output streaming differently than unbuffer
   - Likelihood**: Low
   - Impact**: Low - Affects only output formatting, not functionality
   - Mitigation: Fallback to unbuffer if PTY creation fails. Test output handling before deployment

4. **Startup Health Signal Never Arrives** (if implementing):
   - Description: Claude CLI may not output expected "Ready" signal in some edge cases
   - Likelihood**: Low
   - Impact**: Low - Falls back to byte-counting method
   - Mitigation: Keep fallback to existing byte-count detection. Make health signal optional

**Rollback Plan**:

If this fix causes issues in production:

1. Revert `.ai/alpha/scripts/config/constants.ts` to SANDBOX_STAGGER_DELAY_MS = 30,000
2. Revert `run-claude` script to use `unbuffer` instead of native PTY
3. Redeploy template with `tsx packages/e2b/e2b-template/build-template.ts`
4. Verify sandboxes return to previous behavior (with expected ~64% failure rate)

**Monitoring** (After Deployment):

- Monitor startup success rate: target >95% (up from 36%)
- Track average startup time: expect ~30s per sandbox (after stagger)
- Log API key vs OAuth usage to verify migration
- Alert if startup failures exceed 10% for any 10-minute window
- Track feature completion times to ensure stagger doesn't impact workflow significantly

## Performance Impact

**Expected Impact**: Minimal to Positive

Currently, the system has a ~64% failure rate on startup, requiring multiple retries. The 60s stagger will add 60 seconds to the overall workflow for 3 concurrent features, but this is offset by dramatically improved success rates (expected >95%).

**Before Fix**:
- Startup attempts: Average 2-3 per feature (due to hangs and retries)
- Total time: 3 features × 60s × 2 retries = 360+ seconds with failures
- Success rate: ~36% on first attempt

**After Fix**:
- Startup attempts: 1 per feature (success on first try)
- Total time: 3 features × 60s stagger = 180 seconds (one-time setup)
- Success rate: >95% on first attempt

**Net Impact**: Overall faster and more reliable, despite individual stagger delay.

**Performance Testing**:

```bash
# Measure startup time before and after fix
time tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Track metrics in logs
grep "startup.*complete" .ai/alpha/progress/*.json | jq '.last_heartbeat'

# Calculate success rate
grep "status.*failed" .ai/reports/bug-reports/*/*.log | wc -l
```

## Security Considerations

**Security Impact**: None - Potentially Improved

- API key authentication eliminates OAuth complexity and potential token refresh failures
- API keys are standard practice for service-to-service authentication
- Environment variables are securely injected at runtime
- No secrets baked into template or logs

**Security Review**: Not needed - changes are infrastructure-only

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with current config
export ANTHROPIC_API_KEY=""  # Force OAuth
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe in logs: multiple startup failures, retries, eventual recovery
tail -f .ai/alpha/progress/sbx-*.log
```

**Expected Result**: Startup failures detected, retries engaged, eventual recovery after 3-10 minutes

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator with fix
export ANTHROPIC_API_KEY="sk-ant-..."  # Your API key
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor startup success
tail -f .ai/alpha/progress/sbx-*.log

# Wait for all features to complete
# Expected: All features complete within 15-20 minutes with <1 startup failure
```

**Expected Result**: All commands succeed, startup hangs disappear, >95% success rate on first attempt

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specifically test startup/retry logic
pnpm test -- feature.test.ts
pnpm test -- startup-monitor.test.ts

# Run E2B integration tests (if implemented)
pnpm test -- e2b-startup.integration.test.ts
```

## Dependencies

### New Dependencies

No new dependencies required. Using:
- Existing E2B SDK APIs (`sandbox.pty.create()`)
- Existing Node.js standard library
- Existing environment variable handling

**No new dependencies added**

## Database Changes

**No database changes required** - This is infrastructure-only change at sandbox startup layer.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
1. Rebuild E2B template with `tsx packages/e2b/e2b-template/build-template.ts`
2. Ensure `ANTHROPIC_API_KEY` is set in deployment environment
3. Deploy changes to `.ai/alpha/scripts/` files
4. Monitor first 10 orchestrator runs for startup success rates

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - OAuth fallback still works if API key not set

## Success Criteria

The fix is complete when:

- [ ] Startup hang failures drop from 64% to <5%
- [ ] First-attempt success rate increases from 36% to >95%
- [ ] No new test failures introduced
- [ ] All type checking passes
- [ ] All linting passes
- [ ] API key authentication verified working in logs
- [ ] Retry mechanism continues to work if startup fails
- [ ] Feature completion times are acceptable (within 5-10% of baseline)
- [ ] No security or reliability regressions detected
- [ ] Production monitoring shows consistent >95% success rate

## Notes

**Implementation Priority**: Files should be modified in this order to ensure dependencies are satisfied:
1. `config/constants.ts` - Environment setup
2. `e2b-template/template.ts` - Template config
3. `lib/feature.ts` - Startup invocation
4. `lib/startup-monitor.ts` - Detection improvement (optional)

**Key Decision Points**:
- 60s stagger: Balances concurrency with API limits. Can be tuned based on observed failure rates.
- API key over OAuth: Simplifies auth for automation. OAuth fallback available as backup.
- E2B PTY over unbuffer: More reliable in containers. Standard practice for terminal allocation.

**Testing Notes**:
- First run after deployment may still have failures (if system in degraded state). Monitor for recovery.
- Retry mechanism is critical safety valve - ensure it remains functional during all testing.
- Startup monitoring logs are essential for debugging future issues. Keep verbose logging.

**Related Fixes**:
- #1447 - Retry loop implementation (prerequisite, already completed)
- #1446 - Startup detection (prerequisite, already completed)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1448*
