-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: a356573e-a632-48b6-90fa-238238d9074a)
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2', -- Generated UUID for the question
  'There are many types of relationships that we use graphs to display. What chart type best communicates the ''Part-to-Whole'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  '47143f7a-0f73-4cb8-b941-93d4a75541e2',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91', -- Generated UUID for the question
  'What chart type best communicates the ''Correlation'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  '2c038b98-0fd8-4fe1-bfbe-ff74d6a8bd91',
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
  '09aafe57-e162-4304-9a88-be0459600404', -- Generated UUID for the question
  'What chart type best communicates the ''Time Series'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  '09aafe57-e162-4304-9a88-be0459600404',
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
  '09aafe57-e162-4304-9a88-be0459600404',
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
  '09aafe57-e162-4304-9a88-be0459600404',
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
  '09aafe57-e162-4304-9a88-be0459600404',
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
  '09aafe57-e162-4304-9a88-be0459600404',
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
  '09aafe57-e162-4304-9a88-be0459600404',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  '09aafe57-e162-4304-9a88-be0459600404',
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
  'f07259f6-516e-4277-bea9-881dc7361c29', -- Generated UUID for the question
  'What chart types best communicates the ''Deviation'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  'f07259f6-516e-4277-bea9-881dc7361c29',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  'f07259f6-516e-4277-bea9-881dc7361c29',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2', -- Generated UUID for the question
  'What chart type best communicates the ''Distribution'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  '0a1318b8-0a8c-40ef-bfa6-e224483cabc2',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1', -- Generated UUID for the question
  'What chart type best communicates the ''Nominal Comparison'' relationship',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  '84a889a7-92df-401e-87c6-34ea2e6065b1',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f', -- Generated UUID for the question
  'What chart type best communicates the ''Geospatial'' relationship?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  'daba736a-ed1d-43f1-b59c-753fe1f1ec8f',
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75', -- Generated UUID for the question
  'When should we use Pie Charts?',
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID
  'a356573e-a632-48b6-90fa-238238d9074a', -- Quiz ID (duplicate)
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
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
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
  'quiz_id',
  'a356573e-a632-48b6-90fa-238238d9074a',
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
  'a356573e-a632-48b6-90fa-238238d9074a',
  'questions',
  'cb7efd11-9afb-45b3-9dd6-cc3bdf92ed75',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c)
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
  'c5f58119-d511-44af-bf07-bf1a87642fc5', -- Generated UUID for the question
  'Why do we use contrast?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  'c5f58119-d511-44af-bf07-bf1a87642fc5',
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
  'c5f58119-d511-44af-bf07-bf1a87642fc5',
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
  'c5f58119-d511-44af-bf07-bf1a87642fc5',
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
  'c5f58119-d511-44af-bf07-bf1a87642fc5',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  'c5f58119-d511-44af-bf07-bf1a87642fc5',
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
  'b5c75cf5-7cd3-49a4-a4fc-aaa778432b69', -- Generated UUID for the question
  'How important is alignment?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  'b5c75cf5-7cd3-49a4-a4fc-aaa778432b69',
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
  'b5c75cf5-7cd3-49a4-a4fc-aaa778432b69',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  'b5c75cf5-7cd3-49a4-a4fc-aaa778432b69',
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
  '4bad7d12-d161-4547-937b-4a31e413c1e3', -- Generated UUID for the question
  'How is the principle of proximity helpful?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  '4bad7d12-d161-4547-937b-4a31e413c1e3',
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
  '4bad7d12-d161-4547-937b-4a31e413c1e3',
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
  '4bad7d12-d161-4547-937b-4a31e413c1e3',
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
  '4bad7d12-d161-4547-937b-4a31e413c1e3',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  '4bad7d12-d161-4547-937b-4a31e413c1e3',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b', -- Generated UUID for the question
  'How many different font types should you use in a single presentation?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  '90af2fdb-adf1-4dc0-9485-1714b2ebf73b',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd', -- Generated UUID for the question
  'How many colors should we use in a presentation?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  '6f76f1cf-2318-4211-967b-4d1c57fc97cd',
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
  'b262dc4e-925a-43a6-b710-f4d059b1b586', -- Generated UUID for the question
  'What should you do with whitespace?',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c', -- Quiz ID (duplicate)
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
  'b262dc4e-925a-43a6-b710-f4d059b1b586',
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
  'b262dc4e-925a-43a6-b710-f4d059b1b586',
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
  'b262dc4e-925a-43a6-b710-f4d059b1b586',
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
  'b262dc4e-925a-43a6-b710-f4d059b1b586',
  'quiz_id',
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
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
  'e83a8ba6-b6a6-48cf-89c1-47e1b9245b6c',
  'questions',
  'b262dc4e-925a-43a6-b710-f4d059b1b586',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: fe677ccc-485d-48ad-8a91-bdd3b02df42e)
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351', -- Generated UUID for the question
  'What is the bare assertion fallacy?',
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e', -- Quiz ID
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e', -- Quiz ID (duplicate)
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
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
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
  'quiz_id',
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e',
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
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e',
  'questions',
  '809fe2a2-8a94-45f4-8ba9-406a93184351',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597', -- Generated UUID for the question
  'What is graphical excellence?',
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e', -- Quiz ID
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e', -- Quiz ID (duplicate)
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
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
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
  'quiz_id',
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e',
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
  'fe677ccc-485d-48ad-8a91-bdd3b02df42e',
  'questions',
  '8e504b5e-7093-4c69-aa40-bcfac80df597',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7)
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
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a', -- Generated UUID for the question
  'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID (duplicate)
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
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a',
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
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a',
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
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a',
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
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a',
  'quiz_id',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
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
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
  'questions',
  '4e930f90-4607-422c-a77e-b7ff6ef8b74a',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf', -- Generated UUID for the question
  'The principle of similarity states that we tend to group things which share visual characteristics such as:',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID (duplicate)
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
  'quiz_id',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
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
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
  'questions',
  '8782ae12-4291-474f-a65a-3e6b544d6edf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf', -- Generated UUID for the question
  'What is symmetry associated with?',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID (duplicate)
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
  'quiz_id',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
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
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
  'questions',
  'fff18175-dc38-4de2-89a3-64f50782d8bf',
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
  '6e8b215b-97b3-4377-9512-14e57e6e14a9', -- Generated UUID for the question
  'What does the principle of connection state?',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7', -- Quiz ID (duplicate)
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
  '6e8b215b-97b3-4377-9512-14e57e6e14a9',
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
  '6e8b215b-97b3-4377-9512-14e57e6e14a9',
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
  '6e8b215b-97b3-4377-9512-14e57e6e14a9',
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
  '6e8b215b-97b3-4377-9512-14e57e6e14a9',
  'quiz_id',
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
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
  'fa7d3399-dcb3-483a-b4dd-dc20b7a7c9c7',
  'questions',
  '6e8b215b-97b3-4377-9512-14e57e6e14a9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: d1f548ea-6f0a-4530-8261-e32c9b7bca1d)
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c', -- Generated UUID for the question
  'What is the key to making brainstorming as effective as possible?',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID (duplicate)
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
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
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
  'quiz_id',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
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
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
  'questions',
  '17c7d9f4-dcb6-4628-bfd6-002903fafb1c',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca', -- Generated UUID for the question
  'What are our Cardinal Rules of brainstorming?',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID (duplicate)
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
  'quiz_id',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
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
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
  'questions',
  'b052945a-0b54-4ca5-ad89-e490cfa619ca',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e', -- Generated UUID for the question
  'What was the golden rule talked about in this lesson?',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d', -- Quiz ID (duplicate)
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
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
  '58305ade-3743-4929-8ddd-9c962ab8221e',
  'quiz_id',
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
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
  'd1f548ea-6f0a-4530-8261-e32c9b7bca1d',
  'questions',
  '58305ade-3743-4929-8ddd-9c962ab8221e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: f615b36d-747c-43b2-8b70-9df2aab269ad)
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0', -- Generated UUID for the question
  'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
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
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  '71e37202-522e-48b3-9d0b-eae08f2989f0',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54', -- Generated UUID for the question
  'Why are we creating our presentation?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  'fe9985ba-c1a8-4a36-9d97-c6f369db1f54',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce', -- Generated UUID for the question
  'What are they four parts to our introduction?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  '29e33278-1ac5-41dc-a4d9-de149ab789ce',
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
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8', -- Generated UUID for the question
  'What is the Context part of the Introduction?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8',
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
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8',
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
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8',
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
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  'f0bbfaa4-3efb-49f2-864c-7ae17a2fc7f8',
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
  '57385096-4b62-4085-956e-a95ff54fd034', -- Generated UUID for the question
  'What is the Catalyst portion of the Introduction?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  '57385096-4b62-4085-956e-a95ff54fd034',
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
  '57385096-4b62-4085-956e-a95ff54fd034',
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
  '57385096-4b62-4085-956e-a95ff54fd034',
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
  '57385096-4b62-4085-956e-a95ff54fd034',
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
  '57385096-4b62-4085-956e-a95ff54fd034',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  '57385096-4b62-4085-956e-a95ff54fd034',
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
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a', -- Generated UUID for the question
  'What is the Question portion of the Introduction?',
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID
  'f615b36d-747c-43b2-8b70-9df2aab269ad', -- Quiz ID (duplicate)
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
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a',
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
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a',
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
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a',
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
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a',
  'quiz_id',
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
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
  'f615b36d-747c-43b2-8b70-9df2aab269ad',
  'questions',
  'f5ad22e9-eb39-4eac-9dec-3ea63acfea0a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: beed38a4-22fc-496c-a77e-91a43935cff2)
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8', -- Generated UUID for the question
  'Why is it important to follow a process to develop a presentation?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
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
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  'c7f3e4ce-3c3b-4d3c-8602-c2e08b7f50b8',
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b', -- Generated UUID for the question
  'What is the 1st step of our process?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
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
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '92c8b7e1-9654-433d-8f3e-f594bd5a812b',
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2', -- Generated UUID for the question
  'What is the 2nd step of our process?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
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
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  'eb522c33-4929-4c37-a67a-8686f7ed92c2',
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3', -- Generated UUID for the question
  'What is the 3rd step of our process?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
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
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '9a6f6266-6f41-4e16-986f-e75ba0f0e6e3',
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8', -- Generated UUID for the question
  'What is the 4th step of our process?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
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
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '91aeec84-e28b-49a3-8cd2-9bc05d2286b8',
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
  '0dd6cedc-c51e-411a-9da5-f58cbc710622', -- Generated UUID for the question
  'Our first step is ''The Who''. What do we mean by this?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '0dd6cedc-c51e-411a-9da5-f58cbc710622',
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
  '0dd6cedc-c51e-411a-9da5-f58cbc710622',
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
  '0dd6cedc-c51e-411a-9da5-f58cbc710622',
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
  '0dd6cedc-c51e-411a-9da5-f58cbc710622',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '0dd6cedc-c51e-411a-9da5-f58cbc710622',
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
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d', -- Generated UUID for the question
  'The second step in our process is ''The Why''. What do we mean by this?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d',
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
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d',
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
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d',
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
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '46d7bb75-cae1-4036-a1d2-be8b4e7e483d',
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
  '95d8c34e-061c-4044-a381-efec366763ee', -- Generated UUID for the question
  'The third step in our process is ''The What''. What does ''The What'' focus on?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  '95d8c34e-061c-4044-a381-efec366763ee',
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
  '95d8c34e-061c-4044-a381-efec366763ee',
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
  '95d8c34e-061c-4044-a381-efec366763ee',
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
  '95d8c34e-061c-4044-a381-efec366763ee',
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
  '95d8c34e-061c-4044-a381-efec366763ee',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  '95d8c34e-061c-4044-a381-efec366763ee',
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
  'a388cb19-a19f-4f03-93e3-3917e782b032', -- Generated UUID for the question
  'The final step in our process is ''The How''. What is the focus of ''The How''?',
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID
  'beed38a4-22fc-496c-a77e-91a43935cff2', -- Quiz ID (duplicate)
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
  'a388cb19-a19f-4f03-93e3-3917e782b032',
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
  'a388cb19-a19f-4f03-93e3-3917e782b032',
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
  'a388cb19-a19f-4f03-93e3-3917e782b032',
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
  'a388cb19-a19f-4f03-93e3-3917e782b032',
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
  'a388cb19-a19f-4f03-93e3-3917e782b032',
  'quiz_id',
  'beed38a4-22fc-496c-a77e-91a43935cff2',
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
  'beed38a4-22fc-496c-a77e-91a43935cff2',
  'questions',
  'a388cb19-a19f-4f03-93e3-3917e782b032',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: 85cbccd5-a86f-4035-94f7-27da096a24a5)
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95', -- Generated UUID for the question
  'What are some of the fundamental elements and principles of design?',
  '85cbccd5-a86f-4035-94f7-27da096a24a5', -- Quiz ID
  '85cbccd5-a86f-4035-94f7-27da096a24a5', -- Quiz ID (duplicate)
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
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
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
  'quiz_id',
  '85cbccd5-a86f-4035-94f7-27da096a24a5',
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
  '85cbccd5-a86f-4035-94f7-27da096a24a5',
  'questions',
  '0566d091-dfb8-4ed7-8a77-aa06658fab95',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Performance Quiz (performance-quiz, ID: 85f3f239-e129-47b7-8d8e-4623f138a9d2)
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b', -- Generated UUID for the question
  'What can we do to try and set the right tone?',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID (duplicate)
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
  'quiz_id',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
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
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
  'questions',
  '13a6565f-356e-4d4a-a52f-e2a3b0933c9b',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d', -- Generated UUID for the question
  'What are some things you can do to manage stress?',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID (duplicate)
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
  'quiz_id',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
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
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
  'questions',
  '9ef1f0a8-118d-451b-bb03-31b17765425d',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb', -- Generated UUID for the question
  'What body language and delivery mistakes should you be on the lookout for?',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID
  '85f3f239-e129-47b7-8d8e-4623f138a9d2', -- Quiz ID (duplicate)
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
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
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
  'quiz_id',
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
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
  '85f3f239-e129-47b7-8d8e-4623f138a9d2',
  'questions',
  'f7a62081-0902-49d8-9dc2-48d8044dc1cb',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: 6694e4a1-1df1-4526-8775-0f501e1954f9)
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a', -- Generated UUID for the question
  'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  'ca21876e-6f6d-4375-a8c1-1e2d3131426a',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76', -- Generated UUID for the question
  'What is the first step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '07418aac-e4f7-4e9e-8260-64dee4f66c76',
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
  'e8bf250f-d746-4380-a22e-e78940b55312', -- Generated UUID for the question
  'What is the second step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  'e8bf250f-d746-4380-a22e-e78940b55312',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  'e8bf250f-d746-4380-a22e-e78940b55312',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9', -- Generated UUID for the question
  'What is the third step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '6333afb6-a21f-413e-969d-aab04d0cd0e9',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211', -- Generated UUID for the question
  'What is the fourth step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '649283ba-36b6-4e3b-9fa3-6d4e1a838211',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d', -- Generated UUID for the question
  'What is the fifth step pf the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '7f8521a6-89e6-4249-a1b2-2bdf91246b5d',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec', -- Generated UUID for the question
  'What is the sixth step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '2b947b9f-ae7e-4471-b03a-07b29dde2dec',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2', -- Generated UUID for the question
  'What is the seventh step of the recommended preparation process?',
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID
  '6694e4a1-1df1-4526-8775-0f501e1954f9', -- Quiz ID (duplicate)
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
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
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
  'quiz_id',
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
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
  '6694e4a1-1df1-4526-8775-0f501e1954f9',
  'questions',
  '79a59e82-22ea-44be-8c50-77ebb485c3d2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: a0ecff37-3623-4436-bbe0-5a184322d5ee)
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
  '325f223b-fa28-4539-9067-d803c10b9fc7', -- Generated UUID for the question
  'What goes in the headline?',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID (duplicate)
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
  '325f223b-fa28-4539-9067-d803c10b9fc7',
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
  '325f223b-fa28-4539-9067-d803c10b9fc7',
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
  '325f223b-fa28-4539-9067-d803c10b9fc7',
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
  '325f223b-fa28-4539-9067-d803c10b9fc7',
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
  '325f223b-fa28-4539-9067-d803c10b9fc7',
  'quiz_id',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
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
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
  'questions',
  '325f223b-fa28-4539-9067-d803c10b9fc7',
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d', -- Generated UUID for the question
  'What goes in the body of the slide?',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID (duplicate)
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
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
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
  'quiz_id',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
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
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
  'questions',
  '86960fbb-e053-46d4-9e47-b85f84417c4d',
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee', -- Generated UUID for the question
  'What is a swipe file?',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID (duplicate)
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
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
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
  'quiz_id',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
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
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
  'questions',
  '25541682-bd07-4b8e-809d-d4b53e2d51ee',
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3', -- Generated UUID for the question
  'When is the best time to use clip art?',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID (duplicate)
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
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
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
  'quiz_id',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
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
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
  'questions',
  '3b29fb14-e9cc-409f-ab52-5e13a0b3edf3',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e', -- Generated UUID for the question
  'What elements can be repeated on all slides?',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID
  'a0ecff37-3623-4436-bbe0-5a184322d5ee', -- Quiz ID (duplicate)
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
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
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
  'quiz_id',
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
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
  'a0ecff37-3623-4436-bbe0-5a184322d5ee',
  'questions',
  '601e5c7e-d67e-4811-9ab7-fafd83f9e70e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: 011e1134-8861-4da7-a459-c70c5672f3a9)
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3', -- Generated UUID for the question
  'What do we use Tornado diagrams for?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
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
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  '1d052913-9455-40d5-bccc-c2f88d8beec3',
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872', -- Generated UUID for the question
  'When do we use a Bubble Chart?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
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
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  'c20b08f0-a59e-48ab-ad8d-a895e3df8872',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac', -- Generated UUID for the question
  'What chart types should we try and avoid using?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  '0dfecab3-2793-4675-95fa-1d7eac199cac',
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261', -- Generated UUID for the question
  'What is the best use of a Waterfall Chart?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
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
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  '3d86bd0b-0f2f-438f-8516-654c28b51261',
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549', -- Generated UUID for the question
  'What is one of the more common uses of a Marimekko Chart?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
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
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  '21428bf5-8ee0-4443-b34d-36b6e044d549',
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e', -- Generated UUID for the question
  'What are Motion Charts used for?',
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID
  '011e1134-8861-4da7-a459-c70c5672f3a9', -- Quiz ID (duplicate)
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
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
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
  'quiz_id',
  '011e1134-8861-4da7-a459-c70c5672f3a9',
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
  '011e1134-8861-4da7-a459-c70c5672f3a9',
  'questions',
  '13a9c505-f57e-4eb6-8619-05fcda8aba3e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: 3d365bb4-c4f1-4168-a8b3-b273a61d5f5e)
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e', -- Generated UUID for the question
  'What is a storyboard?',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID (duplicate)
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
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
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
  'quiz_id',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
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
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
  'questions',
  '8669bb7a-89f6-4f93-9cd0-6dcf256f265e',
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7', -- Generated UUID for the question
  'Who invented storyboards?',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID (duplicate)
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
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
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
  'quiz_id',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
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
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
  'questions',
  '328d3a33-5bd1-4257-9176-4436e0e293b7',
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6', -- Generated UUID for the question
  'What was the great innovation of storyboarding?',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e', -- Quiz ID (duplicate)
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
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
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
  'quiz_id',
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
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
  '3d365bb4-c4f1-4168-a8b3-b273a61d5f5e',
  'questions',
  '03e3586e-c8ff-4e24-9099-f0a32102dbd6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: 6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32)
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0', -- Generated UUID for the question
  'What are the two approaches discussed in the lesson?',
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32', -- Quiz ID
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32', -- Quiz ID (duplicate)
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
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
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
  'quiz_id',
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32',
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
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32',
  'questions',
  '9144560c-8503-43a4-bc97-3c3db99d0ab0',
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c', -- Generated UUID for the question
  'What tools are recommended to use for storyboarding?',
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32', -- Quiz ID
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32', -- Quiz ID (duplicate)
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
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
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
  'quiz_id',
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32',
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
  '6739d3bf-6a48-4df1-9fb4-f2cfebc7fe32',
  'questions',
  'ceb9a111-407c-4ac2-a039-afc3ac068f4c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: 9625de10-90a2-4fdf-9ac5-a11d1b5c81a3)
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
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e', -- Generated UUID for the question
  'What is the principle of Abstraction?',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e',
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
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e',
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
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e',
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
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  'a130e03d-c4e4-4bd0-b63b-e1cec4a8552e',
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
  'b175f928-db10-4579-9143-b41d5d7b8982', -- Generated UUID for the question
  'Which lists are MECE (pick 2)',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  'b175f928-db10-4579-9143-b41d5d7b8982',
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
  'b175f928-db10-4579-9143-b41d5d7b8982',
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
  'b175f928-db10-4579-9143-b41d5d7b8982',
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
  'b175f928-db10-4579-9143-b41d5d7b8982',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  'b175f928-db10-4579-9143-b41d5d7b8982',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c', -- Generated UUID for the question
  'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  '418b3cc3-0d22-4722-af24-cec242fdbd9c',
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
  '1843d1e8-7700-4add-80cc-b0ebe3cb8822', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  '1843d1e8-7700-4add-80cc-b0ebe3cb8822',
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
  '1843d1e8-7700-4add-80cc-b0ebe3cb8822',
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
  '1843d1e8-7700-4add-80cc-b0ebe3cb8822',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  '1843d1e8-7700-4add-80cc-b0ebe3cb8822',
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
  '61f4ee4f-1db9-4607-94c7-6fc8fcf00235', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  '61f4ee4f-1db9-4607-94c7-6fc8fcf00235',
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
  '61f4ee4f-1db9-4607-94c7-6fc8fcf00235',
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
  '61f4ee4f-1db9-4607-94c7-6fc8fcf00235',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  '61f4ee4f-1db9-4607-94c7-6fc8fcf00235',
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01', -- Generated UUID for the question
  'What is the rule of 7 (updated)?',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3', -- Quiz ID (duplicate)
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
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
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
  'quiz_id',
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
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
  '9625de10-90a2-4fdf-9ac5-a11d1b5c81a3',
  'questions',
  '0ec3e69f-7bdb-4fef-b06d-3ee7cba32e01',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f)
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a', -- Generated UUID for the question
  'What are the two defining characteristics of Tables?',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID (duplicate)
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
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
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
  'quiz_id',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
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
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
  'questions',
  'd20dcce0-8e48-4684-8233-c9a4836baa7a',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993', -- Generated UUID for the question
  'What re some of the primary benefits of a table?',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID (duplicate)
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
  'quiz_id',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
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
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
  'questions',
  'faf4ddcb-f307-4b3f-971b-d6deccc95993',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9', -- Generated UUID for the question
  'What are some of the characteristics that define graphs?',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID (duplicate)
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
  'quiz_id',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
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
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
  'questions',
  '4dedfb2c-1d54-41b9-b060-2773486ef1b9',
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd', -- Generated UUID for the question
  'When should you use graphs?',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f', -- Quiz ID (duplicate)
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
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
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
  'quiz_id',
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
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
  'ba8fcefb-8fae-4e3d-87f3-afe7b11f8f3f',
  'questions',
  'ed1bd19a-818b-4fec-a28c-9b58774597dd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: 015a0335-90e0-4aa3-8562-03c9be80db87)
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad', -- Generated UUID for the question
  'Who is the hero of our presentation?',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
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
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  'bbba4de6-3a7a-4925-aaef-db4867c614ad',
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
  '88b3e755-6a91-4256-9dcb-bad23df3bf43', -- Generated UUID for the question
  'What is the Audience Map used for?',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  '88b3e755-6a91-4256-9dcb-bad23df3bf43',
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
  '88b3e755-6a91-4256-9dcb-bad23df3bf43',
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
  '88b3e755-6a91-4256-9dcb-bad23df3bf43',
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
  '88b3e755-6a91-4256-9dcb-bad23df3bf43',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  '88b3e755-6a91-4256-9dcb-bad23df3bf43',
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9', -- Generated UUID for the question
  'What are the 4 quadrants of the Audience Map?',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
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
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  '6ac4faf7-ac83-47c1-890d-84c1d31b00a9',
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
  '1560bd41-db6b-43b4-8120-b73b32555e90', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Personality'' quadrant',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  '1560bd41-db6b-43b4-8120-b73b32555e90',
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
  '1560bd41-db6b-43b4-8120-b73b32555e90',
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
  '1560bd41-db6b-43b4-8120-b73b32555e90',
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
  '1560bd41-db6b-43b4-8120-b73b32555e90',
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
  '1560bd41-db6b-43b4-8120-b73b32555e90',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  '1560bd41-db6b-43b4-8120-b73b32555e90',
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
  'da58d963-b13b-4178-8efc-203519b87a02', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Access'' quadrant',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  'da58d963-b13b-4178-8efc-203519b87a02',
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
  'da58d963-b13b-4178-8efc-203519b87a02',
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
  'da58d963-b13b-4178-8efc-203519b87a02',
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
  'da58d963-b13b-4178-8efc-203519b87a02',
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
  'da58d963-b13b-4178-8efc-203519b87a02',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  'da58d963-b13b-4178-8efc-203519b87a02',
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Power'' quadrant',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
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
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  'eae7ad7c-0939-452f-b442-8f2beb2fc1eb',
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Resistance'' quadrant',
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID
  '015a0335-90e0-4aa3-8562-03c9be80db87', -- Quiz ID (duplicate)
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
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
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
  'quiz_id',
  '015a0335-90e0-4aa3-8562-03c9be80db87',
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
  '015a0335-90e0-4aa3-8562-03c9be80db87',
  'questions',
  'b7b633b2-a423-4f34-9f10-b5f995bec020',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: f928bc39-b4c2-4614-aab0-0c3850f2689a)
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
  '7d580115-5011-4727-a6dd-a79163715349', -- Generated UUID for the question
  'Why are stories like a cup?',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID (duplicate)
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
  '7d580115-5011-4727-a6dd-a79163715349',
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
  '7d580115-5011-4727-a6dd-a79163715349',
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
  '7d580115-5011-4727-a6dd-a79163715349',
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
  '7d580115-5011-4727-a6dd-a79163715349',
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
  '7d580115-5011-4727-a6dd-a79163715349',
  'quiz_id',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
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
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
  'questions',
  '7d580115-5011-4727-a6dd-a79163715349',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38', -- Generated UUID for the question
  'What do stories add to our presentations? Why should be use them?',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID (duplicate)
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
  'quiz_id',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
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
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
  'questions',
  '78fb7495-bfc8-4e06-8fa3-6db6174a4c38',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2', -- Generated UUID for the question
  'What characteristics make stories memorable?',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID
  'f928bc39-b4c2-4614-aab0-0c3850f2689a', -- Quiz ID (duplicate)
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
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
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
  'quiz_id',
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
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
  'f928bc39-b4c2-4614-aab0-0c3850f2689a',
  'questions',
  'da865a41-6c0f-47b4-b019-8977a37f3ab2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: 95efcb52-6f38-487d-afec-5cc35eb20615)
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c', -- Generated UUID for the question
  'What is visual thinking?',
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID (duplicate)
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
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
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
  'quiz_id',
  '95efcb52-6f38-487d-afec-5cc35eb20615',
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
  '95efcb52-6f38-487d-afec-5cc35eb20615',
  'questions',
  '677a7443-6322-4cdc-9b2d-7334af81e81c',
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
  'e198ba5f-1edc-436f-be4b-f98167c1718e', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Conscious, sequential, and slow/hard''',
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID (duplicate)
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
  'e198ba5f-1edc-436f-be4b-f98167c1718e',
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
  'e198ba5f-1edc-436f-be4b-f98167c1718e',
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
  'e198ba5f-1edc-436f-be4b-f98167c1718e',
  'quiz_id',
  '95efcb52-6f38-487d-afec-5cc35eb20615',
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
  '95efcb52-6f38-487d-afec-5cc35eb20615',
  'questions',
  'e198ba5f-1edc-436f-be4b-f98167c1718e',
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
  '7188d341-f6ac-4860-8268-6365445f1a9e', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Below the level of consciousness, very rapid''',
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID (duplicate)
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
  '7188d341-f6ac-4860-8268-6365445f1a9e',
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
  '7188d341-f6ac-4860-8268-6365445f1a9e',
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
  '7188d341-f6ac-4860-8268-6365445f1a9e',
  'quiz_id',
  '95efcb52-6f38-487d-afec-5cc35eb20615',
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
  '95efcb52-6f38-487d-afec-5cc35eb20615',
  'questions',
  '7188d341-f6ac-4860-8268-6365445f1a9e',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f', -- Generated UUID for the question
  'What are the visual attribute triggers of pre-attentive processing?',
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID
  '95efcb52-6f38-487d-afec-5cc35eb20615', -- Quiz ID (duplicate)
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
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
  '1c19af9f-183c-449a-891a-cf68df685c4f',
  'quiz_id',
  '95efcb52-6f38-487d-afec-5cc35eb20615',
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
  '95efcb52-6f38-487d-afec-5cc35eb20615',
  'questions',
  '1c19af9f-183c-449a-891a-cf68df685c4f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: 10fbf6f4-ec9b-4b31-a01d-ac8479faae97)
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
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28', -- Generated UUID for the question
  'Who is Cicero?',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID (duplicate)
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
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28',
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
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28',
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
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28',
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
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28',
  'quiz_id',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
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
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
  'questions',
  '6c3c4eb5-2394-4455-aea5-b6c28e2f9e28',
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
  'aa6342cc-918b-4174-9990-9cab9ce783e7', -- Generated UUID for the question
  'What is the ultimate objective of our presentation?',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID (duplicate)
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
  'aa6342cc-918b-4174-9990-9cab9ce783e7',
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
  'aa6342cc-918b-4174-9990-9cab9ce783e7',
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
  'aa6342cc-918b-4174-9990-9cab9ce783e7',
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
  'aa6342cc-918b-4174-9990-9cab9ce783e7',
  'quiz_id',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
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
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
  'questions',
  'aa6342cc-918b-4174-9990-9cab9ce783e7',
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
  '0842318f-7212-45a4-a2d6-266785b9cfb9', -- Generated UUID for the question
  'Which of the following are reasonable next steps to follow your presentation?',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID (duplicate)
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
  '0842318f-7212-45a4-a2d6-266785b9cfb9',
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
  '0842318f-7212-45a4-a2d6-266785b9cfb9',
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
  '0842318f-7212-45a4-a2d6-266785b9cfb9',
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
  '0842318f-7212-45a4-a2d6-266785b9cfb9',
  'quiz_id',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
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
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
  'questions',
  '0842318f-7212-45a4-a2d6-266785b9cfb9',
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d', -- Generated UUID for the question
  'Where should the next steps go in your presentation?',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97', -- Quiz ID (duplicate)
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
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
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
  'quiz_id',
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
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
  '10fbf6f4-ec9b-4b31-a01d-ac8479faae97',
  'questions',
  '87345b8b-c8d3-4705-9102-c1cabee0dd5d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
