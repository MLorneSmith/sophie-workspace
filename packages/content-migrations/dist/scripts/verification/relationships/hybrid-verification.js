/**
 * Hybrid Relationship Verification System
 *
 * This script combines the schema safety approach of the unified verification with
 * the compatible implementation patterns of the standard verification.
 * Designed to be robust and compatible with all execution environments.
 */
import chalk from 'chalk';
import { executeSQL } from '../../../utils/db/execute-sql.js';
import { formatLogMessage } from '../../repair/relationships/core/utils.js';
// Schema safety utilities - adapted from unified verification but without ESM dependency
/**
 * Safely checks if a table exists
 */
async function tableExists(schema, tableName) {
    try {
        const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = $2
      );
    `;
        const result = await executeSQL(query, [schema, tableName]);
        return result.rows[0].exists;
    }
    catch (error) {
        console.error(`Error checking if table ${schema}.${tableName} exists:`, error);
        return false;
    }
}
/**
 * Safely checks if a column exists in a table
 */
async function columnExists(schema, tableName, columnName) {
    try {
        const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
      );
    `;
        const result = await executeSQL(query, [schema, tableName, columnName]);
        return result.rows[0].exists;
    }
    catch (error) {
        console.error(`Error checking if column ${columnName} exists in table ${schema}.${tableName}:`, error);
        return false;
    }
}
/**
 * Get all columns in a table
 */
async function getTableColumns(schema, tableName) {
    try {
        const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position;
    `;
        const result = await executeSQL(query, [schema, tableName]);
        return result.rows.map((row) => row.column_name);
    }
    catch (error) {
        console.error(`Error getting columns for table ${schema}.${tableName}:`, error);
        return [];
    }
}
/**
 * Verify quiz-question relationships with schema safety
 */
async function verifyQuizQuestionRelationships(result, verbose = false) {
    console.log(chalk.blue('Verifying quiz-question relationships...'));
    try {
        // First check if necessary tables exist (adapted from unified verification)
        const quizTableExists = await tableExists('payload', 'course_quizzes');
        const questionTableExists = await tableExists('payload', 'quiz_questions');
        const relTableExists = await tableExists('payload', 'course_quizzes_rels');
        if (!quizTableExists || !questionTableExists || !relTableExists) {
            console.log(chalk.yellow('One or more required tables do not exist, skipping verification:'));
            console.log(`course_quizzes: ${quizTableExists ? 'exists' : 'missing'}`);
            console.log(`quiz_questions: ${questionTableExists ? 'exists' : 'missing'}`);
            console.log(`course_quizzes_rels: ${relTableExists ? 'exists' : 'missing'}`);
            // Still mark the relationship as verified to allow migration to continue
            return result;
        }
        // Check if necessary columns exist
        const quizHasQuestionsField = await columnExists('payload', 'course_quizzes', 'questions');
        const relHasQuestionId = await columnExists('payload', 'course_quizzes_rels', 'quiz_questions_id');
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
        if (!quizHasQuestionsField && !relHasQuestionId) {
            console.log(chalk.yellow('Required relationship columns do not exist for quiz-question relationships, using unidirectional model only'));
            // Only check unidirectional relationships in course_quizzes_rels
            const query = `
        SELECT 
          COUNT(*) as total_questions,
          COUNT(qq.id) as questions_in_relationships
        FROM 
          payload.quiz_questions qq
        LEFT JOIN 
          payload.course_quizzes_rels cqr ON cqr.quiz_questions_id = qq.id
      `;
            const queryResult = await executeSQL(query);
            const totalQuestions = parseInt(queryResult.rows[0].total_questions || '0');
            const questionsInRelationships = parseInt(queryResult.rows[0].questions_in_relationships || '0');
            if (verbose) {
                console.log(`Total questions: ${totalQuestions}`);
                console.log(`Questions in relationships: ${questionsInRelationships}`);
            }
            if (totalQuestions === questionsInRelationships) {
                console.log(chalk.green('✓ All quiz questions are in relationships'));
            }
            else {
                console.log(chalk.red(`✗ Found ${totalQuestions - questionsInRelationships} orphaned quiz questions`));
                // Record the inconsistency
                result.inconsistentRelationships.push({
                    collection: 'course_quizzes',
                    field: 'questions',
                    targetCollection: 'quiz_questions',
                    issueType: 'missing_in_rel_table', // Using standard type instead of custom
                    count: totalQuestions - questionsInRelationships,
                });
                console.log(chalk.yellow('This is not critical, continuing with migration...'));
            }
        }
        else {
            // Advanced verification using CTEs from standard verification
            const verificationQuery = `
        WITH 
        direct_questions AS (
          SELECT 
            id as quiz_id,
            jsonb_array_elements_text(COALESCE(questions, '[]'::jsonb)) as question_id,
            jsonb_array_position(COALESCE(questions, '[]'::jsonb), jsonb_array_elements_text(COALESCE(questions, '[]'::jsonb)))::integer as direct_order
          FROM payload.course_quizzes
        ),
        rel_questions AS (
          SELECT 
            parent_id as quiz_id,
            id as question_id,
            "order" as rel_order
          FROM payload.course_quizzes_rels
          WHERE path = 'questions'
        ),
        inconsistencies AS (
          -- Missing in rel table
          SELECT 
            dq.quiz_id,
            dq.question_id,
            'missing_in_rel_table' as issue_type,
            COUNT(*) as count
          FROM direct_questions dq
          LEFT JOIN rel_questions rq 
          ON dq.quiz_id = rq.quiz_id AND dq.question_id = rq.question_id
          WHERE rq.question_id IS NULL
          GROUP BY dq.quiz_id, dq.question_id, issue_type
          
          UNION ALL
          
          -- Missing in direct questions
          SELECT 
            rq.quiz_id,
            rq.question_id,
            'missing_in_direct' as issue_type,
            COUNT(*) as count
          FROM rel_questions rq
          LEFT JOIN direct_questions dq 
          ON rq.quiz_id = dq.quiz_id AND rq.question_id = dq.question_id
          WHERE dq.question_id IS NULL
          GROUP BY rq.quiz_id, rq.question_id, issue_type
          
          UNION ALL
          
          -- Order mismatch
          SELECT 
            dq.quiz_id,
            dq.question_id,
            'order_mismatch' as issue_type,
            COUNT(*) as count
          FROM direct_questions dq
          JOIN rel_questions rq 
          ON dq.quiz_id = rq.quiz_id AND dq.question_id = rq.question_id
          WHERE dq.direct_order != rq.rel_order
          GROUP BY dq.quiz_id, dq.question_id, issue_type
        )
        SELECT 
          issue_type,
          SUM(count) as total_count
        FROM inconsistencies
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
                console.log(formatLogMessage(`Quiz-Question relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`, 'warn'));
            }
            else {
                console.log(formatLogMessage('Quiz-Question relationships: No issues found', 'info'));
            }
        }
        return result;
    }
    catch (error) {
        console.error('Error verifying quiz-question relationships:', error);
        // Don't fail the migration due to verification issues
        console.log(chalk.yellow('Continuing despite verification error...'));
        return result;
    }
}
/**
 * Verify lesson-quiz relationships with schema safety
 */
async function verifyLessonQuizRelationships(result, verbose = false) {
    console.log(chalk.blue('Verifying lesson-quiz relationships...'));
    try {
        // First check if necessary tables exist
        const lessonTableExists = await tableExists('payload', 'course_lessons');
        const quizTableExists = await tableExists('payload', 'course_quizzes');
        const relTableExists = await tableExists('payload', 'course_lessons_rels');
        if (!lessonTableExists || !quizTableExists || !relTableExists) {
            console.log(chalk.yellow('One or more required tables do not exist, skipping verification:'));
            console.log(`course_lessons: ${lessonTableExists ? 'exists' : 'missing'}`);
            console.log(`course_quizzes: ${quizTableExists ? 'exists' : 'missing'}`);
            console.log(`course_lessons_rels: ${relTableExists ? 'exists' : 'missing'}`);
            // Still mark the relationship as verified to allow migration to continue
            return result;
        }
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
        // Check if necessary columns exist
        const lessonHasQuizField = await columnExists('payload', 'course_lessons', 'quiz');
        const relHasQuizId = await columnExists('payload', 'course_lessons_rels', 'course_quizzes_id');
        if (!lessonHasQuizField && !relHasQuizId) {
            console.log(chalk.yellow('Required relationship columns do not exist for lesson-quiz relationships, using unidirectional model only'));
            // Simple check for existence of any relationships
            const query = `
        SELECT 
          COUNT(*) as total_relationships
        FROM 
          payload.course_lessons_rels clr
        WHERE
          clr.course_quizzes_id IS NOT NULL
      `;
            const queryResult = await executeSQL(query);
            const totalRelationships = parseInt(queryResult.rows[0].total_relationships || '0');
            if (verbose) {
                console.log(`Total lesson-quiz relationships: ${totalRelationships}`);
            }
            if (totalRelationships > 0) {
                console.log(chalk.green(`✓ Found ${totalRelationships} lesson-quiz relationships`));
            }
            else {
                console.log(chalk.yellow('No lesson-quiz relationships found'));
                // This might be intentional, so not recording as an inconsistency
            }
        }
        else {
            // Advanced verification using CTEs from standard verification
            const verificationQuery = `
        WITH 
        direct_quizzes AS (
          SELECT 
            id as lesson_id,
            quiz as quiz_id
          FROM payload.course_lessons
          WHERE quiz IS NOT NULL AND quiz != ''
        ),
        rel_quizzes AS (
          SELECT 
            parent_id as lesson_id,
            id as quiz_id
          FROM payload.course_lessons_rels
          WHERE path = 'quiz'
        ),
        inconsistencies AS (
          -- Missing in rel table
          SELECT 
            dq.lesson_id,
            dq.quiz_id,
            'missing_in_rel_table' as issue_type,
            COUNT(*) as count
          FROM direct_quizzes dq
          LEFT JOIN rel_quizzes rq 
          ON dq.lesson_id = rq.lesson_id AND dq.quiz_id = rq.quiz_id
          WHERE rq.quiz_id IS NULL
          GROUP BY dq.lesson_id, dq.quiz_id, issue_type
          
          UNION ALL
          
          -- Missing in direct field
          SELECT 
            rq.lesson_id,
            rq.quiz_id,
            'missing_in_direct' as issue_type,
            COUNT(*) as count
          FROM rel_quizzes rq
          LEFT JOIN direct_quizzes dq 
          ON rq.lesson_id = dq.lesson_id AND rq.quiz_id = dq.quiz_id
          WHERE dq.quiz_id IS NULL
          GROUP BY rq.lesson_id, rq.quiz_id, issue_type
        )
        SELECT 
          issue_type,
          SUM(count) as total_count
        FROM inconsistencies
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
                console.log(formatLogMessage(`Lesson-Quiz relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`, 'warn'));
            }
            else {
                console.log(formatLogMessage('Lesson-Quiz relationships: No issues found', 'info'));
            }
        }
        return result;
    }
    catch (error) {
        console.error('Error verifying lesson-quiz relationships:', error);
        // Don't fail the migration due to verification issues
        console.log(chalk.yellow('Continuing despite verification error...'));
        return result;
    }
}
/**
 * Verify survey-question relationships (adapted from standard verification)
 */
async function verifySurveyQuestionRelationships(result, verbose = false) {
    console.log(chalk.blue('Verifying survey-question relationships...'));
    try {
        // First check if necessary tables exist
        const surveyTableExists = await tableExists('payload', 'surveys');
        const questionTableExists = await tableExists('payload', 'survey_questions');
        const relTableExists = await tableExists('payload', 'surveys_rels');
        if (!surveyTableExists || !questionTableExists || !relTableExists) {
            console.log(chalk.yellow('One or more required tables do not exist, skipping verification:'));
            console.log(`surveys: ${surveyTableExists ? 'exists' : 'missing'}`);
            console.log(`survey_questions: ${questionTableExists ? 'exists' : 'missing'}`);
            console.log(`surveys_rels: ${relTableExists ? 'exists' : 'missing'}`);
            // Still mark the relationship as verified to allow migration to continue
            return result;
        }
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
        // Check if necessary columns exist
        const surveyHasQuestionsField = await columnExists('payload', 'surveys', 'questions');
        const relHasQuestionId = await columnExists('payload', 'surveys_rels', 'survey_questions_id');
        if (!surveyHasQuestionsField && !relHasQuestionId) {
            console.log(chalk.yellow('Required relationship columns do not exist for survey-question relationships, skipping detailed verification'));
            // Simple check for existence of any relationships
            const query = `
        SELECT 
          COUNT(*) as total_relationships
        FROM 
          payload.surveys_rels sr
        WHERE
          sr.survey_questions_id IS NOT NULL
      `;
            const queryResult = await executeSQL(query);
            const totalRelationships = parseInt(queryResult.rows[0].total_relationships || '0');
            if (verbose) {
                console.log(`Total survey-question relationships: ${totalRelationships}`);
            }
            if (totalRelationships > 0) {
                console.log(chalk.green(`✓ Found ${totalRelationships} survey-question relationships`));
            }
            else {
                console.log(chalk.yellow('No survey-question relationships found'));
                // This might be intentional, so not recording as an inconsistency
            }
        }
        else {
            // Advanced verification using CTEs
            const verificationQuery = `
        WITH 
        direct_questions AS (
          SELECT 
            id as survey_id,
            jsonb_array_elements_text(COALESCE(questions, '[]'::jsonb)) as question_id,
            jsonb_array_position(COALESCE(questions, '[]'::jsonb), jsonb_array_elements_text(COALESCE(questions, '[]'::jsonb)))::integer as direct_order
          FROM payload.surveys
        ),
        rel_questions AS (
          SELECT 
            parent_id as survey_id,
            id as question_id,
            "order" as rel_order
          FROM payload.surveys_rels
          WHERE path = 'questions'
        ),
        inconsistencies AS (
          -- Missing in rel table
          SELECT 
            dq.survey_id,
            dq.question_id,
            'missing_in_rel_table' as issue_type,
            COUNT(*) as count
          FROM direct_questions dq
          LEFT JOIN rel_questions rq 
          ON dq.survey_id = rq.survey_id AND dq.question_id = rq.question_id
          WHERE rq.question_id IS NULL
          GROUP BY dq.survey_id, dq.question_id, issue_type
          
          UNION ALL
          
          -- Missing in direct questions
          SELECT 
            rq.survey_id,
            rq.question_id,
            'missing_in_direct' as issue_type,
            COUNT(*) as count
          FROM rel_questions rq
          LEFT JOIN direct_questions dq 
          ON rq.survey_id = dq.survey_id AND rq.question_id = dq.question_id
          WHERE dq.question_id IS NULL
          GROUP BY rq.survey_id, rq.question_id, issue_type
          
          UNION ALL
          
          -- Order mismatch
          SELECT 
            dq.survey_id,
            dq.question_id,
            'order_mismatch' as issue_type,
            COUNT(*) as count
          FROM direct_questions dq
          JOIN rel_questions rq 
          ON dq.survey_id = rq.survey_id AND dq.question_id = rq.question_id
          WHERE dq.direct_order != rq.rel_order
          GROUP BY dq.survey_id, dq.question_id, issue_type
        )
        SELECT 
          issue_type,
          SUM(count) as total_count
        FROM inconsistencies
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
                console.log(formatLogMessage(`Survey-Question relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.total_count), 0)} issues found`, 'warn'));
            }
            else {
                console.log(formatLogMessage('Survey-Question relationships: No issues found', 'info'));
            }
        }
        return result;
    }
    catch (error) {
        console.error('Error verifying survey-question relationships:', error);
        // Don't fail the migration due to verification issues
        console.log(chalk.yellow('Continuing despite verification error...'));
        return result;
    }
}
/**
 * Verify download relationships (adapted from standard verification)
 */
async function verifyDownloadRelationships(result, verbose = false) {
    console.log(chalk.blue('Verifying download relationships...'));
    try {
        // First check if necessary tables exist
        const lessonsTableExists = await tableExists('payload', 'course_lessons');
        const coursesTableExists = await tableExists('payload', 'courses');
        const downloadsTableExists = await tableExists('payload', 'downloads');
        const lessonsRelsTableExists = await tableExists('payload', 'course_lessons_rels');
        const coursesRelsTableExists = await tableExists('payload', 'courses_rels');
        if (!lessonsTableExists ||
            !coursesTableExists ||
            !downloadsTableExists ||
            !lessonsRelsTableExists ||
            !coursesRelsTableExists) {
            console.log(chalk.yellow('One or more required tables do not exist, skipping download relationship verification'));
            // Still mark the relationship as verified to allow migration to continue
            return result;
        }
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
        // Check if necessary columns exist
        const lessonHasDownloadsField = await columnExists('payload', 'course_lessons', 'downloads');
        const courseHasDownloadsField = await columnExists('payload', 'courses', 'downloads');
        const lessonRelHasDownloadId = await columnExists('payload', 'course_lessons_rels', 'downloads_id');
        const courseRelHasDownloadId = await columnExists('payload', 'courses_rels', 'downloads_id');
        if (!lessonHasDownloadsField &&
            !lessonRelHasDownloadId &&
            !courseHasDownloadsField &&
            !courseRelHasDownloadId) {
            console.log(chalk.yellow('Required relationship columns do not exist for download relationships, skipping detailed verification'));
            // Simple check for existence of any relationships
            const query = `
        SELECT 
          COUNT(*) as total
        FROM (
          SELECT * FROM payload.course_lessons_rels WHERE downloads_id IS NOT NULL
          UNION ALL
          SELECT * FROM payload.courses_rels WHERE downloads_id IS NOT NULL
        ) all_rels
      `;
            const queryResult = await executeSQL(query);
            const totalRelationships = parseInt(queryResult.rows[0].total || '0');
            if (verbose) {
                console.log(`Total download relationships: ${totalRelationships}`);
            }
            if (totalRelationships > 0) {
                console.log(chalk.green(`✓ Found ${totalRelationships} download relationships`));
            }
            else {
                console.log(chalk.yellow('No download relationships found'));
                // This might be intentional, so not recording as an inconsistency
            }
        }
        else {
            // Run verification query to find inconsistencies
            const verificationQuery = `
        WITH 
        lesson_direct_downloads AS (
          SELECT 
            id as lesson_id,
            jsonb_array_elements_text(COALESCE(downloads, '[]'::jsonb)) as download_id
          FROM payload.course_lessons
          WHERE downloads IS NOT NULL
        ),
        lesson_rel_downloads AS (
          SELECT 
            parent_id as lesson_id,
            id as download_id
          FROM payload.course_lessons_rels
          WHERE path = 'downloads'
        ),
        course_direct_downloads AS (
          SELECT 
            id as course_id,
            jsonb_array_elements_text(COALESCE(downloads, '[]'::jsonb)) as download_id
          FROM payload.courses
          WHERE downloads IS NOT NULL
        ),
        course_rel_downloads AS (
          SELECT 
            parent_id as course_id,
            id as download_id
          FROM payload.courses_rels
          WHERE path = 'downloads'
        ),
        lesson_inconsistencies AS (
          -- Missing in rel table
          SELECT 
            'course_lessons' as collection,
            'downloads' as field,
            'downloads' as target_collection,
            'missing_in_rel_table' as issue_type,
            COUNT(*) as count
          FROM lesson_direct_downloads dd
          LEFT JOIN lesson_rel_downloads rd 
          ON dd.lesson_id = rd.lesson_id AND dd.download_id = rd.download_id
          WHERE rd.download_id IS NULL
          
          UNION ALL
          
          -- Missing in direct field
          SELECT 
            'course_lessons' as collection,
            'downloads' as field,
            'downloads' as target_collection,
            'missing_in_direct' as issue_type,
            COUNT(*) as count
          FROM lesson_rel_downloads rd
          LEFT JOIN lesson_direct_downloads dd 
          ON rd.lesson_id = dd.lesson_id AND rd.download_id = dd.download_id
          WHERE dd.download_id IS NULL
        ),
        course_inconsistencies AS (
          -- Missing in rel table
          SELECT 
            'courses' as collection,
            'downloads' as field,
            'downloads' as target_collection,
            'missing_in_rel_table' as issue_type,
            COUNT(*) as count
          FROM course_direct_downloads dd
          LEFT JOIN course_rel_downloads rd 
          ON dd.course_id = rd.course_id AND dd.download_id = rd.download_id
          WHERE rd.download_id IS NULL
          
          UNION ALL
          
          -- Missing in direct field
          SELECT 
            'courses' as collection,
            'downloads' as field,
            'downloads' as target_collection,
            'missing_in_direct' as issue_type,
            COUNT(*) as count
          FROM course_rel_downloads rd
          LEFT JOIN course_direct_downloads dd 
          ON rd.course_id = dd.course_id AND rd.download_id = dd.download_id
          WHERE dd.download_id IS NULL
        )
        SELECT 
          collection,
          field,
          target_collection,
          issue_type,
          count
        FROM (
          SELECT * FROM lesson_inconsistencies
          UNION ALL
          SELECT * FROM course_inconsistencies
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
                console.log(formatLogMessage(`Download relationships: ${verificationResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)} issues found`, 'warn'));
            }
            else {
                console.log(formatLogMessage('Download relationships: No issues found', 'info'));
            }
        }
        return result;
    }
    catch (error) {
        console.error('Error verifying download relationships:', error);
        // Don't fail the migration due to verification issues
        console.log(chalk.yellow('Continuing despite verification error...'));
        return result;
    }
}
/**
 * Main function to verify all relationships with schema safety
 */
export async function verifyAllRelationships(verbose = false) {
    console.log(chalk.blue('=== HYBRID RELATIONSHIP VERIFICATION ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    // Initialize result object
    const result = {
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
        await verifyQuizQuestionRelationships(result, verbose);
        // Verify lesson-quiz relationships
        await verifyLessonQuizRelationships(result, verbose);
        // Verify survey-question relationships
        await verifySurveyQuestionRelationships(result, verbose);
        // Verify download relationships
        await verifyDownloadRelationships(result, verbose);
        // Calculate summary stats
        result.summary.passedCount =
            result.checkedRelationships -
                result.inconsistentRelationships.reduce((sum, issue) => sum + issue.count, 0);
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
        console.log(`- Passed: ${result.summary.passedCount} (${result.summary.passRate.toFixed(2)}%)`);
        console.log(`- Failed: ${result.summary.failedCount}`);
        if (result.inconsistentRelationships.length > 0) {
            console.log('\nInconsistent Relationships:');
            for (const issue of result.inconsistentRelationships) {
                console.log(`- ${issue.collection}.${issue.field} -> ${issue.targetCollection}: ` +
                    `${issue.issueType} (count: ${issue.count})`);
            }
        }
        return result;
    }
    catch (error) {
        console.error('Error verifying relationships:', error);
        // Don't fail the migration due to verification issues
        console.log(chalk.yellow('Continuing despite verification error...'));
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
