"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to migrate documentation directly to the database
 */
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
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env.development') });
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
            const docsDir = path_1.default.resolve(__dirname, '../../../../../apps/payload/data/documentation');
            console.log(`Documentation directory: ${docsDir}`);
            // Function to recursively read all .mdoc files
            const readMdocFiles = (dir, parentPath = '') => {
                console.log(`Reading directory: ${dir}`);
                const files = [];
                try {
                    const items = fs_1.default.readdirSync(dir);
                    console.log(`Found ${items.length} items in directory`);
                    for (const item of items) {
                        const itemPath = path_1.default.join(dir, item);
                        const stat = fs_1.default.statSync(itemPath);
                        if (stat.isDirectory()) {
                            console.log(`Found directory: ${item}`);
                            files.push(...readMdocFiles(itemPath, path_1.default.join(parentPath, item)));
                        }
                        else if (item.endsWith('.mdoc')) {
                            console.log(`Found .mdoc file: ${item}`);
                            files.push(path_1.default.join(parentPath, item));
                        }
                        else {
                            console.log(`Skipping file: ${item} (not a .mdoc file)`);
                        }
                    }
                }
                catch (error) {
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
                const filePath = path_1.default.join(docsDir, file);
                try {
                    const content = fs_1.default.readFileSync(filePath, 'utf8');
                    const { data, content: mdContent } = (0, gray_matter_1.default)(content);
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
                    const docId = (0, uuid_1.v4)();
                    // Insert the document into the database, skip if it already exists
                    await client.query(`INSERT INTO payload.documentation (id, title, slug, description, content, status, updated_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (slug) DO NOTHING`, [
                        docId,
                        data.title || path_1.default.basename(file, '.mdoc'),
                        slug,
                        data.description || '',
                        JSON.stringify(simpleContent),
                        'published',
                    ]);
                    // Store the document ID for later use
                    docIdMap.set(slug, docId);
                    console.log(`Migrated: ${file} with ID: ${docId}`);
                }
                catch (error) {
                    console.error(`Error migrating ${file}:`, error);
                }
            }
            // Second pass: Update parent relationships
            console.log('Skipping second pass (parent relationships) for now');
            console.log('Documentation migration complete!');
        }
        finally {
            client.release();
        }
    }
    finally {
        await pool.end();
    }
}
// Run the migration
migrateDocsToDatabase().catch((error) => {
    console.error('Documentation migration failed:', error);
    process.exit(1);
});
