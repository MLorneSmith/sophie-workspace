```text
#### Sequential (Slow) Pattern ❌
#### Parallel (Optimized) Pattern ✅
### Database Performance Guidelines 🚀

**CRITICAL**: Always use performant RLS patterns to avoid query performance degradation.

```sql
-- ❌ AVOID: Direct auth function calls (causes re-evaluation per row)
user_id = auth.uid()

-- ✅ USE: Subquery wrapper (evaluates once per query)
user_id = (select auth.uid())
```

**Performance Impact**: The subquery pattern can improve query performance by 10-100x on large datasets.

**Reference**: See `/apps/web/supabase/CLAUDE.md` for complete RLS performance guidelines.
