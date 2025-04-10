import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Test script for the lesson enhancements implementation
 * This script:
 * 1. Ensures the required directories exist
 * 2. Runs the analyze-lesson-content script to generate the YAML
 * 3. Runs the generate-lesson-enhancements-sql script to generate the SQL
 */
function testLessonEnhancements() {
  console.log('Testing lesson enhancements implementation...\n');

  // Make sure the required directories exist
  const baseDir = path.resolve(__dirname, '../../');
  const definitionsDir = path.join(baseDir, 'src/data/definitions');
  const processedSqlDir = path.join(baseDir, 'src/data/processed/sql');

  if (!fs.existsSync(definitionsDir)) {
    console.log(`Creating directory: ${definitionsDir}`);
    fs.mkdirSync(definitionsDir, { recursive: true });
  }

  if (!fs.existsSync(processedSqlDir)) {
    console.log(`Creating directory: ${processedSqlDir}`);
    fs.mkdirSync(processedSqlDir, { recursive: true });
  }

  try {
    // Run the analyze-lesson-content script
    console.log('\n1. Running analyze-lesson-content script...');
    try {
      // Try to run with npx to ensure ts-node is available
      execSync('npx ts-node src/scripts/analyze-lesson-content.ts', {
        cwd: baseDir,
        stdio: 'inherit',
      });
    } catch (error) {
      console.log(
        'Failed to run with npx ts-node, trying node with compiled JavaScript...',
      );
      // Compile TypeScript first
      execSync(
        'npx tsc src/scripts/analyze-lesson-content.ts --outDir ./dist',
        {
          cwd: baseDir,
          stdio: 'inherit',
        },
      );
      // Then run with node
      execSync('node ./dist/scripts/analyze-lesson-content.js', {
        cwd: baseDir,
        stdio: 'inherit',
      });
    }

    // Verify the YAML file was created
    const yamlPath = path.join(
      definitionsDir,
      'lessons_structured_content.yaml',
    );
    if (fs.existsSync(yamlPath)) {
      console.log(`✅ YAML file created: ${yamlPath}`);
    } else {
      console.error(`❌ YAML file was not created: ${yamlPath}`);
      process.exit(1);
    }

    // Run the generate-lesson-enhancements-sql script
    console.log('\n2. Running generate-lesson-enhancements-sql script...');
    try {
      // Try to run with npx to ensure ts-node is available
      execSync(
        'npx ts-node src/scripts/sql/generate-lesson-enhancements-sql.ts',
        {
          cwd: baseDir,
          stdio: 'inherit',
        },
      );
    } catch (error) {
      console.log(
        'Failed to run with npx ts-node, trying node with compiled JavaScript...',
      );
      // Compile TypeScript first
      execSync(
        'npx tsc src/scripts/sql/generate-lesson-enhancements-sql.ts --outDir ./dist',
        {
          cwd: baseDir,
          stdio: 'inherit',
        },
      );
      // Then run with node
      execSync('node ./dist/scripts/sql/generate-lesson-enhancements-sql.js', {
        cwd: baseDir,
        stdio: 'inherit',
      });
    }

    // Verify the SQL file was created
    const sqlPath = path.join(processedSqlDir, '08-lesson-enhancements.sql');
    if (fs.existsSync(sqlPath)) {
      console.log(`✅ SQL file created: ${sqlPath}`);
    } else {
      console.error(`❌ SQL file was not created: ${sqlPath}`);
      process.exit(1);
    }

    console.log('\n✅ All tests passed!');
    console.log('\nTo complete the implementation:');
    console.log('1. Copy generated SQL file to the correct location:');
    console.log(
      '   - Source: packages/content-migrations/src/data/processed/sql/08-lesson-enhancements.sql',
    );
    console.log(
      '   - Destination: apps/payload/src/seed/sql/08-lesson-enhancements.sql',
    );
    console.log('2. Run the database migration: ./reset-and-migrate.ps1');
    console.log(
      '3. Verify that the data has been imported correctly in the Payload CMS admin',
    );
    console.log('4. Check that the frontend components render correctly');
  } catch (error) {
    console.error('Error running test script:', error);
    process.exit(1);
  }
}

testLessonEnhancements();
