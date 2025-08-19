-- E2E Test Data Seeding Script
-- This script creates minimal test data for E2E testing
-- Uses the actual test users that are already seeded in the database

-- Test user IDs (these are already in auth.users from migrations/seeds)
-- test1@slideheroes.com: 31a03e74-1639-45b6-bfa7-77447f1a4762
-- test2@slideheroes.com: f47ac10b-58cc-4372-a567-0e02b2c3d479
-- michael@slideheroes.com: 5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf

-- Insert test accounts if they don't exist
-- Note: accounts table doesn't have subscription_status column
INSERT INTO public.accounts (id, name, picture_url, primary_owner_user_id, slug, is_personal_account, created_at, updated_at) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef0123456789', 'Test Account 1', null, '31a03e74-1639-45b6-bfa7-77447f1a4762', 'test-account-1', false, now(), now()),
    ('b2c3d4e5-f6a7-8901-bcde-f01234567890', 'Test Account 2', null, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'test-account-2', false, now(), now()),
    ('c3d4e5f6-a7b8-9012-cdef-012345678901', 'Test Team Account', null, '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'test-team-account', false, now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- Insert test account memberships if they don't exist
-- Note: accounts_memberships uses 'account_role' column and references the roles table
INSERT INTO public.accounts_memberships (account_id, user_id, account_role, created_at, updated_at) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef0123456789', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'owner', now(), now()),
    ('b2c3d4e5-f6a7-8901-bcde-f01234567890', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'owner', now(), now()),
    ('c3d4e5f6-a7b8-9012-cdef-012345678901', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'owner', now(), now()),
    ('c3d4e5f6-a7b8-9012-cdef-012345678901', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'member', now(), now())
ON CONFLICT (user_id, account_id) DO UPDATE SET
    account_role = EXCLUDED.account_role,
    updated_at = now();

-- Verify seeded data
SELECT 'Accounts' as table_name, count(*) as count FROM public.accounts WHERE slug LIKE 'test-%'
UNION ALL
SELECT 'Users' as table_name, count(*) as count FROM auth.users WHERE email LIKE '%@slideheroes.com'
UNION ALL
SELECT 'Memberships' as table_name, count(*) as count FROM public.accounts_memberships WHERE account_id IN (
    'a1b2c3d4-e5f6-7890-abcd-ef0123456789',
    'b2c3d4e5-f6a7-8901-bcde-f01234567890',
    'c3d4e5f6-a7b8-9012-cdef-012345678901'
);