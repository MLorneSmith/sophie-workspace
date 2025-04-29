/**
 * Enhanced Quiz Paths and Bidirectional Relationships Fix
 *
 * This script fixes the following critical issues:
 * 1. Removes duplicate relationship records
 * 2. Sets path = 'questions' for all records in course_quizzes_rels where it's NULL
 * 3. Creates bidirectional relationships in quiz_questions_rels
 * 4. Normalizes questions arrays to match relationship records
 */
import fs from 'fs';
import path from 'path';

import { executeSQL } from '../../../utils/db/execute-sql.js';

interface VerificationResult {
  quizCount: number;
  quizRelCount: number;
  questionRelCount: number;
  pathNullCount: number;
  duplicateCount: number;
  mismatchedArrayCount: number;
  matchingCount: boolean;
  missingQuizRels: any[];
  missingQuestionRels: any[];
}

/**
 * Main function to fix quiz paths and bidirectional relationships
 */
export async function enhancedQuizPathsAndRelationships(): Promise<{
  duplicatesRemoved: number;
  pathsFixed: number;
  relationshipsCreated: number;
  arraysNormalized: number;
  verificationResult: VerificationResult;
}> {
  console.log('Starting enhanced quiz paths and relationships fix...');

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
    console.log(
      `- Duplicate relationship records: ${initialState.duplicateCount}`,
    );
    console.log(
      `- Quizzes with mismatched arrays: ${initialState.mismatchedArrayCount}`,
    );

    // Step 1: Remove duplicate relationship records
    console.log('Removing duplicate relationship records...');

    const dedupeResult = await executeSQL(`
      DELETE FROM payload.course_quizzes_rels a
      WHERE a.ctid <> (
        SELECT min(b.ctid) 
        FROM payload.course_quizzes_rels b 
        WHERE a._parent_id = b._parent_id 
          AND a.quiz_questions_id = b.quiz_questions_id
      )
      RETURNING id;
    `);

    const duplicatesRemoved = dedupeResult.rowCount || 0;
    console.log(
      `Removed ${duplicatesRemoved} duplicate records from course_quizzes_rels`,
    );

    // Step 2: Fix NULL paths in course_quizzes_rels
    console.log('Fixing NULL paths in course_quizzes_rels...');

    const updateResult = await executeSQL(`
      UPDATE payload.course_quizzes_rels 
      SET path = 'questions' 
      WHERE field = 'questions' AND path IS NULL
      RETURNING id;
    `);

    const pathsFixed = updateResult.rowCount || 0;
    console.log(`Fixed path for ${pathsFixed} records in course_quizzes_rels`);

    // Step 3: Create bidirectional relationships in quiz_questions_rels
    console.log('Creating missing bidirectional relationships...');

    const insertResult = await executeSQL(`
      INSERT INTO payload.quiz_questions_rels (id, _parent_id, path, field, "order", course_quizzes_id)
      SELECT
        gen_random_uuid()::text as id,
        cqr.quiz_questions_id as _parent_id,
        'quizzes' as path,
        'quizzes' as field,
        0 as "order",
        cqr._parent_id as course_quizzes_id
      FROM
        (SELECT DISTINCT _parent_id, quiz_questions_id FROM payload.course_quizzes_rels WHERE quiz_questions_id IS NOT NULL) cqr
      WHERE
        NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = cqr.quiz_questions_id AND qr.course_quizzes_id = cqr._parent_id
        )
      RETURNING id;
    `);

    const relationshipsCreated = insertResult.rowCount || 0;
    console.log(
      `Created ${relationshipsCreated} bidirectional relationships in quiz_questions_rels`,
    );

    // Step 4: Normalize questions arrays to match relationship records
    console.log(
      'Normalizing questions arrays to match relationship records...',
    );

    // First, create a temporary function to help with JSON formatting
    await executeSQL(`
      CREATE OR REPLACE FUNCTION temp_format_question_array(question_ids text[])
      RETURNS jsonb AS $$
      DECLARE
        result jsonb;
      BEGIN
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', gen_random_uuid()::text,
            'relationTo', 'quiz_questions',
            'value', jsonb_build_object('id', q)
          )
        ) INTO result
        FROM unnest(question_ids) as q;
        
        RETURN COALESCE(result, '[]'::jsonb);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Then update the questions arrays
    const normalizeResult = await executeSQL(`
      WITH quiz_questions AS (
        SELECT 
          _parent_id as quiz_id, 
          array_agg(DISTINCT quiz_questions_id ORDER BY quiz_questions_id) as question_ids
        FROM 
          payload.course_quizzes_rels
        WHERE 
          field = 'questions'
          AND quiz_questions_id IS NOT NULL
        GROUP BY 
          _parent_id
      )
      UPDATE payload.course_quizzes cq
      SET questions = temp_format_question_array(qq.question_ids)
      FROM quiz_questions qq
      WHERE cq.id::text = qq.quiz_id::text
      RETURNING cq.id;
    `);

    // Clean up the temporary function
    await executeSQL(`DROP FUNCTION IF EXISTS temp_format_question_array;`);

    const arraysNormalized = normalizeResult.rowCount || 0;
    console.log(`Normalized questions arrays for ${arraysNormalized} quizzes`);

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
    console.log(
      `- Duplicate relationship records: ${finalState.duplicateCount}`,
    );
    console.log(
      `- Quizzes with mismatched arrays: ${finalState.mismatchedArrayCount}`,
    );

    if (
      finalState.pathNullCount === 0 &&
      finalState.matchingCount &&
      finalState.duplicateCount === 0 &&
      finalState.mismatchedArrayCount === 0
    ) {
      console.log(
        '✅ All issues have been fixed! Path fields, relationship tables, and questions arrays are now correct.',
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

      if (finalState.duplicateCount > 0) {
        console.warn(
          `- ${finalState.duplicateCount} duplicate relationship records still exist`,
        );
      }

      if (finalState.mismatchedArrayCount > 0) {
        console.warn(
          `- ${finalState.mismatchedArrayCount} quizzes still have mismatched question arrays`,
        );
      }
    }

    // Generate a report
    const report = generateReport({
      duplicatesRemoved,
      pathsFixed,
      relationshipsCreated,
      arraysNormalized,
      initialState,
      finalState,
    });

    // Save the report
    const outputDir = path.join(process.cwd(), 'z.plan', 'quizzes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFile = path.join(outputDir, 'enhanced-quiz-fix-report.md');
    fs.writeFileSync(reportFile, report);
    console.log(`Report saved to: ${reportFile}`);

    // Commit the transaction
    await executeSQL('COMMIT');

    return {
      duplicatesRemoved,
      pathsFixed,
      relationshipsCreated,
      arraysNormalized,
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
    WHERE path = 'quizzes'
  `);
  const questionRelCount = parseInt(questionRelResult.rows[0].count);

  // Count duplicate relationships
  const duplicateResult = await executeSQL(`
    SELECT COUNT(*) FROM (
      SELECT _parent_id, quiz_questions_id, COUNT(*)
      FROM payload.course_quizzes_rels
      WHERE field = 'questions'
      GROUP BY _parent_id, quiz_questions_id
      HAVING COUNT(*) > 1
    ) as dupes
  `);
  const duplicateCount = parseInt(duplicateResult.rows[0].count);

  // Check for mismatched arrays
  const mismatchedArraysResult = await executeSQL(`
    WITH array_counts AS (
      SELECT 
        cq.id::text as quiz_id, 
        cq.title,
        CASE WHEN jsonb_typeof(cq.questions) = 'array' 
          THEN jsonb_array_length(cq.questions) 
          ELSE 0 
        END as array_count,
        (
          SELECT COUNT(DISTINCT quiz_questions_id) 
          FROM payload.course_quizzes_rels rel 
          WHERE rel._parent_id = cq.id::text AND rel.field = 'questions'
        ) as rel_count
      FROM 
        payload.course_quizzes cq
    )
    SELECT COUNT(*) FROM array_counts
    WHERE array_count != rel_count
  `);
  const mismatchedArrayCount = parseInt(mismatchedArraysResult.rows[0].count);

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
          AND qr.course_quizzes_id = cqr._parent_id
          AND qr.path = 'quizzes'
      )
    LIMIT 10
  `);

  // Find missing relationships in course_quizzes_rels
  const missingQuizRelsResult = await executeSQL(`
    SELECT 
      qr._parent_id as question_id,
      qr.course_quizzes_id as quiz_id
    FROM 
      payload.quiz_questions_rels qr
    WHERE
      qr.course_quizzes_id IS NOT NULL
      AND qr.path = 'quizzes'
      AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels cqr
        WHERE cqr._parent_id = qr.course_quizzes_id 
          AND cqr.quiz_questions_id = qr._parent_id
          AND cqr.field = 'questions'
      )
    LIMIT 10
  `);

  return {
    quizCount,
    quizRelCount,
    questionRelCount,
    pathNullCount,
    duplicateCount,
    mismatchedArrayCount,
    matchingCount:
      quizRelCount === questionRelCount &&
      missingQuestionRelsResult.rows.length === 0 &&
      missingQuizRelsResult.rows.length === 0,
    missingQuizRels: missingQuizRelsResult.rows,
    missingQuestionRels: missingQuestionRelsResult.rows,
  };
}

/**
 * Generate a Markdown report
 */
function generateReport(data: any): string {
  const {
    duplicatesRemoved,
    pathsFixed,
    relationshipsCreated,
    arraysNormalized,
    initialState,
    finalState,
  } = data;

  return `# Enhanced Quiz Paths and Relationships Fix Report

## Summary

- **Duplicate Records Removed:** ${duplicatesRemoved}
- **Path Fields Fixed:** ${pathsFixed}
- **Bidirectional Relationships Created:** ${relationshipsCreated}
- **Question Arrays Normalized:** ${arraysNormalized}
- **Quizzes in Database:** ${finalState.quizCount}

## Initial State

- Quiz → Question Relationships: ${initialState.quizRelCount}
- Question → Quiz Relationships: ${initialState.questionRelCount}
- Records with NULL path: ${initialState.pathNullCount}
- Duplicate Relationship Records: ${initialState.duplicateCount}
- Quizzes with Mismatched Arrays: ${initialState.mismatchedArrayCount}
- Bidirectional Consistency: ${initialState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}

## Final State

- Quiz → Question Relationships: ${finalState.quizRelCount}
- Question → Quiz Relationships: ${finalState.questionRelCount}
- Records with NULL path: ${finalState.pathNullCount}
- Duplicate Relationship Records: ${finalState.duplicateCount}
- Quizzes with Mismatched Arrays: ${finalState.mismatchedArrayCount}
- Bidirectional Consistency: ${finalState.matchingCount ? '✅ Consistent' : '❌ Inconsistent'}

## Details

${
  finalState.pathNullCount === 0 &&
  finalState.matchingCount &&
  finalState.duplicateCount === 0 &&
  finalState.mismatchedArrayCount === 0
    ? '✅ All issues have been fixed. Path fields, relationship tables, and questions arrays are now correct.'
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

${
  finalState.duplicateCount > 0
    ? `### Duplicate Records\n\n${finalState.duplicateCount} duplicate relationship records still exist.`
    : ''
}

${
  finalState.mismatchedArrayCount > 0
    ? `### Mismatched Arrays\n\n${finalState.mismatchedArrayCount} quizzes still have array lengths that don't match their relationship records.`
    : ''
}

## Fix Implementation

The fix was implemented in four steps:

### 1. Removing duplicate relationship records

\`\`\`sql
DELETE FROM payload.course_quizzes_rels a
WHERE a.ctid <> (
  SELECT min(b.ctid) 
  FROM payload.course_quizzes_rels b 
  WHERE a._parent_id = b._parent_id 
    AND a.quiz_questions_id = b.quiz_questions_id
);
\`\`\`

### 2. Setting path fields for NULL records

\`\`\`sql
UPDATE payload.course_quizzes_rels 
SET path = 'questions' 
WHERE field = 'questions' AND path IS NULL;
\`\`\`

### 3. Creating bidirectional relationships

\`\`\`sql
INSERT INTO payload.quiz_questions_rels (id, _parent_id, path, field, "order", course_quizzes_id)
SELECT
  gen_random_uuid()::text as id,
  cqr.quiz_questions_id as _parent_id,
  'quizzes' as path,
  'quizzes' as field,
  0 as "order",
  cqr._parent_id as course_quizzes_id
FROM
  (SELECT DISTINCT _parent_id, quiz_questions_id FROM payload.course_quizzes_rels WHERE quiz_questions_id IS NOT NULL) cqr
WHERE
  NOT EXISTS (
    SELECT 1 FROM payload.quiz_questions_rels qr
    WHERE qr._parent_id = cqr.quiz_questions_id AND qr.course_quizzes_id = cqr._parent_id
  );
\`\`\`

### 4. Normalizing questions arrays to match relationship records

\`\`\`sql
WITH quiz_questions AS (
  SELECT 
    _parent_id as quiz_id, 
    array_agg(DISTINCT quiz_questions_id ORDER BY quiz_questions_id) as question_ids
  FROM 
    payload.course_quizzes_rels
  WHERE 
    field = 'questions'
    AND quiz_questions_id IS NOT NULL
  GROUP BY 
    _parent_id
)
UPDATE payload.course_quizzes cq
SET questions = temp_format_question_array(qq.question_ids)
FROM quiz_questions qq
WHERE cq.id::text = qq.quiz_id::text;
\`\`\`

This enhanced fix addresses all the identified issues:
1. Duplicate relationship records are removed
2. NULL path values are set correctly
3. Bidirectional relationships are established
4. Questions arrays are normalized to match relationship records

These changes together resolve the Payload CMS API 404 errors and ensure consistent quiz data representation.
`;
}

// Run the fix if executed directly
if (require.main === module) {
  enhancedQuizPathsAndRelationships()
    .then((result) => {
      console.log(`
Enhanced quiz paths and relationships fix completed successfully!
- Removed ${result.duplicatesRemoved} duplicate records
- Fixed ${result.pathsFixed} NULL path fields
- Created ${result.relationshipsCreated} bidirectional relationships
- Normalized ${result.arraysNormalized} question arrays
`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(
        'Error in enhanced quiz paths and relationships fix:',
        error,
      );
      process.exit(1);
    });
}

export default enhancedQuizPathsAndRelationships;
