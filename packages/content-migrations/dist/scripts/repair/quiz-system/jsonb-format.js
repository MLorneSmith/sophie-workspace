import { getLogger } from '../../../utils/logging.js';
const logger = getLogger('QuizSystemJsonbFormat');
/**
 * Fixes JSONB format in quiz records
 * Ensures JSONB arrays match relationship tables
 *
 * @param db Database connection or transaction
 * @param state Current state of quiz relationships
 * @returns Result of the repair operation
 */
export async function fixJsonbFormat(db, state) {
    logger.info('Fixing JSONB format in quiz records...');
    try {
        // Update quiz JSONB format to match relationships
        logger.info('Updating quiz JSONB format...');
        // First check if there are any quizzes to update
        const checkResult = await db.execute(`
      SELECT COUNT(*) as count
      FROM payload.course_quizzes q
      WHERE EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels cqr
          WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
      )
    `);
        logger.info(`Found ${checkResult[0]?.count || 0} quizzes that may need JSONB format update`);
        // Then update the quizzes
        const result = await db.execute(`
      WITH updated_quizzes AS (
        UPDATE payload.course_quizzes q
        SET questions = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', qq.id,
                    'question', qq.question,
                    'options', qq.options,
                    'correct_answer', qq.correct_answer,
                    'type', qq.type,
                    'explanation', qq.explanation
                )
            )
            FROM payload.course_quizzes_rels cqr
            JOIN payload.quiz_questions qq ON qq.id = cqr.quiz_questions_id
            WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
        )
        WHERE EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels cqr
            WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
        )
        RETURNING id, title, slug
      )
      SELECT * FROM updated_quizzes;
    `);
        // Log the return structure for debugging
        logger.info(`SQL query completed. Result format: ${typeof result}`);
        // Use type assertion to resolve TypeScript errors
        const dbResult = result;
        logger.info(`Result has rows property: ${dbResult && 'rows' in dbResult}`);
        logger.info(`Result has rowCount property: ${dbResult && 'rowCount' in dbResult}`);
        // Handle both array and object return types from different database adapters
        const updatedQuizzes = Array.isArray(dbResult)
            ? dbResult
            : dbResult?.rows || [];
        const quizzesUpdated = Array.isArray(dbResult)
            ? dbResult.length
            : dbResult?.rowCount || dbResult?.rows?.length || 0;
        logger.info(`Updated JSONB format in ${quizzesUpdated} quizzes`);
        if (quizzesUpdated > 0) {
            // Log some examples of updated quizzes
            const exampleCount = Math.min(quizzesUpdated, 3);
            logger.info(`Examples of updated quizzes:`);
            for (let i = 0; i < exampleCount; i++) {
                const quiz = updatedQuizzes[i];
                logger.info(`  - Quiz "${quiz.title}" (${quiz.id})`);
            }
        }
        return {
            quizzesUpdated,
            updatedQuizzes,
        };
    }
    catch (error) {
        logger.error('Error fixing JSONB format', error);
        throw new Error(`Failed to fix JSONB format: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Verifies JSONB format in quiz records
 * Checks if JSONB arrays match relationship tables
 *
 * @param db Database connection or transaction
 * @returns Whether all JSONB formats are valid
 */
export async function verifyJsonbFormat(db) {
    logger.info('Verifying JSONB format...');
    try {
        // Check if there are any quizzes with relationships first
        const hasRelationships = await db.execute(`
      SELECT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes_rels 
        WHERE path = 'questions'
      ) as has_rels;
    `);
        const hasRels = hasRelationships[0]?.has_rels === true;
        if (!hasRels) {
            logger.info('No quiz-question relationships exist yet. JSONB format check skipped.');
            return true;
        }
        // Simplify the verification query to avoid complex set-returning functions
        const missingJsonbResult = await db.execute(`
      -- Get quizzes with relationships
      WITH quiz_rel_counts AS (
        SELECT 
          q.id as quiz_id,
          q.title as quiz_title,
          COUNT(cqr.quiz_questions_id) as rel_count
        FROM 
          payload.course_quizzes q
        JOIN 
          payload.course_quizzes_rels cqr ON cqr._parent_id = q.id AND cqr.path = 'questions'
        GROUP BY 
          q.id, q.title
      ),
      -- Get quizzes with jsonb arrays
      quiz_jsonb_counts AS (
        SELECT 
          q.id as quiz_id,
          COALESCE(jsonb_array_length(q.questions), 0) as json_count
        FROM 
          payload.course_quizzes q
      )
      -- Find mismatches
      SELECT 
        rc.quiz_id,
        rc.quiz_title,
        rc.rel_count,
        COALESCE(jc.json_count, 0) as json_count
      FROM 
        quiz_rel_counts rc
      LEFT JOIN 
        quiz_jsonb_counts jc ON jc.quiz_id = rc.quiz_id
      WHERE 
        rc.rel_count != COALESCE(jc.json_count, 0)
      LIMIT 5;
    `);
        // Handle the result array format
        const rows = Array.isArray(missingJsonbResult)
            ? missingJsonbResult
            : missingJsonbResult?.rows || [];
        const mismatchCount = rows.length;
        if (mismatchCount > 0) {
            logger.warning(`Found ${mismatchCount} quizzes with JSONB format issues`);
            rows.forEach((row) => {
                logger.warning(`  - Quiz "${row.quiz_title}" (${row.quiz_id}) has ${row.rel_count} relationships but ${row.json_count} questions in JSONB`);
            });
            return false;
        }
        logger.info('All quizzes have valid JSONB format');
        return true;
    }
    catch (error) {
        logger.error('Error verifying JSONB format', error);
        return false;
    }
}
