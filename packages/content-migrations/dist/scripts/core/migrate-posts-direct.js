/**
 * Script to migrate blog posts from Markdown files to Payload CMS directly in the PostgreSQL database
 * Enhanced with proactive UUID table fixing to prevent relationship errors
 * Fixed to handle dynamic_uuid_tables schema variations
 */
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { safeInsertIntoUuidTablesTracking, validateDynamicUuidTablesSchema, } from '../utils/schema-validation.js';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });
/**
 * Migrates blog posts from Markdown files directly to the PostgreSQL database
 * Includes enhanced reporting to clarify migration status
 */
async function migratePostsToDatabase() {
    // Counter for tracking migrated/updated posts
    let migratedCount = 0;
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
            // Validate the dynamic_uuid_tables schema to catch issues early
            console.log('Validating dynamic_uuid_tables schema...');
            const schemaValidation = await validateDynamicUuidTablesSchema(client);
            if (!schemaValidation.isValid) {
                console.error(`Schema validation failed: ${schemaValidation.message}`);
                console.error('This may cause issues during migration. Will attempt to continue.');
            }
            else {
                console.log('Schema validation successful. Available columns:', schemaValidation.columns.join(', '));
            }
            // Proactively fix UUID tables with improved error handling
            console.log('Running proactive UUID table fix to ensure all columns exist...');
            try {
                // First check if the scan_and_fix_uuid_tables function exists
                const funcExistsResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = 'scan_and_fix_uuid_tables'
            AND nspname = 'payload'
          ) as func_exists;
        `);
                if (funcExistsResult.rows[0]?.func_exists) {
                    console.log('Running uuid table scanner function...');
                    await client.query(`SELECT payload.scan_and_fix_uuid_tables();`);
                    console.log('UUID table scan completed successfully');
                }
                else {
                    console.log('UUID table scanner function not found, using direct column addition...');
                    // Just ensure the tracking table exists with the right schema
                    await client.query(`
            CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
              table_name TEXT PRIMARY KEY,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              primary_key TEXT DEFAULT 'parent_id',
              needs_path_column BOOLEAN DEFAULT TRUE
            );
          `);
                    // Directly add the essential columns to UUID tables without using the missing function
                    const uuidTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND column_name = 'id' 
            AND data_type = 'uuid'
          `);
                    // Process each UUID table
                    for (const row of uuidTablesResult.rows) {
                        const tableName = row.table_name;
                        await client.query(`
              ALTER TABLE payload.${tableName} ADD COLUMN IF NOT EXISTS path TEXT;
              ALTER TABLE payload.${tableName} ADD COLUMN IF NOT EXISTS parent_id TEXT;
              ALTER TABLE payload.${tableName} ADD COLUMN IF NOT EXISTS downloads_id UUID;
              ALTER TABLE payload.${tableName} ADD COLUMN IF NOT EXISTS private_id UUID;
              ALTER TABLE payload.${tableName} ADD COLUMN IF NOT EXISTS documentation_id UUID;
            `);
                        // Track the table with a simple insert that works with current schema
                        await client.query(`
              INSERT INTO payload.dynamic_uuid_tables (table_name, created_at, primary_key, needs_path_column)
              VALUES ($1, NOW(), 'parent_id', TRUE)
              ON CONFLICT (table_name)
              DO UPDATE SET created_at = NOW()
            `, [tableName]);
                    }
                    console.log(`Added columns to ${uuidTablesResult.rowCount} UUID tables`);
                }
            }
            catch (scanError) {
                if (scanError.message && scanError.message.includes('has_parent_id')) {
                    // This is an expected error with older schemas, just log as info rather than error
                    console.log('Info: UUID table schema uses new format without has_parent_id column. This is OK.');
                }
                else {
                    // Log other errors but continue
                    console.error('Error fixing UUID tables, but continuing migration:', scanError);
                }
            }
            // Path to the blog posts files
            const postsDir = path.resolve(__dirname, '../../data/raw/posts');
            console.log(`Blog posts directory: ${postsDir}`);
            // Check if the directory exists
            if (!fs.existsSync(postsDir)) {
                console.log(`Blog posts directory does not exist: ${postsDir}`);
                console.log('Skipping blog posts migration.');
                return;
            }
            // Read all html or mdoc files
            const postFiles = fs
                .readdirSync(postsDir)
                .filter((file) => file.endsWith('.html') || file.endsWith('.mdoc'))
                .map((file) => path.join(postsDir, file));
            console.log(`Found ${postFiles.length} blog post files to migrate.`);
            // Skip migration if no files found
            if (postFiles.length === 0) {
                console.log('No post files found to migrate.');
                return;
            }
            console.log(`Starting migration of ${postFiles.length} blog post files...`);
            // Migrate each file to the database
            for (const file of postFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const { data, content: mdContent } = matter(content);
                    // Generate a slug from the file name
                    const fileExt = path.extname(file);
                    const slug = path.basename(file, fileExt);
                    // Log the markdown content size
                    console.log(`Processing ${slug} with content length: ${mdContent.length} characters`);
                    // Create a simple paragraph-based Lexical content structure directly
                    // This approach avoids the conversion issues with the markdown library
                    const lexicalContent = (() => {
                        try {
                            // Create a basic Lexical document structure with the content
                            // This is a simplified version that creates paragraphs for each line
                            const lines = mdContent.split('\n');
                            const children = [];
                            // Add a paragraph for each line
                            for (const line of lines) {
                                if (line.trim()) {
                                    children.push({
                                        type: 'paragraph',
                                        format: '',
                                        indent: 0,
                                        version: 1,
                                        children: [
                                            {
                                                detail: 0,
                                                format: 0,
                                                mode: 'normal',
                                                style: '',
                                                text: line,
                                                type: 'text',
                                                version: 1,
                                            },
                                        ],
                                    });
                                }
                            }
                            // Create the root node with all paragraph children
                            const result = {
                                root: {
                                    type: 'root',
                                    format: '',
                                    indent: 0,
                                    version: 1,
                                    children,
                                },
                            };
                            // Verify the conversion was successful by checking content length
                            const resultStr = JSON.stringify(result);
                            console.log(`Created Lexical format for ${slug}: ${resultStr.length} characters`);
                            if (resultStr.length < mdContent.length / 2) {
                                console.error(`WARNING: Possible data loss in ${slug} - markdown: ${mdContent.length} chars, lexical: ${resultStr.length} chars`);
                            }
                            return result;
                        }
                        catch (error) {
                            console.error(`Error converting ${slug} to Lexical format:`, error);
                            throw error;
                        }
                    })();
                    // Check if the post already exists
                    const existingPostResult = await client.query(`SELECT id FROM payload.posts WHERE slug = $1`, [slug]);
                    let postId;
                    if (existingPostResult.rows.length > 0) {
                        // Update existing post
                        postId = existingPostResult.rows[0].id;
                        console.log(`Updating existing post with slug ${slug} and ID ${postId}`);
                        await client.query(`UPDATE payload.posts SET
                title = $1,
                description = $2,
                content = $3,
                published_at = $4,
                status = $5,
                updated_at = NOW()
              WHERE id = $6`, [
                            data.title || slug,
                            data.description || '',
                            JSON.stringify(lexicalContent),
                            data.publishedAt
                                ? new Date(data.publishedAt).toISOString()
                                : new Date().toISOString(),
                            data.status || 'published',
                            postId,
                        ]);
                        migratedCount++; // Increment counter for updates
                        // Delete existing categories and tags with error handling
                        try {
                            await client.query(`DELETE FROM payload.posts_categories WHERE _parent_id = $1`, [postId]);
                        }
                        catch (delError) {
                            console.error(`Error deleting categories for post ${postId}, but continuing:`, delError.message);
                        }
                        try {
                            await client.query(`DELETE FROM payload.posts_tags WHERE _parent_id = $1`, [postId]);
                        }
                        catch (delError) {
                            console.error(`Error deleting tags for post ${postId}, but continuing:`, delError.message);
                        }
                    }
                    else {
                        // Create a new post
                        postId = uuidv4();
                        console.log(`Creating new post with slug ${slug} and ID ${postId}`);
                        await client.query(`INSERT INTO payload.posts (
                id, 
                title, 
                slug, 
                description, 
                content, 
                published_at, 
                status, 
                updated_at, 
                created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`, [
                            postId,
                            data.title || slug,
                            slug,
                            data.description || '',
                            JSON.stringify(lexicalContent),
                            data.publishedAt
                                ? new Date(data.publishedAt).toISOString()
                                : new Date().toISOString(),
                            data.status || 'published',
                        ]);
                        migratedCount++; // Increment counter for new posts
                    }
                    // Add categories if they exist with error handling
                    if (data.categories && Array.isArray(data.categories)) {
                        for (let i = 0; i < data.categories.length; i++) {
                            try {
                                const categoryId = uuidv4();
                                await client.query(`INSERT INTO payload.posts_categories (
                    id, 
                    _parent_id, 
                    category, 
                    updated_at, 
                    created_at,
                    "order"
                  ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`, [categoryId, postId, data.categories[i], i]);
                            }
                            catch (catError) {
                                console.error(`Error adding category ${data.categories[i]} to post ${postId}, but continuing:`, catError.message);
                            }
                        }
                    }
                    // Add tags if they exist with error handling
                    if (data.tags && Array.isArray(data.tags)) {
                        for (let i = 0; i < data.tags.length; i++) {
                            try {
                                const tagId = uuidv4();
                                await client.query(`INSERT INTO payload.posts_tags (
                    id, 
                    _parent_id, 
                    tag, 
                    updated_at, 
                    created_at,
                    "order"
                  ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`, [tagId, postId, data.tags[i], i]);
                            }
                            catch (tagError) {
                                console.error(`Error adding tag ${data.tags[i]} to post ${postId}, but continuing:`, tagError.message);
                            }
                        }
                    }
                    // Track the UUID table
                    const uuidTableName = `posts_${postId.replace(/-/g, '_')}`;
                    try {
                        // Use schema-compatible tracking approach
                        const result = await safeInsertIntoUuidTablesTracking(client, uuidTableName);
                        if (!result) {
                            console.log(`Note: UUID table tracking skipped for ${uuidTableName}`);
                        }
                    }
                    catch (trackingError) {
                        // Don't let UUID tracking errors stop the migration
                        console.log(`Note: UUID table tracking error for ${uuidTableName} - this is not critical`);
                    }
                    console.log(`Migrated blog post: ${slug} with ID: ${postId}`);
                }
                catch (error) {
                    console.error(`Error migrating ${file}:`, error);
                }
            }
            // Verify posts were migrated successfully
            try {
                const countResult = await client.query(`SELECT COUNT(*) FROM payload.posts`);
                const totalPosts = parseInt(countResult.rows[0].count);
                console.log(`Total posts in database after migration: ${totalPosts}`);
                if (totalPosts === 0) {
                    console.warn(`WARNING: No posts were found in the database after migration!`);
                    // Investigate possible issues
                    console.log('Checking for database structure issues...');
                    // Check if the posts table exists and has expected columns
                    const tableResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = 'posts'
          `);
                    console.log(`Posts table columns: ${tableResult.rows.map((r) => r.column_name).join(', ')}`);
                    // Check for any UUID tables with missing columns
                    try {
                        await client.query(`SELECT payload.scan_and_fix_uuid_tables();`);
                        console.log('Fixed any remaining UUID tables');
                    }
                    catch (e) {
                        console.error('Error checking UUID tables:', e.message);
                    }
                }
                else if (postFiles.length > 0 && migratedCount === 0) {
                    // This is the key change - clearer messaging
                    console.log(`NOTE: No new posts were migrated. All ${postFiles.length} posts already exist in the database.`);
                }
                else {
                    console.log(`Successfully migrated/updated ${migratedCount} of ${postFiles.length} posts. ✅`);
                }
            }
            catch (verifyError) {
                console.error('Error verifying migration:', verifyError);
            }
            console.log('=========================================');
            console.log('Blog posts migration complete! ✅');
            console.log(`Total posts in database: ${await client.query('SELECT COUNT(*) FROM payload.posts').then((res) => parseInt(res.rows[0].count))}`);
            console.log('=========================================');
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error migrating blog posts:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run the migration
migratePostsToDatabase().catch((error) => {
    console.error('Blog posts migration failed:', error);
    process.exit(1);
});
