-- =============================================================================
-- RLS SECURITY VALIDATION SCRIPT
-- =============================================================================
--
-- PURPOSE: Validate that RLS policies still work correctly after performance fixes
-- ISSUE: GitHub #345 - Ensure performance migration doesn't break security
--
-- TESTING APPROACH:
-- 1. Test user isolation - users can only access their own data
-- 2. Test team access - users can access team data they're members of
-- 3. Test admin access - admins can access appropriate data
-- 4. Test edge cases - NULL values, deleted users, etc.
-- 5. Test unauthorized access attempts
-- =============================================================================

-- =============================================================================
-- SECURITY TEST SETUP
-- =============================================================================

-- Create test users for security validation
DO $$
DECLARE
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    bob_user_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    charlie_user_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    admin_user_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;

    alice_personal_account UUID := '11111111-aaaa-1111-1111-111111111111'::UUID;
    bob_personal_account UUID := '22222222-aaaa-2222-2222-222222222222'::UUID;
    shared_team_account UUID := '11111111-bbbb-1111-1111-111111111111'::UUID;

    test_record_id UUID;
BEGIN
    -- Ensure we have the test data from rls-performance.test.sql
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = alice_user_id) THEN
        RAISE EXCEPTION 'Test data not found. Please run rls-performance.test.sql first.';
    END IF;

    -- Clean up any existing test validation data
    DELETE FROM public.survey_responses WHERE survey_id LIKE 'security_test_%';
    DELETE FROM public.ai_request_logs WHERE request_id LIKE 'security_test_%';
    DELETE FROM public.building_blocks_submissions WHERE title LIKE 'Security Test%';

    RAISE NOTICE 'Security validation test setup complete';
END $$;

-- =============================================================================
-- TEST 1: USER DATA ISOLATION
-- =============================================================================

-- Test survey_responses isolation
SELECT 'TEST 1A: Survey Responses - User Isolation' as test_name;

-- Set session to Alice's context
SET LOCAL row_security = on;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Alice should only see her own survey responses
DO $$
DECLARE
    alice_count INTEGER;
    total_count INTEGER;
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
BEGIN
    -- Count Alice's responses through RLS
    SELECT COUNT(*) INTO alice_count FROM public.survey_responses;

    -- Count Alice's responses directly (should match)
    SELECT COUNT(*) INTO total_count FROM public.survey_responses WHERE user_id = alice_user_id;

    IF alice_count != total_count THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Alice seeing non-owned survey responses. RLS: %, Direct: %', alice_count, total_count;
    END IF;

    -- Verify Alice cannot see other users' data
    IF alice_count = (SELECT COUNT(*) FROM public.survey_responses WHERE user_id != alice_user_id) THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Alice appears to see other users survey responses';
    END IF;

    RAISE NOTICE 'PASS: Alice can only see her own survey responses (% records)', alice_count;
END $$;

-- Test ai_request_logs isolation
SELECT 'TEST 1B: AI Request Logs - User Isolation' as test_name;

DO $$
DECLARE
    alice_count INTEGER;
    expected_count INTEGER;
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
BEGIN
    -- Count Alice's AI requests through RLS
    SELECT COUNT(*) INTO alice_count FROM public.ai_request_logs;

    -- Count Alice's requests directly (including team requests she has access to)
    SELECT COUNT(*) INTO expected_count
    FROM public.ai_request_logs
    WHERE user_id = alice_user_id
       OR team_id IN (
           SELECT account_id
           FROM public.accounts_memberships
           WHERE user_id = alice_user_id
       );

    IF alice_count != expected_count THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: AI request logs access mismatch. RLS: %, Expected: %', alice_count, expected_count;
    END IF;

    RAISE NOTICE 'PASS: Alice can see her personal and team AI requests (% records)', alice_count;
END $$;

-- Test building_blocks_submissions isolation
SELECT 'TEST 1C: Building Blocks - User Isolation' as test_name;

DO $$
DECLARE
    alice_count INTEGER;
    expected_count INTEGER;
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
BEGIN
    -- Count Alice's submissions through RLS
    SELECT COUNT(*) INTO alice_count FROM public.building_blocks_submissions;

    -- Count Alice's submissions directly
    SELECT COUNT(*) INTO expected_count FROM public.building_blocks_submissions WHERE user_id = alice_user_id;

    IF alice_count != expected_count THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Building blocks access mismatch. RLS: %, Expected: %', alice_count, expected_count;
    END IF;

    RAISE NOTICE 'PASS: Alice can only see her own building blocks (% records)', alice_count;
END $$;

-- =============================================================================
-- TEST 2: CROSS-USER SECURITY
-- =============================================================================

-- Switch to Bob's context and verify he cannot see Alice's data
SELECT 'TEST 2: Cross-User Security Validation' as test_name;

SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222"}';

DO $$
DECLARE
    bob_survey_count INTEGER;
    bob_ai_count INTEGER;
    bob_blocks_count INTEGER;
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    bob_user_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    alice_only_surveys INTEGER;
    alice_only_ai INTEGER;
    alice_only_blocks INTEGER;
BEGIN
    -- Count what Bob can see
    SELECT COUNT(*) INTO bob_survey_count FROM public.survey_responses;
    SELECT COUNT(*) INTO bob_ai_count FROM public.ai_request_logs;
    SELECT COUNT(*) INTO bob_blocks_count FROM public.building_blocks_submissions;

    -- Count Alice-only data (Bob should not see this)
    SELECT COUNT(*) INTO alice_only_surveys FROM public.survey_responses WHERE user_id = alice_user_id;
    SELECT COUNT(*) INTO alice_only_ai FROM public.ai_request_logs WHERE user_id = alice_user_id AND (team_id IS NULL OR team_id NOT IN (
        SELECT account_id FROM public.accounts_memberships WHERE user_id = bob_user_id
    ));
    SELECT COUNT(*) INTO alice_only_blocks FROM public.building_blocks_submissions WHERE user_id = alice_user_id;

    -- Verify Bob cannot see Alice's personal data
    IF EXISTS (SELECT 1 FROM public.survey_responses WHERE user_id = alice_user_id) THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Bob can see Alice survey responses';
    END IF;

    IF EXISTS (SELECT 1 FROM public.building_blocks_submissions WHERE user_id = alice_user_id) THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Bob can see Alice building blocks';
    END IF;

    RAISE NOTICE 'PASS: Bob cannot see Alice personal data. Bob sees: Surveys %, AI %, Blocks %',
                 bob_survey_count, bob_ai_count, bob_blocks_count;
END $$;

-- =============================================================================
-- TEST 3: TEAM ACCESS VALIDATION
-- =============================================================================

-- Test that users can access team data they're members of
SELECT 'TEST 3: Team Access Validation' as test_name;

-- Create a team-specific AI request for testing
DO $$
DECLARE
    shared_team_account UUID := '11111111-bbbb-1111-1111-111111111111'::UUID;
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    bob_user_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_request_id TEXT := 'security_test_team_request';
BEGIN
    -- Create a team AI request
    INSERT INTO public.ai_request_logs (
        user_id, team_id, request_id, provider, model,
        prompt_tokens, completion_tokens, total_tokens, cost, feature
    ) VALUES (
        alice_user_id, shared_team_account, test_request_id, 'openai', 'gpt-4',
        100, 50, 150, 0.01, 'security_test'
    );

    RAISE NOTICE 'Created team AI request for security testing';
END $$;

-- Test Alice can see the team request (she's the owner)
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

DO $$
DECLARE
    team_request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO team_request_count
    FROM public.ai_request_logs
    WHERE request_id = 'security_test_team_request';

    IF team_request_count != 1 THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Alice cannot see team AI request she created';
    END IF;

    RAISE NOTICE 'PASS: Alice can see team AI request';
END $$;

-- Test Bob can see the team request (he's a member)
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222"}';

DO $$
DECLARE
    team_request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO team_request_count
    FROM public.ai_request_logs
    WHERE request_id = 'security_test_team_request';

    IF team_request_count != 1 THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Bob cannot see team AI request (should have access as team member)';
    END IF;

    RAISE NOTICE 'PASS: Bob can see team AI request as team member';
END $$;

-- Test Charlie cannot see the team request (he's not a member of this team)
SET LOCAL "request.jwt.claims" = '{"sub": "33333333-3333-3333-3333-333333333333"}';

DO $$
DECLARE
    team_request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO team_request_count
    FROM public.ai_request_logs
    WHERE request_id = 'security_test_team_request';

    IF team_request_count != 0 THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Charlie can see team AI request (should not have access)';
    END IF;

    RAISE NOTICE 'PASS: Charlie cannot see team AI request (correct isolation)';
END $$;

-- =============================================================================
-- TEST 4: ADMIN ACCESS VALIDATION
-- =============================================================================

SELECT 'TEST 4: Admin Access Validation' as test_name;

-- Test admin can access survey responses through admin policy
SET LOCAL "request.jwt.claims" = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

-- First, verify the admin user has super admin status
DO $$
DECLARE
    is_admin BOOLEAN;
    admin_survey_count INTEGER;
    total_survey_count INTEGER;
BEGIN
    -- Check if admin function works
    SELECT public.is_super_admin() INTO is_admin;

    IF NOT is_admin THEN
        RAISE NOTICE 'SKIP: Admin user not configured as super admin. Survey admin tests skipped.';
        RETURN;
    END IF;

    -- Count surveys admin can see
    SELECT COUNT(*) INTO admin_survey_count FROM public.survey_responses;

    -- Count total surveys (should match for admin)
    SELECT COUNT(*) INTO total_survey_count FROM public.survey_responses WHERE user_id IN (
        '11111111-1111-1111-1111-111111111111'::UUID,
        '22222222-2222-2222-2222-222222222222'::UUID,
        '33333333-3333-3333-3333-333333333333'::UUID
    );

    IF admin_survey_count < total_survey_count THEN
        RAISE EXCEPTION 'ADMIN ACCESS ISSUE: Admin cannot see all survey responses. Sees: %, Expected: %',
                        admin_survey_count, total_survey_count;
    END IF;

    RAISE NOTICE 'PASS: Admin can see all survey responses (% records)', admin_survey_count;
END $$;

-- =============================================================================
-- TEST 5: EDGE CASES AND NULL VALUES
-- =============================================================================

SELECT 'TEST 5: Edge Cases and NULL Value Handling' as test_name;

-- Test behavior with NULL values
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

DO $$
DECLARE
    null_user_records INTEGER;
BEGIN
    -- Check for records with NULL user_id (should not be visible to regular users)
    SELECT COUNT(*) INTO null_user_records
    FROM public.ai_request_logs
    WHERE user_id IS NULL AND team_id IS NULL;

    IF null_user_records > 0 THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: User can see records with NULL user_id and team_id';
    END IF;

    RAISE NOTICE 'PASS: No NULL user_id records visible to regular users';
END $$;

-- =============================================================================
-- TEST 6: INSERT/UPDATE/DELETE SECURITY
-- =============================================================================

SELECT 'TEST 6: Write Operation Security' as test_name;

-- Test that users can only insert/update/delete their own data
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

DO $$
DECLARE
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    bob_user_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_survey_id UUID;
    test_submission_id UUID;
BEGIN
    -- Test valid insert (Alice inserting her own data)
    INSERT INTO public.survey_responses (user_id, survey_id, completed)
    VALUES (alice_user_id, 'security_test_alice_survey', true)
    RETURNING id INTO test_survey_id;

    RAISE NOTICE 'PASS: Alice can insert her own survey response';

    -- Test invalid insert (Alice trying to insert data for Bob) - should fail
    BEGIN
        INSERT INTO public.survey_responses (user_id, survey_id, completed)
        VALUES (bob_user_id, 'security_test_alice_inserting_for_bob', true);

        RAISE EXCEPTION 'SECURITY VIOLATION: Alice was able to insert survey response for Bob';
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            RAISE NOTICE 'PASS: Alice cannot insert survey response for Bob (expected failure)';
    END;

    -- Test valid building blocks insert
    INSERT INTO public.building_blocks_submissions (user_id, title, situation)
    VALUES (alice_user_id, 'Security Test Submission', 'Test situation')
    RETURNING id INTO test_submission_id;

    RAISE NOTICE 'PASS: Alice can insert her own building blocks submission';

    -- Test invalid building blocks insert - should fail
    BEGIN
        INSERT INTO public.building_blocks_submissions (user_id, title, situation)
        VALUES (bob_user_id, 'Security Test Bob Submission', 'Test situation');

        RAISE EXCEPTION 'SECURITY VIOLATION: Alice was able to insert building blocks for Bob';
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            RAISE NOTICE 'PASS: Alice cannot insert building blocks for Bob (expected failure)';
    END;

    -- Clean up test data
    DELETE FROM public.survey_responses WHERE id = test_survey_id;
    DELETE FROM public.building_blocks_submissions WHERE id = test_submission_id;

    RAISE NOTICE 'PASS: Write operation security validated';
END $$;

-- =============================================================================
-- TEST 7: PERFORMANCE VS SECURITY VERIFICATION
-- =============================================================================

SELECT 'TEST 7: Performance vs Security Balance' as test_name;

-- Verify that performance optimizations don't break security
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';

DO $$
DECLARE
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    rls_count INTEGER;
    direct_count INTEGER;
    performance_start TIMESTAMP;
    performance_end TIMESTAMP;
    query_duration INTERVAL;
BEGIN
    -- Record start time
    SELECT clock_timestamp() INTO performance_start;

    -- Count through RLS
    SELECT COUNT(*) INTO rls_count FROM public.survey_responses;

    -- Record end time
    SELECT clock_timestamp() INTO performance_end;
    query_duration := performance_end - performance_start;

    -- Count directly (should match RLS count)
    SELECT COUNT(*) INTO direct_count FROM public.survey_responses WHERE user_id = alice_user_id;

    IF rls_count != direct_count THEN
        RAISE EXCEPTION 'SECURITY/PERFORMANCE ISSUE: RLS count % != direct count %', rls_count, direct_count;
    END IF;

    -- Performance should be reasonable (< 100ms for this dataset)
    IF query_duration > INTERVAL '100 milliseconds' THEN
        RAISE WARNING 'PERFORMANCE CONCERN: Query took % (> 100ms)', query_duration;
    END IF;

    RAISE NOTICE 'PASS: Performance optimization maintains security. Query took: %', query_duration;
END $$;

-- =============================================================================
-- SECURITY VALIDATION SUMMARY
-- =============================================================================

SELECT '========================================' as separator;
SELECT 'RLS SECURITY VALIDATION COMPLETE' as status;
SELECT '========================================' as separator;

-- Final security check summary
DO $$
DECLARE
    alice_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    bob_user_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    charlie_user_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;

    alice_surveys INTEGER;
    alice_ai INTEGER;
    alice_blocks INTEGER;

    bob_surveys INTEGER;
    bob_ai INTEGER;
    bob_blocks INTEGER;
BEGIN
    -- Test Alice's access
    SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111"}';
    SELECT COUNT(*) INTO alice_surveys FROM public.survey_responses;
    SELECT COUNT(*) INTO alice_ai FROM public.ai_request_logs;
    SELECT COUNT(*) INTO alice_blocks FROM public.building_blocks_submissions;

    -- Test Bob's access
    SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222"}';
    SELECT COUNT(*) INTO bob_surveys FROM public.survey_responses;
    SELECT COUNT(*) INTO bob_ai FROM public.ai_request_logs;
    SELECT COUNT(*) INTO bob_blocks FROM public.building_blocks_submissions;

    RAISE NOTICE 'SECURITY SUMMARY:';
    RAISE NOTICE 'Alice access - Surveys: %, AI: %, Blocks: %', alice_surveys, alice_ai, alice_blocks;
    RAISE NOTICE 'Bob access - Surveys: %, AI: %, Blocks: %', bob_surveys, bob_ai, bob_blocks;
    RAISE NOTICE '';
    RAISE NOTICE 'All security validations PASSED!';
    RAISE NOTICE 'RLS policies maintain data isolation while providing performance improvements.';
END $$;

-- Clean up security test data
DELETE FROM public.ai_request_logs WHERE request_id LIKE 'security_test_%';
DELETE FROM public.survey_responses WHERE survey_id LIKE 'security_test_%';
DELETE FROM public.building_blocks_submissions WHERE title LIKE 'Security Test%';