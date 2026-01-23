# Bug Fix: E2E Sharded Workflow Supabase Health Check Variable Timing

**Related Diagnosis**: #1631 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: API health check in "Start local Supabase" step runs before JWT keys are extracted, causing authentication with empty credentials
- **Fix Approach**: Extract JWT keys immediately after `supabase start` in the same step, making them available for health check
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails because the Supabase API health check attempts to authenticate with `${SUPABASE_ANON_KEY}` before this variable is extracted. The workflow has a two-step sequence:

1. **"Start local Supabase"** (lines 223-269) - Contains API health check using `${SUPABASE_ANON_KEY}`
2. **"Extract Supabase JWT keys"** (lines 271-300) - Sets `SUPABASE_ANON_KEY` via `$GITHUB_ENV`

The health check fails 30 times with empty API key headers, causing timeouts and shard failures.

For full details, see diagnosis issue #1631.

### Solution Approaches Considered

#### Option 1: Extract Keys Inline in "Start Supabase" Step ⭐ RECOMMENDED

**Description**: After `supabase start` completes, immediately run `supabase status -o env` to extract JWT keys directly in the same step, storing them as local shell variables. The health check can then reference these variables.

**Pros**:
- Keys available immediately in the same step
- Health check can proceed without timing issues
- Minimal code changes (5-10 lines)
- No workflow structure changes needed
- Works with existing shell-based workflow logic

**Cons**:
- Duplicates key extraction code (also done in separate step)
- Slightly longer "Start local Supabase" step execution

**Risk Assessment**: low - This is a straightforward sequence reordering with no side effects

**Complexity**: simple - Basic shell scripting with `eval` and conditional curl

#### Option 2: Skip API Health Check, Use Docker Container Health

**Description**: Instead of hitting the REST API, check if the Supabase containers report healthy status using `docker ps --filter status=healthy`.

**Pros**:
- Doesn't require JWT keys at all
- Simpler health check logic
- Faster execution (Docker status check vs 30 retry loops)

**Cons**:
- Doesn't validate the API is actually responding
- Masks actual API connectivity issues
- Less thorough health verification

**Why Not Chosen**: Less thorough. Option 1 ensures the API actually responds to requests, which is more reliable for catching real issues.

#### Option 3: Move Health Check to After Key Extraction

**Description**: Restructure the workflow to check API health as a separate step AFTER the key extraction step.

**Pros**:
- Guarantees keys exist before health check runs

**Cons**:
- Adds another step, slowing workflow
- Disrupts existing workflow structure
- Makes "Start local Supabase" step incomplete
- Harder to debug if issues occur between steps

**Why Not Chosen**: Option 1 is simpler and keeps related logic together in one step.

### Selected Solution: Extract Keys Inline in "Start Supabase" Step

**Justification**: This approach is the best balance of simplicity, maintainability, and reliability. It keeps all Supabase startup logic in one step, making the workflow easier to understand and debug. The inline extraction follows the principle of "do related work together" and has minimal code changes.

**Technical Approach**:
1. After `supabase start` completes successfully
2. Run `eval "$(supabase status -o env)"` to load JWT keys into shell environment
3. Health check curl command can now reference `$ANON_KEY` variable
4. Fallback to original step if needed for additional configuration

**Architecture Changes**:
- None - This is a tactical fix within the existing workflow structure

**Migration Strategy**:
- No data migration needed
- No backwards compatibility issues
- Simply re-run the workflow after the fix is applied

## Implementation Plan

### Affected Files

List of files that need modification:

- `.github/workflows/e2e-shards.yml` (lines 223-269) - "Start local Supabase" step: Add inline JWT key extraction before health check

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Examine Current Workflow Step

Read the current "Start local Supabase" step in `.github/workflows/e2e-shards.yml` to understand:
- Current structure of the health check
- How `${SUPABASE_ANON_KEY}` is currently referenced
- Where to insert the inline key extraction

**Why this step first**: Ensures we understand the exact code structure before making changes

#### Step 2: Add Inline JWT Key Extraction

In the "Start local Supabase" step (after `supabase start` succeeds):
- Add: `eval "$(supabase status -o env)"` to load keys into shell environment
- This extracts variables like `ANON_KEY`, `SERVICE_ROLE_KEY`, `API_URL`, etc.
- Keys become available for the health check loop that follows

**Specific change location**: After line 231 (after `supabase start --ignore-health-check`)

#### Step 3: Update Health Check to Use Extracted Key

Modify the health check curl command to use the extracted `$ANON_KEY` variable:
- Current: `"apikey: ${SUPABASE_ANON_KEY}"` (undefined)
- New: `"apikey: $ANON_KEY"` (extracted from status output)

This ensures the health check has valid credentials.

#### Step 4: Remove Duplicate Key Extraction from Separate Step

The "Extract Supabase JWT keys" step (lines 271-300) now has duplicate functionality:
- Keep that step for safety (it sets `$GITHUB_ENV` for use in later steps)
- Add a comment noting that initial extraction happens inline for health check

#### Step 5: Test the Fix

- Run E2E sharded workflow
- Verify "Start local Supabase" step completes successfully (health check passes)
- Verify health check loop completes in <1 second instead of timing out
- Verify all 9 shards pass

## Testing Strategy

### Unit Tests

No unit tests needed (this is infrastructure/workflow change).

### Integration Tests

No new integration tests needed.

### E2E Tests

Existing E2E tests validate the fix:
- Current e2e test suite will pass if Supabase starts successfully
- If fix is incomplete, tests fail at "Start local Supabase" step

**Test execution**:
- Trigger e2e-shards workflow
- Monitor step execution for "Start local Supabase"
- Verify health check completes immediately with valid API responses
- All 9 shards should pass without timeouts

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger e2e-shards workflow on a test branch
- [ ] Monitor "Start local Supabase" step in real-time
- [ ] Health check should succeed within 1-2 attempts (not 30 attempts)
- [ ] Verify Docker containers report healthy status
- [ ] All 9 E2E test shards complete successfully
- [ ] No timeouts or API errors in logs
- [ ] Workflow total time remains reasonable (<20 minutes)
- [ ] Test with a fresh Supabase environment (rm -rf volumes if needed)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Shell Variable Scoping**: The `eval` statement might not export variables correctly
   - **Likelihood**: low
   - **Impact**: low (health check fails, but we see the error immediately)
   - **Mitigation**: Use `eval "$(supabase status -o env)"` which is standard practice. Test locally if needed.

2. **Supabase Status Output Format Changes**: Future Supabase versions might change the output format
   - **Likelihood**: low
   - **Impact**: medium (health check fails silently)
   - **Mitigation**: This change uses the same `supabase status` command as the existing separate step, so it's already validated in the codebase.

3. **Race Condition**: Keys might be extracted before Supabase is fully ready
   - **Likelihood**: very low
   - **Impact**: low (would see obvious errors)
   - **Mitigation**: `supabase start` doesn't return until Supabase reports ready. We extract keys immediately after, ensuring readiness.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the workflow file to the previous version
2. Re-run the e2e-shards workflow
3. File a new diagnosis issue if problems persist

**Monitoring** (if needed):
- Monitor e2e-shards workflow run duration (should be consistent)
- Watch for "Supabase API failed to respond" errors in logs
- Track health check retry count (should be 1, not 30)

## Performance Impact

**Expected Impact**: minimal (positive)

The inline extraction adds ~500ms to the "Start local Supabase" step, but eliminates the 30-second timeout penalty that currently occurs. Net result: **faster workflow execution**.

**Performance Testing**:
- Monitor "Start local Supabase" step duration before/after
- Should see reduction in overall e2e-shards workflow time due to eliminating the timeout

## Security Considerations

**Security Impact**: none

This change doesn't alter authentication mechanisms or expose sensitive data. JWT keys are:
- Extracted from local Supabase instance (not internet-exposed)
- Used only for local testing (not sent externally)
- Ephemeral (destroyed when workflow completes)

No security review needed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger the e2e-shards workflow on the current dev branch
# The "Start local Supabase" step will timeout after 30 failed health checks
# Error message in logs: "Supabase API failed to respond after 30 attempts"

gh workflow run e2e-shards.yml --ref dev
```

**Expected Result**: Workflow fails at "Start local Supabase" with timeout error

### After Fix (Bug Should Be Resolved)

```bash
# Verify the fix was applied correctly
grep -n "eval.*supabase status" .github/workflows/e2e-shards.yml

# Run the fixed workflow
gh workflow run e2e-shards.yml --ref dev

# Monitor logs for successful health check
# Health check should complete in 1-2 attempts, not timeout

# Verify all 9 shards pass
gh run view <run-id> --log
```

**Expected Result**:
- Workflow succeeds
- "Start local Supabase" step completes in <30 seconds
- Health check shows successful API responses
- All 9 E2E test shards pass

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
# The e2e-shards workflow IS the full E2E test suite

# Additional check: Verify key extraction still works in separate step
grep -A 5 "Extract Supabase JWT keys" .github/workflows/e2e-shards.yml | grep "GITHUB_ENV"

# Verify the fix works with clean Supabase state
pnpm supabase:web:reset
pnpm test:e2e  # or trigger via workflow
```

## Dependencies

### New Dependencies

No new dependencies required. The fix uses:
- `supabase` CLI (already in workflow)
- Standard bash `eval` (shell built-in)
- Standard curl (already available)

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database schema or migrations needed. This is a workflow/infrastructure-only change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

The fix is automatically applied when the workflow file is committed to GitHub. No special deployment procedures needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix doesn't change the workflow's behavior from an external perspective - it just fixes the internal implementation to work correctly.

## Success Criteria

The fix is complete when:
- [ ] Workflow file modified with inline key extraction
- [ ] Health check uses extracted `$ANON_KEY` variable
- [ ] e2e-shards workflow completes successfully (all 9 shards pass)
- [ ] "Start local Supabase" step completes in <30 seconds (not timeout)
- [ ] No "Supabase API failed to respond" errors in logs
- [ ] Health check shows successful curl responses
- [ ] Manual testing checklist complete

## Notes

**Related Issues**:
- #1626 - Introduced the API health check (regression source)
- #1621 - Added JWT key extraction step
- #1609 - E2E auth config fix

**Implementation Notes**:
- The existing "Extract Supabase JWT keys" step (lines 271-300) sets `$GITHUB_ENV` for use in later steps, so keep it in place for those uses
- The inline extraction in the "Start Supabase" step uses local shell variables (not `$GITHUB_ENV`) which is appropriate for the health check scope
- This follows the pattern: local variables for immediate use, `$GITHUB_ENV` for cross-step use

**Key Files**:
- Workflow file: `.github/workflows/e2e-shards.yml`
- Diagnosis details: `.ai/reports/bug-reports/2026-01-20/1631-diagnosis-e2e-sharded-api-health-check.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1631*
