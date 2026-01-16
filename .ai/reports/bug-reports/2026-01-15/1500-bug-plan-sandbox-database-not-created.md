# Bug Fix: Sandbox Supabase Database Not Created - Invalid Credentials & Silent Error Handling

**Related Diagnosis**: #1496
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two-part issue: (1) invalid/outdated Supabase sandbox credentials in `.env`, (2) silent error handling that treats all failures as success
- **Fix Approach**: Update credentials in `.env` and improve error handling to distinguish between "tool not installed" vs "authentication failed"
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The remote Supabase database for `slideheroes-alpha-sandbox` was never created because:

1. **Invalid Credentials**: The `.env` file contains outdated/invalid credentials that don't match the actual Supabase project (kdjbbhjgogqywtlctlzq). When the orchestrator tries to connect with `psql`, it fails with: `FATAL: password authentication failed for user "postgres"`

2. **Silent Error Handling**: The `checkDatabaseCapacity()` function in `.ai/alpha/scripts/lib/database.ts` catches ALL exceptions and returns `true` (success), including authentication failures. This was intended only for "psql not installed" but masks critical credential problems.

**Result**: E2B dev server preview has no working database, preventing feature implementation and human-in-the-loop review for spec 1362.

### Solution Approaches Considered

#### Option 1: Update .env Credentials + Improve Error Handling ⭐ RECOMMENDED

**Description**: Two-part surgical fix:
1. Update `.env` with correct Supabase sandbox credentials from the actual project
2. Improve error handling to distinguish between "tool not available" vs "connection failed"

**Pros**:
- Fixes the root cause completely
- Minimal code changes (4 lines in database.ts, env update)
- Clear error messages help future debugging
- Non-breaking, safe to deploy

**Cons**:
- Requires credentials to be available (they are in the diagnosis)
- Small risk of temporarily exposing credentials in git (mitigated by .gitignore)

**Risk Assessment**: low - Changes are minimal and isolated to error handling

**Complexity**: simple - Just credential update and error message improvement

#### Option 2: Auto-Detect and Retry

**Description**: Implement automatic credential validation with retry logic for authentication failures

**Why Not Chosen**: Over-engineered for a simple credential issue. The root cause is credentials in `.env`, not something that needs auto-recovery.

#### Option 3: Skip Database if Credentials Missing

**Description**: Allow orchestration to proceed without database if credentials are invalid

**Why Not Chosen**: Defeats the purpose of the sandbox - features need a working database for testing

### Selected Solution: Update Credentials + Improve Error Handling

**Justification**: This is the minimum change to fix the root cause. Invalid credentials should produce a clear error message, not silent failure. This approach is:
- **Safe**: Non-breaking, only improves error reporting
- **Minimal**: ~15 lines of actual code changes
- **Clear**: Future engineers will see exactly what went wrong
- **Complete**: Fixes both credential problem and error masking issue

**Technical Approach**:

1. **Update `.env` file** (lines 15-20): Replace invalid sandbox credentials with correct values from Supabase project dashboard
   - Current: `sb_publishable_...` and `sb_secret_...` formats (wrong)
   - Correct: JWT format API keys and actual database URL with valid password

2. **Improve error handling** in `database.ts`:
   - Distinguish between connection errors and "tool not installed"
   - Log the actual error message for auth failures
   - Return `false` on auth errors (fail loudly) instead of `true` (success)
   - Keep `true` return only for "psql not installed" (non-blocking)

**Architecture Changes**: None - purely credential/error handling improvements

**Migration Strategy**: None required - backward compatible

## Implementation Plan

### Affected Files

- `.env` (lines 15-20) - Sandbox Supabase credentials need updating
- `.ai/alpha/scripts/lib/database.ts` (lines 54-96) - Error handling in `checkDatabaseCapacity()`

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Sandbox Credentials in .env

Get the correct credentials from Supabase Dashboard → Project Settings → Database/API and update:

- `SUPABASE_SANDBOX_PROJECT_REF`: Keep as is (kdjbbhjgogqywtlctlzq) ✓
- `SUPABASE_SANDBOX_URL`: Verify it's `https://kdjbbhjgogqywtlctlzq.supabase.co`
- `SUPABASE_SANDBOX_ANON_KEY`: Replace with actual JWT format key from dashboard (not `sb_publishable_...`)
- `SUPABASE_SANDBOX_SERVICE_ROLE_KEY`: Replace with actual JWT format key (not `sb_secret_...`)
- `SUPABASE_SANDBOX_DB_URL`: Replace with correct PostgreSQL connection string including valid password

**Why this step first**: Without valid credentials, the database can't connect. This is the critical blocker.

**Subtasks**:
- Login to Supabase dashboard for project kdjbbhjgogqywtlctlzq
- Copy API keys from Project Settings → API
- Copy Database URL from Project Settings → Database
- Update `.env` lines 15-20 with actual values
- Verify password is correct in database URL (not `on30Vj3F9BYNQpid` if that's invalid)

#### Step 2: Improve Error Handling in database.ts

Update `checkDatabaseCapacity()` to distinguish between "tool not installed" and "auth failed":

- Detect `FATAL: password authentication failed` error message
- Log actual error for debugging purposes
- Return `false` for auth errors (blocking)
- Keep `true` only for "psql command not found" errors (non-blocking)

**Why this step after credentials**: Ensures we're testing with correct credentials and can verify the error handling works

**Subtasks**:
- Parse error message from `psql` execution
- Check if error contains "password authentication failed"
- If auth failure: log error details and return `false`
- If command not found: log "psql not available" and return `true`
- Verify error messages are clear for future debugging

#### Step 3: Add/Update Tests

Add validation to verify:
- Credentials are correctly formatted
- Database connection can be established
- Error messages are logged on auth failures

**Test files**:
- Create or update test in `.ai/alpha/scripts/lib/__tests__/database.test.ts`
- Test successful database capacity check with valid credentials
- Test auth failure detection with invalid credentials
- Test "psql not found" graceful handling

**Test scenarios**:
- ✅ Valid credentials → returns true with capacity info
- ✅ Invalid credentials → returns false with auth error message
- ✅ psql not installed → returns true with "tool not available" message
- ✅ Error messages logged appropriately for debugging

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify credentials work by testing database connection
- Confirm error messages are helpful
- Check zero regressions
- Test all edge cases

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Valid credentials scenario (should detect capacity successfully)
- ✅ Invalid credentials scenario (should return false with auth error)
- ✅ Missing psql scenario (should return true gracefully)
- ✅ Malformed database URL scenario
- ✅ Network error scenario
- ✅ Error message formatting and logging

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/database.test.ts` - Database module unit tests

### Integration Tests

Test end-to-end database operations:
- ✅ Orchestrator can connect to sandbox database with updated credentials
- ✅ Database reset completes successfully
- ✅ Error handling doesn't mask authentication failures

**Test files**:
- `.ai/alpha/__tests__/orchestrator.integration.test.ts` - Orchestrator integration tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Update `.env` with correct credentials
- [ ] Run `checkDatabaseCapacity()` with valid credentials (should succeed)
- [ ] Simulate invalid credentials and verify error is logged (not silent)
- [ ] Verify orchestration can proceed with correct credentials
- [ ] Check E2B dev server can access sandbox database
- [ ] Confirm spec 1362 feature implementation can now proceed
- [ ] Verify no new errors in console logs
- [ ] Test credential validation happens before full orchestration

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Exposed Credentials**: Credentials in `.env` file
   - **Likelihood**: low (file is in .gitignore, not typically committed)
   - **Impact**: medium (could expose Supabase access)
   - **Mitigation**: `.env` is already in .gitignore; credential rotation could be done post-fix if needed

2. **Breaking Change**: Different connection behavior
   - **Likelihood**: low (only changes error reporting, not success path)
   - **Impact**: low (error handling is more strict, not less strict)
   - **Mitigation**: Error handling changes are strictly additive

3. **Credentials Wrong Again**: If copied credentials are incorrect
   - **Likelihood**: low (verified from official Supabase dashboard)
   - **Impact**: high (database still won't work)
   - **Mitigation**: Manual verification step; clear error message if wrong

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.env` to previous state (or update with correct credentials if wrong)
2. Revert error handling changes in `database.ts` (single commit)
3. Redeploy orchestrator
4. Verify database operations resume

**Monitoring** (if needed):
- Watch orchestrator logs for "database capacity check" messages
- Alert if database connection failures occur
- Monitor E2B sandbox database operations

## Performance Impact

**Expected Impact**: none

Database credential validation happens once at orchestration start, so no performance implications.

## Security Considerations

**Security Impact**: low (improvements)

- Error handling improvements actually increase security by failing loudly on auth errors rather than silently continuing
- Credentials validation prevents silent failures that could mask security issues
- Error messages don't expose sensitive data (just indicate "auth failed")

**Security review needed**: no (credentials stored in `.env` which is already managed appropriately)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# With invalid credentials, database connection should fail silently
cd /home/msmith/projects/2025slideheroes
echo "Testing with current (invalid) credentials..."
psql "postgresql://postgres.kdjbbhjgogqywtlctlzq:on30Vj3F9BYNQpid@aws-0-us-west-2.pooler.supabase.com:5432/postgres" -c "SELECT 1"
# Expected: FATAL: password authentication failed
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (database module)
pnpm test:unit -- database.test.ts

# Integration tests (orchestrator)
pnpm test:integration -- orchestrator.integration.test.ts

# Test database connection with correct credentials
cd /home/msmith/projects/2025slideheroes
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT 1"
# Expected: Should return empty query result (success)

# Verify orchestrator can proceed
node .ai/alpha/scripts/orchestrator.ts
# Expected: No silent failures; clear error messages if credentials wrong
```

**Expected Result**: All validation commands succeed, database connection works, orchestrator proceeds normally.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
node .ai/alpha/scripts/lib/database.ts
# Verify: Error handling distinguishes between "tool not installed" and "auth failed"
```

## Dependencies

### New Dependencies (if any)

None required - only using existing error handling patterns.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Update `.env` with correct Supabase sandbox credentials before deploying
- No database migrations needed
- No breaking changes

**Feature flags needed**: no

**Backwards compatibility**: maintained - only error handling improvements

## Success Criteria

The fix is complete when:
- [ ] `.env` credentials are updated with correct values from Supabase dashboard
- [ ] Error handling distinguishes between "tool not installed" and "auth failed"
- [ ] All validation commands pass
- [ ] Database connection test succeeds
- [ ] Orchestrator can proceed without errors
- [ ] E2B sandbox can access database
- [ ] Spec 1362 implementation can now proceed
- [ ] All tests pass (unit, integration)
- [ ] Zero regressions detected
- [ ] Error messages are clear and helpful

## Notes

**Credentials Source**: The correct credentials should be obtained from Supabase Dashboard:
1. Go to https://app.supabase.com/projects
2. Find project with ref: `kdjbbhjgogqywtlctlzq`
3. Settings → API section for API keys
4. Settings → Database section for connection string

**Error Message Examples**:
- Before: Silently returns `true` (success) even with invalid credentials
- After: Logs "❌ Database connection failed: FATAL: password authentication failed for user 'postgres'" and returns `false`

**Related Documentation**:
- Supabase Reset System: `.ai/ai_docs/context-docs/infrastructure/supabase-reset-system.md`
- E2B Sandbox: `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md`
- Database Patterns: `.ai/ai_docs/context-docs/development/database-patterns.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1496*
