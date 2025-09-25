-- Seed test users for E2E testing
-- This script creates test users directly in the auth.users table

-- Delete existing test users first
DELETE FROM auth.users WHERE email IN (
  'test1@slideheroes.com',
  'test2@slideheroes.com',
  'newuser@slideheroes.com'
);

-- Insert test users with known passwords
-- Password: aiesec1992 (hashed with bcrypt)
-- Hash generated from Supabase auth system
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '31a03e74-1639-45b6-bfa7-77447f1a4762',
  '00000000-0000-0000-0000-000000000000',
  'test1@slideheroes.com',
  '$2a$10$kRZ4mIiUe1MAVlXP1bWJvOVDGWYgDXrWiQe94CBIzHsSYA8A/M5N2',
  now(),
  '{"onboarded": true, "displayName": "Test User 1"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '00000000-0000-0000-0000-000000000000',
  'test2@slideheroes.com',
  '$2a$10$kRZ4mIiUe1MAVlXP1bWJvOVDGWYgDXrWiQe94CBIzHsSYA8A/M5N2',
  now(),
  '{"onboarded": true, "displayName": "Test User 2"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef0123456789',
  '00000000-0000-0000-0000-000000000000',
  'newuser@slideheroes.com',
  '$2a$10$kRZ4mIiUe1MAVlXP1bWJvOVDGWYgDXrWiQe94CBIzHsSYA8A/M5N2',
  now(),
  '{"onboarded": false, "displayName": "New Test User"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Verify users were created
SELECT id, email, (raw_user_meta_data->>'onboarded')::boolean as onboarded 
FROM auth.users 
WHERE email IN ('test1@slideheroes.com', 'test2@slideheroes.com', 'newuser@slideheroes.com');