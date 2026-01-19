# Bug Diagnosis: E2E Sharded Tests Fail Due to Missing Test Users (db reset --no-seed)

**ID**: ISSUE-1602
**Created**: 2026-01-19T19:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The e2e-sharded workflow is failing because `supabase db reset --no-seed` runs database migrations without seeding test users. The E2E tests require pre-existing test users (`test1@slideheroes.com`, etc.) to authenticate, but these users don't exist after a no-seed reset.

## Environment

- **Application Version**: dev branch
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL via Supabase local
- **Last Working**: Unknown - issue may have been present since recent workflow changes

## Reproduction Steps

1. Trigger the e2e-sharded workflow (PR or manual dispatch)
2. Setup Test Server job completes successfully
3. Each E2E shard runs `supabase db reset --no-seed`
4. Tests attempt to login with `test1@slideheroes.com`
5. Authentication fails because user doesn't exist in database
6. Tests fail with "Expected URL to match /home|onboarding/ but got /auth/sign-in"

## Expected Behavior

- Test users should exist in the database before E2E tests run
- Authentication should succeed with test credentials
- Tests should proceed to authenticated areas of the application

## Actual Behavior

- `supabase db reset --no-seed` clears all data including any seeded users
- No test users exist after reset
- Login attempts fail silently (no redirect to home/onboarding)
- Tests fail asserting URL should match `/home|onboarding/` but stays at `/auth/sign-in`

## Diagnostic Data

### Console Output
```
E2E Shard 2 logs:
supabase db reset --no-seed || true
Finished supabase db reset on branch dev.
...
[loginAsUser] Waiting for DOM content loaded to ensure page is ready...
...
Error: expect(received).toMatch(expected)
Expected pattern: /\/(home|onboarding)/
Received string:  "http://localhost:3001/auth/sign-in"
```

### Related Code

**Workflow file** `.github/workflows/e2e-sharded.yml:238`:
```yaml
# Run migrations
supabase db reset --no-seed || true
```

**Test users expected** `apps/e2e/tests/helpers/test-users.ts:12`:
```typescript
export const TEST_USERS = {
  user1: {
    email: "test1@slideheroes.com",
    password: "aiesec1992",
    id: "31a03e74-1639-45b6-bfa7-77447f1a4762",
    ...
  },
```

**Seed file has different users** `apps/web/supabase/seed.sql:51`:
```sql
INSERT INTO "auth"."users" ...
'test@makerkit.dev', -- Not test1@slideheroes.com!
```

## Related Issues & Context

### Direct Predecessors
- #1570: Added webServer config to Playwright configs
- #1583: Diagnosed dev server timeout issue
- #1584: Fixed by switching to production server (start:test)

### Similar Symptoms
- Authentication tests fail silently
- URL assertions fail expecting authenticated state

### Historical Context
The workflow was recently modified (commit 3f9292a8d on Jan 16) to add webServer configs. The `--no-seed` flag may have been added to speed up database resets, but this broke the test user setup.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The workflow runs `supabase db reset --no-seed` which applies migrations but does not seed test users, causing all authentication-dependent tests to fail.

**Detailed Explanation**:
1. The e2e-sharded workflow calls `supabase db reset --no-seed` in each shard
2. The `--no-seed` flag explicitly skips running `seed.sql`
3. Even if seed.sql ran, it creates users with `@makerkit.dev` emails, not `@slideheroes.com`
4. The E2E tests expect `test1@slideheroes.com` user to exist
5. There's an `ensureTestUser()` function in `test-users.ts` but it's never called
6. Without the test users, authentication fails silently
7. Tests remain on `/auth/sign-in` instead of being redirected to `/home` or `/onboarding`

**Supporting Evidence**:
- Log: `supabase db reset --no-seed || true` - explicitly skips seeding
- Log: `Expected pattern: /\/(home|onboarding)/ Received string: "http://localhost:3001/auth/sign-in"` - user not logged in
- Code: `test-users.ts` defines `test1@slideheroes.com` but `seed.sql` has `test@makerkit.dev`
- Code: `setupTestUsers()` exists but is never called in workflow or global-setup

### How This Causes the Observed Behavior

1. Workflow starts Supabase and runs migrations
2. `db reset --no-seed` clears the database - no users exist
3. Tests call `loginAsUser()` with `test1@slideheroes.com` credentials
4. Supabase auth returns error (user doesn't exist) but test doesn't fail explicitly
5. Browser stays on sign-in page instead of redirecting
6. Test assertion `expect(currentUrl).toMatch(/\/(home|onboarding)/)` fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- The log clearly shows `--no-seed` flag is used
- The test failure message shows authentication didn't succeed (URL stayed at sign-in)
- The code analysis shows test users are expected but not created
- Shard 1 (smoke tests) passes because it doesn't require authentication
- Shards 2+ (auth-dependent tests) all fail

## Fix Approach (High-Level)

Two options:

**Option A (Recommended)**: Call `setupTestUsers()` before running tests
- Add a step in the workflow to run `pnpm --filter web-e2e exec ts-node tests/helpers/test-users.ts`
- Or call `setupTestUsers()` in `global-setup.ts` before authentication

**Option B**: Remove `--no-seed` flag and update seed.sql
- Change to `supabase db reset` (with seed)
- Update `seed.sql` to include `test1@slideheroes.com` users with correct passwords

Option A is preferred because it uses the admin API to create users with the correct password hashes, while Option B relies on pre-computed bcrypt hashes.

## Diagnosis Determination

The root cause has been definitively identified: the combination of `--no-seed` flag and missing call to `setupTestUsers()` means no test users exist when E2E tests run, causing all authentication-dependent tests to fail.

## Additional Context

- Shard 7 (Payload tests) has an additional issue: `Error: cannot connect to Postgres: The server does not support SSL connections` - this is a separate issue related to Payload's database connection
- The workflow has a `|| true` after db reset which masks failures, making debugging harder

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run view, API calls), Grep, Read, Glob*
