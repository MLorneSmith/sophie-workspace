# Bug Fix: Payload E2E Tests Timeout Due to Next.js Performance API Error

**Related Diagnosis**: #1243
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Next.js 16.0.10 bug in Performance API causing negative timestamp errors that prevent Payload login page from rendering
- **Fix Approach**: Apply error boundary workaround around Performance API calls in Next.js error pages
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Payload CMS E2E tests timeout after 20 minutes because the Payload login page fails to render due to a Next.js 16.x runtime error: `Failed to execute 'measure' on 'Performance': 'Page' cannot have a negative time stamp`. This is a known Next.js bug ([vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060)) where the internal Performance API measurement code passes invalid negative timestamps, causing an unhandled TypeError that prevents React from rendering the login form.

The consequence is that all 9 Payload authentication tests fail while waiting for form elements that never appear, accumulating timeouts that exceed the 20-minute shard limit.

For full details, see diagnosis issue #1243.

### Solution Approaches Considered

#### Option 1: Implement Performance API Error Boundary ⭐ RECOMMENDED

**Description**: Wrap the Payload application with an error boundary that catches and gracefully handles Performance API errors. Additionally, create a global error handler in the Next.js app that intercepts these errors at the page level.

**Pros**:
- Direct fix that immediately resolves the rendering issue
- No dependency on external Next.js release
- Can be deployed independently
- Minimal code changes required (3-4 files)
- Maintains current Next.js version
- Works as permanent solution even after Next.js fixes their bug
- Low risk and easy to test

**Cons**:
- Masks the underlying Next.js bug rather than fixing it at the root
- May hide other Performance API issues in production
- Requires monitoring to ensure no new Performance API errors emerge

**Risk Assessment**: Low - This approach is defensive and doesn't modify core functionality

**Complexity**: Simple - Standard React error boundary pattern

#### Option 2: Downgrade Next.js to Pre-16.0.2 Version

**Description**: Revert Next.js to a version before the bug was introduced (e.g., 15.x or early 16.0.0).

**Pros**:
- Eliminates the bug entirely
- No workaround code needed
- Simpler codebase

**Cons**:
- Loses benefits of Next.js 16.0.10 patches and features
- May introduce incompatibilities with other dependencies
- Requires regression testing of all functionality
- Puts us behind on framework updates
- Other bugs in older versions may affect us
- Not a sustainable long-term solution

**Why Not Chosen**: This is a regression from a framework release, and we should work toward resolving it rather than downgrading. We may lose security patches and bug fixes from the newer version.

#### Option 3: Wait for Next.js Patch

**Description**: Monitor [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060) and upgrade when Vercel releases a fix.

**Pros**:
- No code changes needed
- Official fix from framework maintainers

**Cons**:
- Unknown timeline for fix
- Tests remain broken until patch is released
- Blocks other work dependent on Payload functionality
- No ETA for resolution

**Why Not Chosen**: This creates an indefinite blocker for our test suite. We need to resume testing operations immediately.

### Selected Solution: Implement Performance API Error Boundary

**Justification**: The error boundary approach is the optimal balance of speed, safety, and maintainability. It resolves the immediate blocker by gracefully handling the Performance API error without modifying core application logic. This is a proven pattern in the React ecosystem for handling runtime errors, and it provides both an immediate fix and a defensive mechanism for other potential Performance API issues.

**Technical Approach**:

1. **Create a Performance API error handler** that wraps the global error event listener to catch Performance API errors specifically
2. **Implement an error boundary in the Payload error page** (`/apps/payload/app/error.tsx`) that catches and logs the error without breaking the page render
3. **Add graceful error handling** in Next.js error pages that prevents Performance API errors from bubbling up
4. **Add monitoring/logging** to track if this error occurs, enabling us to know if/when the Next.js fix is released

The error boundary will:
- Catch the TypeError during render
- Log the error with context for debugging
- Render a fallback UI (the login form or error message)
- Prevent the error from crashing the entire page
- Allow tests to continue

**Architecture Changes**: None - purely additive error handling

## Implementation Plan

### Affected Files

- `apps/payload/app/error.tsx` - Add error boundary for error page
- `apps/payload/app/layout.tsx` - Add global error handler for Performance API
- `apps/payload/app/admin/login/page.tsx` - Ensure error boundary is in place
- `packages/ui/components/error-boundary.tsx` - Create reusable error boundary (if doesn't exist)

### New Files

- `apps/payload/_lib/performance-api-error-handler.ts` - Centralized error handling for Performance API

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Performance API Error Handler Module

Create a utility module that provides error handling utilities for Performance API errors.

- Create `apps/payload/_lib/performance-api-error-handler.ts`
- Implement error detection for Performance API errors
- Add conditional logging based on environment (verbose in development, silent in test)
- Export handler function for use in error pages and boundaries

**Why this step first**: Centralizes error handling logic so it can be reused across multiple pages and components. Makes it easier to monitor and manage the workaround.

#### Step 2: Create Error Boundary Component

If an error boundary component doesn't exist in the shared UI package, create one.

- Check if `packages/ui/components/error-boundary.tsx` exists
- If not, create a reusable React error boundary component
- The boundary should catch errors during render
- Render a fallback UI (login form content or simple error message)
- Call the Performance API error handler to log the error

**Why**: Error boundary is the React standard for handling render-time errors. Reusable across the application.

#### Step 3: Update Payload Error Page

Add error boundary handling to the Payload error page to catch the Performance API error.

- Update `apps/payload/app/error.tsx`
- Wrap the error page content in the error boundary (or implement error boundary logic directly)
- Detect if the error is a Performance API error
- If Performance API error, render a safe fallback (allow page to render)
- If other error, render normal error page
- Log all errors for monitoring

**Why this step**: The error occurs during initial page render, so catching it at the error page level prevents it from breaking the entire page.

#### Step 4: Add Global Error Handler

Implement a global error handler to prevent uncaught Performance API errors at the window level.

- Add to `apps/payload/app/layout.tsx`
- Listen to `window.error` events
- Detect Performance API errors specifically
- Suppress the error from propagating (prevents crash)
- Log for monitoring purposes
- Allow page render to continue

**Why**: This catches errors that might not be caught by component-level error boundaries.

#### Step 5: Test the Fix

Verify the error boundary works and tests can proceed.

- Start test infrastructure: `docker-compose -f docker-compose.test.yml up -d`
- Run Payload auth tests: `/test 7`
- Verify that at least one test passes (login page renders)
- Check that error is logged but doesn't crash the page
- Verify test timeout no longer occurs
- Run all Payload-related shards (7, 8, 9, 14, 15)

#### Step 6: Validation and Cleanup

Ensure no regressions and clean up any temporary code.

- Run full E2E test suite: `/test` (all shards)
- Verify non-Payload tests still pass
- Check browser console for any new errors
- Monitor error logs for Performance API errors
- Remove any temporary debugging code

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Error handler correctly identifies Performance API errors
- ✅ Error handler safely suppresses the error
- ✅ Error boundary catches render errors
- ✅ Fallback UI renders when error boundary catches exception
- ✅ Non-Performance-API errors are not suppressed

**Test files**:
- `apps/payload/_lib/__tests__/performance-api-error-handler.spec.ts` - Error handler logic
- `apps/payload/__tests__/error-boundary.spec.tsx` - Error boundary behavior (if created)

### E2E Tests

**Test files**:
- `apps/e2e/tests/payload/payload-auth.spec.ts` - All 9 Payload auth tests should pass
- `apps/e2e/tests/payload/payload-other.spec.ts` - Other Payload tests (if separate)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start test infrastructure: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Navigate to Payload login page at `http://localhost:3021/admin/login`
- [ ] Verify login form renders without error overlay
- [ ] Open browser DevTools console
- [ ] Verify no "Failed to execute 'measure'" errors appear
- [ ] Verify the performance error is logged (should see custom log message)
- [ ] Test logging in with valid credentials
- [ ] Run all Payload auth tests: `/test 7`
- [ ] Verify all 9 tests pass or skip appropriately
- [ ] Verify no timeout SIGTERM
- [ ] Run all E2E tests: `/test` to ensure no regressions
- [ ] Verify Payload-related shards (7, 8, 9, 14, 15) all complete within time limit
- [ ] Monitor that error doesn't reappear on multiple test runs

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Error Suppression Masking Other Issues**: If the error handler suppresses errors too broadly, it might hide other legitimate errors
   - **Likelihood**: Low
   - **Impact**: Medium (could hide bugs)
   - **Mitigation**: Log all errors to monitoring; specifically check for Performance API errors; test thoroughly with various page states

2. **Performance Impact of Error Handling**: Adding error handling and logging could introduce slight performance overhead
   - **Likelihood**: Very Low
   - **Impact**: Very Low (error handling is minimal)
   - **Mitigation**: Monitor performance metrics; use conditional logging (disabled in production if needed)

3. **Error Boundary Breaking Other Pages**: If error boundary is implemented incorrectly, it might prevent valid errors from being caught elsewhere
   - **Likelihood**: Low
   - **Impact**: Medium
   - **Mitigation**: Test error boundary thoroughly; start with Payload-only implementation; gradually expand if needed

**Rollback Plan**:

If this fix causes issues:
1. Remove the error boundary component from `apps/payload/app/error.tsx`
2. Remove the global error handler from `apps/payload/app/layout.tsx`
3. Delete the performance API error handler module
4. Revert git commits: `git revert <commit-hashes>`
5. Restart test infrastructure and verify old behavior

**Monitoring** (if needed):
- Monitor error logs for Performance API errors - should see them logged but not crash the page
- Track test success rate - should see improvement from 0% to >90% for Payload tests
- Monitor page load times - should see no regression

## Performance Impact

**Expected Impact**: None - error handling only executes if an error occurs

The error boundary and global handler have negligible performance impact since they only execute in error scenarios. Normal page load should be unaffected.

## Security Considerations

**Security Impact**: None

This is purely error handling. The error is already being thrown by Next.js; we're just catching it to prevent page crash.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Run Payload auth tests - should timeout
/test 7
# OR
pnpm --filter web-e2e test:shard7
```

**Expected Result**: Tests timeout after ~20 minutes with 0 passed, exit code -1 (SIGTERM)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run Payload auth tests - should pass or skip appropriately
/test 7

# Verify no timeout
pnpm --filter web-e2e test:shard7

# Run all E2E tests to ensure no regressions
/test

# Manual verification - navigate to login page
# Should render without error overlay
http://localhost:3021/admin/login
```

**Expected Result**: All commands succeed, Payload tests complete within time limit (9 tests, ~60-90 seconds total), no timeout SIGTERM

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run E2E tests multiple times to ensure stability
/test
/test
/test

# Check all Payload shards
/test 7 8 9 14 15
```

## Dependencies

### New Dependencies

No new npm dependencies required.

### Internal Dependencies

- Uses existing `packages/ui` error boundary (if exists) or creates new one
- Uses existing React patterns already in codebase

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Very Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - purely additive error handling

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Payload login page renders without Performance API error
- [ ] All 9 Payload auth tests pass or skip appropriately
- [ ] No tests timeout with SIGTERM
- [ ] Zero regressions in non-Payload tests
- [ ] Full E2E test suite completes within expected time
- [ ] Error is properly logged for monitoring
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

This is a surgical fix for a known Next.js regression. The error boundary pattern is standard in React for handling render-time errors and is used extensively in production applications.

Once Vercel releases a fix for [vercel/next.js#86060](https://github.com/vercel/next.js/issues/86060), this workaround can be gradually phased out, though it's harmless to keep as a defensive measure.

The error handler logs all Performance API errors, so we'll have visibility into whether this issue continues to affect us even after Next.js updates.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1243*
