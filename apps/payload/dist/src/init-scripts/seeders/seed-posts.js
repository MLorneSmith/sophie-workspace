import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import matter from 'gray-matter'; // For parsing YAML frontmatter
import { PostDefinitionSchema } from '../data/schemas/post-definition.schema.js'; // Import PostDefinitionSchema
import { markdocToLexical } from '../utils/lexical-converter.js'; // Markdoc to Lexical converter
// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to the posts raw Markdoc files
const POSTS_RAW_PATH = path.resolve(__dirname, '../data/raw/posts/');
export async function seedPosts(payload, logger, cliArgs) {
    const collectionSlug = 'posts'; // Adjust collection slug if different
    logger.info(`Starting seeder for collection: ${collectionSlug}...`);
    const idMap = {};
    // 1. Read all Markdoc files in the directory
    let mdocFiles;
    try {
        mdocFiles = await fs.readdir(POSTS_RAW_PATH);
        logger.info(`Found ${mdocFiles.length} Markdoc files in ${POSTS_RAW_PATH}`);
    }
    catch (error) {
        logger.error({ err: error, path: POSTS_RAW_PATH }, `Failed to read directory: ${POSTS_RAW_PATH}`);
        throw error; // Propagate error
    }
    for (const file of mdocFiles) {
        if (!file.endsWith('.mdoc')) {
            logger.debug(`Skipping non-Markdoc file: ${file}`);
            continue;
        }
        const filePath = path.resolve(POSTS_RAW_PATH, file);
        const ssotId = file.replace(/\.mdoc$/, ''); // Use filename (without extension) as SSOT ID
        logger.debug({ ssotId, file }, `Processing file: ${file}...`);
        try {
            // 2. Read file content and parse frontmatter
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const { data: frontmatter, content: rawMarkdocContent } = matter(fileContent);
            // Combine frontmatter and content for full validation
            const postData = {
                ...frontmatter,
                content: rawMarkdocContent,
                // Derive slug from filename if not in frontmatter
                slug: frontmatter.slug || ssotId,
            };
            // 3. Validate combined data
            let validatedPostData;
            try {
                validatedPostData = PostDefinitionSchema.parse(postData);
                logger.debug({ ssotId }, `Post data validated successfully for ${file}.`);
            }
            catch (error) {
                logger.error({ err: error, ssotId, file }, `Invalid post data structure for ${file}.`);
                throw error; // Propagate error
            }
            // 4. Convert Markdoc content to Lexical JSON
            const lexicalContent = await markdocToLexical(validatedPostData.content);
            // 5. Prepare data for Payload
            const slug = validatedPostData.slug; // Define slug variable
            const dataToCreate = {
                id: ssotId, // Use the SSOT ID (filename) as the Payload document ID
                slug: slug,
                title: validatedPostData.title,
                status: validatedPostData.status,
                description: validatedPostData.description,
                authors: validatedPostData.authors,
                image: validatedPostData.image,
                categories: validatedPostData.categories,
                tags: validatedPostData.tags,
                publishedAt: validatedPostData.publishedAt, // Keep as string for now, Payload might handle conversion
                language: validatedPostData.language,
                order: validatedPostData.order,
                content: lexicalContent, // Lexical JSON content
                // Add other core fields based on your Payload collection definition
            };
            // 6. "Create if not exists" logic (by slug or ID)
            let liveDocId;
            const existing = await payload.find({
                collection: collectionSlug,
                where: {
                    or: [
                        { slug: { equals: slug } },
                        { id: { equals: ssotId } } // Check by SSOT ID as well
                    ]
                },
                limit: 1,
                depth: 0,
            });
            if (existing.docs.length > 0) {
                liveDocId = existing.docs[0]?.id;
                logger.info({ slug, liveDocId }, `Found existing ${collectionSlug} document.`);
                // Optionally, update existing document if needed
                // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToCreate });
            }
            else {
                const newDoc = await payload.create({
                    collection: collectionSlug,
                    data: dataToCreate,
                });
                liveDocId = newDoc.id;
                logger.info({ slug, liveDocId }, `Created new ${collectionSlug} document.`);
            }
            idMap[ssotId] = liveDocId;
        }
        catch (itemError) {
            logger.error({ err: itemError, ssotId, file, collectionSlug }, `Failed to process file for ${collectionSlug}.`);
            throw itemError; // Propagate error
        }
    }
    logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length} items processed.`);
    return idMap;
}
//# sourceMappingURL=seed-posts.js.map