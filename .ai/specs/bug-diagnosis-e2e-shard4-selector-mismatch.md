# Bug Diagnosis: E2E Shard 4 Test Failures Due to Selector Mismatch and Auth State Issues

**ID**: ISSUE-731
**Created**: 2025-11-27T15:45:00Z
**Reporter**: system (test runner)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E shard 4 (Admin & Invitations) shows 6 out of 9 tests failing. The failures are caused by two distinct root causes: (1) a selector attribute mismatch between test code using `getByTestId()` (which looks for `data-testid`) and components using `data-test` attributes, and (2) authentication state not being properly applied in invitation tests, resulting in blank pages.

## Environment

- **Application Version**: commit 1139b6aef
- **Environment**: development (localhost:3001)
- **Browser**: Chromium (Playwright)
- **Node Version**: v22.16.0
- **Playwright Version**: 1.56.1
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - may have been broken for some time

## Reproduction Steps

1. Start local development environment: `pnpm dev`
2. Run E2E shard 4: `/test 4` or `pnpm --filter web-e2e test:shard4`
3. Observe 6 test failures out of 9 tests

## Expected Behavior

All 9 tests in shard 4 should pass:
- Admin dashboard tests should find and interact with Ban/Impersonate/Delete buttons
- Invitation tests should load the authenticated user session and create teams

## Actual Behavior

6 tests fail with timeouts:
- Admin tests: `getByTestId("admin-ban-account-button")` times out despite button being visible
- Invitation tests: Page shows blank white screen, `openAccountsSelector()` times out

## Diagnostic Data

### Console Output
```
[Phase 1] ❌ Auth API timeout after 15000ms
Current URL: http://localhost:3001/auth/sign-in
Credentials: test2@slideheroes.com

Error: expect(received).toBe(expected) // Object.is equality
- Timeout 15000ms exceeded while waiting on the predicate

Error: Test timeout of 120000ms exceeded
at team-accounts/team-accounts.po.ts:89
```

### Screenshot Analysis

**Admin Test Screenshot**: Page fully loaded and functional
- Super admin "michael@slideheroes.com" logged in correctly
- "Ban", "Impersonate", "Delete" buttons clearly visible in header
- Personal Account page displaying correctly with Teams table
- **Root Cause**: Buttons exist but test can't find them due to selector mismatch

**Invitation Test Screenshot**: Completely blank white page
- No UI elements rendered
- **Root Cause**: Authentication state not being applied, session not loaded

### Network Analysis
```
[Network] Response: 200 http://localhost:3001/_next/static/chunks/...
[Sign-in Phase 5] Form submitted. Waiting for navigation...
[Phase 1] ❌ Auth API timeout after 15000ms
```

## Error Stack Traces
```
Error: expect(received).toBe(expected) // Object.is equality
- Timeout 15000ms exceeded while waiting on the predicate
   at admin-admin-Admin-Personal-f0236-ys-personal-account-details-chromium

Error: Test timeout of 120000ms exceeded
   at team-accounts/team-accounts.po.ts:89
   at TeamAccountsPageObject.openAccountsSelector
   at TeamAccountsPageObject.createTeam
   at invitations.spec.ts:20:34
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` - Uses `getByTestId()` for button selection
  - `apps/e2e/tests/invitations/invitations.spec.ts` - Uses pre-auth session
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts` - Account selector operations
  - `apps/e2e/playwright.config.ts` - Missing `testIdAttribute` configuration
  - `packages/features/admin/src/components/admin-account-page.tsx` - Has `data-test` attributes

- **Recent Changes**: Commit 1139b6aef added MFA verification to global setup for super admin AAL2

- **Suspected Functions**:
  - `admin.spec.ts:77` - `displays personal account details` test
  - `team-accounts.po.ts:82-89` - `openAccountsSelector()` method
  - `invitations.spec.ts` - `beforeEach` hook for team creation

## Related Issues & Context

### Direct Predecessors
- Recent commit `1139b6aef`: "fix(e2e): add MFA verification to global setup for super admin AAL2" - This suggests ongoing work on auth state issues

### Similar Symptoms
- Tests involving authentication state frequently have timing issues
- Selector inconsistency between `data-test` and `data-testid` affects multiple test files

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two distinct issues causing the failures:

1. **Selector Attribute Mismatch**: Tests use `page.getByTestId("admin-ban-account-button")` which looks for `data-testid` attribute by default, but the component uses `data-test="admin-ban-account-button"`.

2. **Authentication State Not Applied**: Invitation tests that use `AUTH_STATES.TEST_USER` pre-authenticated session are showing blank pages, indicating the storage state file is not being properly loaded or the session is expired/invalid.

**Detailed Explanation**:

**Issue 1 - Selector Mismatch**:
Playwright's `getByTestId()` method defaults to looking for `data-testid` attributes unless configured otherwise. The codebase uses `data-test` attributes in React components (e.g., `data-test="admin-ban-account-button"` in `admin-account-page.tsx:93`), but `playwright.config.ts` does not configure `testIdAttribute: 'data-test'`.

The test code at `admin.spec.ts:83-95`:
```typescript
const banButton = await page.getByTestId("admin-ban-account-button").isVisible();
```

Looks for `[data-testid="admin-ban-account-button"]` but the component renders `[data-test="admin-ban-account-button"]`.

**Issue 2 - Auth State Loading**:
The invitation tests use `AUTH_STATES.TEST_USER` which maps to `.auth/test1@slideheroes.com.json`. However, when these tests run, the page shows blank white, indicating either:
- The storage state file is corrupted or expired
- The session tokens in the file are invalid
- The storage state is not being properly injected into the browser context

**Supporting Evidence**:
- Admin test screenshot shows page fully functional with buttons visible (proves the app works)
- Playwright error context YAML shows `button "Ban"` without `data-testid` attribute
- Invitation test screenshot shows blank page (proves session not loaded)
- Auth state files exist and were recently updated (27 Nov 10:30)

### How This Causes the Observed Behavior

1. Admin test navigates to `/admin/accounts/[id]` successfully (super admin session works)
2. Page renders correctly with Ban/Impersonate/Delete buttons
3. Test calls `getByTestId("admin-ban-account-button")`
4. Playwright searches for `[data-testid="admin-ban-account-button"]` - doesn't exist
5. 15 second timeout expires, test fails

For invitation tests:
1. Test starts with `AUTH_STATES.TEST_USER` storage state
2. Storage state injection fails or session is invalid
3. Page navigation results in redirect to auth or blank page
4. `openAccountsSelector()` tries to click non-existent element
5. 120 second timeout expires, test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Admin test screenshot conclusively shows buttons exist on page but test can't find them
- Code inspection confirms `data-test` vs `data-testid` mismatch
- Blank page in invitation tests clearly indicates auth state failure
- Pattern matches common Playwright configuration issues

## Fix Approach (High-Level)

**For Selector Mismatch (Primary Fix)**:
Add `testIdAttribute` configuration to `playwright.config.ts`:
```typescript
export default defineConfig({
  use: {
    testIdAttribute: 'data-test',
    // ... existing config
  }
});
```

**For Auth State Issues (Secondary Fix)**:
1. Verify auth state files are valid JSON with non-expired tokens
2. Add debug logging to identify when storage state injection fails
3. Consider regenerating auth states if tokens are expired

## Diagnosis Determination

The root cause is a **configuration issue** in Playwright where `testIdAttribute` is not set to match the codebase convention of using `data-test` attributes. This causes all `getByTestId()` calls to fail.

The secondary issue with invitation tests showing blank pages indicates authentication state is not being properly applied, likely due to the session being invalidated or the storage state not loading correctly.

## Additional Context

- The codebase inconsistently uses both `data-test` and `data-testid` in different places
- Some tests already work around this by using `locator('[data-test="..."]')` instead of `getByTestId()`
- Global setup successfully creates auth states (logs show "✅ Global Setup Complete")
- The admin tests that use `SUPER_ADMIN` auth state work (page loads), while tests using `TEST_USER` fail

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, Glob, screenshot analysis*
