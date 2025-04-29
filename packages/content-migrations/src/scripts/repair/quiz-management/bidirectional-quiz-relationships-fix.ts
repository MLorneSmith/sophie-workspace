/**
 * Fix Bidirectional Quiz Relationships
 *
 * This script fixes the bidirectional relationships between quizzes and questions.
 * It populates the quiz_questions_rels table based on existing entries in course_quizzes_rels.
 *
 * The issue: While course_quizzes_rels contains entries (quiz → question),
 * quiz_questions_rels is empty, breaking the bidirectional relationship needed by Payload CMS.
 */
import fs from 'fs';
import path from 'path';

import { executeSQL } from '../../../utils/db/execute-sql.js';

interface VerificationResult {
  quizCount: number;
  quizRelCount: number;
  questionRelCount: number;
  matchingCount: boolean;
  missingQuizRels: any[];
  missingQuestionRels: any[];
}

/**
 * Main function to fix bidirectional quiz relationships
 */
export async function fixBidirectionalQuizRelationships(): Promise<{
  relationshipsCreated: number;
  verificationResult: VerificationResult;
}> {
  console.log('Starting bidirectional quiz relationship fix...');

  try {
    // Start a transaction for database consistency
    await executeSQL('BEGIN');

    // First, check current state of relationship tables
    const initialState = await verifyRelationshipConsistency();

    console.log('Initial state:');
    console.log(`- Quizzes: ${initialState.quizCount}`);
    console.log(`- course_quizzes_rels entries: ${initialState.quizRelCount}`);
    console.log(
      `- quiz_questions_rels entries: ${initialState.questionRelCount}`,
    );

    if (initialState.matchingCount) {
      console.log(
        'Relationship tables already have matching counts. Skipping fix.',
      );
      await executeSQL('COMMIT');
      return {
        relationshipsCreated: 0,
        verificationResult: initialState,
      };
    }

    // Execute the SQL to populate quiz_questions_rels based on course_quizzes_rels
    console.log('Creating missing bidirectional relationships...');

    const insertResult = await executeSQL(`
      INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid()::text as id, 
        cqr.quiz_questions_id as _parent_id, 
        'quiz_id', 
        cqr._parent_id,
        NOW(),
        NOW()
      FROM
        payload.course_quizzes_rels cqr
      WHERE
        cqr.quiz_questions_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = cqr.quiz_questions_id 
          AND qr.field = 'quiz_id'
          AND qr.value = cqr._parent_id
        )
      RETURNING id;
    `);

    const relationshipsCreated = insertResult.rowCount || 0;
    console.log(
      `Created ${relationshipsCreated} bidirectional relationships in quiz_questions_rels`,
    );

    // Verify the fix worked
    const finalState = await verifyRelationshipConsistency();

    console.log('Final state:');
    console.log(`- Quizzes: ${finalState.quizCount}`);
    console.log(`- course_quizzes_rels entries: ${finalState.quizRelCount}`);
    console.log(
      `- quiz_questions_rels entries: ${finalState.questionRelCount}`,
    );

    if (finalState.matchingCount) {
      console.log('✅ Bidirectional relationships are now consistent!');
    } else {
      console.warn('⚠️ Relationship tables still have inconsistencies.');
      console.warn(
        `Missing quiz_questions_rels entries: ${finalState.missingQuestionRels.length}`,
      );

      // Log details about any remaining inconsistencies
      if (finalState.missingQuestionRels.length > 0) {
        console.warn('Missing question relationships:');
        finalState.missingQuestionRels.slice(0, 5).forEach((rel) => {
          console.warn(
            `- Quiz ID: ${rel.quiz_id}, Question ID: ${rel.question_id}`,
          );
        });

        if (finalState.missingQuestionRels.length > 5) {
          console.warn(
            `... and ${finalState.missingQuestionRels.length - 5} more`,
          );
        }
      }
    }

    // Generate a report
    const report = generateReport({
      relationshipsCreated,
      initialState,
      finalState,
    });

    // Save the report
    const outputDir = path.join(process.cwd(), 'z.plan', 'quizzes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFile = path.join(
      outputDir,
      'bidirectional-relationship-fix-report.md',
    );
    fs.writeFileSync(reportFile, report);
    console.log(`Report saved to: ${reportFile}`);

    // Commit the transaction
    await executeSQL('COMMIT');

    return {
      relationshipsCreated,
      verificationResult: finalState,
    };
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK');
    console.error('Error fixing bidirectional quiz relationships:', error);
    throw error;
  }
}

/**
 * Verify the consistency between course_quizzes_rels and quiz_questions_rels
 */
async function verifyRelationshipConsistency(): Promise<VerificationResult> {
  // Get count of quizzes
  const quizResult = await executeSQL(`
    SELECT COUNT(*) FROM payload.course_quizzes
  `);
  const quizCount = parseInt(quizResult.rows[0].count);

  // Get count of relationships in course_quizzes_rels
  const quizRelResult = await executeSQL(`
    SELECT COUNT(*) FROM payload.course_quizzes_rels
    WHERE path = 'questions'
  `);
  const quizRelCount = parseInt(quizRelResult.rows[0].count);

  // Get count of relationships in quiz_questions_rels
  const questionRelResult = await executeSQL(`
    SELECT COUNT(*) FROM payload.quiz_questions_rels
    WHERE field = 'quiz_id'
  `);
  const questionRelCount = parseInt(questionRelResult.rows[0].count);

  // Find missing relationships in quiz_questions_rels
  const missingQuestionRelsResult = await executeSQL(`
    SELECT 
      cqr._parent_id as quiz_id,
      cqr.quiz_questions_id as question_id
    FROM 
      payload.course_quizzes_rels cqr
    WHERE
      cqr.quiz_questions_id IS NOT NULL
      AND cqr.path = 'questions'
      AND NOT EXISTS (
        SELECT 1 FROM payload.quiz_questions_rels qr
        WHERE qr._parent_id = cqr.quiz_questions_id 
          AND qr.field = 'quiz_id'
          AND qr.value = cqr._parent_id
      )
  `);

  // Find missing relationships in course_quizzes_rels
  const missingQuizRelsResult = await executeSQL(`
    SELECT 
      qr._parent_id as question_id,
      qr.value as quiz_id
    FROM 
      payload.quiz_questions_rels qr
    WHERE
      qr.value IS NOT NULL
      AND qr.field = 'quiz_id'
      AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels cqr
        WHERE cqr._parent_id = qr.value 
          AND cqr.quiz_questions_id = qr._parent_id
          AND cqr.path = 'questions'
      )
  `);

  return {
    quizCount,
    quizRelCount,
    questionRelCount,
    matchingCount: quizRelCount === questionRelCount,
    missingQuizRels: missingQuizRelsResult.rows,
    missingQuestionRels: missingQuestionRelsResult.rows,
  };
}

/**
 * Generate a Markdown report
 */
function generateReport(data: any): string {
  const { relationshipsCreated, initialState, finalState } = data;

  return `# Bidirectional Quiz Relationship Fix Report

## Summary

- **Relationships Created:** ${relationshipsCreated}
- **Quizzes in Database:** ${finalState.quizCount}
- **Initial State:**
  - Quiz → Question Relationships: ${initialState.quizRelCount}
  - Question → Quiz Relationships: ${initialState.questionRelCount}
  - Bidirectional Consistency: ${initialState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}
- **Final State:**
  - Quiz → Question Relationships: ${finalState.quizRelCount}
  - Question → Quiz Relationships: ${finalState.questionRelCount}
  - Bidirectional Consistency: ${finalState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}

## Details

${
  finalState.matchingCount
    ? '✅ All relationships are now bidirectional. The quiz_questions_rels table is properly populated.'
    : `⚠️ There are still ${finalState.missingQuestionRels.length} missing quiz_questions_rels entries.`
}

${
  finalState.missingQuestionRels.length > 0
    ? `
### Missing Question Relationships

The following quiz-question relationships still need to be fixed:

${finalState.missingQuestionRels
  .slice(0, 10)
  .map((rel) => `- Quiz ID: ${rel.quiz_id}, Question ID: ${rel.question_id}`)
  .join('\n')}
${finalState.missingQuestionRels.length > 10 ? `\n... and ${finalState.missingQuestionRels.length - 10} more` : ''}
`
    : ''
}

## Fix Implementation

The fix was implemented using the following SQL:

\`\`\`sql
INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
SELECT
  gen_random_uuid()::text as id,
  cqr.quiz_questions_id as _parent_id,
  'quiz_id',
  cqr._parent_id,
  NOW(),
  NOW()
FROM
  payload.course_quizzes_rels cqr
WHERE
  cqr.quiz_questions_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payload.quiz_questions_rels qr
    WHERE qr._parent_id = cqr.quiz_questions_id 
    AND qr.field = 'quiz_id'
    AND qr.value = cqr._parent_id
  );
\`\`\`

This SQL creates the missing bidirectional relationships by:
1. Taking each entry in course_quizzes_rels (quiz → question)
2. Creating a corresponding entry in quiz_questions_rels (question → quiz)
3. Only adding entries that don't already exist
`;
}

// Run the fix if executed directly
if (require.main === module) {
  fixBidirectionalQuizRelationships()
    .then((result) => {
      console.log(`
Bidirectional quiz relationship fix completed successfully!
Created ${result.relationshipsCreated} relationships.
`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in bidirectional quiz relationship fix:', error);
      process.exit(1);
    });
}
