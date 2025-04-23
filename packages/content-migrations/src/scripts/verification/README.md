# Verification Scripts

This directory contains scripts that verify the integrity and correctness of database structures, data, and relationships as part of the content migration system.

## Available Scripts

- `verify-all.ts` - Comprehensive verification of all database structures and relationships
- `verify-course-lessons.ts` - Verifies the course_lessons table structure and relationships
- `verify-media-columns.ts` - Verifies media_id columns across relevant tables
- `verify-post-content.ts` - Verifies the integrity of post content after migration
- `verify-post-migration.ts` - General verification after migration has completed
- `verify-quiz-system-integrity.ts` - Verifies the integrity of the quiz system
- `verify-relationship-columns.ts` - Verifies relationship columns across tables
- `verify-schema.ts` - Verifies that required database schemas exist
- `verify-table.ts` - Verifies that specific tables exist in the database
- `verify-todo-fields.ts` - Verifies todo fields in course lessons
- `verify-uuid-tables.ts` - Verifies UUID tables structure and columns

## Usage

These scripts are typically run as part of the content migration process through `reset-and-migrate.ps1`. They can also be executed directly via their corresponding npm scripts defined in `package.json`.

For example:

```bash
pnpm run verify:all
pnpm run verify:schema payload
pnpm run verify:table payload courses
```

Or directly via the content-migrations package:

```bash
pnpm --filter @kit/content-migrations run verify:all
```
