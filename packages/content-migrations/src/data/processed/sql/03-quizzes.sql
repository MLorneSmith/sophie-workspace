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
  '14450dcf-6d51-4965-9b76-7dd28c64a1b8', -- UUID for the quiz
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
  '4da9c254-8b34-4c48-8e1d-45fe67b34832', -- UUID for the quiz
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
  '5b771702-b668-46a3-96a9-51aaf4c3d594', -- UUID for the quiz
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
  '9d7f5d91-4319-4434-ab3d-0b2124375fdd', -- UUID for the quiz
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
  '85188e94-f1a4-4d20-97b1-ea3cf9639e35', -- UUID for the quiz
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
  '4d4f5fcf-6605-468d-ac61-02f87ee2aef9', -- UUID for the quiz
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
  'e3893886-583c-4c58-8cd4-ca070e2ac710', -- UUID for the quiz
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
  '2bce015d-492e-4588-87e9-d368825496de', -- UUID for the quiz
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
  'ded02ed0-99b3-494b-a1db-31cfdbf9697d', -- UUID for the quiz
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
  '2421b7d4-1d10-4201-8709-220c66531246', -- UUID for the quiz
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
  '47573ab2-6013-4034-b0ef-fe708e1d1c69', -- UUID for the quiz
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
  '1df73e2c-e53b-4364-8664-f05106a23541', -- UUID for the quiz
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
  'c17c9ae3-8438-43dd-8cbf-c639c189ea85', -- UUID for the quiz
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
  '1f310402-d8c6-41ba-b0af-536e4ececf1f', -- UUID for the quiz
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
  '751fd27e-1051-4c04-97a0-b1c71e4eba91', -- UUID for the quiz
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
  '63e66a51-40d4-4649-82a4-e87a99bf31fa', -- UUID for the quiz
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
  'a44d735a-66f5-43b3-8220-4ff86f61c935', -- UUID for the quiz
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
  '3a131d77-cf4e-4e70-8fd1-9a61527c298b', -- UUID for the quiz
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
  'f425493b-49a2-4e49-a4e2-80abc393c25d', -- UUID for the quiz
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
  '86f852d1-8363-47c0-9699-6b059ab6d0c2', -- UUID for the quiz
  'The Why (Next Steps) Quiz',
  'why-next-steps-quiz',
  'Quiz for The Why (Next Steps) Quiz',
  70, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

-- Commit the transaction
COMMIT;
