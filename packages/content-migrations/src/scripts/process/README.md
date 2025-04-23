# Process Scripts

This directory contains scripts that process raw data into formats needed for the content migration system. These scripts focus on transforming and preparing content before it's loaded into the database.

## Available Scripts

- `parse-lesson-todo-html.ts` - Parses HTML todo content from lesson data and updates the YAML metadata with structured todo information
- `process-raw-data.ts` - Main entry point for the raw data processing pipeline
- `validate-raw-data.ts` - Validates the structure and format of raw data before processing

## Usage

These scripts are typically run as part of the content migration process through `reset-and-migrate.ps1`. They can also be executed directly via their corresponding npm scripts defined in `package.json`.

For example:

```bash
pnpm run process:parse-lesson-todo-html
pnpm run process:raw-data
```

Or directly via the content-migrations package:

```bash
pnpm --filter @kit/content-migrations run process:parse-lesson-todo-html
```
