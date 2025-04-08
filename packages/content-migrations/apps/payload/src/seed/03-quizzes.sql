-- Seed data for the course quizzes table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

-- Insert quiz: Basic Graphs
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'c11dbb26-7561-4d12-88c8-141c653a43fd', -- UUID for the quiz
  'Basic Graphs',
  'basic-graphs-quiz',
  'Quiz on basic graph concepts and their applications',
  70, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Elements of Design in Detail
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '42564568-76bb-4405-88a9-8e9fd0a9154a', -- UUID for the quiz
  'Elements of Design in Detail',
  'elements-of-design-detail-quiz',
  'Comprehensive quiz on the detailed elements of design',
  75, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Fact and Persuasion
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '791e27de-2c98-49ef-b684-6c88667d1571', -- UUID for the quiz
  'Fact and Persuasion',
  'fact-persuasion-quiz',
  'Quiz on using facts for persuasive presentations',
  70, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Gestalt Principles
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '3c72b383-e17e-4b07-8a47-451cfbff29c0', -- UUID for the quiz
  'Gestalt Principles',
  'gestalt-principles-quiz',
  'Quiz on Gestalt principles and their application in design',
  70, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
