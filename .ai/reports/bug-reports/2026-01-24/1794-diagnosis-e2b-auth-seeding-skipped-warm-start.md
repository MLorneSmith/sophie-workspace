# Bug Diagnosis: E2B Sandbox Auth User Seeding Skipped on Warm Start

**ID**: ISSUE-1794
**Created**: 2026-01-24T16:45:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When the Alpha Orchestrator detects a "warm start" (database already has Payload CMS users), it skips the entire database seeding step - including Supabase auth user creation. This causes login failures on the E2B dev server because the `auth.users` table is empty while `payload.users` has data.

## Environment

- **Application Version**: Current dev branch
- **Environment**: E2B sandbox (development)
- **Node Version**: 20.x (E2B sandbox)
- **Database**: PostgreSQL via Supabase (sandbox project: kdjbbhjgogqywtlctlzq)
- **Last Working**: N/A (design flaw in warm start optimization)

## Reproduction Steps

1. Run the Alpha Orchestrator: `tsx spec-orchestrator.ts 1692`
2. Wait for orchestration to complete (all 19 features, S1692 spec)
3. Navigate to the E2B dev server URL: `https://3000-<sandbox-id>.e2b.app`
4. Attempt to sign in with test credentials: `test1@slideheroes.com` / `aiesec1992`
5. Observe sign-in failure

## Expected Behavior

Login should succeed with seeded test user credentials (`test1@slideheroes.com`, `test2@slideheroes.com`, `michael@slideheroes.com`).

## Actual Behavior

Login fails with empty error object logged:
```
[Auth Debug] Sign-in error: {}
```

The actual error is "Invalid login credentials" because no users exist in `auth.users`.

## Diagnostic Data

### Database State Analysis

```sql
SELECT 'payload.users' as table_name, COUNT(*) as count FROM payload.users
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

  table_name   | count
---------------+-------
 payload.users |     1
 auth.users    |     0
(2 rows)
```

**Key finding**: Payload CMS users exist (1), but Supabase auth users are missing (0).

### Console Output

```
[Auth Debug] Sign-in error: {}

at Object.mutationFn (../../packages/supabase/src/hooks/use-sign-in-with-email-password.ts:33:13)
```

The error object logs as `{}` because Supabase's `AuthError` has non-enumerable properties. The actual error message is "Invalid login credentials" because `auth.users` is empty.

### Orchestrator Logs

From `.ai/alpha/progress/overall-progress.json`:
- Spec S1692 completed successfully (19/19 features)
- All tasks completed (104/104)
- Branch: `alpha/spec-S1692`

No auth seeding logs appear in the sandbox logs because the entire seeding step was skipped.

## Error Stack Traces

```
Error: Invalid login credentials
    at Object.mutationFn (../../packages/supabase/src/hooks/use-sign-in-with-email-password.ts:33:13)
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts` - Contains `seedSandboxDatabase()` and `isDatabaseSeeded()`
  - `.ai/alpha/scripts/lib/orchestrator.ts` - Warm start optimization logic

- **Recent Changes**: Commit `19142fbef` added auth user seeding to `seedSandboxDatabase()`, but this is bypassed on warm starts

- **Suspected Functions**:
  - `isDatabaseSeeded()` - Only checks `payload.users`, not `auth.users`
  - `orchestrate()` lines 1807-1827 - Skips entire seeding when `databaseAlreadySeeded = true`

## Related Issues & Context

### Direct Predecessors
- #1790 (CLOSED): "Bug Fix: Alpha Orchestrator - Auth User Seeding Missing" - Added auth seeding to `seedSandboxDatabase()`, but didn't account for warm start optimization
- #1789 (CLOSED): "Bug Diagnosis: Alpha Orchestrator - Auth User Seeding Missing" - Original diagnosis that led to #1790

### Similar Symptoms
- #1602 (CLOSED): "E2E Sharded Tests Fail Due to Missing Test Users" - Same symptom (missing auth users), different cause
- #1685 (CLOSED): "E2E Shards Fail - Super-Admin User Not Created" - Related auth user creation issue

### Historical Context
The warm start optimization (PR #1707) was added to speed up orchestrator restarts by skipping seeding when `payload.users` has data. However, the auth user seeding was added later (#1790) inside `seedSandboxDatabase()`, creating this regression where auth users are never created on warm starts.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The warm start optimization checks only `payload.users` to determine if seeding is needed, causing `auth.users` seeding to be skipped entirely when the database is detected as "already seeded".

**Detailed Explanation**:

1. **isDatabaseSeeded() check** (database.ts:692-718):
   ```typescript
   // Only checks payload.users - NOT auth.users
   const result = execSync(
     `psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users"`,
   );
   return count > 0;  // Returns true if any Payload users exist
   ```

2. **Warm start optimization** (orchestrator.ts:1598-1614):
   ```typescript
   databaseAlreadySeeded = await isDatabaseSeeded(options.ui);
   if (databaseAlreadySeeded) {
     log("   ✅ Database already seeded (warm start detected)");
   }
   ```

3. **Seeding skip** (orchestrator.ts:1807-1827):
   ```typescript
   if (databaseAlreadySeeded) {
     log("   ℹ️ Database already seeded, skipping seeding step");
     // Auth seeding is INSIDE seedSandboxDatabase() - never called!
   } else if (firstInstance) {
     await seedSandboxDatabase(firstInstance.sandbox, options.ui);
   }
   ```

4. **Auth seeding location** (database.ts:350-404):
   ```typescript
   // Auth seeding is Step 3 INSIDE seedSandboxDatabase()
   // When seedSandboxDatabase() is skipped, auth users are never created
   log("   👤 Creating Supabase auth test users...");
   await sandbox.commands.run(
     `node apps/e2e/scripts/setup-test-users.js`,
   );
   ```

**The causal chain**:
1. First orchestration run seeds Payload users (via Payload migrations/seed)
2. First run creates auth users (via setup-test-users.js inside seedSandboxDatabase)
3. Database reset happens (resets public schema but not auth schema)
4. Second run: `isDatabaseSeeded()` sees 1 Payload user → returns true
5. Second run: `databaseAlreadySeeded = true` → skips `seedSandboxDatabase()` entirely
6. Auth users from previous run are gone (auth schema was reset or users were deleted)
7. Login fails because `auth.users` is empty

**Supporting Evidence**:
- Database query shows `payload.users = 1`, `auth.users = 0`
- No auth seeding logs in orchestrator output
- Login fails with "Invalid login credentials"

### How This Causes the Observed Behavior

1. User navigates to sign-in page on E2B dev server
2. User enters `test1@slideheroes.com` / `aiesec1992`
3. Client calls Supabase `signInWithPassword()`
4. Supabase checks `auth.users` table - no matching user found
5. Supabase returns "Invalid login credentials" error
6. Error is caught by `use-sign-in-with-email-password.ts` and logged
7. Error object appears as `{}` in console due to non-enumerable properties

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Direct database evidence: `auth.users = 0` confirms users are missing
2. Code path confirmed: `isDatabaseSeeded()` only checks `payload.users`
3. Logic is clear: warm start skips entire `seedSandboxDatabase()` which contains auth seeding
4. Same pattern caused #1602 (E2E missing test users) in a different context

## Fix Approach (High-Level)

**Option A (Recommended)**: Modify `isDatabaseSeeded()` to check BOTH `payload.users` AND `auth.users`. Only return true if both have expected data.

```typescript
// Check both Payload users AND auth users
const payloadResult = execSync(`SELECT COUNT(*) FROM payload.users`);
const authResult = execSync(`SELECT COUNT(*) FROM auth.users WHERE email LIKE 'test%@slideheroes.com'`);
return payloadCount > 0 && authCount >= 2;
```

**Option B**: Extract auth seeding from `seedSandboxDatabase()` into a separate function that always runs, regardless of warm start status.

```typescript
// In orchestrator.ts - always seed auth users
await seedAuthUsers(firstInstance.sandbox, options.ui);

// Only run Payload seeding on cold start
if (!databaseAlreadySeeded) {
  await seedPayloadDatabase(firstInstance.sandbox, options.ui);
}
```

Option A is simpler and maintains the existing code structure. Option B is more architecturally clean but requires more refactoring.

## Diagnosis Determination

The root cause is definitively identified: The warm start optimization in `isDatabaseSeeded()` checks only `payload.users` table, causing auth user seeding to be skipped when the orchestrator detects existing Payload data. This is a design oversight introduced when auth seeding (#1790) was added to a function that can be bypassed by the warm start optimization (#1707).

The fix is straightforward: either expand the `isDatabaseSeeded()` check to include `auth.users`, or extract auth seeding into a separate always-run function.

## Additional Context

**Related PRs/Commits**:
- `19142fbef` - "seed Supabase auth users in orchestrator database setup" (added auth seeding)
- PR #1707 - Startup optimization that added warm start detection

**Test Users Expected**:
- `test1@slideheroes.com` / `aiesec1992`
- `test2@slideheroes.com` / `aiesec1992`
- `michael@slideheroes.com` / `aiesec1992` (super-admin)

---
*Generated by Claude Debug Assistant*
*Tools Used: psql database queries, git log, gh issue search, code analysis*
