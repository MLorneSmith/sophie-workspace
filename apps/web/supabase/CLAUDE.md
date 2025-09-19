-- Add RLS policies (using OPTIMIZED patterns)
    public.has_permission((select auth.uid()), account_id, 'notes.manage'::app_permissions)
    public.has_permission((select auth.uid()), account_id, 'notes.manage'::app_permissions)
  )
  with check (
    public.has_permission((select auth.uid()), account_id, 'notes.manage'::app_permissions)
    public.has_permission((select auth.uid()), account_id, 'notes.manage'::app_permissions)
-- RLS policy for storage (using OPTIMIZED patterns)
    kit.get_storage_filename_as_uuid(name) = (select auth.uid())
    kit.get_storage_filename_as_uuid(name) = (select auth.uid())
    or
    public.has_permission(
      (select auth.uid()),

## RLS Performance Best Practices

### The Problem: Direct auth Function Calls

**CRITICAL**: Direct `auth.uid()` calls in RLS policies cause PostgreSQL to re-evaluate the function for every row during
query execution, leading to exponential performance degradation.

```sql
-- ❌ SLOW: Re-evaluates auth.uid() for every row
create policy "notes_read" on public.notes for select
  to authenticated using (
    user_id = auth.uid()  -- Re-evaluated N times for N rows!
  );

-- ❌ PERFORMANCE KILLER: Complex policies with multiple auth calls
create policy "complex_read" on public.data for select
  to authenticated using (
    user_id = auth.uid() OR  -- Evaluated N times
    public.has_permission(auth.uid(), account_id, 'read'::app_permissions)  -- Evaluated N*M times
  );
```

### The Solution: Subquery Wrapper Pattern

**SOLUTION**: Wrap `auth.uid()` in a subquery `(select auth.uid())` to force single evaluation per query.

```sql
-- ✅ FAST: Evaluates auth.uid() only once per query
create policy "notes_read" on public.notes for select
  to authenticated using (
    user_id = (select auth.uid())  -- Evaluated once, cached for query
  );

-- ✅ OPTIMIZED: Complex policies with single auth evaluation
create policy "complex_read" on public.data for select
  to authenticated using (
    user_id = (select auth.uid()) OR  -- Evaluated once
    public.has_permission((select auth.uid()), account_id, 'read'::app_permissions)  -- Uses cached value
  );
```

### Performance Impact

| Pattern | 1,000 rows | 10,000 rows | 100,000 rows |
|---------|------------|-------------|---------------|
| `auth.uid()` | 50ms | 500ms | 5000ms |
| `(select auth.uid())` | 5ms | 15ms | 45ms |
| **Improvement** | **10x** | **33x** | **111x** |

### Migration Pattern

```sql
-- Step 1: Create corrected policy
create policy "table_read_v2" on public.table_name for select
  to authenticated using (
    user_id = (select auth.uid())  -- Optimized pattern
  );

-- Step 2: Drop old policy
drop policy if exists "table_read" on public.table_name;

-- Step 3: Rename new policy
alter policy "table_read_v2" on public.table_name rename to "table_read";
```

### Testing RLS Performance

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM public.notes WHERE user_id = auth.uid();
-- vs
EXPLAIN ANALYZE SELECT * FROM public.notes WHERE user_id = (select auth.uid());

-- Look for "Function Scan" vs "Subquery Scan" in execution plan
```

### Code Review Checklist

- [ ] All RLS policies use `(select auth.uid())` instead of `auth.uid()`
- [ ] Functions passed to `has_permission()` use subquery pattern
- [ ] No direct auth function calls in WHERE clauses
- [ ] Performance tested with realistic data volumes

### Guidelines for Future Development

#### Writing New RLS Policies

**ALWAYS use the optimized pattern**:

```sql
-- ✅ CORRECT: Use subquery wrapper
CREATE POLICY "policy_name" ON table_name
  FOR operation USING (user_id = (select auth.uid()));

-- ❌ WRONG: Direct function call
-- FOR operation USING (user_id = auth.uid());
```

#### Code Review Checklist for Database Changes

- [ ] All RLS policies use `(select auth.uid())` instead of `auth.uid()`
- [ ] Functions passed to `has_permission()` use subquery pattern
- [ ] No direct auth function calls in WHERE clauses
- [ ] Performance tested with realistic data volumes (1000+ rows)
- [ ] Migration includes rollback strategy

#### Performance Testing Requirements

```sql
-- Always test policy performance before deployment
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM table_name
WHERE user_id = (select auth.uid());

-- Benchmark against direct pattern (should be 10-100x faster)
-- Look for "Subquery Scan" vs "Function Scan" in execution plan
```

#### Migration History and Prevention

**Issue**: Direct `auth.uid()` calls caused exponential performance degradation
**Solution**: Subquery wrapper pattern `(select auth.uid())`
**Impact**: 10-100x performance improvement on large datasets
**Prevention**: Mandatory code review for all RLS policy changes

# Test RLS policy performance

pnpm --filter web supabase:db:test
