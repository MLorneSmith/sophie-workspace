# Quiz System Documentation

## Overview

The quiz system is a critical component of our course platform that manages quiz data, course-quiz relationships, and ensures data consistency between related database tables.

## Problem Addressed

We addressed a quiz ID consistency issue where quiz IDs in the 03-quizzes.sql file weren't matching those in 04-questions.sql, causing foreign key constraint violations during database population.

The root cause was that the IDs were being inconsistently generated or referenced across multiple places in the codebase, with no single source of truth.

## Implementation

We implemented a robust solution that:

1. Maintains a static definition of quiz data in the codebase
2. Uses the static definitions for consistent SQL generation
3. Forces ID consistency through direct SQL file generation
4. Adds verification tools to prevent future inconsistencies

## Key Files

### Script Implementation

- `src/scripts/fix-quiz-id-consistency.ts` - Script that ensures quiz IDs are consistent by directly writing the 03-quizzes.sql file with correct IDs

### Integration

- `reset-and-migrate.ps1` - Migration script that executes fix-quiz-id-consistency.ts after the standard SQL generation

## How It Works

1. The `reset-and-migrate.ps1` script runs the standard SQL generation process
2. Immediately after, it runs the `fix-quiz-id-consistency.ts` script
3. This script overwrites the 03-quizzes.sql file with the correct quiz IDs
4. These IDs match those used in 04-questions.sql
5. When the migrations are later executed, the IDs are consistent

## ID Consistency Map

The script maintains a fixed map of quiz slugs to IDs that ensures consistency:

```typescript
const CORRECT_QUIZ_IDS: Record<string, string> = {
  'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
  'elements-of-design-detail-quiz': '42564568-76bb-4405-88a9-8e9fd0a9154a',
  'fact-persuasion-quiz': '791e27de-2c98-49ef-b684-6c88667d1571',
  'gestalt-principles-quiz': '3c72b383-e17e-4b07-8a47-451cfbff29c0',
  // More quiz IDs...
};
```

## Verification

The quiz ID fix is executed after the initial SQL generation but before the actual database migrations, ensuring that:

1. All quiz-related SQL files are generated first
2. The quiz ID consistency fix is applied to guarantee ID alignment
3. Database migrations run with consistent IDs

## Benefits of this Approach

1. **Non-Invasive**: Doesn't require modifying the existing SQL generation logic
2. **Isolated Fix**: The fix is contained in a single script that's easy to maintain
3. **Transparent**: The README and script comments clearly document the approach
4. **Reliable**: The fix runs automatically as part of the reset-and-migrate process

## Future Considerations

While this approach solves the immediate problem, future improvements could include:

1. Implementing a more integrated single source of truth for quiz data
2. Adding comprehensive validation for quiz IDs across the system
3. Creating database constraints to enforce ID consistency
4. Centralizing the ID generation process to prevent future inconsistencies

## Troubleshooting

If you encounter foreign key constraint violations related to quiz questions, check:

1. That the fix-quiz-id-consistency.ts script is being executed properly
2. That the IDs in the script match those expected by 04-questions.sql
3. That the 03-quizzes.sql file is being correctly generated and used
