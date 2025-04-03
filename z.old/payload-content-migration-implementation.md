# Payload CMS Content Migration Implementation

## Overview

This document outlines the implementation of a solution to address the content migration issues in our Payload CMS integration. We identified that several collections (Documentation, Posts, Surveys, Survey Questions) had no content, and Quiz Questions had only one entry despite having 20 quizzes. The solution leverages a SQL-first approach integrated with Payload migrations to ensure reliable, maintainable, and consistent content population.

## Problem Analysis

### Initial State

- **Empty Tables**: Documentation, Posts, Surveys, Survey Questions
- **Incomplete Tables**: Quiz Questions (only 1 entry despite 20 quizzes)
- **Inconsistent Migration Approaches**: Mix of direct TypeScript scripts, SQL seed files, and Payload migrations

### Root Causes

1. **Disconnected Migration Process**: The reset-and-migrate.ps1 script was not properly executing the content migration scripts
2. **Missing SQL Seed Files**: Some content types did not have corresponding SQL seed files
3. **Data Type Mismatch**: The questionspin column in the survey_questions table was defined as an integer, but the migration script was trying to insert text values

## Solution Implemented

### 1. Created SQL Seed Files for Missing Content Types

- **03-quizzes.sql**: Populates the course_quizzes table with 20 quizzes from the .mdoc files in apps/payload/data/courses/quizzes
- **05-surveys.sql**: Populates the surveys table with the self-assessment survey from apps/payload/data/surveys/self-assessment.yaml
- **06-survey-questions.sql**: Populates the survey_questions table with 10 questions from the self-assessment survey
- **07-documentation.sql**: Populates the documentation table with 9 entries from apps/payload/data/documentation
- **08-posts.sql**: Populates the posts table with 9 blog posts from apps/web/content/posts
- **09-fix-quiz-questions.sql**: Creates quiz questions for each quiz (60 total)

### 2. Created Payload Migration to Execute SQL Seed Files

Created a new migration file `20250403_200000_process_content.ts` that:

- Executes the SQL seed files in the correct order
- Verifies that content was properly populated
- Reports any issues

```typescript
// 20250403_200000_process_content.ts
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running content processing migration');

  try {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Define the path to the SQL seed files
    const seedDir = path.resolve(__dirname, '../seed/sql');

    // Define the SQL seed files in the order they should be executed
    const seedFiles = [
      '03-quizzes.sql',
      '05-surveys.sql',
      '06-survey-questions.sql',
      '07-documentation.sql',
      '08-posts.sql',
      '09-fix-quiz-questions.sql',
    ];

    // Execute each SQL file
    for (const file of seedFiles) {
      const filePath = path.join(seedDir, file);

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`SQL seed file not found: ${file}. Skipping.`);
        continue;
      }

      console.log(`Executing SQL seed file: ${file}`);

      // Read the SQL file
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute the SQL
      await db.execute(sql.raw(sqlContent));

      console.log(`Successfully executed SQL seed file: ${file}`);
    }

    // Verify content was added
    await verifyContent(db);

    console.log('Content processing migration completed successfully');
  } catch (error) {
    console.error('Error in content processing migration:', error);
    throw error;
  }
}

// Verification function and down migration implementation...
```

### 3. Fixed Data Type Issue

Updated the survey_questions SQL seed file to use integer values for the questionspin column instead of text values:

```sql
-- Create questions for the survey
PERFORM create_survey_question(
  survey_id,
  'While presenting, no one has trouble following my thought process',
  'structure',
  0, -- 0 = Positive
  0,
  standard_options
);

PERFORM create_survey_question(
  survey_id,
  'I always feel anxious and nervous before giving a presentation',
  'self-confidence',
  1, -- 1 = Negative
  4,
  standard_options
);
```

### 4. Updated Migration Index

Added the new migration to the migration index:

```typescript
// apps/payload/src/migrations/index.ts
import * as migration_20250403_200000_process_content from './20250403_200000_process_content';

export const migrations = [
  // Existing migrations...

  // Add new content processing migration
  {
    up: migration_20250403_200000_process_content.up,
    down: migration_20250403_200000_process_content.down,
    name: '20250403_200000_process_content',
  },
];
```

### 5. Updated Reset Script

Modified reset-and-migrate.ps1 to rely on Payload migrations for content seeding:

```powershell
# In reset-and-migrate.ps1
# After running Payload migrations
Log-Message "STEP 3: Running content migrations via Payload migrations..." "Cyan"
try {
    # Use Push-Location/Pop-Location instead of cd to maintain path context
    Push-Location -Path "apps/payload"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"

    # Run all migrations (including content migrations)
    Log-Message "  Running all Payload migrations..." "Yellow"
    Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

    # Verify migrations were applied
    Log-Message "  Verifying migrations..." "Yellow"
    $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput

    Pop-Location
    Log-Message "Returned to directory: $(Get-Location)" "Gray"

    # Run verification scripts
    Push-Location -Path "packages/content-migrations"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"

    Log-Message "  Verifying database state..." "Yellow"
    $verificationResult = Exec-Command -command "pnpm run verify:all" -description "Verifying database relationships" -captureOutput

    # Check if verification found any issues
    if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
        Log-Message "WARNING: Verification found issues, running edge case repairs..." "Yellow"

        Log-Message "  Running edge case repairs..." "Yellow"
        Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs"

        Log-Message "  Final verification..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run verify:all" -description "Final verification" -captureOutput

        if ($finalVerification -match "Warning" -or $finalVerification -match "Error") {
            Log-Message "WARNING: Some issues could not be fixed automatically" "Yellow"
            $overallSuccess = $false
        }
        else {
            Log-Message "  All issues have been fixed" "Green"
        }
    }
    else {
        Log-Message "  No issues found, skipping repairs" "Green"
    }

    Pop-Location
    Log-Message "Returned to directory: $(Get-Location)" "Gray"
}
catch {
    Log-Message "ERROR: Failed to run content migrations: $_" "Red"
    $overallSuccess = $false
    throw "Content migration failed"
}
```

## Results

The solution has been tested and works correctly. All tables now have content:

- Documentation: 9 entries
- Posts: 9 entries
- Surveys: 1 entry
- Survey questions: 10 entries
- Quiz questions: 60 entries

## Benefits of This Approach

1. **Simplicity**: SQL is more declarative and easier to understand
2. **Reliability**: SQL transactions ensure atomicity
3. **Maintainability**: Reduced dependency on complex TypeScript code
4. **Consistency**: Standardized approach for all content types
5. **Verifiability**: Easier to verify and validate the migration process
6. **Integration**: Integrated with Payload's migration system

## Future Recommendations

1. **Continue Using SQL-First Approach**: For future content migrations, continue using the SQL-first approach with Payload migrations
2. **Document Schema Changes**: Keep track of schema changes in the migration files
3. **Verify Content After Migration**: Always verify that content was properly populated after migration
4. **Use Transactions**: Always use transactions to ensure atomicity
5. **Handle Data Type Conversions**: Be careful with data type conversions, especially when dealing with enums or select fields

## Conclusion

This implementation successfully addresses the content migration issues in our Payload CMS integration. By leveraging a SQL-first approach integrated with Payload migrations, we've created a reliable, maintainable, and consistent content population process. The solution is now complete and ready for use. The reset-and-migrate.ps1 script can be run to reset the database and populate all content correctly.
