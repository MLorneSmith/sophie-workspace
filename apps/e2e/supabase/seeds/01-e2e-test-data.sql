-- E2E Test Data Seeding Script
-- This script uses the same test users from the web app for E2E testing

-- Insert test users in auth.users (using actual test users from web app)
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
        ('00000000-0000-0000-0000-000000000000', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'authenticated', 'authenticated', 'test2@slideheroes.com', '$2a$10$B6t76TzZFakA11BtvbuBzehMtDPAyWT5jMCBlnL5KoqNUuUN1Wd1a', '2024-04-20 08:20:38.165331+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-04-20 09:36:02.521776+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "email": "test2@slideheroes.com", "email_verified": false, "phone_verified": false, "onboarded": true, "onboardedAt": "2025-04-05T18:24:00.000Z"}', NULL, '2024-04-20 08:20:34.459113+00', '2024-04-20 10:07:48.554125+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
        ('00000000-0000-0000-0000-000000000000', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'authenticated', 'authenticated', 'test1@slideheroes.com', '$2a$10$B6t76TzZFakA11BtvbuBzehMtDPAyWT5jMCBlnL5KoqNUuUN1Wd1a', '2024-04-20 08:20:38.165331+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-04-20 09:36:02.521776+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test1@slideheroes.com", "email_verified": false, "phone_verified": false, "onboarded": true, "onboardedAt": "2025-04-05T18:24:00.000Z"}', NULL, '2024-04-20 08:20:34.459113+00', '2024-04-20 10:07:48.554125+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
        ('00000000-0000-0000-0000-000000000000', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'authenticated', 'authenticated', 'michael@slideheroes.com', '$2a$10$B6t76TzZFakA11BtvbuBzehMtDPAyWT5jMCBlnL5KoqNUuUN1Wd1a', '2024-04-20 08:36:37.517993+00', NULL, '', '2024-04-20 08:36:27.639648+00', '', NULL, '', '', NULL, '2024-04-20 08:36:37.614337+00', '{"provider": "email", "providers": ["email"], "role": "super-admin"}', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "michael@slideheroes.com", "email_verified": false, "phone_verified": false, "onboarded": true, "onboardedAt": "2025-04-05T18:24:00.000Z"}', NULL, '2024-04-20 08:36:27.630379+00', '2024-04-20 08:36:37.617955+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

-- Insert auth identities for test users
INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
        ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '{"sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "email": "test2@slideheroes.com", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:20:34.46275+00', '2024-04-20 08:20:34.462773+00', '2024-04-20 08:20:34.462773+00', 'e89b6d6a-7b2c-4d3f-9d6e-d3f9b2c1a8b7'),
        ('31a03e74-1639-45b6-bfa7-77447f1a4762', '31a03e74-1639-45b6-bfa7-77447f1a4762', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test1@slideheroes.com", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:20:34.46275+00', '2024-04-20 08:20:34.462773+00', '2024-04-20 08:20:34.462773+00', '9bb58bad-24a4-41a8-9742-1b5b4e2d8abd'),
        ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "michael@slideheroes.com", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:36:27.637388+00', '2024-04-20 08:36:27.637409+00', '2024-04-20 08:36:27.637409+00', '090598a1-ebba-4879-bbe3-38d517d5066f')
ON CONFLICT (id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

-- Insert MFA factors for super-admin user
INSERT INTO auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone)
VALUES
    ('ad6c5aa8-9a61-4419-9c27-b09b7e99b35f', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'TOTP Factor', 'totp', 'verified', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00', 'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE', NULL)
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    friendly_name = EXCLUDED.friendly_name,
    factor_type = EXCLUDED.factor_type,
    status = EXCLUDED.status,
    secret = EXCLUDED.secret;

-- Insert personal accounts for test users
INSERT INTO "public"."accounts" ("id", "primary_owner_user_id", "name", "slug", "email", "is_personal_account", "updated_at", "created_at", "created_by", "updated_by", "picture_url", "public_data")
VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Test User Two', NULL, 'test2@slideheroes.com', true, NOW(), NOW(), NULL, NULL, NULL, '{}'),
    ('31a03e74-1639-45b6-bfa7-77447f1a4762', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'Test User One', NULL, 'test1@slideheroes.com', true, NOW(), NOW(), NULL, NULL, NULL, '{}'),
    ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'Michael Smith', NULL, 'michael@slideheroes.com', true, NOW(), NOW(), NULL, NULL, NULL, '{}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();

-- Insert test account (SlideHeroes Team)
INSERT INTO "public"."accounts" ("id", "primary_owner_user_id", "name", "slug", "email", "is_personal_account", "updated_at", "created_at", "created_by", "updated_by", "picture_url", "public_data")
VALUES ('5deaa894-2094-4da3-b4fd-1fada0809d1c', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'SlideHeroes Team', 'slideheroes-team', NULL, false, NULL, NULL, NULL, NULL, NULL, '{}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- Insert personal account memberships (users are owners of their own personal accounts)
INSERT INTO "public"."accounts_memberships" ("user_id", "account_id", "account_role", "created_at", "updated_at", "created_by", "updated_by")
VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'owner', NOW(), NOW(), NULL, NULL),
    ('31a03e74-1639-45b6-bfa7-77447f1a4762', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'owner', NOW(), NOW(), NULL, NULL),
    ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'owner', NOW(), NOW(), NULL, NULL)
ON CONFLICT (user_id, account_id) DO UPDATE SET
    account_role = EXCLUDED.account_role,
    updated_at = now();

-- Insert test team account memberships
INSERT INTO "public"."accounts_memberships" ("user_id", "account_id", "account_role", "created_at", "updated_at", "created_by", "updated_by")
VALUES ('31a03e74-1639-45b6-bfa7-77447f1a4762', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'owner', '2024-04-20 08:21:16.802867+00', '2024-04-20 08:21:16.802867+00', NULL, NULL),
       ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'owner', '2024-04-20 08:36:44.21028+00', '2024-04-20 08:36:44.21028+00', NULL, NULL),
       ('f47ac10b-58cc-4372-a567-0e02b2c3d479', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'member', '2024-04-20 08:41:17.833709+00', '2024-04-20 08:41:17.833709+00', NULL, NULL)
ON CONFLICT (user_id, account_id) DO UPDATE SET
    account_role = EXCLUDED.account_role,
    updated_at = now();

-- Insert roles
INSERT INTO "public"."roles" ("name", "hierarchy_level")
VALUES ('custom-role', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert onboarding data
INSERT INTO "public"."onboarding" (
  id, 
  user_id, 
  completed, 
  completed_at, 
  full_name, 
  first_name, 
  last_name, 
  primary_goal, 
  secondary_goals, 
  work_role, 
  work_industry, 
  theme_preference, 
  created_at, 
  updated_at
) VALUES 
(
  uuid_generate_v4(),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  TRUE,
  NOW(),
  'Test User Two',
  'Test',
  'User Two',
  'work',
  '{"learn": true, "automate": false, "feedback": false}',
  'Tester',
  'Technology',
  'light',
  NOW(),
  NOW()
),
(
  uuid_generate_v4(),
  '31a03e74-1639-45b6-bfa7-77447f1a4762',
  TRUE,
  NOW(),
  'Test User One',
  'Test',
  'User One',
  'work',
  '{"learn": true, "automate": true, "feedback": false}',
  'Developer',
  'Technology',
  'light',
  NOW(),
  NOW()
),
(
  uuid_generate_v4(),
  '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf',
  TRUE,
  NOW(),
  'Michael Smith',
  'Michael',
  'Smith',
  'work',
  '{"learn": true, "automate": false, "feedback": true}',
  'Founder',
  'Education',
  'dark',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  completed = EXCLUDED.completed,
  completed_at = EXCLUDED.completed_at,
  updated_at = now();

-- Insert test testimonials
INSERT INTO "public"."testimonials" ("id", "customer_name", "customer_company_name", "customer_avatar_url", "content", "rating", "status", "created_at", "updated_at") VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarah Chen', 'Tech Innovator & Speaker', '/images/testimonials/michael.webp', 'This platform transformed how I create presentations. The AI tools are incredibly intuitive and save me hours of work.', 5, 'approved', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Marcus Rodriguez', 'Senior Product Manager', '/images/testimonials/michael.webp', 'The quality of slides I can create now is amazing. My presentations stand out and engage the audience better than ever.', 5, 'approved', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Emily Watson', 'Marketing Director', '/images/testimonials/michael.webp', 'Game-changer for our marketing presentations. The templates and AI suggestions make creating compelling decks so much faster.', 5, 'approved', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    content = EXCLUDED.content,
    updated_at = now();

-- Create default AI allocations for test users
INSERT INTO public.ai_usage_allocations (user_id, credits_allocated, credits_used, allocation_type, reset_frequency, next_reset_at, is_active, created_at, updated_at) VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 1000, 0, 'monthly', 'monthly', now() + interval '1 month', true, now(), now()),
    ('31a03e74-1639-45b6-bfa7-77447f1a4762', 1000, 0, 'monthly', 'monthly', now() + interval '1 month', true, now(), now()),
    ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 1000, 0, 'monthly', 'monthly', now() + interval '1 month', true, now(), now());

-- Insert sample building blocks submission
INSERT INTO "public"."building_blocks_submissions" ("id", "user_id", "title", "audience", "presentation_type", "question_type", "situation", "complication", "answer", "outline", "created_at", "updated_at") VALUES
  ('4f4836f7-d142-4c57-9da0-0758e308d847', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Turnaround plan for Global Universal Bank', 'Executives', 'Consulting Presentation', 'What should we do?', 
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Global Universal Bank is 150 years old and one of the largest banks in the world.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"There is a Board meeting next month and they want answers","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Global Universal Bank can cut costs by close to $50 million per year","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Presentation Outline"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Situation"}]},{"type":"paragraph","content":[{"type":"text","text":"Global Universal Bank is 150 years old and one of the largest banks in the world."}]}],"meta":{"sectionType":"outline","timestamp":"2025-04-29T20:55:19.228Z","version":"1.0"}}', 
  '2025-02-19T14:58:18.089Z', '2025-02-19T14:58:18.089Z')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = now();

-- Verify seeded data
SELECT 'Auth Users' as table_name, count(*) as count FROM auth.users WHERE email LIKE '%@slideheroes.com'
UNION ALL
SELECT 'Accounts' as table_name, count(*) as count FROM public.accounts WHERE id = '5deaa894-2094-4da3-b4fd-1fada0809d1c'
UNION ALL
SELECT 'Memberships' as table_name, count(*) as count FROM public.accounts_memberships WHERE account_id = '5deaa894-2094-4da3-b4fd-1fada0809d1c'
UNION ALL
SELECT 'Testimonials' as table_name, count(*) as count FROM public.testimonials
UNION ALL
SELECT 'Onboarding' as table_name, count(*) as count FROM public.onboarding
UNION ALL
SELECT 'AI Allocations' as table_name, count(*) as count FROM public.ai_usage_allocations;