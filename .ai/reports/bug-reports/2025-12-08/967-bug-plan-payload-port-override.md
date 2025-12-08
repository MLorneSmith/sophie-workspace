# Bug Fix: Payload E2E Tests Fail Due to Shell Environment Variable Override

**Related Diagnosis**: #966 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Shell environment variable `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` overrides correct `.env.test` value (`http://localhost:3021`) via dotenv's `override: false` setting
- **Fix Approach**: Update test scripts to explicitly set the correct Payload URL environment variable, preventing shell pollution
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

All Payload CMS E2E tests (shards 7 and 8) fail because the shell environment contains a stale `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` variable. Since dotenv is configured with `override: false`, this shell value takes precedence over the correct `.env.test` file value of `http://localhost:3021`. Tests attempt to connect to port 3020 where no server is running, causing immediate connection refused errors.

This is a recurring regression (same issue fixed in #370, #376, #693).

For full details, see diagnosis issue #966.

### Solution Approaches Considered

#### Option 1: Explicitly Set Correct Port in Test Scripts ⭐ RECOMMENDED

**Description**: Update `apps/e2e/package.json` test scripts to explicitly export `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021` before running Playwright. This prevents any shell environment variable from interfering, as the script export takes precedence.

**Pros**:
- Simple one-liner changes to package.json scripts
- Eliminates shell pollution without requiring user action
- Automatically applies to all test invocations
- Zero risk - doesn't change test logic or infrastructure
- Prevents regression since explicit env var always overrides shell env

**Cons**:
- Requires updating multiple test script entries in package.json
- Doesn't educate users about the underlying dotenv behavior
- Doesn't fix similar issues if they occur with other env variables

**Risk Assessment**: low - only adding explicit environment variable exports to scripts, no code changes

**Complexity**: simple - just modify package.json script strings

#### Option 2: Change Dotenv Configuration to `override: true`

**Description**: Update `apps/e2e/playwright.config.ts` to use `override: true` in the dotenv configuration, making `.env.test` values always take precedence over shell environment variables.

**Pros**:
- Fixes the root cause at the configuration level
- Applies to all tests automatically
- No need to modify individual scripts

**Cons**:
- Changes the intentional dotenv behavior (shell env currently allowed to override for CI flexibility)
- Could break CI/CD workflows that rely on setting variables via `env:` directives
- Requires careful review of CI impact

**Why Not Chosen**: Option 1 is safer because it maintains the intentional dotenv behavior (shell env precedence for CI) while preventing shell pollution via explicit script exports. Option 2 risks breaking CI workflows.

#### Option 3: Document Shell Environment Cleanup

**Description**: Add troubleshooting documentation and scripts to help developers clean up shell environment.

**Pros**:
- Educational and addresses the root problem
- Empowers developers to manage their environment

**Cons**:
- Doesn't prevent the issue automatically
- Won't help developers who don't read docs
- Same issue will recur

**Why Not Chosen**: While helpful, this is reactive. Option 1 is proactive and prevents the problem entirely.

### Selected Solution: Explicitly Set Correct Port in Test Scripts

**Justification**: This approach is optimal because it:
1. Fixes the immediate problem completely and immediately
2. Prevents recurrence automatically for all developers
3. Requires minimal changes (6-7 one-liner script updates)
4. Has zero risk - only adds explicit env var exports
5. Maintains CI flexibility (shell env can still override if explicitly needed in CI)
6. Follows the principle of "explicit is better than implicit"

**Technical Approach**:
- Export `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021` in test script commands
- This uses shell's variable precedence: explicit script exports > shell env > .env files
- Applies to all shard 7/8 invocations and payload-specific test scripts
- Backward compatible - doesn't change any test logic

**Architecture Changes** (if any):
- None - only updating npm script definitions, no code changes

**Migration Strategy** (if needed):
- None - change is backward compatible and automatic

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/package.json` - Add `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021` to Payload-related test scripts

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Payload Test Scripts in package.json

Update the npm scripts to explicitly set the correct Payload URL:

- Modify `test:shard7` to prepend `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021`
- Modify `test:shard8` to prepend `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021`
- Modify `test:group:payload` to prepend `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021`

**Current script** (line 30):
```json
"test:shard7": "playwright test tests/payload/payload-auth.spec.ts tests/payload/payload-collections.spec.ts tests/payload/payload-database.spec.ts",
```

**Updated script**:
```json
"test:shard7": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-auth.spec.ts tests/payload/payload-collections.spec.ts tests/payload/payload-database.spec.ts",
```

**Why this step first**: The package.json scripts are the entry points for all test execution. Fixing them here ensures all developers and CI systems benefit immediately.

#### Step 2: Verify Script Changes

After updating package.json:

- Open `apps/e2e/package.json` and verify all three Payload-related scripts have been updated
- Confirm the `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021` prefix is present
- Verify no syntax errors in JSON

#### Step 3: Add/Update Regression Test

Create a regression test to verify the port configuration is correct:

- Add test in `apps/e2e/tests/payload/payload-auth.spec.ts` or new test file
- Test should verify that tests can connect to the Payload server
- Test name: "should connect to correct Payload port (3021)"
- Assertion: First Payload test in the suite succeeds (proves port is correct)

**Why this test**: Prevents regression - if shell env pollution occurs again, this test will fail immediately, catching the issue early.

#### Step 4: Update test-controller (if needed)

Check `.ai/ai_scripts/testing/infrastructure/` for test controller scripts:

- Verify that `safe-test-runner.sh` or related scripts don't need Payload URL updates
- If test controller explicitly runs `pnpm test:shard7`, ensure it respects the updated package.json scripts
- No changes should be needed - the scripts already handle the env var when invoked

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

No unit tests needed for this fix (it's a script/environment configuration change).

### Integration Tests

No new integration tests needed.

### E2E Tests

Validate using existing Payload test suite:
- ✅ Shard 7: All 42 Payload CMS tests should pass
- ✅ Shard 8: All Seeding tests should pass
- ✅ Configuration verification: Port 3021 is used, not 3020

**Test files**:
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Validates Payload connection works
- `apps/e2e/tests/payload/payload-collections.spec.ts` - Validates CMS access
- `apps/e2e/tests/payload/payload-database.spec.ts` - Validates database integration

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Unset shell `PAYLOAD_PUBLIC_SERVER_URL` to simulate pollution: `unset PAYLOAD_PUBLIC_SERVER_URL`
- [ ] Run shard 7 directly: `cd apps/e2e && pnpm test:shard7`
- [ ] Verify all 42 tests pass (without needing to unset env var)
- [ ] Run shard 8: `cd apps/e2e && pnpm test:shard8`
- [ ] Verify all seeding tests pass
- [ ] Run full test suite: `pnpm /test`
- [ ] Verify no new test failures
- [ ] Run Payload group: `pnpm test:group:payload`
- [ ] Verify all Payload tests pass together

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Script syntax error**: Malformed npm script could break test execution
   - **Likelihood**: low (simple string modification)
   - **Impact**: high (breaks Payload tests)
   - **Mitigation**: Carefully verify JSON syntax after editing package.json using JSON validator

2. **Side effects on other tests**: Explicitly setting Payload URL might affect non-Payload tests
   - **Likelihood**: low (environment variable is specific to Payload tests)
   - **Impact**: low (non-Payload tests use different baseURL)
   - **Mitigation**: None needed - Payload URL only used by Payload project in playwright.config.ts

3. **CI/CD environment issues**: CI might have its own Payload URL in shell env that conflicts
   - **Likelihood**: low (explicit script export overrides shell env)
   - **Impact**: medium (CI Payload tests might fail)
   - **Mitigation**: Verify CI workflows don't set conflicting PAYLOAD_PUBLIC_SERVER_URL; if needed, CI can override in GitHub Actions `env:` directive

**Rollback Plan**:

If this fix causes issues:
1. Revert the `apps/e2e/package.json` changes via git
2. Return to original scripts without explicit env var
3. Document any new issues that emerged

**Monitoring** (if needed):
- Monitor Payload test shard 7/8 pass rates in CI for next 3 test runs
- Watch for any new connection failures to port 3020 (would indicate regression)
- No long-term monitoring needed after fix stabilizes

## Performance Impact

**Expected Impact**: none

No performance implications - this is a configuration-only change.

## Security Considerations

**Security Impact**: none

The port configuration has no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# If PAYLOAD_PUBLIC_SERVER_URL is set, unset it to simulate shell pollution
unset PAYLOAD_PUBLIC_SERVER_URL

# Run shard 7 (should fail with ERR_CONNECTION_REFUSED at http://localhost:3020)
cd apps/e2e && pnpm test:shard7
```

**Expected Result**: Tests fail trying to connect to `localhost:3020`, showing `net::ERR_CONNECTION_REFUSED`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format (if json formatting is configured)
pnpm format

# Run shard 7 (should pass)
cd apps/e2e && pnpm test:shard7

# Run shard 8 (should pass)
cd apps/e2e && pnpm test:shard8

# Run Payload group (should pass)
cd apps/e2e && pnpm test:group:payload

# Run full test suite
pnpm /test
```

**Expected Result**: All commands succeed, Payload tests pass on port 3021, zero regressions.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm /test

# Run Payload tests with explicit shell pollution to verify fix
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020 pnpm --filter web-e2e test:shard7
# ^ This should STILL PASS because the script's explicit export overrides the shell env

# Verify no Docker container on 3020
docker ps | grep 3020 || echo "No container on 3020 - expected"

# Verify Payload server on 3021
curl -s http://localhost:3021/admin/login | head -1
# Should return HTML, confirming server is running
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

**Migration needed**: no

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All npm script modifications are applied to `apps/e2e/package.json`
- [ ] JSON syntax is valid (no parse errors)
- [ ] Payload shard 7 tests pass (42 tests)
- [ ] Payload shard 8 tests pass (seeding tests)
- [ ] Full test suite passes with zero regressions
- [ ] Manual testing checklist complete
- [ ] Manual test with `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` still passes (proves explicit export overrides shell env)
- [ ] Code review approved (if applicable)

## Notes

**Implementation Pattern**: This fix demonstrates the "explicit environment variable precedence" pattern in npm scripts. By exporting the variable in the script itself rather than relying on .env files, we ensure correct behavior regardless of shell environment pollution.

**Prevention for Future Issues**: This pattern can be applied to other environment-dependent tests (billing tests, E2B tests, etc.) that have port or URL dependencies. The principle: "explicit is better than implicit."

**Related Issues**: This fix prevents recurrence of #370, #376, #693.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #966*
