// seed-quiz-questions.ts
// Script for Stage 2: Core Content Seeding - Unique Quiz Questions
import type { Payload } from 'payload';
import { v4 as uuidv4 } from 'uuid';

// Import Payload config
// Corrected relative paths and imports for SSoT and types
import { ALL_QUIZ_QUESTIONS } from '../data/quizzes-quiz-questions-truth.js'; 

console.log('Starting Stage 2: Seed Unique Quiz Questions...');

// Define a local type for the SSOT question structure
interface QuizQuestionOptionSSOT {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionSSOT {
  id: string; // Assuming ID is a string (e.g., UUID) based on logs
  questionSlug?: string;
  text: string;
  options: QuizQuestionOptionSSOT[];
  explanation?: string | null;
}

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

    // Filter out potential undefined values and assert type
    const questionSource = Object.values(ALL_QUIZ_QUESTIONS) as (QuizQuestionSSOT | undefined | null)[];
    const uniqueQuestions: QuizQuestionSSOT[] = questionSource.filter(
      (q): q is QuizQuestionSSOT => q != null 
    );

    console.log(
      `Found ${uniqueQuestions.length} unique quiz questions in SSOT. Processing all of them.`,
    );

    console.log('Seeding Unique Quiz Questions...');
    let questionIndex = 0;
    // Temporarily limit to first 100 questions for debugging with delays
    const questionsToProcess = uniqueQuestions.slice(0, 100); // Process all unique questions

    for (const question of questionsToProcess) { // Using for...of loop on limited list
      questionIndex++;
      const questionIdentifier = question.questionSlug || question.text.substring(0, 70);
      console.log(`[SQS-${questionIndex}/${questionsToProcess.length}] Processing question: "${questionIdentifier}" (SSOT ID: ${question.id})`);

      try {
        const questionSlug =
          question.questionSlug || generateSlug(question.text);
        console.log(`[SQS-${questionIndex}] Generated/Using slug: ${questionSlug}`);

        console.log(`[SQS-${questionIndex}] Checking if question with slug "${questionSlug}" exists...`);
        console.log(`[SQS-${questionIndex}] Calling payload.find...`);
        const existingQuestion = await payload.find({
          collection: 'quiz_questions',
          where: {
            questionSlug: {
              equals: questionSlug,
            },
          },
          limit: 1,
        });
        console.log(`[SQS-${questionIndex}] payload.find completed. Found: ${existingQuestion.docs.length > 0}`);

        if (existingQuestion.docs.length === 0) {
          console.log(`[SQS-${questionIndex}] Question with slug "${questionSlug}" does not exist. Preparing to create...`);
          const payloadOptions = question.options.map((opt: QuizQuestionOptionSSOT) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          }));

          const hasCorrectOption = payloadOptions.some((opt: QuizQuestionOptionSSOT) => opt.isCorrect);
          if (!hasCorrectOption && payloadOptions.length > 0) {
            console.warn(
              `[SQS-${questionIndex}] Warning: Question "${question.text.substring(0, 50)}..." (Slug: ${questionSlug}) has no correct option marked.`
            );
          }

          const questionType = 'multiple_choice' as const; 
          const dataToCreate = {
            questionSlug: questionSlug,
            question: question.text,
            options: payloadOptions,
            type: questionType,
            // Parse the explanation JSON string if it exists
            explanation: question.explanation ? JSON.parse(question.explanation) : null,
          };
          console.log(`[SQS-${questionIndex}] Data for creation: ${JSON.stringify(dataToCreate).substring(0, 200)}...`);

          console.log(`[SQS-${questionIndex}] Calling payload.create for slug "${questionSlug}"...`);
          const createdDocument = await payload.create({
            collection: 'quiz_questions',
            data: dataToCreate,
          });
          console.log(`[SQS-${questionIndex}] payload.create completed.`);

          ssotQuestionIdToLiveQuestionIdMap[String(question.id)] = String(createdDocument.id); 
          console.log(
            `[SQS-${questionIndex}] Created Quiz Question: ${question.text.substring(0, 50)}... (Live ID: ${createdDocument.id}, Slug: ${questionSlug}, SSOT ID was: ${question.id})`
          );
        } else {
          const existingLiveId = existingQuestion.docs[0]?.id;
          if (existingLiveId) {
            ssotQuestionIdToLiveQuestionIdMap[String(question.id)] = String(existingLiveId); 
          }
          console.log(
            `[SQS-${questionIndex}] Quiz Question with slug "${questionSlug}" already exists with Live ID ${existingLiveId}. SSOT ID was: ${question.id}. Skipping creation. Map updated if ID found.`
          );
        }
        console.log(`[SQS-${questionIndex}] Finished processing question: "${questionIdentifier}"`);
        
        // Add a small delay after processing each question
        console.log(`[SQS-${questionIndex}] Adding 2000ms delay...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`[SQS-${questionIndex}] Delay finished.`);

      } catch (error: any) {
        console.error(
          `[SQS-${questionIndex}] Error seeding Quiz Question "${question.text.substring(0, 50)}...":`,
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
