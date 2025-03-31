/**
 * Script to run all content migration scripts in the correct order
 * using direct database access for problematic migrations
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

    // Migrate course lessons (depends on courses)
    console.log('\n=== Migrating course lessons ===');
    await import('./migrate-course-lessons.js');

    // Migrate course quizzes directly to the database
    console.log('\n=== Migrating course quizzes directly to the database ===');
    await import('./migrate-course-quizzes-direct.js');

    // Migrate quiz questions directly to the database
    console.log('\n=== Migrating quiz questions directly to the database ===');
    await import('./migrate-quiz-questions-direct.js');

    // Fix relationships directly in the database
    console.log('\n=== Fixing relationships directly in the database ===');
    await import('./fix-relationships-direct.js');

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
