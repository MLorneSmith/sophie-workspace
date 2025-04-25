# Quiz Management Repair Scripts

This directory contains scripts for repairing and maintaining quiz data, particularly the relationship between quizzes and quiz questions.

## Key Scripts

### Enhanced Format Questions JSONB (`enhanced-format-questions-jsonb.ts`)

This script fixes the critical formatting issue with quiz questions arrays in the Payload CMS database. It ensures that questions arrays follow the expected format for Payload CMS relationships:

```json
{
  "questions": [
    {
      "id": "unique-entry-id",
      "relationTo": "quiz_questions",
      "value": {
        "id": "related-document-id"
      }
    }
  ]
}
```

The script:

1. Updates all quiz questions arrays to ensure proper formatting
2. Applies special handling for problematic quizzes mentioned in server logs (like "The Who Quiz" and "Performance Quiz")
3. Uses a comprehensive approach that extracts relationship data from the relationship tables and rebuilds the JSONB structure properly

### Core Relationship Fixers

The `core` subdirectory contains more specialized repair scripts that handle different aspects of the quiz-question relationship issues:

- `fix-quiz-array-relationships.ts`: Focuses on synchronizing relationship tables with questions arrays
- `fix-quiz-question-relationships-comprehensive-enhanced.ts`: A more comprehensive approach for deeply nested relationship issues

## Usage

Most repair scripts should be run through our content migration system using `reset-and-migrate.ps1`. However, they can also be run directly for testing or emergency fixes:

```powershell
# From project root
cd packages/content-migrations
npx ts-node src/scripts/repair/run-quiz-jsonb-format-fix.ts
```

## Payload CMS JSONB Relationship Format Issues

Payload CMS expects relationship fields to follow a specific format in the JSONB arrays. When this format is not followed, it can result in:

1. Relationships not showing up in the Payload admin UI
2. 404 errors when trying to access related documents
3. Inconsistencies between what's in the relationship tables vs. the questions arrays

The scripts in this directory help solve these issues by ensuring the proper format is maintained.

## Verification

After running a repair script, you can verify the fix worked using:

```powershell
npx ts-node src/scripts/verification/verify-questions-jsonb-format.ts
```

This will analyze all quizzes and report on any remaining formatting issues.
