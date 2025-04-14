/**
 * Type definitions for the quiz system
 */
// Schema validation functions
export function validateQuizDefinition(quiz) {
    // Basic validation
    if (!quiz.id || !quiz.slug || !quiz.title)
        return false;
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quiz.id))
        return false;
    // Ensure all questions have valid IDs and options
    return quiz.questions.every((q) => !!q.id &&
        !!q.text &&
        Array.isArray(q.options) &&
        q.options.length > 0 &&
        q.correctOptionIndex >= 0 &&
        q.correctOptionIndex < q.options.length);
}
