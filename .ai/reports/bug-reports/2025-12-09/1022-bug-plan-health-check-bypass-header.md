# Bug Fix: Health Check Missing Vercel Bypass Header

**Related Diagnosis**: #1021
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `checkNextJsHealth()` and `checkPayloadHealth()` functions in `server-health-check.ts` do not include the `x-vercel-protection-bypass` header when checking deployed applications, causing 401 Unauthorized responses from Vercel's deployment protection
- **Fix Approach**: Add conditional header inclusion using `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable when available
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow fails because health check functions make bare HTTP requests without the Vercel bypass header. Vercel's deployment protection intercepts these requests and returns 401, causing tests to fail even though the deployment is healthy. The workflow's `wait-for-deployment` job passes because it correctly includes the bypass header.

For full details, see diagnosis issue #1021.

### Solution Approaches Considered

#### Option 1: Add Conditional Vercel Bypass Header ⭐ RECOMMENDED

**Description**: Update `checkNextJsHealth()` and `checkPayloadHealth()` to conditionally include the `x-vercel-protection-bypass` header when the `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable is available.

**Pros**:
- Simple, non-breaking change (only adds headers when env var exists)
- Works in all environments (CI with secret, local without)
- Matches existing pattern used in `wait-for-deployment` job and Playwright browser context
- Zero risk to local development (secret not set locally)
- Minimal code changes (3 lines per function)

**Cons**:
- None significant for this use case

**Risk Assessment**: Low - Adding optional headers cannot break existing functionality

**Complexity**: Simple - Straightforward conditional header addition

#### Option 2: Create Separate Health Check Functions for CI

**Description**: Create separate health check functions specifically for CI that include bypass headers, and use different functions locally.

**Why Not Chosen**: Over-engineered solution with code duplication. Single conditional approach is cleaner and more maintainable.

#### Option 3: Update Playwright Browser Context Configuration

**Description**: Configure the Playwright browser context in global-setup.ts to include bypass headers for all requests.

**Why Not Chosen**: Doesn't fix the HTTP health checks which run before browser context creation. Would require additional changes to fetch requests outside Playwright.

### Selected Solution: Conditional Vercel Bypass Header

**Justification**: This approach is minimal, non-breaking, follows existing patterns in the codebase, and directly addresses the root cause. It's identical to how `wait-for-deployment` already handles Vercel protection, ensuring consistency.

**Technical Approach**:
- Read `VERCEL_AUTOMATION_BYPASS_SECRET` from environment (GitHub Actions secret)
- Pass it as `x-vercel-protection-bypass` header in Next.js and Payload health checks
- Keep headers conditional to maintain backward compatibility with local development

**Architecture Changes**: None - pure addition to existing functions

**Migration Strategy**: No migration needed - change is backward compatible

## Implementation Plan

### Affected Files

- `apps/e2e/tests/utils/server-health-check.ts` - Add header logic to `checkNextJsHealth()` (lines 78-126) and `checkPayloadHealth()` (lines 132-177)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update checkNextJsHealth() Function

Update the `checkNextJsHealth()` function to include the bypass header:

- Read `process.env.VERCEL_AUTOMATION_BYPASS_SECRET`
- Create conditional `headers` object that includes bypass header if secret exists
- Pass headers to fetch request
- Maintain existing status code logic (200-399 = healthy)

**Why this step first**: This is the primary function failing in CI (Next.js returns 401)

#### Step 2: Update checkPayloadHealth() Function

Apply the same fix to `checkPayloadHealth()`:

- Read `process.env.VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD` if available, fall back to `VERCEL_AUTOMATION_BYPASS_SECRET`
- Create conditional headers object
- Pass headers to fetch request
- Maintain existing status code logic (< 500 = healthy)

**Why after Step 1**: Same pattern, secondary endpoint, Payload is optional in CI

#### Step 3: Add Tests

Verify the fix works:

- Run local health checks (should work without bypass secret)
- Run health checks with `VERCEL_AUTOMATION_BYPASS_SECRET` set (should work with protection)
- Verify 401 responses are handled correctly with bypass header

#### Step 4: Validation

- Run the full dev-integration-tests.yml workflow
- Verify health checks pass before test execution
- Confirm tests proceed past global setup
- Check that no regressions occur in other health check functionality

## Testing Strategy

### Unit Tests

No new unit tests needed. The health check functions are integration-level utilities tested through E2E setup.

### Integration Tests

Health check functions are tested implicitly by E2E test execution:
- ✅ Verify health check passes for Next.js in CI environment
- ✅ Verify health check passes for Payload in CI environment
- ✅ Verify bypass header is only included when environment variable exists
- ✅ Verify health checks still work locally without bypass secret

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm test:e2e` locally (should pass without bypass secret)
- [ ] Set `VERCEL_AUTOMATION_BYPASS_SECRET=test-secret` and run health check manually
- [ ] Verify dev-integration-tests.yml workflow passes in CI
- [ ] Confirm Playwright global setup completes successfully
- [ ] Check that Next.js and Payload health checks both report healthy
- [ ] Verify no console errors or warnings about missing headers

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Header is Ignored by Vercel**: If the bypass header key is incorrect or Vercel's implementation changes
   - **Likelihood**: Very Low (header is documented and stable)
   - **Impact**: Medium (would revert to 401 failures)
   - **Mitigation**: Header name `x-vercel-protection-bypass` matches Vercel documentation exactly; monitor CI logs after deployment

2. **Local Development Impact**: If bypass secret is accidentally set in local environment
   - **Likelihood**: Very Low (secret is only in GitHub Actions)
   - **Impact**: Low (header would just be ignored)
   - **Mitigation**: Secrets are masked in GitHub Actions; cannot leak to local developers

3. **Performance Impact**: Additional header in requests
   - **Likelihood**: N/A (headers don't impact request performance)
   - **Impact**: None
   - **Mitigation**: Headers are negligible in size (<100 bytes)

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert changes to `server-health-check.ts`
2. Remove `VERCEL_AUTOMATION_BYPASS_SECRET` from GitHub Actions secrets (optional)
3. Subsequent workflow runs will use original health check without bypass headers

The fix is fully reversible with no data or state changes.

## Performance Impact

**Expected Impact**: None

No performance impact expected. Adding headers to HTTP requests is negligible overhead (<1ms per request).

## Security Considerations

**Security Impact**: None

- `VERCEL_AUTOMATION_BYPASS_SECRET` is a GitHub Actions secret (masked in logs)
- Header only sent to Vercel-hosted deployments where it's expected
- No new secrets or credentials exposed in code
- Bypass is specifically designed by Vercel for CI automation

## Validation Commands

### Before Fix (Health Check Should Fail in CI)

The current behavior shows 401 from Next.js health check in CI:

```
❌ Next.js returned status 401
```

### After Fix (Health Check Should Pass)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Run E2E tests (tests health check indirectly)
pnpm test:e2e

# Or run workflow manually
gh workflow run dev-integration-tests.yml --ref dev
```

**Expected Result**:
- All commands succeed
- Health checks report healthy for Next.js and Payload
- E2E tests proceed past global setup
- Zero regressions in other functionality

## Dependencies

### New Dependencies

None required - fix uses only Node.js `process.env` built-in.

### Environment Variables Required

- `VERCEL_AUTOMATION_BYPASS_SECRET` - Already configured in GitHub Actions secrets
- Optional: `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD` - For Payload-specific bypass (can use same value as above)

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required

- No database migrations
- No environment variable changes needed (secret already exists)
- No breaking changes
- Backward compatible with local development

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained (health checks work with or without bypass secret)

## Success Criteria

The fix is complete when:

- [ ] `checkNextJsHealth()` includes conditional `x-vercel-protection-bypass` header
- [ ] `checkPayloadHealth()` includes conditional `x-vercel-protection-bypass` header
- [ ] Headers only included when `VERCEL_AUTOMATION_BYPASS_SECRET` is set
- [ ] All validation commands pass (`pnpm typecheck`, `pnpm lint`, `pnpm format`)
- [ ] dev-integration-tests.yml workflow passes in CI
- [ ] Health checks report healthy for both Next.js and Payload
- [ ] No regressions in local development (tests work without bypass secret)
- [ ] Code review approved (if applicable)

## Notes

This bug affects every run of dev-integration-tests.yml since health checks were added in #992. The same pattern is already used successfully in the `wait-for-deployment` job (lines 139-142 of dev-integration-tests.yml), making this a proven approach in the codebase.

The fix maintains the principle that health checks should work in all environments:
- **Local**: Health checks pass without bypass secret (no Vercel protection)
- **Dev deployment**: Health checks pass with bypass secret from GitHub Actions
- **Staging/Prod**: Health checks pass (Vercel protection doesn't apply to non-protected URLs)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1021*
