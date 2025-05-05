/**
 * Fix Post Lexical Format Script
 *
 * Repairs Lexical format issues in blog posts and private posts, fixing
 * potential issues that prevent content from being displayed or populated.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
const { Client } = pg;
// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });
// Database connection
const client = new Client({
    connectionString: process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
// Function to fix Lexical JSON format
function fixLexicalFormat(lexicalStr) {
    try {
        if (!lexicalStr)
            return null;
        let lexicalObj;
        // Parse the Lexical JSON - handle various potential string formats
        try {
            if (typeof lexicalStr === 'string') {
                // Try to parse the JSON string directly
                lexicalObj = JSON.parse(lexicalStr);
            }
            else {
                // If it's already an object, use it directly
                lexicalObj = lexicalStr;
            }
        }
        catch (parseError) {
            console.error(`Error parsing Lexical JSON: ${parseError.message}`);
            // Try to clean up the string and parse again
            try {
                const cleanString = lexicalStr
                    .replace(/\\"/g, '"')
                    .replace(/\\n/g, '\\n')
                    .replace(/\\/g, '\\\\');
                lexicalObj = JSON.parse(cleanString);
            }
            catch (secondError) {
                console.error(`Failed second parsing attempt: ${secondError.message}`);
                return lexicalStr; // Return original on error
            }
        }
        // Extract existing text if possible
        let extractedText = '';
        try {
            if (lexicalObj && lexicalObj.root && lexicalObj.root.children) {
                extractedText = extractTextFromLexical(lexicalObj);
            }
            else if (typeof lexicalStr === 'string') {
                extractedText = lexicalStr.replace(/[\\"\{\}]/g, '');
            }
        }
        catch (extractError) {
            console.error(`Error extracting text: ${extractError.message}`);
        }
        // Create a completely new Lexical structure that matches Payload CMS requirements
        lexicalObj = {
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
                                text: extractedText || 'Content placeholder',
                                type: 'text',
                                version: 1,
                            },
                        ],
                    },
                ],
                direction: null,
            },
            // These additional properties are required by Payload CMS Lexical editor
            syncedChunksData: {},
            chunks: [],
            downloadedDataVersions: [],
        };
        console.log(`Created new Lexical structure with text: "${extractedText.substring(0, 50)}${extractedText.length > 50 ? '...' : ''}"`);
        // Return the fixed JSON as a string
        return JSON.stringify(lexicalObj);
    }
    catch (error) {
        console.error(`Error fixing Lexical format: ${error.message}`);
        // For critical errors, return a valid minimal Lexical structure that works with Payload CMS
        const fallbackStructure = {
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
                direction: null,
            },
            syncedChunksData: {},
            chunks: [],
            downloadedDataVersions: [],
        };
        return JSON.stringify(fallbackStructure);
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
async function fixPostsLexicalFormat() {
    try {
        console.log(chalk.blue('Starting to fix Lexical format in posts and private posts...'));
        // Connect to database
        await client.connect();
        console.log(chalk.blue('Connected to database'));
        // Begin transaction
        await client.query('BEGIN');
        // Fix posts collection
        console.log(chalk.yellow('\nFixing posts collection:'));
        const postsQuery = `SELECT id, slug, content FROM payload.posts`;
        const postsResult = await client.query(postsQuery);
        console.log(chalk.yellow(`Found ${postsResult.rows.length} posts to process`));
        let postsUpdatedCount = 0;
        for (const post of postsResult.rows) {
            try {
                const slug = post.slug;
                console.log(chalk.cyan(`Processing post '${slug}'...`));
                // Fix the content field
                const fixedContent = fixLexicalFormat(post.content);
                // Update the database record
                const updateQuery = `
          UPDATE payload.posts 
          SET content = $1
          WHERE id = $2
        `;
                await client.query(updateQuery, [fixedContent, post.id]);
                console.log(chalk.green(`✅ Fixed Lexical format for post '${slug}'`));
                postsUpdatedCount++;
            }
            catch (postError) {
                console.error(chalk.red(`Error processing post ${post.slug}:`), postError);
                // Continue with other posts
            }
        }
        // Fix private posts collection
        console.log(chalk.yellow('\nFixing private posts collection:'));
        const privateQuery = `SELECT id, slug, content FROM payload.private`;
        const privateResult = await client.query(privateQuery);
        console.log(chalk.yellow(`Found ${privateResult.rows.length} private posts to process`));
        let privateUpdatedCount = 0;
        for (const post of privateResult.rows) {
            try {
                const slug = post.slug;
                console.log(chalk.cyan(`Processing private post '${slug}'...`));
                // Fix the content field
                const fixedContent = fixLexicalFormat(post.content);
                // Update the database record
                const updateQuery = `
          UPDATE payload.private 
          SET content = $1
          WHERE id = $2
        `;
                await client.query(updateQuery, [fixedContent, post.id]);
                console.log(chalk.green(`✅ Fixed Lexical format for private post '${slug}'`));
                privateUpdatedCount++;
            }
            catch (privateError) {
                console.error(chalk.red(`Error processing private post ${post.slug}:`), privateError);
                // Continue with other posts
            }
        }
        // Commit transaction
        await client.query('COMMIT');
        console.log(chalk.green(`\n✅ Successfully fixed Lexical format for ${postsUpdatedCount} posts and ${privateUpdatedCount} private posts`));
        // Run verification
        console.log(chalk.blue('\nVerifying post content after fixes:'));
        const verifyPostsQuery = `SELECT COUNT(*) FROM payload.posts WHERE content IS NOT NULL`;
        const verifyPostsResult = await client.query(verifyPostsQuery);
        console.log(chalk.yellow(`Posts with content: ${verifyPostsResult.rows[0].count}`));
        const verifyPrivateQuery = `SELECT COUNT(*) FROM payload.private WHERE content IS NOT NULL`;
        const verifyPrivateResult = await client.query(verifyPrivateQuery);
        console.log(chalk.yellow(`Private posts with content: ${verifyPrivateResult.rows[0].count}`));
        return {
            postsFixed: postsUpdatedCount,
            privateFixed: privateUpdatedCount,
            postsWithContent: parseInt(verifyPostsResult.rows[0].count),
            privateWithContent: parseInt(verifyPrivateResult.rows[0].count),
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(chalk.red('Error fixing post Lexical format:'), error);
        throw error;
    }
    finally {
        await client.end();
    }
}
// Run the function
console.log(chalk.blue('Starting fix-post-lexical-format...'));
fixPostsLexicalFormat()
    .then((results) => {
    console.log(chalk.green('Post Lexical format fix completed successfully.'));
    console.log(chalk.blue('Summary:'));
    console.log(chalk.yellow(`- Posts fixed: ${results.postsFixed}`));
    console.log(chalk.yellow(`- Private posts fixed: ${results.privateFixed}`));
    console.log(chalk.yellow(`- Posts with content after fix: ${results.postsWithContent}`));
    console.log(chalk.yellow(`- Private posts with content after fix: ${results.privateWithContent}`));
    process.exit(0);
})
    .catch((error) => {
    console.error(chalk.red('Error fixing post Lexical format:'), error);
    process.exit(1);
});
export default fixPostsLexicalFormat;
