/**
 * Explicitly sets the 'path' column to 'questions' for quiz-question relationships
 * in the course_quizzes_rels table.
 */
import { getClient } from '../../../utils/db/client.js';
// Corrected import name and path
import { getLogger } from '../../../utils/logging.js';
const logger = getLogger('FixQuizRelsPath');
async function fixQuizRelsPath() {
    logger.info("Starting explicit fix for 'path' column in course_quizzes_rels...");
    let db;
    try {
        // Use the correct function name 'getClient' here, with no arguments
        db = await getClient();
        logger.info('Database connection established.');
        await db.transaction(async (tx) => {
            logger.info('Executing UPDATE command within transaction...');
            const result = await tx.execute(`
        UPDATE payload.course_quizzes_rels
        SET path = 'questions'
        WHERE quiz_questions_id IS NOT NULL AND (path IS NULL OR path != 'questions');
      `);
            // Drizzle/postgres.js might return different result structures
            const affectedRows = result.rowCount ?? result[0]?.rowCount ?? 0;
            logger.info(`UPDATE command executed. Affected rows: ${affectedRows}`);
            if (affectedRows > 0) {
                logger.info(`Successfully set path='questions' for ${affectedRows} rows.`);
            }
            else {
                logger.info('No rows needed updating or no relevant rows found.');
            }
        });
        logger.info('Transaction committed successfully.');
        logger.info("'path' column fix completed successfully.");
    }
    catch (error) {
        logger.error("Error fixing 'path' column in course_quizzes_rels:", error);
        throw new Error(`Failed to fix path column: ${error.message}`);
    }
    finally {
        // Ensure connection is closed
        if (db && typeof db.end === 'function') {
            await db.end();
            logger.info('Database connection closed.');
        }
        else if (db && db.session && typeof db.session.end === 'function') {
            // Handle potential differences in connection objects
            await db.session.end();
            logger.info('Database session ended.');
        }
    }
}
// Run the main function
fixQuizRelsPath()
    .then(() => {
    logger.info('Script finished successfully.');
    process.exit(0);
})
    .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
});
