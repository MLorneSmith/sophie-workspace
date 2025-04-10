"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to migrate blog posts from Markdown files to Payload CMS directly in the PostgreSQL database
 */
const list_1 = require("@lexical/list");
const rich_text_1 = require("@lexical/rich-text");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const headless_1 = require("@payloadcms/richtext-lexical/lexical/headless");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const path_1 = __importDefault(require("path"));
const pg_1 = __importDefault(require("pg"));
const url_1 = require("url");
const uuid_1 = require("uuid");
const { Pool } = pg_1.default;
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `../../../${envFile}`) });
/**
 * Migrates blog posts from Markdown files directly to the PostgreSQL database
 */
async function migratePostsToDatabase() {
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
            // Path to the blog posts files
            const postsDir = path_1.default.resolve(__dirname, '../../../../../apps/web/content/posts');
            console.log(`Blog posts directory: ${postsDir}`);
            // Check if the directory exists
            if (!fs_1.default.existsSync(postsDir)) {
                console.log(`Blog posts directory does not exist: ${postsDir}`);
                console.log('Skipping blog posts migration.');
                return;
            }
            // Read all .mdoc files
            const mdocFiles = fs_1.default
                .readdirSync(postsDir)
                .filter((file) => file.endsWith('.mdoc'))
                .map((file) => path_1.default.join(postsDir, file));
            console.log(`Found ${mdocFiles.length} blog post files to migrate.`);
            // Migrate each file to the database
            for (const file of mdocFiles) {
                try {
                    const content = fs_1.default.readFileSync(file, 'utf8');
                    const { data, content: mdContent } = (0, gray_matter_1.default)(content);
                    // Generate a slug from the file name
                    const slug = path_1.default.basename(file, '.mdoc');
                    // Convert Markdown content to Lexical format
                    const lexicalContent = (() => {
                        // Create a headless editor instance with list nodes and heading nodes registered
                        const headlessEditor = (0, headless_1.createHeadlessEditor)({
                            nodes: [list_1.ListNode, list_1.ListItemNode, rich_text_1.HeadingNode],
                        });
                        // Convert Markdown to Lexical format
                        headlessEditor.update(() => {
                            (0, richtext_lexical_1.$convertFromMarkdownString)(mdContent);
                        }, { discrete: true });
                        // Get the Lexical JSON
                        return headlessEditor.getEditorState().toJSON();
                    })();
                    // Check if the post already exists
                    const existingPostResult = await client.query(`SELECT id FROM payload.posts WHERE slug = $1`, [slug]);
                    if (existingPostResult.rows.length > 0) {
                        console.log(`Post with slug ${slug} already exists. Skipping.`);
                        continue;
                    }
                    // Create a new post
                    const postId = (0, uuid_1.v4)();
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
                        data.status || 'draft',
                    ]);
                    // Add categories if they exist
                    if (data.categories && Array.isArray(data.categories)) {
                        for (let i = 0; i < data.categories.length; i++) {
                            const categoryId = (0, uuid_1.v4)();
                            await client.query(`INSERT INTO payload.posts_categories (
                  id, 
                  _parent_id, 
                  category, 
                  updated_at, 
                  created_at,
                  "order"
                ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`, [categoryId, postId, data.categories[i], i]);
                        }
                    }
                    // Add tags if they exist
                    if (data.tags && Array.isArray(data.tags)) {
                        for (let i = 0; i < data.tags.length; i++) {
                            const tagId = (0, uuid_1.v4)();
                            await client.query(`INSERT INTO payload.posts_tags (
                  id, 
                  _parent_id, 
                  tag, 
                  updated_at, 
                  created_at,
                  "order"
                ) VALUES ($1, $2, $3, NOW(), NOW(), $4)`, [tagId, postId, data.tags[i], i]);
                        }
                    }
                    console.log(`Migrated blog post: ${slug} with ID: ${postId}`);
                }
                catch (error) {
                    console.error(`Error migrating ${file}:`, error);
                }
            }
            console.log('Blog posts migration complete!');
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
