-- E2E Test Data Cleanup Script
-- This script removes all test data to ensure clean state between test runs

-- Remove test data in correct order (considering foreign key constraints)
DELETE FROM public.accounts_memberships WHERE account_id LIKE 'test-%';
DELETE FROM public.testimonials WHERE id LIKE 'test-%';
DELETE FROM public.accounts WHERE id LIKE 'test-%';
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';

-- Clean up any additional test-related data
DELETE FROM public.notifications WHERE account_id LIKE 'test-%';
DELETE FROM public.invitations WHERE account_id LIKE 'test-%';

-- Verify cleanup
SELECT 'Accounts' as table_name, count(*) as count FROM public.accounts WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Users' as table_name, count(*) as count FROM auth.users WHERE email LIKE 'test%@example.com'
UNION ALL
SELECT 'Memberships' as table_name, count(*) as count FROM public.accounts_memberships WHERE account_id LIKE 'test-%'
UNION ALL
SELECT 'Testimonials' as table_name, count(*) as count FROM public.testimonials WHERE id LIKE 'test-%';