# Quiz Management Scripts: Further Consolidation Plan

## 1. Overview and Objectives

The goal of this consolidation is to replace multiple individual scripts with comprehensive, well-structured consolidated scripts. This will:

- Reduce the number of script files in the system
- Improve maintainability by centralizing related functionality
- Ensure consistent approach to fixing related issues
- Simplify the orchestration process in `loading.ps1`

## 2. Current State Assessment

The quiz management scripts have already undergone initial reorganization into directories:

```
quiz-management/
├── core/                         # Core functionality
├── lesson-quiz-relationships/    # Lesson-quiz relationship scripts
├── question-relationships/       # Question relationship scripts
├── utilities/                    # Support scripts
└── backup/                       # Deprecated scripts (kept for reference)
```

Two comprehensive scripts have been created but are not yet fully utilized:

- `lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts`
- `question-relationships/fix-question-quiz-relationships-comprehensive.ts`

The orchestration script (`loading.ps1`) still calls individual component scripts rather than these consolidated scripts.

## 3. Script Consolidation Details

### 3.1 Lesson-Quiz Relationships Consolidation

**Target Script**: `lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts`

**Components to Consolidate**:

- `lesson-quiz-relationships/fix-lesson-quiz-field-name.ts`
- `lesson-quiz-relationships/fix-lesson-quiz-references.ts`
- `lesson-quiz-relationships/fix-lessons-quiz-references-sql.ts`

**Implementation Steps**:

1. **Analysis Phase (2 days)**:

   - Perform detailed code analysis of the component scripts
   - Identify unique functionality in each script
   - Map dependencies between scripts
   - Document function signatures and return types

2. **Integration Design (1 day)**:

   - Design a modular structure for the consolidated script
   - Create a sequential execution flow that preserves dependencies
   - Design robust error handling and reporting
   - Create a configuration system to enable/disable specific fixes

3. **Implementation Phase (3 days)**:

   - Implement the consolidated script following the design
   - Preserve all unique functionality from component scripts
   - Add detailed comments explaining the purpose of each section
   - Ensure proper transaction handling for SQL operations
   - Add comprehensive logging

4. **Testing Phase (2 days)**:

   - Create test cases for each component's functionality
   - Test the consolidated script against various scenarios
   - Compare results with the original component scripts
   - Verify no functionality is lost

5. **Integration Phase (1 day)**:
   - Update the `package.json` with new script entry
   - Create a transition plan for switching from component scripts to consolidated script
   - Document the consolidated script's functionality and usage

### 3.2 Question-Quiz Relationships Consolidation

**Target Script**: `question-relationships/fix-question-quiz-relationships-comprehensive.ts`

**Components to Consolidate**:

- `question-relationships/fix-questions-quiz-references.ts`
- `question-relationships/fix-quiz-question-relationships.ts`
- `question-relationships/fix-quizzes-without-questions.ts`

**Implementation Steps**:

Follow the same steps as for the lesson-quiz relationships consolidation:

1. **Analysis Phase (2 days)**
2. **Integration Design (1 day)**
3. **Implementation Phase (3 days)**
4. **Testing Phase (2 days)**
5. **Integration Phase (1 day)**

### 3.3 Unified Orchestration Integration

After both consolidated scripts are completed and tested:

1. **Update Orchestration Script (2 days)**:

   - Modify `scripts/orchestration/phases/loading.ps1` to use the consolidated scripts
   - Replace calls to individual scripts with calls to comprehensive scripts
   - Add appropriate logging and error handling
   - Ensure proper execution order

2. **Transition Phase (1 day)**:

   - Create backup of original orchestration script
   - Document changes to the orchestration script
   - Ensure backward compatibility during transition period

3. **Validation Phase (2 days)**:
   - Run full migration process with updated orchestration
   - Compare results with previous migration process
   - Verify all quiz-related issues are still fixed correctly

## 4. Implementation Timeline

Total estimated time: **20 working days**

| Phase | Task                                                | Duration |
| ----- | --------------------------------------------------- | -------- |
| 1     | Analysis of lesson-quiz scripts                     | 2 days   |
| 2     | Design of lesson-quiz consolidated script           | 1 day    |
| 3     | Implementation of lesson-quiz consolidated script   | 3 days   |
| 4     | Testing of lesson-quiz consolidated script          | 2 days   |
| 5     | Analysis of question-quiz scripts                   | 2 days   |
| 6     | Design of question-quiz consolidated script         | 1 day    |
| 7     | Implementation of question-quiz consolidated script | 3 days   |
| 8     | Testing of question-quiz consolidated script        | 2 days   |
| 9     | Orchestration script updates                        | 2 days   |
| 10    | Transition and validation                           | 2 days   |

The phases can be partially overlapped to reduce total calendar time.

## 5. Code Structure Guidelines

### 5.1 Consolidated Script Structure

```typescript
/**
 * Comprehensive script for fixing lesson-quiz relationships
 *
 * This script consolidates functionality from:
 * - fix-lesson-quiz-field-name.ts
 * - fix-lesson-quiz-references.ts
 * - fix-lessons-quiz-references-sql.ts
 *
 * It fixes all aspects of lesson-quiz relationships including:
 * - Field name consistency
 * - Direct field references
 * - Relationship table entries
 */
import { Client } from 'pg';

import { getConnectionString } from '../../utils/db';
import { logger } from '../../utils/logger';

// Configuration interface
interface FixOptions {
  fixFieldNames: boolean;
  fixDirectReferences: boolean;
  fixRelationshipTables: boolean;
  dryRun: boolean;
}

// Main function with configuration options
export async function fixLessonQuizRelationshipsComprehensive(
  options: Partial<FixOptions> = {},
): Promise<void> {
  // Default options
  const config: FixOptions = {
    fixFieldNames: true,
    fixDirectReferences: true,
    fixRelationshipTables: true,
    dryRun: false,
    ...options,
  };

  logger.info('Starting comprehensive lesson-quiz relationship fix...');

  const client = new Client({
    connectionString: getConnectionString(),
  });

  try {
    await client.connect();
    logger.info('Connected to database successfully');

    // Begin transaction
    if (!config.dryRun) {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    }

    // Step 1: Fix field names (from fix-lesson-quiz-field-name.ts)
    if (config.fixFieldNames) {
      await fixLessonQuizFieldNames(client, config.dryRun);
    }

    // Step 2: Fix direct references (from fix-lesson-quiz-references.ts)
    if (config.fixDirectReferences) {
      await fixLessonQuizReferences(client, config.dryRun);
    }

    // Step 3: Fix relationship tables (from fix-lessons-quiz-references-sql.ts)
    if (config.fixRelationshipTables) {
      await fixLessonQuizReferencesSql(client, config.dryRun);
    }

    // Commit transaction
    if (!config.dryRun) {
      await client.query('COMMIT');
    }

    logger.info(
      'Comprehensive lesson-quiz relationship fix completed successfully',
    );
  } catch (error) {
    // Rollback transaction on error
    if (!config.dryRun) {
      await client.query('ROLLBACK');
    }

    logger.error('Error in comprehensive lesson-quiz relationship fix:', error);
    throw error;
  } finally {
    // Always disconnect from database
    await client.end();
    logger.info('Disconnected from database');
  }
}

// Implement individual fix functions, preserving original functionality
async function fixLessonQuizFieldNames(
  client: Client,
  dryRun: boolean,
): Promise<void> {
  logger.info('Fixing lesson-quiz field names...');
  // Implementation from fix-lesson-quiz-field-name.ts
}

async function fixLessonQuizReferences(
  client: Client,
  dryRun: boolean,
): Promise<void> {
  logger.info('Fixing lesson-quiz direct references...');
  // Implementation from fix-lesson-quiz-references.ts
}

async function fixLessonQuizReferencesSql(
  client: Client,
  dryRun: boolean,
): Promise<void> {
  logger.info('Fixing lesson-quiz relationship tables...');
  // Implementation from fix-lessons-quiz-references-sql.ts
}

// Main execution when run directly
if (require.main === module) {
  fixLessonQuizRelationshipsComprehensive()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}
```

The question-quiz relationships script would follow a similar pattern.

## 6. Risk Analysis and Mitigation

| Risk                                    | Impact | Probability | Mitigation                                          |
| --------------------------------------- | ------ | ----------- | --------------------------------------------------- |
| Functionality loss during consolidation | High   | Medium      | Thorough testing, keep original scripts as fallback |
| Script execution order changes          | High   | Medium      | Document and enforce correct sequence               |
| Performance degradation                 | Medium | Low         | Benchmark and optimize if necessary                 |
| Database schema changes impact scripts  | High   | Low         | Design scripts to be schema-resilient               |
| Additional dependencies discovered      | Medium | Medium      | Build incremental integration with flexible design  |

## 7. Success Metrics

The consolidation will be considered successful if:

1. **Functionality**: All functions from component scripts are preserved
2. **Performance**: Migration process completes within similar timeframe
3. **Reliability**: No new issues are introduced
4. **Maintainability**: Codebase size is reduced and organization improved
5. **Documentation**: New script functionality is clearly documented

## 8. Package.json Updates

The following updates to `package.json` will be needed:

```json
{
  "scripts": {
    // New consolidated script entries
    "fix:lesson-quiz-relationships-comprehensive": "tsx src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts",
    "fix:question-quiz-relationships-comprehensive": "tsx src/scripts/repair/quiz-management/question-relationships/fix-question-quiz-relationships-comprehensive.ts",

    // Mark original scripts as deprecated (keep for backward compatibility)
    "fix:lesson-quiz-field-name": "echo 'DEPRECATED: Use fix:lesson-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-field-name.ts",
    "fix:lesson-quiz-references": "echo 'DEPRECATED: Use fix:lesson-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-references.ts",
    "fix:lessons-quiz-references-sql": "echo 'DEPRECATED: Use fix:lesson-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lessons-quiz-references-sql.ts",

    "fix:questions-quiz-references": "echo 'DEPRECATED: Use fix:question-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/question-relationships/fix-questions-quiz-references.ts",
    "fix:quiz-question-relationships": "echo 'DEPRECATED: Use fix:question-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/question-relationships/fix-quiz-question-relationships.ts",
    "fix:quizzes-without-questions": "echo 'DEPRECATED: Use fix:question-quiz-relationships-comprehensive instead' && tsx src/scripts/repair/quiz-management/question-relationships/fix-quizzes-without-questions.ts"
  }
}
```

## 9. Orchestration Script Updates

The following changes to `scripts/orchestration/phases/loading.ps1` will be needed:

```powershell
# Replace these individual script calls:
# Log-Message "Fixing lesson-quiz field name..." "Yellow"
# Exec-Command -command "pnpm run fix:lesson-quiz-field-name" -description "Fixing lesson-quiz field name" -continueOnError
# Log-Message "Fixing lesson-quiz references..." "Yellow"
# Exec-Command -command "pnpm run fix:lesson-quiz-references" -description "Fixing lesson-quiz references" -continueOnError
# Log-Message "Fixing lesson-quiz references with SQL..." "Yellow"
# Exec-Command -command "pnpm run fix:lessons-quiz-references-sql" -description "Fixing lesson-quiz references with SQL" -continueOnError

# With this consolidated call:
Log-Message "Fixing all lesson-quiz relationships..." "Yellow"
Exec-Command -command "pnpm run fix:lesson-quiz-relationships-comprehensive" -description "Fixing all lesson-quiz relationships" -continueOnError

# Similarly, replace these calls:
# Log-Message "Fixing quiz-question relationships..." "Yellow"
# Exec-Command -command "pnpm run fix:quiz-question-relationships" -description "Fixing quiz-question relationships" -continueOnError
# Log-Message "Fixing questions-quiz references..." "Yellow"
# Exec-Command -command "pnpm run fix:questions-quiz-references" -description "Fixing questions-quiz references" -continueOnError
# Log-Message "Fixing quizzes without questions..." "Yellow"
# Exec-Command -command "pnpm run fix:quizzes-without-questions" -description "Fixing quizzes without questions" -continueOnError

# With this consolidated call:
Log-Message "Fixing all question-quiz relationships..." "Yellow"
Exec-Command -command "pnpm run fix:question-quiz-relationships-comprehensive" -description "Fixing all question-quiz relationships" -continueOnError
```

## 10. Future Recommendations

After successful consolidation:

1. **Phase Out Legacy Scripts**:

   - Move original component scripts to a `deprecated/` folder
   - Update documentation to direct users to comprehensive scripts
   - Eventually remove deprecated scripts in a future release

2. **Automate Testing**:

   - Develop automated tests for consolidated scripts
   - Implement CI/CD pipeline for script testing

3. **Enhance Monitoring**:
   - Add telemetry to track script performance
   - Implement more detailed logging for better diagnostics

This implementation plan provides a structured approach to replacing multiple individual scripts with comprehensive scripts while ensuring no functionality is lost during the consolidation process.
