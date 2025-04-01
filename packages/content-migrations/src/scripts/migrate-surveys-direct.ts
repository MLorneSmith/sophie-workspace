/**
 * Script to migrate surveys from YAML files to Payload CMS directly in the PostgreSQL database
 */
import { BlocksFeature } from '@payloadcms/richtext-lexical';
import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

/**
 * Migrates surveys from YAML files directly to the PostgreSQL database
 */
async function migrateSurveysToDatabase() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Path to the surveys files
      const surveysDir = path.resolve(
        __dirname,
        '../../../../apps/payload/data/surveys',
      );
      console.log(`Surveys directory: ${surveysDir}`);

      // Check if the directory exists
      if (!fs.existsSync(surveysDir)) {
        console.log(`Surveys directory does not exist: ${surveysDir}`);
        console.log('Skipping surveys migration.');
        return;
      }

      // Read all .yaml files
      const yamlFiles = fs
        .readdirSync(surveysDir)
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map((file) => path.join(surveysDir, file));

      console.log(`Found ${yamlFiles.length} survey files to migrate.`);

      // Store survey IDs for later use in survey questions migration
      const surveyIdMap = new Map();

      // Migrate each file to the database
      for (const file of yamlFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const data = yaml.load(content) as any;

          // Generate a slug from the file name
          const slug = path.basename(file, path.extname(file));

          // Check if the survey already exists
          const existingResult = await client.query(
            `SELECT id FROM payload.surveys WHERE slug = $1`,
            [slug],
          );

          if (existingResult.rows.length > 0) {
            console.log(`Survey with slug ${slug} already exists. Skipping.`);
            surveyIdMap.set(slug, existingResult.rows[0].id);
            continue;
          }

          // Create a new survey
          const surveyId = uuidv4();
          await client.query(
            `INSERT INTO payload.surveys (
              id, 
              title, 
              slug, 
              description, 
              status, 
              show_progress_bar,
              updated_at, 
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [
              surveyId,
              data.title || slug,
              slug,
              data.description || '',
              data.status || 'draft',
              data.showProgressBar !== undefined ? data.showProgressBar : true,
            ],
          );

          // Store the survey ID for later use
          surveyIdMap.set(slug, surveyId);

          console.log(`Migrated survey: ${slug} with ID: ${surveyId}`);
        } catch (error) {
          console.error(`Error migrating ${file}:`, error);
        }
      }

      // Save the survey ID map to a file for use in the survey questions migration
      const dataDir = path.resolve(__dirname, '../data');

      // Ensure the data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        path.resolve(dataDir, 'survey-id-map.json'),
        JSON.stringify(Object.fromEntries(surveyIdMap), null, 2),
      );

      console.log('Surveys migration complete!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error migrating surveys:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateSurveysToDatabase().catch((error) => {
  console.error('Surveys migration failed:', error);
  process.exit(1);
});
