-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert the self-assessment survey
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  created_at,
  updated_at
) VALUES (
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'High-Stakes Presentations Self-Assessment',
  'highstakes-presentations-selfassessment',
  'Self-assessment survey for presentation skills',
  'published',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
