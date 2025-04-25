/**
 * Verification script for the enhanced quiz-question relationship fix
 *
 * This script verifies that the enhanced quiz-question relationship fix
 * has been successfully applied by checking:
 * 1. The questions array exists in course_quizzes
 * 2. The array contains the correct question IDs
 * 3. The relationships in course_quizzes_rels are correctly structured
 * 4. Questions appear in Payload admin (via checking data structures)
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';

async function verifyEnhancedFix(): Promise<boolean> {
  console.log(
    'Starting verification of enhanced quiz-question relationship fix...',
  );
  let success = true;

  try {
    // 1. Check if questions array column exists in course_quizzes
    console.log(
      'Checking if questions array column exists in course_quizzes...',
    );
    const columnResult = await executeSQL(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_quizzes' 
      AND column_name = 'questions';
    `);

    if (columnResult.rows.length === 0) {
      console.error(
        '❌ Questions array column does not exist in course_quizzes table',
      );
      success = false;
    } else {
      console.log('✅ Questions array column exists in course_quizzes table');
    }

    // 2. Check if quizzes have questions in their questions array
    console.log(
      'Checking if quizzes have questions in their questions array...',
    );
    const quizzesResult = await executeSQL(`
      SELECT id, title, questions FROM payload.course_quizzes;
    `);

    const quizzes = quizzesResult.rows;
    console.log(`Found ${quizzes.length} quizzes to check`);

    let quizzesWithQuestions = 0;
    let quizzesWithoutQuestions = 0;
    let totalQuestions = 0;

    for (const quiz of quizzes) {
      const questions = quiz.questions;

      if (!questions || questions.length === 0) {
        quizzesWithoutQuestions++;
        console.log(
          `Quiz "${quiz.title}" (${quiz.id}) has no questions in its array`,
        );
      } else {
        const questionIds = Array.isArray(questions)
          ? questions
          : JSON.parse(questions);
        quizzesWithQuestions++;
        totalQuestions += questionIds.length;
        console.log(
          `Quiz "${quiz.title}" (${quiz.id}) has ${questionIds.length} questions in its array`,
        );
      }
    }

    console.log(
      `✅ ${quizzesWithQuestions} quizzes have questions in their array`,
    );
    console.log(
      `ℹ️ ${quizzesWithoutQuestions} quizzes have no questions in their array`,
    );
    console.log(`ℹ️ Total questions across all quizzes: ${totalQuestions}`);

    // 3. Check if relationship entries exist and are correctly structured
    console.log('Checking relationship entries in course_quizzes_rels...');
    const relsResult = await executeSQL(`
      SELECT _parent_id, field, quiz_questions_id, value, COUNT(*) as count
      FROM payload.course_quizzes_rels
      WHERE field = 'questions'
      GROUP BY _parent_id, field, quiz_questions_id, value;
    `);

    if (relsResult.rows.length === 0) {
      console.error(
        '❌ No quiz-question relationship entries found in course_quizzes_rels',
      );
      success = false;
    } else {
      console.log(
        `✅ Found ${relsResult.rows.length} relationship entries in course_quizzes_rels`,
      );
    }

    // 4. Check for inconsistencies between questions array and relationship entries
    console.log(
      'Checking for inconsistencies between questions array and relationship entries...',
    );
    let inconsistencies = 0;

    for (const quiz of quizzes) {
      if (!quiz.questions || quiz.questions.length === 0) {
        continue;
      }

      const questionIds = Array.isArray(quiz.questions)
        ? quiz.questions
        : JSON.parse(quiz.questions);

      for (const questionId of questionIds) {
        const relResult = await executeSQL(
          `
          SELECT * FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND (value = $2 OR quiz_questions_id = $2 OR id = $2);
        `,
          [quiz.id, questionId],
        );

        if (relResult.rows.length === 0) {
          console.error(
            `❌ Inconsistency: Quiz ${quiz.id} has question ${questionId} in its array but no corresponding relationship entry`,
          );
          inconsistencies++;
        }
      }
    }

    if (inconsistencies === 0) {
      console.log(
        '✅ No inconsistencies found between questions arrays and relationship entries',
      );
    } else {
      console.error(
        `❌ Found ${inconsistencies} inconsistencies between questions arrays and relationship entries`,
      );
      success = false;
    }

    // 5. Check if UUID tables have required columns
    console.log('Checking UUID tables for required columns...');
    const uuidTablesResult = await executeSQL(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'payload'
      AND table_name ~ '^course_quizzes_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
    `);

    const uuidTables = uuidTablesResult.rows;
    let tablesWithMissingColumns = 0;

    for (const tableRow of uuidTables) {
      const tableName = tableRow.table_name;
      const columnsResult = await executeSQL(
        `
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'payload' AND table_name = $1;
      `,
        [tableName],
      );

      const columnNames = columnsResult.rows.map((row) => row.column_name);
      const requiredColumns = [
        'id',
        'path',
        'parent_id',
        'quiz_questions_id',
        'order',
      ];
      const missingColumns = requiredColumns.filter(
        (col) => !columnNames.includes(col),
      );

      if (missingColumns.length > 0) {
        console.error(
          `❌ UUID table ${tableName} is missing columns: ${missingColumns.join(', ')}`,
        );
        tablesWithMissingColumns++;
      }
    }

    if (tablesWithMissingColumns === 0) {
      console.log(
        `✅ All ${uuidTables.length} UUID tables have the required columns`,
      );
    } else {
      console.error(
        `❌ ${tablesWithMissingColumns} UUID tables are missing required columns`,
      );
      success = false;
    }

    // Final verification result
    if (success) {
      console.log(
        '🎉 Enhanced quiz-question relationship fix verification PASSED',
      );
      console.log(
        'Questions should now be visible in Payload CMS admin interface',
      );
    } else {
      console.error(
        '❌ Enhanced quiz-question relationship fix verification FAILED',
      );
      console.error('Some issues were found that need to be addressed');
    }

    return success;
  } catch (error) {
    console.error('Error during verification:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await verifyEnhancedFix();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error running verification:', error);
    process.exit(1);
  }
}

// Run the verification directly when executed as a script
if (require.main === module) {
  main();
}

export { verifyEnhancedFix };
