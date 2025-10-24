-- ==================================================================
-- E2E TEST USER CONFIGURATION
-- ==================================================================
-- Ensures E2E test users are properly configured for automated testing
-- Runs after main seed (01_main_seed.sql) to confirm email addresses
--
-- This file is:
-- - Idempotent (safe to run multiple times)
-- - Environment-agnostic (works in local, dev, staging)
-- - Required for CI/CD integration tests
-- ==================================================================

DO $$
DECLARE
    confirmed_count INTEGER;
BEGIN
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
        RAISE NOTICE '✅ Confirmed % E2E test user email(s)', confirmed_count;
    ELSE
        RAISE NOTICE '✓ All E2E test users already confirmed';
    END IF;
END $$;
