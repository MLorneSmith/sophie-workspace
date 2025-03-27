/**
 * Script to migrate course quizzes from Markdown files to Payload CMS
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrates course quizzes from Markdown files to Payload CMS
 */
async function migrateQuizzesToPayload() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  // Path to the course quizzes files
  const quizzesDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/courses/quizzes',
  );
  console.log(`Course quizzes directory: ${quizzesDir}`);

  // Read all .mdoc files
  const mdocFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'))
    .map((file) => path.join(quizzesDir, file));

  console.log(`Found ${mdocFiles.length} quiz files to migrate.`);

  // Store quiz IDs for later use in quiz questions migration
  const quizIdMap = new Map();

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data } = matter(content);

      // Generate a slug from the file name
      const slug = path.basename(file, '.mdoc');

      // Create a document in the course_quizzes collection
      const quiz = await payload.create({
        collection: 'course_quizzes',
        data: {
          title: data.title || slug,
          description: data.description || '',
          passing_score: data.passingScore || 70,
        },
      });

      // Store the quiz ID for later use
      quizIdMap.set(slug, quiz.id);

      console.log(`Migrated quiz: ${slug}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  // Save the quiz ID map to a file for use in the quiz questions migration
  const dataDir = path.resolve(__dirname, '../data');

  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(dataDir, 'quiz-id-map.json'),
    JSON.stringify(Object.fromEntries(quizIdMap), null, 2),
  );

  console.log('Course quizzes migration complete!');
}

// Run the migration
migrateQuizzesToPayload().catch((error) => {
  console.error('Course quizzes migration failed:', error);
  process.exit(1);
});
