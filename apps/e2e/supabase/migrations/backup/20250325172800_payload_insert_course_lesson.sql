-- Insert a course lesson directly into the database
INSERT INTO payload.course_lessons (
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course,
  published_at,
  status,
  "order",
  language,
  updated_at,
  created_at
)
VALUES (
  'Introduction to Presentations',
  'introduction-to-presentations',
  'Learn the basics of creating effective presentations',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Introduction to Presentations","type":"text"}],"direction":"ltr","format":"","indent":0,"type":"heading","version":1,"tag":"h1"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"In this lesson, you will learn the basics of creating effective presentations.","type":"text"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  1,
  30,
  1,
  NOW(),
  'published',
  1,
  'en',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Get the ID of the course lesson we just inserted or that already exists
DO $$
DECLARE
  lesson_id INTEGER;
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE slug = 'introduction-to-presentations';
  RAISE NOTICE 'Course Lesson ID: %', lesson_id;
END $$;

-- Insert a relationship between the course and the lesson
INSERT INTO payload.courses__rels (
  "order",
  parent_id,
  path,
  course_lessons_id
)
SELECT 
  0,
  1,
  'lessons',
  id
FROM payload.course_lessons
WHERE slug = 'introduction-to-presentations'
ON CONFLICT DO NOTHING;
