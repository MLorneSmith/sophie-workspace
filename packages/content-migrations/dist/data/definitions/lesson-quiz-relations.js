"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LESSON_QUIZ_RELATIONS = void 0;
exports.validateLessonQuizRelations = validateLessonQuizRelations;
exports.getQuizForLesson = getQuizForLesson;
exports.getQuizIdForLesson = getQuizIdForLesson;
const quizzes_js_1 = require("./quizzes.js");
/**
 * Defines which lessons have which quizzes.
 * This is the single source of truth for lesson-quiz relationships.
 */
exports.LESSON_QUIZ_RELATIONS = [
    {
        lessonSlug: 'basic-graphs',
        quizSlug: 'basic-graphs-quiz',
    },
    {
        lessonSlug: 'elements-of-design-detail',
        quizSlug: 'elements-of-design-detail-quiz',
    },
    {
        lessonSlug: 'fact-persuasion',
        quizSlug: 'fact-persuasion-quiz',
    },
    {
        lessonSlug: 'gestalt-principles',
        quizSlug: 'gestalt-principles-quiz',
    },
    // Add all other lesson-quiz relationships
];
// Validation to ensure all referenced quizzes exist
function validateLessonQuizRelations() {
    return exports.LESSON_QUIZ_RELATIONS.every((relation) => !!quizzes_js_1.QUIZZES[relation.quizSlug]);
}
// Helper to get the quiz for a lesson
function getQuizForLesson(lessonSlug) {
    const relation = exports.LESSON_QUIZ_RELATIONS.find((r) => r.lessonSlug === lessonSlug);
    return relation ? relation.quizSlug : null;
}
// Helper to get quiz ID for a lesson
function getQuizIdForLesson(lessonSlug) {
    const quizSlug = getQuizForLesson(lessonSlug);
    if (!quizSlug)
        return null;
    const quiz = quizzes_js_1.QUIZZES[quizSlug];
    return quiz ? quiz.id : null;
}
