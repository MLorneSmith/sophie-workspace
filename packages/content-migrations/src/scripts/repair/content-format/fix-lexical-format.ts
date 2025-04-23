/**
 * Fix Lexical Format Script
 *
 * Repairs Lexical format issues in the database, specifically fixing
 * indent values for list items.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Database connection
const client = new Client({
  connectionString:
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Path to the YAML metadata file
const yamlFilePath = path.resolve(
  process.cwd(),
  'src/data/raw/lesson-metadata.yaml',
);

// Function to fix Lexical JSON format
function fixLexicalFormat(lexicalStr: string): string {
  try {
    if (!lexicalStr) return null;

    // Parse the Lexical JSON
    const lexicalObj =
      typeof lexicalStr === 'string'
        ? JSON.parse(lexicalStr.replace(/\\"/g, '"').replace(/\\n/g, '\\n'))
        : lexicalStr;

    // Recursive function to fix nodes
    function fixNode(node) {
      // Ensure listItems always have a valid indent (default to 0)
      if (
        node.type === 'listitem' &&
        (node.indent === undefined ||
          node.indent === null ||
          isNaN(node.indent))
      ) {
        node.indent = 0;
      }

      // Process children recursively
      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          node.children[i] = fixNode(node.children[i]);
        }
      }

      return node;
    }

    // Fix the root node and its children
    if (lexicalObj.root) {
      lexicalObj.root = fixNode(lexicalObj.root);
    }

    // Return the fixed JSON as a string
    return JSON.stringify(lexicalObj);
  } catch (error) {
    console.error(`Error fixing Lexical format: ${error.message}`);
    return lexicalStr; // Return original on error
  }
}

async function fixLexicalFormatInDatabase() {
  try {
    console.log('Starting to fix Lexical format in database...');

    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN');

    // Get all lessons with todo fields
    const query = `
      SELECT id, slug, todo, todo_watch_content, todo_read_content, todo_course_project
      FROM payload.course_lessons
      WHERE todo IS NOT NULL
         OR todo_watch_content IS NOT NULL
         OR todo_read_content IS NOT NULL
         OR todo_course_project IS NOT NULL
    `;

    const result = await client.query(query);
    console.log(`Found ${result.rows.length} lessons with todo fields`);

    // Process each lesson
    let updatedCount = 0;
    for (const lesson of result.rows) {
      const slug = lesson.slug;
      console.log(`\nProcessing lesson '${slug}'...`);

      // Fix each field
      const todoFields = {
        todo: lesson.todo ? fixLexicalFormat(lesson.todo) : null,
        todo_watch_content: lesson.todo_watch_content
          ? fixLexicalFormat(lesson.todo_watch_content)
          : null,
        todo_read_content: lesson.todo_read_content
          ? fixLexicalFormat(lesson.todo_read_content)
          : null,
        todo_course_project: lesson.todo_course_project
          ? fixLexicalFormat(lesson.todo_course_project)
          : null,
      };

      // Update the database record
      const updateQuery = `
        UPDATE payload.course_lessons 
        SET 
          todo = $1,
          todo_watch_content = $2,
          todo_read_content = $3,
          todo_course_project = $4
        WHERE slug = $5
      `;

      await client.query(updateQuery, [
        todoFields.todo,
        todoFields.todo_watch_content,
        todoFields.todo_read_content,
        todoFields.todo_course_project,
        slug,
      ]);

      console.log(`✅ Fixed Lexical format for lesson '${slug}'`);
      updatedCount++;
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(
      `\n✅ Successfully fixed Lexical format for ${updatedCount} lessons`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing Lexical format:', error);
  } finally {
    await client.end();
  }
}

// Run the function
console.log('Starting fix-lexical-format...');
fixLexicalFormatInDatabase()
  .then(() => {
    console.log('Lexical format fix completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fixing Lexical format:', error);
    process.exit(1);
  });

export default fixLexicalFormatInDatabase;
