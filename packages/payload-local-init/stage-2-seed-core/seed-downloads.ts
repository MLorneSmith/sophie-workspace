import type { Payload } from 'payload';

import { R2_DOWNLOADS_LIST } from '../data/r2-downloads-list';

// Import the new SSOT

export async function seedDownloads(payload: Payload) {
  console.log('Starting Stage 2: Seed Downloads...');

  let errorCount = 0; // Declare errorCount here

  try {
    console.log('Executing: Seed Downloads (via orchestrator)...');

    const downloadObjects = R2_DOWNLOADS_LIST; // Use the new SSOT

    console.log(
      `Found ${downloadObjects.length} download definitions in SSOT.`,
    );

    // Seed Downloads collection
    console.log('Seeding Downloads...');
    for (const downloadObject of downloadObjects) {
      try {
        // Check if download already exists by filename (assuming filename is unique)
        const existingDownload = await payload.find({
          collection: 'downloads',
          where: {
            filename: {
              equals: downloadObject.key, // Use R2 object key as filename
            },
          },
        });

        if (existingDownload.docs.length === 0) {
          // Construct the public file URL
          const fileUrl = `https://downloads.slideheroes.com/${downloadObject.key}`;

          // Prepare data for Payload. Map SSOT data to schema fields.
          const dataToCreate = {
            filename: downloadObject.key, // Use R2 object key as filename
            filesize: downloadObject.size,
            mimeType: downloadObject.contentType, // Get mime type from SSOT
            url: fileUrl, // Provide the public URL
            title: downloadObject.key, // Use filename as default title, might need to source from elsewhere
            // Add other relevant fields from SSOT if available
          };

          console.log(
            `Attempting to create download item with data: ${JSON.stringify(dataToCreate, null, 2)}`,
          );

          const createdDownload = await payload.create({
            collection: 'downloads',
            data: dataToCreate,
          });
          console.log(
            `Created Download: ${createdDownload.title} (${createdDownload.id})`,
          );
        } else {
          const existingId = existingDownload.docs[0]?.id;
          console.log(
            `Download already exists, skipping creation: ${downloadObject.key}${existingId ? ` (${existingId})` : ''}`,
          );
          // Optionally, update the existing download if needed
        }
      } catch (error: any) {
        console.error(
          `Error creating download "${downloadObject.key}":`, // Log the key that failed
          error.message,
        );
        if (error.payloadErrors) {
          console.error(
            'Payload errors:',
            JSON.stringify(error.payloadErrors, null, 2),
          );
        } else {
          // Log the full error object for more details
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
        errorCount++; // Track individual creation errors
      }
    }

    console.log(`Downloads seeding completed with ${errorCount} errors.`); // Report total errors
    if (errorCount > 0) {
      throw new Error(`Seed Downloads encountered ${errorCount} errors.`); // Throw error to orchestrator
    }
  } catch (error: any) {
    const errorMessage = error?.message ?? 'Unknown error';
    console.error('Error during Seed Downloads process:', errorMessage);
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
