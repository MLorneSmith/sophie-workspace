-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: c2c51c38-7168-4d78-b7a2-b2ff458c59e0)
-- Insert question 1 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2', -- Generated UUID for the question
  'There are many types of relationships that we use graphs to display. What chart type best communicates the ''Part-to-Whole'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'Line Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'Scatter Plots',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'Maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'Bar charts',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  'f8be3c45-d6f9-44e8-bb6f-7acd9c5308f2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57', -- Generated UUID for the question
  'What chart type best communicates the ''Correlation'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'Line Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'Scatter Plots',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'Maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'Bar Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  '9be94e4b-d907-4aff-b21f-88e3d98a4a57',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6', -- Generated UUID for the question
  'What chart type best communicates the ''Time Series'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'Line Charts',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'Scatter Plots',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'Maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'Bar Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  '7ee4a0a9-1038-41d5-a2ce-64799c2329f6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779', -- Generated UUID for the question
  'What chart types best communicates the ''Deviation'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'Line Charts',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'Scatter Plots',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'Maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'Bar Charts',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  '5d0d2e85-f279-4257-8abd-4cf8d8b6d779',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '3689ae2b-cb4a-42bc-b849-6228d88fd751', -- Generated UUID for the question
  'What chart type best communicates the ''Distribution'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'Line Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'Scatter Plots',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'Maps',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'Box Plot',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'Bar Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  '3689ae2b-cb4a-42bc-b849-6228d88fd751',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c', -- Generated UUID for the question
  'What chart type best communicates the ''Nominal Comparison'' relationship',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'Line Chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'Scatter Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'Map',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'Bar Chart',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  'dcf46d23-8923-4eda-ad72-f07f5a9d0c4c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 7 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b', -- Generated UUID for the question
  'What chart type best communicates the ''Geospatial'' relationship?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  6,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'Line Chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'Scatter Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'Map',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'Box Plot',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'Bar Chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  'a4d8ffc4-c629-45d3-ae6c-4b29356cd80b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 8 for quiz: Standard Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '80799a27-0f8e-4189-a125-71be9b8a8c09', -- Generated UUID for the question
  'When should we use Pie Charts?',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  7,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  'For part-to-whole relationships.',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  'For time series relationships',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  'For nominal comparison relationships',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  'Never.',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  'quiz_id',
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0',
  'questions',
  '80799a27-0f8e-4189-a125-71be9b8a8c09',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: 5a579da9-d321-41f2-bb3b-d57d09ebec5a)
-- Insert question 1 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c6eb0eda-e692-4ef6-998c-05db61ad50af', -- Generated UUID for the question
  'Why do we use contrast?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c6eb0eda-e692-4ef6-998c-05db61ad50af',
  'To make our computer monitor easier to read',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c6eb0eda-e692-4ef6-998c-05db61ad50af',
  'To fill up space',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c6eb0eda-e692-4ef6-998c-05db61ad50af',
  'Our eyes like it. It looks good',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c6eb0eda-e692-4ef6-998c-05db61ad50af',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  'c6eb0eda-e692-4ef6-998c-05db61ad50af',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'a55e3e73-7076-472f-abfa-fadd0f25ea5d', -- Generated UUID for the question
  'How important is alignment?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a55e3e73-7076-472f-abfa-fadd0f25ea5d',
  'Critically important (make sure you have learned how to use PowerPoint''s alignment tools)',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a55e3e73-7076-472f-abfa-fadd0f25ea5d',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  'a55e3e73-7076-472f-abfa-fadd0f25ea5d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9', -- Generated UUID for the question
  'How is the principle of proximity helpful?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9',
  'Helps us understand how groups are created (intentionally or unintentionally)',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9',
  'Allows us to squeeze more onto the page',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9',
  'Helps us get to know people',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  '53c57e87-f927-4a90-9d78-1c4a9a7f06a9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '7fee43cb-19a4-478a-a973-e907f8893cb7', -- Generated UUID for the question
  'How many different font types should you use in a single presentation?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  'As many as you can',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  '4',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  '1',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  '2',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  '3',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  '7fee43cb-19a4-478a-a973-e907f8893cb7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '012e498d-427e-4206-a138-e9c168d1fd2a', -- Generated UUID for the question
  'How many colors should we use in a presentation?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  '2 more than the number of fonts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  '7',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  '4 to 5',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  '2 to 3',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  '1',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  '012e498d-427e-4206-a138-e9c168d1fd2a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081', -- Generated UUID for the question
  'What should you do with whitespace?',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081',
  'Ensure you are using enough of it',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081',
  'Color it blue, it is prettier',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081',
  'Fill it up with text!',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081',
  'quiz_id',
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a',
  'questions',
  'f9f409f6-6aaf-4506-b6aa-e02c1c6fd081',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: 783859c9-4f4a-4023-88d3-1a74586000ea)
-- Insert question 1 for quiz: Overview of Fact-based Persuasion Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'ed00070a-8b37-477e-bb37-cc317e34f8ba', -- Generated UUID for the question
  'What is the bare assertion fallacy?',
  '783859c9-4f4a-4023-88d3-1a74586000ea', -- Quiz ID
  '783859c9-4f4a-4023-88d3-1a74586000ea', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  'A premise in an argument that is assumed to be true merely because it says that it is true',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  'A Dan Brown novel',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  'Claiming to be right because you say you are right',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  'A dream where you are presenting naked',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  'quiz_id',
  '783859c9-4f4a-4023-88d3-1a74586000ea',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '783859c9-4f4a-4023-88d3-1a74586000ea',
  'questions',
  'ed00070a-8b37-477e-bb37-cc317e34f8ba',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Overview of Fact-based Persuasion Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13', -- Generated UUID for the question
  'What is graphical excellence?',
  '783859c9-4f4a-4023-88d3-1a74586000ea', -- Quiz ID
  '783859c9-4f4a-4023-88d3-1a74586000ea', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Beautiful',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Honest',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Multivariate',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Efficient',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Complicated',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'Curved',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  'quiz_id',
  '783859c9-4f4a-4023-88d3-1a74586000ea',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '783859c9-4f4a-4023-88d3-1a74586000ea',
  'questions',
  'bbd421b7-5b7e-4cef-b0a8-8ea1b66eec13',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: 59435a9e-f91e-4189-89c9-0f29bb677dc9)
-- Insert question 1 for quiz: Gestalt Principles of Visual Perception Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'b94f4faa-e12c-4d08-992e-fba2b06276e1', -- Generated UUID for the question
  'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'b94f4faa-e12c-4d08-992e-fba2b06276e1',
  'Didn''t notice. The course is brilliant. Carry on!',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'b94f4faa-e12c-4d08-992e-fba2b06276e1',
  'Because repetition ad nauseum helps me learn?...',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'b94f4faa-e12c-4d08-992e-fba2b06276e1',
  'Yo lazy',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b94f4faa-e12c-4d08-992e-fba2b06276e1',
  'quiz_id',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  'questions',
  'b94f4faa-e12c-4d08-992e-fba2b06276e1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Gestalt Principles of Visual Perception Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '91573355-d28e-47c7-a051-5fbf0352b1f8', -- Generated UUID for the question
  'The principle of similarity states that we tend to group things which share visual characteristics such as:',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Size',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Shape',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Color',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Orientation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Sound',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Length',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'Distance',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  'quiz_id',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  'questions',
  '91573355-d28e-47c7-a051-5fbf0352b1f8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Gestalt Principles of Visual Perception Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c6d306e7-271d-448f-a51d-6bd497f047bb', -- Generated UUID for the question
  'What is symmetry associated with?',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Stability',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Consistency',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Structure',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Rhythm',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Twins',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'Music',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  'quiz_id',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  'questions',
  'c6d306e7-271d-448f-a51d-6bd497f047bb',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Gestalt Principles of Visual Perception Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01', -- Generated UUID for the question
  'What does the principle of connection state?',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01',
  'Elements that are visually connected are perceived as more related than elements with no connection',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01',
  'We need to connect our most important ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01',
  'I just can''t make no connection',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01',
  'quiz_id',
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '59435a9e-f91e-4189-89c9-0f29bb677dc9',
  'questions',
  'bfb035fa-66b6-46f0-8fd0-20c9d1a7ae01',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: 0e488661-f74c-4c16-9121-477523907ba8)
-- Insert question 1 for quiz: Idea Generation Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e', -- Generated UUID for the question
  'What is the key to making brainstorming as effective as possible?',
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  'Conduct brainstorming sessions early in the day',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  'Eat lots of sugar',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  'Don''t use brainstorming, it doesn''t work',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  'Engage in debate and dissent',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  'quiz_id',
  '0e488661-f74c-4c16-9121-477523907ba8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0e488661-f74c-4c16-9121-477523907ba8',
  'questions',
  '0126f11b-f9bd-4a50-ab81-bab8c4a0ed2e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Idea Generation Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05', -- Generated UUID for the question
  'What are our Cardinal Rules of brainstorming?',
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Plan your participants',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Focus on ideas',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Structure the session',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Establish rules in advance',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Free associate',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Only invite the single people',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Focus on having fun',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 8 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  7,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Eat, drink, and be merry',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 9 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  8,
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'Conduct sessions on a Friday',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  'quiz_id',
  '0e488661-f74c-4c16-9121-477523907ba8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0e488661-f74c-4c16-9121-477523907ba8',
  'questions',
  'ff9e1dd4-efad-47cb-90a1-d8c0cb9dbd05',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Idea Generation Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'f662a368-0528-4bce-b3f8-ffd88f28c774', -- Generated UUID for the question
  'What was the golden rule talked about in this lesson?',
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID
  '0e488661-f74c-4c16-9121-477523907ba8', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'Facts known by the audience go in the Introduction',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'We are creating our presentation to answer a question in the mind of our audience',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'Our audience is the hero',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'Our objective is to compel our audience to do something',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'Follow a process',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'Create ideas first, slides second',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  'quiz_id',
  '0e488661-f74c-4c16-9121-477523907ba8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0e488661-f74c-4c16-9121-477523907ba8',
  'questions',
  'f662a368-0528-4bce-b3f8-ffd88f28c774',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: 6a02b987-809a-48a8-90b9-ef4c3cc4b82d)
-- Insert question 1 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '6e19a760-29ff-47bb-8582-f553e08fdf60', -- Generated UUID for the question
  'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  'Finance update',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  'Cost cutting recommendations',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  'Quarterly review',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  'How did we perform last quarter, and what do we need to do differently?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  '6e19a760-29ff-47bb-8582-f553e08fdf60',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b', -- Generated UUID for the question
  'Why are we creating our presentation?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'To sell our product to a customer',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'To answer a question in the mind of our audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'To practice our PowerPoint skills',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'To raise money for our start-up',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'Becuase we have been asked to by our boss',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  '1cfc5941-85a5-44ee-920e-8ee513dadb4b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe', -- Generated UUID for the question
  'What are they four parts to our introduction?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Context',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Catalyst',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Beginning',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'End',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Middle',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'The Why',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Answer',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 8 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  7,
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'Question',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  '7ba92eb2-79f0-4457-b745-b2e0fefe1bbe',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'b4b9e13b-001f-40ad-89db-f04b56c7f873', -- Generated UUID for the question
  'What is the Context part of the Introduction?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'b4b9e13b-001f-40ad-89db-f04b56c7f873',
  'The objective of the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'b4b9e13b-001f-40ad-89db-f04b56c7f873',
  'The background to the presentation that includes facts already known to your audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'b4b9e13b-001f-40ad-89db-f04b56c7f873',
  'The answer to the question',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b4b9e13b-001f-40ad-89db-f04b56c7f873',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  'b4b9e13b-001f-40ad-89db-f04b56c7f873',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10', -- Generated UUID for the question
  'What is the Catalyst portion of the Introduction?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  'An event or trigger, sometimes referred to as the complication',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  'The techniques that speed-up the development of a presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  'A leading presentation development platform',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  'What happened or changed that created the need for you to write this presentation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  'fb32aec2-b78e-4573-bb1e-d3d3e8dc2e10',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: The Why (Introductions) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'aaa73e82-e424-4225-8bf1-1c7885c2e779', -- Generated UUID for the question
  'What is the Question portion of the Introduction?',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'aaa73e82-e424-4225-8bf1-1c7885c2e779',
  'What we are trying to plant in the mind of the audience with the context and catalyst portions of the Introduction',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'aaa73e82-e424-4225-8bf1-1c7885c2e779',
  'The natural question that arises in the mind of the audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'aaa73e82-e424-4225-8bf1-1c7885c2e779',
  'The ''topic'' of the presentation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aaa73e82-e424-4225-8bf1-1c7885c2e779',
  'quiz_id',
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d',
  'questions',
  'aaa73e82-e424-4225-8bf1-1c7885c2e779',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: 431ccf68-005e-40df-b4e2-234cb344fc61)
-- Insert question 1 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '6bfcc958-5a0f-4674-9dad-d91c355a3350', -- Generated UUID for the question
  'Why is it important to follow a process to develop a presentation?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  'If you are really good, you don''t need to follow a process!',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  'Because creating presentations is all about left brain thinking',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  'Because there is not such thing as creativity',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  'Because it is very easy to focus on the wrong thing, and be led astray',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '6bfcc958-5a0f-4674-9dad-d91c355a3350',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '57de54b9-6c23-4625-832e-ebdc8dd392da', -- Generated UUID for the question
  'What is the 1st step of our process?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  'Who is our audience?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  'Why are we speaking to our audience (identify their question)?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  'What is our answer?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  'How will we deliver this presentation?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '57de54b9-6c23-4625-832e-ebdc8dd392da',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5', -- Generated UUID for the question
  'What is the 2nd step of our process?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  'Who is our audience?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  'Why are we speaking to our audience (identify their question)?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  'What is our answer?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  'How will we deliver this presentation?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '55698d97-2878-4df0-913f-1d9d2ae2d9f5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9', -- Generated UUID for the question
  'What is the 3rd step of our process?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  'Who is our audience?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  'Why are we speaking to our audience (identify their question)?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  'What is our answer?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  'How will we deliver this presentation?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  'bdd78c0d-8f0a-4e75-bade-c04d3c72b3c9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb', -- Generated UUID for the question
  'What is the 4th step of our process?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  'Who is our audience?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  'Why are we speaking to our audience (identify their question)?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  'What is our answer?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  'How will we deliver this presentation?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '056d9371-b5f3-48d9-b9d3-f1c41d6595eb',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2', -- Generated UUID for the question
  'Our first step is ''The Who''. What do we mean by this?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2',
  'Determine who your audience truly is. Who are you speaking to?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2',
  'The Who is a famous English rock band',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2',
  'Determining our answer to a key question',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  'e38a2c80-8cd7-41b1-9781-bcbb91e274a2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 7 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36', -- Generated UUID for the question
  'The second step in our process is ''The Why''. What do we mean by this?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  6,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36',
  'Determine the question inside the mind of our audience and what we want the audience to do a the end',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36',
  'Determine our personal objective from creating the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36',
  'A process of deep existential soul searching to ensure you are a confident speaker',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '8dfdefa2-c5f0-49d2-a2c3-982b0d8c0d36',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 8 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '155e0fbd-92a4-47e5-9bda-05fc4262220e', -- Generated UUID for the question
  'The third step in our process is ''The What''. What does ''The What'' focus on?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  7,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  'Themes from Biggie Smalls'' debut album ''Ready to Die'' which featured ''The What'' on track 9',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  'Determining what types of slides we need to create',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  'Determining what it is we want our Audience to do as a result of the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  'Determining the answer to the question that has been planted in the mind of the audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '155e0fbd-92a4-47e5-9bda-05fc4262220e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 9 for quiz: Our Process Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '0c457d3a-c850-48f4-8b28-746cbced75f4', -- Generated UUID for the question
  'The final step in our process is ''The How''. What is the focus of ''The How''?',
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- Quiz ID (duplicate)
  'single-answer',
  '',
  8,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 9
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  'How to create beautiful slides',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 9
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  'How to answer our audience''s question',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 9
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  'This is how we do it!',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 9
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  'How we will deliver the presentation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  'quiz_id',
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '431ccf68-005e-40df-b4e2-234cb344fc61',
  'questions',
  '0c457d3a-c850-48f4-8b28-746cbced75f4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: 0d40e5bc-3223-47ba-9d26-7731309247e8)
-- Insert question 1 for quiz: Overview of the Fundamental Elements of Design Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '10255c2c-b119-4f94-b2ab-97ad38cf3020', -- Generated UUID for the question
  'What are some of the fundamental elements and principles of design?',
  '0d40e5bc-3223-47ba-9d26-7731309247e8', -- Quiz ID
  '0d40e5bc-3223-47ba-9d26-7731309247e8', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Shape & Form',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Rick Astley',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Color',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Composition',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Contrast',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Line',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Point',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 8 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  7,
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'Negative Space',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  'quiz_id',
  '0d40e5bc-3223-47ba-9d26-7731309247e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0d40e5bc-3223-47ba-9d26-7731309247e8',
  'questions',
  '10255c2c-b119-4f94-b2ab-97ad38cf3020',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Performance Quiz (performance-quiz, ID: df6a9a59-90b3-444c-b182-0492f93fe2be)
-- Insert question 1 for quiz: Performance Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2', -- Generated UUID for the question
  'What can we do to try and set the right tone?',
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'Send a well prepared agenda in advance',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'Dress appropriately',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'Adopt the appropriate disposition for the meeting',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'Tell a joke',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'Lead the group in song',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  'quiz_id',
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  'questions',
  '837cbfc1-287e-4db4-bf66-a0cb13a0c7a2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Performance Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2', -- Generated UUID for the question
  'What are some things you can do to manage stress?',
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Quite your mind',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Laugh',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Primal therapy',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Prepare',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Breathe',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Don''t worry about the presentation until the last minute',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'Talk to yourself like a crazy person',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  'quiz_id',
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  'questions',
  '99dc46fa-a780-4bd6-a0c3-a3b598babbb2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Performance Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c25674c4-5d17-45e9-a034-26ef8ad843c5', -- Generated UUID for the question
  'What body language and delivery mistakes should you be on the lookout for?',
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'Verbal ticks',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'Talking to the screen',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'Closed posture',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'Being over prepared',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'Not displaying any emotion',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  'quiz_id',
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'df6a9a59-90b3-444c-b182-0492f93fe2be',
  'questions',
  'c25674c4-5d17-45e9-a034-26ef8ad843c5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: a251cbf9-2aae-4de1-8e28-d27e6ee21229)
-- Insert question 1 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '587d2a0d-3841-42ff-8dc6-1c4110b83340', -- Generated UUID for the question
  'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Timing of your jokes',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Clarity',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Hair, make-up and clothes',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Pace',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Engaging with the audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Timbre of your voice',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'Smiling and making eye contact',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  '587d2a0d-3841-42ff-8dc6-1c4110b83340',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc', -- Generated UUID for the question
  'What is the first step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  '066a023c-b0b1-43b0-ab11-5b3b39a749dc',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '297d4fe0-6764-458f-91a0-8ee0536c70df', -- Generated UUID for the question
  'What is the second step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Write down the verbal voice over and create a formal script',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  '297d4fe0-6764-458f-91a0-8ee0536c70df',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'ca9ce256-1a7f-4966-acf1-f07561347c3c', -- Generated UUID for the question
  'What is the third step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  'ca9ce256-1a7f-4966-acf1-f07561347c3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '2cec295d-1da0-449d-b83c-27f84c713be6', -- Generated UUID for the question
  'What is the fourth step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  '2cec295d-1da0-449d-b83c-27f84c713be6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'b3713af5-e082-4765-844c-4e70374c5c19', -- Generated UUID for the question
  'What is the fifth step pf the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Present to someone else. Get feedback',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b3713af5-e082-4765-844c-4e70374c5c19',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  'b3713af5-e082-4765-844c-4e70374c5c19',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 7 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c', -- Generated UUID for the question
  'What is the sixth step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  6,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'Run through the script a few more times and the put it aside',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  '2477edc2-aa15-438d-96ca-a0cfe5dba16c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 8 for quiz: Perparation & Practice Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c6ab84dd-eaa7-4064-9474-ea5675a03938', -- Generated UUID for the question
  'What is the seventh step of the recommended preparation process?',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- Quiz ID (duplicate)
  'single-answer',
  '',
  7,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Get a good night sleep and review the script once, maybe twice before the presentation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Present to someone else. Get feedback',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Write down the verbal voice over and create a formal script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 8
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'Run through the script a few more times and the put it aside',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  'quiz_id',
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229',
  'questions',
  'c6ab84dd-eaa7-4064-9474-ea5675a03938',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: 6dea5f7e-95ac-4755-9718-091a8d8ad2e0)
-- Insert question 1 for quiz: Slide Composition Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd', -- Generated UUID for the question
  'What goes in the headline?',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  'Your footnotes',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  'Your voice-over script',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  'Your slide title',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  'The main message of the slide',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  'quiz_id',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  'questions',
  '3f94db86-446a-47d0-84e9-2b0e2d566ccd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Slide Composition Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '19568d3e-65d2-48d3-a615-cbe8b03b044f', -- Generated UUID for the question
  'What goes in the body of the slide?',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  'The supporting evidence that supports the main message',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  'Text',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  'Charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  'Clip art',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  'quiz_id',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  'questions',
  '19568d3e-65d2-48d3-a615-cbe8b03b044f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Slide Composition Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560', -- Generated UUID for the question
  'What is a swipe file?',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  'Collection of useful slide designs and frameworks that you can utilize for inspiration',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  'Hacker code to get free templates',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  'Where you store illicit data',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  'Another name for a garbage can',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  'quiz_id',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  'questions',
  'c83e2912-6a7f-4745-bd46-bfa20f8b3560',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Slide Composition Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3', -- Generated UUID for the question
  'When is the best time to use clip art?',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  'Never',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  'In marketing and sales presentations, but not in finance presentations',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  'No restrictions',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  'When the clip art is of a cute cat',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  'quiz_id',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  'questions',
  '9f47f0a3-9e07-4a73-b760-c914c4fbcfe3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: Slide Composition Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1', -- Generated UUID for the question
  'What elements can be repeated on all slides?',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Company logo',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Location for a headline',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Location for footnotes',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Trademark and confidentiality messages',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Banners',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'Location  for page numbers',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  'quiz_id',
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0',
  'questions',
  'a25cf1c6-11c5-4857-b04d-6b0cd9709df1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: 4e310937-8969-4e2c-bee3-126bd2e0dbd7)
-- Insert question 1 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44', -- Generated UUID for the question
  'What do we use Tornado diagrams for?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  'Composition of markets',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  'Nominal comparison',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  'Sensitivity analysis',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  'To display how several variables change over time',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  '9b4f2388-81c9-4ea7-afef-76aa6ae56f44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c1ac52d5-3930-4058-986c-951b59360b00', -- Generated UUID for the question
  'When do we use a Bubble Chart?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c1ac52d5-3930-4058-986c-951b59360b00',
  'For nominal comparisons',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c1ac52d5-3930-4058-986c-951b59360b00',
  'When your scatter plot is ugly',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c1ac52d5-3930-4058-986c-951b59360b00',
  'When you want to show three variables',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c1ac52d5-3930-4058-986c-951b59360b00',
  'To show a time series',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c1ac52d5-3930-4058-986c-951b59360b00',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  'c1ac52d5-3930-4058-986c-951b59360b00',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '478f134c-9660-4a93-adad-837db3d8d515', -- Generated UUID for the question
  'What chart types should we try and avoid using?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Donut Chart',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Waterfall Chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Pie Chart',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Circle chart',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Anything 3-D',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '478f134c-9660-4a93-adad-837db3d8d515',
  'Merimekko Chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '478f134c-9660-4a93-adad-837db3d8d515',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  '478f134c-9660-4a93-adad-837db3d8d515',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '353351f6-1d90-4a8f-baca-c55a516f9d2b', -- Generated UUID for the question
  'What is the best use of a Waterfall Chart?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  'To show a time series',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  'To show how increases and decreases in a balance affect that balance over time',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  'To show a part-to-whole relationship',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  'As a fancy nominal comparison bar chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  '353351f6-1d90-4a8f-baca-c55a516f9d2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c16ddc62-8105-4e09-8540-3e5c18680daa', -- Generated UUID for the question
  'What is one of the more common uses of a Marimekko Chart?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  'To confuse our audience',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  'To show a time series',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  'To show data on the Finnish textile industry',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  'To display the composition of markets',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  'c16ddc62-8105-4e09-8540-3e5c18680daa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: Specialist Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '079152a9-92ed-4500-9ec6-1ef761aa9c42', -- Generated UUID for the question
  'What are Motion Charts used for?',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  'To explore how several variables change over time',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  'Sensitivity analysis',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  'Nominal comparison',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  'Composition of markets',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  'quiz_id',
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7',
  'questions',
  '079152a9-92ed-4500-9ec6-1ef761aa9c42',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: 61112599-1ba2-419f-af4d-0bd4e7ac7358)
-- Insert question 1 for quiz: Storyboards in Film Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '848b21c4-9d78-43e1-89ef-7397b381879a', -- Generated UUID for the question
  'What is a storyboard?',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID (duplicate)
  'multiple_choice',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  'A blueprint of the movie',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  'A cardboard board to pin up cartoon drawings',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  'What happens when you are subject to a boring story',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  'A Landyachts longboard design',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  'quiz_id',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  'questions',
  '848b21c4-9d78-43e1-89ef-7397b381879a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Storyboards in Film Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'a440b42d-bff3-45c2-af1a-8bf79683503e', -- Generated UUID for the question
  'Who invented storyboards?',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID (duplicate)
  'multiple_choice',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  'Steve Jobs',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  'John Lasseter',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  'Eric Goldberg',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  'Walt Disney',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  'quiz_id',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  'questions',
  'a440b42d-bff3-45c2-af1a-8bf79683503e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Storyboards in Film Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'e298a670-61cc-4273-ac62-8924e0cba990', -- Generated UUID for the question
  'What was the great innovation of storyboarding?',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- Quiz ID (duplicate)
  'multiple_choice',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e298a670-61cc-4273-ac62-8924e0cba990',
  'The introduction of sound (Talkies)',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e298a670-61cc-4273-ac62-8924e0cba990',
  'Allowed film makers to edit the film before making it',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e298a670-61cc-4273-ac62-8924e0cba990',
  'The introduction of color',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e298a670-61cc-4273-ac62-8924e0cba990',
  'The ability to draw your story',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e298a670-61cc-4273-ac62-8924e0cba990',
  'quiz_id',
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '61112599-1ba2-419f-af4d-0bd4e7ac7358',
  'questions',
  'e298a670-61cc-4273-ac62-8924e0cba990',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d)
-- Insert question 1 for quiz: Storyboards in Presentations Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4', -- Generated UUID for the question
  'What are the two approaches discussed in the lesson?',
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d', -- Quiz ID
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d', -- Quiz ID (duplicate)
  'multiple_choice',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  'Black & white and full color',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  'Animated and static',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  'Hand-drawn and computer assisted',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  'Text-based outlining and storyboarding',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  'quiz_id',
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d',
  'questions',
  'e0d145f1-fb66-42c3-86dd-22f9c2b308c4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Storyboards in Presentations Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '62c77629-9156-4826-a5ee-359d362f1bed', -- Generated UUID for the question
  'What tools are recommended to use for storyboarding?',
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d', -- Quiz ID
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d', -- Quiz ID (duplicate)
  'multiple_choice',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '62c77629-9156-4826-a5ee-359d362f1bed',
  'A stone tablet and chisel',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '62c77629-9156-4826-a5ee-359d362f1bed',
  'PowerPoint',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '62c77629-9156-4826-a5ee-359d362f1bed',
  'Adobe Edge Animate',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '62c77629-9156-4826-a5ee-359d362f1bed',
  'Pen and paper',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '62c77629-9156-4826-a5ee-359d362f1bed',
  'quiz_id',
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d',
  'questions',
  '62c77629-9156-4826-a5ee-359d362f1bed',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: f284bb91-d192-4246-8d5c-768162622c44)
-- Insert question 1 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'aa2c4668-3d93-4465-a764-510d595978ed', -- Generated UUID for the question
  'What is the principle of Abstraction?',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'aa2c4668-3d93-4465-a764-510d595978ed',
  'A grouping principle, whereby a hierarchy is adhered to with higher levels of abstraction (less detail) placed near the top, with more specific concepts underneath ',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'aa2c4668-3d93-4465-a764-510d595978ed',
  'A John Grisham novel',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'aa2c4668-3d93-4465-a764-510d595978ed',
  'An approach whereby we simplify our question so profoundly that we reach a level of enlightenment',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aa2c4668-3d93-4465-a764-510d595978ed',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  'aa2c4668-3d93-4465-a764-510d595978ed',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '0c89668d-3e8a-47b4-bec8-108877d30b3e', -- Generated UUID for the question
  'Which lists are MECE (pick 2)',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '0c89668d-3e8a-47b4-bec8-108877d30b3e',
  'Profit=revenue minus expenses',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '0c89668d-3e8a-47b4-bec8-108877d30b3e',
  'Star Wars films: New Hope, Empire, Revenge of the Sith',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '0c89668d-3e8a-47b4-bec8-108877d30b3e',
  'The global population broken down into age groups of 0-20 year-olds, 21-40 year-olds, 41-60 year-olds, 61-80 year-olds, and 81 and over',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0c89668d-3e8a-47b4-bec8-108877d30b3e',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  '0c89668d-3e8a-47b4-bec8-108877d30b3e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '1915a8a8-38bf-414c-809a-7e709167ca4c', -- Generated UUID for the question
  'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Concepts should be arranged in the shape of a triangle',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Concepts at any level must be presented in a strict logical order',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Concepts in any group are always the same kind of idea',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Concepts or ideas at any level of your argument must be more abstract summaries of the concepts that are grouped below',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Concepts must be ordered alphabetically',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'Ideas should be clever',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  '1915a8a8-38bf-414c-809a-7e709167ca4c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '4c96caff-be13-4318-9618-7f4d54f1faba', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '4c96caff-be13-4318-9618-7f4d54f1faba',
  'Deductive',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '4c96caff-be13-4318-9618-7f4d54f1faba',
  'Inductive',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4c96caff-be13-4318-9618-7f4d54f1faba',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  '4c96caff-be13-4318-9618-7f4d54f1faba',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'af781d44-9349-47ad-92d9-1bbc634d6099', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'af781d44-9349-47ad-92d9-1bbc634d6099',
  'Inductive',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'af781d44-9349-47ad-92d9-1bbc634d6099',
  'Deductive',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'af781d44-9349-47ad-92d9-1bbc634d6099',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  'af781d44-9349-47ad-92d9-1bbc634d6099',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: What is Structure? Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '999d995f-d3c8-433d-b847-5c71f79ab506', -- Generated UUID for the question
  'What is the rule of 7 (updated)?',
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID
  'f284bb91-d192-4246-8d5c-768162622c44', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  'There is no such thing as 7 or 9 of anything. We should seek to structure our ideas into groups of 4-5 or less',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  'Rule for calculating compound interest',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  'Organize your ideas into groups of 7',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  'Movie staring Brad Pitt',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  'quiz_id',
  'f284bb91-d192-4246-8d5c-768162622c44',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f284bb91-d192-4246-8d5c-768162622c44',
  'questions',
  '999d995f-d3c8-433d-b847-5c71f79ab506',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: 4fe1eec4-39b8-4b19-9d4f-193bf1b808c6)
-- Insert question 1 for quiz: Tables vs Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7', -- Generated UUID for the question
  'What are the two defining characteristics of Tables?',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  'Information is encoded as text (words and numbers)',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  'They are black and white',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  'They are not as nice to look at as graphs',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  'They are arranged in columns and rows',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  'quiz_id',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  'questions',
  '5c8a3af7-ad09-48af-85b6-07ac7c914de7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Tables vs Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '22466692-7461-4148-9b97-ae647bcb8ea2', -- Generated UUID for the question
  'What re some of the primary benefits of a table?',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'Tables make it easy to look up individual values',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'Tables make it easy to compare pairs of related values',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'Textual encoding provides a level of precision that you cannot get in graphs',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'Tables are easier to create than graphs',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'Tables can handle larger data sets than graphs',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  'quiz_id',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  'questions',
  '22466692-7461-4148-9b97-ae647bcb8ea2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Tables vs Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b', -- Generated UUID for the question
  'What are some of the characteristics that define graphs?',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'Information is encoded as text (words and numbers)',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'Axes provide scales (quantitative and categorical) that are used to label and assign value to the visual objects',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'They are nicer to look at than tables',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'They are typically in color',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'Values are encoded as visual objects in relation to the axis',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'Values are displayed within an area delineated by one or more axis',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  'quiz_id',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  'questions',
  '83bd6a05-e3ef-4623-921d-0b26cf18b81b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Tables vs Graphs Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'f4fb491d-1216-4dbf-b617-552538cdb9e4', -- Generated UUID for the question
  'When should you use graphs?',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  'When the message or story is contained in the shape of the data',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  'When the display will be used to reveal relationships among whole sets of values',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  'When you need to ''sex-up'' a slide',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  'When you have production support and they can create the graph for you',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  'quiz_id',
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6',
  'questions',
  'f4fb491d-1216-4dbf-b617-552538cdb9e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: 3262dfef-44ce-4bc5-95f7-ed83c5a04799)
-- Insert question 1 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'b2940333-00a9-40ad-bf0e-a1d247999a08', -- Generated UUID for the question
  'Who is the hero of our presentation?',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  'Batman baby!',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  'I am dammit!',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  'The audience',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  'Superman owns Batman',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  'b2940333-00a9-40ad-bf0e-a1d247999a08',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366', -- Generated UUID for the question
  'What is the Audience Map used for?',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366',
  'To be used to find your presentation venue. X marks the spot.',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366',
  'To help identify the main decision maker',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366',
  'To develop a strategic approach for engaging with your ''room''',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  'ef32d3d0-74f4-45ce-aa33-f22f44ecb366',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8', -- Generated UUID for the question
  'What are the 4 quadrants of the Audience Map?',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  'Senior, Junior, Advocate, Foe',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  'Personality, Power, Access, Resistance',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  'Friend, Foe, Advocate, Neutral',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  'North, South East and West',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  '445e7ff6-8bd8-4fbe-a02e-9f52f18ca9a8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '5e358304-4969-41c7-bc43-cb6ad87b3c22', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Personality'' quadrant',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  'How do decisions get made?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  'What is their style, energy level, and emotional state?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  'Who are your ''friends in court''?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  'How does your audience like to consume information?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  '5e358304-4969-41c7-bc43-cb6ad87b3c22',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 5 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'cc4749ce-6ba1-421f-b984-807225c35740', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Access'' quadrant',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  4,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'cc4749ce-6ba1-421f-b984-807225c35740',
  'How does your audience like to consume information?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'cc4749ce-6ba1-421f-b984-807225c35740',
  'What is their style, energy level, and emotional state?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'cc4749ce-6ba1-421f-b984-807225c35740',
  'How do decisions get made?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 5
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'cc4749ce-6ba1-421f-b984-807225c35740',
  'Who are your ''friends in court''?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cc4749ce-6ba1-421f-b984-807225c35740',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  'cc4749ce-6ba1-421f-b984-807225c35740',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 6 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '2540d290-27e8-408f-8de3-3e2f7f0c636b', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Power'' quadrant',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  'How does your audience like to consume information?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  'Who are your ''friends in court''?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  'How do decisions get made?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 6
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  'What is their style, energy level, and emotional state?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  '2540d290-27e8-408f-8de3-3e2f7f0c636b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 7 for quiz: The Who Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'be0c1941-9315-4b5a-9453-fcb556a904af', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Resistance'' quadrant',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- Quiz ID (duplicate)
  'single-answer',
  '',
  6,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  'How does your audience like to consume information?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  'Who are your ''friends in court''?',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  'How do decisions get made?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 7
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  'What is their style, energy level, and emotional state?',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  'quiz_id',
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799',
  'questions',
  'be0c1941-9315-4b5a-9453-fcb556a904af',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd)
-- Insert question 1 for quiz: Using Stories Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '1232503d-210c-48a0-8900-3237e6f0283b', -- Generated UUID for the question
  'Why are stories like a cup?',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '1232503d-210c-48a0-8900-3237e6f0283b',
  'Because they are the brain''s natural container for information',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '1232503d-210c-48a0-8900-3237e6f0283b',
  'Because they are simple and straightforward',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '1232503d-210c-48a0-8900-3237e6f0283b',
  'Because you can put in them whatever you like',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '1232503d-210c-48a0-8900-3237e6f0283b',
  'Because they are delicate, and need to be handled carefully',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1232503d-210c-48a0-8900-3237e6f0283b',
  'quiz_id',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  'questions',
  '1232503d-210c-48a0-8900-3237e6f0283b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Using Stories Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '99be9267-1aee-403e-968f-16e17860790f', -- Generated UUID for the question
  'What do stories add to our presentations? Why should be use them?',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '99be9267-1aee-403e-968f-16e17860790f',
  'Stories stop disagreement',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '99be9267-1aee-403e-968f-16e17860790f',
  'Stories make people laugh',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '99be9267-1aee-403e-968f-16e17860790f',
  'Stories lull your audience to sleep',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '99be9267-1aee-403e-968f-16e17860790f',
  'Stories make your message more memorable',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '99be9267-1aee-403e-968f-16e17860790f',
  'Stories increase trust',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '99be9267-1aee-403e-968f-16e17860790f',
  'quiz_id',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  'questions',
  '99be9267-1aee-403e-968f-16e17860790f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Using Stories Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '38f72263-1f7e-4b86-bf02-048dcf755928', -- Generated UUID for the question
  'What characteristics make stories memorable?',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'Concreteness',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'Unexpectedness',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'Credibility',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'Simplicity',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'Emotion',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  'quiz_id',
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd',
  'questions',
  '38f72263-1f7e-4b86-bf02-048dcf755928',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: 09fedf13-0b88-4b7e-aa0e-90e77de8e13d)
-- Insert question 1 for quiz: Visual Perception and Communication Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7', -- Generated UUID for the question
  'What is visual thinking?',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  'Doodling',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  'The phenomenon of thinking through visual processing',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  'A thought cloud',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  'Complex visual charts',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  'quiz_id',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  'questions',
  '879e327a-abf6-4fb5-bcb1-4a2a01f121d7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: Visual Perception and Communication Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'd9b2e335-2664-49e1-9854-eb497e5053e3', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Conscious, sequential, and slow/hard''',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'd9b2e335-2664-49e1-9854-eb497e5053e3',
  'Attentive processing',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'd9b2e335-2664-49e1-9854-eb497e5053e3',
  'Pre-attentive processing',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd9b2e335-2664-49e1-9854-eb497e5053e3',
  'quiz_id',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  'questions',
  'd9b2e335-2664-49e1-9854-eb497e5053e3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: Visual Perception and Communication Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '4f3bf0b9-92e8-44f1-ad8b-03a72a40cb31', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Below the level of consciousness, very rapid''',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID (duplicate)
  'single-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '4f3bf0b9-92e8-44f1-ad8b-03a72a40cb31',
  'Attentive processing',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '4f3bf0b9-92e8-44f1-ad8b-03a72a40cb31',
  'Pre-attentive processing',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4f3bf0b9-92e8-44f1-ad8b-03a72a40cb31',
  'quiz_id',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  'questions',
  '4f3bf0b9-92e8-44f1-ad8b-03a72a40cb31',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: Visual Perception and Communication Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '02374c24-f98d-4314-974a-3179aeb29d48', -- Generated UUID for the question
  'What are the visual attribute triggers of pre-attentive processing?',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Length',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  '3D position',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Color',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Size',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 5 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  4,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Motion',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 6 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  5,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Hue',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 7 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  6,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Texture',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 8 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  7,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Shape',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 9 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  8,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Width',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 10 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  9,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Orientation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 11 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  10,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Enclosure',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 12 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  11,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  '2D position',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 13 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  12,
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'Intensity',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '02374c24-f98d-4314-974a-3179aeb29d48',
  'quiz_id',
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d',
  'questions',
  '02374c24-f98d-4314-974a-3179aeb29d48',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: 77bff2ea-052c-4d92-88d2-b18db431253f)
-- Insert question 1 for quiz: The Why (Next Steps) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '48d78433-142b-472d-8e05-d0bba4716316', -- Generated UUID for the question
  'Who is Cicero?',
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID (duplicate)
  'single-answer',
  '',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '48d78433-142b-472d-8e05-d0bba4716316',
  'A PowerPoint macro',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '48d78433-142b-472d-8e05-d0bba4716316',
  'Some Italian dude who wasn''t nearly as effective as Demosthenes',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 1
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '48d78433-142b-472d-8e05-d0bba4716316',
  'Drake''s blind brother',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '48d78433-142b-472d-8e05-d0bba4716316',
  'quiz_id',
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  'questions',
  '48d78433-142b-472d-8e05-d0bba4716316',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 2 for quiz: The Why (Next Steps) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  'c1048406-0616-4ba7-9e21-852b91e55e42', -- Generated UUID for the question
  'What is the ultimate objective of our presentation?',
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID (duplicate)
  'single-answer',
  '',
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  'c1048406-0616-4ba7-9e21-852b91e55e42',
  'To prompt action!',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  'c1048406-0616-4ba7-9e21-852b91e55e42',
  'To get it over with',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 2
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  'c1048406-0616-4ba7-9e21-852b91e55e42',
  'To get praise for our slick PowerPoint skills',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c1048406-0616-4ba7-9e21-852b91e55e42',
  'quiz_id',
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  'questions',
  'c1048406-0616-4ba7-9e21-852b91e55e42',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 3 for quiz: The Why (Next Steps) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '5119d345-721c-4fbf-b759-51899e285553', -- Generated UUID for the question
  'Which of the following are reasonable next steps to follow your presentation?',
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID (duplicate)
  'multi-answer',
  '',
  2,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '5119d345-721c-4fbf-b759-51899e285553',
  'For your to develop a full proposal for the customer',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '5119d345-721c-4fbf-b759-51899e285553',
  'For the customer to test your software as part of a trial',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 3
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '5119d345-721c-4fbf-b759-51899e285553',
  'For the customer to schedule a follow-up demo with field staff',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5119d345-721c-4fbf-b759-51899e285553',
  'quiz_id',
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  'questions',
  '5119d345-721c-4fbf-b759-51899e285553',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question 4 for quiz: The Why (Next Steps) Quiz
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '624d10b0-107e-4fe0-bd85-34d3bf46611a', -- Generated UUID for the question
  'Where should the next steps go in your presentation?',
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- Quiz ID (duplicate)
  'single-answer',
  '',
  3,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  0,
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  'In your introduction, that is why you need to identify them at the beginning',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  1,
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  'In the footnotes',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  2,
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  'In a follow-up email',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question 4
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  3,
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  'At the end of the presentation, but we need to identify their nature early as it might inform the development of the rest of the presentation',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  'quiz_id',
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '77bff2ea-052c-4d92-88d2-b18db431253f',
  'questions',
  '624d10b0-107e-4fe0-bd85-34d3bf46611a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
