# Bug Diagnosis: E2E Shard 4 Remaining Test Failures - Two Distinct Root Causes

**ID**: ISSUE-pending
**Created**: 2025-11-27T18:20:00Z
**Reporter**: system (post auth-timeout fix validation)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

After fixing the E2E Shard 4 auth timeout issue (#739), 6 tests continue to fail due to two distinct root causes: (1) a selector mismatch where tests expect `data-testid="account-selector-trigger"` but the component uses `data-testid="team-selector"`, and (2) a server-side error when executing the ban user action. These are separate issues from the original auth timeout and require individual fixes.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (test)
- **Node Version**: v22.16.0
- **pnpm Version**: 10.14.0
- **Last Working**: Unknown (selector mismatch may have existed for some time)

## Reproduction Steps

1. Run `NODE_ENV=test pnpm --filter web-e2e test:shard4`
2. Observe 6 test failures:
   - `admin.spec.ts:102` - ban user flow (server error)
   - `admin.spec.ts:318` - delete team account flow (selector mismatch)
   - `invitations.spec.ts:26` - users can delete invites (selector mismatch)
   - `invitations.spec.ts:48` - users can update invites (selector mismatch)
   - `invitations.spec.ts:74` - user cannot invite member again (selector mismatch)
   - `invitations.spec.ts:104` - Full Invitation Flow (selector mismatch)

## Expected Behavior

All Shard 4 E2E tests should pass:
- Account selector should open when clicked
- Ban user action should succeed for non-admin users

## Actual Behavior

### Issue 1: Account Selector Mismatch (5 tests)
Tests timeout at 90 seconds waiting for `data-testid="account-selector-trigger"` which doesn't exist.

### Issue 2: Ban User Server Error (1 test)
Ban user dialog shows error: "There was an error banning the user. Please check the server logs to see what went wrong."

## Diagnostic Data

### Console Output - Account Selector Test
```
Error: Test timeout of 90000ms exceeded

   at team-accounts/team-accounts.po.ts:89

      87 | 				this.page.locator('[data-testid="account-selector-content"]'),
      88 | 			).toBeVisible();
    > 89 | 		}).toPass();
```

### Console Output - Ban User Test
```yaml
- alertdialog "Ban User" [ref=e11]:
    - generic [ref=e12]:
      - heading "Ban User" [level=2] [ref=e13]
      - paragraph [ref=e14]: Are you sure you want to ban this user?
    - generic [ref=e15]:
      - alert [ref=e16]:
        - heading "Error" [level=5] [ref=e17]
        - generic [ref=e18]: There was an error banning the user. Please check the server logs to see what went wrong.
```

### Network Analysis
N/A - Tests fail before network requests for account selector; ban user request completes but returns error.

### Database Analysis
N/A - Not a database-level issue.

### Performance Metrics
- Tests timeout after 90 seconds waiting for selector
- Ban user test fails immediately after server action returns error

### Screenshots
- `apps/e2e/test-results/admin-admin-Admin-Personal-Account-Management-ban-user-flow-chromium-retry1/test-failed-1.png`
- `apps/e2e/test-results/invitations-invitations-Fu-aa75c--let-users-accept-an-invite-chromium-retry1/test-failed-1.png`

## Error Stack Traces

### Selector Mismatch Stack Trace
```
Error: Test timeout of 90000ms exceeded

   at team-accounts/team-accounts.po.ts:89

      87 | 				this.page.locator('[data-testid="account-selector-content"]'),
      88 | 			).toBeVisible();
    > 89 | 		}).toPass();
         | 		   ^
      90 | 	}
```

## Related Code

### Issue 1: Selector Mismatch

- **Affected Files**:
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts:84` - Uses incorrect selector
  - `packages/features/accounts/src/components/account-selector.tsx:96` - Has actual selector

- **Recent Changes**: `86dee50cb` fix(e2e): complete selector migration from data-test to data-testid
- **Suspected Functions**: `TeamAccountsPageObject.openAccountsSelector()`

**Code Evidence**:

Test Page Object (team-accounts.po.ts:82-89):
```typescript
openAccountsSelector() {
    return expect(async () => {
        await this.page.click('[data-testid="account-selector-trigger"]'); // WRONG
        return expect(
            this.page.locator('[data-testid="account-selector-content"]'),
        ).toBeVisible();
    }).toPass();
}
```

Actual Component (account-selector.tsx:94-97):
```typescript
<Button
    data-testid="team-selector"  // CORRECT - This is the actual selector
    size={collapsed ? "icon" : "default"}
    variant="ghost"
```

### Issue 2: Ban User Server Error

- **Affected Files**:
  - `packages/features/admin/src/lib/server/admin-server-actions.ts:27-56` - banUserAction
  - `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts:44-48` - banUser service

- **Recent Changes**: None recent to admin server actions
- **Suspected Functions**: `AdminAuthUserService.banUser()`, `setBanDuration()`

**Code Evidence**:

The ban action calls `service.banUser(userId)` which uses Supabase Admin API:
```typescript
private async setBanDuration(userId: string, banDuration: string) {
    return this.adminClient.auth.admin.updateUserById(userId, {
        ban_duration: banDuration,
    });
}
```

The error is generic ("There was an error banning the user") which indicates the Supabase Admin API call is failing, potentially due to:
1. Missing or invalid service role key
2. The test user cannot be banned (e.g., super admin protection)
3. Network/API connectivity issue with Supabase Auth

## Related Issues & Context

### Direct Predecessors
- #739 (CLOSED): "Bug Fix: E2E Shard 4 Tests Timeout During Fresh Authentication" - Fixed auth timeout, revealed these issues
- #734 (CLOSED): "Bug Fix: E2E Shard 4 Tests Fail - Incomplete Selector Migration" - Previous selector fix attempt
- #732 (CLOSED): "Bug Fix: E2E Shard 4 Test Failures - Standardize to data-testid" - Selector standardization

### Related Infrastructure Issues
- #731 (CLOSED): "Bug Diagnosis: E2E Shard 4 Test Failures Due to Selector Mismatch and Auth State Issues"

### Same Component
- #656 (CLOSED): "Bug Diagnosis: Team Account E2E Tests Failing - Missing Test User Accounts"
- #720 (CLOSED): "Bug Fix: E2E Shard 4 Tests Fail Due to Redundant Login Attempts"

### Historical Context
Multiple selector migration attempts have been made. The issue persists because:
1. The test page object uses `account-selector-trigger`
2. The actual component uses `team-selector`
3. No one aligned these during migrations

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two distinct bugs: (1) E2E test selector doesn't match component's data-testid, and (2) Supabase Admin API call to ban user returns an error.

**Detailed Explanation**:

#### Root Cause 1: Selector Mismatch
The `TeamAccountsPageObject.openAccountsSelector()` method at `team-accounts.po.ts:84` clicks on `data-testid="account-selector-trigger"`, but the `AccountSelector` component at `account-selector.tsx:96` uses `data-testid="team-selector"`. This mismatch causes the test to wait until timeout (90s) for an element that doesn't exist.

#### Root Cause 2: Ban User Server Error
The `banUserAction` in `admin-server-actions.ts` calls `service.banUser(userId)` which uses `adminClient.auth.admin.updateUserById()`. The error message "There was an error banning the user" is returned when this API call fails. The likely cause is that the Supabase Admin API is rejecting the request, possibly due to:
- Invalid service role key configuration in test environment
- Network connectivity to Supabase Auth API
- The target user (test2@slideheroes.com) may have restrictions

**Supporting Evidence**:
1. Error context shows the page is authenticated and on the correct admin page
2. The "Ban User" dialog is visible and user typed "CONFIRM"
3. The error appears in an alert dialog, indicating server action returned `{ success: false }`
4. Screenshots confirm UI is functional, issue is server-side

### How This Causes the Observed Behavior

1. **Selector Mismatch**: Test calls `openAccountsSelector()` → clicks on non-existent selector → times out waiting → test fails with 90000ms timeout

2. **Ban User**: Test clicks Ban → types CONFIRM → submits form → server action calls Supabase Admin API → API returns error → server action returns `{ success: false }` → UI shows error alert → test expects "Banned" badge but sees error instead → test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Selector mismatch is 100% confirmed by code inspection - the selectors don't match
- Ban user error is visible in the error context screenshot showing the actual error message
- Both issues are independently verifiable

## Fix Approach (High-Level)

### Issue 1: Selector Mismatch (Priority: High)
Change `team-accounts.po.ts:84` from `account-selector-trigger` to `team-selector` to match the actual component.

### Issue 2: Ban User Error (Priority: Medium)
1. First, check server logs to identify the actual Supabase API error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correctly configured in test environment
3. If key is valid, check if test user has restrictions preventing ban
4. Add better error logging to expose the actual Supabase error message

## Diagnosis Determination

Two distinct root causes have been identified:

1. **Selector Mismatch (High Confidence)**: The test page object at `team-accounts.po.ts:84` uses `data-testid="account-selector-trigger"` but the component at `account-selector.tsx:96` uses `data-testid="team-selector"`. This is a simple string mismatch that needs correction.

2. **Ban User Server Error (Medium Confidence)**: The Supabase Admin API call is failing. The exact reason requires checking server logs, but the error handling in the code is working correctly - it's returning the appropriate error response. The root cause is likely environment configuration (service role key) or test user restrictions.

Both issues are fixable and independent of each other.

## Additional Context

These failures were discovered after successfully fixing the auth timeout issue (#739). The auth fix is working - users are successfully authenticated and navigating to protected pages. These are separate, pre-existing issues that were masked by the auth timeout failures.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (git log), error context analysis*
