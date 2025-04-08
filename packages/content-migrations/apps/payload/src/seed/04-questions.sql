-- Seed data for the quiz questions table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

-- Insert question for quiz: Basic Graphs
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b', -- UUID for the question
  'Which type of graph is best for showing trends over time?',
  'c11dbb26-7561-4d12-88c8-141c653a43fd', -- Quiz ID
  'c11dbb26-7561-4d12-88c8-141c653a43fd', -- Quiz ID (duplicate)
  'multiple_choice',
  'Line graphs are ideal for showing how values change over a continuous period of time.',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question
INSERT INTO payload.quiz_questions_options (
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  'Pie chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question
INSERT INTO payload.quiz_questions_options (
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  'Line graph',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question
INSERT INTO payload.quiz_questions_options (
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  'Bar chart',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question
INSERT INTO payload.quiz_questions_options (
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  'Scatter plot',
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
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  'quiz_id',
  'c11dbb26-7561-4d12-88c8-141c653a43fd',
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
  'c11dbb26-7561-4d12-88c8-141c653a43fd',
  'questions',
  '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question for quiz: Elements of Design in Detail
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- UUID for the question
  'Which design element is primarily concerned with the arrangement of visual elements?',
  '42564568-76bb-4405-88a9-8e9fd0a9154a', -- Quiz ID
  '42564568-76bb-4405-88a9-8e9fd0a9154a', -- Quiz ID (duplicate)
  'multiple_choice',
  'Composition refers to the arrangement of visual elements in a design.',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question
INSERT INTO payload.quiz_questions_options (
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Color',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question
INSERT INTO payload.quiz_questions_options (
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Composition',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question
INSERT INTO payload.quiz_questions_options (
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Typography',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question
INSERT INTO payload.quiz_questions_options (
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Contrast',
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
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'quiz_id',
  '42564568-76bb-4405-88a9-8e9fd0a9154a',
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
  '42564568-76bb-4405-88a9-8e9fd0a9154a',
  'questions',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question for quiz: Fact and Persuasion
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', -- UUID for the question
  'What is the most effective way to present statistical data in a persuasive presentation?',
  '791e27de-2c98-49ef-b684-6c88667d1571', -- Quiz ID
  '791e27de-2c98-49ef-b684-6c88667d1571', -- Quiz ID (duplicate)
  'multiple_choice',
  'Focusing on the most compelling statistics helps maintain audience attention and strengthens your argument.',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question
INSERT INTO payload.quiz_questions_options (
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'Present all available data',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question
INSERT INTO payload.quiz_questions_options (
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'Focus on the most compelling statistics',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question
INSERT INTO payload.quiz_questions_options (
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'Avoid using numbers entirely',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question
INSERT INTO payload.quiz_questions_options (
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'Only use percentages, never absolute numbers',
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
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'quiz_id',
  '791e27de-2c98-49ef-b684-6c88667d1571',
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
  '791e27de-2c98-49ef-b684-6c88667d1571',
  'questions',
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert question for quiz: Gestalt Principles
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', -- UUID for the question
  'Which Gestalt principle states that elements that are similar will be perceived as belonging together?',
  '3c72b383-e17e-4b07-8a47-451cfbff29c0', -- Quiz ID
  '3c72b383-e17e-4b07-8a47-451cfbff29c0', -- Quiz ID (duplicate)
  'multiple_choice',
  'The principle of Similarity states that elements sharing visual characteristics (shape, color, size, etc.) are perceived as related.',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Insert option 1 for question
INSERT INTO payload.quiz_questions_options (
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'Proximity',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 2 for question
INSERT INTO payload.quiz_questions_options (
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'Similarity',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 3 for question
INSERT INTO payload.quiz_questions_options (
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'Continuity',
  false,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

-- Insert option 4 for question
INSERT INTO payload.quiz_questions_options (
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'Closure',
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
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  'quiz_id',
  '3c72b383-e17e-4b07-8a47-451cfbff29c0',
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
  '3c72b383-e17e-4b07-8a47-451cfbff29c0',
  'questions',
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
