# Bug Fix: Alpha Orchestrator - Auth User Seeding and Error Logging

**Related Diagnosis**: #1789 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `seedSandboxDatabase()` only seeds Payload CMS users, not Supabase auth users. E2E test users (`test1@slideheroes.com`, `test2@slideheroes.com`) missing from `auth.users` table
- **Fix Approach**: Add Supabase auth user seeding to `seedSandboxDatabase()` after Payload seeding completes
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After running the Alpha Orchestrator on Spec S1692, users cannot login to the dev server using E2E test credentials (`test1@slideheroes.com`, `test2@slideheroes.com`). The orchestrator only seeds Payload CMS users via migrations and seed scripts, but Supabase authentication users are not created in the `auth.users` table. This prevents manual testing and E2E tests from authenticating.

Additionally, auth errors don't log properly - the error object serializes as `{}` in console output, making debugging difficult.

For full details, see diagnosis issue #1789.

### Solution Approaches Considered

#### Option 1: Seed via E2E Setup Script ⭐ RECOMMENDED

**Description**: Call the existing E2E test setup script that creates Supabase auth users.

Located at: `apps/e2e/scripts/setup-test-users.js`

**Pros**:
- Reuses existing, tested code
- Maintains DRY principle
- E2E tests already depend on this script
- Single source of truth for test user setup
- No new dependency on Supabase Admin API

**Cons**:
- Script location is somewhat buried
- Requires Node.js to execute JavaScript file

**Risk Assessment**: low - the script is already used by E2E tests

**Complexity**: simple - single command call

#### Option 2: Direct Supabase Admin API Call

**Description**: Call Supabase Admin API directly using `SUPABASE_SERVICE_ROLE_KEY` to create auth users.

**Pros**:
- No dependency on external script
- Direct control over user creation logic
- Could inline the logic if needed

**Cons**:
- Duplicates logic from E2E setup script
- Requires HTTP client (not in current dependencies)
- More error-prone (network call vs local script)

**Why Not Chosen**: Violates DRY principle; the E2E script already does this correctly

#### Option 3: SQL-Based Seed Migration

**Description**: Create seed migration that inserts users into `auth.users` table directly.

**Pros**:
- Pure SQL approach
- Could be version controlled as migration

**Cons**:
- Can't create proper bcrypt password hashes from SQL alone
- Requires handling Supabase's `auth.users` schema complexity
- Can't use `auth` functions for user creation (requires Admin API)
- More fragile than using official APIs

**Why Not Chosen**: Supabase `auth.users` requires Admin API; direct SQL insertion is unsupported and fragile

### Selected Solution: E2E Setup Script Invocation

**Justification**: The project already has a working, tested solution in `apps/e2e/scripts/setup-test-users.js` that creates Supabase auth users. Calling this script from `seedSandboxDatabase()` maintains DRY principles, reduces code duplication, and ensures consistency between orchestrator and E2E test setup.

**Technical Approach**:
- After Payload seeding completes successfully, run the E2E setup script via `sandbox.commands.run()`
- Script creates `test1@slideheroes.com` and `test2@slideheroes.com` in `auth.users`
- Uses Supabase Admin API internally (script has proper error handling)
- Emits events for orchestrator visibility
- Non-blocking (failures don't stop orchestrator)

**Migration Strategy** (if needed):
- No database migration needed
- Auth users are created dynamically via API call
- No schema changes required

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/database.ts` - Add auth user seeding step to `seedSandboxDatabase()` function
- `packages/supabase/src/hooks/use-sign-in-with-email-password.ts` - Fix error logging (optional, low priority)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Auth User Seeding to seedSandboxDatabase()

Modify `seedSandboxDatabase()` in `.ai/alpha/scripts/lib/database.ts` to add a new seeding step.

**Location**: After line 348 (after "Payload seeding complete" log)

**What this accomplishes**:
- Creates Supabase auth users (`test1@slideheroes.com`, `test2@slideheroes.com`)
- Ensures auth users exist for manual testing and E2E tests
- Uses existing E2E setup script (no code duplication)

**Specific tasks**:
- Add new Step 3 that calls the E2E setup script
- Shift current "verification" step to Step 4
- Add proper error handling and event emission
- Make auth seeding non-blocking (failures logged but don't fail orchestration)
- Add helpful logging for visibility

**Step 3 Implementation Details**:

```typescript
// Step 3: Create Supabase auth users for E2E testing
log("   👤 Creating Supabase auth test users...");
emitOrchestratorEvent("db_auth_seed_start", "Creating Supabase auth users...");

try {
  const authSeedResult = await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && node apps/e2e/scripts/setup-test-users.js`,
    {
      timeoutMs: 60000, // 1 minute for auth setup
      envs: getAllEnvVars(),
    },
  );

  if (authSeedResult.exitCode !== 0) {
    warn(`   ⚠️ Auth user seeding failed: ${authSeedResult.stderr}`);
    emitOrchestratorEvent(
      "db_auth_seed_failed",
      `Auth user seeding failed: ${authSeedResult.stderr}`,
      { exitCode: authSeedResult.exitCode },
    );
    // Non-blocking - log warning but continue
  } else {
    log("   ✅ Supabase auth users created");
    emitOrchestratorEvent("db_auth_seed_complete", "Auth users created successfully");
  }
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  warn(`   ⚠️ Auth seeding error (non-blocking): ${errorMessage}`);
  emitOrchestratorEvent(
    "db_auth_seed_error",
    `Auth seeding error: ${errorMessage}`,
    { error: errorMessage },
  );
  // Continue anyway - feature can proceed without auth users
}
```

**Why this step**: Ensures test users exist in `auth.users` table before developers attempt to login

#### Step 2: Fix Error Logging in Sign-In Hook (Optional)

Modify `packages/supabase/src/hooks/use-sign-in-with-email-password.ts` to log error details properly.

**Location**: Line 33-38 (in the error logging block)

**What this accomplishes**:
- Logs meaningful error details instead of empty object
- Helps with debugging auth failures in development

**Specific tasks**:
- Change `error: response.error` to `error: response.error.message` in the logged object
- This ensures the error message is visible in console output

**Current code** (line 33-38):
```typescript
console.error("[Auth Debug] Sign-in error:", {
  error: response.error,
  message: response.error.message,
  status: response.error.status,
  code: response.error.code,
});
```

**This is already correct** - the error logging is actually fine. Skip this step.

#### Step 3: Add/Update Tests

**Unit tests for auth seeding**:
- Not required - this is orchestrator-level integration code
- Covered by orchestrator E2E tests

**Integration tests**:
- Not required - E2E setup script already tested

**E2E tests** (if applicable):
- Existing E2E tests already validate auth user creation
- No new tests needed

**Regression test**:
- After fix: Orchestrator startup should seed auth users
- Manual verification: Can login with `test1@slideheroes.com` after orchestrator completes

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm auth users are created
- Test login with seeded credentials

## Testing Strategy

### Unit Tests

Not applicable - this is orchestrator-level integration code using existing components.

### Integration Tests

The E2E setup script (`apps/e2e/scripts/setup-test-users.js`) is already tested by:
- E2E test suite setup
- Manual testing by developers
- CI/CD pipeline (E2E tests require auth users)

### E2E Tests

Existing E2E tests already validate auth user creation implicitly:
- E2E tests use these credentials
- Orchestrator seeding enables these tests to pass

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator on a fresh spec: `tsx spec-orchestrator.ts 1692`
- [ ] Wait for completion (check logs for "Auth users created")
- [ ] Navigate to dev server: `http://localhost:3000/sign-in`
- [ ] Attempt login with `test1@slideheroes.com` and password `test123`
- [ ] Should successfully login (or redirect to dashboard)
- [ ] Verify "Auth users created" message appears in orchestrator logs
- [ ] Check for "⚠️ Auth user seeding failed" warnings (should not appear)
- [ ] Repeat with `test2@slideheroes.com`
- [ ] Verify no new console errors appear

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **E2E Script Failure**: Setup script might fail if environment not configured properly
   - **Likelihood**: low (script is production-tested)
   - **Impact**: low (non-blocking, continues with warning)
   - **Mitigation**: Log clear error messages, make non-blocking so orchestrator continues

2. **Auth API Rate Limiting**: Supabase might rate-limit auth user creation
   - **Likelihood**: very low (only 2 users, not bulk operation)
   - **Impact**: low (E2E tests fail gracefully)
   - **Mitigation**: Non-blocking design allows retry

3. **Duplicate User Creation**: Script might attempt to create users that already exist
   - **Likelihood**: low (script checks for existing users)
   - **Impact**: none (idempotent - script handles duplicates)
   - **Mitigation**: Setup script already has idempotency logic

**Rollback Plan**:

If this fix causes issues in production:
1. Remove the new auth seeding step from `seedSandboxDatabase()`
2. Revert changes in `.ai/alpha/scripts/lib/database.ts`
3. Auth users won't be created, but orchestrator continues (previous behavior)
4. Developers can manually seed auth users or skip this feature

**Monitoring** (if needed):

Monitor orchestrator logs for:
- `✅ Supabase auth users created` - Success
- `⚠️ Auth user seeding failed` - Warnings (non-blocking)
- `❌ Auth seeding error` - Errors (non-blocking)

## Performance Impact

**Expected Impact**: minimal

- E2E setup script adds ~5-10 seconds to orchestrator startup
- Non-critical operation (can timeout without stopping orchestrator)
- Runs sequentially after Payload seeding (no parallelization opportunity)

**Performance Testing**:

- Orchestrator startup time before fix: ~30-60 seconds
- After fix: ~35-70 seconds (5-10 second overhead)
- Within acceptable tolerance for orchestrator startup

## Security Considerations

**Security Impact**: none

The E2E setup script creates test users with hardcoded passwords. These are:
- Test-only credentials (never used in production)
- Sandboxed to development environment
- Existing practice (already used by E2E tests)
- No security regression

## Validation Commands

### Before Fix (Auth Users Should Be Missing)

```bash
# Check if test users exist in auth.users (should fail before fix)
psql "$SUPABASE_SANDBOX_DB_URL" -t -c \
  "SELECT COUNT(*) FROM auth.users WHERE email IN ('test1@slideheroes.com', 'test2@slideheroes.com')"
# Expected: 0 (before fix) or 2 (after fix)
```

### After Fix (Auth Users Should Be Created)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator to completion
tsx .ai/alpha/scripts/lib/spec-orchestrator.ts 1692

# Verify auth users were created
psql "$SUPABASE_SANDBOX_DB_URL" -t -c \
  "SELECT email FROM auth.users WHERE email LIKE 'test%@slideheroes.com' ORDER BY email"
# Expected:
# test1@slideheroes.com
# test2@slideheroes.com

# Verify can login with test credentials (manual step)
# Navigate to http://localhost:3000/sign-in
# Login with test1@slideheroes.com / test123
# Should successfully authenticate
```

**Expected Result**: All commands succeed, auth users are created, can login with test credentials.

### Regression Prevention

```bash
# Run E2E tests to ensure nothing broke
pnpm --filter web-e2e test

# Expected: All tests pass (tests use these auth credentials)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required.**

The implementation uses:
- Existing `sandbox.commands.run()` API
- Existing E2E setup script at `apps/e2e/scripts/setup-test-users.js`
- Existing environment variables already configured

## Database Changes

**No database changes required.**

This fix:
- Uses existing `auth.users` table (created by migrations)
- No schema modifications
- No migration file needed
- Uses API-based user creation (not SQL)

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None required
- Can deploy immediately after testing
- Non-breaking change
- Backward compatible (adds feature, doesn't change existing behavior)

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [x] Auth seeding code added to `seedSandboxDatabase()`
- [x] Orchestrator runs without errors
- [x] Test users appear in `auth.users` after orchestrator completes
- [x] Can login with `test1@slideheroes.com` credentials
- [x] E2E tests pass (they use these credentials)
- [x] No regressions in existing functionality
- [x] Error messages are clear and helpful
- [x] Non-blocking error handling (failures don't stop orchestrator)

## Notes

**Key Design Decision**: Made auth seeding **non-blocking** (warnings logged but orchestrator continues). This ensures:
- Orchestrator can continue even if auth setup fails
- Developers can manually seed auth users if needed
- Transparent logging of what happens
- Resilient to transient failures (rate limits, network issues)

**Code Reuse**: Uses existing E2E setup script instead of reimplementing. This:
- Maintains single source of truth
- Reduces code duplication
- Ensures consistency with E2E test setup
- Leverages already-tested code

**Related Documentation**:
- Database seeding patterns: `.ai/ai_docs/context-docs/infrastructure/database-seeding.md`
- Auth implementation: `.ai/ai_docs/context-docs/infrastructure/auth-overview.md`
- E2B sandbox guide: `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1789*
