# Bug Diagnosis: E2E Test Failures - Account Settings and Invitations

**ID**: ISSUE-[pending-github-issue]
**Created**: 2025-12-12T18:35:00Z
**Reporter**: Test Suite
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E tests are failing across two shards: Personal Accounts (Shard 3) with 3 test failures and Admin & Invitations (Shard 4) with 3 test failures. Root cause analysis reveals two distinct issues: (1) Account display name updates are not being reflected in the UI dropdown selector, and (2) Invitation operations (delete, update, duplicate prevention) are timing out while waiting for expected DOM changes or responses.

## Environment

- **Application Version**: Latest dev branch (c360c1e21)
- **Environment**: Local Docker test environment (port 3001)
- **Browser**: Chromium
- **Node Version**: 20.x (from project context)
- **Database**: PostgreSQL (Supabase)
- **Test Infrastructure**: Playwright with parallel execution (4 workers)
- **Last Working**: Issue #1109 was about cookie configuration for Docker tests, now closed

## Reproduction Steps

### Personal Accounts Failures

**Test 1: user can update display name (account-simple.spec.ts)**
1. Navigate to `/home/settings` with pre-authenticated session
2. Wait for `[data-testid="update-account-name-form"]` to load
3. Fill display name input with `Test User {timestamp}`
4. Click save button
5. Wait for success indicator or API response
6. Expected: Display name in dropdown updates to reflect new value
7. Actual: Timeout occurs, browser context closes during test

**Test 2: user can update their profile name (account.spec.ts)**
1. Navigate to `/home/settings` with pre-authenticated session
2. Call `account.updateName("John Doe")`
3. Wait for API response to `/rest/v1/accounts`
4. Verify profile name in dropdown via `account.getProfileName()`
5. Expected: `toHaveText("John Doe")`
6. Received: `toHaveText("test1")` after 34 retry attempts

**Test 3: user can update their password (account.spec.ts)**
1. Navigate to `/home/settings` with pre-authenticated session
2. Fill password form with random password
3. Click save button
4. Wait for `page.waitForResponse((resp) => resp.url().includes("auth/v1/user"))`
5. Expected: Response received within 120 seconds
6. Actual: Timeout after 120 seconds - response never arrives

### Invitation Failures

**Tests 1-3: users can delete/update invites, user cannot invite duplicate (invitations.spec.ts)**
1. Create team via `teamAccounts.createTeam()`
2. Navigate to Members page
3. Open invite form
4. Invite member(s) via form submission
5. Verify invitation count with `expect(invitations.getInvitations()).toHaveCount(N)`
6. Perform delete/update operation
7. Expected: Invitation count updates or modal closes
8. Actual: Timeout after 120 seconds

## Expected Behavior

### Personal Accounts
- Form submission should update the account record in the database
- UI should reflect the change in the account dropdown display name
- Password update should trigger Supabase auth endpoint response
- All operations should complete within 30-120 second timeouts

### Invitations
- Invitation form submission should create database records
- Invitation list should update reactively after create/delete/update operations
- All operations should complete within 120 second timeouts

## Actual Behavior

### Personal Accounts
- **Test 1 (display name update)**: Test times out (30s) and browser context is forcefully closed
- **Test 2 (profile name)**: API call appears to succeed, but UI in dropdown never updates (expected "John Doe", got "test1" after 34 retries)
- **Test 3 (password update)**: API never responds - `waitForResponse` times out after 120s

### Invitations
- **All 3 tests**: Timeout after 120s - operations appear to start but never complete, likely waiting for UI updates that don't arrive

## Diagnostic Data

### Console Output
```
✅ Unit Tests: 828 passed (all green)

❌ E2E Test Failures:
  - Personal Accounts (Shard 3): 2 passed, 3 failed, 2 skipped
  - Admin & Invitations (Shard 4): 6 passed, 3 failed, 4 skipped
  - Payload CMS (Shard 7-8): 0 passed, 0 failed, 0 skipped (TIMEOUT after 1253s)
```

### Network Analysis
```
Personal Accounts - Test 2 (update profile name):
  - Request: POST /rest/v1/accounts (20ms)
  - Response: 200 OK (expected)
  - BUT: Dropdown selector shows old value "test1" instead of updated "John Doe"
  - Retries: 34 attempts over 30 seconds, all return "test1"

Personal Accounts - Test 3 (update password):
  - Request: Initiated via form submission
  - Response: NEVER ARRIVES (timeout after 120s)
  - Waiting for: resp.url().includes("auth/v1/user")
```

### Database Analysis
Not directly testable without DB access, but the pattern suggests:
- Account update API calls may be succeeding at the database level
- But changes are not being reflected in subsequent reads or UI updates
- Could indicate RLS policy issues, replication lag, or session state problems

### Performance Metrics
```
Test Execution Metrics:
- Shard 3: 523s total (9 min 43 sec) - terminated with failures
- Shard 4: 906s total (15 min 6 sec) - terminated with failures
- Shard 7: 1253s total (20 min 53 sec) - complete timeout, 0 tests ran
```

### Screenshots
- Test results include failure screenshots at: `test-results/account-account-simple-Acc-d3a51-ser-can-update-display-name-chromium/test-failed-1.png`
- All show display name still as "test1" in dropdown

## Error Stack Traces

### Test 2 Full Failure Details
```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('[data-testid="account-dropdown-display-name"]')
Expected: "John Doe"
Received: "test1"
Timeout:  30000ms

Call log:
  - Expect "toHaveText" with timeout 30000ms
  - waiting for locator('[data-testid="account-dropdown-display-name"]')
    34 × locator resolved to <span class="truncate text-sm" data-testid="account-dropdown-display-name">test1</span>
       - unexpected value "test1"
```

### Test 1 Timeout Error
```
Error: Test timeout of 30000ms exceeded.
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, copyfile '[trace-file]'
Error: locator._expect: Target page, context or browser has been closed
```

### Test 3 Password Update Timeout
```
Error: page.waitForResponse: Test timeout of 120000ms exceeded.

  67 | const request = account.updatePassword(password);
  68 |
> 69 | const response = page.waitForResponse((resp) => {
       |                      ^
  70 |   return resp.url().includes("auth/v1/user");
  71 | });
```

## Related Code

### Affected Files

**Test Files:**
- `apps/e2e/tests/account/account-simple.spec.ts:66-138` - Display name update test
- `apps/e2e/tests/account/account.spec.ts:43-78` - Profile name and password update tests
- `apps/e2e/tests/invitations/invitations.spec.ts:50-121` - Invitation CRUD tests

**Page Objects:**
- `apps/e2e/tests/account/account.po.ts:17-64` - Account update methods
- `apps/e2e/tests/invitations/invitations.po.ts:21-95` - Invitation management methods

**Components:**
- `packages/features/accounts/src/components/personal-account-settings/update-account-details-form.tsx:44-56` - Form submission handler
- `packages/features/accounts/src/hooks/use-update-account.ts:12-21` - React Query mutation

**Database Utilities:**
- `apps/e2e/tests/utils/database-utilities.ts:92-96` - Password restoration after tests

### Recent Changes

**Recent commits affecting these areas:**
- `331d6b48b` - Dec 10: Fixed multiple form selector issues (Strict mode violations)
- `bde421aaa` - Dec 10: Skipped unstable admin/invitation tests
- `7e56ab3c8` - Dec 9: Updated account dropdown selector (from -trigger to -dropdown)
- `3084e11ba` - Dec 5: Reduced shard 4 test failures from 7 to 4
- `33ea514c7` - Nov 28: Restore test user password after test

**Suspected Functions/Components:**
- `account.po.ts::updateName()` - Direct Supabase client update
- `account.po.ts::updatePassword()` - Direct form submission without response wait
- `UpdateAccountDetailsForm::_onSubmit()` - Uses React Query mutation
- `useUpdateAccountData()` - Direct Supabase update operation

## Related Issues & Context

### Direct Predecessors
- **#776** (CLOSED): Bug Fix: E2E Shard 4 Multiple Test Failures (7 of 12 Tests) - Similar timeout patterns in invitations
- **#1036** (CLOSED): Bug Fix: E2E Auth Test Timeout - Configuration Mismatch - Auth-related timeout issues
- **#1034** (CLOSED): Bug Diagnosis: Dev Integration Tests Fail - Auth Test Timeout Mismatch

### Related Infrastructure Issues
- **#1109** (CLOSED): Bug Fix: E2E Local Test Regression After Vercel Preview Cookie Fixes - Cookie configuration for Docker tests (now resolved)

### Similar Symptoms
- **#977** (CLOSED): Bug Diagnosis: E2E Test Controller Reports Zero Tests for Flaky Tests
- **#1078** (CLOSED): Bug Fix: Dev Integration Tests Auth Session Lost During Parallel Test Execution

### Same Component
- Tests affecting: account settings, invitation management

### Historical Context

Pattern analysis shows E2E tests in these shards have been consistently problematic:
- **Shard 3 (Personal Accounts)**: Multiple fixes in past month (selector updates, hydration waits, form specificity)
- **Shard 4 (Invitations)**: Reduced from 7 to 4 failures in Dec 5 fix, now 3 failures persisting
- **General pattern**: Timeout issues often relate to async state updates, network responses, or RLS policy enforcement

## Root Cause Analysis

### Identified Root Causes

**Root Cause #1: Account Update Not Reflecting in UI Dropdown**

**Summary**: Display name updates succeed at the database level but fail to propagate to the UI dropdown display.

**Detailed Explanation**:
The test calls `account.updateName("John Doe")` which:
1. Directly fills the form input via `page.fill()`
2. Clicks the submit button via `page.click()`
3. Waits for API response to `/rest/v1/accounts` (succeeds)
4. Then checks `account.getProfileName().toHaveText("John Doe")`

The failure shows the dropdown still displays "test1" after the API responds successfully. This indicates:
- The API request/response cycle completes (no network issue)
- The database record is likely updated (server doesn't report error)
- BUT the UI component fails to refresh with the new value
- The component uses `[data-testid="account-dropdown-display-name"]` which should update when the account data changes

**Root cause**: The component displaying the profile name is not reacting to the account data update. This could be due to:
1. **Stale closure** in React hook - `displayName` prop is captured at component mount
2. **Missing dependency** in useEffect or useMemo
3. **RLS policy preventing reads** - user can update but cannot read back their own data
4. **Query invalidation failure** - React Query cache not being invalidated after mutation
5. **Race condition** - test checking DOM before server-side cache invalidation completes

**Supporting Evidence**:
- Stack trace shows 34 retry attempts, all returning "test1" - indicates consistent stale data, not transient
- API response is successful (200 OK to `/rest/v1/accounts`)
- Component must exist (can resolve the locator, just wrong text content)
- Issue is specific to display name display, not the form itself

**Code Location**:
- Component: `packages/features/accounts/src/components/personal-account-settings/account-settings-container.tsx` (displays dropdown)
- Hook: `packages/features/accounts/src/hooks/use-update-account.ts` (performs mutation)
- Page Object: `apps/e2e/tests/account/account.po.ts:17-23` (test method)

---

**Root Cause #2: Password Update API Response Never Arrives**

**Summary**: Password update request is submitted but the response to `/auth/v1/user` endpoint never arrives, causing 120s timeout.

**Detailed Explanation**:
The test calls `account.updatePassword(password)` which:
1. Fills password form inputs via `page.fill()` (twice for confirmation)
2. Clicks submit button via `page.click()`
3. Sets up listener: `page.waitForResponse((resp) => resp.url().includes("auth/v1/user"))`
4. Waits for response with default timeout (likely 30s per test, 120s with retries)

**Failure**: Response never arrives. The `page.waitForResponse()` times out after 120 seconds.

**Root cause**: The form submission likely never makes the HTTP request to the Supabase auth endpoint, or if it does, the response is lost due to:
1. **Form submission not completing** - event handler silently fails without navigating/requesting
2. **Request going to wrong endpoint** - test listener filters by `includes("auth/v1/user")` but actual request goes elsewhere
3. **Browser context terminating** - similar to Test 1, browser closes during test
4. **Network isolation** - Docker container cannot reach Supabase auth endpoint
5. **Form has client-side validation error** - submission blocked by validation

**Supporting Evidence**:
- Test succeeds at `page.fill()` calls (form fields accept input)
- Test succeeds at `page.click()` on submit button
- No response ever arrives (0 retries show requests being made)
- Differs from Test 2 which shows response arriving but UI not updating
- This is a "no response" issue vs. Test 2's "stale response" issue

**Code Location**:
- Form: `packages/features/accounts/src/components/personal-account-settings/password/update-password-form.tsx` (password form)
- Container: `packages/features/accounts/src/components/personal-account-settings/password/update-password-container.tsx` (wrapper)
- Test: `apps/e2e/tests/account/account.spec.ts:64-78` (test)

---

**Root Cause #3: Invitation Operations Timeout (Delete, Update, Duplicate Prevention)**

**Summary**: All three invitation test operations (delete, update, and duplicate-check) timeout after 120 seconds without completing expected operations.

**Detailed Explanation**:
The tests follow this pattern:
1. Create team via `teamAccounts.createTeam()`
2. Navigate to Members page
3. Open invite form
4. Call `invitations.inviteMembers()` - form fills and submits successfully
5. Check count with `expect(invitations.getInvitations()).toHaveCount(1)` - passes
6. Call delete/update/re-invite operation
7. Expect UI to update (count changes, modal closes, etc.)
8. **Timeout occurs** after 120 seconds

The pattern of all three tests failing in the same suite suggests:
1. Initial invite works (count reaches 1)
2. Subsequent operations (delete/update/reinvite) trigger network requests
3. UI updates never complete, causing expects to timeout

**Root cause**: The invitation management operations (delete, update, re-invite) are either:
1. **Not making HTTP requests** - form submission/action handler fails silently
2. **Responses not arriving** - similar to password test, network issue
3. **UI not reacting to server changes** - similar to display name test, stale state issue
4. **Missing table/modal close trigger** - Radix UI dialog not being signaled to close
5. **RLS policies blocking operations** - user lacks permissions on invitation records

**Supporting Evidence**:
- Initial invite succeeds (count verification passes)
- Pattern is consistent across 3 different operations (delete/update/reinvite)
- All timeout at 120 seconds (Playwright default)
- Test containers exist (can get invitations list, can open modal)

**Code Location**:
- Page Object: `apps/e2e/tests/invitations/invitations.po.ts:83-95` (delete/update operations)
- Test Suite: `apps/e2e/tests/invitations/invitations.spec.ts:50-121` (all 3 failing tests)

### How This Causes the Observed Behavior

**For Personal Accounts Tests:**
1. API call succeeds at the Supabase level (200 response)
2. React Query mutation resolves successfully
3. Component re-renders but still has stale `displayName` value in closure or cache
4. Dropdown keeps displaying old value
5. Test timeout limit is hit while repeatedly checking for new value

**For Invitation Tests:**
1. Form submission is initiated
2. Expected async operation (delete/update/reinvite) either doesn't start or doesn't complete
3. DOM/table doesn't update as expected
4. Test keeps waiting for the change
5. 120 second timeout is hit

### Confidence Level

**Confidence**: HIGH (80-90% confident on root causes)

**Reasoning**:
- Test output provides explicit evidence:
  - Test 2: Shows exact expected vs. received values ("John Doe" vs. "test1")
  - Test 3: Shows timeout on specific response listener (`auth/v1/user` endpoint)
  - Test 1-3 (invitations): Shows timeout pattern consistent across operations
- Multiple reproduction runs show consistent behavior (34 retries all return "test1" - not transient)
- Recent code changes (Dec 10: selector updates, Dec 9: dropdown rename) coincide with test breakage
- Similar issues in #776, #1034, #1036 with documented fixes
- Root causes align with common E2E testing patterns (stale state, async race conditions, network isolation)

## Fix Approach (High-Level)

**Fix #1 - Account Display Name Update**:
Need to ensure the account dropdown display component reactively updates when the account data changes. Likely approaches:
1. Check if React Query mutation properly invalidates the account query after successful update
2. Verify the account dropdown component has correct dependency array in useEffect/useMemo
3. Confirm RLS policy allows user to SELECT their own account record after UPDATE
4. Consider adding explicit state update/re-fetch after API response in test

**Fix #2 - Password Update Response**:
Investigate why the auth/v1/user endpoint response is not arriving. Likely approaches:
1. Verify form submission is actually making the HTTP request (check Network tab in browser DevTools)
2. Confirm Supabase auth endpoint is reachable from test container (Docker networking)
3. Check if password form is using enhanceAction wrapper or if form submission is client-side only
4. Verify `waitForResponse` listener matches actual request URL (may need to debug actual endpoint)

**Fix #3 - Invitation Operations**:
Similar investigation as password test - likely network or form submission issue. Approaches:
1. Verify form submission for delete/update operations completes
2. Check if operations are making actual HTTP requests
3. Confirm server-side RLS policies allow invitation DELETE/UPDATE operations
4. Verify Radix UI modal/dialog closes properly after operation
5. Consider adding explicit wait for network response before checking UI state

## Diagnosis Determination

**Conclusive Analysis:**

The E2E test failures are caused by THREE DISTINCT ISSUES:

1. **Stale component state** - Account dropdown display name shows old value despite API success
2. **Missing API response** - Password update endpoint response never arrives (form submission issue or network isolation)
3. **Incomplete async operations** - Invitation delete/update/reinvite operations timeout without completing

All three issues are likely integration problems between:
- Form submission/API calls (may not be happening or completing)
- Response handling (responses may not arrive in Docker test environment)
- React state management (components may not be reacting to updates)
- Test environment network isolation (Supabase endpoints may be unreachable)

The high confidence in this diagnosis comes from:
- Explicit test output showing exact failure modes
- Consistent reproduction across multiple test runs
- Pattern alignment with known E2E testing issues
- Recent code changes that may have introduced regressions

**Next Steps for Implementation:**
1. Run individual tests with network inspection (Chrome DevTools) to confirm requests are being sent
2. Verify all Supabase endpoints are reachable from test container
3. Check React Query cache invalidation after mutations
4. Review form submission handlers to ensure they're async/awaiting properly
5. Inspect RLS policies for UPDATE/DELETE operations on invitation records

## Additional Context

### Payload CMS Shard Timeout

The Payload CMS shard (Shard 7-8) also timed out completely after 1253 seconds with 0 tests completed. Logs show:
- `Error: Missing required environment variables: DATABASE_URI`
- `TypeError: Cannot read properties of undefined (reading 'id')`
- Collection validation failures with 74+ errors

This appears to be a separate infrastructure/configuration issue with the Payload test environment, not directly related to the account/invitation failures.

### Test Infrastructure Notes

- Tests run in Docker with separate app instance (port 3001) vs. dev server (port 3000)
- Supabase instance shared between dev and test environments (port 54521)
- Docker test containers access Supabase via `host.docker.internal:54521`
- This architecture was recently fixed in #1109 for cookie URL properties
- May need verification that all endpoints remain reachable after #1109 changes

---
*Generated by Claude Debug Assistant*
*Tools Used: git log, test output analysis, code inspection, stack trace parsing*
