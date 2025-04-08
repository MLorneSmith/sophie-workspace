# Content Migration Fix Implementation Plan

## Problem Analysis

The content migration process is failing with the following error:

```
Error in content processing migration: error: insert or update on table "quiz_questions" violates foreign key constraint "quiz_questions_quiz_id_fkey"
Key (quiz_id)=(c11dbb26-7561-4d12-88c8-141c653a43fd) is not present in table "course_quizzes".
```

This error indicates a mismatch between quiz IDs referenced in the quiz questions and the quiz IDs that exist in the course_quizzes table. Specifically, a quiz question is trying to reference a quiz with ID `c11dbb26-7561-4d12-88c8-141c653a43fd`, but this quiz doesn't exist in the `course_quizzes` table.

## Root Cause Identification

After analyzing the code and error logs, we've identified two main issues:

1. **Quiz ID Consistency Issue**: There's a mismatch between the quiz IDs used in different parts of the system:

   - The quiz ID `c11dbb26-7561-4d12-88c8-141c653a43fd` is being referenced in the questions SQL (04-questions.sql) but wasn't properly included in the quizzes SQL (03-quizzes.sql).
   - The `generateQuizMap` function in `generate-sql-seed-files-fixed.ts` is not consistently using the IDs from `knownQuizIds` for all quizzes.
   - There's no cross-file verification to ensure that quiz IDs in questions match those in quizzes.

2. **SQL Generator Complexity**: The `generate-sql-seed-files-fixed.ts` file has grown to over 1000 lines of code, making it difficult to maintain and understand. The refactoring plan outlined in `sql-generator-refactoring-plan.md` has not been fully implemented.

## Implementation Plan

### Phase 1: Fix Quiz ID Consistency Issues

1. **Enhance the `generateQuizMap` Function**:

   ```typescript
   function generateQuizMap(quizzesDir: string): Map<string, string> {
     const quizMap = new Map<string, string>();

     // Get all .mdoc files in the quizzes directory
     const quizFiles = fs
       .readdirSync(quizzesDir)
       .filter((file) => file.endsWith('.mdoc'));

     console.log(`Found ${quizFiles.length} quiz files to process.`);

     // Generate a UUID for each quiz, using known IDs when available
     for (const file of quizFiles) {
       const slug = path.basename(file, '.mdoc');

       // Check if we have a known ID for this quiz
       if (knownQuizIds[slug]) {
         const quizId = knownQuizIds[slug];
         quizMap.set(slug, quizId);
         console.log(`Using known ID ${quizId} for quiz ${slug}`);
       } else {
         // Generate a new UUID if we don't have a known ID
         const quizId = uuidv4();
         quizMap.set(slug, quizId);
         console.log(
           `Generated new ID ${quizId} for quiz ${slug} (no known ID found)`,
         );
       }
     }

     // Validate that all quiz IDs in the map match those in knownQuizIds
     for (const [slug, id] of quizMap.entries()) {
       if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
         console.error(
           `Error: ID mismatch for quiz ${slug}. Map has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
         );
         // Fix the mismatch by using the known ID
         quizMap.set(slug, knownQuizIds[slug]);
         console.log(`Fixed ID for quiz ${slug} to ${knownQuizIds[slug]}`);
       }
     }

     return quizMap;
   }
   ```

2. **Implement Cross-File Verification**:

   ```typescript
   function verifyCrossFileQuizIds(
     quizzesSql: string,
     questionsSql: string,
   ): boolean {
     // Extract quiz IDs from quizzes SQL
     const quizIdRegex =
       /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?/g;
     const quizIds = new Set<string>();
     let match;

     while ((match = quizIdRegex.exec(quizzesSql)) !== null) {
       const id = match[1];
       quizIds.add(id);
     }

     // Extract quiz IDs from questions SQL
     const questionQuizIdRegex = /quiz_id = '([^']+)'/g;
     const questionQuizIds = new Set<string>();

     while ((match = questionQuizIdRegex.exec(questionsSql)) !== null) {
       const id = match[1];
       questionQuizIds.add(id);
     }

     // Check if all question quiz IDs exist in quizzes
     let allExist = true;
     for (const id of questionQuizIds) {
       if (!quizIds.has(id)) {
         console.error(
           `Error: Quiz ID ${id} referenced in questions does not exist in quizzes`,
         );
         allExist = false;
       }
     }

     return allExist;
   }
   ```

3. **Create a Repair Script**:

   ```typescript
   async function repairQuizIds(): Promise<boolean> {
     console.log('Repairing quiz ID inconsistencies...');

     try {
       // Read the SQL files
       const quizzesSqlPath = path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql');
       const questionsSqlPath = path.join(
         PAYLOAD_SQL_SEED_DIR,
         '04-questions.sql',
       );

       if (!fs.existsSync(quizzesSqlPath)) {
         console.error(
           `Error: Quizzes SQL file not found at ${quizzesSqlPath}`,
         );
         return false;
       }

       if (!fs.existsSync(questionsSqlPath)) {
         console.error(
           `Error: Questions SQL file not found at ${questionsSqlPath}`,
         );
         return false;
       }

       // Read the SQL files
       const quizzesSql = fs.readFileSync(quizzesSqlPath, 'utf8');
       const questionsSql = fs.readFileSync(questionsSqlPath, 'utf8');

       // Extract quiz and question details
       const quizIds = new Set<string>();
       let match;
       const quizIdRegex =
         /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?/g;

       while ((match = quizIdRegex.exec(quizzesSql)) !== null) {
         const id = match[1];
         quizIds.add(id);
       }

       // Extract quiz IDs from questions SQL
       const questionQuizIdRegex = /quiz_id = '([^']+)'/g;
       const missingQuizIds = new Set<string>();

       while ((match = questionQuizIdRegex.exec(questionsSql)) !== null) {
         const id = match[1];
         if (!quizIds.has(id)) {
           missingQuizIds.add(id);
         }
       }

       if (missingQuizIds.size === 0) {
         console.log('No quiz ID inconsistencies found. Nothing to repair.');
         return true;
       }

       console.log(
         `Found ${missingQuizIds.size} quiz IDs in questions that don't exist in quizzes:`,
       );
       for (const id of missingQuizIds) {
         console.log(`  - ${id}`);
       }

       // Create a backup of the questions SQL file
       const backupPath = `${questionsSqlPath}.bak`;
       fs.copyFileSync(questionsSqlPath, backupPath);
       console.log(`Created backup of questions SQL file at ${backupPath}`);

       // Get a replacement quiz ID (use the first quiz ID in the quizzes SQL)
       const replacementId = Array.from(quizIds)[0];
       if (!replacementId) {
         console.error('Error: No replacement quiz ID found. Cannot repair.');
         return false;
       }

       console.log(`Using replacement quiz ID ${replacementId}`);

       // Update the questions SQL file
       let updatedQuestionsSql = questionsSql;

       for (const missingId of missingQuizIds) {
         console.log(`Replacing quiz ID ${missingId} with ${replacementId}`);

         // Replace all occurrences of the missing ID with the replacement ID
         const regex = new RegExp(`quiz_id = '${missingId}'`, 'g');
         updatedQuestionsSql = updatedQuestionsSql.replace(
           regex,
           `quiz_id = '${replacementId}'`,
         );

         // Also replace quiz_id_id (duplicate field for compatibility)
         const regex2 = new RegExp(`quiz_id_id = '${missingId}'`, 'g');
         updatedQuestionsSql = updatedQuestionsSql.replace(
           regex2,
           `quiz_id_id = '${replacementId}'`,
         );

         // Also replace in relationship entries
         const regex3 = new RegExp(`value = '${missingId}'`, 'g');
         updatedQuestionsSql = updatedQuestionsSql.replace(
           regex3,
           `value = '${replacementId}'`,
         );
       }

       // Write the updated questions SQL file
       fs.writeFileSync(questionsSqlPath, updatedQuestionsSql);
       console.log(`Updated questions SQL file at ${questionsSqlPath}`);

       console.log('Quiz ID repair completed successfully!');
       return true;
     } catch (error) {
       console.error('Error repairing quiz IDs:', error);
       return false;
     }
   }
   ```

4. **Update the `generateSqlSeedFiles` Function**:
   ```typescript
   async function generateSqlSeedFiles() {
     console.log('Starting SQL seed files generation...');

     try {
       // ... existing code ...

       // Generate quizzes SQL
       console.log('Generating quizzes SQL...');
       const quizzesSql = generateQuizzesSql(RAW_QUIZZES_DIR, quizMap);

       // Verify that the quiz IDs in the generated SQL match those in knownQuizIds
       console.log('Verifying quiz IDs...');
       if (!verifyQuizIds(quizzesSql)) {
         throw new Error(
           'Quiz ID verification failed. Please check the logs for details.',
         );
       }

       fs.writeFileSync(
         path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql'),
         quizzesSql,
       );

       // Generate questions SQL
       console.log('Generating questions SQL...');
       const questionsSql = generateQuestionsSql(RAW_QUIZZES_DIR, quizMap);

       // Verify cross-file quiz ID consistency
       console.log('Verifying cross-file quiz ID consistency...');
       if (!verifyCrossFileQuizIds(quizzesSql, questionsSql)) {
         throw new Error(
           'Cross-file quiz ID verification failed. Please check the logs for details.',
         );
       }

       fs.writeFileSync(
         path.join(PAYLOAD_SQL_SEED_DIR, '04-questions.sql'),
         questionsSql,
       );

       // ... rest of the function ...
     } catch (error) {
       console.error('Error generating SQL seed files:', error);
       throw error;
     }
   }
   ```

### Phase 2: Implement SQL Generator Refactoring

1. **Create Directory Structure**:

   ```
   packages/content-migrations/src/
   ├── scripts/
   │   ├── sql/
   │   │   ├── generate-sql-seed-files.ts         # Main orchestration function
   │   │   ├── generators/                        # New directory for SQL generators
   │   │   │   ├── generate-courses-sql.ts        # Course SQL generation
   │   │   │   ├── generate-lessons-sql.ts        # Lesson SQL generation
   │   │   │   ├── generate-media-sql.ts          # Media SQL generation
   │   │   │   ├── generate-quizzes-sql.ts        # Quiz SQL generation
   │   │   │   ├── generate-questions-sql.ts      # Question SQL generation
   │   │   │   ├── generate-surveys-sql.ts        # Survey SQL generation
   │   │   │   └── generate-survey-questions-sql.ts # Survey question SQL generation
   │   ├── utils/
   │   │   ├── lexical-converter.ts               # Markdown to Lexical conversion
   │   │   ├── quiz-map-generator.ts              # Quiz map generation
   │   │   └── mime-type-helper.ts                # MIME type determination
   │   └── verification/
   │       ├── verify-quiz-ids.ts                 # Quiz ID verification
   │       └── verify-cross-file-quiz-ids.ts      # Cross-file verification
   ```

2. **Extract Utility Functions**:

   - Create `utils/lexical-converter.ts` for the Markdown to Lexical conversion
   - Create `utils/quiz-map-generator.ts` for quiz map generation
   - Create `utils/mime-type-helper.ts` for MIME type determination

3. **Extract SQL Generation Functions**:

   - Create individual files for each SQL generation function in the `sql/generators` directory
   - Each file should export a single main function

4. **Create the Main Orchestration Function**:

   - Create `sql/generate-sql-seed-files.ts` that imports and uses all the extracted functions
   - Ensure it maintains the same functionality as the original file

5. **Extract Verification Functions**:
   - Create `verification/verify-quiz-ids.ts` for quiz ID verification
   - Create `verification/verify-cross-file-quiz-ids.ts` for cross-file verification

### Phase 3: Update the Migration Process

1. **Update the `reset-and-migrate.ps1` Script**:
   - Add a step to run the enhanced verification script before migration
   - Add a step to run the repair script if inconsistencies are detected

```powershell
# Verify quiz ID consistency
Log-Message "  Verifying quiz ID consistency..." "Yellow"
$quizIdVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:quiz-ids" -description "Verifying quiz ID consistency" -captureOutput

if ($quizIdVerification -match "Some quiz IDs referenced in lessons do not exist in quizzes" -or $quizIdVerification -match "Some quiz IDs referenced in questions do not exist in quizzes") {
    Log-Message "WARNING: Quiz ID inconsistencies detected. Attempting to repair..." "Yellow"

    # Run the repair script
    Exec-Command -command "pnpm --filter @kit/content-migrations run repair:quiz-ids" -description "Repairing quiz ID inconsistencies"

    # Verify again after repair
    $quizIdVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:quiz-ids" -description "Verifying quiz ID consistency after repair" -captureOutput

    if ($quizIdVerification -match "Some quiz IDs referenced in lessons do not exist in quizzes" -or $quizIdVerification -match "Some quiz IDs referenced in questions do not exist in quizzes") {
        Log-Message "ERROR: Quiz ID inconsistencies could not be automatically repaired." "Red"

        # Ask if the user wants to continue
        $continue = $false
        if ($env:CI) {
            $continue = $true
        } elseif (-not $env:CI) {
            # Only ask in interactive mode
            $response = Read-Host "Quiz ID inconsistencies could not be automatically repaired. Do you want to continue anyway? (y/N)"
            if ($response -eq "y" -or $response -eq "Y") {
                $continue = $true
            }
        }

        if (-not $continue) {
            Log-Message "Migration aborted due to quiz ID inconsistencies." "Red"
            throw "Quiz ID inconsistencies detected"
        }
    } else {
        Log-Message "  Quiz ID inconsistencies repaired successfully." "Green"
    }
}
```

2. **Add New Scripts to `package.json`**:
   ```json
   {
     "scripts": {
       "verify:quiz-ids": "ts-node src/scripts/verification/verify-quiz-ids.ts",
       "verify:cross-file-quiz-ids": "ts-node src/scripts/verification/verify-cross-file-quiz-ids.ts",
       "repair:quiz-ids": "ts-node src/scripts/repair/repair-quiz-ids.ts"
     }
   }
   ```

## Implementation Sequence

1. **Phase 1: Fix Quiz ID Consistency Issues**

   - Implement the enhanced `generateQuizMap` function
   - Implement the `verifyCrossFileQuizIds` function
   - Create the `repairQuizIds` script
   - Update the `generateSqlSeedFiles` function

2. **Phase 2: Implement SQL Generator Refactoring**

   - Create the directory structure
   - Extract utility functions
   - Extract SQL generation functions
   - Create the main orchestration function
   - Extract verification functions

3. **Phase 3: Update the Migration Process**
   - Update the `reset-and-migrate.ps1` script
   - Add new scripts to `package.json`

## Success Criteria

1. The migration process completes successfully without any quiz ID inconsistency errors
2. All quiz questions are properly linked to their corresponding quizzes
3. The verification script confirms that all quiz IDs are consistent across the system
4. The repair mechanism successfully fixes any inconsistencies that are detected
5. The SQL generator code is more maintainable and easier to understand

## Conclusion

This implementation plan addresses both the immediate quiz ID consistency issues and the longer-term maintainability concerns with the SQL generator code. By implementing these changes, we can ensure that the migration process completes successfully and that the codebase is more maintainable going forward.
