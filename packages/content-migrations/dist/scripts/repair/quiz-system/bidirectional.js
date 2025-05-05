import { getLogger } from '../../../utils/logging.js';
const logger = getLogger('QuizSystemBidirectional');
/**
 * Fixes bidirectional relationships (question → quiz)
 * Creates entries in quiz_questions_rels based on existing course_quizzes_rels entries
 *
 * @param db Database connection or transaction
 * @param state Current state of quiz relationships
 * @returns Result of the repair operation
 */
export async function fixBidirectionalRelationships(db, state) {
    logger.info('Fixing bidirectional relationships (question → quiz)...');
    try {
        // Insert question-to-quiz relationships where they don't exist
        logger.info('Creating missing bidirectional relationships...');
        // First check if there are any relationships to create
        const checkResult = await db.execute(`
      SELECT COUNT(*) as count
      FROM
          payload.course_quizzes_rels cqr
      WHERE
          cqr.path = 'questions'
          AND cqr.quiz_questions_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM payload.quiz_questions_rels qqr
              WHERE qqr._parent_id = cqr.quiz_questions_id
              AND qqr.field = 'quiz_id'
              AND qqr.value = cqr._parent_id
          )
    `);
        logger.info(`Found ${checkResult[0]?.count || 0} relationships to create`);
        // Then create the relationships
        const result = await db.execute(`
      INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)
      SELECT
          gen_random_uuid() as id,
          cqr.quiz_questions_id as _parent_id,
          'quiz_id' as field,
          cqr._parent_id as value,
          NOW() as created_at,
          NOW() as updated_at
      FROM
          payload.course_quizzes_rels cqr
      WHERE
          cqr.path = 'questions'
          AND cqr.quiz_questions_id IS NOT NULL
          -- Only create relationships that don't already exist
          AND NOT EXISTS (
              SELECT 1 FROM payload.quiz_questions_rels qqr
              WHERE qqr._parent_id = cqr.quiz_questions_id
              AND qqr.field = 'quiz_id'
              AND qqr.value = cqr._parent_id
          )
      RETURNING *;
    `);
        // Log the return structure for debugging
        logger.info(`SQL query completed. Result format: ${typeof result}`);
        // Use type assertion to resolve TypeScript errors
        const dbResult = result;
        logger.info(`Result has rows property: ${dbResult && 'rows' in dbResult}`);
        logger.info(`Result has rowCount property: ${dbResult && 'rowCount' in dbResult}`);
        // Handle both array and object return types from different database adapters
        const newRelationships = Array.isArray(dbResult)
            ? dbResult
            : dbResult?.rows || [];
        const relationshipsCreated = Array.isArray(dbResult)
            ? dbResult.length
            : dbResult?.rowCount || dbResult?.rows?.length || 0;
        logger.info(`Created ${relationshipsCreated} bidirectional relationships`);
        if (relationshipsCreated > 0) {
            // Log some examples of created relationships
            const exampleCount = Math.min(relationshipsCreated, 3);
            logger.info(`Examples of created relationships:`);
            for (let i = 0; i < exampleCount; i++) {
                const rel = newRelationships[i];
                logger.info(`  - Question ${rel._parent_id} → Quiz ${rel.value}`);
            }
        }
        return {
            relationshipsCreated,
            newRelationships,
        };
    }
    catch (error) {
        logger.error('Error fixing bidirectional relationships', error);
        throw new Error(`Failed to fix bidirectional relationships: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Verifies bidirectional relationships between quizzes and questions
 *
 * @param db Database connection or transaction
 * @returns Whether all bidirectional relationships are valid
 */
export async function verifyBidirectionalRelationships(db) {
    logger.info('Verifying bidirectional relationships...');
    try {
        // Check if there are any primary relationships first
        const hasRelationships = await db.execute(`
      SELECT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes_rels 
        WHERE path = 'questions' AND quiz_questions_id IS NOT NULL
      ) as has_rels;
    `);
        const hasRels = hasRelationships[0]?.has_rels === true;
        if (!hasRels) {
            logger.info('No primary quiz-question relationships exist yet. Bidirectional relationship check skipped.');
            return true;
        }
        // Simplify the verification query
        const missingBidirectionalResult = await db.execute(`
      -- Find primary relationships missing bidirectional links
      SELECT 
        q.title as quiz_title,
        cqr._parent_id as quiz_id, 
        cqr.quiz_questions_id as question_id,
        (SELECT question FROM payload.quiz_questions WHERE id = cqr.quiz_questions_id) as question_text
      FROM 
        payload.course_quizzes_rels cqr
      JOIN
        payload.course_quizzes q ON q.id = cqr._parent_id
      LEFT JOIN 
        payload.quiz_questions_rels qqr ON 
        qqr._parent_id = cqr.quiz_questions_id AND 
        qqr.value = cqr._parent_id AND
        qqr.field = 'quiz_id'
      WHERE 
        cqr.path = 'questions' AND
        cqr.quiz_questions_id IS NOT NULL AND
        qqr.id IS NULL
      LIMIT 5;
    `);
        // Handle the result array format
        const rows = Array.isArray(missingBidirectionalResult)
            ? missingBidirectionalResult
            : missingBidirectionalResult?.rows || [];
        const missingCount = rows.length;
        if (missingCount > 0) {
            logger.warning(`Found ${missingCount} missing bidirectional relationships`);
            rows.forEach((row) => {
                logger.warning(`  - Question ${row.question_id} (${row.question_text?.substring(0, 30)}...) is missing relationship to Quiz "${row.quiz_title}" (${row.quiz_id})`);
            });
            return false;
        }
        logger.info('All bidirectional relationships are valid');
        return true;
    }
    catch (error) {
        logger.error('Error verifying bidirectional relationships', error);
        return false;
    }
}
