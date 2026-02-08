# Bug Diagnosis: E2E Test "reactivate user flow" fails due to missing response wait

**ID**: ISSUE-1591
**Created**: 2026-01-19T10:30:00Z
**Reporter**: CI/CD Workflow
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E test "reactivate user flow" in `apps/e2e/tests/admin/admin.spec.ts` fails intermittently because it does not wait for the ban server action response before checking for the "Banned" badge. This creates a race condition where the UI hasn't updated yet when the assertion runs.

## Environment

- **Application Version**: 2.23.9
- **Environment**: CI (GitHub Actions)
- **Browser**: Chromium
- **Node Version**: LTS
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Intermittent failure (flaky test)

## Reproduction Steps

1. Run E2E test suite with sharding (shard 4 contains admin tests)
2. Execute "reactivate user flow" test in `apps/e2e/tests/admin/admin.spec.ts:213`
3. Test clicks "Ban User" button without waiting for server response
4. Test immediately checks for "Banned" badge visibility
5. Test fails because page hasn't revalidated yet

## Expected Behavior

The test should wait for the ban action to complete (POST response received) before checking for the "Banned" badge, ensuring the page has revalidated and the UI has updated.

## Actual Behavior

The test clicks the "Ban User" button and immediately checks for the "Banned" badge without waiting for the server action response. This results in:
- **Initial failure**: "Banned" text not found (page not yet updated)
- **Retry #1 failure**: `net::ERR_ABORTED` at `/auth/sign-in` (server possibly stressed from rapid requests)
- **Retry #2 failure**: "Banned" text not found (same root cause)

## Diagnostic Data

### Console Output
```
1) [chromium] › tests/admin/admin.spec.ts:129:9 › Admin › Personal Account Management › reactivate user flow

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Banned').first()
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found
```

### Network Analysis
The test doesn't wait for the POST response from the ban action. The server action uses `revalidatePath("/admin/accounts/[id]", "page")` which triggers a server-side revalidation, but the client needs to receive and process this before the UI updates.

### Related Code

**Failing code** (lines 215-219 of admin.spec.ts):
```typescript
// First ban the user
await page.getByTestId("admin-ban-account-button").click();
await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
await page.getByRole("button", { name: "Ban User" }).click();  // NO WAIT!

await expect(page.getByText("Banned").first()).toBeVisible();  // FAILS
```

**Working code** from "ban user flow" test (lines 165-174):
```typescript
await Promise.all([
  page.getByRole("button", { name: "Ban User" }).click(),
  page.waitForResponse(
    (response) =>
      response.url().includes("/admin/accounts") &&
      response.request().method() === "POST",
  ),
]);

await expect(page.getByText("Banned").first()).toBeVisible();  // WORKS
```

### Screenshots
Screenshots captured in CI at:
- `test-results/admin-admin-Admin-Personal-179fe-gement-reactivate-user-flow-chromium/test-failed-1.png`

## Error Stack Traces
```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Banned').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

    at /home/runner/work/next-supabase-saas-kit-turbo/next-supabase-saas-kit-turbo/apps/e2e/tests/admin/admin.spec.ts:135:54
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts:215-219`
- **Recent Changes**:
  - `2414cb4e8` - Previous fix attempt focused on hydration race conditions in `loginAsUser()`
  - `98814b822` - Auth timeout and ban user test flakiness fix
- **Suspected Functions**: Lines 215-217 in "reactivate user flow" test

## Related Issues & Context

### Direct Predecessors
- Commit `2414cb4e8` addressed a related hydration race condition but didn't fix this specific timing issue

### Similar Symptoms
- "ban user flow" test had similar issues but was fixed with `Promise.all` + `waitForResponse` pattern

### Same Component
- All tests in "Personal Account Management" describe block share the same user state

## Root Cause Analysis

### Identified Root Cause

**Summary**: The "reactivate user flow" test does not wait for the ban server action response before asserting the "Banned" badge is visible.

**Detailed Explanation**:
The test flow:
1. Clicks "Ban User" button to open dialog
2. Fills in "CONFIRM" in the confirmation field
3. Clicks "Ban User" submit button - this triggers a server action
4. **Immediately** checks for "Banned" text without waiting

The server action (`banUserAction`) calls `revalidatePath("/admin/accounts/[id]", "page")` after successfully banning the user. However:
- `revalidatePath` triggers a server-side cache invalidation
- The client needs to receive the response and re-render
- This takes time, but the test doesn't wait for it

**Supporting Evidence**:
- The "ban user flow" test (lines 165-174) uses `Promise.all` with `waitForResponse` and **works reliably**
- The reactivate portion of the failing test (lines 230-237) also uses `Promise.all` with `waitForResponse` and **works reliably**
- Only the ban portion at the start of "reactivate user flow" is missing this pattern

### How This Causes the Observed Behavior

1. Test clicks "Ban User" button
2. Server action begins processing (async)
3. Test immediately runs `expect(page.getByText("Banned").first()).toBeVisible()`
4. Server action is still in progress, page hasn't revalidated
5. "Banned" badge doesn't exist in DOM yet
6. Test fails with "element(s) not found"

On retry, the test starts fresh but the server may be processing multiple requests, leading to `net::ERR_ABORTED` when navigating.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The working tests use `Promise.all` + `waitForResponse` pattern consistently
2. The failing code is the only place that doesn't use this pattern
3. The error message confirms the element simply isn't found (not a timing issue with finding it)
4. This is a classic race condition pattern in E2E tests with server-side rendering

## Fix Approach (High-Level)

Wrap the ban button click in `Promise.all` with `waitForResponse`, matching the pattern used elsewhere in the file:

```typescript
// Change from:
await page.getByRole("button", { name: "Ban User" }).click();

// To:
await Promise.all([
  page.getByRole("button", { name: "Ban User" }).click(),
  page.waitForResponse(
    (response) =>
      response.url().includes("/admin/accounts") &&
      response.request().method() === "POST",
  ),
]);
```

This ensures the test waits for the server action to complete before checking for UI updates.

## Diagnosis Determination

The root cause has been conclusively identified as a missing `waitForResponse` pattern in the "reactivate user flow" test. The fix is straightforward: apply the same `Promise.all` + `waitForResponse` pattern used successfully in other parts of the same test file.

## Additional Context
- This is a flaky test that fails intermittently depending on server response time
- The CI workflow run ID was 21133195224
- The failure occurred on push to main branch after merging PR #446

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, grep, Read, git log*
