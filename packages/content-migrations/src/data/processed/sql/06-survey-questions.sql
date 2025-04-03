-- Seed data for the survey questions table
-- This file should be run after the surveys seed file to ensure the surveys exist

-- Start a transaction
BEGIN;

-- Insert a sample survey question
INSERT INTO payload.survey_questions (
  id,
  question,
  surveys_id,
  created_at,
  updated_at
) VALUES (
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea', -- Fixed UUID for the question
  'How would you rate the course overall?',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Survey ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
