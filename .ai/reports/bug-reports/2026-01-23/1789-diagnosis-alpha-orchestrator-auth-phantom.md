# Bug Diagnosis: Alpha Orchestrator - Auth Failure and Phantom Completion Issues

**ID**: ISSUE-1789
**Created**: 2026-01-23T20:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Three interrelated issues were identified after running the Alpha Orchestrator on Spec S1692:

1. **Issue A - Authentication Failure**: Cannot login to the dev server with "The credentials entered are invalid" - test1@slideheroes.com and test2@slideheroes.com users are not seeded during orchestrator startup
2. **Issue B - Sign-in Error Logging**: Console shows `[Auth Debug] Sign-in error: {}` - empty error object due to serialization issue
3. **Issue C - Phantom Completion**: Features showing "phantom completion recovered" indicating task completion state mismatch

## Environment

- **Application Version**: Next.js 16.0.10 (Turbopack)
- **Environment**: E2B Sandbox (development)
- **Node Version**: Latest (E2B default)
- **Database**: Supabase Remote Sandbox
- **Orchestrator**: Alpha Spec Orchestrator v1 (spec-orchestrator.ts)
- **Spec ID**: S1692 (user-dashboard)

## Reproduction Steps

1. Run the Alpha Orchestrator: `tsx spec-orchestrator.ts 1692`
2. Wait for orchestration to complete
3. Attempt to login at the dev server URL with test1@slideheroes.com or test2@slideheroes.com
4. Observe authentication failure message

## Expected Behavior

- Test users (test1@slideheroes.com, test2@slideheroes.com) should exist in Supabase auth.users table
- Login should succeed with these credentials
- Features should transition cleanly from in_progress to completed

## Actual Behavior

- Test users do not exist in auth.users - only Payload CMS admin user is seeded
- Login fails with "Sorry, we could not authenticate you"
- Console shows error object that doesn't serialize properly (`{}`)
- Some features enter "phantom completion" state requiring recovery

## Diagnostic Data

### Console Output

```
[Auth Debug] Sign-in error: {}
    at Object.mutationFn (../../packages/supabase/src/hooks/use-sign-in-with-email-password.ts:33:13)
```

The empty `{}` in the error log indicates the Supabase AuthError object isn't serializing properly with `console.error()`.

### Database Analysis

**Payload seeding creates:**
- 1 user in `payload.users` table: `michael@slideheroes.com` (admin)

**E2E tests require (but not seeded by orchestrator):**
- `test1@slideheroes.com` in `auth.users`
- `test2@slideheroes.com` in `auth.users`

The orchestrator only seeds Payload CMS data via `pnpm run seed:run`, which creates users in the `payload.users` table (a Payload CMS-specific table). It does NOT create Supabase authentication users in the `auth.users` table.

### Phantom Completion Analysis

From `.ai/alpha/scripts/lib/work-queue.ts:510-537`:

```typescript
export function getPhantomCompletedFeatures(
  manifest: SpecManifest,
  busySandboxLabels: Set<string>,
): FeatureEntry[] {
  return manifest.feature_queue.filter((feature) => {
    // Must be in_progress to be phantom-completed
    if (feature.status !== "in_progress") return false;
    // Must have all tasks completed
    if (tasksCompleted < feature.task_count) return false;
    // Must not have an active sandbox working on it
    if (feature.assigned_sandbox && busySandboxLabels.has(feature.assigned_sandbox)) return false;
    return true;
  });
}
```

This occurs when:
1. Feature tasks all complete successfully
2. PTY session completes/times out
3. Manifest status update happens AFTER PTY completion detection
4. Race condition leaves `status="in_progress"` with `tasks_completed >= task_count`

From `spec-manifest.json` line 247:
```json
"error": "Stuck: 3 tasks remaining but sandbox idle for 332s"
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts:292-389` - `seedSandboxDatabase()` only seeds Payload
  - `.ai/alpha/scripts/lib/orchestrator.ts:444-518` - Phantom completion recovery
  - `packages/supabase/src/hooks/use-sign-in-with-email-password.ts:33-38` - Error logging
  - `apps/e2e/scripts/setup-test-users.js` - E2E test user creation (NOT called by orchestrator)
  - `apps/e2e/scripts/seed-test-users.sql` - SQL to create auth users

- **Recent Changes**: The orchestrator was recently refactored with event-driven architecture (Bug #1786)

## Root Cause Analysis

### Issue A - Authentication Failure

**Summary**: The orchestrator's database seeding only creates Payload CMS users, not Supabase auth users.

**Detailed Explanation**:
The `seedSandboxDatabase()` function in `.ai/alpha/scripts/lib/database.ts` runs:
1. `pnpm run payload migrate --forceAcceptWarning` - Applies Payload CMS migrations
2. `pnpm run seed:run --force` - Seeds Payload CMS collections

The Payload seed creates users in `payload.users` table (line 352-364), which is a CMS-specific table for content authors. However, user authentication is handled by Supabase auth (`auth.users` table), which requires separate user creation via:
- Supabase Admin API (`/auth/v1/admin/users`)
- Direct SQL to `auth.users` table

The E2E test suite has scripts for this (`apps/e2e/scripts/setup-test-users.js`), but the orchestrator does NOT call them.

**Supporting Evidence**:
- `apps/payload/src/seed/seed-data/users.json` only contains `michael@slideheroes.com`
- Orchestrator verifies seed with `SELECT COUNT(*) FROM payload.users` (line 353) - checks wrong table
- E2E tests use `test1@slideheroes.com` and `test2@slideheroes.com` from `auth.users`

### Issue B - Empty Error Object Logging

**Summary**: Supabase AuthError objects don't serialize to string properly with `console.error()`.

**Detailed Explanation**:
In `use-sign-in-with-email-password.ts:33-38`:
```typescript
console.error("[Auth Debug] Sign-in error:", {
  error: response.error,           // AuthError object
  message: response.error.message, // This works
  status: response.error.status,   // This works
  code: response.error.code,       // This works
});
```

The outer object containing `error: response.error` shows `{}` because `AuthError` likely doesn't have a proper `toJSON()` method, and Chrome's console serialization uses the object's enumerable properties which may not include internal fields.

### Issue C - Phantom Completion

**Summary**: Race condition between PTY completion detection and manifest status update.

**Detailed Explanation**:
The phantom completion occurs in this sequence:
1. Claude Code completes all tasks for a feature
2. PTY session detects completion via heartbeat/progress file
3. Feature `tasks_completed` is updated to match `task_count`
4. PTY exits before or during manifest save
5. `status` remains "in_progress" while `tasks_completed >= task_count`

The deadlock detection in `orchestrator.ts:444-518` catches and recovers these, but the root cause is the non-atomic update of task completion vs status transition.

**Confidence Level**: High

The code analysis clearly shows:
1. Missing auth user seeding path
2. Known JavaScript object serialization behavior
3. Non-atomic status updates in the completion flow

## Fix Approach (High-Level)

### Issue A - Add Supabase Auth User Seeding

Add a step after Payload seeding to create Supabase auth users:

```typescript
// In seedSandboxDatabase() after Payload seeding:
// Option 1: Run existing E2E script
await sandbox.commands.run(`node ${WORKSPACE_DIR}/apps/e2e/scripts/setup-test-users.js`);

// Option 2: Direct Supabase Admin API call
await createSupabaseAuthUsers(sandbox, ['test1@slideheroes.com', 'test2@slideheroes.com']);
```

### Issue B - Fix Error Logging

Change the error logging to properly serialize the AuthError:

```typescript
console.error("[Auth Debug] Sign-in error:", {
  message: response.error.message,
  status: response.error.status,
  code: response.error.code,
  name: response.error.name,
  // Don't include raw error object
});
```

### Issue C - Atomic Status Updates

The current recovery mechanism works, but to prevent phantom completions:

```typescript
// In feature completion handler - update atomically
feature.tasks_completed = completedCount;
if (completedCount >= feature.task_count) {
  feature.status = "completed"; // Set in same operation
}
saveManifest(manifest); // Single atomic save
```

## Additional Context

- The orchestrator completed S1692 successfully (19/19 features, 98/104 tasks)
- The "phantom completion recovered" message appears in orchestrator UI indicating the recovery mechanism is working
- The sandbox database URL uses remote Supabase sandbox project, not local Docker

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, code analysis*
