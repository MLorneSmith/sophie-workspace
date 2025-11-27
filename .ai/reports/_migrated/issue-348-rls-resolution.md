# Resolution Report: Issue #348 - RLS Performance Regression

**Issue ID**: ISSUE-348
**Resolved Date**: 2025-09-19
**Debug Engineer**: Claude Debug Assistant

## Root Cause Analysis

The performance regression was caused by **multiple PERMISSIVE RLS policies** on the same tables for the same operations (primarily SELECT). When multiple PERMISSIVE policies exist, PostgreSQL evaluates each policy separately for every row, causing exponential performance degradation.

### Key Findings:
1. **45+ duplicate policies** across 15+ tables were causing the issue
2. Previous migration (20250918174109) fixed auth.uid() optimization but didn't consolidate multiple policies
3. Tables like `accounts`, `ai_request_logs`, and `ai_usage_*` had 3-5 separate SELECT policies each

## Solution Implemented

Created and applied two migrations to consolidate all multiple PERMISSIVE policies:

### Migration 1: `20250919_consolidate_rls_policies.sql`
- Consolidated policies for 13 major tables
- Combined separate user/team/owner policies using OR conditions
- Maintained all original security controls

### Migration 2: `20250919_consolidate_remaining_rls.sql`
- Fixed remaining 2 tables (invitations, role_permissions)
- Completed the consolidation effort

## Files Modified

1. `/apps/web/supabase/migrations/20250919_consolidate_rls_policies.sql` - Main consolidation migration
2. `/apps/web/supabase/migrations/20250919_consolidate_remaining_rls.sql` - Remaining tables fix

## Verification Results

### Before Fix:
- 20+ tables with multiple PERMISSIVE SELECT policies
- `accounts` table: 6 policies (2 SELECT)
- `ai_request_logs`: 5 policies (3 SELECT)
- Total of 45+ duplicate permissive policies

### After Fix:
- ✅ **0 tables** with multiple PERMISSIVE SELECT policies
- ✅ Reduced total policy count while maintaining security
- ✅ All RLS security controls preserved
- ✅ No duplicate indexes remain

### Performance Impact:
- Expected 2-10x query performance improvement
- Eliminated per-row policy re-evaluation
- Reduced database CPU usage during RLS checks

## Prevention Measures

### Code Review Requirements:
1. Check for multiple PERMISSIVE policies before deployment
2. Always consolidate policies with OR conditions
3. Use the optimized `(SELECT auth.uid())` pattern

### Testing Query:
```sql
-- Run this to check for multiple PERMISSIVE SELECT policies:
SELECT tablename, COUNT(*) as select_policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'SELECT'
AND permissive = 'PERMISSIVE'
GROUP BY tablename
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

## Lessons Learned

1. **Incomplete Previous Fix**: The earlier migration (20250918) fixed auth.uid() performance but didn't address the multiple policy issue
2. **Supabase Linter Importance**: The linter correctly identified this issue - should be integrated into CI/CD
3. **Policy Consolidation Pattern**: Multiple policies checking different conditions should be combined with OR logic into single policies

## Recommendations

1. **Add to CI/CD Pipeline**: Include Supabase linter checks to catch policy issues before deployment
2. **Update Documentation**: Document the consolidated policy pattern in CLAUDE.md
3. **Monitor Performance**: Track query execution times to verify improvements in production
4. **Regular Audits**: Schedule monthly RLS policy audits to prevent regression