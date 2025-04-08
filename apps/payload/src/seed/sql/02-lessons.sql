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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f', -- Generated UUID for the lesson
  'Standard Graphs',
  'basic-graphs',
  'How to properly use graphs to display information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"74be3c05-f774-4e3c-bbe0-495580a17931\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  603,
  17, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7f0f3fd6-839f-4316-943f-bffe9f8f3b8f',
  'b48a3ab3-25a8-457f-a510-39ef3311ddb4',
  'b48a3ab3-25a8-457f-a510-39ef3311ddb4',
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
  '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f',
  'featured_image',
  '7f0f3fd6-839f-4316-943f-bffe9f8f3b8f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f',
  'quiz_id',
  'b48a3ab3-25a8-457f-a510-39ef3311ddb4',
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
  estimated_duration,
  course_id,
  featured_image_id,
  
  
  created_at,
  updated_at
) VALUES (
  'd3fbdda1-1cd9-4334-a761-c06d321d551d', -- Generated UUID for the lesson
  'Before we begin...',
  'before-we-begin',
  'A three question survey to help me understand your goals so I can better help you achieve them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"3yvYN6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  103,
  3, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '06b35d2b-c7dc-4d53-ba61-38dfcc9bfdbe',
  
  
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
  'd3fbdda1-1cd9-4334-a761-c06d321d551d',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd3fbdda1-1cd9-4334-a761-c06d321d551d',
  'featured_image',
  '06b35d2b-c7dc-4d53-ba61-38dfcc9bfdbe',
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
  estimated_duration,
  course_id,
  
  
  
  created_at,
  updated_at
) VALUES (
  '94870001-fb30-4e92-861c-0a4b776cd82a', -- Generated UUID for the lesson
  'Before you go...',
  'before-you-go',
  'Feedback',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  802,
  0, -- Set estimated_duration from lessonLength
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
  '94870001-fb30-4e92-861c-0a4b776cd82a',
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
  estimated_duration,
  course_id,
  
  
  
  created_at,
  updated_at
) VALUES (
  'd9263fcf-043b-4561-be30-5c3f19ec29b3', -- Generated UUID for the lesson
  'Congratulations',
  'congratulations',
  'Congratulations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% success /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  801,
  0, -- Set estimated_duration from lessonLength
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
  'd9263fcf-043b-4561-be30-5c3f19ec29b3',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'e2579a77-933b-40fc-ace4-b091d3651297', -- Generated UUID for the lesson
  'Overview of Fact-based Persuasion',
  'fact-based-persuasion',
  'Facts and how to present them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"1a745407-88b6-41ea-bfe1-fb1e5da7f2ef\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  604,
  10, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'b7c228f6-eac4-4dcc-a2b1-5c9f35b2bf8b',
  '9745028e-4973-4f74-9555-263befbb8a2d',
  '9745028e-4973-4f74-9555-263befbb8a2d',
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
  'e2579a77-933b-40fc-ace4-b091d3651297',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e2579a77-933b-40fc-ace4-b091d3651297',
  'featured_image',
  'b7c228f6-eac4-4dcc-a2b1-5c9f35b2bf8b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e2579a77-933b-40fc-ace4-b091d3651297',
  'quiz_id',
  '9745028e-4973-4f74-9555-263befbb8a2d',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '199e1eb2-f307-4e25-8e20-434ce7331d06', -- Generated UUID for the lesson
  'The Fundamental Elements of Design in Detail',
  'fundamental-design-detail',
  'Let''s go deep',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"d91060f9-9a36-4827-8f15-aa56cf8f6b7c\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  503,
  16, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7a26604c-2205-4219-af20-1141df03ad30',
  '72682adf-9d36-40f8-b0b8-dece9ca39b0f',
  '72682adf-9d36-40f8-b0b8-dece9ca39b0f',
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
  '199e1eb2-f307-4e25-8e20-434ce7331d06',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '199e1eb2-f307-4e25-8e20-434ce7331d06',
  'featured_image',
  '7a26604c-2205-4219-af20-1141df03ad30',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '199e1eb2-f307-4e25-8e20-434ce7331d06',
  'quiz_id',
  '72682adf-9d36-40f8-b0b8-dece9ca39b0f',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'ca6b3c4b-9278-43ca-8748-90e80ece8b3a', -- Generated UUID for the lesson
  'Overview of the Fundamental Elements of Design',
  'fundamental-design-overview',
  'A brief overview of the fundamentals',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  502,
  0, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'bb97aa53-88a6-472c-aca4-78a5732ada6e',
  '1ef6ab15-b344-4c0e-bea1-99b5df6f001e',
  '1ef6ab15-b344-4c0e-bea1-99b5df6f001e',
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
  'ca6b3c4b-9278-43ca-8748-90e80ece8b3a',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ca6b3c4b-9278-43ca-8748-90e80ece8b3a',
  'featured_image',
  'bb97aa53-88a6-472c-aca4-78a5732ada6e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ca6b3c4b-9278-43ca-8748-90e80ece8b3a',
  'quiz_id',
  '1ef6ab15-b344-4c0e-bea1-99b5df6f001e',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'a41f704e-d373-421c-87ff-21fd58238c2d', -- Generated UUID for the lesson
  'Gestalt Principles of Visual Perception',
  'gestalt-principles',
  'How we can apply principles of visual perception to better communicate our ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"e2256d0f-8a14-4567-9992-ac20713c9793\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  504,
  6, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '687a08b7-f3ad-47bd-a508-acad430a9d55',
  'aad1ab9e-a591-40a6-bd41-6789cdcfeffb',
  'aad1ab9e-a591-40a6-bd41-6789cdcfeffb',
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
  'a41f704e-d373-421c-87ff-21fd58238c2d',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a41f704e-d373-421c-87ff-21fd58238c2d',
  'featured_image',
  '687a08b7-f3ad-47bd-a508-acad430a9d55',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a41f704e-d373-421c-87ff-21fd58238c2d',
  'quiz_id',
  'aad1ab9e-a591-40a6-bd41-6789cdcfeffb',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '795e647c-076d-4752-8f5e-9e22f9a1e5c7', -- Generated UUID for the lesson
  'Idea Generation',
  'idea-generation',
  'How do we generate ideas on how to answer the audience''s question?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2caf80c4-e364-4565-b92e-a353d4e531ff\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  301,
  13, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'f9482dd0-195c-40be-9935-b55b69611f1b',
  'bced1ae3-db3e-41ac-b2f6-96e1cdea4abd',
  'bced1ae3-db3e-41ac-b2f6-96e1cdea4abd',
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
  '795e647c-076d-4752-8f5e-9e22f9a1e5c7',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '795e647c-076d-4752-8f5e-9e22f9a1e5c7',
  'featured_image',
  'f9482dd0-195c-40be-9935-b55b69611f1b',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '795e647c-076d-4752-8f5e-9e22f9a1e5c7',
  'quiz_id',
  'bced1ae3-db3e-41ac-b2f6-96e1cdea4abd',
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
  estimated_duration,
  course_id,
  featured_image_id,
  
  
  created_at,
  updated_at
) VALUES (
  '8ea3ffa1-2f54-4faa-a80c-7dec1a69fe5e', -- Generated UUID for the lesson
  'Welcome to DDM',
  'lesson-0',
  'A taster. A preview. An overview of SlideHeroes'' flagship presentations course - Decks for Decision Makers',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  101,
  8, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'c911ea70-c5a8-4402-8a49-0f284cddb180',
  
  
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
  '8ea3ffa1-2f54-4faa-a80c-7dec1a69fe5e',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '8ea3ffa1-2f54-4faa-a80c-7dec1a69fe5e',
  'featured_image',
  'c911ea70-c5a8-4402-8a49-0f284cddb180',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1', -- Generated UUID for the lesson
  'Our Process',
  'our-process',
  'Our blueprint for creating high quality presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"70b1f616-8e55-4c58-8898-c5cefa05417b\" /%}\r\n\r\nTo-Do\r\n\r\n- Complete the lesson quiz\r\n\r\nWatch\r\n\r\n- None\r\n\r\nRead\r\n\r\n- None\r\n\r\n{% custombullet status=\"right-arrow\" /%}Course Project\r\n\r\n- None\r\n\r\n### Lesson Downloads\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf\"\r\n   filedescription=\"''Our Process'' Lesson slides\" /%}\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf\"\r\n   filedescription=\"Second download (The Who)\" /%}\r\n\r\nThis is an R2 File","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  201,
  6, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'cf243f6a-36a8-4599-aef6-b8ce1b54418f',
  '12381d77-63c2-49e1-8677-dc8aac806665',
  '12381d77-63c2-49e1-8677-dc8aac806665',
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
  'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1',
  'featured_image',
  'cf243f6a-36a8-4599-aef6-b8ce1b54418f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1',
  'quiz_id',
  '12381d77-63c2-49e1-8677-dc8aac806665',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78', -- Generated UUID for the lesson
  'Performance',
  'performance',
  'Tips and techniques to improve the delivery of your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"04697977-e686-43c2-b12b-cc81ba1e5aec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  702,
  14, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'e200c957-4552-4a17-a54a-a72a2539fda0',
  '59ee15ce-707e-4a6b-9da3-c0c6dc09187e',
  '59ee15ce-707e-4a6b-9da3-c0c6dc09187e',
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
  '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78',
  'featured_image',
  'e200c957-4552-4a17-a54a-a72a2539fda0',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78',
  'quiz_id',
  '59ee15ce-707e-4a6b-9da3-c0c6dc09187e',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '7ac361db-1032-4d71-b7f8-6502747b1313', -- Generated UUID for the lesson
  'Preparation and Practice',
  'preparation-practice',
  'How to prepare for your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"582ab921-8eec-45c2-9223-c54fed288be9\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  701,
  16, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'd311bbd2-cb06-4984-aeff-fd30003f8344',
  'd21b373b-2e76-4bfd-ba80-cc765d93f173',
  'd21b373b-2e76-4bfd-ba80-cc765d93f173',
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
  '7ac361db-1032-4d71-b7f8-6502747b1313',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7ac361db-1032-4d71-b7f8-6502747b1313',
  'featured_image',
  'd311bbd2-cb06-4984-aeff-fd30003f8344',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7ac361db-1032-4d71-b7f8-6502747b1313',
  'quiz_id',
  'd21b373b-2e76-4bfd-ba80-cc765d93f173',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d', -- Generated UUID for the lesson
  'Slide Composition',
  'slide-composition',
  'How to best design slides',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"08100ca6-f998-42dc-8924-4a6d7f8bffeb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  511,
  13, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '33fcc5f1-f82a-43f2-8668-e9354ae33810',
  '511130c3-981f-4666-aceb-bd9d18c46857',
  '511130c3-981f-4666-aceb-bd9d18c46857',
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
  'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d',
  'featured_image',
  '33fcc5f1-f82a-43f2-8668-e9354ae33810',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d',
  'quiz_id',
  '511130c3-981f-4666-aceb-bd9d18c46857',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '326996b2-e276-490e-80d7-aa84c048b79a', -- Generated UUID for the lesson
  'Specialist Graphs',
  'specialist-graphs',
  'Introduction to some common business graphs like the Marimekko and Waterfall',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"579076d8-e225-497d-8ff3-52fad07c9640\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  611,
  8, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '40fedb80-11ef-42f0-be56-9013bc80bf6f',
  'ce0de613-77d2-4cb4-8a78-4c44a475aa5b',
  'ce0de613-77d2-4cb4-8a78-4c44a475aa5b',
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
  '326996b2-e276-490e-80d7-aa84c048b79a',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '326996b2-e276-490e-80d7-aa84c048b79a',
  'featured_image',
  '40fedb80-11ef-42f0-be56-9013bc80bf6f',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '326996b2-e276-490e-80d7-aa84c048b79a',
  'quiz_id',
  'ce0de613-77d2-4cb4-8a78-4c44a475aa5b',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '41c70129-a61e-4c28-9984-5d9d99eec970', -- Generated UUID for the lesson
  'Storyboards in Film',
  'storyboards-film',
  'The origin of storyboarding',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  402,
  0, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '387ae9c1-09c1-4a82-a865-51abb4f85cfd',
  '930424d4-65cd-48e6-9f30-7bb3da41c82b',
  '930424d4-65cd-48e6-9f30-7bb3da41c82b',
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
  '41c70129-a61e-4c28-9984-5d9d99eec970',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '41c70129-a61e-4c28-9984-5d9d99eec970',
  'featured_image',
  '387ae9c1-09c1-4a82-a865-51abb4f85cfd',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '41c70129-a61e-4c28-9984-5d9d99eec970',
  'quiz_id',
  '930424d4-65cd-48e6-9f30-7bb3da41c82b',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'fe87137c-66c5-44ac-83d7-0868f078af92', -- Generated UUID for the lesson
  'Storyboards in Presentations',
  'storyboards-presentations',
  '',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"7f63356c-2bca-4c36-8765-4fe9efd59d71\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  403,
  10, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '3780db29-99a2-4b19-b8d1-1b69619c2b6e',
  '45417960-af6b-440b-b233-783adf3b398a',
  '45417960-af6b-440b-b233-783adf3b398a',
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
  'fe87137c-66c5-44ac-83d7-0868f078af92',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fe87137c-66c5-44ac-83d7-0868f078af92',
  'featured_image',
  '3780db29-99a2-4b19-b8d1-1b69619c2b6e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'fe87137c-66c5-44ac-83d7-0868f078af92',
  'quiz_id',
  '45417960-af6b-440b-b233-783adf3b398a',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458', -- Generated UUID for the lesson
  'Tables vs. Graphs',
  'tables-vs-graphs',
  'How to use graphs and tabl;es to present quantitative information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"aae42644-8e3a-4ef3-a186-869f802869eb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  602,
  5, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '06476442-bf96-46df-ab22-512a421b117e',
  '475d945e-3339-49bd-8656-12f5b58447d0',
  '475d945e-3339-49bd-8656-12f5b58447d0',
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
  '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458',
  'featured_image',
  '06476442-bf96-46df-ab22-512a421b117e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458',
  'quiz_id',
  '475d945e-3339-49bd-8656-12f5b58447d0',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd', -- Generated UUID for the lesson
  'The Who',
  'the-who',
  'Where do we start? We start with defining who our actual audience is',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"8e80b4f3-76d4-44a3-994b-29937ee870ec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  202,
  15, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '20a1fe91-bae3-47b9-9208-d2bb2f4df24e',
  'b544658d-e4e0-4d28-bc00-52e9348392f9',
  'b544658d-e4e0-4d28-bc00-52e9348392f9',
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
  '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd',
  'featured_image',
  '20a1fe91-bae3-47b9-9208-d2bb2f4df24e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd',
  'quiz_id',
  'b544658d-e4e0-4d28-bc00-52e9348392f9',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '4197bbda-80a4-4cf6-b09e-668be2416115', -- Generated UUID for the lesson
  'The Why: Building the Introduction',
  'the-why-introductions',
  'How to tee-up your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"eaa1e745-ec67-42c4-b474-e34bd6bdc830\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  203,
  13, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '4c1e8035-1eb1-4bba-be99-24f3808326b7',
  'c162a80e-bef5-4753-b58b-c22370f55c10',
  'c162a80e-bef5-4753-b58b-c22370f55c10',
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
  '4197bbda-80a4-4cf6-b09e-668be2416115',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4197bbda-80a4-4cf6-b09e-668be2416115',
  'featured_image',
  '4c1e8035-1eb1-4bba-be99-24f3808326b7',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4197bbda-80a4-4cf6-b09e-668be2416115',
  'quiz_id',
  'c162a80e-bef5-4753-b58b-c22370f55c10',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'cf729d29-8734-4805-aded-c2d5ca5c463e', -- Generated UUID for the lesson
  'The Why: Next Steps',
  'the-why-next-steps',
  'What do we want to accomplish from our presentation? What is our ultimate objective?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"22511e58-40ce-4f11-9961-90070c1a3e94\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  204,
  5, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '88ae0836-e5c3-4398-b115-3eebef32d051',
  'd5f4f1a6-c0fe-4c45-9baf-cdfdc88e37f9',
  'd5f4f1a6-c0fe-4c45-9baf-cdfdc88e37f9',
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
  'cf729d29-8734-4805-aded-c2d5ca5c463e',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cf729d29-8734-4805-aded-c2d5ca5c463e',
  'featured_image',
  '88ae0836-e5c3-4398-b115-3eebef32d051',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cf729d29-8734-4805-aded-c2d5ca5c463e',
  'quiz_id',
  'd5f4f1a6-c0fe-4c45-9baf-cdfdc88e37f9',
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
  estimated_duration,
  course_id,
  featured_image_id,
  
  
  created_at,
  updated_at
) VALUES (
  'dfb703d8-0035-460c-aba9-6f455a7a4f79', -- Generated UUID for the lesson
  'Presentation Tools & Course Resources',
  'tools-and-resources',
  'Links to some recommended presentation tools + all course materials and downloads',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This page includes links to all course material and downloads.\r\n\r\nI have also included a table listing my current recommendations of the web''s best tools, reference sites, and apps for helping create great presentations.\r\n\r\nLet me know if I have missed any!\r\n\r\nBe sure to bookmark this page for your reference and convenience.\r\n\r\n**Course related downloads**\r\n\r\nSlideHeroes Business Presentation PowerPoint Template: Over 1,000 slide templates\r\n\r\nBlank Audience Map pdf\r\n\r\nLesson slides: pdfs of slides used for each lesson\r\n\r\nGolden Rules Pack: a pdf summary of the SlideHeroes Golden Rules\r\n\r\n**Recommended tools, websites, and resources**","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  104,
  10, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'a4612cc1-aaa8-4637-a9b5-5224498f6d39',
  
  
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
  'dfb703d8-0035-460c-aba9-6f455a7a4f79',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'dfb703d8-0035-460c-aba9-6f455a7a4f79',
  'featured_image',
  'a4612cc1-aaa8-4637-a9b5-5224498f6d39',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'a6ef3743-5ee2-457e-a054-fc10c53aa842', -- Generated UUID for the lesson
  'Using Stories',
  'using-stories',
  'Using stories to powerfully convey your ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"f311d324-c0ca-4157-afeb-bba29e71a9ce\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  401,
  15, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '839b212d-68d5-4960-b9ef-c5cff0db28c8',
  'b976d4fe-e907-45fe-9beb-6a8c9a152c72',
  'b976d4fe-e907-45fe-9beb-6a8c9a152c72',
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
  'a6ef3743-5ee2-457e-a054-fc10c53aa842',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6ef3743-5ee2-457e-a054-fc10c53aa842',
  'featured_image',
  '839b212d-68d5-4960-b9ef-c5cff0db28c8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a6ef3743-5ee2-457e-a054-fc10c53aa842',
  'quiz_id',
  'b976d4fe-e907-45fe-9beb-6a8c9a152c72',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  '3a720817-1aae-4080-8f50-f81179d3dbd0', -- Generated UUID for the lesson
  'Visual Perception and Communication',
  'visual-perception',
  'What are the implications from how people process information?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"5c9b5f03-f5d0-479a-84b2-2cd489fc8584\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  501,
  8, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '4cd164fc-33a3-47ee-aaeb-c5d847805c6c',
  '868717f4-e922-41fb-be0f-40f145095ec0',
  '868717f4-e922-41fb-be0f-40f145095ec0',
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
  '3a720817-1aae-4080-8f50-f81179d3dbd0',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a720817-1aae-4080-8f50-f81179d3dbd0',
  'featured_image',
  '4cd164fc-33a3-47ee-aaeb-c5d847805c6c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a720817-1aae-4080-8f50-f81179d3dbd0',
  'quiz_id',
  '868717f4-e922-41fb-be0f-40f145095ec0',
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
  estimated_duration,
  course_id,
  featured_image_id,
  quiz_id,
  quiz_id_id,
  created_at,
  updated_at
) VALUES (
  'ff79145d-c2f7-468f-bf11-38ef3cc3783b', -- Generated UUID for the lesson
  'What is Structure?',
  'what-is-structure',
  'Techniques to develop ensure clarity through structure',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"17d23794-696e-41df-af6c-faf9b54bd87d\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  302,
  22, -- Set estimated_duration from lessonLength
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '754278cb-ed7e-466a-8a74-e12de3153acb',
  'ad0aac61-8c6c-4359-9c33-8ddd1f36ba04',
  'ad0aac61-8c6c-4359-9c33-8ddd1f36ba04',
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
  'ff79145d-c2f7-468f-bf11-38ef3cc3783b',
  'course',
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ff79145d-c2f7-468f-bf11-38ef3cc3783b',
  'featured_image',
  '754278cb-ed7e-466a-8a74-e12de3153acb',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ff79145d-c2f7-468f-bf11-38ef3cc3783b',
  'quiz_id',
  'ad0aac61-8c6c-4359-9c33-8ddd1f36ba04',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
