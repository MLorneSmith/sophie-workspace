/**
 * Quiz Relationship Analysis Script
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
        questions,
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
        questionsArray: [],
        relEntries: [],
        courseId: quiz.course_id || quiz.course_id_id,
        hasMissingRelationships: false,
        hasNoQuestions: false,
        hasNoCourse: false,
      };

      // Get questions from the quiz record (questions array)
      let questions = [];
      if (quiz.questions && Array.isArray(quiz.questions)) {
        questions = quiz.questions;
        quizDetail.questionsArray = questions;
      }

      // Check if quiz has a course
      if (!quiz.course_id && !quiz.course_id_id) {
        results.quizzesWithoutCourse++;
        quizDetail.hasNoCourse = true;
      }

      // Check if quiz has questions in its questions array
      if (questions.length === 0) {
        results.quizzesWithoutQuestions++;
        quizDetail.hasNoQuestions = true;
      } else {
        results.quizzesWithQuestions++;
      }

      // Get relationship entries from course_quizzes_rels
      const relEntriesResult = await executeSQL(
        `
        SELECT 
          id,
          parent_id,
          path,
          field,
          "order"
        FROM 
          payload.course_quizzes_rels
        WHERE 
          parent_id = $1 AND path = 'questions'
        ORDER BY
          "order"
      `,
        [quiz.id],
      );

      const relEntries = relEntriesResult.rows;
      quizDetail.relEntries = relEntries;

      // Check for missing relationships
      if (questions.length > 0 && relEntries.length === 0) {
        console.log(
          `  Warning: Quiz has questions array but no relationship entries`,
        );
        results.quizzesWithMissingRelationships++;
        quizDetail.hasMissingRelationships = true;
      } else if (questions.length === 0 && relEntries.length > 0) {
        console.log(
          `  Warning: Quiz has relationship entries but no questions array`,
        );
        results.quizzesWithMissingRelationships++;
        quizDetail.hasMissingRelationships = true;
      } else if (questions.length !== relEntries.length) {
        console.log(
          `  Warning: Quiz has different number of questions (${questions.length}) and relationship entries (${relEntries.length})`,
        );
        results.quizzesWithMissingRelationships++;
        quizDetail.hasMissingRelationships = true;
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
  } catch (error) {
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
  .join('\n')}

### Quizzes with Missing/Inconsistent Relationships

${results.quizDetails
  .filter((quiz) => quiz.hasMissingRelationships)
  .map((quiz) => {
    const questionsCount = quiz.questionsArray.length;
    const relCount = quiz.relEntries.length;
    return `- **${quiz.title}** (${quiz.id}): Questions array (${questionsCount}) vs. Relationship entries (${relCount})`;
  })
  .join('\n')}

### Quizzes without Course

${results.quizDetails
  .filter((quiz) => quiz.hasNoCourse)
  .map((quiz) => `- **${quiz.title}** (${quiz.id}): No course assigned`)
  .join('\n')}
`;
}

// Run the analysis
analyzeQuizRelationships().catch((error) => {
  console.error('Critical error during quiz relationship analysis:', error);
  process.exit(1);
});
