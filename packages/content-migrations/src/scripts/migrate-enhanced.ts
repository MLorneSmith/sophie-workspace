/**
 * Enhanced migration script with improved error handling and batch processing
 * Uses the enhanced payload client with token caching and retry logic
 */
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Delay between migration steps (in milliseconds)
const STEP_DELAY = 2000;

/**
 * Sleep for a specified number of milliseconds
 * @param ms - The number of milliseconds to sleep
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run a migration step with proper error handling
 * @param name - The name of the migration step
 * @param migrationFn - The migration function to run
 */
async function runMigrationStep(
  name: string,
  migrationFn: () => Promise<void>,
): Promise<boolean> {
  console.log(`\n=== Starting migration step: ${name} ===`);
  try {
    await migrationFn();
    console.log(`=== Successfully completed migration step: ${name} ===\n`);
    return true;
  } catch (error) {
    console.error(`Error in migration step ${name}:`, error);
    console.error(`=== Failed migration step: ${name} ===\n`);
    return false;
  }
}

/**
 * Clean up collections before migration
 */
async function cleanupCollections(): Promise<void> {
  console.log('Starting collection cleanup...');

  // Get the payload client
  const payloadClient = await getEnhancedPayloadClient();

  // Collections to clean up
  const collections = [
    'documentation',
    'posts',
    // Skip courses collection as it may have relationships that prevent deletion
    // 'courses',
    'course_lessons',
    'course_quizzes',
    'quiz_questions',
  ];

  // Clean up each collection
  for (const collection of collections) {
    console.log(`Cleaning up collection: ${collection}`);

    try {
      // Find all documents in the collection
      const { docs } = await payloadClient.find({
        collection,
        limit: 100,
      });

      console.log(`Found ${docs.length} documents in ${collection}`);

      // Delete each document
      for (const doc of docs) {
        try {
          await payloadClient.delete({
            collection,
            id: doc.id,
          });
        } catch (deleteError) {
          console.error(
            `Error deleting document ${doc.id} in ${collection}:`,
            deleteError,
          );
          // Continue with the next document
        }
      }

      console.log(`Successfully cleaned up collection: ${collection}`);

      // Add a small delay between collections
      await sleep(1000);
    } catch (error) {
      console.error(`Error cleaning up collection ${collection}:`, error);
      // Continue with the next collection
    }
  }

  console.log('Collection cleanup complete!');
}

/**
 * Migrate documentation from Markdown files to Payload CMS
 */
async function migrateDocumentation(): Promise<void> {
  console.log('Starting documentation migration...');

  // Import the enhanced migrate-docs module
  const migrateDocsModule = await import('./migrate-docs-enhanced.js');

  // Execute the migration function
  await migrateDocsModule.default();

  console.log('Documentation migration complete!');
}

/**
 * Update documentation content
 */
async function updateDocumentationContent(): Promise<void> {
  console.log('Starting documentation content update...');

  // Import the update-docs-content module
  const updateDocsContentModule = await import('./update-docs-content.js');

  // The update-docs-content script runs automatically when imported
  console.log('Documentation content update complete!');
}

/**
 * Migrate course data
 */
async function migrateCourses(): Promise<void> {
  console.log('Starting course migration...');

  // Get the payload client
  const payloadClient = await getEnhancedPayloadClient();

  // Create the main course if it doesn't exist
  const { docs: existingCourses } = await payloadClient.find({
    collection: 'courses',
    query: { slug: 'decks-for-decision-makers' },
  });

  if (existingCourses.length === 0) {
    console.log('Course not found, creating it...');

    await payloadClient.create({
      collection: 'courses',
      data: {
        title: 'Decks for Decision Makers',
        slug: 'decks-for-decision-makers',
        description:
          'Learn how to create effective presentations for decision makers',
        status: 'published',
        showProgressBar: true,
        estimatedDuration: 240,
        publishedAt: new Date().toISOString(),
      },
    });

    console.log('Course created successfully!');
  } else {
    console.log('Course already exists, skipping creation.');
  }

  console.log('Course migration complete!');
}

/**
 * Migrate course lessons
 */
async function migrateLessons(): Promise<void> {
  console.log('Starting course lessons migration...');

  // Import the migrate-course-lessons module
  const migrateCourseLessonsModule = await import(
    './migrate-course-lessons.js'
  );

  // The migrate-course-lessons script runs automatically when imported
  console.log('Course lessons migration complete!');
}

/**
 * Migrate course quizzes
 */
async function migrateQuizzes(): Promise<void> {
  console.log('Starting course quizzes migration...');

  // Import the migrate-course-quizzes module
  const migrateCourseQuizzesModule = await import(
    './migrate-course-quizzes.js'
  );

  // The migrate-course-quizzes script runs automatically when imported
  console.log('Course quizzes migration complete!');
}

/**
 * Migrate quiz questions
 */
async function migrateQuizQuestions(): Promise<void> {
  console.log('Starting quiz questions migration...');

  // Import the migrate-quiz-questions module
  const migrateQuizQuestionsModule = await import(
    './migrate-quiz-questions.js'
  );

  // The migrate-quiz-questions script runs automatically when imported
  console.log('Quiz questions migration complete!');
}

/**
 * Migrate Payload documentation
 */
async function migratePayloadDocs(): Promise<void> {
  console.log('Starting Payload documentation migration...');

  // Import the migrate-payload-docs module
  const migratePayloadDocsModule = await import('./migrate-payload-docs.js');

  // The migrate-payload-docs script runs automatically when imported
  console.log('Payload documentation migration complete!');
}

/**
 * Migrate Payload quizzes
 */
async function migratePayloadQuizzes(): Promise<void> {
  console.log('Starting Payload quizzes migration...');

  // Import the migrate-payload-quizzes module
  const migratePayloadQuizzesModule = await import(
    './migrate-payload-quizzes.js'
  );

  // The migrate-payload-quizzes script runs automatically when imported
  console.log('Payload quizzes migration complete!');
}

/**
 * Fix quiz questions by adding required options and ensuring quiz IDs are integers
 */
async function fixQuizQuestions(): Promise<void> {
  console.log('Starting quiz questions fix...');

  // Get the enhanced Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the quizzes directory
  const quizzesDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/courses/quizzes',
  );
  console.log(`Quizzes directory: ${quizzesDir}`);

  // Get all quizzes
  console.log('Getting all quizzes...');
  const { docs: quizzes } = await payload.find({
    collection: 'course_quizzes',
    limit: 100,
  });

  console.log(`Found ${quizzes.length} quizzes.`);

  // Create a map of quiz IDs
  const quizIdMap = new Map();
  for (const quiz of quizzes) {
    quizIdMap.set(quiz.id, quiz);
  }

  // Try to get all quiz questions
  console.log('Getting all quiz questions...');
  try {
    const { docs: questions } = await payload.find({
      collection: 'quiz_questions',
      limit: 100,
    });

    console.log(`Found ${questions.length} quiz questions.`);

    // Fix each question
    for (const question of questions) {
      try {
        // Check if the quiz ID is a string
        if (typeof question.quiz === 'string') {
          console.log(
            `Question ${question.id} has a string quiz ID: ${question.quiz}`,
          );

          // Convert the quiz ID to a number
          const quizIdNumber = parseInt(question.quiz, 10);
          if (isNaN(quizIdNumber)) {
            console.error(
              `Invalid quiz ID for question ${question.id}: ${question.quiz}`,
            );
            continue;
          }

          // Check if the quiz exists
          if (!quizIdMap.has(quizIdNumber)) {
            console.error(
              `Quiz with ID ${quizIdNumber} not found for question ${question.id}`,
            );
            continue;
          }

          // Update the question with the numeric quiz ID
          console.log(
            `Updating question ${question.id} with numeric quiz ID: ${quizIdNumber}`,
          );
          await payload.update({
            collection: 'quiz_questions',
            id: question.id,
            data: {
              quiz: quizIdNumber,
            },
          });

          console.log(`Updated question ${question.id}`);
        } else {
          console.log(
            `Question ${question.id} already has a numeric quiz ID: ${question.quiz}`,
          );
        }
      } catch (error) {
        console.error(`Error fixing question ${question.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error getting quiz questions:', error);
  }

  // Get all quiz files
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));
  console.log(`Found ${quizFiles.length} quiz files to process.`);

  // Process each quiz file
  for (const quizFile of quizFiles) {
    const quizFilePath = path.join(quizzesDir, quizFile);
    const quizSlug = quizFile.replace('.mdoc', '');

    console.log(`Processing quiz: ${quizSlug}`);

    try {
      // Read the quiz file
      const quizContent = fs.readFileSync(quizFilePath, 'utf8');
      const { data, content } = matter(quizContent);

      // Find the quiz in Payload
      const { docs: quizzes } = await payload.find({
        collection: 'course_quizzes',
        query: { title: data.title },
      });

      if (quizzes.length === 0) {
        console.log(`Quiz not found: ${data.title}. Skipping.`);
        continue;
      }

      const quizId = quizzes[0].id;
      console.log(`Found quiz with ID: ${quizId}`);

      // Ensure the quiz ID is a number
      const quizIdNumber =
        typeof quizId === 'string' ? parseInt(quizId, 10) : quizId;
      if (isNaN(quizIdNumber)) {
        console.error(`Invalid quiz ID for ${quizSlug}: ${quizId}. Skipping.`);
        continue;
      }

      // Find existing questions for this quiz
      const { docs: existingQuestions } = await payload.find({
        collection: 'quiz_questions',
        query: { quiz: quizIdNumber },
      });

      console.log(
        `Found ${existingQuestions.length} existing questions for quiz: ${data.title}`,
      );

      // Parse the questions from the content
      const questions = parseQuestionsFromContent(content);
      console.log(`Parsed ${questions.length} questions from content.`);

      // Update or create each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question) continue;

        // Find if the question already exists
        const existingQuestion = existingQuestions.find(
          (q) => q.question === question.question,
        );

        if (existingQuestion) {
          console.log(`Updating question: ${question.question}`);

          // Update the question with options
          await payload.update({
            collection: 'quiz_questions',
            id: existingQuestion.id,
            data: {
              options: question.options,
              correctOption: question.correctOption,
            },
          });

          console.log(`Updated question: ${question.question}`);
        } else {
          console.log(`Creating question: ${question.question}`);

          // Create the question with options
          await payload.create({
            collection: 'quiz_questions',
            data: {
              quiz: quizId, // Use the quiz ID directly (could be string UUID or number)
              question: question.question,
              type: 'multiple_choice',
              options: question.options,
              correctOption: question.correctOption,
              explanation: question.explanation || '',
              order: i,
            },
          });

          console.log(`Created question: ${question.question}`);
        }

        // Add a small delay between operations
        await sleep(500);
      }
    } catch (error) {
      console.error(`Error processing quiz ${quizFile}:`, error);
    }
  }

  console.log('Quiz questions fix complete!');
}

/**
 * Parses questions from quiz content
 * @param content - The quiz content
 * @returns The parsed questions
 */
function parseQuestionsFromContent(content: string): {
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string;
}[] {
  const questions: {
    question: string;
    options: string[];
    correctOption: number;
    explanation?: string;
  }[] = [];

  // Split the content into sections
  const sections = content.split(/^##\s+/m).filter(Boolean);

  // Process each section
  for (const section of sections) {
    // Skip if not a question section
    if (!section.trim().startsWith('Question:')) {
      continue;
    }

    try {
      // Extract the question
      const questionMatch = section.match(/^Question:\s*(.+?)(?:\n|$)/m);
      if (!questionMatch || !questionMatch[1]) continue;
      const question = questionMatch[1].trim();

      // Extract the options
      const optionsMatch = section.match(/^Options:\s*\n([\s\S]+?)(?:\n\n|$)/m);
      if (!optionsMatch || !optionsMatch[1]) continue;

      const optionsText = optionsMatch[1];
      const options = optionsText
        .split(/\n\s*-\s*/)
        .filter(Boolean)
        .map((option) => option.trim());

      // If no options were found, add default options
      if (options.length === 0) {
        options.push('Option 1', 'Option 2');
      }

      // Extract the correct answer
      const correctAnswerMatch = section.match(
        /^Correct Answer:\s*(.+?)(?:\n|$)/m,
      );
      if (!correctAnswerMatch || !correctAnswerMatch[1]) continue;
      const correctAnswer = correctAnswerMatch[1].trim();

      // Find the index of the correct answer
      const correctOption = options.findIndex(
        (option) => option === correctAnswer,
      );

      // Extract the explanation (if any)
      const explanationMatch = section.match(
        /^Explanation:\s*(.+?)(?:\n\n|$)/m,
      );
      const explanation =
        explanationMatch && explanationMatch[1]
          ? explanationMatch[1].trim()
          : '';

      // Add the question to the list
      questions.push({
        question,
        options,
        correctOption: correctOption !== -1 ? correctOption : 0,
        explanation,
      });
    } catch (error) {
      console.error('Error parsing question section:', error);
    }
  }

  return questions;
}

/**
 * Run all migrations in a specific order with proper error handling
 */
async function runEnhancedMigrations(): Promise<void> {
  console.log('Starting enhanced content migrations...');

  // Define migration steps in order of dependencies
  const migrationSteps = [
    { name: 'Cleanup Collections', fn: cleanupCollections },
    { name: 'Migrate Documentation', fn: migrateDocumentation },
    { name: 'Update Documentation Content', fn: updateDocumentationContent },
    { name: 'Migrate Courses', fn: migrateCourses },
    { name: 'Migrate Course Lessons', fn: migrateLessons },
    { name: 'Migrate Course Quizzes', fn: migrateQuizzes },
    { name: 'Migrate Quiz Questions', fn: migrateQuizQuestions },
    { name: 'Fix Quiz Questions', fn: fixQuizQuestions },
    { name: 'Migrate Payload Documentation', fn: migratePayloadDocs },
    { name: 'Migrate Payload Quizzes', fn: migratePayloadQuizzes },
  ];

  // Track successful and failed steps
  const results = {
    successful: [] as string[],
    failed: [] as string[],
  };

  // Run each migration step
  for (const step of migrationSteps) {
    const success = await runMigrationStep(step.name, step.fn);

    if (success) {
      results.successful.push(step.name);
    } else {
      results.failed.push(step.name);
    }

    // Add a delay between steps
    console.log(`Waiting ${STEP_DELAY / 1000} seconds before next step...`);
    await sleep(STEP_DELAY);
  }

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total steps: ${migrationSteps.length}`);
  console.log(`Successful steps: ${results.successful.length}`);
  console.log(`Failed steps: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed steps:');
    results.failed.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

    console.error('\nMigration process completed with errors.');
    process.exit(1);
  } else {
    console.log('\nAll migration steps completed successfully!');
  }
}

// Run the enhanced migrations
runEnhancedMigrations().catch((error) => {
  console.error('Migration process failed:', error);
  process.exit(1);
});
