-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert a sample survey
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  created_at,
  updated_at
) VALUES (
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Fixed UUID for the survey
  'Course Feedback Survey',
  'course-feedback-survey',
  'Please provide feedback on the course',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the survey already exists

-- Commit the transaction
COMMIT;
