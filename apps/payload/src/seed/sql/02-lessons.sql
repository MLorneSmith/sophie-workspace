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
  '3e951057-b3cc-496e-b140-8e1f30c55358', -- Generated UUID for the lesson
  'Standard Graphs',
  'basic-graphs',
  'How to properly use graphs to display information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"74be3c05-f774-4e3c-bbe0-495580a17931\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  603,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '18f08b4d-ffcf-44cd-aacb-a9a333880b93',
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
  '3e951057-b3cc-496e-b140-8e1f30c55358',
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
  '3e951057-b3cc-496e-b140-8e1f30c55358',
  'featured_image',
  '18f08b4d-ffcf-44cd-aacb-a9a333880b93',
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
  '4a382603-5c4f-4e61-a3c8-7a3a6a749e94', -- Generated UUID for the lesson
  'Before we begin...',
  'before-we-begin',
  'A three question survey to help me understand your goals so I can better help you achieve them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% tally\r\n   tallyembed=\"3yvYN6?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  103,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '2d81096d-30f5-455b-9576-117657e9dcc4',
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
  '4a382603-5c4f-4e61-a3c8-7a3a6a749e94',
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
  '4a382603-5c4f-4e61-a3c8-7a3a6a749e94',
  'featured_image',
  '2d81096d-30f5-455b-9576-117657e9dcc4',
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
  'b424f716-c468-433a-87cd-f12d9bcbdb7c', -- Generated UUID for the lesson
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
  'b424f716-c468-433a-87cd-f12d9bcbdb7c',
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
  'f4283260-4be8-4426-b46d-c09f35cc57a3', -- Generated UUID for the lesson
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
  'f4283260-4be8-4426-b46d-c09f35cc57a3',
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
  '0ca71b29-2203-4fa7-8d40-ccf3f9728da9', -- Generated UUID for the lesson
  'Overview of Fact-based Persuasion',
  'fact-based-persuasion',
  'Facts and how to present them',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"1a745407-88b6-41ea-bfe1-fb1e5da7f2ef\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  604,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'd1c57e80-eadb-4120-8b29-7519991a58de',
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
  '0ca71b29-2203-4fa7-8d40-ccf3f9728da9',
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
  '0ca71b29-2203-4fa7-8d40-ccf3f9728da9',
  'featured_image',
  'd1c57e80-eadb-4120-8b29-7519991a58de',
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
  '8b9b2e2f-2d9a-47d9-8f3c-b5293c955dc0', -- Generated UUID for the lesson
  'The Fundamental Elements of Design in Detail',
  'fundamental-design-detail',
  'Let''s go deep',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"d91060f9-9a36-4827-8f15-aa56cf8f6b7c\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  503,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '3898619d-0192-4628-8cc6-61c610c4181b',
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
  '8b9b2e2f-2d9a-47d9-8f3c-b5293c955dc0',
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
  '8b9b2e2f-2d9a-47d9-8f3c-b5293c955dc0',
  'featured_image',
  '3898619d-0192-4628-8cc6-61c610c4181b',
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
  '9534a40d-d045-43dd-aeb1-056472075a9c', -- Generated UUID for the lesson
  'Overview of the Fundamental Elements of Design',
  'fundamental-design-overview',
  'A brief overview of the fundamentals',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  502,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '726772c7-13c1-4aea-a4e3-9a6cea0a7623',
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
  '9534a40d-d045-43dd-aeb1-056472075a9c',
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
  '9534a40d-d045-43dd-aeb1-056472075a9c',
  'featured_image',
  '726772c7-13c1-4aea-a4e3-9a6cea0a7623',
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
  'e771d600-dd5a-494e-a065-7669dca18562', -- Generated UUID for the lesson
  'Gestalt Principles of Visual Perception',
  'gestalt-principles',
  'How we can apply principles of visual perception to better communicate our ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"e2256d0f-8a14-4567-9992-ac20713c9793\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  504,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '668d228e-132c-4545-ac3b-83244f9568e4',
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
  'e771d600-dd5a-494e-a065-7669dca18562',
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
  'e771d600-dd5a-494e-a065-7669dca18562',
  'featured_image',
  '668d228e-132c-4545-ac3b-83244f9568e4',
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
  '19d697d2-3207-4255-9591-53ee64c4c9a2', -- Generated UUID for the lesson
  'Idea Generation',
  'idea-generation',
  'How do we generate ideas on how to answer the audience''s question?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2caf80c4-e364-4565-b92e-a353d4e531ff\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  301,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'ebd6f471-86b5-4ef2-9537-ff65d7790a36',
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
  '19d697d2-3207-4255-9591-53ee64c4c9a2',
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
  '19d697d2-3207-4255-9591-53ee64c4c9a2',
  'featured_image',
  'ebd6f471-86b5-4ef2-9537-ff65d7790a36',
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
  'ba8814f3-90e1-427a-87cc-b4face5963ec', -- Generated UUID for the lesson
  'Welcome to DDM',
  'lesson-0',
  'A taster. A preview. An overview of SlideHeroes'' flagship presentations course - Decks for Decision Makers',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  101,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '92e9b15a-09ad-4698-9105-d1f46b076671',
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
  'ba8814f3-90e1-427a-87cc-b4face5963ec',
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
  'ba8814f3-90e1-427a-87cc-b4face5963ec',
  'featured_image',
  '92e9b15a-09ad-4698-9105-d1f46b076671',
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
  '760d19dc-4931-4095-9ae9-ebe12645aa98', -- Generated UUID for the lesson
  'Our Process',
  'our-process',
  'Our blueprint for creating high quality presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"70b1f616-8e55-4c58-8898-c5cefa05417b\" /%}\r\n\r\nTo-Do\r\n\r\n- Complete the lesson quiz\r\n\r\nWatch\r\n\r\n- None\r\n\r\nRead\r\n\r\n- None\r\n\r\n{% custombullet status=\"right-arrow\" /%}Course Project\r\n\r\n- None\r\n\r\n### Lesson Downloads\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf\"\r\n   filedescription=\"''Our Process'' Lesson slides\" /%}\r\n\r\n{% r2file\r\n   awsurl=\"https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf\"\r\n   filedescription=\"Second download (The Who)\" /%}\r\n\r\nThis is an R2 File","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  201,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '84c3e5cb-6110-4f7a-96b0-0893fcfb505a',
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
  '760d19dc-4931-4095-9ae9-ebe12645aa98',
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
  '760d19dc-4931-4095-9ae9-ebe12645aa98',
  'featured_image',
  '84c3e5cb-6110-4f7a-96b0-0893fcfb505a',
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
  'de16abc4-baa5-4c69-8508-16c052b0e412', -- Generated UUID for the lesson
  'Performance',
  'performance',
  'Tips and techniques to improve the delivery of your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"04697977-e686-43c2-b12b-cc81ba1e5aec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  702,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '7535f705-4025-48d2-ab2b-b8638b31a5b2',
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
  'de16abc4-baa5-4c69-8508-16c052b0e412',
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
  'de16abc4-baa5-4c69-8508-16c052b0e412',
  'featured_image',
  '7535f705-4025-48d2-ab2b-b8638b31a5b2',
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
  'd960ff9d-eb97-499a-b5b0-7e41bd8b346d', -- Generated UUID for the lesson
  'Preparation and Practice',
  'preparation-practice',
  'How to prepare for your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"582ab921-8eec-45c2-9223-c54fed288be9\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  701,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '45d1a142-742e-413e-a6dd-418e2003d56a',
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
  'd960ff9d-eb97-499a-b5b0-7e41bd8b346d',
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
  'd960ff9d-eb97-499a-b5b0-7e41bd8b346d',
  'featured_image',
  '45d1a142-742e-413e-a6dd-418e2003d56a',
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
  '417a8820-98d7-41cb-97b6-abea4e255a18', -- Generated UUID for the lesson
  'Slide Composition',
  'slide-composition',
  'How to best design slides',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"08100ca6-f998-42dc-8924-4a6d7f8bffeb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  511,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '1c06641f-ce30-4e98-8b3f-ed10e04e8b0d',
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
  '417a8820-98d7-41cb-97b6-abea4e255a18',
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
  '417a8820-98d7-41cb-97b6-abea4e255a18',
  'featured_image',
  '1c06641f-ce30-4e98-8b3f-ed10e04e8b0d',
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
  '30221a7e-97a8-4413-9d5a-5149c4fc0ff1', -- Generated UUID for the lesson
  'Specialist Graphs',
  'specialist-graphs',
  'Introduction to some common business graphs like the Marimekko and Waterfall',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"579076d8-e225-497d-8ff3-52fad07c9640\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  611,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '6c57c6b3-623d-4769-9748-21229ea357f5',
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
  '30221a7e-97a8-4413-9d5a-5149c4fc0ff1',
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
  '30221a7e-97a8-4413-9d5a-5149c4fc0ff1',
  'featured_image',
  '6c57c6b3-623d-4769-9748-21229ea357f5',
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
  'c8b72e06-4ef9-4441-be46-17da3428762c', -- Generated UUID for the lesson
  'Storyboards in Film',
  'storyboards-film',
  'The origin of storyboarding',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  402,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '1387d8a3-571a-4cd7-abbf-6ffffa731c76',
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
  'c8b72e06-4ef9-4441-be46-17da3428762c',
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
  'c8b72e06-4ef9-4441-be46-17da3428762c',
  'featured_image',
  '1387d8a3-571a-4cd7-abbf-6ffffa731c76',
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
  'ef330968-fe2e-490b-8ecf-3f8caf4df74a', -- Generated UUID for the lesson
  'Storyboards in Presentations',
  'storyboards-presentations',
  '',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"7f63356c-2bca-4c36-8765-4fe9efd59d71\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  403,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'd7f5be84-4517-4b29-84b8-da78d18c77d4',
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
  'ef330968-fe2e-490b-8ecf-3f8caf4df74a',
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
  'ef330968-fe2e-490b-8ecf-3f8caf4df74a',
  'featured_image',
  'd7f5be84-4517-4b29-84b8-da78d18c77d4',
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
  'c9e41207-a24b-44c0-b9eb-a1f86a5be040', -- Generated UUID for the lesson
  'Tables vs. Graphs',
  'tables-vs-graphs',
  'How to use graphs and tabl;es to present quantitative information',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"aae42644-8e3a-4ef3-a186-869f802869eb\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  602,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'c96d2609-0755-446c-84fc-fec7fed9cccd',
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
  'c9e41207-a24b-44c0-b9eb-a1f86a5be040',
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
  'c9e41207-a24b-44c0-b9eb-a1f86a5be040',
  'featured_image',
  'c96d2609-0755-446c-84fc-fec7fed9cccd',
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
  '7c6ab49d-aac3-4356-9310-0de91d63a11e', -- Generated UUID for the lesson
  'The Who',
  'the-who',
  'Where do we start? We start with defining who our actual audience is',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"8e80b4f3-76d4-44a3-994b-29937ee870ec\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  202,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '90d7f6eb-5e5a-4f37-8e73-e368ae69e1e2',
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
  '7c6ab49d-aac3-4356-9310-0de91d63a11e',
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
  '7c6ab49d-aac3-4356-9310-0de91d63a11e',
  'featured_image',
  '90d7f6eb-5e5a-4f37-8e73-e368ae69e1e2',
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
  'd042d0e8-ae01-4789-9792-ba41e57edc86', -- Generated UUID for the lesson
  'The Why: Building the Introduction',
  'the-why-introductions',
  'How to tee-up your presentation',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"eaa1e745-ec67-42c4-b474-e34bd6bdc830\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  203,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'abf3fca0-b7ad-4148-a954-d6c4596387a5',
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
  'd042d0e8-ae01-4789-9792-ba41e57edc86',
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
  'd042d0e8-ae01-4789-9792-ba41e57edc86',
  'featured_image',
  'abf3fca0-b7ad-4148-a954-d6c4596387a5',
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
  '4e49ace8-e251-4eef-8f2a-4481e5bc16c7', -- Generated UUID for the lesson
  'The Why: Next Steps',
  'the-why-next-steps',
  'What do we want to accomplish from our presentation? What is our ultimate objective?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"22511e58-40ce-4f11-9961-90070c1a3e94\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  204,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '45fcf27f-ef71-4c57-9c8b-1d202e943458',
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
  '4e49ace8-e251-4eef-8f2a-4481e5bc16c7',
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
  '4e49ace8-e251-4eef-8f2a-4481e5bc16c7',
  'featured_image',
  '45fcf27f-ef71-4c57-9c8b-1d202e943458',
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
  '2acd4ea3-2c01-47b5-8c17-6859fcb39922', -- Generated UUID for the lesson
  'Presentation Tools & Course Resources',
  'tools-and-resources',
  'Links to some recommended presentation tools + all course materials and downloads',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This page includes links to all course material and downloads.\r\n\r\nI have also included a table listing my current recommendations of the web''s best tools, reference sites, and apps for helping create great presentations.\r\n\r\nLet me know if I have missed any!\r\n\r\nBe sure to bookmark this page for your reference and convenience.\r\n\r\n**Course related downloads**\r\n\r\nSlideHeroes Business Presentation PowerPoint Template: Over 1,000 slide templates\r\n\r\nBlank Audience Map pdf\r\n\r\nLesson slides: pdfs of slides used for each lesson\r\n\r\nGolden Rules Pack: a pdf summary of the SlideHeroes Golden Rules\r\n\r\n**Recommended tools, websites, and resources**","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  104,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '3e9fcd7d-906e-43fe-9698-59804939ec22',
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
  '2acd4ea3-2c01-47b5-8c17-6859fcb39922',
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
  '2acd4ea3-2c01-47b5-8c17-6859fcb39922',
  'featured_image',
  '3e9fcd7d-906e-43fe-9698-59804939ec22',
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
  '8694dbc7-1c43-4904-972a-b5bd095720f8', -- Generated UUID for the lesson
  'Using Stories',
  'using-stories',
  'Using stories to powerfully convey your ideas',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"f311d324-c0ca-4157-afeb-bba29e71a9ce\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  401,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  'bedde1fb-06a0-4cbe-bfc0-e3af9ac75cc4',
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
  '8694dbc7-1c43-4904-972a-b5bd095720f8',
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
  '8694dbc7-1c43-4904-972a-b5bd095720f8',
  'featured_image',
  'bedde1fb-06a0-4cbe-bfc0-e3af9ac75cc4',
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
  '52eecfb9-e93e-41f9-ac2b-2f980464fecf', -- Generated UUID for the lesson
  'Visual Perception and Communication',
  'visual-perception',
  'What are the implications from how people process information?',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"5c9b5f03-f5d0-479a-84b2-2cd489fc8584\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  501,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '0d89d8e3-c095-4dc8-8838-687ecc59eab8',
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
  '52eecfb9-e93e-41f9-ac2b-2f980464fecf',
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
  '52eecfb9-e93e-41f9-ac2b-2f980464fecf',
  'featured_image',
  '0d89d8e3-c095-4dc8-8838-687ecc59eab8',
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
  '866bb48f-356a-411f-a628-25a45af81a59', -- Generated UUID for the lesson
  'What is Structure?',
  'what-is-structure',
  'Techniques to develop ensure clarity through structure',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"{% bunny bunnyvideoid=\"17d23794-696e-41df-af6c-faf9b54bd87d\" /%}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  302,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  '8f80e115-278e-432d-976c-925efc5b5dce',
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
  '866bb48f-356a-411f-a628-25a45af81a59',
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
  '866bb48f-356a-411f-a628-25a45af81a59',
  'featured_image',
  '8f80e115-278e-432d-976c-925efc5b5dce',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
