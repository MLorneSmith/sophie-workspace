/**
 * Test script for the YAML-based lesson SQL generation
 * This script creates the lesson metadata YAML file and then uses it to generate lesson SQL
 */
import fs from 'fs';
import path from 'path';

import { RAW_LESSONS_DIR } from '../config/paths.js';
import { ensureLessonMetadata } from './process/ensure-lesson-metadata.js';
import { generateLessonsSqlFromYaml } from './sql/generators/yaml-generate-lessons-sql.js';

async function runTest() {
  console.log('--- YAML Lesson SQL Generation Test ---');
  console.log('');

  console.log('Step 1: Ensure lesson metadata YAML file exists');
  const metadataExists = await ensureLessonMetadata();
  if (!metadataExists) {
    console.error('Failed to create or locate lesson metadata YAML file.');
    process.exit(1);
  }
  console.log('');

  console.log('Step 2: Generate SQL using YAML metadata');
  try {
    const lessonsSql = generateLessonsSqlFromYaml(RAW_LESSONS_DIR);

    // Write the output to a test file
    const outputDir = path.resolve(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, 'yaml-lessons.sql');
    fs.writeFileSync(outputFile, lessonsSql);

    console.log(`Successfully generated SQL. Output written to ${outputFile}`);
    console.log('');

    // Print a sample of the SQL to verify it worked
    const sampleLines = lessonsSql.split('\n').slice(0, 20).join('\n');
    console.log('Sample of generated SQL:');
    console.log('-----------------------------------');
    console.log(sampleLines);
    console.log('-----------------------------------');
    console.log('');

    console.log(
      'Success! YAML-based lesson SQL generation is working correctly.',
    );
  } catch (error) {
    console.error('Error generating SQL from YAML metadata:', error);
    process.exit(1);
  }
}

runTest().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
