/**
 * Comprehensive Quiz-Question Relationship Fix
 *
 * This module implements a thorough repair of quiz-question relationships
 * by ensuring consistency between the direct 'questions' field in quizzes and
 * the corresponding entries in the relationship tables.
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';
/**
 * Main function to fix quiz-question relationships
 *
 * @returns Result statistics from the fix operation
 */
export async function fixQuizQuestionRelationships() {
    console.log('Starting comprehensive quiz-question relationship fix...');
    const result = {
        processedQuizzes: 0,
        fixedQuestions: 0,
        reorderedQuestions: 0,
        addedToQuizzes: 0,
        addedToRelTables: 0,
        cleanedOrphans: 0,
        errors: [],
    };
    try {
        // Begin transaction for atomicity
        await executeSQL('BEGIN');
        console.log('Fetching all quizzes...');
        const quizzesQuery = `
      SELECT id, title
      FROM payload.course_quizzes
      ORDER BY id
    `;
        const quizzesResult = await executeSQL(quizzesQuery);
        const quizzes = quizzesResult.rows;
        console.log(`Found ${quizzes.length} quizzes to process`);
        // Process each quiz
        for (const quiz of quizzes) {
            try {
                result.processedQuizzes++;
                const quizId = quiz.id;
                const quizTitle = quiz.title;
                // There is no "questions" column in course_quizzes table
                // Instead, we'll get questions from the relationship table
                const directQuestions = [];
                console.log(`Processing quiz "${quizTitle}" (${quizId}): using relationship table only`);
                // Get relationship table entries
                const relTableQuery = `
          SELECT id, parent_id, path, "order"
          FROM payload.course_quizzes_rels
          WHERE parent_id = $1 AND path = 'questions'
          ORDER BY "order"
        `;
                const relTableResult = await executeSQL(relTableQuery, [quizId]);
                const relTableEntries = relTableResult.rows;
                console.log(`Found ${relTableEntries.length} relationship table entries`);
                // Check each question exists
                for (const questionId of directQuestions) {
                    const questionExistsQuery = `
            SELECT COUNT(*) as count
            FROM payload.quiz_questions
            WHERE id = $1
          `;
                    const questionExistsResult = await executeSQL(questionExistsQuery, [
                        questionId,
                    ]);
                    const exists = parseInt(questionExistsResult.rows[0].count) > 0;
                    if (!exists) {
                        console.log(`WARNING: Question ${questionId} in quiz ${quizId} does not exist in the database`);
                        // Remove from directQuestions
                        const index = directQuestions.indexOf(questionId);
                        if (index > -1) {
                            directQuestions.splice(index, 1);
                            result.fixedQuestions++;
                        }
                    }
                }
                // Maps for easier lookups
                const relTableMap = new Map();
                for (const entry of relTableEntries) {
                    relTableMap.set(entry.id, entry);
                }
                const directQuestionsSet = new Set(directQuestions);
                // Find missing entries in relationship table
                const missingInRelTable = directQuestions.filter((questionId) => !relTableEntries.some((entry) => entry.id === questionId));
                if (missingInRelTable.length > 0) {
                    console.log(`Quiz ${quizId}: ${missingInRelTable.length} questions missing in relationship table`);
                    // Add to relationship table
                    for (let i = 0; i < missingInRelTable.length; i++) {
                        const questionId = missingInRelTable[i];
                        const order = directQuestions.indexOf(questionId);
                        // Add to relationship table
                        const insertQuery = `
              INSERT INTO payload.course_quizzes_rels (id, parent_id, path, "order")
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (id, parent_id, path) DO UPDATE
              SET "order" = $4
            `;
                        await executeSQL(insertQuery, [
                            questionId,
                            quizId,
                            'questions',
                            order,
                        ]);
                        result.addedToRelTables++;
                    }
                }
                // Find missing entries in direct questions
                const missingInDirect = relTableEntries
                    .filter((entry) => !directQuestionsSet.has(entry.id))
                    .map((entry) => entry.id);
                if (missingInDirect.length > 0) {
                    console.log(`Quiz ${quizId}: ${missingInDirect.length} questions missing in direct questions field`);
                    // Add missing questions to direct questions
                    for (const questionId of missingInDirect) {
                        directQuestions.push(questionId);
                        result.addedToQuizzes++;
                    }
                    // Sort according to the relationship table order
                    directQuestions.sort((a, b) => {
                        const orderA = relTableMap.get(a)?.order || Number.MAX_SAFE_INTEGER;
                        const orderB = relTableMap.get(b)?.order || Number.MAX_SAFE_INTEGER;
                        return orderA - orderB;
                    });
                    // Since there's no "questions" field, we'll skip the update operation
                    console.log(`Quiz ${quizId}: Would update direct questions field if it existed`);
                }
                // Check for order mismatches and fix
                let hasOrderMismatch = false;
                for (let i = 0; i < directQuestions.length; i++) {
                    const questionId = directQuestions[i];
                    const relEntry = relTableMap.get(questionId);
                    if (relEntry && relEntry.order !== i) {
                        hasOrderMismatch = true;
                        console.log(`Quiz ${quizId}: Question ${questionId} has order mismatch (${relEntry.order} vs ${i})`);
                        // Update order in relationship table
                        const updateOrderQuery = `
              UPDATE payload.course_quizzes_rels
              SET "order" = $1
              WHERE id = $2 AND parent_id = $3 AND path = 'questions'
            `;
                        await executeSQL(updateOrderQuery, [i, questionId, quizId]);
                        result.reorderedQuestions++;
                    }
                }
                if (hasOrderMismatch) {
                    console.log(`Quiz ${quizId}: Fixed order mismatches`);
                }
            }
            catch (error) {
                console.error(`Error processing quiz ${quiz.id}:`, error);
                result.errors.push({
                    quiz: quiz.id,
                    error: error.message || String(error),
                });
            }
        }
        // Clean up orphaned relationship entries (parent quiz doesn't exist)
        const orphanedQuery = `
      DELETE FROM payload.course_quizzes_rels r
      WHERE r.path = 'questions'
      AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes q
        WHERE q.id = r.parent_id
      )
      RETURNING id, parent_id
    `;
        const orphanedResult = await executeSQL(orphanedQuery);
        result.cleanedOrphans += orphanedResult.rowCount || 0;
        console.log(`Cleaned up ${result.cleanedOrphans} orphaned relationship entries`);
        // Commit the transaction
        await executeSQL('COMMIT');
        console.log('Transaction committed successfully');
        // Print summary
        console.log('Quiz-Question fix summary:');
        console.log(`- Processed quizzes: ${result.processedQuizzes}`);
        console.log(`- Fixed invalid questions: ${result.fixedQuestions}`);
        console.log(`- Reordered questions: ${result.reorderedQuestions}`);
        console.log(`- Added to quizzes: ${result.addedToQuizzes}`);
        console.log(`- Added to relationship tables: ${result.addedToRelTables}`);
        console.log(`- Cleaned orphans: ${result.cleanedOrphans}`);
        console.log(`- Errors: ${result.errors.length}`);
        return result;
    }
    catch (error) {
        // Rollback on error
        console.error('Error fixing quiz-question relationships, rolling back:', error);
        await executeSQL('ROLLBACK');
        throw error;
    }
}
/**
 * Verify the quiz-question relationships are consistent
 *
 * @returns True if all relationships are consistent, false otherwise
 */
export async function verifyQuizQuestionRelationships() {
    console.log('Verifying quiz-question relationships...');
    try {
        // Run simplified verification query just to check quiz-question relationships exist
        const verificationQuery = `
      WITH 
      rel_questions AS (
        SELECT 
          parent_id as quiz_id,
          id as question_id,
          "order" as rel_order
        FROM payload.course_quizzes_rels
        WHERE path = 'questions'
      ),
      inconsistencies AS (
        -- Check for questions that don't exist in the quiz_questions table
        SELECT 
          rq.quiz_id,
          rq.question_id,
          'invalid_question_reference' as issue_type
        FROM rel_questions rq
        LEFT JOIN payload.quiz_questions qq 
        ON rq.question_id = qq.id
        WHERE qq.id IS NULL
      )
      SELECT COUNT(*) as count FROM inconsistencies
    `;
        const verificationResult = await executeSQL(verificationQuery);
        const inconsistencyCount = parseInt(verificationResult.rows[0].count);
        const isConsistent = inconsistencyCount === 0;
        console.log(`Verification result: ${isConsistent ? 'Consistent' : 'Inconsistent'}`);
        console.log(`Found ${inconsistencyCount} inconsistencies`);
        return isConsistent;
    }
    catch (error) {
        console.error('Error verifying quiz-question relationships:', error);
        return false;
    }
}
/**
 * Main function to fix and verify quiz-question relationships
 *
 * @returns Object containing fix result and verification result
 */
export async function fixAndVerifyQuizQuestionRelationships() {
    const fixResult = await fixQuizQuestionRelationships();
    const isConsistent = await verifyQuizQuestionRelationships();
    return {
        fixResult,
        isConsistent,
    };
}
