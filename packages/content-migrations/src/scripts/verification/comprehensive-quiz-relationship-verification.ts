/**
 * Comprehensive Quiz Relationship Verification
 *
 * This script performs a thorough verification of all aspects of quiz relationships:
 * 1. Checks that all records in course_quizzes_rels have path = 'questions' (not NULL)
 * 2. Verifies no duplicate relationship records exist
 * 3. Ensures question array length matches relationship count for each quiz
 * 4. Verifies each question in the questions array has a corresponding relationship record
 * 5. Verifies each relationship record has a corresponding entry in the questions array
 */
import chalk from 'chalk';

import { executeSQL } from '../../utils/db/execute-sql.js';

interface QuizVerificationResult {
  id: string;
  title: string;
  arrayCount: number;
  relCount: number;
  nullPathCount: number;
  duplicateCount: number;
  missingFromArray: string[];
  missingFromRels: string[];
  isConsistent: boolean;
}

interface VerificationSummary {
  totalQuizzes: number;
  passedQuizzes: number;
  failedQuizzes: number;
  totalPathNullCount: number;
  totalDuplicateCount: number;
  totalMismatchedArrayCount: number;
  totalMissingFromArrayCount: number;
  totalMissingFromRelsCount: number;
  problemQuizzes: QuizVerificationResult[];
  isFullyConsistent: boolean;
}

/**
 * Main verification function that checks all aspects of quiz relationships
 */
async function verifyQuizRelationships(): Promise<VerificationSummary> {
  console.log(
    chalk.cyan('Starting comprehensive quiz relationship verification...'),
  );

  try {
    // Get list of all quizzes with their questions array
    const quizzesResult = await executeSQL(`
      SELECT 
        id::text as id,
        title,
        questions
      FROM 
        payload.course_quizzes
      WHERE 
        jsonb_typeof(questions) = 'array'
    `);

    const quizzes = quizzesResult.rows;
    console.log(chalk.cyan(`Found ${quizzes.length} quizzes to verify`));

    // Collect verification results for each quiz
    const results: QuizVerificationResult[] = [];

    for (const quiz of quizzes) {
      // Extract question IDs from questions array
      let arrayQuestionIds: string[] = [];
      try {
        const questionsArray =
          typeof quiz.questions === 'string'
            ? JSON.parse(quiz.questions)
            : quiz.questions;

        arrayQuestionIds = questionsArray
          .map((q: any) => {
            // Handle different possible formats
            if (typeof q === 'string') {
              return q;
            } else if (q?.value?.id) {
              return q.value.id;
            } else if (q?.id) {
              return q.id;
            }
            return null;
          })
          .filter(Boolean);
      } catch (e) {
        console.error(
          chalk.red(
            `Error parsing questions array for quiz "${quiz.title}" (${quiz.id}):`,
            e.message,
          ),
        );
        arrayQuestionIds = [];
      }

      // Get relationship records for this quiz
      const quizRelResult = await executeSQL(
        `
        SELECT 
          quiz_questions_id,
          path
        FROM 
          payload.course_quizzes_rels
        WHERE 
          _parent_id = $1
          AND field = 'questions'
      `,
        [quiz.id],
      );

      const relQuestionIds = quizRelResult.rows.map((r) => r.quiz_questions_id);

      // Check for duplicates
      const uniqueRelIds = [...new Set(relQuestionIds)];
      const duplicateCount = relQuestionIds.length - uniqueRelIds.length;

      // Check for NULL paths
      const nullPathCount = quizRelResult.rows.filter(
        (r) => r.path === null,
      ).length;

      // Check for missing items in either direction
      const missingFromArray = uniqueRelIds.filter(
        (id) => !arrayQuestionIds.includes(id),
      );
      const missingFromRels = arrayQuestionIds.filter(
        (id) => !uniqueRelIds.includes(id),
      );

      // Determine if this quiz is fully consistent
      const isConsistent =
        nullPathCount === 0 &&
        duplicateCount === 0 &&
        arrayQuestionIds.length === uniqueRelIds.length &&
        missingFromArray.length === 0 &&
        missingFromRels.length === 0;

      // Add to results
      results.push({
        id: quiz.id,
        title: quiz.title || 'Unnamed Quiz',
        arrayCount: arrayQuestionIds.length,
        relCount: uniqueRelIds.length,
        nullPathCount,
        duplicateCount,
        missingFromArray,
        missingFromRels,
        isConsistent,
      });
    }

    // Generate summary
    const passedQuizzes = results.filter((r) => r.isConsistent).length;
    const failedQuizzes = results.length - passedQuizzes;

    const totalPathNullCount = results.reduce(
      (sum, r) => sum + r.nullPathCount,
      0,
    );
    const totalDuplicateCount = results.reduce(
      (sum, r) => sum + r.duplicateCount,
      0,
    );
    const totalMismatchedArrayCount = results.filter(
      (r) => r.arrayCount !== r.relCount,
    ).length;
    const totalMissingFromArrayCount = results.reduce(
      (sum, r) => sum + r.missingFromArray.length,
      0,
    );
    const totalMissingFromRelsCount = results.reduce(
      (sum, r) => sum + r.missingFromRels.length,
      0,
    );

    const isFullyConsistent = failedQuizzes === 0;

    // Create detailed summary
    const summary: VerificationSummary = {
      totalQuizzes: results.length,
      passedQuizzes,
      failedQuizzes,
      totalPathNullCount,
      totalDuplicateCount,
      totalMismatchedArrayCount,
      totalMissingFromArrayCount,
      totalMissingFromRelsCount,
      problemQuizzes: results.filter((r) => !r.isConsistent),
      isFullyConsistent,
    };

    // Report verification results
    reportVerificationResults(summary);

    return summary;
  } catch (error) {
    console.error(
      chalk.red('Error during quiz relationship verification:'),
      error,
    );
    throw error;
  }
}

/**
 * Report verification results to console
 */
function reportVerificationResults(summary: VerificationSummary) {
  const {
    totalQuizzes,
    passedQuizzes,
    failedQuizzes,
    totalPathNullCount,
    totalDuplicateCount,
    totalMismatchedArrayCount,
    totalMissingFromArrayCount,
    totalMissingFromRelsCount,
    problemQuizzes,
    isFullyConsistent,
  } = summary;

  console.log(chalk.cyan('\n=== Quiz Relationship Verification Results ===\n'));

  if (isFullyConsistent) {
    console.log(
      chalk.green(
        `✅ All ${totalQuizzes} quizzes have fully consistent relationships!`,
      ),
    );
  } else {
    console.log(
      chalk.yellow(
        `⚠️ Found issues with ${failedQuizzes} out of ${totalQuizzes} quizzes:`,
      ),
    );
    console.log(
      chalk.yellow(`- Records with NULL path: ${totalPathNullCount}`),
    );
    console.log(
      chalk.yellow(`- Duplicate relationship records: ${totalDuplicateCount}`),
    );
    console.log(
      chalk.yellow(
        `- Quizzes with mismatched array counts: ${totalMismatchedArrayCount}`,
      ),
    );
    console.log(
      chalk.yellow(
        `- Questions missing from arrays: ${totalMissingFromArrayCount}`,
      ),
    );
    console.log(
      chalk.yellow(
        `- Questions missing from relationships: ${totalMissingFromRelsCount}`,
      ),
    );

    // Show detailed problems for first 5 quizzes
    console.log(
      chalk.cyan('\nDetailed issues for up to 5 problematic quizzes:'),
    );

    problemQuizzes.slice(0, 5).forEach((quiz, index) => {
      console.log(
        chalk.yellow(`\n${index + 1}. Quiz "${quiz.title}" (${quiz.id}):`),
      );

      if (quiz.nullPathCount > 0) {
        console.log(
          chalk.yellow(`   - Has ${quiz.nullPathCount} records with NULL path`),
        );
      }

      if (quiz.duplicateCount > 0) {
        console.log(
          chalk.yellow(
            `   - Has ${quiz.duplicateCount} duplicate relationship records`,
          ),
        );
      }

      if (quiz.arrayCount !== quiz.relCount) {
        console.log(
          chalk.yellow(
            `   - Array count (${quiz.arrayCount}) doesn't match relationship count (${quiz.relCount})`,
          ),
        );
      }

      if (quiz.missingFromArray.length > 0) {
        console.log(
          chalk.yellow(
            `   - ${quiz.missingFromArray.length} questions in relationships missing from array`,
          ),
        );
        console.log(
          chalk.gray(
            `     First few IDs: ${quiz.missingFromArray.slice(0, 3).join(', ')}${quiz.missingFromArray.length > 3 ? '...' : ''}`,
          ),
        );
      }

      if (quiz.missingFromRels.length > 0) {
        console.log(
          chalk.yellow(
            `   - ${quiz.missingFromRels.length} questions in array missing from relationships`,
          ),
        );
        console.log(
          chalk.gray(
            `     First few IDs: ${quiz.missingFromRels.slice(0, 3).join(', ')}${quiz.missingFromRels.length > 3 ? '...' : ''}`,
          ),
        );
      }
    });

    if (problemQuizzes.length > 5) {
      console.log(
        chalk.yellow(
          `\n...and ${problemQuizzes.length - 5} more problematic quizzes not shown.`,
        ),
      );
    }
  }

  console.log(chalk.cyan('\n=== End of Verification Results ===\n'));
}

/**
 * Run verification when script is executed directly
 */
async function main() {
  try {
    const summary = await verifyQuizRelationships();
    process.exit(summary.isFullyConsistent ? 0 : 1);
  } catch (error) {
    console.error(
      chalk.red('Unhandled error in quiz relationship verification:'),
      error,
    );
    process.exit(1);
  }
}

// Run when script is executed directly
if (require.main === module) {
  main();
}

export default verifyQuizRelationships;
