# Content Migration Optimization Plan

## Overview

This document outlines the implementation plan for optimizing the content migration system by separating the data processing step from the database migration process. This separation will improve efficiency by ensuring raw data is only processed once, rather than on every migration run.

## Current Issues

1. **Redundant Processing**: Raw data is processed on every migration run, though it only needs to be done once.
2. **Path References**: Code hasn't been updated to reference the new consolidated location of raw data in `packages/content-migrations/src/data/raw/`.
3. **Process Integration**: The data processing step is tightly coupled with the database migration process.

## Implementation Plan

### 1. Create Processed Data Directory

Create a `processed` directory alongside the `raw` directory to store the output of the one-time processing step.

```
packages/content-migrations/src/data/
├── raw/         # Original raw data files (.mdoc, .yaml)
└── processed/   # Processed data ready for migration
    ├── sql/     # SQL seed files
    └── json/    # JSON data for direct insertion
```

### 2. Develop Processing Scripts

Create a standalone script to process raw data into SQL seed files and other migration-ready assets:

- `process-raw-data.ts`: Main script to process all raw data
- Support for individual content type processing
- Validation to ensure data integrity

### 3. Update Path References

Modify all scripts to reference the new consolidated data locations:

- Update import paths in migration scripts
- Use relative paths from a central configuration

### 4. Modify Migration Process

Update `reset-and-migrate.ps1` to use pre-processed data:

- Remove redundant processing steps
- Add clear documentation on the separation of concerns
- Include option to regenerate processed data when needed

### 5. Documentation

Create clear documentation on the content update workflow:

- When to run processing vs. migration
- How to add new content
- How to update existing content

## Implementation Steps

1. Create the processed data directory structure
2. Develop the processing scripts
3. Update path references in existing scripts
4. Modify the migration process
5. Create documentation
6. Test the new workflow

## Benefits

- **Efficiency**: Raw data is only processed once, reducing migration time
- **Reliability**: Reduces potential for errors during migration
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Easier to update content without running full migrations
