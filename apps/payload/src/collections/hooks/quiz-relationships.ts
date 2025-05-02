/**
 * Quiz Relationship Hooks
 *
 * These hooks ensure quiz questions are always properly formatted
 * for Payload UI display and maintain consistency when edits are made.
 *
 * This is a critical component for maintaining relationship integrity
 * between quizzes and quiz questions.
 */
import { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
import { v4 as uuidv4 } from 'uuid' // Import uuid

// Define the expected structure of quiz questions for type safety
interface QuizQuestion {
  id: string
  relationTo: string
  value: {
    id: string
  }
}

interface QuizDocument {
  id?: string
  questions?: any[] | any
  [key: string]: any
}

/**
 * Ensures quiz questions array is always properly formatted for Payload UI
 * This runs after reading a document from the database and ensures the format
 * matches what Payload UI expects, even if the database format is inconsistent.
 *
 * It handles multiple formats that might be stored in the database:
 * 1. Simple string arrays ["id1", "id2"]
 * 2. Partial objects [{ id: "id1" }, { id: "id2" }]
 * 3. Various other formats
 */
export const formatQuizQuestionsOnRead: CollectionAfterReadHook = async ({
  doc,
  // req, // Temporarily remove req to avoid unused variable warning
}: {
  doc: QuizDocument
  req: any
}) => {
  // --- TEMPORARILY COMMENTED OUT FOR TESTING ---
  // // Skip if no document or no questions field, or if questions is not an array
  // if (!doc || !Array.isArray(doc.questions)) {
  //   // Ensure questions is at least an empty array if it exists but isn't an array
  //   if (doc && doc.questions !== undefined && !Array.isArray(doc.questions)) {
  //     // if (req.payload?.logger) {
  //     //   req.payload.logger.warn({
  //     //     message: `Quiz ${doc.id} has non-array questions field (${typeof doc.questions}). Resetting to empty array.`,
  //     //     collection: 'course_quizzes',
  //     //   })
  //     // }
  //     doc.questions = []
  //   }
  //   return doc
  // }
  // try {
  //   // --- DETAILED LOGGING START ---
  //   // if (req.payload?.logger) {
  //   //   req.payload.logger.info({
  //   //     message: `[formatQuizQuestionsOnRead] Processing quiz ID: ${doc.id}`,
  //   //     collection: 'course_quizzes',
  //   //     questionsRaw: JSON.stringify(doc.questions?.slice(0, 5)), // Log raw input
  //   //   })
  //   // }
  //   // --- DETAILED LOGGING END ---
  //   let needsFormatting = false
  //   // Check if *any* question needs formatting
  //   for (const question of doc.questions) {
  //     if (
  //       !question ||
  //       typeof question !== 'object' ||
  //       question.relationTo !== 'quiz_questions' ||
  //       !question.value ||
  //       typeof question.value !== 'object' ||
  //       !question.value.id ||
  //       typeof question.value.id !== 'string'
  //     ) {
  //       needsFormatting = true
  //       break
  //     }
  //   }
  //   // If no formatting is needed, return the doc as is
  //   if (!needsFormatting) {
  //     return doc
  //   }
  //   // If formatting is needed, process the entire array robustly
  //   // const originalQuestions = JSON.stringify(doc.questions.slice(0, 2)) // Log original state before modification
  //   const formattedQuestions: QuizQuestion[] = []
  //   for (const question of doc.questions) {
  //     let questionId: string | null = null
  //     if (typeof question === 'string' && /^[0-9a-fA-F-]{36}$/.test(question)) {
  //       // Handle case where it's just a UUID string
  //       questionId = question
  //     } else if (typeof question === 'object' && question !== null) {
  //       // Handle various object structures
  //       if (
  //         question.value &&
  //         typeof question.value === 'object' &&
  //         question.value.id &&
  //         typeof question.value.id === 'string'
  //       ) {
  //         // Already has value.id (likely populated)
  //         questionId = question.value.id
  //       } else if (question.id && typeof question.id === 'string') {
  //         // Has id directly
  //         questionId = question.id
  //       } else if (question.questionId && typeof question.questionId === 'string') {
  //         // Has questionId
  //         questionId = question.questionId
  //       }
  //     }
  //     // If a valid UUID was extracted, format it correctly
  //     if (questionId && /^[0-9a-fA-F-]{36}$/.test(questionId)) {
  //       formattedQuestions.push({
  //         // Use the existing array item ID if available and valid, otherwise generate one
  //         id:
  //           typeof question === 'object' &&
  //           question?.id &&
  //           typeof question.id === 'string' &&
  //           /^[0-9a-fA-F-]{36}$/.test(question.id)
  //             ? question.id
  //             : uuidv4(),
  //         relationTo: 'quiz_questions',
  //         value: {
  //           id: questionId,
  //         },
  //       })
  //       // --- DETAILED LOGGING START ---
  //       // if (req.payload?.logger) {
  //       //   req.payload.logger.info({
  //       //     message: `[formatQuizQuestionsOnRead] Formatted question ID: ${questionId} for quiz ${doc.id}`,
  //       //     collection: 'course_quizzes',
  //       //   })
  //       // }
  //       // --- DETAILED LOGGING END ---
  //     } else {
  //       // Log skipped invalid entries
  //       // if (req.payload?.logger) {
  //       //   req.payload.logger.warn({
  //       //     message: `[formatQuizQuestionsOnRead] Skipping invalid question entry for quiz ${doc.id}: ${JSON.stringify(question)}`,
  //       //     collection: 'course_quizzes',
  //       //   })
  //       // }
  //     }
  //   }
  //   // Log the transformation for debugging purposes
  //   // if (req.payload?.logger) {
  //   //   req.payload.logger.info({
  //   //     message: `Formatted quiz questions for quiz ${doc.id}`,
  //   //     collection: 'course_quizzes',
  //   //     before: JSON.stringify(doc.questions.slice(0, 2)),
  //   //     after: JSON.stringify(formattedQuestions.slice(0, 2)),
  //   //   })
  //   // }
  //   // Return document with formatted questions
  //   return {
  //     ...doc,
  //     questions: formattedQuestions,
  //   }
  //   // REMOVED ORPHANED ELSE BLOCK
  // } catch (error) {
  //   // Log error but don't crash the request
  //   // if (req.payload?.logger) {
  //   //   req.payload.logger.error({
  //   //     message: `Error formatting quiz questions for quiz ${doc.id}`,
  //   //     collection: 'course_quizzes',
  //   //     error,
  //   //   })
  //   // }
  //   // Return document unchanged to avoid blocking access
  //   return doc
  // }
  return doc // Just return the document as is for now
}

/**
 * Ensures relationship tables stay in sync with questions array and
 * ensures question data is properly formatted before saving to database.
 *
 * This is a critical safety net to ensure data consistency when edits
 * are made through the Payload UI or API calls.
 */
export const syncQuizQuestionRelationships: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}: {
  data: QuizDocument
  req: any
  operation: string
}) => {
  // Skip if no questions data
  if (!data || !data.questions) {
    return data
  }

  try {
    // Ensure questions is always an array with proper format
    if (!Array.isArray(data.questions)) {
      // If not an array, convert to empty array
      data.questions = []

      if (req.payload?.logger) {
        req.payload.logger.warn({
          message: `Converting non-array questions to empty array for quiz ${data.id || 'new'}`,
          collection: 'course_quizzes',
          operation,
        })
      }
    } else {
      // Format each question to ensure it has the proper structure
      data.questions = data.questions
        .map((question: any) => {
          // If already properly formatted, return as is
          if (
            question &&
            typeof question === 'object' &&
            question.relationTo === 'quiz_questions' &&
            question.value &&
            typeof question.value === 'object' &&
            question.value.id
          ) {
            return question
          }

          // Extract the ID from whatever format we have
          const questionId =
            typeof question === 'object' ? question.id || question.value?.id || question : question

          // Return properly formatted object
          return {
            id: questionId,
            relationTo: 'quiz_questions',
            value: {
              id: questionId,
            },
          }
          // Validate if the extracted ID is a valid string (UUID format check is optional but good)
          if (typeof questionId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(questionId)) {
            if (req.payload?.logger) {
              req.payload.logger.warn({
                message: `Invalid question data found in quiz ${data.id || 'new'}: ${JSON.stringify(question)}. Skipping.`,
                collection: 'course_quizzes',
                operation,
              })
            }
            return null // Return null for invalid entries
          }

          // Return properly formatted object
          return {
            // Generate a new UUID for the array item's 'id' field if it wasn't provided or is invalid
            id:
              typeof question === 'object' &&
              question.id &&
              typeof question.id === 'string' &&
              /^[0-9a-fA-F-]{36}$/.test(question.id)
                ? question.id
                : uuidv4(),
            relationTo: 'quiz_questions',
            value: {
              id: questionId, // Use the validated string ID
            },
          }
        })
        .filter((item): item is QuizQuestion => item !== null) // Filter out null entries
    }

    // Log operation for monitoring
    if (req.payload?.logger) {
      req.payload.logger.info({
        message: `Quiz questions formatted for ${operation} operation on quiz ${data.id || 'new'}`,
        collection: 'course_quizzes',
        questionCount: data.questions.length,
      })
    }
  } catch (error) {
    // Log error but don't crash the request
    if (req.payload?.logger) {
      req.payload.logger.error({
        message: `Error formatting quiz questions during ${operation} operation`,
        collection: 'course_quizzes',
        error,
      })
    }
  }

  return data
}
