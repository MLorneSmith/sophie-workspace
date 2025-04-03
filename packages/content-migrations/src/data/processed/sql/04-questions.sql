-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: b6010dd2-93b4-4254-ae57-e47c68f2b2bf)
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7', -- Generated UUID for the question
  'There are many types of relationships that we use graphs to display. What chart type best communicates the ''Part-to-Whole'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '8d8a56f8-a441-4edf-8307-1c3a290fa3f7',
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
  '6df460f8-7139-43dc-958e-44380988fc61', -- Generated UUID for the question
  'What chart type best communicates the ''Correlation'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6df460f8-7139-43dc-958e-44380988fc61',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '6df460f8-7139-43dc-958e-44380988fc61',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262', -- Generated UUID for the question
  'What chart type best communicates the ''Time Series'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '6e7e02bd-7354-433a-bb8a-8306f0fbc262',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc', -- Generated UUID for the question
  'What chart types best communicates the ''Deviation'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  'b489af06-db24-42b4-817a-5dd762f5d8dc',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888', -- Generated UUID for the question
  'What chart type best communicates the ''Distribution'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '3d76c7db-c819-49ca-b227-e0b6e78b7888',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed', -- Generated UUID for the question
  'What chart type best communicates the ''Nominal Comparison'' relationship',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '0409710b-cbfb-4aa7-bfaa-61dbbdec15ed',
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
  'afb456a7-3261-41dd-9782-e19964d76057', -- Generated UUID for the question
  'What chart type best communicates the ''Geospatial'' relationship?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  'afb456a7-3261-41dd-9782-e19964d76057',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  'afb456a7-3261-41dd-9782-e19964d76057',
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e', -- Generated UUID for the question
  'When should we use Pie Charts?',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf', -- Quiz ID (duplicate)
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
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
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
  'quiz_id',
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
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
  'b6010dd2-93b4-4254-ae57-e47c68f2b2bf',
  'questions',
  '12ef0a7b-861f-4e5c-84d6-c24f0c89f36e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: 5488c575-5514-467c-9881-e412c0a633b6)
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
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6', -- Generated UUID for the question
  'Why do we use contrast?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6',
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
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6',
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
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6',
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
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  'c4a092d2-bcf1-4acf-bcfa-624fcb159da6',
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
  '75bbf4a6-0e38-411a-840b-f651c0615477', -- Generated UUID for the question
  'How important is alignment?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  '75bbf4a6-0e38-411a-840b-f651c0615477',
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
  '75bbf4a6-0e38-411a-840b-f651c0615477',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  '75bbf4a6-0e38-411a-840b-f651c0615477',
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
  'f050eaf3-747e-444e-ac17-5df680890db4', -- Generated UUID for the question
  'How is the principle of proximity helpful?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  'f050eaf3-747e-444e-ac17-5df680890db4',
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
  'f050eaf3-747e-444e-ac17-5df680890db4',
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
  'f050eaf3-747e-444e-ac17-5df680890db4',
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
  'f050eaf3-747e-444e-ac17-5df680890db4',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  'f050eaf3-747e-444e-ac17-5df680890db4',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14', -- Generated UUID for the question
  'How many different font types should you use in a single presentation?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  '438dcee9-3a0f-417d-943c-cfa7e21aab14',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446', -- Generated UUID for the question
  'How many colors should we use in a presentation?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  '9e00b012-e4a0-49ff-b2ff-8b735e225446',
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
  'bef5874a-66cb-44af-8106-d2ea8a202144', -- Generated UUID for the question
  'What should you do with whitespace?',
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID
  '5488c575-5514-467c-9881-e412c0a633b6', -- Quiz ID (duplicate)
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
  'bef5874a-66cb-44af-8106-d2ea8a202144',
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
  'bef5874a-66cb-44af-8106-d2ea8a202144',
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
  'bef5874a-66cb-44af-8106-d2ea8a202144',
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
  'bef5874a-66cb-44af-8106-d2ea8a202144',
  'quiz_id',
  '5488c575-5514-467c-9881-e412c0a633b6',
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
  '5488c575-5514-467c-9881-e412c0a633b6',
  'questions',
  'bef5874a-66cb-44af-8106-d2ea8a202144',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: 981d74ef-0947-49fc-b46e-100bac961963)
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043', -- Generated UUID for the question
  'What is the bare assertion fallacy?',
  '981d74ef-0947-49fc-b46e-100bac961963', -- Quiz ID
  '981d74ef-0947-49fc-b46e-100bac961963', -- Quiz ID (duplicate)
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
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
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
  'quiz_id',
  '981d74ef-0947-49fc-b46e-100bac961963',
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
  '981d74ef-0947-49fc-b46e-100bac961963',
  'questions',
  '33df42b3-38ea-424c-9ff3-a2762fa1a043',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2', -- Generated UUID for the question
  'What is graphical excellence?',
  '981d74ef-0947-49fc-b46e-100bac961963', -- Quiz ID
  '981d74ef-0947-49fc-b46e-100bac961963', -- Quiz ID (duplicate)
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
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
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
  'quiz_id',
  '981d74ef-0947-49fc-b46e-100bac961963',
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
  '981d74ef-0947-49fc-b46e-100bac961963',
  'questions',
  'd2dd42c1-383c-49e5-a769-334ef84848b2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: 3dae1e54-40ea-4b2a-adcb-248b3a063f49)
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
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6', -- Generated UUID for the question
  'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID (duplicate)
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
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6',
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
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6',
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
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6',
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
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6',
  'quiz_id',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
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
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
  'questions',
  'a677d46b-f8a5-4fb5-99cf-cb3b0fd0cde6',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625', -- Generated UUID for the question
  'The principle of similarity states that we tend to group things which share visual characteristics such as:',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID (duplicate)
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '11a9c821-af41-4a58-9d3a-4da26d983625',
  'quiz_id',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
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
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
  'questions',
  '11a9c821-af41-4a58-9d3a-4da26d983625',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630', -- Generated UUID for the question
  'What is symmetry associated with?',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID (duplicate)
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '3354dc9f-b693-484d-b0e7-f18860f25630',
  'quiz_id',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
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
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
  'questions',
  '3354dc9f-b693-484d-b0e7-f18860f25630',
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
  '78e50562-ba4e-434a-9c16-755c3fe62274', -- Generated UUID for the question
  'What does the principle of connection state?',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49', -- Quiz ID (duplicate)
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
  '78e50562-ba4e-434a-9c16-755c3fe62274',
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
  '78e50562-ba4e-434a-9c16-755c3fe62274',
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
  '78e50562-ba4e-434a-9c16-755c3fe62274',
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
  '78e50562-ba4e-434a-9c16-755c3fe62274',
  'quiz_id',
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
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
  '3dae1e54-40ea-4b2a-adcb-248b3a063f49',
  'questions',
  '78e50562-ba4e-434a-9c16-755c3fe62274',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: 12bb1e80-8d80-44da-af1a-a6ed12c3e42e)
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3', -- Generated UUID for the question
  'What is the key to making brainstorming as effective as possible?',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID (duplicate)
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
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
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
  'quiz_id',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
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
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
  'questions',
  'c4b40781-cf48-4a0e-9146-1809e36725f3',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045', -- Generated UUID for the question
  'What are our Cardinal Rules of brainstorming?',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID (duplicate)
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
  'quiz_id',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
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
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
  'questions',
  '2b1fa903-c8e6-42e3-b8e9-df3556522045',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d', -- Generated UUID for the question
  'What was the golden rule talked about in this lesson?',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e', -- Quiz ID (duplicate)
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
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
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
  'quiz_id',
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
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
  '12bb1e80-8d80-44da-af1a-a6ed12c3e42e',
  'questions',
  '2473c4c0-f8c3-47a1-86d3-0c22f5596d7d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: a293d567-d78d-485e-b987-181cc310be4d)
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
  '13546344-fe75-41db-90d8-71095ac12b96', -- Generated UUID for the question
  'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  '13546344-fe75-41db-90d8-71095ac12b96',
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
  '13546344-fe75-41db-90d8-71095ac12b96',
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
  '13546344-fe75-41db-90d8-71095ac12b96',
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
  '13546344-fe75-41db-90d8-71095ac12b96',
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
  '13546344-fe75-41db-90d8-71095ac12b96',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  '13546344-fe75-41db-90d8-71095ac12b96',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a', -- Generated UUID for the question
  'Why are we creating our presentation?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  '378a21a6-baf0-4e65-8423-83bbb636cb5a',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68', -- Generated UUID for the question
  'What are they four parts to our introduction?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  'f2077ca9-e255-401b-a92b-ac208d4b6c68',
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
  'bf20367d-d34a-4896-93e5-22b794c53c23', -- Generated UUID for the question
  'What is the Context part of the Introduction?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  'bf20367d-d34a-4896-93e5-22b794c53c23',
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
  'bf20367d-d34a-4896-93e5-22b794c53c23',
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
  'bf20367d-d34a-4896-93e5-22b794c53c23',
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
  'bf20367d-d34a-4896-93e5-22b794c53c23',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  'bf20367d-d34a-4896-93e5-22b794c53c23',
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7', -- Generated UUID for the question
  'What is the Catalyst portion of the Introduction?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
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
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  '3db6f1cb-7e90-4ba5-9ee6-ac70c3618ba7',
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
  '214b3338-3c7c-469f-a940-5ac793eb978e', -- Generated UUID for the question
  'What is the Question portion of the Introduction?',
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID
  'a293d567-d78d-485e-b987-181cc310be4d', -- Quiz ID (duplicate)
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
  '214b3338-3c7c-469f-a940-5ac793eb978e',
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
  '214b3338-3c7c-469f-a940-5ac793eb978e',
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
  '214b3338-3c7c-469f-a940-5ac793eb978e',
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
  '214b3338-3c7c-469f-a940-5ac793eb978e',
  'quiz_id',
  'a293d567-d78d-485e-b987-181cc310be4d',
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
  'a293d567-d78d-485e-b987-181cc310be4d',
  'questions',
  '214b3338-3c7c-469f-a940-5ac793eb978e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: a6f35c1b-1782-475d-995d-ee462f2d1e32)
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961', -- Generated UUID for the question
  'Why is it important to follow a process to develop a presentation?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
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
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  'e2a3da88-93c7-4f84-a42f-2c0bb91c7961',
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f', -- Generated UUID for the question
  'What is the 1st step of our process?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
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
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '889d4147-5c20-4bb9-bee6-fbb71d93059f',
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
  '6142d034-b29c-4970-bac0-2273572fe6b1', -- Generated UUID for the question
  'What is the 2nd step of our process?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '6142d034-b29c-4970-bac0-2273572fe6b1',
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
  '6142d034-b29c-4970-bac0-2273572fe6b1',
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
  '6142d034-b29c-4970-bac0-2273572fe6b1',
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
  '6142d034-b29c-4970-bac0-2273572fe6b1',
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
  '6142d034-b29c-4970-bac0-2273572fe6b1',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '6142d034-b29c-4970-bac0-2273572fe6b1',
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
  '1a43bf42-bc10-4987-b295-b14c359768f5', -- Generated UUID for the question
  'What is the 3rd step of our process?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '1a43bf42-bc10-4987-b295-b14c359768f5',
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
  '1a43bf42-bc10-4987-b295-b14c359768f5',
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
  '1a43bf42-bc10-4987-b295-b14c359768f5',
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
  '1a43bf42-bc10-4987-b295-b14c359768f5',
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
  '1a43bf42-bc10-4987-b295-b14c359768f5',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '1a43bf42-bc10-4987-b295-b14c359768f5',
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
  '555e80fe-c617-41ef-8a2c-3af42db33843', -- Generated UUID for the question
  'What is the 4th step of our process?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '555e80fe-c617-41ef-8a2c-3af42db33843',
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
  '555e80fe-c617-41ef-8a2c-3af42db33843',
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
  '555e80fe-c617-41ef-8a2c-3af42db33843',
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
  '555e80fe-c617-41ef-8a2c-3af42db33843',
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
  '555e80fe-c617-41ef-8a2c-3af42db33843',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '555e80fe-c617-41ef-8a2c-3af42db33843',
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
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c', -- Generated UUID for the question
  'Our first step is ''The Who''. What do we mean by this?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c',
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
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c',
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
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c',
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
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '8a0a2b92-ce8e-48a7-92e1-0752d431177c',
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
  '6a298370-5903-4bd3-950f-5b2257ff1ea2', -- Generated UUID for the question
  'The second step in our process is ''The Why''. What do we mean by this?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '6a298370-5903-4bd3-950f-5b2257ff1ea2',
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
  '6a298370-5903-4bd3-950f-5b2257ff1ea2',
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
  '6a298370-5903-4bd3-950f-5b2257ff1ea2',
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
  '6a298370-5903-4bd3-950f-5b2257ff1ea2',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '6a298370-5903-4bd3-950f-5b2257ff1ea2',
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
  '05932d58-3720-4b54-adeb-bf23bc00e317', -- Generated UUID for the question
  'The third step in our process is ''The What''. What does ''The What'' focus on?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '05932d58-3720-4b54-adeb-bf23bc00e317',
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
  '05932d58-3720-4b54-adeb-bf23bc00e317',
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
  '05932d58-3720-4b54-adeb-bf23bc00e317',
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
  '05932d58-3720-4b54-adeb-bf23bc00e317',
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
  '05932d58-3720-4b54-adeb-bf23bc00e317',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '05932d58-3720-4b54-adeb-bf23bc00e317',
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b', -- Generated UUID for the question
  'The final step in our process is ''The How''. What is the focus of ''The How''?',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID
  'a6f35c1b-1782-475d-995d-ee462f2d1e32', -- Quiz ID (duplicate)
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
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
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
  'quiz_id',
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
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
  'a6f35c1b-1782-475d-995d-ee462f2d1e32',
  'questions',
  '078b30ec-984d-4f44-b3f8-1357a5b09b8b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: 7df4291f-110d-4790-9014-c34d997bd55d)
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b', -- Generated UUID for the question
  'What are some of the fundamental elements and principles of design?',
  '7df4291f-110d-4790-9014-c34d997bd55d', -- Quiz ID
  '7df4291f-110d-4790-9014-c34d997bd55d', -- Quiz ID (duplicate)
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
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
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
  'quiz_id',
  '7df4291f-110d-4790-9014-c34d997bd55d',
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
  '7df4291f-110d-4790-9014-c34d997bd55d',
  'questions',
  'fa72e1a8-cf44-4393-a0f7-043adf5ca80b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Performance Quiz (performance-quiz, ID: d3b2f7d8-af40-4329-a654-e5505f663473)
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1', -- Generated UUID for the question
  'What can we do to try and set the right tone?',
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID (duplicate)
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
  'quiz_id',
  'd3b2f7d8-af40-4329-a654-e5505f663473',
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
  'd3b2f7d8-af40-4329-a654-e5505f663473',
  'questions',
  '46f79437-6d65-42ac-8a25-142685e8c1c1',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d', -- Generated UUID for the question
  'What are some things you can do to manage stress?',
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID (duplicate)
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
  'quiz_id',
  'd3b2f7d8-af40-4329-a654-e5505f663473',
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
  'd3b2f7d8-af40-4329-a654-e5505f663473',
  'questions',
  'd7a35489-8aa7-4937-a55b-df3531d1223d',
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
  'bc094dfe-109f-4319-9913-4fa529362372', -- Generated UUID for the question
  'What body language and delivery mistakes should you be on the lookout for?',
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID
  'd3b2f7d8-af40-4329-a654-e5505f663473', -- Quiz ID (duplicate)
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
  'bc094dfe-109f-4319-9913-4fa529362372',
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
  'bc094dfe-109f-4319-9913-4fa529362372',
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
  'bc094dfe-109f-4319-9913-4fa529362372',
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
  'bc094dfe-109f-4319-9913-4fa529362372',
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
  'bc094dfe-109f-4319-9913-4fa529362372',
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
  'bc094dfe-109f-4319-9913-4fa529362372',
  'quiz_id',
  'd3b2f7d8-af40-4329-a654-e5505f663473',
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
  'd3b2f7d8-af40-4329-a654-e5505f663473',
  'questions',
  'bc094dfe-109f-4319-9913-4fa529362372',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: d7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c)
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483', -- Generated UUID for the question
  'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  '8b4cc08a-80a3-4754-9059-8ccf2d408483',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284', -- Generated UUID for the question
  'What is the first step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  'aab97ac2-afa3-436a-936a-7ace113a8284',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  'aab97ac2-afa3-436a-936a-7ace113a8284',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de', -- Generated UUID for the question
  'What is the second step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  '335703cd-2664-4e66-bebe-7bb41f69d7de',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed', -- Generated UUID for the question
  'What is the third step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  '802dc92a-5ba9-4ef1-9e7a-3898914ee1ed',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356', -- Generated UUID for the question
  'What is the fourth step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  'bd57b7d3-8a7f-401c-9348-c532ce2a5356',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964', -- Generated UUID for the question
  'What is the fifth step pf the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  '29643b0f-3d2b-40d6-9169-9e5808003964',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  '29643b0f-3d2b-40d6-9169-9e5808003964',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec', -- Generated UUID for the question
  'What is the sixth step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  'aaf308a1-1729-41aa-82d6-0e2eea34c1ec',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af', -- Generated UUID for the question
  'What is the seventh step of the recommended preparation process?',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c', -- Quiz ID (duplicate)
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
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
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
  'quiz_id',
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
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
  'd7f7583f-f8ba-4a72-b01d-cd5cd7d7aa2c',
  'questions',
  'ea7e77ed-39ce-4c25-adab-3ff8d762e6af',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: f6c8438b-e082-4439-95c3-4b792a5805ed)
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608', -- Generated UUID for the question
  'What goes in the headline?',
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID (duplicate)
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
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
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
  'quiz_id',
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
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
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
  'questions',
  '8db33d5f-46ec-4ae2-8d70-f58227497608',
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6', -- Generated UUID for the question
  'What goes in the body of the slide?',
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID (duplicate)
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
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
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
  'quiz_id',
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
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
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
  'questions',
  '38c31e29-2574-4ca4-9de1-08735c2ed5b6',
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
  'd5f8d437-017d-4d16-901a-d646ee58e102', -- Generated UUID for the question
  'What is a swipe file?',
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID (duplicate)
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
  'd5f8d437-017d-4d16-901a-d646ee58e102',
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
  'd5f8d437-017d-4d16-901a-d646ee58e102',
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
  'd5f8d437-017d-4d16-901a-d646ee58e102',
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
  'd5f8d437-017d-4d16-901a-d646ee58e102',
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
  'd5f8d437-017d-4d16-901a-d646ee58e102',
  'quiz_id',
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
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
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
  'questions',
  'd5f8d437-017d-4d16-901a-d646ee58e102',
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64', -- Generated UUID for the question
  'When is the best time to use clip art?',
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID (duplicate)
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
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
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
  'quiz_id',
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
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
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
  'questions',
  'c8e08ec0-490c-4cb2-ae78-e7b249320f64',
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
  '9f64345e-431d-404e-83aa-476104a7aea8', -- Generated UUID for the question
  'What elements can be repeated on all slides?',
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID
  'f6c8438b-e082-4439-95c3-4b792a5805ed', -- Quiz ID (duplicate)
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
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
  '9f64345e-431d-404e-83aa-476104a7aea8',
  'quiz_id',
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
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
  'f6c8438b-e082-4439-95c3-4b792a5805ed',
  'questions',
  '9f64345e-431d-404e-83aa-476104a7aea8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: 7fa21e5f-efdd-45d3-9a52-092b64929cdf)
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5', -- Generated UUID for the question
  'What do we use Tornado diagrams for?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
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
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  'd0784d4e-9fed-49b4-816e-41c32c76cbf5',
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a', -- Generated UUID for the question
  'When do we use a Bubble Chart?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
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
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  '06d0bc4b-d530-441f-b7d6-f3027511463a',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49', -- Generated UUID for the question
  'What chart types should we try and avoid using?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '89325f7e-dc58-4511-8515-acb5058c7e49',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  '89325f7e-dc58-4511-8515-acb5058c7e49',
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475', -- Generated UUID for the question
  'What is the best use of a Waterfall Chart?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
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
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  '0edc5dd1-26ad-424f-a7ca-b1b2ac94d475',
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695', -- Generated UUID for the question
  'What is one of the more common uses of a Marimekko Chart?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
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
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  '69fe605e-a659-4835-92fc-8a34dd9c3695',
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8', -- Generated UUID for the question
  'What are Motion Charts used for?',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf', -- Quiz ID (duplicate)
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
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
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
  'quiz_id',
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
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
  '7fa21e5f-efdd-45d3-9a52-092b64929cdf',
  'questions',
  'e7e6d317-7d11-46cf-bab6-4847e36e15d8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: bd4a472b-8ccf-4c12-9029-b4ca7970b215)
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79', -- Generated UUID for the question
  'What is a storyboard?',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID (duplicate)
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
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
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
  'quiz_id',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
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
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
  'questions',
  '4315b50b-95ee-46df-9fe8-c4db99f18e79',
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b', -- Generated UUID for the question
  'Who invented storyboards?',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID (duplicate)
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
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
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
  'quiz_id',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
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
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
  'questions',
  '5d6fc756-1ef9-4a4c-8bb4-d49ec4a1a62b',
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
  'd21f5e07-fb46-40dc-b340-edd133113e14', -- Generated UUID for the question
  'What was the great innovation of storyboarding?',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215', -- Quiz ID (duplicate)
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
  'd21f5e07-fb46-40dc-b340-edd133113e14',
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
  'd21f5e07-fb46-40dc-b340-edd133113e14',
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
  'd21f5e07-fb46-40dc-b340-edd133113e14',
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
  'd21f5e07-fb46-40dc-b340-edd133113e14',
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
  'd21f5e07-fb46-40dc-b340-edd133113e14',
  'quiz_id',
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
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
  'bd4a472b-8ccf-4c12-9029-b4ca7970b215',
  'questions',
  'd21f5e07-fb46-40dc-b340-edd133113e14',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: 93df0e14-7963-4e74-842d-55c8fd4ea62f)
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4', -- Generated UUID for the question
  'What are the two approaches discussed in the lesson?',
  '93df0e14-7963-4e74-842d-55c8fd4ea62f', -- Quiz ID
  '93df0e14-7963-4e74-842d-55c8fd4ea62f', -- Quiz ID (duplicate)
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
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
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
  'quiz_id',
  '93df0e14-7963-4e74-842d-55c8fd4ea62f',
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
  '93df0e14-7963-4e74-842d-55c8fd4ea62f',
  'questions',
  'a0cbedbc-6bf1-4bf2-8797-56f12ab9ebb4',
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e', -- Generated UUID for the question
  'What tools are recommended to use for storyboarding?',
  '93df0e14-7963-4e74-842d-55c8fd4ea62f', -- Quiz ID
  '93df0e14-7963-4e74-842d-55c8fd4ea62f', -- Quiz ID (duplicate)
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
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
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
  'quiz_id',
  '93df0e14-7963-4e74-842d-55c8fd4ea62f',
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
  '93df0e14-7963-4e74-842d-55c8fd4ea62f',
  'questions',
  '6e3c4971-cb00-4c7f-a5d8-6f3ecf63089e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: 18098e01-0e85-42d0-be8c-c60a47dc5318)
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
  'a7d7d068-a882-4af2-8073-5600e5c02f81', -- Generated UUID for the question
  'What is the principle of Abstraction?',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  'a7d7d068-a882-4af2-8073-5600e5c02f81',
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
  'a7d7d068-a882-4af2-8073-5600e5c02f81',
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
  'a7d7d068-a882-4af2-8073-5600e5c02f81',
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
  'a7d7d068-a882-4af2-8073-5600e5c02f81',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  'a7d7d068-a882-4af2-8073-5600e5c02f81',
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
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af', -- Generated UUID for the question
  'Which lists are MECE (pick 2)',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af',
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
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af',
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
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af',
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
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  '7c7d07d3-96ae-4c7b-be8f-4355bbe4e5af',
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
  '77131a91-9176-4386-9444-de5921f939ee', -- Generated UUID for the question
  'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
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
  '77131a91-9176-4386-9444-de5921f939ee',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  '77131a91-9176-4386-9444-de5921f939ee',
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
  'deecbd46-e7e0-4dff-a98e-c27131eb8203', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  'deecbd46-e7e0-4dff-a98e-c27131eb8203',
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
  'deecbd46-e7e0-4dff-a98e-c27131eb8203',
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
  'deecbd46-e7e0-4dff-a98e-c27131eb8203',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  'deecbd46-e7e0-4dff-a98e-c27131eb8203',
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
  '928bb6fa-0571-46e0-b7e1-0a3723890e0d', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  '928bb6fa-0571-46e0-b7e1-0a3723890e0d',
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
  '928bb6fa-0571-46e0-b7e1-0a3723890e0d',
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
  '928bb6fa-0571-46e0-b7e1-0a3723890e0d',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  '928bb6fa-0571-46e0-b7e1-0a3723890e0d',
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc', -- Generated UUID for the question
  'What is the rule of 7 (updated)?',
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID
  '18098e01-0e85-42d0-be8c-c60a47dc5318', -- Quiz ID (duplicate)
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
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
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
  'quiz_id',
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
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
  '18098e01-0e85-42d0-be8c-c60a47dc5318',
  'questions',
  '0edd64c3-4d7b-4a16-b097-154266d8c1dc',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: 3a98d6e7-73e5-4e6f-850f-763b45688a5a)
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd', -- Generated UUID for the question
  'What are the two defining characteristics of Tables?',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID (duplicate)
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
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
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
  'quiz_id',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
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
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
  'questions',
  '4023a5b8-59b3-477c-ad75-4fa27397a2fd',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084', -- Generated UUID for the question
  'What re some of the primary benefits of a table?',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID (duplicate)
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
  'quiz_id',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
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
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
  'questions',
  '86e55ab7-9a25-4f85-a0c0-830ceca85084',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca', -- Generated UUID for the question
  'What are some of the characteristics that define graphs?',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID (duplicate)
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
  'quiz_id',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
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
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
  'questions',
  '5398f85b-4718-49da-86f2-7e30287ce8ca',
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9', -- Generated UUID for the question
  'When should you use graphs?',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a', -- Quiz ID (duplicate)
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
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
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
  'quiz_id',
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
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
  '3a98d6e7-73e5-4e6f-850f-763b45688a5a',
  'questions',
  'f608ba6f-c206-4e5e-9675-659ba12ffdb9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: 15967b00-f449-48a0-9fc1-7ca0fc0623b6)
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df', -- Generated UUID for the question
  'Who is the hero of our presentation?',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
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
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  '182d0e22-0d24-4563-bdd7-12637b78a5df',
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
  'aea98aef-a45b-4e16-b638-6d15d2f675db', -- Generated UUID for the question
  'What is the Audience Map used for?',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  'aea98aef-a45b-4e16-b638-6d15d2f675db',
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
  'aea98aef-a45b-4e16-b638-6d15d2f675db',
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
  'aea98aef-a45b-4e16-b638-6d15d2f675db',
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
  'aea98aef-a45b-4e16-b638-6d15d2f675db',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  'aea98aef-a45b-4e16-b638-6d15d2f675db',
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867', -- Generated UUID for the question
  'What are the 4 quadrants of the Audience Map?',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
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
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  '96fb6683-0952-4e46-adc0-b9b4c6f69867',
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Personality'' quadrant',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
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
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  '9b889444-dab6-4cf6-ae2a-8ee8f7be5e73',
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Access'' quadrant',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
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
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  'f99d6c98-6b1a-4d0e-9222-ede47cd1c3d8',
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Power'' quadrant',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
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
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  'ad8d11e8-bb8c-4410-a97d-5bc640662201',
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Resistance'' quadrant',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6', -- Quiz ID (duplicate)
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
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
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
  'quiz_id',
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
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
  '15967b00-f449-48a0-9fc1-7ca0fc0623b6',
  'questions',
  '3e721cde-34d2-4d00-ba1c-0b561a83da0d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: 250f27c1-f1c4-4181-bbe9-ed29d2a7968f)
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1', -- Generated UUID for the question
  'Why are stories like a cup?',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID (duplicate)
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
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
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
  'quiz_id',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
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
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
  'questions',
  '79750b2d-70f8-4a6e-955d-b260421f08e1',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7', -- Generated UUID for the question
  'What do stories add to our presentations? Why should be use them?',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID (duplicate)
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
  'quiz_id',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
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
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
  'questions',
  'ca6c9dbb-dba1-447a-b519-ed88f3839ce7',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b', -- Generated UUID for the question
  'What characteristics make stories memorable?',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f', -- Quiz ID (duplicate)
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
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
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
  'quiz_id',
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
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
  '250f27c1-f1c4-4181-bbe9-ed29d2a7968f',
  'questions',
  '82009546-5398-43ad-b0c5-7147f6c64b9b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: cfc44b63-ddc8-4099-8773-1207b2e86ded)
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470', -- Generated UUID for the question
  'What is visual thinking?',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID (duplicate)
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
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
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
  'quiz_id',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
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
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
  'questions',
  '0bd07f9d-c90a-4171-84e7-1ab1cc26b470',
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
  'bb6a6c88-0364-41d1-b1fe-69a18e4e2bb9', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Conscious, sequential, and slow/hard''',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID (duplicate)
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
  'bb6a6c88-0364-41d1-b1fe-69a18e4e2bb9',
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
  'bb6a6c88-0364-41d1-b1fe-69a18e4e2bb9',
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
  'bb6a6c88-0364-41d1-b1fe-69a18e4e2bb9',
  'quiz_id',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
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
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
  'questions',
  'bb6a6c88-0364-41d1-b1fe-69a18e4e2bb9',
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
  '3b064067-bb73-46b6-9580-e2f270c30796', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Below the level of consciousness, very rapid''',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID (duplicate)
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
  '3b064067-bb73-46b6-9580-e2f270c30796',
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
  '3b064067-bb73-46b6-9580-e2f270c30796',
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
  '3b064067-bb73-46b6-9580-e2f270c30796',
  'quiz_id',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
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
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
  'questions',
  '3b064067-bb73-46b6-9580-e2f270c30796',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1', -- Generated UUID for the question
  'What are the visual attribute triggers of pre-attentive processing?',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID
  'cfc44b63-ddc8-4099-8773-1207b2e86ded', -- Quiz ID (duplicate)
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
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
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
  'quiz_id',
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
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
  'cfc44b63-ddc8-4099-8773-1207b2e86ded',
  'questions',
  '98d77df1-bfbf-4814-8a5e-94d50f2458c1',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: c720ea42-6b2f-424f-be44-c8af3424ee70)
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
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24', -- Generated UUID for the question
  'Who is Cicero?',
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID (duplicate)
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
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24',
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
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24',
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
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24',
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
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24',
  'quiz_id',
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
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
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
  'questions',
  '6be9d10b-2ad9-47b0-af46-931c4edc6d24',
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
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8', -- Generated UUID for the question
  'What is the ultimate objective of our presentation?',
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID (duplicate)
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
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8',
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
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8',
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
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8',
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
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8',
  'quiz_id',
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
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
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
  'questions',
  '249a3f7a-f05d-43c7-9922-e8daaf2ae6b8',
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
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6', -- Generated UUID for the question
  'Which of the following are reasonable next steps to follow your presentation?',
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID (duplicate)
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
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6',
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
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6',
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
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6',
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
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6',
  'quiz_id',
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
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
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
  'questions',
  'bb1cc407-55a3-43c8-ba6c-785dbd9ed0d6',
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
  '1439653a-d303-4f8d-a504-250c9800ecfc', -- Generated UUID for the question
  'Where should the next steps go in your presentation?',
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID
  'c720ea42-6b2f-424f-be44-c8af3424ee70', -- Quiz ID (duplicate)
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
  '1439653a-d303-4f8d-a504-250c9800ecfc',
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
  '1439653a-d303-4f8d-a504-250c9800ecfc',
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
  '1439653a-d303-4f8d-a504-250c9800ecfc',
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
  '1439653a-d303-4f8d-a504-250c9800ecfc',
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
  '1439653a-d303-4f8d-a504-250c9800ecfc',
  'quiz_id',
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
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
  'c720ea42-6b2f-424f-be44-c8af3424ee70',
  'questions',
  '1439653a-d303-4f8d-a504-250c9800ecfc',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
