/**
 * Unified Quiz System Repair
 *
 * This script provides a centralized entry point for fixing quiz-related issues.
 * It orchestrates the execution of various repair scripts in the correct order
 * to ensure a comprehensive fix for the entire quiz system.
 */
import { promises as fs } from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import { fixLessonQuizRelationshipsComprehensive } from '../lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.js';
// Import commented out due to missing file - to be implemented later
// import { fixQuestionQuizRelationshipsComprehensive } from '../question-relationships/fix-question-quiz-relationships-comprehensive.js';
import { verifyQuizSystemIntegrity } from '../utilities/verify-quiz-system-integrity-comprehensive.js';

const { Client } = pg;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connectionString =
  process.env.DATABASE_URI ||
  'postgresql://postgres:postgres@localhost:54322/postgres';

// CLI arguments
const args = process.argv.slice(2);
const verifyOnly = args.includes('--verify-only');
const runTests = args.includes('--run-tests');
const verbose = args.includes('--verbose');

/**
 * Main entry point for quiz system repair
 */
export async function repairQuizSystem(): Promise<void> {
  console.log('Starting unified quiz system repair...');

  // Create timestamp for logging
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  const logDir = path.join(__dirname, '..', '..', '..', '..', '..', 'logs');

  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.warn('Failed to create log directory:', error);
  }

  const logPath = path.join(logDir, `quiz-repair-${timestamp}.log`);

  // Log output to file and console
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Create a logging wrapper
  const log = async (type: string, ...args: any[]) => {
    const message = args
      .map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(' ');

    const logEntry = `[${new Date().toISOString()}] [${type}] ${message}\n`;

    try {
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      originalConsoleError('Failed to write to log file:', error);
    }

    if (type === 'ERROR') {
      originalConsoleError(...args);
    } else if (type === 'WARN') {
      originalConsoleWarn(...args);
    } else {
      originalConsoleLog(...args);
    }
  };

  // Override console methods to log to file
  console.log = (...args) => {
    log('INFO', ...args);
  };
  console.error = (...args) => {
    log('ERROR', ...args);
  };
  console.warn = (...args) => {
    log('WARN', ...args);
  };

  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Run verification first to get baseline status
    console.log('Running initial verification to assess current state...');
    await verifyQuizSystemIntegrity();

    if (verifyOnly) {
      console.log(
        'Verification-only mode selected. Skipping repair operations.',
      );
      return;
    }

    // Begin a transaction
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    try {
      // 1. Fix course-quiz relationships
      await runDirectFix(client);

      // 2. Fix lesson-quiz relationships
      await fixLessonQuizRelationshipsComprehensive();

      // 3. Fix question-quiz relationships
      // Commented out due to missing implementation
      // await fixQuestionQuizRelationshipsComprehensive();
      console.log(
        'Skipping question-quiz relationships fix (not implemented yet)',
      );

      if (runTests) {
        // Run additional tests if requested
        await runExtendedTests(client);
      }

      // Commit the transaction
      await client.query('COMMIT');
      console.log('Transaction committed successfully');

      // Run final verification to confirm fixes
      console.log('\nRunning final verification to confirm fixes...');
      await verifyQuizSystemIntegrity();
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error during repair, transaction rolled back:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error repairing quiz system:', error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
    console.log('Database connection closed');

    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    console.log(`Repair process completed. Log saved to: ${logPath}`);
  }
}

/**
 * Run the direct SQL fixes for core quiz-course relationships
 */
async function runDirectFix(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Running direct quiz fixes...');

  // Load SQL content
  const sqlPath = path.join(__dirname, 'direct-quiz-fix.sql');
  const sql = await fs.readFile(sqlPath, 'utf-8');

  // Execute the SQL directly
  await client.query(sql);

  console.log('Direct quiz fixes applied successfully');
}

/**
 * Run extended tests for additional verification
 */
async function runExtendedTests(
  client: InstanceType<typeof Client>,
): Promise<void> {
  console.log('Running extended tests...');

  // Test 1: Check for quiz IDs consistency across all tables
  const idConsistencyResult = await client.query(`
    SELECT COUNT(*) 
    FROM payload.course_quizzes cq 
    WHERE EXISTS (
      SELECT 1 
      FROM payload.quiz_questions qq 
      WHERE qq.quiz_id_id = cq.id 
      AND qq.quiz_id != qq.quiz_id_id
    )
  `);

  const inconsistentQuizzes = parseInt(idConsistencyResult.rows[0].count);
  if (inconsistentQuizzes > 0) {
    console.warn(
      `Found ${inconsistentQuizzes} quizzes with inconsistent ID references in questions`,
    );
  } else {
    console.log('Quiz ID consistency check passed');
  }

  // Test 2: Verify all quizzes referenced by lessons have questions
  const emptyQuizzesResult = await client.query(`
    SELECT COUNT(*) 
    FROM payload.course_quizzes cq
    WHERE EXISTS (
      SELECT 1 
      FROM payload.course_lessons cl 
      WHERE cl.quiz_id_id = cq.id
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM payload.quiz_questions qq 
      WHERE qq.quiz_id_id = cq.id
    )
  `);

  const emptyQuizzes = parseInt(emptyQuizzesResult.rows[0].count);
  if (emptyQuizzes > 0) {
    console.warn(
      `Found ${emptyQuizzes} quizzes referenced by lessons but having no questions`,
    );
  } else {
    console.log('Empty quiz check passed');
  }

  console.log('Extended tests completed');
}

// Run if executed directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  repairQuizSystem()
    .then(() => console.log('Quiz system repair completed successfully'))
    .catch((error) => {
      console.error('Quiz system repair failed:', error);
      process.exit(1);
    });
}
