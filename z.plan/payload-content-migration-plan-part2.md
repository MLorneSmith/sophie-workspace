# Payload CMS Content Migration Plan - Part 2

This document continues the content migration plan from `payload-content-migration-plan.md`.

## Completing the migrate-all.ts Script

The `migrate-all.ts` script should be updated to include all the new migration scripts:

```typescript
/**
 * Script to run all content migration scripts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Runs all content migration scripts
 */
async function runAllMigrations() {
  console.log('Starting all content migrations...');

  try {
    // Import and run the docs migration
    console.log('Running documentation migration...');
    await import('./migrate-docs.js');

    // Import and run the docs content update
    console.log('Running documentation content update...');
    await import('./update-docs-content.js');

    // Import and run the course lessons migration
    console.log('Running course lessons migration...');
    await import('./migrate-course-lessons.js');

    // Import and run the course quizzes migration
    console.log('Running course quizzes migration...');
    await import('./migrate-course-quizzes.js');

    // Import and run the quiz questions migration
    console.log('Running quiz questions migration...');
    await import('./migrate-quiz-questions.js');

    // Import and run the blog posts migration
    console.log('Running blog posts migration...');
    await import('./migrate-posts.js');

    // Import and run the payload documentation migration
    console.log('Running payload documentation migration...');
    await import('./migrate-payload-docs.js');

    // Import and run the payload quizzes migration
    console.log('Running payload quizzes migration...');
    await import('./migrate-payload-quizzes.js');

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations().catch((error) => {
  console.error('Migration process failed:', error);
  process.exit(1);
});
```

## Package.json Updates

Update the `packages/content-migrations/package.json` file to include scripts for running the new migration scripts:

```json
{
  "name": "@kit/content-migrations",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test:env": "tsx src/scripts/test-env.ts",
    "migrate:all": "tsx src/scripts/migrate-all.ts",
    "migrate:docs": "tsx src/scripts/migrate-docs.ts",
    "update:docs": "tsx src/scripts/update-docs-content.ts",
    "migrate:course-lessons": "tsx src/scripts/migrate-course-lessons.ts",
    "migrate:course-quizzes": "tsx src/scripts/migrate-course-quizzes.ts",
    "migrate:quiz-questions": "tsx src/scripts/migrate-quiz-questions.ts",
    "migrate:posts": "tsx src/scripts/migrate-posts.ts",
    "migrate:payload-docs": "tsx src/scripts/migrate-payload-docs.ts",
    "migrate:payload-quizzes": "tsx src/scripts/migrate-payload-quizzes.ts"
  },
  "dependencies": {
    "@payloadcms/richtext-lexical": "^0.5.0",
    "dotenv": "^16.3.1",
    "gray-matter": "^4.0.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/uuid": "^9.0.7",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

## Execution Sequence

The migration scripts should be executed in a specific order to ensure that dependencies between content types are respected. Here's the recommended execution sequence:

1. **Documentation Migration**:

   ```bash
   pnpm --filter @kit/content-migrations migrate:docs
   pnpm --filter @kit/content-migrations update:docs
   pnpm --filter @kit/content-migrations migrate:payload-docs
   ```

2. **Course Content Migration**:

   ```bash
   pnpm --filter @kit/content-migrations migrate:course-lessons
   pnpm --filter @kit/content-migrations migrate:course-quizzes
   pnpm --filter @kit/content-migrations migrate:quiz-questions
   pnpm --filter @kit/content-migrations migrate:payload-quizzes
   ```

3. **Blog Posts Migration**:

   ```bash
   pnpm --filter @kit/content-migrations migrate:posts
   ```

4. **All Migrations**:
   ```bash
   pnpm --filter @kit/content-migrations migrate:all
   ```

## Error Handling and Validation

Each migration script includes error handling to ensure that the migration process is robust and can recover from failures. Here are the key error handling strategies:

1. **Try-Catch Blocks**: Each file processing operation is wrapped in a try-catch block to handle errors at the file level.

2. **Dependency Checks**: Scripts that depend on the output of other scripts (e.g., `migrate-quiz-questions.ts` depends on `migrate-course-quizzes.ts`) check for the existence of required files or data before proceeding.

3. **Duplicate Checking**: Scripts that might encounter duplicate content (e.g., `migrate-payload-quizzes.ts`) check for existing records before creating new ones.

4. **Logging**: Comprehensive logging is implemented to track the progress of migrations and identify any issues.

5. **Exit Codes**: Scripts exit with non-zero exit codes when errors occur, allowing for proper error handling in CI/CD pipelines.

## Data Validation

To ensure data integrity during the migration process, the following validation steps are implemented:

1. **Schema Validation**: The Payload CMS API performs schema validation on all data being inserted.

2. **Required Fields**: Scripts ensure that required fields are provided, with fallbacks for optional fields.

3. **Relationship Integrity**: Two-pass migration for content with parent-child relationships (e.g., documentation) ensures that relationships are properly established.

4. **Content Format**: Markdown content is properly converted to Lexical format using the Payload CMS utilities.

## Testing Approach

### 1. Environment Setup Testing

Before running migrations, test the environment setup:

```bash
pnpm --filter @kit/content-migrations test:env
```

This script verifies that all required environment variables are properly loaded and that the Payload CMS server is accessible.

### 2. Incremental Testing

Test each migration script individually before running the full migration:

1. Start with a small subset of content to verify the script works as expected.
2. Check the results in the Payload CMS admin UI.
3. Verify that relationships between content types are correctly established.
4. Test the content retrieval from the web application.

### 3. Integration Testing

After running all migrations, perform integration testing to ensure that the migrated content is properly accessible from the web application:

1. Test the documentation pages.
2. Test the course lessons and quizzes.
3. Test the blog posts.

### 4. Rollback Strategy

In case of issues, implement a rollback strategy:

1. Create a backup of the database before running migrations.
2. Implement a script to clean up migrated content if needed.
3. Use database transactions where possible to ensure atomicity.

## Next Steps

1. **Create Data Directory**: Create a `data` directory in `packages/content-migrations/src` to store temporary data during migrations.

2. **Environment Variables**: Set up the required environment variables in `.env.development` and `.env.production` files:

   ```
   DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
   PAYLOAD_SECRET=your-secret-key
   PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
   PAYLOAD_ADMIN_EMAIL=admin@example.com
   PAYLOAD_ADMIN_PASSWORD=your-admin-password
   ```

3. **Implement Scripts**: Implement the migration scripts as outlined in this plan.

4. **Test Scripts**: Test each script individually with a small subset of content.

5. **Run Full Migration**: Run the full migration process in the development environment.

6. **Verify Results**: Verify that all content has been properly migrated by checking the Payload CMS admin UI and the web application.

7. **Deploy to Production**: Once verified in development, deploy the migration scripts to production and run the migration process.

## Conclusion

This content migration plan provides a comprehensive approach to migrating content from various sources to Payload CMS collections. By following this plan, we can ensure a smooth transition to the new CMS while maintaining data integrity and minimizing disruption to the application.
