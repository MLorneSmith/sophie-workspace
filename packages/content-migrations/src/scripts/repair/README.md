# Repair Scripts

This directory contains scripts designed to fix and repair data issues in the Payload CMS database.

## Purpose

Repair scripts address various data integrity and consistency issues that might arise during or after content migration:

1. Fixed relationships between content items
2. Corrected data formats
3. Data field updates
4. Schema corrections

## When to Use

Run these scripts when:

- Verification scripts report issues with data integrity
- Content appears incorrectly in the Payload CMS admin interface
- Relationships between content items are broken
- Migration logs indicate issues with specific content types

## Available Scripts

### UUID Table Structure

- `fix-uuid-tables.ts`: Fixes issues with UUID table structure, ensuring all required columns are present and properly typed.

### Content Relationships

- `fix-post-image-relationships.ts`: Repairs relationships between blog posts and their featured images.
- `fix-relationship-columns.ts`: Ensures relationship columns exist across all relationship tables.
- `fix-relationships-direct.ts`: Directly fixes relationships between content items.

### Quiz & Lesson Integration

- `fix-quiz-id-consistency.ts`: Ensures quiz IDs are consistent across all references.
- `fix-lesson-quiz-field-name.ts`: Fixes field name issues in lesson-quiz relationships.
- `fix-lesson-todo-fields.ts`: Updates todo fields in lessons with proper format.

### Data Format Issues

- `fix-lexical-format.ts`: Repairs Lexical format issues in rich text content.
- `fix-edge-cases.ts`: Handles various edge cases not covered by other scripts.

### Media & Downloads

- `fix-bunny-video-ids.ts`: Updates Bunny video IDs in course lessons.

### Survey Integration

- `fix-survey-questions-population.ts`: Populates survey questions and fixes their relationships.
- `fix-survey-progress.ts`: Repairs issues with user survey progress tracking.

## Usage Examples

```bash
# Fix lesson todo fields
pnpm --filter @kit/content-migrations run fix:todo-fields

# Fix post image relationships
pnpm --filter @kit/content-migrations run fix:post-image-relationships

# Fix UUID tables structure
pnpm --filter @kit/content-migrations run fix:uuid-tables

# Fix Lexical format in rich text fields
pnpm --filter @kit/content-migrations run fix:lexical-format
```

## Adding New Repair Scripts

When creating new repair scripts:

1. Follow the `fix-*` naming convention
2. Focus on a single repair concern
3. Add robust error handling
4. Include logging of what was fixed
5. Add a script reference in package.json
6. Consider adding a corresponding verification script

## Dependencies

Most repair scripts depend on:

- Database access utilities in `src/utils/db`
- Payload client in `src/utils/payload`
- Type definitions in `src/types`
