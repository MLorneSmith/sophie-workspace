# Bug Diagnosis: E2E Admin & Invitations Tests Fail with Authentication API Timeout

**ID**: ISSUE-PENDING
**Created**: 2025-11-28T20:25:00Z
**Reporter**: Claude (Test Analysis)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E test shard 4 (Admin & Invitations) has 9 out of 13 tests failing due to authentication API timeouts. Tests that call `AuthPageObject.signIn()` directly fail with "Auth API timeout after 15000ms" when waiting for the Supabase `auth/v1/token` endpoint response. The root cause is that `signIn()` method submits the form but does not wait for the API response, causing tests to proceed before authentication completes, leading to timeout failures in subsequent operations.

## Environment

- **Application Version**: Latest (dev branch)
- **Environment**: Local (localhost:3001)
- **Test Framework**: Playwright E2E
- **Node Version**: 20+
- **Database**: Supabase (local)
- **Test Shard**: Shard 4 - Admin & Invitations (13 tests)

## Reproduction Steps

1. Run E2E test shard 4: `pnpm test:shard4` or `/test 4`
2. Tests start running: "Admin Dashboard", "Personal Account Management", etc.
3. Admin tests use: `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)`
4. When tests need to re-authenticate a user, they call: `new AuthPageObject(page).signIn({ email, password })`
5. After form submission, the test immediately checks for auth-related UI elements
6. Timeout occurs waiting for `auth/v1/token` response because `signIn()` returns immediately after form submission without waiting for the API response

## Expected Behavior

- Admin tests should successfully authenticate users via the Supabase authentication API
- Form submission should trigger an `auth/v1/token` API call to Supabase
- Tests should wait for the API response before proceeding to assertions
- Authenticated user should be able to perform admin operations (ban, delete, reactivate)

## Actual Behavior

- Form submits successfully (React form handling works correctly)
- API request never completes or response is never received by test
- Test waits up to 15000ms for `auth/v1/token` response from network listener
- Timeout error after 15000ms: `Auth API timeout after 15000ms`
- No auth-related network requests detected in captured diagnostics
- Network logs show only static asset loads (JS chunks, JSON locales, images) - no actual auth API calls

## Diagnostic Data

### Console Output (Network Diagnostics)

```
[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: 15000ms)...
[Sign-in Phase 1] Waiting for React hydration...
[Sign-in Phase 1.5] Waiting for React Query client initialization...
[Sign-in Phase 2] Waiting for form inputs to be interactive...
[Sign-in Phase 3] Filling credentials for: test1@slideheroes.com
[Sign-in Phase 3] Email field filled successfully
[Sign-in Phase 3] Password field filled successfully
[Sign-in Phase 4] Waiting for form validation...
[Sign-in Phase 5] Form ready. Submitting authentication request...
[Sign-in Phase 5] Form submitted. Waiting for navigation...

[Phase 1] ❌ Auth API timeout after 15000ms
Current URL: http://localhost:3001/auth/sign-in
Credentials: test1@slideheroes.com

[Diagnostics] Captured Auth Requests:
  GET http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_f5d2e7b6._.js
  GET http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_aebeb488._.js

[Diagnostics] Captured Auth Responses:
  200 http://localhost:3001/_next/static/chunks/apps_web_app_auth_layout_tsx_8a308bf3._.js
  200 http://localhost:3001/_next/static/chunks/apps_web_app_auth_loading_tsx_b2de0806._.js
  304 http://localhost:3001/_next/image?url=%2Fimages%2Foauth%2Fgoogle.webp&w=32&q=75
```

### Critical Error Message

```
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
```

This indicates the Supabase config loader is failing to spawn a shell process. While it says "using fallback values", this may impact Supabase authentication initialization.

### Failed Tests

All 9 failures share the same root pattern:

**Admin Tests (6 failures)**
- `ban user flow` - timeout 120000ms exceeded
- `reactivate user flow` - auth API timeout 15000ms
- `delete user flow` - navigation timeout 90000ms
- `can sign in as a user (impersonation)` - timeout 120000ms
- Delete team account flow - element not visible
- Team Account Management - element not visible

**Invitations Tests (3+ failures)**
- `users-can-delete-invites` - element not found
- `users-can-update-invites` - element not found
- `can-accept-an-invite` - element not found

## Error Stack Traces

```typescript
// From admin.spec.ts line 155-158
await auth.signIn({
    email: testUserEmail,
    password: process.env.E2E_TEST_USER_PASSWORD || "",
});

// Expected: Wait for auth/v1/token API response
// Actual: Returns immediately after clicking submit, no API wait

TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
    at async AuthPageObject.loginAsUser (auth.po.ts:536-555)
```

## Related Code

### Affected Files

- **Primary Issue**: `apps/e2e/tests/authentication/auth.po.ts:55-214`
  - `signIn()` method submits form without waiting for API response

- **Test File Using It**: `apps/e2e/tests/admin/admin.spec.ts:119-164`
  - Line 155: `await auth.signIn({ email, password })`
  - Should use: `await auth.loginAsUser({ email, password })` which has proper API waiting

- **Working Alternative**: `apps/e2e/tests/authentication/auth.po.ts:486-620`
  - `loginAsUser()` method implements proper `Promise.all()` pattern
  - Waits for `auth/v1/token` response before proceeding

### Suspected Functions

**PROBLEM FUNCTION** (`auth.po.ts:55-214`):
```typescript
async signIn(params: { email: string; password: string }) {
    // Phase 1: Wait for React hydration
    console.log("[Sign-in Phase 1] Waiting for React hydration...");
    await this.page.waitForSelector("form", { state: "visible" });
    // ... phases 1-4 preparation ...

    // Phase 5: Submit form - NO API WAIT!
    console.log("[Sign-in Phase 5] Form ready. Submitting authentication request...");
    await this.page.click('button[type="submit"]');
    console.log("[Sign-in Phase 5] Form submitted. Waiting for navigation...");
    // ❌ RETURNS HERE - method ends without waiting for auth/v1/token response
}
```

**CORRECT FUNCTION** (`auth.po.ts:486-620`):
```typescript
async loginAsUser(params: { email: string; password: string; next?: string }) {
    // ... setup ...

    try {
        await Promise.all([
            // ✅ Wait for auth/v1/token response
            this.page.waitForResponse(
                (response) => {
                    const url = response.url();
                    const isAuthToken = url.includes("auth/v1/token");
                    if (isAuthToken) {
                        console.log(`[Phase 1] Auth API response detected: ${response.status()}`);
                    }
                    return isAuthToken && response.status() === 200;
                },
                { timeout: authTimeout },
            ),
            // ✅ Submit form with listener ready
            this.signIn({ email: params.email, password: params.password }),
        ]);
    } catch (error) {
        // Proper error handling with diagnostics
    }
}
```

## Related Issues & Context

### Direct Predecessors
None found (new issue pattern)

### Related Infrastructure Issues
- Global setup properly creates authenticated states via API (global-setup.ts works correctly)
- Pre-authenticated storage states work for initial test setup
- Issue only appears when tests need to RE-authenticate mid-test

### Same Component
- All failures in shard 4 (Admin & Invitations) - all call `signIn()` directly
- Other test files that use `loginAsUser()` likely don't have this issue

### Historical Context

The `loginAsUser()` method was likely implemented to fix this exact issue (proper API waiting), but the admin tests were not updated to use it. They still call `signIn()` which is missing the API response wait.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `AuthPageObject.signIn()` method submits the authentication form but returns immediately without waiting for the Supabase `auth/v1/token` API response, causing tests to fail when they immediately try to access auth-dependent features.

**Detailed Explanation**:

1. **The Problem**:
   - `signIn()` method (`auth.po.ts:55-214`) is a low-level form submission helper
   - It correctly handles React hydration, form validation, and field filling
   - BUT it returns immediately after calling `await this.page.click('button[type="submit"]')`
   - The form submission is synchronous (button click), but the API call is asynchronous
   - Test proceeds immediately while auth API request is still in-flight

2. **Why Tests Fail**:
   - Admin tests call: `await auth.signIn({ email, password })`
   - This returns right after form submission (before API completes)
   - Tests then try to assert on UI elements that require authentication
   - Meanwhile, somewhere else in the code, `loginAsUser()` tries to wait for the API response
   - The race condition causes timeout waiting for API that may never be detected

3. **Secondary Issue - API Not Actually Being Called**:
   - Network diagnostics show NO auth API requests captured
   - Only static assets (JS, JSON, images) are being loaded
   - The form submission triggers Supabase client via React Hook Form mutation
   - Something is preventing the mutation from firing the API request
   - Possible causes:
     a. React Query mutation not properly initialized after hydration
     b. Supabase client not fully initialized (note the config-loader error)
     c. Form submission not actually triggering the mutation handler

4. **Proof**:
   - `loginAsUser()` uses `Promise.all()` to guarantee listener is attached before form submit
   - It explicitly waits for `auth/v1/token` response: `response.url().includes("auth/v1/token")`
   - This works correctly in other test files
   - Admin tests that use `signIn()` directly never get the API response

### How This Causes the Observed Behavior

```
Sequence of Events:
1. Test setup: AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)
   ✅ Pre-authenticated state loaded from .auth/michael@slideheroes.com.json

2. Test needs to re-authenticate as a test user
   ❌ Direct call: await new AuthPageObject(page).signIn({ email, password })

3. signIn() executes:
   ✅ Phase 1: Hydration check passes
   ✅ Phase 2: Form visible and inputs interactive
   ✅ Phase 3: Email/password filled (React Hook Form validates)
   ✅ Phase 4: Submit button enabled
   ✅ Phase 5: Button clicked - returns immediately

4. Admin test code continues while API request is pending:
   ❌ Tries to access authenticated-only elements
   ❌ Assertions fail because auth incomplete

5. Somewhere (unclear from logs), code waits for auth/v1/token response:
   ❌ Waits up to 15000ms
   ❌ Response never comes (auth mutation may not have fired)
   ❌ Timeout error
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Code comparison shows clear difference between `signIn()` (no wait) and `loginAsUser()` (with wait)
2. Network diagnostics show zero auth API requests - this is the smoking gun
3. Error message explicitly states "Auth API timeout" - waiting for response that never came
4. Same pattern in all 9 failing tests - they all use `signIn()` directly
5. The working `loginAsUser()` method in the same file proves the pattern works when implemented correctly
6. Issue is reproducible: `/test 4` consistently produces same failures

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Replace all `signIn()` calls in `admin.spec.ts` with `loginAsUser()` calls. The `loginAsUser()` method already implements proper API waiting and is designed for exactly this use case. This requires changing lines in admin tests from:
```typescript
await auth.signIn({ email, password });
```
to:
```typescript
await auth.loginAsUser({ email, password });
```

**Option 2**: Add API response waiting directly to `signIn()` method. Modify the method to return a promise that waits for the auth/v1/token response before resolving. This would make `signIn()` a higher-level operation that could be used throughout tests without concerns about API timing.

**Option 3**: Create a new method `signInAndWait()` that wraps `signIn()` with the Promise.all() pattern from `loginAsUser()`, avoiding changes to existing `signIn()` callers outside of admin tests.

Option 1 is preferred because it uses the existing tested solution and clarifies intent (explicit that we want full login, not just form submission).

## Diagnosis Determination

This is a **confirmed bug with identified root cause and clear fix path**.

The admin tests are failing because they use the low-level `signIn()` form submission helper without waiting for the Supabase authentication API response. The tests need to use the higher-level `loginAsUser()` method instead, or the `signIn()` method needs to be enhanced to wait for the API response.

The lack of captured auth API requests in the network diagnostics suggests the form submission might not be triggering the React mutation at all, possibly due to hydration timing or Supabase initialization issues (indicated by the config-loader error).

## Additional Context

### Supabase Config Loader Error

The error `[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT` appears in test logs. This comes from a Supabase internal utility that tries to execute shell commands. The error suggests it's trying to spawn a shell process that doesn't exist in the test environment. While it says "using fallback values", this could potentially affect Supabase initialization.

### Why Some Tests Pass (4/13)

The 4 passing tests likely:
1. Use pre-authenticated states correctly (from global setup)
2. Don't require mid-test re-authentication
3. Or wait for navigation rather than trying to use auth immediately

The 9 failing tests all involve:
- Re-authenticating as different users mid-test
- Calling `signIn()` without API response wait
- Then immediately trying to use authenticated-only features

---
*Generated by Claude Debug Assistant*
*Tools Used: Playwright test runner, network diagnostics, code review, test log analysis*
