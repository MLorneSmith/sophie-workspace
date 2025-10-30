# E2E Test Failure Analysis - 2025-10-30

## Executive Summary

**18 E2E tests failed** out of 147 total tests (12% failure rate). Failures fall into **two distinct categories**:

1. **localStorage SecurityError** (Shard 2 - Authentication)
2. **Authentication Setup Timeouts** (Shards 3-7)

---

## Category 1: localStorage SecurityError

### Affected Tests
- **Shard 2 (Authentication)**: 1 failure
- **Test**: `tests/authentication/auth-simple.spec.ts:192:6`
- **Test Name**: "protected routes redirect to sign-in when not authenticated"

### Root Cause
The test attempts to clear `localStorage` and `sessionStorage` **before navigating to any page**:

```typescript
// Line 196-202 in auth-simple.spec.ts
test("protected routes redirect to sign-in when not authenticated", async ({
    page,
    context,
}) => {
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
        localStorage.clear();      // ❌ FAILS HERE
        sessionStorage.clear();
    });
    // ... rest of test
});
```

### Technical Details
- **Error**: `SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document`
- **Why it fails**: When a Playwright page context is freshly created, it doesn't have a valid document/origin to access localStorage from
- **Attempted**: 4 times (original + 3 retries), all failed

### Solution
**Option 1 - Navigate First (Recommended)**
```typescript
test("protected routes redirect to sign-in when not authenticated", async ({
    page,
    context,
}) => {
    // Navigate to a page first to establish valid origin
    await page.goto("/");

    // Now clear storage (this will work)
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // Test protected routes
    for (const route of protectedRoutes) {
        await page.goto(route, { waitUntil: "networkidle" });
        await expect(async () => {
            const url = page.url();
            expect(url).toMatch(/\/auth\/sign-in/);
        }).toPass({ timeout: 15000, intervals: [500, 1000, 2000, 3000] });
    }
});
```

**Option 2 - Remove Redundant Clear (Simpler)**
```typescript
test("protected routes redirect to sign-in when not authenticated", async ({
    page,
    context,
}) => {
    // context.clearCookies() is sufficient to clear the session
    await context.clearCookies();
    await context.clearPermissions();

    // No need for localStorage.clear() - cookies control auth state

    // Test protected routes
    for (const route of protectedRoutes) {
        await page.goto(route, { waitUntil: "networkidle" });
        await expect(async () => {
            const url = page.url();
            expect(url).toMatch(/\/auth\/sign-in/);
        }).toPass({ timeout: 15000, intervals: [500, 1000, 2000, 3000] });
    }
});
```

**Option 3 - Try/Catch (Not Recommended)**
```typescript
// Less ideal - masks the underlying issue
try {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
} catch (e) {
    // Ignore SecurityError
}
```

---

## Category 2: Authentication Setup Timeouts

### Affected Tests
- **Shard 3 (Accounts)**: 1 failure
- **Shard 4 (Admin & Invitations)**: 1 failure
- **Shard 5 (Billing)**: 1 failure
- **Shard 6 (Accessibility)**: 1 failure
- **Shard 7 (Config & Health)**: 1 failure

### Root Cause
Authentication setup fails when trying to log in the **super-admin user with MFA**:

```typescript
// Line 129-147 in auth.setup.ts
test("authenticate as super-admin user", async ({ page }) => {
    const auth = new AuthPageObject(page);
    const credentials = CredentialValidator.validateAndGet("admin");

    await expect(async () => {
        await auth.loginAsSuperAdmin({
            email: credentials.email,
            password: credentials.password,
        });
    }).toPass({
        intervals: testConfig.getRetryIntervals("auth"),
        timeout: testConfig.getTimeout("long"), // ❌ TIMES OUT AT 45000ms
    });
});
```

### Technical Details
- **Error**: `Timeout 45000ms exceeded while waiting on the predicate`
- **Where**: `auth.setup.ts:144:6`
- **User**: `michael@slideheroes.com` (super-admin with MFA enabled)

### MFA Verification Flow
The `loginAsSuperAdmin` method performs these steps:

1. **Login Phase** (Line 187-191 in auth.po.ts):
   ```typescript
   await this.loginAsUser({
       email: params.email,
       password: params.password,
       next: "/auth/verify",
   });
   ```
   ✅ **This succeeds** - logs show "Auth API responded (1362ms)"

2. **MFA Verification Phase** (Line 204-224):
   ```typescript
   await expect(async () => {
       const currentUrl = this.page.url();
       if (currentUrl.includes("/auth/verify")) {
           const mfaInput = await this.page.locator("[data-input-otp]").count();
           if (mfaInput > 0) {
               await this.submitMFAVerification(MFA_KEY);  // ❌ FAILS HERE
           }
       }
       await this.page.waitForURL(params.next ?? "/home", {
           timeout: longTimeout,
       });
   }).toPass({
       timeout: longTimeout + 5000,
   });
   ```

3. **submitMFAVerification** method (Line 96-134):
   ```typescript
   async submitMFAVerification(key: string) {
       // Generate TOTP code
       const { otp } = await TOTP.generate(key, { period: 30 });

       // Wait for OTP input
       const otpInput = this.page.locator("[data-input-otp]");
       await otpInput.waitFor({ state: "visible" });

       // Enter OTP
       await otpInput.pressSequentially(otp, { delay: 50 });

       // Wait for submit button to be enabled (form validation)
       await this.page.waitForFunction(
           () => {
               const button = document.querySelector('[data-test="submit-mfa-button"]');
               return button && !button.hasAttribute("disabled");
           },
           { timeout: 10000 }  // ❌ LIKELY TIMING OUT HERE
       );

       // Click submit
       await this.page.click('[data-test="submit-mfa-button"]');
   }
   ```

### Logs Analysis
From shard-3 raw output:
```
[Phase 2] Current: http://localhost:3001/auth/verify, Target: /auth/verify
[Phase 2] ✅ Navigation complete (1422ms total). Final URL: http://localhost:3001/auth/verify
```

The test successfully navigates to `/auth/verify` but then **hangs** - never proceeding past MFA verification.

### Possible Causes

1. **MFA Form Not Rendering**
   - The `[data-input-otp]` element isn't becoming visible
   - Component failing to mount or hydrate

2. **Submit Button Not Enabling**
   - Form validation not completing
   - React Hook Form `isValid` state not updating
   - The `[data-test="submit-mfa-button"]` selector not finding the button

3. **TOTP Code Invalid**
   - Time synchronization issue between test runner and server
   - MFA key (`MFA_KEY`) doesn't match the super-admin user's TOTP secret

4. **Network/Response Timeout**
   - MFA verification API call timing out
   - Waiting for navigation to `/home` that never happens

### Debugging Steps Needed

1. **Check MFA Form Rendering**:
   ```typescript
   // Add diagnostic logging
   const mfaInput = await this.page.locator("[data-input-otp]");
   console.log("MFA input count:", await mfaInput.count());
   console.log("MFA input visible:", await mfaInput.isVisible());
   ```

2. **Check Submit Button State**:
   ```typescript
   const button = await this.page.locator('[data-test="submit-mfa-button"]');
   console.log("Button exists:", await button.count());
   console.log("Button disabled:", await button.getAttribute("disabled"));
   ```

3. **Verify TOTP Secret**:
   - Check that `MFA_KEY` constant matches the TOTP secret seeded for `michael@slideheroes.com`
   - Look in seed data at `apps/web/supabase/seeds/01_main_seed.sql`

4. **Check Screenshots**:
   - Screenshots were captured on failure:
     - `test-results/auth.setup.ts-authenticate-as-super-admin-user-setup/test-failed-1.png`
   - These will show what state the page was in when it timed out

5. **Check Trace Files**:
   ```bash
   pnpm exec playwright show-trace \
     test-results/auth.setup.ts-authenticate-as-super-admin-user-setup-retry1/trace.zip
   ```

---

## Impact Assessment

### Test Execution Summary
- **Total Tests**: 147
- **Passed**: 96 (65%)
- **Failed**: 18 (12%)
- **Skipped**: 33 (22%)

### Shard-by-Shard Results
| Shard | Name | Status | Failure Type |
|-------|------|--------|--------------|
| 1 | Smoke Tests | ✅ Pass | None |
| 2 | Authentication | ❌ Fail | localStorage SecurityError |
| 3 | Accounts | ❌ Fail | Super-admin MFA timeout |
| 4 | Admin & Invitations | ❌ Fail | Super-admin MFA timeout |
| 5 | Billing | ❌ Fail | Super-admin MFA timeout |
| 6 | Accessibility | ❌ Fail | Super-admin MFA timeout |
| 7 | Config & Health | ❌ Fail | Super-admin MFA timeout |

### Cascading Failures
When the super-admin authentication setup fails in `auth.setup.ts`, **all tests that depend on super-admin auth are skipped**:
- Shard 3: 20 tests did not run
- Shard 4: Tests depending on admin auth blocked

---

## Recommended Actions

### Immediate (Fix localStorage Issue)
1. **Fix Shard 2 localStorage error** - Apply Option 2 (remove redundant clear)
   - File: `apps/e2e/tests/authentication/auth-simple.spec.ts`
   - Lines: 196-202
   - Impact: +1 passing shard

### Short-term (Debug MFA Issue)
2. **Investigate super-admin MFA verification failure**:
   - [ ] Check screenshots from failed tests
   - [ ] Review Playwright traces
   - [ ] Verify `MFA_KEY` constant matches seed data
   - [ ] Add diagnostic logging to `submitMFAVerification`
   - [ ] Check if `/auth/verify` page renders correctly
   - [ ] Verify `[data-input-otp]` and `[data-test="submit-mfa-button"]` selectors

3. **Verify seed data for super-admin**:
   - [ ] Confirm `michael@slideheroes.com` has MFA enabled in seed
   - [ ] Verify TOTP secret is correctly configured
   - [ ] Check that seed applies correctly with `pnpm supabase:web:reset`

### Long-term (Improve Reliability)
4. **Add better error handling to auth setup**:
   - Capture more diagnostic information on timeout
   - Add retry logic with exponential backoff
   - Implement fallback authentication methods

5. **Consider MFA testing alternatives**:
   - Mock MFA verification in E2E tests
   - Use environment variable to disable MFA for test users
   - Create separate admin user without MFA for E2E tests

---

## Files to Investigate

### Primary Files
- `apps/e2e/tests/authentication/auth-simple.spec.ts:196-202` - localStorage clear issue
- `apps/e2e/tests/auth.setup.ts:129-147` - Super-admin MFA setup
- `apps/e2e/tests/authentication/auth.po.ts:96-134` - submitMFAVerification method
- `apps/e2e/tests/authentication/auth.po.ts:182-232` - loginAsSuperAdmin method

### Configuration Files
- `apps/e2e/playwright.auth.config.ts` - Auth test configuration
- `apps/web/supabase/seeds/01_main_seed.sql` - User seed data with MFA

### Test Artifacts
- Screenshots: `test-results/auth.setup.ts-authenticate-as-super-admin-user-setup/`
- Traces: `test-results/auth.setup.ts-authenticate-as-super-admin-user-setup-retry1/trace.zip`

---

## Next Steps

1. ✅ **Apply localStorage fix** (simple, low-risk)
2. 🔍 **Review test artifacts** (screenshots, traces)
3. 🐛 **Debug MFA verification** (requires deeper investigation)
4. 🧪 **Re-run tests** to confirm fixes

---

Generated: 2025-10-30T18:47:00Z
Test Run: 2025-10-30 (18:46-18:57)
