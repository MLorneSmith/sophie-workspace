/**
 * Script to migrate course lessons from Markdown files to Payload CMS
 */
import { createClient } from '@supabase/supabase-js';

import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the course ID from the database
 */
async function getCourseId() {
  try {
    // Get the Payload client
    const payload = await getEnhancedPayloadClient();

    // Find the course by slug
    const { docs } = await payload.find({
      collection: 'courses',
      query: {
        slug: 'decks-for-decision-makers',
      },
    });

    if (docs.length === 0) {
      console.log('Course not found, creating it...');

      // Create the course if it doesn't exist
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Decks for Decision Makers',
          slug: 'decks-for-decision-makers',
          description:
            'Learn how to create effective presentations for decision makers',
          status: 'published',
          showProgressBar: true,
          estimatedDuration: 240, // 4 hours
          publishedAt: new Date().toISOString(),
        },
      });

      console.log('Course created with ID:', course.id);
      return course.id;
    }

    console.log('Course found with ID:', docs[0].id);
    return docs[0].id;
  } catch (error) {
    console.error('Error getting or creating course:', error);
    throw error;
  }
}

/**
 * Migrates course lessons from Markdown files to Payload CMS
 */
async function migrateCourseLessonsToPayload() {
  // Get the Payload client
  const payload = await getEnhancedPayloadClient();

  // Get the course ID from the database
  console.log('Getting course ID from database...');
  const courseId = await getCourseId();
  console.log(`Using course with ID: ${courseId}`);

  // Path to the course lessons files
  const lessonsDir = path.resolve(
    __dirname,
    '../../../../apps/payload/data/courses/lessons',
  );
  console.log(`Course lessons directory: ${lessonsDir}`);

  // Read all .mdoc files
  const mdocFiles = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith('.mdoc'))
    .map((file) => path.join(lessonsDir, file));

  console.log(`Found ${mdocFiles.length} lesson files to migrate.`);

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data, content: mdContent } = matter(content);

      // Generate a slug from the file name
      const slug = path.basename(file, '.mdoc');

      // Convert Markdown content to Lexical format
      const lexicalContent = (() => {
        // Create a headless editor instance with list nodes registered
        const headlessEditor = createHeadlessEditor({
          nodes: [ListNode, ListItemNode, HeadingNode],
        });

        // Convert Markdown to Lexical format
        headlessEditor.update(
          () => {
            $convertFromMarkdownString(mdContent);
          },
          { discrete: true },
        );

        // Get the Lexical JSON
        return headlessEditor.getEditorState().toJSON();
      })();

      // Check if this lesson has an associated quiz
      let quizId = null;
      if (data.quiz) {
        // Try to find the quiz by slug
        const quizSlug = data.quiz.toLowerCase().replace(/\s+/g, '-');
        const { docs: quizzes } = await payload.find({
          collection: 'course_quizzes',
          query: {
            slug: quizSlug,
          },
        });

        if (quizzes.length > 0) {
          quizId = quizzes[0].id;
          console.log(`Found quiz with ID ${quizId} for lesson ${slug}`);
        } else {
          console.log(`Quiz not found for lesson ${slug}: ${data.quiz}`);
        }
      }

      // Create a document in the course_lessons collection
      await payload.create({
        collection: 'course_lessons',
        data: {
          title: data.title || slug,
          slug,
          description: data.description || '',
          content: lexicalContent,
          lessonNumber: data.lessonNumber || 0,
          estimatedDuration: data.lessonLength || 0,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          // Add the course relationship
          course_id: courseId,
          // Add quiz relationship if applicable
          quiz_id: quizId,
        },
      });

      console.log(`Migrated lesson: ${slug}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  console.log('Course lessons migration complete!');
}

// Run the migration
migrateCourseLessonsToPayload().catch((error) => {
  console.error('Course lessons migration failed:', error);
  process.exit(1);
});
