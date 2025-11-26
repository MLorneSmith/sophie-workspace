# Bug Fix: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware

**Related Diagnosis**: #713
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Middleware's `createMiddlewareClient()` cannot properly read Playwright-injected cookies from the request, causing `supabase.auth.getClaims()` to return null claims
- **Fix Approach**: Add cookie reconstruction logic to middleware client to properly handle chunked session cookies and verify request context at time of getClaims()
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests in Shard 3 (Personal Accounts) fail because the Next.js middleware cannot recognize pre-authenticated browser sessions. The middleware calls `supabase.auth.getClaims()` which returns no claims, triggering a redirect to `/auth/sign-in` instead of allowing access to protected pages like `/home/settings`.

The global setup successfully creates authenticated sessions and stores them in Playwright's browser storage state, but when the middleware tries to validate these sessions via `request.cookies`, the session is not available or not properly reconstructed.

For full details, see diagnosis issue #713.

### Solution Approaches Considered

#### Option 1: Add Middleware Logging with Cookie Reconstruction ⭐ RECOMMENDED

**Description**: Implement comprehensive logging in the middleware to capture:
1. Raw cookies received by middleware from request.cookies.getAll()
2. Chunked cookie reconstruction (if `sb-127-auth-token.0`, `.1` etc exist)
3. The exact state passed to `supabase.auth.getClaims()`
4. The response from getClaims() before redirect decision

Add middleware validation logic to properly reconstruct chunked cookies before passing to Supabase client.

**Pros**:
- Provides visibility into exact point of failure (debugging data)
- Minimal code changes - no architectural modifications
- Works with existing Supabase SSR patterns
- Easy to disable logging after diagnosis
- Fixes the immediate issue while providing diagnostic data for future improvements

**Cons**:
- Requires middleware modification (security-sensitive code)
- Initial implementation may be verbose (logging overhead)
- Temporary logging adds technical debt (should be removed once fixed)

**Risk Assessment**: low - Logging-only changes have minimal side effects; any new logic is additive to existing flow

**Complexity**: simple - Just add console/logger statements and cookie reconstruction

#### Option 2: Modify Global Setup to Use Single Auth State File

**Description**: Instead of trying to read individual cookies, modify global-setup.ts to create a single, shared authentication state file that all workers use, eliminating per-worker auth state duplication.

**Pros**:
- Eliminates parallel worker race conditions (no per-worker conflicts)
- Simpler E2E setup (single source of truth for auth)
- Reduces storage state file complexity

**Cons**:
- Doesn't address root cause (cookie reading in middleware)
- All workers share same user session (potential test isolation issues)
- Requires modifying E2E setup infrastructure
- Test pollution if one worker's test affects another

**Why Not Chosen**: This is a band-aid that hides the real problem. The middleware should be able to read cookies correctly. If we skip this diagnosis step, the same issue could reappear with different test patterns or configurations.

#### Option 3: Pre-fetch and Cache Session in Global Setup

**Description**: Have global setup not just create cookies, but also do an API call to verify the session is readable, logging any issues encountered during that verification.

**Pros**:
- Validates auth state before tests run (fail fast)
- Provides diagnostic data upfront
- Could catch cookie format issues early

**Cons**:
- Doesn't fix the middleware issue (tests still fail)
- Only moves the verification point earlier
- Adds overhead to global setup execution
- Doesn't help if issue is specific to middleware request context

**Why Not Chosen**: This helps with diagnosis but doesn't actually fix the middleware cookie reading issue.

### Selected Solution: Add Middleware Logging with Cookie Reconstruction

**Justification**:

The diagnosis confirms the middleware is the failure point - `getClaims()` returns null. We need to understand exactly why at that moment. Adding logging lets us see:
1. What cookies are actually in the request at middleware time
2. Whether chunked cookies exist and how they're structured
3. The exact state passed to the Supabase client
4. What getClaims() receives vs what it returns

This gives us definitive evidence to fix the real issue (cookie format, chunking, domain, or session state reconstruction). It's minimal risk (logging only), minimal code changes, and provides maximum diagnostic value.

**Technical Approach**:

1. **Add Middleware Request Cookie Logging**:
   - Log all cookies from `request.cookies.getAll()` at the start of `/home/*` handler
   - Identify any Supabase session cookies (`sb-*-auth-token*`)
   - Log their names, values (truncated), and sizes
   - Check for chunked cookie pattern (`.0`, `.1`, `.2` suffixes)

2. **Add getClaims() Logging**:
   - Log the complete claims object returned by `getClaims()`
   - Log before the `!data?.claims` check so we see exactly what's being evaluated
   - Include any errors from getClaims() operation

3. **Verify Chunked Cookie Reconstruction**:
   - If chunked cookies exist, log the reconstruction logic
   - Verify `@supabase/ssr` properly handles chunked cookies
   - Check if custom reconstruction is needed

4. **Add Test-Specific Logging Flag**:
   - Wrap logging in a debug flag (e.g., `if (process.env.DEBUG_E2E_AUTH)`)
   - Allows running tests with logging without affecting production
   - Easy to enable/disable

5. **Compare with Global Setup**:
   - Add matching logging to global-setup.ts when creating session
   - Compare cookie format from setup vs what middleware receives
   - Identify any format mismatches or transformations

**Architecture Changes** (if any):

- Add optional logging layer to middleware (no structural changes)
- Import enhanced logger (`@kit/shared/logger`) if not already present
- No changes to authentication flow or RLS policies

**Migration Strategy** (if needed):

None - this is additive logging. Tests continue to run and fail as before, but now we have visibility.

## Implementation Plan

### Affected Files

- `apps/web/proxy.ts:179-215` - Middleware handler for `/home/*?` routes; add logging before/after getClaims() call
- `packages/supabase/src/clients/middleware-client.ts` - Inspect and potentially enhance cookie handling logic
- `apps/e2e/global-setup.ts` - Add matching logging when creating auth state to compare with middleware logs
- `apps/web/.env.example` - Add `DEBUG_E2E_AUTH` environment variable documentation

### New Files

None - using existing logging infrastructure

### Step-by-Step Tasks

#### Step 1: Examine Current Middleware Cookie Handling

**Objective**: Understand exactly how the middleware client reads and processes cookies

- Read `packages/supabase/src/clients/middleware-client.ts` to understand how cookies are extracted
- Read `apps/web/proxy.ts` lines 179-215 to understand the `/home/*` handler flow
- Check if `@supabase/ssr` has known issues with chunked cookies (check package docs)
- Look for any cookie domain/path configuration in the middleware setup
- Document the exact flow from request.cookies to getClaims()

**Why this step first**: We need to understand the current implementation before adding logging. This ensures our logging captures all relevant points.

#### Step 2: Add Comprehensive Logging to Middleware

**Objective**: Capture cookie and claims state at the exact point of failure

- Import logger from `@kit/shared/logger` if not already imported
- Add logging to `apps/web/proxy.ts` in the `/home/*` handler:
  - Log all cookies from `request.cookies.getAll()` at handler start
  - Log any Supabase auth cookies specifically (name, value length, size)
  - Check for chunked cookie pattern (`.0`, `.1` suffixes)
  - Log the response from `supabase.auth.getClaims()`
  - Log the decision point (claims check) with the actual `claims` value
- Wrap logging in `if (process.env.DEBUG_E2E_AUTH === 'true')` flag for test-only visibility
- Use structured logging with context (include user info, request path, timestamp)

**Files to modify**:
- `apps/web/proxy.ts` - Add logging at approximately line 185 (before getClaims) and line 195 (after)

#### Step 3: Add Matching Logging to Global Setup

**Objective**: Compare auth state creation with middleware validation

- Open `apps/e2e/global-setup.ts`
- Add logging when session is created/stored to see:
  - Which cookies are created by Supabase auth
  - Cookie format and structure
  - Any chunking that occurs
- Use same logging format as middleware to enable easy comparison
- Wrap in same `DEBUG_E2E_AUTH` flag

**Files to modify**:
- `apps/e2e/global-setup.ts` - Add logging after session creation

#### Step 4: Run Shard 3 Tests with Debug Logging Enabled

**Objective**: Collect diagnostic data from failing tests

- Create a test script or manual instructions to run:
  ```bash
  DEBUG_E2E_AUTH=true pnpm test:e2e 3
  ```
- Capture complete console output including all logging
- Identify the exact point where session becomes unreadable
- Look for patterns:
  - Missing cookies between setup and middleware
  - Chunked cookie reconstruction failures
  - Claims object structure differences
  - Any errors in getClaims() operation

**Why this step after logging**: We need the logging in place before running tests to capture the diagnostic data.

#### Step 5: Diagnose and Implement Root Cause Fix

**Objective**: Based on logging data, implement the actual fix

This step will vary based on what logging reveals. Likely scenarios:

**If cookies are missing in middleware**:
- Check request context (Playwright may not be setting cookies correctly)
- Verify cookie domain/path configuration matches Playwright storage state
- Add explicit cookie reconstruction from request headers if needed

**If chunked cookies aren't reconstructed**:
- Check if `@supabase/ssr` handles chunked cookies correctly
- May need to implement custom chunked cookie reconstruction
- Add code to reassemble `sb-127-auth-token.0`, `.1` etc back into single cookie

**If getClaims() fails despite valid cookies**:
- Check for session refresh issues (access token expired but refresh token valid)
- Verify JWT signature validation
- Check for domain/origin mismatch issues
- May need to add session refresh logic before the check

**Files likely to be modified**:
- `packages/supabase/src/clients/middleware-client.ts` - If cookie handling needs enhancement
- `apps/web/proxy.ts` - If session refresh or request handling needs adjustment

#### Step 6: Add Regression Test

**Objective**: Prevent this issue from reoccurring

- Modify or create test that specifically validates:
  - Session created in global setup is readable in middleware
  - getClaims() returns valid claims for authenticated requests
  - Parallel workers don't interfere with each other's sessions
- Add explicit assertion that cookie domain matches request context
- Test should run as part of normal E2E test suite

**Files to create/modify**:
- `apps/e2e/tests/auth/middleware-session-recognition.spec.ts` - New regression test

#### Step 7: Clean Up Logging and Validate

**Objective**: Remove temporary logging and ensure fix is complete

- Remove or comment out temporary logging statements
- Keep optional `DEBUG_E2E_AUTH` flag for future debugging if needed
- Run full E2E test suite (all shards) to ensure no regressions
- Run Shard 3 specifically 3+ times to ensure no flakiness
- Update documentation if any architectural changes made

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Cookie reconstruction logic (if implemented) with chunked cookies
- ✅ Middleware getClaims() with valid session cookie
- ✅ Middleware getClaims() with missing/invalid session cookie
- ✅ Middleware handling of expired JWT in cookie
- ✅ Edge case: empty or malformed session cookie

**Test files**:
- `packages/supabase/__tests__/middleware-client.spec.ts` - Cookie handling tests
- `apps/web/__tests__/middleware.spec.ts` - Middleware getClaims() tests

### Integration Tests

- ✅ Full auth flow: create session → store in Playwright → middleware validation
- ✅ Multi-worker scenario: multiple workers accessing same session
- ✅ Session refresh: access token near expiry, refresh token valid
- ✅ Cookie domain handling: localhost vs subdomain variations

**Test files**:
- `apps/e2e/tests/auth/middleware-session-recognition.spec.ts` - E2E regression test

### E2E Tests

The fix is validated by:
- ✅ Shard 3 tests all passing (account settings access)
- ✅ Shard 3 tests passing with 3 parallel workers
- ✅ Shard 3 tests running multiple times consecutively without flakiness

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Shard 3 with DEBUG_E2E_AUTH=true and capture logs
- [ ] Compare cookies in global-setup logs vs middleware logs
- [ ] Verify all 13 tests in Shard 3 pass consistently
- [ ] Run Shard 3 three times consecutively without failures
- [ ] Test with single worker to rule out parallel race conditions
- [ ] Test with maximum parallel workers (if configured)
- [ ] Verify no new console errors or warnings introduced
- [ ] Confirm DEBUG_E2E_AUTH flag works correctly (logs on/off)
- [ ] Check no sensitive auth data leaks in logs in production (logging only in test env)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Sensitive Data in Logs**: Middleware logging might inadvertently log JWT tokens or session cookies
   - **Likelihood**: medium
   - **Impact**: high (security exposure)
   - **Mitigation**: Truncate sensitive values in logs (show only first/last 8 chars), wrap in DEBUG flag, never log to external services in production

2. **Performance Impact from Logging**: Extra cookie processing and logging calls could slow middleware
   - **Likelihood**: low
   - **Impact**: low (middleware already has some latency)
   - **Mitigation**: Use debug flag to only enable when needed, use efficient logging library

3. **Debugging Logs Left in Production**: If DEBUG flag isn't properly scoped to test environments
   - **Likelihood**: low
   - **Impact**: medium (noise in logs, slight performance impact)
   - **Mitigation**: Use environment variables that default to `false`, add CI check to prevent flag being committed as `true`

4. **Test Flakiness Persists Despite Logging**: If logging reveals a race condition we can't easily fix
   - **Likelihood**: medium
   - **Impact**: medium (tests still fail)
   - **Mitigation**: If race condition found, move to Option 2 (single auth state per shard) as fallback

**Rollback Plan**:

If this fix causes issues in production or tests:
1. Remove logging statements from middleware
2. Revert any cookie reconstruction logic added
3. Re-enable original redirect behavior
4. Return to previous stable version of code
5. File new issue with more specific diagnostic data

**Monitoring** (if needed):
- Monitor error logs for "getClaims returns null" pattern
- Track middleware response times to detect logging overhead
- Watch for any security-related logs that might be leaking data

## Performance Impact

**Expected Impact**: minimal

- Logging only executes when DEBUG_E2E_AUTH flag is enabled (not by default)
- When enabled, minimal overhead: read cookies + format log strings
- No database queries added
- No additional network calls
- Middleware latency may increase slightly when debugging enabled (negligible for test environment)

**Performance Testing**:
- Compare middleware response times with/without DEBUG flag enabled
- Run performance tests with flag enabled to establish baseline

## Security Considerations

**Security Impact**: low (with proper logging configuration)

**Important Notes**:
- Never log complete JWT tokens - truncate or hash sensitive values
- Wrap all logging in DEBUG flag that only activates in test environment
- Use structured logging to avoid accidentally logging sensitive data in unexpected places
- Review all logged values to ensure no auth cookies, access tokens, or user data exposed

**Security Checklist**:
- [ ] Verify DEBUG flag only works in test environment
- [ ] Check that JWT tokens are truncated/hashed in logs
- [ ] Ensure no auth cookies logged verbatim (show only size/metadata)
- [ ] Review log output for accidental sensitive data exposure
- [ ] Confirm logging doesn't write to external services

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run Shard 3 without debug logging - tests should fail
pnpm test:e2e 3

# Or manually:
cd apps/e2e && npx playwright test --shard=3/3
```

**Expected Result**: 3 tests fail with "toBeVisible timeout" waiting for account settings elements

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Shard 3 with debug logging first to verify fix
DEBUG_E2E_AUTH=true pnpm test:e2e 3

# Run Shard 3 normally (logging disabled)
pnpm test:e2e 3

# Run full E2E suite to ensure no regressions
pnpm test:e2e
```

**Expected Result**: All commands succeed, Shard 3 passes all 13 tests, debug logs show valid claims in middleware

### Regression Prevention

```bash
# Run Shard 3 multiple times to check for flakiness
pnpm test:e2e 3 && pnpm test:e2e 3 && pnpm test:e2e 3

# Run with different worker counts
pnpm test:e2e 3  # Default workers
```

**Expected Result**: All runs pass consistently, no flakiness detected

## Dependencies

### New Dependencies (if any)

No new dependencies required. Will use existing:
- `@kit/shared/logger` - Already available for middleware logging
- `@supabase/ssr` - Already used, no version changes needed

OR

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a middleware logging and cookie handling fix
- No database migrations required
- No API changes
- No backwards compatibility issues

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] DEBUG_E2E_AUTH=true shows complete middleware cookie logs
- [ ] Logs reveal whether cookies are missing, chunked, or unreadable
- [ ] Root cause of getClaims() failure is identified in logs
- [ ] Fix is implemented based on root cause (cookie reconstruction, session refresh, or domain handling)
- [ ] All 13 tests in Shard 3 pass consistently
- [ ] Shard 3 passes in parallel execution with 3 workers
- [ ] Shard 3 passes when run multiple times consecutively (no flakiness)
- [ ] No new regressions in other E2E tests (run full suite)
- [ ] Code review approved (if applicable)
- [ ] Temporary DEBUG logging can be cleanly removed
- [ ] Performance is acceptable (no overhead when DEBUG flag disabled)
- [ ] Security review confirms no sensitive data leaks in logs

## Notes

**Debugging Strategy**:
1. First run with logging to understand the failure point
2. Once root cause identified, implement minimal fix
3. Don't over-engineer the solution - fix the specific issue identified by logs
4. Keep logging infrastructure in place for future E2E debugging

**Related Issues**:
- #697 - Previous E2E auth issue (similar symptoms)
- #688 - Previous E2E test regression (auth configuration)
- #698 - E2E infrastructure improvements

**Key Insight**:
The diagnosis correctly identified that `getClaims()` returns null. This step of adding logging is crucial because it will tell us exactly WHY - is it missing cookies, chunked cookie reconstruction failure, domain mismatch, or session refresh issue? Once we know the "why", implementing the fix becomes straightforward.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #713*
