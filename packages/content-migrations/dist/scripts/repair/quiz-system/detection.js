import { getLogger } from '../../../utils/logging.js';
import { identifyRelationshipIssues, mapQuestionToQuiz, mapQuizToQuestions, } from './utils/index.js';
const logger = getLogger('QuizSystemDetection');
/**
 * Detects the current state of quiz-question relationships in the database
 * @param db Database connection or transaction
 * @returns The current state of quiz relationships
 */
export async function detectQuizRelationships(db) {
    logger.info('Detecting quiz relationships...');
    try {
        // Set search path to include the payload schema - we need to make sure this command is compatible
        await db.execute(`SELECT set_config('search_path', 'payload, public', false);`);
        // Get all quizzes
        logger.info('Fetching quizzes...');
        const quizzes = (await db.execute(`SELECT id, title, slug, questions FROM course_quizzes`));
        logger.info(`Found ${quizzes.length} quizzes`);
        // Get all questions
        logger.info('Fetching questions...');
        const questions = (await db.execute(`SELECT id, question, options, correct_answer, type, explanation FROM quiz_questions`));
        logger.info(`Found ${questions.length} questions`);
        // Get existing quiz-to-question relationships
        logger.info('Fetching quiz-to-question relationships...');
        const quizToQuestionRels = (await db.execute(`
      SELECT _parent_id, quiz_questions_id 
      FROM course_quizzes_rels 
      WHERE quiz_questions_id IS NOT NULL
      AND path = 'questions'
    `));
        logger.info(`Found ${quizToQuestionRels.length} quiz-to-question relationships`);
        // Get existing question-to-quiz relationships
        logger.info('Fetching question-to-quiz relationships...');
        const questionToQuizRels = (await db.execute(`
      SELECT _parent_id, value 
      FROM quiz_questions_rels 
      WHERE field = 'quiz_id'
    `));
        logger.info(`Found ${questionToQuizRels.length} question-to-quiz relationships`);
        // Map relationships
        const quizToQuestions = mapQuizToQuestions(quizToQuestionRels);
        const questionToQuiz = mapQuestionToQuiz(questionToQuizRels);
        // Identify issues
        const issues = identifyRelationshipIssues(quizzes, questions, quizToQuestions, questionToQuiz);
        logger.info(`Detection completed. Found ${issues.length} issues.`);
        if (issues.length > 0) {
            logger.info(`Issues by type:`);
            const issuesByType = issues.reduce((acc, issue) => {
                acc[issue.type] = (acc[issue.type] || 0) + 1;
                return acc;
            }, {});
            Object.entries(issuesByType).forEach(([type, count]) => {
                logger.info(`  - ${type}: ${count}`);
            });
        }
        return {
            quizzes,
            questions,
            quizToQuestions,
            questionToQuiz,
            issues,
        };
    }
    catch (error) {
        logger.error('Error detecting quiz relationships', error);
        throw new Error(`Failed to detect quiz relationships: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Logs a summary of the detection results
 * @param state The quiz system state
 */
export function logDetectionSummary(state) {
    const { quizzes, questions, quizToQuestions, questionToQuiz, issues } = state;
    logger.info('=============================================');
    logger.info('Quiz Relationship Detection Summary');
    logger.info('=============================================');
    logger.info(`Found ${quizzes.length} quizzes`);
    logger.info(`Found ${questions.length} questions`);
    logger.info(`Found ${Array.from(quizToQuestions.values()).reduce((sum, arr) => sum + arr.length, 0)} quiz-to-question relationships`);
    logger.info(`Found ${questionToQuiz.size} question-to-quiz relationships`);
    logger.info(`Detected ${issues.length} issues`);
    if (issues.length > 0) {
        const issueGroups = issues.reduce((acc, issue) => {
            if (!acc[issue.type]) {
                acc[issue.type] = [];
            }
            acc[issue.type].push(issue);
            return acc;
        }, {});
        Object.entries(issueGroups).forEach(([type, typeIssues]) => {
            logger.info(`  - ${type}: ${typeIssues.length}`);
            if (typeIssues.length > 0 && typeIssues.length <= 3) {
                // Show examples for small issue counts
                typeIssues.forEach((issue) => {
                    logger.info(`    - ${issue.details}`);
                });
            }
            else if (typeIssues.length > 3) {
                // Show only a few examples for larger counts
                logger.info(`    - ${typeIssues[0].details}`);
                logger.info(`    - ${typeIssues[1].details}`);
                logger.info(`    - ... and ${typeIssues.length - 2} more similar issues`);
            }
        });
    }
    logger.info('=============================================');
}
