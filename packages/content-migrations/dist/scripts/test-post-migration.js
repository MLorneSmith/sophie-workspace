/**
 * Test script to verify the post migration fix
 */
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Tests the post content conversion without actually modifying the database
 */
async function testPostContentConversion() {
    try {
        // Path to the blog posts files
        const postsDir = path.resolve(process.cwd(), 'src/data/raw/posts');
        console.log(`Testing with posts from: ${postsDir}`);
        // Check if the directory exists
        if (!fs.existsSync(postsDir)) {
            console.error(`Blog posts directory does not exist: ${postsDir}`);
            process.exit(1);
        }
        // Read all .mdoc files
        const mdocFiles = fs
            .readdirSync(postsDir)
            .filter((file) => file.endsWith('.mdoc'))
            .map((file) => path.join(postsDir, file));
        console.log(`Found ${mdocFiles.length} blog post files to test.`);
        if (mdocFiles.length === 0) {
            console.error('No .mdoc files found in the specified directory.');
            process.exit(1);
        }
        // Test conversion for each file
        for (const file of mdocFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const { data, content: mdContent } = matter(content);
                // Generate a slug from the file name
                const slug = path.basename(file, '.mdoc');
                console.log(`\n============ TESTING POST: ${slug} ============`);
                console.log(`Markdown content length: ${mdContent.length} characters`);
                console.log(`Post title: ${data.title || slug}`);
                // If the markdown content is large, just show the first 100 characters
                console.log(`Markdown preview: ${mdContent.substring(0, 100)}...`);
                // Write the complete markdown content to a debugging file for manual inspection
                const debugDir = path.resolve(process.cwd(), 'src/data/debug');
                if (!fs.existsSync(debugDir)) {
                    fs.mkdirSync(debugDir, { recursive: true });
                }
                fs.writeFileSync(path.join(debugDir, `${slug}-content.txt`), mdContent, 'utf8');
                // Test the conversion
                // Create a headless editor instance
                const headlessEditor = createHeadlessEditor();
                // Convert Markdown to Lexical format
                headlessEditor.update(() => {
                    $convertFromMarkdownString(mdContent);
                }, { discrete: true });
                // Get the Lexical JSON
                const result = headlessEditor.getEditorState().toJSON();
                // Check the length of the resulting JSON
                const resultStr = JSON.stringify(result);
                console.log(`Converted to Lexical format: ${resultStr.length} characters`);
                // Verify if the content was truncated
                if (resultStr.length < 500 && mdContent.length > 1000) {
                    console.error(`WARNING: Possible truncation in ${slug} - markdown: ${mdContent.length} chars, lexical: ${resultStr.length} chars`);
                }
                else {
                    console.log(`✅ Conversion successful and complete for ${slug}`);
                }
                // Check if the root node contains children
                const rootNode = result.root;
                if (rootNode && rootNode.children) {
                    console.log(`Number of top-level nodes: ${rootNode.children.length}`);
                }
                else {
                    console.error(`❌ No children found in the root node for ${slug}`);
                }
            }
            catch (error) {
                console.error(`Error testing conversion for ${file}:`, error);
            }
        }
        console.log('\nTest completed!');
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}
// Run the test
testPostContentConversion();
