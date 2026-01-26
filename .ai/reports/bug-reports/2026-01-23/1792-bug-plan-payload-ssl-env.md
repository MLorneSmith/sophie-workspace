# Bug Fix: E2E Shard 7 - Next.js NODE_ENV Override Breaking Payload SSL Configuration

**Related Diagnosis**: #1791
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Next.js `next start` forcibly overrides `NODE_ENV=production`, causing SSL to be enabled against local Supabase (which has SSL disabled)
- **Fix Approach**: Replace `NODE_ENV` check with custom `PAYLOAD_ENV` variable that Next.js won't override
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 7 fails in CI because:
1. CI runs `pnpm --filter payload start:test` with `NODE_ENV=test`
2. Next.js `next start` internally resets `NODE_ENV=production` (documented behavior)
3. `database-adapter-singleton.ts` checks `this.environment === "production"` → SSL enabled
4. SSL connection attempted against local Supabase (SSL disabled) → connection fails
5. Payload never initializes → schema not created → tests fail with `relation "payload.users" does not exist`

For full details, see diagnosis issue #1791.

### Solution Approaches Considered

#### Option 1: Use Custom Environment Variable ⭐ RECOMMENDED

**Description**: Replace `NODE_ENV` dependency with a custom `PAYLOAD_ENV` variable that Next.js won't override. This follows standard Next.js patterns for environment-specific configuration.

**Pros**:
- Simple fix (3 small changes across 2 files)
- Follows Next.js best practices (custom env vars for non-dev/prod configuration)
- Works in all environments (CI, local dev, Claude Code, production)
- No schema changes, no dependencies, no migrations needed
- Future-proof: if more env-specific config is needed, pattern already established
- Aligns with existing project patterns (database adapter already has good structure)

**Cons**:
- Introduces another environment variable (minor complexity)
- Requires coordinating between package.json and database adapter code

**Risk Assessment**: Low - very isolated change, no side effects

**Complexity**: Simple - only string variable swap

#### Option 2: Detect Localhost Connection

**Description**: Automatically disable SSL when DATABASE_URI points to localhost or 127.0.0.1.

**Pros**:
- No new environment variables needed
- "Just works" without configuration

**Cons**:
- Could mask misconfiguration in production (if DB URL somehow ends up as localhost)
- Doesn't solve the general problem of environment-specific configuration
- Fragile heuristic approach

**Why Not Chosen**: Less robust than explicit configuration. Hostname-based detection is unreliable and could introduce security issues if accidentally used in production.

#### Option 3: Explicit `--env` Flag for `next start`

**Description**: Use `--env <file>` flag on `next start` command to load test environment file.

**Pros**:
- Built-in Next.js feature

**Cons**:
- Doesn't work - Next.js `next start` doesn't accept `--env` flag for runtime configuration
- Only works for `next dev` with `--env-file`

**Why Not Chosen**: Not applicable to `next start`. The problem specifically occurs with production server startup.

### Selected Solution: Use Custom `PAYLOAD_ENV` Variable

**Justification**:
This is the standard solution in the Next.js ecosystem for environment-specific configuration that differs from the dev/production dichotomy. It's explicitly recommended in Next.js documentation and allows runtime configuration that Next.js won't override.

**Technical Approach**:
1. Modify `database-adapter-singleton.ts` to check `process.env.PAYLOAD_ENV` (with fallback to `NODE_ENV` for backward compatibility)
2. Update `shouldEnableSSL()` to use the new variable
3. Update `package.json` scripts to pass `PAYLOAD_ENV=test` to `start:test`
4. Add documentation comment explaining why we use `PAYLOAD_ENV` instead of `NODE_ENV`

**Architecture Changes**: None - this is a pure configuration change within existing structure.

**Migration Strategy**: None needed - backward compatible (falls back to `NODE_ENV` if `PAYLOAD_ENV` not set).

## Implementation Plan

### Affected Files

- `apps/payload/src/lib/database-adapter-singleton.ts` - Replace `NODE_ENV` checks with `PAYLOAD_ENV`
- `apps/payload/package.json` - Add `PAYLOAD_ENV=test` to `start:test` script

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update `database-adapter-singleton.ts` - Constructor

Modify the constructor to read `PAYLOAD_ENV` instead of `NODE_ENV`:

```typescript
constructor() {
  // Read PAYLOAD_ENV first (custom var that Next.js won't override)
  // Fallback to NODE_ENV for backward compatibility
  // Note: We use PAYLOAD_ENV because Next.js next start forcibly sets NODE_ENV=production
  // See: https://github.com/vercel/next.js/discussions/48914
  this.environment = process.env.PAYLOAD_ENV || process.env.NODE_ENV || "development";

  // ... rest of constructor
}
```

**Why this step first**: Foundation for the rest of the fix. All other environment checks depend on this.

#### Step 2: Update `database-adapter-singleton.ts` - `shouldEnableSSL()` Method

No changes needed to the logic - it already checks `this.environment === "production"`. By fixing Step 1, this automatically works correctly.

Add a comment explaining the fix:

```typescript
/**
 * Determine if SSL should be enabled based on environment and connection
 *
 * NOTE: We use `PAYLOAD_ENV` environment variable instead of `NODE_ENV` because:
 * - Next.js `next start` forcibly sets NODE_ENV=production internally
 * - This breaks test/development configurations where SSL should be disabled
 * - Custom environment variables like PAYLOAD_ENV are not overridden by Next.js
 *
 * See diagnosis: https://github.com/MLorneSmith/2025slideheroes/issues/1791
 */
private shouldEnableSSL(connectionString?: string): boolean {
  // ... existing logic unchanged ...
}
```

#### Step 3: Update `apps/payload/package.json` - `start:test` Script

Modify the script to pass `PAYLOAD_ENV=test`:

```json
"start:test": "cross-env PAYLOAD_ENV=test PORT=3021 NODE_OPTIONS=--no-deprecation next start",
```

**Before**:
```json
"start:test": "cross-env NODE_ENV=test PORT=3021 NODE_OPTIONS=--no-deprecation next start",
```

**Why**: Ensures `PAYLOAD_ENV=test` is available when the database adapter initializes, bypassing Next.js's `NODE_ENV` override.

#### Step 4: Add Test Coverage

Add test in E2E tests to verify SSL is disabled for local connections:

- Verify Payload starts successfully in CI
- Verify `payload.users` table exists after startup
- Verify test doesn't fail with "relation does not exist" error

**No new test files needed** - existing E2E Shard 7 tests will validate this works.

#### Step 5: Validation

Run E2E Shard 7 and confirm all tests pass:

```bash
# Trigger E2E workflow
gh workflow run e2e-sharded.yml --repo MLorneSmith/2025slideheroes

# Or run locally to validate quickly
pnpm --filter web-e2e test:shard7
```

## Testing Strategy

### Unit Tests

No new unit tests required - this is a configuration change, not business logic.

**Validation**: Existing logging in `database-adapter-singleton.ts` will show the correct environment being used.

### Integration Tests

E2E tests already cover this scenario:

**Test files**:
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Verifies Payload starts and schema exists

### Manual Testing Checklist

Execute these tests before considering the fix complete:

- [ ] Run E2E Shard 7 in CI (GitHub Actions)
- [ ] Verify all 9 Payload tests in shard 7 pass
- [ ] Verify `payload.users` table exists (via test success)
- [ ] Verify no SSL connection errors in logs
- [ ] Run shard 7 locally to validate quick feedback loop
- [ ] Verify other shards (1-6, 8-12) still pass (no regressions)

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Unintended SSL Disabling in Production**: If `PAYLOAD_ENV` is accidentally set to `test` in production
   - **Likelihood**: Low (requires explicit misconfiguration)
   - **Impact**: Medium (SSL disabled could allow MITM attacks in cloud environments)
   - **Mitigation**: Add environment validation in Payload startup to warn if `PAYLOAD_ENV=test` in production (detect via VERCEL_ENV or similar)

2. **Backward Compatibility**: Existing deployments using `NODE_ENV=test`
   - **Likelihood**: Low (only affects `start:test` command which is CI-only)
   - **Impact**: Low (fallback to `NODE_ENV` maintains compatibility)
   - **Mitigation**: Fallback logic ensures existing behavior continues to work

3. **Environment Variable Misconfiguration**: Variable name typo or missing from script
   - **Likelihood**: Low (simple one-line change)
   - **Impact**: High (would revert to original bug)
   - **Mitigation**: Review in code comment explaining the variable, include in deployment checklist

**Rollback Plan**:

If this fix causes issues:
1. Revert `package.json` changes (restore `NODE_ENV=test`)
2. Revert `database-adapter-singleton.ts` changes (restore `NODE_ENV` check)
3. Shard 7 will resume failing (same as before fix)
4. Investigate what went wrong and retry with more careful validation

**Monitoring** (if needed):
- Monitor E2E Shard 7 success rate after deployment
- Watch for SSL connection errors in Payload logs
- Alert if Payload health check returns 500

## Performance Impact

**Expected Impact**: None

This is a pure configuration change that doesn't affect runtime performance, query execution, or data processing.

## Security Considerations

**Security Impact**: Low

**Considerations**:
- Using custom env vars is standard practice and doesn't introduce vulnerabilities
- SSL is still properly enabled in production (where `PAYLOAD_ENV` won't be set)
- Fallback to `NODE_ENV` maintains existing security posture
- No sensitive data exposure in configuration

**Security Review Needed**: No

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger E2E workflow on current dev branch
gh run create -r MLorneSmith/2025slideheroes e2e-sharded.yml

# Or check recent run
gh run list --repo MLorneSmith/2025slideheroes --workflow e2e-sharded.yml --limit 1 --json number,conclusion

# Expected: Shard 7 fails with "relation payload.users does not exist"
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E Shard 7 specifically
pnpm --filter web-e2e test:shard7

# Or trigger full E2E workflow
gh workflow run e2e-sharded.yml --repo MLorneSmith/2025slideheroes
```

**Expected Result**:
- All commands succeed
- E2E Shard 7 passes with 9/9 tests passing
- Payload starts without SSL errors
- `payload.users` table queries succeed
- No "relation does not exist" errors

### Regression Prevention

```bash
# Run all E2E shards to ensure nothing broke
pnpm --filter web-e2e test

# Or run full test suite
pnpm test
```

## Dependencies

### New Dependencies

**No new dependencies required** - this uses existing `cross-env` and built-in Node.js `process.env`.

## Database Changes

**No database changes required** - this is purely a configuration change.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- No special steps needed
- Ensure `PAYLOAD_ENV=test` is set in CI environment variables (already configured via script)

**Feature flags needed**: No

**Backwards compatibility**: Maintained (fallback to `NODE_ENV` ensures existing code continues to work)

## Success Criteria

The fix is complete when:
- [ ] E2E Shard 7 passes in CI (all 9 tests)
- [ ] Payload starts without SSL connection errors
- [ ] `unlockPayloadUser()` succeeds (table exists)
- [ ] All other E2E shards continue to pass (no regressions)
- [ ] Code review approved
- [ ] Local testing validates quick feedback loop

## Notes

### Why This Approach Is Standard

Next.js explicitly recommends custom environment variables for application-specific configuration:
- [Next.js Docs: Non-standard NODE_ENV](https://nextjs.org/docs/messages/non-standard-node-env)
- [Next.js Discussion #48914: NODE_ENV is always production](https://github.com/vercel/next.js/discussions/48914)

The pattern is to use `process.env.NODE_ENV` for **build-time** configuration (dev/production builds) and custom variables like `APP_ENV` or `PAYLOAD_ENV` for **runtime** configuration.

### Related Issues
- #881: Same root cause (Claude Code shell)
- #882: Previous fix attempt (ineffective)

### Code Review Notes
- This fix is intentionally surgical - only the necessary changes
- The fallback logic maintains backward compatibility
- Comments explain why we use `PAYLOAD_ENV` for future maintainers
- No schema changes, no migrations, minimal risk

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1791*
