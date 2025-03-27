/**
 * Script to migrate quiz questions from Markdown files to Payload CMS
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getPayloadClient } from '../utils/payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrates quiz questions from Markdown files to Payload CMS
 */
async function migrateQuizQuestionsToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient();

  // Path to the course quizzes files
  const quizzesDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/courses/quizzes',
  );
  console.log(`Course quizzes directory: ${quizzesDir}`);

  // Load the quiz ID map
  const quizIdMapPath = path.resolve(__dirname, '../data/quiz-id-map.json');
  if (!fs.existsSync(quizIdMapPath)) {
    console.error(
      'Quiz ID map not found. Run migrate-course-quizzes.ts first.',
    );
    process.exit(1);
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

      // Process questions
      if (data.questions && Array.isArray(data.questions)) {
        console.log(
          `Processing ${data.questions.length} questions for quiz: ${slug}`,
        );

        for (let i = 0; i < data.questions.length; i++) {
          const q = data.questions[i];

          // Generate a unique ID for the question
          const questionId = uuidv4();

          // Create the question
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
            },
          });

          // Create options for the question
          if (q.answers && Array.isArray(q.answers)) {
            for (let j = 0; j < q.answers.length; j++) {
              const option = q.answers[j];

              // Generate a unique ID for the option
              const optionId = uuidv4();

              // Create the option
              await payload.create({
                collection: 'quiz_questions_options',
                data: {
                  id: optionId,
                  _order: j,
                  _parent_id: questionId,
                  text: option.answer,
                  is_correct: option.correct || false,
                },
              });
            }
          }

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
