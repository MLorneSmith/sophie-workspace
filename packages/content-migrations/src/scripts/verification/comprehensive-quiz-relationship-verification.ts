// Log right at the start
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Restore getClient usage
import { getClient } from '../../utils/db/client.js';

console.log('--- SCRIPT FILE LOADED ---'); // Log right at the start

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

console.log('--- IMPORTS COMPLETED ---'); // Log after imports

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
  let client;
  try {
    client = await getClient();

    // Restore the actual verification logic here
    // Fetch all quizzes with their questions relationship
    const quizzesResult = await client.query(`
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
      // Ensure quiz.id is a string before proceeding
      if (typeof quiz.id !== 'string') {
        console.warn(
          chalk.yellow(`Skipping quiz with non-string ID: ${quiz.id}`),
        );
        continue; // Skip this iteration if quiz.id is not a string
      }
      const currentQuizId: string = quiz.id; // Now guaranteed to be a string

      // Extract question IDs from questions array
      let arrayQuestionIds: string[] = [];
      try {
        const questionsArray =
          typeof quiz.questions === 'string'
            ? JSON.parse(quiz.questions)
            : quiz.questions;

        // Explicitly handle types during extraction and filtering
        arrayQuestionIds = questionsArray
          .map((q: any): string | null => {
            // Explicit return type for map
            // Handle different possible formats
            if (typeof q === 'string') {
              return q;
            } else if (q?.value?.id) {
              return String(q.value.id); // Ensure string conversion
            } else if (q?.id) {
              return String(q.id); // Ensure string conversion
            }
            return null;
          })
          .filter((id): id is string => id !== null); // Use type predicate for filtering
      } catch (e) {
        console.error(
          chalk.red(
            `Error parsing questions array for quiz "${quiz.title}" (${quiz.id}):`,
            (e as Error).message, // Type assertion for error message
          ),
        );
        arrayQuestionIds = [];
      }

      // Get relationship records for this quiz
      const quizRelResult = await client.query(
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
        [currentQuizId], // Use the guaranteed string ID
      );

      // Filter out null/undefined IDs first, then map to string
      const relQuestionIds: string[] = quizRelResult.rows
        .filter((r) => r.quiz_questions_id != null) // Filter out null/undefined first
        .map((r) => String(r.quiz_questions_id)); // Then map remaining to string

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
        id: currentQuizId, // Use the guaranteed string ID
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
    reportVerificationResults(summary); // Restore reporting

    return summary; // Return the actual summary
  } catch (error) {
    console.error('Error in verifyQuizRelationships:', error); // More specific error log
    throw error; // Re-throw to be caught by main
  } finally {
    // Use the closeClient utility function if available, otherwise handle directly
    if (client && typeof client.end === 'function') {
      await client.end();
    }
  }
}

/**
 * Report verification results to console
 */
function reportVerificationResults(summary: VerificationSummary) {
  // Restore this function
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
    process.exit(summary.isFullyConsistent ? 0 : 1); // Restore process.exit
  } catch (error) {
    console.error('Unhandled error in main:', error);
    process.exit(1);
  }
}

// Run when script is executed directly
main();

export default verifyQuizRelationships;
