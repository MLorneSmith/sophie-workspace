/**
 * Generate SQL Seed Files (Fixed Version)
 *
 * This script generates SQL seed files from the existing .mdoc files.
 * It's a one-time script to help with the initial conversion from TypeScript/JavaScript scripts to SQL seed files.
 *
 * Fixed version:
 * - Uses consistent UUIDs for quizzes across files
 * - Ensures proper relationships between quizzes and questions
 * - Adds proper error handling
 */
import fs from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  PAYLOAD_SQL_SEED_DIR,
  PROCESSED_SQL_DIR,
  RAW_LESSONS_DIR,
  RAW_QUIZZES_DIR,
  RAW_SURVEYS_DIR,
} from '../../config/paths.js';
import {
  lessonImageMappings,
  postImageMappings,
} from '../../data/mappings/image-mappings.js';

// Declare global mediaIds property for TypeScript
declare global {
  var mediaIds: Record<string, string>;
}

// Define the course ID (fixed UUID)
const COURSE_ID = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';

/**
 * Generates SQL seed files from the existing .mdoc files
 */
async function generateSqlSeedFiles() {
  console.log('Starting SQL seed files generation...');

  try {
    // Ensure SQL seed directory exists
    if (!fs.existsSync(PAYLOAD_SQL_SEED_DIR)) {
      fs.mkdirSync(PAYLOAD_SQL_SEED_DIR, { recursive: true });
    }

    // Generate a map of quiz slugs to UUIDs
    const quizMap = generateQuizMap(RAW_QUIZZES_DIR);

    // Generate courses SQL (simple file with just the main course)
    console.log('Generating courses SQL...');
    const coursesSql = generateCoursesSql();
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '01-courses.sql'),
      coursesSql,
    );

    // Generate media SQL
    console.log('Generating media SQL...');
    const mediaSql = generateMediaSql();
    fs.writeFileSync(path.join(PAYLOAD_SQL_SEED_DIR, '07-media.sql'), mediaSql);

    // Generate lessons SQL
    console.log('Generating lessons SQL...');
    const lessonsSql = generateLessonsSql(RAW_LESSONS_DIR);
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '02-lessons.sql'),
      lessonsSql,
    );

    // Generate quizzes SQL
    console.log('Generating quizzes SQL...');
    const quizzesSql = generateQuizzesSql(RAW_QUIZZES_DIR, quizMap);
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql'),
      quizzesSql,
    );

    // Generate questions SQL
    console.log('Generating questions SQL...');
    const questionsSql = generateQuestionsSql(RAW_QUIZZES_DIR, quizMap);
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '04-questions.sql'),
      questionsSql,
    );

    // Generate surveys SQL (placeholder)
    console.log('Generating surveys SQL...');
    const surveysSql = generateSurveysSql();
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '05-surveys.sql'),
      surveysSql,
    );

    // Generate survey questions SQL (placeholder)
    console.log('Generating survey questions SQL...');
    const surveyQuestionsSql = generateSurveyQuestionsSql();
    fs.writeFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '06-survey-questions.sql'),
      surveyQuestionsSql,
    );

    // Also copy the files to the processed SQL directory
    console.log('Copying SQL files to processed directory...');
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '01-courses.sql'),
      path.join(PROCESSED_SQL_DIR, '01-courses.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '07-media.sql'),
      path.join(PROCESSED_SQL_DIR, '07-media.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '02-lessons.sql'),
      path.join(PROCESSED_SQL_DIR, '02-lessons.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql'),
      path.join(PROCESSED_SQL_DIR, '03-quizzes.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '04-questions.sql'),
      path.join(PROCESSED_SQL_DIR, '04-questions.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '05-surveys.sql'),
      path.join(PROCESSED_SQL_DIR, '05-surveys.sql'),
    );
    fs.copyFileSync(
      path.join(PAYLOAD_SQL_SEED_DIR, '06-survey-questions.sql'),
      path.join(PROCESSED_SQL_DIR, '06-survey-questions.sql'),
    );

    console.log('SQL seed files generated successfully!');
  } catch (error) {
    console.error('Error generating SQL seed files:', error);
    throw error;
  }
}

/**
 * Generates a map of quiz slugs to UUIDs
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @returns Map of quiz slugs to UUIDs
 */
function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Generate a UUID for each quiz
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');
    quizMap.set(slug, uuidv4());
  }

  return quizMap;
}

/**
 * Generates SQL for the courses table
 * @returns SQL for courses
 */
function generateCoursesSql(): string {
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

/**
 * Generates SQL for lessons from .mdoc files
 * @param lessonsDir - Directory containing lesson .mdoc files
 * @returns SQL for lessons
 */
/**
 * Generates SQL for media entries based on image mappings
 * @returns SQL for media entries
 */
function generateMediaSql(): string {
  // Start building the SQL
  let sql = `-- Seed data for the media table
-- This file should be run after the migrations to ensure the media table exists

-- Start a transaction
BEGIN;

`;

  // Create a map to store media IDs by frontmatter path
  const mediaIds: Record<string, string> = {};
  global.mediaIds = mediaIds;

  // Process lesson images
  Object.entries(lessonImageMappings).forEach(
    ([frontmatterPath, actualFilename]) => {
      const mediaId = uuidv4();
      mediaIds[frontmatterPath] = mediaId;

      sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    },
  );

  // Process post images
  Object.entries(postImageMappings).forEach(
    ([frontmatterPath, actualFilename]) => {
      const mediaId = uuidv4();
      mediaIds[frontmatterPath] = mediaId;

      sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    },
  );

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}

/**
 * Helper function to determine MIME type based on file extension
 * @param filename - Filename
 * @returns MIME type
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function generateLessonsSql(lessonsDir: string): string {
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

    // Add the lesson to the SQL
    sql += `-- Insert lesson: ${data.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  course_id,
  ${mediaId ? 'featured_image_id,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}', -- Generated UUID for the lesson
  '${data.title.replace(/'/g, "''")}',
  '${path.basename(file, '.mdoc')}',
  '${(data.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${data.lessonNumber || data.order || 0},
  '${COURSE_ID}', -- Course ID
  ${mediaId ? `'${mediaId}',` : ''}
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
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}

/**
 * Generates SQL for quizzes from .mdoc files
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @param quizMap - Map of quiz slugs to UUIDs
 * @returns SQL for quizzes
 */
function generateQuizzesSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the course quizzes table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Process each quiz file
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = quizMap.get(quizSlug) || uuidv4();

    // Add the quiz to the SQL
    sql += `-- Insert quiz: ${data.title}
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '${quizId}', -- UUID for the quiz
  '${data.title.replace(/'/g, "''")}',
  '${quizSlug}',
  '${(data.description || `Quiz for ${data.title}`).replace(/'/g, "''")}',
  ${data.passingScore || 70}, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

`;
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}

/**
 * Generates SQL for quiz questions from .mdoc files
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @param quizMap - Map of quiz slugs to UUIDs
 * @returns SQL for quiz questions
 */
function generateQuestionsSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

`;

  // Process each quiz file
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Skip if there are no questions
    if (!data.questions || !Array.isArray(data.questions)) {
      continue;
    }

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = quizMap.get(quizSlug) || uuidv4();

    sql += `-- Questions for quiz: ${data.title} (${quizSlug}, ID: ${quizId})
`;

    // Process each question
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      const questionId = uuidv4();

      // Add the question to the SQL
      sql += `-- Insert question ${i + 1} for quiz: ${data.title}
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '${questionId}', -- Generated UUID for the question
  '${question.question.replace(/'/g, "''")}',
  '${quizId}', -- Quiz ID
  '${quizId}', -- Quiz ID (duplicate)
  '${question.questiontype || 'multiple_choice'}',
  '${(question.explanation || '').replace(/'/g, "''")}',
  ${i},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

`;

      // Process each answer
      if (question.answers && Array.isArray(question.answers)) {
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];

          // Add the answer to the SQL
          sql += `-- Insert option ${j + 1} for question ${i + 1}
INSERT INTO payload.quiz_questions_options (
  id,
  _order,
  _parent_id,
  text,
  is_correct,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  ${j},
  '${questionId}',
  '${answer.answer.replace(/'/g, "''")}',
  ${answer.correct ? 'true' : 'false'},
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the option already exists

`;
        }
      }

      // Add the relationship entry
      sql += `-- Create relationship entry for the question to the quiz
INSERT INTO payload.quiz_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${questionId}',
  'quiz_id',
  '${quizId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;

      // Add the bidirectional relationship entry
      sql += `-- Create bidirectional relationship entry for the quiz to the question
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${quizId}',
  'questions',
  '${questionId}',
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

/**
 * Generates SQL for surveys from the self-assessment.yaml file
 * @returns SQL for surveys
 */
function generateSurveysSql(): string {
  // Read the self-assessment.yaml file
  const surveyFilePath = path.join(RAW_SURVEYS_DIR, 'self-assessment.yaml');
  if (!fs.existsSync(surveyFilePath)) {
    console.warn(`Survey file not found: ${surveyFilePath}`);
    return generatePlaceholderSurveysSql();
  }

  // Parse the YAML data
  const surveyContent = fs.readFileSync(surveyFilePath, 'utf8');
  const surveyData = yaml.load(surveyContent) as any;

  // Generate SQL for the survey
  const surveyId = '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9'; // Fixed UUID for consistency
  const surveySlug = surveyData.title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');

  return `-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert the self-assessment survey
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  status,
  created_at,
  updated_at
) VALUES (
  '${surveyId}',
  '${surveyData.title.replace(/'/g, "''")}',
  '${surveySlug}',
  'Self-assessment survey for presentation skills',
  '${surveyData.status || 'published'}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Commit the transaction
COMMIT;
`;
}

/**
 * Generates placeholder SQL for surveys (used as fallback if YAML file not found)
 * @returns SQL for surveys
 */
function generatePlaceholderSurveysSql(): string {
  return `-- Seed data for the surveys table
-- This file should be run after the migrations to ensure the surveys table exists

-- Start a transaction
BEGIN;

-- Insert a sample survey
INSERT INTO payload.surveys (
  id,
  title,
  slug,
  description,
  created_at,
  updated_at
) VALUES (
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Fixed UUID for the survey
  'Course Feedback Survey',
  'course-feedback-survey',
  'Please provide feedback on the course',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the survey already exists

-- Commit the transaction
COMMIT;
`;
}

/**
 * Generates SQL for survey questions from the self-assessment.yaml file
 * @returns SQL for survey questions
 */
function generateSurveyQuestionsSql(): string {
  // Read the self-assessment.yaml file
  const surveyFilePath = path.join(RAW_SURVEYS_DIR, 'self-assessment.yaml');
  if (!fs.existsSync(surveyFilePath)) {
    console.warn(`Survey file not found: ${surveyFilePath}`);
    return generatePlaceholderSurveyQuestionsSql();
  }

  // Parse the YAML data
  const surveyContent = fs.readFileSync(surveyFilePath, 'utf8');
  const surveyData = yaml.load(surveyContent) as any;

  // Survey ID (must match the ID used in generateSurveysSql)
  const surveyId = '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9';

  // Start building the SQL
  let sql = `-- Seed data for the survey questions table
-- This file should be run after the surveys seed file to ensure the surveys exist

-- Start a transaction
BEGIN;

`;

  // Process each question
  if (surveyData.questions && Array.isArray(surveyData.questions)) {
    for (let i = 0; i < surveyData.questions.length; i++) {
      const question = surveyData.questions[i];
      const questionId = uuidv4();

      // Convert questionspin string to integer (0 for Positive, 1 for Negative)
      // Make the comparison case-insensitive
      const questionspinValue =
        question.questionspin &&
        question.questionspin.toLowerCase() === 'negative'
          ? 1
          : 0;

      // Add the question to the SQL
      sql += `-- Insert question ${i + 1}: ${question.question.substring(0, 50)}...
INSERT INTO payload.survey_questions (
  id,
  question,
  type,
  category,
  questionspin,
  position,
  surveys_id,
  required,
  created_at,
  updated_at
) VALUES (
  '${questionId}',
  '${question.question.replace(/'/g, "''")}',
  'multiple_choice',
  '${question.questioncategory || ''}',
  ${questionspinValue},
  ${i},
  '${surveyId}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;

      // Process answer options
      if (question.answers && Array.isArray(question.answers)) {
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];

          // Add the option to the SQL
          sql += `-- Insert option ${j + 1} for question ${i + 1}
INSERT INTO payload.survey_questions_options (
  id,
  _order,
  _parent_id,
  option,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  ${j},
  '${questionId}',
  '${answer.answer.replace(/'/g, "''")}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
        }
      }

      // Create relationship entry for the question to the survey
      sql += `-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${questionId}',
  'surveys',
  '${surveyId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;

      // Create bidirectional relationship entry for the survey to the question
      sql += `-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  survey_questions_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${surveyId}',
  'questions',
  '${questionId}',
  '${questionId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
    }
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}

/**
 * Generates placeholder SQL for survey questions (used as fallback if YAML file not found)
 * @returns SQL for survey questions
 */
function generatePlaceholderSurveyQuestionsSql(): string {
  return `-- Seed data for the survey questions table
-- This file should be run after the surveys seed file to ensure the surveys exist

-- Start a transaction
BEGIN;

-- Insert a sample survey question
INSERT INTO payload.survey_questions (
  id,
  question,
  surveys_id,
  created_at,
  updated_at
) VALUES (
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea', -- Fixed UUID for the question
  'How would you rate the course overall?',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', -- Survey ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

-- Create relationship entry for the question to the survey
INSERT INTO payload.survey_questions_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea',
  'surveys',
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Create bidirectional relationship entry for the survey to the question
INSERT INTO payload.surveys_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9',
  'questions',
  '6e352ade-c6a9-4e4a-9ffa-9680a5d5f9ea',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

-- Commit the transaction
COMMIT;
`;
}

/**
 * Converts Markdown content to a simple Lexical JSON structure
 * @param content - Markdown content
 * @returns Lexical JSON structure as a string
 */
function convertToLexical(content: string): string {
  // Split the content into paragraphs
  const paragraphs = content.split('\n\n');

  // Create a simple Lexical JSON structure
  const lexical = {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };

  return JSON.stringify(lexical);
}

// Run the generator if this script is executed directly
if (
  import.meta.url === import.meta.resolve('./generate-sql-seed-files-fixed.ts')
) {
  generateSqlSeedFiles()
    .then(() => {
      console.log('SQL seed files generated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error generating SQL seed files:', error);
      process.exit(1);
    });
}

export { generateSqlSeedFiles };
