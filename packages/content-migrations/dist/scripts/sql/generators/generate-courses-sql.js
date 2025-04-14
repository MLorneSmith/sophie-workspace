/**
 * Generator for courses SQL
 */
// Define the course ID (fixed UUID)
export const COURSE_ID = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
/**
 * Generates SQL for the courses table
 * @returns SQL for courses
 */
export function generateCoursesSql() {
    return `-- Seed data for the courses table
-- This file should be run after the migrations to ensure the courses table exists

-- Start a transaction
BEGIN;

-- Insert the main course
INSERT INTO payload.courses (
  id,
  title,
  slug,
  description,
  status,
  estimated_duration,
  show_progress_bar,
  published_at,
  updated_at,
  created_at
) VALUES (
  '${COURSE_ID}', -- Fixed UUID for the course
  'Decks for Decision Makers',
  'decks-for-decision-makers',
  'Learn how to create effective presentations for decision makers',
  'published',
  240, -- 4 hours
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the course already exists

-- Create a simple content structure for intro_content
UPDATE payload.courses
SET intro_content = '{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Welcome to Decks for Decision Makers! This course will teach you how to create effective presentations for decision makers.",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}'::jsonb
WHERE id = '${COURSE_ID}';

-- Create a simple content structure for completion_content
UPDATE payload.courses
SET completion_content = '{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Congratulations on completing the course! You now have the skills to create effective presentations for decision makers.",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}'::jsonb
WHERE id = '${COURSE_ID}';

-- Commit the transaction
COMMIT;
`;
}
