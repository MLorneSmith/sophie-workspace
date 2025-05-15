/**
 * Type definitions for the quiz system
 */
// Schema validation functions
export function validateQuizDefinition(quiz) {
    // Basic validation
    if (!quiz.id || !quiz.slug || !quiz.title)
        return false;
    // UUID validation for quiz ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quiz.id))
        return false;
    // Ensure questionIds is an array (can be empty if a quiz has no questions yet)
    if (!Array.isArray(quiz.questionIds))
        return false;
    // Further validation could involve checking if IDs in questionIds exist in a separate
    // list of all QuizQuestionDefinition, but that's beyond simple type validation here.
    // For now, we just ensure it's an array of strings.
    return quiz.questionIds.every((id) => typeof id === 'string');
}
// Optional: A validation function for QuizQuestionDefinition if needed elsewhere
export function validateQuizQuestionDefinition(question) {
    if (!question.id || !question.text)
        return false;
    // UUID validation for question ID (if we enforce UUIDs for all question IDs)
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(question.id)) return false; // Or allow SHA1 for existing
    if (!Array.isArray(question.options) || question.options.length < 2) {
        // Assuming a question must have at least two options
        return false;
    }
    return question.options.every((opt) => typeof opt.id === 'string' && // Validate option ID
        // uuidRegex.test(opt.id) && // Optionally validate option ID as UUID
        typeof opt.text === 'string' &&
        typeof opt.isCorrect === 'boolean');
}
//# sourceMappingURL=quiz-types.js.map