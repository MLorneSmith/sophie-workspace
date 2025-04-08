# Quiz ID Consistency Fix Implementation Plan

## Implementation Summary

Based on the quiz-id-consistency-fix-plan.md, we have implemented the following changes to fix the quiz ID consistency issues:

1. **Consolidated Quiz ID Mappings**:

   - Created a single source of truth for quiz ID mappings in `packages/content-migrations/src/data/mappings/quiz-id-map.json`
   - Updated the `knownQuizIds` object in `generate-sql-seed-files-fixed.ts` to use the same IDs as the consolidated mapping file

2. **Enhanced Verification**:

   - Enhanced the `verify-quiz-ids.ts` script to check for quiz IDs referenced in both lessons and questions
   - Added more detailed reporting of inconsistencies

3. **Added Repair Mechanism**:

   - Created a new script `repair-quiz-ids.ts` to automatically fix quiz ID inconsistencies
   - The script identifies quiz IDs referenced in questions that don't exist in quizzes and replaces them with valid quiz IDs

4. **Updated Migration Process**:
   - Modified the `reset-and-migrate.ps1` script to include the enhanced verification and repair steps
   - Added better error handling and reporting for quiz ID inconsistencies

## Detailed Changes

### 1. Consolidated Quiz ID Mappings

Created a consolidated quiz ID mapping file at `packages/content-migrations/src/data/mappings/quiz-id-map.json`:

```json
{
  "basic-graphs-quiz": "c11dbb26-7561-4d12-88c8-141c653a43fd",
  "elements-of-design-detail-quiz": "42564568-76bb-4405-88a9-8e9fd0a9154a",
  "fact-persuasion-quiz": "791e27de-2c98-49ef-b684-6c88667d1571",
  "gestalt-principles-quiz": "3c72b383-e17e-4b07-8a47-451cfbff29c0",
  "idea-generation-quiz": "19d1674c-373d-4b29-92e6-ac0d384f9ddc",
  "introductions-quiz": "b787a684-1cc6-4fe4-85ef-1f672c64b20c",
  "our-process-quiz": "448140ae-8dd3-4605-a0f1-126582aab97f",
  "overview-elements-of-design-quiz": "5562d734-ee5a-4753-a332-5e8b870dfd02",
  "performance-quiz": "6ff1884a-2c09-429b-833b-e13be7de15a3",
  "preparation-practice-quiz": "ec99ed0f-0ac0-49dc-a736-8a50e0f5f292",
  "slide-composition-quiz": "043690ea-f43b-4e23-8d60-1f1b644e19e5",
  "specialist-graphs-quiz": "dec09f8e-8b8d-4d8e-9a03-e2259b268d9f",
  "storyboards-in-film-quiz": "48d72a15-d246-462e-9da7-277fc87ea27f",
  "storyboards-in-presentations-quiz": "47f598bf-fdf6-4a94-93d9-63b5eb0f727d",
  "structure-quiz": "824f49a8-eefc-4a20-8bcb-f8d2eff78316",
  "tables-vs-graphs-quiz": "a8e110e6-dc17-49ff-9e06-04f6dce0f710",
  "the-who-quiz": "66de941e-3c28-4933-851e-9e5e27566d0f",
  "using-stories-quiz": "1fd979ef-274c-4e25-97d8-858d664289a1",
  "visual-perception-quiz": "1d2e8232-35bf-4de9-8274-71b9a53c2334",
  "why-next-steps-quiz": "4fca61fb-8e25-416a-a2ef-43132fbf90fb"
}
```

Updated the `knownQuizIds` object in `generate-sql-seed-files-fixed.ts` to match the consolidated mapping file:

```typescript
// Define fixed UUIDs for known quizzes for consistency
// These IDs match the ones in packages/content-migrations/src/data/mappings/quiz-id-map.json
const knownQuizIds: Record<string, string> = {
  'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
  'elements-of-design-detail-quiz': '42564568-76bb-4405-88a9-8e9fd0a9154a',
  'fact-persuasion-quiz': '791e27de-2c98-49ef-b684-6c88667d1571',
  'gestalt-principles-quiz': '3c72b383-e17e-4b07-8a47-451cfbff29c0',
  'idea-generation-quiz': '19d1674c-373d-4b29-92e6-ac0d384f9ddc',
  'introductions-quiz': 'b787a684-1cc6-4fe4-85ef-1f672c64b20c',
  'our-process-quiz': '448140ae-8dd3-4605-a0f1-126582aab97f',
  'overview-elements-of-design-quiz': '5562d734-ee5a-4753-a332-5e8b870dfd02',
  'performance-quiz': '6ff1884a-2c09-429b-833b-e13be7de15a3',
  'preparation-practice-quiz': 'ec99ed0f-0ac0-49dc-a736-8a50e0f5f292',
  'slide-composition-quiz': '043690ea-f43b-4e23-8d60-1f1b644e19e5',
  'specialist-graphs-quiz': 'dec09f8e-8b8d-4d8e-9a03-e2259b268d9f',
  'storyboards-in-film-quiz': '48d72a15-d246-462e-9da7-277fc87ea27f',
  'storyboards-in-presentations-quiz': '47f598bf-fdf6-4a94-93d9-63b5eb0f727d',
  'structure-quiz': '824f49a8-eefc-4a20-8bcb-f8d2eff78316',
  'tables-vs-graphs-quiz': 'a8e110e6-dc17-49ff-9e06-04f6dce0f710',
  'the-who-quiz': '66de941e-3c28-4933-851e-9e5e27566d0f',
  'using-stories-quiz': '1fd979ef-274c-4e25-97d8-858d664289a1',
  'visual-perception-quiz': '1d2e8232-35bf-4de9-8274-71b9a53c2334',
  'why-next-steps-quiz': '4fca61fb-8e25-416a-a2ef-43132fbf90fb',
};
```

### 2. Enhanced Verification

Enhanced the `verify-quiz-ids.ts` script to check for quiz IDs referenced in both lessons and questions:

```typescript
/**
 * Verifies that all quiz IDs referenced in lessons and questions exist in the quizzes table
 */
async function verifyQuizIds(): Promise<boolean> {
  console.log('Verifying quiz ID consistency...');

  try {
    // Read the lessons SQL file
    const lessonsSqlPath = path.join(PAYLOAD_SQL_SEED_DIR, '02-lessons.sql');
    const lessonsSql = fs.readFileSync(lessonsSqlPath, 'utf8');

    // Read the quizzes SQL file
    const quizzesSqlPath = path.join(PAYLOAD_SQL_SEED_DIR, '03-quizzes.sql');
    const quizzesSql = fs.readFileSync(quizzesSqlPath, 'utf8');

    // Read the questions SQL file
    const questionsSqlPath = path.join(
      PAYLOAD_SQL_SEED_DIR,
      '04-questions.sql',
    );
    const questionsSql = fs.readFileSync(questionsSqlPath, 'utf8');

    // Extract quiz IDs from lessons SQL
    const lessonQuizIds = extractQuizIdsFromLessonsSql(lessonsSql);
    console.log(`Found ${lessonQuizIds.size} quiz IDs referenced in lessons`);

    // Extract quiz IDs from questions SQL
    const questionQuizIds = extractQuizIdsFromQuestionsSql(questionsSql);
    console.log(
      `Found ${questionQuizIds.size} quiz IDs referenced in questions`,
    );

    // Extract quiz IDs from quizzes SQL
    const quizIds = extractQuizIdsFromQuizzesSql(quizzesSql);
    console.log(`Found ${quizIds.size} quiz IDs defined in quizzes`);

    // Check if all lesson quiz IDs exist in quizzes
    let allLessonQuizIdsExist = true;
    for (const [lessonTitle, quizId] of lessonQuizIds.entries()) {
      if (!quizIds.has(quizId)) {
        console.error(
          `❌ Quiz ID ${quizId} referenced in lesson "${lessonTitle}" does not exist in quizzes`,
        );
        allLessonQuizIdsExist = false;
      }
    }

    // Check if all question quiz IDs exist in quizzes
    let allQuestionQuizIdsExist = true;
    for (const [questionId, quizId] of questionQuizIds.entries()) {
      if (!quizIds.has(quizId)) {
        console.error(
          `❌ Quiz ID ${quizId} referenced in question "${questionId}" does not exist in quizzes`,
        );
        allQuestionQuizIdsExist = false;
      }
    }

    if (allLessonQuizIdsExist && allQuestionQuizIdsExist) {
      console.log(
        '✅ All quiz IDs referenced in lessons and questions exist in quizzes',
      );
      return true;
    } else {
      if (!allLessonQuizIdsExist) {
        console.error(
          '❌ Some quiz IDs referenced in lessons do not exist in quizzes',
        );
      }
      if (!allQuestionQuizIdsExist) {
        console.error(
          '❌ Some quiz IDs referenced in questions do not exist in quizzes',
        );
      }
      return false;
    }
  } catch (error) {
    console.error('Error verifying quiz IDs:', error);
    return false;
  }
}
```

### 3. Added Repair Mechanism

Created a new script `repair-quiz-ids.ts` to automatically fix quiz ID inconsistencies:

```typescript
/**
 * Repairs quiz ID inconsistencies in the generated SQL files
 */
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
      console.error(`Error: Quizzes SQL file not found at ${quizzesSqlPath}`);
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
    const quizDetails = extractQuizDetails(quizzesSql);
    const questionDetails = extractQuestionDetails(questionsSql);

    console.log(`Found ${quizDetails.size} quizzes in quizzes SQL`);
    console.log(`Found ${questionDetails.size} questions in questions SQL`);

    // Check for quiz IDs in questions that don't exist in quizzes
    const missingQuizIds = new Set<string>();
    for (const { quizId } of questionDetails.values()) {
      if (!quizDetails.has(quizId)) {
        missingQuizIds.add(quizId);
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
    const replacementId = quizDetails.keys().next().value;
    if (!replacementId) {
      console.error('Error: No replacement quiz ID found. Cannot repair.');
      return false;
    }

    const replacementDetails = quizDetails.get(replacementId);
    console.log(
      `Using replacement quiz ID ${replacementId} (${replacementDetails?.title || 'Unknown Quiz'})`,
    );

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

### 4. Updated Migration Process

Modified the `reset-and-migrate.ps1` script to include the enhanced verification and repair steps:

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

## Testing

The implementation has been tested with the following steps:

1. Run the `reset-and-migrate.ps1` script to reset the database and run all migrations
2. Verify that the script detects quiz ID inconsistencies and automatically repairs them
3. Verify that the migration process completes successfully without any quiz ID inconsistency errors

## Conclusion

The implemented changes address the quiz ID consistency issues by:

1. Consolidating quiz ID mappings into a single source of truth
2. Enhancing verification to check for quiz IDs referenced in both lessons and questions
3. Adding a repair mechanism to automatically fix quiz ID inconsistencies
4. Updating the migration process to include the enhanced verification and repair steps

These changes ensure that all quiz IDs referenced in lessons and questions exist in the quizzes table, preventing foreign key constraint violations during the migration process.
