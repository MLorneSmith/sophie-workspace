-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

-- Questions for quiz: Standard Graphs Quiz (basic-graphs-quiz, ID: 14450dcf-6d51-4965-9b76-7dd28c64a1b8)
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9', -- Generated UUID for the question
  'There are many types of relationships that we use graphs to display. What chart type best communicates the ''Part-to-Whole'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '082257d6-29f9-4269-aa94-a3c72435e4c9',
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
  '7180d918-387e-482c-abae-66526df9407b', -- Generated UUID for the question
  'What chart type best communicates the ''Correlation'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '7180d918-387e-482c-abae-66526df9407b',
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
  '7180d918-387e-482c-abae-66526df9407b',
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
  '7180d918-387e-482c-abae-66526df9407b',
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
  '7180d918-387e-482c-abae-66526df9407b',
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
  '7180d918-387e-482c-abae-66526df9407b',
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
  '7180d918-387e-482c-abae-66526df9407b',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '7180d918-387e-482c-abae-66526df9407b',
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
  '82033e29-4a22-469e-8b03-f79730efa22a', -- Generated UUID for the question
  'What chart type best communicates the ''Time Series'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '82033e29-4a22-469e-8b03-f79730efa22a',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '82033e29-4a22-469e-8b03-f79730efa22a',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b', -- Generated UUID for the question
  'What chart types best communicates the ''Deviation'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '8903e7c7-6ce2-4bf6-b548-c5071451fc7b',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c', -- Generated UUID for the question
  'What chart type best communicates the ''Distribution'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  'b61d0726-f4d9-43e1-885a-46e9c3add24c',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671', -- Generated UUID for the question
  'What chart type best communicates the ''Nominal Comparison'' relationship',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '8d48e582-5cd6-4de4-b6f9-7f59cfae9671',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a', -- Generated UUID for the question
  'What chart type best communicates the ''Geospatial'' relationship?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '7a62e7b3-9c75-4fd0-a57b-086c671d1a0a',
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0', -- Generated UUID for the question
  'When should we use Pie Charts?',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- Quiz ID (duplicate)
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
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
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
  'quiz_id',
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8',
  'questions',
  '1a3c75e8-9ccd-417b-8101-2bdcc6c7c9b0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Fundamental Elements of Design in Detail Quiz (elements-of-design-detail-quiz, ID: 4da9c254-8b34-4c48-8e1d-45fe67b34832)
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
  'd0203a4d-35ef-404f-9933-35fe64cadd35', -- Generated UUID for the question
  'Why do we use contrast?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  'd0203a4d-35ef-404f-9933-35fe64cadd35',
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
  'd0203a4d-35ef-404f-9933-35fe64cadd35',
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
  'd0203a4d-35ef-404f-9933-35fe64cadd35',
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
  'd0203a4d-35ef-404f-9933-35fe64cadd35',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  'd0203a4d-35ef-404f-9933-35fe64cadd35',
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
  'f70b210e-89fe-4a30-91f2-fb79d938742f', -- Generated UUID for the question
  'How important is alignment?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  'f70b210e-89fe-4a30-91f2-fb79d938742f',
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
  'f70b210e-89fe-4a30-91f2-fb79d938742f',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  'f70b210e-89fe-4a30-91f2-fb79d938742f',
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
  '2412b6f1-de6a-417c-bd46-9f89c0b65710', -- Generated UUID for the question
  'How is the principle of proximity helpful?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  '2412b6f1-de6a-417c-bd46-9f89c0b65710',
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
  '2412b6f1-de6a-417c-bd46-9f89c0b65710',
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
  '2412b6f1-de6a-417c-bd46-9f89c0b65710',
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
  '2412b6f1-de6a-417c-bd46-9f89c0b65710',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  '2412b6f1-de6a-417c-bd46-9f89c0b65710',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6', -- Generated UUID for the question
  'How many different font types should you use in a single presentation?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  '8d9ef96d-2272-4818-86b8-3832ab69fbc6',
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
  '160b285f-5bed-4761-b33b-97f36387956a', -- Generated UUID for the question
  'How many colors should we use in a presentation?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '160b285f-5bed-4761-b33b-97f36387956a',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  '160b285f-5bed-4761-b33b-97f36387956a',
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
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792', -- Generated UUID for the question
  'What should you do with whitespace?',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- Quiz ID (duplicate)
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
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792',
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
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792',
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
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792',
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
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792',
  'quiz_id',
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4da9c254-8b34-4c48-8e1d-45fe67b34832',
  'questions',
  '2d261f07-1f75-4ee2-bfe0-61da2b45a792',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of Fact-based Persuasion Quiz (fact-persuasion-quiz, ID: 5b771702-b668-46a3-96a9-51aaf4c3d594)
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66', -- Generated UUID for the question
  'What is the bare assertion fallacy?',
  '5b771702-b668-46a3-96a9-51aaf4c3d594', -- Quiz ID
  '5b771702-b668-46a3-96a9-51aaf4c3d594', -- Quiz ID (duplicate)
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
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
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
  'quiz_id',
  '5b771702-b668-46a3-96a9-51aaf4c3d594',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5b771702-b668-46a3-96a9-51aaf4c3d594',
  'questions',
  'f1304b18-0fbe-484a-834f-745ed94bbd66',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8', -- Generated UUID for the question
  'What is graphical excellence?',
  '5b771702-b668-46a3-96a9-51aaf4c3d594', -- Quiz ID
  '5b771702-b668-46a3-96a9-51aaf4c3d594', -- Quiz ID (duplicate)
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
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
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
  'quiz_id',
  '5b771702-b668-46a3-96a9-51aaf4c3d594',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5b771702-b668-46a3-96a9-51aaf4c3d594',
  'questions',
  '7cdd6dc9-709e-40b3-b04c-000e8127e2e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Gestalt Principles of Visual Perception Quiz (gestalt-principles-quiz, ID: 9d7f5d91-4319-4434-ab3d-0b2124375fdd)
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
  'e04dbafd-2a0a-45be-a6b0-3ca994588595', -- Generated UUID for the question
  'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID (duplicate)
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
  'e04dbafd-2a0a-45be-a6b0-3ca994588595',
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
  'e04dbafd-2a0a-45be-a6b0-3ca994588595',
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
  'e04dbafd-2a0a-45be-a6b0-3ca994588595',
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
  'e04dbafd-2a0a-45be-a6b0-3ca994588595',
  'quiz_id',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  'questions',
  'e04dbafd-2a0a-45be-a6b0-3ca994588595',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c', -- Generated UUID for the question
  'The principle of similarity states that we tend to group things which share visual characteristics such as:',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID (duplicate)
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
  'quiz_id',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  'questions',
  '3d2b27bc-8b16-4304-b27c-65d9f613946c',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311', -- Generated UUID for the question
  'What is symmetry associated with?',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID (duplicate)
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
  'quiz_id',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  'questions',
  'c1b5c434-7327-46e3-b1b9-3fed73339311',
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
  'b88761d4-397a-403b-8bc9-f889b4083c50', -- Generated UUID for the question
  'What does the principle of connection state?',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- Quiz ID (duplicate)
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
  'b88761d4-397a-403b-8bc9-f889b4083c50',
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
  'b88761d4-397a-403b-8bc9-f889b4083c50',
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
  'b88761d4-397a-403b-8bc9-f889b4083c50',
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
  'b88761d4-397a-403b-8bc9-f889b4083c50',
  'quiz_id',
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd',
  'questions',
  'b88761d4-397a-403b-8bc9-f889b4083c50',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Idea Generation Quiz (idea-generation-quiz, ID: 85188e94-f1a4-4d20-97b1-ea3cf9639e35)
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
  'd519f36d-9f4a-403b-9dfe-558157381f54', -- Generated UUID for the question
  'What is the key to making brainstorming as effective as possible?',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID (duplicate)
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
  'd519f36d-9f4a-403b-9dfe-558157381f54',
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
  'd519f36d-9f4a-403b-9dfe-558157381f54',
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
  'd519f36d-9f4a-403b-9dfe-558157381f54',
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
  'd519f36d-9f4a-403b-9dfe-558157381f54',
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
  'd519f36d-9f4a-403b-9dfe-558157381f54',
  'quiz_id',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  'questions',
  'd519f36d-9f4a-403b-9dfe-558157381f54',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3', -- Generated UUID for the question
  'What are our Cardinal Rules of brainstorming?',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID (duplicate)
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
  'quiz_id',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  'questions',
  '0de7f9e6-67ea-4adc-899c-0383329d1da3',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19', -- Generated UUID for the question
  'What was the golden rule talked about in this lesson?',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- Quiz ID (duplicate)
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
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
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
  'quiz_id',
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35',
  'questions',
  '8236c1c9-20c2-4a8d-8908-61d9782fee19',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Introductions) Quiz (introductions-quiz, ID: 4d4f5fcf-6605-468d-ac61-02f87ee2aef9)
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1', -- Generated UUID for the question
  'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
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
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  '9d5c7985-1c64-4246-9201-aab22ffdd1a1',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf', -- Generated UUID for the question
  'Why are we creating our presentation?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  '3e5ccf56-d9a3-4b49-bf74-a5eadce01bbf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf', -- Generated UUID for the question
  'What are they four parts to our introduction?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  'a8805190-67d4-4c47-87a6-030afe2663cf',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  'a8805190-67d4-4c47-87a6-030afe2663cf',
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
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb', -- Generated UUID for the question
  'What is the Context part of the Introduction?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb',
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
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb',
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
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb',
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
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  '0cc2195a-9ae2-4d93-849b-8c90487b8bdb',
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20', -- Generated UUID for the question
  'What is the Catalyst portion of the Introduction?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
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
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  '4a054a7a-bcc9-4339-b620-38c842b76b20',
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
  'c0efda8a-a887-4dca-a5ad-5b287b21587c', -- Generated UUID for the question
  'What is the Question portion of the Introduction?',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- Quiz ID (duplicate)
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
  'c0efda8a-a887-4dca-a5ad-5b287b21587c',
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
  'c0efda8a-a887-4dca-a5ad-5b287b21587c',
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
  'c0efda8a-a887-4dca-a5ad-5b287b21587c',
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
  'c0efda8a-a887-4dca-a5ad-5b287b21587c',
  'quiz_id',
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9',
  'questions',
  'c0efda8a-a887-4dca-a5ad-5b287b21587c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Our Process Quiz (our-process-quiz, ID: e3893886-583c-4c58-8cd4-ca070e2ac710)
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc', -- Generated UUID for the question
  'Why is it important to follow a process to develop a presentation?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
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
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  'c6a5bf6e-b48a-42cc-aa1f-bc7d45e83edc',
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
  'fe80dc41-c135-434c-8210-597a189d3435', -- Generated UUID for the question
  'What is the 1st step of our process?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  'fe80dc41-c135-434c-8210-597a189d3435',
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
  'fe80dc41-c135-434c-8210-597a189d3435',
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
  'fe80dc41-c135-434c-8210-597a189d3435',
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
  'fe80dc41-c135-434c-8210-597a189d3435',
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
  'fe80dc41-c135-434c-8210-597a189d3435',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  'fe80dc41-c135-434c-8210-597a189d3435',
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99', -- Generated UUID for the question
  'What is the 2nd step of our process?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
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
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  '97a8788b-05eb-440e-8b5d-2bb0ab3dae99',
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc', -- Generated UUID for the question
  'What is the 3rd step of our process?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
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
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  '47657d6c-fcd5-45cb-80ff-fc2f30322fbc',
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
  'df1c08f8-17f8-4416-ba77-393daf052318', -- Generated UUID for the question
  'What is the 4th step of our process?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  'df1c08f8-17f8-4416-ba77-393daf052318',
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
  'df1c08f8-17f8-4416-ba77-393daf052318',
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
  'df1c08f8-17f8-4416-ba77-393daf052318',
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
  'df1c08f8-17f8-4416-ba77-393daf052318',
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
  'df1c08f8-17f8-4416-ba77-393daf052318',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  'df1c08f8-17f8-4416-ba77-393daf052318',
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
  '6c192aa2-470c-4e58-b5b9-60ed88603998', -- Generated UUID for the question
  'Our first step is ''The Who''. What do we mean by this?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  '6c192aa2-470c-4e58-b5b9-60ed88603998',
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
  '6c192aa2-470c-4e58-b5b9-60ed88603998',
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
  '6c192aa2-470c-4e58-b5b9-60ed88603998',
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
  '6c192aa2-470c-4e58-b5b9-60ed88603998',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  '6c192aa2-470c-4e58-b5b9-60ed88603998',
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
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8', -- Generated UUID for the question
  'The second step in our process is ''The Why''. What do we mean by this?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8',
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
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8',
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
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8',
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
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  '0770e41d-bd06-4359-a1bb-118f0f6efaa8',
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080', -- Generated UUID for the question
  'The third step in our process is ''The What''. What does ''The What'' focus on?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
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
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  'd86c20c0-f34c-4409-b120-dd61ee9f8080',
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
  '234be59a-6474-485c-9d84-16a0660fdc87', -- Generated UUID for the question
  'The final step in our process is ''The How''. What is the focus of ''The How''?',
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- Quiz ID (duplicate)
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
  '234be59a-6474-485c-9d84-16a0660fdc87',
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
  '234be59a-6474-485c-9d84-16a0660fdc87',
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
  '234be59a-6474-485c-9d84-16a0660fdc87',
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
  '234be59a-6474-485c-9d84-16a0660fdc87',
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
  '234be59a-6474-485c-9d84-16a0660fdc87',
  'quiz_id',
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3893886-583c-4c58-8cd4-ca070e2ac710',
  'questions',
  '234be59a-6474-485c-9d84-16a0660fdc87',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Overview of the Fundamental Elements of Design Quiz (overview-elements-of-design-quiz, ID: 2bce015d-492e-4588-87e9-d368825496de)
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6', -- Generated UUID for the question
  'What are some of the fundamental elements and principles of design?',
  '2bce015d-492e-4588-87e9-d368825496de', -- Quiz ID
  '2bce015d-492e-4588-87e9-d368825496de', -- Quiz ID (duplicate)
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
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
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
  'quiz_id',
  '2bce015d-492e-4588-87e9-d368825496de',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2bce015d-492e-4588-87e9-d368825496de',
  'questions',
  '3dd0f3b8-329d-4fb8-af3a-882a0fcba4b6',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Performance Quiz (performance-quiz, ID: ded02ed0-99b3-494b-a1db-31cfdbf9697d)
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb', -- Generated UUID for the question
  'What can we do to try and set the right tone?',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID (duplicate)
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
  'quiz_id',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  'questions',
  '2f4b93b0-119e-4f61-9550-021c7afb23fb',
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
  '81d85e21-c078-402c-8121-88bce837d3c0', -- Generated UUID for the question
  'What are some things you can do to manage stress?',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID (duplicate)
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '81d85e21-c078-402c-8121-88bce837d3c0',
  'quiz_id',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  'questions',
  '81d85e21-c078-402c-8121-88bce837d3c0',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243', -- Generated UUID for the question
  'What body language and delivery mistakes should you be on the lookout for?',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- Quiz ID (duplicate)
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
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
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
  'quiz_id',
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d',
  'questions',
  '3f41a61b-6bc3-4298-be03-0e4ae72bd243',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Perparation & Practice Quiz (preparation-practice-quiz, ID: 2421b7d4-1d10-4201-8709-220c66531246)
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808', -- Generated UUID for the question
  'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  'e91792a5-de7c-4c85-a2f2-4539a062b808',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10', -- Generated UUID for the question
  'What is the first step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  '092c0c6b-af4a-46d1-9e3f-05a9b9d64e10',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b', -- Generated UUID for the question
  'What is the second step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  '7ee4f40e-34b2-42a4-8d95-160adc067e5b',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9', -- Generated UUID for the question
  'What is the third step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  '3cc66030-0ff4-4429-a5b1-ce99abd454c9',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6', -- Generated UUID for the question
  'What is the fourth step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  '0e0fbbd6-7cce-45d5-88de-d3145ffb12e6',
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
  '2f501014-e525-431a-8b80-fdf06ce78688', -- Generated UUID for the question
  'What is the fifth step pf the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  '2f501014-e525-431a-8b80-fdf06ce78688',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  '2f501014-e525-431a-8b80-fdf06ce78688',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e', -- Generated UUID for the question
  'What is the sixth step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  'e8dd6e0d-34c7-4c38-bf5d-001d2a9e410e',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a', -- Generated UUID for the question
  'What is the seventh step of the recommended preparation process?',
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID
  '2421b7d4-1d10-4201-8709-220c66531246', -- Quiz ID (duplicate)
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
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
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
  'quiz_id',
  '2421b7d4-1d10-4201-8709-220c66531246',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2421b7d4-1d10-4201-8709-220c66531246',
  'questions',
  'd12eba73-5edd-4360-9f26-39d6a5b9477a',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Slide Composition Quiz (slide-composition-quiz, ID: 47573ab2-6013-4034-b0ef-fe708e1d1c69)
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec', -- Generated UUID for the question
  'What goes in the headline?',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID (duplicate)
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
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
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
  'quiz_id',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  'questions',
  'bfea5bf4-ad1c-4c26-bb85-cddb9c98a7ec',
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce', -- Generated UUID for the question
  'What goes in the body of the slide?',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID (duplicate)
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
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
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
  'quiz_id',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  'questions',
  'fa74fc41-3441-4adc-91d1-bd10690af0ce',
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
  '37317793-e03f-4973-bc76-3362f6fa9a37', -- Generated UUID for the question
  'What is a swipe file?',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID (duplicate)
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
  '37317793-e03f-4973-bc76-3362f6fa9a37',
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
  '37317793-e03f-4973-bc76-3362f6fa9a37',
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
  '37317793-e03f-4973-bc76-3362f6fa9a37',
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
  '37317793-e03f-4973-bc76-3362f6fa9a37',
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
  '37317793-e03f-4973-bc76-3362f6fa9a37',
  'quiz_id',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  'questions',
  '37317793-e03f-4973-bc76-3362f6fa9a37',
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb', -- Generated UUID for the question
  'When is the best time to use clip art?',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID (duplicate)
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
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
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
  'quiz_id',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  'questions',
  '1c6b3ae3-5cdb-405f-a7e1-5377eca9cbcb',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b', -- Generated UUID for the question
  'What elements can be repeated on all slides?',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- Quiz ID (duplicate)
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
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
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
  'quiz_id',
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '47573ab2-6013-4034-b0ef-fe708e1d1c69',
  'questions',
  'b8a5a11b-d988-43c5-b7cc-85dc7e33df9b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Specialist Graphs Quiz (specialist-graphs-quiz, ID: 1df73e2c-e53b-4364-8664-f05106a23541)
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9', -- Generated UUID for the question
  'What do we use Tornado diagrams for?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
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
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  '46eaca42-c3a5-42d9-a5bd-27b4ae454ab9',
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a', -- Generated UUID for the question
  'When do we use a Bubble Chart?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
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
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  'd7dfaf97-ec06-4152-a372-42e29e9d549a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a', -- Generated UUID for the question
  'What chart types should we try and avoid using?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  'e74891c4-44f6-4358-a9d7-2755d7e3228a',
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
  'a13a8229-87b0-4063-b7af-24a11145e86e', -- Generated UUID for the question
  'What is the best use of a Waterfall Chart?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  'a13a8229-87b0-4063-b7af-24a11145e86e',
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
  'a13a8229-87b0-4063-b7af-24a11145e86e',
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
  'a13a8229-87b0-4063-b7af-24a11145e86e',
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
  'a13a8229-87b0-4063-b7af-24a11145e86e',
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
  'a13a8229-87b0-4063-b7af-24a11145e86e',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  'a13a8229-87b0-4063-b7af-24a11145e86e',
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
  '1890fd12-953c-4ede-8594-27bedef3eda9', -- Generated UUID for the question
  'What is one of the more common uses of a Marimekko Chart?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  '1890fd12-953c-4ede-8594-27bedef3eda9',
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
  '1890fd12-953c-4ede-8594-27bedef3eda9',
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
  '1890fd12-953c-4ede-8594-27bedef3eda9',
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
  '1890fd12-953c-4ede-8594-27bedef3eda9',
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
  '1890fd12-953c-4ede-8594-27bedef3eda9',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  '1890fd12-953c-4ede-8594-27bedef3eda9',
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64', -- Generated UUID for the question
  'What are Motion Charts used for?',
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID
  '1df73e2c-e53b-4364-8664-f05106a23541', -- Quiz ID (duplicate)
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
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
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
  'quiz_id',
  '1df73e2c-e53b-4364-8664-f05106a23541',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1df73e2c-e53b-4364-8664-f05106a23541',
  'questions',
  'fcb270c3-657c-4b11-9dd9-efe2c3684e64',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Film Quiz (storyboards-in-film-quiz, ID: c17c9ae3-8438-43dd-8cbf-c639c189ea85)
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39', -- Generated UUID for the question
  'What is a storyboard?',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID (duplicate)
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
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
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
  'quiz_id',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  'questions',
  'e65cd16a-4bf8-43dc-824b-ab4771e89c39',
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3', -- Generated UUID for the question
  'Who invented storyboards?',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID (duplicate)
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
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
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
  'quiz_id',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  'questions',
  '33cd8951-79db-4064-b641-1c57eb9e3ba3',
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747', -- Generated UUID for the question
  'What was the great innovation of storyboarding?',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- Quiz ID (duplicate)
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
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
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
  'quiz_id',
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85',
  'questions',
  '82c7c3f7-5baa-4b29-b6a0-bad13c3a2747',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Storyboards in Presentations Quiz (storyboards-in-presentations-quiz, ID: 1f310402-d8c6-41ba-b0af-536e4ececf1f)
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa', -- Generated UUID for the question
  'What are the two approaches discussed in the lesson?',
  '1f310402-d8c6-41ba-b0af-536e4ececf1f', -- Quiz ID
  '1f310402-d8c6-41ba-b0af-536e4ececf1f', -- Quiz ID (duplicate)
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
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
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
  'quiz_id',
  '1f310402-d8c6-41ba-b0af-536e4ececf1f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1f310402-d8c6-41ba-b0af-536e4ececf1f',
  'questions',
  'af346102-4a09-4fa0-8f09-0a497b0fb5aa',
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e', -- Generated UUID for the question
  'What tools are recommended to use for storyboarding?',
  '1f310402-d8c6-41ba-b0af-536e4ececf1f', -- Quiz ID
  '1f310402-d8c6-41ba-b0af-536e4ececf1f', -- Quiz ID (duplicate)
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
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
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
  'quiz_id',
  '1f310402-d8c6-41ba-b0af-536e4ececf1f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1f310402-d8c6-41ba-b0af-536e4ececf1f',
  'questions',
  '2e1c7688-6892-4574-b82f-a74d46640a9e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: What is Structure? Quiz (structure-quiz, ID: 751fd27e-1051-4c04-97a0-b1c71e4eba91)
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
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149', -- Generated UUID for the question
  'What is the principle of Abstraction?',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149',
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
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149',
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
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149',
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
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  'dc18b3a7-6e9d-42d9-b96c-0629345b8149',
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
  '21465475-9be9-47b1-b02d-69fa9c423b89', -- Generated UUID for the question
  'Which lists are MECE (pick 2)',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  '21465475-9be9-47b1-b02d-69fa9c423b89',
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
  '21465475-9be9-47b1-b02d-69fa9c423b89',
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
  '21465475-9be9-47b1-b02d-69fa9c423b89',
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
  '21465475-9be9-47b1-b02d-69fa9c423b89',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  '21465475-9be9-47b1-b02d-69fa9c423b89',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206', -- Generated UUID for the question
  'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  '7cf27c73-9d9a-4452-b69f-e9b654f7e206',
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
  '69dd6105-ec81-428a-995b-ffb3d76105df', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  '69dd6105-ec81-428a-995b-ffb3d76105df',
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
  '69dd6105-ec81-428a-995b-ffb3d76105df',
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
  '69dd6105-ec81-428a-995b-ffb3d76105df',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  '69dd6105-ec81-428a-995b-ffb3d76105df',
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
  '84897943-e9b6-433c-9555-f15ab6e04d91', -- Generated UUID for the question
  'Match the argument with whether it is deductive or inductive: ''All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  '84897943-e9b6-433c-9555-f15ab6e04d91',
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
  '84897943-e9b6-433c-9555-f15ab6e04d91',
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
  '84897943-e9b6-433c-9555-f15ab6e04d91',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  '84897943-e9b6-433c-9555-f15ab6e04d91',
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b', -- Generated UUID for the question
  'What is the rule of 7 (updated)?',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- Quiz ID (duplicate)
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
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
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
  'quiz_id',
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '751fd27e-1051-4c04-97a0-b1c71e4eba91',
  'questions',
  '248f9218-4485-4b19-9d85-8aba5a876f7b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Tables vs Graphs Quiz (tables-vs-graphs-quiz, ID: 63e66a51-40d4-4649-82a4-e87a99bf31fa)
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95', -- Generated UUID for the question
  'What are the two defining characteristics of Tables?',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID (duplicate)
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
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
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
  'quiz_id',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  'questions',
  'efb64a05-fa3a-44ac-a01b-39f5d6955b95',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643', -- Generated UUID for the question
  'What re some of the primary benefits of a table?',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID (duplicate)
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
  'quiz_id',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  'questions',
  'a92b6c90-2b5e-4940-9efa-7783ea006643',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3', -- Generated UUID for the question
  'What are some of the characteristics that define graphs?',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID (duplicate)
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
  'quiz_id',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  'questions',
  '596c733a-5465-45ba-a30c-3c67f4a38ee3',
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18', -- Generated UUID for the question
  'When should you use graphs?',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- Quiz ID (duplicate)
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
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
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
  'quiz_id',
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '63e66a51-40d4-4649-82a4-e87a99bf31fa',
  'questions',
  '45d0e39e-ea70-4c82-82d7-bc35bbf9bd18',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Who Quiz (the-who-quiz, ID: a44d735a-66f5-43b3-8220-4ff86f61c935)
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f', -- Generated UUID for the question
  'Who is the hero of our presentation?',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
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
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  'a31dd759-dc62-45b5-abe9-dca8af66696f',
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
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a', -- Generated UUID for the question
  'What is the Audience Map used for?',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a',
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
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a',
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
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a',
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
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  '6177c033-a6a6-42b2-baa2-9b8d68c2bf1a',
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c', -- Generated UUID for the question
  'What are the 4 quadrants of the Audience Map?',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
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
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  '693404e7-e56d-4e51-967b-3bc0ce838c9c',
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
  'b292868d-d6f2-4aea-b282-49c14f278b64', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Personality'' quadrant',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  'b292868d-d6f2-4aea-b282-49c14f278b64',
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
  'b292868d-d6f2-4aea-b282-49c14f278b64',
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
  'b292868d-d6f2-4aea-b282-49c14f278b64',
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
  'b292868d-d6f2-4aea-b282-49c14f278b64',
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
  'b292868d-d6f2-4aea-b282-49c14f278b64',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  'b292868d-d6f2-4aea-b282-49c14f278b64',
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Access'' quadrant',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
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
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  'a98b22ac-e4f5-4b35-a7e6-d49a767a4587',
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Power'' quadrant',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
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
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  '6c7bb7ba-8b50-414c-bbcc-ed545b496cec',
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
  'b422dd3e-af13-4e21-8168-be37c232951e', -- Generated UUID for the question
  'Pick the question that corresponds with the ''Resistance'' quadrant',
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- Quiz ID (duplicate)
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
  'b422dd3e-af13-4e21-8168-be37c232951e',
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
  'b422dd3e-af13-4e21-8168-be37c232951e',
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
  'b422dd3e-af13-4e21-8168-be37c232951e',
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
  'b422dd3e-af13-4e21-8168-be37c232951e',
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
  'b422dd3e-af13-4e21-8168-be37c232951e',
  'quiz_id',
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a44d735a-66f5-43b3-8220-4ff86f61c935',
  'questions',
  'b422dd3e-af13-4e21-8168-be37c232951e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Using Stories Quiz (using-stories-quiz, ID: 3a131d77-cf4e-4e70-8fd1-9a61527c298b)
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec', -- Generated UUID for the question
  'Why are stories like a cup?',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID (duplicate)
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
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
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
  'quiz_id',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  'questions',
  '42816fae-fb82-4d1a-b0fc-96d2eb4100ec',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919', -- Generated UUID for the question
  'What do stories add to our presentations? Why should be use them?',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID (duplicate)
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
  'quiz_id',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  'questions',
  '20b08ffc-5def-4eb1-9d4d-0e7f2af8b919',
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
  'd2da14ef-6172-403a-8432-463ea7547602', -- Generated UUID for the question
  'What characteristics make stories memorable?',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- Quiz ID (duplicate)
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
  'd2da14ef-6172-403a-8432-463ea7547602',
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
  'd2da14ef-6172-403a-8432-463ea7547602',
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
  'd2da14ef-6172-403a-8432-463ea7547602',
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
  'd2da14ef-6172-403a-8432-463ea7547602',
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
  'd2da14ef-6172-403a-8432-463ea7547602',
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
  'd2da14ef-6172-403a-8432-463ea7547602',
  'quiz_id',
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b',
  'questions',
  'd2da14ef-6172-403a-8432-463ea7547602',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: Visual Perception and Communication Quiz (visual-perception-quiz, ID: f425493b-49a2-4e49-a4e2-80abc393c25d)
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377', -- Generated UUID for the question
  'What is visual thinking?',
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID (duplicate)
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
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
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
  'quiz_id',
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  'questions',
  '48d164d7-08c8-4f00-ab3c-75cdf24cf377',
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
  '545ed7da-eb31-4b9c-9c07-827587051161', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Conscious, sequential, and slow/hard''',
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID (duplicate)
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
  '545ed7da-eb31-4b9c-9c07-827587051161',
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
  '545ed7da-eb31-4b9c-9c07-827587051161',
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
  '545ed7da-eb31-4b9c-9c07-827587051161',
  'quiz_id',
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  'questions',
  '545ed7da-eb31-4b9c-9c07-827587051161',
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
  'f29db76a-f01c-499f-92ed-3ce1bc5d5f17', -- Generated UUID for the question
  'Match the type of mental processing with the characteristic: ''Below the level of consciousness, very rapid''',
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID (duplicate)
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
  'f29db76a-f01c-499f-92ed-3ce1bc5d5f17',
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
  'f29db76a-f01c-499f-92ed-3ce1bc5d5f17',
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
  'f29db76a-f01c-499f-92ed-3ce1bc5d5f17',
  'quiz_id',
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  'questions',
  'f29db76a-f01c-499f-92ed-3ce1bc5d5f17',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c', -- Generated UUID for the question
  'What are the visual attribute triggers of pre-attentive processing?',
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- Quiz ID (duplicate)
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
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
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
  'quiz_id',
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f425493b-49a2-4e49-a4e2-80abc393c25d',
  'questions',
  '1fad3b0d-ea51-4a5b-b4b8-02adbbf61e6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Questions for quiz: The Why (Next Steps) Quiz (why-next-steps-quiz, ID: 86f852d1-8363-47c0-9699-6b059ab6d0c2)
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
  '86b085e0-934f-48a2-bde9-7bcad2107bf5', -- Generated UUID for the question
  'Who is Cicero?',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID (duplicate)
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
  '86b085e0-934f-48a2-bde9-7bcad2107bf5',
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
  '86b085e0-934f-48a2-bde9-7bcad2107bf5',
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
  '86b085e0-934f-48a2-bde9-7bcad2107bf5',
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
  '86b085e0-934f-48a2-bde9-7bcad2107bf5',
  'quiz_id',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  'questions',
  '86b085e0-934f-48a2-bde9-7bcad2107bf5',
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
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055', -- Generated UUID for the question
  'What is the ultimate objective of our presentation?',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID (duplicate)
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
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055',
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
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055',
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
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055',
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
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055',
  'quiz_id',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  'questions',
  'a23e3b8a-a450-4e24-8d82-d1a0f9aea055',
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
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6', -- Generated UUID for the question
  'Which of the following are reasonable next steps to follow your presentation?',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID (duplicate)
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
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6',
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
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6',
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
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6',
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
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6',
  'quiz_id',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  'questions',
  '9a7deb6b-5adc-4e78-9a42-c6e7fa2239f6',
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3', -- Generated UUID for the question
  'Where should the next steps go in your presentation?',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- Quiz ID (duplicate)
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
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
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
  'quiz_id',
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '86f852d1-8363-47c0-9699-6b059ab6d0c2',
  'questions',
  '93edca66-1d5a-4bb4-bc5f-c96cf945ebd3',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
