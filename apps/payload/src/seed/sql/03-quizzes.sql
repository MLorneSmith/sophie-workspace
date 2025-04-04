-- Seed data for the course quizzes table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

-- Insert quiz: Standard Graphs Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'c2c51c38-7168-4d78-b7a2-b2ff458c59e0', -- UUID for the quiz
  'Standard Graphs Quiz',
  'basic-graphs-quiz',
  'Quiz for Standard Graphs Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: The Fundamental Elements of Design in Detail Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '5a579da9-d321-41f2-bb3b-d57d09ebec5a', -- UUID for the quiz
  'The Fundamental Elements of Design in Detail Quiz',
  'elements-of-design-detail-quiz',
  'Quiz for The Fundamental Elements of Design in Detail Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Overview of Fact-based Persuasion Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '783859c9-4f4a-4023-88d3-1a74586000ea', -- UUID for the quiz
  'Overview of Fact-based Persuasion Quiz',
  'fact-persuasion-quiz',
  'Quiz for Overview of Fact-based Persuasion Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Gestalt Principles of Visual Perception Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '59435a9e-f91e-4189-89c9-0f29bb677dc9', -- UUID for the quiz
  'Gestalt Principles of Visual Perception Quiz',
  'gestalt-principles-quiz',
  'Quiz for Gestalt Principles of Visual Perception Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Idea Generation Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '0e488661-f74c-4c16-9121-477523907ba8', -- UUID for the quiz
  'Idea Generation Quiz',
  'idea-generation-quiz',
  'Quiz for Idea Generation Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: The Why (Introductions) Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '6a02b987-809a-48a8-90b9-ef4c3cc4b82d', -- UUID for the quiz
  'The Why (Introductions) Quiz',
  'introductions-quiz',
  'Quiz for The Why (Introductions) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Our Process Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '431ccf68-005e-40df-b4e2-234cb344fc61', -- UUID for the quiz
  'Our Process Quiz',
  'our-process-quiz',
  'Quiz for Our Process Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Overview of the Fundamental Elements of Design Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '0d40e5bc-3223-47ba-9d26-7731309247e8', -- UUID for the quiz
  'Overview of the Fundamental Elements of Design Quiz',
  'overview-elements-of-design-quiz',
  'Quiz for Overview of the Fundamental Elements of Design Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Performance Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'df6a9a59-90b3-444c-b182-0492f93fe2be', -- UUID for the quiz
  'Performance Quiz',
  'performance-quiz',
  'Quiz for Performance Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Perparation & Practice Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'a251cbf9-2aae-4de1-8e28-d27e6ee21229', -- UUID for the quiz
  'Perparation & Practice Quiz',
  'preparation-practice-quiz',
  'Quiz for Perparation & Practice Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Slide Composition Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '6dea5f7e-95ac-4755-9718-091a8d8ad2e0', -- UUID for the quiz
  'Slide Composition Quiz',
  'slide-composition-quiz',
  'Quiz for Slide Composition Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Specialist Graphs Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '4e310937-8969-4e2c-bee3-126bd2e0dbd7', -- UUID for the quiz
  'Specialist Graphs Quiz',
  'specialist-graphs-quiz',
  'Quiz for Specialist Graphs Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Storyboards in Film Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '61112599-1ba2-419f-af4d-0bd4e7ac7358', -- UUID for the quiz
  'Storyboards in Film Quiz',
  'storyboards-in-film-quiz',
  'Quiz for Storyboards in Film Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Storyboards in Presentations Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'b7d8d4fd-11c5-4cc8-9cc2-a4bea86f874d', -- UUID for the quiz
  'Storyboards in Presentations Quiz',
  'storyboards-in-presentations-quiz',
  'Quiz for Storyboards in Presentations Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: What is Structure? Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'f284bb91-d192-4246-8d5c-768162622c44', -- UUID for the quiz
  'What is Structure? Quiz',
  'structure-quiz',
  'Quiz for What is Structure? Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Tables vs Graphs Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '4fe1eec4-39b8-4b19-9d4f-193bf1b808c6', -- UUID for the quiz
  'Tables vs Graphs Quiz',
  'tables-vs-graphs-quiz',
  'Quiz for Tables vs Graphs Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: The Who Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '3262dfef-44ce-4bc5-95f7-ed83c5a04799', -- UUID for the quiz
  'The Who Quiz',
  'the-who-quiz',
  'Quiz for The Who Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Using Stories Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  'a19f8463-2bc2-4c10-89d5-09d7a7f1d8bd', -- UUID for the quiz
  'Using Stories Quiz',
  'using-stories-quiz',
  'Quiz for Using Stories Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: Visual Perception and Communication Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '09fedf13-0b88-4b7e-aa0e-90e77de8e13d', -- UUID for the quiz
  'Visual Perception and Communication Quiz',
  'visual-perception-quiz',
  'Quiz for Visual Perception and Communication Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Insert quiz: The Why (Next Steps) Quiz
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '77bff2ea-052c-4d92-88d2-b18db431253f', -- UUID for the quiz
  'The Why (Next Steps) Quiz',
  'why-next-steps-quiz',
  'Quiz for The Why (Next Steps) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
