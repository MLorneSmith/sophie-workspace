# Phase 2 Technical Implementation: Comprehensive Relationship Repair

This document contains detailed technical implementation guidance for the Phase 2 relationship repair components. It provides code examples, SQL queries, and specific implementation details for each component outlined in the main implementation plan.

## Table of Contents

1. [Enhanced Relationship Detection](#1-enhanced-relationship-detection)
2. [Comprehensive Quiz-Question Fix](#2-comprehensive-quiz-question-fix)
3. [Multi-Collection Relationship Fix](#3-multi-collection-relationship-fix)
4. [Database Views and Helpers](#4-database-views-and-helpers)
5. [Verification System](#5-verification-system)
6. [Orchestration System](#6-orchestration-system)
7. [PowerShell Script Update](#7-powershell-script-update)
8. [Package.json Updates](#8-packagejson-updates)

## 1. Enhanced Relationship Detection

### Implementation Details

The relationship detection system will analyze both database metadata and content patterns to identify relationships between collections. This approach ensures we can detect both standard relationship patterns (foreign keys, relationship tables) and custom relationship patterns specific to Payload CMS.

```typescript
// packages/content-migrations/src/scripts/repair/relationships/enhanced-relationship-detection.ts
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

import { getPayloadClient } from '../../../utils/db/payload-client';

export interface RelationshipInfo {
  sourceCollection: string;
  sourceField: string;
  targetCollection: string;
  relationType: 'hasOne' | 'hasMany';
  relationshipPath: string;
  isRequired: boolean;
}

export interface RelationshipMap {
  collections: Record<
    string,
    {
      name: string;
      relationships: RelationshipInfo[];
    }
  >;
  relationshipTables: string[];
  uuidTables: string[];
}

/**
 * Main detection function that analyzes the database to discover relationships
 */
export async function detectAllRelationships(): Promise<RelationshipMap> {
  const client = await getPayloadClient();
  const db = client.db.drizzle;

  const map: RelationshipMap = {
    collections: {},
    relationshipTables: [],
    uuidTables: [],
  };

  // Step 1: Get all tables from the database (excluding relationship tables)
  const collectionsQuery = `
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'payload' 
    AND tablename NOT LIKE '%_rels' 
    AND tablename NOT LIKE '%_rels_%'
    AND tablename NOT LIKE 'pg_%'
  `;

  // Step 2: Get relationship tables specifically
  const relTablesQuery = `
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'payload' 
    AND (tablename LIKE '%_rels' OR tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$')
  `;

  // Step 3: Check for UUID registry from Phase 1
  const uuidRegistryQuery = `
    SELECT table_name FROM payload.dynamic_uuid_tables
    WHERE table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$'
  `;

  // Additional detection code...

  return map;
}

/**
 * Save the relationship map to a file for future use
 */
export async function saveRelationshipMap(
  map: RelationshipMap,
): Promise<string> {
  const mappingsDir = path.join(process.cwd(), 'src', 'data', 'mappings');
  await fs.mkdir(mappingsDir, { recursive: true });

  const filePath = path.join(mappingsDir, 'relationship-map.json');
  await fs.writeFile(filePath, JSON.stringify(map, null, 2));

  return filePath;
}

/**
 * Main function to detect and save relationship map
 */
export async function detectAndSaveRelationships(): Promise<RelationshipMap> {
  const map = await detectAllRelationships();
  await saveRelationshipMap(map);
  return map;
}
```

### Database Query Optimizations

To ensure optimal performance during relationship detection:

1. Use parameterized queries to prevent SQL injection and improve query cache hits
2. Add appropriate WHERE clauses to limit scope of queries
3. Use prepared statements for repeated queries
4. Add LIMIT to sample queries when examining content patterns

### Integration with UUID Registry

```typescript
// Example of integration with UUID table registry
try {
  const uuidRegistry = await db.execute(sql.raw(uuidRegistryQuery));

  // Add UUID tables from registry to our tracking
  map.uuidTables = uuidRegistry.map((row) => row.table_name);
} catch (error) {
  console.log(
    'UUID registry table not found, falling back to direct detection',
  );

  // Fall back to extracting UUID tables from relTables
  map.uuidTables = relTables
    .filter((row) =>
      row.tablename.match(
        /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/,
      ),
    )
    .map((row) => row.tablename);
}
```

## 2. Comprehensive Quiz-Question Fix

### Implementation Approach

The quiz-question fix will address the most critical relationship issues identified in the migration logs. It handles:

1. Inconsistencies between the direct 'questions' field in quizzes and the relationship table entries
2. Orphaned question references that no longer have corresponding questions
3. Order inconsistencies in the relationship tables

```typescript
// packages/content-migrations/src/scripts/repair/relationships/comprehensive-quiz-question-fix.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../../utils/db/payload-client';

export interface QuizQuestionFixResult {
  processedQuizzes: number;
  fixedQuestions: number;
  reorderedQuestions: number;
  addedToQuizzes: number;
  addedToRelTables: number;
  cleanedOrphans: number;
  errors: Array<{ quiz: string; error: string }>;
}

/**
 * Main function to fix quiz-question relationships
 */
export async function fixQuizQuestionRelationships(): Promise<QuizQuestionFixResult> {
  const client = await getPayloadClient();
  const db = client.db.drizzle;

  const result: QuizQuestionFixResult = {
    processedQuizzes: 0,
    fixedQuestions: 0,
    reorderedQuestions: 0,
    addedToQuizzes: 0,
    addedToRelTables: 0,
    cleanedOrphans: 0,
    errors: [],
  };

  try {
    // Begin transaction for atomicity
    await db.execute(sql`BEGIN`);

    // Get all quizzes
    const quizzes = await client.find({
      collection: 'course_quizzes',
      depth: 0,
      limit: 1000,
    });

    // Process each quiz to ensure question consistency
    for (const quiz of quizzes.docs) {
      try {
        // Compare direct questions field with relationship table entries
        // Fix inconsistencies
        // Update order if needed
      } catch (error) {
        result.errors.push({
          quiz: quiz.id,
          error: error.message,
        });
      }
    }

    // Clean up orphaned relationships

    // Commit transaction
    await db.execute(sql`COMMIT`);

    return result;
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK`);
    throw error;
  }
}
```

### SQL Components for Cleanup

```sql
-- SQL for cleaning up orphaned relationships (quiz doesn't exist)
SELECT r.id, r.parent_id
FROM payload.course_quizzes_rels r
LEFT JOIN payload.course_quizzes q ON r.parent_id = q.id
WHERE q.id IS NULL AND r.path = 'questions';

-- SQL for cleaning up orphaned relationships (question doesn't exist)
SELECT r.id, r.parent_id
FROM payload.course_quizzes_rels r
LEFT JOIN payload.quiz_questions q ON r.id = q.id
WHERE q.id IS NULL AND r.path = 'questions';

-- SQL for fixing order in relationship tables
UPDATE payload.course_quizzes_rels
SET "order" = [index]
WHERE id = '[questionId]' AND parent_id = '[quizId]' AND path = 'questions';
```

## 3. Multi-Collection Relationship Fix

### Overview

The multi-collection fix extends the quiz-question fix approach to a generalized system that can handle any collection relationship using a configuration-driven approach.

```typescript
// packages/content-migrations/src/scripts/repair/relationships/multi-collection-fix.ts
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

import { getPayloadClient } from '../../../utils/db/payload-client';
import { RelationshipMap } from './enhanced-relationship-detection';

interface RelationshipConfig {
  sourceCollection: string;
  relationshipPath: string;
  targetCollection: string;
  relationType: 'hasOne' | 'hasMany';
  skipIfMissing?: boolean;
  maintainOrder?: boolean;
  columnNameOverride?: string;
}

interface MultiCollectionFixResult {
  processedCollections: number;
  processedRelationships: number;
  fixedDirectReferences: number;
  fixedRelTables: number;
  deletedOrphans: number;
  errors: Array<{ collection: string; relation: string; error: string }>;
}

/**
 * Main function for fixing relationships across multiple collections
 */
export async function fixMultiCollectionRelationships(
  configs: RelationshipConfig[] = [],
): Promise<MultiCollectionFixResult> {
  // Implementation with configuration-driven approach
  // Handles both hasOne and hasMany relationships
  // Falls back to common configuration if none provided
}

/**
 * Process a hasMany relationship (e.g., quiz -> questions)
 */
async function processHasManyRelationship(
  db: any,
  client: any,
  config: RelationshipConfig,
  result: MultiCollectionFixResult,
): Promise<void> {
  // Specific handling for hasMany relationships
  // Maintains relationship order if specified
}

/**
 * Process a hasOne relationship (e.g., lesson -> quiz)
 */
async function processHasOneRelationship(
  db: any,
  client: any,
  config: RelationshipConfig,
  result: MultiCollectionFixResult,
): Promise<void> {
  // Specific handling for hasOne relationships
}
```

### Common Relationship Configurations

```typescript
// Default configurations for known important relationships
const commonConfigs: RelationshipConfig[] = [
  {
    sourceCollection: 'course_quizzes',
    relationshipPath: 'questions',
    targetCollection: 'quiz_questions',
    relationType: 'hasMany',
    maintainOrder: true,
  },
  {
    sourceCollection: 'course_lessons',
    relationshipPath: 'quiz',
    targetCollection: 'course_quizzes',
    relationType: 'hasOne',
  },
  {
    sourceCollection: 'surveys',
    relationshipPath: 'questions',
    targetCollection: 'survey_questions',
    relationType: 'hasMany',
    maintainOrder: true,
  },
];
```

## 4. Database Views and Helpers

### SQL Views for Stable Access

Create standardized views for commonly accessed relationships to provide a stable interface regardless of underlying data structure changes.

```sql
-- packages/content-migrations/src/scripts/sql/create-relationship-views.sql

-- Course Quiz Questions View
CREATE OR REPLACE VIEW payload.course_quiz_questions_view AS
SELECT
    q.id AS quiz_id,
    q.name AS quiz_name,
    qq.id AS question_id,
    qq.prompt AS question_prompt,
    r."order" AS question_order
FROM
    payload.course_quizzes q
JOIN
    payload.course_quizzes_rels r ON q.id = r.parent_id AND r.path = 'questions'
JOIN
    payload.quiz_questions qq ON r.id = qq.id
ORDER BY
    q.id, r."order";

-- Lesson Quiz View
CREATE OR REPLACE VIEW payload.lesson_quiz_view AS
SELECT
    l.id AS lesson_id,
    l.title AS lesson_title,
    q.id AS quiz_id,
    q.name AS quiz_name
FROM
    payload.course_lessons l
LEFT JOIN
    payload.course_lessons_rels r ON l.id = r.parent_id AND r.path = 'quiz'
LEFT JOIN
    payload.course_quizzes q ON r.id = q.id;

-- Survey Questions View
CREATE OR REPLACE VIEW payload.survey_questions_view AS
SELECT
    s.id AS survey_id,
    s.title AS survey_title,
    sq.id AS question_id,
    sq.prompt AS question_prompt,
    r."order" AS question_order
FROM
    payload.surveys s
JOIN
    payload.surveys_rels r ON s.id = r.parent_id AND r.path = 'questions'
JOIN
    payload.survey_questions sq ON r.id = sq.id
ORDER BY
    s.id, r."order";
```

### SQL Helper Functions

```sql
-- packages/content-migrations/src/scripts/sql/create-relationship-helpers.sql

-- Get Quiz Questions helper function
CREATE OR REPLACE FUNCTION payload.get_quiz_questions(quiz_id TEXT)
RETURNS TABLE(
    question_id TEXT,
    question_prompt TEXT,
    question_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        qq.id AS question_id,
        qq.prompt AS question_prompt,
        r."order" AS question_order
    FROM
        payload.course_quizzes q
    JOIN
        payload.course_quizzes_rels r ON q.id = r.parent_id AND r.path = 'questions'
    JOIN
        payload.quiz_questions qq ON r.id = qq.id
    WHERE
        q.id = quiz_id
    ORDER BY
        r."order";
END;
$$ LANGUAGE plpgsql;

-- Additional helper functions for lesson-quiz and survey-question relationships
```

### Migration Integration

```typescript
// apps/payload/src/migrations/20250425_100000_relationship_views.ts
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import fs from 'fs';
import path from 'path';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const db = payload.db.drizzle;

  const viewsSqlPath = path.resolve(
    __dirname,
    '../../../packages/content-migrations/src/scripts/sql/create-relationship-views.sql',
  );
  const viewsSql = fs.readFileSync(viewsSqlPath, 'utf8');

  await db.execute(viewsSql);

  console.log('Created database views for relationship access');
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const db = payload.db.drizzle;

  // Drop views in reverse dependency order
  await db.execute(`DROP VIEW IF EXISTS payload.survey_questions_view`);
  await db.execute(`DROP VIEW IF EXISTS payload.lesson_quiz_view`);
  await db.execute(`DROP VIEW IF EXISTS payload.course_quiz_questions_view`);

  console.log('Dropped database views for relationship access');
}
```

## 5. Verification System

### Implementation

The verification system will check for relationship consistency across all collections, focusing on both direct field references and relationship table entries.

```typescript
// packages/content-migrations/src/scripts/verification/verify-relationships.ts
import { sql } from 'drizzle-orm';

import { getPayloadClient } from '../../utils/db/payload-client';
import { RelationshipMap } from '../repair/relationships/enhanced-relationship-detection';

interface VerificationResult {
  totalRelationships: number;
  checkedRelationships: number;
  inconsistentRelationships: {
    collection: string;
    field: string;
    targetCollection: string;
    issueType: 'missing_in_direct' | 'missing_in_rel_table' | 'ordering_issue';
    count: number;
  }[];
  summary: {
    passedCount: number;
    failedCount: number;
    passRate: number;
  };
}

export async function verifyRelationships(): Promise<VerificationResult> {
  // Implementation that checks relationship consistency
  // Returns detailed results of verification process
}

async function verifyRelationship(
  db: any,
  client: any,
  relationship: any,
  result: VerificationResult,
): Promise<void> {
  // Verification for a specific relationship
  // Handles different relationship types
}
```

### Verification Report Format

```typescript
// Example verification result
const result: VerificationResult = {
  totalRelationships: 42,
  checkedRelationships: 42,
  inconsistentRelationships: [
    {
      collection: 'course_quizzes',
      field: 'questions',
      targetCollection: 'quiz_questions',
      issueType: 'missing_in_rel_table',
      count: 3,
    },
    {
      collection: 'course_lessons',
      field: 'quiz',
      targetCollection: 'course_quizzes',
      issueType: 'missing_in_direct',
      count: 1,
    },
  ],
  summary: {
    passedCount: 40,
    failedCount: 2,
    passRate: 95.24, // (40/42) * 100
  },
};
```

## 6. Orchestration System

### Implementation

The orchestration system will tie together all components into a cohesive workflow, managing dependencies and ensuring proper execution order.

```typescript
// packages/content-migrations/src/repair-orchestrator.ts
import fs from 'fs/promises';
import path from 'path';

import { createFallbackSystem } from './scripts/repair/relationships/advanced-fallback-system';
import { fixQuizQuestionRelationships } from './scripts/repair/relationships/comprehensive-quiz-question-fix';
import { detectAndSaveRelationships } from './scripts/repair/relationships/enhanced-relationship-detection';
import { fixMultiCollectionRelationships } from './scripts/repair/relationships/multi-collection-fix';
import { verifyRelationships } from './scripts/verification/verify-relationships';

interface RepairOptions {
  skipVerification?: boolean;
  skipQuizFix?: boolean;
  skipMultiFix?: boolean;
  skipFallbackSystem?: boolean;
  logToFile?: boolean;
}

export async function runRelationshipRepair(
  options: RepairOptions = {},
): Promise<boolean> {
  // Implementation that orchestrates the full repair process
  // Manages logging, error handling, and cleanup
  return true;
}
```

### CLI Integration

```typescript
// packages/content-migrations/src/cli/repair.ts
import { Command } from 'commander';

import { runRelationshipRepair } from '../repair-orchestrator';

const program = new Command();

program
  .name('relationship-repair')
  .description('Repair Payload CMS relationships')
  .option('-s, --skip-verification', 'Skip verification steps')
  .option('-q, --skip-quiz-fix', 'Skip quiz-question fix')
  .option('-m, --skip-multi-fix', 'Skip multi-collection fix')
  .option('-f, --skip-fallback', 'Skip fallback system creation')
  .option('-l, --log-to-file', 'Log output to file')
  .action(async (options) => {
    try {
      const success = await runRelationshipRepair(options);
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Uncaught error:', error);
      process.exit(1);
    }
  });

program.parse();
```

## 7. PowerShell Script Update

### Fix-Relationships Function Update

```powershell
# Updated Fix-Relationships function for scripts/orchestration/phases/loading.ps1

function Fix-Relationships {
    Log-EnhancedStep "Fixing relationships" 10 12

    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"

        # Navigate to content-migrations directory
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }

        # Run the new comprehensive relationship repair
        Log-Message "Running comprehensive relationship repair..." "Cyan"
        $repairOutput = node ./dist/repair-orchestrator.js

        if ($LASTEXITCODE -ne 0) {
            Log-Message "Relationship repair failed with exit code: $LASTEXITCODE" "Red"
            throw "Relationship repair failed. Check logs for details."
        }

        Log-Message "Comprehensive relationship repair completed successfully" "Green"

        # Add detailed logs if available
        $summaryLines = $repairOutput | Select-String -Pattern "Verification Results|Fixed|Processed|Found"
        foreach ($line in $summaryLines) {
            Log-Message "  $line" "White"
        }

        # Return to project root
        Set-ProjectRootLocation
        return $true
    } catch {
        Log-Error "Error fixing relationships: $_"
        return $false
    }
}
```

### Integration with Reset-and-Migrate Script

```powershell
# Update to reset-and-migrate.ps1 - ensure relationship repair runs after content loading

# Import orchestration script
. "$PSScriptRoot/scripts/orchestration/orchestrate.ps1"

# Main function
function Main {
    $startTime = Get-Date

    # Create migration ID and log directories
    $migrationId = "$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
    $logFilename = "migration-log-$migrationId.txt"
    $detailedLogFilename = "migration-detailed-log-$migrationId.txt"
    CreateLogDirectory $migrationId $logFilename $detailedLogFilename

    # Start migration process
    Start-Migration $migrationId $logFilename $detailedLogFilename

    # Add explicit relationship repair verification step
    Log-Message "Verifying relationship integrity..." "Cyan"
    Set-ProjectLocation -RelativePath "packages/content-migrations"
    $verificationOutput = node ./dist/cli/verify.js
    Set-ProjectRootLocation
    Log-Message "Relationship verification completed" "Green"

    # Log completion time
    $endTime = Get-Date
    $duration = ($endTime - $startTime)
    Log-Message "Migration completed in $($duration.TotalSeconds) seconds" "Green"
}

# Run main function
Main
```

## 8. Package.json Updates

Add necessary script entries to content-migrations package.json:

```json
{
  "name": "@kit/content-migrations",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "repair": "node ./dist/repair-orchestrator.js",
    "verify": "node ./dist/cli/verify.js",
    "detect": "node ./dist/scripts/repair/relationships/enhanced-relationship-detection.js",
    "fix-quiz": "node ./dist/scripts/repair/relationships/comprehensive-quiz-question-fix.js",
    "fix-all": "node ./dist/scripts/repair/relationships/multi-collection-fix.js"
  },
  "dependencies": {
    "drizzle-orm": "^0.28.0",
    "commander": "^11.0.0",
    "chalk": "^5.3.0"
  }
}
```

## Testing and Verification Approach

For each component:

1. Create unit tests for core functionality
2. Create integration tests for component interactions
3. Perform verification before and after repairs
4. Log detailed metrics about repairs performed
5. Test with both clean database and database with known issues

For the orchestration system:

1. Test each step individually
2. Test the full workflow end-to-end
3. Test error handling and recovery
4. Test with different options enabled/disabled

## Performance Considerations

1. Use transactions for atomicity
2. Use prepared statements for repeated queries
3. Add progress reporting for long-running operations
4. Optimize database queries with appropriate indexes
5. Use batch processing for large datasets
6. Allow partial processing to handle very large datasets

## Conclusion

This technical implementation plan provides detailed guidance for implementing the comprehensive relationship repair system. Following this approach will ensure a systematic and thorough fix for the relationship issues currently affecting Payload CMS content.
