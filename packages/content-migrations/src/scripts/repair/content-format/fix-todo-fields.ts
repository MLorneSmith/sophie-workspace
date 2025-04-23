/**
 * Fix Todo Fields Script
 *
 * Directly repairs todo fields in the database by updating them
 * from the YAML metadata file.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Database connection
const client = new Client({
  connectionString:
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Path to the YAML metadata file
const yamlFilePath = path.resolve(
  process.cwd(),
  'src/data/raw/lesson-metadata.yaml',
);

async function fixTodoFields() {
  try {
    console.log('Starting to fix todo fields...');
    console.log(`Using YAML file: ${yamlFilePath}`);
    console.log(`Current directory: ${process.cwd()}`);

    // Connect to database
    await client.connect();
    console.log('Connected to database');
    console.log(
      `Database URI: ${process.env.DATABASE_URI || 'Using default connection string'}`,
    );

    // Read YAML file
    if (!fs.existsSync(yamlFilePath)) {
      console.error(`YAML file not found: ${yamlFilePath}`);
      return;
    }

    const fileContents = fs.readFileSync(yamlFilePath, 'utf8');
    const metadata = yaml.load(fileContents) as { lessons: any[] };
    console.log(`Loaded ${metadata.lessons.length} lessons from YAML`);

    // Debug: Let's check if todoFields exist in the YAML
    const lessonWithTodoFields = metadata.lessons.filter(
      (lesson) => lesson.todoFields,
    );
    console.log(
      `Found ${lessonWithTodoFields.length} lessons with todoFields in YAML`,
    );

    if (lessonWithTodoFields.length > 0) {
      console.log('Sample todoFields for first lesson:');
      console.log(JSON.stringify(lessonWithTodoFields[0].todoFields, null, 2));
    } else {
      console.log('No lessons have todoFields property!');
    }

    // Begin transaction
    await client.query('BEGIN');

    // Process each lesson
    let updatedCount = 0;
    for (const lesson of metadata.lessons) {
      const slug = lesson.slug;

      // If todo fields exist in the YAML
      if (lesson.todoFields) {
        // First, log the current state in database
        const checkQuery = `SELECT slug, todo, todo_complete_quiz, todo_watch_content, todo_read_content, todo_course_project 
                          FROM payload.course_lessons 
                          WHERE slug = $1`;
        const checkResult = await client.query(checkQuery, [slug]);

        if (checkResult.rows.length > 0) {
          const currentRecord = checkResult.rows[0];
          console.log(`\nCurrent DB state for lesson '${slug}':`);
          console.log(`  todo: ${currentRecord.todo ? 'present' : 'null'}`);
          console.log(
            `  todo_complete_quiz: ${currentRecord.todo_complete_quiz}`,
          );
          console.log(
            `  todo_watch_content: ${currentRecord.todo_watch_content ? 'present' : 'null'}`,
          );
          console.log(
            `  todo_read_content: ${currentRecord.todo_read_content ? 'present' : 'null'}`,
          );
          console.log(
            `  todo_course_project: ${currentRecord.todo_course_project ? 'present' : 'null'}`,
          );

          // Prepare update fields
          const todoContent = lesson.todoFields.todo || null;
          const todoCompleteQuiz = lesson.todoFields.completeQuiz === true;
          const todoWatchContent = lesson.todoFields.watchContent || null;
          const todoReadContent = lesson.todoFields.readContent || null;
          const todoCourseProject = lesson.todoFields.courseProject || null;

          console.log(`\nYAML state for lesson '${slug}':`);
          console.log(`  todo: ${todoContent ? 'present' : 'null'}`);
          console.log(`  todo_complete_quiz: ${todoCompleteQuiz}`);
          console.log(
            `  todo_watch_content: ${todoWatchContent ? 'present' : 'null'}`,
          );
          console.log(
            `  todo_read_content: ${todoReadContent ? 'present' : 'null'}`,
          );
          console.log(
            `  todo_course_project: ${todoCourseProject ? 'present' : 'null'}`,
          );

          // Update the database record
          const updateQuery = `
            UPDATE payload.course_lessons 
            SET 
              todo = $1,
              todo_complete_quiz = $2,
              todo_watch_content = $3,
              todo_read_content = $4,
              todo_course_project = $5
            WHERE slug = $6
          `;

          await client.query(updateQuery, [
            todoContent,
            todoCompleteQuiz,
            todoWatchContent,
            todoReadContent,
            todoCourseProject,
            slug,
          ]);

          console.log(`✅ Updated todo fields for lesson '${slug}'`);
          updatedCount++;
        } else {
          console.log(`⚠️ Lesson with slug '${slug}' not found in database`);
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(
      `\n✅ Successfully updated todo fields for ${updatedCount} lessons`,
    );

    // Verify some fields were updated
    const verifyQuery = `
      SELECT COUNT(*) as count 
      FROM payload.course_lessons 
      WHERE todo IS NOT NULL 
        OR todo_complete_quiz = true 
        OR todo_watch_content IS NOT NULL 
        OR todo_read_content IS NOT NULL 
        OR todo_course_project IS NOT NULL
    `;

    const verifyResult = await client.query(verifyQuery);
    console.log(
      `\nVerification: ${verifyResult.rows[0].count} lessons now have populated todo fields`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing todo fields:', error);
  } finally {
    await client.end();
  }
}

// Run the function immediately with clearer debug output
console.log('Starting fix-todo-fields...');
fixTodoFields()
  .then(() => {
    console.log('Todo fields update completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating todo fields:', error);
    process.exit(1);
  });

export default fixTodoFields;
