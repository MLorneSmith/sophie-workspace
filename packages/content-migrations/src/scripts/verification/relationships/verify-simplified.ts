/**
 * Simplified Relationship Verification
 *
 * This module provides a simplified version of relationship verification that doesn't
 * rely on direct fields that may not exist in the schema.
 */
import { executeSQL } from '../../../utils/db/execute-sql.js';
import { VerificationResult } from '../../repair/relationships/core/types.js';
import { formatLogMessage } from '../../repair/relationships/core/utils.js';

/**
 * Main function to verify all relationships with simplified approach
 *
 * @returns Comprehensive verification result
 */
export async function verifyAllRelationships(): Promise<VerificationResult> {
  console.log('Starting simplified relationship verification...');

  const result: VerificationResult = {
    totalRelationships: 0,
    checkedRelationships: 0,
    inconsistentRelationships: [],
    summary: {
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
    },
  };

  try {
    // Verify quiz-question relationships
    await verifyQuizQuestionRelationships(result);

    // Verify lesson-quiz relationships
    await verifyLessonQuizRelationships(result);

    // Verify survey-question relationships
    await verifySurveyQuestionRelationships(result);

    // Verify download relationships
    await verifyDownloadRelationships(result);

    // Calculate summary stats
    result.summary.passedCount =
      result.checkedRelationships -
      result.inconsistentRelationships.reduce(
        (sum, issue) => sum + issue.count,
        0,
      );

    result.summary.failedCount =
      result.checkedRelationships - result.summary.passedCount;

    result.summary.passRate =
      result.checkedRelationships > 0
        ? (result.summary.passedCount / result.checkedRelationships) * 100
        : 0;

    // Print summary report
    console.log(formatLogMessage('Relationship Verification Summary:', 'info'));
    console.log(`- Total relationships: ${result.totalRelationships}`);
    console.log(`- Checked relationships: ${result.checkedRelationships}`);
    console.log(
      `- Passed: ${result.summary.passedCount} (${result.summary.passRate.toFixed(2)}%)`,
    );
    console.log(`- Failed: ${result.summary.failedCount}`);

    if (result.inconsistentRelationships.length > 0) {
      console.log('\nInconsistent Relationships:');
      for (const issue of result.inconsistentRelationships) {
        console.log(
          `- ${issue.collection}.${issue.field} -> ${issue.targetCollection}: ` +
            `${issue.issueType} (count: ${issue.count})`,
        );
      }
    }

    return result;
  } catch (error) {
    console.error('Error verifying relationships:', error);
    throw error;
  }
}

/**
 * Verify quiz-question relationships using only relationship tables
 *
 * @param result Verification result to update
 * @returns Updated verification result
 */
async function verifyQuizQuestionRelationships(
  result: VerificationResult,
): Promise<VerificationResult> {
  console.log('Verifying quiz-question relationships...');

  try {
    // Get the verification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_rel
      FROM 
        payload.course_quizzes_rels 
      WHERE 
        path = 'questions'
    `;

    const statsResult = await executeSQL(statsQuery);
    const totalCount = parseInt(statsResult.rows[0].total_rel) || 0;

    result.totalRelationships += totalCount;
    result.checkedRelationships += totalCount;

    // Run simplified verification query to check valid references
    const verificationQuery = `
      WITH 
      rel_questions AS (
        SELECT 
          parent_id as quiz_id,
          id as question_id
        FROM payload.course_quizzes_rels
        WHERE path = 'questions'
      ),
      invalid_questions AS (
        -- Check for questions that don't exist
        SELECT 
          rq.quiz_id,
          rq.question_id,
          'invalid_question_reference' as issue_type,
          COUNT(*) as count
        FROM rel_questions rq
        LEFT JOIN payload.quiz_questions qq 
        ON rq.question_id = qq.id
        WHERE qq.id IS NULL
        GROUP BY rq.quiz_id, rq.question_id, issue_type
        
        UNION ALL
        
        -- Check for quizzes that don't exist
        SELECT 
          rq.quiz_id,
          rq.question_id,
          'invalid_quiz_reference' as issue_type,
          COUNT(*) as count
        FROM rel_questions rq
        LEFT JOIN payload.course_quizzes q
        ON rq.quiz_id = q.id
        WHERE q.id IS NULL
        GROUP BY rq.quiz_id, rq.question_id, issue_type
      )
      SELECT 
        issue_type,
        SUM(count) as total_count
      FROM invalid_questions
      GROUP BY issue_type
    `;

    const verificationResult = await executeSQL(verificationQuery);

    if (verificationResult.rows.length > 0) {
      for (const row of verificationResult.rows) {
        result.inconsistentRelationships.push({
          collection: 'course_quizzes',
          field: 'questions',
          targetCollection: 'quiz_questions',
          issueType: row.issue_type,
          count: parseInt(row.total_count),
        });
      }

      console.log(
        formatLogMessage(
          `Quiz-Question relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`,
          'warn',
        ),
      );
    } else {
      console.log(
        formatLogMessage(
          'Quiz-Question relationships: No issues found',
          'info',
        ),
      );
    }

    return result;
  } catch (error) {
    console.error('Error verifying quiz-question relationships:', error);
    return result;
  }
}

/**
 * Verify lesson-quiz relationships using only relationship tables
 *
 * @param result Verification result to update
 * @returns Updated verification result
 */
async function verifyLessonQuizRelationships(
  result: VerificationResult,
): Promise<VerificationResult> {
  console.log('Verifying lesson-quiz relationships...');

  try {
    // Get the verification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_rel
      FROM 
        payload.course_lessons_rels 
      WHERE 
        path = 'quiz'
    `;

    const statsResult = await executeSQL(statsQuery);
    const totalCount = parseInt(statsResult.rows[0].total_rel) || 0;

    result.totalRelationships += totalCount;
    result.checkedRelationships += totalCount;

    // Run simplified verification query to check valid references
    const verificationQuery = `
      WITH 
      rel_quizzes AS (
        SELECT 
          parent_id as lesson_id,
          id as quiz_id
        FROM payload.course_lessons_rels
        WHERE path = 'quiz'
      ),
      invalid_references AS (
        -- Check for quizzes that don't exist
        SELECT 
          rq.lesson_id,
          rq.quiz_id,
          'invalid_quiz_reference' as issue_type,
          COUNT(*) as count
        FROM rel_quizzes rq
        LEFT JOIN payload.course_quizzes q
        ON rq.quiz_id = q.id
        WHERE q.id IS NULL
        GROUP BY rq.lesson_id, rq.quiz_id, issue_type
        
        UNION ALL
        
        -- Check for lessons that don't exist
        SELECT 
          rq.lesson_id,
          rq.quiz_id,
          'invalid_lesson_reference' as issue_type,
          COUNT(*) as count
        FROM rel_quizzes rq
        LEFT JOIN payload.course_lessons l
        ON rq.lesson_id = l.id
        WHERE l.id IS NULL
        GROUP BY rq.lesson_id, rq.quiz_id, issue_type
      )
      SELECT 
        issue_type,
        SUM(count) as total_count
      FROM invalid_references
      GROUP BY issue_type
    `;

    const verificationResult = await executeSQL(verificationQuery);

    if (verificationResult.rows.length > 0) {
      for (const row of verificationResult.rows) {
        result.inconsistentRelationships.push({
          collection: 'course_lessons',
          field: 'quiz',
          targetCollection: 'course_quizzes',
          issueType: row.issue_type,
          count: parseInt(row.total_count),
        });
      }

      console.log(
        formatLogMessage(
          `Lesson-Quiz relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`,
          'warn',
        ),
      );
    } else {
      console.log(
        formatLogMessage('Lesson-Quiz relationships: No issues found', 'info'),
      );
    }

    return result;
  } catch (error) {
    console.error('Error verifying lesson-quiz relationships:', error);
    return result;
  }
}

/**
 * Verify survey-question relationships using only relationship tables
 *
 * @param result Verification result to update
 * @returns Updated verification result
 */
async function verifySurveyQuestionRelationships(
  result: VerificationResult,
): Promise<VerificationResult> {
  console.log('Verifying survey-question relationships...');

  try {
    // Get the verification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_rel
      FROM 
        payload.surveys_rels 
      WHERE 
        path = 'questions'
    `;

    const statsResult = await executeSQL(statsQuery);
    const totalCount = parseInt(statsResult.rows[0].total_rel) || 0;

    result.totalRelationships += totalCount;
    result.checkedRelationships += totalCount;

    // Run simplified verification query to check valid references
    const verificationQuery = `
      WITH 
      rel_questions AS (
        SELECT 
          parent_id as survey_id,
          id as question_id
        FROM payload.surveys_rels
        WHERE path = 'questions'
      ),
      invalid_questions AS (
        -- Check for questions that don't exist
        SELECT 
          rq.survey_id,
          rq.question_id,
          'invalid_question_reference' as issue_type,
          COUNT(*) as count
        FROM rel_questions rq
        LEFT JOIN payload.survey_questions qq 
        ON rq.question_id = qq.id
        WHERE qq.id IS NULL
        GROUP BY rq.survey_id, rq.question_id, issue_type
        
        UNION ALL
        
        -- Check for surveys that don't exist
        SELECT 
          rq.survey_id,
          rq.question_id,
          'invalid_survey_reference' as issue_type,
          COUNT(*) as count
        FROM rel_questions rq
        LEFT JOIN payload.surveys s
        ON rq.survey_id = s.id
        WHERE s.id IS NULL
        GROUP BY rq.survey_id, rq.question_id, issue_type
      )
      SELECT 
        issue_type,
        SUM(count) as total_count
      FROM invalid_questions
      GROUP BY issue_type
    `;

    const verificationResult = await executeSQL(verificationQuery);

    if (verificationResult.rows.length > 0) {
      for (const row of verificationResult.rows) {
        result.inconsistentRelationships.push({
          collection: 'surveys',
          field: 'questions',
          targetCollection: 'survey_questions',
          issueType: row.issue_type,
          count: parseInt(row.total_count),
        });
      }

      console.log(
        formatLogMessage(
          `Survey-Question relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`,
          'warn',
        ),
      );
    } else {
      console.log(
        formatLogMessage(
          'Survey-Question relationships: No issues found',
          'info',
        ),
      );
    }

    return result;
  } catch (error) {
    console.error('Error verifying survey-question relationships:', error);
    return result;
  }
}

/**
 * Verify download relationships using only relationship tables
 *
 * @param result Verification result to update
 * @returns Updated verification result
 */
async function verifyDownloadRelationships(
  result: VerificationResult,
): Promise<VerificationResult> {
  console.log('Verifying download relationships...');

  try {
    // Get the verification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_rel
      FROM (
        SELECT id, parent_id, path 
        FROM payload.course_lessons_rels 
        WHERE path = 'downloads'
        UNION ALL
        SELECT id, parent_id, path 
        FROM payload.courses_rels 
        WHERE path = 'downloads'
      ) rel
    `;

    const statsResult = await executeSQL(statsQuery);
    const totalCount = parseInt(statsResult.rows[0].total_rel) || 0;

    result.totalRelationships += totalCount;
    result.checkedRelationships += totalCount;

    // Run simplified verification query to check valid references
    const verificationQuery = `
      WITH 
      lesson_rel_downloads AS (
        SELECT 
          parent_id as lesson_id,
          id as download_id
        FROM payload.course_lessons_rels
        WHERE path = 'downloads'
      ),
      course_rel_downloads AS (
        SELECT 
          parent_id as course_id,
          id as download_id
        FROM payload.courses_rels
        WHERE path = 'downloads'
      ),
      lesson_invalid_downloads AS (
        -- Check for downloads that don't exist
        SELECT 
          'course_lessons' as collection,
          'downloads' as field,
          'downloads' as target_collection,
          'invalid_download_reference' as issue_type,
          COUNT(*) as count
        FROM lesson_rel_downloads rd
        LEFT JOIN payload.downloads d
        ON rd.download_id = d.id
        WHERE d.id IS NULL
        
        UNION ALL
        
        -- Check for lessons that don't exist
        SELECT 
          'course_lessons' as collection,
          'downloads' as field,
          'downloads' as target_collection,
          'invalid_lesson_reference' as issue_type,
          COUNT(*) as count
        FROM lesson_rel_downloads rd
        LEFT JOIN payload.course_lessons l
        ON rd.lesson_id = l.id
        WHERE l.id IS NULL
      ),
      course_invalid_downloads AS (
        -- Check for downloads that don't exist
        SELECT 
          'courses' as collection,
          'downloads' as field,
          'downloads' as target_collection,
          'invalid_download_reference' as issue_type,
          COUNT(*) as count
        FROM course_rel_downloads rd
        LEFT JOIN payload.downloads d
        ON rd.download_id = d.id
        WHERE d.id IS NULL
        
        UNION ALL
        
        -- Check for courses that don't exist
        SELECT 
          'courses' as collection,
          'downloads' as field,
          'downloads' as target_collection,
          'invalid_course_reference' as issue_type,
          COUNT(*) as count
        FROM course_rel_downloads rd
        LEFT JOIN payload.courses c
        ON rd.course_id = c.id
        WHERE c.id IS NULL
      )
      SELECT 
        collection,
        field,
        target_collection,
        issue_type,
        count
      FROM (
        SELECT * FROM lesson_invalid_downloads
        UNION ALL
        SELECT * FROM course_invalid_downloads
      ) all_inconsistencies
      WHERE count > 0
    `;

    const verificationResult = await executeSQL(verificationQuery);

    if (verificationResult.rows.length > 0) {
      for (const row of verificationResult.rows) {
        result.inconsistentRelationships.push({
          collection: row.collection,
          field: row.field,
          targetCollection: row.target_collection,
          issueType: row.issue_type,
          count: parseInt(row.count),
        });
      }

      console.log(
        formatLogMessage(
          `Download relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)} issues found`,
          'warn',
        ),
      );
    } else {
      console.log(
        formatLogMessage('Download relationships: No issues found', 'info'),
      );
    }

    return result;
  } catch (error) {
    console.error('Error verifying download relationships:', error);
    return result;
  }
}

// Allow direct execution
if (process.argv[1] === import.meta.url) {
  verifyAllRelationships()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error running verification:', error);
      process.exit(1);
    });
}
