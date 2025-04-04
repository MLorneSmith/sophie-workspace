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
  '470c447f-6885-49fe-9c84-249cb1c04480', -- UUID for the quiz
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
  '50b6b87a-bb92-4483-811c-d38b56d54de6', -- UUID for the quiz
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
  '2461cd85-f877-49f9-ab53-daab8c8f25b1', -- UUID for the quiz
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
  '135545c9-fe92-453c-9e60-25f4c72509fe', -- UUID for the quiz
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
  '75a70a13-f2e4-4b5c-9a1a-757ab2ef1cc7', -- UUID for the quiz
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
  '92014dd4-e161-4f1f-94b8-a2c54e25da90', -- UUID for the quiz
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
  '9cfa29a8-9c66-4b08-8b2c-593473ddaa8b', -- UUID for the quiz
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
  '9e1bada1-c827-479d-a282-23fd13be9eb3', -- UUID for the quiz
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
  'dacacdd9-bf8c-4eb5-a115-7d158483dc4d', -- UUID for the quiz
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
  '909a146e-9333-4f1e-b4c4-4d4cb06089ae', -- UUID for the quiz
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
  '83269a98-714e-4c9b-b1ab-008942ee3cbc', -- UUID for the quiz
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
  '8f9a2d07-d96c-4707-b5d3-9df575267b34', -- UUID for the quiz
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
  '63225c84-a323-477b-b6a5-67509b747528', -- UUID for the quiz
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
  'aa8993d0-63db-4b13-95d3-bf5e8b6efab7', -- UUID for the quiz
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
  '724f6c3d-7243-48d6-a278-181f57a81097', -- UUID for the quiz
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
  '16902531-cef4-440f-b7ab-2ccc3894fe83', -- UUID for the quiz
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
  'e5d3387b-afa5-4ca9-b011-a39a6c5f0fba', -- UUID for the quiz
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
  'a7187d5b-1395-4a24-903f-8689b9c847c7', -- UUID for the quiz
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
  'a208d5c6-cedf-4701-89a5-2e9e2cffc052', -- UUID for the quiz
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
  '5065ffc6-aecb-4ecb-955d-37abc8c520bb', -- UUID for the quiz
  'The Why (Next Steps) Quiz',
  'why-next-steps-quiz',
  'Quiz for The Why (Next Steps) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
