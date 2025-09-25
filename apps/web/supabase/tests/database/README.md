# RLS Performance Testing Framework

## Overview

This testing framework validates the RLS (Row Level Security) performance improvements for GitHub Issue #345.
The issue identified critical performance problems where `auth.uid()` function calls in RLS policies caused
60-80% performance degradation due to per-row re-evaluation.

## Problem Statement

**BEFORE**: Direct `auth.uid()` calls in RLS policies

```sql
-- ❌ SLOW: Re-evaluates auth.uid() for every row
CREATE POLICY "slow_policy" ON table_name FOR SELECT
  USING (user_id = auth.uid());
```

**AFTER**: Subquery wrapper pattern

```sql
-- ✅ FAST: Evaluates auth.uid() once per query
CREATE POLICY "fast_policy" ON table_name FOR SELECT
  USING (user_id = (select auth.uid()));
```

## Expected Performance Impact

| Dataset Size | Before Migration | After Migration | Improvement |
|--------------|------------------|-----------------|-------------|
| 1,000 rows   | 50ms            | 5ms             | 10x faster |
| 10,000 rows  | 500ms           | 15ms            | 33x faster |
| 100,000 rows | 5000ms          | 45ms            | 111x faster |

## Test Files

### 1. `rls-performance.test.sql`

**Purpose**: Sets up large test datasets to expose the performance issue
**Creates**:

- 1,500 survey_responses records
- 2,000 ai_request_logs records
- 1,200 building_blocks_submissions records
- 500 additional users with 250 team memberships
- Test accounts and memberships for security validation

### 2. `rls-performance-benchmarks.test.sql`

**Purpose**: Executes queries that demonstrate the performance problem
**Key Benchmarks**:

- Direct user data access patterns
- Complex joins with RLS filtering
- Team-based access with `has_role_on_account()`
- Aggregation queries with auth context
- Full table scans with RLS policies
- Concurrent user simulation queries

### 3. `validate-rls-fix.test.sql`

**Purpose**: Ensures security is maintained after performance migration
**Security Tests**:

- User data isolation (users only see their own data)
- Cross-user access prevention
- Team access validation (members see team data)
- Admin privilege verification
- Edge case handling (NULL values, deleted users)
- Write operation security (insert/update/delete controls)

### 4. `rls-performance-methodology.md`

**Purpose**: Comprehensive testing methodology documentation
**Contains**:

- Step-by-step testing procedure
- Success criteria and KPIs
- Rollback strategy
- Troubleshooting guide
- CI/CD integration patterns

### 5. `run-rls-performance-tests.sh`

**Purpose**: Automated testing script for the complete validation process
**Modes**:

- `--baseline`: Run tests before migration
- `--post-migration`: Run tests after migration
- `--compare`: Generate comparison report
- No flags: Complete test suite with prompts

## Quick Start

### Option 1: Automated Complete Test Suite

```bash
# Run the complete test suite (recommended)
./run-rls-performance-tests.sh

# This will:
# 1. Run baseline performance and security tests
# 2. Prompt you to apply the migration
# 3. Run post-migration tests
# 4. Generate a comparison report
```

### Option 2: Manual Step-by-Step Testing

1. **Setup and Baseline Testing**:

   ```bash
   cd apps/web
   pnpm supabase:web:reset

   # Load test data
   psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -f supabase/tests/database/rls-performance.test.sql

   # Run baseline benchmarks
   ./run-rls-performance-tests.sh --baseline
   ```

2. **Apply Your RLS Migration**:

   ```bash
   # Apply your performance migration
   pnpm supabase migration up
   ```

3. **Post-Migration Testing**:

   ```bash
   # Run post-migration tests
   ./run-rls-performance-tests.sh --post-migration
   ```

4. **Compare Results**:

   ```bash
   # Generate comparison report
   ./run-rls-performance-tests.sh --compare
   ```

## Affected Tables

The following tables have RLS policies that require the performance migration:

### Primary Tables (Direct Impact)

- **`survey_responses`**: Uses `auth.uid() = user_id` pattern
- **`ai_request_logs`**: Uses `auth.uid() = user_id` and team access patterns
- **`building_blocks_submissions`**: Uses `auth.uid() = user_id` pattern

### Secondary Tables (Indirect Impact)

- **`accounts_memberships`**: Referenced by team access functions
- Any other tables with RLS policies using direct `auth.uid()` calls

## Migration Pattern

For each affected table, apply this migration pattern:

```sql
-- Step 1: Create optimized policy
CREATE POLICY "table_read_v2" ON public.table_name FOR SELECT
  TO authenticated USING (
    user_id = (select auth.uid())  -- Subquery wrapper for performance
  );

-- Step 2: Drop old policy
DROP POLICY IF EXISTS "table_read" ON public.table_name;

-- Step 3: Rename new policy
ALTER POLICY "table_read_v2" ON public.table_name RENAME TO "table_read";
```

## Success Criteria

### Performance Requirements

- [ ] Query execution time reduced by 60-80%
- [ ] `EXPLAIN ANALYZE` shows single auth.uid() evaluation per query
- [ ] No query plan regressions
- [ ] Buffer usage optimized

### Security Requirements

- [ ] All user isolation tests pass
- [ ] Team access controls maintained
- [ ] Admin privileges work correctly
- [ ] No unauthorized data access possible
- [ ] Write operations properly secured

## Results Location

All test results are saved to:

```text
apps/web/supabase/tests/database/performance_results/
├── baseline_performance_TIMESTAMP.log
├── baseline_security_TIMESTAMP.log
├── optimized_performance_TIMESTAMP.log
├── optimized_security_TIMESTAMP.log
└── comparison_report_TIMESTAMP.md
```

## Troubleshooting

### Common Issues

1. **"Test data not found"**
   - Solution: Run `rls-performance.test.sql` first

2. **"Security validation failed"**
   - Solution: Check migration script for missing permissions or incorrect policy logic

3. **"No performance improvement"**
   - Solution: Verify migration uses `(select auth.uid())` not `auth.uid()`

4. **"Query plan still shows function scans"**
   - Solution: Check subquery syntax is correct

### Rollback Strategy

If issues occur:

```bash
cd apps/web
pnpm supabase migration down
./run-rls-performance-tests.sh --post-migration  # Validate rollback
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Validate RLS Performance
  run: |
    cd apps/web
    pnpm supabase start
    ./supabase/tests/database/run-rls-performance-tests.sh --baseline
    # Apply migration
    pnpm supabase migration up
    ./supabase/tests/database/run-rls-performance-tests.sh --post-migration
    ./supabase/tests/database/run-rls-performance-tests.sh --compare
```

## Support

For questions or issues with the testing framework:

1. Check the methodology document: `rls-performance-methodology.md`
2. Review test logs in `performance_results/` directory
3. Verify Supabase is running: `pnpm supabase status`

This framework ensures that RLS performance improvements are thoroughly validated while maintaining security integrity.
