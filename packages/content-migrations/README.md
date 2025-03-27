# Content Migrations for Payload CMS

This package provides utilities and scripts for migrating content from various sources to Payload CMS collections.

## Overview

The content-migrations package is designed to help migrate content from existing sources (files, databases, etc.) to Payload CMS collections in our application. It provides reusable utilities and scripts for different types of content migrations.

## Environment Setup

### Required Environment Variables

The migration scripts require the following environment variables:

- `DATABASE_URI`: The connection string for the Supabase database
- `PAYLOAD_SECRET`: The secret key for Payload CMS
- `PAYLOAD_PUBLIC_SERVER_URL`: The URL of the Payload CMS server
- `PAYLOAD_ADMIN_EMAIL`: The email of the Payload CMS admin user
- `PAYLOAD_ADMIN_PASSWORD`: The password of the Payload CMS admin user

### Environment-Specific Configuration

For different environments (development, production), we use environment-specific `.env` files:

- `.env.development` - For local development environment
- `.env.production` - For production environment

## Available Scripts

### Testing Environment

```bash
pnpm test:env
```

Tests that environment variables are properly loaded.

### Cleaning Up Collections

```bash
pnpm cleanup:collections
```

Cleans up existing data in Payload CMS collections before running migrations.

### Running All Migrations

```bash
pnpm migrate:all
```

Runs all content migrations in the correct order.

### Clean Up and Migrate All

```bash
pnpm cleanup:and:migrate:all
```

Cleans up existing data in Payload CMS collections and then runs all migrations.

### Individual Migration Scripts

```bash
pnpm migrate:docs
pnpm migrate:posts
pnpm create:course
pnpm migrate:course-lessons
pnpm migrate:course-quizzes
pnpm migrate:quiz-questions
```

Run individual migration scripts for specific collections.

### Remote Migration

```bash
pnpm migrate:collections:remote
```

Migrates collections from local Supabase database to remote Supabase database.

### Clean Up and Migrate Remote

```bash
pnpm cleanup:and:migrate:remote
```

Cleans up existing data in remote Payload CMS collections and then migrates collections from local to remote.

## Migration Process

The migration process follows these steps:

1. **Environment Setup**: Configure environment variables for the target environment.
2. **Schema Validation**: Validate that all collections exist in the Payload CMS schema.
3. **Cleanup (Optional)**: Clean up existing data in collections before migration.
4. **Data Migration**: Migrate data from source files or databases to Payload CMS collections.
5. **Verification**: Verify that data was migrated correctly.
6. **Remote Migration (Optional)**: Migrate data from local to remote environment.

## Available Collections

The following collections are available for migration:

- `documentation`: Documentation content
- `posts`: Blog posts
- `courses`: Course information
- `course_lessons`: Course lessons
- `course_quizzes`: Course quizzes
- `quiz_questions`: Quiz questions
- `quiz_questions_options`: Quiz question options
- `media`: Media files

## Data Sources

The migration scripts use the following data sources:

- Documentation: `apps/payload/data/documentation/*.mdoc`
- Blog Posts: `apps/web/content/posts/*.mdoc`
- Course Lessons: `apps/payload/data/courses/lessons/*.mdoc`
- Course Quizzes: `apps/payload/data/courses/quizzes/*.mdoc`

## Troubleshooting

If you encounter issues with the migrations:

- Run the `test:env` script to check that environment variables are properly loaded
- Ensure that the Payload CMS server is running
- Check the database connection
- Look for error messages in the console output
- Try running individual migration scripts to isolate the issue
