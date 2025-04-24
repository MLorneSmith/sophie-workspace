/**
 * Payload CMS Relationship Architecture Fix
 *
 * This script implements a more robust approach to fixing relationships in Payload CMS
 * by addressing the dual-storage nature of relationships:
 * 1. Updates the main table fields (e.g., course_id_id)
 * 2. Creates corresponding entries in relationship tables
 * 3. Uses proper UUID typing and transaction isolation
 * 4. Adds detailed error handling and logging
 */
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Load SQL script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-payload-relationships-strict.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Max retry count for transient errors
const MAX_RETRIES = 3;

/**
 * Execute SQL with retry logic and error handling
 */
async function executeWithRetry(
  client: InstanceType<typeof Client>,
  sql: string,
  retryCount = 0,
): Promise<any> {
  try {
    return await client.query(sql);
  } catch (error) {
    // If the error is transient and we haven't exceeded retries
    if (
      retryCount < MAX_RETRIES &&
      error instanceof Error &&
      (error.message.includes('deadlock') ||
        error.message.includes('could not serialize') ||
        error.message.includes('concurrent update'))
    ) {
      console.log(
        `Transient error occurred, retrying (${retryCount + 1}/${MAX_RETRIES})...`,
      );
      // Exponential backoff with jitter
      const delay = Math.floor(
        100 * Math.pow(2, retryCount) * (0.5 + Math.random()),
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeWithRetry(client, sql, retryCount + 1);
    }

    // Non-transient error or max retries exceeded
    throw error;
  }
}

export async function fixPayloadRelationshipsStrict(): Promise<void> {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  console.log('Starting Payload relationship fix with strict UUID typing...');

  try {
    await client.connect();
    console.log('Connected to database');

    // Split the SQL script to handle notices separately
    const commands = sql.split(';').filter((cmd) => cmd.trim());

    // Group into transaction commands and verification queries
    const txnCommands = commands.slice(0, -4);
    const verificationQueries = commands.slice(-4);

    console.log(
      `Running ${txnCommands.length} transaction commands and ${verificationQueries.length} verification queries`,
    );

    // Execute each SQL command and log the result
    let commandNumber = 1;
    for (const command of txnCommands) {
      try {
        console.log(
          `Executing command ${commandNumber}/${txnCommands.length}...`,
        );
        const result = await executeWithRetry(client, command);
        if (result.rows && result.rows.length) {
          console.log(`Command ${commandNumber} result:`, result.rows);
        }
        console.log(`Command ${commandNumber} executed successfully`);
      } catch (error) {
        console.error(`Error executing command ${commandNumber}:`, error);
        throw error;
      }
      commandNumber++;
    }

    // Execute verification queries
    console.log('\nRunning verification queries...');

    try {
      const results = await Promise.all(
        verificationQueries.map((query) =>
          query.trim() ? executeWithRetry(client, query) : null,
        ),
      );

      // Print verification results
      console.log('\nVerification Results:');
      results.forEach((result, index) => {
        if (result && result.rows && result.rows.length) {
          console.log(`Query ${index + 1} result:`, result.rows[0]);
        }
      });

      // Check for inconsistencies
      const inconsistentCount = results[3]?.rows[0]?.inconsistent_quizzes || 0;
      if (inconsistentCount > 0) {
        console.warn(
          `WARNING: Found ${inconsistentCount} quizzes with inconsistent relationships`,
        );
      } else {
        console.log(
          '✅ All relationships are consistent between main table and relationship table',
        );
      }
    } catch (error) {
      console.error('Error during verification:', error);
      // Don't throw here, as the main transaction has already been committed
    }

    console.log('Payload relationship fix completed successfully');
  } catch (error) {
    console.error('Error fixing Payload relationships:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
// ESM equivalent of require.main === module
if (import.meta.url.endsWith(process.argv[1])) {
  fixPayloadRelationshipsStrict()
    .then(() => console.log('✅ Payload relationships fixed successfully'))
    .catch((error) => {
      console.error('❌ Failed to fix Payload relationships:', error);
      process.exit(1);
    });
}
