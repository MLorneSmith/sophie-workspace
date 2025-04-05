-- Seed data for the survey questions table
-- This file should be run after the surveys seed file to ensure the surveys exist

-- Start a transaction
BEGIN;

-- Insert question 1: While presenting, no one has trouble following my ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'While presenting, no one has trouble following my thought process',
  'multiple_choice',
  'structure',
  0,
  0,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 1
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  '367bd748-5456-43a5-9b8f-9613f1e5d94f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 2: I regularly use metaphors, analogies, and anecdote...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'I regularly use metaphors, analogies, and anecdote in my presentations',
  'multiple_choice',
  'story',
  0,
  1,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 2
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '93929c63-e190-4573-a6fd-259db2b645e7',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '93929c63-e190-4573-a6fd-259db2b645e7',
  '93929c63-e190-4573-a6fd-259db2b645e7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 3: I support my arguments with trustworthy evidence f...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'I support my arguments with trustworthy evidence from authentic sources',
  'multiple_choice',
  'substance',
  0,
  2,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 3
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  'e290c6d6-878e-4afa-a4c0-dbdb0d04498d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 4: I am good at designing simple, clear slides that c...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'I am good at designing simple, clear slides that convey my point',
  'multiple_choice',
  'style',
  0,
  3,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 4
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'f583f74f-f091-49cb-a80a-904fc5507430',
  'f583f74f-f091-49cb-a80a-904fc5507430',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 5: I always feel anxious and nervous before giving a ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'I always feel anxious and nervous before giving a presentation',
  'multiple_choice',
  'self-confidence',
  1,
  4,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 5
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  'cd4286af-6a25-48ac-a578-c683228c6aad',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 6: I always tailor my presentation strategy, content,...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'I always tailor my presentation strategy, content, and approach to different audiences and different levels of knowledge',
  'multiple_choice',
  'structure',
  0,
  5,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 6
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  '407fd6a0-3d16-433c-9a62-109cc9d3da39',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 7: I tend to read the slides back to my audience, rat...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'I tend to read the slides back to my audience, rather than adding additional verbal context or color',
  'multiple_choice',
  'story',
  1,
  6,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 7
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  '5bc67f03-fa05-46c7-a12b-db01787d99d3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 8: I regularly present data to support my conclusions...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'I regularly present data to support my conclusions and effectively leverage all types of charts and tables',
  'multiple_choice',
  'substance',
  0,
  7,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 8
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  '97e3601e-f8ab-45ed-be59-ac4cbbb51ff7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 9: The content I develop for my presentations has the...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'The content I develop for my presentations has the appropriate level of detail for the audience and situation',
  'multiple_choice',
  'style',
  0,
  8,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 9
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  '90589d29-837e-48ce-bd94-7f51286b4db4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 10: When presenting I have command over the room. I lo...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'When presenting I have command over the room. I look and sound confident and assertive. I exude charisma.',
  'multiple_choice',
  'self-confidence',
  0,
  9,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 10
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  '4ac08414-12a7-429d-b5fd-4ec9f140fb4c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 11: I create presentations designed to meet the needs ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'e291b637-b05e-415f-a981-ba123f86175c',
  'I create presentations designed to meet the needs of my audience',
  'multiple_choice',
  'structure',
  0,
  10,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e291b637-b05e-415f-a981-ba123f86175c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e291b637-b05e-415f-a981-ba123f86175c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e291b637-b05e-415f-a981-ba123f86175c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e291b637-b05e-415f-a981-ba123f86175c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 11
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'e291b637-b05e-415f-a981-ba123f86175c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'e291b637-b05e-415f-a981-ba123f86175c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'e291b637-b05e-415f-a981-ba123f86175c',
  'e291b637-b05e-415f-a981-ba123f86175c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 12: I use storyboards to map out my presentations in a...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'I use storyboards to map out my presentations in advance',
  'multiple_choice',
  'story',
  0,
  11,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 12
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  'a34f77cf-f4cc-4cea-8c72-31cb0d687a1e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 13: I create my ideas first, before creating slides...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'I create my ideas first, before creating slides',
  'multiple_choice',
  'substance',
  0,
  12,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 13
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  '59fcadc0-3cdd-4644-9d1e-dbf6c4d2b49c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 14: The visuals of my presentation match well with the...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'The visuals of my presentation match well with the information I am communicating',
  'multiple_choice',
  'style',
  0,
  13,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 14
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  'ee666b6e-d940-4bf4-8f8f-e36eb6b47c2c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 15: I rehearse so there is a minimum use of notes and ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'I rehearse so there is a minimum use of notes and maximum attention paid to the audience',
  'multiple_choice',
  'self-confidence',
  0,
  14,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 15
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  '63afe3cc-80ad-4439-b037-b67b893faf5e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 16: I spend significant time and effort optimizing the...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'I spend significant time and effort optimizing the structure of my presentation',
  'multiple_choice',
  'structure',
  0,
  15,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 16
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  '5aafdff3-5374-4155-9cc8-493e960f0d0c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 17: I am good at turning examples into colorful storie...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'I am good at turning examples into colorful stories',
  'multiple_choice',
  'story',
  0,
  16,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 17
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  'f1ceb742-f75d-42d9-abc7-1e7b0eaa7d47',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 18: I have a good sense as to when it is better to use...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'I have a good sense as to when it is better to use a graph over a table (and vice versa)',
  'multiple_choice',
  'substance',
  0,
  17,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 18
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  '75e809d0-d7d5-487b-9a03-4e6ea5b82759',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 19: I apply a basic understanding of the principles of...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'I apply a basic understanding of the principles of visual perception to create more effective slides',
  'multiple_choice',
  'style',
  0,
  18,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 19
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  'd93a801d-c7bb-4c64-9390-6814739e9a5e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 20: I develop a script in advance of my most important...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'I develop a script in advance of my most important meetings',
  'multiple_choice',
  'self-confidence',
  0,
  19,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 20
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  'd7e5bd13-90b9-4873-acff-3de4fe68cb7a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 21: I understand concepts like MECE, inductive versus ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'I understand concepts like MECE, inductive versus deductive reasoning, and the principle of abstration',
  'multiple_choice',
  'structure',
  0,
  20,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 21
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  '0ff7d102-baa9-4cbd-8332-fac1398f46db',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 22: I emulate scriptwriters and start with a bang to h...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'I emulate scriptwriters and start with a bang to hook my audience from the very first moment',
  'multiple_choice',
  'story',
  0,
  21,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 22
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  '6e237156-68b4-41b0-88aa-f37eb2eee851',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 23: I am familiar with tornado diagrams and waterfall ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'I am familiar with tornado diagrams and waterfall & marimekko charts',
  'multiple_choice',
  'substance',
  0,
  22,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 23
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  '897ccad1-7f18-4158-b7ac-fb0d4f325680',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 24: I create slides that leverage graphics and images ...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'I create slides that leverage graphics and images (in addition to text) to communicate my ideas',
  'multiple_choice',
  'style',
  0,
  23,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 24
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  '059174c5-323f-468a-8ad8-09f69d960dc3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert question 25: I usually go well over my allotted time to speak...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'I usually go well over my allotted time to speak',
  'multiple_choice',
  'self-confidence',
  1,
  24,
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert option 1 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'Strongly disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 2 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'Disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 3 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'Neither agree nor disagree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 4 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'Agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert option 5 for question 25
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'Strongly agree',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  '15bdc210-8397-433d-85d3-b61ae2d1f4d0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Commit the transaction
COMMIT;
