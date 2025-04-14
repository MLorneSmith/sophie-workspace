/**
 * Updated generator for lessons SQL that uses the YAML metadata file as the source of truth
 */
import fs from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DOWNLOAD_ID_MAP } from '../../../data/mappings/download-mappings.js';
import { convertToLexical } from '../../utils/lexical-converter.js';
import { generateQuizMap } from '../../utils/quiz-map-generator.js';
import { COURSE_ID } from './generate-courses-sql.js';
/**
 * Generates SQL for lessons from the YAML metadata file
 * @param lessonsDir - Directory containing lesson .mdoc files (for content only)
 * @returns SQL for lessons
 */
export function generateLessonsSqlFromYaml(lessonsDir) {
    console.log('Generating lessons SQL from YAML metadata...');
    // Load the metadata file
    const METADATA_PATH = path.resolve(__dirname, '../../../data/raw/lesson-metadata.yaml');
    if (!fs.existsSync(METADATA_PATH)) {
        throw new Error(`Lesson metadata file not found at ${METADATA_PATH}`);
    }
    let lessonMetadata;
    try {
        lessonMetadata = yaml.load(fs.readFileSync(METADATA_PATH, 'utf8'));
        console.log(`Loaded metadata for ${lessonMetadata.lessons.length} lessons`);
    }
    catch (error) {
        console.error('Error loading lesson metadata:', error);
        throw error;
    }
    // Start building the SQL
    let sql = `-- Seed data for the course lessons table
-- This file should be run after the courses seed file to ensure the course exists
-- Generated from YAML metadata source

-- Start a transaction
BEGIN;

`;
    // Generate quiz map for ID lookup
    // Generate quiz map for ID lookup - cast to Map to fix TypeScript errors
    const quizMap = generateQuizMap();
    // Process each lesson from the metadata
    for (const lesson of lessonMetadata.lessons) {
        // Generate a UUID for the lesson
        const lessonId = uuidv4();
        // Get the lesson slug
        const lessonSlug = lesson.slug;
        // Look up quiz ID if there's a quiz slug associated
        let quizId = null;
        if (lesson.quiz) {
            if (quizMap.has(lesson.quiz)) {
                quizId = quizMap.get(lesson.quiz);
                console.log(`Found quiz with ID ${quizId} for lesson ${lessonSlug}`);
            }
            else {
                console.log(`Quiz not found for lesson ${lessonSlug}: ${lesson.quiz}`);
            }
        }
        // Extract fields from metadata
        const todo = lesson.todoFields?.todo || null;
        const todoCompleteQuiz = lesson.todoFields?.completeQuiz === true;
        const todoWatchContent = lesson.todoFields?.watchContent || null;
        const todoReadContent = lesson.todoFields?.readContent || null;
        const todoCourseProject = lesson.todoFields?.courseProject || null;
        // Ensure empty strings are treated as NULL for bunnyVideoId
        const bunnyVideoId = lesson.bunnyVideo?.id && lesson.bunnyVideo.id.trim() !== ''
            ? lesson.bunnyVideo.id
            : null;
        const bunnyLibraryId = lesson.bunnyVideo?.library || '264486';
        // Get the Lexical content from the .mdoc file
        const mdocFilePath = path.join(lessonsDir, `${lessonSlug}.mdoc`);
        let lexicalContent = '{}'; // Empty Lexical document as fallback
        if (fs.existsSync(mdocFilePath)) {
            try {
                const fileContent = fs.readFileSync(mdocFilePath, 'utf8');
                const { content } = matter(fileContent);
                lexicalContent = convertToLexical(content);
            }
            catch (error) {
                console.error(`Error processing content for lesson ${lessonSlug}:`, error);
            }
        }
        else {
            console.warn(`Lesson .mdoc file not found for ${lessonSlug}`);
        }
        // Add the lesson to the SQL
        sql += `-- Insert lesson: ${lesson.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course_id,
  ${quizId ? 'quiz_id,' : ''}
  ${quizId ? 'quiz_id_id,' : ''}
  bunny_video_id,
  bunny_library_id,
  ${todo ? 'todo,' : ''}
  todo_complete_quiz,
  ${todoWatchContent ? 'todo_watch_content,' : ''}
  ${todoReadContent ? 'todo_read_content,' : ''}
  ${todoCourseProject ? 'todo_course_project,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}',
  '${lesson.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${(lesson.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${lesson.lessonNumber || 0},
  ${lesson.lessonLength || 0},
  '${COURSE_ID}',
  ${quizId ? `'${quizId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  ${bunnyVideoId ? `'${bunnyVideoId}'` : 'NULL'},
  ${bunnyLibraryId ? `'${bunnyLibraryId}'` : "'264486'"},
  ${todo ? `'${todo.replace(/'/g, "''")}'` : ''},
  ${todoCompleteQuiz ? 'TRUE' : 'FALSE'},
  ${todoWatchContent ? `'${todoWatchContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoReadContent ? `'${todoReadContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCourseProject ? `'${todoCourseProject.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
        // Add relationship entries
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
) ON CONFLICT DO NOTHING;

`;
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
) ON CONFLICT DO NOTHING;

`;
        }
        // Add relationship entries for downloads
        if (lesson.downloads && lesson.downloads.length > 0) {
            sql += `-- Create relationship entries for the lesson to downloads\n`;
            for (const downloadKey of lesson.downloads) {
                const downloadId = DOWNLOAD_ID_MAP[downloadKey];
                if (downloadId) {
                    sql += `INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'downloads',
  '${downloadId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
                }
                else {
                    console.warn(`Download ID not found for key: ${downloadKey}`);
                }
            }
        }
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
// Add a CLI entrypoint for standalone usage
if (process.argv[1]?.endsWith('yaml-generate-lessons-sql.ts') ||
    process.argv[1]?.endsWith('yaml-generate-lessons-sql.js')) {
    const LESSONS_DIR = process.argv[2] ||
        path.resolve(process.cwd(), 'packages/content-migrations/src/data/raw/courses/lessons');
    const sqlOutput = generateLessonsSqlFromYaml(LESSONS_DIR);
    // Output to stdout or a file if specified
    if (process.argv[3]) {
        fs.writeFileSync(process.argv[3], sqlOutput);
        console.log(`SQL written to ${process.argv[3]}`);
    }
    else {
        console.log(sqlOutput);
    }
}
