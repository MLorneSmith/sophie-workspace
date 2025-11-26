# Bug Diagnosis: E2E Test Fails - Settings Page Email Element Hidden Due to Collapsed Sidebar

**ID**: ISSUE-717
**Created**: 2025-11-26T21:50:00Z
**Reporter**: Test automation
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test `account-simple.spec.ts:166` "settings page shows user email" fails with a timeout error because the test is looking for an email element that exists in the DOM but is hidden when the sidebar is in collapsed/minimized state. The default sidebar configuration collapses the sidebar, which applies `group-data-[minimized=true]/sidebar:hidden` CSS class to the email display element.

## Environment

- **Application Version**: Current dev branch
- **Environment**: E2E test (Docker container `slideheroes-app-test`)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - this may have been a latent issue

## Reproduction Steps

1. Run E2E shard 3 (Personal Accounts): `/test 3`
2. The test "settings page shows user email" at `account-simple.spec.ts:166` fails
3. Error: `TimeoutError: locator.waitFor: Timeout 10000ms exceeded`
4. Locator resolves to **hidden** element 25 times before timing out

## Expected Behavior

The test should find and verify the user's email (`test1@slideheroes.com`) is visible on the settings page.

## Actual Behavior

The test times out because:
1. The element exists in the DOM: `<span data-test="account-dropdown-email" class="text-muted-foreground truncate text-xs">test1@slideheroes.com</span>`
2. The element is **hidden** due to the sidebar being in collapsed/minimized state
3. The CSS class `group-data-[minimized=true]/sidebar:hidden` applies when sidebar is minimized

## Diagnostic Data

### Console Output
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('text="test1@slideheroes.com"').first() to be visible
    25 × locator resolved to hidden <span data-test="account-dropdown-email" class="text-muted-foreground truncate text-xs">test1@slideheroes.com</span>
```

### Code Analysis

**Test Code** (`apps/e2e/tests/account/account-simple.spec.ts:166-185`):
```typescript
test("settings page shows user email", async ({ page }) => {
    await page.goto("/home/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // This locator finds a HIDDEN element
    const emailDisplay = page
        .locator(`text="${process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com"}"`)
        .first();

    // This wait fails because element is hidden (not visible)
    await emailDisplay.waitFor({ state: "visible", timeout: 10000 });
    await expect(emailDisplay).toBeVisible();
});
```

**Component Code** (`packages/features/accounts/src/components/personal-account-dropdown.tsx:106-125`):
```typescript
<If condition={showProfileName}>
    <div className={
        "fade-in animate-in flex w-full flex-col truncate text-left group-data-[minimized=true]/sidebar:hidden"  // ← HIDES WHEN MINIMIZED
    }>
        <span data-test={"account-dropdown-display-name"} className={"truncate text-sm"}>
            {displayName}
        </span>
        <span data-test={"account-dropdown-email"} className={"text-muted-foreground truncate text-xs"}>
            {signedInAsLabel}
        </span>
    </div>
</If>
```

**Default Configuration** (`packages/ui/src/makerkit/navigation-config.schema.ts:43-47`):
```typescript
sidebarCollapsed: z
    .enum(["false", "true"])
    .default("true")  // ← DEFAULT IS COLLAPSED
    .optional()
    .transform((value) => value === "true"),
```

### Environment Check
```bash
docker exec slideheroes-app-test printenv | grep -E "SIDEBAR|NAVIGATION"
# Result: No sidebar config in test container
```

The test container does NOT have `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED` set, so it defaults to `"true"` (collapsed).

## Error Stack Traces
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.

    179 |
    180 |     // Wait for the email to be visible
  > 181 |     await emailDisplay.waitFor({ state: "visible", timeout: 10000 });
        |                        ^
    182 |
    183 |     // Verify email is displayed
    184 |     await expect(emailDisplay).toBeVisible();
      at /home/msmith/projects/2025slideheroes/apps/e2e/tests/account/account-simple.spec.ts:181:22
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/account/account-simple.spec.ts` (test file)
  - `packages/features/accounts/src/components/personal-account-dropdown.tsx` (UI component)
  - `packages/ui/src/makerkit/navigation-config.schema.ts` (default configuration)
- **Recent Changes**: None directly related - this is a latent configuration issue
- **Suspected Functions**: Test selector strategy and sidebar default state

## Related Issues & Context

### Similar E2E Issues
- #639 (CLOSED): Bug Diagnosis: E2E Test Timeouts and Element Not Found in CI
- #643 (CLOSED): Bug Diagnosis: Dev Integration Tests Failing - networkidle Timeout
- #713 (CLOSED): Bug Diagnosis: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized

### Historical Context
E2E tests have had various timeout and element-not-found issues. This specific test may have been passing intermittently depending on window size, browser state, or cookie settings that affected sidebar state.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test looks for an email element that is CSS-hidden when the sidebar is collapsed, and the sidebar defaults to collapsed in the test environment.

**Detailed Explanation**:

1. **Default Configuration**: The navigation schema defaults `sidebarCollapsed` to `"true"` at `packages/ui/src/makerkit/navigation-config.schema.ts:45`

2. **Missing Environment Variable**: The test Docker container does not set `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED`, causing it to use the default (collapsed)

3. **CSS Hiding**: The `personal-account-dropdown.tsx` component wraps the email display in a div with class `group-data-[minimized=true]/sidebar:hidden`, which hides the element when the sidebar is minimized

4. **Test Strategy**: The test uses a generic text locator `text="test1@slideheroes.com"` which finds the element in the DOM, but `waitFor({ state: "visible" })` correctly fails because CSS hides it

**Supporting Evidence**:
- Error log: `25 × locator resolved to hidden <span data-test="account-dropdown-email"...`
- CSS class: `group-data-[minimized=true]/sidebar:hidden`
- Default: `.default("true")` in navigation schema

### How This Causes the Observed Behavior

1. Test navigates to `/home/settings`
2. Page renders with sidebar in collapsed state (default)
3. Email element exists in DOM but is hidden via CSS
4. Test locator finds the element
5. `waitFor({ state: "visible" })` waits for element to become visible
6. Element never becomes visible (sidebar stays collapsed)
7. Test times out after 10 seconds

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error log explicitly states element resolves to "hidden" 25 times
- CSS class clearly shows hiding behavior in minimized state
- Default configuration confirmed to be "true" (collapsed)
- Test container confirmed to lack the environment variable override

## Fix Approach (High-Level)

There are three valid approaches to fix this:

1. **Fix the Test (Recommended)**: Change the test to either:
   - Expand the sidebar before checking for email (click sidebar trigger)
   - Use a different locator that targets always-visible elements (e.g., email in dropdown menu content when opened)
   - Remove this specific test if it's not testing core functionality

2. **Fix the Environment**: Set `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED=false` in the test environment (Dockerfile or .env)

3. **Fix the Default**: Change the default in navigation schema from `"true"` to `"false"` - but this would change production behavior

The recommended fix is option 1 - modify the test to expand the sidebar first or use an alternative verification strategy, as the sidebar being collapsed is valid application behavior.

## Diagnosis Determination

**Root Cause Confirmed**: The E2E test fails because it expects to see an email element that is hidden when the sidebar is in its default collapsed state. The test environment does not override the default, causing the sidebar to be collapsed, which CSS-hides the email display element.

**Fix Path Clear**: Modify the test at `apps/e2e/tests/account/account-simple.spec.ts:166-185` to either expand the sidebar before asserting email visibility, or use an alternative assertion strategy that doesn't depend on sidebar state.

## Additional Context

Screenshots are available at:
- `test-results/account-account-simple-Acc-8e933-tings-page-shows-user-email-chromium/test-failed-1.png`
- `test-results/account-account-simple-Acc-8e933-tings-page-shows-user-email-chromium-retry1/test-failed-1.png`

Trace file available at:
- `test-results/account-account-simple-Acc-8e933-tings-page-shows-user-email-chromium-retry1/trace.zip`

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, Glob, gh issue list*
