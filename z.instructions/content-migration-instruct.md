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

### Setting Up Environment Variables

1. Create a `.env` file in the root of the content-migrations package:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
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

To run all content migrations:

```bash
pnpm --filter @kit/content-migrations migrate:all
```

To run a specific migration:

```bash
pnpm --filter @kit/content-migrations migrate:docs
```

## Available Migrations

### Documentation Migration

Migrates documentation from Markdown files to the Payload CMS documentation collection.

```bash
pnpm --filter @kit/content-migrations migrate:docs
```

## Utilities

The package provides the following utility functions:

### `convertMarkdownToLexical`

Converts Markdown content to a Lexical editor compatible format.

```typescript
import { convertMarkdownToLexical } from '@kit/content-migrations';

const lexicalContent = convertMarkdownToLexical('# Heading\n\nParagraph text');
```

### `getPayloadClient`

Gets a Payload CMS client instance for interacting with Payload CMS.

```typescript
import { getPayloadClient } from '@kit/content-migrations';

const payload = await getPayloadClient();
```

## Adding New Migrations

To add a new migration:

1. Create a new script in the `src/scripts` directory
2. Add any necessary utility functions to the `src/utils` directory
3. Update the `migrate-all.ts` script to include the new migration
4. Add a new script to `package.json` to run the migration directly

## Troubleshooting

If you encounter issues with the migrations:

- Run the `test:env` script to check that environment variables are properly loaded
- Ensure that the Payload CMS server is running
- Check the database connection
- Look for error messages in the console output
