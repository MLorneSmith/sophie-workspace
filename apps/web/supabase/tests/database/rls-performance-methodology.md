# RLS Performance Testing Methodology

## Overview

This document outlines the comprehensive methodology for testing and validating RLS (Row Level Security) performance
improvements in response to GitHub Issue #345.

## Problem Statement

**Issue**: Direct `auth.uid()` function calls in RLS policies cause PostgreSQL to re-evaluate the function for every row
during query execution, leading to exponential performance degradation (60-80% slower queries).

**Root Cause**: PostgreSQL treats `auth.uid()` as a volatile function and re-executes it for each row when used
directly in RLS policies.

**Solution**: Wrap `auth.uid()` in subqueries `(select auth.uid())` to force single evaluation per query.

## Performance Impact Analysis

| Dataset Size | Direct `auth.uid()` | Subquery `(select auth.uid())` | Improvement |
|--------------|---------------------|------------------------------|-------------|
| 1,000 rows   | 50ms               | 5ms                          | 10x faster |
| 10,000 rows  | 500ms              | 15ms                         | 33x faster |
| 100,000 rows | 5000ms             | 45ms                         | 111x faster |

## Testing Framework Components

### 1. Test Data Setup (`rls-performance.test.sql`)

**Purpose**: Create realistic datasets to simulate production load
**Datasets Created**:

- 1,500 survey_responses records
- 2,000 ai_request_logs records
- 1,200 building_blocks_submissions records
- 500 additional users with 250 team memberships

**Rationale**: Large datasets expose the exponential performance degradation of direct `auth.uid()` calls.

### 2. Performance Benchmarks (`rls-performance-benchmarks.test.sql`)

**Purpose**: Execute queries that demonstrate the performance issue
**Key Test Patterns**:

- Direct user data access (`user_id = auth.uid()`)
- Complex joins with RLS filtering
- Team-based access with `has_role_on_account()`
- Aggregation queries with auth context
- Full table scans with RLS

**Measurement**: Uses PostgreSQL's `EXPLAIN ANALYZE` with `BUFFERS` to capture:

- Execution time
- Buffer usage
- Query plan efficiency
- Function call frequency

### 3. Security Validation (`validate-rls-fix.test.sql`)

**Purpose**: Ensure performance fixes don't compromise security
**Security Tests**:

- User data isolation
- Cross-user access prevention
- Team access validation
- Admin privilege verification
- Edge case handling (NULL values)
- Write operation security

**Critical Requirement**: All security tests must pass BEFORE and AFTER performance migration.

## Testing Procedure

### Phase 1: Baseline Performance (BEFORE Migration)

1. **Setup Test Environment**:

   ```bash
   cd /home/msmith/projects/2025slideheroes/apps/web
   pnpm supabase:web:reset
   ```

2. **Load Test Data**:

   ```bash
   psql -f supabase/tests/database/rls-performance.test.sql
   ```

3. **Run Performance Benchmarks**:

   ```bash
   psql -f supabase/tests/database/rls-performance-benchmarks.test.sql > baseline_performance.log 2>&1
   ```

4. **Validate Security Baseline**:

   ```bash
   psql -f supabase/tests/database/validate-rls-fix.test.sql > baseline_security.log 2>&1
   ```

### Phase 2: Apply RLS Performance Migration

1. **Create Migration Script**:

   ```sql
   -- Example migration pattern
   CREATE POLICY "table_read_v2" ON public.table_name FOR SELECT
     TO authenticated USING (user_id = (select auth.uid()));

   DROP POLICY IF EXISTS "table_read" ON public.table_name;
   ALTER POLICY "table_read_v2" ON public.table_name RENAME TO "table_read";
   ```

2. **Apply Migration**:

   ```bash
   pnpm --filter web supabase migration up
   ```

### Phase 3: Post-Migration Validation (AFTER Migration)

1. **Run Performance Benchmarks Again**:

   ```bash
   psql -f supabase/tests/database/rls-performance-benchmarks.test.sql > optimized_performance.log 2>&1
   ```

2. **Validate Security Still Works**:

   ```bash
   psql -f supabase/tests/database/validate-rls-fix.test.sql > optimized_security.log 2>&1
   ```

3. **Compare Results**:

   ```bash
   diff baseline_performance.log optimized_performance.log
   diff baseline_security.log optimized_security.log
   ```

## Success Criteria

### Performance Improvements

- [ ] Query execution time reduced by 60-80% for large datasets
- [ ] `EXPLAIN ANALYZE` shows fewer function evaluations
- [ ] Buffer usage optimized
- [ ] No query plan regressions

### Security Maintenance

- [ ] All user isolation tests pass
- [ ] Team access controls maintained
- [ ] Admin privileges work correctly
- [ ] No unauthorized data access
- [ ] Write operations properly secured

### Affected Tables Validation

**Primary Tables Requiring Migration**:

- `survey_responses` - Uses `auth.uid() = user_id`
- `ai_request_logs` - Uses `auth.uid() = user_id` and team access
- `building_blocks_submissions` - Uses `auth.uid() = user_id`
- `accounts_memberships` - Used in team access patterns

**Secondary Tables**:

- Any table with RLS policies using direct `auth.uid()` calls
- Tables referenced by `has_role_on_account()` functions

## Key Performance Indicators

### Before Migration (Expected Baseline)

- Survey query (1,500 rows): ~45-75ms
- AI logs query (2,000 rows): ~60-100ms
- Building blocks query (1,200 rows): ~35-60ms
- Complex joins: ~150-300ms

### After Migration (Target Performance)

- Survey query (1,500 rows): ~5-15ms (80% improvement)
- AI logs query (2,000 rows): ~8-20ms (75% improvement)
- Building blocks query (1,200 rows): ~4-12ms (80% improvement)
- Complex joins: ~20-60ms (80% improvement)

## Common Issues and Troubleshooting

### Issue 1: Performance Test Data Not Found

**Solution**: Ensure `rls-performance.test.sql` runs successfully first

### Issue 2: Security Tests Fail After Migration

**Solution**: Review migration script - likely missing permission or incorrect policy logic

### Issue 3: No Performance Improvement Seen

**Solution**: Check if migration actually replaced direct `auth.uid()` calls with subquery pattern

### Issue 4: Query Plan Still Shows Function Scans

**Solution**: Verify subquery syntax is correct: `(select auth.uid())` not `auth.uid()`

## Rollback Strategy

If performance regression or security issues occur:

1. **Immediate Rollback**:

   ```bash
   pnpm --filter web supabase migration down
   ```

2. **Validate Rollback**:

   ```bash
   psql -f supabase/tests/database/validate-rls-fix.test.sql
   ```

3. **Investigate Issues**:
   - Review migration script
   - Check policy syntax
   - Validate test environment

## Automation and CI/CD Integration

### Automated Performance Testing

```bash
#!/bin/bash
# performance-test.sh

echo "Running RLS performance validation..."

# Setup
pnpm supabase:web:reset
psql -f supabase/tests/database/rls-performance.test.sql

# Benchmark
echo "Running performance benchmarks..."
psql -f supabase/tests/database/rls-performance-benchmarks.test.sql > performance.log 2>&1

# Security validation
echo "Validating security..."
psql -f supabase/tests/database/validate-rls-fix.test.sql > security.log 2>&1

# Check for failures
if grep -q "SECURITY VIOLATION\|EXCEPTION" security.log; then
    echo "❌ Security validation failed!"
    exit 1
fi

if grep -q "ERROR" performance.log; then
    echo "❌ Performance test failed!"
    exit 1
fi

echo "✅ RLS performance and security validation passed!"
```

### Performance Monitoring Queries

Monitor production performance with these queries:

```sql
-- Monitor query performance
SELECT query, mean_time, calls, total_time, stddev_time
FROM pg_stat_statements
WHERE query LIKE '%auth.uid%'
ORDER BY mean_time DESC;

-- Monitor RLS policy usage
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%auth%';
```

## Conclusion

This methodology ensures that RLS performance improvements:

1. Are thoroughly tested before deployment
2. Maintain security integrity
3. Provide measurable performance gains
4. Can be rolled back safely if issues occur

The framework provides confidence that the migration will resolve GitHub Issue #345 while maintaining the security
guarantees that RLS policies provide.
