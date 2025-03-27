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

import { getPayloadClient } from '../utils/payload-client.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the course ID from the database
 */
async function getCourseId() {
  // Create a Supabase client
  const supabaseUrl = process.env.LOCAL_SUPABASE_URL;
  const supabaseKey = process.env.LOCAL_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key not found in environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the course ID
  const { data, error } = await supabase
    .from('payload.courses')
    .select('id')
    .eq('slug', 'decks-for-decision-makers')
    .single();

  if (error) {
    console.error('Error getting course ID:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Course not found');
  }

  return data.id;
}

/**
 * Migrates course lessons from Markdown files to Payload CMS
 */
async function migrateCourseLessonsToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient();

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

      // Create a document in the course_lessons collection
      await payload.create({
        collection: 'course_lessons',
        data: {
          title: data.title || slug,
          slug,
          description: data.description || '',
          content: lexicalContent,
          lessonID: data.lessonID || 0,
          chapter: data.chapter || '',
          lessonNumber: data.lessonNumber || 0,
          lessonLength: data.lessonLength || 0,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'draft',
          order: data.order || 0,
          language: data.language || 'en',
          // Add the course relationship
          course: courseId,
          // Handle image relationship if needed
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
