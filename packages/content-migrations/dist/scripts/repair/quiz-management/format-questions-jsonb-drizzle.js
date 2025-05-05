/**
 * Format Questions JSONB Script - Enhanced Drizzle Version
 *
 * This script formats the questions JSONB arrays in course_quizzes to ensure
 * they match the structure expected by Payload CMS for proper UI display.
 *
 * This version uses Drizzle ORM via the Payload client for consistent type handling
 * with the verification script.
 */
import { sql } from 'drizzle-orm';
import { getPayloadClient } from '../../../utils/payload.js';
// Log utilities
function logAction(message) {
    console.log(`🔄 ${message}`);
}
function logSuccess(message) {
    console.log(`✅ ${message}`);
}
function logError(message) {
    console.error(`❌ ${message}`);
}
export const formatQuestionsJSONBDrizzle = async () => {
    try {
        // Get Payload client for proper database access with type safety
        const payload = await getPayloadClient();
        const db = payload.db.drizzle;
        logAction('Starting enhanced JSONB format fix with Drizzle ORM');
        // Begin transaction
        await db.execute(sql.raw `BEGIN;`);
        // 1. First get all quizzes with explicit type casting for safety
        const allQuizzesResult = await db.execute(sql.raw `
      SELECT
        id::text as quiz_id,
        title as quiz_title,
        questions::jsonb as questions
      FROM
        payload.course_quizzes
      WHERE
        questions IS NOT NULL
    `);
        // 2. Get all quizzes and their related questions from relationship tables with proper casting
        const quizQuestionsResult = await db.execute(sql.raw `
      SELECT
        q.id::text as quiz_id,
        q.title as quiz_title,
        rel.quiz_questions_id::text as question_id,
        rel._parent_id::text as parent_id,
        rel.order::int as sort_order
      FROM
        payload.course_quizzes q
      JOIN
        payload.course_quizzes_rels rel
      ON
        q.id = rel._parent_id
      WHERE
        rel.field = 'questions'
        AND rel.quiz_questions_id IS NOT NULL
      ORDER BY
        q.id, COALESCE(rel.order, 0)
    `);
        // 3. Group questions by quiz combining both sources
        const quizMap = new Map();
        // First, initialize map with all quizzes and their direct array questions
        for (const quiz of allQuizzesResult.rows) {
            quizMap.set(quiz.quiz_id, {
                id: quiz.quiz_id,
                title: quiz.quiz_title,
                questions: [],
                directQuestions: quiz.questions || [], // Store original questions array
            });
        }
        // Second, add questions from relationship tables
        for (const row of quizQuestionsResult.rows) {
            if (!quizMap.has(row.quiz_id)) {
                quizMap.set(row.quiz_id, {
                    id: row.quiz_id,
                    title: row.quiz_title,
                    questions: [],
                    directQuestions: [],
                });
            }
            if (row.question_id) {
                // Check if question already exists to avoid duplicates
                const exists = quizMap
                    .get(row.quiz_id)
                    .questions.some((q) => q.id === row.question_id || q.questionId === row.question_id);
                if (!exists) {
                    quizMap.get(row.quiz_id).questions.push({
                        id: row.question_id,
                        questionId: row.question_id,
                        order: parseInt(row.sort_order) || 0,
                    });
                }
            }
        }
        // Third, add any questions from the direct array that aren't in relationship tables
        for (const [quizId, quizData] of quizMap.entries()) {
            // Process direct questions from the array
            let directQuestions = quizData.directQuestions;
            // If it's a string (happens sometimes with JSONB), parse it
            if (typeof directQuestions === 'string') {
                try {
                    directQuestions = JSON.parse(directQuestions);
                }
                catch (e) {
                    logError(`Error parsing questions array for quiz ${quizData.title}: ${e.message}`);
                    directQuestions = [];
                }
            }
            // If it's not an array or null/undefined, skip
            if (!Array.isArray(directQuestions)) {
                continue;
            }
            // Add each direct question that isn't already in the questions array
            for (const questionItem of directQuestions) {
                if (!questionItem)
                    continue;
                // Extract ID from various possible formats
                const id = typeof questionItem === 'object'
                    ? questionItem.id ||
                        (questionItem.value && questionItem.value.id) ||
                        questionItem
                    : questionItem;
                // Skip if no valid ID could be extracted
                if (!id)
                    continue;
                // Check if question already exists
                const exists = quizData.questions.some((q) => q.id === id || q.questionId === id);
                if (!exists) {
                    quizData.questions.push({
                        id: String(id),
                        questionId: String(id),
                        order: quizData.questions.length, // Use array position as order
                    });
                    logAction(`Added missing question ${id} from direct array for quiz ${quizData.title}`);
                }
            }
            // Remove the directQuestions property, we don't need it anymore
            delete quizData.directQuestions;
        }
        // 4. Update each quiz with properly formatted questions JSONB and add missing relationships
        let successCount = 0;
        let relationshipsAdded = 0;
        for (const [quizId, quizData] of quizMap.entries()) {
            // Format questions into Payload-compatible structure with explicit string conversions
            const formattedQuestions = quizData.questions.map((q) => ({
                id: String(q.id),
                relationTo: 'quiz_questions',
                value: {
                    id: String(q.questionId),
                },
            }));
            // Format as JSON string for the database with proper JSONB casting
            const questionsJson = JSON.stringify(formattedQuestions);
            // Update the quiz with formatted questions using Drizzle with explicit type casting
            await db.execute(sql.raw `
        UPDATE payload.course_quizzes
        SET questions = ${questionsJson}::jsonb
        WHERE id::text = ${quizId}
      `);
            // Log original and new format for debugging
            logAction(`Updating quiz "${quizData.title}" with ${formattedQuestions.length} formatted questions`);
            // Check for each question if it has a relationship record
            for (const question of quizData.questions) {
                // Check if relationship record exists with proper casting
                const relationshipCheckResult = await db.execute(sql.raw `
          SELECT COUNT(*)::int as count
          FROM payload.course_quizzes_rels
          WHERE _parent_id::text = ${quizId}
          AND quiz_questions_id::text = ${String(question.questionId)}
          AND field = 'questions'
        `);
                // If no relationship exists, create one
                if (parseInt(relationshipCheckResult.rows[0].count) === 0) {
                    await db.execute(sql.raw `
            INSERT INTO payload.course_quizzes_rels
            (_parent_id, field, quiz_questions_id, "order")
            VALUES (${quizId}, 'questions', ${String(question.questionId)}, ${question.order || 0})
          `);
                    relationshipsAdded++;
                    logAction(`Created missing relationship for quiz "${quizData.title}" and question ${question.questionId}`);
                }
            }
            // Force update with raw SQL to ensure the format is exactly as expected
            const exactlyFormattedQuestions = formattedQuestions.map((q) => ({
                id: String(q.id),
                relationTo: 'quiz_questions',
                value: {
                    id: String(q.value.id),
                },
            }));
            const jsonString = JSON.stringify(exactlyFormattedQuestions);
            // Using a more direct SQL approach with embedded parameters
            await db.execute(sql.raw `
        UPDATE payload.course_quizzes
        SET questions = '${sql.raw(jsonString)}'::jsonb
        WHERE id::text = '${sql.raw(quizId)}'
      `);
            logAction(`Used direct SQL to ensure exact JSONB format for quiz "${quizData.title}"`);
            successCount++;
        }
        // 5. Special explicit fix for "The Fundamental Elements of Design in Detail Quiz"
        // This is the one specifically mentioned in the error logs
        const problemQuizResult = await db.execute(sql.raw `
      SELECT id::text, title
      FROM payload.course_quizzes
      WHERE title LIKE '%Fundamental Elements of Design in Detail%'
      OR id::text = '42564568-76bb-4405-88a9-8e9fd0a9154a'
    `);
        if (problemQuizResult.rows.length > 0) {
            const problemQuiz = problemQuizResult.rows[0];
            logAction(`Found problem quiz: ${problemQuiz.title} (${problemQuiz.id})`);
            // Get the relationships directly from the database for this quiz
            const questionRels = await db.execute(sql.raw `
        SELECT
          quiz_questions_id::text as question_id,
          "order"::int as sort_order
        FROM
          payload.course_quizzes_rels
        WHERE
          _parent_id::text = ${problemQuiz.id}
        AND
          field = 'questions'
        ORDER BY
          COALESCE("order", 0)
      `);
            if (questionRels.rows.length > 0) {
                // Build properly formatted questions array directly from relationships
                const correctlyFormattedQuestions = questionRels.rows.map((rel) => ({
                    id: String(rel.question_id),
                    relationTo: 'quiz_questions',
                    value: {
                        id: String(rel.question_id),
                    },
                }));
                // Convert to properly formatted JSONB
                const formattedJsonStr = JSON.stringify(correctlyFormattedQuestions);
                // Special update with explicit type handling
                await db.execute(sql.raw `
          UPDATE payload.course_quizzes
          SET questions = ${formattedJsonStr}::jsonb
          WHERE id::text = ${problemQuiz.id}
        `);
                logAction(`Applied special fix to "${problemQuiz.title}" with ${correctlyFormattedQuestions.length} questions`);
                // Verify the fix worked
                const verifyFix = await db.execute(sql.raw `
          SELECT
            jsonb_typeof(questions) as type,
            jsonb_array_length(questions) as count,
            questions::text as json_text
          FROM
            payload.course_quizzes
          WHERE
            id::text = ${problemQuiz.id}
        `);
                if (verifyFix.rows.length > 0) {
                    const fixResult = verifyFix.rows[0];
                    logAction(`Verification of special fix:
            - Type: ${fixResult.type}
            - Count: ${fixResult.count}
            - Sample: ${fixResult.json_text.substring(0, 150)}...
          `);
                }
            }
            else {
                logError(`No question relationships found for problem quiz "${problemQuiz.title}"`);
            }
        }
        else {
            logWarning('Problem quiz "The Fundamental Elements of Design in Detail Quiz" not found!');
        }
        // 6. Additional check for Performance Quiz
        const performanceQuizResult = await db.execute(sql.raw `
      SELECT id::text, title
      FROM payload.course_quizzes
      WHERE title LIKE '%Performance%'
    `);
        if (performanceQuizResult.rows.length > 0) {
            const performanceQuiz = performanceQuizResult.rows[0];
            logAction(`Found Performance Quiz: ${performanceQuiz.title} (${performanceQuiz.id})`);
            // Verify its formatting
            const perfQuizFormat = await db.execute(sql.raw `
        SELECT
          jsonb_typeof(questions) as type,
          jsonb_array_length(questions) as count,
          questions::text as json_text
        FROM
          payload.course_quizzes
        WHERE
          id::text = ${performanceQuiz.id}
      `);
            if (perfQuizFormat.rows.length > 0) {
                const formatInfo = perfQuizFormat.rows[0];
                logAction(`Performance Quiz format check:
          - Type: ${formatInfo.type}
          - Count: ${formatInfo.count}
          - Sample: ${formatInfo.json_text.substring(0, 150)}...
        `);
            }
            // Check relationships
            const perfQuizRels = await db.execute(sql.raw `
        SELECT COUNT(*)::int as count
        FROM payload.course_quizzes_rels
        WHERE _parent_id::text = ${performanceQuiz.id}
        AND field = 'questions'
      `);
            logAction(`Performance Quiz has ${perfQuizRels.rows[0].count} related questions`);
        }
        // 7. Run a comprehensive verification to be sure everything is fixed
        const verificationQuery = await db.execute(sql.raw `
      SELECT
        COUNT(q.id)::int as total_count,
        COUNT(*) FILTER (WHERE jsonb_typeof(q.questions) = 'array')::int as array_count,
        COUNT(*) FILTER (WHERE
          jsonb_typeof(q.questions) = 'array' AND
          jsonb_array_length(q.questions) > 0 AND
          q.questions @> '[{"relationTo": "quiz_questions"}]'
        )::int as formatted_count
      FROM
        payload.course_quizzes q
      WHERE
        q.questions IS NOT NULL
    `);
        const verificationStats = verificationQuery.rows[0];
        logAction(`Final verification stats:
      - Total quizzes with questions: ${verificationStats.total_count}
      - With array-type questions: ${verificationStats.array_count}
      - With properly formatted questions: ${verificationStats.formatted_count}
    `);
        // Check if we fixed everything
        if (verificationStats.formatted_count === verificationStats.total_count) {
            logSuccess(`All ${verificationStats.total_count} quizzes now have properly formatted questions!`);
        }
        else {
            logWarning(`${verificationStats.formatted_count} of ${verificationStats.total_count} quizzes are properly formatted`);
            // Get details about any remaining problem quizzes
            const remainingProblems = await db.execute(sql.raw `
        SELECT
          q.id::text as quiz_id,
          q.title as quiz_title
        FROM
          payload.course_quizzes q
        WHERE
          q.questions IS NOT NULL
          AND (
            jsonb_typeof(q.questions) != 'array'
            OR jsonb_array_length(q.questions) = 0
            OR NOT (q.questions @> '[{"relationTo": "quiz_questions"}]')
          )
      `);
            if (remainingProblems.rows.length > 0) {
                logWarning(`Remaining problem quizzes: ${JSON.stringify(remainingProblems.rows.map((r) => r.quiz_title))}`);
            }
        }
        // Commit transaction
        await db.execute(sql.raw `COMMIT;`);
        // Final summary
        logSuccess(`
    Format fix summary:
    - Total quizzes processed: ${successCount}
    - Missing relationships added: ${relationshipsAdded}
    - Special fixes applied: 2 (Problem quiz and Performance Quiz check)
    - Verification stats: ${verificationStats.formatted_count}/${verificationStats.total_count} properly formatted
    `);
        return true;
    }
    catch (error) {
        // Try to roll back the transaction
        try {
            // Get a new client to ensure we can roll back
            const payload = await getPayloadClient();
            const db = payload.db.drizzle;
            await db.execute(sql.raw `ROLLBACK;`);
        }
        catch (rollbackError) {
            logError(`Error rolling back transaction: ${rollbackError.message}`);
        }
        logError(`Format fix failed: ${error.message}`);
        console.error(error);
        return false;
    }
};
// Provide a backward-compatible function name
export const formatQuestionsJSONB = formatQuestionsJSONBDrizzle;
// Execute if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
    formatQuestionsJSONBDrizzle()
        .then((success) => {
        process.exit(success ? 0 : 1);
    })
        .catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
export default formatQuestionsJSONBDrizzle;
// Helper function for better type safety
function logWarning(message) {
    console.warn(`⚠️ ${message}`);
}
