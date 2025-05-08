// seed-surveys.ts
// Script for Stage 2: Core Content Seeding - Surveys
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import { title } from 'process';
import { v4 as uuidv4 } from 'uuid';

// Import Payload config
import config from '../../../apps/payload/src/payload.config';

console.log('Current working directory:', process.cwd());

// Define the path to the raw survey YAML files relative to the package directory
const surveysRawPath = path.join(process.cwd(), 'data/raw/surveys');

console.log('Resolved surveysRawPath:', surveysRawPath);

console.log('Starting Stage 2: Seed Surveys...');

async function seedSurveys() {
  let payload: Payload | null = null;

  try {
    // Get a local copy of Payload
    console.log('Initializing Payload...');
    payload = await getPayload({ config });
    console.log('Payload initialized.');
    console.log(
      'Contents of surveysRawPath (inside async):',
      fs.readdirSync(surveysRawPath),
    );

    // Find all survey YAML files
    const surveyFiles = glob.sync(surveysRawPath.replace(/\\/g, '/') + '/*');

    console.log('Files found by glob:', surveyFiles);
    console.log(`Found ${surveyFiles.length} survey files.`);

    for (const filePath of surveyFiles) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const surveyData = yaml.load(fileContent) as any; // Cast to any for now

      try {
        // Check if survey already exists by slug
        const existingSurvey = await payload.find({
          collection: 'surveys',
          where: {
            slug: {
              equals: surveyData.slug,
            },
          },
        });

        if (existingSurvey.docs.length === 0) {
          // Survey does not exist, create it

          const surveyPayloadData: any = {
            id: uuidv4(), // Generate a new UUID for the survey document
            title: surveyData.title,
            slug: surveyData.slug,
            description: surveyData.description,
            status: surveyData.status || 'draft', // Default to draft if status is missing
          };

          if (surveyData.status === 'published') {
            surveyPayloadData.publishedAt = new Date(); // Use 'publishedAt' as per schema
          }

          // Add other optional fields if they exist in YAML and schema
          if (surveyData.startMessage) {
            surveyPayloadData.startMessage = surveyData.startMessage;
          }
          if (surveyData.endMessage) {
            surveyPayloadData.endMessage = surveyData.endMessage;
          }
          if (surveyData.showProgressBar !== undefined) {
            surveyPayloadData.showProgressBar = surveyData.showProgressBar;
          }
          if (surveyData.summaryContent) {
            surveyPayloadData.summaryContent = surveyData.summaryContent;
          }
          // downloads and questions relationships will be populated in Stage 3

          console.log(
            'Creating Survey with data:',
            JSON.stringify(surveyPayloadData, null, 2),
          );

          await payload.create({
            collection: 'surveys',
            data: surveyPayloadData,
          });
          console.log(
            `Created Survey: ${surveyData.title} (${surveyData.slug})`,
          );
        } else {
          console.log(
            `Survey already exists, skipping creation: ${surveyData.title} (${surveyData.slug})`,
          );
          // Optionally, update the existing survey if needed
          // await payload.update({
          //   collection: 'surveys',
          //   id: existingSurvey.docs[0].id,
          //   data: {
          //     title: surveyData.title,
          //     description: surveyData.description,
          //     status: surveyData.status || 'draft',
          //     publishedAt: surveyData.status === 'published' ? new Date() : null, // Use 'publishedAt'
          //   },
          // });
          // console.log(`Updated existing Survey: ${surveyData.title} (${surveyData.slug})`);
        }
      } catch (error: any) {
        console.error(
          `Error processing Survey "${surveyData.title}":`,
          error.message,
        );
        // Continue with other surveys
      }
    }

    console.log('Surveys seeding completed.');
    process.exit(0); // Exit cleanly on success
  } catch (error: any) {
    console.error('Error during Seed Surveys process:', error.message);
    process.exit(1); // Exit with a non-zero code on failure
  } finally {
    if (payload) {
      // Removed payload.shutdown() as it seems to not be a function in this context.
      // The Node.js process exiting should handle cleanup.
      console.log('Seed Surveys script finished.');
    }
  }
}

seedSurveys();
