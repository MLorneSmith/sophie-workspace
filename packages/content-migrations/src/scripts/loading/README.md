# Loading Scripts

This directory contains scripts responsible for the loading phase of the content migration system.

## Purpose

The loading phase is responsible for:

1. Running content migrations via Payload migrations
2. Importing external content (like downloads from R2 bucket)
3. Fixing relationships and ensuring data integrity
4. Performing post-migration verification

## Subdirectories

- **migration/**: Scripts for migrating content into Payload CMS
- **import/**: Scripts for importing external content (e.g., files from storage buckets)
- **repair/**: Scripts for fixing relationships and data issues post-migration

## Key Scripts

- `migrate-posts.ts`: Migrates blog posts with complete content
- `import-downloads.ts`: Imports downloads from R2 bucket
- `fix-post-image-relationships.ts`: Fixes relationships between posts and images

## Execution Flow

These scripts are typically executed as part of the Loading Phase of the main `reset-and-migrate.ps1` script after the database schema has been created and the basic content has been imported.

## Dependencies

- Requires the Payload CMS database schema to be initialized
- Requires SQL seed files to be generated and executed
- Some scripts may require environment variables set in `.env.development`
- May require access to external services (e.g., R2 storage bucket)

## Example Usage

```bash
# Import downloads from R2 bucket
pnpm run import:downloads

# Migrate blog posts
pnpm run migrate:posts

# Fix post image relationships
pnpm run fix:post-image-relationships
```
