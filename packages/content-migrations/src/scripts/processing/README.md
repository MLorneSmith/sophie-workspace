# Processing Scripts

This directory contains scripts responsible for processing raw content data into formats suitable for database import.

## Purpose

Processing scripts transform content from its raw format (YAML, Markdown, HTML, etc.) into structured data that can be loaded into the Payload CMS database. These scripts handle:

1. Raw data transformation
2. SQL seed file generation
3. ID consistency management
4. Metadata extraction

## Directory Structure

- **raw-data/**: Scripts that process raw content data files

  - `generate-full-lesson-metadata.ts`: Generates complete metadata for course lessons
  - `process-lesson-todo-html.ts`: Processes lesson todo fields from HTML into structured data

- **sql/**: Scripts that generate SQL seed files
  - `generate-sql-seed-files.ts`: Main script for generating all SQL seed files

## Key Processing Flows

### Lesson Processing Flow

1. Raw lesson content (Markdown/YAML) is read
2. Metadata is extracted and enhanced
3. Todo fields are processed from HTML to structured JSON
4. SQL statements are generated for database import

### SQL Generation Flow

1. Processed content is read from processed data directory
2. SQL statements are generated for each content type
3. SQL files are written to the Payload seed directory
4. Foreign key references are established between related content

## Usage Examples

```bash
# Generate full lesson metadata
pnpm --filter @kit/content-migrations run generate:yaml-metadata

# Process HTML todo content
pnpm --filter @kit/content-migrations run process:lesson-todo-html

# Generate SQL seed files
pnpm --filter @kit/content-migrations run generate:updated-sql
```

## Adding New Processing Scripts

When creating new processing scripts:

1. Follow naming conventions:

   - `generate-*`: For scripts that generate output files
   - `process-*`: For scripts that transform data

2. Use the appropriate subdirectory:

   - `raw-data/` for scripts processing raw content
   - `sql/` for scripts generating SQL

3. Add appropriate script references to package.json

4. Consider dependencies on other processing steps

## Dependencies

Processing scripts may depend on:

- Raw data in `src/data/raw/`
- Mapping definitions in `src/data/mappings/`
- UUID definitions for content items
- File system utilities for reading/writing files
