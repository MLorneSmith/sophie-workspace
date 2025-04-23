# Processing Scripts

This directory contains scripts that handle more complex data processing and transformation operations during the content migration process. These scripts focus on preparing data structures that will be used by the migration system.

## Directory Structure

The processing scripts are organized into the following subdirectories:

### Raw Data

Scripts in the `raw-data/` directory handle the initial processing of raw content:

- `create-full-lesson-metadata.ts` - Creates comprehensive metadata for lessons from various source files
- `generate-full-lesson-metadata.ts` - Generates complete lesson metadata in YAML format

### SQL

Scripts in the `sql/` directory generate SQL statements used in migrations:

- `generate-sql-seed-files.ts` - Generates SQL seed files from YAML-based content definitions

## Usage

These scripts are typically run as part of the content migration process through `reset-and-migrate.ps1`. They can also be executed directly via their corresponding npm scripts defined in `package.json`.

For example:

```bash
pnpm run create:lesson-metadata-yaml
pnpm run generate:updated-sql
```

Or directly via the content-migrations package:

```bash
pnpm --filter @kit/content-migrations run create:lesson-metadata-yaml
```
