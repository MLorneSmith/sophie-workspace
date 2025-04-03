/**
 * Generate SQL Seed Files
 *
 * This script generates SQL seed files from the existing .mdoc files.
 * It's a one-time script to help with the initial conversion from TypeScript/JavaScript scripts to SQL seed files.
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const lessonsDir = path.resolve(
  __dirname,
  '../../../../../apps/payload/data/courses/lessons',
);
const quizzesDir = path.resolve(
  __dirname,
  '../../../../../apps/payload/data/courses/quizzes',
);
const sqlSeedDir = path.resolve(
  __dirname,
  '../../../../../apps/payload/src/seed/sql',
);

/**
 * Generates SQL seed files from the existing .mdoc files
 */
async function generateSqlSeedFiles() {
  console.log('Starting SQL seed files generation...');

  // Ensure SQL seed directory exists
  if (!fs.existsSync(sqlSeedDir)) {
    fs.mkdirSync(sqlSeedDir, { recursive: true });
  }

  // Generate lessons SQL
  console.log('Generating lessons SQL...');
  const lessonsSql = generateLessonsSql(lessonsDir);
  fs.writeFileSync(path.join(sqlSeedDir, '02-lessons.sql'), lessonsSql);

  // Generate quizzes SQL
  console.log('Generating quizzes SQL...');
  const quizzesSql = generateQuizzesSql(quizzesDir);
  fs.writeFileSync(path.join(sqlSeedDir, '03-quizzes.sql'), quizzesSql);

  // Generate questions SQL
  console.log('Generating questions SQL...');
  const questionsSql = generateQuestionsSql(quizzesDir);
  fs.writeFileSync(path.join(sqlSeedDir, '04-questions.sql'), questionsSql);

  console.log('SQL seed files generated successfully!');
}

/**
 * Generates SQL for lessons from .mdoc files
 * @param lessonsDir - Directory containing lesson .mdoc files
 * @returns SQL for lessons
 */
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
  created_at,
  updated_at
) VALUES (
  '${lessonId}', -- Generated UUID for the lesson
  '${data.title.replace(/'/g, "''")}',
  '${path.basename(file, '.mdoc')}',
  '${(data.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${data.lessonNumber || data.order || 0},
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', -- Course ID
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

`;

    // Add the relationship entry
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
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
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
 * @returns SQL for quizzes
 */
function generateQuizzesSql(quizzesDir: string): string {
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

    // Generate a UUID for the quiz
    const quizId = uuidv4();

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
  '${quizId}', -- Generated UUID for the quiz
  '${data.title.replace(/'/g, "''")}',
  '${path.basename(file, '.mdoc')}',
  'Quiz for ${data.title.replace(/'/g, "''")}',
  70, -- Default passing score
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
 * @returns SQL for quiz questions
 */
function generateQuestionsSql(quizzesDir: string): string {
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

    // Get the quiz ID from the quizzes SQL
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = `-- Quiz ID for ${quizSlug} (replace with actual UUID)`;

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
  '',
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
if (import.meta.url === import.meta.resolve('./generate-sql-seed-files.ts')) {
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
