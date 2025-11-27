# Bug Fix: E2E Invitation Tests Hang Due to Missing Email Config and Infinite Retry Loop

**Related Diagnosis**: #756 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two compounding issues—Docker missing email environment variables + `toPass()` without timeout
- **Fix Approach**: Add missing email env vars to docker-compose and add timeout to `toPass()` assertion
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E shard 4 invitation tests hang indefinitely when running in Docker containers. The root cause has two parts:

1. **Missing Docker Email Environment Variables**: The `docker-compose.test.yml` container only provides `EMAIL_HOST` and `EMAIL_PORT`, but the email service requires Zod validation of `EMAIL_SENDER`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, and `MAILER_PROVIDER`. Without these, the email service fails silently, and no emails are sent to Mailpit.

2. **Infinite Retry Loop in `visitConfirmEmailLink()`**: The method calls `toPass()` without a timeout parameter. When no email arrives (because of issue #1), Playwright retries indefinitely, eventually timing out the entire test suite.

For full details, see diagnosis issue #756.

### Solution Approaches Considered

#### Option 1: Add Missing Env Vars + Add Timeout ⭐ RECOMMENDED

**Description**: Add all required email environment variables to `docker-compose.test.yml` for the test containers, and add a timeout parameter to the `toPass()` assertion in `visitConfirmEmailLink()`.

**Pros**:
- Fixes both root causes comprehensively
- Email service now works correctly in Docker
- Tests fail fast instead of hanging indefinitely
- Timeout acts as a safety net for future email issues
- Minimal code changes, surgical approach
- Improves visibility into actual email problems (tests will fail with clear error)

**Cons**:
- None significant

**Risk Assessment**: low - Configuration changes only, no logic changes

**Complexity**: simple - Add environment variables and update one method call

#### Option 2: Only Add Timeout (Partial Fix)

**Description**: Add timeout to `toPass()` but don't fix the missing environment variables.

**Why Not Chosen**: Tests would still fail because emails aren't being sent. The test would fail faster (good), but we'd need to debug the same email issue again during test runs. The email service wouldn't be properly configured for Docker testing.

#### Option 3: Only Add Email Env Vars (Incomplete)

**Description**: Add environment variables but don't change the `toPass()` call.

**Why Not Chosen**: Risk of future hangs if other issues arise with email. The timeout is important defensive programming for test reliability.

### Selected Solution: Add Missing Env Vars + Add Timeout

**Justification**: This approach is the complete, robust solution. It:
- Fixes the immediate Docker configuration problem that prevents emails from being sent
- Prevents future indefinite hangs with a timeout safety net
- Requires minimal code changes (highly surgical)
- Follows defensive programming best practices
- Provides clear failure signals for debugging

**Technical Approach**:
1. Add missing email configuration variables to docker-compose test environment:
   - `EMAIL_SENDER=test@slideheroes.com` - Required by Zod schema
   - `EMAIL_USER=user` - SMTP authentication
   - `EMAIL_PASSWORD=password` - SMTP authentication
   - `EMAIL_TLS=false` - No TLS for local Mailpit
   - `MAILER_PROVIDER=nodemailer` - Email service provider

2. Add timeout to `visitConfirmEmailLink()` method:
   - Set timeout to 60 seconds (reasonable for email to arrive)
   - Specify retry intervals to start checking sooner: `[1000, 2000, 5000, 10000, 15000]`

**Architecture Changes**: None - purely configuration and method signature update

**Migration Strategy**: N/A - this is a test environment fix with no data migration

## Implementation Plan

### Affected Files

- `docker-compose.test.yml` - Add missing email environment variables (lines 45-47 for app-test, lines 109-111 for payload-test)
- `apps/e2e/tests/authentication/auth.po.ts` - Add timeout to `visitConfirmEmailLink()` method (line 283)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Missing Email Environment Variables to docker-compose.test.yml

<describe what this step accomplishes>

This step ensures the email service in Docker has all required configuration to send test emails to Mailpit.

- Add `EMAIL_SENDER=test@slideheroes.com` to both app-test and payload-test containers
- Add `EMAIL_USER=user` to both containers
- Add `EMAIL_PASSWORD=password` to both containers
- Add `EMAIL_TLS=false` to both containers
- Add `MAILER_PROVIDER=nodemailer` to both containers

**Why this step first**: The Docker configuration must be correct before testing. Without these variables, the email service won't initialize, and no emails will be sent to Mailpit regardless of timeout settings.

#### Step 2: Add Timeout to visitConfirmEmailLink() Method

<describe what this step accomplishes>

This step prevents the test from hanging indefinitely and provides clear failure signals when emails don't arrive.

- Update `visitConfirmEmailLink()` in `apps/e2e/tests/authentication/auth.po.ts` to add timeout and retry intervals to `toPass()` call
- Set timeout: 60000 milliseconds (60 seconds)
- Set intervals: [1000, 2000, 5000, 10000, 15000] milliseconds
- This means: check after 1s, 2s, 5s, 10s, 15s, then fail if still no email after ~43s total

**Why this step second**: After fixing Docker configuration, we ensure the test method has proper timeout behavior to fail fast if emails still don't arrive for other reasons.

#### Step 3: Add Tests for Email Configuration

<describe the testing strategy>

- Verify email environment variables are correctly passed to containers
- Test invitation email flow end-to-end in Docker
- Add test case for timeout behavior (ensure test fails instead of hanging)

**Test files**:
- `apps/e2e/tests/invitations/invitations.spec.ts` - Existing invitation tests should pass
- No new test files needed (existing tests validate the fix)

#### Step 4: Validation

- Run all invitation tests (shard 4)
- Verify tests complete (pass or fail with clear error, no hanging)
- Verify email arrives in Mailpit during test runs
- Verify timeout triggers correctly if email service is unavailable

## Testing Strategy

### Unit Tests

Not applicable - this is a Docker configuration and test utility update.

### Integration Tests

Not applicable - invitation tests validate the complete flow.

### E2E Tests

**Existing E2E tests validate the fix**:
- `invitations.spec.ts:104` - Full Invitation Flow test
- Any test using `visitConfirmEmailLink()` method

**Test coverage**:
- ✅ Email configuration is correct in Docker containers
- ✅ Emails are sent to Mailpit successfully
- ✅ `visitConfirmEmailLink()` finds the confirmation link
- ✅ Timeout triggers if email doesn't arrive
- ✅ Test completes in reasonable time (no hanging)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Docker test containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify email environment variables are set: `docker exec slideheroes-app-test env | grep EMAIL_`
- [ ] Check Mailpit is receiving emails: Visit http://localhost:54524 (Mailpit web UI)
- [ ] Run invitation tests: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
- [ ] Verify tests complete (pass or fail quickly, no hanging)
- [ ] Verify at least one email appears in Mailpit during test run
- [ ] Check that timeout works: Temporarily disable Mailpit, run tests, verify they fail after ~60s instead of hanging

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Email Service Still Not Working**: If the email service has other configuration issues not covered by these environment variables
   - **Likelihood**: low (Zod schema only requires these 5 variables)
   - **Impact**: medium (tests still fail, but at least they complete quickly)
   - **Mitigation**: Add logging to email service initialization to help debug

2. **Email Arrives Too Slowly**: If Mailpit or network is slow, email might not arrive within 60-second timeout
   - **Likelihood**: low (local Docker network is fast)
   - **Impact**: low (test fails but doesn't hang entire suite)
   - **Mitigation**: 60-second timeout is reasonable for local testing; timeout can be increased if needed

3. **Tests Pass Unexpectedly**: If there are other bugs preventing invitations from working, these changes won't reveal them
   - **Likelihood**: very low (diagnosis clearly identified the root cause)
   - **Impact**: low (tests will still fail for the right reasons)
   - **Mitigation**: Review diagnosis issue #756 for confidence

**Rollback Plan**:

If this fix causes issues:
1. Remove the new environment variables from `docker-compose.test.yml`
2. Remove the timeout parameter from `visitConfirmEmailLink()` call
3. Revert to previous version: `git revert <commit-hash>`
4. Investigate any new email configuration requirements

**Monitoring** (if needed):

- Monitor test execution time for shard 4: Should complete in <5 minutes (currently hangs indefinitely)
- Watch for new email-related test failures: Timeout will reveal problems quickly
- Check Mailpit logs if tests fail: `docker logs supabase_inbucket_2025slideheroes-db`

## Performance Impact

**Expected Impact**: minimal

The timeout and retry intervals are designed for the local Docker environment. Performance impact:
- Tests will fail faster if email service is unavailable (~60s instead of hanging)
- Email delivery time is unchanged (local Mailpit is fast)
- No additional network calls or database queries

**Performance Testing**:
- Run full shard 4 test suite and measure execution time
- Verify no regression in non-email tests
- Expected time: <5 minutes total

## Security Considerations

**Security Impact**: none

- Email variables are test-only (never used in production)
- `EMAIL_USER` and `EMAIL_PASSWORD` are default test credentials
- `EMAIL_TLS=false` is appropriate for local Mailpit (no encryption needed)
- No sensitive information in configuration

## Validation Commands

### Before Fix (Bug Should Reproduce)

If you have the old docker-compose.test.yml without email variables:

```bash
# Start containers
docker-compose -f docker-compose.test.yml up -d

# Run shard 4 tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# Expected: Tests hang indefinitely, no timeout
```

**Expected Result**: Tests hang without completing (timeout after ~15 minutes in CI)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify Docker configuration
docker exec slideheroes-app-test env | grep -E "EMAIL_"

# Run shard 4 tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# Expected: All tests complete (pass or fail quickly, no hanging)
```

**Expected Result**:
- All validation commands succeed
- Shard 4 tests complete within 5 minutes
- Zero hanging tests
- Tests fail with clear error if email service unavailable (not indefinite retry)

### Regression Prevention

```bash
# Run all E2E tests to ensure no regressions
pnpm test:e2e

# Check no other tests use toPass without timeout
grep -r "toPass()" apps/e2e/tests/ --include="*.ts" | grep -v "timeout:"

# Verify email environment variables don't break other containers
docker exec slideheroes-payload-test env | grep -E "EMAIL_"
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses existing Playwright `toPass()` API with timeout parameter (available in Playwright 1.40+).

**No new dependencies added**

## Database Changes

**No database changes required**

This is a test environment configuration fix with no schema or data changes.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained

This fix only affects test containers and test utilities. No production code changes.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Shard 4 invitation tests complete (pass or fail, no hanging)
- [ ] At least one test passes and emails successfully arrive in Mailpit
- [ ] Zero infinite retry loops or test hangs
- [ ] All other E2E tests still pass (no regressions)
- [ ] Code passes linting and type checking
- [ ] Docker email environment variables are verified in containers

## Notes

- The diagnosis issue #756 clearly identified both root causes with evidence from Mailpit (0 messages despite SMTP connectivity)
- This is a straightforward fix that requires no architectural changes
- The timeout parameter in `toPass()` is defensive programming and prevents future similar hangs
- Email configuration follows existing patterns in the codebase (see docker-compose.yml examples)

## Related Issues & Context

- **Diagnosis**: #756 - Root cause analysis and evidence
- **Related**: Shard 4 remains the only failing E2E test suite
- **Test Infrastructure**: Uses safe-test-runner.sh for test execution

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #756*
