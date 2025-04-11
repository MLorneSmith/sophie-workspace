/**
 * Script to fix bunny_video_id values for course lessons
 * The script reads video IDs from the YAML metadata file and updates the database directly
 */
import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../../.env.development');
dotenv.config({ path: envPath });

// Define paths
const YAML_FILE_PATH = path.resolve(
  __dirname,
  '../../data/raw/lesson-metadata.yaml',
);

async function fixBunnyVideoIds() {
  // Force console output at the beginning
  process.stdout.write(
    'Starting to fix bunny_video_id values for course lessons...\n',
  );
  console.log('Starting to fix bunny_video_id values for course lessons...');

  // Read the YAML file
  if (!fs.existsSync(YAML_FILE_PATH)) {
    console.error(`YAML file not found at ${YAML_FILE_PATH}`);
    return false;
  }

  // Parse the YAML file
  let lessonMetadata;
  try {
    const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
    lessonMetadata = yaml.load(yamlContent) as { lessons: any[] };
    console.log(`Loaded metadata for ${lessonMetadata.lessons.length} lessons`);
  } catch (error) {
    console.error('Error loading lesson metadata:', error);
    throw error;
  }

  // Connect to the database
  const dbUri =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';

  // Debug database connection
  console.log(`Database connection string: ${dbUri}`);
  process.stdout.write(`Database connection string: ${dbUri}\n`);
  const pool = new Pool({
    connectionString: dbUri,
  });

  console.log(`Connecting to database: ${dbUri}`);

  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected to database');
    client.release();

    // Create a map of lesson slugs to bunny video IDs
    const lessonMap = new Map<string, string>();
    let updateCount = 0;

    lessonMetadata.lessons.forEach((lesson) => {
      const slug = lesson.slug;
      const videoId = lesson.bunnyVideo?.id || null;

      if (videoId && videoId.trim() !== '') {
        lessonMap.set(slug, videoId);
        console.log(`Lesson "${slug}" has video ID: ${videoId}`);
      }
    });

    console.log(`Found ${lessonMap.size} lessons with bunny video IDs in YAML`);

    // Update each lesson in the database
    for (const [slug, videoId] of lessonMap.entries()) {
      const result = await pool.query(
        'UPDATE payload.course_lessons SET bunny_video_id = $1 WHERE slug = $2 RETURNING id, title',
        [videoId, slug],
      );

      if (result.rowCount > 0) {
        updateCount++;
        console.log(
          `✅ Updated bunny_video_id for lesson "${slug}" (${result.rows[0].title})`,
        );
      } else {
        console.log(`❌ No lesson found with slug "${slug}"`);
      }
    }

    console.log(
      `\nSummary: Updated bunny_video_id for ${updateCount} lessons out of ${lessonMap.size} found in YAML`,
    );

    // Verify the updates
    const verifyResult = await pool.query(
      'SELECT COUNT(*) FROM payload.course_lessons WHERE bunny_video_id IS NOT NULL',
    );
    console.log(
      `There are now ${verifyResult.rows[0].count} lessons with bunny_video_id values in the database`,
    );

    return true;
  } catch (error) {
    console.error('Error fixing bunny video IDs:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Execute the main function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  fixBunnyVideoIds()
    .then((success) => {
      if (success) {
        console.log('Successfully fixed bunny video IDs');
        process.exit(0);
      } else {
        console.error('Failed to fix bunny video IDs');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Error during execution:', error);
      process.exit(1);
    });
}

export { fixBunnyVideoIds };
