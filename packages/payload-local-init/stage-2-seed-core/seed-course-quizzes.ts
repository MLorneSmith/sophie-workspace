// seed-course-quizzes.ts
// Script for Stage 2: Core Content Seeding - Course Quizzes
// Correct relative path to Payload config
// Correct relative path to the SSOT
import { QUIZZES, QuizDefinition } from 'data/definitions/quizzes';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { v4 as uuidv4 } from 'uuid';

// Import uuid generator

// Import Payload type
import config from '../../../apps/payload/src/payload.config';

console.log('Starting Stage 2: Seed Course Quizzes...');

async function seedCourseQuizzes() {
  let payload: Payload | null = null; // Declare payload variable outside try block

  try {
    // Get a local copy of Payload by passing your config
    console.log('Initializing Payload...');
    payload = await getPayload({ config });
    console.log('Payload initialized.');

    // Seed Quiz Questions first
    console.log('Seeding Quiz Questions...');
    for (const quiz of Object.values(QUIZZES)) {
      for (const question of quiz.questions) {
        try {
          // Check if question already exists by ID to avoid duplicates
          const existingQuestion = await payload.find({
            collection: 'quiz_questions', // Correct collection slug
            where: {
              id: {
                equals: question.id,
              },
            },
          });

          if (existingQuestion.docs.length === 0) {
            // Question does not exist, create it

            // Transform options into the expected JSONB format
            const transformedOptions = question.options.map(
              (optionText, index) => {
                // Assuming option IDs are not in SSOT, generate new UUIDs
                const optionId = uuidv4(); // Requires 'uuid' package
                return {
                  id: optionId,
                  text: optionText,
                  isCorrect: index === question.correctOptionIndex,
                };
              },
            );

            // Find the ID of the correct answer from the transformed options
            const correctAnswerId = transformedOptions.find(
              (option) => option.isCorrect,
            )?.id;

            // Determine question type (assuming multiple_choice for now)
            const questionType = 'multiple_choice'; // TODO: Determine actual question type if needed

            // Ensure correctAnswerId is defined before creating the question
            if (correctAnswerId) {
              // Check if defined
              await payload.create({
                collection: 'quiz_questions', // Correct collection slug
                data: {
                  id: question.id, // Include ID from SSOT
                  question: question.text,
                  options: transformedOptions, // Insert transformed options JSONB
                  correct_answer: correctAnswerId as string, // Store the ID of the correct option (assert as string)
                  type: questionType,
                  explanation: question.explanation ?? null, // Handle potentially undefined explanation
                  // _order will be handled by relationship population in Stage 3
                },
              });
              console.log(
                `Created Quiz Question: ${question.text.substring(0, 50)}... (${question.id})`,
              );
            } else {
              console.error(
                `Error: Correct answer ID not found for question "${question.text.substring(0, 50)}...". Skipping question creation.`,
              );
            }
          } else {
            console.log(
              `Quiz Question already exists, skipping creation: ${question.text.substring(0, 50)}... (${question.id})`,
            );
            // Optionally, update the existing question if needed
            // await payload.update({
            //   collection: 'quiz_questions',
            //   id: existingQuestion.docs[0].id,
            //   data: {
            //     question: question.text,
            //     options: transformedOptions, // Update transformed options JSONB
            //     correct_answer: correctAnswerId, // Update the ID of the correct option
            //     type: questionType,
            //     explanation: JSON.parse(question.explanation),
            //   },
            // });
            // console.log(`Updated existing Quiz Question: ${question.text.substring(0, 50)}... (${question.id})`);
          }
        } catch (error: any) {
          console.error(
            `Error seeding Quiz Question "${question.text.substring(0, 50)}...":`,
            error.message,
          );
          // Continue with other questions
        }
      }
    }
    console.log('Quiz Questions seeding completed.');

    // Seed Course Quizzes
    console.log('Seeding Course Quizzes...');
    for (const quiz of Object.values(QUIZZES)) {
      try {
        // Check if quiz already exists by slug to avoid duplicates
        const existingQuiz = await payload.find({
          collection: 'course_quizzes', // Correct collection slug
          where: {
            slug: {
              equals: quiz.slug,
            },
          },
        });

        if (existingQuiz.docs.length === 0) {
          // Quiz does not exist, create it and link the questions

          // Collect question IDs for this quiz from the SSOT
          const questionIds = quiz.questions.map((q) => q.id);

          await payload.create({
            collection: 'course_quizzes', // Correct collection slug
            data: {
              id: quiz.id, // Include ID from SSOT
              title: quiz.title,
              slug: quiz.slug,
              description: quiz.description,
              pass_threshold: quiz.passingScore, // Map passingScore to pass_threshold
              course_id: null, // Temporarily set to null, will be linked in Stage 3
              // questions: questionIds, // REMOVED: Relationships will be populated in Stage 3
            },
          });
          console.log(
            `Created Course Quiz: ${quiz.title} (${quiz.id}) with ${questionIds.length} questions.`,
          );
        } else {
          console.log(
            `Course Quiz already exists, skipping creation: ${quiz.title} (${quiz.id})`,
          );
          // Optionally, update the existing quiz and its questions if needed
          // This would involve finding existing questions, updating them, and updating the quiz document
          // For now, we skip updating if the quiz exists to keep it simple for initial seeding
        }
      } catch (error: any) {
        // Explicitly type error
        console.error(
          `Error processing Course Quiz "${quiz.title}":`,
          error.message,
        );
        // Continue with other quizzes
      }
    }
    console.log('Course Quizzes seeding completed.');

    console.log('Seed Course Quizzes process finished.');
    process.exit(0); // Exit cleanly on success
  } catch (error: any) {
    // Explicitly type error
    console.error('Error during Seed Course Quizzes process:', error.message);
    process.exit(1); // Exit with a non-zero code on failure
  } finally {
    if (payload) {
      // Removed payload.shutdown() as it seems to not be a function in this context.
      // The Node.js process exiting should handle cleanup.
      console.log('Seed Course Quizzes script finished.');
    }
  }
}

seedCourseQuizzes();
