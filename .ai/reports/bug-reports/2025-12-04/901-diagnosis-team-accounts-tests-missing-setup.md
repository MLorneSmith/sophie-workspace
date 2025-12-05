# Bug Diagnosis: Team Accounts E2E tests fail with blank page - missing beforeEach setup

**ID**: ISSUE-901
**Created**: 2025-12-04T17:30:00Z
**Reporter**: system/test-runner
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Team Accounts E2E tests (shard 12) fail with timeout errors because the `beforeEach` hook is missing critical setup steps. Tests attempt to navigate to team settings or interact with the team selector without first navigating to `/home` and creating a team. This results in blank pages (as shown in screenshots) and 120-second timeouts.

## Environment

- **Application Version**: dev branch
- **Environment**: development (Docker test environment on port 3001)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown - may have always been broken

## Reproduction Steps

1. Run `/test 12` or `pnpm --filter web-e2e test:shard12`
2. Observe test `user can update their team name (and slug)` times out at line 85
3. Observe test `cannot create a Team account using reserved names` fails to find `team-selector`
4. Check screenshots - both show blank white pages

## Expected Behavior

- Tests should navigate to `/home` after authentication
- Tests should create a team before attempting to access team settings
- Team selector should be visible and functional

## Actual Behavior

- Tests start with a blank page despite having valid authentication storage state
- `goToSettings()` times out because there's no page content to interact with
- `openAccountsSelector()` fails because `[data-testid="team-selector"]` doesn't exist on blank page
- All 2 tests fail, 5 are skipped (they use `.skip()`)

## Diagnostic Data

### Console Output
```
Error: Test timeout of 120000ms exceeded

   at team-accounts/team-accounts.po.ts:55

  53 |
  54 | 			await this.page.waitForURL("**/home/*/settings");
> 55 | 		}).toPass();
       | 		   ^
  56 | 	}

    at TeamAccountsPageObject.goToSettings
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/team-accounts/team-accounts.spec.ts:85:22
```

### Network Analysis
N/A - Page never navigated to load any content

### Screenshots
- `test-results/team-accounts-team-account-500c6-e-their-team-name-and-slug--chromium/test-failed-1.png` - Blank white page
- `test-results/team-accounts-team-account-43161-ccount-using-reserved-names-chromium/test-failed-1.png` - Blank white page

## Error Stack Traces
```
Error: Test timeout of 120000ms exceeded
   at team-accounts/team-accounts.po.ts:55
   at TeamAccountsPageObject.goToSettings
   at /apps/e2e/tests/team-accounts/team-accounts.spec.ts:85:22

Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid="team-selector"]')
Expected: visible
   at team-accounts/team-accounts.po.ts:97
   at TeamAccountsPageObject.openAccountsSelector
   at /apps/e2e/tests/team-accounts/team-accounts.spec.ts:103:22
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts` (lines 72-97)
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts` (goToSettings, openAccountsSelector methods)

- **Recent Changes**: Multiple auth-related fixes in the last 20 commits, but none modified the beforeEach logic

- **Suspected Functions**:
  - `beforeEach` hook at line 78-80 of team-accounts.spec.ts

## Related Issues & Context

### Same Pattern Working in Other Tests
The invitations.spec.ts (shard 4) and team-billing.spec.ts (shard 10) use the correct pattern:
- `invitations.spec.ts:33-43` - Creates team in beforeEach
- `team-billing.spec.ts:11-14` - Creates team at start of each test

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `beforeEach` hook in team-accounts.spec.ts is incomplete - it only initializes the page object but doesn't navigate to `/home` or create a team.

**Detailed Explanation**:
Playwright tests start with a blank page even when using pre-authenticated `storageState`. The authentication cookies/localStorage are injected, but the browser is not navigated anywhere. The test code must explicitly:
1. Navigate to a page (e.g., `await page.goto("/home")`)
2. Create any required test data (e.g., `await teamAccounts.createTeam()`)

The current `beforeEach` in team-accounts.spec.ts only does:
```typescript
test.beforeEach(async ({ page }) => {
    teamAccounts = new TeamAccountsPageObject(page);
    // Missing: await page.goto("/home");
    // Missing: await teamAccounts.createTeam();
});
```

Compared to the working pattern in invitations.spec.ts:
```typescript
test.beforeEach(async ({ page }) => {
    invitations = new InvitationsPageObject(page);
    await page.goto("/home");  // Navigate first!
    const teamName = `test-${Math.random().toString(36).substring(2, 15)}`;
    slug = teamName.toLowerCase().replace(/ /g, "-");
    await invitations.teamAccounts.createTeam({ teamName, slug });  // Create team!
});
```

**Supporting Evidence**:
- Screenshots show blank white pages - no navigation occurred
- Other test files (invitations, team-billing) that work correctly include both navigation and team creation
- The `goToSettings()` method assumes the user is already on a page with a "Settings" link
- The `openAccountsSelector()` method expects `[data-testid="team-selector"]` to exist

### How This Causes the Observed Behavior

1. Test starts with blank page (Playwright default)
2. Storage state injects auth cookies, but page remains blank
3. `goToSettings()` tries to find and click "Settings" link - nothing exists
4. Test times out after 120 seconds waiting for URL pattern `**/home/*/settings`
5. Similarly, `openAccountsSelector()` can't find `team-selector` on blank page

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct comparison with working tests shows the exact missing code
- Screenshots clearly show blank pages (no navigation occurred)
- The fix is straightforward and follows established patterns in the codebase

## Fix Approach (High-Level)

Update the `beforeEach` hook in `apps/e2e/tests/team-accounts/team-accounts.spec.ts` to:

```typescript
test.beforeEach(async ({ page }) => {
    teamAccounts = new TeamAccountsPageObject(page);

    // Navigate to home first - required because Playwright starts with blank page
    // even when using pre-authenticated storage state
    await page.goto("/home");

    // Create a team for the tests
    await teamAccounts.createTeam();
});
```

This matches the pattern used in `invitations.spec.ts` and `team-billing.spec.ts`.

## Diagnosis Determination

**Root cause confirmed**: The team-accounts.spec.ts tests are missing required setup steps in the `beforeEach` hook. This is NOT a shard ordering issue or test isolation problem - it's simply incomplete test setup code.

The fix is to add navigation and team creation to the `beforeEach` hook, following the established pattern from other working test files.

## Additional Context

- 5 tests in the file are already marked as `.skip()` with reasons documented
- The test file likely worked at some point when tests had different setup requirements
- This is a common Playwright pitfall - assuming storage state automatically navigates somewhere

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (grep, head, ls), BashOutput for test logs*
