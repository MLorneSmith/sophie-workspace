"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLessonsSql = generateLessonsSql;
/**
 * Generator for lessons SQL
 */
const fs_1 = __importDefault(require("fs"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const paths_js_1 = require("../../../config/paths.js");
const lesson_quiz_mappings_js_1 = require("../../../data/mappings/lesson-quiz-mappings.js");
const lexical_converter_js_1 = require("../../utils/lexical-converter.js");
const quiz_map_generator_js_1 = require("../../utils/quiz-map-generator.js");
const generate_courses_sql_js_1 = require("./generate-courses-sql.js");
/**
 * Generates SQL for lessons from .mdoc files
 * @param lessonsDir - Directory containing lesson .mdoc files
 * @returns SQL for lessons
 */
function generateLessonsSql(lessonsDir) {
    // Get all .mdoc files in the lessons directory
    const lessonFiles = fs_1.default
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
        const filePath = path_1.default.join(lessonsDir, file);
        const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
        const { data, content } = (0, gray_matter_1.default)(fileContent);
        // Generate a UUID for the lesson
        const lessonId = (0, uuid_1.v4)();
        // Convert the content to a simple Lexical JSON structure
        const lexicalContent = (0, lexical_converter_js_1.convertToLexical)(content);
        // Get the media ID for this lesson's image
        const mediaId = data.image && global.mediaIds ? global.mediaIds[data.image] : null;
        // Get the lesson slug
        const lessonSlug = path_1.default.basename(file, '.mdoc');
        // Check if this lesson has an associated quiz using the mapping
        let quizId = null;
        if (lesson_quiz_mappings_js_1.lessonQuizMapping[lessonSlug]) {
            // Get the quiz slug from the mapping
            const quizSlug = lesson_quiz_mappings_js_1.lessonQuizMapping[lessonSlug];
            // Find the quiz ID from the quiz map
            const quizMap = (0, quiz_map_generator_js_1.generateQuizMap)(paths_js_1.RAW_QUIZZES_DIR);
            if (quizMap.has(quizSlug)) {
                const id = quizMap.get(quizSlug);
                if (id) {
                    quizId = id;
                    console.log(`Found quiz with ID ${quizId} for lesson ${lessonSlug}`);
                }
            }
            else {
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
  '${generate_courses_sql_js_1.COURSE_ID}', -- Course ID
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
  '${generate_courses_sql_js_1.COURSE_ID}',
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
