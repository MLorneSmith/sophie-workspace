# Bug Fix: Alpha Orchestrator Database Connection and Preview URL Display

**Related Diagnosis**: #1475 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**:
  1. Incorrect Supabase credentials in `.env` preventing database operations
  2. Race condition: status set to "completed" before reviewUrls are written, causing UI to transition without preview URLs
- **Fix Approach**:
  1. Update `.env` with correct database credentials
  2. Refactor orchestrator completion sequence to write reviewUrls before status change
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Autonomous Coding workflow orchestrator has two critical issues preventing successful workflow completion:

1. **Database Connection Failure**: The `SUPABASE_SANDBOX_DB_URL` in `.env` contains incorrect credentials, blocking all database reset/seeding operations with "password authentication failed" error.

2. **Missing Preview URLs**: The UI shows no preview URLs on completion despite the progress file containing them. This is caused by a race condition where status is set to "completed" at line 1060, triggering UI state transition, but reviewUrls aren't written until line 1115 (after dev server starts, ~30 seconds later).

For full details, see diagnosis issue #1475.

### Solution Approaches Considered

#### Option 1: Fix Database Credentials + Refactor Completion Sequence ⭐ RECOMMENDED

**Description**:
- Obtain correct Supabase credentials from the Supabase Dashboard and update `.env`
- Refactor orchestrator completion sequence to ensure reviewUrls are written before status is set to "completed"
- Use proper async/await coordination to guarantee ordering

**Pros**:
- Fixes both issues completely and permanently
- Database operations will work correctly in all scenarios
- UI will always display preview URLs
- No temporary workarounds or polling needed
- Maintains clean, logical completion sequence
- Easy to understand and maintain

**Cons**:
- Requires access to Supabase Dashboard to obtain credentials
- Slightly more complex completion sequence logic
- Need to understand dev server startup timing

**Risk Assessment**: medium
- Getting wrong credentials again could recreate issue (mitigated by using Dashboard directly)
- Async coordination adds minor complexity
- Good test coverage prevents regression

**Complexity**: moderate - involves environment config + logic refactoring

#### Option 2: Keep Current Sequence, Add Retry Logic to UI

**Description**: Leave orchestrator unchanged, add polling/retry logic to UI to fetch reviewUrls after completion

**Why Not Chosen**:
- Doesn't fix the root cause of poor design
- Creates technical debt with client-side workaround
- Adds unnecessary complexity to UI component
- Performance impact from polling
- Inconsistent user experience if retry fails

#### Option 3: Write ReviewUrls to Temp File, Read at Completion

**Description**: Write reviewUrls to temporary file before status change, have UI read from file

**Why Not Chosen**:
- Overly complex for what should be simple ordering fix
- Adds file I/O overhead
- Doesn't address the core async ordering problem
- File-based communication is fragile

### Selected Solution: Fix Database Credentials + Refactor Completion Sequence

**Justification**:
This approach fixes both issues at their root causes with minimal code changes. The database credentials issue is straightforward (environment config), and the completion sequence refactoring is a simple reordering of operations with better async coordination. Both are permanent fixes that prevent similar issues in the future.

**Technical Approach**:
1. Obtain correct PostgreSQL password from Supabase Dashboard (Project Settings > Database)
2. Update `SUPABASE_SANDBOX_DB_URL` in `.env` with correct credentials
3. Refactor `.ai/alpha/scripts/lib/orchestrator.ts` completion sequence:
   - Move reviewUrl writing logic BEFORE status change to "completed"
   - Ensure dev server startup is awaited before status change
   - Use proper async/await to guarantee operation ordering
4. Update progress tracking to reflect new sequence

**Architecture Changes**:
- Completion sequence in `orchestrator.ts` (lines 1055-1137) will be reorganized:
  - Current: Start dev server → Set status → Write reviewUrls
  - New: Write reviewUrls → Start dev server → Set status
  - This ensures UI never sees completed status without reviewUrls
- No changes to overall orchestrator design or interface
- Progress file structure remains unchanged

**Migration Strategy**:
- No data migration needed
- `.env` update is configuration, not data
- Orchestrator state from previous runs will be read-only (won't be affected)

## Implementation Plan

### Affected Files

- `.env` (line 20: SUPABASE_SANDBOX_DB_URL) - Update with correct credentials
- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1055-1137) - Refactor completion sequence
- `.ai/alpha/scripts/lib/database.ts` - Affected by `.env` change, will work correctly with new credentials

### New Files

None needed - this is a pure bugfix.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Obtain and Update Database Credentials

Obtain the correct Supabase connection string from the Supabase Dashboard for the sandbox database.

- Navigate to Supabase Dashboard > slideheroes-alpha-sandbox project > Settings > Database
- Note the connection string components (host, port, database, user, password)
- Extract the password (or generate a new one if needed)
- Update `.env` line 20 with complete, correct `SUPABASE_SANDBOX_DB_URL`
- Format: `postgresql://postgres:PASSWORD@HOST:5432/postgres`
- Verify credentials by testing connection (optional: `psql $SUPABASE_SANDBOX_DB_URL -c "SELECT 1"`

**Why this step first**: Database connection must be fixed before orchestrator can succeed. This is a prerequisite for testing the second fix.

#### Step 2: Refactor Orchestrator Completion Sequence

Refactor the completion sequence in `.ai/alpha/scripts/lib/orchestrator.ts` to write reviewUrls before setting status to "completed".

**Current sequence (problematic)**:
```typescript
// Line 1060: Status immediately set to completed
updateProgressFile({ status: 'completed' });

// ...later...

// Lines 1115+: reviewUrls written after dev server starts (30s later)
updateProgressFile({ reviewUrls });
```

**New sequence (correct)**:
```typescript
// Write reviewUrls BEFORE status change
// Ensure dev server startup is awaited
const reviewUrls = await generatePreviewUrls(sandboxBranch);
updateProgressFile({ reviewUrls });

// NOW set status to completed
updateProgressFile({ status: 'completed' });
```

**Specific changes**:
- Move review URL generation and writeout to BEFORE the status="completed" update
- Ensure dev server startup completes before completion
- Add explicit await for all async operations
- Update any status logging/progress messages to reflect new order
- Verify line numbers after refactoring (they will shift)

**Why this ordering**: Guarantees UI never transitions to completion without having reviewUrls available. Matches logical workflow (prepare data → mark complete).

#### Step 3: Add Tests for Completion Sequence

Add or update tests to verify the completion sequence works correctly.

- Add unit test verifying reviewUrls are written before status="completed"
- Add integration test running a full orchestrator cycle
- Verify progress file has reviewUrls when status="completed"
- Test database operations complete successfully

**Test files**:
- `.ai/alpha/scripts/tests/orchestrator.spec.ts` - Add completion sequence tests

#### Step 4: Validation

Run validation to ensure both fixes work correctly.

- Test database connection with new credentials
- Run full orchestrator workflow
- Verify completion shows preview URLs
- Check progress file structure is correct

#### Step 5: Documentation Updates

Update documentation to reflect proper orchestrator operation.

- Update any orchestrator documentation
- Document that `.env` credentials must be kept current
- Add troubleshooting section for credential issues

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Progress file updates occur in correct sequence
- ✅ reviewUrls are written before status="completed"
- ✅ Database connection succeeds with correct credentials
- ✅ Dev server startup is awaited before completion
- ✅ Edge case: reviewUrls generation error doesn't block status update

**Test files**:
- `.ai/alpha/scripts/tests/orchestrator.spec.ts` - Completion sequence ordering
- `.ai/alpha/scripts/tests/database.spec.ts` - Connection with new credentials

### Integration Tests

- Run full orchestrator workflow from spec to completion
- Verify preview URLs appear in final output
- Verify all database operations succeed (reset, seed, typegen)
- Test with actual E2B sandbox if available

**Test files**:
- `.ai/alpha/scripts/tests/integration/orchestrator-full-cycle.spec.ts`

### E2E Tests

- Run actual orchestrator against test spec
- Verify UI shows preview URLs on completion
- Verify no console errors during workflow

**Test files**:
- `.ai/alpha/scripts/tests/e2e/orchestrator-completion.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Update `.env` with new credentials
- [ ] Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362` (or test issue)
- [ ] Observe database operations complete successfully
- [ ] Observe progress file has reviewUrls when status="completed"
- [ ] Verify orchestrator completion shows preview URLs in UI
- [ ] Check overall-progress.json has correct structure:
  ```json
  {
    "status": "completed",
    "reviewUrls": [
      { "label": "sbx-a", "vscode": "...", "devServer": "..." }
    ]
  }
  ```
- [ ] Verify no errors in orchestrator logs
- [ ] Test with multiple orchestrator runs to ensure consistency
- [ ] Verify dev server starts correctly in completion sequence

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Incorrect Credentials**: New credentials entered incorrectly blocks database operations
   - **Likelihood**: medium (manual entry error possible)
   - **Impact**: high (orchestrator fails completely)
   - **Mitigation**:
     - Copy/paste directly from Supabase Dashboard (avoid manual entry)
     - Add connection test to verify credentials work before using
     - Keep backup of original `.env` before updating

2. **Async Ordering Issues**: Refactored completion sequence has new edge cases
   - **Likelihood**: low (simple refactoring, well-tested)
   - **Impact**: medium (preview URLs might still not appear in race condition)
   - **Mitigation**:
     - Add explicit await for all async operations
     - Add tests verifying sequence order
     - Monitor orchestrator logs for timing issues

3. **Dev Server Startup Delay**: If dev server startup takes longer than expected
   - **Likelihood**: medium (varies by sandbox load)
   - **Impact**: low (orchestrator waits for completion)
   - **Mitigation**:
     - Add timeout to dev server startup
     - Add logging to track timing

4. **Existing Sandboxes**: Previously started orchestrators may have stale state
   - **Likelihood**: low (only affects in-progress workflows)
   - **Impact**: low (new workflows unaffected)
   - **Mitigation**:
     - Document that existing workflows should complete normally
     - Advise users to restart new orchestrator workflows

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.env` to previous credentials (if that was working)
2. Revert `.ai/alpha/scripts/lib/orchestrator.ts` to previous version
3. Restart orchestrator to clear any partial state
4. Check orchestrator logs for error messages

**Monitoring** (if needed):
- Monitor orchestrator completion success rate
- Track time from status="completed" to reviewUrls availability
- Watch for database connection errors in logs
- Alert on orchestrator failures after fix

## Performance Impact

**Expected Impact**: minimal

- Database credential update has no performance impact
- Refactored completion sequence removes unnecessary delay (~30s -> 0s for preview URL display)
- Dev server startup time unchanged

**Performance Testing**:
- Measure time from orchestrator start to completion with preview URLs visible
- Should show significant improvement in UI responsiveness

## Security Considerations

**Security Impact**: low

- `.env` credentials must be kept secure (already required)
- Credentials should NOT be committed to git (use `.env.local` or similar)
- If credentials compromised, rotate in Supabase Dashboard immediately
- Consider using Supabase service role key instead of postgres user if available

**Security Review**: yes
- Ensure credentials are not logged or exposed in debug output
- Verify database RLS policies prevent unauthorized access
- Check that sandbox database has appropriate access controls

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Test current orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Check for database error
# Expected: "password authentication failed" error in logs
```

**Expected Result**: Orchestrator fails with database authentication error, and/or completion shows no preview URLs

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if created)
pnpm test:unit .ai/alpha/scripts/tests/

# Integration tests
pnpm test:integration .ai/alpha/scripts/tests/

# Manual orchestrator test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Verify progress file
cat .ai/alpha/orchestrator-state/overall-progress.json | jq '.status, .reviewUrls'
```

**Expected Result**:
- All commands succeed
- Database operations complete successfully
- Progress file shows `status: "completed"` with `reviewUrls` array populated
- Orchestrator completion UI displays preview URLs
- No errors in logs

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Test orchestrator multiple times to ensure consistency
for i in {1..3}; do
  tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
  echo "Run $i complete"
done
```

## Dependencies

### New Dependencies

**No new dependencies required** - this fix only updates configuration and refactors existing code.

## Database Changes

**No database changes required** - the fix updates credentials for existing database connection only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Update `.env` in deployment environment with correct credentials (secret management)
2. No code deployment needed for `.env` change if using environment variables
3. Deploy `.ai/alpha/scripts/lib/orchestrator.ts` changes with code deployment
4. Test orchestrator workflow in staging before production deployment

**Feature flags needed**: no

**Backwards compatibility**: maintained
- Change is backwards compatible
- Previous orchestrator runs will not be affected
- No API or data structure changes

## Success Criteria

The fix is complete when:
- [ ] `.env` updated with correct SUPABASE_SANDBOX_DB_URL
- [ ] Orchestrator database connection succeeds
- [ ] Preview URLs are written before status="completed"
- [ ] Progress file shows correct sequence (reviewUrls before completed status)
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] Preview URLs display in orchestrator completion UI
- [ ] Zero database connection errors
- [ ] No regressions in other orchestrator functionality

## Notes

### Key Insights from Diagnosis

The diagnosis correctly identified both root causes:
1. Database authentication failure due to incorrect credentials
2. Race condition in completion sequence due to poor async ordering

The fix addresses both issues directly at their source.

### Implementation Order is Critical

The database credential fix MUST be done before testing the completion sequence fix, since database operations are prerequisites for orchestrator success.

### Environment Management

The `.env` file contains secrets and should:
- Never be committed to git
- Be managed through secure configuration management
- Be validated before first use (connection test)
- Be rotated if potentially compromised

### Future Prevention

To prevent similar issues:
1. Add health check for database connectivity at orchestrator start
2. Add integration tests running full orchestrator workflow
3. Document that `.env` must be properly configured before running orchestrator
4. Consider storing credentials in secure vault (AWS Secrets Manager, etc.)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1475*
