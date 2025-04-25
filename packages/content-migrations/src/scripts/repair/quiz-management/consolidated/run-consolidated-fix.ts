/**
 * Script to run the consolidated quiz relationship fix
 *
 * This script is a convenience wrapper that:
 * 1. Verifies if the migration exists and has been applied
 * 2. Checks relationship consistency using the verification function
 * 3. Applies fixes for any inconsistencies found
 */
import { executeSQL } from '../../../../utils/db/execute-sql.js';

/**
 * Check if the migration has been applied
 */
async function checkMigrationExists(): Promise<boolean> {
  try {
    console.log('Checking if consolidated migration has been applied...');

    // Check if the verification function exists (created by the migration)
    const result = await executeSQL(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
        WHERE proname = 'verify_quiz_question_relationships'
        AND nspname = 'payload'
      );
    `);

    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Run verification and report results
 */
async function verifyRelationships(): Promise<{
  success: boolean;
  totalQuizzes: number;
  inconsistentQuizzes: number;
}> {
  try {
    console.log('Running relationship verification...');

    // Get verification results from the function created by the migration
    const results = await executeSQL(`
      SELECT * FROM payload.verify_quiz_question_relationships();
    `);

    const totalQuizzes = results.rows.length;
    const inconsistentQuizzes = results.rows.filter(
      (row) => !row.is_consistent,
    ).length;

    if (inconsistentQuizzes > 0) {
      console.log(
        `Found ${inconsistentQuizzes} of ${totalQuizzes} quizzes with inconsistent relationships:`,
      );

      results.rows
        .filter((row) => !row.is_consistent)
        .forEach((quiz) => {
          console.log(
            `- Quiz "${quiz.quiz_title}" (${quiz.quiz_id}): has ${quiz.array_count} questions in array but ${quiz.rel_count} in relationship table`,
          );

          if (quiz.missing_questions && quiz.missing_questions.length > 0) {
            console.log(
              `  Missing question IDs: ${quiz.missing_questions.join(', ')}`,
            );
          }
        });

      return { success: false, totalQuizzes, inconsistentQuizzes };
    }

    console.log(
      `All quizzes have consistent relationships (${totalQuizzes} total)`,
    );
    return { success: true, totalQuizzes, inconsistentQuizzes: 0 };
  } catch (error) {
    console.error('Error verifying relationships:', error);
    return { success: false, totalQuizzes: 0, inconsistentQuizzes: 0 };
  }
}

/**
 * Apply fixes for any inconsistencies
 */
async function applyFixes(): Promise<boolean> {
  try {
    console.log('Applying fixes for inconsistent relationships...');

    // Begin transaction
    await executeSQL('BEGIN;');

    // Fix inconsistencies by syncing questions array with relationship table
    const fixArrayResults = await executeSQL(`
      WITH inconsistent_quizzes AS (
        SELECT * FROM payload.verify_quiz_question_relationships()
        WHERE NOT is_consistent
      )
      UPDATE payload.course_quizzes q
      SET questions = (
        SELECT COALESCE(jsonb_agg(DISTINCT rel.quiz_questions_id), '[]'::jsonb)
        FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = q.id
          AND rel.field = 'questions'
          AND rel.quiz_questions_id IS NOT NULL
      )
      FROM inconsistent_quizzes iq
      WHERE q.id = iq.quiz_id
      RETURNING q.id;
    `);

    // Fix missing relationship entries
    const fixRelResults = await executeSQL(`
      WITH inconsistent_quizzes AS (
        SELECT * FROM payload.verify_quiz_question_relationships()
        WHERE NOT is_consistent
      ),
      missing_relationships AS (
        SELECT 
          iq.quiz_id,
          unnest(iq.missing_questions) as question_id
        FROM inconsistent_quizzes iq
        WHERE array_length(iq.missing_questions, 1) > 0
      )
      INSERT INTO payload.course_quizzes_rels 
        (_parent_id, field, path, quiz_questions_id, value, id)
      SELECT 
        quiz_id, 
        'questions',
        'questions', 
        question_id, 
        question_id,
        question_id
      FROM missing_relationships
      ON CONFLICT DO NOTHING
      RETURNING _parent_id;
    `);

    // Commit transaction
    await executeSQL('COMMIT;');

    const totalFixedQuizzes = fixArrayResults.rows.length;
    const totalFixedRelationships = fixRelResults.rows.length;

    if (totalFixedQuizzes > 0 || totalFixedRelationships > 0) {
      console.log(
        `Fixed ${totalFixedQuizzes} quizzes and ${totalFixedRelationships} relationships`,
      );
    } else {
      console.log('No fixes needed, all relationships are consistent');
    }

    return true;
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK;');
    console.error('Error applying fixes:', error);
    return false;
  }
}

/**
 * Main function to run the consolidated fix
 */
async function main() {
  try {
    console.log('=====================================');
    console.log('CONSOLIDATED QUIZ RELATIONSHIP FIX');
    console.log('=====================================');

    // Check if migration has been applied
    const migrationExists = await checkMigrationExists();

    if (!migrationExists) {
      console.error('Consolidated migration has not been applied.');
      console.error(
        'Please run the migration first: apps/payload/src/migrations/20250425_150000_consolidated_quiz_relationship_fix.ts',
      );
      process.exit(1);
    }

    console.log('Consolidated migration is applied and active.');

    // First verify relationships
    const verification = await verifyRelationships();

    // If there are inconsistencies, apply fixes
    if (!verification.success) {
      console.log('\nAttempting to fix inconsistencies...');
      const fixResult = await applyFixes();

      if (fixResult) {
        // Verify again after fixes
        console.log('\nVerifying after fixes:');
        const postFixVerification = await verifyRelationships();

        if (postFixVerification.success) {
          console.log('\nAll inconsistencies have been fixed successfully!');
          process.exit(0);
        } else {
          console.error(
            '\nSome inconsistencies could not be fixed automatically.',
          );
          console.error(
            'Please check the database manually or reapply the migration.',
          );
          process.exit(1);
        }
      } else {
        console.error('\nFailed to apply fixes.');
        process.exit(1);
      }
    } else {
      console.log(
        '\nAll quizzes have consistent relationships. No fixes needed!',
      );
      process.exit(0);
    }
  } catch (error) {
    console.error('Unhandled error in consolidated fix:', error);
    process.exit(1);
  }
}

// Run the main function
main();
