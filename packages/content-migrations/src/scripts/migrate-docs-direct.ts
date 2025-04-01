/**
 * Script to migrate documentation directly to the database
 */
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Migrates documentation directly to the database
 */
async function migrateDocsToDatabase() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Path to the documentation files
      const docsDir = path.resolve(
        __dirname,
        '../../../../apps/payload/data/documentation',
      );
      console.log(`Documentation directory: ${docsDir}`);

      // Function to recursively read all .mdoc files
      const readMdocFiles = (dir: string, parentPath = ''): string[] => {
        console.log(`Reading directory: ${dir}`);
        const files: string[] = [];

        try {
          const items = fs.readdirSync(dir);
          console.log(`Found ${items.length} items in directory`);

          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
              console.log(`Found directory: ${item}`);
              files.push(
                ...readMdocFiles(itemPath, path.join(parentPath, item)),
              );
            } else if (item.endsWith('.mdoc')) {
              console.log(`Found .mdoc file: ${item}`);
              files.push(path.join(parentPath, item));
            } else {
              console.log(`Skipping file: ${item} (not a .mdoc file)`);
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error);
        }

        return files;
      };

      // Get all .mdoc files
      const mdocFiles = readMdocFiles(docsDir);
      console.log(`Found ${mdocFiles.length} documentation files to migrate.`);

      // First pass: Create all documents without parent relationships
      const docIdMap = new Map();

      for (const file of mdocFiles) {
        const filePath = path.join(docsDir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const { data, content: mdContent } = matter(content);

          // Generate a slug from the file path
          const slug = file
            .replace(/\.mdoc$/, '')
            .replace(/\\/g, '/')
            .replace(/^\//, '');

          // Create a simple content structure
          const simpleContent = {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: mdContent || 'No content available',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          };

          // Generate a UUID for the document
          const docId = uuidv4();

          // Insert the document into the database, skip if it already exists
          await client.query(
            `INSERT INTO payload.documentation (id, title, slug, description, content, status, published_at, updated_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (slug) DO NOTHING`,
            [
              docId,
              data.title || path.basename(file, '.mdoc'),
              slug,
              data.description || '',
              JSON.stringify(simpleContent),
              'published',
              new Date().toISOString(),
            ],
          );

          // Store the document ID for later use
          docIdMap.set(slug, docId);

          console.log(`Migrated: ${file} with ID: ${docId}`);
        } catch (error) {
          console.error(`Error migrating ${file}:`, error);
        }
      }

      // Second pass: Update parent relationships
      console.log('Skipping second pass (parent relationships) for now');

      console.log('Documentation migration complete!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateDocsToDatabase().catch((error) => {
  console.error('Documentation migration failed:', error);
  process.exit(1);
});
