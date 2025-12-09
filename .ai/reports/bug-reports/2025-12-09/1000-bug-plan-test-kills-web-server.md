# Bug Fix: Test controller kills development web server on port 3000

**Related Diagnosis**: #998 (REQUIRED)
**Severity**: medium
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Port 3000 (development web server) is incorrectly included in test cleanup logic. E2E tests use ports 3001 and 3020, not 3000.
- **Fix Approach**: Remove port 3000 from cleanup targets in both `test-cleanup-guard.cjs` and `infrastructure-manager.cjs`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The test infrastructure is too aggressive in port cleanup, killing the user's development web server (running on port 3000) during E2E test execution. The E2E tests only use ports 3001 (web test server) and 3020 (Payload test server), making port 3000 cleanup unnecessary and harmful to development workflow.

For full details, see diagnosis issue #998.

### Solution Approaches Considered

#### Option 1: Remove port 3000 from cleanup lists ⭐ RECOMMENDED

**Description**: Simply remove port 3000 from the hardcoded port arrays in both affected files. Port 3000 is for development only and should never be managed by test infrastructure.

**Pros**:
- Simplest possible fix
- Minimal code changes (2 locations)
- Surgical precision - removes unnecessary port management
- Zero risk to test infrastructure (E2E tests don't use port 3000)
- Clear intent - development server is explicitly not managed by tests

**Cons**:
- None identified

**Risk Assessment**: low - Test infrastructure uses ports 3001 and 3020 exclusively; port 3000 is not involved in E2E test execution

**Complexity**: simple - Single line modifications in two files

#### Option 2: Add environment variable to skip port 3000

**Description**: Check if user is running development server before cleaning up ports, conditionally skip port 3000.

**Why Not Chosen**: Over-engineered. Port 3000 should simply never be touched by test infrastructure. The fix approach is more declarative and maintainable.

### Selected Solution: Remove port 3000 from cleanup lists

**Justification**: This is the correct long-term solution. Port 3000 is exclusively for development and should never be managed by test infrastructure. The test infrastructure should only manage ports that it actually uses (3001 for web tests, 3020 for Payload tests). Adding conditional logic would obscure the intent and add unnecessary complexity.

**Technical Approach**:
- In `test-cleanup-guard.cjs` lines 196 and 244: Change `[3000, 3001, 3010, 3020]` to `[3001, 3010, 3020]`
- In `infrastructure-manager.cjs` lines 1188-1192: Remove `this.config.ports.web` (which is 3000) from the `portsToClean` array, keeping only `webTest` (3001) and `payload` (3020)

**Architecture Changes**: None. This is a pure bug fix with no architectural implications.

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/utilities/test-cleanup-guard.cjs` - Two locations where port 3000 is incorrectly included in cleanup
- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - One location where port 3000 is included in cleanup

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix test-cleanup-guard.cjs - cleanupTestPorts method

**Location**: Lines 193-236 (specifically line 196)

**Change**: Replace the port array definition to exclude port 3000:

```javascript
// BEFORE:
let testPorts = [3000, 3001, 3010, 3020];

if (skipTestPorts) {
  testPorts = [3000, 3010, 3020];
}

// AFTER:
let testPorts = [3001, 3010, 3020];

if (skipTestPorts) {
  testPorts = [3010, 3020];
}
```

**Why this step first**: This method is called during cleanup and affects all test runs that use `cleanupTestPorts()`.

#### Step 2: Fix test-cleanup-guard.cjs - preTestCleanup method

**Location**: Lines 241-250 (specifically line 244)

**Change**: Replace the port array definition in `preTestCleanup()` to exclude port 3000:

```javascript
// BEFORE:
let testPorts = [3000, 3001, 3010, 3020];

if (skipTestPorts) {
  testPorts = [3000, 3010, 3020];
}

// AFTER:
let testPorts = [3001, 3010, 3020];

if (skipTestPorts) {
  testPorts = [3010, 3020];
}
```

**Why this step second**: This is the pre-test cleanup that was directly killing the development server. Fixing here prevents the immediate bug from occurring.

#### Step 3: Fix infrastructure-manager.cjs - cleanupPorts method

**Location**: Lines 1188-1192

**Change**: Remove `this.config.ports.web` from the ports to clean:

```javascript
// BEFORE:
let portsToClean = [
  this.config.ports.web,      // 3000 - kills dev server ❌
  this.config.ports.webTest,  // 3001
  this.config.ports.payload,  // 3020
];

// AFTER:
let portsToClean = [
  this.config.ports.webTest,  // 3001
  this.config.ports.payload,  // 3020
];
```

**Why this step third**: This is a secondary cleanup location. Fixing all three locations ensures comprehensive coverage.

#### Step 4: Manual testing to verify the fix

Execute these tests in order:

1. Start development server: `pnpm dev` (runs on port 3000)
2. Verify it's running: `curl http://localhost:3000` (should return 200)
3. Run E2E tests: `/test --e2e` or `pnpm test:e2e`
4. During test execution, verify port 3000 is still responding: `curl http://localhost:3000` in another terminal
5. After tests complete, verify development server is still running
6. Verify no E2E test failures related to port cleanup

#### Step 5: Validation and verification

Run the validation commands to ensure no regressions:

- Type check
- Lint
- Format
- All test suites
- Manual verification that development server survives test runs

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration/cleanup fix. The test suite itself validates the fix.

### E2E Tests

**Regression test**: The existing E2E test suite validates that:
- ✅ Web test server (port 3001) starts and is cleaned up properly
- ✅ Payload test server (port 3020) starts and is cleaned up properly
- ✅ Development server (port 3000) is NOT affected by test cleanup

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start development server with `pnpm dev`
- [ ] Verify development server is running on port 3000: `curl http://localhost:3000`
- [ ] Run E2E tests with `/test --e2e`
- [ ] While tests are running, verify port 3000 still responds to requests in another terminal
- [ ] After tests complete, verify development server is still running
- [ ] Verify no test failures or errors in E2E test output
- [ ] Verify development server is still accessible after test suite completes
- [ ] Test with `pnpm test:e2e` directly (not just `/test` command)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended side effects on test infrastructure**: If port 3000 cleanup was depended upon for test isolation
   - **Likelihood**: very low - Tests use ports 3001/3020, not 3000
   - **Impact**: medium - Could cause test failures
   - **Mitigation**: E2E test suite will immediately catch any issues; revert change if tests fail

2. **Port 3000 resource leakage**: If development server crashes and leaves port 3000 in use
   - **Likelihood**: low - Port cleanup isn't needed for normal test execution
   - **Impact**: low - User can manually kill development server if needed
   - **Mitigation**: Users can use `lsof -ti:3000 | xargs kill -9` if needed

**Rollback Plan**:

If this change causes unexpected issues:
1. Restore the three port array definitions to include port 3000
2. Revert commit
3. Investigate why port 3000 cleanup was needed (likely indicates separate underlying issue)

**Monitoring** (if needed):

Monitor first few E2E test runs to ensure:
- Tests still pass
- Development server survives test execution
- No port conflicts reported by users

## Performance Impact

**Expected Impact**: none

No performance implications. Cleanup operations will be slightly faster (one fewer port to check), but negligible.

## Security Considerations

**Security Impact**: none

No security implications. This is a cleanup/infrastructure fix with no security surface area.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start development server
pnpm dev &
DEV_PID=$!
sleep 3

# Verify it's running
curl http://localhost:3000 || echo "Dev server not responding"

# Run E2E tests (this will kill port 3000)
/test --e2e

# Try to access development server (should fail if bug exists)
curl http://localhost:3000 || echo "Dev server was killed by test cleanup"

# Kill background process
kill $DEV_PID || true
```

**Expected Result Before Fix**: Development server responds before tests, stops responding after tests (demonstrating the bug).

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E tests
pnpm test:e2e

# Manual verification
# 1. Start dev server
pnpm dev &
DEV_PID=$!
sleep 3

# 2. Verify it's running
curl http://localhost:3000

# 3. Run E2E tests
/test --e2e

# 4. Verify it's STILL running (key difference!)
curl http://localhost:3000

# 5. Kill dev server
kill $DEV_PID
```

**Expected Result**: All commands succeed, development server continues running during and after E2E tests.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify E2E tests specifically
pnpm test:e2e

# Verify development server workflow is not disrupted
# (manual: start dev, run tests in another terminal, verify both still work)
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - This is a bug fix

## Success Criteria

The fix is complete when:
- [ ] Port 3000 is removed from cleanup targets in both files
- [ ] Type check passes
- [ ] Lint check passes
- [ ] Format check passes
- [ ] All E2E tests pass
- [ ] Zero regressions detected
- [ ] Manual testing confirms development server survives test runs

## Notes

This is a straightforward bug fix with minimal risk. The root cause is clear (port 3000 should never be managed by test infrastructure), and the solution is obvious (remove it from cleanup lists).

The fact that port 3000 was being cleaned up suggests the original code was overly conservative - attempting to ensure a "clean slate" by killing all possible servers. The correct approach is to only manage the ports that the test infrastructure actually uses (3001 and 3020).

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #998*
