/**
 * Enhanced script to clear the content field in course_lessons table
 * This addresses the issue where raw template tags are being displayed
 * Includes transaction support and verification
 */
import pg from 'pg';

// Inline the module utility to avoid ESM import issues
function isDirectExecution(): boolean {
  const currentUrl = import.meta.url;
  const executedUrl = process.argv[1];

  if (!executedUrl) {
    return false;
  }

  // Handle both Windows and Unix paths
  const normalizedCurrentUrl = currentUrl.replace(/\\/g, '/');
  const normalizedExecutedUrl = executedUrl.replace(/\\/g, '/');

  // Check if this file is the entry point
  return normalizedCurrentUrl.endsWith(normalizedExecutedUrl);
}

// Inline the database utility to avoid ESM import issues
async function executeSQL(
  query: string,
  params: any[] = [],
): Promise<pg.QueryResult> {
  const { Pool } = pg;

  // Create a pool for this execution
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload',
  });

  const client = await pool.connect();
  try {
    return await client.query(query, params);
  } catch (error) {
    console.error(`SQL Error executing query: ${query.substring(0, 100)}...`);
    console.error(`Error details: ${error}`);
    throw error;
  } finally {
    client.release();
    // Close pool when done
    await pool.end();
  }
}

export async function clearLessonContent() {
  try {
    console.log('Starting to clear content field from course_lessons table...');

    // Check current state
    const beforeQuery = `SELECT COUNT(*) as count FROM payload.course_lessons WHERE content IS NOT NULL`;
    const beforeResult = await executeSQL(beforeQuery);
    const beforeCount = beforeResult.rows[0]?.count || 0;

    console.log(
      `Found ${beforeCount} lessons with non-NULL content before clearing`,
    );

    if (beforeCount > 0) {
      // Show sample of content for debugging
      const sampleQuery = `
        SELECT id, slug, LEFT(content, 100) as content_preview 
        FROM payload.course_lessons 
        WHERE content IS NOT NULL 
        LIMIT 3`;
      const sampleResult = await executeSQL(sampleQuery);

      console.log('Sample content before clearing:');
      sampleResult.rows.forEach((row) => {
        console.log(
          `Lesson ${row.slug} (${row.id}): ${row.content_preview}...`,
        );
      });
    }

    // Execute SQL update with transaction
    console.log('Executing content field clearing with transaction...');
    const result = await executeSQL(
      `BEGIN;
       UPDATE payload.course_lessons 
       SET content = NULL 
       WHERE content IS NOT NULL;
       COMMIT;`,
    );

    // Verify after clearing
    const afterQuery = `SELECT COUNT(*) as count FROM payload.course_lessons WHERE content IS NOT NULL`;
    const afterResult = await executeSQL(afterQuery);
    const afterCount = afterResult.rows[0]?.count || 0;

    console.log(
      `Found ${afterCount} lessons with non-NULL content after clearing`,
    );

    const success = afterCount === 0 || afterCount < beforeCount;

    if (success) {
      console.log(
        'Successfully cleared content field from course_lessons table',
      );
      console.log(`Affected rows: ${beforeCount - afterCount}`);
    } else {
      console.error('Failed to clear content field from course_lessons table');
      console.error(`Before: ${beforeCount}, After: ${afterCount}`);
    }

    return {
      success,
      message: success
        ? `Content field cleared for ${beforeCount - afterCount} lessons`
        : 'Failed to clear content field',
      beforeCount,
      afterCount,
    };
  } catch (error) {
    console.error('Error clearing content field:', error);
    return {
      success: false,
      message: `Failed to clear content field: ${error.message || String(error)}`,
      error,
    };
  }
}

// Execute the function if this script is run directly using the ESM-compatible method
if (isDirectExecution()) {
  clearLessonContent()
    .then((result) => {
      console.log('Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
