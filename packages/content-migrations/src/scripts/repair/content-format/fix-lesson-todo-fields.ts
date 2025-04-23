/**
 * Script to update existing lesson records with todo fields from YAML
 * This can be used to update the database without running a full migration
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
  '../data/raw/lesson-metadata.yaml',
);

// Database connection configuration
// Read from .env.development file to match migration settings
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../../.env.development');
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
 * Escape SQL string values
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

/**
 * Main function to update lesson todo fields
 */
async function updateLessonTodoFields() {
  console.log('Updating lesson todo fields in database...');

  // 1. Read and parse YAML file
  const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
  const metadata = yaml.load(yamlContent) as { lessons: any[] };

  if (!metadata.lessons || !Array.isArray(metadata.lessons)) {
    console.error('Invalid YAML structure: Missing or invalid lessons array');
    process.exit(1);
  }

  console.log(`Found ${metadata.lessons.length} lessons in YAML file`);

  // 2. Connect to database
  const pool = new Pool(dbConfig);
  try {
    console.log(
      `Connecting to database ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`,
    );
    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query('BEGIN');

      // 3. Prepare and execute updates
      const updated = [];
      const notFound = [];
      const noTodoFields = [];

      for (const lesson of metadata.lessons) {
        // Skip lessons without todo fields
        if (!lesson.todoFields) {
          noTodoFields.push(lesson.title);
          continue;
        }

        // Prepare SQL values for todo fields
        const todoContent = lesson.todoFields.todo
          ? `'${escapeSql(lesson.todoFields.todo)}'`
          : 'NULL';
        const todoCompleteQuiz = lesson.todoFields.completeQuiz
          ? 'true'
          : 'false';
        const todoWatchContent = lesson.todoFields.watchContent
          ? `'${escapeSql(lesson.todoFields.watchContent)}'`
          : 'NULL';
        const todoReadContent = lesson.todoFields.readContent
          ? `'${escapeSql(lesson.todoFields.readContent)}'`
          : 'NULL';
        const todoCourseProject = lesson.todoFields.courseProject
          ? `'${escapeSql(lesson.todoFields.courseProject)}'`
          : 'NULL';

        // Check if the lesson exists
        const checkResult = await client.query(
          'SELECT id FROM payload.course_lessons WHERE slug = $1',
          [lesson.slug],
        );

        if (checkResult.rowCount === 0) {
          notFound.push(lesson.title);
          continue;
        }

        // Update the lesson
        const updateQuery = `
          UPDATE payload.course_lessons
          SET 
            todo = ${todoContent},
            todo_complete_quiz = ${todoCompleteQuiz},
            todo_watch_content = ${todoWatchContent},
            todo_read_content = ${todoReadContent},
            todo_course_project = ${todoCourseProject},
            updated_at = NOW()
          WHERE slug = $1
        `;

        await client.query(updateQuery, [lesson.slug]);
        updated.push(lesson.title);
      }

      // Commit the transaction
      await client.query('COMMIT');

      // 4. Print results
      console.log(`\n=== UPDATE RESULTS ===`);
      console.log(`Total lessons in YAML: ${metadata.lessons.length}`);
      console.log(`Lessons updated: ${updated.length}`);
      console.log(`Lessons without todo fields: ${noTodoFields.length}`);
      console.log(`Lessons not found in database: ${notFound.length}`);

      if (notFound.length > 0) {
        console.log(`\nLessons not found in database (${notFound.length}):`);
        notFound.forEach((title) => {
          console.log(`  - ${title}`);
        });
      }

      console.log('\n✅ Database update completed successfully');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error updating database:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the update function if executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  updateLessonTodoFields()
    .then(() => {
      console.log('Update completed successfully');
    })
    .catch((error) => {
      console.error('Update failed with error:', error);
      process.exit(1);
    });
}

export { updateLessonTodoFields };
