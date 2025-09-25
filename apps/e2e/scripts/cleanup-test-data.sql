-- E2E Test Data Cleanup Script
-- This script removes all test data to ensure clean state between test runs

-- Remove test data in correct order (considering foreign key constraints)
DELETE FROM public.accounts_memberships WHERE account_id LIKE 'test-%';
DELETE FROM public.testimonials WHERE id LIKE 'test-%';
DELETE FROM public.accounts WHERE id LIKE 'test-%';
-- Clean up test users with various email patterns
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test%@slideheroes.com';
DELETE FROM auth.users WHERE email LIKE 'e2e-test%@slideheroes.com';

-- Clean up any additional test-related data
DELETE FROM public.notifications WHERE account_id LIKE 'test-%';
DELETE FROM public.invitations WHERE account_id LIKE 'test-%';

-- Verify cleanup
SELECT 'Accounts' as table_name, count(*) as count FROM public.accounts WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Users (example.com)' as table_name, count(*) as count FROM auth.users WHERE email LIKE 'test%@example.com'
UNION ALL
SELECT 'Users (slideheroes.com)' as table_name, count(*) as count FROM auth.users WHERE email LIKE 'test%@slideheroes.com'
UNION ALL
SELECT 'Users (slideheroes.com)' as table_name, count(*) as count FROM auth.users WHERE email LIKE 'e2e-test%@slideheroes.com'
UNION ALL
SELECT 'Memberships' as table_name, count(*) as count FROM public.accounts_memberships WHERE account_id LIKE 'test-%'
UNION ALL
SELECT 'Testimonials' as table_name, count(*) as count FROM public.testimonials WHERE id LIKE 'test-%';