# Repair Scripts

This directory contains scripts that fix or repair database issues and other inconsistencies in the content migration system.

## Directory Structure

The repair scripts are organized into the following subdirectories based on their primary function:

### Database

Scripts in the `database/` directory handle database-level fixes and schema changes:

- `fix-uuid-tables.ts` - Fixes UUID tables, ensuring all required columns exist
- `fix-relationship-columns.ts` - Fixes relationship columns in various tables
- `fix-relationships-direct.ts` - Applies direct relationship fixes using SQL
- `fix-payload-relationships-strict.ts` - Ensures strict typing for Payload relationships

### Quiz Management

Scripts in the `quiz-management/` directory handle quiz-related fixes:

- `fix-lesson-quiz-references.ts` - Fixes references between lessons and quizzes
- `fix-lessons-quiz-references-sql.ts` - SQL-based fixes for lesson-quiz references
- `fix-questions-quiz-references.ts` - Fixes references between quizzes and questions
- `fix-quiz-id-consistency.ts` - Ensures quiz IDs are consistent across tables
- `fix-quiz-question-relationships.ts` - Fixes quiz-question relationships
- `fix-quiz-relationships-complete.ts` - Comprehensive fix for all quiz relationships
- Other quiz-specific fix scripts

### Media Downloads

Scripts in the `media-downloads/` directory handle media and download-related fixes:

- `fix-post-image-relationships.ts` - Fixes relationships between posts and images
- `fix-downloads-relationships.ts` - Fixes download relationships
- `fix-downloads-r2-integration.ts` - Ensures proper R2 bucket integration
- `fix-downloads-metadata.ts` - Fixes metadata for downloads
- And other download/media-related fixes

### Content Format

Scripts in the `content-format/` directory handle content formatting and conversion:

- `fix-lexical-format.ts` - Fixes Lexical format issues
- `fix-post-lexical-format.ts` - Fixes Lexical format in posts
- `fix-all-lexical-fields.ts` - Comprehensive fix for all Lexical fields
- `fix-todo-fields.ts` - Fixes todo fields in course lessons
- `fix-lesson-todo-fields.ts` - Fixes todo fields specific to lessons

### Survey Management

Scripts in the `survey-management/` directory handle survey-related fixes:

- `fix-survey-questions-population.ts` - Ensures survey questions are properly populated
- `fix-survey-progress.ts` - Fixes survey progress tracking

### Utilities

Scripts in the `utilities/` directory handle miscellaneous utility functions:

- `fix-edge-cases.ts` - Fixes various edge cases that don't fit elsewhere
- `clear-lesson-content.ts` - Utility to clear lesson content fields

## Usage

Scripts are typically run via their corresponding npm scripts defined in `package.json`.

For example:

```bash
pnpm run fix:uuid-tables
pnpm run fix:lesson-quiz-references
```

Or directly via the content-migrations package:

```bash
pnpm --filter @kit/content-migrations run fix:uuid-tables
```
