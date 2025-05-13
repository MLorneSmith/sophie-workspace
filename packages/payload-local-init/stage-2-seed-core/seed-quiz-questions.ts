// seed-quiz-questions.ts
// Script for Stage 2: Core Content Seeding - Unique Quiz Questions
import type { Payload } from 'payload';
import { v4 as uuidv4 } from 'uuid';

// Import Payload config
// Corrected relative paths and imports for SSoT and types
import { ALL_QUIZ_QUESTIONS } from '../data/quizzes-quiz-questions-truth.js';

console.log('Starting Stage 2: Seed Unique Quiz Questions...');

// Helper function to generate a URL-friendly slug from text
function generateSlug(text: string): string {
  if (!text) return uuidv4(); // Fallback for empty text
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}

export async function seedQuizQuestions(
  payload: Payload,
): Promise<Record<string, string>> {
  const ssotQuestionIdToLiveQuestionIdMap: Record<string, string> = {};

  try {
    console.log('Executing: Seed Unique Quiz Questions (via orchestrator)...');

    const uniqueQuestions = Object.values(ALL_QUIZ_QUESTIONS);
    console.log(
      `Found ${uniqueQuestions.length} unique quiz questions in SSOT to seed.`,
    );

    console.log('Seeding Unique Quiz Questions...');
    for (const question of uniqueQuestions) {
      try {
        const questionSlug =
          question.questionSlug || generateSlug(question.text);

        const existingQuestion = await payload.find({
          collection: 'quiz_questions',
          where: {
            questionSlug: {
              equals: questionSlug,
            },
          },
          limit: 1,
        });

        if (existingQuestion.docs.length === 0) {
          const payloadOptions = question.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          }));

          const hasCorrectOption = payloadOptions.some((opt) => opt.isCorrect);
          if (!hasCorrectOption && payloadOptions.length > 0) {
            console.warn(
              `Warning: Question "${question.text.substring(0, 50)}..." (Slug: ${questionSlug}) has no correct option marked.`,
            );
          }

          const questionType = 'multiple_choice';

          // Create the document and capture the result to get the actual Payload ID
          const createdDocument = await payload.create({
            collection: 'quiz_questions',
            data: {
              // Let Payload assign the ID
              questionSlug: questionSlug,
              question: question.text,
              options: payloadOptions,
              type: questionType,
              explanation: question.explanation ?? null,
            },
          });

          // Map SSOT ID to the actual Payload ID assigned during creation
          ssotQuestionIdToLiveQuestionIdMap[question.id] = createdDocument.id;

          console.log(
            `Created Quiz Question: ${question.text.substring(0, 50)}... (Live ID: ${createdDocument.id}, Slug: ${questionSlug}, SSOT ID was: ${question.id})`,
          );
        } else {
          const existingLiveId = existingQuestion.docs[0]?.id;
          if (existingLiveId) {
            // If question already exists, map its SSOT ID to its current live ID
            ssotQuestionIdToLiveQuestionIdMap[question.id] = existingLiveId;
          }
          console.log(
            `Quiz Question with slug "${questionSlug}" already exists with Live ID ${existingLiveId}. SSOT ID was: ${question.id}. Skipping creation. Map updated if ID found.`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error seeding Quiz Question "${question.text.substring(0, 50)}...":`,
          error.message,
          error.stack,
        );
      }
    }
    console.log('Unique Quiz Questions seeding completed.');

    // Return the map instead of writing to file
    return ssotQuestionIdToLiveQuestionIdMap;
  } catch (error: any) {
    console.error(
      'Error during Seed Unique Quiz Questions process:',
      error.message,
      error.stack,
    );
    throw error; // Re-throw to be caught by the orchestrator
  }
}
