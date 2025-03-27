/**
 * Script to migrate quizzes from Payload data directory to Payload CMS
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
 * Migrates quizzes from Payload data directory to Payload CMS
 */
async function migratePayloadQuizzesToPayload() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the quizzes files
  const quizzesDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/quizzes',
  );
  console.log(`Quizzes directory: ${quizzesDir}`);

  // Load the quiz ID map if it exists
  const quizIdMapPath = path.resolve(__dirname, '../data/quiz-id-map.json');
  let quizIdMap: Record<string, string | number> = {};
  if (fs.existsSync(quizIdMapPath)) {
    quizIdMap = JSON.parse(fs.readFileSync(quizIdMapPath, 'utf8'));
  }

  // Get existing quizzes from Payload CMS
  const { docs: existingQuizzes } = await payload.find({
    collection: 'course_quizzes',
    limit: 100,
  });

  // Read all .mdoc files
  const mdocFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'))
    .map((file) => path.join(quizzesDir, file));

  console.log(`Found ${mdocFiles.length} quiz files to migrate.`);

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data } = matter(content);

      // Generate a slug from the file name
      const slug = path.basename(file, '.mdoc');

      // Check if this quiz already exists
      const existingQuiz = existingQuizzes.find((q) => q.title === data.title);
      let quizId;

      if (existingQuiz) {
        console.log(`Quiz already exists: ${data.title}. Using existing quiz.`);
        quizId = existingQuiz.id;
      } else {
        // Create a new quiz
        const quiz = await payload.create({
          collection: 'course_quizzes',
          data: {
            title: data.title || slug,
            description: data.description || '',
            passing_score: data.passingScore || 70,
          },
        });

        quizId = quiz.id;
        console.log(`Created new quiz: ${data.title}`);
      }

      // Store the quiz ID in the map
      quizIdMap[slug] = quizId;

      // Process questions
      if (data.questions && Array.isArray(data.questions)) {
        console.log(
          `Processing ${data.questions.length} questions for quiz: ${slug}`,
        );

        for (let i = 0; i < data.questions.length; i++) {
          const q: {
            question: string;
            questiontype?: string;
            explanation?: string;
            answers?: Array<{
              answer: string;
              correct?: boolean;
            }>;
          } = data.questions[i];

          // Check if this question already exists
          const { docs: existingQuestions } = await payload.find({
            collection: 'quiz_questions',
            query: {
              quiz: quizId,
              question: q.question,
            },
          });

          if (existingQuestions.length > 0) {
            console.log(`Question already exists: ${q.question}. Skipping.`);
            continue;
          }

          // Generate a unique ID for the question
          const questionId = uuidv4();

          // Prepare options array for the question
          const options =
            q.answers && Array.isArray(q.answers) && q.answers.length >= 2
              ? q.answers.map((option) => ({
                  text: option.answer,
                  isCorrect: option.correct || false,
                }))
              : [
                  // Default options if none are provided or less than 2
                  { text: 'Option 1', isCorrect: false },
                  { text: 'Option 2', isCorrect: false },
                ];

          // Create the question with options included directly
          await payload.create({
            collection: 'quiz_questions',
            data: {
              id: questionId,
              question: q.question,
              quiz: quizId,
              type:
                q.questiontype === 'multi-answer'
                  ? 'multiple_choice'
                  : 'multiple_choice',
              explanation: q.explanation || '',
              order: i,
              options: options,
            },
          });

          console.log(`Migrated question ${i + 1} for quiz: ${slug}`);
        }
      }
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  // Save the updated quiz ID map
  fs.writeFileSync(quizIdMapPath, JSON.stringify(quizIdMap, null, 2));

  console.log('Payload quizzes migration complete!');
}

// Run the migration
migratePayloadQuizzesToPayload().catch((error) => {
  console.error('Payload quizzes migration failed:', error);
  process.exit(1);
});
