# Content Migrations

This package contains scripts for migrating content from various sources to the Payload CMS collections in our Makerkit-based Next.js 15 application.

## Overview

The content migration system is designed to:

1. Migrate course lessons from Markdown files to Payload CMS
2. Migrate course quizzes from Markdown files to Payload CMS
3. Migrate quiz questions from Markdown files to Payload CMS
4. Migrate documentation from Markdown files to Payload CMS
5. Migrate blog posts from Markdown files to Payload CMS

## Fixed Migration Scripts

We've created fixed versions of the migration scripts to address the following issues:

1. **Missing Unique Constraint**: Added a unique constraint on the `quiz_id` and `question` columns in the `quiz_questions` table to support the `ON CONFLICT` clause in the migration scripts.
2. **UUID Format Issues**: Added validation to ensure all IDs are in proper UUID format for PostgreSQL.
3. **Schema Inconsistencies**: Fixed field naming inconsistencies between the code and database schema.
4. **Error Handling**: Improved error handling and logging in the migration scripts.
5. **Admin User Creation**: Added a script to create an admin user directly in the PostgreSQL database without requiring the Payload server to be running.
6. **Direct Database Access**: Converted all scripts to use direct database access instead of the Payload API, eliminating the need to start the Payload server during migrations.

## Running the Migrations

### Using the Reset Script

The easiest way to run all migrations is to use the `reset-and-migrate.ps1` script in the root directory:

```powershell
./reset-and-migrate.ps1
```

This script will:

1. Reset the Supabase database
2. Run the Web app migrations
3. Run the Payload migrations
4. Create an admin user (michael@slideheroes.com)
5. Run the fixed content migration scripts
6. Repair all relationships

### Running Individual Migration Scripts

You can also run individual migration scripts using the following commands:

```bash
# Test the environment
pnpm run test:env

# Test the database connection
pnpm run test:db

# Create an admin user directly in the database
pnpm run create:admin:direct

# Run all migrations with the fixed scripts
pnpm run migrate:all:direct:fixed

# Run individual fixed migration scripts
pnpm run migrate:quiz-questions:direct:fixed

# Repair relationships
pnpm run repair:all-relationships
```

## Troubleshooting

If you encounter issues with the migration scripts, try the following:

1. **Database Connection Issues**: Ensure the `DATABASE_URI` environment variable is correctly set in the `.env.development` file.
2. **UUID Format Issues**: Check that all IDs in the database are in proper UUID format.
3. **Missing Constraints**: Verify that the unique constraint on the `quiz_questions` table has been created.
4. **Relationship Issues**: Run the `repair:all-relationships` script to fix any missing relationships.

## Migration Sequence

The migration scripts are executed in the following order:

1. Test database connection and schema
2. Create admin user
3. Migrate course lessons
4. Migrate course quizzes
5. Migrate quiz questions (using the fixed script)
6. Fix relationships
7. Migrate documentation
8. Migrate blog posts
9. Migrate additional quizzes from Payload data
10. Final database connection test

## Database Schema

The migration scripts interact with the following tables in the `payload` schema:

- `users`: Stores user accounts for Payload CMS
- `course_quizzes`: Stores quiz metadata (title, description, passing score)
- `quiz_questions`: Stores quiz questions with a foreign key to `course_quizzes`
- `quiz_questions_options`: Stores quiz question options with a foreign key to `quiz_questions`
- `course_lessons`: Stores course lessons
- `documentation`: Stores documentation content
- `posts`: Stores blog posts

## Environment Variables

The migration scripts require the following environment variables to be set in the `.env.development` file:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
```
