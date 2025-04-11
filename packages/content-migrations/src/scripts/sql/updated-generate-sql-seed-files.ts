/**
 * Updated SQL Seed Files Generator
 * Uses YAML metadata and optimized approaches for generating SQL seed files
 */
import { error } from 'console';
import fs from 'fs';
import * as jsYaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

// Import quiz map generator
import generateQuizMap from '../utils/quiz-map-generator.js';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../..');
const DATA_DIR = path.resolve(__dirname, '../../data');
const RAW_DATA_DIR = path.resolve(DATA_DIR, 'raw');
const PROCESSED_DIR = path.resolve(DATA_DIR, 'processed');
const SQL_DIR = path.resolve(PROCESSED_DIR, 'sql');
const PAYLOAD_SEED_DIR = path.resolve(ROOT_DIR, 'apps/payload/src/seed/sql');

// YAML file containing lesson metadata
const LESSON_METADATA_FILE = path.resolve(RAW_DATA_DIR, 'lesson-metadata.yaml');

/**
 * Main function to generate all SQL seed files
 */
async function generateAllSqlSeedFiles() {
  try {
    console.log('Starting YAML-based SQL seed file generation...');

    // Ensure directories exist
    ensureDirectoriesExist();

    // Load lesson metadata from YAML
    const lessonMetadata = loadLessonMetadata();

    // Generate quiz map
    const quizMap = generateQuizMap();

    // Generate SQL seed files
    await generateCoursesSql();
    await generateLessonsSql(lessonMetadata, quizMap);
    await generateQuizzesSql(quizMap);
    await generateLessonQuizReferencesSql(lessonMetadata, quizMap);
    await generateQuestionsSql(quizMap);
    await generateSurveysSql();
    await generateSurveyQuestionsSql();
    await generatePostsSql();
    await generateDocumentationSql();

    // Copy SQL files to payload seed directory
    copyFilesToPayloadSeedDir();

    console.log('YAML-based SQL seed file generation completed successfully');
  } catch (error) {
    console.error('Error generating SQL seed files:', error);
    throw error;
  }
}

/**
 * Ensure required directories exist
 */
function ensureDirectoriesExist() {
  // Create processed directory if it doesn't exist
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  // Create SQL directory if it doesn't exist
  if (!fs.existsSync(SQL_DIR)) {
    fs.mkdirSync(SQL_DIR, { recursive: true });
  }

  // Create Payload seed directory if it doesn't exist
  if (!fs.existsSync(PAYLOAD_SEED_DIR)) {
    fs.mkdirSync(PAYLOAD_SEED_DIR, { recursive: true });
  }
}

/**
 * Load lesson metadata from YAML file
 * @returns {Object} Lesson metadata
 */
function loadLessonMetadata() {
  try {
    // Check if the YAML file exists
    if (!fs.existsSync(LESSON_METADATA_FILE)) {
      console.warn(`Lesson metadata file not found: ${LESSON_METADATA_FILE}`);
      return { lessons: [] };
    }

    // Parse YAML file
    const fileContent = fs.readFileSync(LESSON_METADATA_FILE, 'utf8');
    const metadata = jsYaml.load(fileContent) as { lessons: any[] };

    console.log(`Loaded lesson metadata: ${metadata.lessons.length} lessons`);
    return metadata;
  } catch (error) {
    console.error('Error loading lesson metadata:', error);
    return { lessons: [] };
  }
}

/**
 * Generate courses SQL
 */
async function generateCoursesSql() {
  try {
    console.log('Generating courses SQL...');

    // Read courses from the existing file as a fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '01-courses.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '01-courses.sql');
      fs.writeFileSync(outputFile, content);

      console.log('Courses SQL generated successfully (from existing file)');
      return;
    }

    // Generate from scratch if no existing file
    const courseSql = `
-- Course data
INSERT INTO payload.courses (id, title, slug, description) VALUES
('decks-for-decision-makers', 'Decks for Decision Makers', 'decks-for-decision-makers', 'Master the art of creating business presentations that inform and persuade.');
`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '01-courses.sql');
    fs.writeFileSync(outputFile, courseSql);

    console.log('Courses SQL generated successfully');
  } catch (error) {
    console.error('Error generating courses SQL:', error);
    throw error;
  }
}

/**
 * Generate lessons SQL
 * @param {Object} metadata Lesson metadata
 * @param {Object} quizMap Quiz map
 */
async function generateLessonsSql(metadata, quizMap) {
  try {
    console.log('Generating lessons SQL...');

    // Start SQL
    let lessonSql = `-- Lesson data
INSERT INTO payload.course_lessons (id, title, slug, lesson_number, description, course_id, quiz_id, featured_image_id, summary, estimated_duration, bunny_video_id, bunny_library_id, todo, todo_complete_quiz, todo_watch_content, todo_read_content, todo_course_project) VALUES
`;

    // Create SQL for each lesson
    const lessonValues = metadata.lessons
      .map((lesson) => {
        // Get quiz ID from quizMap if available
        const quizId = lesson.quiz ? quizMap[lesson.quiz] || 'NULL' : 'NULL';

        // Format values
        // Ensure empty strings are treated as NULL for bunnyVideoId
        const bunnyVideoId =
          lesson.bunnyVideo?.id && lesson.bunnyVideo.id.trim() !== ''
            ? `'${lesson.bunnyVideo.id}'`
            : 'NULL';
        const bunnyVideoLibraryId = lesson.bunnyVideo?.library
          ? `'${lesson.bunnyVideo.library}'`
          : 'NULL';

        // Log todo fields for debugging
        if (lesson.slug === 'lesson-0') {
          console.log('Todo fields for lesson-0:');
          console.log(
            'todoFields object:',
            JSON.stringify(lesson.todoFields, null, 2),
          );
          console.log('todo:', lesson.todoFields?.todo);
          console.log('completeQuiz:', lesson.todoFields?.completeQuiz);
          console.log('watchContent:', lesson.todoFields?.watchContent);
          console.log('readContent:', lesson.todoFields?.readContent);
          console.log('courseProject:', lesson.todoFields?.courseProject);
        }

        // Get todo fields and ensure they are properly escaped
        const todoContent = lesson.todoFields?.todo
          ? `'${escapeSql(String(lesson.todoFields.todo))}'`
          : 'NULL';
        const todoCompleteQuiz =
          lesson.todoFields?.completeQuiz === true ? 'true' : 'false';
        const todoWatchContent = lesson.todoFields?.watchContent
          ? `'${escapeSql(String(lesson.todoFields.watchContent))}'`
          : 'NULL';
        const todoReadContent = lesson.todoFields?.readContent
          ? `'${escapeSql(String(lesson.todoFields.readContent))}'`
          : 'NULL';
        const todoCourseProject = lesson.todoFields?.courseProject
          ? `'${escapeSql(String(lesson.todoFields.courseProject))}'`
          : 'NULL';

        return `('${lesson.slug}', '${escapeSql(lesson.title)}', '${lesson.slug}', ${lesson.lessonNumber || 0}, '${escapeSql(lesson.description || '')}', 'decks-for-decision-makers', ${quizId !== 'NULL' ? `'${quizId}'` : 'NULL'}, NULL, '${escapeSql(lesson.description || '')}', ${lesson.lessonLength || 0}, ${bunnyVideoId}, ${bunnyVideoLibraryId}, ${todoContent}, ${todoCompleteQuiz}, ${todoWatchContent}, ${todoReadContent}, ${todoCourseProject})`;
      })
      .join(',\n');

    // Combine SQL
    lessonSql += lessonValues + ';';

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '02-lessons.sql');
    fs.writeFileSync(outputFile, lessonSql);

    console.log('Lessons SQL generated successfully');
  } catch (error) {
    console.error('Error generating lessons SQL:', error);
    throw error;
  }
}

/**
 * Generate quizzes SQL
 * @param {Object} quizMap Quiz map
 */
async function generateQuizzesSql(quizMap) {
  try {
    console.log('Generating quizzes SQL...');

    // Attempt to use the existing file first for fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '03-quizzes.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '03-quizzes.sql');
      fs.writeFileSync(outputFile, content);

      console.log('Quizzes SQL generated successfully (from existing file)');
      return;
    }

    // If we have quizMap but no file, generate placeholder SQL
    let quizSql = `-- Quiz data
INSERT INTO payload.course_quizzes (id, title, slug, description) VALUES
`;

    // Create SQL for each quiz in the map
    const quizValues = Object.entries(quizMap)
      .map(([slug, id]) => {
        const title = slug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `('${id}', '${title}', '${slug}', 'Quiz for ${title}')`;
      })
      .join(',\n');

    // Combine SQL
    quizSql += quizValues + ';';

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '03-quizzes.sql');
    fs.writeFileSync(outputFile, quizSql);

    console.log('Quizzes SQL generated successfully');
  } catch (error) {
    console.error('Error generating quizzes SQL:', error);
    throw error;
  }
}

/**
 * Generate lesson-quiz references SQL
 * @param {Object} metadata Lesson metadata
 * @param {Object} quizMap Quiz map
 */
async function generateLessonQuizReferencesSql(metadata, quizMap) {
  try {
    console.log('Generating lesson-quiz references SQL...');

    // Start SQL
    let referencesSql = `-- Lesson-Quiz relationships
INSERT INTO payload.course_lessons_rels (id, course_lessons_id, course_quizzes_id, order)
VALUES
`;

    // Create SQL for each lesson with a quiz
    const referenceValues = [];
    let order = 0;

    metadata.lessons.forEach((lesson) => {
      // Skip lessons without quizzes
      if (!lesson.quiz || !quizMap[lesson.quiz]) return;

      const lessonId = lesson.slug;
      const quizId = quizMap[lesson.quiz];

      // Add the relationship
      referenceValues.push(
        `(uuid_generate_v4(), '${lessonId}', '${quizId}', ${order++})`,
      );
    });

    // If no references, create empty file
    if (referenceValues.length === 0) {
      referencesSql = '-- No lesson-quiz references';
    } else {
      referencesSql += referenceValues.join(',\n') + ';';
    }

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '03a-lesson-quiz-references.sql');
    fs.writeFileSync(outputFile, referencesSql);

    console.log('Lesson-quiz references SQL generated successfully');
  } catch (error) {
    console.error('Error generating lesson-quiz references SQL:', error);
    throw error;
  }
}

/**
 * Generate questions SQL
 * @param {Object} quizMap Quiz map
 */
async function generateQuestionsSql(quizMap) {
  try {
    console.log('Generating questions SQL...');

    // Attempt to use the existing file for fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '04-questions.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '04-questions.sql');
      fs.writeFileSync(outputFile, content);

      console.log('Questions SQL generated successfully (from existing file)');
      return;
    }

    // If we have quizMap but no file, generate placeholder SQL
    let questionsSql = `-- No quiz questions available`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '04-questions.sql');
    fs.writeFileSync(outputFile, questionsSql);

    console.log('Questions SQL generated (placeholder)');
  } catch (error) {
    console.error('Error generating questions SQL:', error);
    throw error;
  }
}

/**
 * Generate surveys SQL
 */
async function generateSurveysSql() {
  try {
    console.log('Generating surveys SQL...');

    // Attempt to use the existing file for fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '05-surveys.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '05-surveys.sql');
      fs.writeFileSync(outputFile, content);

      console.log('Surveys SQL generated successfully (from existing file)');
      return;
    }

    // Generate placeholder SQL
    let surveysSql = `-- Surveys data
INSERT INTO payload.surveys (id, title, slug, description, survey_type) VALUES
('7f574cfa-e8b1-4f6b-b1cb-b890c6e7f1f1', 'Course Feedback', 'feedback', 'Feedback survey for the course', 'feedback'),
('5e352ade-c6a9-4e4a-9ffa-9680a5d5f9e9', 'High-Stakes Presentations Self-Assessment', 'self-assessment', 'Self-assessment survey for high-stakes presentations', 'assessment'),
('6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0', 'Three Quick Questions', 'three-quick-questions', 'Quick survey with three questions', 'quick');
`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '05-surveys.sql');
    fs.writeFileSync(outputFile, surveysSql);

    console.log('Surveys SQL generated successfully');
  } catch (error) {
    console.error('Error generating surveys SQL:', error);
    throw error;
  }
}

/**
 * Generate survey questions SQL
 */
async function generateSurveyQuestionsSql() {
  try {
    console.log('Generating survey questions SQL...');

    // Attempt to use the existing files for fallback
    const fileNames = [
      '06a-feedback-survey-questions.sql',
      '06b-assessment-survey-questions.sql',
      '06c-three-questions-survey-questions.sql',
    ];

    let anyFileCopied = false;

    for (const fileName of fileNames) {
      const existingFile = path.resolve(PAYLOAD_SEED_DIR, fileName);
      if (fs.existsSync(existingFile)) {
        const content = fs.readFileSync(existingFile, 'utf8');

        // Write to processed SQL directory
        const outputFile = path.resolve(SQL_DIR, fileName);
        fs.writeFileSync(outputFile, content);

        anyFileCopied = true;
      }
    }

    if (anyFileCopied) {
      console.log(
        'Survey questions SQL generated successfully (from existing files)',
      );
      return;
    }

    // If no files exist, create placeholder files
    for (const fileName of fileNames) {
      // Generate placeholder content
      const placeholderContent = `-- ${fileName.replace('.sql', '')}\n-- Placeholder for survey questions`;

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, fileName);
      fs.writeFileSync(outputFile, placeholderContent);
    }

    console.log('Survey questions SQL generated (placeholders)');
  } catch (error) {
    console.error('Error generating survey questions SQL:', error);
    throw error;
  }
}

/**
 * Generate posts SQL
 */
async function generatePostsSql() {
  try {
    console.log('Generating posts SQL...');

    // Attempt to use the existing file for fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '08-posts.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '08-posts.sql');
      fs.writeFileSync(outputFile, content);

      console.log('Posts SQL generated successfully (from existing file)');
      return;
    }

    // Generate placeholder SQL
    let postsSql = `-- Posts data\n-- Placeholder for posts`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '08-posts.sql');
    fs.writeFileSync(outputFile, postsSql);

    console.log('Posts SQL generated (placeholder)');
  } catch (error) {
    console.error('Error generating posts SQL:', error);
    throw error;
  }
}

/**
 * Generate documentation SQL
 */
async function generateDocumentationSql() {
  try {
    console.log('Generating documentation SQL...');

    // Attempt to use the existing file for fallback
    const existingFile = path.resolve(PAYLOAD_SEED_DIR, '07-documentation.sql');
    if (fs.existsSync(existingFile)) {
      const content = fs.readFileSync(existingFile, 'utf8');

      // Write to processed SQL directory
      const outputFile = path.resolve(SQL_DIR, '07-documentation.sql');
      fs.writeFileSync(outputFile, content);

      console.log(
        'Documentation SQL generated successfully (from existing file)',
      );
      return;
    }

    // Generate placeholder SQL
    let documentationSql = `-- Documentation data\n-- Placeholder for documentation`;

    // Write to processed SQL directory
    const outputFile = path.resolve(SQL_DIR, '07-documentation.sql');
    fs.writeFileSync(outputFile, documentationSql);

    console.log('Documentation SQL generated (placeholder)');
  } catch (error) {
    console.error('Error generating documentation SQL:', error);
    throw error;
  }
}

/**
 * Copy all SQL files to the Payload seed directory
 */
function copyFilesToPayloadSeedDir() {
  try {
    console.log('Copying SQL files to Payload seed directory...');

    // Get all SQL files
    const sqlFiles = fs
      .readdirSync(SQL_DIR)
      .filter((file) => file.endsWith('.sql'));

    // Copy each file
    sqlFiles.forEach((file) => {
      const sourcePath = path.resolve(SQL_DIR, file);
      const destPath = path.resolve(PAYLOAD_SEED_DIR, file);

      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to Payload seed directory`);
    });

    console.log('All SQL files copied successfully');
  } catch (error) {
    console.error('Error copying SQL files:', error);
    throw error;
  }
}

/**
 * Escape SQL string values including JSON content
 * @param {string} value String to escape
 * @returns {string} Escaped string
 */
function escapeSql(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/'/g, "''") // Escape single quotes with double single quotes for SQL
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r'); // Escape carriage returns
}

// Run the main function
generateAllSqlSeedFiles().catch((error) => {
  console.error('Failed to generate SQL seed files:', error);
  process.exit(1);
});
