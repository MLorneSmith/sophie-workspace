/**
 * Enhanced script to clear the content field in course_lessons table
 * This addresses the issue where raw template tags are being displayed
 * Includes transaction support and verification
 */
import { executeSQL } from '../../utils/db/execute-sql.js';

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

// Execute the function if this script is run directly
if (
  process.argv[1]?.endsWith('clear-lesson-content.ts') ||
  process.argv[1]?.endsWith('clear-lesson-content.js')
) {
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
