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
  '90d58d62-5451-4ea8-8d86-e9866a794119', -- Generated UUID for the lesson
  'Standard Graphs',
  'basic-graphs',
  'How to properly use graphs to display information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"74be3c05-f774-4e3c-bbe0-495580a17931\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  603,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'ac7017d0-e458-4879-b14f-6084116d7c83',
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
  '90d58d62-5451-4ea8-8d86-e9866a794119',
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
  '90d58d62-5451-4ea8-8d86-e9866a794119',
  'featured_image',
  'ac7017d0-e458-4879-b14f-6084116d7c83',
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
  '2184f47a-e045-4fb9-8f8b-c272cb09ccc1', -- Generated UUID for the lesson
  'Before we begin...',
  'before-we-begin',
  'A three question survey to help me understand your goals so I can better help you achieve them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"3yvYN6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  103,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'f1b3c426-d7f1-408d-95e3-dd6f67474bfe',
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
  '2184f47a-e045-4fb9-8f8b-c272cb09ccc1',
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
  '2184f47a-e045-4fb9-8f8b-c272cb09ccc1',
  'featured_image',
  'f1b3c426-d7f1-408d-95e3-dd6f67474bfe',
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
  '8163ccae-f0be-4e1a-b2a3-10112e5ccc6a', -- Generated UUID for the lesson
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
  '8163ccae-f0be-4e1a-b2a3-10112e5ccc6a',
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
  '02d29f67-39c1-4083-ad2b-5e7981ee8684', -- Generated UUID for the lesson
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
  '02d29f67-39c1-4083-ad2b-5e7981ee8684',
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
  'b8e14c93-7507-442e-9cd3-93059a0c7611', -- Generated UUID for the lesson
  'Overview of Fact-based Persuasion',
  'fact-based-persuasion',
  'Facts and how to present them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"1a745407-88b6-41ea-bfe1-fb1e5da7f2ef\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  604,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '275c6a61-710f-4cd0-899b-65dd5ae2a618',
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
  'b8e14c93-7507-442e-9cd3-93059a0c7611',
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
  'b8e14c93-7507-442e-9cd3-93059a0c7611',
  'featured_image',
  '275c6a61-710f-4cd0-899b-65dd5ae2a618',
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
  '6959f882-1c7e-40fd-bf99-a8f26fe7a417', -- Generated UUID for the lesson
  'The Fundamental Elements of Design in Detail',
  'fundamental-design-detail',
  'Let''s go deep',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"d91060f9-9a36-4827-8f15-aa56cf8f6b7c\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  503,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '023ce7b4-9b56-47bd-bc4c-81964402c9f0',
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
  '6959f882-1c7e-40fd-bf99-a8f26fe7a417',
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
  '6959f882-1c7e-40fd-bf99-a8f26fe7a417',
  'featured_image',
  '023ce7b4-9b56-47bd-bc4c-81964402c9f0',
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
  'b25813b9-f7f1-4ba5-9ad8-859065a71ad7', -- Generated UUID for the lesson
  'Overview of the Fundamental Elements of Design',
  'fundamental-design-overview',
  'A brief overview of the fundamentals',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  502,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '34a76386-9b6e-4106-ba23-8cbfd92ffac2',
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
  'b25813b9-f7f1-4ba5-9ad8-859065a71ad7',
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
  'b25813b9-f7f1-4ba5-9ad8-859065a71ad7',
  'featured_image',
  '34a76386-9b6e-4106-ba23-8cbfd92ffac2',
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
  '31cbe035-cf36-4254-9e9a-450f91fc0770', -- Generated UUID for the lesson
  'Gestalt Principles of Visual Perception',
  'gestalt-principles',
  'How we can apply principles of visual perception to better communicate our ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"e2256d0f-8a14-4567-9992-ac20713c9793\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  504,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '9ed79b62-7751-400c-9526-804b722ad644',
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
  '31cbe035-cf36-4254-9e9a-450f91fc0770',
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
  '31cbe035-cf36-4254-9e9a-450f91fc0770',
  'featured_image',
  '9ed79b62-7751-400c-9526-804b722ad644',
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
  '2422ae49-fee3-43bc-b2c6-745338e87562', -- Generated UUID for the lesson
  'Idea Generation',
  'idea-generation',
  'How do we generate ideas on how to answer the audience''s question?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2caf80c4-e364-4565-b92e-a353d4e531ff\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  301,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '8f4f78ce-5fa4-491f-85b3-0676bcf151a1',
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
  '2422ae49-fee3-43bc-b2c6-745338e87562',
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
  '2422ae49-fee3-43bc-b2c6-745338e87562',
  'featured_image',
  '8f4f78ce-5fa4-491f-85b3-0676bcf151a1',
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
  '83bc2607-05c4-413b-8bca-09eed0a25bda', -- Generated UUID for the lesson
  'Welcome to DDM',
  'lesson-0',
  'A taster. A preview. An overview of SlideHeroes'' flagship presentations course - Decks for Decision Makers',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  101,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '5809e538-43ed-4624-b8b9-498f2a2ec63f',
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
  '83bc2607-05c4-413b-8bca-09eed0a25bda',
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
  '83bc2607-05c4-413b-8bca-09eed0a25bda',
  'featured_image',
  '5809e538-43ed-4624-b8b9-498f2a2ec63f',
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
  'a65bf668-921d-41f0-a2e7-8d2fab235766', -- Generated UUID for the lesson
  'Our Process',
  'our-process',
  'Our blueprint for creating high quality presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"70b1f616-8e55-4c58-8898-c5cefa05417b\" /%}\r\n\r\nTo-Do\r\n\r\n- Complete the lesson quiz\r\n\r\nWatch\r\n\r\n- None\r\n\r\nRead\r\n\r\n- None\r\n\r\n{% custombullet status=\"right-arrow\" /%}Course Project\r\n\r\n- None\r\n\r\n### Lesson Downloads\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf\"\r\n   filedescription=\"''Our Process'' Lesson slides\" /%}\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf\"\r\n   filedescription=\"Second download (The Who)\" /%}\r\n\r\nThis is an R2 File","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  201,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'ca03dbde-07f7-4934-84d0-0db83b749616',
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
  'a65bf668-921d-41f0-a2e7-8d2fab235766',
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
  'a65bf668-921d-41f0-a2e7-8d2fab235766',
  'featured_image',
  'ca03dbde-07f7-4934-84d0-0db83b749616',
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
  '3477ea70-196c-46cf-9349-efdc6353034b', -- Generated UUID for the lesson
  'Performance',
  'performance',
  'Tips and techniques to improve the delivery of your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"04697977-e686-43c2-b12b-cc81ba1e5aec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  702,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '5e97eed3-e24b-413a-bb99-f154ee725ad8',
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
  '3477ea70-196c-46cf-9349-efdc6353034b',
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
  '3477ea70-196c-46cf-9349-efdc6353034b',
  'featured_image',
  '5e97eed3-e24b-413a-bb99-f154ee725ad8',
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
  'efbfc62a-e90d-4114-9f9a-ed14d18c7938', -- Generated UUID for the lesson
  'Preparation and Practice',
  'preparation-practice',
  'How to prepare for your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"582ab921-8eec-45c2-9223-c54fed288be9\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  701,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'b6fd746a-bdd8-416a-8248-d5d932d54a26',
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
  'efbfc62a-e90d-4114-9f9a-ed14d18c7938',
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
  'efbfc62a-e90d-4114-9f9a-ed14d18c7938',
  'featured_image',
  'b6fd746a-bdd8-416a-8248-d5d932d54a26',
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
  '54d4fd80-3dcc-49ae-94be-6fd61c050e06', -- Generated UUID for the lesson
  'Slide Composition',
  'slide-composition',
  'How to best design slides',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"08100ca6-f998-42dc-8924-4a6d7f8bffeb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  511,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '4a125c42-55ba-46be-a2c3-fa48f9e68a9a',
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
  '54d4fd80-3dcc-49ae-94be-6fd61c050e06',
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
  '54d4fd80-3dcc-49ae-94be-6fd61c050e06',
  'featured_image',
  '4a125c42-55ba-46be-a2c3-fa48f9e68a9a',
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
  'f9e7d28f-41d4-465b-9fc4-532dbe7b7090', -- Generated UUID for the lesson
  'Specialist Graphs',
  'specialist-graphs',
  'Introduction to some common business graphs like the Marimekko and Waterfall',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"579076d8-e225-497d-8ff3-52fad07c9640\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  611,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7b457436-b609-4582-bb59-2fbd451e295f',
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
  'f9e7d28f-41d4-465b-9fc4-532dbe7b7090',
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
  'f9e7d28f-41d4-465b-9fc4-532dbe7b7090',
  'featured_image',
  '7b457436-b609-4582-bb59-2fbd451e295f',
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
  '446d888f-a4a5-409e-b716-31b581d2355f', -- Generated UUID for the lesson
  'Storyboards in Film',
  'storyboards-film',
  'The origin of storyboarding',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  402,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '49b40b44-0874-48f8-ab5a-dd1083b0f6df',
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
  '446d888f-a4a5-409e-b716-31b581d2355f',
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
  '446d888f-a4a5-409e-b716-31b581d2355f',
  'featured_image',
  '49b40b44-0874-48f8-ab5a-dd1083b0f6df',
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
  '4509874f-936f-463b-81fb-e6d437647a32', -- Generated UUID for the lesson
  'Storyboards in Presentations',
  'storyboards-presentations',
  '',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"7f63356c-2bca-4c36-8765-4fe9efd59d71\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  403,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'f02aaf63-9ef7-4018-bec0-49cae0aa6b0f',
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
  '4509874f-936f-463b-81fb-e6d437647a32',
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
  '4509874f-936f-463b-81fb-e6d437647a32',
  'featured_image',
  'f02aaf63-9ef7-4018-bec0-49cae0aa6b0f',
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
  '49eb4830-ee8b-4c35-8229-f218a26f120e', -- Generated UUID for the lesson
  'Tables vs. Graphs',
  'tables-vs-graphs',
  'How to use graphs and tabl;es to present quantitative information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"aae42644-8e3a-4ef3-a186-869f802869eb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  602,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'b6c2d058-940a-493c-9db6-7112a9db67fe',
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
  '49eb4830-ee8b-4c35-8229-f218a26f120e',
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
  '49eb4830-ee8b-4c35-8229-f218a26f120e',
  'featured_image',
  'b6c2d058-940a-493c-9db6-7112a9db67fe',
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
  '13341fe4-cf6a-49f9-8556-ee68cfe5d276', -- Generated UUID for the lesson
  'The Who',
  'the-who',
  'Where do we start? We start with defining who our actual audience is',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"8e80b4f3-76d4-44a3-994b-29937ee870ec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  202,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '400989ef-0bf5-4bab-9bf1-af15915405a3',
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
  '13341fe4-cf6a-49f9-8556-ee68cfe5d276',
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
  '13341fe4-cf6a-49f9-8556-ee68cfe5d276',
  'featured_image',
  '400989ef-0bf5-4bab-9bf1-af15915405a3',
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
  '383f4a9e-d0b1-4cc6-a14a-71f720452120', -- Generated UUID for the lesson
  'The Why: Building the Introduction',
  'the-why-introductions',
  'How to tee-up your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"eaa1e745-ec67-42c4-b474-e34bd6bdc830\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  203,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'ed7c049d-3297-481a-8939-7b04d6b5424b',
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
  '383f4a9e-d0b1-4cc6-a14a-71f720452120',
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
  '383f4a9e-d0b1-4cc6-a14a-71f720452120',
  'featured_image',
  'ed7c049d-3297-481a-8939-7b04d6b5424b',
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
  '2e35a4c4-48e3-4f73-adca-e005e385689c', -- Generated UUID for the lesson
  'The Why: Next Steps',
  'the-why-next-steps',
  'What do we want to accomplish from our presentation? What is our ultimate objective?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"22511e58-40ce-4f11-9961-90070c1a3e94\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  204,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'c70cb547-8ed2-4a0e-9910-7e604023f97e',
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
  '2e35a4c4-48e3-4f73-adca-e005e385689c',
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
  '2e35a4c4-48e3-4f73-adca-e005e385689c',
  'featured_image',
  'c70cb547-8ed2-4a0e-9910-7e604023f97e',
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
  '9cd1248b-f2de-4377-be96-5c226fe01e67', -- Generated UUID for the lesson
  'Presentation Tools & Course Resources',
  'tools-and-resources',
  'Links to some recommended presentation tools + all course materials and downloads',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This page includes links to all course material and downloads.\r\n\r\nI have also included a table listing my current recommendations of the web''s best tools, reference sites, and apps for helping create great presentations.\r\n\r\nLet me know if I have missed any!\r\n\r\nBe sure to bookmark this page for your reference and convenience.\r\n\r\n**Course related downloads**\r\n\r\nSlideHeroes Business Presentation PowerPoint Template: Over 1,000 slide templates\r\n\r\nBlank Audience Map pdf\r\n\r\nLesson slides: pdfs of slides used for each lesson\r\n\r\nGolden Rules Pack: a pdf summary of the SlideHeroes Golden Rules\r\n\r\n**Recommended tools, websites, and resources**","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  104,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '5f2a18ae-94cd-4c01-ad37-4e5e5eba098d',
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
  '9cd1248b-f2de-4377-be96-5c226fe01e67',
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
  '9cd1248b-f2de-4377-be96-5c226fe01e67',
  'featured_image',
  '5f2a18ae-94cd-4c01-ad37-4e5e5eba098d',
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
  'f111fac3-e880-44e6-9f7a-073fc380d265', -- Generated UUID for the lesson
  'Using Stories',
  'using-stories',
  'Using stories to powerfully convey your ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"f311d324-c0ca-4157-afeb-bba29e71a9ce\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  401,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'b5d5c121-59ec-48c7-a96d-142f980ad1f0',
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
  'f111fac3-e880-44e6-9f7a-073fc380d265',
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
  'f111fac3-e880-44e6-9f7a-073fc380d265',
  'featured_image',
  'b5d5c121-59ec-48c7-a96d-142f980ad1f0',
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
  '7c92e34f-e829-4be4-8cf6-f01636108cbf', -- Generated UUID for the lesson
  'Visual Perception and Communication',
  'visual-perception',
  'What are the implications from how people process information?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"5c9b5f03-f5d0-479a-84b2-2cd489fc8584\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  501,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'c51f5ac0-a5ca-4788-921d-174a5c73687b',
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
  '7c92e34f-e829-4be4-8cf6-f01636108cbf',
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
  '7c92e34f-e829-4be4-8cf6-f01636108cbf',
  'featured_image',
  'c51f5ac0-a5ca-4788-921d-174a5c73687b',
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
  'a7c66036-5318-46a0-b4b4-3cc351c612f4', -- Generated UUID for the lesson
  'What is Structure?',
  'what-is-structure',
  'Techniques to develop ensure clarity through structure',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"17d23794-696e-41df-af6c-faf9b54bd87d\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  302,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'f2492ba6-b113-434f-9231-774d02c3924c',
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
  'a7c66036-5318-46a0-b4b4-3cc351c612f4',
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
  'a7c66036-5318-46a0-b4b4-3cc351c612f4',
  'featured_image',
  'f2492ba6-b113-434f-9231-774d02c3924c',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
