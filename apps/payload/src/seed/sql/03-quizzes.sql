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
  '698eaf60-ffcc-4450-bc46-8202d032e65c', -- UUID for the quiz
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
  'a2be4311-792a-4dc2-9d15-99b7074c49b1', -- UUID for the quiz
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
  '3dc3e085-709d-4846-b495-7ef77047f416', -- UUID for the quiz
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
  '0c369bce-d05a-4bd2-8a11-fade208de5b8', -- UUID for the quiz
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
  'fe5a9834-f60b-48dd-90cb-e6355b6e00bd', -- UUID for the quiz
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
  '82ba761c-2c66-48e4-8418-4d2ea7d770f2', -- UUID for the quiz
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
  '3a546ff7-78dd-41e8-8847-b4cf199e1100', -- UUID for the quiz
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
  'af855975-2786-4edf-89a6-ead475446a8a', -- UUID for the quiz
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
  'c5f1786d-7580-4b49-8706-ad2d93250bef', -- UUID for the quiz
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
  '3ca55c16-72a6-4981-bd68-312efbef9c82', -- UUID for the quiz
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
  'ba281b6c-c5d5-4be9-b04a-f86036e637f3', -- UUID for the quiz
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
  '5c742253-8857-4cc9-82c2-c8e71a6d5e24', -- UUID for the quiz
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
  '517ca44d-3d93-41e9-8287-f6c2d68258cb', -- UUID for the quiz
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
  'c313ef76-7686-4567-8776-ea84083d243b', -- UUID for the quiz
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
  '33398258-07a3-4d42-ad74-7592b4e8f0bf', -- UUID for the quiz
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
  '2c7ea3b2-9948-43da-acd0-ab1b1e5dcc60', -- UUID for the quiz
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
  'a9e38f50-9472-4029-8b2d-8718a08a10e8', -- UUID for the quiz
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
  '4f4c2dd7-6b01-46bd-b95c-f79c5f751a52', -- UUID for the quiz
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
  '055c3800-aedf-4393-aea2-53d418c09f60', -- UUID for the quiz
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
  'c11afa1e-996f-49fd-bb20-a0246ec0ffbe', -- UUID for the quiz
  'The Why (Next Steps) Quiz',
  'why-next-steps-quiz',
  'Quiz for The Why (Next Steps) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
