/**
 * Fix Quiz Array Relationships
 *
 * This script repairs the inconsistency between quiz.questions arrays and relationship tables
 * by updating the questions array in each quiz to match its relationships in the relationship table.
 */
import chalk from 'chalk';
import { executeSQL } from '../../../../utils/db/execute-sql.js';
async function updateQuizQuestionsArray() {
    console.log(chalk.cyan('Starting repair of quiz questions arrays...'));
    try {
        // Start transaction
        await executeSQL('BEGIN;');
        // 1. First, identify all quizzes with inconsistent relationships
        console.log(chalk.yellow('Identifying inconsistent quiz relationships...'));
        // Get all quizzes from relationship tables (with their questions)
        const quizzesInRels = await executeSQL(`
      SELECT 
        _parent_id::text as quiz_id,
        ARRAY_AGG(DISTINCT quiz_questions_id) as question_ids,
        COUNT(DISTINCT quiz_questions_id) as question_count
      FROM 
        payload.course_quizzes_rels
      WHERE 
        field = 'questions'
        AND quiz_questions_id IS NOT NULL
      GROUP BY 
        _parent_id;
    `);
        // Get quiz array counts for comparison
        const quizArrayCounts = await executeSQL(`
      SELECT 
        id::text as quiz_id,
        CASE WHEN jsonb_typeof(questions) = 'array' 
          THEN jsonb_array_length(questions) 
          ELSE 0 
        END as array_count
      FROM 
        payload.course_quizzes;
    `);
        // Build map of array counts
        const arrayCountMap = new Map();
        quizArrayCounts.rows.forEach((row) => {
            arrayCountMap.set(row.quiz_id, row.array_count);
        });
        // Find inconsistent quizzes
        const inconsistentQuizzes = [];
        let totalFixed = 0;
        for (const quiz of quizzesInRels.rows) {
            const arrayCount = arrayCountMap.get(quiz.quiz_id) || 0;
            if (arrayCount !== quiz.question_count) {
                inconsistentQuizzes.push({
                    quiz_id: quiz.quiz_id,
                    rel_count: quiz.question_count,
                    array_count: arrayCount,
                    question_ids: quiz.question_ids,
                });
            }
        }
        console.log(chalk.yellow(`Found ${inconsistentQuizzes.length} quizzes with inconsistent relationships`));
        // 2. Update the questions array for each inconsistent quiz
        for (const quiz of inconsistentQuizzes) {
            // Convert question IDs array to JSONB array
            const result = await executeSQL(`
        UPDATE payload.course_quizzes
        SET questions = $1::jsonb
        WHERE id::text = $2;
      `, [JSON.stringify(quiz.question_ids), quiz.quiz_id]);
            if (result.rowCount > 0) {
                totalFixed++;
                console.log(chalk.green(`Fixed quiz ${quiz.quiz_id}: Updated questions array from ${quiz.array_count} to ${quiz.rel_count} questions`));
            }
            else {
                console.log(chalk.red(`Failed to update quiz ${quiz.quiz_id} - quiz not found in course_quizzes table`));
            }
        }
        // 3. Verify the fix
        console.log(chalk.yellow('Verifying the fixes...'));
        const verificationResults = await executeSQL(`
      WITH array_questions AS (
        SELECT 
          id::text as quiz_id,
          CASE WHEN jsonb_typeof(questions) = 'array' 
            THEN jsonb_array_length(questions) 
            ELSE 0 
          END as array_count
        FROM 
          payload.course_quizzes
      ),
      rel_questions AS (
        SELECT 
          _parent_id::text as quiz_id,
          COUNT(DISTINCT quiz_questions_id) as rel_count
        FROM 
          payload.course_quizzes_rels
        WHERE 
          field = 'questions'
          AND quiz_questions_id IS NOT NULL
        GROUP BY 
          _parent_id
      )
      SELECT 
        aq.quiz_id,
        aq.array_count,
        COALESCE(rq.rel_count, 0) as rel_count,
        aq.array_count = COALESCE(rq.rel_count, 0) as is_consistent
      FROM 
        array_questions aq
      JOIN 
        rel_questions rq ON rq.quiz_id = aq.quiz_id
      WHERE 
        aq.array_count <> COALESCE(rq.rel_count, 0);
    `);
        const stillInconsistent = verificationResults.rowCount;
        if (stillInconsistent > 0) {
            console.log(chalk.red(`${stillInconsistent} quizzes still have inconsistent relationships after repair`));
            // List some examples
            verificationResults.rows.slice(0, 5).forEach((quiz) => {
                console.log(chalk.red(`- Quiz ${quiz.quiz_id}: has ${quiz.array_count} questions in array but ${quiz.rel_count} in relationship table`));
            });
            // Rollback if there are still inconsistencies
            await executeSQL('ROLLBACK;');
            console.log(chalk.yellow('Changes rolled back due to remaining inconsistencies'));
            return false;
        }
        else {
            // Commit the changes
            await executeSQL('COMMIT;');
            console.log(chalk.green(`Successfully repaired ${totalFixed} quizzes' question arrays`));
            return true;
        }
    }
    catch (error) {
        // Rollback on error
        await executeSQL('ROLLBACK;');
        console.error(chalk.red('Error repairing quiz question relationships:'), error);
        return false;
    }
}
/**
 * Main function
 */
async function main() {
    try {
        const success = await updateQuizQuestionsArray();
        process.exit(success ? 0 : 1);
    }
    catch (error) {
        console.error(chalk.red('Unhandled error repairing quiz relationships:'), error);
        process.exit(1);
    }
}
// Run the script
main();
