import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Client } = pg;
// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Database connection
const connectionString = process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';
// Formatting helpers
const INDENT = '  ';
const SUCCESS = '✅';
const WARNING = '⚠️';
const ERROR = '❌';
const INFO = 'ℹ️';
/**
 * Main entry point for comprehensive quiz system verification
 */
export async function verifyQuizSystemIntegrity() {
    console.log('Starting comprehensive quiz system integrity verification...');
    const client = new Client({ connectionString });
    const results = [];
    try {
        // Connect to database
        await client.connect();
        console.log('Connected to database');
        // 1. Verify course-quiz relationships
        results.push(await verifyCourseQuizRelationships(client));
        // 2. Verify lesson-quiz relationships
        results.push(await verifyLessonQuizRelationships(client));
        // 3. Verify question-quiz relationships
        results.push(await verifyQuestionQuizRelationships(client));
        // 4. Verify quiz content and metadata
        results.push(await verifyQuizContentAndMetadata(client));
        // 5. Cross-reference verification (e.g., quizzes without questions, orphaned questions)
        results.push(await verifyCrossReferences(client));
        // Generate comprehensive report
        await generateReport(results);
    }
    catch (error) {
        console.error('Error verifying quiz system integrity:', error);
        throw error;
    }
    finally {
        // Close database connection
        await client.end();
        console.log('Database connection closed');
    }
    console.log('Comprehensive quiz system integrity verification completed');
}
/**
 * Verify course-quiz relationships
 */
async function verifyCourseQuizRelationships(client) {
    console.log('Verifying course-quiz relationships...');
    const result = {
        category: 'Course-Quiz Relationships',
        passed: true,
        issues: [],
        stats: {},
    };
    try {
        // Total quizzes
        const totalQuizzesResult = await client.query(`
      SELECT COUNT(*) FROM payload.course_quizzes
    `);
        const totalQuizzes = parseInt(totalQuizzesResult.rows[0].count);
        result.stats['Total quizzes'] = totalQuizzes;
        // Get quizzes without course_id_id
        const quizzesWithoutCourseIdResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes
      WHERE course_id_id IS NULL OR course_id_id = ''
    `);
        const quizzesWithoutCourseId = parseInt(quizzesWithoutCourseIdResult.rows[0].count);
        result.stats['Quizzes without course_id_id'] = quizzesWithoutCourseId;
        if (quizzesWithoutCourseId > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Quizzes without course_id_id',
                count: quizzesWithoutCourseId,
                recommendation: 'Run fix:quiz-course-ids to assign proper course IDs',
            });
        }
        // Get course-quiz relationship entries
        const courseQuizRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes_rels
      WHERE field = 'course_id'
    `);
        const courseQuizRels = parseInt(courseQuizRelsResult.rows[0].count);
        result.stats['Course-quiz relationship entries'] = courseQuizRels;
        // Quizzes with course_id_id but missing relationship entry
        const missingRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes cq
      WHERE cq.course_id_id IS NOT NULL 
      AND cq.course_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes_rels cqr 
        WHERE cqr._parent_id = cq.id 
        AND cqr.field = 'course_id' 
        AND cqr.value = cq.course_id_id
      )
    `);
        const missingRels = parseInt(missingRelsResult.rows[0].count);
        result.stats['Quizzes with course_id_id but missing relationship'] =
            missingRels;
        if (missingRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Quizzes with course_id_id but missing relationship entries',
                count: missingRels,
                recommendation: 'Run fix:course-quiz-relationships to fix missing relationship entries',
            });
        }
        // Inconsistent relationship entries
        const inconsistentRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes_rels cqr
      JOIN payload.course_quizzes cq ON cq.id = cqr._parent_id
      WHERE cqr.field = 'course_id' 
      AND (cq.course_id_id IS NULL OR cq.course_id_id = '' OR cq.course_id_id != cqr.value)
    `);
        const inconsistentRels = parseInt(inconsistentRelsResult.rows[0].count);
        result.stats['Inconsistent course-quiz relationship entries'] =
            inconsistentRels;
        if (inconsistentRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Inconsistent course-quiz relationship entries',
                count: inconsistentRels,
                recommendation: 'Run fix:course-quiz-relationships to fix inconsistent relationships',
            });
        }
        // Check for invalid course references
        const invalidCourseRefsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes cq
      WHERE cq.course_id_id IS NOT NULL 
      AND cq.course_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.courses c 
        WHERE c.id = cq.course_id_id
      )
    `);
        const invalidCourseRefs = parseInt(invalidCourseRefsResult.rows[0].count);
        result.stats['Quizzes with invalid course references'] = invalidCourseRefs;
        if (invalidCourseRefs > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Quizzes referencing non-existent courses',
                count: invalidCourseRefs,
                recommendation: 'Manually check and fix these invalid references',
            });
        }
        return result;
    }
    catch (error) {
        console.error('Error in verifyCourseQuizRelationships:', error);
        result.passed = false;
        result.issues.push({
            severity: 'error',
            message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return result;
    }
}
/**
 * Verify lesson-quiz relationships
 */
async function verifyLessonQuizRelationships(client) {
    console.log('Verifying lesson-quiz relationships...');
    const result = {
        category: 'Lesson-Quiz Relationships',
        passed: true,
        issues: [],
        stats: {},
    };
    try {
        // Check total lessons with quiz references
        const lessonsWithQuizResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);
        const lessonsWithQuiz = parseInt(lessonsWithQuizResult.rows[0].count);
        result.stats['Lessons referencing quizzes'] = lessonsWithQuiz;
        // Check lesson-quiz relationship entries
        const lessonQuizRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons_rels 
      WHERE field = 'quiz_id'
    `);
        const lessonQuizRels = parseInt(lessonQuizRelsResult.rows[0].count);
        result.stats['Lesson-quiz relationship entries'] = lessonQuizRels;
        // Check for lessons with quiz_id but not quiz_id_id
        const fieldNameIssuesResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons 
      WHERE quiz_id IS NOT NULL 
      AND (quiz_id_id IS NULL OR quiz_id_id = '' OR quiz_id_id != quiz_id)
    `);
        const fieldNameIssues = parseInt(fieldNameIssuesResult.rows[0].count);
        result.stats['Lessons with quiz_id/quiz_id_id inconsistencies'] =
            fieldNameIssues;
        if (fieldNameIssues > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Lessons with inconsistent quiz_id and quiz_id_id fields',
                count: fieldNameIssues,
                recommendation: 'Run fix:lesson-quiz-field-name to synchronize these fields',
            });
        }
        // Check for lessons with quiz_id_id but missing relationship entry
        const missingRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons cl
      WHERE cl.quiz_id_id IS NOT NULL 
      AND cl.quiz_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_lessons_rels clr 
        WHERE clr._parent_id = cl.id 
        AND clr.field = 'quiz_id' 
        AND clr.value = cl.quiz_id_id
      )
    `);
        const missingRels = parseInt(missingRelsResult.rows[0].count);
        result.stats['Lessons with quiz_id_id but missing relationship'] =
            missingRels;
        if (missingRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Lessons with quiz_id_id but missing relationship entries',
                count: missingRels,
                recommendation: 'Run fix:lesson-quiz-relationships-comprehensive to fix missing relationship entries',
            });
        }
        // Check for invalid quiz references in lessons
        const invalidQuizRefsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons cl
      WHERE cl.quiz_id_id IS NOT NULL 
      AND cl.quiz_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes cq 
        WHERE cq.id = cl.quiz_id_id
      )
    `);
        const invalidQuizRefs = parseInt(invalidQuizRefsResult.rows[0].count);
        result.stats['Lessons with invalid quiz references'] = invalidQuizRefs;
        if (invalidQuizRefs > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Lessons referencing non-existent quizzes',
                count: invalidQuizRefs,
                recommendation: 'Run fix:invalid-quiz-references to fix or clear these invalid references',
            });
        }
        return result;
    }
    catch (error) {
        console.error('Error in verifyLessonQuizRelationships:', error);
        result.passed = false;
        result.issues.push({
            severity: 'error',
            message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return result;
    }
}
/**
 * Verify question-quiz relationships
 */
async function verifyQuestionQuizRelationships(client) {
    console.log('Verifying question-quiz relationships...');
    const result = {
        category: 'Question-Quiz Relationships',
        passed: true,
        issues: [],
        stats: {},
    };
    try {
        // Check total questions
        const totalQuestionsResult = await client.query(`
      SELECT COUNT(*) FROM payload.quiz_questions
    `);
        const totalQuestions = parseInt(totalQuestionsResult.rows[0].count);
        result.stats['Total quiz questions'] = totalQuestions;
        // Check questions with quiz references
        const questionsWithQuizResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);
        const questionsWithQuiz = parseInt(questionsWithQuizResult.rows[0].count);
        result.stats['Questions with quiz references'] = questionsWithQuiz;
        // Check for questions without quiz references
        const questionsWithoutQuizResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions 
      WHERE quiz_id_id IS NULL OR quiz_id_id = ''
    `);
        const questionsWithoutQuiz = parseInt(questionsWithoutQuizResult.rows[0].count);
        result.stats['Questions without quiz references'] = questionsWithoutQuiz;
        if (questionsWithoutQuiz > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Quiz questions not associated with any quiz',
                count: questionsWithoutQuiz,
                recommendation: 'Run fix:question-quiz-relationships-comprehensive to attempt association',
            });
        }
        // Check for inconsistent quiz_id and quiz_id_id
        const inconsistentIdsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions
      WHERE quiz_id IS NOT NULL AND quiz_id_id IS NOT NULL
      AND quiz_id != '' AND quiz_id_id != ''
      AND quiz_id != quiz_id_id
    `);
        const inconsistentIds = parseInt(inconsistentIdsResult.rows[0].count);
        result.stats['Questions with inconsistent quiz_id/quiz_id_id'] =
            inconsistentIds;
        if (inconsistentIds > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Questions with inconsistent quiz_id and quiz_id_id fields',
                count: inconsistentIds,
                recommendation: 'Run fix:question-quiz-relationships-comprehensive to fix these inconsistencies',
            });
        }
        // Check for questions with quiz_id_id but missing relationship entry
        const missingRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions qq
      WHERE qq.quiz_id_id IS NOT NULL 
      AND qq.quiz_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.quiz_questions_rels qqr 
        WHERE qqr._parent_id = qq.id 
        AND qqr.field = 'quiz_id' 
        AND qqr.value = qq.quiz_id_id
      )
    `);
        const missingRels = parseInt(missingRelsResult.rows[0].count);
        result.stats['Questions with quiz_id_id but missing relationship'] =
            missingRels;
        if (missingRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Questions with quiz_id_id but missing relationship entries',
                count: missingRels,
                recommendation: 'Run fix:question-quiz-relationships-comprehensive to fix relationship entries',
            });
        }
        // Check for invalid quiz references
        const invalidQuizRefsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions qq
      WHERE qq.quiz_id_id IS NOT NULL 
      AND qq.quiz_id_id != '' 
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes cq 
        WHERE cq.id = qq.quiz_id_id
      )
    `);
        const invalidQuizRefs = parseInt(invalidQuizRefsResult.rows[0].count);
        result.stats['Questions with invalid quiz references'] = invalidQuizRefs;
        if (invalidQuizRefs > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Questions referencing non-existent quizzes',
                count: invalidQuizRefs,
                recommendation: 'Run fix:question-quiz-relationships-comprehensive to fix these invalid references',
            });
        }
        return result;
    }
    catch (error) {
        console.error('Error in verifyQuestionQuizRelationships:', error);
        result.passed = false;
        result.issues.push({
            severity: 'error',
            message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return result;
    }
}
/**
 * Verify quiz content and metadata
 */
async function verifyQuizContentAndMetadata(client) {
    console.log('Verifying quiz content and metadata...');
    const result = {
        category: 'Quiz Content and Metadata',
        passed: true,
        issues: [],
        stats: {},
    };
    try {
        // Check for quizzes without titles
        const quizzesWithoutTitleResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes 
      WHERE title IS NULL OR title = ''
    `);
        const quizzesWithoutTitle = parseInt(quizzesWithoutTitleResult.rows[0].count);
        result.stats['Quizzes without titles'] = quizzesWithoutTitle;
        if (quizzesWithoutTitle > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Quizzes without titles',
                count: quizzesWithoutTitle,
                recommendation: 'Manual intervention required to add titles',
            });
        }
        // Check for duplicated quiz titles
        const duplicatedTitlesResult = await client.query(`
      SELECT title, COUNT(*) as count
      FROM payload.course_quizzes
      WHERE title IS NOT NULL AND title != ''
      GROUP BY title
      HAVING COUNT(*) > 1
    `);
        const duplicatedTitles = duplicatedTitlesResult.rowCount;
        result.stats['Duplicated quiz titles'] = duplicatedTitles;
        if (duplicatedTitles > 0) {
            let details = 'Duplicated titles: ';
            duplicatedTitlesResult.rows.forEach((row, i) => {
                details += `"${row.title}" (${row.count} instances)${i < duplicatedTitlesResult.rowCount - 1 ? ', ' : ''}`;
            });
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Duplicated quiz titles',
                count: duplicatedTitles,
                details,
                recommendation: 'Manual intervention required to ensure unique quiz titles',
            });
        }
        // Check for empty quizzes (no questions)
        const emptyQuizzesResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes cq
      WHERE NOT EXISTS (
        SELECT 1 
        FROM payload.quiz_questions qq 
        WHERE qq.quiz_id_id = cq.id
      )
    `);
        const emptyQuizzes = parseInt(emptyQuizzesResult.rows[0].count);
        result.stats['Quizzes without questions'] = emptyQuizzes;
        // Get total quizzes with lessons
        const quizzesWithLessonsResult = await client.query(`
      SELECT COUNT(DISTINCT quiz_id_id) 
      FROM payload.course_lessons 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);
        const quizzesWithLessons = parseInt(quizzesWithLessonsResult.rows[0].count);
        result.stats['Quizzes referenced by lessons'] = quizzesWithLessons;
        // Check for empty quizzes that are referenced by lessons
        const emptyReferencedQuizzesResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_quizzes cq
      WHERE EXISTS (
        SELECT 1 
        FROM payload.course_lessons cl 
        WHERE cl.quiz_id_id = cq.id
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.quiz_questions qq 
        WHERE qq.quiz_id_id = cq.id
      )
    `);
        const emptyReferencedQuizzes = parseInt(emptyReferencedQuizzesResult.rows[0].count);
        result.stats['Referenced quizzes without questions'] =
            emptyReferencedQuizzes;
        if (emptyReferencedQuizzes > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'error',
                message: 'Quizzes referenced by lessons but having no questions',
                count: emptyReferencedQuizzes,
                recommendation: 'Run fix:quizzes-without-questions or fix:question-quiz-relationships-comprehensive',
            });
        }
        else if (emptyQuizzes > 0) {
            result.issues.push({
                severity: 'info',
                message: 'Quizzes without questions (not referenced by lessons)',
                count: emptyQuizzes - emptyReferencedQuizzes,
                recommendation: 'These quizzes are not used and may be ignored or deleted',
            });
        }
        return result;
    }
    catch (error) {
        console.error('Error in verifyQuizContentAndMetadata:', error);
        result.passed = false;
        result.issues.push({
            severity: 'error',
            message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return result;
    }
}
/**
 * Verify cross-references and overall system integrity
 */
async function verifyCrossReferences(client) {
    console.log('Verifying cross-references and system integrity...');
    const result = {
        category: 'Cross-References and System Integrity',
        passed: true,
        issues: [],
        stats: {},
    };
    try {
        // Total quizzes and questions
        const totalQuizzesResult = await client.query(`
      SELECT COUNT(*) FROM payload.course_quizzes
    `);
        const totalQuizzes = parseInt(totalQuizzesResult.rows[0].count);
        const totalQuestionsResult = await client.query(`
      SELECT COUNT(*) FROM payload.quiz_questions
    `);
        const totalQuestions = parseInt(totalQuestionsResult.rows[0].count);
        result.stats['Total quizzes'] = totalQuizzes;
        result.stats['Total questions'] = totalQuestions;
        // Average questions per quiz
        const avgQuestionsPerQuiz = totalQuizzes > 0 ? (totalQuestions / totalQuizzes).toFixed(2) : '0';
        result.stats['Average questions per quiz'] = avgQuestionsPerQuiz;
        // Quizzes referenced by lessons
        const referencedQuizzesResult = await client.query(`
      SELECT COUNT(DISTINCT quiz_id_id) 
      FROM payload.course_lessons 
      WHERE quiz_id_id IS NOT NULL AND quiz_id_id != ''
    `);
        const referencedQuizzes = parseInt(referencedQuizzesResult.rows[0].count);
        result.stats['Quizzes referenced by lessons'] = referencedQuizzes;
        // Unreferenced quizzes
        const unreferencedQuizzes = totalQuizzes - referencedQuizzes;
        result.stats['Unreferenced quizzes'] = unreferencedQuizzes;
        if (unreferencedQuizzes > 0) {
            result.issues.push({
                severity: 'info',
                message: 'Quizzes not referenced by any lesson',
                count: unreferencedQuizzes,
                recommendation: 'These quizzes may be unused or orphaned - consider removal',
            });
        }
        // Check orphaned relationship entries
        const orphanedLessonRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.course_lessons_rels clr
      WHERE clr.field = 'quiz_id'
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.course_lessons cl 
        WHERE cl.id = clr._parent_id
      )
    `);
        const orphanedLessonRels = parseInt(orphanedLessonRelsResult.rows[0].count);
        result.stats['Orphaned lesson-quiz relationship entries'] =
            orphanedLessonRels;
        if (orphanedLessonRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Orphaned lesson-quiz relationship entries',
                count: orphanedLessonRels,
                recommendation: 'Consider cleaning up these dangling relationship entries',
            });
        }
        const orphanedQuestionRelsResult = await client.query(`
      SELECT COUNT(*) 
      FROM payload.quiz_questions_rels qqr
      WHERE qqr.field = 'quiz_id'
      AND NOT EXISTS (
        SELECT 1 
        FROM payload.quiz_questions qq 
        WHERE qq.id = qqr._parent_id
      )
    `);
        const orphanedQuestionRels = parseInt(orphanedQuestionRelsResult.rows[0].count);
        result.stats['Orphaned question-quiz relationship entries'] =
            orphanedQuestionRels;
        if (orphanedQuestionRels > 0) {
            result.passed = false;
            result.issues.push({
                severity: 'warning',
                message: 'Orphaned question-quiz relationship entries',
                count: orphanedQuestionRels,
                recommendation: 'Consider cleaning up these dangling relationship entries',
            });
        }
        // Questions referenced by multiple quizzes
        const multiQuizQuestionsResult = await client.query(`
      SELECT qq.id, COUNT(DISTINCT qqr.value) as quiz_count
      FROM payload.quiz_questions qq
      JOIN payload.quiz_questions_rels qqr ON qqr._parent_id = qq.id AND qqr.field = 'quiz_id'
      GROUP BY qq.id
      HAVING COUNT(DISTINCT qqr.value) > 1
    `);
        const multiQuizQuestions = multiQuizQuestionsResult.rowCount;
        result.stats['Questions referenced by multiple quizzes'] =
            multiQuizQuestions;
        if (multiQuizQuestions > 0) {
            result.issues.push({
                severity: 'info',
                message: 'Questions referenced by multiple quizzes',
                count: multiQuizQuestions,
                details: 'These questions appear in more than one quiz - may be intended but worth checking',
            });
        }
        return result;
    }
    catch (error) {
        console.error('Error in verifyCrossReferences:', error);
        result.passed = false;
        result.issues.push({
            severity: 'error',
            message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return result;
    }
}
/**
 * Generate a detailed report from verification results
 */
async function generateReport(results) {
    console.log('\n=============================================');
    console.log('     QUIZ SYSTEM INTEGRITY VERIFICATION     ');
    console.log('=============================================\n');
    // Overall pass/fail status
    const overallPass = results.every((r) => r.passed);
    console.log(`Overall status: ${overallPass ? `${SUCCESS} PASSED` : `${ERROR} FAILED`}`);
    console.log('');
    // Display each category result
    for (const result of results) {
        console.log(`${result.passed ? SUCCESS : ERROR} ${result.category}:`);
        // Display statistics
        console.log(`${INDENT}Statistics:`);
        Object.entries(result.stats).forEach(([name, value]) => {
            console.log(`${INDENT}${INDENT}- ${name}: ${value}`);
        });
        // Display issues
        if (result.issues.length > 0) {
            console.log(`${INDENT}Issues:`);
            // Sort by severity (error > warning > info)
            const sortedIssues = [...result.issues].sort((a, b) => {
                const severityOrder = { error: 0, warning: 1, info: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
            sortedIssues.forEach((issue) => {
                const icon = issue.severity === 'error'
                    ? ERROR
                    : issue.severity === 'warning'
                        ? WARNING
                        : INFO;
                let message = `${INDENT}${INDENT}${icon} ${issue.message}`;
                if (issue.count !== undefined) {
                    message += ` (${issue.count})`;
                }
                console.log(message);
                if (issue.details) {
                    console.log(`${INDENT}${INDENT}${INDENT}${issue.details}`);
                }
                if (issue.recommendation) {
                    console.log(`${INDENT}${INDENT}${INDENT}Recommendation: ${issue.recommendation}`);
                }
            });
        }
        else {
            console.log(`${INDENT}${SUCCESS} No issues found!`);
        }
        console.log(''); // Add spacing between categories
    }
    // Generate recommendations summary
    console.log('=============================================');
    console.log('        RECOMMENDATIONS SUMMARY             ');
    console.log('=============================================\n');
    // Collect all distinct recommendations
    const allRecommendations = new Set();
    results.forEach((result) => {
        result.issues.forEach((issue) => {
            if (issue.recommendation) {
                allRecommendations.add(issue.recommendation);
            }
        });
    });
    // Display action items
    if (allRecommendations.size > 0) {
        console.log('Recommended actions:');
        let i = 1;
        allRecommendations.forEach((recommendation) => {
            console.log(`${i}. ${recommendation}`);
            i++;
        });
    }
    else {
        console.log(`${SUCCESS} No action items needed!`);
    }
}
// Run if executed directly
if (require.main === module) {
    verifyQuizSystemIntegrity()
        .then(() => console.log('Verification completed'))
        .catch((error) => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}
