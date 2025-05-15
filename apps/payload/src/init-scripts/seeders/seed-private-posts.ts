import type { Payload } from 'payload';
import type { Logger } from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import yaml from 'js-yaml'; // Assuming SSOT is YAML, adjust if needed
import { z } from 'zod'; // Import z from zod

import { PrivatePostDefinitionsSchema, PrivatePostDefinitionSchema } from '../data/schemas/private-post-definition.schema.js'; // Import PostDefinitionSchema
import { markdocToLexical } from '../utils/lexical-converter.js'; // Markdoc to Lexical converter
import { generateSlug } from '../utils/slugify.js'; // Assuming slugify utility exists

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the private posts SSOT data
const PRIVATE_POSTS_SSOT_PATH = path.resolve(__dirname, '../data/raw/private/private-posts.yaml'); // Adjust filename/extension as needed

interface SeederArgs { /* Potentially specific args for this seeder */ }

export async function seedPrivatePosts(
  payload: Payload,
  logger: Logger,
  cliArgs: SeederArgs, // Or use the general Stage2Args
): Promise<Record<string, string | undefined>> {
  const collectionSlug = 'private'; // Adjust collection slug if different
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string | undefined> = {};

  // 1. Load and Validate SSOT Data
  let ssotPrivatePosts: z.infer<typeof PrivatePostDefinitionsSchema>;
  try {
    const fileContent = await fs.readFile(PRIVATE_POSTS_SSOT_PATH, 'utf-8');
    // Assuming YAML, adjust loader if JSON or other format
    const rawData = yaml.load(fileContent);

    ssotPrivatePosts = PrivatePostDefinitionsSchema.parse(rawData);
    logger.info(`SSOT data for ${collectionSlug} validated successfully.`);
  } catch (error) {
    logger.error({ err: error, collectionSlug, path: PRIVATE_POSTS_SSOT_PATH }, `Invalid SSOT data structure or file not found for ${collectionSlug}.`);
    throw error; // Propagate error
  }

  for (const postData of ssotPrivatePosts) {
    const ssotId = postData.id;
    const itemTitle = postData.title;
    logger.debug({ ssotId, itemTitle }, `Processing ${collectionSlug} item...`);

    try {
      const slug = postData.slug || generateSlug(itemTitle);

      // 2. Convert Markdoc content to Lexical JSON
      // This utility will be implemented later in this task
      const lexicalContent = await markdocToLexical(postData.content);

      // 3. Prepare data for Payload
      const dataToCreate: any = { // Use 'any' temporarily until types are clearer
        id: ssotId, // Use the SSOT ID (filename) as the Payload document ID
        title: itemTitle,
        slug: slug,
        status: postData.status,
        content: lexicalContent, // Lexical JSON content
        // Add other core fields based on your Payload collection definition
      };

      // 4. "Create if not exists" logic (by slug or ID)
      let liveDocId: string | undefined;
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
      } else {
        const newDoc = await payload.create({
          collection: collectionSlug,
          data: dataToCreate,
        });
        liveDocId = newDoc.id;
        logger.info({ slug, liveDocId }, `Created new ${collectionSlug} document.`);
      }

      idMap[ssotId] = liveDocId;

    } catch (itemError) {
      logger.error({ err: itemError, ssotId, itemTitle, collectionSlug }, `Failed to process item for ${collectionSlug}.`);
      throw itemError; // Propagate error
    }
  }

  logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length} items processed.`);
  return idMap;
}
