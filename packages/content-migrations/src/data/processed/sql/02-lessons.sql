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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '28daa485-cd80-4e8f-ae07-e93dd182110c', -- Generated UUID for the lesson
  'Standard Graphs',
  'basic-graphs',
  'How to properly use graphs to display information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"74be3c05-f774-4e3c-bbe0-495580a17931\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  603,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'ad3771c9-739c-4980-a1a6-7b24b493d355',
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
  '28daa485-cd80-4e8f-ae07-e93dd182110c',
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
  '28daa485-cd80-4e8f-ae07-e93dd182110c',
  'featured_image',
  'ad3771c9-739c-4980-a1a6-7b24b493d355',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '4ff8398a-2e0f-49f8-ba67-ca3c800bba8c', -- Generated UUID for the lesson
  'Before we begin...',
  'before-we-begin',
  'A three question survey to help me understand your goals so I can better help you achieve them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"3yvYN6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  103,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '405a9a1a-86be-4932-a504-b732009834d5',
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
  '4ff8398a-2e0f-49f8-ba67-ca3c800bba8c',
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
  '4ff8398a-2e0f-49f8-ba67-ca3c800bba8c',
  'featured_image',
  '405a9a1a-86be-4932-a504-b732009834d5',
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
  '53f53ea2-3da1-4012-93dc-4667aa9e03c6', -- Generated UUID for the lesson
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
  '53f53ea2-3da1-4012-93dc-4667aa9e03c6',
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
  'd04becf9-5e48-4d35-96ac-8400788181ce', -- Generated UUID for the lesson
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
  'd04becf9-5e48-4d35-96ac-8400788181ce',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '8ea3dd64-84b6-4742-8569-4119b7bccf4d', -- Generated UUID for the lesson
  'Overview of Fact-based Persuasion',
  'fact-based-persuasion',
  'Facts and how to present them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"1a745407-88b6-41ea-bfe1-fb1e5da7f2ef\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  604,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '8ebb455e-59b9-4089-abe9-a3b4aaa3bd73',
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
  '8ea3dd64-84b6-4742-8569-4119b7bccf4d',
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
  '8ea3dd64-84b6-4742-8569-4119b7bccf4d',
  'featured_image',
  '8ebb455e-59b9-4089-abe9-a3b4aaa3bd73',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '18841e7b-e6a3-4f46-a831-9f6033699878', -- Generated UUID for the lesson
  'The Fundamental Elements of Design in Detail',
  'fundamental-design-detail',
  'Let''s go deep',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"d91060f9-9a36-4827-8f15-aa56cf8f6b7c\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  503,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '0b1ecf9f-b691-4f9a-bdf9-a89b4c4b952f',
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
  '18841e7b-e6a3-4f46-a831-9f6033699878',
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
  '18841e7b-e6a3-4f46-a831-9f6033699878',
  'featured_image',
  '0b1ecf9f-b691-4f9a-bdf9-a89b4c4b952f',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '405d74c8-6a4d-4593-aa66-3ff3166f591f', -- Generated UUID for the lesson
  'Overview of the Fundamental Elements of Design',
  'fundamental-design-overview',
  'A brief overview of the fundamentals',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  502,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'b04ddb27-d200-48f3-99f0-6484f1ceeddc',
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
  '405d74c8-6a4d-4593-aa66-3ff3166f591f',
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
  '405d74c8-6a4d-4593-aa66-3ff3166f591f',
  'featured_image',
  'b04ddb27-d200-48f3-99f0-6484f1ceeddc',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '1a9ae196-65d5-43c1-a227-32c6b92e081d', -- Generated UUID for the lesson
  'Gestalt Principles of Visual Perception',
  'gestalt-principles',
  'How we can apply principles of visual perception to better communicate our ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"e2256d0f-8a14-4567-9992-ac20713c9793\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  504,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '66069ac0-a7b4-42d6-a0e3-1da48e7e3a95',
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
  '1a9ae196-65d5-43c1-a227-32c6b92e081d',
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
  '1a9ae196-65d5-43c1-a227-32c6b92e081d',
  'featured_image',
  '66069ac0-a7b4-42d6-a0e3-1da48e7e3a95',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'f922a409-55bd-4afa-a2af-ecedfdbcb4fb', -- Generated UUID for the lesson
  'Idea Generation',
  'idea-generation',
  'How do we generate ideas on how to answer the audience''s question?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2caf80c4-e364-4565-b92e-a353d4e531ff\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  301,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7842b7a8-4aaf-45eb-8968-3b83407323dd',
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
  'f922a409-55bd-4afa-a2af-ecedfdbcb4fb',
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
  'f922a409-55bd-4afa-a2af-ecedfdbcb4fb',
  'featured_image',
  '7842b7a8-4aaf-45eb-8968-3b83407323dd',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '8d96160f-ae2a-4fc1-8b4b-4724e9b763ec', -- Generated UUID for the lesson
  'Welcome to DDM',
  'lesson-0',
  'A taster. A preview. An overview of SlideHeroes'' flagship presentations course - Decks for Decision Makers',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  101,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7c9316e7-0cbb-4c09-bd53-608701a9f807',
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
  '8d96160f-ae2a-4fc1-8b4b-4724e9b763ec',
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
  '8d96160f-ae2a-4fc1-8b4b-4724e9b763ec',
  'featured_image',
  '7c9316e7-0cbb-4c09-bd53-608701a9f807',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '5edb69b3-0555-4216-94c5-7b27aac0e49d', -- Generated UUID for the lesson
  'Our Process',
  'our-process',
  'Our blueprint for creating high quality presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"70b1f616-8e55-4c58-8898-c5cefa05417b\" /%}\r\n\r\nTo-Do\r\n\r\n- Complete the lesson quiz\r\n\r\nWatch\r\n\r\n- None\r\n\r\nRead\r\n\r\n- None\r\n\r\n{% custombullet status=\"right-arrow\" /%}Course Project\r\n\r\n- None\r\n\r\n### Lesson Downloads\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf\"\r\n   filedescription=\"''Our Process'' Lesson slides\" /%}\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf\"\r\n   filedescription=\"Second download (The Who)\" /%}\r\n\r\nThis is an R2 File","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  201,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7a622cd6-f15a-4dba-8d19-e7bcf1f84448',
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
  '5edb69b3-0555-4216-94c5-7b27aac0e49d',
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
  '5edb69b3-0555-4216-94c5-7b27aac0e49d',
  'featured_image',
  '7a622cd6-f15a-4dba-8d19-e7bcf1f84448',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'be641851-8ec2-416e-abe6-8f296fe5e312', -- Generated UUID for the lesson
  'Performance',
  'performance',
  'Tips and techniques to improve the delivery of your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"04697977-e686-43c2-b12b-cc81ba1e5aec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  702,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '2df07e79-365a-423c-9be0-ae69c9d44581',
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
  'be641851-8ec2-416e-abe6-8f296fe5e312',
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
  'be641851-8ec2-416e-abe6-8f296fe5e312',
  'featured_image',
  '2df07e79-365a-423c-9be0-ae69c9d44581',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '7dde103e-f3d3-47f3-b43d-21648574cb90', -- Generated UUID for the lesson
  'Preparation and Practice',
  'preparation-practice',
  'How to prepare for your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"582ab921-8eec-45c2-9223-c54fed288be9\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  701,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'c2fbc152-9bd5-401d-9bec-f7902866fd0c',
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
  '7dde103e-f3d3-47f3-b43d-21648574cb90',
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
  '7dde103e-f3d3-47f3-b43d-21648574cb90',
  'featured_image',
  'c2fbc152-9bd5-401d-9bec-f7902866fd0c',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '5276df34-5e93-4a3c-a5e2-20a198bb0bbf', -- Generated UUID for the lesson
  'Slide Composition',
  'slide-composition',
  'How to best design slides',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"08100ca6-f998-42dc-8924-4a6d7f8bffeb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  511,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '8b591d75-3300-4d42-a417-299e7bc6163c',
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
  '5276df34-5e93-4a3c-a5e2-20a198bb0bbf',
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
  '5276df34-5e93-4a3c-a5e2-20a198bb0bbf',
  'featured_image',
  '8b591d75-3300-4d42-a417-299e7bc6163c',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '576054fe-0c8a-4700-b4da-cf73720f9208', -- Generated UUID for the lesson
  'Specialist Graphs',
  'specialist-graphs',
  'Introduction to some common business graphs like the Marimekko and Waterfall',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"579076d8-e225-497d-8ff3-52fad07c9640\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  611,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '41f33b09-da9e-4bc5-8655-6367112dcb1d',
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
  '576054fe-0c8a-4700-b4da-cf73720f9208',
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
  '576054fe-0c8a-4700-b4da-cf73720f9208',
  'featured_image',
  '41f33b09-da9e-4bc5-8655-6367112dcb1d',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'c78239be-5ada-4a2b-9ae6-511e8ca9ee85', -- Generated UUID for the lesson
  'Storyboards in Film',
  'storyboards-film',
  'The origin of storyboarding',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  402,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '02ffd38e-5f50-4d3b-bd06-d67273143c84',
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
  'c78239be-5ada-4a2b-9ae6-511e8ca9ee85',
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
  'c78239be-5ada-4a2b-9ae6-511e8ca9ee85',
  'featured_image',
  '02ffd38e-5f50-4d3b-bd06-d67273143c84',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'b7df8575-3c58-4627-a721-cdb060406f31', -- Generated UUID for the lesson
  'Storyboards in Presentations',
  'storyboards-presentations',
  '',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"7f63356c-2bca-4c36-8765-4fe9efd59d71\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  403,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'cf4edd29-5824-4f54-ba8c-77419cb27db7',
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
  'b7df8575-3c58-4627-a721-cdb060406f31',
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
  'b7df8575-3c58-4627-a721-cdb060406f31',
  'featured_image',
  'cf4edd29-5824-4f54-ba8c-77419cb27db7',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '238821fb-2aa6-497c-b73b-aaec008a55bf', -- Generated UUID for the lesson
  'Tables vs. Graphs',
  'tables-vs-graphs',
  'How to use graphs and tabl;es to present quantitative information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"aae42644-8e3a-4ef3-a186-869f802869eb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  602,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '3778e154-93d6-4c27-87c8-4d29f9c17cf3',
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
  '238821fb-2aa6-497c-b73b-aaec008a55bf',
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
  '238821fb-2aa6-497c-b73b-aaec008a55bf',
  'featured_image',
  '3778e154-93d6-4c27-87c8-4d29f9c17cf3',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'd38716c0-89fa-412c-a1cb-aa8c757ed98a', -- Generated UUID for the lesson
  'The Who',
  'the-who',
  'Where do we start? We start with defining who our actual audience is',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"8e80b4f3-76d4-44a3-994b-29937ee870ec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  202,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '176c7b0b-bd16-4db0-8fd6-03f029170a39',
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
  'd38716c0-89fa-412c-a1cb-aa8c757ed98a',
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
  'd38716c0-89fa-412c-a1cb-aa8c757ed98a',
  'featured_image',
  '176c7b0b-bd16-4db0-8fd6-03f029170a39',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'efe5bcf9-516d-48aa-8504-0986718d78c7', -- Generated UUID for the lesson
  'The Why: Building the Introduction',
  'the-why-introductions',
  'How to tee-up your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"eaa1e745-ec67-42c4-b474-e34bd6bdc830\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  203,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '118a05e4-2329-4f31-8671-36ce26534055',
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
  'efe5bcf9-516d-48aa-8504-0986718d78c7',
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
  'efe5bcf9-516d-48aa-8504-0986718d78c7',
  'featured_image',
  '118a05e4-2329-4f31-8671-36ce26534055',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '0cfea3bc-15bc-479e-bb1e-de95b7f51d13', -- Generated UUID for the lesson
  'The Why: Next Steps',
  'the-why-next-steps',
  'What do we want to accomplish from our presentation? What is our ultimate objective?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"22511e58-40ce-4f11-9961-90070c1a3e94\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  204,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '4d51fbf5-a461-45c3-9e80-ffc249d1d2cb',
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
  '0cfea3bc-15bc-479e-bb1e-de95b7f51d13',
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
  '0cfea3bc-15bc-479e-bb1e-de95b7f51d13',
  'featured_image',
  '4d51fbf5-a461-45c3-9e80-ffc249d1d2cb',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '462606ff-59ed-4f3a-997a-fce5421dffe1', -- Generated UUID for the lesson
  'Presentation Tools & Course Resources',
  'tools-and-resources',
  'Links to some recommended presentation tools + all course materials and downloads',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This page includes links to all course material and downloads.\r\n\r\nI have also included a table listing my current recommendations of the web''s best tools, reference sites, and apps for helping create great presentations.\r\n\r\nLet me know if I have missed any!\r\n\r\nBe sure to bookmark this page for your reference and convenience.\r\n\r\n**Course related downloads**\r\n\r\nSlideHeroes Business Presentation PowerPoint Template: Over 1,000 slide templates\r\n\r\nBlank Audience Map pdf\r\n\r\nLesson slides: pdfs of slides used for each lesson\r\n\r\nGolden Rules Pack: a pdf summary of the SlideHeroes Golden Rules\r\n\r\n**Recommended tools, websites, and resources**","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  104,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '72e8deef-bae8-422b-b92b-cd3815d3ec0b',
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
  '462606ff-59ed-4f3a-997a-fce5421dffe1',
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
  '462606ff-59ed-4f3a-997a-fce5421dffe1',
  'featured_image',
  '72e8deef-bae8-422b-b92b-cd3815d3ec0b',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  '32dfdfb0-6adb-4ea7-96de-cad9852550d7', -- Generated UUID for the lesson
  'Using Stories',
  'using-stories',
  'Using stories to powerfully convey your ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"f311d324-c0ca-4157-afeb-bba29e71a9ce\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  401,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '9e400e7d-5723-469b-b0df-c0e2f5789b42',
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
  '32dfdfb0-6adb-4ea7-96de-cad9852550d7',
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
  '32dfdfb0-6adb-4ea7-96de-cad9852550d7',
  'featured_image',
  '9e400e7d-5723-469b-b0df-c0e2f5789b42',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'c963c2e6-0cdd-43fa-8001-5c8036ab1cc1', -- Generated UUID for the lesson
  'Visual Perception and Communication',
  'visual-perception',
  'What are the implications from how people process information?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"5c9b5f03-f5d0-479a-84b2-2cd489fc8584\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  501,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '4b23215a-7fde-43e9-b3cd-e4e442d79f4f',
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
  'c963c2e6-0cdd-43fa-8001-5c8036ab1cc1',
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
  'c963c2e6-0cdd-43fa-8001-5c8036ab1cc1',
  'featured_image',
  '4b23215a-7fde-43e9-b3cd-e4e442d79f4f',
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
  featured_image_id,
  created_at,
  updated_at
) VALUES (
  'bc5dfcf0-10a4-4b11-9860-005e67e8ed12', -- Generated UUID for the lesson
  'What is Structure?',
  'what-is-structure',
  'Techniques to develop ensure clarity through structure',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"17d23794-696e-41df-af6c-faf9b54bd87d\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  302,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'f79a5251-183a-4575-b02f-6255aeede947',
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
  'bc5dfcf0-10a4-4b11-9860-005e67e8ed12',
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
  'bc5dfcf0-10a4-4b11-9860-005e67e8ed12',
  'featured_image',
  'f79a5251-183a-4575-b02f-6255aeede947',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
