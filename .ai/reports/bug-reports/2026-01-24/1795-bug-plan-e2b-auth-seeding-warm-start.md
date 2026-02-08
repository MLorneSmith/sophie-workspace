# Bug Fix: E2B Sandbox Auth User Seeding Skipped on Warm Start

**Related Diagnosis**: #1794 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `isDatabaseSeeded()` checks only `payload.users` table; when found, entire `seedSandboxDatabase()` is skipped, including auth user creation
- **Fix Approach**: Modify `isDatabaseSeeded()` to check BOTH `payload.users` AND `auth.users` tables
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha Orchestrator detects a "warm start" (database already has Payload CMS users), it skips the entire database seeding step—including auth user creation. This causes login failures on the E2B dev server because the `auth.users` table is empty while `payload.users` has data.

The warm start optimization in `isDatabaseSeeded()` (database.ts:692-718) checks only the `payload.users` table. When it returns `true`, the entire `seedSandboxDatabase()` function is skipped (orchestrator.ts:1813-1827), preventing auth user seeding which happens inside that function (database.ts:350-404).

For full details, see diagnosis issue #1794.

### Solution Approaches Considered

#### Option 1: Enhanced Detection in `isDatabaseSeeded()` ⭐ RECOMMENDED

**Description**: Modify `isDatabaseSeeded()` to verify BOTH `payload.users` AND `auth.users` tables have data before declaring the database as fully seeded.

**Pros**:
- Surgical fix (single function change)
- Maintains existing warm start optimization
- Ensures both seeding layers are complete before skipping
- Low risk, minimal code changes
- Catches partial seeding states

**Cons**:
- Doesn't completely eliminate extra auth seeding on warm starts (minor inefficiency)
- Requires understanding of two-tier seeding architecture

**Risk Assessment**: low - Only affects the check logic, not the actual seeding code

**Complexity**: simple - One additional SQL query in existing function

#### Option 2: Extract Auth Seeding into Separate Function

**Description**: Pull auth seeding out of `seedSandboxDatabase()` into its own independent function that always runs.

**Pros**:
- Clean separation of concerns
- Auth seeding always happens regardless of state
- Explicit control flow

**Cons**:
- More code changes (new function, refactoring)
- Removes warm start optimization benefits for auth users
- Duplicates auth seeding unnecessarily
- Higher complexity than necessary

**Why Not Chosen**: Over-engineers the solution. The warm start optimization is valuable—we just need to verify it's actually complete.

#### Option 3: Check auth.users Only

**Description**: Just check `auth.users` instead of `payload.users`.

**Pros**:
- Simple one-line change

**Cons**:
- auth.users alone doesn't indicate if Payload content is seeded
- Could skip Payload seeding incorrectly
- Doesn't work when auth users exist but content isn't seeded

**Why Not Chosen**: Breaks the warm start optimization for Payload data.

### Selected Solution: Enhanced Detection in `isDatabaseSeeded()`

**Justification**: This approach is surgical, low-risk, and maintains the warm start optimization while ensuring both seeding layers are complete. It fixes the root cause without over-engineering.

**Technical Approach**:
- Query both `payload.users` count AND `auth.users` count
- Return `true` only if BOTH have data
- Ensure idempotency of auth seeding (already in place)

**Architecture Changes** (if any):
- None - pure logic enhancement

**Migration Strategy** (if needed):
- None - backward compatible change

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/database.ts:692-718` - Modify `isDatabaseSeeded()` function to check both tables

### New Files

None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update isDatabaseSeeded() to check both tables

Modify `.ai/alpha/scripts/lib/database.ts` to query both `payload.users` and `auth.users`:

- Read the current `isDatabaseSeeded()` function (lines 692-718)
- Replace single `payload.users` count query with compound query checking both tables
- Update log message to indicate we're checking both seeding states
- Ensure query uses safe SQL pattern (already present with error handling)

**Why this step first**: It's the root cause fix; everything depends on this working correctly

#### Step 2: Verify auth seeding remains idempotent

- Review `setup-test-users.js` script (apps/e2e/scripts/setup-test-users.js) to confirm it's idempotent
- Confirm the script can safely run multiple times without duplicates
- No changes needed if already idempotent (which it should be)

#### Step 3: Add/update tests for edge cases

- Add test for scenario: `payload.users` exists but `auth.users` is empty (should return false)
- Add test for scenario: both `payload.users` and `auth.users` exist (should return true)
- Add test for scenario: neither exist (should return false)
- Test error handling when unable to query database

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm warm start detection still works when both tables are populated
- Test full orchestration flow

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Returns `false` when `payload.users` exists but `auth.users` is empty (the bug scenario)
- ✅ Returns `true` when both `payload.users` and `auth.users` exist
- ✅ Returns `false` when neither table exists
- ✅ Error handling when database query fails
- ✅ Idempotent auth seeding (runs safely multiple times)

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/database.test.ts` - Unit tests for `isDatabaseSeeded()`

### Integration Tests

- E2E warm start scenario: Run orchestrator twice, verify auth users exist after first run
- Verify login works after warm start (test1@slideheroes.com / aiesec1992)

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-warm-start.test.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Fresh E2B sandbox creation and seeding (cold start)
- [ ] Second run on same E2B sandbox (warm start) - verify auth users still created
- [ ] Attempt login with `test1@slideheroes.com` / `aiesec1992` after warm start
- [ ] Check database: `SELECT COUNT(*) FROM auth.users;` returns > 0
- [ ] Check database: `SELECT COUNT(*) FROM payload.users;` returns > 0
- [ ] Run orchestrator twice in succession without errors
- [ ] Verify login works in both E2B dev server and local Supabase

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Query Performance**: Adding another query to `isDatabaseSeeded()`
   - **Likelihood**: low
   - **Impact**: low (single small query, minimal overhead)
   - **Mitigation**: Query is simple and uses same pattern as existing code

2. **Warm Start Optimization Not Triggered**: If we check too strictly, we lose optimization benefits
   - **Likelihood**: low
   - **Impact**: medium (slower development iteration, but functional)
   - **Mitigation**: Current fix only adds additional check, doesn't change optimization logic

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to `isDatabaseSeeded()` in `.ai/alpha/scripts/lib/database.ts`
2. Return to checking only `payload.users` count
3. Deploy and run orchestrator again
4. Revert is zero-risk since we're just reverting query logic

**Monitoring** (if needed):
- Monitor auth seeding success/failure in orchestrator events
- Watch for duplicate auth user creation errors
- Check warm start detection is still working (info logs show "Database already seeded")

## Performance Impact

**Expected Impact**: minimal

Adding one additional database query to check `auth.users` count. The query is:
- Simple count on indexed column
- Same structure as existing query
- ~1ms additional overhead (negligible)

No performance degradation expected.

## Security Considerations

No new security implications:
- Auth seeding already uses idempotent patterns (no duplicates)
- Database queries are read-only (counting records)
- No new exposure of credentials or data

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the bug scenario in a fresh E2B sandbox:
# 1. Create sandbox
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692

# 2. Navigate to E2B dev server
# 3. Try login with test1@slideheroes.com / aiesec1992
# 4. Expected: Login fails with "Invalid login credentials"

# Verify auth.users is empty after warm start:
psql $SUPABASE_SANDBOX_DB_URL -t -c "SELECT COUNT(*) FROM auth.users"
# Expected: 0
```

**Expected Result**: Login fails, `auth.users` is empty even though database seeding appeared complete.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests (if added)
pnpm test:unit database.test.ts

# Integration test (if added)
pnpm test:integration orchestrator-warm-start.test.ts

# Build
pnpm build
```

**Expected Result**: All commands succeed, no new errors introduced.

### Regression Prevention

```bash
# Run full orchestration twice to test warm start
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692
# (First run completes)

tsx .ai/alpha/scripts/spec-orchestrator.ts 1692
# (Second run should skip seeding but still have auth users)

# Verify both runs succeeded and auth users exist
psql $SUPABASE_SANDBOX_DB_URL -t -c "SELECT COUNT(*) FROM auth.users"
# Expected: > 0
```

## Dependencies

### New Dependencies (if any)

None required - uses existing psql and Node.js capabilities

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database schema changes required. Fix only changes detection logic.

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (auth users created on warm start)
- [ ] Login works after warm start
- [ ] Warm start optimization still functions (logs show "Database already seeded")
- [ ] Zero regressions in orchestrator
- [ ] Tests pass (unit and integration)
- [ ] Code review approved (if applicable)

## Notes

The root cause is a classic "optimization without complete validation" pattern. The warm start check was added to speed up development but only validated one of two seeding layers. The fix maintains the valuable optimization while ensuring complete seeding before skipping.

This is related to issue #1790 (where auth seeding was initially added) and #1789 (original diagnosis). The pattern here is a good learning: when adding optimizations that skip work, verify ALL dependencies are met, not just a subset.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1794*
