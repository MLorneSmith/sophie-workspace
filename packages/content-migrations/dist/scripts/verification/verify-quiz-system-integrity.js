"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyQuizSystemIntegrity = verifyQuizSystemIntegrity;
const lesson_quiz_relations_js_1 = require("../../data/definitions/lesson-quiz-relations.js");
const quiz_types_js_1 = require("../../data/definitions/quiz-types.js");
const quizzes_js_1 = require("../../data/definitions/quizzes.js");
/**
 * Performs comprehensive verification of the quiz system
 */
function verifyQuizSystemIntegrity() {
    console.log('Verifying quiz system integrity...');
    let allValid = true;
    // Step 1: Verify all quiz definitions are valid
    console.log('Verifying quiz definitions...');
    for (const [slug, quiz] of Object.entries(quizzes_js_1.QUIZZES)) {
        if (!(0, quiz_types_js_1.validateQuizDefinition)(quiz)) {
            console.error(`Invalid quiz definition for ${slug}`);
            allValid = false;
        }
        // Verify slug consistency
        if (quiz.slug !== slug) {
            console.error(`Slug mismatch for quiz ${slug}: object key is ${slug} but internal slug is ${quiz.slug}`);
            allValid = false;
        }
    }
    // Step 2: Verify quiz IDs are unique
    console.log('Verifying quiz IDs are unique...');
    const quizIds = new Set();
    for (const quiz of Object.values(quizzes_js_1.QUIZZES)) {
        if (quizIds.has(quiz.id)) {
            console.error(`Duplicate quiz ID: ${quiz.id} (${quiz.slug})`);
            allValid = false;
        }
        quizIds.add(quiz.id);
        // Verify question IDs are unique within the quiz
        const questionIds = new Set();
        for (const question of quiz.questions) {
            if (questionIds.has(question.id)) {
                console.error(`Duplicate question ID in quiz ${quiz.slug}: ${question.id}`);
                allValid = false;
            }
            questionIds.add(question.id);
        }
    }
    // Step 3: Verify lesson-quiz relations
    console.log('Verifying lesson-quiz relations...');
    if (!(0, lesson_quiz_relations_js_1.validateLessonQuizRelations)()) {
        console.error('Invalid lesson-quiz relations');
        allValid = false;
    }
    // Step 4: Verify lookup functions work correctly
    console.log('Verifying lookup functions...');
    for (const quiz of Object.values(quizzes_js_1.QUIZZES)) {
        const bySlug = (0, quizzes_js_1.getQuizBySlug)(quiz.slug);
        if (!bySlug || bySlug.id !== quiz.id) {
            console.error(`getQuizBySlug failed for ${quiz.slug}`);
            allValid = false;
        }
        const byId = (0, quizzes_js_1.getQuizById)(quiz.id);
        if (!byId || byId.slug !== quiz.slug) {
            console.error(`getQuizById failed for ${quiz.id}`);
            allValid = false;
        }
    }
    if (allValid) {
        console.log('Quiz system integrity verified successfully!');
    }
    else {
        console.error('Quiz system integrity verification failed!');
    }
    return allValid;
}
// CLI entrypoint
if (import.meta.url === import.meta.resolve('./verify-quiz-system-integrity.ts')) {
    const result = verifyQuizSystemIntegrity();
    process.exit(result ? 0 : 1);
}
