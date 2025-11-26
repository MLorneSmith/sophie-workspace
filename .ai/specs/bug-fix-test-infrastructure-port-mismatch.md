# Bug Fix: Test Infrastructure Port Mismatch

**Related Diagnosis**: #708
**Severity**: high
**Bug Type**: configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test infrastructure scripts contain hardcoded Supabase port references (54321) not updated during the #707 port migration
- **Fix Approach**: Search and replace port references (54321→54521, 54322→54522, 54323→54523) in 5 test infrastructure files
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E authentication tests are failing with 15-second timeout because test infrastructure scripts in `.ai/ai_scripts/testing/` still reference the old Supabase port 54321 while the actual Supabase instance runs on port 54521. This is a second wave of configuration drift from the port migration in #707, which updated application config but missed test infrastructure scripts.

For full details, see diagnosis issue #708.

### Solution Approaches Considered

#### Option 1: Direct Search and Replace in Files ⭐ RECOMMENDED

**Description**: Directly edit the 5 affected test infrastructure files to replace all hardcoded port references with correct values.

**Pros**:
- Simple, straightforward fix with minimal risk
- Surgical changes to only the affected files
- Fast execution (< 5 minutes)
- No architectural changes needed
- Follows same pattern as successful #707 fix

**Cons**:
- Manual approach rather than dynamic (could drift again if hardcoded elsewhere)
- No prevention mechanism if new test infrastructure files are added with old ports

**Risk Assessment**: low - These are simple configuration values with no dependencies or side effects

**Complexity**: simple - Text replacement only

#### Option 2: Parameterize Ports in Configuration

**Description**: Create a central port configuration file that all test infrastructure scripts import from, eliminating hardcoding.

**Pros**:
- Single source of truth for port values
- Prevents future drift
- More maintainable long-term

**Cons**:
- Requires refactoring all 5 files to use dynamic imports
- More complex change with more potential for regression
- Unnecessary for current scope (just fixing one port migration)

**Why Not Chosen**: Over-engineering for a one-time configuration fix. The project already had a successful precedent (#707) for the direct replacement approach.

#### Option 3: Use Environment Variables

**Description**: Make test infrastructure scripts read port values from environment variables with sensible defaults.

**Pros**:
- Flexible, can override at runtime
- Clear intent about which values are configurable

**Cons**:
- Requires changing test infrastructure startup process
- More complex testing due to env var injection
- Risk of breaking existing test infrastructure

**Why Not Chosen**: Introduces unnecessary complexity and risk when direct replacement is proven to work (as done in #707).

### Selected Solution: Direct Search and Replace in Files

**Justification**: This approach mirrors the successful #707 fix which systematically updated port references across configuration files. It's simple, low-risk, fast, and solves the immediate problem without over-engineering. The test infrastructure scripts are not generated code, so manual updates are appropriate.

**Technical Approach**:
- Replace `54321` with `54521` (API Gateway port)
- Replace `54322` with `54522` (PostgreSQL port)
- Replace `54323` with `54523` (Studio port)
- Update all 5 affected files in `.ai/ai_scripts/testing/infrastructure/`
- Verify no side effects on other test infrastructure components

**Architecture Changes**: None - purely configuration updates

**Migration Strategy**: No data migration needed. Port changes are purely for test infrastructure configuration.

## Implementation Plan

### Affected Files

List of 5 test infrastructure files that need modification:

- `apps/web/.ai/ai_scripts/testing/infrastructure/phase-coordinator.cjs` - 2 port array references (lines 254, 342)
- `apps/web/.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - 2 references: port array (line 241) and fallback URL (line 747)
- `apps/web/.ai/ai_scripts/testing/infrastructure/port-binding-verifier.cjs` - 1 kong port constant (line 28)
- `apps/web/.ai/ai_scripts/testing/infrastructure/supabase-config-loader.cjs` - 1 default API_URL (line 18)
- `apps/web/.ai/ai_scripts/testing/infrastructure/test-controller-monolith.cjs` - 5 hardcoded references (lines 60, 264, 350, 398, 531)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update phase-coordinator.cjs

Update Supabase port references in port binding arrays.

- Read file and locate port arrays at lines 254 and 342
- Replace `54321` with `54521` in both locations
- Replace `54322` with `54522` in both locations
- Verify changes are isolated to port arrays only

**Why this step first**: Foundation file that other scripts may depend on; updating early ensures consistency

#### Step 2: Update infrastructure-manager.cjs

Update the most critical file (provides URL to dev server).

- Read file and locate port array at line 241
- Replace port array `[54321, 54322, 54323]` with `[54521, 54522, 54523]`
- Replace fallback URL at line 747: `"http://localhost:54321"` → `"http://localhost:54521"`
- Verify both updates are applied

**Why this step**: This file directly configures the URL passed to the dev server; most critical for auth failures

#### Step 3: Update port-binding-verifier.cjs

Update Kong port constant.

- Read file and locate kong port at line 28
- Replace `kong: 54321` with `kong: 54521`
- Verify the change is the only modification

#### Step 4: Update supabase-config-loader.cjs

Update default API_URL fallback.

- Read file and locate default at line 18
- Replace `"http://127.0.0.1:54321"` with `"http://127.0.0.1:54521"`
- Verify only API_URL line is changed

#### Step 5: Update test-controller-monolith.cjs

Update all hardcoded port references.

- Read entire file to understand context
- Replace all `54321` with `54521` (should find 5+ references at lines 60, 264, 350, 398, 531, possibly others)
- Replace all `54322` with `54522`
- Replace all `54323` with `54523`
- Verify all replacements are applied

#### Step 6: Verify No Remaining Old Port References

Confirm the fix is complete.

- Search entire `.ai/ai_scripts/testing/` directory for remaining `54321` references
- Confirm zero results (should find none)
- Spot-check the 5 modified files to ensure changes are correct

#### Step 7: Run Validation Tests

Verify the fix resolves the auth timeout issue.

- Start Supabase: `pnpm supabase:web:start` (verify runs on port 54521)
- Start test dev server: `pnpm --filter web dev:test` (should use correct port)
- Run E2E shard 2 tests: `pnpm test:e2e -- --shard=2/4`
- Verify "auth-simple.spec.ts sign in test" passes (was failing before)
- Verify no timeout errors in logs

## Testing Strategy

### Unit Tests

**No unit tests needed** - test infrastructure scripts are not unit-tested separately. They're validated through integration tests (E2E tests).

### Integration Tests

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - The primary failing test that validates this fix

### E2E Tests

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Sign in test (was failing with 15s timeout)

**Test Scenario**:
- Verify "user can sign in with valid credentials" test passes
- Network logs should show requests to correct port (54521, not 54321)
- No timeout errors in auth flow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify Supabase is running on port 54521: `npx supabase status`
- [ ] Start dev test server: `pnpm --filter web dev:test` (should start without errors)
- [ ] Check test server environment logs for correct Supabase URL (should show 54521)
- [ ] Run E2E shard 2: `pnpm test:e2e -- --shard=2/4`
- [ ] Verify auth-simple sign in test passes (was failing before fix)
- [ ] Check network logs in test output (should show requests to port 54521, not 54321)
- [ ] Run full E2E test suite: `pnpm test:e2e`
- [ ] Verify no new failures introduced
- [ ] Verify auth timeout errors are resolved

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incomplete Port Replacement**: Missed some hardcoded references, test still fails
   - **Likelihood**: low
   - **Impact**: medium (tests would still fail, requiring follow-up fix)
   - **Mitigation**: Run grep search to verify all old ports are replaced; spot-check modified files before running tests

2. **Unintended String Replacement**: Port numbers appear in comments or strings, causing subtle breakage
   - **Likelihood**: low
   - **Impact**: low (unlikely to cause failures; worst case is confusing comments)
   - **Mitigation**: Review each replacement to ensure it's in a port configuration context, not a comment or description

3. **Port Hardcoded Elsewhere**: Other test infrastructure files have old ports that weren't identified
   - **Likelihood**: low
   - **Impact**: medium (tests would still fail)
   - **Mitigation**: Run comprehensive grep for "54321" across entire test infrastructure directory after fix

4. **Regression in Other Tests**: Port change breaks other test infrastructure behavior
   - **Likelihood**: low
   - **Impact**: medium (could break other test functionality)
   - **Mitigation**: Run full E2E test suite to verify no regressions; test infrastructure changes only affect port configuration

**Rollback Plan**:

If this fix causes issues in production or testing:
1. Revert all 5 modified files to previous commit: `git checkout HEAD -- .ai/ai_scripts/testing/infrastructure/`
2. Verify old port references are restored: `grep -r "54321" .ai/ai_scripts/testing/`
3. Restart test infrastructure: `pnpm test:e2e` (will revert to old behavior)
4. Investigate root cause of new issue
5. Create new bug fix plan with alternative approach

**Monitoring** (if needed):

- Monitor E2E test results for auth timeout patterns (should disappear)
- Alert on new timeout errors in test infrastructure logs
- Track test pass rates before/after fix

## Performance Impact

**Expected Impact**: none

No performance impact expected. Port references are only used during test infrastructure startup to route network traffic to the correct Supabase instance. The actual test execution performance is unaffected.

## Security Considerations

**Security Impact**: none

This is a configuration change to point to the correct local Supabase instance. No security implications, as we're maintaining isolation of test infrastructure from production systems.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify Supabase is running on correct port
npx supabase status
# Expected: API URL: http://127.0.0.1:54521

# Start test dev server (will load old port from test infrastructure)
pnpm --filter web dev:test
# Expected: Server uses old 54321 port internally

# Run auth tests (should fail with timeout)
pnpm test:e2e -- --shard=2/4
# Expected Result: auth-simple.spec.ts "user can sign in" test times out after 15 seconds
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check (should pass with no changes to infrastructure files)
pnpm typecheck

# Lint (should pass - no code style changes)
pnpm lint

# Format (should pass - no formatting needed)
pnpm format

# Start test dev server (will load correct port from fixed test infrastructure)
pnpm --filter web dev:test
# Expected Result: Server starts successfully with correct Supabase URL (54521)

# Run auth tests (should pass)
pnpm test:e2e -- --shard=2/4
# Expected Result: auth-simple.spec.ts tests pass with no timeout errors

# Run full E2E test suite to verify no regressions
pnpm test:e2e
# Expected Result: All tests pass, no new failures introduced
```

### Regression Prevention

```bash
# Search for remaining old port references
grep -r "54321" .ai/ai_scripts/testing/
# Expected: No results (all should be updated to 54521)

# Search for incomplete port migration in other areas (already fixed in #707)
grep -r "54321" apps/
# Expected: No results (all app-level ports already fixed in #707)

# Verify correct ports are referenced
grep -r "54521" .ai/ai_scripts/testing/
# Expected: Multiple results showing correct port throughout test infrastructure
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - This is a configuration update only. The test infrastructure already has all required dependencies.

## Database Changes

**No database changes required** - Port configuration is purely for network routing, not data changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a test infrastructure fix, not production code. No special deployment needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained - This fix maintains the same test infrastructure API; only internal port configuration changes.

## Success Criteria

The fix is complete when:
- [ ] All 5 test infrastructure files are updated with correct port numbers
- [ ] grep search for "54321" in test infrastructure returns zero results
- [ ] Test dev server starts without errors using correct port
- [ ] E2E auth-simple.spec.ts "user can sign in" test passes (was failing before)
- [ ] Full E2E test suite runs with no new failures
- [ ] No timeout errors in test logs
- [ ] Network logs show requests to correct port (54521, not 54321)
- [ ] Manual testing checklist is complete

## Notes

This fix follows the exact same pattern as the successful #707 fix which updated application-level port configuration. The test infrastructure scripts in `.ai/ai_scripts/testing/` were not part of that fix scope but contain the same outdated port references.

The test infrastructure files are not automatically generated and not covered by standard package managers, so manual updates are the appropriate approach.

After this fix, a final verification should confirm no other test infrastructure files exist with old port references using: `find .ai/ai_scripts/testing -name "*.cjs" -o -name "*.js" | xargs grep "54321"`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #708*
