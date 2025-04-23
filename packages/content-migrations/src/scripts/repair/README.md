# Repair Scripts

This directory contains scripts that fix various issues in the database and data. These scripts are organized into subdirectories based on their functionality.

## Directory Structure

```
repair/
├── database/                   # Database structure and relationship fixes
├── content-format/             # Content formatting fixes (Lexical, todo fields)
├── quiz-management/            # Quiz-related relationship and ID fixes
├── media-downloads/            # Media and download integration scripts
├── survey-management/          # Survey questions and progress scripts
└── utilities/                  # General purpose utility scripts
```

## Usage Pattern

All scripts are exposed as npm scripts in the `package.json` file, so they can be run with:

```bash
pnpm run fix:<script-name>
```

## Organizational Principles

The repair scripts are organized based on:

1. **Functionality**: Scripts are grouped by the type of data or system they repair
2. **Dependency**: Scripts that depend on each other are placed in the same directory
3. **Logical Flow**: The directory structure follows the natural flow of the migration process

## Database Directory

Contains scripts for fixing database-level issues such as UUID tables, relationship columns, and ensuring proper database structure.

## Content Format Directory

Contains scripts for fixing formatting issues in content fields, especially Lexical editor format issues and todo fields.

## Quiz Management Directory

Contains specialized scripts for fixing quiz-related relationships, including:

- Quiz ID consistency
- Quiz-question relationships
- Course-quiz relationships
- Quiz references from lessons

## Media Downloads Directory

Contains scripts for fixing media-related issues, including:

- Download relationships
- R2 bucket integration
- Bunny video IDs
- Post image relationships

## Survey Management Directory

Contains scripts for handling survey data, including:

- Survey questions population
- Survey progress tracking

## Utilities Directory

Contains general-purpose utility scripts that don't fit into the other categories.
