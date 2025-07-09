-- Insert a course directly into the database
INSERT INTO payload.courses (
  title,
  slug,
  description,
  status,
  show_progress_bar,
  estimated_duration,
  published_at,
  updated_at,
  created_at
)
VALUES (
  'Decks for Decision Makers',
  'decks-for-decision-makers',
  'Learn how to create effective presentations for decision makers',
  'published',
  true,
  240,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Get the ID of the course we just inserted or that already exists
DO $$
DECLARE
  course_id INTEGER;
BEGIN
  SELECT id INTO course_id FROM payload.courses WHERE slug = 'decks-for-decision-makers';
  RAISE NOTICE 'Course ID: %', course_id;
END $$;
