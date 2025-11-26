# Bug Fix: E2E Test Failures Due to Supabase Configuration Mismatch

**Related Diagnosis**: #697 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test infrastructure hardcodes port 54321 and demo keys while actual Supabase runs on port 54521 with unique keys
- **Fix Approach**: Dynamically fetch Supabase configuration from `npx supabase status` instead of hardcoding
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test infrastructure has hardcoded Supabase configuration that doesn't match the actual running Supabase instance:

- **Infrastructure expects**: Port 54321 with demo JWT keys
- **Supabase actually runs on**: Port 54521 with unique generated keys (changes per start)
- **Result**: All tests requiring database access fail with PGRST301 errors ("No suitable key or wrong key type")

For full details, see diagnosis issue #697.

### Solution Approaches Considered

#### Option 1: Dynamic Configuration Detection ⭐ RECOMMENDED

**Description**: Update infrastructure-manager.cjs and e2e-validation.ts to dynamically fetch Supabase config via `npx supabase status --output json` instead of hardcoding values.

**Pros**:
- Automatically adapts when Supabase restarts with new ports/keys
- No manual configuration needed
- Self-healing: works regardless of Supabase startup behavior
- Future-proof: handles Supabase version updates automatically

**Cons**:
- Adds shell execution overhead (~200ms per test setup)
- Requires `supabase` CLI available in PATH
- May fail if CLI is unavailable

**Risk Assessment**: low - shell execution is already used elsewhere in test infrastructure, npx supabase is always available during test setup

**Complexity**: simple - straightforward shell command parsing

#### Option 2: Use Consistent Port Configuration

**Description**: Configure Supabase to always use port 54321 via `apps/web/supabase/config.toml`.

**Pros**:
- Simple configuration change
- No runtime detection needed
- Consistent, predictable port

**Cons**:
- Supabase CLI may have bugs or ignore config (as evidenced by current behavior)
- Doesn't address the fundamental mismatch between intention and reality
- Brittler solution - relies on Supabase CLI behavior

**Why Not Chosen**: The diagnosis shows Supabase is already configured to use port 54321 in config.toml but still runs on 54521. This indicates a config parsing or precedence issue in the Supabase CLI. Relying on fixing that upstream is not reliable.

#### Option 3: Manual Env File Configuration

**Description**: Require developers to manually update `.env.test` after each Supabase start.

**Cons**:
- Error-prone and manual
- Doesn't scale to CI/CD environments
- Violates DRY principle

**Why Not Chosen**: Manual configuration is unreliable and defeats the purpose of automated testing.

### Selected Solution: Dynamic Configuration Detection

**Justification**: This approach is the most robust because:
1. Adapts to Supabase behavior rather than fighting it
2. Eliminates manual configuration steps
3. Works in all environments (local, CI/CD)
4. Low complexity to implement
5. Maintains backward compatibility

**Technical Approach**:
- Create utility function `getSupabaseConfig()` that executes `npx supabase status --output json`
- Parse the output to extract API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
- Use parsed values as fallback when env vars aren't set
- Update both infrastructure-manager.cjs and e2e-validation.ts

**Architecture Changes** (if any):
- None. Adding a utility function that infrastructure-manager.cjs calls during test env setup
- e2e-validation.ts will use dynamically fetched values as fallback

**Migration Strategy** (if needed):
- No data migration needed
- Existing `.env.test` files will continue to work
- Dynamic detection acts as intelligent fallback when env vars not set

## Implementation Plan

### Affected Files

List files that need modification:

- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Update `createDefaultEnv()` to use dynamic config instead of hardcoded values
- `apps/e2e/tests/utils/e2e-validation.ts` - Update fallback values to use dynamic config
- `apps/e2e/src/infrastructure/port-binding-verifier.ts` - Update DEFAULT_SUPABASE_PORTS to use dynamic detection

### New Files

If new files are needed:
- `.ai/ai_scripts/testing/infrastructure/supabase-config-loader.js` - Utility function to fetch Supabase config

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Supabase Config Loader Utility

<describe what this step accomplishes>

Create a reusable utility function that:
- Executes `npx supabase status --output json` in the apps/web directory
- Parses the JSON output
- Extracts API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
- Handles errors gracefully (missing CLI, network issues)

- Create `supabase-config-loader.js` with `getSupabaseConfig()` function
- Add error handling for missing CLI, invalid JSON, missing properties
- Add logging for debugging configuration issues

**Why this step first**: This is the foundational piece that other files will depend on.

#### Step 2: Update infrastructure-manager.cjs

<describe what this step accomplishes>

Modify the default environment creation to use dynamic configuration:

- Import the new supabase-config-loader.js utility
- Call `getSupabaseConfig()` when creating default .env.test
- Use parsed values instead of hardcoded demo keys/ports
- Preserve existing env var loading (if .env.test exists, use it)
- Fall back to dynamic detection if env file doesn't exist

**Code changes**:
- Line 743: Replace hardcoded NEXT_PUBLIC_SUPABASE_URL with dynamic value
- Line 744-745: Replace hardcoded keys with dynamic values
- Line 746: Replace hardcoded DATABASE_URL with dynamic value

#### Step 3: Update e2e-validation.ts

<describe what this step accomplishes>

Update Supabase connection validation to handle dynamic configuration:

- Import dynamic config fallback
- Update default values in `validateSupabaseConnection()` (lines 23, 26)
- Replace hardcoded port 54321 and demo keys with dynamic values
- Maintain backward compatibility with env vars

**Code changes**:
- Line 23: Use E2E_SUPABASE_URL env var or dynamically fetch it
- Line 25-26: Use E2E_SUPABASE_ANON_KEY env var or dynamically fetch it

#### Step 4: Update port-binding-verifier.ts

<describe what this step accomplishes>

Update port verification to detect actual Supabase ports:

- Modify DEFAULT_SUPABASE_PORTS to fetch actual ports from Supabase config
- Update `diagnosePortBindingFailure()` to use dynamic ports
- Keep fallback to 54321, 54322, 54323 for backward compatibility

**Code changes**:
- Line 34: Fetch kong port from dynamic config instead of hardcoding 54321

#### Step 5: Add/Update Tests

<describe the testing strategy>

- Add unit tests for `getSupabaseConfig()` utility function
- Test JSON parsing of valid `supabase status` output
- Test error handling when CLI is missing
- Test fallback to hardcoded values when dynamic fetch fails
- Verify E2E health check passes with dynamic configuration
- Run auth-simple.spec.ts to verify authentication flow works

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getSupabaseConfig()` parses valid supabase status JSON correctly
- ✅ Configuration extracts correct API_URL, keys, and database URL
- ✅ Function handles missing CLI gracefully with fallback values
- ✅ Function handles invalid JSON output
- ✅ Function handles missing properties in JSON
- ✅ Regression test: hardcoded values are no longer used

**Test files**:
- `.ai/ai_scripts/testing/infrastructure/__tests__/supabase-config-loader.test.js` - Unit tests for config loader
- `apps/e2e/tests/utils/__tests__/e2e-validation.test.ts` - Tests for validation function

### Integration Tests

E2E health check should pass with dynamically detected configuration:

**Test files**:
- `apps/e2e/tests/healthcheck.spec.ts` - Health endpoint should report database as healthy

### E2E Tests

Run the full E2E suite to verify database connectivity:

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Verify auth flow works
- `apps/e2e/tests/billing/team-billing.spec.ts` - Verify billing page loads
- `apps/e2e/tests/billing/user-billing.spec.ts` - Verify user billing loads

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start fresh Supabase instance: `pnpm supabase:web:reset`
- [ ] Verify `npx supabase status --output json` returns valid configuration
- [ ] Run E2E health check: should report database as healthy
- [ ] Run auth-simple.spec.ts: authentication flow should work
- [ ] Run full E2E shard 1: should complete without timeout failures
- [ ] Verify logs show dynamic configuration was fetched
- [ ] Test with port 54521 specifically (should work)
- [ ] Test with hardcoded port 54321 fallback (should still work if Supabase runs there)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Missing supabase CLI**: `npx supabase status` fails if CLI not available
   - **Likelihood**: low - CLI is always available during test setup
   - **Impact**: low - falls back to hardcoded values
   - **Mitigation**: Add fallback to hardcoded demo keys if CLI fails

2. **Configuration changes between runs**: Supabase generates new keys each restart
   - **Likelihood**: high - this is expected behavior
   - **Impact**: none - dynamic detection handles this
   - **Mitigation**: Dynamic detection is the solution

3. **Performance impact**: Shell execution adds overhead to test startup
   - **Likelihood**: low - overhead ~200ms (negligible)
   - **Impact**: low - minimal impact on total test execution time
   - **Mitigation**: Cache configuration for duration of test run

**Rollback Plan**:

If this fix causes issues in production:
1. Revert infrastructure-manager.cjs to hardcoded configuration
2. Ensure .env.test file is checked into git with known working values
3. Restart E2E tests with rolled-back configuration
4. Investigate what caused dynamic detection to fail

**Monitoring** (if needed):
- Monitor E2E test health endpoint for failures
- Log when dynamic configuration is fetched vs env vars used
- Alert if supabase CLI is unavailable during test setup

## Performance Impact

**Expected Impact**: minimal

Dynamic configuration fetching adds ~200ms overhead to test setup (executed once per test run). This is negligible compared to:
- Supabase startup time: ~5-10 seconds
- Playwright launch: ~2-3 seconds
- First page load: ~1-2 seconds

**Performance Testing**:
- Measure test startup time before and after fix
- Confirm no regression in E2E test execution time
- Profile shell execution time for npx supabase status

## Security Considerations

**Security Impact**: none

- Dynamic configuration fetches from local Supabase instance only
- No external API calls or network requests
- Secret keys are only used for test environment
- Test keys are generated fresh and never stored persistently

**Security Review**: Not needed - no sensitive data exposure or authentication mechanism changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify Supabase runs on different port than expected
npx supabase status
# Note: API URL shows 54521, not 54321

# Run healthcheck which should fail
pnpm test:e2e -- --project=healthcheck
# Expected: timeout waiting for database to become healthy
```

**Expected Result**: Health endpoint reports `{"services":{"database":false}}` and test times out.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint (format)
pnpm format

# Build
pnpm build

# Unit tests for new utility
pnpm test:unit apps/e2e/tests/utils

# E2E health check should pass
pnpm test:e2e -- --project=healthcheck

# Run full E2E shard 1
pnpm test:e2e -- --shard=1/10

# All E2E shards
pnpm test:e2e
```

**Expected Result**: All commands succeed, health endpoint reports `{"services":{"database":true}}`, E2E tests complete without timeout failures.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify specific failing tests now pass
pnpm test:e2e -- --project=auth-simple
pnpm test:e2e -- --project=team-billing
pnpm test:e2e -- --project=user-billing
pnpm test:e2e -- --project=payload-connectivity

# Check no new test failures
pnpm test:e2e --reporter=list
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing utilities:
- Node.js built-in `child_process.execSync` (already used in codebase)
- Supabase CLI (already available via `npx supabase`)
- Node.js built-in JSON parsing

## Database Changes

**Migration needed**: no

No database schema changes are required. This fix only updates how the test infrastructure detects and uses existing Supabase configuration.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- Fix is isolated to test infrastructure
- Does not affect production code or deployment

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Existing .env.test files will continue to work
- Dynamic detection only acts as fallback when env vars not set
- No breaking changes to test APIs or interfaces

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (health check passes)
- [ ] All E2E tests pass (at least 9/10 shards)
- [ ] Zero regressions detected
- [ ] Unit tests for config loader added and passing
- [ ] No manual workarounds needed
- [ ] Dynamic configuration works on CI/CD

## Notes

**Key Design Decision**: Using dynamic detection rather than fixing hardcoded values makes this solution resilient to Supabase CLI behavior changes. The Supabase CLI has already demonstrated it may ignore config.toml port settings, so detecting the actual running configuration is more reliable than enforcing a specific port.

**Related Documentation**:
- E2E Testing Fundamentals: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- Database Patterns: `.ai/ai_docs/context-docs/development/database-patterns.md`
- Recent commits: `fae2efd14` (health check query change), `d6dfa1465` (Payload port alignment)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #697*
