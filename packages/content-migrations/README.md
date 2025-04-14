# Content Migrations System

This package manages the migration of content into Payload CMS for the SlideHeroes application.

## Overview

The content migration system handles the extraction, transformation, and loading of content from various sources into Payload CMS tables. It provides a structured approach to manage:

- Course content (lessons, quizzes, downloads)
- Blog posts and documentation
- Surveys and feedback mechanisms
- Media files and relationships

## System Architecture

The system is organized into several logical components:

```
packages/content-migrations/
├─ src/
│  ├─ data/             # Content data (raw and processed)
│  │  ├─ raw/           # Raw source content
│  │  ├─ definitions/   # Schema definitions
│  │  ├─ mappings/      # ID and field mappings
│  │  └─ processed/     # Processed output (JSON and SQL)
│  │
│  ├─ scripts/          # Migration scripts
│  │  ├─ processing/    # Scripts for processing raw data
│  │  │  ├─ raw-data/   # Process raw content data
│  │  │  └─ sql/        # Generate SQL files
│  │  ├─ loading/       # Scripts for loading content
│  │  │  ├─ migration/  # Core migration scripts
│  │  │  ├─ import/     # Import scripts for external data
│  │  │  └─ repair/     # Relationship and data fixes
│  │  ├─ verification/  # Scripts to verify data integrity
│  │  └─ repair/        # Scripts to fix data issues
│  │
│  ├─ utils/            # Utility functions
│  │  ├─ db/            # Database utilities
│  │  ├─ file/          # File system utilities
│  │  └─ payload/       # Payload-specific utilities
│  │
│  └─ types/            # TypeScript type definitions
```

## Migration Process

The migration process follows these phases, orchestrated by the root-level `reset-and-migrate.ps1` script:

1. **Setup**: Reset database and initialize schema

   - Reset Supabase database
   - Apply Payload migrations

2. **Processing**: Transform raw content into a format suitable for import

   - Process raw data (YAML, Markdown, etc.)
   - Generate SQL seed files

3. **Loading**: Populate database with processed content

   - Execute SQL seed files
   - Run direct migrations for complex content
   - Import external content (e.g., downloads from R2 bucket)

4. **Verification**: Ensure content integrity
   - Verify relationships between content items
   - Check media references
   - Validate content formatting

## Key Scripts

### Processing Scripts

- `process-raw-data.ts`: Process raw content data into processed formats
- `generate-sql-seed-files.ts`: Generate SQL seed files for database population
- `generate-full-lesson-metadata.ts`: Generate metadata for course lessons

### Repair Scripts

- `fix-uuid-tables.ts`: Fix UUID table structure
- `fix-lesson-todo-fields.ts`: Fix lesson todo fields
- `fix-quiz-id-consistency.ts`: Ensure quiz IDs are consistent
- `fix-post-image-relationships.ts`: Fix relationships between posts and images

### Verification Scripts

- `verify-post-content.ts`: Verify post content integrity
- `verify-uuid-tables.ts`: Verify UUID table structure
- `verify-all.ts`: Run all verification scripts

## Usage

### Running the Full Migration

The recommended way to run the content migration is via the root-level script:

```bash
# From the project root
./reset-and-migrate.ps1
```

### Running Individual Phases

You can also run individual phases or scripts:

```bash
# Process raw data
pnpm --filter @kit/content-migrations run process:raw-data

# Generate SQL seed files
pnpm --filter @kit/content-migrations run generate:updated-sql

# Import downloads from R2 bucket
pnpm --filter @kit/content-migrations run import:downloads

# Verify all relationships
pnpm --filter @kit/content-migrations run verify:all
```

## Development

### Adding New Content

1. Add raw content to the appropriate directory in `src/data/raw/`
2. Update processing scripts if needed
3. Run the migration process to test

### Creating New Scripts

Follow these naming conventions:

- `fix-*`: Scripts that repair data issues
- `verify-*`: Scripts that verify data integrity
- `migrate-*`: Scripts that perform migrations
- `generate-*`: Scripts that generate output files
- `process-*`: Scripts that transform data

Place scripts in the appropriate directory based on their function.

## Troubleshooting

1. Check migration logs in `z.migration-logs/`
2. Run verification scripts to identify specific issues
3. Check database state with direct queries
4. Run specific repair scripts as needed
