# Bug Fix: E2E Tests Authentication Failures - Unseeded Database

**Related Diagnosis**: #662 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Database never seeded (0 users) + E2E credential config expects different users than seed file creates
- **Fix Approach**: Seed database and update E2E credentials to match actual seeded users
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

All E2E test shards fail with "Invalid login credentials" because the database has never been seeded (0 users, 0 accounts) and the E2E environment configuration expects user emails that don't exist in the seed file.

For full details, see diagnosis issue #662.

### Solution Approaches Considered

#### Option 1: Seed Database + Update E2E Credentials ⭐ RECOMMENDED

**Description**: Reset/seed the database to create the existing test users, then update the E2E credential configuration to match the actual users in the seed file (`test1@`, `test2@`, `michael@slideheroes.com`).

**Pros**:
- Minimal code changes (only .env.example)
- Uses existing seed data without modification
- No database schema changes required
- Fastest to implement
- Aligns with user's stated preference

**Cons**:
- Requires manual database reset for local dev
- Other developers need to update their .env files

**Risk Assessment**: low - Simple configuration alignment with no code logic changes

**Complexity**: simple - Only updates environment example file

#### Option 2: Update Seed File to Include Expected Users

**Description**: Modify the main seed file to create the users that the E2E config expects (`owner@slideheroes.com`, `admin@slideheroes.com`).

**Pros**:
- No E2E config changes needed
- Dedicated role-named test users

**Cons**:
- Modifies production seed data
- Increases seed file complexity
- Need to ensure password hashes are consistent
- More files to change

**Why Not Chosen**: More invasive than necessary. The existing seeded users (`test1@`, `test2@`, `michael@`) can fulfill all test roles.

#### Option 3: Create Separate E2E-Specific Seed File

**Description**: Create a dedicated E2E seed file that adds the expected users, referenced in config.toml.

**Pros**:
- Clean separation of concerns
- E2E users managed independently

**Cons**:
- Duplicates existing user creation logic
- More files to maintain
- Potential for drift between environments
- Over-engineered for the problem

**Why Not Chosen**: Unnecessary complexity. The main seed already has suitable test users.

### Selected Solution: Seed Database + Update E2E Credentials

**Justification**: This approach requires the fewest changes, leverages existing infrastructure, and directly addresses the root cause. The seeded users (`test1@`, `test2@`, `michael@`) have appropriate roles (regular user, regular user, super-admin) that map well to E2E test requirements.

**Technical Approach**:
- Run `pnpm supabase:web:reset` to apply migrations and seed data
- Update `apps/e2e/.env.example` to document correct test user emails
- Map existing users to E2E credential roles based on their metadata

**User Mapping** (from seed file analysis):
- `E2E_TEST_USER_EMAIL` → `test1@slideheroes.com` (regular authenticated user)
- `E2E_OWNER_EMAIL` → `test2@slideheroes.com` (user with super-admin role in seed)
- `E2E_ADMIN_EMAIL` → `michael@slideheroes.com` (user with super-admin role)

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/.env.example` - Update email addresses to match seeded users

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Seed the Database

Reset the local Supabase database to apply migrations and run seed files.

- Run `pnpm supabase:web:reset`
- Wait for database reset to complete
- Verify users were created with database query

**Why this step first**: Can't test credential updates without users in database

#### Step 2: Update E2E Credential Configuration

Update the E2E environment example file to use the actual seeded users.

- Edit `apps/e2e/.env.example`
- Change `E2E_TEST_USER_EMAIL` to `test1@slideheroes.com`
- Change `E2E_OWNER_EMAIL` to `test2@slideheroes.com`
- Change `E2E_ADMIN_EMAIL` to `michael@slideheroes.com`
- Update comments to reflect actual user roles

#### Step 3: Delete Stale Auth State Files

Remove old authentication state files that contain invalid sessions.

- Delete all files in `apps/e2e/.auth/` directory
- Global setup will regenerate these with valid sessions

#### Step 4: Update Local .env (if exists)

If a local `.env` or `.env.local` file exists in `apps/e2e/`, update it to match.

- Copy new credentials from `.env.example`
- Ensure password matches the seeded user password

#### Step 5: Run E2E Tests to Validate Fix

Execute E2E tests to verify authentication works.

- Run `/test --e2e` or `pnpm test:e2e`
- Verify global setup completes successfully
- Confirm test shards pass authentication

## Testing Strategy

### Unit Tests

No unit test changes needed - this is a configuration fix.

### Integration Tests

No integration test changes needed.

### E2E Tests

The existing E2E tests serve as the validation for this fix:
- ✅ Global setup should authenticate all three user types
- ✅ All 10 shards should pass authentication phase
- ✅ Auth state files should be regenerated in `.auth/`

**Test files**:
- `apps/e2e/global-setup.ts` - Authentication flow being fixed

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify database has users: `SELECT email FROM auth.users;`
- [ ] Verify accounts exist: `SELECT COUNT(*) FROM public.accounts;`
- [ ] Run `/test --e2e` and confirm no "Invalid login credentials" errors
- [ ] Verify `.auth/` directory has fresh auth state files after test run
- [ ] Confirm at least 9/10 shards pass (some may have unrelated failures)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Password mismatch**: Test passwords in local .env don't match seeded user passwords
   - **Likelihood**: medium
   - **Impact**: medium (tests still fail)
   - **Mitigation**: Document the password in .env.example comments, or check seed file for password hash

2. **Other developers need to update .env**: Existing .env files will have wrong emails
   - **Likelihood**: high (if multiple devs)
   - **Impact**: low (easy to fix)
   - **Mitigation**: Document change in PR description, update any onboarding docs

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `apps/e2e/.env.example`
2. Database seed is independent - no rollback needed there
3. Auth state files auto-regenerate

## Performance Impact

**Expected Impact**: none

No performance changes - this is a configuration alignment fix.

## Security Considerations

**Security Impact**: none

Test credentials are only used in local development and CI environments. No production impact.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify database is empty
docker exec supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM auth.users;"
# Expected: 0 rows

# Run E2E tests - should fail
pnpm test:e2e
# Expected: "Invalid login credentials" errors
```

**Expected Result**: Database empty, tests fail with auth errors

### After Fix (Bug Should Be Resolved)

```bash
# Seed the database
pnpm supabase:web:reset

# Verify users exist
docker exec supabase_db_2025slideheroes-db psql -U postgres -d postgres -c "SELECT email FROM auth.users WHERE email LIKE '%slideheroes.com';"
# Expected: test1@, test2@, michael@slideheroes.com

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run E2E tests
pnpm test:e2e

# Or use test command
/test --e2e
```

**Expected Result**: All commands succeed, no auth errors, tests pass.

### Regression Prevention

```bash
# Ensure seed file still creates expected users
grep -E "test1@|test2@|michael@" apps/web/supabase/seeds/01_main_seed.sql

# Run full test suite
/test
```

## Dependencies

**No new dependencies required**

## Database Changes

**Migration needed**: no

The database already has migrations and seed data defined. Just need to run the reset to apply them.

## Deployment Considerations

**Deployment Risk**: low

This fix is local development only. CI/CD environments should already have seeded databases or use GitHub secrets for credentials.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Database has seeded users (3 users with @slideheroes.com emails)
- [ ] `apps/e2e/.env.example` uses correct emails (test1@, test2@, michael@)
- [ ] E2E global setup authenticates all users successfully
- [ ] At least 9/10 E2E shards pass (authentication errors resolved)
- [ ] Fresh auth state files generated in `.auth/`

## Notes

**Password for seeded users**: The seed file uses bcrypt hash `$2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6`. This needs to be documented or the actual password identified for the .env file.

**User role mapping based on seed metadata**:
- `test1@slideheroes.com` - Regular user (no special role)
- `test2@slideheroes.com` - Has `"role": "super-admin"` in raw_app_meta_data
- `michael@slideheroes.com` - Has `"role": "super-admin"` in raw_app_meta_data

**Related documentation**:
- Database seeding: `.ai/ai_docs/context-docs/infrastructure/database-seeding.md`
- E2E testing: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #662*
