# Verification Scripts

This directory contains scripts for verifying data integrity in the Payload CMS database.

## Purpose

Verification scripts validate that:

1. Content data is complete and properly formatted
2. Relationships between content items are established correctly
3. Database schema is properly configured
4. Media references are valid and accessible

These scripts help identify issues that might need to be addressed by repair scripts.

## When to Use

Run verification scripts:

- After running the full content migration process
- Before deploying content to production
- When troubleshooting content display issues
- After making changes to repair scripts
- When adding new content types

## Available Scripts

### Core Verification

- `verify-all.ts`: Runs all verification scripts in sequence
- `verify-schema.ts`: Verifies the database schema structure
- `verify-table.ts`: Verifies that specific tables exist

### Content Verification

- `verify-post-content.ts`: Verifies that blog post content is complete
- `verify-post-migration.ts`: Verifies post-migration integrity
- `verify-todo-fields.ts`: Verifies lesson todo fields

### Structural Verification

- `verify-uuid-tables.ts`: Verifies UUID table structure
- `verify-relationship-columns.ts`: Verifies relationship column existence
- `verify-course-lessons.ts`: Verifies course lesson integrity
- `verify-media-columns.ts`: Verifies media reference columns

## Usage Examples

```bash
# Run all verification scripts
pnpm --filter @kit/content-migrations run verify:all

# Verify course lessons
pnpm --filter @kit/content-migrations run verify:course-lessons

# Verify blog post content integrity
pnpm --filter @kit/content-migrations run verify:post-content

# Verify database schema
pnpm --filter @kit/content-migrations run verify:schema
```

## Understanding Verification Results

Verification scripts use the following indicators in their output:

- ✅ **Success**: Indicates that the verification passed without issues
- ⚠️ **Warning**: Indicates minor issues that may need attention but won't break functionality
- ❌ **Error**: Indicates critical issues that should be fixed

Example output:

```
Verifying post content...
Found 9 posts in the database.

Verifying post: 4 Powerful Tools to Improve Your Presentation
Content JSON length: 2983 bytes
Number of top-level nodes: 15
✅ Content appears complete

Verifying post: In Defense of PowerPoint
Content JSON length: 499 bytes
Number of top-level nodes: 2
⚠️ Content looks potentially truncated
```

## Adding New Verification Scripts

When creating new verification scripts:

1. Follow the `verify-*` naming convention
2. Include clear success/warning/error indicators
3. Output detailed information to help troubleshoot issues
4. Add script reference to package.json under verify-related scripts
5. Consider adding a corresponding repair script for detected issues

## Dependencies

Verification scripts typically depend on:

- Database access utilities in `src/utils/db`
- Payload client utilities in `src/utils/payload`
- Type definitions in `src/types`
