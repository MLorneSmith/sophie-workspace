# Bug Fix: Supabase Status Output Parsing Failure in CI

**Related Diagnosis**: #935
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Supabase CLI output format changed from simple key-value pairs to table format with different field names
- **Fix Approach**: Update grep/sed/awk patterns to match new table-based output format in both affected workflows
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Supabase CLI output format changed, breaking environment variable extraction in CI workflows. The old grep patterns looking for "API URL", "Publishable key", and "Secret key" no longer match the new table-based output that uses "Project URL", "Publishable", and "Secret".

For full details, see diagnosis issue #935.

### Solution Approaches Considered

#### Option 1: Update Grep/Sed/Awk Patterns ⭐ RECOMMENDED

**Description**: Update the existing bash parsing logic to match the new Supabase CLI output format. Use `sed` to strip table delimiters (`│`) and adjust `grep` patterns to match new field names.

**Pros**:
- Minimal code change - only 3 lines in staging-deploy.yml + 1 line in e2e-sharded.yml
- No new dependencies
- Maintains backward-compatible approach (still uses shell commands)
- Low risk - isolated change with clear before/after behavior
- Fast to implement and test

**Cons**:
- Still brittle to future format changes
- Requires understanding of sed/awk/grep syntax

**Risk Assessment**: low - The fix is surgical and well-tested locally. The parsing logic is isolated to one step in each workflow.

**Complexity**: simple - Three line changes with proven working patterns from local testing.

#### Option 2: Use Supabase CLI JSON Output

**Description**: Switch to using `supabase status --output json` and parse with `jq` for more stable, programmatic access to configuration values.

**Pros**:
- Future-proof - JSON output less likely to change format
- More robust parsing with `jq`
- Cleaner, more maintainable code
- Type-safe data extraction

**Cons**:
- Requires verifying `--output json` flag is available in current CLI version
- Need to install `jq` in CI environment (may already be available)
- Requires determining correct JSON path for each value
- More complex change with unknown JSON structure

**Why Not Chosen**: While more robust long-term, this approach requires:
1. Verifying JSON output format and availability
2. Potentially installing `jq` in CI
3. Testing JSON path extraction
4. More investigation time for uncertain benefit

The immediate issue is blocking staging deploys. The pattern update (Option 1) is proven working and can be applied immediately.

#### Option 3: Use Supabase Environment File

**Description**: Configure Supabase to write environment variables to a file and source that file instead of parsing status output.

**Why Not Chosen**:
- Requires understanding Supabase CLI environment file support
- More complex workflow changes
- Overhead not justified for this simple parsing issue
- Would still need to handle the parsing for health checks in e2e-sharded.yml

### Selected Solution: Update Grep/Sed/Awk Patterns

**Justification**: This is the fastest, lowest-risk fix that unblocks staging deploys immediately. The patterns have been tested locally and work correctly. Future improvements (like JSON parsing) can be done as a follow-up enhancement when not under time pressure.

**Technical Approach**:
1. Replace `grep "API URL"` with `grep "Project URL"` and adjust awk field extraction
2. Replace `grep "Publishable key"` with `grep "Publishable"` and strip table delimiters
3. Replace `grep "Secret key"` with `grep -E "^│ Secret"` (anchored to avoid false matches) and strip delimiters
4. Use `sed 's/│//g'` to remove all table delimiter characters before awk processing
5. Update e2e-sharded.yml health check to use "Project URL" instead of "API URL"

**Architecture Changes**: None - this is a localized fix to shell command parsing logic.

**Migration Strategy**: Not needed - this is a CI configuration fix with no runtime code changes.

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` (lines 164-166) - Update environment variable extraction patterns
- `.github/workflows/e2e-sharded.yml` (line 170) - Update health check grep pattern

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update staging-deploy.yml Environment Variable Extraction

Update the three grep/awk commands to match the new Supabase CLI output format:

**File**: `.github/workflows/staging-deploy.yml`
**Lines**: 164-166

**Changes**:
```bash
# OLD (broken):
SUPABASE_URL=$(npx supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(npx supabase status | grep "Publishable key" | awk '{print $3}')
SUPABASE_SERVICE_KEY=$(npx supabase status | grep "Secret key" | awk '{print $3}')

# NEW (working):
SUPABASE_URL=$(npx supabase status | grep "Project URL" | sed 's/│//g' | awk '{print $3}')
SUPABASE_ANON_KEY=$(npx supabase status | grep "Publishable" | sed 's/│//g' | awk '{print $2}')
SUPABASE_SERVICE_KEY=$(npx supabase status | grep -E "^│ Secret" | sed 's/│//g' | awk '{print $2}')
```

**Explanation**:
- "API URL" → "Project URL" (field name change)
- "Publishable key" → "Publishable" (field name shortened)
- "Secret key" → "^│ Secret" (anchored pattern to avoid matching other text containing "Secret")
- Added `sed 's/│//g'` to strip table delimiters before awk
- Adjusted awk field numbers based on table structure (URL is 3rd field, keys are 2nd field)

**Why this step first**: This is the primary failure point causing staging deploys to fail.

#### Step 2: Update e2e-sharded.yml Health Check

Update the Supabase health check pattern to match new output format:

**File**: `.github/workflows/e2e-sharded.yml`
**Line**: 170

**Changes**:
```bash
# OLD (broken):
if supabase status 2>/dev/null | grep -q "API URL"; then

# NEW (working):
if supabase status 2>/dev/null | grep -q "Project URL"; then
```

**Explanation**: The health check just needs to verify Supabase is running by detecting any key field in the output. Updating to "Project URL" ensures the check works with the new format.

#### Step 3: Add Validation Comment

Add a comment above the extraction logic explaining the format dependency:

**File**: `.github/workflows/staging-deploy.yml`
**Add before line 164**:

```bash
# NOTE: Supabase CLI status output format (table-based as of v1+)
# Project URL is in 3rd field, keys are in 2nd field after stripping table delimiters
```

This helps future maintainers understand the parsing logic and format dependencies.

#### Step 4: Test Locally

Before committing, verify the patterns work locally:

```bash
cd apps/web
npx supabase status | grep "Project URL" | sed 's/│//g' | awk '{print $3}'
npx supabase status | grep "Publishable" | sed 's/│//g' | awk '{print $2}'
npx supabase status | grep -E "^│ Secret" | sed 's/│//g' | awk '{print $2}'
```

**Expected output**: Valid URLs and keys, not empty strings.

#### Step 5: Commit and Trigger CI

Commit the changes and push to staging to trigger the workflow:

```bash
git add .github/workflows/staging-deploy.yml .github/workflows/e2e-sharded.yml
git commit -m "fix(ci): update supabase status parsing for new CLI output format"
git push origin dev:staging --force
```

Monitor the staging-deploy workflow to verify:
1. Environment variables are correctly exported (non-empty)
2. Application starts successfully
3. wait-on succeeds
4. Tests run

## Testing Strategy

### Unit Tests

Not applicable - this is workflow configuration, not application code.

### Integration Tests

The CI workflow itself is the integration test. Monitor the staging-deploy workflow run to verify:
- Environment variables are extracted correctly
- Application starts without errors
- No timeout waiting for localhost:3000

### E2E Tests

The e2e-sharded.yml workflow will test the health check fix when it runs.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [x] Test parsing patterns locally with `npx supabase status` ✅ Already verified
- [ ] Push to staging and monitor workflow run
- [ ] Verify "Export Supabase environment variables" step shows non-empty values:
  - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521` (or similar port)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...`
  - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...`
- [ ] Verify application starts successfully without Zod errors
- [ ] Verify wait-on succeeds
- [ ] Verify test suite runs and completes
- [ ] Check e2e-sharded workflow health check works (next run)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Parsing patterns still incorrect**: New patterns might not work in CI environment
   - **Likelihood**: low
   - **Impact**: medium (staging deploy fails again)
   - **Mitigation**: Patterns tested locally with same Supabase CLI version. If fails, can quickly iterate on pattern adjustment.

2. **Supabase CLI version mismatch**: CI might use different Supabase CLI version than local
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Both use `supabase/setup-cli@v1` action, ensuring consistent version. Can verify version in CI logs if needed.

3. **Breaking other workflows**: Pattern changes might affect other workflows using supabase status
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Only two workflows affected (staging-deploy, e2e-sharded), both updated in this fix.

**Rollback Plan**:

If this fix causes issues in staging:
1. Revert the commit: `git revert <commit-sha>`
2. Push to staging: `git push origin dev:staging --force`
3. Investigate CI logs to determine why patterns failed
4. Adjust patterns and re-apply

**Monitoring**:
- Watch staging-deploy workflow run for successful completion
- Check "Export Supabase environment variables" step output for non-empty values
- Monitor application startup logs for Zod validation errors

## Performance Impact

**Expected Impact**: none

No performance implications - this only changes how environment variables are extracted during CI setup. The runtime application is unchanged.

## Security Considerations

**Security Impact**: none

This fix does not change what values are extracted or how they're used, only how they're parsed from the CLI output. The environment variables remain scoped to the CI job and are not exposed beyond their current usage.

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# In staging-deploy workflow logs, check "Export Supabase environment variables" step
# Should show empty values:
✅ Exported NEXT_PUBLIC_SUPABASE_URL=
✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=...
✅ Exported SUPABASE_SERVICE_ROLE_KEY=...
```

**Expected Result**: Empty environment variables, application fails to start, wait-on times out.

### After Fix (Bug Should Be Resolved)

```bash
# Locally verify patterns work
cd apps/web
npx supabase status | grep "Project URL" | sed 's/│//g' | awk '{print $3}'
npx supabase status | grep "Publishable" | sed 's/│//g' | awk '{print $2}'
npx supabase status | grep -E "^│ Secret" | sed 's/│//g' | awk '{print $2}'

# Push to staging and monitor workflow
git push origin dev:staging --force

# In CI logs, verify non-empty values:
# ✅ Exported NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521
# ✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
# ✅ Exported SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Verify application starts successfully
# Verify wait-on succeeds
# Verify test suite runs
```

**Expected Result**:
- Non-empty environment variables exported
- Application starts without Zod errors
- wait-on succeeds within timeout
- Staging deploy completes successfully

### Regression Prevention

```bash
# After staging deploy succeeds, verify dev workflow still works
git push origin dev

# Monitor CI to ensure no unexpected failures
# Both staging-deploy and e2e-sharded workflows should handle new format
```

## Dependencies

**No new dependencies required**

All tools used (`grep`, `sed`, `awk`) are standard Unix utilities available in GitHub Actions runners.

## Database Changes

**No database changes required**

This is a CI configuration fix with no impact on database schema or migrations.

## Deployment Considerations

**Deployment Risk**: low

This fix only affects CI workflows, not application runtime code.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - application code unchanged

## Success Criteria

The fix is complete when:
- [x] Parsing patterns updated in staging-deploy.yml
- [x] Health check pattern updated in e2e-sharded.yml
- [ ] Staging deploy workflow completes successfully
- [ ] Environment variables show non-empty values in CI logs
- [ ] Application starts without Zod validation errors
- [ ] wait-on succeeds
- [ ] Test suite runs and completes
- [ ] No regressions in other workflows

## Notes

### Future Improvements

Consider these enhancements as follow-up work (not blocking this fix):

1. **Switch to JSON output**: Use `supabase status --output json | jq` for more robust parsing
   - More future-proof against format changes
   - Cleaner, type-safe extraction
   - Requires verifying JSON output availability and structure

2. **Centralize Supabase configuration extraction**: Create a reusable GitHub Action or script
   - Reduces duplication across workflows
   - Single source of truth for parsing logic
   - Easier to update if format changes again

3. **Add validation step**: Verify extracted values are non-empty before proceeding
   - Fail fast if extraction fails
   - Clearer error messages
   - Example:
     ```bash
     if [ -z "$SUPABASE_URL" ]; then
       echo "ERROR: Failed to extract SUPABASE_URL"
       exit 1
     fi
     ```

### Related Context

- **Similar issues**: #697, #698, #710 - Supabase configuration issues
- **Pattern**: Supabase CLI format changes have caused problems before
- **Lesson**: Consider using more stable APIs (JSON output) for parsing in the future

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #935*
