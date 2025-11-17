-- ==================================================================
-- MIGRATION: Seed E2E Test Users for Remote Environments
-- ==================================================================
-- Purpose: Ensure E2E test users are properly configured on remote
--          environments (dev, staging) for automated testing
--
-- This migration:
-- - Is idempotent (safe to run multiple times)
-- - Includes production safety guards
-- - Confirms email addresses for test users to enable authentication
-- - Required for CI/CD integration tests
--
-- Created: 2025-11-04
-- Related Issue: #545
-- ==================================================================

-- ==================================================================
-- SAFETY: Prevent Production Seeding
-- ==================================================================
-- This guard prevents accidental seeding of production databases
-- Customize the production database name check as needed
DO $$
BEGIN
  -- Check if this is a production environment
  -- Adjust the database name pattern to match your production setup
  IF current_database() ~ '^(production|prod)' THEN
    RAISE EXCEPTION 'Cannot seed production database: % - Seeding is only allowed for dev, staging, and local environments', current_database();
  END IF;

  RAISE NOTICE 'Database % verified as non-production - proceeding with seeding', current_database();
END $$;

-- ==================================================================
-- E2E TEST USER EMAIL CONFIRMATION
-- ==================================================================
-- Marks E2E test users as email confirmed so they can authenticate
-- immediately without email verification
--
-- Test Users:
-- - test1@slideheroes.com (E2E_TEST_USER_EMAIL)
-- - test2@slideheroes.com (E2E_OWNER_EMAIL)
-- - michael@slideheroes.com (E2E_ADMIN_EMAIL)
-- ==================================================================

DO $$
DECLARE
    confirmed_count INTEGER;
    user_record RECORD;
BEGIN
    -- Log current state before update
    RAISE NOTICE '=== E2E Test User Seeding ===';

    FOR user_record IN
        SELECT
            email,
            email_confirmed_at IS NOT NULL as is_confirmed,
            created_at
        FROM auth.users
        WHERE email IN (
            'test1@slideheroes.com',
            'test2@slideheroes.com',
            'michael@slideheroes.com'
        )
    LOOP
        IF user_record.is_confirmed THEN
            RAISE NOTICE 'User % already confirmed (created: %)',
                user_record.email, user_record.created_at;
        ELSE
            RAISE NOTICE 'User % needs confirmation (created: %)',
                user_record.email, user_record.created_at;
        END IF;
    END LOOP;

    -- Mark E2E test users as email confirmed
    -- This allows them to authenticate immediately without email verification
    -- Note: confirmed_at is a generated column, only update email_confirmed_at
    UPDATE auth.users
    SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email IN (
        'test1@slideheroes.com',      -- E2E_TEST_USER_EMAIL
        'test2@slideheroes.com',      -- E2E_OWNER_EMAIL
        'michael@slideheroes.com'     -- E2E_ADMIN_EMAIL
    )
    AND email_confirmed_at IS NULL;

    GET DIAGNOSTICS confirmed_count = ROW_COUNT;

    -- Log operation results
    IF confirmed_count > 0 THEN
        RAISE NOTICE ' Confirmed % E2E test user email(s)', confirmed_count;
    ELSE
        RAISE NOTICE ' All E2E test users already confirmed';
    END IF;

    -- Verify final state
    RAISE NOTICE '=== Final State ===';
    FOR user_record IN
        SELECT
            email,
            email_confirmed_at,
            created_at
        FROM auth.users
        WHERE email IN (
            'test1@slideheroes.com',
            'test2@slideheroes.com',
            'michael@slideheroes.com'
        )
    LOOP
        RAISE NOTICE 'User %: confirmed at %',
            user_record.email, user_record.email_confirmed_at;
    END LOOP;
END $$;

-- ==================================================================
-- VERIFICATION
-- ==================================================================
-- Ensure all test users are now confirmed
DO $$
DECLARE
    unconfirmed_count INTEGER;
    missing_users TEXT[];
BEGIN
    -- Check for any expected users that are not confirmed
    SELECT COUNT(*), ARRAY_AGG(email)
    INTO unconfirmed_count, missing_users
    FROM auth.users
    WHERE email IN (
        'test1@slideheroes.com',
        'test2@slideheroes.com',
        'michael@slideheroes.com'
    )
    AND email_confirmed_at IS NULL;

    IF unconfirmed_count > 0 THEN
        RAISE WARNING 'Still have % unconfirmed test users: %',
            unconfirmed_count, missing_users;
    END IF;

    -- Check if users exist at all
    SELECT
        ARRAY_AGG(expected_email)
    INTO missing_users
    FROM (VALUES
        ('test1@slideheroes.com'),
        ('test2@slideheroes.com'),
        ('michael@slideheroes.com')
    ) AS expected(expected_email)
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE email = expected.expected_email
    );

    IF missing_users IS NOT NULL AND array_length(missing_users, 1) > 0 THEN
        RAISE NOTICE 'Note: The following test users do not exist yet: %', missing_users;
        RAISE NOTICE 'They will need to be created first (via seed.sql or manual creation)';
    ELSE
        RAISE NOTICE ' All expected E2E test users exist and are confirmed';
    END IF;
END $$;
