/**
 * Consolidated Course-Quiz Relationship Fix
 *
 * This script is a comprehensive fix for both:
 * 1. Course-quiz relationships (assigning quizzes to the course)
 * 2. Quiz-question relationships (associating questions with quizzes)
 *
 * It handles both sides of Payload CMS's dual-storage mechanism:
 * - Direct field storage (course_id_id, quiz_id)
 * - Relationship tables (course_quizzes_rels entries)
 *
 * This consolidates functionality from:
 * - fix-course-quiz-relationships.ts
 * - fix-unidirectional-quiz-relationships.ts
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-course-quiz-relationships.sql');
export async function fixCourseQuizRelationships() {
    console.log('============== CONSOLIDATED COURSE-QUIZ RELATIONSHIP FIX ==============');
    console.log('Fixing course-quiz and quiz-question relationships with comprehensive approach...');
    // Load environment variables
    try {
        const dotenv = await import('dotenv');
        dotenv.config({ path: '.env.development' });
        console.log('Loaded environment variables');
    }
    catch (error) {
        console.log('Could not load dotenv, using default connection string');
    }
    // Get database connection string from environment or use default
    const connectionString = process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres';
    console.log(`Using connection string: ${connectionString}`);
    // Create database client
    const client = new Client({ connectionString });
    try {
        // Connect to database
        await client.connect();
        console.log('Connected to database successfully');
        // First check the current state
        console.log('\nCurrent state before fix:');
        const beforeStats = await getRelationshipStats(client);
        // Load SQL script
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        console.log('Loaded SQL script successfully');
        // Execute SQL script as a single transaction
        console.log('\nExecuting fix script...');
        // The script includes multiple SELECT queries for verification
        // For PostgreSQL, we need to run each SELECT statement separately to get the results
        // First execute the main SQL script
        await client.query(sqlContent);
        // Then fetch the detailed results with separate queries
        const courseQuizResult = await client.query(`
      SELECT 
          cq.id, 
          cq.title, 
          cq.course_id_id,
          CASE WHEN cq.course_id_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_direct_id,
          COUNT(cr.id) as course_rel_count,
          CASE WHEN COUNT(cr.id) > 0 THEN 'YES' ELSE 'NO' END as has_relationship,
          CASE 
              WHEN cq.course_id_id IS NOT NULL AND COUNT(cr.id) > 0 THEN 'VALID'
              ELSE 'INVALID'
          END as status
      FROM 
          payload.course_quizzes cq
      LEFT JOIN 
          payload.course_quizzes_rels cr
              ON cr._parent_id = cq.id 
              AND cr.field = 'course_id'
      GROUP BY 
          cq.id, cq.title, cq.course_id_id
      ORDER BY 
          cq.title
    `);
        const quizQuestionResult = await client.query(`
      SELECT 
          cq.id, 
          cq.title,
          COUNT(DISTINCT qq.id) as direct_question_count,
          COUNT(DISTINCT qr.value) as rel_question_count,
          CASE 
              WHEN COUNT(DISTINCT qq.id) = COUNT(DISTINCT qr.value) AND COUNT(DISTINCT qq.id) > 0 THEN 'VALID'
              WHEN COUNT(DISTINCT qq.id) = 0 AND COUNT(DISTINCT qr.value) = 0 THEN 'EMPTY'
              ELSE 'INVALID'
          END as status
      FROM 
          payload.course_quizzes cq
      LEFT JOIN 
          payload.quiz_questions qq
              ON qq.quiz_id = cq.id
      LEFT JOIN 
          payload.course_quizzes_rels qr
              ON qr._parent_id = cq.id 
              AND qr.field = 'questions'
      GROUP BY 
          cq.id, cq.title
      ORDER BY 
          cq.title
    `);
        const summaryResult = await client.query(`
      SELECT 
          (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
          (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course_id,
          (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_relationship_entries,
          (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
          (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL) as questions_with_quiz_id,
          (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as question_relationship_entries,
          (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions') as quizzes_with_questions
    `);
        const courseQuizStatus = courseQuizResult.rows;
        const quizQuestionStatus = quizQuestionResult.rows;
        const summaryStats = summaryResult.rows[0];
        // Get stats after the fix
        console.log('\nState after fix:');
        const afterStats = await getRelationshipStats(client);
        // Print detailed results
        console.log('\nResults Summary:');
        console.log(`- Total quizzes: ${afterStats.totalQuizzes}`);
        console.log(`- Course-Quiz relationships: ${beforeStats.courseQuizCount} → ${afterStats.courseQuizCount}`);
        console.log(`- Quiz-Question relationships: ${beforeStats.quizQuestionCount} → ${afterStats.quizQuestionCount}`);
        console.log(`- Quizzes with questions: ${beforeStats.quizzesWithQuestionsCount} → ${afterStats.quizzesWithQuestionsCount}`);
        // Analyze quiz statuses
        const invalidCourseQuizzes = courseQuizStatus.filter((q) => q.status === 'INVALID');
        const invalidQuizQuestions = quizQuestionStatus.filter((q) => q.status === 'INVALID');
        const emptyQuizzes = quizQuestionStatus.filter((q) => q.status === 'EMPTY');
        console.log('\nDetailed Status:');
        console.log(`- Quizzes without course links: ${invalidCourseQuizzes.length}`);
        console.log(`- Quizzes with invalid question links: ${invalidQuizQuestions.length}`);
        console.log(`- Quizzes with no questions: ${emptyQuizzes.length}`);
        // Determine overall success
        const courseFixSuccess = invalidCourseQuizzes.length === 0;
        const questionFixSuccess = invalidQuizQuestions.length === 0;
        if (courseFixSuccess && questionFixSuccess) {
            console.log('\n✅ SUCCESS: All quiz relationships are valid');
        }
        else if (courseFixSuccess) {
            console.log('\n⚠️ PARTIAL SUCCESS: Course-quiz relationships fixed, but some quiz-question issues remain');
        }
        else if (questionFixSuccess) {
            console.log('\n⚠️ PARTIAL SUCCESS: Quiz-question relationships fixed, but some course-quiz issues remain');
        }
        else if (afterStats.courseQuizCount > beforeStats.courseQuizCount ||
            afterStats.quizQuestionCount > beforeStats.quizQuestionCount) {
            console.log('\n⚠️ PARTIAL SUCCESS: Some relationships fixed, but issues remain');
        }
        else {
            console.log('\n❌ FAILURE: No improvements were made');
        }
        // List problematic quizzes if any
        if (invalidCourseQuizzes.length > 0) {
            console.log('\nQuizzes missing course links:');
            invalidCourseQuizzes.forEach((quiz) => {
                console.log(`- "${quiz.title}" (${quiz.id}): direct_id=${quiz.has_direct_id}, relationship=${quiz.has_relationship}`);
            });
        }
        if (invalidQuizQuestions.length > 0) {
            console.log('\nQuizzes with mismatched question links:');
            invalidQuizQuestions.forEach((quiz) => {
                console.log(`- "${quiz.title}" (${quiz.id}): direct_questions=${quiz.direct_question_count}, rel_questions=${quiz.rel_question_count}`);
            });
        }
        if (emptyQuizzes.length > 0) {
            console.log('\nQuizzes with no questions:');
            emptyQuizzes.forEach((quiz) => {
                console.log(`- "${quiz.title}" (${quiz.id})`);
            });
        }
        console.log('\nCourse-quiz relationship fix completed');
    }
    catch (error) {
        console.error('Error fixing course-quiz relationships:', error);
        throw error;
    }
    finally {
        await client.end();
        console.log('Disconnected from database');
    }
}
/**
 * Get current relationship statistics
 */
async function getRelationshipStats(client) {
    try {
        // Query quiz stats
        const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_quiz_count,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as quiz_question_count,
        (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions') as quizzes_with_questions_count
    `);
        const totalQuizzes = parseInt(statsResult.rows[0].total_quizzes || '0');
        const courseQuizCount = parseInt(statsResult.rows[0].course_quiz_count || '0');
        const quizQuestionCount = parseInt(statsResult.rows[0].quiz_question_count || '0');
        const quizzesWithQuestionsCount = parseInt(statsResult.rows[0].quizzes_with_questions_count || '0');
        console.log(`- Total quizzes: ${totalQuizzes}`);
        console.log(`- Course-quiz relationships: ${courseQuizCount}`);
        console.log(`- Quiz-question relationships: ${quizQuestionCount}`);
        console.log(`- Quizzes with questions: ${quizzesWithQuestionsCount}`);
        return {
            totalQuizzes,
            courseQuizCount,
            quizQuestionCount,
            quizzesWithQuestionsCount,
        };
    }
    catch (error) {
        console.warn(`Could not get relationship stats: ${error}`);
        return {
            totalQuizzes: 0,
            courseQuizCount: 0,
            quizQuestionCount: 0,
            quizzesWithQuestionsCount: 0,
        };
    }
}
// Run the function if this file is executed directly
if (require.main === module) {
    fixCourseQuizRelationships()
        .then(() => console.log('Course-quiz relationship fix completed'))
        .catch((error) => {
        console.error('Failed to fix course-quiz relationships:', error);
        process.exit(1);
    });
}
