# Bug Fix: Playwright authentication cookie mismatch with Supabase URLs

**Related Diagnosis**: #876 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Cookie names derived from Supabase URL hostname differ between E2E setup (host.docker.internal) and dev server (127.0.0.1)
- **Fix Approach**: Standardize on Docker test environment for all E2E tests and update documentation to enforce this pattern
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Playwright E2E tests fail to authenticate when run against `pnpm dev` because auth state cookies are generated with `sb-host-auth-token` (from `host.docker.internal`) but the dev server expects `sb-127-auth-token` (from `127.0.0.1`).

For full details, see diagnosis issue #876.

### Solution Approaches Considered

#### Option 1: Standardize on Docker Test Environment

**Description**: Always run Playwright E2E tests against the Docker test environment (`docker-compose.test.yml`), which uses `host.docker.internal` consistently. Update the frontend-debugging skill and all documentation to enforce this pattern.

**Pros**:
- Consistent environment between auth state generation and test execution
- Docker environment mirrors production more closely
- Single source of truth for test configuration
- Already the default in `playwright.config.ts` (port 3001)
- Eliminates all cookie name mismatch issues

**Cons**:
- Requires Docker to be running for E2E tests
- Slightly slower startup than bare `pnpm dev`

**Risk Assessment**: low - Docker is already the standard for E2E testing

**Complexity**: moderate - Requires documentation updates across multiple files

#### Option 2: Dynamic Cookie URL Configuration

**Description**: Set `E2E_SERVER_SUPABASE_URL=http://127.0.0.1:54521` when running tests against `pnpm dev` to generate cookies with matching names.

**Pros**:
- Allows running tests against either environment
- More flexible for development workflows

**Cons**:
- Requires remembering to set environment variables
- Easy to forget configuration, leading to confusing failures
- Two configurations to maintain
- Inconsistent with current documentation and defaults

**Why Not Chosen**: Adds complexity and opportunities for misconfiguration. The diagnosis already shows this is a common source of confusion.

#### Option 3: Detect and Auto-Configure Cookie URL

**Description**: Modify `global-setup.ts` to detect which server is running and automatically use the correct cookie URL.

**Pros**:
- "Just works" for developers
- No manual configuration needed

**Cons**:
- Complex detection logic
- Race conditions if server isn't fully started
- May mask configuration issues that would surface in CI
- Adds maintenance burden

**Why Not Chosen**: Over-engineered solution that hides rather than addresses the root issue.

### Selected Solution: Standardize on Docker Test Environment

**Justification**: Docker is already the intended environment for E2E tests (port 3001 is the default in `playwright.config.ts`). By enforcing this pattern consistently and updating all documentation, we eliminate confusion and ensure reliable test execution.

**Technical Approach**:
- Add pre-test validation to detect and warn about port 3000 usage
- Update frontend-debugging skill to enforce Docker-first pattern
- Add clear error messages when Docker isn't running
- Document the requirement explicitly

**Architecture Changes**: None - this is a documentation and validation improvement.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/global-setup.ts` (lines 134, 164-165) - Add validation for Docker environment
- `.claude/skills/frontend-debugging/SKILL.md` - Enforce Docker-first pattern for E2E tests
- `.claude/skills/frontend-debugging/references/debugging-checklist.md` - Update port references
- `apps/e2e/README.md` (if exists) - Document Docker requirement

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Docker Environment Validation to Global Setup

Add validation in `global-setup.ts` to detect when tests might run against the wrong environment:

- Add check for baseURL containing port 3000 (dev server)
- Log warning if running against non-Docker environment
- Suggest using Docker test environment

**Why this step first**: Prevents future occurrences by catching misconfiguration early.

#### Step 2: Update Frontend-Debugging Skill for Docker-First E2E

Update `.claude/skills/frontend-debugging/SKILL.md` to enforce Docker test environment for Playwright tests:

- Add **critical warning** section about E2E auth state requirements
- Update "Using Project E2E Commands" section to emphasize Docker requirement
- Add pre-flight check commands before running E2E tests
- Update all E2E-related examples to use port 3001 (Docker)
- Add troubleshooting section for cookie mismatch errors

Changes to make:

1. Add new section after "Server Environment" titled "E2E Test Environment (CRITICAL)"
2. Add warning box explaining:
   - E2E tests MUST run against Docker test environment (port 3001)
   - Auth states are generated with `host.docker.internal` cookie names
   - Running against `pnpm dev` (port 3000) will cause authentication failures
3. Add pre-E2E checklist:
   ```bash
   # Before running E2E tests, ALWAYS start Docker:
   docker-compose -f docker-compose.test.yml up -d

   # Verify Docker is healthy:
   curl -s http://localhost:3001/api/health

   # Then run tests:
   pnpm --filter e2e test
   ```
4. Update "Existing Project Resources" section to add:
   - "E2E tests REQUIRE Docker test environment on port 3001"
   - "Do NOT run E2E tests against `pnpm dev` (port 3000)"

#### Step 3: Update Debugging Checklist

Update `.claude/skills/frontend-debugging/references/debugging-checklist.md`:

- Add "E2E Authentication Failures" section
- Document the cookie mismatch error pattern
- Add diagnostic commands to identify the issue
- Add resolution steps

#### Step 4: Add E2E Test for Cookie Name Validation (Optional)

Consider adding a test that validates cookie names match expected pattern:

- Test that auth state cookies match server expectations
- Add to preflight validations if valuable
- Skip if too complex for the fix scope

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test E2E authentication works with Docker environment
- Confirm frontend-debugging skill documents the fix correctly

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration/documentation fix.

### Integration Tests

Add validation to existing preflight checks:
- Verify warning appears when baseURL uses port 3000
- Confirm Docker health check runs before tests

**Test files**:
- `apps/e2e/tests/utils/e2e-validation.ts` - Add environment validation

### E2E Tests

Existing E2E tests will serve as validation:
- Run full E2E suite against Docker environment
- Verify all authentication works correctly

**Test files**:
- All existing E2E tests in `apps/e2e/tests/`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Docker test environment: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify health check passes: `curl http://localhost:3001/api/health`
- [ ] Run E2E setup: `cd apps/e2e && npx playwright test --project=setup`
- [ ] Verify auth states created in `.auth/` directory
- [ ] Run E2E tests: `pnpm --filter e2e test`
- [ ] Verify tests pass (authentication works)
- [ ] Stop Docker and try running against `pnpm dev` on port 3000
- [ ] Verify warning message appears about wrong environment
- [ ] Read updated frontend-debugging skill
- [ ] Verify documentation is clear and actionable

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Documentation may not be read**: Developers may not read the updated skill/docs
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Add runtime validation with clear error messages

2. **Docker not installed on some systems**: Some developers may not have Docker
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Document Docker installation requirement; this is already a project requirement

**Rollback Plan**:

If this fix causes issues:
1. Revert documentation changes
2. Revert validation additions in global-setup.ts
3. Return to previous configuration

**Monitoring**:
- Monitor for E2E test failures in CI
- Check for developer complaints about Docker requirement

## Performance Impact

**Expected Impact**: none

No performance implications - this is documentation and validation only.

## Security Considerations

**Security Impact**: none

No security implications. Cookie names are not security-sensitive.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server (not Docker)
pnpm dev &

# Wait for server
sleep 15

# Generate auth states (will use host.docker.internal cookies)
cd apps/e2e && npx playwright test --project=setup

# Run tests against port 3000 (should fail authentication)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/auth/
```

**Expected Result**: Tests fail with authentication errors (redirected to login)

### After Fix (Bug Should Be Resolved)

```bash
# Start Docker test environment
docker-compose -f docker-compose.test.yml up -d

# Wait for health check
sleep 30
curl http://localhost:3001/api/health

# Generate auth states
cd apps/e2e && npx playwright test --project=setup

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E tests against Docker (port 3001 - default)
pnpm --filter e2e test

# Verify warning appears when using wrong port
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm --filter e2e test 2>&1 | grep -i "warning\|docker"
```

**Expected Result**: All commands succeed, tests pass against Docker environment, warning shown for wrong port.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run full E2E suite
docker-compose -f docker-compose.test.yml up -d
pnpm --filter e2e test
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is a development-time configuration fix. No deployment changes needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Global setup warns when running against non-Docker environment
- [ ] Frontend-debugging skill clearly documents Docker requirement
- [ ] Debugging checklist includes E2E auth troubleshooting
- [ ] All E2E tests pass against Docker environment
- [ ] Documentation is clear and discoverable
- [ ] Manual testing checklist complete

## Notes

### Key Documentation Updates for Frontend-Debugging Skill

Add this critical section after "Server Environment (IMPORTANT)":

```markdown
## E2E Test Environment (CRITICAL)

**WARNING**: Playwright E2E tests MUST run against the Docker test environment (port 3001).

### Why Docker is Required

Authentication cookies are named based on the Supabase URL hostname:
- Docker server uses `host.docker.internal` → cookie: `sb-host-auth-token`
- Dev server uses `127.0.0.1` → cookie: `sb-127-auth-token`

The E2E global setup generates auth states using `host.docker.internal`. If you run tests against `pnpm dev` (port 3000), the server expects `sb-127-auth-token` but receives `sb-host-auth-token`, causing all authenticated tests to fail.

### Before Running E2E Tests

```bash
# 1. Start Docker test environment (REQUIRED)
docker-compose -f docker-compose.test.yml up -d

# 2. Wait for health check
curl -s http://localhost:3001/api/health

# 3. Generate auth states (if needed)
cd apps/e2e && npx playwright test --project=setup

# 4. Run E2E tests
pnpm --filter e2e test
```

### Common Mistake

**DO NOT** run E2E tests against `pnpm dev`:
```bash
# WRONG - Will cause auth failures
pnpm dev  # Port 3000
pnpm --filter e2e test

# CORRECT - Use Docker
docker-compose -f docker-compose.test.yml up -d  # Port 3001
pnpm --filter e2e test
```
```

### Related Issues

- Diagnosis: #876
- Root cause: Supabase SSR cookie naming derives from URL hostname

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #876*
