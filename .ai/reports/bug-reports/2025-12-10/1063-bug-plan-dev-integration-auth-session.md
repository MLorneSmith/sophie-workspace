# Bug Fix: Dev Integration Tests Fail - Authentication Session Not Persisted to Server

**Related Diagnosis**: #1062 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Supabase authentication session cookies created in global setup have incorrect domain/SameSite attributes for Vercel preview deployment URL, causing server-side middleware to reject sessions in parallel test execution. The issue is exacerbated by cookie name mismatches when using Docker and timing races when multiple workers authenticate simultaneously.
- **Fix Approach**: Implement serial test execution with improved session validation, add explicit cookie domain configuration for preview deployments, and enhance global setup cookie handling for Vercel environments
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow fails with 4 test failures (15 passed, 6 skipped out of 27 tests). Tests that access protected routes like `/home` get redirected to `/auth/sign-in` despite successful authentication in the global setup. The failures occur sporadically in parallel execution, indicating:

1. **Parallel Execution Race Condition**: Multiple test workers create/use authentication state simultaneously, causing cookie conflicts
2. **Cookie Domain Mismatch**: Cookies created with one domain don't match server expectations on Vercel preview URLs
3. **SameSite Cookie Restrictions**: `SameSite=Lax` cookies on initial navigation may not be sent in parallel workers
4. **Session Validation Timing**: Server middleware validates tokens before they're properly established in parallel environments

For full details, see diagnosis issue #1062.

### Solution Approaches Considered

#### Option 1: Serial Test Execution + Global Setup Improvements ⭐ RECOMMENDED

**Description**: Run integration tests in serial mode (one worker) to eliminate race conditions, improve cookie domain configuration in global setup to handle Vercel preview URLs, and add explicit session validation before protected routes.

**Pros**:
- Completely eliminates parallel execution race conditions
- Simple, reliable fix with minimal code changes
- Global setup improvements benefit all test scenarios
- No changes needed to test code itself
- Vercel preview URL support is robust and future-proof
- Reduces flakiness while maintaining test coverage

**Cons**:
- Test execution time increases (4+ minutes → 6-8 minutes)
- Does not scale to full parallel execution across multiple workers
- Masks potential concurrency issues in production

**Risk Assessment**: low - Serial execution is simple, proven pattern; global setup changes are additive and backward-compatible

**Complexity**: moderate - Requires understanding Supabase cookie naming, Vercel configuration, and playwright config

#### Option 2: Improve Session Refresh Logic in Global Setup

**Description**: Force session refresh after cookie injection in global setup, add explicit JWT validation, and implement retry logic for cookie creation.

**Pros**:
- Allows continued parallel execution
- More sophisticated session handling
- Could improve reliability in other scenarios

**Cons**:
- Doesn't address fundamental race condition in parallel workers
- More complex to implement and debug
- Requires coordinating between workers (difficult)
- Session refresh may still race with first test request

**Why Not Chosen**: Global setup is shared across all workers - improving it doesn't prevent workers from authenticating simultaneously. The real issue is **parallel execution itself**, not the setup logic.

#### Option 3: Independent Test Environment per Worker

**Description**: Create separate Supabase projects or database schemas for each parallel worker to isolate authentication states.

**Pros**:
- Completely isolates worker states
- Allows true parallel execution
- Prevents any cross-worker conflicts

**Cons**:
- Requires major infrastructure changes
- Significantly increases complexity
- Higher cost and overhead
- Difficult to maintain test data consistency

**Why Not Chosen**: Over-engineered for the scope of this bug. Serial execution solves the problem with minimal overhead while we investigate parallel execution patterns.

### Selected Solution: Serial Test Execution + Global Setup Improvements

**Justification**:
The root cause is **parallel worker authentication conflicts**, not individual test logic. Running tests serially (single worker) eliminates these conflicts entirely while maintaining test coverage. Improving global setup cookie handling provides defense-in-depth for Vercel preview environments. This approach is:
- **Simple**: Single configuration change + cookie handling improvement
- **Reliable**: Proven pattern used by many teams during CI/CD challenges
- **Reversible**: Can be reverted when proper parallel patterns are implemented
- **Effective**: Addresses the immediate issue while unblocking team productivity

**Technical Approach**:
1. Configure Playwright to use single worker in CI environments
2. Enhance global setup to detect Vercel preview URLs and configure cookies appropriately
3. Add explicit session validation in protected routes as safety net
4. Document the serial execution limitation and future parallel execution plan

**Architecture Changes** (if any):
- **No breaking changes** to test code or application
- **Playwright config**: Add conditional worker configuration for CI
- **Global setup**: Add Vercel URL detection and cookie domain configuration
- **Middleware**: Add optional session validation logging (non-blocking)

**Migration Strategy**:
- No data migration needed
- Test execution pattern change is transparent to tests
- Existing storage states continue to work
- Can be re-enabled for parallel execution when improvements are made

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Configure single worker in CI environment
- `apps/e2e/global-setup.ts` - Improve cookie domain handling for Vercel preview URLs
- `apps/web/middleware.ts` - Add optional session validation logging (debug only)
- `.github/workflows/dev-integration-tests.yml` - Verify environment variables and configuration

### New Files

No new files required. All changes are within existing configuration files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Playwright Configuration for Serial Execution in CI

<describe what this step accomplishes>
Configure Playwright to run with single worker in GitHub Actions CI environment while maintaining parallel execution for local development. This prevents race conditions during test execution.

- Modify `apps/e2e/playwright.config.ts` to detect CI environment
- Set workers to 1 when `process.env.CI === 'true'` or `process.env.GITHUB_ACTIONS === 'true'`
- Keep 4 workers for local development
- Add comment explaining the serial execution limitation and why it's necessary

**Why this step first**: Worker configuration affects all subsequent test execution. This must be set before running any tests.

#### Step 2: Improve Global Setup Cookie Domain Handling for Vercel

<describe what this step accomplishes>
Enhance global setup to detect Vercel preview deployment URLs and configure cookie domains appropriately. This ensures authentication cookies are properly recognized by the Vercel middleware regardless of the deployment URL structure.

- Read `PLAYWRIGHT_BASE_URL` or `TEST_BASE_URL` environment variables to detect Vercel preview URLs
- Parse the hostname from the provided base URL
- Configure Supabase client with dynamic cookie domain:
  - For Vercel preview URLs (`*.vercel.app`): Set domain to `.vercel.app` or specific domain
  - For localhost: Use default localhost behavior
  - For custom domains: Use appropriate domain configuration
- Add logging to show cookie configuration being used
- Test with both localhost and Vercel preview URLs

**Why this step**: Vercel preview URLs have different domain structures than localhost. Cookies created with one domain don't work on another. This ensures the global setup adapts to different deployment contexts.

#### Step 3: Add Session Validation Logging to Middleware (Optional, Non-Breaking)

<describe what this step accomplishes>
Add optional session validation logging in the middleware to provide debugging information if session issues recur. This is non-blocking and only logs debug information when enabled.

- Modify `apps/web/middleware.ts` to add optional session validation
- Log when session validation fails (only in development/debug mode)
- Include user ID, session expiration, and cookie information in logs
- Do NOT block requests or throw errors (validation is informational only)
- Can be enabled with `DEBUG_SESSION=true` environment variable

**Why this step**: Provides visibility into session validation without risking blocking legitimate requests. Helps with future debugging if similar issues arise.

#### Step 4: Verify and Document Test Execution Pattern

<describe what this step accomplishes>
Verify the serial execution is working correctly and document the current limitation with a plan for future improvements. This ensures the team understands why tests run serially and what the path forward is.

- Run E2E tests locally to verify they pass with serial execution
- Verify tests pass in CI environment with single worker
- Update `apps/e2e/CLAUDE.md` or create test documentation explaining:
  - Why serial execution is necessary for stability
  - Performance impact (execution time increase)
  - Plan for implementing proper parallel execution (future)
  - How to run locally with parallel workers if desired
- Add comments in playwright.config.ts explaining the pattern

**Why this step**: Documentation ensures the team understands the current state and doesn't accidentally revert the fix without understanding the consequences.

#### Step 5: Run Full Test Suite Validation

<describe what this step accomplishes>
Execute all validation commands to ensure the fix doesn't break existing functionality and that the integration tests now pass reliably.

- Run all E2E tests to verify they pass with serial execution
- Verify zero regressions in other test suites
- Test with Vercel preview deployment if available
- Confirm failed tests from #1062 now pass consistently

## Testing Strategy

### Unit Tests

No unit tests required - this is a configuration and integration-level fix.

### Integration Tests

The entire E2E test suite serves as integration testing. The key tests that were failing should now pass:

**Test files**:
- `apps/e2e/tests/account/account-simple.spec.ts` - settings page loads successfully, shows user email
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - user can update team name and slug, cannot create reserved names

### E2E Tests

All existing E2E tests should pass with serial execution:

**Test files**:
- All tests in `apps/e2e/tests/` should pass
- Focus validation on previously failing tests from diagnosis #1062

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter e2e test` locally - all tests pass
- [ ] Verify test execution uses single worker (check Playwright output)
- [ ] Push to dev branch and verify `dev-integration-tests.yml` workflow passes
- [ ] Check Vercel preview deployment (if available)
- [ ] Verify no timeout or health check failures in CI
- [ ] Confirm all 4 previously failing tests now pass consistently
- [ ] Check test execution time (expect 6-8 minutes for full suite)
- [ ] Verify Supabase health checks pass in CI environment

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Increased Test Execution Time**: Serial execution takes longer than parallel
   - **Likelihood**: high (definite)
   - **Impact**: medium (affects CI pipeline duration, not functionality)
   - **Mitigation**: Document expected execution time; consider running subset of tests on feature branches; implement parallel execution improvement plan

2. **Configuration Not Detected Correctly**: CI environment detection might fail
   - **Likelihood**: low (CI environment variables are reliable)
   - **Impact**: high (tests would fail if not detected)
   - **Mitigation**: Add explicit logging to verify worker count; test configuration in dry-run before merging

3. **Vercel Cookie Domain Configuration Mismatch**: Preview URL structure might not match expected pattern
   - **Likelihood**: low (Vercel URL structure is consistent)
   - **Impact**: high (could reintroduce session failures on preview deployments)
   - **Mitigation**: Add comprehensive URL parsing and logging; test with actual Vercel preview URLs

4. **Regression in Parallel Execution**: Other environments might expect parallel execution
   - **Likelihood**: low (serial execution is compatible)
   - **Impact**: low (just slower, doesn't break anything)
   - **Mitigation**: Document pattern; can be reverted if needed; plan future parallel implementation

**Rollback Plan**:

If this fix causes issues in production or other environments:

1. Revert `apps/e2e/playwright.config.ts` to use `workers: 4` unconditionally
2. Remove global setup cookie domain logic (revert to original implementation)
3. Revert middleware changes (remove session validation logging)
4. Re-run tests to verify rollback is successful
5. File issue for proper parallel execution implementation

The rollback is straightforward since changes are isolated to configuration files.

**Monitoring** (if needed):
- Monitor `dev-integration-tests.yml` workflow success rate (target: 100%)
- Track test execution time to detect unexpected slowdowns
- Alert if workflow failures return to >20% failure rate

## Performance Impact

**Expected Impact**: moderate (test execution time increase)

- **Before**: 3-4 minutes with 4 parallel workers (limited by slowest shard)
- **After**: 6-8 minutes with 1 worker (sequential execution)
- **Net Impact**: ~2-4 minutes slower per test run

This is acceptable for integration stability. Can be improved later with proper parallel execution patterns.

**Performance Testing**:
- Time test execution locally vs CI
- Compare to baseline time from when tests were working
- Monitor trend over time to detect unexpected slowdowns

## Security Considerations

**Security Impact**: none (positive)

- Serial execution with improved cookie handling enhances security by ensuring proper authentication state management
- No security weaknesses introduced
- Vercel URL detection doesn't expose sensitive information
- Session validation logging is optional and doesn't leak secrets

**Security Checklist**:
- No hardcoded credentials or secrets in configuration
- Cookie domain handling doesn't bypass security restrictions
- Session validation is informational only (non-blocking)
- No changes to authentication logic or RLS policies

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run integration tests (should fail with some tests redirected to /auth/sign-in)
cd apps/e2e
pnpm test

# Expected: 4 test failures, 15 tests pass, 6 skipped
# Failures in: account-simple.spec.ts, team-accounts.spec.ts
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E tests (should all pass)
pnpm --filter e2e test

# Build web app
pnpm --filter web build

# Build test environment
docker-compose -f docker-compose.test.yml build

# Run tests against test server
docker-compose -f docker-compose.test.yml up -d
pnpm --filter e2e test
docker-compose -f docker-compose.test.yml down

# Manual verification
# - All tests pass ✓
# - No authentication redirects ✓
# - Test execution time 6-8 minutes ✓
# - Previously failing tests (account-simple, team-accounts) pass ✓
```

**Expected Result**: All commands succeed, all E2E tests pass, no redirects to auth pages, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests multiple times to verify consistency
pnpm --filter e2e test
pnpm --filter e2e test
pnpm --filter e2e test

# If any failures occur, they should be consistent (not intermittent)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

All changes use existing Supabase and Playwright APIs.

### Existing Dependencies

- `@playwright/test` - for Playwright configuration
- `@supabase/ssr` - for cookie handling in global setup
- `next` - for middleware implementation

## Database Changes

**No database changes required**

This fix addresses authentication session handling at the application layer. No schema or migration changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special deployment steps needed
- Changes are configuration-only for E2E tests
- No changes to production code paths
- Safe to merge to any branch

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Existing tests continue to work
- Test data and storage states are compatible
- Can be reverted without impact

## Success Criteria

The fix is complete when:
- [ ] All 27 E2E tests pass consistently (0 flakiness)
- [ ] Previously failing tests (4 from #1062) now pass
- [ ] No test redirects to `/auth/sign-in` unexpectedly
- [ ] Tests run serially (single worker) in CI environment
- [ ] Tests run with 4 workers locally (original behavior)
- [ ] All validation commands pass
- [ ] Zero regressions in other test suites
- [ ] Test execution time is 6-8 minutes per run
- [ ] Documentation updated explaining serial execution
- [ ] Code review approved (if applicable)

## Notes

### Why Serial Execution Now, Parallel Later?

Parallel test execution with proper isolation is complex and requires:
1. Independent Supabase projects or schemas per worker
2. Separate test data generation for each worker
3. Coordinated test sharding strategy
4. Performance optimization for multiple parallel contexts

Serial execution is a pragmatic short-term solution that:
- Unblocks the team immediately
- Eliminates flaky tests
- Provides stable foundation for future improvements
- Can be implemented in phases as team capacity allows

### Future Improvements

Once this fix is in place, consider:
1. Implementing worker-specific database schemas or projects
2. Creating deterministic test data per worker
3. Researching Playwright's built-in parallel patterns
4. Benchmarking serial vs parallel performance
5. Gradual migration to parallel execution (2-4 workers initially)

### Related Issues

- #918 (CLOSED): Dev Integration Tests Fail with host.docker.internal DNS Error
- #876 (CLOSED): Playwright authentication fails due to Supabase cookie name mismatch
- #714 (CLOSED): E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware

These closed issues show a pattern of session/cookie authentication challenges. This fix addresses the root cause at the configuration level.

### Documentation References

- **E2E Testing Fundamentals**: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md` - Explains global setup, cookie naming, parallel execution architecture
- **Vercel Deployment**: `.ai/ai_docs/context-docs/infrastructure/vercel-deployment.md` - Documents preview deployment patterns and environment configuration
- **Authentication Overview**: `.ai/ai_docs/context-docs/infrastructure/auth-overview.md` - Explains Supabase authentication and session management

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1062*
