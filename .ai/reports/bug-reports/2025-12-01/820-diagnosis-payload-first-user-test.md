# Bug Diagnosis: Payload "should create first user" test fails when admin user exists

**ID**: ISSUE-820
**Created**: 2025-12-01T18:25:00Z
**Reporter**: user/system
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test `"should create first user successfully"` in `payload-auth.spec.ts` fails because it expects to create a new first user when no users exist, but the test environment already has `michael@slideheroes.com` seeded as the admin user. The test design is incompatible with the pre-existing database state.

## Environment

- **Application Version**: Current (dev branch)
- **Environment**: development (local E2E test environment)
- **Browser**: Chromium (Playwright)
- **Node Version**: LTS
- **Database**: PostgreSQL (Payload CMS database)
- **Last Working**: Unknown - may have always had this issue

## Reproduction Steps

1. Start the local development environment with Payload CMS seeded data
2. Run `/test 7` to execute Payload CMS E2E tests (shard 7)
3. Observe the test `"should create first user successfully"` fails

## Expected Behavior

The test should successfully create a first user in a clean Payload CMS database OR the test should be designed to handle the case when an admin user already exists.

## Actual Behavior

The test fails because:
1. It navigates to `/admin/login`
2. It looks for the "Create First User" button (only visible when no users exist)
3. Since `michael@slideheroes.com` already exists, the button is hidden
4. The fallback logic tries to login with dynamically-generated credentials that don't exist
5. Login fails, causing the test to fail

## Diagnostic Data

### Console Output
```
Running 42 tests using 3 workers
```

Test execution proceeds but the "should create first user" test fails due to user existence check.

### Network Analysis
```
N/A - Issue is with test design, not network
```

### Database Analysis
```
The Payload CMS database has michael@slideheroes.com pre-seeded as admin user.
TEST_USERS.admin.email defaults to "michael@slideheroes.com" in test-data.ts
```

### Performance Metrics
```
N/A - Not a performance issue
```

## Error Stack Traces
```
Test fails during the createFirstUser() call which falls back to login()
when the "Create First User" button is not visible (because user already exists).
The login attempt fails because the test uses dynamic email: admin-${Date.now()}@test.com
which doesn't exist in the database.
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/payload/payload-auth.spec.ts:25-38` - The failing test
  - `apps/e2e/tests/payload/pages/PayloadLoginPage.ts:54-85` - The `createFirstUser()` method
  - `apps/e2e/tests/payload/helpers/test-data.ts:1-11` - TEST_USERS with michael@slideheroes.com
  - `apps/e2e/tests/payload/global-setup.ts:50-88` - Global setup that creates admin user

- **Recent Changes**: No recent changes to these files appear to be the cause
- **Suspected Functions**:
  - `PayloadLoginPage.createFirstUser()` - Falls back to login with wrong credentials
  - Test at line 25 - Uses dynamic email that doesn't match any seeded user

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a new diagnosis.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
This test appears to have been designed for a clean database state (no users) but is running against a seeded development database.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test `"should create first user successfully"` uses a dynamically-generated email (`admin-${Date.now()}@test.com`) and expects the "Create First User" button to be visible, but the database already contains `michael@slideheroes.com` as an admin, so the button is hidden and the fallback login fails with nonexistent credentials.

**Detailed Explanation**:

The test at `payload-auth.spec.ts:25-38`:
```typescript
test("should create first user successfully", async ({ page }) => {
    const testEmail = `admin-${Date.now()}@test.com`;  // Dynamic, doesn't exist
    const testPassword = "Test123!@#";
    const testName = "Test Admin";

    await loginPage.createFirstUser(testEmail, testPassword, testName);
    await loginPage.expectLoginSuccess();
    await expect(page).toHaveURL(/.*\/admin(?!\/login)/);
});
```

The `createFirstUser()` method in `PayloadLoginPage.ts:54-85`:
```typescript
async createFirstUser(email: string, password: string, name: string = "Admin User") {
    await this.navigateToLogin();

    // Check if first user setup is needed
    const needsFirstUser = await this.createFirstUserButton
        .isVisible({ timeout: 5000 })
        .catch(() => false);

    if (needsFirstUser) {
        // ... create first user via UI ...
    } else {
        // First user already exists, just login
        await this.login(email, password);  // FAILS: email doesn't exist!
    }
}
```

The problem:
1. `michael@slideheroes.com` is seeded in the database (from `TEST_USERS.admin.email`)
2. When the test runs, `needsFirstUser` is `false` because a user exists
3. The `else` block calls `login()` with `admin-${Date.now()}@test.com`
4. This user doesn't exist, so login fails
5. The test assertion `expectLoginSuccess()` fails

**Supporting Evidence**:
- `apps/e2e/tests/payload/helpers/test-data.ts:6`: `email: "michael@slideheroes.com"` (default admin)
- `apps/e2e/tests/payload/global-setup.ts:58-85`: Creates admin user if needed during setup
- User report confirms: "Expects no users exist, but michael@slideheroes.com already exists"

### How This Causes the Observed Behavior

1. Test environment starts with seeded database containing `michael@slideheroes.com`
2. Test attempts to use `createFirstUser()` with a brand new dynamic email
3. Method detects existing user, falls back to login instead of creating
4. Login fails because the dynamic email doesn't exist as a user
5. `expectLoginSuccess()` assertion fails

### Confidence Level

**Confidence**: High

**Reasoning**: The code flow is deterministic and clearly shows that when an admin user exists, the fallback login path is taken with credentials that don't match any database user. This is the only possible outcome given the current code and database state.

## Fix Approach (High-Level)

Two possible approaches:

**Option A (Preferred)**: Redesign the test to be idempotent:
- If "Create First User" button is visible, create a new user and verify success
- If a user already exists (button not visible), skip the test with `test.skip()` or mark it as passed since first-user creation is not applicable

**Option B**: Reset database before this specific test:
- Use a test hook to delete all Payload users before running this test
- This is more fragile and slower but tests the actual first-user flow

**Option C**: Remove or rename the test:
- If first-user creation is handled by global setup, this test may be redundant
- Consider renaming to "should handle first user flow or skip if user exists"

## Diagnosis Determination

The root cause is a **test design flaw** where the test assumes a clean database state (no users) but runs against a pre-seeded environment. The `createFirstUser()` method's fallback logic attempts to login with credentials that don't exist, causing the test to fail.

This is not a product bug but a test reliability issue. The fix should update the test logic to handle both scenarios (clean database and seeded database) gracefully.

## Additional Context

- The global setup at `apps/e2e/tests/payload/global-setup.ts` already handles first-user creation, making this test potentially redundant
- Other tests in the same file (like "should login with existing user") are designed to handle both scenarios

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Glob, Read, BashOutput for test log analysis*
