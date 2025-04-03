/**
 * Script to run all content migration scripts in the correct order
 * using direct database access for problematic migrations
 * Fixed version with improved error handling and UUID validation
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
    // First, test the database connection and schema directly
    console.log('\n=== Testing database connection and schema directly ===');
    await import('./test-database-connection-direct.js');

    // Seed the course data directly to the database
    console.log('\n=== Seeding course data directly to the database ===');
    await import('./seed-course-data.js');

    // Migrate course lessons directly to the database
    console.log('\n=== Migrating course lessons directly to the database ===');
    await import('./migrate-course-lessons-direct.js');

    // Migrate course quizzes directly to the database
    console.log('\n=== Migrating course quizzes directly to the database ===');
    await import('./migrate-course-quizzes-direct.js');

    // Add a delay to ensure all quizzes are committed to the database
    console.log(
      '\n=== Waiting for quizzes to be committed to the database ===',
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Migrate quiz questions directly to the database using the fixed version
    console.log(
      '\n=== Migrating quiz questions directly to the database (fixed version) ===',
    );
    await import('./migrate-quiz-questions-direct-fixed.js');

    // Fix relationships directly in the database
    console.log('\n=== Fixing relationships directly in the database ===');
    await import('./repair/fix-relationships-direct.js');

    // Migrate documentation directly to the database
    console.log('\n=== Migrating documentation directly to the database ===');
    await import('./migrate-docs-direct.js');

    // Skip additional documentation migration for now
    console.log(
      '\n=== Skipping additional documentation migration for debugging ===',
    );
    // await import('./migrate-payload-docs.js');

    // Migrate surveys directly to the database
    console.log('\n=== Migrating surveys directly to the database ===');
    await import('./migrate-surveys-direct.js');

    // Migrate survey questions directly to the database
    console.log(
      '\n=== Migrating survey questions directly to the database ===',
    );
    await import('./migrate-survey-questions-direct.js');

    // Migrate blog posts directly to the database
    console.log('\n=== Migrating blog posts directly to the database ===');
    await import('./migrate-posts-direct.js');

    // Skip additional quizzes migration since they're already migrated by migrate-course-quizzes-direct.js
    console.log(
      '\n=== Skipping additional quizzes migration (already migrated) ===',
    );
    // await import('./migrate-payload-quizzes-direct.js');

    // Final database connection test to verify all migrations
    console.log('\n=== Final database connection test directly ===');
    await import('./test-database-connection-direct.js');

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
