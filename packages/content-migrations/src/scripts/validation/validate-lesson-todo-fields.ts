/**
 * Script to validate that todo fields from the YAML file are properly populated in the database
 * Run this after reset-and-migrate.ps1 to verify the lessons have the correct todo content
 */
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const YAML_FILE_PATH = path.resolve(
  __dirname,
  '../../data/raw/lesson-metadata.yaml',
);

// Database connection configuration
// Read from .env.development file to match migration settings
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../../../.env.development');
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = Object.fromEntries(
      envContent
        .split('\n')
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const [key, ...valueParts] = line.split('=');
          return [key.trim(), valueParts.join('=').trim()];
        }),
    );
    return envVars;
  }
  console.log('No .env.development file found, using default connection');
  return {};
}

const envVars = loadEnvFile();
const dbConfig = {
  host: envVars.DATABASE_HOST || 'localhost',
  port: parseInt(envVars.DATABASE_PORT || '54322'),
  database: envVars.DATABASE_NAME || 'postgres',
  user: envVars.DATABASE_USER || 'postgres',
  password: envVars.DATABASE_PASSWORD || 'postgres',
  schema: 'payload',
};

/**
 * Main validation function
 */
async function validateLessonTodoFields() {
  console.log('Validating lesson todo fields in database...');

  // 1. Read and parse YAML file
  const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
  const metadata = yaml.load(yamlContent) as { lessons: any[] };

  if (!metadata.lessons || !Array.isArray(metadata.lessons)) {
    console.error('Invalid YAML structure: Missing or invalid lessons array');
    return false;
  }

  console.log(`Found ${metadata.lessons.length} lessons in YAML file`);

  // Create map of lessons for quicker lookup
  const yamlLessonsMap = new Map();
  for (const lesson of metadata.lessons) {
    yamlLessonsMap.set(lesson.slug, lesson);
  }

  // 2. Connect to database
  const pool = new Pool(dbConfig);
  try {
    console.log(
      `Connecting to database ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`,
    );
    const client = await pool.connect();

    try {
      // 3. Query lessons from database
      const result = await client.query(
        `SELECT id, title, slug, todo, todo_complete_quiz, todo_watch_content, todo_read_content, todo_course_project 
         FROM payload.course_lessons`,
      );

      const dbLessons = result.rows;
      console.log(`Found ${dbLessons.length} lessons in database`);

      // 4. Compare YAML and database lessons
      const validationResults = {
        total: dbLessons.length,
        withTodoFields: 0,
        matchingYaml: 0,
        missingTodoFields: [],
      };

      for (const dbLesson of dbLessons) {
        const yamlLesson = yamlLessonsMap.get(dbLesson.slug);

        if (!yamlLesson) {
          console.log(
            `Warning: Lesson "${dbLesson.title}" (${dbLesson.slug}) not found in YAML file`,
          );
          continue;
        }

        // Check if database has todo fields
        const hasTodoFields =
          dbLesson.todo !== null ||
          dbLesson.todo_watch_content !== null ||
          dbLesson.todo_read_content !== null ||
          dbLesson.todo_course_project !== null;

        if (hasTodoFields) {
          validationResults.withTodoFields++;
        }

        // Check if YAML has todo fields
        const yamlHasTodoFields =
          yamlLesson.todoFields &&
          (yamlLesson.todoFields.todo ||
            yamlLesson.todoFields.watchContent ||
            yamlLesson.todoFields.readContent ||
            yamlLesson.todoFields.courseProject);

        // Compare if database matches YAML
        if (yamlHasTodoFields && !hasTodoFields) {
          validationResults.missingTodoFields.push({
            title: dbLesson.title,
            slug: dbLesson.slug,
          });
        } else if (yamlHasTodoFields && hasTodoFields) {
          validationResults.matchingYaml++;
        }
      }

      // 5. Print validation results
      console.log('\n=== VALIDATION RESULTS ===');
      console.log(`Total lessons in database: ${validationResults.total}`);
      console.log(
        `Lessons with todo fields in database: ${validationResults.withTodoFields}`,
      );
      console.log(
        `Lessons with todo fields matching YAML: ${validationResults.matchingYaml}`,
      );

      if (validationResults.missingTodoFields.length > 0) {
        console.log(
          `\nLessons missing todo fields in database (${validationResults.missingTodoFields.length}):`,
        );
        validationResults.missingTodoFields.forEach((lesson) => {
          console.log(`  - ${lesson.title} (${lesson.slug})`);
        });
      }

      const success = validationResults.missingTodoFields.length === 0;
      if (success) {
        console.log(
          '\n✅ All lessons with todo fields in YAML are properly reflected in the database',
        );
        return true;
      } else {
        console.log(
          '\n❌ Some lessons with todo fields in YAML are missing them in the database',
        );
        console.log(
          '   Run the migration with the latest changes to populate the todo fields',
        );
        return false;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the validation function if executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  validateLessonTodoFields()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation failed with error:', error);
      process.exit(1);
    });
}

export { validateLessonTodoFields };
