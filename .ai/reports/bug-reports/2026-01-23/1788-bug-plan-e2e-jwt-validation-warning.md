# Bug Fix: E2E Test JWT Validation Warning During Test User Setup

**Related Diagnosis**: #1787 (REQUIRED)
**Severity**: low
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Environment variable propagation timing issue in test controller spawn chain. The `E2E_SUPABASE_SERVICE_ROLE_KEY` may not be available when Playwright global-setup attempts to use it for admin API calls.
- **Fix Approach**: Explicitly load `apps/e2e/.env.local` in `test-controller.cjs` before spawning Playwright to ensure all E2E environment variables are properly propagated.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

During E2E test execution, the test user setup phase logs JWT validation errors (`AuthApiError: invalid JWT: unable to parse or verify signature`) when attempting to create/update test users via the Supabase Admin API. While tests ultimately pass (because users already exist), the warning noise is confusing and the setup would fail on a fresh database.

The root cause is that the test controller doesn't explicitly load `.env.local` before spawning Playwright, causing potential timing issues with environment variable propagation.

For full details, see diagnosis issue #1787.

### Solution Approaches Considered

#### Option 1: Explicit env loading in test controller ⭐ RECOMMENDED

**Description**: Modify `test-controller.cjs` to explicitly load `apps/e2e/.env.local` before spawning Playwright, ensuring all E2E environment variables are in the spawned process environment.

**Pros**:
- Directly addresses the root cause
- Ensures environment variables are available before Playwright starts
- Single point of fix (one file change)
- No changes needed to test-users.ts or global-setup.ts
- Most robust and preventive approach

**Cons**:
- Requires parsing .env.local file in Node.js (dotenv package already available)

**Risk Assessment**: low - Simply adds env loading before spawn, no changes to test execution logic

**Complexity**: simple - Use dotenv or manual file parsing

#### Option 2: Add retry logic with delay

**Description**: In `test-users.ts`, add a small delay and retry on JWT errors to handle potential timing issues.

**Pros**:
- Handles transient timing issues
- Defensive programming approach

**Cons**:
- Treats symptom, not root cause
- Adds latency to test setup
- May mask other underlying issues
- Retry logic adds code complexity

**Why Not Chosen**: While effective as a fallback, it doesn't prevent the root issue and adds unnecessary test setup latency.

#### Option 3: Pre-verify JWT before use

**Description**: Add a simple health check call to verify the service role key is valid before attempting admin operations.

**Pros**:
- Early detection of env issues

**Cons**:
- Still doesn't guarantee key availability
- Adds extra API call to test setup
- Only validates, doesn't fix the timing issue

**Why Not Chosen**: Doesn't address the underlying environment propagation problem.

### Selected Solution: Explicit env loading in test controller

**Justification**: This approach directly addresses the root cause by ensuring environment variables are available before Playwright spawn. It's the most robust solution with minimal code changes and no test execution impact.

**Technical Approach**:
- Load `apps/e2e/.env.local` in `test-controller.cjs` using dotenv or manual parsing
- Merge loaded variables with `process.env` before spawning Playwright
- Ensure `E2E_SUPABASE_SERVICE_ROLE_KEY` is available in spawn environment

**Architecture Changes** (if any):
- None - this is purely env configuration

**Migration Strategy** (if needed):
- None - backward compatible

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Load .env.local before Playwright spawn (lines ~1156-1173)

### New Files

No new files needed - we're modifying existing test infrastructure.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Analyze current environment variable handling

<describe what this step accomplishes>

- Read the current `test-controller.cjs` implementation (around lines 1156-1173)
- Verify how `process.env` is currently passed to Playwright spawn
- Check if dotenv is already imported or available
- Determine optimal loading method

**Why this step first**: Understand the existing pattern before making changes

#### Step 2: Load .env.local in test controller

<describe what this step accomplishes>

- Import or use dotenv to load `apps/e2e/.env.local`
- Parse the .env.local file before Playwright spawn
- Merge environment variables into spawn environment

**Specific implementation**:
```javascript
// In test-controller.cjs, before spawning Playwright:
// Option A: Using dotenv (if available)
require('dotenv').config({ path: path.join(__dirname, '../../apps/e2e/.env.local') });

// Option B: Manual parsing (fallback if dotenv not in scope)
// Read and parse .env.local file, merge into process.env
```

Ensure the `E2E_SUPABASE_SERVICE_ROLE_KEY` and other critical test vars are loaded.

#### Step 3: Verify environment variables propagate correctly

<describe what this step accomplishes>

- Add debug logging (optional) to verify env vars are loaded
- Run test setup locally to confirm JWT validation works
- Verify no regressions in Playwright spawn behavior

#### Step 4: Test the fix

<describe what this step accomplishes>

- Run E2E shard 7 (Payload tests) to verify JWT errors are eliminated
- Verify test users are created successfully
- Verify all existing E2E tests still pass

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm bug is fixed (no JWT validation errors in logs)

## Testing Strategy

### Unit Tests

No new unit tests needed - this is environment configuration, not business logic.

**Implicit coverage**: E2E tests serve as integration tests for this fix.

### Integration Tests

No new integration tests needed.

### E2E Tests

The existing E2E test suite validates this fix:
- Running `/test 7` should complete without JWT validation errors
- All test shards should pass with clean logs

**Test files affected**:
- All E2E tests (implicitly tested via global-setup)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify local Supabase is running: `pnpm supabase:web:start`
- [ ] Verify test Docker containers started: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Run E2E shard 7 to trigger test user setup: `/test 7`
- [ ] Check logs for absence of JWT validation errors
- [ ] Verify test output shows `✅ Test users ready` without preceding auth failures
- [ ] Confirm all tests in the shard pass successfully
- [ ] Run full E2E suite to ensure no regressions: `pnpm test:e2e`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Environment variable collision**: If the test controller already has conflicting env vars set
   - **Likelihood**: low
   - **Impact**: low (dotenv won't override existing vars, can add explicit override if needed)
   - **Mitigation**: Use dotenv `override: true` if needed, test locally first

2. **Path resolution issues**: If relative paths don't resolve correctly
   - **Likelihood**: low
   - **Impact**: low (env loading just fails silently, test continues)
   - **Mitigation**: Use absolute path calculation with `path.join(__dirname, ...)`

3. **Dotenv not available**: If dotenv package isn't in scope
   - **Likelihood**: very low (already used elsewhere in project)
   - **Impact**: low (use manual file parsing as fallback)
   - **Mitigation**: Check package availability, implement fallback

**Rollback Plan**:

If this change causes issues in production:
1. Remove the `.env.local` loading code from `test-controller.cjs`
2. Revert to using fallback env variables
3. Tests will continue to work (users already exist) but JWT warnings will return

**Monitoring** (if needed):
- Monitor E2E test logs for JWT validation errors after deployment
- Verify test setup completes cleanly on fresh database

## Performance Impact

**Expected Impact**: minimal

The fix adds a single file read and parsing operation at test startup, which is negligible (<1ms impact).

**Performance Testing**:
- Verify test setup time hasn't increased significantly
- Use `/test --timing` to compare before/after setup duration

## Security Considerations

**Security Impact**: none

This fix is purely about environment variable propagation and doesn't introduce new security concerns. The `E2E_SUPABASE_SERVICE_ROLE_KEY` is already used in the existing code.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start test infrastructure
pnpm supabase:web:start &
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests - should show JWT validation errors
/test 7
```

**Expected Result**: Log output shows JWT validation errors like:
```
Failed to create user michael@slideheroes.com: AuthApiError: invalid JWT: unable to parse or verify signature
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E shard 7
/test 7

# Run full E2E suite
pnpm test:e2e
```

**Expected Result**:
- All commands succeed
- E2E test output has no JWT validation errors
- Test setup shows `✅ Test users ready` with no preceding auth failures
- All tests pass

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specifically run E2E tests multiple times to verify stability
/test 1
/test 2
/test 3
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. The fix uses `dotenv` which is already available in the project.

OR

**No new dependencies required**

## Database Changes

**Database changes needed**: no

**No database changes required** - this is purely environment configuration.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- Change is local to test infrastructure
- Won't affect production

**Feature flags needed**: no

**Backwards compatibility**: maintained - no breaking changes

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] E2E test setup completes without JWT validation errors
- [ ] Test user creation succeeds on first attempt
- [ ] All E2E tests pass (no regressions)
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

The `.env.local` file in `apps/e2e/` should contain `E2E_SUPABASE_SERVICE_ROLE_KEY` and other test environment variables. This fix ensures they're available in the Playwright spawn environment.

The fix is simple because it's purely about ensuring environment variables are properly propagated - no changes to test logic or Supabase interaction patterns needed.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1787*
