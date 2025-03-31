/**
 * Script to run all content migration scripts in the correct order
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Runs all content migration scripts
 */
async function runAllMigrations() {
  console.log('Starting all content migrations...');

  try {
    // First, test the database connection and schema
    console.log('\n=== Testing database connection and schema ===');
    await import('./test-database-connection.js');

    // Create a course
    console.log('\n=== Creating course ===');
    await import('./create-course.js');

    // Migrate course quizzes first (needed for quiz questions)
    console.log('\n=== Migrating course quizzes ===');
    await import('./migrate-course-quizzes.js');

    // Migrate quiz questions (depends on course quizzes)
    console.log('\n=== Migrating quiz questions ===');
    await import('./migrate-quiz-questions.js');

    // Migrate course lessons (depends on courses and quizzes)
    console.log('\n=== Migrating course lessons ===');
    await import('./migrate-course-lessons.js');

    // Migrate documentation
    console.log('\n=== Migrating documentation ===');
    await import('./migrate-docs-enhanced.js');

    // Migrate additional documentation from payload data
    console.log(
      '\n=== Migrating additional documentation from payload data ===',
    );
    await import('./migrate-payload-docs.js');

    // Migrate blog posts
    console.log('\n=== Migrating blog posts ===');
    await import('./migrate-posts.js');

    // Migrate additional quizzes from payload data
    console.log('\n=== Migrating additional quizzes from payload data ===');
    await import('./migrate-payload-quizzes.js');

    // Migrate testimonials
    console.log('\n=== Migrating testimonials ===');
    await import('./migrate-testimonials.js');

    // Final database connection test to verify all migrations
    console.log('\n=== Final database connection test ===');
    await import('./test-database-connection.js');

    console.log('\nAll migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations().catch((error) => {
  console.error('Migration process failed:', error);
  process.exit(1);
});
