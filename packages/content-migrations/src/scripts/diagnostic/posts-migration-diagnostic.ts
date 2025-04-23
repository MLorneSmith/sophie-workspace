/**
 * Posts Migration Diagnostic Tool
 *
 * This script checks if the posts directory and files exist,
 * and provides information about what content is available for migration.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check directory existence and content
function checkDirectory(dirPath: string, label: string) {
  console.log(`\n=== Checking ${label} ===`);

  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`❌ Directory does not exist: ${dirPath}`);
      return false;
    }

    console.log(`✅ Directory exists: ${dirPath}`);

    // Check if directory is empty
    const files = fs.readdirSync(dirPath);
    console.log(`Found ${files.length} files/directories inside`);

    if (files.length === 0) {
      console.log(`⚠️ Directory is empty`);
      return true;
    }

    // List the files/directories
    console.log('\nContents:');
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const isDir = stats.isDirectory();
      const size = stats.size;
      console.log(`- ${file} ${isDir ? '[DIR]' : `[FILE: ${size} bytes]`}`);

      // If it's a directory, check if it's empty
      if (isDir) {
        const subFiles = fs.readdirSync(filePath);
        console.log(`  Contains ${subFiles.length} files/directories`);
      }
    });

    return true;
  } catch (error) {
    console.error(`Error checking ${label}:`, error);
    return false;
  }
}

// Function to check for post files
function checkPostFiles(postsDir: string) {
  console.log('\n=== Checking for Post Files ===');

  try {
    if (!fs.existsSync(postsDir)) {
      console.log(`❌ Posts directory does not exist: ${postsDir}`);
      return;
    }

    // Filter for .html, .mdoc, or .md files
    const postFiles = fs
      .readdirSync(postsDir)
      .filter(
        (file) =>
          file.endsWith('.html') ||
          file.endsWith('.mdoc') ||
          file.endsWith('.md'),
      );

    console.log(
      `Found ${postFiles.length} potential post files (.html, .mdoc, .md)`,
    );

    if (postFiles.length === 0) {
      console.log('⚠️ No post files found in the posts directory');

      // Check if there are any other files
      const allFiles = fs.readdirSync(postsDir);
      if (allFiles.length > 0) {
        console.log(`\nOther files found in directory (${allFiles.length}):`);
        allFiles.forEach((file) => {
          const filePath = path.join(postsDir, file);
          const stats = fs.statSync(filePath);
          console.log(
            `- ${file} [${path.extname(file) || 'NO EXTENSION'}] ${stats.isDirectory() ? '[DIR]' : `[FILE: ${stats.size} bytes]`}`,
          );
        });
      }

      return;
    }

    // List the post files
    console.log('\nPost files:');
    postFiles.forEach((file) => {
      const filePath = path.join(postsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} [${stats.size} bytes]`);

      try {
        // Try to read the file content
        const content = fs.readFileSync(filePath, 'utf8');
        const contentPreview =
          content.substring(0, 100).replace(/\n/g, ' ') +
          (content.length > 100 ? '...' : '');
        console.log(`  Preview: ${contentPreview}`);
      } catch (readError) {
        console.error(`  Error reading file:`, readError);
      }
    });
  } catch (error) {
    console.error('Error checking post files:', error);
  }
}

// Function to check database connection
async function checkDatabase() {
  console.log('\n=== Checking Database Connection ===');

  try {
    // Import pg dynamically to avoid issues if this script runs in environments without pg
    const pg = await import('pg');
    const { Pool } = pg.default;

    // Check if DATABASE_URI is set
    const databaseUri = process.env.DATABASE_URI || process.env.DATABASE_URL;
    if (!databaseUri) {
      console.log('❌ DATABASE_URI environment variable is not set');
      return;
    }

    console.log(`✅ Database URI is set`);

    // Create a connection pool
    const pool = new Pool({
      connectionString: databaseUri,
    });

    // Test the connection
    const client = await pool.connect();

    try {
      console.log('✅ Connected to database successfully');

      // Check if posts table exists
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = 'posts'
        ) as table_exists
      `);

      if (tableCheckResult.rows[0]?.table_exists) {
        console.log('✅ posts table exists in the database');

        // Check how many posts are in the table
        const countResult = await client.query(`
          SELECT COUNT(*) as count FROM payload.posts
        `);

        console.log(`Posts in database: ${countResult.rows[0]?.count || 0}`);
      } else {
        console.log('❌ posts table does not exist in the database');
      }
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Main function
async function runDiagnostic() {
  console.log('=== POSTS MIGRATION DIAGNOSTIC ===');
  console.log(`Running at: ${new Date().toISOString()}`);

  // Check content-migrations directory
  const projectRoot = path.resolve(__dirname, '../../../');
  checkDirectory(projectRoot, 'content-migrations package root');

  // Check raw data directory
  const rawDataDir = path.resolve(projectRoot, 'src/data/raw');
  checkDirectory(rawDataDir, 'raw data directory');

  // Check posts directory
  const postsDir = path.resolve(rawDataDir, 'posts');
  checkDirectory(postsDir, 'posts directory');

  // Check for post files
  checkPostFiles(postsDir);

  // Check database connection
  await checkDatabase();

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

// Run the diagnostic
runDiagnostic().catch((error) => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
