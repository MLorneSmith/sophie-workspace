# Bug Fix: Missing Email Configuration in Web App Test Environment

**Related Diagnosis**: #722
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `.env.test` missing required email variables (`EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_TLS`, `MAILER_PROVIDER`)
- **Fix Approach**: Add missing email environment variables to match E2E test configuration
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests that depend on email functionality (invitation flows, password reset, etc.) fail because the web application's test environment configuration (`.env.test`) is missing required email variables. The nodemailer service requires complete SMTP configuration to function, including authentication credentials and protocol settings.

For full details, see diagnosis issue #722.

### Solution Approaches Considered

#### Option 1: Add Missing Variables to `.env.test` ⭐ RECOMMENDED

**Description**: Add the four missing email configuration variables to `apps/web/.env.test` using dummy credentials that work with Mailpit's local SMTP server.

**Pros**:
- Minimal change - only adds missing configuration lines
- Uses same pattern as E2E test environment
- Mailpit accepts any credentials for testing
- Zero code changes required
- No risk of breaking other functionality

**Cons**:
- None identified for this simple fix

**Risk Assessment**: low - Configuration-only change, no code modifications

**Complexity**: simple - Direct variable addition

#### Option 2: Use Environment Variable Defaults in Code

**Description**: Modify the Zod schema or nodemailer configuration to provide defaults for missing variables.

**Pros**:
- Could handle missing config gracefully in code

**Cons**:
- Unnecessary code changes for a configuration issue
- Makes test environment implicit rather than explicit
- Could mask configuration problems in other environments
- More complex than the direct approach

**Why Not Chosen**: Over-engineering for a configuration issue. The diagnosis clearly shows the root cause is missing environment variables, which should be explicitly configured in the test environment file.

### Selected Solution: Add Missing Variables to `.env.test`

**Justification**: This is the most direct, maintainable solution. The test environment's `.env.test` file should be self-contained and explicit about all required configuration. Adding the missing variables ensures the web app has complete email configuration matching the E2E test environment's setup.

**Technical Approach**:
- Add `EMAIL_USER=user` to `.env.test`
- Add `EMAIL_PASSWORD=password` to `.env.test`
- Add `EMAIL_TLS=false` to `.env.test`
- Add `MAILER_PROVIDER=nodemailer` to `.env.test`
- These values work with the local Mailpit SMTP server (accepts any credentials)
- Maintains consistency with E2E test environment configuration

**Architecture Changes**: None - configuration-only change

**Migration Strategy**: Not needed - this is a new test environment configuration

## Implementation Plan

### Affected Files

- `apps/web/.env.test` - Add four missing email configuration variables

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update `.env.test` with Missing Email Variables

Add the four missing email configuration variables to the Email Configuration section in `apps/web/.env.test`:

- Add `EMAIL_USER=user` (SMTP authentication username)
- Add `EMAIL_PASSWORD=password` (SMTP authentication password)
- Add `EMAIL_TLS=false` (SMTP security - false for local Mailpit)
- Add `MAILER_PROVIDER=nodemailer` (Specifies nodemailer as the mailer implementation)

**Why this step first**: This is the core fix that resolves the root cause. All other steps depend on this configuration being in place.

**Verification**: The file should have these variables added in the "Email Configuration" section alongside the existing `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SENDER` variables.

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration change.

### Integration Tests

No integration tests needed - the mail service validation is handled by Zod schema validation in the application.

### E2E Tests

The following existing E2E tests will validate the fix:

- ✅ Full Invitation Flow (`apps/e2e/tests/authentication/invitations.spec.ts`)
- ✅ Any password reset tests that depend on email
- ✅ Any email confirmation tests

**Test files**:
- `apps/e2e/tests/authentication/invitations.spec.ts` - Will now receive emails in Mailpit

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm supabase:web:start` to start Supabase with Mailpit
- [ ] Run `pnpm --filter web dev:test` to start web app in test mode
- [ ] Check that `.env.test` now includes all four new email variables
- [ ] Run E2E test shard 4 with `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
- [ ] Verify the "Full Invitation Flow" test passes
- [ ] Check Mailpit API (`curl http://127.0.0.1:54524/api/v1/messages`) shows email was received
- [ ] Verify no other tests were negatively affected by the configuration change

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incomplete configuration**: Variables are missing or incorrect values are used
   - **Likelihood**: low
   - **Impact**: low (test fails again, easy to fix)
   - **Mitigation**: Follow the diagnosis specification exactly for variable names and values

2. **Variable naming mistakes**: Typos in environment variable names
   - **Likelihood**: low
   - **Impact**: low (nodemailer validation will catch during app startup)
   - **Mitigation**: Copy exact variable names from diagnosis issue

**Rollback Plan**:

If this fix causes issues (extremely unlikely for a configuration change):
1. Remove the four added lines from `.env.test`
2. Restart the web app with `pnpm --filter web dev:test`
3. System reverts to previous (broken) state

**Monitoring** (if needed): None - this is a configuration fix with no runtime side effects

## Performance Impact

**Expected Impact**: none

No performance implications - this is a configuration change that enables email functionality that was previously broken.

## Security Considerations

**Security Impact**: none

- Test environment uses dummy SMTP credentials (`user`/`password`)
- These credentials are only valid against the local Mailpit SMTP server
- No real email service credentials are used or exposed
- The `.env.test` file is not committed and is environment-specific

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start Supabase
pnpm supabase:web:start

# Verify .env.test is missing email variables
grep -E "EMAIL_USER|EMAIL_PASSWORD|EMAIL_TLS|MAILER_PROVIDER" apps/web/.env.test
# Expected: No output (variables missing)

# Start web app in test mode
pnpm --filter web dev:test

# Run E2E test shard 4
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
# Expected: "Full Invitation Flow" test fails with "Email body was not found"
```

**Expected Result**: Test fails because email configuration is incomplete

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify variables were added to .env.test
grep -E "EMAIL_USER|EMAIL_PASSWORD|EMAIL_TLS|MAILER_PROVIDER" apps/web/.env.test
# Expected: 4 lines with the new variables

# Start Supabase
pnpm supabase:web:start

# Start web app in test mode
pnpm --filter web dev:test

# Run E2E test shard 4
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
# Expected: "Full Invitation Flow" test passes
```

**Expected Result**: All commands succeed, bug is resolved, E2E tests pass.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run full E2E test suite
pnpm --filter web-e2e test

# Verify Mailpit received emails
curl -s http://127.0.0.1:54524/api/v1/messages | jq '.total'
# Expected: > 0 (emails were sent and received)
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low - Configuration-only change

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - Adding configuration doesn't affect existing functionality

## Success Criteria

The fix is complete when:
- [ ] `.env.test` contains all four missing email variables
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] All E2E tests in shard 4 pass (especially "Full Invitation Flow")
- [ ] No regressions detected in other test suites
- [ ] Mailpit API confirms emails are being received
- [ ] Code quality checks pass

## Notes

**Why these specific values?**

- `EMAIL_USER=user` and `EMAIL_PASSWORD=password`: Mailpit's local SMTP server accepts any credentials. These are dummy values safe to hardcode in the test environment.
- `EMAIL_TLS=false`: Local Mailpit runs without TLS encryption (port 54525 is unencrypted SMTP)
- `MAILER_PROVIDER=nodemailer`: Specifies nodemailer as the email service, matching the E2E test configuration

**Related Issues**:
- #720 - Previous bug fix for E2E shard 4 (auth timeout from redundant login)
- Blocks: Full Invitation Flow E2E test
- Blocks: Any password reset or email confirmation E2E tests

---
*Bug Fix Plan for Issue #722*
*Related Diagnosis: #722*
