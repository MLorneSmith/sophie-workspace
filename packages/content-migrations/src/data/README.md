# Content Migration Data

This directory contains data files used by the content migration system.

## Directory Structure

```
data/
├─ raw/              # Raw input data in various formats
│  ├─ courses/       # Course content (lessons, quizzes)
│  ├─ documentation/ # Documentation content
│  ├─ posts/         # Blog posts content
│  └─ surveys/       # Survey questions and structure
├─ definitions/      # Schema definitions and type declarations
├─ mappings/         # ID and field mappings between sources
└─ processed/        # Processed output generated during migration
   ├─ json/          # Intermediate JSON files
   └─ sql/           # Generated SQL files for database seeding
```

## Data Flow

1. **Raw data** files (like .mdoc, .yaml, .html) provide the content sources
2. **Definitions** provide the structure and types for content
3. **Mappings** ensure consistent IDs and relationships between different content types
4. **Processing scripts** transform raw data into SQL and JSON formats
5. **SQL files** are executed to seed the database during migration

## Content Types

- **Courses and Lessons**: Course structure, lesson content, and metadata
- **Quizzes**: Quiz questions and answers
- **Surveys**: Survey questions and structure
- **Documentation**: Help and documentation content
- **Posts**: Blog posts and other marketing content

## Data Formats

- **.mdoc**: Markdown files with front matter for metadata
- **.yaml**: YAML files for structured data
- **.html**: HTML content for rich text
- **.json**: Processed JSON data
- **.sql**: SQL files for database seeding

## Data Validation

The migration system includes validation steps to ensure data integrity:

1. Raw data validation during the processing phase
2. Schema validation when generating SQL
3. Database verification after migration
