# Bug Diagnosis: E2E Tests Fail Due to Storage State Transition Between Test Files

**ID**: ISSUE-1531
**Created**: 2026-01-16T18:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E integration tests fail in CI when tests with different Playwright storage states run sequentially. The `restoreAuthStorageState()` function reads from `page.context().storageState()` which is empty after Playwright's storage state transition, causing authentication cookies to be missing when navigating to protected routes.

## Environment

- **Application Version**: dev branch (commit d3f548711)
- **Environment**: CI (GitHub Actions) and local with workers=1
- **Browser**: Chromium (Playwright)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Tests pass when run in isolation or with 4 workers

## Reproduction Steps

1. Run auth-simple tests followed by team-accounts tests with 1 worker:
   ```bash
   pnpm --filter web-e2e exec playwright test tests/authentication/auth-simple.spec.ts tests/team-accounts/team-accounts.spec.ts --workers=1
   ```
2. Observe team-accounts tests fail with timeout waiting for `[data-testid="team-selector"]`
3. Screenshot shows the sign-in page instead of the home page

**Alternative reproduction (CI):**
1. Push to dev branch
2. CI workflow runs integration tests with workers=1
3. team-accounts tests fail after auth-simple tests complete

## Expected Behavior

Tests with pre-authenticated storage state should have authentication cookies available when navigating to protected routes, regardless of which tests ran before them.

## Actual Behavior

When tests run in this order:
1. `auth-simple.spec.ts` (uses empty storage state: `{ cookies: [], origins: [] }`)
2. `team-accounts.spec.ts` (uses pre-authenticated storage state: `AUTH_STATES.TEST_USER`)

The team-accounts tests navigate to `/home` but are redirected to `/auth/sign-in?next=/home` because authentication cookies are missing.

## Diagnostic Data

### Console Output
```
Running 16 tests using 1 worker

[chromium] › tests/team-accounts/team-accounts.spec.ts:112:6 › Team Accounts @team @integration › user can update their team name (and slug)

Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible
```

### Network Analysis
```
Navigation sequence (from CI logs):
17:17:30.4146187Z navigating to ".../home", waiting until "domcontentloaded"
17:17:30.6132675Z navigated to ".../auth/sign-in?next=/home"  ← REDIRECT
```

### Key Log Sequence (CI)
```
17:17:30.3807106Z browserContext.close succeeded (auth-simple test ends)
17:17:30.3871778Z browser.newContext started (team-accounts test starts)
17:17:30.3888872Z browser.newContext succeeded
17:17:30.4079905Z browserContext.newPage succeeded
17:17:30.4099764Z page.route succeeded (base-test.ts fixture)
17:17:30.4107433Z browserContext.clearCookies started  ← COOKIES CLEARED
17:17:30.4124952Z browserContext.clearCookies succeeded
17:17:30.4142296Z page.goto started to /home
17:17:30.6132675Z navigated to /auth/sign-in?next=/home  ← AUTH FAILED
```

### Local Reproduction Results
```
# Passes (no storage state transition):
pnpm --filter web-e2e exec playwright test tests/team-accounts/team-accounts.spec.ts --workers=1
Result: 2 passed, 4 skipped

# Fails (storage state transition occurs):
pnpm --filter web-e2e exec playwright test tests/authentication/auth-simple.spec.ts tests/team-accounts/team-accounts.spec.ts --workers=1
Result: 2 failed, 4 skipped, 10 passed
```

### Screenshots
Test ends on sign-in page (from error-context.md):
- Page shows "Sign in to your account" heading
- Email and password form visible
- This confirms redirect from `/home` to `/auth/sign-in`

## Error Stack Traces
```
Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible

   at team-accounts/team-accounts.po.ts:105
   at TeamAccountsPageObject.openAccountsSelector
   at TeamAccountsPageObject.createTeam (team-accounts.po.ts:125:14)
   at team-accounts.spec.ts:106:22
```

## Related Code

### Affected Files
- `apps/e2e/tests/utils/base-test.ts` - `restoreAuthStorageState()` function (lines 117-130)
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Uses `restoreAuthStorageState()` in beforeEach
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Uses empty storage state

### Recent Changes
- Issue #1518: URL standardization (not related)
- Issue #1524: Explicit domain for Vercel preview cookies (not related)
- Issue #1528: Force sameSite=None for Vercel preview (not related)

### Suspected Functions
```typescript
// apps/e2e/tests/utils/base-test.ts:117-130
export async function restoreAuthStorageState(page) {
  // BUG: Reads from current context which is EMPTY after storage state transition
  const storageState = await page.context().storageState();

  if (!storageState || storageState.cookies.length === 0) {
    return; // No auth cookies to restore ← RETURNS HERE BECAUSE COOKIES ARE EMPTY
  }

  await page.context().addCookies(storageState.cookies);
}
```

## Related Issues & Context

### Direct Predecessors
- #1492 (CLOSED): "Storage state lost when Playwright retries" - Added `restoreAuthStorageState()` function, but it doesn't handle storage state transitions between test files

### Related Infrastructure Issues
- #1518: Dev Integration Tests Fail - Cookies Not Recognized (URL mismatch)
- #1524: Vercel preview cookie domain fix
- #1528: sameSite override for Vercel preview

### Historical Context
The `restoreAuthStorageState()` function was added in #1492 to handle retry scenarios. However, it reads from `page.context().storageState()` which assumes cookies are already in the context. When Playwright transitions between storage states (empty → pre-authenticated), the context is cleared before the function runs, making it ineffective.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `restoreAuthStorageState()` reads cookies from the current browser context, but Playwright clears the context during storage state transitions between test files, making the function ineffective.

**Detailed Explanation**:

1. **Test File A** (`auth-simple.spec.ts`) uses `test.use({ storageState: { cookies: [], origins: [] } })` - explicitly empty storage state

2. **Test File B** (`team-accounts.spec.ts`) uses `AuthPageObject.setupSession(AUTH_STATES.TEST_USER)` which calls `test.use({ storageState: ".auth/test1@slideheroes.com.json" })`

3. When Playwright transitions from Test File A to Test File B with `workers=1`:
   - The browser context from Test File A is closed
   - A new browser context is created for Test File B
   - Playwright loads the storage state from the JSON file
   - **However**, Playwright's internal isolation mechanism calls `clearCookies()` and `clearPermissions()` as part of the transition

4. In `team-accounts.spec.ts` beforeEach:
   ```typescript
   await restoreAuthStorageState(page);  // Reads empty context
   await navigateAndWaitForHydration(page, "/home");  // No cookies → redirect
   ```

5. The `restoreAuthStorageState()` function reads from `page.context().storageState()` which returns empty cookies because Playwright already cleared them.

**Supporting Evidence**:
- CI logs show `browserContext.clearCookies started` immediately after context creation
- Local reproduction confirms: tests pass in isolation, fail when run after auth-simple
- Error context shows sign-in page (authentication redirect)

### How This Causes the Observed Behavior

1. auth-simple test completes with empty storage state
2. team-accounts test starts, Playwright creates new context with AUTH_STATES.TEST_USER
3. Playwright clears cookies as part of isolation (observed in logs)
4. beforeEach calls `restoreAuthStorageState(page)`
5. Function reads `page.context().storageState()` → returns `{ cookies: [] }`
6. Function returns early because `cookies.length === 0`
7. `navigateAndWaitForHydration(page, "/home")` navigates without auth cookies
8. Middleware detects no session, redirects to `/auth/sign-in?next=/home`
9. Test waits for `[data-testid="team-selector"]` which never appears
10. Test times out

### Confidence Level

**Confidence**: High

**Reasoning**:
- Issue reproduced locally with exact same conditions
- CI logs show the clearCookies call
- Tests pass when run in isolation (no storage state transition)
- Tests pass with 4 workers (tests distributed to avoid transition)
- Screenshot confirms redirect to sign-in page

## Fix Approach (High-Level)

The `restoreAuthStorageState()` function needs to read cookies from the **storage state file** rather than the current context. Two approaches:

**Option A (Recommended)**: Modify `restoreAuthStorageState()` to accept the storage state file path and read cookies directly from the file:
```typescript
export async function restoreAuthStorageState(
  page: Page,
  storageStatePath: string  // e.g., AUTH_STATES.TEST_USER
): Promise<void> {
  const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));
  if (storageState.cookies?.length > 0) {
    await page.context().addCookies(storageState.cookies);
  }
}
```

**Option B**: Move cookie restoration into the page fixture in `base-test.ts` so it runs before any test code.

## Diagnosis Determination

The root cause is definitively identified: `restoreAuthStorageState()` is ineffective when Playwright's storage state transition clears cookies before the function runs. The function reads from the already-empty context instead of the storage state file.

This is a **regression** introduced by the interaction between:
1. The fix for #1492 (added `restoreAuthStorageState()`)
2. Tests with different storage states running sequentially
3. Playwright's internal isolation mechanism

The fix is straightforward: read from the storage state file instead of the current context.

## Additional Context

- CI always uses `workers: 1` to avoid authentication race conditions (see playwright.config.ts)
- This issue only manifests when tests with different storage states run in sequence
- The recent fixes (#1518, #1524, #1528) addressed cookie attributes but not this storage state transition issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (gh run view, playwright test), Read (test files, logs), Grep (code search)*
