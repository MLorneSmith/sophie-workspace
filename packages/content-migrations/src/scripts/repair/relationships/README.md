# Comprehensive Relationship Repair System

This directory contains the Phase 2 implementation of the Relationship Repair System, which addresses inconsistencies between direct field references and relationship tables in Payload CMS.

> **NEW**: We now have a Simplified Relationship Repair System that doesn't rely on direct fields that may not exist in the schema. See the [Simplified Relationship Repair](#simplified-relationship-repair) section below.

## Overview

The relationship repair system is designed to solve several key issues:

1. Inconsistencies between direct fields (e.g., `questions` array in `course_quizzes`) and relationship tables (e.g., `course_quizzes_rels`)
2. Missing references in either direct fields or relationship tables
3. Incorrect ordering of items in relationship arrays
4. Orphaned relationship entries (where the referenced item no longer exists)

## Key Components

The system is organized into several logical components:

### Core

- `types.ts` - Type definitions for relationship management
- `constants.ts` - Configuration constants for relationship repair
- `utils.ts` - Utility functions for file operations and logging
- `detection.ts` - Enhanced relationship detection system that maps all relationships between collections

### Database

- `views.ts` - Creates database views for standardized relationship access
- `helpers.ts` - Implements database helper functions for relationship retrieval

### Fixes

- `quiz-question.ts` - Specialized fixes for quiz-question relationships, which are critical for course functionality

### Verification

- `verify-all.ts` - Comprehensive verification system to ensure relationships are consistent

## Usage

### Command Line Interface

The relationship repair process can be run via the CLI:

```bash
# Run with default options
tsx src/cli/run-relationship-repair.ts

# Skip verification phase
tsx src/cli/run-relationship-repair.ts --skip-verification

# Skip quiz-question fixes
tsx src/cli/run-relationship-repair.ts --skip-quiz-fix

# Skip database views and helpers creation
tsx src/cli/run-relationship-repair.ts --skip-fallback

# Show help
tsx src/cli/run-relationship-repair.ts --help
```

### Programmatic Usage

You can also use the relationship repair system programmatically:

```typescript
import { runRelationshipRepair } from '@kit/content-migrations/orchestration/relationship-repair';

// Run with default options
await runRelationshipRepair();

// Run with custom options
await runRelationshipRepair({
  skipVerification: true,
  skipQuizFix: false,
  skipMultiFix: false,
  skipFallbackSystem: false,
  logToFile: true,
});
```

## SQL Helpers

In the `src/scripts/sql/relationship-views` directory, you'll find SQL files that create additional database views:

- `unified-relationships-view.sql` - Creates a unified view of all relationships across collections

These SQL files can be executed directly in your database or through the `utils:run-sql-file` script:

```bash
npm run utils:run-sql-file -- -- --file src/scripts/sql/relationship-views/unified-relationships-view.sql
```

## Repair Process

The relationship repair process works in several phases:

1. **Detection Phase** - Analyzes the database to identify and map all relationships
2. **Database Infrastructure Phase** - Creates database views and helper functions to standardize relationship access
3. **Fix Phase** - Runs fixes for specific relationships, particularly quiz-question relationships
4. **Verification Phase** - Verifies that all relationships are consistent

The entire process is transactional, ensuring that the database is not left in an inconsistent state if an error occurs.

## Verification

The verification system checks for several types of inconsistencies:

1. **Missing in Relationship Table** - When a direct field references an item that is not in the relationship table
2. **Missing in Direct Field** - When a relationship table entry has no corresponding entry in the direct field
3. **Order Mismatch** - When the order of items in the direct field does not match the order in the relationship table

The verification process produces a report with detailed statistics about the consistency of relationships.

## Implementation Details

### Relationship Detection

The relationship detection system uses a combination of techniques to identify relationships between collections:

1. Table name analysis (e.g., `course_quizzes_rels` indicates relationships for `course_quizzes`)
2. Sample data analysis (checking where IDs from relationship tables exist in other collections)
3. Path analysis (e.g., `questions` path in `course_quizzes_rels` likely points to `quiz_questions`)

### Database Views and Helpers

The system creates several database views and helper functions to provide standardized access to relationship data:

- `course_quiz_questions_view` - Shows quiz-question relationships
- `lesson_quiz_view` - Shows lesson-quiz relationships
- `survey_questions_view` - Shows survey-question relationships
- `course_content_view` - Shows a unified view of courses, lessons, and quizzes
- `downloads_relationships_view` - Shows download relationships
- `invalid_relationships_view` - Shows relationships with inconsistencies

It also creates helper functions like `get_quiz_questions()` and `get_lesson_quiz()` to retrieve relationship data.

### Quiz-Question Relationship Fixes

The quiz-question relationship fix addresses several specific issues:

1. Questions that exist in the direct field but not in the relationship table
2. Questions that exist in the relationship table but not in the direct field
3. Questions with incorrect ordering
4. Orphaned relationship entries (where the quiz or question no longer exists)

The fix ensures that both the direct field and relationship table are consistent and contain the same information.

## Adding New Fixes

To add new fixes for other types of relationships:

1. Create a new file in the `fixes` directory (e.g., `survey-question.ts`)
2. Implement the fix logic similar to the quiz-question fix
3. Add the new fix to the orchestration process in `relationship-repair.ts`
4. Update types and constants as needed

## Simplified Relationship Repair

### Problem

The original relationship repair system was designed to ensure consistency between direct fields (e.g., `questions` array in `course_quizzes`) and relationship tables. However, we discovered that some of these direct fields may not exist in the database schema, leading to SQL errors during the repair process.

### Solution

The simplified relationship repair system addresses this issue by:

1. Not assuming the existence of direct fields in collections
2. Focusing only on ensuring that relationship table entries are valid
3. Using simplified verification queries that don't rely on direct fields

### Key Components

- `simplified-relationship-repair.ts` - Main orchestration file that doesn't assume direct fields exist
- `verify-simplified.ts` - Verification module that only checks relationship table entries against their target collections

### Usage

You can run the simplified relationship repair process via:

```bash
# Run with default options
pnpm --filter @kit/content-migrations run repair:relationships:simplified

# Or directly via the CLI script
tsx src/cli/run-simplified-relationship-repair.ts
```

### When to Use

Use the simplified version when:

- You're seeing errors about missing columns like `questions` or `quiz`
- The standard repair process fails with SQL errors
- You've modified your schema and direct fields don't match what the repair script expects

### Implementation Differences

The simplified implementation differs from the standard one in several ways:

1. **Schema Independence** - No assumptions about direct fields existing
2. **Relationship Table Focus** - Only ensures relationship table entries point to valid records
3. **Error Handling** - More robust error handling to prevent transaction failures
4. **Verification** - Simplified verification that only checks if relationship references are valid

### Benefits

- More resilient to schema changes
- Less likely to fail with SQL errors
- Simpler implementation that focuses on the most critical aspects of relationship integrity
