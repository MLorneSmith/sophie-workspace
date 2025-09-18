-- =============================================================================
-- RLS PERFORMANCE TESTING FRAMEWORK
-- =============================================================================
--
-- PURPOSE: Validate RLS performance improvements after migration
-- ISSUE: GitHub #345 - Critical RLS performance issues where auth functions
--        re-evaluate per row causing 60-80% performance degradation
--
-- METHODOLOGY:
-- 1. Setup large test datasets (1000+ rows per table)
-- 2. Test queries that trigger the performance issue
-- 3. Measure performance before/after migration
-- 4. Validate security is maintained
-- =============================================================================

-- Ensure we're in a test transaction
BEGIN;

-- =============================================================================
-- TEST DATA SETUP
-- =============================================================================

-- Create test users
DO $$
DECLARE
    test_user_1 UUID;
    test_user_2 UUID;
    test_user_3 UUID;
    test_admin UUID;
    test_account_1 UUID;
    test_account_2 UUID;
    i INTEGER;
BEGIN
    -- Create test users in auth.users table
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'test.user1@example.com', NOW(), NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'test.user2@example.com', NOW(), NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'test.user3@example.com', NOW(), NOW(), NOW()),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test.admin@example.com', NOW(), NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    -- Set user variables
    test_user_1 := '11111111-1111-1111-1111-111111111111'::UUID;
    test_user_2 := '22222222-2222-2222-2222-222222222222'::UUID;
    test_user_3 := '33333333-3333-3333-3333-333333333333'::UUID;
    test_admin := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;

    -- Create test accounts (personal accounts for users)
    INSERT INTO public.accounts (id, primary_owner_user_id, name, slug, email, is_personal_account)
    VALUES
        ('11111111-aaaa-1111-1111-111111111111', test_user_1, 'Test User 1 Personal', 'test-user-1', 'test.user1@example.com', true),
        ('22222222-aaaa-2222-2222-222222222222', test_user_2, 'Test User 2 Personal', 'test-user-2', 'test.user2@example.com', true),
        ('33333333-aaaa-3333-3333-333333333333', test_user_3, 'Test User 3 Personal', 'test-user-3', 'test.user3@example.com', true),
        ('aaaaaaaa-bbbb-aaaa-aaaa-aaaaaaaaaaaa', test_admin, 'Test Admin Personal', 'test-admin', 'test.admin@example.com', true),
        -- Team accounts
        ('11111111-bbbb-1111-1111-111111111111', test_user_1, 'Test Team 1', 'test-team-1', 'team1@example.com', false),
        ('22222222-bbbb-2222-2222-222222222222', test_user_2, 'Test Team 2', 'test-team-2', 'team2@example.com', false)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        email = EXCLUDED.email;

    test_account_1 := '11111111-aaaa-1111-1111-111111111111'::UUID;
    test_account_2 := '22222222-aaaa-2222-2222-222222222222'::UUID;

    -- Create account memberships
    INSERT INTO public.accounts_memberships (user_id, account_id, account_role)
    VALUES
        (test_user_1, test_account_1, 'owner'),
        (test_user_2, test_account_2, 'owner'),
        (test_user_3, '33333333-aaaa-3333-3333-333333333333', 'owner'),
        (test_admin, 'aaaaaaaa-bbbb-aaaa-aaaa-aaaaaaaaaaaa', 'owner'),
        -- Team memberships
        (test_user_1, '11111111-bbbb-1111-1111-111111111111', 'owner'),
        (test_user_2, '22222222-bbbb-2222-2222-222222222222', 'owner'),
        (test_user_2, '11111111-bbbb-1111-1111-111111111111', 'member'),
        (test_user_3, '11111111-bbbb-1111-1111-111111111111', 'member')
    ON CONFLICT (user_id, account_id) DO UPDATE SET
        account_role = EXCLUDED.account_role;

    RAISE NOTICE 'Created test users and accounts';
END $$;

-- =============================================================================
-- LARGE DATASET CREATION (1000+ ROWS)
-- =============================================================================

-- Create large survey_responses dataset (1500 rows)
DO $$
DECLARE
    test_user_1 UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    test_user_2 UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_user_3 UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    survey_types TEXT[] := ARRAY['personality', 'skills', 'preferences', 'goals', 'feedback'];
    i INTEGER;
    current_user UUID;
BEGIN
    -- Delete existing test data
    DELETE FROM public.survey_responses WHERE user_id IN (test_user_1, test_user_2, test_user_3);

    FOR i IN 1..1500 LOOP
        -- Rotate between test users
        current_user := CASE
            WHEN i % 3 = 1 THEN test_user_1
            WHEN i % 3 = 2 THEN test_user_2
            ELSE test_user_3
        END;

        INSERT INTO public.survey_responses (
            id, user_id, survey_id, responses, category_scores,
            highest_scoring_category, lowest_scoring_category,
            completed, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            current_user,
            survey_types[((i-1) % 5) + 1] || '_survey_' || (i % 100),
            '{"q1": "answer1", "q2": "answer2", "q3": "answer3"}'::jsonb,
            '{"category1": 85, "category2": 72, "category3": 91}'::jsonb,
            'category3',
            'category2',
            (i % 4 != 0), -- 75% completed
            NOW() - (random() * interval '90 days'),
            NOW() - (random() * interval '30 days')
        );
    END LOOP;

    RAISE NOTICE 'Created 1500 survey_responses records';
END $$;

-- Create large ai_request_logs dataset (2000 rows)
DO $$
DECLARE
    test_user_1 UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    test_user_2 UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_user_3 UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    team_account_1 UUID := '11111111-bbbb-1111-1111-111111111111'::UUID;
    team_account_2 UUID := '22222222-bbbb-2222-2222-222222222222'::UUID;
    providers TEXT[] := ARRAY['openai', 'anthropic', 'google'];
    models TEXT[] := ARRAY['gpt-4', 'claude-3', 'gemini-pro'];
    features TEXT[] := ARRAY['canvas', 'outline', 'chat', 'builder', 'analyzer'];
    i INTEGER;
    current_user UUID;
    current_team UUID;
BEGIN
    -- Delete existing test data
    DELETE FROM public.ai_request_logs WHERE user_id IN (test_user_1, test_user_2, test_user_3);

    FOR i IN 1..2000 LOOP
        -- Rotate between test users
        current_user := CASE
            WHEN i % 3 = 1 THEN test_user_1
            WHEN i % 3 = 2 THEN test_user_2
            ELSE test_user_3
        END;

        -- Assign team context for some requests
        current_team := CASE
            WHEN i % 4 = 0 THEN team_account_1
            WHEN i % 4 = 1 THEN team_account_2
            ELSE NULL
        END;

        INSERT INTO public.ai_request_logs (
            id, user_id, team_id, request_id, request_timestamp,
            provider, model, prompt_tokens, completion_tokens, total_tokens,
            cost, feature, session_id, status, error, portkey_verified, created_at
        ) VALUES (
            uuid_generate_v4(),
            current_user,
            current_team,
            'req_' || i || '_' || extract(epoch from now()),
            NOW() - (random() * interval '60 days'),
            providers[((i-1) % 3) + 1],
            models[((i-1) % 3) + 1],
            (500 + random() * 2000)::INTEGER,
            (100 + random() * 800)::INTEGER,
            (600 + random() * 2800)::INTEGER,
            (0.001 + random() * 0.05)::DECIMAL(10,6),
            features[((i-1) % 5) + 1],
            'session_' || (i % 50),
            CASE WHEN random() > 0.95 THEN 'error' ELSE 'completed' END,
            CASE WHEN random() > 0.95 THEN 'Timeout error' ELSE NULL END,
            (random() > 0.1), -- 90% verified
            NOW() - (random() * interval '60 days')
        );
    END LOOP;

    RAISE NOTICE 'Created 2000 ai_request_logs records';
END $$;

-- Create large building_blocks_submissions dataset (1200 rows)
DO $$
DECLARE
    test_user_1 UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    test_user_2 UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_user_3 UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    audiences TEXT[] := ARRAY['executives', 'developers', 'sales-team', 'investors', 'students'];
    presentation_types TEXT[] := ARRAY['pitch', 'demo', 'training', 'report', 'proposal'];
    question_types TEXT[] := ARRAY['what-if', 'how-to', 'why', 'comparison', 'analysis'];
    i INTEGER;
    current_user UUID;
BEGIN
    -- Delete existing test data
    DELETE FROM public.building_blocks_submissions WHERE user_id IN (test_user_1, test_user_2, test_user_3);

    FOR i IN 1..1200 LOOP
        -- Rotate between test users
        current_user := CASE
            WHEN i % 3 = 1 THEN test_user_1
            WHEN i % 3 = 2 THEN test_user_2
            ELSE test_user_3
        END;

        INSERT INTO public.building_blocks_submissions (
            id, user_id, title, audience, presentation_type, question_type,
            situation, complication, answer, outline, storyboard, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            current_user,
            'Test Presentation ' || i,
            audiences[((i-1) % 5) + 1],
            presentation_types[((i-1) % 5) + 1],
            question_types[((i-1) % 5) + 1],
            'This is the situation context for submission ' || i,
            'This is the complication for submission ' || i,
            'This is the answer for submission ' || i,
            'Outline point 1\nOutline point 2\nOutline point 3',
            'Storyboard frame 1\nStoryboard frame 2\nStoryboard frame 3',
            NOW() - (random() * interval '120 days'),
            NOW() - (random() * interval '30 days')
        );
    END LOOP;

    RAISE NOTICE 'Created 1200 building_blocks_submissions records';
END $$;

-- Create additional test data for other affected tables
DO $$
DECLARE
    test_user_1 UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    test_user_2 UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    test_account_1 UUID := '11111111-aaaa-1111-1111-111111111111'::UUID;
    test_account_2 UUID := '22222222-aaaa-2222-2222-222222222222'::UUID;
    i INTEGER;
BEGIN
    -- Create account memberships test data (simulate large teams)
    DELETE FROM public.accounts_memberships
    WHERE account_id IN (test_account_1, test_account_2)
    AND user_id NOT IN (test_user_1, test_user_2);

    FOR i IN 1..500 LOOP
        INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
        VALUES (
            ('44444444-4444-4444-4444-' || LPAD(i::text, 12, '0'))::UUID,
            'bulk.user.' || i || '@example.com',
            NOW(),
            NOW() - (random() * interval '365 days'),
            NOW() - (random() * interval '30 days')
        ) ON CONFLICT (id) DO NOTHING;

        -- Add some users to test accounts
        IF i <= 250 THEN
            INSERT INTO public.accounts_memberships (user_id, account_id, account_role)
            VALUES (
                ('44444444-4444-4444-4444-' || LPAD(i::text, 12, '0'))::UUID,
                CASE WHEN i % 2 = 0 THEN test_account_1 ELSE test_account_2 END,
                CASE WHEN i % 10 = 0 THEN 'admin' ELSE 'member' END
            ) ON CONFLICT (user_id, account_id) DO NOTHING;
        END IF;
    END LOOP;

    RAISE NOTICE 'Created 500 additional users and 250 membership records';
END $$;

-- Update statistics after bulk inserts
ANALYZE public.survey_responses;
ANALYZE public.ai_request_logs;
ANALYZE public.building_blocks_submissions;
ANALYZE public.accounts_memberships;

RAISE NOTICE 'RLS Performance test data setup completed successfully!';
RAISE NOTICE '- Survey responses: 1500 records';
RAISE NOTICE '- AI request logs: 2000 records';
RAISE NOTICE '- Building blocks submissions: 1200 records';
RAISE NOTICE '- Additional users: 500 users with 250 memberships';
RAISE NOTICE '';
RAISE NOTICE 'Ready for performance testing!';

COMMIT;