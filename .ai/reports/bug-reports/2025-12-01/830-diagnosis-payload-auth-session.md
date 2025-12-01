# Bug Diagnosis: Payload CMS E2E tests fail due to missing authentication state

**ID**: ISSUE-pending
**Created**: 2025-12-01T20:05:00.000Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Payload CMS E2E tests (shard 7) are failing with 90-second timeouts because tests expect to be on the admin dashboard but are actually on the login page. The root cause is that Payload tests rely on unreliable UI-based authentication in `beforeEach` hooks instead of using pre-authenticated storage states like the main app tests do. The `login()` method silently swallows errors, causing tests to proceed without authentication.

## Environment

- **Application Version**: Payload CMS 3.65.0
- **Environment**: development
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - issue may have always existed

## Reproduction Steps

1. Run E2E test shard 7: `pnpm --filter web-e2e test:shard7`
2. Observe tests timing out waiting for Save button
3. Check test screenshots - they show login page instead of admin dashboard

## Expected Behavior

Tests should be authenticated with Payload CMS admin before running CRUD operations. The test should navigate to `/admin/collections/posts/create` and see the post creation form with a Save button.

## Actual Behavior

Tests remain on the `/admin/login` page despite calling `loginPage.login()`. The test then tries to find the Save button (which doesn't exist on the login page) and times out after 90 seconds.

## Diagnostic Data

### Console Output
```
Running 43 tests using 4 workers
°········×××TT··T×F···········

Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]:has-text("Save")')
```

### Network Analysis
Login API works correctly:
```bash
curl -X POST "http://localhost:3021/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"aiesec1992"}'

# Returns: {"message":"Authentication Passed","token":"eyJ...","user":{...}}
```

### Screenshots
Test failure screenshot shows Payload CMS login page with Email/Password fields instead of the admin dashboard or post creation form.

## Error Stack Traces
```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]:has-text("Save")')

   at payload/pages/PayloadCollectionsPage.ts:150

    148 |
    149 | 	async saveItem() {
  > 150 | 		await this.saveButton.click();
          | 		                      ^
    151 | 		await this.expectToastMessage("successfully");
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/payload/pages/PayloadLoginPage.ts:41-52` - Login method that swallows errors
  - `apps/e2e/tests/payload/payload-collections.spec.ts:177-184` - beforeEach that calls login
  - `apps/e2e/tests/payload/pages/PayloadBasePage.ts:27` - Save button selector (correct, but page is wrong)
  - `apps/e2e/playwright.config.ts:116` - Storage state only for Supabase, not Payload

- **Recent Changes**: N/A - this appears to be a design flaw

- **Suspected Functions**:
  - `PayloadLoginPage.login()` - silently swallows timeout errors
  - `beforeEach` hooks - rely on unreliable UI authentication

## Related Issues & Context

### Historical Context
This issue reveals that Payload CMS tests have never used the same robust authentication pattern (pre-authenticated storage states) as the main app tests.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Payload CMS E2E tests use unreliable UI-based authentication that silently fails, leaving tests unauthenticated.

**Detailed Explanation**:

The issue stems from three interconnected problems:

1. **Silent Error Handling in `login()` method** (`PayloadLoginPage.ts:48-51`):
   ```typescript
   await Promise.race([
     this.page.waitForURL("**/admin", { timeout: 10000 }),
     this.errorMessage.waitFor({ state: "visible", timeout: 10000 }),
   ]).catch(() => {});  // <-- Swallows ALL errors including timeouts!
   ```
   When login fails or times out, the error is caught and ignored, allowing tests to proceed without authentication.

2. **No Pre-authenticated Storage State for Payload**:
   The main app tests use `storageState: ".auth/test1@slideheroes.com.json"` which contains pre-authenticated Supabase sessions. However, Payload CMS uses its own JWT-based auth system on port 3021, and there's no equivalent pre-authenticated state for Payload admin.

3. **UI-based Login is Unreliable**:
   Each test calls `loginPage.login()` in `beforeEach`, which:
   - Navigates to login page
   - Fills email/password
   - Clicks login button
   - Waits for redirect OR error (but swallows failures)

   This is prone to race conditions, timing issues, and silent failures.

**Supporting Evidence**:
- Test screenshot shows login page: `test-results/payload-payload-collection-d1536-ns-should-create-a-new-post-chromium/test-failed-1.png`
- Error context shows page elements: Email input, Password input, Login button - NOT the admin dashboard
- Login API works when called directly via curl (returns valid JWT)
- The Save button selector `button[type="submit"]:has-text("Save")` is correct - but that button doesn't exist on the login page

### How This Causes the Observed Behavior

1. Test starts → `beforeEach` calls `loginPage.login()`
2. `login()` navigates to `/admin/login`, fills form, clicks submit
3. Something causes the redirect to fail (timing, cookies, etc.)
4. `Promise.race` times out after 10s
5. `.catch(() => {})` swallows the timeout error
6. Test proceeds thinking it's logged in
7. `navigateToCollection("posts")` goes to `/admin/collections/posts`
8. Payload redirects unauthenticated user to `/admin/login`
9. Test tries to find `createNewButton` or navigate to create page
10. Test tries to click Save button which doesn't exist on login page
11. Test times out after 90s waiting for Save button

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Screenshot definitively shows login page, not admin dashboard
2. The `.catch(() => {})` pattern guarantees errors are swallowed
3. Login API works correctly, so credentials are valid
4. No Payload-specific storage state exists in the auth setup
5. The Save button selector is correct - the problem is being on the wrong page

## Fix Approach (High-Level)

1. **Create Payload-specific storage state**: Add Payload admin authentication to `global-setup.ts`:
   - Login to Payload via API
   - Save Payload JWT cookie to a separate storage state file (e.g., `.auth/payload-admin.json`)
   - Configure Payload tests to use this storage state

2. **Fix error handling in `login()` method**: Remove the silent `.catch(() => {})` or at minimum log failures:
   ```typescript
   await Promise.race([...]).catch((error) => {
     throw new Error(`Login failed: ${error.message}`);
   });
   ```

3. **Add authentication verification**: Add a check after login to verify user is actually authenticated before proceeding:
   ```typescript
   const isAuth = await this.checkAuthenticationState();
   if (!isAuth) throw new Error('Login did not succeed');
   ```

## Diagnosis Determination

The root cause has been definitively identified: Payload CMS E2E tests fail because the `login()` method silently swallows authentication failures via `.catch(() => {})`, and there is no pre-authenticated storage state for Payload admin sessions. This results in tests running against the login page instead of the authenticated admin dashboard.

The fix requires implementing Payload-specific authentication in global setup (similar to how Supabase auth is handled) and removing the silent error swallowing in the login method.

## Additional Context

- The main app tests work correctly because they use pre-authenticated Supabase storage states
- Payload CMS uses its own JWT-based authentication separate from Supabase
- The test infrastructure correctly starts Payload on port 3021 and verifies it's healthy
- All 43 tests in shard 7 are affected by this authentication issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (curl), Grep, Screenshot analysis*
