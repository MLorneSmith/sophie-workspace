# Bug Fix: E2E Shard 10 Duplicate Subscription Records

**Related Diagnosis**: #1460
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Multiple E2E billing test runs created duplicate subscription/billing_customer records without cleanup
- **Fix Approach**: Add test cleanup to E2E global-setup.ts to remove billing records before/after test runs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Test user `test1@slideheroes.com` accumulated 5 duplicate subscription records from multiple E2E test runs. The `getSubscription()` API uses `.maybeSingle()` expecting 0-1 rows, but receives 5 rows, causing PGRST116 error and billing page crash.

For full details, see diagnosis issue #1460.

### Solution Approaches Considered

#### Option 1: Add Test Cleanup Hook ⭐ RECOMMENDED

**Description**: Add cleanup logic to E2E `global-setup.ts` to delete all billing-related test data (subscriptions, billing_customers, subscription_items) before test suite runs. This ensures tests always start with a clean slate.

**Pros**:
- Simple implementation - just SQL DELETE statements
- Runs automatically before every test suite execution
- Prevents future accumulation of test data
- No code changes to production code
- Works for all test users, not just one
- Fast execution (<100ms)

**Cons**:
- Requires direct database access during tests
- Won't help with existing duplicates (need one-time cleanup)

**Risk Assessment**: low - Only affects local test database, no production impact. Deletes are scoped to test data only.

**Complexity**: simple - Add ~30 lines to global-setup.ts with SQL cleanup queries

#### Option 2: Add Unique Constraint on subscriptions(account_id)

**Description**: Add database constraint preventing multiple active subscriptions per account. Modify webhook handlers to upsert instead of insert.

**Pros**:
- Prevents duplicates at database level (strongest guarantee)
- Would catch bugs in webhook handlers
- Works in production too

**Cons**:
- Requires database migration
- Need to update webhook handlers to handle constraint violations
- More complex - affects production code paths
- Doesn't address root cause (missing test cleanup)
- May have legitimate use cases for multiple subscriptions (seat-based billing)

**Why Not Chosen**: Over-engineering for a test-specific issue. The real problem is missing test cleanup, not missing constraints. Adding constraints may break legitimate use cases.

#### Option 3: Modify getSubscription() to Handle Duplicates

**Description**: Change `getSubscription()` from `.maybeSingle()` to `.select().limit(1).single()` or similar, returning most recent subscription when duplicates exist.

**Pros**:
- Would "fix" the immediate error
- No test changes needed

**Cons**:
- Hides the real problem instead of fixing it
- Allows bad data to accumulate
- May mask actual bugs in webhook handlers
- Production code change to work around test issue
- Doesn't prevent future accumulation

**Why Not Chosen**: This is defensive programming that masks the root cause. The proper fix is to prevent duplicate data, not to handle it gracefully. If duplicates exist, that's a bug that should be surfaced, not hidden.

### Selected Solution: Add Test Cleanup Hook

**Justification**: This directly addresses the root cause (missing test cleanup) with minimal code changes and zero production impact. It's a standard testing practice to clean up test data between runs. The cleanup ensures test isolation and repeatability.

**Technical Approach**:
- Add `cleanupBillingTestData()` function to `apps/e2e/global-setup.ts`
- Execute before authentication setup to ensure clean database state
- Delete records from: `subscription_items`, `subscriptions`, `billing_customers` (in order due to foreign keys)
- Scope deletes to test accounts only (safety check)
- Log cleanup results for debugging

**Architecture Changes**: None - this is purely test infrastructure.

**Migration Strategy**: Not needed - one-time manual cleanup of existing duplicates, then automated cleanup prevents recurrence.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/global-setup.ts` - Add `cleanupBillingTestData()` function and call it before test execution

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: One-time Manual Cleanup of Existing Duplicates

Clean up the current duplicate records before implementing automated cleanup.

- Connect to local Supabase database via psql
- Delete duplicate subscription_items (keep most recent per subscription)
- Delete duplicate subscriptions (keep most recent per account)
- Delete duplicate billing_customers (keep most recent per account)
- Verify only 1 record per account remains

**Why this step first**: Need to fix existing state before preventing future duplicates.

**SQL Commands**:
```sql
-- Delete duplicate subscription_items (keep most recent)
DELETE FROM subscription_items
WHERE id NOT IN (
  SELECT DISTINCT ON (subscription_id) id
  FROM subscription_items
  ORDER BY subscription_id, created_at DESC
);

-- Delete duplicate subscriptions (keep most recent per account)
DELETE FROM subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (account_id) id
  FROM subscriptions
  ORDER BY account_id, created_at DESC
);

-- Delete duplicate billing_customers (keep most recent per account)
DELETE FROM billing_customers
WHERE id NOT IN (
  SELECT DISTINCT ON (account_id) id
  FROM billing_customers
  ORDER BY account_id, created_at DESC
);

-- Verify cleanup
SELECT account_id, COUNT(*) as count FROM subscriptions GROUP BY account_id HAVING COUNT(*) > 1;
SELECT account_id, COUNT(*) as count FROM billing_customers GROUP BY account_id HAVING COUNT(*) > 1;
```

#### Step 2: Add Cleanup Function to global-setup.ts

Add test data cleanup function that runs before every test suite execution.

- Import Supabase client creation utilities
- Create `cleanupBillingTestData()` async function
- Add SQL DELETE statements for billing tables (ordered by foreign key dependencies)
- Add logging for cleanup results
- Add error handling with helpful error messages

**Code Location**: `apps/e2e/global-setup.ts`

**Implementation**:
```typescript
import { getLogger } from '@kit/shared/logger';

async function cleanupBillingTestData() {
  const logger = await getLogger();

  logger.info({ name: 'e2e-cleanup' }, 'Cleaning up billing test data...');

  try {
    // Connect to test database
    const { Client } = await import('pg');
    const client = new Client({
      host: '127.0.0.1',
      port: 54522,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });

    await client.connect();

    // Delete in order: subscription_items → subscriptions → billing_customers
    // This respects foreign key constraints
    const queries = [
      'DELETE FROM subscription_items WHERE subscription_id IN (SELECT id FROM subscriptions WHERE account_id IN (SELECT id FROM accounts WHERE email LIKE \'%@slideheroes.com\' OR email LIKE \'%@makerkit.dev\'))',
      'DELETE FROM subscriptions WHERE account_id IN (SELECT id FROM accounts WHERE email LIKE \'%@slideheroes.com\' OR email LIKE \'%@makerkit.dev\')',
      'DELETE FROM billing_customers WHERE account_id IN (SELECT id FROM accounts WHERE email LIKE \'%@slideheroes.com\' OR email LIKE \'%@makerkit.dev\')',
    ];

    for (const query of queries) {
      const result = await client.query(query);
      logger.info(
        { name: 'e2e-cleanup', rowCount: result.rowCount },
        `Cleaned up ${result.rowCount} records`
      );
    }

    await client.end();

    logger.info({ name: 'e2e-cleanup' }, 'Billing test data cleanup complete');
  } catch (error) {
    logger.error({ name: 'e2e-cleanup', error }, 'Failed to cleanup billing test data');
    // Don't fail test suite on cleanup errors - log and continue
  }
}
```

#### Step 3: Call Cleanup in global-setup

Integrate cleanup function into existing global setup flow.

- Call `cleanupBillingTestData()` at the START of `globalSetup()` function (before auth setup)
- Ensure it runs before any test user authentication
- Add try-catch to prevent cleanup failures from blocking tests

**Code Location**: `apps/e2e/global-setup.ts` - `globalSetup()` function

**Integration**:
```typescript
async function globalSetup() {
  // Clean up billing test data BEFORE creating auth states
  await cleanupBillingTestData();

  // ... existing auth setup code
}
```

#### Step 4: Add Regression Test

Add test to verify cleanup works and prevent future regressions.

- Add test file: `apps/e2e/tests/infrastructure/billing-cleanup.spec.ts`
- Test verifies no duplicate subscriptions exist after cleanup
- Test creates subscription and verifies it's cleaned up on next run

**Test file**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Billing Test Data Cleanup', () => {
  test('should prevent duplicate subscriptions', async () => {
    // This test verifies the cleanup mechanism works
    // by checking database state after global-setup runs

    const { Client } = await import('pg');
    const client = new Client({
      host: '127.0.0.1',
      port: 54522,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    });

    await client.connect();

    // Query for duplicate subscriptions
    const result = await client.query(`
      SELECT account_id, COUNT(*) as count
      FROM subscriptions
      WHERE account_id IN (
        SELECT id FROM accounts
        WHERE email LIKE '%@slideheroes.com' OR email LIKE '%@makerkit.dev'
      )
      GROUP BY account_id
      HAVING COUNT(*) > 1
    `);

    await client.end();

    // Should be zero duplicate subscriptions after cleanup
    expect(result.rowCount).toBe(0);
  });
});
```

#### Step 5: Validation

Validate the fix works end-to-end.

- Run manual SQL cleanup (Step 1)
- Run E2E shard 10: `pnpm --filter e2e test:shard10`
- Verify test passes
- Run shard 10 again to verify cleanup prevents new duplicates
- Run full E2E suite to ensure no regressions
- Check database for duplicates after test runs

## Testing Strategy

### Unit Tests

No unit tests needed - this is test infrastructure, not production code.

### Integration Tests

Not applicable - this is E2E test infrastructure.

### E2E Tests

**Test files**:
- `apps/e2e/tests/infrastructure/billing-cleanup.spec.ts` - Regression test for cleanup mechanism
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Existing test should now pass

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [x] One-time cleanup: Run SQL cleanup to remove existing duplicates
- [ ] Verify cleanup: Query database to confirm no duplicates remain
- [ ] Run shard 10: `/test 10` - should pass without PGRST116 error
- [ ] Check database: Verify no new duplicates created
- [ ] Run shard 10 again: Should still pass (cleanup ran before test)
- [ ] Run full E2E suite: `/test --e2e` - should pass without billing failures
- [ ] Check logs: Verify cleanup function logs show expected deletions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cleanup deletes wrong data**: Accidentally delete non-test billing records
   - **Likelihood**: low
   - **Impact**: high (data loss)
   - **Mitigation**: WHERE clause scopes to test accounts only (`@slideheroes.com`, `@makerkit.dev` emails). Test on local database first.

2. **Cleanup fails silently**: Database errors not surfaced
   - **Likelihood**: medium
   - **Impact**: low (tests might fail, but data is safe)
   - **Mitigation**: Add logging for all cleanup operations. Don't block tests on cleanup failures.

3. **Foreign key constraint violations**: Delete order incorrect
   - **Likelihood**: low
   - **Impact**: medium (cleanup fails)
   - **Mitigation**: Delete in correct order: subscription_items → subscriptions → billing_customers

**Rollback Plan**:

If this fix causes issues:
1. Remove `cleanupBillingTestData()` call from global-setup.ts
2. Revert changes to global-setup.ts
3. Tests will accumulate duplicates again but won't fail from cleanup errors

**Monitoring**: Not needed - this is local test infrastructure.

## Performance Impact

**Expected Impact**: minimal

The cleanup adds ~100-200ms to test suite startup time (one-time cost before all tests). This is negligible compared to typical E2E test suite duration (5-15 minutes).

**Performance Testing**: Time global-setup execution before/after to measure impact.

## Security Considerations

**Security Impact**: none

This only affects local test database, not production. The cleanup queries are scoped to test accounts only.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check for duplicate subscriptions
cd /home/msmith/projects/2025slideheroes/apps/web && \
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres \
  -c "SELECT account_id, COUNT(*) FROM subscriptions GROUP BY account_id HAVING COUNT(*) > 1;"

# Run failing test
pnpm --filter e2e test:shard10
```

**Expected Result**: Query shows 5 duplicates, test fails with PGRST116 error.

### After Fix (Bug Should Be Resolved)

```bash
# Run one-time cleanup
cd /home/msmith/projects/2025slideheroes/apps/web && \
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres \
  -c "DELETE FROM subscription_items WHERE subscription_id IN (SELECT id FROM subscriptions WHERE account_id IN (SELECT id FROM accounts WHERE email LIKE '%@slideheroes.com')); \
      DELETE FROM subscriptions WHERE id NOT IN (SELECT DISTINCT ON (account_id) id FROM subscriptions ORDER BY account_id, created_at DESC); \
      DELETE FROM billing_customers WHERE id NOT IN (SELECT DISTINCT ON (account_id) id FROM billing_customers ORDER BY account_id, created_at DESC);"

# Verify cleanup worked
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres \
  -c "SELECT account_id, COUNT(*) FROM subscriptions GROUP BY account_id HAVING COUNT(*) > 1;"

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 10 (should pass now)
pnpm --filter e2e test:shard10

# Run shard 10 again (verify cleanup prevents new duplicates)
pnpm --filter e2e test:shard10

# Build
pnpm build
```

**Expected Result**: All commands succeed, test passes both times, no duplicates found.

### Regression Prevention

```bash
# Run billing test cleanup regression test
pnpm --filter e2e test apps/e2e/tests/infrastructure/billing-cleanup.spec.ts

# Run full E2E suite
pnpm --filter e2e test

# Check for any new duplicates
cd /home/msmith/projects/2025slideheroes/apps/web && \
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres \
  -c "SELECT 'subscriptions' as table_name, account_id, COUNT(*) FROM subscriptions GROUP BY account_id HAVING COUNT(*) > 1 \
      UNION ALL \
      SELECT 'billing_customers', account_id, COUNT(*) FROM billing_customers GROUP BY account_id HAVING COUNT(*) > 1;"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The `pg` package is already available in the E2E test environment.

## Database Changes

**Migration needed**: no

**No database schema changes required** - this is test infrastructure only.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: Not applicable - test infrastructure only.

**Feature flags needed**: no

**Backwards compatibility**: maintained - no production code changes.

## Success Criteria

The fix is complete when:
- [x] One-time manual cleanup removes all existing duplicates
- [ ] global-setup.ts includes `cleanupBillingTestData()` function
- [ ] Cleanup runs automatically before every test suite
- [ ] E2E shard 10 passes consistently
- [ ] No duplicate subscriptions exist after test runs
- [ ] Regression test added to prevent future issues
- [ ] All validation commands pass
- [ ] Manual testing checklist complete

## Notes

**Key Decision**: We chose test cleanup over database constraints because:
1. The root cause is missing test cleanup, not missing constraints
2. Test infrastructure should be responsible for test data lifecycle
3. Production may have legitimate use cases for multiple subscriptions (e.g., upgrade/downgrade transitions)
4. Adding constraints would require migration + webhook handler changes for a test-only issue

**Alternative Considered**: Adding a database constraint was rejected because it would affect production code for a test-specific problem. The proper fix is to clean up test data, not to modify production schema.

**Follow-up**: If duplicate subscriptions occur in production (not just tests), then revisit Option 2 (unique constraint) as a proper production fix.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1460*
