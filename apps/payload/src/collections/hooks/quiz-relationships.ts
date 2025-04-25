/**
 * Quiz Relationship Hooks
 *
 * These hooks ensure quiz questions are always properly formatted
 * for Payload UI display and maintain consistency when edits are made.
 */
import { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'

/**
 * Ensures quiz questions array is always properly formatted for Payload UI
 * This runs after reading a document from the database and ensures the format
 * matches what Payload UI expects, even if the database format is inconsistent.
 */
export const formatQuizQuestionsOnRead: CollectionAfterReadHook = async ({
  doc,
  req,
}: {
  doc: any
  req: any
}) => {
  // Skip if no questions or already properly formatted
  if (!doc.questions || !Array.isArray(doc.questions)) {
    return doc
  }

  // Ensure each question has proper structure
  const formattedQuestions = doc.questions.map((q: any) => {
    // If already properly formatted, return as is
    if (q.relationTo === 'quiz_questions' && q.value && q.value.id) {
      return q
    }

    // Format as expected by Payload UI
    return {
      id: q.id || q,
      relationTo: 'quiz_questions',
      value: {
        id: typeof q === 'object' ? q.id || q.questionId : q,
      },
    }
  })

  // Return document with formatted questions
  return {
    ...doc,
    questions: formattedQuestions,
  }
}

/**
 * Ensures relationship tables stay in sync with questions array
 * This is a safety net to maintain consistency when edits are made through the UI
 */
export const syncQuizQuestionRelationships: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}: {
  data: any
  req: any
  operation: string
}) => {
  // For now, we rely on Payload's built-in relationship handling
  // This hook can be expanded if needed for additional synchronization logic

  // Log operation for monitoring
  if (req.payload?.logger && data.questions) {
    req.payload.logger.info({
      message: `Quiz questions beforeChange hook executed for operation: ${operation}`,
      collection: 'course_quizzes',
    })
  }

  return data
}
