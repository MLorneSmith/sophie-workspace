/**
 * Utility functions for validating Payload CMS schema before migrations
 */
import { getPayloadClient } from './payload-client.js';
/**
 * Validates that a collection exists in the Payload CMS schema
 * @param collectionSlug - The slug of the collection to validate
 * @returns A boolean indicating whether the collection exists
 */
export async function validateCollectionSchema(collectionSlug) {
    const payload = await getPayloadClient();
    try {
        // Fetch one record to test if the collection exists and is accessible
        await payload.find({
            collection: collectionSlug,
            limit: 1,
        });
        console.log(`✅ Collection '${collectionSlug}' schema validated successfully`);
        return true;
    }
    catch (error) {
        console.error(`❌ Schema validation failed for collection '${collectionSlug}':`);
        console.error(error);
        console.error('Please run database migrations first using: pnpm --filter payload run apply:migrations');
        return false;
    }
}
/**
 * Validates that multiple collections exist in the Payload CMS schema
 * @param collectionSlugs - An array of collection slugs to validate
 * @returns A boolean indicating whether all collections exist
 */
export async function validateMultipleCollectionSchemas(collectionSlugs) {
    const results = await Promise.all(collectionSlugs.map(async (slug) => {
        return {
            slug,
            valid: await validateCollectionSchema(slug),
        };
    }));
    const invalidCollections = results.filter((result) => !result.valid);
    if (invalidCollections.length > 0) {
        console.error('❌ The following collections failed schema validation:');
        invalidCollections.forEach((result) => {
            console.error(`   - ${result.slug}`);
        });
        console.error('Please run database migrations first using: pnpm --filter payload run apply:migrations');
        return false;
    }
    console.log('✅ All collection schemas validated successfully');
    return true;
}
