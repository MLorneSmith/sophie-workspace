import type { Payload } from 'payload';

import { R2_MEDIA_LIST } from '../data/r2-media-list';

// Import the new SSOT

export async function seedMedia(payload: Payload) {
  console.log('Starting Stage 2: Seed Media...');

  try {
    console.log('Executing: Seed Media (via orchestrator)...');

    const mediaObjects = R2_MEDIA_LIST; // Use the new SSOT

    console.log(`Found ${mediaObjects.length} media objects in SSOT.`);

    // Seed Media collection
    console.log('Seeding Media...');
    for (const mediaObject of mediaObjects) {
      try {
        // Check if media item already exists by filename to avoid duplicates
        const existingMediaItem = await payload.find({
          collection: 'media',
          where: {
            filename: {
              equals: mediaObject.key, // Use R2 object key as filename
            },
          },
        });

        if (existingMediaItem.docs.length === 0) {
          // Construct the public file URL
          const fileUrl = `https://images.slideheroes.com/${mediaObject.key}`;

          // Prepare data for Payload. Map SSOT data to schema fields.
          const dataToCreate = {
            filename: mediaObject.key, // Use R2 object key as filename
            filesize: mediaObject.size,
            mimeType: mediaObject.contentType, // Get mime type from SSOT
            url: fileUrl, // Provide the public URL
            alt: mediaObject.key, // Use filename as default alt text, might need to source from elsewhere
            // Add other relevant fields from SSOT if available (width, height, focal_x, focal_y)
            // Note: SSOT might not have dimensions directly, might need to source from elsewhere
          };

          console.log(
            `Attempting to create media item with data: ${JSON.stringify(dataToCreate, null, 2)}`,
          );

          const createdMediaItem = await payload.create({
            collection: 'media',
            data: dataToCreate,
          });
          console.log(
            `Created Media: ${createdMediaItem.filename} (${createdMediaItem.id})`,
          );
        } else {
          const existingId = existingMediaItem.docs[0]?.id;
          console.log(
            `Media already exists, skipping creation: ${mediaObject.key}${existingId ? ` (${existingId})` : ''}`,
          );
          // Optionally, update the existing media item if needed
        }
      } catch (error: any) {
        console.error(
          `Error creating media item ${mediaObject.key}:`,
          error.message,
        );
        if (error.payloadErrors) {
          console.error(
            'Payload errors:',
            JSON.stringify(error.payloadErrors, null, 2),
          );
        } else {
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
      }
    }

    console.log('Media seeding completed.');
  } catch (error: any) {
    const errorMessage = error?.message ?? 'Unknown error';
    console.error('Error during Seed Media process:', errorMessage);
    if (error.payloadErrors) {
      console.error(
        'Payload errors:',
        JSON.stringify(error.payloadErrors, null, 2),
      );
    } else {
      console.error('Full error object:', JSON.stringify(error, null, 2));
    }
    throw error; // Re-throw to be caught by the orchestrator
  }
}
