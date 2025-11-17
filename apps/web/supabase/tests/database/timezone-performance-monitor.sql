-- =============================================================================
-- TIMEZONE PERFORMANCE MONITORING SCRIPT
-- =============================================================================
--
-- PURPOSE: Monitor pg_timezone_names query performance and frequency
-- ISSUE: Track the PostgreSQL core limitation with timezone directory scanning
-- CONTEXT: Supabase Studio Security Advisor causing frequent timezone queries
--
-- USAGE: Run periodically to track timezone query performance trends
-- =============================================================================

-- =============================================================================
-- SECTION 1: Current Performance Baseline
-- =============================================================================

-- Test current pg_timezone_names performance
DO $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    query_duration INTERVAL;
    timezone_count INTEGER;
BEGIN
    RAISE NOTICE 'Testing pg_timezone_names performance...';
    
    -- Measure query time
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO timezone_count FROM pg_timezone_names;
    end_time := clock_timestamp();
    
    query_duration := end_time - start_time;
    
    RAISE NOTICE 'Timezone query results:';
    RAISE NOTICE '- Total timezones: %', timezone_count;
    RAISE NOTICE '- Query duration: %', query_duration;
    RAISE NOTICE '- Duration in ms: %', EXTRACT(MILLISECONDS FROM query_duration);
    
    -- Performance assessment
    IF EXTRACT(MILLISECONDS FROM query_duration) > 100 THEN
        RAISE WARNING 'PERFORMANCE CONCERN: pg_timezone_names query took > 100ms';
    ELSIF EXTRACT(MILLISECONDS FROM query_duration) > 50 THEN
        RAISE NOTICE 'EXPECTED: pg_timezone_names query in normal range (30-50ms)';
    ELSE
        RAISE NOTICE 'GOOD: pg_timezone_names query performing well (< 50ms)';
    END IF;
END $$;

-- =============================================================================
-- SECTION 2: Query Pattern Analysis
-- =============================================================================

-- Check if pg_stat_statements is available for monitoring
DO $$
DECLARE
    extension_exists BOOLEAN;
    timezone_queries RECORD;
BEGIN
    -- Check if pg_stat_statements extension exists
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) INTO extension_exists;
    
    IF extension_exists THEN
        RAISE NOTICE 'Analyzing timezone-related queries from pg_stat_statements...';
        
        -- Look for timezone-related query patterns
        FOR timezone_queries IN
            SELECT 
                query,
                calls,
                total_exec_time,
                mean_exec_time,
                max_exec_time
            FROM pg_stat_statements 
            WHERE query ILIKE '%pg_timezone%' 
               OR query ILIKE '%timezone%'
            ORDER BY total_exec_time DESC
            LIMIT 5
        LOOP
            RAISE NOTICE 'Timezone Query Pattern:';
            RAISE NOTICE '- Query: %', LEFT(timezone_queries.query, 100) || '...';
            RAISE NOTICE '- Calls: %', timezone_queries.calls;
            RAISE NOTICE '- Total time: %ms', ROUND(timezone_queries.total_exec_time, 2);
            RAISE NOTICE '- Mean time: %ms', ROUND(timezone_queries.mean_exec_time, 2);
            RAISE NOTICE '- Max time: %ms', ROUND(timezone_queries.max_exec_time, 2);
            RAISE NOTICE '---';
        END LOOP;
    ELSE
        RAISE NOTICE 'pg_stat_statements not available - install for detailed query monitoring';
    END IF;
END $$;

-- =============================================================================
-- SECTION 3: Cache Hit Ratio Analysis
-- =============================================================================

-- Analyze overall database cache performance
DO $$
DECLARE
    cache_hit_ratio NUMERIC;
    buffer_stats RECORD;
BEGIN
    RAISE NOTICE 'Analyzing database cache performance...';
    
    -- Calculate cache hit ratio
    SELECT 
        ROUND(
            100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2
        ) as hit_ratio
    INTO cache_hit_ratio
    FROM pg_stat_database
    WHERE datname = current_database();
    
    RAISE NOTICE 'Overall cache hit ratio: %% (target: >95%%)', cache_hit_ratio;
    
    -- Buffer allocation stats
    SELECT 
        setting as shared_buffers_setting,
        pg_size_pretty(setting::bigint * 8192) as shared_buffers_size
    INTO buffer_stats
    FROM pg_settings 
    WHERE name = 'shared_buffers';
    
    RAISE NOTICE 'Shared buffers: % (% bytes)', 
                 buffer_stats.shared_buffers_setting, 
                 buffer_stats.shared_buffers_size;
END $$;

-- =============================================================================
-- SECTION 4: Timezone Usage Patterns
-- =============================================================================

-- Analyze common timezone usage in the application
DO $$
DECLARE
    common_timezones RECORD;
    timezone_usage_count INTEGER;
BEGIN
    RAISE NOTICE 'Analyzing application timezone usage patterns...';
    
    -- Check if timezone fields exist in application tables
    SELECT COUNT(*) INTO timezone_usage_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name ILIKE '%timezone%' OR column_name ILIKE '%tz%');
    
    IF timezone_usage_count > 0 THEN
        RAISE NOTICE 'Found % timezone-related columns in application tables', timezone_usage_count;
        
        -- Show timezone columns
        FOR common_timezones IN
            SELECT table_name, column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND (column_name ILIKE '%timezone%' OR column_name ILIKE '%tz%')
            ORDER BY table_name, column_name
        LOOP
            RAISE NOTICE 'Timezone field: %.% (%)', 
                         common_timezones.table_name, 
                         common_timezones.column_name,
                         common_timezones.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'No explicit timezone columns found in application tables';
    END IF;
END $$;

-- =============================================================================
-- SECTION 5: Optimization Recommendations
-- =============================================================================

-- Provide specific recommendations based on analysis
DO $$
DECLARE
    database_size TEXT;
    connection_count INTEGER;
BEGIN
    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO database_size;
    
    -- Get connection count
    SELECT count(*) INTO connection_count FROM pg_stat_activity;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'TIMEZONE PERFORMANCE OPTIMIZATION RECOMMENDATIONS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Current Environment:';
    RAISE NOTICE '- Database size: %', database_size;
    RAISE NOTICE '- Active connections: %', connection_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Recommended Optimizations:';
    RAISE NOTICE '';
    RAISE NOTICE '1. APPLICATION-LEVEL CACHING:';
    RAISE NOTICE '   - Cache timezone list in application memory';
    RAISE NOTICE '   - Refresh cache daily (timezones rarely change)';
    RAISE NOTICE '   - Reduce pg_timezone_names queries by 90%%+';
    RAISE NOTICE '';
    RAISE NOTICE '2. MATERIALIZED VIEW CACHING:';
    RAISE NOTICE '   - CREATE MATERIALIZED VIEW timezone_cache AS SELECT * FROM pg_timezone_names;';
    RAISE NOTICE '   - Refresh weekly or on timezone data updates';
    RAISE NOTICE '';
    RAISE NOTICE '3. QUERY FREQUENCY REDUCTION:';
    RAISE NOTICE '   - Audit Supabase Studio Security Advisor frequency';
    RAISE NOTICE '   - Consider manual security analysis vs automatic';
    RAISE NOTICE '';
    RAISE NOTICE '4. MONITORING SETUP:';
    RAISE NOTICE '   - Track pg_timezone_names query frequency';
    RAISE NOTICE '   - Alert on > 50ms average response times';
    RAISE NOTICE '   - Monitor total DB time percentage impact';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
END $$;