/**
 * Quiz Relationship Integrity Verification and Repair
 *
 * This script verifies and repairs inconsistencies between quiz relationship
 * records and JSONB arrays, ensuring they match exactly.
 */
import chalk from 'chalk';
import { getClient } from '../../utils/db/client.js';
async function run() {
    const client = await getClient();
    try {
        console.log(chalk.cyan('\n=== Quiz Relationship Integrity Verification and Repair ===\n'));
        // Create a diagnostic view for monitoring
        await client.query(`
      CREATE OR REPLACE VIEW payload.quiz_relationship_diagnostic AS
      SELECT 
        q.id as quiz_id,
        q.title as quiz_title,
        jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) as questions_jsonb_count,
        COUNT(qr.id) FILTER (WHERE qr.field = 'questions') as questions_rel_count,
        CASE 
          WHEN jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) = COUNT(qr.id) FILTER (WHERE qr.field = 'questions')
          THEN true
          ELSE false
        END as counts_match
      FROM 
        payload.course_quizzes q
      LEFT JOIN 
        payload.course_quizzes_rels qr ON q.id = qr._parent_id
      GROUP BY 
        q.id, q.title, q.questions;
    `);
        // Identify problematic quizzes
        const { rows: problematicQuizzes } = await client.query(`
      SELECT 
        quiz_id, 
        quiz_title,
        questions_jsonb_count,
        questions_rel_count
      FROM 
        payload.quiz_relationship_diagnostic
      WHERE 
        counts_match = false
      ORDER BY 
        quiz_title
    `);
        console.log(`Found ${problematicQuizzes.length} quizzes with mismatched relationship counts`);
        let repairCount = 0;
        // Begin transaction for the repair process
        await client.query('BEGIN');
        // Process each problematic quiz
        for (const quiz of problematicQuizzes) {
            console.log(`Fixing relationships for quiz: ${quiz.quiz_title} (${quiz.quiz_id})`);
            // Get all question IDs from relationship records
            const { rows: questionRels } = await client.query(`
        SELECT quiz_questions_id
        FROM payload.course_quizzes_rels
        WHERE _parent_id = $1
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      `, [quiz.quiz_id]);
            // Get all question IDs from JSONB array
            const { rows: questionJsonb } = await client.query(`
        SELECT 
          CASE 
            WHEN jsonb_typeof(value) = 'object' THEN value->>'id'
            ELSE value::text
          END as question_id
        FROM 
          payload.course_quizzes,
          jsonb_array_elements(COALESCE(questions, '[]'::jsonb)) AS q(value)
        WHERE id = $1
      `, [quiz.quiz_id]);
            // Extract and normalize IDs from both sources
            const relIds = questionRels.map((r) => r.quiz_questions_id);
            const jsonbIds = questionJsonb
                .map((j) => {
                try {
                    // Handle various formats that might be in the database
                    if (!j.question_id)
                        return null;
                    return j.question_id;
                }
                catch (e) {
                    console.error(`Error extracting ID from JSONB:`, e);
                    return null;
                }
            })
                .filter(Boolean);
            // Use the union of all IDs to ensure we don't lose any data
            const allQuestionIds = [...new Set([...relIds, ...jsonbIds])];
            if (allQuestionIds.length > 0) {
                // Update the JSONB array with properly formatted entries
                await client.query(`
          UPDATE payload.course_quizzes
          SET questions = (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', q_id,
                'relationTo', 'quiz_questions',
                'value', jsonb_build_object('id', q_id)
              )
            )
            FROM unnest($2::text[]) as q_id
          )
          WHERE id = $1
        `, [quiz.quiz_id, allQuestionIds]);
                // Delete existing relationship records for this quiz
                await client.query(`
          DELETE FROM payload.course_quizzes_rels
          WHERE _parent_id = $1
          AND field = 'questions'
        `, [quiz.quiz_id]);
                // Insert new relationship records
                for (const questionId of allQuestionIds) {
                    await client.query(`
            INSERT INTO payload.course_quizzes_rels 
            (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
            VALUES (
              gen_random_uuid(), 
              $1, 
              'questions', 
              $2, 
              $2,
              NOW(),
              NOW()
            )
          `, [quiz.quiz_id, questionId]);
                }
                console.log(`Fixed quiz ${quiz.quiz_title}: reconciled ${allQuestionIds.length} questions`);
                repairCount++;
            }
            else {
                console.log(`Quiz ${quiz.quiz_title} has no questions to reconcile`);
            }
        }
        // Special handling for known problematic quizzes mentioned in error logs
        const { rows: reportedErrorQuizzes } = await client.query(`
      SELECT id, title
      FROM payload.course_quizzes
      WHERE 
        title LIKE '%Who%' OR
        title LIKE '%Structure%' OR
        title LIKE '%Stories%' OR
        title LIKE '%Film%' OR
        title LIKE '%Visual Perception%' OR
        title LIKE '%Tables vs. Graphs%' OR
        title LIKE '%Specialist Graphs%' OR
        title LIKE '%Preparation and Practice%'
    `);
        for (const quiz of reportedErrorQuizzes) {
            console.log(`Applying special fix for reported error quiz: ${quiz.title} (${quiz.id})`);
            // Update the quiz with properly formatted questions from relationships
            await client.query(`
        UPDATE payload.course_quizzes
        SET questions = (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', quiz_questions_id::text,
              'relationTo', 'quiz_questions'::text,
              'value', jsonb_build_object('id', quiz_questions_id::text)
            )
          )
          FROM payload.course_quizzes_rels
          WHERE _parent_id = $1
          AND field = 'questions'
          AND quiz_questions_id IS NOT NULL
        )
        WHERE id = $1
        AND EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels
          WHERE _parent_id = $1
          AND field = 'questions'
          AND quiz_questions_id IS NOT NULL
        )
      `, [quiz.id]);
        }
        // Update bidirectional relationships (question → quiz)
        console.log('Ensuring bidirectional relationships are properly set up...');
        // Find missing bidirectional relationships
        const { rows: missingBidirectional } = await client.query(`
      SELECT 
        cqr._parent_id as quiz_id,
        cqr.quiz_questions_id as question_id
      FROM 
        payload.course_quizzes_rels cqr
      WHERE
        cqr.quiz_questions_id IS NOT NULL
        AND cqr.field = 'questions'
        AND NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = cqr.quiz_questions_id 
            AND qr.field = 'quiz_id'
            AND qr.value = cqr._parent_id
        )
    `);
        if (missingBidirectional.length > 0) {
            console.log(`Creating ${missingBidirectional.length} missing bidirectional relationships`);
            // Create the missing bidirectional relationships
            for (const rel of missingBidirectional) {
                await client.query(`
          INSERT INTO payload.quiz_questions_rels
          (id, _parent_id, field, value, created_at, updated_at)
          VALUES (
            gen_random_uuid(), 
            $1, 
            'quiz_id', 
            $2,
            NOW(),
            NOW()
          )
        `, [rel.question_id, rel.quiz_id]);
            }
        }
        // Fix any wrong field names
        await client.query(`
      UPDATE payload.quiz_questions_rels 
      SET field = 'quiz_id' 
      WHERE field != 'quiz_id'
    `);
        // Verify the fix
        const { rows: afterFixDiagnostic } = await client.query(`
      SELECT 
        COUNT(*) as total_quizzes,
        COUNT(*) FILTER (WHERE counts_match = true) as synced_quizzes,
        COUNT(*) FILTER (WHERE counts_match = false) as remaining_problems
      FROM 
        payload.quiz_relationship_diagnostic
    `);
        console.log(`\nRepair Summary:`);
        console.log(`- Fixed ${repairCount} quizzes with relationship inconsistencies`);
        console.log(`- Created ${missingBidirectional.length} missing bidirectional relationships`);
        console.log(`- After fix: ${afterFixDiagnostic[0].synced_quizzes} of ${afterFixDiagnostic[0].total_quizzes} quizzes have synchronized relationships`);
        if (parseInt(afterFixDiagnostic[0].remaining_problems) > 0) {
            console.warn(`Warning: ${afterFixDiagnostic[0].remaining_problems} quizzes still have inconsistent relationships`);
            // List the remaining problematic quizzes
            const { rows: remainingProblems } = await client.query(`
        SELECT quiz_id, quiz_title, questions_jsonb_count, questions_rel_count
        FROM payload.quiz_relationship_diagnostic
        WHERE counts_match = false
        ORDER BY quiz_title
      `);
            console.log('Remaining problematic quizzes:');
            for (const quiz of remainingProblems) {
                console.log(`- ${quiz.quiz_title}: JSONB=${quiz.questions_jsonb_count}, Rels=${quiz.questions_rel_count}`);
            }
            // Commit the transaction - we still made improvements
            await client.query('COMMIT');
            return false;
        }
        // Commit the transaction
        await client.query('COMMIT');
        console.log(chalk.green('✅ Quiz relationship consistency fix completed successfully'));
        return true;
    }
    catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error(chalk.red('Error in quiz relationship consistency fix:'), error);
        return false;
    }
    finally {
        await client.end();
    }
}
// Execute and return result code for script integration
if (import.meta.url === `file://${process.argv[1]}`) {
    run()
        .then((success) => process.exit(success ? 0 : 1))
        .catch((err) => {
        console.error('Unhandled error:', err);
        process.exit(1);
    });
}
export default run;
