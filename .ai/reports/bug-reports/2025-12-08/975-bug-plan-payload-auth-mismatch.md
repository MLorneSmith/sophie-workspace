# Bug Fix: Payload CMS E2E Tests Failing - Admin User Password Mismatch

**Related Diagnosis**: #974
**Severity**: high
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `.env` file missing `SEED_USER_PASSWORD` variable that `.env.example` defines
- **Fix Approach**: Add `SEED_USER_PASSWORD=aiesec1992` to `.env` and re-seed the database
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

All 24 Payload CMS E2E tests in shard 7 fail because the admin user `michael@slideheroes.com` has the wrong password hash. The Payload API correctly rejects login attempts with "The email or password provided is incorrect."

**Architecture Understanding**:
```
┌────────────────────────────────────────────────────────────────┐
│                    LOCAL SUPABASE (Docker)                     │
│                    Same database for all                       │
│                    ports: 54521-54527                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ (same database)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│   DEV SERVERS     │                    │   TEST SERVERS    │
│   Web: 3000       │                    │   Web: 3001       │
│   Payload: 3020   │                    │   Payload: 3021   │
│   Uses: .env      │                    │   Uses: .env.test │
└───────────────────┘                    └───────────────────┘
```

**The root cause**:
- Dev and test servers share the **same database**
- The admin password is set at **seed time** from `SEED_USER_PASSWORD` env var
- `.env.example` includes `SEED_USER_PASSWORD=aiesec1992`
- `.env` is **missing** this variable (incomplete setup)
- `.env.test` has `SEED_USER_PASSWORD=aiesec1992`
- E2E tests expect password `aiesec1992`

Since dev and test share the same database, they should use the same password. The `.env` file is simply missing this required variable.

For full details, see diagnosis issue #974.

### Solution Approaches Considered

#### Option 1: Add Missing Variable to .env ⭐ RECOMMENDED

**Description**: Add `SEED_USER_PASSWORD=aiesec1992` to `.env` (matching `.env.example` and `.env.test`), then re-seed the database.

**Pros**:
- Simplest fix - single line addition
- Aligns `.env` with `.env.example` (proper configuration)
- No code changes required
- No workflow changes required
- Dev and test use same password (correct for shared database)

**Cons**:
- None

**Risk Assessment**: low - Just adding a missing config value

**Complexity**: simple - Single env var addition + re-seed

#### Option 2: Add seed:test Script + --test Flag (Previous Plan)

**Description**: Create separate `seed:test` script and update `/supabase-reset` with `--test` flag.

**Pros**:
- Allows different passwords for dev vs test

**Cons**:
- Over-engineered for a shared database
- Different passwords don't make sense when database is shared
- Adds complexity without benefit
- Workflow changes required

**Why Not Chosen**: Dev and test share the same database, so they must use the same password. Adding separate seeding paths doesn't solve the real problem (missing env var).

#### Option 3: Environment Auto-detection

**Description**: Auto-detect environment and adjust behavior.

**Why Not Chosen**: Unnecessary complexity. The real issue is a missing configuration value.

### Selected Solution: Add Missing Variable to .env

**Justification**: This is the correct fix because:
1. `.env.example` already specifies `SEED_USER_PASSWORD=aiesec1992`
2. `.env` is simply missing this required variable
3. Dev and test share the same database, so they must use the same password
4. The seed engine validates this variable is present (will fail without it)
5. No code or workflow changes needed

**Technical Approach**:

1. Add to `apps/payload/.env`:
   ```
   SEED_USER_PASSWORD=aiesec1992
   ```

2. Re-run the seeding via existing workflow:
   ```bash
   /supabase-reset
   ```

3. Tests will pass because password now matches.

**Architecture Changes**: None.

**Migration Strategy**: None.

## Implementation Plan

### Affected Files

- `apps/payload/.env` - Add missing `SEED_USER_PASSWORD` variable

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Missing Environment Variable

Add the missing `SEED_USER_PASSWORD` to `apps/payload/.env`:

```bash
# Add to apps/payload/.env
SEED_USER_PASSWORD=aiesec1992
```

**Why this value**: Matches `.env.example` and `.env.test` for consistency.

#### Step 2: Reset Database with Correct Password

Run the standard reset workflow to seed with the correct password:

```bash
/supabase-reset
```

This will:
1. Reset the Supabase database
2. Run Payload migrations
3. Seed with `SEED_USER_PASSWORD=aiesec1992` (now present in `.env`)

#### Step 3: Verify Tests Pass

Run the previously failing tests:

```bash
NODE_ENV=test pnpm --filter web-e2e test:group:payload
```

Expected: All 24 tests pass.

#### Step 4: Validation

Confirm the fix is complete:

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm dev server (3020) and test server (3021) both work with same password

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration fix.

### Integration Tests

**Verify seeding works**:
- ✅ `pnpm --filter payload seed:run` runs without errors
- ✅ Admin user created with correct password
- ✅ No "missing environment variable" errors

### E2E Tests

Run the affected Payload CMS test suite:

**Test files**:
- ✅ `payload-auth.spec.ts` - 3 tests (all should pass)
- ✅ `payload-collections.spec.ts` - 17 tests (all should pass)
- ✅ `payload-database.spec.ts` - 4 tests (all should pass)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify `SEED_USER_PASSWORD=aiesec1992` is in `apps/payload/.env`
- [ ] Run `/supabase-reset` successfully
- [ ] Confirm login with `michael@slideheroes.com` / `aiesec1992` succeeds on port 3020 (dev)
- [ ] Confirm login with `michael@slideheroes.com` / `aiesec1992` succeeds on port 3021 (test)
- [ ] Run complete Payload E2E test suite (24 tests pass)
- [ ] Verify no auth-related console errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Env file not committed**: `.env` is typically gitignored
   - **Likelihood**: high - This is expected behavior
   - **Impact**: low - Fix is local, other devs need same setup
   - **Mitigation**: Ensure `.env.example` is correct (it already is)

2. **Password mismatch in other environments**: Other devs might have different passwords
   - **Likelihood**: low - `.env.example` already specifies correct value
   - **Impact**: low - Only affects local dev, easy to fix
   - **Mitigation**: Document in README/CLAUDE.md if needed

**Rollback Plan**:

If this fix causes unexpected issues:

1. Remove `SEED_USER_PASSWORD` from `.env`
2. Re-seed database
3. Investigate why the original password was different

## Performance Impact

**Expected Impact**: none

No performance implications.

## Security Considerations

**Security Impact**: none

- `.env` is gitignored (not committed)
- Password is for local development only
- Production uses different credentials

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify admin login fails with expected password
curl -X POST http://localhost:3021/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"aiesec1992"}'
# Expected: {"errors":[{"message":"The email or password provided is incorrect."}]}

# Tests fail
NODE_ENV=test pnpm --filter web-e2e test:group:payload 2>&1 | grep -E "(failing|FAILED)"
```

### After Fix (Bug Should Be Resolved)

```bash
# Reset database (will now use correct password from .env)
/supabase-reset

# Verify admin login succeeds on dev server
curl -X POST http://localhost:3020/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"aiesec1992"}'
# Expected: Successful login response (token returned)

# Verify admin login succeeds on test server
curl -X POST http://localhost:3021/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"aiesec1992"}'
# Expected: Successful login response (token returned)

# Run affected tests
NODE_ENV=test pnpm --filter web-e2e test:group:payload
# Expected: All 24 tests pass

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Verify dev and test servers both work
curl -s http://localhost:3020/api/users/me -H "Authorization: Bearer $TOKEN" | jq .email
curl -s http://localhost:3021/api/users/me -H "Authorization: Bearer $TOKEN" | jq .email
```

## Dependencies

**No new dependencies required**

## Database Changes

**Migration needed**: no

No schema changes. The database will be re-seeded with the correct password.

## Deployment Considerations

**Deployment Risk**: none

This only affects local development. Production environments have their own credentials.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] `SEED_USER_PASSWORD=aiesec1992` added to `apps/payload/.env`
- [ ] Database re-seeded via `/supabase-reset`
- [ ] Admin login works on both dev (3020) and test (3021) servers
- [ ] All 24 Payload CMS E2E tests pass
- [ ] Zero regressions

## Notes

### Why This Was Confusing

The original diagnosis suggested the issue was about `.env` vs `.env.test` having different passwords. But the real issue is simpler:

- `.env` was **missing** `SEED_USER_PASSWORD` entirely
- `.env.example` correctly specifies it as `aiesec1992`
- The `.env` file was incomplete

### Standard Workflow Unchanged

The existing workflow continues to work:
```bash
pnpm --filter payload seed:convert  # Convert raw seed data
/supabase-reset                      # Reset + seed
```

No changes to scripts or commands needed.

### Shared Database = Shared Password

Since dev (3000/3020) and test (3001/3021) share the same local Supabase database, they must use the same admin password. This is correct behavior - separate passwords would require separate databases.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #974*
