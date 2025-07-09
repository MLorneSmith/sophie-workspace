-- E2E Test Data Seeding Script
-- This script creates minimal test data for E2E testing

-- Insert test accounts
INSERT INTO public.accounts (id, name, picture_url, primary_owner_user_id, slug, subscription_status, created_at, updated_at) VALUES
    ('test-account-1', 'Test Account 1', null, 'test-user-1', 'test-account-1', 'active', now(), now()),
    ('test-account-2', 'Test Account 2', null, 'test-user-2', 'test-account-2', 'active', now(), now()),
    ('test-team-account', 'Test Team Account', null, 'test-user-1', 'test-team-account', 'active', now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- Insert test users in auth.users
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
    ('test-user-1', 'test1@example.com', now(), now(), now()),
    ('test-user-2', 'test2@example.com', now(), now(), now()),
    ('test-user-3', 'test3@example.com', now(), now(), now())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

-- Insert test account memberships
INSERT INTO public.accounts_memberships (account_id, user_id, role, created_at, updated_at) VALUES
    ('test-account-1', 'test-user-1', 'owner', now(), now()),
    ('test-account-2', 'test-user-2', 'owner', now(), now()),
    ('test-team-account', 'test-user-1', 'owner', now(), now()),
    ('test-team-account', 'test-user-3', 'member', now(), now())
ON CONFLICT (account_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();

-- Insert test testimonials
INSERT INTO public.testimonials (id, name, title, content, rating, featured, created_at, updated_at) VALUES
    ('test-testimonial-1', 'Test User', 'Test Title', 'This is a test testimonial', 5, true, now(), now()),
    ('test-testimonial-2', 'Another Test User', 'Another Test Title', 'This is another test testimonial', 4, false, now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    updated_at = now();

-- Verify seeded data
SELECT 'Accounts' as table_name, count(*) as count FROM public.accounts WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Users' as table_name, count(*) as count FROM auth.users WHERE email LIKE 'test%@example.com'
UNION ALL
SELECT 'Memberships' as table_name, count(*) as count FROM public.accounts_memberships WHERE account_id LIKE 'test-%'
UNION ALL
SELECT 'Testimonials' as table_name, count(*) as count FROM public.testimonials WHERE id LIKE 'test-%';