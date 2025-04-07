-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert survey: Course Feedback
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  show_progress_bar,
  created_at,
  updated_at
) VALUES (
  '7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1',
  'Course Feedback',
  'feedback',
  'Please share your thoughts on the course',
  'published',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert survey: High-Stakes Presentations Self-Assessment
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  show_progress_bar,
  created_at,
  updated_at
) VALUES (
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'High-Stakes Presentations Self-Assessment',
  'self-assessment',
  'Survey: High-Stakes Presentations Self-Assessment',
  'published',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert survey: Three Quick Questions
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  show_progress_bar,
  created_at,
  updated_at
) VALUES (
  '6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0',
  'Three Quick Questions',
  'three-quick-questions',
  'A quick survey to help understand your goals',
  'published',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
