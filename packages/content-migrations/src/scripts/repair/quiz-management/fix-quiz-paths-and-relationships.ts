/**
 * Fix Quiz Paths and Bidirectional Relationships
 *
 * This script fixes two critical issues:
 * 1. Sets path = 'questions' for all records in course_quizzes_rels where it's NULL
 * 2. Creates bidirectional relationships in quiz_questions_rels
 */
import fs from 'fs';
import path from 'path';

import { executeSQL } from '../../../utils/db/execute-sql.js';

interface VerificationResult {
  quizCount: number;
  quizRelCount: number;
  questionRelCount: number;
  pathNullCount: number;
  matchingCount: boolean;
  missingQuizRels: any[];
  missingQuestionRels: any[];
}

/**
 * Main function to fix quiz paths and bidirectional relationships
 */
export async function fixQuizPathsAndRelationships(): Promise<{
  pathsFixed: number;
  relationshipsCreated: number;
  verificationResult: VerificationResult;
}> {
  console.log('Starting quiz paths and bidirectional relationship fix...');

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
    console.log(
      `- course_quizzes_rels with NULL path: ${initialState.pathNullCount}`,
    );

    // Step 1: Fix NULL paths in course_quizzes_rels
    console.log('Fixing NULL paths in course_quizzes_rels...');

    const updateResult = await executeSQL(`
      UPDATE payload.course_quizzes_rels 
      SET path = 'questions' 
      WHERE field = 'questions' AND path IS NULL
      RETURNING id;
    `);

    const pathsFixed = updateResult.rowCount || 0;
    console.log(`Fixed path for ${pathsFixed} records in course_quizzes_rels`);

    // Step 2: Create bidirectional relationships in quiz_questions_rels
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
    console.log(
      `- course_quizzes_rels with NULL path: ${finalState.pathNullCount}`,
    );

    if (finalState.pathNullCount === 0 && finalState.matchingCount) {
      console.log(
        '✅ Both path fields and bidirectional relationships are now fixed!',
      );
    } else {
      console.warn('⚠️ Some issues still remain after the fix:');

      if (finalState.pathNullCount > 0) {
        console.warn(
          `- ${finalState.pathNullCount} records in course_quizzes_rels still have NULL path`,
        );
      }

      if (!finalState.matchingCount) {
        console.warn(
          `- Relationship counts still don't match: ${finalState.quizRelCount} vs ${finalState.questionRelCount}`,
        );
      }
    }

    // Generate a report
    const report = generateReport({
      pathsFixed,
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
      'quiz-paths-and-relationships-fix-report.md',
    );
    fs.writeFileSync(reportFile, report);
    console.log(`Report saved to: ${reportFile}`);

    // Commit the transaction
    await executeSQL('COMMIT');

    return {
      pathsFixed,
      relationshipsCreated,
      verificationResult: finalState,
    };
  } catch (error) {
    // Rollback on error
    await executeSQL('ROLLBACK');
    console.error('Error fixing quiz paths and relationships:', error);
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

  // Get count of NULL paths in course_quizzes_rels
  const nullPathResult = await executeSQL(`
    SELECT COUNT(*) FROM payload.course_quizzes_rels
    WHERE field = 'questions' AND path IS NULL
  `);
  const pathNullCount = parseInt(nullPathResult.rows[0].count);

  // Get count of relationships in course_quizzes_rels
  const quizRelResult = await executeSQL(`
    SELECT COUNT(*) FROM payload.course_quizzes_rels
    WHERE field = 'questions'
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
      AND cqr.field = 'questions'
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
          AND cqr.field = 'questions'
      )
  `);

  return {
    quizCount,
    quizRelCount,
    questionRelCount,
    pathNullCount,
    matchingCount: quizRelCount === questionRelCount,
    missingQuizRels: missingQuizRelsResult.rows,
    missingQuestionRels: missingQuestionRelsResult.rows,
  };
}

/**
 * Generate a Markdown report
 */
function generateReport(data: any): string {
  const { pathsFixed, relationshipsCreated, initialState, finalState } = data;

  return `# Quiz Paths and Relationships Fix Report

## Summary

- **Path Fields Fixed:** ${pathsFixed}
- **Bidirectional Relationships Created:** ${relationshipsCreated}
- **Quizzes in Database:** ${finalState.quizCount}

## Initial State

- Quiz → Question Relationships: ${initialState.quizRelCount}
- Question → Quiz Relationships: ${initialState.questionRelCount}
- Records with NULL path: ${initialState.pathNullCount}
- Bidirectional Consistency: ${initialState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}

## Final State

- Quiz → Question Relationships: ${finalState.quizRelCount}
- Question → Quiz Relationships: ${finalState.questionRelCount}
- Records with NULL path: ${finalState.pathNullCount}
- Bidirectional Consistency: ${finalState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}

## Details

${
  finalState.pathNullCount === 0 && finalState.matchingCount
    ? '✅ All issues have been fixed. Both path fields and bidirectional relationships are now correct.'
    : '⚠️ Some issues still remain after the fix.'
}

${
  finalState.pathNullCount > 0
    ? `### NULL Path Issues\n\n${finalState.pathNullCount} records in course_quizzes_rels still have NULL path.`
    : ''
}

${
  !finalState.matchingCount
    ? `### Relationship Count Mismatch\n\nRelationship counts still don't match: ${finalState.quizRelCount} (quiz→question) vs ${finalState.questionRelCount} (question→quiz).`
    : ''
}

## Fix Implementation

The fix was implemented in two steps:

### 1. Setting path fields for NULL records

\`\`\`sql
UPDATE payload.course_quizzes_rels 
SET path = 'questions' 
WHERE field = 'questions' AND path IS NULL
\`\`\`

### 2. Creating bidirectional relationships

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

This fix addresses both the NULL path issue and the missing bidirectional relationships, which were causing Payload CMS API 404 errors.
`;
}

// Run the fix if executed directly
if (require.main === module) {
  fixQuizPathsAndRelationships()
    .then((result) => {
      console.log(`
Quiz paths and relationships fix completed successfully!
- Fixed ${result.pathsFixed} NULL path fields
- Created ${result.relationshipsCreated} bidirectional relationships
`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in quiz paths and relationships fix:', error);
      process.exit(1);
    });
}
