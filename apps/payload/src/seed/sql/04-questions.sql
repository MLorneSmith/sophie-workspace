-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: a6e6e1d0-ffff-44f4-82cd-c27f6d86508b)
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e', -- Generated UUID for the question
  'There are many types of relationships that we use graphs to display. What chart type best communicates the ''Part-to-Whole'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  '18f5f4cb-bcfc-4bfd-ab56-d1e0786cff3e',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93', -- Generated UUID for the question
  'What chart type best communicates the ''Correlation'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  '60419823-bf8a-4536-9ff5-1a8fa15b1e93',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9', -- Generated UUID for the question
  'What chart type best communicates the ''Time Series'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  'fe5eb1e7-06de-4ab3-a3b5-938508ecf8e9',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec', -- Generated UUID for the question
  'What chart types best communicates the ''Deviation'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  'ca39bf1c-ab57-4f4c-aed5-5576c6b411ec',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8', -- Generated UUID for the question
  'What chart type best communicates the ''Distribution'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  '59805fe4-2004-4abd-8eb7-227cb50741a8',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147', -- Generated UUID for the question
  'What chart type best communicates the ''Nominal Comparison'' relationship',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  '2ff8b241-74d3-48b1-8ab4-eb95e75be147',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6', -- Generated UUID for the question
  'What chart type best communicates the ''Geospatial'' relationship?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  'da41b77b-7c9a-4f38-9000-433e0d7622b6',
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999', -- Generated UUID for the question
  'When should we use Pie Charts?',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b', -- Quiz ID (duplicate)
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
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
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
  'quiz_id',
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6e6e1d0-ffff-44f4-82cd-c27f6d86508b',
  'questions',
  '60d74a59-e9c5-46dd-9b23-8c837a2a1999',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: a226ae85-03fb-456f-bb7c-26fb3eca9332)
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
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d', -- Generated UUID for the question
  'Why do we use contrast?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d',
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
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d',
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
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d',
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
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  'df0da2c1-5b86-46e3-9c54-baf600dfa62d',
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
  '890dc6e6-4e3a-4701-add1-dc6b8769d504', -- Generated UUID for the question
  'How important is alignment?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  '890dc6e6-4e3a-4701-add1-dc6b8769d504',
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
  '890dc6e6-4e3a-4701-add1-dc6b8769d504',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  '890dc6e6-4e3a-4701-add1-dc6b8769d504',
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
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f', -- Generated UUID for the question
  'How is the principle of proximity helpful?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f',
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
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f',
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
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f',
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
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  '15cb19c7-59b0-47d9-b75e-6afa5b84c31f',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e', -- Generated UUID for the question
  'How many different font types should you use in a single presentation?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  '30067117-b824-4e4d-a369-c7a29b69bc9e',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07', -- Generated UUID for the question
  'How many colors should we use in a presentation?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  '31cf32f2-03e2-4750-9e8c-e4463d070c07',
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
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a', -- Generated UUID for the question
  'What should you do with whitespace?',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID
  'a226ae85-03fb-456f-bb7c-26fb3eca9332', -- Quiz ID (duplicate)
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
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a',
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
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a',
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
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a',
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
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a',
  'quiz_id',
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a226ae85-03fb-456f-bb7c-26fb3eca9332',
  'questions',
  '8e0e62e4-51b9-4974-82cf-fdafec037b3a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: b3a7ac6a-3e4e-4a16-aa16-298248785984)
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6', -- Generated UUID for the question
  'What is the bare assertion fallacy?',
  'b3a7ac6a-3e4e-4a16-aa16-298248785984', -- Quiz ID
  'b3a7ac6a-3e4e-4a16-aa16-298248785984', -- Quiz ID (duplicate)
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
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
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
  'quiz_id',
  'b3a7ac6a-3e4e-4a16-aa16-298248785984',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b3a7ac6a-3e4e-4a16-aa16-298248785984',
  'questions',
  '55968c7a-0ec3-4f3d-95c3-38d8913a4ed6',
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
  '26eafb5b-cf06-40b0-a201-332394d44903', -- Generated UUID for the question
  'What is graphical excellence?',
  'b3a7ac6a-3e4e-4a16-aa16-298248785984', -- Quiz ID
  'b3a7ac6a-3e4e-4a16-aa16-298248785984', -- Quiz ID (duplicate)
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
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
  '26eafb5b-cf06-40b0-a201-332394d44903',
  'quiz_id',
  'b3a7ac6a-3e4e-4a16-aa16-298248785984',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b3a7ac6a-3e4e-4a16-aa16-298248785984',
  'questions',
  '26eafb5b-cf06-40b0-a201-332394d44903',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: cb13340a-2f4b-4219-bcb7-2fb768b3af3c)
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
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af', -- Generated UUID for the question
  'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID (duplicate)
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
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af',
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
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af',
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
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af',
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
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af',
  'quiz_id',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  'questions',
  '2d9f6af9-a77e-4d2a-9657-fbf9017623af',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017', -- Generated UUID for the question
  'The principle of similarity states that we tend to group things which share visual characteristics such as:',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID (duplicate)
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
  'quiz_id',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  'questions',
  'f8aaaee7-a7e8-4504-af31-4857c1c77017',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3', -- Generated UUID for the question
  'What is symmetry associated with?',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID (duplicate)
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
  'quiz_id',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  'questions',
  '3091ff10-219e-4776-ac24-83dc1924dcd3',
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
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5', -- Generated UUID for the question
  'What does the principle of connection state?',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c', -- Quiz ID (duplicate)
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
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5',
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
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5',
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
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5',
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
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5',
  'quiz_id',
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cb13340a-2f4b-4219-bcb7-2fb768b3af3c',
  'questions',
  '4eb9f5ff-f4c6-49ea-946a-f6b439b465d5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: 690e6dba-b23b-42e4-9e06-4d8bd9197186)
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb', -- Generated UUID for the question
  'What is the key to making brainstorming as effective as possible?',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID (duplicate)
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
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
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
  'quiz_id',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  'questions',
  'a18937d1-2629-49bc-90aa-3f3b697974fb',
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
  '8f473840-28f7-4ddf-940a-1634adf01172', -- Generated UUID for the question
  'What are our Cardinal Rules of brainstorming?',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID (duplicate)
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '8f473840-28f7-4ddf-940a-1634adf01172',
  'quiz_id',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  'questions',
  '8f473840-28f7-4ddf-940a-1634adf01172',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809', -- Generated UUID for the question
  'What was the golden rule talked about in this lesson?',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID
  '690e6dba-b23b-42e4-9e06-4d8bd9197186', -- Quiz ID (duplicate)
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
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
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
  'quiz_id',
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '690e6dba-b23b-42e4-9e06-4d8bd9197186',
  'questions',
  '72b11f57-d5b1-4dba-8ed7-817e9b368809',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: 7dc293af-13a9-409d-b583-4a9e113331e4)
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa', -- Generated UUID for the question
  'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
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
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  'ac5e17d2-bd3c-4973-8660-d78e59b8a2fa',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f', -- Generated UUID for the question
  'Why are we creating our presentation?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  '9b000c66-f16f-4525-bc85-2fbd1c7f766f',
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
  '29223e75-d85d-4856-bd27-0dc474501964', -- Generated UUID for the question
  'What are they four parts to our introduction?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '29223e75-d85d-4856-bd27-0dc474501964',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  '29223e75-d85d-4856-bd27-0dc474501964',
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
  '5dd7951f-662d-4332-ab11-f948d36e7482', -- Generated UUID for the question
  'What is the Context part of the Introduction?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  '5dd7951f-662d-4332-ab11-f948d36e7482',
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
  '5dd7951f-662d-4332-ab11-f948d36e7482',
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
  '5dd7951f-662d-4332-ab11-f948d36e7482',
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
  '5dd7951f-662d-4332-ab11-f948d36e7482',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  '5dd7951f-662d-4332-ab11-f948d36e7482',
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c', -- Generated UUID for the question
  'What is the Catalyst portion of the Introduction?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
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
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  '61b6e176-3673-4d0f-9803-e2e502134c9c',
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
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed', -- Generated UUID for the question
  'What is the Question portion of the Introduction?',
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID
  '7dc293af-13a9-409d-b583-4a9e113331e4', -- Quiz ID (duplicate)
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
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed',
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
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed',
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
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed',
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
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed',
  'quiz_id',
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7dc293af-13a9-409d-b583-4a9e113331e4',
  'questions',
  'd89caa32-5f1f-4491-8f8f-d7ce42f0e8ed',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: e827d0e6-7916-46a7-81c5-f6ef23d04b6c)
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
  '4178cb42-6139-4b64-8c24-97774153be92', -- Generated UUID for the question
  'Why is it important to follow a process to develop a presentation?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '4178cb42-6139-4b64-8c24-97774153be92',
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
  '4178cb42-6139-4b64-8c24-97774153be92',
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
  '4178cb42-6139-4b64-8c24-97774153be92',
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
  '4178cb42-6139-4b64-8c24-97774153be92',
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
  '4178cb42-6139-4b64-8c24-97774153be92',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '4178cb42-6139-4b64-8c24-97774153be92',
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55', -- Generated UUID for the question
  'What is the 1st step of our process?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
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
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '1160431f-cfbe-4d3c-947e-a6ed58deed55',
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9', -- Generated UUID for the question
  'What is the 2nd step of our process?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
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
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  'abe0987c-09d5-4fbe-91b5-e59578d7b2f9',
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303', -- Generated UUID for the question
  'What is the 3rd step of our process?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
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
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  'b8059e0f-70e5-4ed9-88d9-6a6139a38303',
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934', -- Generated UUID for the question
  'What is the 4th step of our process?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
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
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '3407dc35-5324-4633-bd9a-d2d3c6cd2934',
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
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8', -- Generated UUID for the question
  'Our first step is ''The Who''. What do we mean by this?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8',
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
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8',
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
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8',
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
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  'c8cb7ab0-6c38-46b7-8c53-42631fc2a9b8',
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
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a', -- Generated UUID for the question
  'The second step in our process is ''The Why''. What do we mean by this?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a',
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
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a',
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
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a',
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
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '56a410c6-d90b-4d71-bdcc-2b90ff16137a',
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
  '23632552-89c7-4354-8b14-cb962ebe90ea', -- Generated UUID for the question
  'The third step in our process is ''The What''. What does ''The What'' focus on?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '23632552-89c7-4354-8b14-cb962ebe90ea',
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
  '23632552-89c7-4354-8b14-cb962ebe90ea',
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
  '23632552-89c7-4354-8b14-cb962ebe90ea',
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
  '23632552-89c7-4354-8b14-cb962ebe90ea',
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
  '23632552-89c7-4354-8b14-cb962ebe90ea',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '23632552-89c7-4354-8b14-cb962ebe90ea',
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
  '7775e1f6-06f3-4163-8285-74bf1555e240', -- Generated UUID for the question
  'The final step in our process is ''The How''. What is the focus of ''The How''?',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c', -- Quiz ID (duplicate)
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
  '7775e1f6-06f3-4163-8285-74bf1555e240',
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
  '7775e1f6-06f3-4163-8285-74bf1555e240',
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
  '7775e1f6-06f3-4163-8285-74bf1555e240',
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
  '7775e1f6-06f3-4163-8285-74bf1555e240',
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
  '7775e1f6-06f3-4163-8285-74bf1555e240',
  'quiz_id',
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e827d0e6-7916-46a7-81c5-f6ef23d04b6c',
  'questions',
  '7775e1f6-06f3-4163-8285-74bf1555e240',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: cfb72406-e964-4517-93b7-5dd812483a64)
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
  '8e9630ed-3903-4e1f-9115-961a46c54125', -- Generated UUID for the question
  'What are some of the fundamental elements and principles of design?',
  'cfb72406-e964-4517-93b7-5dd812483a64', -- Quiz ID
  'cfb72406-e964-4517-93b7-5dd812483a64', -- Quiz ID (duplicate)
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
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
  '8e9630ed-3903-4e1f-9115-961a46c54125',
  'quiz_id',
  'cfb72406-e964-4517-93b7-5dd812483a64',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cfb72406-e964-4517-93b7-5dd812483a64',
  'questions',
  '8e9630ed-3903-4e1f-9115-961a46c54125',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Performance Quiz (performance-quiz, ID: 60241c16-8083-4687-b652-3ca391b683e5)
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47', -- Generated UUID for the question
  'What can we do to try and set the right tone?',
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID (duplicate)
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
  'quiz_id',
  '60241c16-8083-4687-b652-3ca391b683e5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '60241c16-8083-4687-b652-3ca391b683e5',
  'questions',
  '8ceccff5-467f-4efc-b5db-eca5f95cbd47',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13', -- Generated UUID for the question
  'What are some things you can do to manage stress?',
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID (duplicate)
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
  'quiz_id',
  '60241c16-8083-4687-b652-3ca391b683e5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '60241c16-8083-4687-b652-3ca391b683e5',
  'questions',
  'b3f63508-b31d-4d21-9815-75c86e23ee13',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6', -- Generated UUID for the question
  'What body language and delivery mistakes should you be on the lookout for?',
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID
  '60241c16-8083-4687-b652-3ca391b683e5', -- Quiz ID (duplicate)
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
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
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
  'quiz_id',
  '60241c16-8083-4687-b652-3ca391b683e5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '60241c16-8083-4687-b652-3ca391b683e5',
  'questions',
  'ee3e958b-6a8f-4699-9d21-b37bea564ec6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: 878fa2d9-4ac7-439d-a270-d12a481b5e46)
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc', -- Generated UUID for the question
  'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  'f3702b6c-39a3-4bf7-a7f4-d56a9e7991fc',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52', -- Generated UUID for the question
  'What is the first step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  '5b516fe6-c31c-4235-bc91-25e4f8186e52',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846', -- Generated UUID for the question
  'What is the second step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  '29cfd1ca-17dd-4ff3-b7c8-f4d1b10f2846',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f', -- Generated UUID for the question
  'What is the third step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  '711e59f3-6ff7-43ad-b90f-b726b271eb4f',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2', -- Generated UUID for the question
  'What is the fourth step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  'd069bd13-7e5a-4805-b4a4-8982b2ddb0e2',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d', -- Generated UUID for the question
  'What is the fifth step pf the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  '93ced2e8-2071-4618-b2f5-091afb16c84d',
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
  '78906eee-52e5-44bc-9037-17c096b42c00', -- Generated UUID for the question
  'What is the sixth step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  '78906eee-52e5-44bc-9037-17c096b42c00',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  '78906eee-52e5-44bc-9037-17c096b42c00',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e', -- Generated UUID for the question
  'What is the seventh step of the recommended preparation process?',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID
  '878fa2d9-4ac7-439d-a270-d12a481b5e46', -- Quiz ID (duplicate)
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
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
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
  'quiz_id',
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '878fa2d9-4ac7-439d-a270-d12a481b5e46',
  'questions',
  'ea49ef62-6895-4825-8c67-ef35e9015d4e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: a335f355-aa00-4156-bd5d-519ef5ca2b2b)
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d', -- Generated UUID for the question
  'What goes in the headline?',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID (duplicate)
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
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
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
  'quiz_id',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  'questions',
  'c2273d4d-6bd8-4d9d-a5be-1c5b0469764d',
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e', -- Generated UUID for the question
  'What goes in the body of the slide?',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID (duplicate)
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
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
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
  'quiz_id',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  'questions',
  '952abc56-3720-4ffe-afa5-41fe21c58b7e',
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
  '34a83ed9-558f-442e-a695-5ce04fa12893', -- Generated UUID for the question
  'What is a swipe file?',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID (duplicate)
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
  '34a83ed9-558f-442e-a695-5ce04fa12893',
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
  '34a83ed9-558f-442e-a695-5ce04fa12893',
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
  '34a83ed9-558f-442e-a695-5ce04fa12893',
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
  '34a83ed9-558f-442e-a695-5ce04fa12893',
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
  '34a83ed9-558f-442e-a695-5ce04fa12893',
  'quiz_id',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  'questions',
  '34a83ed9-558f-442e-a695-5ce04fa12893',
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba', -- Generated UUID for the question
  'When is the best time to use clip art?',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID (duplicate)
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
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
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
  'quiz_id',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  'questions',
  '958290ec-164a-4dd4-8a35-5f3550e2f5ba',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719', -- Generated UUID for the question
  'What elements can be repeated on all slides?',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b', -- Quiz ID (duplicate)
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
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
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
  'quiz_id',
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a335f355-aa00-4156-bd5d-519ef5ca2b2b',
  'questions',
  '1e67bd46-b6f6-4f03-b004-8b9a9d6f9719',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: 29bbc888-6792-4359-960f-a6b3dacff8ab)
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5', -- Generated UUID for the question
  'What do we use Tornado diagrams for?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
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
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  'fc6faf80-11a1-40fc-bd40-1f500236f1a5',
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475', -- Generated UUID for the question
  'When do we use a Bubble Chart?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
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
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  'cb50049e-6c1a-40d5-8364-0b7836af0475',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca', -- Generated UUID for the question
  'What chart types should we try and avoid using?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  'c5cb49a5-d6f9-4650-b66a-bdbd3df63cca',
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8', -- Generated UUID for the question
  'What is the best use of a Waterfall Chart?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
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
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  'a2c20949-a6e5-4520-a1ff-0513f6524bd8',
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a', -- Generated UUID for the question
  'What is one of the more common uses of a Marimekko Chart?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
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
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  '33a0ec48-15d2-4cda-b71f-d3a58725ad5a',
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934', -- Generated UUID for the question
  'What are Motion Charts used for?',
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID
  '29bbc888-6792-4359-960f-a6b3dacff8ab', -- Quiz ID (duplicate)
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
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
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
  'quiz_id',
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '29bbc888-6792-4359-960f-a6b3dacff8ab',
  'questions',
  '0d4045d1-1f61-4dc8-b8d5-b13d358cd934',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: c3d300e3-9ace-4ff1-ad44-00a6948ed8e6)
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e', -- Generated UUID for the question
  'What is a storyboard?',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID (duplicate)
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
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
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
  'quiz_id',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  'questions',
  '9b5faaf8-0dc7-4aa8-b410-54cd356a0b7e',
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
  '93183a08-5d23-408a-b277-6ad10b54cafa', -- Generated UUID for the question
  'Who invented storyboards?',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID (duplicate)
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
  '93183a08-5d23-408a-b277-6ad10b54cafa',
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
  '93183a08-5d23-408a-b277-6ad10b54cafa',
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
  '93183a08-5d23-408a-b277-6ad10b54cafa',
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
  '93183a08-5d23-408a-b277-6ad10b54cafa',
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
  '93183a08-5d23-408a-b277-6ad10b54cafa',
  'quiz_id',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  'questions',
  '93183a08-5d23-408a-b277-6ad10b54cafa',
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993', -- Generated UUID for the question
  'What was the great innovation of storyboarding?',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6', -- Quiz ID (duplicate)
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
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
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
  'quiz_id',
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c3d300e3-9ace-4ff1-ad44-00a6948ed8e6',
  'questions',
  'f6e8ff1b-98cc-4d0b-896f-be891cbee993',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: 9c8bd043-3982-4685-b68d-dd56cf80b23f)
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c', -- Generated UUID for the question
  'What are the two approaches discussed in the lesson?',
  '9c8bd043-3982-4685-b68d-dd56cf80b23f', -- Quiz ID
  '9c8bd043-3982-4685-b68d-dd56cf80b23f', -- Quiz ID (duplicate)
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
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
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
  'quiz_id',
  '9c8bd043-3982-4685-b68d-dd56cf80b23f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9c8bd043-3982-4685-b68d-dd56cf80b23f',
  'questions',
  '1dfc9e85-02d1-40ce-884b-d8d108e1656c',
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
  '3db643ea-eade-4ba5-9408-987432db184d', -- Generated UUID for the question
  'What tools are recommended to use for storyboarding?',
  '9c8bd043-3982-4685-b68d-dd56cf80b23f', -- Quiz ID
  '9c8bd043-3982-4685-b68d-dd56cf80b23f', -- Quiz ID (duplicate)
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
  '3db643ea-eade-4ba5-9408-987432db184d',
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
  '3db643ea-eade-4ba5-9408-987432db184d',
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
  '3db643ea-eade-4ba5-9408-987432db184d',
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
  '3db643ea-eade-4ba5-9408-987432db184d',
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
  '3db643ea-eade-4ba5-9408-987432db184d',
  'quiz_id',
  '9c8bd043-3982-4685-b68d-dd56cf80b23f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9c8bd043-3982-4685-b68d-dd56cf80b23f',
  'questions',
  '3db643ea-eade-4ba5-9408-987432db184d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: 397be672-b433-4726-a1ab-502a5ccce810)
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
  'c70b0867-2912-4262-868e-bfc072e6e897', -- Generated UUID for the question
  'What is the principle of Abstraction?',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  'c70b0867-2912-4262-868e-bfc072e6e897',
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
  'c70b0867-2912-4262-868e-bfc072e6e897',
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
  'c70b0867-2912-4262-868e-bfc072e6e897',
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
  'c70b0867-2912-4262-868e-bfc072e6e897',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  'c70b0867-2912-4262-868e-bfc072e6e897',
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
  '28ac680d-abdc-4863-b4e4-5ee19e298a47', -- Generated UUID for the question
  'Which lists are MECE (pick 2)',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  '28ac680d-abdc-4863-b4e4-5ee19e298a47',
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
  '28ac680d-abdc-4863-b4e4-5ee19e298a47',
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
  '28ac680d-abdc-4863-b4e4-5ee19e298a47',
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
  '28ac680d-abdc-4863-b4e4-5ee19e298a47',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  '28ac680d-abdc-4863-b4e4-5ee19e298a47',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451', -- Generated UUID for the question
  'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  'acbceea8-f7a3-4fc7-8991-b1f96c802451',
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
  'bd759315-4590-439a-ab00-ae9946ade152', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  'bd759315-4590-439a-ab00-ae9946ade152',
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
  'bd759315-4590-439a-ab00-ae9946ade152',
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
  'bd759315-4590-439a-ab00-ae9946ade152',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  'bd759315-4590-439a-ab00-ae9946ade152',
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
  '4a14d51b-0228-4cf1-baea-f943386a2124', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  '4a14d51b-0228-4cf1-baea-f943386a2124',
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
  '4a14d51b-0228-4cf1-baea-f943386a2124',
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
  '4a14d51b-0228-4cf1-baea-f943386a2124',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  '4a14d51b-0228-4cf1-baea-f943386a2124',
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d', -- Generated UUID for the question
  'What is the rule of 7 (updated)?',
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID
  '397be672-b433-4726-a1ab-502a5ccce810', -- Quiz ID (duplicate)
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
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
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
  'quiz_id',
  '397be672-b433-4726-a1ab-502a5ccce810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '397be672-b433-4726-a1ab-502a5ccce810',
  'questions',
  '73597450-ffdd-4ce0-8e6e-6feb2300df1d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: 570fb938-1ae5-45aa-a6d0-7e39bba75cf7)
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33', -- Generated UUID for the question
  'What are the two defining characteristics of Tables?',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID (duplicate)
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
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
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
  'quiz_id',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  'questions',
  '9456a528-24ee-45ea-ba32-cbeac8ec6b33',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1', -- Generated UUID for the question
  'What re some of the primary benefits of a table?',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID (duplicate)
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
  'quiz_id',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  'questions',
  'f0163914-a41d-46ba-bb43-2740d894c0a1',
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
  '7da79c15-73c1-448c-935d-213ff2497158', -- Generated UUID for the question
  'What are some of the characteristics that define graphs?',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID (duplicate)
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '7da79c15-73c1-448c-935d-213ff2497158',
  'quiz_id',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  'questions',
  '7da79c15-73c1-448c-935d-213ff2497158',
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
  '5c676096-423c-481c-94ec-e8350807546d', -- Generated UUID for the question
  'When should you use graphs?',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7', -- Quiz ID (duplicate)
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
  '5c676096-423c-481c-94ec-e8350807546d',
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
  '5c676096-423c-481c-94ec-e8350807546d',
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
  '5c676096-423c-481c-94ec-e8350807546d',
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
  '5c676096-423c-481c-94ec-e8350807546d',
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
  '5c676096-423c-481c-94ec-e8350807546d',
  'quiz_id',
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '570fb938-1ae5-45aa-a6d0-7e39bba75cf7',
  'questions',
  '5c676096-423c-481c-94ec-e8350807546d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: 9ba5202d-eea1-4173-85a9-9fab6773980b)
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde', -- Generated UUID for the question
  'Who is the hero of our presentation?',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
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
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  '65ad5a42-b741-4ed6-b1c8-296d630d3fde',
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
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25', -- Generated UUID for the question
  'What is the Audience Map used for?',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25',
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
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25',
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
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25',
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
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  '49fea1ae-f64d-4d2c-b6be-e7b163d1cc25',
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9', -- Generated UUID for the question
  'What are the 4 quadrants of the Audience Map?',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
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
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  '48d3c381-849a-4108-a2a5-326cb9975ed9',
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Personality'' quadrant',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
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
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  'd779fcb7-7c4b-4985-a592-e9b4c4cae7ad',
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
  'd520b742-86a2-4603-a443-6130d7a7d245', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Access'' quadrant',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  'd520b742-86a2-4603-a443-6130d7a7d245',
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
  'd520b742-86a2-4603-a443-6130d7a7d245',
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
  'd520b742-86a2-4603-a443-6130d7a7d245',
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
  'd520b742-86a2-4603-a443-6130d7a7d245',
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
  'd520b742-86a2-4603-a443-6130d7a7d245',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  'd520b742-86a2-4603-a443-6130d7a7d245',
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Power'' quadrant',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
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
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  '7db54d58-07a4-4f9c-b059-3a6b0095306d',
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Resistance'' quadrant',
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID
  '9ba5202d-eea1-4173-85a9-9fab6773980b', -- Quiz ID (duplicate)
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
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
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
  'quiz_id',
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9ba5202d-eea1-4173-85a9-9fab6773980b',
  'questions',
  'fd56f654-fdeb-466a-a1b7-65d0357d4b3c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: 6d9f36c1-21c4-4224-b3e0-bddec671eeb5)
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909', -- Generated UUID for the question
  'Why are stories like a cup?',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID (duplicate)
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
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
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
  'quiz_id',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  'questions',
  '8832f55e-9972-4b4e-ac6a-2b6adb5d5909',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81', -- Generated UUID for the question
  'What do stories add to our presentations? Why should be use them?',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID (duplicate)
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
  'quiz_id',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  'questions',
  'a8fc0f29-d874-45c5-8e7a-6f984aa38a81',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577', -- Generated UUID for the question
  'What characteristics make stories memorable?',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5', -- Quiz ID (duplicate)
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
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
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
  'quiz_id',
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6d9f36c1-21c4-4224-b3e0-bddec671eeb5',
  'questions',
  '1c6e8afb-8c3e-42d5-8c7d-e36f7b872577',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: fc9de490-74bf-4c44-9751-d60fc428bdc9)
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
  '22659e8a-b978-480f-8638-774dcc4436c1', -- Generated UUID for the question
  'What is visual thinking?',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID (duplicate)
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
  '22659e8a-b978-480f-8638-774dcc4436c1',
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
  '22659e8a-b978-480f-8638-774dcc4436c1',
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
  '22659e8a-b978-480f-8638-774dcc4436c1',
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
  '22659e8a-b978-480f-8638-774dcc4436c1',
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
  '22659e8a-b978-480f-8638-774dcc4436c1',
  'quiz_id',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  'questions',
  '22659e8a-b978-480f-8638-774dcc4436c1',
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
  '80f9ee7e-cc85-4351-a448-e2855afe0d2a', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Conscious, sequential, and slow/hard''',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID (duplicate)
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
  '80f9ee7e-cc85-4351-a448-e2855afe0d2a',
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
  '80f9ee7e-cc85-4351-a448-e2855afe0d2a',
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
  '80f9ee7e-cc85-4351-a448-e2855afe0d2a',
  'quiz_id',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  'questions',
  '80f9ee7e-cc85-4351-a448-e2855afe0d2a',
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
  'b4d38693-4c8c-4d61-a7f1-9f6b47bd2d22', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Below the level of consciousness, very rapid''',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID (duplicate)
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
  'b4d38693-4c8c-4d61-a7f1-9f6b47bd2d22',
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
  'b4d38693-4c8c-4d61-a7f1-9f6b47bd2d22',
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
  'b4d38693-4c8c-4d61-a7f1-9f6b47bd2d22',
  'quiz_id',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  'questions',
  'b4d38693-4c8c-4d61-a7f1-9f6b47bd2d22',
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
  'afe453d7-fbce-4695-ac53-55c796f60462', -- Generated UUID for the question
  'What are the visual attribute triggers of pre-attentive processing?',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID
  'fc9de490-74bf-4c44-9751-d60fc428bdc9', -- Quiz ID (duplicate)
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
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
  'afe453d7-fbce-4695-ac53-55c796f60462',
  'quiz_id',
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fc9de490-74bf-4c44-9751-d60fc428bdc9',
  'questions',
  'afe453d7-fbce-4695-ac53-55c796f60462',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: 90f2e10d-4ab2-47ae-b005-08d5e07a5dd7)
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
  '385a6e76-1870-4570-a607-fe7f868a5b0a', -- Generated UUID for the question
  'Who is Cicero?',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID (duplicate)
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
  '385a6e76-1870-4570-a607-fe7f868a5b0a',
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
  '385a6e76-1870-4570-a607-fe7f868a5b0a',
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
  '385a6e76-1870-4570-a607-fe7f868a5b0a',
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
  '385a6e76-1870-4570-a607-fe7f868a5b0a',
  'quiz_id',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  'questions',
  '385a6e76-1870-4570-a607-fe7f868a5b0a',
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
  '3d5f07e8-8f3e-4035-864b-19be351030f8', -- Generated UUID for the question
  'What is the ultimate objective of our presentation?',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID (duplicate)
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
  '3d5f07e8-8f3e-4035-864b-19be351030f8',
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
  '3d5f07e8-8f3e-4035-864b-19be351030f8',
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
  '3d5f07e8-8f3e-4035-864b-19be351030f8',
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
  '3d5f07e8-8f3e-4035-864b-19be351030f8',
  'quiz_id',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  'questions',
  '3d5f07e8-8f3e-4035-864b-19be351030f8',
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
  '8356a684-0baf-497f-9288-539b8e5afe71', -- Generated UUID for the question
  'Which of the following are reasonable next steps to follow your presentation?',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID (duplicate)
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
  '8356a684-0baf-497f-9288-539b8e5afe71',
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
  '8356a684-0baf-497f-9288-539b8e5afe71',
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
  '8356a684-0baf-497f-9288-539b8e5afe71',
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
  '8356a684-0baf-497f-9288-539b8e5afe71',
  'quiz_id',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  'questions',
  '8356a684-0baf-497f-9288-539b8e5afe71',
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb', -- Generated UUID for the question
  'Where should the next steps go in your presentation?',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7', -- Quiz ID (duplicate)
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
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
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
  'quiz_id',
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '90f2e10d-4ab2-47ae-b005-08d5e07a5dd7',
  'questions',
  'd3ceb3dd-9747-4205-9192-4745c64458fb',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
