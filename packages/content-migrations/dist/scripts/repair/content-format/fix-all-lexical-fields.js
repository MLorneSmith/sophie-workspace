/**
 * Fix All Lexical Fields Script
 *
 * Repairs Lexical format issues across all collections that use the Lexical editor,
 * fixing issues that cause "Cannot destructure property 'config'" errors in the Payload admin UI.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Setup environment
const projectRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.resolve(projectRoot, '.env') });
// Get DATABASE_URI from environment
const DATABASE_URI = process.env.DATABASE_URI ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:54322/postgres';
/**
 * Creates a proper Lexical document structure that is compatible with Payload CMS
 */
function createProperLexicalStructure(originalText = '') {
    try {
        // Create a standard Lexical document structure with all properties required by Payload CMS
        return {
            root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                    {
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
                                text: originalText || 'Content placeholder',
                                type: 'text',
                                version: 1,
                            },
                        ],
                    },
                ],
                direction: 'ltr',
            },
            // Add necessary additional properties that Payload CMS Lexical editor expects
            format: '',
            version: 1,
            syncedChunksData: {},
            chunks: [],
            downloadedDataVersions: [],
            // The missing config property that causes the error
            config: {
                theme: {
                    text: {
                        bold: 'lexical-bold',
                        code: 'lexical-code',
                        italic: 'lexical-italic',
                        strikethrough: 'lexical-strikethrough',
                        subscript: 'lexical-subscript',
                        superscript: 'lexical-superscript',
                        underline: 'lexical-underline',
                        underlineStrikethrough: 'lexical-underlineStrikethrough',
                    },
                },
                namespace: 'lexical',
            },
        };
    }
    catch (error) {
        console.error(`Error creating Lexical structure: ${error.message}`);
        // Return a minimal valid structure with required config
        return {
            root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                    {
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
                                text: 'Content unavailable',
                                type: 'text',
                                version: 1,
                            },
                        ],
                    },
                ],
                direction: 'ltr',
            },
            format: '',
            version: 1,
            syncedChunksData: {},
            chunks: [],
            downloadedDataVersions: [],
            config: {
                theme: {
                    text: {
                        bold: 'lexical-bold',
                        code: 'lexical-code',
                        italic: 'lexical-italic',
                        strikethrough: 'lexical-strikethrough',
                        subscript: 'lexical-subscript',
                        superscript: 'lexical-superscript',
                        underline: 'lexical-underline',
                        underlineStrikethrough: 'lexical-underlineStrikethrough',
                    },
                },
                namespace: 'lexical',
            },
        };
    }
}
/**
 * Extracts text content from an existing lexical structure if possible
 */
function extractTextFromLexical(lexicalData) {
    try {
        if (!lexicalData)
            return '';
        let lexicalObj;
        if (typeof lexicalData === 'string') {
            try {
                lexicalObj = JSON.parse(lexicalData);
            }
            catch {
                return lexicalData.slice(0, 100); // Use part of the string if not parsable
            }
        }
        else {
            lexicalObj = lexicalData;
        }
        // Try to extract text from children recursively
        function extractTextFromNode(node) {
            if (!node)
                return '';
            if (node.text)
                return node.text;
            if (node.children && Array.isArray(node.children)) {
                return node.children
                    .map((child) => extractTextFromNode(child))
                    .join(' ');
            }
            return '';
        }
        if (lexicalObj.root) {
            return extractTextFromNode(lexicalObj.root);
        }
        return '';
    }
    catch (error) {
        console.error(`Error extracting text: ${error.message}`);
        return '';
    }
}
/**
 * Fix Lexical format for a specific field in a table
 */
async function fixLexicalField(pool, table, field) {
    try {
        console.log(chalk.cyan(`Processing field '${field}' in table '${table}'...`));
        // Get all records with the specified field that's not null
        const query = `SELECT id, ${field} FROM payload.${table} WHERE ${field} IS NOT NULL`;
        const result = await pool.query(query);
        console.log(chalk.yellow(`Found ${result.rows.length} records with non-null ${field} field`));
        let updatedCount = 0;
        // Process each record
        for (const row of result.rows) {
            try {
                // Extract existing text
                const extractedText = extractTextFromLexical(row[field]);
                // Create proper structure with preserved text
                const properStructure = createProperLexicalStructure(extractedText);
                // Update the record
                const updateQuery = `
          UPDATE payload.${table}
          SET ${field} = $1
          WHERE id = $2
        `;
                await pool.query(updateQuery, [
                    JSON.stringify(properStructure),
                    row.id,
                ]);
                updatedCount++;
            }
            catch (recordError) {
                console.error(chalk.red(`Error processing record ${row.id} in ${table}.${field}:`), recordError.message);
            }
        }
        console.log(chalk.green(`✅ Fixed ${updatedCount}/${result.rows.length} records in ${table}.${field}`));
        return updatedCount;
    }
    catch (error) {
        console.error(chalk.red(`Error fixing ${table}.${field}:`), error.message);
        return 0;
    }
}
/**
 * Main function to fix all Lexical fields across collections
 */
async function fixAllLexicalFields() {
    console.log(chalk.blue('=== FIXING ALL LEXICAL FIELDS ==='));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    // Define collections and their Lexical fields
    const collectionsWithLexicalFields = [
        { table: 'posts', fields: ['content'] },
        { table: 'private', fields: ['content'] },
        { table: 'courses', fields: ['content'] },
        {
            table: 'course_lessons',
            fields: [
                'content',
                'todo',
                'todo_watch_content',
                'todo_read_content',
                'todo_course_project',
            ],
        },
        { table: 'quiz_questions', fields: ['explanation'] },
        { table: 'documentation', fields: ['content'] },
    ];
    const pool = new Pool({ connectionString: DATABASE_URI });
    try {
        // Begin transaction
        await pool.query('BEGIN');
        let totalFieldsProcessed = 0;
        let totalRecordsUpdated = 0;
        // Process each collection and its Lexical fields
        for (const collection of collectionsWithLexicalFields) {
            console.log(chalk.yellow(`\nProcessing collection: ${collection.table}`));
            // Check if table exists
            try {
                const tableExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload' 
            AND table_name = $1
          )
        `;
                const tableExists = await pool.query(tableExistsQuery, [
                    collection.table,
                ]);
                if (!tableExists.rows[0].exists) {
                    console.log(chalk.yellow(`Table ${collection.table} does not exist, skipping`));
                    continue;
                }
                // Process each field
                for (const field of collection.fields) {
                    // Check if field exists
                    try {
                        const fieldExistsQuery = `
              SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'payload' 
                AND table_name = $1
                AND column_name = $2
              )
            `;
                        const fieldExists = await pool.query(fieldExistsQuery, [
                            collection.table,
                            field,
                        ]);
                        if (!fieldExists.rows[0].exists) {
                            console.log(chalk.yellow(`Field ${field} does not exist in table ${collection.table}, skipping`));
                            continue;
                        }
                        // Fix the Lexical field
                        const updatedCount = await fixLexicalField(pool, collection.table, field);
                        totalRecordsUpdated += updatedCount;
                        totalFieldsProcessed++;
                    }
                    catch (fieldError) {
                        console.error(chalk.red(`Error checking field ${field} in ${collection.table}:`), fieldError.message);
                    }
                }
            }
            catch (tableError) {
                console.error(chalk.red(`Error checking table ${collection.table}:`), tableError.message);
            }
        }
        // Commit transaction
        await pool.query('COMMIT');
        console.log(chalk.green(`\n=== SUMMARY ===`));
        console.log(chalk.green(`Fields processed: ${totalFieldsProcessed}`));
        console.log(chalk.green(`Records updated: ${totalRecordsUpdated}`));
        return {
            success: true,
            fieldsProcessed: totalFieldsProcessed,
            recordsUpdated: totalRecordsUpdated,
        };
    }
    catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        console.error(chalk.red('Error fixing Lexical fields:'), error.message);
        return {
            success: false,
            error: error.message,
        };
    }
    finally {
        await pool.end();
    }
}
// Auto-execute when run directly
fixAllLexicalFields()
    .then((result) => {
    if (result.success) {
        console.log(chalk.green('Successfully fixed all Lexical fields.'));
        process.exit(0);
    }
    else {
        console.error(chalk.red(`Failed to fix all Lexical fields: ${result.error}`));
        process.exit(1);
    }
})
    .catch((error) => {
    console.error(chalk.red('Error running fix-all-lexical-fields:'), error);
    process.exit(1);
});
export default fixAllLexicalFields;
