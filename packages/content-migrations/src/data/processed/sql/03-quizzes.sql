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
  'eaae2bca-9333-415f-9c04-5945d247ba7f', -- UUID for the quiz
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
  '39947494-081f-48f0-b810-5ff6a76cc239', -- UUID for the quiz
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
  '6c38f350-7194-4c87-b020-a874e5fb7380', -- UUID for the quiz
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
  '1f398711-01db-409c-81ae-c36c6d692020', -- UUID for the quiz
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
  'c33a575c-ab74-4f6d-af06-a9d50465794c', -- UUID for the quiz
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
  '388995ef-f2a1-471e-a6c0-49c29c6f519c', -- UUID for the quiz
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
  '97c2ce1c-9435-4b57-86e2-c1177c2234c2', -- UUID for the quiz
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
  '318848e0-95a1-499d-b154-f93cb146d32d', -- UUID for the quiz
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
  '4cdebb01-ddf3-4c57-9967-3674d2d4b160', -- UUID for the quiz
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
  '1980df95-649a-4756-8365-be4896232d7e', -- UUID for the quiz
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
  'e24f2173-c214-47c6-bf9c-9788033d7c2c', -- UUID for the quiz
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
  '5030eae7-bb4c-4278-a21d-14c15ec1ea86', -- UUID for the quiz
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
  '4cd1a1eb-79da-41c7-9a04-2dbdcdb84f27', -- UUID for the quiz
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
  '0252961e-9b59-4c9d-9289-2f04b053bf6e', -- UUID for the quiz
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
  '4a503b5e-8afd-4d28-8eb1-6e6ac22ac9d7', -- UUID for the quiz
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
  '5234f1e6-e5b2-4185-9688-47586bbcc719', -- UUID for the quiz
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
  'e07e2703-4c97-4ce4-8fa3-7178361da241', -- UUID for the quiz
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
  '248435da-d1cb-4824-bb34-33a124e302bf', -- UUID for the quiz
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
  '808e35c4-be90-4aa2-ac07-07056beaeb83', -- UUID for the quiz
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
  'eca60681-b2ae-4346-890a-7f288e8e0499', -- UUID for the quiz
  'The Why (Next Steps) Quiz',
  'why-next-steps-quiz',
  'Quiz for The Why (Next Steps) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
