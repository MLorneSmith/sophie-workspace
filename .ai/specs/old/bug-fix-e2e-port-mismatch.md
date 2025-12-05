# Bug Fix: E2E Tests Port Mismatch

**Related Diagnosis**: #684 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E test configuration files contain outdated Supabase port 54321, while Docker containers run on port 54521 after WSL2 port binding fix
- **Fix Approach**: Update all E2E environment configuration files to use correct port 54521
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After fixing issue #666 (Supabase Docker Port Binding Failure in WSL2), the Supabase Docker containers were reconfigured to use port 54521 instead of 54321 to work around Docker Desktop's vpnkit port forwarding issues in WSL2 environments.

The port change was correctly updated in `apps/e2e/.env.local` but was NOT updated in `apps/e2e/.env.test.locked` and `apps/e2e/.env.example`. This configuration inconsistency causes E2E tests to attempt connection to the wrong port, resulting in pre-flight validation failures and 166 test failures.

For full details, see diagnosis issue #684.

### Solution Approaches Considered

#### Option 1: Update all configuration files to use port 54521 ⭐ RECOMMENDED

**Description**: Update `apps/e2e/.env.test.locked` and `apps/e2e/.env.example` to reference the correct Supabase port (54521). Add explanatory comments noting why this specific port is used (WSL2 compatibility).

**Pros**:
- Simplest fix with minimal code changes (2 files, single port number change each)
- Aligns all configuration files to single source of truth
- No architectural changes or new dependencies
- Directly addresses root cause with surgical precision
- Configuration will be consistent across all files

**Cons**:
- Requires manual update if port changes in future (mitigated by comments)
- Doesn't add automation to prevent similar issues

**Risk Assessment**: low - Configuration change only, no code logic modified

**Complexity**: simple - Direct string replacement

#### Option 2: Use environment variables with fallback logic

**Description**: Modify `global-setup.ts` to read port from environment variable with fallback to 54521, and document the proper way to override.

**Pros**:
- More flexible for different environments
- Could support multiple port configurations per setup

**Cons**:
- Adds complexity for single-purpose fix
- Over-engineering for a configuration inconsistency issue
- Still requires updating example files
- Adds code that must be tested and maintained

**Why Not Chosen**: Over-engineered solution for a simple configuration synchronization problem. The recommendation in CLAUDE.md is to avoid complexity beyond current requirements.

#### Option 3: Create configuration validation script

**Description**: Add a script that validates all environment files have consistent port values and runs as pre-commit hook.

**Pros**:
- Prevents similar issues in future
- Educational value

**Cons**:
- Overhead for a one-time fix
- Configuration files can have legitimate differences
- Adds build/commit overhead

**Why Not Chosen**: Premature abstraction. The bug occurred due to incomplete update during fix #666. Direct fix + comment is sufficient.

### Selected Solution: Update all configuration files to use port 54521

**Justification**: This is the simplest, most direct approach that fixes the root cause with minimal changes. The issue is a straightforward configuration inconsistency introduced during an incomplete update. Simply updating the port numbers in the remaining files restores consistency across all environment configurations. Adding comments explaining the port choice prevents future confusion.

**Technical Approach**:
- Update `E2E_SUPABASE_URL` from `http://127.0.0.1:54321` to `http://127.0.0.1:54521` in `.env.test.locked`
- Update `E2E_SUPABASE_URL` from `http://localhost:54321` to `http://localhost:54521` in `.env.example`
- Add explanatory comments noting port 54521 is used for WSL2 Docker compatibility
- Verify no other files reference the old port 54321

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/.env.test.locked` - Update E2E_SUPABASE_URL port from 54321 to 54521
- `apps/e2e/.env.example` - Update E2E_SUPABASE_URL port from 54321 to 54521

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify current configuration state

Examine both environment files to confirm they contain the old port reference.

- Read `apps/e2e/.env.test.locked` and verify `E2E_SUPABASE_URL` uses port 54321
- Read `apps/e2e/.env.example` and verify `E2E_SUPABASE_URL` uses port 54321
- Confirm both files exist and are not in `.gitignore`

**Why this step first**: Ensures we understand the current state before making changes and prevents fixing non-existent issues.

#### Step 2: Update `.env.test.locked`

Update the Supabase URL to use the correct port and add a comment explaining the port.

- Replace `E2E_SUPABASE_URL=http://127.0.0.1:54321` with `E2E_SUPABASE_URL=http://127.0.0.1:54521`
- Add comment above the line: `# Port 54521: WSL2 Docker port binding compatibility (see issue #666)`
- Verify the change is correct

#### Step 3: Update `.env.example`

Update the example file to match the current standard.

- Replace `E2E_SUPABASE_URL="http://localhost:54321"` with `E2E_SUPABASE_URL="http://localhost:54521"`
- Add matching comment: `# Port 54521: WSL2 Docker port binding compatibility (see issue #666)`
- Verify the change is correct

#### Step 4: Search for other port references

Verify no other files in the codebase reference port 54321 or contain outdated configuration.

- Search codebase for "54321" to ensure no other references exist
- Verify `apps/e2e/.env.local` already has correct port 54521
- Check if any Docker configuration files need updates
- Check if any documentation references the old port

#### Step 5: Run validation and tests

Ensure the fix is complete and E2E tests can now connect properly.

- Run pre-flight validation to confirm Supabase connectivity works
- Run a small subset of E2E tests to verify infrastructure connection succeeds
- Verify full test suite can execute without infrastructure errors

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration fix with no code logic changes.

### Integration Tests

No new integration tests needed.

### E2E Tests

Pre-flight validation and test execution will validate the fix.

**Test files affected**:
- `apps/e2e/global-setup.ts` - Pre-flight validation should now pass
- All test files under `apps/e2e/tests/` - Should now connect to Supabase successfully

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify `apps/e2e/.env.test.locked` contains port 54521
- [ ] Verify `apps/e2e/.env.example` contains port 54521
- [ ] Verify `apps/e2e/.env.local` still contains port 54521 (unchanged)
- [ ] Run Supabase: `pnpm supabase:web:start` and verify containers on ports 54521+
- [ ] Run pre-flight validation: Start E2E tests and verify no "Supabase connection failed" error
- [ ] Run subset of E2E tests: `pnpm test:e2e tests/smoke/` and verify tests execute without infrastructure errors
- [ ] Check for any new errors in test output
- [ ] Verify Docker containers are accessible on port 54521: `curl http://127.0.0.1:54521/rest/v1/`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Configuration Files Out of Sync**: Different developers might use different environment files
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Added comments explaining the port. `.env.local` takes precedence in dotenv loading order.

2. **Other Outdated Ports in Codebase**: Additional references to 54321 might exist elsewhere
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Comprehensive grep search in Step 4 will catch any other references

3. **Environment Loading Priority**: Different parts of system might load different env files
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: The loading order in `global-setup.ts` (`.env` then `.env.local`) ensures `.env.local` takes precedence, providing override capability

**Rollback Plan**:

If this fix causes issues (unlikely):
1. Revert the port numbers in both files back to 54321
2. Restart Supabase: `pnpm supabase:web:stop && pnpm supabase:web:start`
3. Run pre-flight validation again
4. Investigate why port 54521 doesn't work in that environment

**Monitoring** (if needed):

Not needed - this is a configuration synchronization fix with no runtime monitoring required.

## Performance Impact

**Expected Impact**: none

This is a configuration fix with no code changes. No performance implications.

## Security Considerations

**Security Impact**: none

This fix addresses a connectivity issue, not a security vulnerability. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify Supabase is running on port 54521
docker ps | grep supabase_kong

# Try to connect to old port (should fail)
curl http://127.0.0.1:54321/rest/v1/
# Expected: Connection refused or timeout

# Try to connect to correct port (should succeed)
curl http://127.0.0.1:54521/rest/v1/
# Expected: Returns Supabase API swagger documentation

# Run E2E tests (should fail with connection error)
pnpm test:e2e
# Expected: "❌ Pre-flight validation failed... Supabase connection failed"
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify environment files
grep "E2E_SUPABASE_URL" apps/e2e/.env.test.locked apps/e2e/.env.example
# Expected: Both show port 54521

# Search for old port reference
grep -r "54321" apps/e2e/ || echo "No 54321 found"
# Expected: No matches (or only in comments)

# Verify Supabase running and accessible
docker ps | grep supabase_kong
curl -s http://127.0.0.1:54521/rest/v1/ | grep -q "swagger" && echo "✅ Supabase accessible on 54521"

# Run pre-flight validation
pnpm test:e2e --project chromium tests/smoke/auth.spec.ts
# Expected: Pre-flight validation passes, at least one test runs

# Run full E2E test suite
pnpm test:e2e
# Expected: Tests execute without infrastructure connection errors, zero failures due to port mismatch
```

**Expected Result**: All commands succeed, bug is resolved, pre-flight validation passes, tests can connect to Supabase, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Verify no other port mismatches
grep -r "54321" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next || echo "✅ No 54321 references found"

# Check environment files are consistent
echo "=== .env.local ===" && grep "E2E_SUPABASE_URL" apps/e2e/.env.local || echo "Not set in .env.local"
echo "=== .env.test.locked ===" && grep "E2E_SUPABASE_URL" apps/e2e/.env.test.locked
echo "=== .env.example ===" && grep "E2E_SUPABASE_URL" apps/e2e/.env.example
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependencies

No changes to dependencies.

## Database Changes

**No database changes required**

This is a configuration fix affecting how tests connect to Supabase, not a schema change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is configuration-only.

**Feature flags needed**: no

**Backwards compatibility**: maintained

This change updates configuration to match the current Docker setup. No breaking changes to APIs or functionality.

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/.env.test.locked` updated to port 54521 with comment
- [ ] `apps/e2e/.env.example` updated to port 54521 with comment
- [ ] No other references to port 54321 in E2E configuration
- [ ] Pre-flight validation passes without "Supabase connection failed" error
- [ ] E2E test suite executes without infrastructure connection errors
- [ ] All tests pass (no regressions from configuration change)
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Why Port 54521 Instead of 54321?**

From issue #666, the port was changed from 54321 to 54521 to work around Docker Desktop's vpnkit port forwarding issues in WSL2 environments. When Hyper-V reserves port ranges dynamically, 54321 falls within Windows' reserved dynamic port range (54265-54464), causing binding failures. Port 54521 avoids this range while remaining in the Supabase port allocation space (typically 54320+).

**Configuration File Hierarchy**

The E2E test setup loads environment variables in this order:
1. `.env` (if exists)
2. `.env.local` (if exists, overrides `.env`)
3. Other files may be loaded by test frameworks

The presence of `.env.local` with the correct port (54521) ensures it takes precedence, but `.env.test.locked` with the old port creates configuration ambiguity that should be resolved.

**Future Prevention**

To prevent similar issues:
- Add explanatory comments to configuration files noting why specific ports are used
- During port migrations, update ALL configuration files (not just one)
- Consider adding configuration validation to CI/CD pipeline

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #684*
