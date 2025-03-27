/**
 * Script to run all content migration scripts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Runs all content migration scripts
 */
async function runAllMigrations() {
  console.log('Starting all content migrations...');

  try {
    // Import and run the docs migration
    console.log('Running documentation migration...');
    await import('./migrate-docs.js').then((module) => {
      // The migrate-docs script runs automatically when imported
      // so we don't need to do anything here
    });

    // Import and run the docs content update
    console.log('Running documentation content update...');
    await import('./update-docs-content.js').then((module) => {
      // The update-docs-content script runs automatically when imported
      // so we don't need to do anything here
    });

    // Import and run the course lessons migration
    console.log('Running course lessons migration...');
    await import('./migrate-course-lessons.js').then((module) => {
      // The migrate-course-lessons script runs automatically when imported
    });

    // Import and run the course quizzes migration
    console.log('Running course quizzes migration...');
    await import('./migrate-course-quizzes.js').then((module) => {
      // The migrate-course-quizzes script runs automatically when imported
    });

    // Import and run the quiz questions migration
    console.log('Running quiz questions migration...');
    await import('./migrate-quiz-questions.js').then((module) => {
      // The migrate-quiz-questions script runs automatically when imported
    });

    // Import and run the blog posts migration
    console.log('Running blog posts migration...');
    await import('./migrate-posts.js').then((module) => {
      // The migrate-posts script runs automatically when imported
    });

    // Import and run the payload documentation migration
    console.log('Running payload documentation migration...');
    await import('./migrate-payload-docs.js').then((module) => {
      // The migrate-payload-docs script runs automatically when imported
    });

    // Import and run the payload quizzes migration
    console.log('Running payload quizzes migration...');
    await import('./migrate-payload-quizzes.js').then((module) => {
      // The migrate-payload-quizzes script runs automatically when imported
    });

    console.log('All migrations completed successfully!');
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
