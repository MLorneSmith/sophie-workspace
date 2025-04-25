/**
 * Fix Quiz Relationships Script (Corrected)
 *
 * This script fixes the relationship entries between quizzes and questions in the database.
 * It ensures all quizzes have proper relationship entries in the course_quizzes_rels table.
 *
 * FIXES:
 * - Uses _parent_id column for parent ID
 * - Generates a unique UUID for each relationship entry
 * - Sets quiz_questions_id column to the question ID
 * - Improves validation and error handling
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { QUIZZES } from '../../../data/definitions/quizzes.js';
import { executeSQL } from '../../../utils/db/execute-sql.js';

// Helper function to generate UUIDs
const generateUUID = () => crypto.randomUUID();

// Path to output reports
const outputDir = path.join(process.cwd(), 'z.plan', 'quizzes');

export async function fixQuizRelationships() {
  try {
    console.log('Starting quiz relationship repair (corrected version)...');

    // Start a transaction for consistent database state
    await executeSQL('BEGIN');

    // Get all quizzes from the database
    const quizzesResult = await executeSQL(`
      SELECT 
        id, 
        title, 
        slug
      FROM 
        payload.course_quizzes
      ORDER BY 
        title
    `);

    const dbQuizzes = quizzesResult.rows;
    console.log(`Found ${dbQuizzes.length} quizzes in the database`);

    // Tracking variables for the report
    const results = {
      totalQuizzes: dbQuizzes.length,
      quizzesFixed: 0,
      quizzesWithoutRelationships: 0,
      fixedQuizzes: [],
      errorQuizzes: [],
    };

    // Process each quiz
    for (const quiz of dbQuizzes) {
      console.log(`Processing quiz "${quiz.title}" (${quiz.id})`);

      // Find the quiz in our QUIZZES definitions
      const slugToFind = Object.keys(QUIZZES).find(
        (slug) =>
          QUIZZES[slug].id === quiz.id || QUIZZES[slug].slug === quiz.slug,
      );

      if (!slugToFind) {
        console.warn(
          `Warning: Quiz "${quiz.title}" (${quiz.id}) not found in QUIZZES definitions`,
        );
        results.errorQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          reason: 'Not found in QUIZZES definitions',
        });
        continue;
      }

      const quizDefinition = QUIZZES[slugToFind];

      // Skip if no questions defined
      if (!quizDefinition.questions || quizDefinition.questions.length === 0) {
        console.warn(
          `Warning: Quiz "${quiz.title}" has no questions defined in QUIZZES`,
        );
        results.errorQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          reason: 'No questions defined in QUIZZES',
        });
        continue;
      }

      // Get existing relationship entries for this quiz
      const relEntriesResult = await executeSQL(
        `
        SELECT 
          id,
          _parent_id,
          path,
          field,
          "order"
        FROM 
          payload.course_quizzes_rels
        WHERE 
          _parent_id = $1 AND path = 'questions'
        ORDER BY
          "order"
        `,
        [quiz.id],
      );

      const existingRelEntries = relEntriesResult.rows;
      console.log(
        `Found ${existingRelEntries.length} existing relationship entries`,
      );

      // Get question IDs from the QUIZZES definition
      const questionIds = quizDefinition.questions.map((q) => q.id);

      // If no relationship entries exist, we need to create them
      if (existingRelEntries.length === 0) {
        console.log(`Creating relationship entries for quiz "${quiz.title}"`);
        results.quizzesWithoutRelationships++;

        // Create relationships for all questions
        for (let i = 0; i < questionIds.length; i++) {
          const questionId = questionIds[i];

          // First, make sure the question exists in the database
          const questionExists = await executeSQL(
            `SELECT COUNT(*) FROM payload.quiz_questions WHERE id = $1`,
            [questionId],
          );

          if (parseInt(questionExists.rows[0].count) === 0) {
            console.warn(
              `Warning: Question with ID ${questionId} not found in database`,
            );
            continue;
          }

          try {
            // Create a new relationship entry with a unique UUID for the relationship ID
            const relationshipId = generateUUID();
            await executeSQL(
              `INSERT INTO payload.course_quizzes_rels 
                (id, _parent_id, path, field, "order", quiz_questions_id)
               VALUES 
                ($1, $2, 'questions', 'questions', $3, $4)`,
              [relationshipId, quiz.id, i, questionId],
            );
            console.log(
              `Created relationship for question ${questionId} at order ${i}`,
            );
          } catch (error) {
            console.error(
              `Error creating relationship for question ${questionId}: ${error}`,
            );

            // Check if this is a duplicate key error, if so try to update instead
            if (error.message && error.message.includes('duplicate key')) {
              try {
                await executeSQL(
                  `UPDATE payload.course_quizzes_rels
                   SET "order" = $3
                   WHERE id = $1 AND _parent_id = $2 AND path = 'questions'`,
                  [questionId, quiz.id, i],
                );
                console.log(
                  `Updated existing relationship for question ${questionId} to order ${i}`,
                );
              } catch (updateError) {
                console.error(
                  `Error updating relationship for question ${questionId}: ${updateError}`,
                );
              }
            }
          }
        }

        // Skip updating the questions array in the quiz record
        // The column doesn't exist in the course_quizzes table
        console.log(
          `Skipping questions array update as the column doesn't exist`,
        );

        results.quizzesFixed++;
        results.fixedQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          questionsAdded: questionIds.length,
        });
      }
      // If relations exist but are different from what's defined, update them
      else if (
        existingRelEntries.length !== questionIds.length ||
        !areOrderedArraysEqual(
          existingRelEntries.map((r) => r.id),
          questionIds,
        )
      ) {
        console.log(`Updating relationship entries for quiz "${quiz.title}"`);

        // List out the differences for debugging
        console.log(
          `Existing relationships: ${existingRelEntries.map((r) => r.id).join(', ')}`,
        );
        console.log(`Defined questions: ${questionIds.join(', ')}`);

        // Delete existing relationships
        await executeSQL(
          `DELETE FROM payload.course_quizzes_rels
           WHERE _parent_id = $1 AND path = 'questions'`,
          [quiz.id],
        );
        console.log(
          `Deleted ${existingRelEntries.length} existing relationships`,
        );

        // Create new relationships
        for (let i = 0; i < questionIds.length; i++) {
          const questionId = questionIds[i];

          // First, make sure the question exists in the database
          const questionExists = await executeSQL(
            `SELECT COUNT(*) FROM payload.quiz_questions WHERE id = $1`,
            [questionId],
          );

          if (parseInt(questionExists.rows[0].count) === 0) {
            console.warn(
              `Warning: Question with ID ${questionId} not found in database`,
            );
            continue;
          }

          try {
            // Create a new relationship entry with a unique UUID for the relationship ID
            const relationshipId = generateUUID();
            await executeSQL(
              `INSERT INTO payload.course_quizzes_rels 
                (id, _parent_id, path, field, "order", quiz_questions_id)
               VALUES 
                ($1, $2, 'questions', 'questions', $3, $4)`,
              [relationshipId, quiz.id, i, questionId],
            );
            console.log(
              `Created relationship for question ${questionId} at order ${i}`,
            );
          } catch (error) {
            console.error(
              `Error creating relationship for question ${questionId}: ${error}`,
            );
          }
        }

        // Skip updating the questions array in the quiz record
        // The column doesn't exist in the course_quizzes table
        console.log(
          `Skipping questions array update as the column doesn't exist`,
        );

        results.quizzesFixed++;
        results.fixedQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          questionsAdded: questionIds.length,
        });
      } else {
        console.log(
          `Quiz "${quiz.title}" already has correct relationship entries`,
        );
      }
    }

    // Verify all quizzes have relationships
    console.log('Verifying relationships...');
    const verificationResult = await executeSQL(`
      SELECT cq.id, cq.title, COUNT(r.id) AS relationship_count
      FROM payload.course_quizzes cq
      LEFT JOIN payload.course_quizzes_rels r ON cq.id = r._parent_id AND r.path = 'questions'
      GROUP BY cq.id, cq.title
      HAVING COUNT(r.id) = 0
      ORDER BY cq.title
    `);

    if (verificationResult.rows.length > 0) {
      console.warn(
        `${verificationResult.rows.length} quizzes still have no relationships:`,
      );
      for (const quiz of verificationResult.rows) {
        console.warn(`- ${quiz.title} (${quiz.id})`);
      }
    } else {
      console.log('All quizzes now have relationships!');
    }

    // Commit the transaction
    await executeSQL('COMMIT');

    // Generate a report
    const report = generateReport(results);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the report to a file
    const reportFile = path.join(
      outputDir,
      'quiz-relationship-repair-corrected.md',
    );
    fs.writeFileSync(reportFile, report);

    console.log(
      `Quiz relationship repair completed. Report written to ${reportFile}`,
    );
    console.log(
      `Fixed ${results.quizzesFixed} quizzes with missing or incorrect relationships`,
    );

    return results;
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK');
    console.error('Error fixing quiz relationships:', error);
    throw error;
  }
}

function generateReport(results: any) {
  return `# Quiz Relationship Repair Report (Corrected Version)

## Summary

- Total Quizzes: ${results.totalQuizzes}
- Quizzes Fixed: ${results.quizzesFixed}
- Quizzes With No Relationships: ${results.quizzesWithoutRelationships}

## Fixed Quizzes

${results.fixedQuizzes
  .map(
    (quiz: any) =>
      `- **${quiz.title}** (${quiz.id}): Added ${quiz.questionsAdded} questions`,
  )
  .join('\n')}

## Problem Quizzes

${
  results.errorQuizzes.length > 0
    ? results.errorQuizzes
        .map((quiz: any) => `- **${quiz.title}** (${quiz.id}): ${quiz.reason}`)
        .join('\n')
    : '- None'
}
`;
}

// More accurate array comparison that preserves order
function areOrderedArraysEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
}

// Run the repair
fixQuizRelationships().catch((error) => {
  console.error('Critical error during quiz relationship repair:', error);
  process.exit(1);
});
