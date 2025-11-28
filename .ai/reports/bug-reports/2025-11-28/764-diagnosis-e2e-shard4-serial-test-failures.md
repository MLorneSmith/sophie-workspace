# Bug Diagnosis: E2E Shard 4 Serial Test Failures - State Corruption from Serial Mode

**ID**: ISSUE-764
**Created**: 2025-11-28T19:25:00Z
**Reporter**: Claude Code
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shard 4 (Admin & Invitations) is experiencing 6 test failures out of 9 tests (67% failure rate). The failures occur in two test suites that use `test.describe.configure({ mode: "serial" })`. Serial mode causes tests to share browser context, leading to state corruption when earlier tests modify cookies/auth state and later tests inherit that corrupted state.

## Environment

- **Application Version**: Latest on dev branch
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - tests have been unstable

## Reproduction Steps

1. Run E2E shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
2. Observe 6 failures out of 9 tests
3. Examine screenshots showing wrong authentication states

## Expected Behavior

- All 9 tests in shard 4 should pass
- Each test should start with the correct pre-authenticated session
- Admin tests should have SUPER_ADMIN auth state
- Invitation tests should have OWNER_USER auth state

## Actual Behavior

- 6 tests fail with various errors:
  - "ban user flow" - shows sign-in page instead of admin panel
  - "delete team account flow" - user on wrong account dashboard
  - "displays personal account details" - assertion failed (Object.is equality)
  - "users can delete invites" / "users can update invites" - 120s timeout
  - "accept invite flow" - "Email body was not found" / stuck on onboarding

## Diagnostic Data

### Console Output
```
Error: locator.waitFor: Test timeout of 120000ms exceeded.
Error: expect(locator).toBeVisible() failed - element(s) not found
Error: Email body was not found
```

### Screenshot Analysis

1. **Ban user flow** (`admin-admin-Admin-Personal-Account-Management-ban-user-flow-chromium/test-failed-1.png`):
   - Shows sign-in page instead of admin panel
   - SUPER_ADMIN auth state not applied
   - **Root Cause**: Previous serial test called `page.context().clearCookies()` (line 131 in admin.spec.ts)

2. **Delete team account flow** (`admin-admin-Team-Account-Management-delete-team-account-flow-chromium/error-context.md`):
   - Shows team dashboard for "test-8h8j9z04s2v"
   - User logged in but not as super-admin
   - **Root Cause**: `Team Account Management` uses `AUTH_STATES.OWNER_USER` but `beforeEach` calls `auth.signOut()` and `auth.loginAsSuperAdmin()` which can timeout

3. **Accept invite flow** (`invitations-invitations-Fu-aa75c--let-users-accept-an-invite-chromium/error-context.md`):
   - Shows onboarding wizard
   - New user stuck in onboarding flow after sign-up
   - **Root Cause**: Test clears cookies (`page.context().clearCookies()`) then expects to continue flow

### Network Analysis
```
Tests use serial mode which shares browser context
Earlier tests modify auth state (clearCookies, signOut, loginAsSuperAdmin)
Later tests inherit corrupted state
```

### Database Analysis
```
Mailpit shows invitation emails exist (2 unread messages)
Email retrieval works - issue is test execution order
```

## Error Stack Traces

```
test-results/admin-admin-Admin-Personal-Account-Management-ban-user-flow-chromium:
  Error: locator.waitFor: Test timeout of 120000ms exceeded.
  > 49 | await expect(dropdownTrigger).toBeVisible({ timeout: 15000 });

test-results/invitations-invitations-Fu-aa75c--let-users-accept-an-invite-chromium:
  Error: Email body was not found
  284 | timeout: 60000,
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts:28` - uses `test.describe.configure({ mode: "serial" })`
  - `apps/e2e/tests/admin/admin.spec.ts:266` - uses `test.describe.configure({ mode: "serial" })`
  - `apps/e2e/tests/invitations/invitations.spec.ts`
- **Recent Changes**: Multiple fixes applied to shard 4 (see issues #719, #729, #730, #731, #732, #733, #734, #737, #739)
- **Suspected Functions**:
  - `page.context().clearCookies()` at line 131 in admin.spec.ts
  - `auth.signOut()` and `auth.loginAsSuperAdmin()` in Team Account Management beforeEach

## Related Issues & Context

### Direct Predecessors
- #739 (CLOSED): "Bug Fix: E2E Shard 4 Tests Timeout During Fresh Authentication" - Changed to use pre-authenticated states
- #737 (CLOSED): "Bug: E2E Shard 4 Tests Timeout During Fresh Authentication" - Diagnosed auth timeout
- #733 (CLOSED): "Bug Diagnosis: E2E Shard 4 Tests Fail - Incomplete Selector Migration"

### Related Infrastructure Issues
- #731 (CLOSED): "Bug Diagnosis: E2E Shard 4 Test Failures Due to Selector Mismatch and Auth State Issues"
- #729 (CLOSED): "Bug Diagnosis: E2E Shard 4 Admin Tests Fail - Global Setup Missing MFA Verification"

### Historical Context
This is the FOURTH round of shard 4 failures. Previous fixes addressed:
1. Missing MFA verification in global setup (#729, #730)
2. Selector mismatches (#731, #732, #733, #734)
3. Fresh authentication timeouts (#737, #739)

The current failures are caused by **serial test mode state corruption** - a different root cause than previous fixes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Serial test mode (`test.describe.configure({ mode: "serial" })`) causes browser context to be shared between tests, and earlier tests that modify authentication state (via `clearCookies()`, `signOut()`, etc.) corrupt the state for subsequent tests.

**Detailed Explanation**:

1. **Serial Mode Behavior**: When tests run in serial mode, they share the same browser context. This means cookies, localStorage, and session state persist between tests unless explicitly reset.

2. **State Corruption Chain**:
   - "Personal Account Management" tests use `AUTH_STATES.SUPER_ADMIN`
   - "ban user flow" test (line 131) calls `page.context().clearCookies()` to verify banned user can't log in
   - This clears the SUPER_ADMIN session
   - Subsequent tests inherit the cleared state
   - Tests timeout trying to interact with admin panel when user is not authenticated

3. **Team Account Management Flow Issue**:
   - Uses `AUTH_STATES.OWNER_USER` storage state
   - `beforeEach` hook calls `auth.signOut()` then `auth.loginAsSuperAdmin()` (lines 304-309)
   - Fresh login can timeout (15+ seconds) even with pre-authenticated states
   - Race condition between sign-out and sign-in

4. **Invitation Flow Issue**:
   - Test clears cookies (line 143) to simulate new user
   - New user sign-up triggers onboarding flow
   - Test doesn't handle onboarding, gets stuck

**Supporting Evidence**:
- Screenshot of "ban user flow" shows sign-in page (auth cleared)
- Error context for "delete team account flow" shows user on team dashboard (wrong context)
- Error context for "accept invite" shows onboarding wizard (new user flow)

### How This Causes the Observed Behavior

1. Tests run in serial within their describe blocks
2. Test A modifies auth state (clears cookies)
3. Test B starts with corrupted state (no cookies)
4. Test B waits for elements that require authentication
5. Test B times out because user is not authenticated

### Confidence Level

**Confidence**: High

**Reasoning**:
- Screenshots clearly show authentication state issues
- Code analysis confirms `clearCookies()` and `signOut()` calls in affected tests
- Serial mode is documented in the test files
- This is a known Playwright pattern issue with serial tests

## Fix Approach (High-Level)

Three options:

1. **Remove serial mode** and let tests run in parallel with fresh contexts (recommended)
   - Change `test.describe.configure({ mode: "serial" })` to `test.describe.configure({ mode: "parallel" })`
   - Each test gets a fresh browser context with pre-authenticated state

2. **Add state restoration** after each test that modifies auth
   - After `clearCookies()`, restore the original auth state
   - After `signOut()`, restore from storage state file

3. **Isolate destructive tests** into their own describe block without serial mode
   - Tests that need to clear cookies run last or in isolation

## Diagnosis Determination

The root cause is **serial test mode state corruption**. Tests running in serial mode share browser context, and when one test clears cookies or signs out to verify post-action behavior (e.g., verifying banned user can't log in), subsequent tests inherit the corrupted state and fail.

This is distinct from previous shard 4 issues (MFA, selectors, auth timeouts) and requires either removing serial mode or implementing state restoration.

## Additional Context

- Mailpit is running and contains invitation emails (verified via API)
- Auth storage files exist and contain valid tokens
- Token expiration is in the future (valid until ~3:14 PM EST)
- This is a test architecture issue, not an application bug

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Glob, screenshots analysis, GitHub CLI*
