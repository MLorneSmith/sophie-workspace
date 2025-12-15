# Bug Fix: E2E Browser-Server URL Conflict (Docker host.docker.internal)

**Related Diagnosis**: #1133 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `NEXT_PUBLIC_SUPABASE_URL` set to `host.docker.internal:54521` works for server-side code in Docker but fails for browser-side code (browsers cannot resolve Docker hostnames)
- **Fix Approach**: Playwright route interception - transparently rewrite browser requests from `host.docker.internal` to `127.0.0.1` without changing production code
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests fail because of an architecture conflict:
- **`NEXT_PUBLIC_*` variables** embed a single URL at build time for both server and browser contexts
- **Inside Docker containers** (server-side): `host.docker.internal:54521` correctly resolves to the host machine where Supabase runs
- **In browsers** (browser-side): `host.docker.internal` is a Docker-specific hostname that browsers cannot resolve, causing requests to timeout

This supersedes issue #1132 which incorrectly proposed changing to `127.0.0.1`. That approach breaks server-side code because inside Docker, `127.0.0.1` refers to the container itself (not the host).

**Affected Tests**:
1. Password update test - times out waiting for `/auth/v1/user` PUT response
2. Invitation tests - role selector dropdown shows empty (browser query fails)

### Solution Approaches Considered

#### Option 1: Playwright Route Interception ⭐ RECOMMENDED

**Description**: Add a Playwright context fixture that globally intercepts all browser requests containing `host.docker.internal` and rewrites the hostname to `127.0.0.1`. The rewrite happens at the HTTP layer before requests leave the browser, so server-side code continues unchanged.

**Pros**:
- Server-side code continues using `host.docker.internal` (unchanged)
- Browser requests transparently rewritten to `127.0.0.1`
- Zero changes to production code or build configuration
- Only affects E2E tests, no impact on development or production
- Minimal code addition (~15 lines of Playwright config)
- Can be implemented in `globalSetup` or via test fixtures
- Easy to test and debug - requests can be logged before/after rewrite

**Cons**:
- Only addresses E2E browser layer, not other potential hostname issues
- Requires understanding of Playwright routing mechanics
- Could potentially rewrite legitimate `host.docker.internal` URLs in test assertions (unlikely but possible)

**Risk Assessment**: Low - Playwright route interception is a standard, well-documented feature. The rewrite only affects URLs matching the pattern, and all other functionality remains untouched.

**Complexity**: Simple - ~20 lines of TypeScript in Playwright configuration

#### Option 2: Separate Environment Variables

**Description**: Create separate environment variables for different contexts:
- `NEXT_PUBLIC_SUPABASE_URL` (server/server-side): `host.docker.internal:54521`
- `NEXT_PUBLIC_SUPABASE_BROWSER_URL` (browser-only): `127.0.0.1:54521`
- Use the browser URL in client components

**Pros**:
- Clean separation of concerns
- Explicit about different URL contexts
- No request interception needed

**Cons**:
- Requires code changes in all client components that use Supabase URL
- More complex to maintain and document
- Could introduce bugs if wrong URL is used in wrong context
- Affects production code, not just tests
- Requires careful migration to avoid breaking existing code

**Why Not Chosen**: Adds production code complexity when this is fundamentally a test environment issue. The route interception approach is simpler and more focused.

#### Option 3: Host Entry (`/etc/hosts`)

**Description**: Add a system-level host entry mapping `host.docker.internal` to `127.0.0.1` in the test runner's `/etc/hosts` file.

**Pros**:
- No code changes needed
- Handles all applications and network requests uniformly

**Cons**:
- System configuration required - not portable across machines
- Requires elevated permissions (sudo)
- CI environments may not allow `/etc/hosts` modifications
- Doesn't work in browser contexts (browsers have their own hostname resolution)
- Not suitable for team development environments

**Why Not Chosen**: Browsers don't use system `/etc/hosts` for hostname resolution - they have their own DNS resolution, so this approach won't work for the actual problem.

#### Option 4: Reverse Proxy (nginx/caddy)

**Description**: Deploy a reverse proxy container that maps `host.docker.internal` requests to `127.0.0.1:54521`.

**Pros**:
- Centralized request routing
- Could handle other routing needs in the future

**Cons**:
- Significant infrastructure complexity
- Requires proxy configuration and maintenance
- Overkill for a simple hostname rewrite
- Adds startup time and resource overhead
- Harder to debug than direct route interception

**Why Not Chosen**: Too complex for a simple, isolated problem. Reverse proxy adds infrastructure overhead when Playwright already provides this capability natively.

### Selected Solution: Playwright Route Interception

**Justification**: This approach is the best because it:
1. **Solves the root cause** - Transparently rewrites the hostname at the HTTP layer where the actual failure occurs
2. **Minimal code** - Only ~20 lines of Playwright configuration
3. **Zero production impact** - No changes to application code, only test infrastructure
4. **Isolated to E2E** - Doesn't affect development or production environments
5. **Easy to understand and maintain** - Route interception is standard Playwright practice
6. **Can be deployed immediately** - No coordination needed with other systems or environments

**Technical Approach**:
- Add route interception in the Playwright context to match all requests containing `host.docker.internal`
- Rewrite the hostname to `127.0.0.1` before the request is sent
- Preserve all other aspects of the request (method, headers, body, etc.)
- Can be implemented in `globalSetup.ts` or as a Playwright fixture

**Architecture Changes** (none):
- This fix doesn't modify any architecture
- It only adds a test infrastructure layer to handle Docker hostname translation

**Migration Strategy** (none required):
- Existing tests need no changes
- This is a transparent fix that tests won't need to know about

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Update or verify context fixture setup
- `apps/e2e/global-setup.ts` - Add route interception setup (if using context fixture approach)
- OR create `apps/e2e/playwright.fixtures.ts` - New file with custom context fixture

### New Files (Optional)

If using the fixture approach:
- `apps/e2e/playwright.fixtures.ts` - Custom fixture with route interception logic (enables reuse across all tests)

### Step-by-Step Tasks

#### Step 1: Implement Route Interception in Global Setup

Add route interception setup that will apply to all browser contexts created during testing.

**Why this step first**: Route interception must be configured before any tests run. Adding it to `globalSetup.ts` ensures it applies to all context creations.

- Add route interception logic to `apps/e2e/global-setup.ts`
- Intercept requests matching pattern `**/*host.docker.internal*`
- Rewrite hostname from `host.docker.internal` to `127.0.0.1`
- Log rewritten URLs for debugging (optional but helpful for verification)
- Ensure interception applies to both authenticated and unauthenticated contexts

**Code Pattern**:
```typescript
await context.route('**/*host.docker.internal*', async (route) => {
  const url = route.request().url().replace('host.docker.internal', '127.0.0.1');
  await route.continue({ url });
});
```

#### Step 2: Test Route Interception with Password Update Test

Verify that the route interception fixes the timeout issue in the password update test.

- Run the failing password update test locally: `pnpm test invitations/password-update.spec.ts` (or appropriate test name)
- Verify test no longer times out waiting for `/auth/v1/user` response
- Confirm Supabase receives the rewritten URL request
- Check browser console and Playwright trace for any routing errors

**Why this step**: Password update test was one of the primary failures in the diagnosis. Verifying it works confirms the core fix is effective.

#### Step 3: Test Route Interception with Invitation Tests

Verify that route interception fixes the empty role selector dropdown issue.

- Run the failing invitation tests: `pnpm test invitations/invitations.spec.ts`
- Verify role selector dropdown now populates correctly
- Confirm all invitation workflow tests pass
- Check that browser queries to Supabase succeed

**Why this step**: Invitation tests were the second primary failure. This confirms the fix works for dropdown/query issues.

#### Step 4: Run Full E2E Test Suite

Verify no regressions and all tests pass with route interception enabled.

- Add/update unit tests for route interception logic
- Run all E2E tests: `pnpm --filter e2e test`
- Run E2E tests with all shards: `pnpm test:shard*`
- Verify no new test failures introduced
- Check test duration hasn't increased significantly

**Why this step**: Full test suite execution ensures the fix doesn't introduce regressions in other tests and maintains performance.

#### Step 5: Validate and Document

Document the fix and verify all edge cases are handled.

- Add comments explaining the route interception and why it's needed
- Verify edge cases:
  - Tests without Supabase calls (should not be affected)
  - Tests making direct HTTP calls to `host.docker.internal` (should be rewritten)
  - Tests checking URL values in assertions (should work correctly)
- Update test documentation if needed
- Verify CI/CD tests will benefit from this fix

**Why this step last**: This is validation and documentation. Once core fix is verified to work, we document and ensure edge cases are handled.

## Testing Strategy

### Unit Tests

Add unit tests for the route interception logic:

- ✅ Route interception correctly rewrites `host.docker.internal` to `127.0.0.1`
- ✅ Other URLs are not affected by interception
- ✅ Rewritten URLs maintain all request properties (method, headers, body)
- ✅ Edge case: URLs with `host.docker.internal` as a port number are not rewritten
- ✅ Edge case: Multiple `host.docker.internal` occurrences in a URL are all rewritten

**Test files**:
- `apps/e2e/tests/fixtures/route-interception.spec.ts` - Tests for route interception setup and verification

### Integration Tests

Add integration tests that verify the route interception works in actual E2E tests:

- ✅ Browser requests to Supabase via `host.docker.internal` are successfully rewritten and executed
- ✅ Authentication flows work with rewritten URLs
- ✅ Database queries via Supabase client work after URL rewrite

**Test files**:
- `apps/e2e/tests/smoke/smoke.spec.ts` - Already exists; verify it passes with route interception
- `apps/e2e/tests/authentication/auth.spec.ts` - Already exists; verify auth flows work
- `apps/e2e/tests/invitations/invitations.spec.ts` - The originally failing test; verify it passes

### E2E Tests

The actual tests that were failing should now pass:

- ✅ Password update test completes without timeout
- ✅ Invitation tests show populated role selector
- ✅ All invitation workflow tests pass end-to-end

**Test files**:
- See "Affected Tests" in diagnosis: password-update and invitation tests

### Manual Testing Checklist

Before considering the fix complete:

- [ ] Run password update test locally and verify it passes
- [ ] Run invitation tests locally and verify they pass
- [ ] Run all E2E tests with `pnpm --filter e2e test` and verify all pass
- [ ] Verify no new console errors or warnings in test output
- [ ] Check CI/CD pipeline - verify E2E tests pass on remote
- [ ] Verify local development still works (port 3000) - not affected by route interception
- [ ] Test on different operating systems (Windows WSL2, Linux, macOS) if team has diverse setup
- [ ] Verify trace files show successful requests (no failed route interceptions)

## Risk Assessment

**Overall Risk Level**: Low

The route interception approach is low-risk because:
1. It's an HTTP layer operation that doesn't affect business logic
2. It only modifies request URLs, preserving all other request properties
3. It's applied only to E2E tests via global setup, not production code
4. Playwright's route interception is a well-tested, standard feature
5. Fallback is trivial - remove the route handler and tests fail as before

**Potential Risks**:

1. **Route Pattern Matches Unintended URLs**: If test code or Supabase client has `host.docker.internal` in URL assertions
   - **Likelihood**: Low - `host.docker.internal` is only set in environment variables
   - **Impact**: Low - Assertions would compare rewritten URL to string, might need assertion updates
   - **Mitigation**: Test carefully with password update and invitation tests first; add logging to see what URLs are being rewritten

2. **Performance Impact**: Route interception might add latency to test requests
   - **Likelihood**: Low - Playwright optimizes route interception internally
   - **Impact**: Low - Even with overhead, should be negligible
   - **Mitigation**: Measure test duration before and after; if noticeable increase, optimize route pattern

3. **CI/CD Environment Differences**: Route interception might behave differently in CI vs local
   - **Likelihood**: Low - Route interception is platform-independent
   - **Impact**: Medium - CI tests fail while local pass (catches testing environment issues)
   - **Mitigation**: Test on CI environment after merging; CI already runs full E2E test suite

4. **Browser Context Isolation**: Multiple tests using different storage states might interfere
   - **Likelihood**: Very Low - Route interception applies per-context, doesn't share state
   - **Impact**: Low - If it happens, would only affect specific test
   - **Mitigation**: Current implementation already handles context isolation; no additional mitigations needed

**Rollback Plan**:

If this fix causes issues in production or CI:

1. **Immediate**: Remove route interception handler from `globalSetup.ts`
2. **Verification**: Run E2E tests again - should fail as before (original state)
3. **Investigation**: Check Playwright logs for route interception errors
4. **Alternative**: Implement Option 2 (separate environment variables) if route interception proves unreliable
5. **Communication**: Update GitHub issue with findings

**Monitoring** (if needed):

After deploying the fix to CI:
- Monitor E2E test pass rate in CI (should improve from current failures)
- Watch for new test failures that might indicate unintended URL rewrites
- Track test execution time (should remain similar or improve)
- Monitor Playwright trace files for successful route interceptions

## Performance Impact

**Expected Impact**: Minimal (neutral to slight improvement)

- Route interception adds negligible overhead (~1-2ms per request)
- Test execution time should remain similar or improve (fewer timeouts)
- Docker hostname resolution was causing timeouts; fixing it reduces latency
- Parallel test execution remains enabled and unaffected

**Performance Testing**:

```bash
# Measure test duration before and after fix
time pnpm --filter e2e test tests/invitations/invitations.spec.ts

# Compare with baseline
# Should see reduced timeout waiting and faster completion
```

## Security Considerations

**Security Impact**: None

- Route interception only affects E2E tests running locally or in test CI pipeline
- No changes to production code or authentication mechanisms
- The rewrite from `host.docker.internal` to `127.0.0.1` is a transparent hostname translation
- No sensitive data handling or credential exposure involved
- Supabase API calls are already secured via normal HTTPS/auth mechanisms

No security review needed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start test environment if not running
docker-compose -f docker-compose.test.yml up -d

# Test should timeout or fail
pnpm --filter e2e test tests/invitations/invitations.spec.ts
# Expected: Test fails with timeout waiting for Supabase response
# Expected: Role selector dropdown appears empty
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for route interception
pnpm --filter e2e test tests/fixtures/route-interception.spec.ts

# Integration tests - password update (was failing)
pnpm --filter e2e test tests/authentication/password-update.spec.ts

# Integration tests - invitations (was failing)
pnpm --filter e2e test tests/invitations/invitations.spec.ts

# All E2E tests
pnpm --filter e2e test

# Build
pnpm build
```

**Expected Result**: All commands succeed, tests that were previously failing now pass, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
# Verify dev server on port 3000 still works (uses different setup)
pnpm dev &
sleep 5
curl http://localhost:3000/api/health
pkill -f "next dev"

# Verify test server on port 3001 still works with route interception
docker-compose -f docker-compose.test.yml up -d
sleep 10
curl http://localhost:3001/api/health
```

## Dependencies

### New Dependencies

No new dependencies required. Route interception uses Playwright's built-in capabilities.

### Existing Dependencies Used

- `@playwright/test` - Already installed; we're using its route interception feature
- `dotenv` - Already loaded in playwright.config.ts for environment variables

## Database Changes

**Migration needed**: No

This fix doesn't modify the database schema, data, or migration system. It's purely a test infrastructure change.

## Deployment Considerations

**Deployment Risk**: Low

This fix only affects E2E tests and test infrastructure. No production deployment needed.

**Deployment Strategy**:
1. Implement route interception in `globalSetup.ts`
2. Test locally - verify password update and invitation tests pass
3. Push to GitHub
4. CI will automatically run E2E tests with the fix
5. Monitor CI test results to confirm fix worked
6. Close related GitHub issues once confirmed

**Feature flags needed**: No

**Backwards compatibility**: Maintained

Tests will continue to work the same way from outside perspective. The only change is internal - how browser requests reach Supabase.

## Success Criteria

The fix is complete when:

- ✅ Route interception code added to `globalSetup.ts` or dedicated fixture file
- ✅ All validation commands pass
- ✅ Password update test no longer times out
- ✅ Invitation tests show populated role selector and pass
- ✅ All E2E tests pass (zero regressions)
- ✅ Code review approved (if applicable)
- ✅ Manual testing checklist complete
- ✅ Trace/HAR files confirm rewritten URLs are being sent to Supabase
- ✅ Test execution time remains similar or improves
- ✅ CI/CD pipeline passes with the fix deployed

## Notes

### Why Playwright Route Interception Was Chosen

This approach was selected over alternatives because:

1. **Playwright already has this feature** - Route interception is a standard Playwright capability designed exactly for this use case
2. **Proven pattern** - Used successfully in many Playwright projects for similar Docker hostname translation issues
3. **Minimal code** - ~20 lines vs. dozens for separate environment variables or proxy setup
4. **Zero production impact** - This is purely test infrastructure; production code remains untouched
5. **Easy to test and debug** - Route interception can be logged and verified via Playwright trace files
6. **Future-proof** - If other hostname translation issues arise, this infrastructure is already in place

### Related Issues & References

- **Issue #1132** - Original incorrect diagnosis proposing `127.0.0.1` change (superseded by #1133)
- **Issue #714** - Original cookie mismatch fix that established the `host.docker.internal` architecture
- **Issues #918, #920** - CI-specific `host.docker.internal` fixes for Docker-in-Docker CI environments

### Additional Context

The core insight from diagnosis #1133 is critical: inside Docker, `127.0.0.1` means the container itself, not the host. The hostname `host.docker.internal` is Docker's way of saying "reach the host from inside a container." Browsers don't understand this Docker-specific hostname, so we need to translate it to an IP address the browser can resolve. Route interception does this translation transparently at the HTTP layer.

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1133*
