# Content Migrations

This package provides utilities and scripts for migrating content from various sources to Payload CMS collections.

## Overview

The content-migrations package is designed to help migrate content from existing sources (files, databases, etc.) to Payload CMS collections in our application. It provides reusable utilities and scripts for different types of content migrations.

## Installation

This package is part of the monorepo and is automatically installed when you run `pnpm install` at the root of the project.

## Environment Setup

### Required Environment Variables

The migration scripts require the following environment variables:

- `DATABASE_URI`: The connection string for the Supabase database
- `PAYLOAD_SECRET`: The secret key for Payload CMS
- `PAYLOAD_PUBLIC_SERVER_URL`: The URL of the Payload CMS server
- `PAYLOAD_ADMIN_EMAIL`: The email of the Payload CMS admin user
- `PAYLOAD_ADMIN_PASSWORD`: The password of the Payload CMS admin user

### Setting Up Environment Variables

1. Create a `.env` file in the root of the content-migrations package:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=your-password
```

2. Test that the environment variables are properly loaded:

```bash
pnpm --filter @kit/content-migrations test:env
```

### Environment-Specific Configuration

For different environments (development, staging, production), you can create environment-specific `.env` files:

- `.env.development`
- `.env.production`

And load them based on the `NODE_ENV` variable.

## Usage

### Running Migrations

To run all content migrations with the enhanced client:

```bash
pnpm --filter @kit/content-migrations migrate:enhanced
```

To run a specific migration:

```bash
pnpm --filter @kit/content-migrations migrate:course-lessons
```

To clean up collections before migration:

```bash
pnpm --filter @kit/content-migrations cleanup:collections
```

## Available Migrations

### Documentation Migration

Migrates documentation from Markdown files to the Payload CMS documentation collection.

```bash
pnpm --filter @kit/content-migrations migrate:docs
```

### Course Lessons Migration

Migrates course lessons from Markdown files to the Payload CMS course_lessons collection.

```bash
pnpm --filter @kit/content-migrations migrate:course-lessons
```

### Course Quizzes Migration

Migrates course quizzes from Markdown files to the Payload CMS course_quizzes collection.

```bash
pnpm --filter @kit/content-migrations migrate:course-quizzes
```

### Quiz Questions Migration

Migrates quiz questions from Markdown files to the Payload CMS quiz_questions collection.

```bash
pnpm --filter @kit/content-migrations migrate:quiz-questions
```

## Utilities

The package provides the following utility functions:

### `getEnhancedPayloadClient`

Gets an enhanced Payload CMS client instance with token caching and retry logic.

```typescript
import { getEnhancedPayloadClient } from '@kit/content-migrations/utils/enhanced-payload-client';

const payload = await getEnhancedPayloadClient();
```

### `convertMarkdownToLexical`

Converts Markdown content to a Lexical editor compatible format.

```typescript
import { convertMarkdownToLexical } from '@kit/content-migrations';

const lexicalContent = convertMarkdownToLexical('# Heading\n\nParagraph text');
```

## Enhanced Migration System

We've implemented an enhanced migration system to handle authentication issues, rate limiting, and provide better error handling and reporting.

### Enhanced Payload Client

The enhanced payload client (`enhanced-payload-client.ts`) provides the following features:

- Token caching to reduce authentication requests
- Retry logic with exponential backoff for failed requests
- Improved error handling and reporting
- Batch processing capabilities

### Enhanced Migration Script

The enhanced migration script (`migrate-enhanced.ts`) provides the following features:

- Runs migrations in a specific order based on dependencies
- Adds appropriate delays between operations to avoid rate limiting
- Implements proper error handling and recovery
- Adds progress tracking and reporting

## Adding New Migrations

To add a new migration:

1. Create a new script in the `src/scripts` directory
2. Add any necessary utility functions to the `src/utils` directory
3. Update the `migrate-enhanced.ts` script to include the new migration
4. Add a new script to `package.json` to run the migration directly

## Quiz Questions Fixing

The enhanced migration script (`migrate-enhanced.ts`) includes functionality to fix quiz questions by:

- Reading quiz files from the quizzes directory
- Parsing questions and their options
- Updating existing questions or creating new ones with the required options
- Adding default options if none are found

This functionality runs automatically as part of the enhanced migration process.

## Troubleshooting

If you encounter issues with the migrations:

### Authentication Issues

If you encounter authentication issues:

- Check that the `PAYLOAD_ADMIN_EMAIL` and `PAYLOAD_ADMIN_PASSWORD` environment variables are correct
- Use the enhanced payload client (`getEnhancedPayloadClient`) which includes token caching and retry logic
- Use the enhanced migration script (`migrate-enhanced.ts`) which adds delays between operations to avoid rate limiting

### Content Format Issues

If you encounter issues with the content format:

- Ensure that the Lexical content is properly formatted with the correct structure
- For rich text content, use the following format:
  ```typescript
  content: {
    root: {
      children: [...],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  }
  ```

### General Troubleshooting

- Run the `test:env` script to check that environment variables are properly loaded
- Run the `test:auth` script to check that authentication is working
- Ensure that the Payload CMS server is running
- Check the database connection
- Look for error messages in the console output
