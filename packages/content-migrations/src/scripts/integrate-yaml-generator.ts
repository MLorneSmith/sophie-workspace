/**
 * Script to integrate the YAML-based lesson SQL generation into the migration process
 * This script creates an NPM script to run the updated SQL generator
 */
import fs from 'fs';
import path from 'path';

// Define paths
const PACKAGE_JSON_PATH = path.resolve(__dirname, '../../../package.json');

/**
 * Add NPM scripts to run the YAML-based generator
 */
async function integrateYamlGenerator(): Promise<void> {
  console.log(
    'Integrating YAML-based lesson generator into the migration process...',
  );

  // Read the package.json file
  let packageJson;
  try {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    console.error('Error reading package.json:', error);
    throw error;
  }

  // Add or update the scripts
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Add the script to run the updated SQL generator
  packageJson.scripts['generate:updated-sql'] =
    'tsx src/scripts/sql/updated-generate-sql-seed-files.ts';

  // Add a test script
  packageJson.scripts['test:yaml-generator'] =
    'tsx src/scripts/test-yaml-lesson-generation.ts';

  // Write the updated package.json file
  try {
    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(packageJson, null, 2) + '\n',
    );
    console.log('Successfully updated package.json with new scripts.');
  } catch (error) {
    console.error('Error writing package.json:', error);
    throw error;
  }

  // Create a README file with instructions
  const README_PATH = path.resolve(
    __dirname,
    '../../../README-YAML-GENERATOR.md',
  );
  const readmeContent = `# YAML-Based Lesson SQL Generator

## Overview

This feature introduces a YAML-based approach to lesson content field population. Instead of extracting fields directly from .mdoc files, we now use a centralized YAML file as the single source of truth for lesson metadata.

## Key Benefits

1. Centralized management of all lesson metadata
2. Consistent field population
3. Easier maintenance and updates
4. Clear structure for todo fields and other metadata

## How to Use

### Creating/Updating the YAML Metadata File

Run the following command to create or update the lesson metadata YAML file:

\`\`\`bash
pnpm --filter @kit/content-migrations tsx src/scripts/create-full-lesson-metadata.ts
\`\`\`

This will generate a file at \`packages/content-migrations/src/data/raw/lesson-metadata.yaml\` containing all lesson metadata.

### Testing the YAML Generator

To test the YAML-based generator without affecting the actual migration process:

\`\`\`bash
pnpm --filter @kit/content-migrations run test:yaml-generator
\`\`\`

This will generate SQL in a \`test-output\` directory.

### Running the Updated SQL Generator

To generate SQL files using the YAML-based approach:

\`\`\`bash
pnpm --filter @kit/content-migrations run generate:updated-sql
\`\`\`

### Modifying reset-and-migrate.ps1

To fully integrate the YAML-based generator into the migration process, you can modify the \`reset-and-migrate.ps1\` script to use the updated SQL generator instead of the original one.

Look for the step that generates SQL seed files and replace it with a call to our updated generator:

\`\`\`powershell
# Replace this
Exec-Command -command "pnpm --filter @kit/content-migrations run generate:sql" -description "Generating SQL seed files"

# With this
Exec-Command -command "pnpm --filter @kit/content-migrations run generate:updated-sql" -description "Generating SQL seed files using YAML metadata"
\`\`\`

## Structure of the YAML File

The YAML file has the following structure:

\`\`\`yaml
lessons:
  - slug: lesson-slug
    title: "Lesson Title"
    lessonNumber: 123
    lessonLength: 30
    description: "Lesson description"
    todoFields:
      completeQuiz: true
      watchContent: "Watch the video on XYZ concepts"
      readContent: "Read pages 45-50 of the course material"
      courseProject: "Create a sample presentation implementing the principles from this lesson"
    bunnyVideo:
      id: "abcdef123456"
      library: "264486"
    downloads:
      - download-key-1
      - download-key-2
    quiz: quiz-slug
\`\`\`

## Maintaining the YAML File

When adding new lessons or updating existing ones, you should:

1. Run the \`create-full-lesson-metadata.ts\` script to get the latest state
2. Edit the YAML file to add or update fields as needed
3. Run the migration process to apply the changes
`;

  try {
    fs.writeFileSync(README_PATH, readmeContent);
    console.log('Created README file with instructions at:', README_PATH);
  } catch (error) {
    console.error('Error writing README file:', error);
    throw error;
  }

  console.log('Integration complete!');
  console.log('');
  console.log('Next steps:');
  console.log(
    '1. Run the test script: pnpm --filter @kit/content-migrations run test:yaml-generator',
  );
  console.log(
    '2. Run the updated SQL generator: pnpm --filter @kit/content-migrations run generate:updated-sql',
  );
  console.log(
    '3. Check the README-YAML-GENERATOR.md file for more information.',
  );
}

// Execute the integration function
integrateYamlGenerator().catch((error) => {
  console.error('Integration failed:', error);
  process.exit(1);
});
