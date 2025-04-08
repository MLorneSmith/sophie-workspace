/**
 * Generator for lessons SQL
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { RAW_QUIZZES_DIR } from '../../../config/paths.js';
import { lessonQuizMapping } from '../../../data/mappings/lesson-quiz-mappings.js';
import { convertToLexical } from '../../utils/lexical-converter.js';
import { generateQuizMap } from '../../utils/quiz-map-generator.js';
import { COURSE_ID } from './generate-courses-sql.js';

/**
 * Generates SQL for lessons from .mdoc files
 * @param lessonsDir - Directory containing lesson .mdoc files
 * @returns SQL for lessons
 */
export function generateLessonsSql(lessonsDir: string): string {
  // Get all .mdoc files in the lessons directory
  const lessonFiles = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the course lessons table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Process each lesson file
  for (const file of lessonFiles) {
    const filePath = path.join(lessonsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    // Generate a UUID for the lesson
    const lessonId = uuidv4();

    // Convert the content to a simple Lexical JSON structure
    const lexicalContent = convertToLexical(content);

    // Get the media ID for this lesson's image
    const mediaId =
      data.image && global.mediaIds ? global.mediaIds[data.image] : null;

    // Get the lesson slug
    const lessonSlug = path.basename(file, '.mdoc');

    // Check if this lesson has an associated quiz using the mapping
    let quizId = null;
    if (lessonQuizMapping[lessonSlug]) {
      // Get the quiz slug from the mapping
      const quizSlug = lessonQuizMapping[lessonSlug];

      // Find the quiz ID from the quiz map
      const quizMap = generateQuizMap(RAW_QUIZZES_DIR);
      if (quizMap.has(quizSlug)) {
        const id = quizMap.get(quizSlug);
        if (id) {
          quizId = id;
          console.log(`Found quiz with ID ${quizId} for lesson ${lessonSlug}`);
        }
      } else {
        console.log(`Quiz not found for lesson ${lessonSlug}: ${quizSlug}`);
      }
    }

    // Add the lesson to the SQL
    sql += `-- Insert lesson: ${data.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course_id,
  ${mediaId ? 'featured_image_id,' : ''}
  ${quizId ? 'quiz_id,' : ''}
  ${quizId ? 'quiz_id_id,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}', -- Generated UUID for the lesson
  '${data.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${((data.description || '') + '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${data.lessonNumber || data.order || 0},
  ${data.lessonLength || 0}, -- Set estimated_duration from lessonLength
  '${COURSE_ID}', -- Course ID
  ${mediaId ? `'${mediaId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

`;

    // Add the relationship entry for the course
    sql += `-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'course',
  '${COURSE_ID}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;

    // Add the relationship entry for the media if available
    if (mediaId) {
      sql += `-- Create relationship entry for the lesson to the media
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'featured_image',
  '${mediaId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
    }

    // Add the relationship entry for the quiz if available
    if (quizId) {
      sql += `-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'quiz_id',
  '${quizId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
    }
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
