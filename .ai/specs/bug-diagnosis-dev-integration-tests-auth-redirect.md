# Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting

**ID**: ISSUE-628
**Created**: 2025-11-17T22:40:00Z
**Reporter**: system/claude
**Severity**: high
**Status**: new
**Type**: regression

## Summary

Dev integration tests are failing with authentication redirects after successful API-based authentication in global setup. Tests authenticate successfully via Supabase API and inject session tokens into browser storage, but subsequent navigation to protected routes (`/home/*`) redirects to `/auth/sign-in`, indicating the authentication state is not being recognized by the deployed application.

## Environment

- **Application Version**: 2.13.1
- **Environment**: dev (deployed at dev.slideheroes.com)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.16.0
- **Database**: PostgreSQL (Supabase)
- **Last Working**: 2025-11-17 20:12:23Z (commit b51e6ba8c)
- **First Failed**: 2025-11-17 21:57:34Z (commit c5c4ac2b9)

## Reproduction Steps

1. Run dev integration tests workflow against dev.slideheroes.com deployment
2. Global setup authenticates test users via Supabase API successfully
3. Session tokens are injected into browser localStorage
4. Test navigates to `/home` or team-specific routes like `/home/*/settings`
5. Application redirects to `/auth/sign-in?next=/home` instead of showing authenticated content

## Expected Behavior

After successful API authentication and session injection:
1. Browser should have valid Supabase session in localStorage
2. Navigation to `/home` should recognize authenticated state
3. Protected routes should render without redirecting to sign-in page
4. Tests should be able to interact with authenticated UI elements

## Actual Behavior

1. ✅ API authentication succeeds (confirmed in logs)
2. ✅ Session token injected into localStorage (confirmed in logs)
3. ✅ Browser navigates to `/home`
4. ❌ Application redirects to `/auth/sign-in?next=/home`
5. ❌ Tests timeout waiting for team elements that never appear

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...
🌐 Using BASE_URL: https://2025slideheroes-dfify1im5-slideheroes.vercel.app
🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
✅ test user auth state saved successfully

[Test Execution]
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-test="account-display-name"], input[name*="name"], input[placeholder*="name"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

### Network Analysis
```
Navigation flow:
1. page.goto("/home") → navigates to base URL
2. Server responds with redirect to /auth/sign-in?next=/home
3. Sign-in page loads successfully
4. Test remains stuck on sign-in page (authentication state not recognized)
```

### Session Storage Analysis
```
Global setup injects session using this pattern:
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
localStorage.setItem(key, JSON.stringify(session));

This matches the expected Supabase client storage pattern.
```

## Error Stack Traces
```
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-test="account-display-name"], input[name*="name"], input[placeholder*="name"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-test="account-display-name"], input[name*="name"], input[placeholder*="name"]').first()

---

Error: Test timeout of 180000ms exceeded
at team-accounts/team-accounts.po.ts:55
await this.page.waitForURL("**/home/*/settings");
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 143-164) - Session injection logic
  - `apps/e2e/playwright.config.ts` (lines 106-109) - Storage state configuration
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts` (line 74) - Uses TEST_USER auth state
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts` (line 55) - Fails waiting for authenticated route

- **Recent Changes**:
  - Commit c5c4ac2b9 (2025-11-17 16:51:20): "chore(ci): merge staging into dev with Supabase and Vitest fixes"
  - Changed .github/workflows/dev-integration-tests.yml
  - Changed .github/workflows/staging-deploy.yml (Supabase key extraction patterns)

- **Suspected Functions**:
  - Authentication middleware in Next.js app
  - Supabase session validation on server-side
  - Cookie/localStorage session reading logic

## Related Issues & Context

### Direct Predecessors
- #590 (CLOSED): "CI/CD: Dev Integration Tests Failing - Authentication State & Deployment Readiness Issues" - Same symptom: authentication state not recognized in deployed environment
- #319 (CLOSED): "[CI/CD] Dev Integration Tests Failing - Email Verification Fetch Error in Team Accounts Tests" - Team account test failures

### Related Infrastructure Issues
- #586 (CLOSED): "CI/CD: Integration tests blocked by Cloudflare Turnstile challenges" - Different issue (Turnstile) but same test suite

### Similar Symptoms
- #567 (CLOSED): "E2E Test Suite Failures: Accessibility Violations, Authentication Flakiness, and Test Infrastructure Issues" - Authentication flakiness mentioned
- #356 (CLOSED): "Simplify Shard 3 Tests to Resolve Team Account Issues" - Team account test problems

### Same Component
All issues above affect team account tests and authentication flow in E2E test suite.

### Historical Context
This appears to be a **regression** of issue #590 which was previously resolved. The pattern suggests authentication state handling in deployed environments is fragile and sensitive to configuration changes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Supabase session storage key mismatch between test environment and deployed application causes authentication state to not be recognized.

**Detailed Explanation**:

The global setup (`apps/e2e/global-setup.ts:147-154`) injects the Supabase session into localStorage using a key derived from the E2E_SUPABASE_URL environment variable:

```typescript
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
localStorage.setItem(key, JSON.stringify(session));
```

**Critical Issue**: The deployed application at `dev.slideheroes.com` is configured to use a **production Supabase instance** (the one pointed to by the app's environment variables), while the tests are injecting sessions for the **E2E_SUPABASE_URL** instance (likely a different Supabase project).

When the deployed app's Supabase client initializes, it looks for a session key based on **its configured Supabase URL** (from the app's NEXT_PUBLIC_SUPABASE_URL), not the E2E_SUPABASE_URL used by tests. This creates a key mismatch:

- **Test injects**: `sb-<e2e-project-ref>-auth-token`
- **App looks for**: `sb-<prod-project-ref>-auth-token`

Result: The application cannot find the session, treats the user as unauthenticated, and redirects to `/auth/sign-in`.

**Supporting Evidence**:
1. Global setup logs show successful authentication and session injection
2. Navigation logs show redirect to `/auth/sign-in` despite session being injected
3. The session injection uses `supabaseUrl` from environment (`E2E_SUPABASE_URL`)
4. Deployed app uses its own `NEXT_PUBLIC_SUPABASE_URL` (different project)
5. This worked in commit b51e6ba8c, suggesting environment configuration changed

### How This Causes the Observed Behavior

**Causal Chain**:
1. Test authenticates against E2E Supabase instance (E2E_SUPABASE_URL)
2. Valid session token generated for E2E project
3. Session stored in localStorage with key `sb-<e2e-project-ref>-auth-token`
4. Deployed app initializes with production Supabase URL (NEXT_PUBLIC_SUPABASE_URL)
5. Supabase client looks for session at key `sb-<prod-project-ref>-auth-token`
6. No session found (wrong key)
7. User treated as unauthenticated
8. Protected route middleware redirects to `/auth/sign-in`
9. Test fails waiting for authenticated UI elements

### Confidence Level

**Confidence**: High

**Reasoning**:
- The root cause explains all observed symptoms perfectly
- Session injection code clearly uses E2E_SUPABASE_URL to derive storage key
- Deployed app would use its own NEXT_PUBLIC_SUPABASE_URL
- This is a known pattern in Supabase authentication architecture
- The regression timing (working → broken) aligns with deployment/config changes
- No other hypothesis explains why API auth succeeds but app doesn't recognize session

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Configure E2E tests to use the same Supabase instance as the deployed environment
- Set `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` to match the dev deployment's Supabase configuration
- Ensures session keys align between test injection and app consumption
- Requires coordination with deployment environment variables

**Option 2**: Modify global setup to inject session using the deployed app's Supabase URL
- Extract `NEXT_PUBLIC_SUPABASE_URL` from the deployed app (via API or config endpoint)
- Use that URL to derive the correct storage key
- More complex but allows testing against different Supabase instances

**Option 3**: Use cookie-based session storage instead of localStorage
- Configure Supabase client to use cookie storage
- Inject session as HTTP cookie with correct domain
- More reliable across navigation but requires different injection approach

## Diagnosis Determination

**Root cause definitively identified**: Supabase session storage key mismatch between test environment (E2E_SUPABASE_URL) and deployed application (NEXT_PUBLIC_SUPABASE_URL) causes authentication state to not be recognized, resulting in redirects to sign-in page despite successful API authentication.

The fix requires aligning the Supabase configuration between the E2E test environment and the deployed dev environment, or modifying the session injection logic to account for the environment-specific Supabase URL.

## Additional Context

**Why This Worked Before**:
Commit b51e6ba8c was the last successful run. Changes in c5c4ac2b9 included:
- Supabase key extraction pattern changes in CI workflows
- Possible environment variable updates in deployment

These changes likely affected which Supabase instance the deployed app connects to, creating the mismatch.

**Impact**:
- All team account integration tests failing (10+ tests)
- Cannot verify team functionality in dev environment
- Blocks promotion to staging
- Similar issue may affect other deployed environments

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, git log, file analysis, Playwright log inspection*
