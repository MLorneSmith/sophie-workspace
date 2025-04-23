/**
 * Direct SQL Fix for Quiz Relationships
 *
 * This script executes direct SQL commands to fix issues with quiz relationships:
 * 1. Updates all quizzes to have the correct course_id
 * 2. Creates proper relationships between quizzes and their questions
 * 3. Ensures bidirectional relationships are maintained
 */
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../../.env.development');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment variables from ${envPath}`);
}

async function main() {
  console.log('Running direct SQL fix for quiz relationships...');

  // Get database connection from environment variables
  let connectionString = process.env.DATABASE_URL;

  // If DATABASE_URL is not set, check for DATABASE_URI (for backward compatibility)
  if (!connectionString) {
    connectionString = process.env.DATABASE_URI;
    if (connectionString) {
      console.log('Using DATABASE_URI environment variable for connection');
    }
  }

  // Still no connection string? Try a default for local development
  if (!connectionString) {
    console.log(
      'No database connection string found in environment variables, using default local connection',
    );
    connectionString =
      'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
  }

  // Connect to database
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the SQL file - path is relative to this file's new location
    const sqlPath = path.join(__dirname, 'direct-quiz-fix.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands at semicolons but ignore semicolons inside quotes or comments
    const commands = sqlContent.split(
      /;\s*(?=(?:[^'"]*(?:['"][^'"]*['"])*[^'"]*$))/g,
    );

    // Start transaction
    console.log('Starting transaction...');
    await client.query('BEGIN');

    // Execute each SQL command
    let resultsToReport = [];
    let commandCount = 0;

    for (const command of commands) {
      const trimmedCommand = command.trim();
      if (!trimmedCommand || trimmedCommand.startsWith('--')) {
        continue; // Skip empty lines and comments
      }

      commandCount++;

      try {
        // Execute the SQL command
        const result = await client.query(trimmedCommand);

        // For SELECT queries, store results for reporting
        if (trimmedCommand.toLowerCase().startsWith('select')) {
          resultsToReport.push({
            query: trimmedCommand,
            result: result.rows,
          });
        } else {
          // For non-SELECT queries, log row count
          console.log(
            `Command ${commandCount}: ${result.command} - ${result.rowCount} rows affected`,
          );
        }
      } catch (error) {
        console.error(`Error executing command ${commandCount}:`, error);
        console.error('Command was:', trimmedCommand);
        throw error; // Re-throw to trigger transaction rollback
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    // Report SELECT results (verification queries)
    if (resultsToReport.length > 0) {
      console.log('\n=== Verification Results ===');
      resultsToReport.forEach((item, index) => {
        console.log(`\nVerification ${index + 1}:`);
        console.log(item.result);
      });
    }

    console.log('\nDirect SQL fix completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    try {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    console.error('Failed to run direct SQL fix:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in direct SQL fix:', error);
  process.exit(1);
});
