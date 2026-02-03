# Bug Diagnosis: Dev Integration Tests Regression - Email Visibility Test Failure

**ID**: ISSUE-pending
**Created**: 2026-02-02T15:00:00Z
**Reporter**: CI/CD Pipeline
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests workflow failed on commit `e0bbd8c40` after successfully passing on commit `565b7f4f5` three days earlier. The failure is in the "settings page shows user email" test which cannot find the user's email text within the dropdown menu. A secondary test ("user can update display name") is marked as flaky.

## Environment

- **Application Version**: `e0bbd8c40a7ed769f182d103906a85b7a24efb9d`
- **Environment**: dev (Vercel preview deployment)
- **Browser**: Chromium (Playwright)
- **Node Version**: GitHub Actions runner
- **Database**: Supabase (production shared)
- **Last Working**: 2026-01-29 (commit `565b7f4f5`)

## Reproduction Steps

1. Push changes to the `dev` branch triggering Deploy to Dev workflow
2. Deploy to Dev workflow completes successfully
3. dev-integration-tests workflow triggers
4. Integration Tests job runs Playwright tests with `@integration` tag
5. Test "settings page shows user email" fails after 15 second timeout
6. Test "user can update display name" fails initially, passes on retry (flaky)

## Expected Behavior

- All integration tests should pass
- The account dropdown should open when clicked
- The user's email (`test1@slideheroes.com` or value from `E2E_TEST_USER_EMAIL` secret) should be visible in the dropdown menu

## Actual Behavior

- Test "settings page shows user email" fails with error:
  ```
  Error: expect(locator).toBeVisible() failed
  Locator: locator('[role="menu"]').getByText('***')
  Expected: visible
  Timeout: 15000ms
  Error: element(s) not found
  ```
- Test "user can update display name" shows stale data (name from January 29th instead of current test's name)

## Diagnostic Data

### Test Output Analysis

```
1) [chromium] › tests/account/account-simple.spec.ts:213:6 › Account Settings - Simple @account @integration › settings page shows user email

    Retry #1 ───────────────────────────────────────────────────
    Error: expect(locator).toBeVisible() failed
    Locator: locator('[role="menu"]').getByText('***')
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

2) [chromium] › tests/account/account-simple.spec.ts:69:6 › Account Settings - Simple @account @integration › user can update display name

    Test timeout of 180000ms exceeded.
    Error: expect(locator).toHaveText(expected) failed
    Locator:  locator('[data-testid="account-dropdown-display-name"]')
    Expected: "Test User 1770042546662"
    Received: "Test User 1769721037392"

    Call log:
    - 92 × locator resolved to <span class="truncate text-sm" data-testid="account-dropdown-display-name">Test User 1769721037392</span>
    - unexpected value "Test User 1769721037392"

  1 failed
    [chromium] › tests/account/account-simple.spec.ts:213:6 › settings page shows user email
  1 flaky
    [chromium] › tests/account/account-simple.spec.ts:69:6 › user can update display name
  6 skipped
  2 did not run
  17 passed (4.6m)
```

### Code Changes Between Success and Failure

Files changed between commits `565b7f4f5` (last success) and `e0bbd8c40` (failure):

| File | Change Type |
|------|-------------|
| `apps/web/styles/shadcn-ui.css` | Whitespace formatting only |
| `apps/web/styles/theme.css` | Whitespace formatting only |
| `apps/payload/package.json` | Payload CMS upgrade |
| `apps/payload/src/app/api/health/route.ts` | Health endpoint |
| `package.json` | Dependency updates |
| `pnpm-lock.yaml` | Lockfile regeneration |
| `patches/payload@3.74.0.patch` | New patch file |

**No changes** to:
- E2E test files (`apps/e2e/tests/account/account-simple.spec.ts`)
- Account dropdown component (`packages/features/accounts/src/components/personal-account-dropdown.tsx`)
- React Query hooks for account data

### Network/Deployment Info

- **Last successful run URL**: `https://2025slideheroes-rkp0h6vlb-slideheroes.vercel.app`
- **Failed run URL**: `https://2025slideheroes-9azqw60ke-slideheroes.vercel.app`
- Both are Vercel preview deployments with bypass headers configured

## Error Stack Traces

Primary failure:
```
at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/account/account-simple.spec.ts:240:33

> 240 | await expect(emailInDropdown).toBeVisible({ timeout: CI_TIMEOUTS.short });
```

## Related Code

### Affected Files
- `apps/e2e/tests/account/account-simple.spec.ts:213-241` - Test implementation
- `packages/features/accounts/src/components/personal-account-dropdown.tsx:134-147` - Dropdown menu content
- `packages/features/accounts/src/hooks/use-personal-account-data.ts` - Data fetching hook

### Test Code (Line 213-241)

```typescript
test("settings page shows user email", async ({ page }) => {
  await navigateAndWaitForHydration(page, "/home/settings");

  const accountDropdownTrigger = page.locator('[data-testid="account-dropdown"]');

  await expect(async () => {
    await accountDropdownTrigger.waitFor({ state: "visible", timeout: CI_TIMEOUTS.short });
    await accountDropdownTrigger.click();
  }).toPass({
    timeout: CI_TIMEOUTS.element,
    intervals: RETRY_INTERVALS as unknown as number[],
  });

  const expectedEmail = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
  const emailInDropdown = page.locator('[role="menu"]').getByText(expectedEmail);

  await expect(emailInDropdown).toBeVisible({ timeout: CI_TIMEOUTS.short });
});
```

### Dropdown Component Email Display (Line 134-147)

```tsx
<DropdownMenuContent className={"xl:min-w-[15rem]!"}>
  <DropdownMenuItem className={"h-10! rounded-none"}>
    <div className={"flex flex-col justify-start truncate text-left text-xs"}>
      <div className={"text-muted-foreground"}>
        <Trans i18nKey={"common:signedInAs"} />
      </div>
      <div>
        <span className={"block truncate"}>{signedInAsLabel}</span>
      </div>
    </div>
  </DropdownMenuItem>
  ...
</DropdownMenuContent>
```

## Related Issues & Context

### Similar Previous Issues
- Issue #1116: E2E test failures with similar account dropdown timing issues (Dec 2025)
- Issue #777-778: Sign out selector mismatch after `data-testid` rename (Nov 2025)

### Historical Context
This test suite has had intermittent flakiness related to:
1. React Query cache invalidation timing
2. Dropdown animation timing
3. Server-side data freshness

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test fails due to timing-related dropdown menu visibility combined with potential React Query data caching issues.

**Detailed Explanation**:

The test flow has two potential failure points:

1. **Dropdown Click Timing**: The `toPass()` pattern wraps the click but NOT the subsequent email visibility check. If the dropdown menu (`[role="menu"]`) takes longer to render than expected (due to animations or Radix UI portal mounting), the `getByText(expectedEmail)` locator will fail to find the element within the 15-second timeout.

2. **Stale Server Data**: The `usePersonalAccountData` hook is configured with:
   ```typescript
   refetchOnWindowFocus: false,
   refetchOnMount: false,
   initialData: partialAccount?.id ? {...} : undefined
   ```
   This means once data is loaded server-side, the client uses `initialData` and never re-fetches. If the server passes stale data (from a previous test run or cache), the UI shows incorrect values.

3. **Test Isolation**: The tests share the same test user (`test1@slideheroes.com`) across CI runs. Previous test runs modify the user's display name, and this persists in the database. The "user can update display name" test shows a timestamp from **4 days prior** (`1769721037392` = Jan 29), indicating stale data.

**Supporting Evidence**:
- The flaky test "user can update display name" retried 92 times over 90 seconds showing the same stale value
- No code changes to the dropdown component or tests between successful and failed runs
- Only whitespace formatting changes in CSS files

### How This Causes the Observed Behavior

1. Test navigates to `/home/settings` with pre-authenticated state
2. Server renders the page with account data (potentially stale from Vercel's cache or database)
3. Client hydrates with `initialData` from server - no refetch due to hook configuration
4. Test clicks dropdown trigger (succeeds via `toPass()`)
5. Dropdown menu opens but:
   - Either the animation is slow and `[role="menu"]` isn't fully rendered
   - Or the email text is present but doesn't exactly match the expected value (unlikely given the test logic)
6. The 15-second timeout expires waiting for the email text

### Confidence Level

**Confidence**: Medium

**Reasoning**: While the timing issue is the most likely cause, I cannot confirm definitively without:
1. Test screenshots showing the actual dropdown state at failure time
2. HAR logs showing network requests/responses
3. The actual value of `E2E_TEST_USER_EMAIL` secret to confirm text matching

The lack of code changes to the affected components strongly suggests this is an environmental/timing issue rather than a code regression.

## Fix Approach (High-Level)

Two approaches to resolve:

1. **Test Hardening** (Recommended):
   - Wrap the email visibility check in `toPass()` like the click action
   - Add explicit wait for `[role="menu"]` to be visible before checking email
   - Use `waitForSelector` on the menu element before text assertion

2. **Data Freshness**:
   - Consider enabling `refetchOnMount: true` in `usePersonalAccountData` hook
   - Alternatively, add a dedicated test data reset step before integration tests

## Diagnosis Determination

The regression is likely a **flaky test** that was previously passing by chance. The underlying issues are:

1. Missing `toPass()` wrapper around the email visibility assertion
2. Shared test user data across CI runs causing stale data visibility
3. React Query's aggressive caching preventing data refresh

The CSS formatting changes in `shadcn-ui.css` and `theme.css` are unlikely to be the cause as they only add whitespace/line breaks with no functional changes.

## Additional Context

### Workflow Configuration
- Workflow: `dev-integration-tests.yml`
- Triggered by: `workflow_run` after `Deploy to Dev` completes
- Test command: `pnpm --filter web-e2e test:integration`
- Timeout: 30 minutes for Integration Tests job

### Environment Variables
- `E2E_TEST_USER_EMAIL`: Configured as GitHub secret (set 2025-10-02)
- `VERCEL_AUTOMATION_BYPASS_SECRET`: Used for deployment protection bypass
- `DEBUG`: `pw:api` (Playwright debug logging enabled)

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub CLI (gh), Grep, Read, Bash*
