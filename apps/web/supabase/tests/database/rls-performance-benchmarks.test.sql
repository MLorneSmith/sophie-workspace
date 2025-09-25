-- =============================================================================
-- RLS PERFORMANCE BENCHMARK QUERIES
-- =============================================================================
--
-- PURPOSE: Test queries that demonstrate the RLS performance issue
-- ISSUE: GitHub #345 - auth.uid() and has_role_on_account() re-evaluate per row
--
-- PERFORMANCE IMPACT:
-- - BEFORE migration: auth.uid() evaluated 1000+ times per query
-- - AFTER migration: auth.uid() evaluated once and cached
-- - Expected improvement: 60-80% faster query execution
--
-- USAGE:
-- 1. Run rls-performance.test.sql first to setup test data
-- 2. Execute these benchmark queries before migration
-- 3. Apply RLS performance migration
-- 4. Execute same queries and compare performance
-- =============================================================================

-- =============================================================================
-- CRITICAL PERFORMANCE TEST QUERIES
-- =============================================================================

-- Query 1: Survey Responses - Direct auth.uid() comparison (WORST CASE)
-- This pattern causes auth.uid() to be called for every row scanned
-- Expected rows affected: 1500+ (all survey responses)
SELECT 'BENCHMARK 1: Survey Responses - auth.uid() per row' AS test_name;

\timing on

-- This query demonstrates the performance issue
-- auth.uid() is evaluated for EVERY row in the table
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) as total_responses,
       AVG(CASE WHEN completed THEN 1 ELSE 0 END) as completion_rate
FROM public.survey_responses
WHERE user_id = auth.uid();

\timing off

-- Query 2: AI Request Logs - Complex filtering with auth context
-- This demonstrates performance degradation with large datasets
SELECT 'BENCHMARK 2: AI Request Logs - Complex filtering' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT provider,
       model,
       COUNT(*) as request_count,
       SUM(total_tokens) as total_tokens,
       SUM(cost) as total_cost,
       AVG(cost) as avg_cost
FROM public.ai_request_logs
WHERE (user_id = auth.uid() OR team_id IN (
    SELECT account_id
    FROM public.accounts_memberships
    WHERE user_id = auth.uid()
))
AND request_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY provider, model
ORDER BY total_cost DESC;

\timing off

-- Query 3: Building Blocks Submissions - Pagination query
-- Common pattern that shows performance degradation with auth.uid()
SELECT 'BENCHMARK 3: Building Blocks - Pagination with filtering' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, title, audience, presentation_type, created_at
FROM public.building_blocks_submissions
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '60 days'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

\timing off

-- Query 4: Cross-table join with RLS - Most complex case
-- Demonstrates compound performance issue with multiple auth.uid() calls
SELECT 'BENCHMARK 4: Cross-table join with RLS authentication' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT sr.survey_id,
       sr.completed,
       sr.created_at as survey_date,
       al.provider,
       al.model,
       al.cost,
       al.request_timestamp
FROM public.survey_responses sr
LEFT JOIN public.ai_request_logs al ON al.user_id = sr.user_id
    AND al.request_timestamp >= sr.created_at
    AND al.request_timestamp <= sr.created_at + INTERVAL '1 day'
WHERE sr.user_id = auth.uid()
AND sr.completed = true
AND al.status = 'completed'
ORDER BY sr.created_at DESC
LIMIT 50;

\timing off

-- Query 5: Team-based access with has_role_on_account()
-- Tests the performance of team-scoped RLS policies
SELECT 'BENCHMARK 5: Team access with has_role_on_account()' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT team_id,
       feature,
       COUNT(*) as usage_count,
       SUM(total_tokens) as total_tokens,
       SUM(cost) as total_cost
FROM public.ai_request_logs
WHERE team_id IS NOT NULL
AND team_id IN (
    SELECT account_id
    FROM public.accounts_memberships
    WHERE user_id = auth.uid()
)
GROUP BY team_id, feature
ORDER BY total_cost DESC;

\timing off

-- =============================================================================
-- AGGREGATION PERFORMANCE TESTS
-- =============================================================================

-- Query 6: Large aggregation with auth context
-- Tests performance of auth.uid() in aggregation scenarios
SELECT 'BENCHMARK 6: Large aggregation with user filtering' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as submissions_count,
    COUNT(DISTINCT audience) as unique_audiences,
    COUNT(DISTINCT presentation_type) as unique_types
FROM public.building_blocks_submissions
WHERE user_id = auth.uid()
AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

\timing off

-- Query 7: Multi-user analytics query (admin perspective)
-- This would be used by admin interfaces and shows auth.uid() impact on large scans
SELECT 'BENCHMARK 7: Multi-user analytics (admin view)' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    u.email,
    COUNT(DISTINCT sr.id) as survey_count,
    COUNT(DISTINCT al.id) as ai_request_count,
    COUNT(DISTINCT bbs.id) as submission_count,
    SUM(al.cost) as total_ai_cost
FROM auth.users u
LEFT JOIN public.survey_responses sr ON sr.user_id = u.id
LEFT JOIN public.ai_request_logs al ON al.user_id = u.id
LEFT JOIN public.building_blocks_submissions bbs ON bbs.user_id = u.id
WHERE u.id IN (
    SELECT DISTINCT user_id
    FROM public.accounts_memberships
    WHERE account_id IN (
        SELECT account_id
        FROM public.accounts_memberships
        WHERE user_id = auth.uid()
        AND account_role IN ('owner', 'admin')
    )
)
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT sr.id) > 0 OR COUNT(DISTINCT al.id) > 0 OR COUNT(DISTINCT bbs.id) > 0
ORDER BY total_ai_cost DESC NULLS LAST
LIMIT 100;

\timing off

-- =============================================================================
-- CONCURRENT USER SIMULATION
-- =============================================================================

-- Query 8: Simulate concurrent user queries
-- Run this multiple times to simulate realistic load
SELECT 'BENCHMARK 8: Concurrent user load simulation' AS test_name;

\timing on

-- Simulate a typical user dashboard query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    'survey_responses' as data_type,
    COUNT(*) as count,
    MAX(created_at) as latest_activity
FROM public.survey_responses
WHERE user_id = auth.uid()

UNION ALL

SELECT
    'ai_requests' as data_type,
    COUNT(*) as count,
    MAX(request_timestamp) as latest_activity
FROM public.ai_request_logs
WHERE user_id = auth.uid()

UNION ALL

SELECT
    'submissions' as data_type,
    COUNT(*) as count,
    MAX(created_at) as latest_activity
FROM public.building_blocks_submissions
WHERE user_id = auth.uid();

\timing off

-- =============================================================================
-- WORST-CASE SCENARIO TESTS
-- =============================================================================

-- Query 9: Full table scan with RLS
-- This represents the worst-case scenario for RLS performance
SELECT 'BENCHMARK 9: Full table scan with RLS (worst case)' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(DISTINCT user_id) as unique_users,
       COUNT(*) as total_records,
       MIN(created_at) as earliest_record,
       MAX(created_at) as latest_record
FROM public.ai_request_logs
WHERE cost > 0.001; -- Forces table scan, RLS still applies

\timing off

-- Query 10: Complex WHERE clause with multiple auth.uid() evaluations
-- Tests performance when auth.uid() appears in multiple conditions
SELECT 'BENCHMARK 10: Complex conditions with repeated auth.uid()' AS test_name;

\timing on

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT *
FROM public.survey_responses
WHERE user_id = auth.uid()
AND (
    (completed = true AND user_id = auth.uid())
    OR
    (completed = false AND user_id = auth.uid() AND created_at > NOW() - INTERVAL '7 days')
)
ORDER BY created_at DESC
LIMIT 100;

\timing off

-- =============================================================================
-- PERFORMANCE ANALYSIS SUMMARY
-- =============================================================================

SELECT '========================================' as separator;
SELECT 'PERFORMANCE ANALYSIS COMPLETE' as status;
SELECT '========================================' as separator;

-- Get current performance metrics for comparison
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('survey_responses', 'ai_request_logs', 'building_blocks_submissions', 'accounts_memberships')
ORDER BY tablename;

-- Show index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('survey_responses', 'ai_request_logs', 'building_blocks_submissions', 'accounts_memberships')
ORDER BY tablename, indexname;

SELECT 'Save these results and compare after applying RLS migration!' as instruction;