# Bug Fix: Payload integration tests fail with self-signed certificate error

**Related Diagnosis**: #963
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `.env.test.example` lacks `sslmode=disable` in DATABASE_URI, causing pg to attempt SSL verification against local Supabase's self-signed certificate
- **Fix Approach**: Add `sslmode=disable` to DATABASE_URI in `.env.test.example` and ensure `.env.test` is created from example file
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Six Payload integration test files (82 tests total) fail with "self-signed certificate in certificate chain" errors because `.env.test.example` lacks `sslmode=disable` in DATABASE_URI, and `.env.test` file doesn't exist. When `payload.seeding.config.ts` loads at module evaluation time, it reads DATABASE_URI without SSL disablement, causing node-postgres to default to SSL verification which fails against local Supabase's self-signed certificate.

For full details, see diagnosis issue #963.

### Solution Approaches Considered

#### Option 1: Add sslmode=disable to .env.test.example + document .env.test creation ⭐ RECOMMENDED

**Description**: Update `.env.test.example` to include `?sslmode=disable` in DATABASE_URI, and document in README that developers should copy `.env.test.example` to `.env.test` before running tests. This is the minimal, surgical fix that addresses the root cause directly.

**Pros**:
- Minimal code changes (1 line in `.env.test.example`)
- Follows existing pattern used in `.env.development`
- No automated tooling needed
- Zero risk to production (test environment only)
- Developers explicitly control their test environment
- Matches PostgreSQL's recommended approach for local SSL bypass

**Cons**:
- Requires manual step (copying .env.test.example to .env.test)
- Could be forgotten by new developers

**Risk Assessment**: low - This is a test-only change to an example file. The worst case is tests still fail if `.env.test` isn't created, which is the current state.

**Complexity**: simple - Single-line change to configuration file, plus documentation update.

#### Option 2: Auto-create .env.test from .env.test.example in vitest.setup.ts

**Description**: Add logic to `vitest.setup.ts` that automatically copies `.env.test.example` to `.env.test` if it doesn't exist, ensuring the file is always present before tests run.

**Pros**:
- Automated - no manual step required
- Guarantees `.env.test` exists
- Developer-friendly

**Cons**:
- Adds complexity to test setup
- File system operations during test init could cause issues
- Overwrites developer customizations if `.env.test` accidentally deleted
- Goes against standard practice of not auto-generating config files
- More code to maintain

**Why Not Chosen**: While more automated, this introduces unnecessary complexity. The standard practice across all environments is to provide `.example` files that developers copy manually. This gives developers explicit control over their environment configuration.

#### Option 3: Modify payload.seeding.config.ts to auto-add sslmode=disable for test env

**Description**: Update `payload.seeding.config.ts` to detect when running in test environment (`NODE_ENV=test`) and automatically append `?sslmode=disable` to DATABASE_URI if not present.

**Pros**:
- Self-healing - works regardless of `.env.test` state
- No manual steps required

**Cons**:
- Adds logic complexity to production code for test-only issue
- Magic behavior - harder to debug SSL issues if auto-modification fails
- Violates principle of explicit configuration
- Could mask real SSL configuration issues
- More complex than necessary

**Why Not Chosen**: This adds unnecessary complexity to production code to solve a test environment issue. Configuration should be explicit, not magic.

### Selected Solution: Add sslmode=disable to .env.test.example + document .env.test creation

**Justification**: This is the minimal, surgical fix that addresses the root cause without adding complexity or magic behavior. It follows the existing pattern used in `.env.development`, maintains explicit configuration, and has zero risk to production. The only tradeoff is a manual step (copying the file), which is standard practice for environment configuration across all Node.js projects.

**Technical Approach**:
- Update `.env.test.example` line 6 to include `?sslmode=disable` parameter
- Add documentation note in test-related README or CONTRIBUTING.md about copying `.env.test.example` to `.env.test`
- Optionally: Add a `pnpm test:setup` script that copies the file and shows helpful message

**Architecture Changes**: None - this is purely configuration.

**Migration Strategy**: No migration needed - this is a test setup fix. Developers running tests for the first time will copy the updated `.env.test.example`.

## Implementation Plan

### Affected Files

- `apps/payload/.env.test.example` - Add `?sslmode=disable` to DATABASE_URI on line 6
- `apps/payload/package.json` - (Optional) Add `test:setup` script to help developers
- `CONTRIBUTING.md` or `apps/payload/README.md` - (Optional) Document .env.test setup

### New Files

No new files required. The `.env.test` file will be created by developers copying `.env.test.example`.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update .env.test.example with sslmode=disable

Edit `apps/payload/.env.test.example` and update line 6 from:
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres
```

to:
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?sslmode=disable
```

**Why this step first**: This is the core fix that prevents SSL verification errors. All other steps are optional enhancements.

#### Step 2: (Optional) Add test:setup script to package.json

Add a helpful script to `apps/payload/package.json`:
```json
"test:setup": "cp .env.test.example .env.test && echo '✅ .env.test created from .env.test.example'"
```

This gives developers an easy command to set up their test environment.

**Why optional**: Not strictly required - developers can copy the file manually, but this improves DX.

#### Step 3: (Optional) Add documentation

Add a note to `CONTRIBUTING.md` or `apps/payload/README.md`:
```markdown
## Running Tests

Before running Payload tests for the first time:
```bash
cd apps/payload
pnpm test:setup  # OR: cp .env.test.example .env.test
```

Then run tests:
```bash
pnpm test
```
```

**Why optional**: Helps onboard new developers, but not required for the fix to work.

#### Step 4: Verify the fix

Run the integration tests that were previously failing:
```bash
cd apps/payload
# Create .env.test from updated example
cp .env.test.example .env.test

# Run tests
pnpm test
```

All 82 previously failing tests should now pass.

#### Step 5: Run validation commands

Run all quality checks:
```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Testing Strategy

### Unit Tests

No unit tests required - this is a configuration fix, not code logic.

### Integration Tests

**Validation**: The existing 82 failing integration tests will serve as the regression test. After this fix:
- ✅ All 82 integration tests should pass
- ✅ Zero SSL certificate errors in test output
- ✅ All 710 previously passing tests still pass

**Test files** (will validate the fix):
- `apps/payload/src/seed/seed-engine/__tests__/integration/full-workflow.test.ts`
- `apps/payload/src/seed/seed-engine/__tests__/integration/error-scenarios.test.ts`
- `apps/payload/src/seed/seed-engine/__tests__/integration/idempotency.test.ts`
- `apps/payload/src/seed/seed-engine/__tests__/integration/collection-filtering.test.ts`
- `apps/payload/src/seed/seed-engine/core/payload-initializer.test.ts`
- `apps/payload/src/seed/seed-engine/index.test.ts`

### E2E Tests

Not applicable - this is test environment setup, doesn't affect E2E.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Delete `.env.test` if it exists
- [ ] Copy `.env.test.example` to `.env.test`
- [ ] Verify DATABASE_URI in `.env.test` contains `?sslmode=disable`
- [ ] Run `pnpm --filter payload test` and verify all tests pass
- [ ] Check test output for SSL certificate errors (should be none)
- [ ] Verify test count: 793 tests total, 0 failures expected
- [ ] Run `grep -i "self-signed" <test-output>` to confirm no SSL errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Developers forget to copy .env.test**: Tests will still fail with same error
   - **Likelihood**: medium
   - **Impact**: low (same as current state, doesn't make it worse)
   - **Mitigation**: Add documentation, provide `test:setup` script with helpful message

2. **.env.test.example DATABASE_URI changes but .env.test doesn't get updated**: Stale config
   - **Likelihood**: low
   - **Impact**: low (tests might fail, prompting investigation)
   - **Mitigation**: Document in CONTRIBUTING.md that `.env.test` should be periodically synced with `.env.test.example`

3. **sslmode=disable might hide real SSL configuration issues**: Could mask problems
   - **Likelihood**: low
   - **Impact**: low (only affects local test environment, production uses proper SSL)
   - **Mitigation**: This is intentional - local Supabase uses self-signed certs, so SSL must be disabled

**Rollback Plan**:

If this fix causes unexpected issues (highly unlikely):
1. Revert the `.env.test.example` change
2. Delete `.env.test`
3. Tests will return to current failing state
4. No production impact possible (test-only change)

**Monitoring**: No monitoring needed - this is test environment only.

## Performance Impact

**Expected Impact**: none

This change only affects test setup configuration. There is zero performance impact on runtime code or production deployments.

## Security Considerations

**Security Impact**: none

This change only affects the local test environment. Production and staging environments use proper SSL certificates with `sslmode=require` or `sslmode=prefer`. Disabling SSL verification for local development/testing against Supabase's self-signed certificates is the correct and recommended approach.

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
cd apps/payload

# Ensure .env.test doesn't have sslmode=disable
grep "DATABASE_URI" .env.test 2>/dev/null || echo ".env.test doesn't exist"

# Run tests - should see SSL errors
pnpm test 2>&1 | grep -i "self-signed certificate"
```

**Expected Result**: Tests fail with "self-signed certificate in certificate chain" errors.

### After Fix (Bug Should Be Resolved)

```bash
cd apps/payload

# Apply fix
cp .env.test.example .env.test

# Verify DATABASE_URI has sslmode=disable
grep "sslmode=disable" .env.test

# Run all tests
pnpm test

# Check for SSL errors (should be none)
pnpm test 2>&1 | grep -i "self-signed" || echo "No SSL errors found ✅"

# Type check
cd ../..
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

**Expected Result**: All 793 tests pass, zero SSL errors, all quality checks pass.

### Regression Prevention

```bash
# Run full Payload test suite
pnpm --filter payload test

# Verify total test count (should be 793 with 0 failures)
# Previous: 710 passed, 82 failed, 1 skipped
# After fix: 792 passed, 0 failed, 1 skipped
```

## Dependencies

### New Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

This fix only affects test environment configuration, not database schema or migrations.

## Deployment Considerations

**Deployment Risk**: none

This change only affects local test environment. No deployment steps required.

**Special deployment steps**: None
**Feature flags needed**: no
**Backwards compatibility**: maintained (this is test-only)

## Success Criteria

The fix is complete when:
- [ ] `.env.test.example` contains `DATABASE_URI` with `?sslmode=disable`
- [ ] `.env.test` can be created from `.env.test.example`
- [ ] All 82 previously failing integration tests now pass
- [ ] Zero SSL certificate errors in test output
- [ ] All 710 previously passing tests still pass
- [ ] Total test count: 792 passed (710 + 82), 1 skipped
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] No regressions detected

## Notes

**Related Issues Pattern**: This is the third occurrence of SSL certificate issues (#561, #877, #963). The pattern suggests we should:
- Audit all `.env.example` files for consistency
- Ensure `sslmode=disable` is present in all local development/test configurations
- Document SSL configuration standards in CONTRIBUTING.md

**Why sslmode=disable is safe here**:
- Local Supabase (via `npx supabase start`) uses self-signed certificates
- This is the recommended approach per PostgreSQL and Supabase documentation
- Production environments use properly signed certificates with `sslmode=require`
- This only affects local testing, not deployed environments

**Alternative considered but rejected**: Some projects commit `.env.test` directly since it only contains local development credentials. However, the `.env.example` pattern is more standard and flexible.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #963*
