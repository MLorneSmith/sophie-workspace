# Content Migration System

This package provides tools for migrating content from various sources to the Payload CMS collections in our Makerkit-based Next.js 15 application.

## Overview

The content migration system is designed to:

1. Process raw data files (`.mdoc`, `.yaml`, etc.) into a standardized format
2. Generate SQL seed files for database population
3. Provide utilities for verifying and repairing database state

## Directory Structure

```
packages/content-migrations/
├── src/
│   ├── config/           # Configuration files
│   ├── data/             # Data files
│   │   ├── raw/          # Raw data files (.mdoc, .yaml)
│   │   └── processed/    # Processed data ready for migration
│   │       ├── sql/      # SQL seed files
│   │       └── json/     # JSON data for direct insertion
│   ├── scripts/          # Migration scripts
│   │   ├── core/         # Core migration scripts
│   │   ├── process/      # Data processing scripts
│   │   ├── repair/       # Repair scripts
│   │   ├── sql/          # SQL-related scripts
│   │   ├── utils/        # Utility scripts
│   │   └── verification/ # Verification scripts
│   └── utils/            # Utility functions
└── README.md             # This file
```

## Workflow

The content migration workflow consists of two main phases:

### 1. Data Processing (One-time)

This phase processes the raw data files and generates processed data files that can be used by the migration scripts. This is a one-time operation that only needs to be run when the raw data changes.

```
Raw Data Files (.mdoc, .yaml) → Processing Scripts → Processed Data (SQL, JSON)
```

### 2. Database Migration (Repeatable)

This phase uses the processed data to populate the database tables. This can be run multiple times without reprocessing the raw data.

```
Processed Data → Migration Scripts → Database Tables
```

## Usage

### Processing Raw Data

To process the raw data files, run:

```bash
pnpm run process:raw-data
```

This will:

1. Validate that all required raw data directories exist
2. Process the raw data files into SQL seed files
3. Copy the SQL seed files to the processed data directory
4. Create a metadata file with the processing timestamp

### Validating Raw Data

To validate that all required raw data directories exist without processing the data, run:

```bash
pnpm run process:validate
```

### Running Migrations

The migrations are integrated with the `reset-and-migrate.ps1` script at the root of the project. This script will:

1. Reset the Supabase database
2. Run Web app migrations
3. Run Payload migrations
4. Check if processed data exists and use it, or generate it if it doesn't exist
5. Run content migrations via Payload migrations
6. Verify database state

To run the migrations, execute:

```bash
./reset-and-migrate.ps1
```

## Scripts

### Core Scripts

- `migrate:all`: Run all direct migrations
- `migrate:course-lessons`: Migrate course lessons
- `migrate:course-quizzes`: Migrate course quizzes
- `migrate:quiz-questions`: Migrate quiz questions
- `migrate:posts`: Migrate blog posts
- `migrate:docs`: Migrate documentation

### Process Scripts

- `process:raw-data`: Process all raw data files
- `process:validate`: Validate raw data directories

### SQL Scripts

- `sql:generate-seeds`: Generate SQL seed files
- `sql:run-seeds`: Run SQL seed files
- `sql:verify-schema`: Verify database schema
- `sql:add-relationship-id-columns`: Add relationship ID columns to tables

### Verification Scripts

- `verify:all`: Verify all relationships
- `verify:course-lessons`: Verify course lessons quiz_id_id column
- `verify:media-columns`: Verify media ID columns
- `verify:database`: Verify database schema
- `verify:schema`: Verify schema exists
- `verify:table`: Verify table exists

### Repair Scripts

- `repair:edge-cases`: Repair edge cases
- `repair:relationships`: Fix relationships
- `repair:all-relationships`: Repair all relationships

## Adding New Content

When adding new content:

1. Add the raw data files to the appropriate directory in `src/data/raw/`
2. Run `pnpm run process:raw-data` to process the new data
3. Run `./reset-and-migrate.ps1` to apply the migrations

## Updating Existing Content

When updating existing content:

1. Update the raw data files in `src/data/raw/`
2. Run `pnpm run process:raw-data` to reprocess the data
3. Run `./reset-and-migrate.ps1` to apply the migrations

## Benefits of This Approach

- **Efficiency**: Raw data is only processed once, reducing migration time
- **Reliability**: Reduces potential for errors during migration
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Easier to update content without running full migrations
- **Consistency**: Standardized approach for all content types
- **Verifiability**: Easier to verify and validate the migration process
