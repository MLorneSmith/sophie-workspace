-- Seed data for the course lessons table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

-- Insert lesson: Standard Graphs
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'c3184dad-df10-4cd8-b332-a0769194bc0a', -- Generated UUID for the lesson
  'Standard Graphs',
  'basic-graphs',
  'How to properly use graphs to display information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"74be3c05-f774-4e3c-bbe0-495580a17931\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  603,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c3184dad-df10-4cd8-b332-a0769194bc0a',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Before we begin...
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'c145126b-004e-4bec-993b-8802100aff4b', -- Generated UUID for the lesson
  'Before we begin...',
  'before-we-begin',
  'A three question survey to help me understand your goals so I can better help you achieve them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"3yvYN6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  103,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c145126b-004e-4bec-993b-8802100aff4b',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Before you go...
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'fa3394f9-2ef8-49f9-b46a-2dd29054daab', -- Generated UUID for the lesson
  'Before you go...',
  'before-you-go',
  'Feedback',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  802,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fa3394f9-2ef8-49f9-b46a-2dd29054daab',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Congratulations
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '05867399-887b-4762-a01d-5462692b812e', -- Generated UUID for the lesson
  'Congratulations',
  'congratulations',
  'Congratulations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% success /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  801,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '05867399-887b-4762-a01d-5462692b812e',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Overview of Fact-based Persuasion
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'c8d15cfc-23ec-47b9-afbe-40d0aa4d8680', -- Generated UUID for the lesson
  'Overview of Fact-based Persuasion',
  'fact-based-persuasion',
  'Facts and how to present them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"1a745407-88b6-41ea-bfe1-fb1e5da7f2ef\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  604,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c8d15cfc-23ec-47b9-afbe-40d0aa4d8680',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: The Fundamental Elements of Design in Detail
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'ce059378-f0a6-402f-b669-a9109bd05f3d', -- Generated UUID for the lesson
  'The Fundamental Elements of Design in Detail',
  'fundamental-design-detail',
  'Let''s go deep',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"d91060f9-9a36-4827-8f15-aa56cf8f6b7c\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  503,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ce059378-f0a6-402f-b669-a9109bd05f3d',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Overview of the Fundamental Elements of Design
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'e9dfe142-bb89-4a66-aff8-9af80c2bfa53', -- Generated UUID for the lesson
  'Overview of the Fundamental Elements of Design',
  'fundamental-design-overview',
  'A brief overview of the fundamentals',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  502,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e9dfe142-bb89-4a66-aff8-9af80c2bfa53',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Gestalt Principles of Visual Perception
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'f3a63a8e-72a7-49b4-90e4-b00d1591da5c', -- Generated UUID for the lesson
  'Gestalt Principles of Visual Perception',
  'gestalt-principles',
  'How we can apply principles of visual perception to better communicate our ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"e2256d0f-8a14-4567-9992-ac20713c9793\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  504,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f3a63a8e-72a7-49b4-90e4-b00d1591da5c',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Idea Generation
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '427590c3-e635-49d9-acf7-31bc51f36969', -- Generated UUID for the lesson
  'Idea Generation',
  'idea-generation',
  'How do we generate ideas on how to answer the audience''s question?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2caf80c4-e364-4565-b92e-a353d4e531ff\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  301,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '427590c3-e635-49d9-acf7-31bc51f36969',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Welcome to DDM
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'ba4e1133-fc58-45e7-97e3-8342f5c65303', -- Generated UUID for the lesson
  'Welcome to DDM',
  'lesson-0',
  'A taster. A preview. An overview of SlideHeroes'' flagship presentations course - Decks for Decision Makers',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  101,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ba4e1133-fc58-45e7-97e3-8342f5c65303',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Our Process
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '8acf85c6-6ae5-452c-9116-24264c70a7cd', -- Generated UUID for the lesson
  'Our Process',
  'our-process',
  'Our blueprint for creating high quality presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"70b1f616-8e55-4c58-8898-c5cefa05417b\" /%}\r\n\r\nTo-Do\r\n\r\n- Complete the lesson quiz\r\n\r\nWatch\r\n\r\n- None\r\n\r\nRead\r\n\r\n- None\r\n\r\n{% custombullet status=\"right-arrow\" /%}Course Project\r\n\r\n- None\r\n\r\n### Lesson Downloads\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf\"\r\n   filedescription=\"''Our Process'' Lesson slides\" /%}\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf\"\r\n   filedescription=\"Second download (The Who)\" /%}\r\n\r\nThis is an R2 File","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  201,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '8acf85c6-6ae5-452c-9116-24264c70a7cd',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Performance
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '72d47bd9-2203-4289-9bda-a18c50bec957', -- Generated UUID for the lesson
  'Performance',
  'performance',
  'Tips and techniques to improve the delivery of your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"04697977-e686-43c2-b12b-cc81ba1e5aec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  702,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '72d47bd9-2203-4289-9bda-a18c50bec957',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Preparation and Practice
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '096d2ced-bc95-4322-85d6-182b42d48d6c', -- Generated UUID for the lesson
  'Preparation and Practice',
  'preparation-practice',
  'How to prepare for your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"582ab921-8eec-45c2-9223-c54fed288be9\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  701,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '096d2ced-bc95-4322-85d6-182b42d48d6c',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: High-Stakes Presentation Skills Self-Assessment
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '9a366618-44b5-4861-9cf6-7d3e6b1b9935', -- Generated UUID for the lesson
  'High-Stakes Presentation Skills Self-Assessment',
  'skills-self-assessment',
  'Twenty-five question long survey to identify your current strengths and weaknesses',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"nrPaep?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  102,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9a366618-44b5-4861-9cf6-7d3e6b1b9935',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Slide Composition
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '787f10ec-c0b6-4442-a5ff-fa2783025763', -- Generated UUID for the lesson
  'Slide Composition',
  'slide-composition',
  'How to best design slides',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"08100ca6-f998-42dc-8924-4a6d7f8bffeb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  511,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '787f10ec-c0b6-4442-a5ff-fa2783025763',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Specialist Graphs
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '2a9a8352-ed99-41bf-a483-087bd88bfa7c', -- Generated UUID for the lesson
  'Specialist Graphs',
  'specialist-graphs',
  'Introduction to some common business graphs like the Marimekko and Waterfall',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"579076d8-e225-497d-8ff3-52fad07c9640\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  611,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2a9a8352-ed99-41bf-a483-087bd88bfa7c',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Storyboards in Film
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'a60a4ba8-b61d-4d9c-a6ab-45a98991d35d', -- Generated UUID for the lesson
  'Storyboards in Film',
  'storyboards-film',
  'The origin of storyboarding',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  402,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a60a4ba8-b61d-4d9c-a6ab-45a98991d35d',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Storyboards in Presentations
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '747efe85-2513-4906-b62b-402b90538ad9', -- Generated UUID for the lesson
  'Storyboards in Presentations',
  'storyboards-presentations',
  '',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"7f63356c-2bca-4c36-8765-4fe9efd59d71\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  403,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '747efe85-2513-4906-b62b-402b90538ad9',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Tables vs. Graphs
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '7b50678a-7f1f-47db-ba0c-f63822ef34d6', -- Generated UUID for the lesson
  'Tables vs. Graphs',
  'tables-vs-graphs',
  'How to use graphs and tabl;es to present quantitative information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"aae42644-8e3a-4ef3-a186-869f802869eb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  602,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7b50678a-7f1f-47db-ba0c-f63822ef34d6',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: The Who
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '004089bb-2eea-40a3-b18a-d2474b2e2104', -- Generated UUID for the lesson
  'The Who',
  'the-who',
  'Where do we start? We start with defining who our actual audience is',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"8e80b4f3-76d4-44a3-994b-29937ee870ec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  202,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '004089bb-2eea-40a3-b18a-d2474b2e2104',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: The Why: Building the Introduction
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '2a5d1217-7cd7-4043-9173-3c91b4a9f3a7', -- Generated UUID for the lesson
  'The Why: Building the Introduction',
  'the-why-introductions',
  'How to tee-up your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"eaa1e745-ec67-42c4-b474-e34bd6bdc830\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  203,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2a5d1217-7cd7-4043-9173-3c91b4a9f3a7',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: The Why: Next Steps
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '956e6ab3-8507-48ba-9c88-8855caab47fb', -- Generated UUID for the lesson
  'The Why: Next Steps',
  'the-why-next-steps',
  'What do we want to accomplish from our presentation? What is our ultimate objective?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"22511e58-40ce-4f11-9961-90070c1a3e94\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  204,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '956e6ab3-8507-48ba-9c88-8855caab47fb',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Presentation Tools & Course Resources
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  'fc9bbeeb-4d1d-493e-af9f-564028d6525a', -- Generated UUID for the lesson
  'Presentation Tools & Course Resources',
  'tools-and-resources',
  'Links to some recommended presentation tools + all course materials and downloads',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This page includes links to all course material and downloads.\r\n\r\nI have also included a table listing my current recommendations of the web''s best tools, reference sites, and apps for helping create great presentations.\r\n\r\nLet me know if I have missed any!\r\n\r\nBe sure to bookmark this page for your reference and convenience.\r\n\r\n**Course related downloads**\r\n\r\nSlideHeroes Business Presentation PowerPoint Template: Over 1,000 slide templates\r\n\r\nBlank Audience Map pdf\r\n\r\nLesson slides: pdfs of slides used for each lesson\r\n\r\nGolden Rules Pack: a pdf summary of the SlideHeroes Golden Rules\r\n\r\n**Recommended tools, websites, and resources**","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  104,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fc9bbeeb-4d1d-493e-af9f-564028d6525a',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Using Stories
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '5df3c7f6-8107-4086-b403-707ac7b15a0a', -- Generated UUID for the lesson
  'Using Stories',
  'using-stories',
  'Using stories to powerfully convey your ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"f311d324-c0ca-4157-afeb-bba29e71a9ce\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  401,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5df3c7f6-8107-4086-b403-707ac7b15a0a',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: Visual Perception and Communication
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '9984d2b7-1b20-4bcd-8634-ea87f94e83c0', -- Generated UUID for the lesson
  'Visual Perception and Communication',
  'visual-perception',
  'What are the implications from how people process information?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"5c9b5f03-f5d0-479a-84b2-2cd489fc8584\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  501,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9984d2b7-1b20-4bcd-8634-ea87f94e83c0',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Insert lesson: What is Structure?
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  created_at,
  updated_at
) VALUES (
  '461a377e-8726-4030-ae27-d4f3aaaad030', -- Generated UUID for the lesson
  'What is Structure?',
  'what-is-structure',
  'Techniques to develop ensure clarity through structure',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"17d23794-696e-41df-af6c-faf9b54bd87d\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  302,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '461a377e-8726-4030-ae27-d4f3aaaad030',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
