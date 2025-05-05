/**
 * Quiz System Repair utilities
 * Provides helper functions used throughout the quiz relationship repair system
 */
import { getLogger } from '../../../../utils/logging.js';
// Create a logger instance for the quiz system repair
const logger = getLogger('QuizSystemRepair');
/**
 * Maps quiz-to-question relationships from database results
 */
export function mapQuizToQuestions(relationships) {
    const map = new Map();
    for (const rel of relationships) {
        const quizId = rel._parent_id;
        const questionId = rel.quiz_questions_id;
        if (!map.has(quizId)) {
            map.set(quizId, []);
        }
        map.get(quizId)?.push(questionId);
    }
    return map;
}
/**
 * Maps question-to-quiz relationships from database results
 */
export function mapQuestionToQuiz(relationships) {
    const map = new Map();
    for (const rel of relationships) {
        const questionId = rel._parent_id;
        const quizId = rel.value;
        map.set(questionId, quizId);
    }
    return map;
}
/**
 * Identifies relationship issues between quizzes and questions
 */
export function identifyRelationshipIssues(quizzes, questions, quizToQuestions, questionToQuiz) {
    const issues = [];
    // Check for quizzes with questions in JSONB but missing in relationship tables
    for (const quiz of quizzes) {
        // Skip if quiz has no questions
        if (!quiz.questions ||
            !Array.isArray(quiz.questions) ||
            quiz.questions.length === 0) {
            continue;
        }
        const questionIdsInJsonb = quiz.questions.map((q) => q.id).filter(Boolean);
        const questionIdsInRels = quizToQuestions.get(quiz.id) || [];
        // Identify missing primary relationships
        for (const questionId of questionIdsInJsonb) {
            if (!questionIdsInRels.includes(questionId)) {
                issues.push({
                    type: 'missing_primary',
                    quiz_id: quiz.id,
                    question_id: questionId,
                    details: `Quiz "${quiz.title}" (${quiz.id}) has question ${questionId} in JSONB but missing in relationship table`,
                });
            }
        }
    }
    // Check for primary relationships missing bidirectional links
    for (const [quizId, questionIds] of quizToQuestions.entries()) {
        for (const questionId of questionIds) {
            if (!questionToQuiz.has(questionId)) {
                issues.push({
                    type: 'missing_bidirectional',
                    quiz_id: quizId,
                    question_id: questionId,
                    details: `Question ${questionId} has a primary relationship to quiz ${quizId} but missing bidirectional link`,
                });
            }
            else if (questionToQuiz.get(questionId) !== quizId) {
                issues.push({
                    type: 'field_mismatch',
                    quiz_id: quizId,
                    question_id: questionId,
                    details: `Question ${questionId} has a bidirectional link to quiz ${questionToQuiz.get(questionId)} but should link to ${quizId}`,
                });
            }
        }
    }
    // Check for inconsistent JSONB format
    for (const quiz of quizzes) {
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            continue;
        }
        const questionIdsInRels = quizToQuestions.get(quiz.id) || [];
        if (questionIdsInRels.length === 0) {
            continue; // Skip if no relationships exist
        }
        // Find all questions associated with this quiz
        const relatedQuestions = questions.filter((q) => questionIdsInRels.includes(q.id));
        // Check if all related questions are properly represented in JSONB
        for (const question of relatedQuestions) {
            const questionInJsonb = quiz.questions.find((q) => q.id === question.id);
            if (!questionInJsonb) {
                issues.push({
                    type: 'jsonb_format',
                    quiz_id: quiz.id,
                    question_id: question.id,
                    details: `Question ${question.id} is related to quiz "${quiz.title}" but missing in JSONB questions array`,
                });
            }
        }
    }
    return issues;
}
/**
 * Logs a detailed summary of the repair operation
 */
export function logRepairSummary(result, options) {
    const { verbose } = options;
    logger.info('=============================================');
    logger.info('Quiz System Repair Summary');
    logger.info('=============================================');
    if (result.primaryResult) {
        logger.info(`Primary Relationships: ${result.primaryResult.relationshipsCreated} created`);
        if (verbose && result.primaryResult.relationshipsCreated > 0) {
            result.primaryResult.newRelationships.forEach((rel, idx) => {
                if (idx < 5 ||
                    idx === result.primaryResult.newRelationships.length - 1) {
                    logger.info(`  - Quiz ${rel._parent_id} → Question ${rel.quiz_questions_id}`);
                }
                else if (idx === 5) {
                    logger.info(`  - ... and ${result.primaryResult.newRelationships.length - 5} more`);
                }
            });
        }
    }
    if (result.bidirectionalResult) {
        logger.info(`Bidirectional Relationships: ${result.bidirectionalResult.relationshipsCreated} created`);
        if (verbose && result.bidirectionalResult.relationshipsCreated > 0) {
            result.bidirectionalResult.newRelationships.forEach((rel, idx) => {
                if (idx < 5 ||
                    idx === result.bidirectionalResult.newRelationships.length - 1) {
                    logger.info(`  - Question ${rel._parent_id} → Quiz ${rel.value}`);
                }
                else if (idx === 5) {
                    logger.info(`  - ... and ${result.bidirectionalResult.newRelationships.length - 5} more`);
                }
            });
        }
    }
    if (result.jsonbResult) {
        logger.info(`JSONB Format: ${result.jsonbResult.quizzesUpdated} quizzes updated`);
        if (verbose && result.jsonbResult.quizzesUpdated > 0) {
            result.jsonbResult.updatedQuizzes.forEach((quiz, idx) => {
                if (idx < 5 || idx === result.jsonbResult.updatedQuizzes.length - 1) {
                    logger.info(`  - Quiz "${quiz.title}" (${quiz.id})`);
                }
                else if (idx === 5) {
                    logger.info(`  - ... and ${result.jsonbResult.updatedQuizzes.length - 5} more`);
                }
            });
        }
    }
    if (result.verificationResult) {
        logger.info(`Verification: ${result.verificationResult.success ? 'PASSED' : 'FAILED'}`);
        logger.info(`  - ${result.verificationResult.message}`);
        if (!result.verificationResult.success && verbose) {
            result.verificationResult.issues.forEach((issue, idx) => {
                if (idx < 5 || idx === result.verificationResult.issues.length - 1) {
                    logger.info(`  - Issue: ${JSON.stringify(issue)}`);
                }
                else if (idx === 5) {
                    logger.info(`  - ... and ${result.verificationResult.issues.length - 5} more issues`);
                }
            });
        }
    }
    logger.info('=============================================');
}
