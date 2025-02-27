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

    // Add more migrations here as needed
    // For example:
    // console.log('Running testimonials migration...');
    // await import('./migrate-testimonials.js');

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
