/**
 * Quiz Relationship Analysis Script (Fixed)
 *
 * This script analyzes the current state of quiz relationships in the database
 * and identifies any issues that need to be fixed.
 */
import fs from 'fs';
import path from 'path';
import { executeSQL } from '../../../utils/db/execute-sql.js';
const outputDir = path.join(process.cwd(), 'z.plan', 'quizzes');
async function analyzeQuizRelationships() {
    try {
        console.log('Starting quiz relationship analysis...');
        // Start a transaction for consistent reads
        await executeSQL('BEGIN');
        // Get all quizzes from the database
        const quizzesResult = await executeSQL(`
      SELECT 
        id, 
        title, 
        slug,
        description,
        pass_threshold as "passingScore",
        passing_score,
        course_id,
        course_id_id
      FROM 
        payload.course_quizzes
      ORDER BY 
        title
    `);
        const quizzes = quizzesResult.rows;
        console.log(`Found ${quizzes.length} quizzes in the database`);
        // Initialize results for our report
        const results = {
            totalQuizzes: quizzes.length,
            quizzesWithQuestions: 0,
            quizzesWithoutQuestions: 0,
            quizzesWithMissingRelationships: 0,
            quizzesWithoutCourse: 0,
            quizDetails: [],
        };
        // Analyze each quiz
        for (const quiz of quizzes) {
            console.log(`Analyzing quiz: ${quiz.title} (${quiz.id})`);
            // Initialize quiz details
            const quizDetail = {
                id: quiz.id,
                title: quiz.title,
                slug: quiz.slug,
                description: quiz.description || '',
                passingScore: quiz.passingScore || quiz.passing_score || 70,
                questionsArray: [],
                relEntries: [],
                courseId: quiz.course_id || quiz.course_id_id,
                hasMissingRelationships: false,
                hasNoQuestions: false,
                hasNoCourse: false,
            };
            // Check if quiz has a course
            if (!quiz.course_id && !quiz.course_id_id) {
                results.quizzesWithoutCourse++;
                quizDetail.hasNoCourse = true;
            }
            // Get relationship entries from course_quizzes_rels
            const relEntriesResult = await executeSQL(`
        SELECT 
          id,
          _parent_id as parent_id,
          path,
          field,
          "order"
        FROM 
          payload.course_quizzes_rels
        WHERE 
          _parent_id = $1 AND path = 'questions'
        ORDER BY
          "order"
      `, [quiz.id]);
            const relEntries = relEntriesResult.rows;
            quizDetail.relEntries = relEntries;
            // Count relationships as questions array
            if (relEntries.length > 0) {
                results.quizzesWithQuestions++;
                quizDetail.questionsArray = relEntries.map((rel) => rel.id);
            }
            else {
                results.quizzesWithoutQuestions++;
                quizDetail.hasNoQuestions = true;
            }
            // Add quiz detail to results
            results.quizDetails.push(quizDetail);
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
        const reportFile = path.join(outputDir, 'quiz-relationship-analysis.md');
        fs.writeFileSync(reportFile, report);
        // Write the detailed data to a JSON file
        const jsonFile = path.join(outputDir, 'quiz-relationship-data.json');
        fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
        console.log(`Analysis complete! Report written to ${reportFile}`);
        console.log(`Detailed data written to ${jsonFile}`);
        return results;
    }
    catch (error) {
        // Rollback on error
        await executeSQL('ROLLBACK');
        console.error('Error analyzing quiz relationships:', error);
        throw error;
    }
}
function generateReport(results) {
    return `# Quiz Relationship Analysis Report

## Summary

- Total Quizzes: ${results.totalQuizzes}
- Quizzes with Questions: ${results.quizzesWithQuestions}
- Quizzes without Questions: ${results.quizzesWithoutQuestions}
- Quizzes with Missing/Inconsistent Relationships: ${results.quizzesWithMissingRelationships}
- Quizzes without Course: ${results.quizzesWithoutCourse}

## Problem Quizzes

### Quizzes without Questions

${results.quizDetails
        .filter((quiz) => quiz.hasNoQuestions)
        .map((quiz) => `- **${quiz.title}** (${quiz.id}): No questions assigned`)
        .join('\n') || '- None'}

### Quizzes with Missing/Inconsistent Relationships

${results.quizDetails
        .filter((quiz) => quiz.hasMissingRelationships)
        .map((quiz) => {
        const questionsCount = quiz.questionsArray.length;
        const relCount = quiz.relEntries.length;
        return `- **${quiz.title}** (${quiz.id}): Questions array (${questionsCount}) vs. Relationship entries (${relCount})`;
    })
        .join('\n') || '- None'}

### Quizzes without Course

${results.quizDetails
        .filter((quiz) => quiz.hasNoCourse)
        .map((quiz) => `- **${quiz.title}** (${quiz.id}): No course assigned`)
        .join('\n') || '- None'}
`;
}
// Run the analysis
analyzeQuizRelationships().catch((error) => {
    console.error('Critical error during quiz relationship analysis:', error);
    process.exit(1);
});
