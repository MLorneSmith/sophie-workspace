/**
 * Script to migrate quiz questions from Markdown files to Payload CMS
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrates quiz questions from Markdown files to Payload CMS
 */
async function migrateQuizQuestionsToPayload() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the course quizzes files
  const quizzesDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/courses/quizzes',
  );
  console.log(`Course quizzes directory: ${quizzesDir}`);

  // Load the quiz ID map
  const dataDir = path.resolve(__dirname, '../data');
  const quizIdMapPath = path.resolve(dataDir, 'quiz-id-map.json');

  // Create the data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // If the quiz ID map doesn't exist, create it by running the course quizzes migration
  if (!fs.existsSync(quizIdMapPath)) {
    console.log('Quiz ID map not found. Creating it...');

    // Get all quizzes from the database
    const payload = await getEnhancedPayloadClient();
    const { docs: quizzes } = await payload.find({
      collection: 'course_quizzes',
      limit: 100,
    });

    // Create a map of quiz titles to IDs
    const quizIdMap: Record<string, string | number> = {};
    for (const quiz of quizzes) {
      // Use the quiz title as the key (similar to the slug in migrate-course-quizzes.ts)
      const slug = quiz.title.toLowerCase().replace(/\s+/g, '-');
      quizIdMap[slug] = quiz.id;
    }

    // Save the quiz ID map
    fs.writeFileSync(quizIdMapPath, JSON.stringify(quizIdMap, null, 2));
    console.log('Created quiz ID map with existing quizzes.');
  }

  const quizIdMap = JSON.parse(fs.readFileSync(quizIdMapPath, 'utf8'));

  // Read all .mdoc files
  const mdocFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'))
    .map((file) => path.join(quizzesDir, file));

  console.log(`Found ${mdocFiles.length} quiz files to process for questions.`);

  // Migrate questions from each quiz file
  for (const file of mdocFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data } = matter(content);

      // Generate a slug from the file name
      const slug = path.basename(file, '.mdoc');

      // Get the quiz ID
      const quizId = quizIdMap[slug];
      if (!quizId) {
        console.error(`Quiz ID not found for ${slug}. Skipping questions.`);
        continue;
      }

      // Ensure the quiz ID is a number
      const quizIdNumber =
        typeof quizId === 'string' ? parseInt(quizId, 10) : quizId;
      if (isNaN(quizIdNumber)) {
        console.error(
          `Invalid quiz ID for ${slug}: ${quizId}. Skipping questions.`,
        );
        continue;
      }

      // Process questions
      if (data.questions && Array.isArray(data.questions)) {
        console.log(
          `Processing ${data.questions.length} questions for quiz: ${slug}`,
        );

        for (let i = 0; i < data.questions.length; i++) {
          const q = data.questions[i];

          // Prepare options array for the question
          const options = [];
          if (q.answers && Array.isArray(q.answers)) {
            for (let j = 0; j < q.answers.length; j++) {
              const option = q.answers[j];
              options.push({
                text: option.answer,
                isCorrect: option.correct || false,
              });
            }
          }

          // Create the question with options as an array field
          const questionData = await payload.create({
            collection: 'quiz_questions',
            data: {
              question: q.question,
              quiz_id: quizId, // Use the quiz ID directly (could be string UUID or number)
              type:
                q.questiontype === 'multi-answer'
                  ? 'multiple_choice'
                  : 'multiple_choice',
              explanation: q.explanation || '',
              order: i,
              options: options, // Add options as an array field
            },
          });

          console.log(`Created question with ID: ${questionData.id}`);
          console.log(`Added ${options.length} options to the question`);

          console.log(`Migrated question ${i + 1} for quiz: ${slug}`);
        }
      }
    } catch (error) {
      console.error(`Error migrating questions for ${file}:`, error);
    }
  }

  console.log('Quiz questions migration complete!');
}

// Run the migration
migrateQuizQuestionsToPayload().catch((error) => {
  console.error('Quiz questions migration failed:', error);
  process.exit(1);
});
