# Bug Fix: Dev Integration Tests Fail with host.docker.internal DNS Error

**Related Diagnosis**: #918
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `E2E_SERVER_SUPABASE_URL` environment variable in CI workflow, combined with Docker-specific fallback in `global-setup.ts` that doesn't account for CI environments running against remote deployments.
- **Fix Approach**: Update `global-setup.ts` to intelligently detect CI environments and use the authenticated URL as the cookie URL fallback when `E2E_SERVER_SUPABASE_URL` is not provided.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow fails during E2E global setup because `global-setup.ts` uses `host.docker.internal:54521` as the fallback for cookie URL naming. This Docker-specific hostname doesn't resolve in GitHub Actions runner environments, causing a DNS lookup failure when `@supabase/ssr` client internally makes API calls to validate the session.

The workflow sets `E2E_SUPABASE_URL` (for authentication) but NOT `E2E_SERVER_SUPABASE_URL` (for cookie naming), triggering the problematic fallback.

For full details, see diagnosis issue #918.

### Solution Approaches Considered

#### Option 1: Intelligent CI Detection in Code ⭐ RECOMMENDED

**Description**: Update `global-setup.ts` to detect CI environments (via `process.env.CI === 'true'`) and use the authentication URL as the cookie URL fallback when `E2E_SERVER_SUPABASE_URL` is not provided.

```typescript
const supabaseCookieUrl =
  process.env.E2E_SERVER_SUPABASE_URL ||
  (process.env.CI === 'true' ? supabaseAuthUrl : "http://host.docker.internal:54521");
```

**Pros**:
- No workflow changes required
- Maintains backward compatibility with local Docker testing
- Self-documenting code with clear CI vs local distinction
- Single source of truth for URL logic
- Handles both scenarios: local Docker (uses Docker URL) and CI (uses authenticated URL)
- Low risk - only affects fallback behavior

**Cons**:
- Relies on CI environment variable being set (GitHub Actions sets this automatically)
- Doesn't explicitly document the CI environment URL in workflow file

**Risk Assessment**: low - This is a defensive fallback that only affects behavior when `E2E_SERVER_SUPABASE_URL` is not set.

**Complexity**: simple - One line change with clear logic.

#### Option 2: Workflow Environment Variable

**Description**: Add `E2E_SERVER_SUPABASE_URL` to the workflow's environment variables, explicitly setting it to the production Supabase URL.

```yaml
E2E_SERVER_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
```

**Pros**:
- Makes CI environment URL explicit and visible in workflow
- Doesn't modify code logic
- Clear source of truth in workflow definition

**Cons**:
- Requires workflow changes (maintains extra variable)
- Duplicates `E2E_SUPABASE_URL` configuration
- If workflow changes in future, CI environment URL might be forgotten
- More maintenance overhead

**Why Not Chosen**: Option 1 is more elegant because it eliminates the need for duplicate configuration. CI is a well-known environment indicator, and the fallback to authentication URL is logical since both point to the same Supabase instance.

#### Option 3: Always Use Environment Variable

**Description**: Require `E2E_SERVER_SUPABASE_URL` to always be set, with no fallback.

**Pros**:
- Explicit configuration, no implicit behavior

**Cons**:
- Breaks local development if variable not set
- Creates friction for local testing setup
- Doesn't handle unknown future CI environments

**Why Not Chosen**: Less flexible and creates unnecessary friction for local development.

### Selected Solution: Intelligent CI Detection in Code

**Justification**:
This approach is best because it:
1. Fixes the CI issue without requiring workflow changes
2. Maintains backward compatibility with local Docker testing (critical for developer experience)
3. Is self-documenting - code clearly shows the distinction between CI and local environments
4. Reduces maintenance burden - one location to maintain instead of two
5. Follows the principle of least surprise - uses the authenticated URL as fallback in CI (both are the same Supabase instance)
6. Has minimal risk - only affects fallback behavior when `E2E_SERVER_SUPABASE_URL` is not provided

**Technical Approach**:
- When `E2E_SERVER_SUPABASE_URL` is explicitly provided: use it (maintains current behavior)
- When `CI === 'true'` (GitHub Actions): use `supabaseAuthUrl` (fixes CI issue)
- When neither condition: use Docker URL (maintains local Docker testing)

**Architecture Changes**: None - this is purely a defensive fallback improvement.

**Migration Strategy**: Not needed - change is backward compatible.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Update cookie URL fallback logic (lines 193-194)

### New Files

None needed - this is a pure code fix.

### Step-by-Step Tasks

#### Step 1: Update global-setup.ts cookie URL logic

Update the `supabaseCookieUrl` variable assignment to intelligently detect CI environments.

- Navigate to `apps/e2e/global-setup.ts`, lines 193-194
- Replace Docker-only fallback with CI-aware logic
- Add inline comment explaining the three-tier fallback behavior
- Verify logic handles all three scenarios: explicit env var, CI environment, local Docker

**Why this step first**: This is the core fix that resolves the DNS issue. All testing depends on this working correctly.

#### Step 2: Test locally with CI environment variable

Verify the fix works by simulating CI environment during local testing.

- Set `CI=true` in shell environment
- Run E2E global setup: `cd apps/e2e && CI=true pnpm test:setup`
- Verify cookies are properly named using `supabaseAuthUrl`
- Verify no DNS errors occur

**Why this step**: Ensures the CI path works before deploying to GitHub Actions.

#### Step 3: Run E2E tests in local Docker mode

Verify backward compatibility with local Docker testing.

- Unset `CI` environment variable (or set `CI=false`)
- Run E2E global setup: `cd apps/e2e && pnpm test:setup`
- Verify cookies use Docker URL naming: `host.docker.internal`
- Verify Docker containers can authenticate properly

**Why this step**: Ensures we didn't break existing local Docker testing workflow.

#### Step 4: Add/update tests for CI environment detection

Add test coverage for the new CI detection logic.

- Add unit test for CI environment detection
- Add unit test for non-CI environment fallback
- Add integration test confirming E2E setup succeeds with `CI=true`
- Verify test coverage includes all three fallback scenarios

#### Step 5: Validation

Run comprehensive validation to confirm the fix resolves the issue without regressions.

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in local development
- Confirm GitHub Actions workflow completes successfully
- Check test artifacts for session persistence

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ CI detection with `process.env.CI === 'true'` returns auth URL as cookie URL
- ✅ Non-CI environment with explicit `E2E_SERVER_SUPABASE_URL` uses provided value
- ✅ Local Docker environment (no CI, no explicit env var) uses Docker URL fallback
- ✅ Edge case: empty string `E2E_SERVER_SUPABASE_URL` falls through to next condition

**Test files**:
- `apps/e2e/tests/setup/global-setup.spec.ts` - Test cookie URL fallback logic

### Integration Tests

- ✅ E2E global setup succeeds with `CI=true` and deployed Supabase
- ✅ E2E global setup creates valid auth states in JSON files
- ✅ Auth states can be used by subsequent tests for session restoration
- ✅ Supabase session is properly encoded with correct cookie naming

**Test files**:
- `apps/e2e/tests/integration/global-setup-ci.spec.ts` - CI environment setup

### E2E Tests

- ✅ Reproduce original workflow: GitHub Actions dev-integration-tests.yml
- ✅ Verify dev deployment is reached without DNS errors
- ✅ Confirm auth states persist across test suite execution
- ✅ Validate no "ENOTFOUND host.docker.internal" errors in logs

**Test files**:
- `.github/workflows/dev-integration-tests.yml` - Actual workflow test

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Set `CI=true` and run global setup locally - should succeed without DNS errors
- [ ] Verify generated auth state files are valid JSON with session data
- [ ] Check `~/.auth/test1@slideheroes.com.json` contains valid Supabase session
- [ ] Unset `CI` and run global setup again - should still work with Docker URL
- [ ] Run actual E2E test against deployed environment with CI flag set
- [ ] Check GitHub Actions run of dev-integration-tests.yml completes successfully
- [ ] Review test artifacts for authentication state validation
- [ ] Verify browser traces show no DNS resolution failures

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended Behavior Change in CI**: Setting fallback to auth URL might cause unexpected behavior if `CI` environment variable is accidentally set during local testing.
   - **Likelihood**: low (CI is standard GitHub Actions variable)
   - **Impact**: medium (would use wrong URL for session cookies)
   - **Mitigation**: Clear documentation and test coverage ensuring correct behavior. If someone explicitly sets `CI=true` locally, they're testing CI behavior intentionally.

2. **Backward Compatibility Break**: Change might affect other CI environments that set CI differently or don't set it at all.
   - **Likelihood**: low (GitHub Actions is primary CI environment)
   - **Impact**: high (would break in other CI systems)
   - **Mitigation**: The code gracefully falls back to Docker URL if `CI` is not set. Tested before deployment.

3. **Supabase Session Encoding Mismatch**: If using auth URL for cookie naming results in different session key derivation than expected.
   - **Likelihood**: low (auth URL and server URL point to same instance)
   - **Impact**: high (auth wouldn't persist)
   - **Mitigation**: Comprehensive testing of session persistence in CI environment before production deployment.

**Rollback Plan**:

If this fix causes issues in production CI:

1. Revert the change in `global-setup.ts` (restore Docker URL fallback)
   ```bash
   git revert <commit-hash>
   ```

2. Push to dev branch:
   ```bash
   git push origin dev
   ```

3. This restores the original behavior - workflow will fail again with DNS error, but CI pipeline isn't blocked

4. Alternative: Add explicit `E2E_SERVER_SUPABASE_URL` to workflow while reverting code change

**Monitoring** (if needed):
- Monitor dev-integration-tests.yml runs for "ENOTFOUND" errors
- Alert if workflow starts failing with DNS resolution issues
- Track auth state creation success rate in test runs

## Performance Impact

**Expected Impact**: none

The change is purely a fallback logic update. No performance implications:
- Same code path execution (uses `process.env.CI` check which is O(1))
- No additional network calls
- No additional file I/O
- No impact on test execution time

## Security Considerations

**Security Impact**: none

- No changes to authentication logic
- No changes to session handling
- No exposure of credentials
- Environment variable `CI` is set by GitHub Actions, not user-controlled
- The fallback still points to a valid Supabase instance (same one being authenticated against)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the original error by running workflow simulation
cd apps/e2e
E2E_SUPABASE_URL=<deployed-supabase-url> \
E2E_SUPABASE_ANON_KEY=<anon-key> \
CI=true \
pnpm test:setup
```

**Expected Result**: DNS error "ENOTFOUND host.docker.internal"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm --filter web-e2e test:unit -- global-setup

# Integration tests
pnpm --filter web-e2e test:integration -- setup

# E2E tests (against dev deployment)
pnpm --filter web-e2e test:integration

# Manual verification
cd apps/e2e
E2E_SUPABASE_URL=http://127.0.0.1:54521 \
E2E_SUPABASE_ANON_KEY=<anon-key> \
CI=true \
pnpm test:setup
# Should complete without DNS errors

# Verify local Docker still works
cd apps/e2e
unset CI
pnpm test:setup
# Should still work with Docker URL naming
```

**Expected Result**: All commands succeed, no DNS errors, auth states properly created.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm --filter web-e2e test

# Run full test suite
pnpm test

# Check for any new errors related to Supabase or cookies
pnpm --filter web-e2e test 2>&1 | grep -i "dns\|docker\|cookie"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - this is purely a logic change using standard Node.js environment variables.

## Database Changes

**No database changes required** - this is purely an infrastructure/CI configuration fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a code fix that doesn't require special handling.

**Feature flags needed**: no

**Backwards compatibility**: maintained - the change is purely defensive and doesn't affect existing behavior when environment variables are properly set.

## Success Criteria

The fix is complete when:
- [ ] Code change merged to dev branch
- [ ] dev-integration-tests.yml workflow completes successfully (no DNS errors)
- [ ] E2E auth states are properly created with correct session encoding
- [ ] All E2E tests pass with correct authentication
- [ ] Local Docker development testing still works correctly
- [ ] Unit tests added for CI detection logic
- [ ] No regressions in other E2E test runs
- [ ] Session persistence works end-to-end in CI environment
- [ ] Code review approved

## Notes

**Why This Specific Fix**:
The original diagnosis (#878) fixed local Docker authentication but didn't account for the CI scenario where tests run against deployed environments. This fix bridges that gap by making the code environment-aware rather than just URL-aware.

**CI Environment Variable**:
GitHub Actions automatically sets `CI=true` in all workflow runs. This is a standard convention recognized by most Node.js tools (Jest, Vitest, etc.), making it a reliable detection mechanism.

**Cookie Naming**:
The `@supabase/ssr` library derives cookie names from the hostname in the Supabase URL. Using the auth URL (which points to deployed Supabase) ensures the cookie name matches what the server expects when setting session cookies.

**Related Issues**:
- #876 (CLOSED): Original cookie mismatch diagnosis
- #878 (CLOSED): Previous fix for local Docker scenario

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #918*
