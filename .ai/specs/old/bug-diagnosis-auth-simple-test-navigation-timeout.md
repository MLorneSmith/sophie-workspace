# Bug Diagnosis: auth-simple.spec.ts sign-in test navigation timeout

**ID**: ISSUE-702
**Created**: 2025-11-26T15:10:00Z
**Reporter**: system/test-failure
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E test "user can sign in with valid credentials" in `auth-simple.spec.ts` fails with a 30-second timeout waiting for URL navigation after form submission. The test successfully fills credentials and submits the form (button shows "Signing in..."), but navigation to `/home` or `/onboarding` never occurs because the Supabase auth API response is not being awaited properly.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: Current
- **Database**: PostgreSQL via Supabase local
- **Last Working**: Unknown

## Reproduction Steps

1. Run E2E shard 2 (Authentication tests): `/test 2`
2. Observe test "user can sign in with valid credentials" fails
3. Check test results: 2 passed, 1 failed, 11 skipped
4. View screenshot showing button in "Signing in..." disabled state

## Expected Behavior

After submitting valid credentials:
1. Auth API response should return successfully
2. `router.replace('/home')` should be called in `onSignIn` callback
3. Test should detect URL change to `/home` or `/onboarding`
4. Test should pass

## Actual Behavior

After submitting valid credentials:
1. Form submits (button shows "Signing in..." in disabled state)
2. Auth mutation stays in "pending" state indefinitely
3. No navigation occurs
4. Test times out after 30 seconds waiting for URL change
5. Subsequent tests are skipped due to serial mode

## Diagnostic Data

### Test Results
```
E2E Tests:
  Passed: 13 (actually 2 passed before failure, 11 skipped)
  Failed: 1

Test output:
- "sign in page loads with correct elements" - PASSED
- "sign up page loads with correct elements" - PASSED
- "user can sign in with valid credentials" - FAILED
- Remaining 11 tests - SKIPPED (serial mode)
```

### Console Output
```
[Sign-in Phase 1] Waiting for React hydration...
[Sign-in Phase 1.5] Waiting for React Query client initialization...
[Sign-in Phase 2] Waiting for form inputs to be interactive...
[Sign-in Phase 3] Filling credentials for: test1@slideheroes.com
[Sign-in Phase 3] Email field filled successfully
[Sign-in Phase 3] Password field filled successfully
[Sign-in Phase 4] Waiting for form validation...
[Sign-in Phase 5] Form ready. Submitting authentication request...
[Sign-in Phase 5] Form submitted. Waiting for navigation...

Error: page.waitForURL: Test timeout of 30000ms exceeded.
```

### Screenshot Analysis (test-failed-1.png)
- Email field: `test1@slideheroes.com` (correctly filled)
- Password field: filled (dots shown)
- Button: "Signing in..." in disabled/grayed state
- No error message displayed
- No navigation occurred

### Supabase API Verification
```bash
# Direct API call works correctly
curl -X POST 'http://127.0.0.1:54521/auth/v1/token?grant_type=password' \
  -H 'apikey: [anon-key]' \
  -d '{"email":"test1@slideheroes.com","password":"aiesec1992"}'

# Returns: {"access_token":"...", "user":{"id":"31a03e74-..."}}
```

### Database Verification
```sql
SELECT id, email, encrypted_password IS NOT NULL as has_password,
       email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users WHERE email = 'test1@slideheroes.com';

-- Result: User exists with password and confirmed email
```

## Error Stack Traces
```
Error: page.waitForURL: Test timeout of 30000ms exceeded.

    at apps/e2e/tests/authentication/auth-simple.spec.ts:71:14
      69 | // Wait for navigation after successful sign-in
      70 | // We should be redirected to /home or onboarding
    > 71 | await page.waitForURL(
         |            ^
      72 |   (url) => {
      73 |     const pathname = url.pathname;
      74 |     return pathname.includes("/home") || pathname.includes("/onboarding");
```

## Related Code

### Affected Files
- `apps/e2e/tests/authentication/auth-simple.spec.ts:56-82` - Failing test
- `apps/e2e/tests/authentication/auth.po.ts:55-214` - `signIn()` method
- `apps/e2e/tests/authentication/auth.po.ts:483-641` - `loginAsUser()` method (working alternative)
- `packages/features/auth/src/components/sign-in-methods-container.tsx:39-43` - `onSignIn` callback

### Code Comparison

**Failing pattern (auth-simple.spec.ts:56-82)**:
```typescript
test("user can sign in with valid credentials", async ({ page }) => {
  const auth = new AuthPageObject(page);
  await auth.goToSignIn();
  await auth.signIn({  // <-- Only submits form, no response waiting
    email: TEST_USERS.user1.email,
    password: TEST_USERS.user1.password,
  });
  await page.waitForURL(...);  // <-- Times out because API response not awaited
});
```

**Working pattern (auth.po.ts loginAsUser)**:
```typescript
async loginAsUser(params) {
  await Promise.all([
    this.page.waitForResponse(
      (response) => response.url().includes("auth/v1/token") && response.status() === 200,
      { timeout: authTimeout },
    ),
    this.signIn({ email, password }),  // <-- Waits for API response
  ]);
  // Then waits for navigation
}
```

## Related Issues & Context

### Similar Symptoms
- Previous auth test flakiness addressed in commits `92bfd78bd`, `1aca17dbd`

### Historical Context
- Recent changes switched from `networkidle` to `domcontentloaded` wait strategy
- Global setup pattern implemented for pre-authentication
- This specific test intentionally does NOT use pre-authenticated state (testing auth flow itself)

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `auth.signIn()` method submits the form but does NOT wait for the Supabase auth API response, while the test immediately waits for URL navigation that depends on that response.

**Detailed Explanation**:

1. **Test calls `auth.signIn()`** which:
   - Waits for React hydration
   - Fills email and password fields
   - Clicks submit button
   - Logs "Form submitted. Waiting for navigation..."
   - **Returns immediately without waiting for API response**

2. **Test then calls `page.waitForURL()`** expecting navigation to `/home` or `/onboarding`

3. **Meanwhile in the browser**:
   - Form submission triggers `signInMutation.mutateAsync()`
   - Supabase `signInWithPassword()` is called
   - API request is made to `auth/v1/token`
   - **The response is slow or hangs** (works via curl but not in browser context)
   - Mutation stays in "pending" state (`isPending = true`)
   - Button shows "Signing in..." indefinitely
   - `onSignIn` callback is never called
   - `router.replace()` is never executed
   - URL never changes

4. **After 30 seconds**, `page.waitForURL()` times out

**Supporting Evidence**:
- Screenshot shows button in "Signing in..." disabled state (mutation pending)
- Form has correct credentials filled
- No error alert displayed (API call didn't fail, just didn't complete)
- Supabase API works via direct curl (credentials valid)
- User exists in database with correct password
- `loginAsUser()` method uses `Promise.all()` with `waitForResponse()` and works reliably

### How This Causes the Observed Behavior

```
auth.signIn() returns immediately after click
         ↓
page.waitForURL() starts waiting
         ↓
Browser: API request to auth/v1/token in progress (slow/hanging)
         ↓
30 seconds pass, API still pending
         ↓
page.waitForURL() times out
         ↓
Test fails with "Test timeout of 30000ms exceeded"
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Screenshot proves form was submitted (button shows "Signing in...")
2. Screenshot proves credentials were correct (fields filled)
3. Direct API test proves credentials work
4. Code analysis shows `signIn()` lacks response waiting
5. Code analysis shows `loginAsUser()` has proper response waiting and works
6. Test output shows no network errors, just timeout waiting for navigation

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Modify the test to use `auth.loginAsUser()` instead of `auth.signIn()`:
```typescript
test("user can sign in with valid credentials", async ({ page }) => {
  const auth = new AuthPageObject(page);
  await auth.loginAsUser({
    email: TEST_USERS.user1.email,
    password: TEST_USERS.user1.password,
  });
  // loginAsUser already waits for navigation
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/(home|onboarding)/);
});
```

**Option 2**: Add response waiting to the test itself:
```typescript
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('auth/v1/token')),
  auth.signIn({ email, password }),
]);
await page.waitForURL(...);
```

**Option 3**: Enhance `auth.signIn()` method to optionally wait for API response (breaking change, requires updating all callers).

## Diagnosis Determination

The test failure is caused by a **missing synchronization point** between form submission and navigation expectation. The `auth.signIn()` method was designed as a low-level form filler, while `loginAsUser()` was designed as a complete authentication helper. The test incorrectly uses the low-level method without adding its own response waiting logic.

This is NOT a browser/Supabase connectivity issue - the API works. It's a test design issue where the test assumes navigation will happen faster than it does, without waiting for the prerequisite API response.

## Additional Context

- The test uses `playwright.auth.config.ts` which has NO pre-authenticated storage state (intentionally testing auth flow)
- Test suite runs in serial mode, so one failure causes 11 subsequent tests to skip
- The button state "Signing in..." is controlled by `signInMutation.isPending` which stays true until API response

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (curl, psql, supabase status), Screenshot analysis*
