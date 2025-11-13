# Supabase Content Migration Guide: Local to Remote

This document outlines the process for migrating content from your **local Supabase database** to the **remote Supabase database**. This is particularly useful for development workflows where content is created and tested locally before being deployed to production.

## Migration Approaches

### Schema Migration

1. **Schema Push**: We use the Supabase CLI to push schema changes to the remote database:

   ```bash
   supabase db push
   ```

   This successfully synchronizes the database schema (tables, columns, constraints, etc.) but does not migrate the actual data.

2. **Schema Verification**: We can verify that the schema has been successfully pushed by checking:

   ```bash
   supabase db diff
   ```

   If there are no differences, the schema is in sync.

### Content Migration

For migrating actual content/data (not just schema), we've implemented a flexible, collection-agnostic migration system:

## Current Implementation: Local to Remote Collection Migration

We've implemented a flexible migration system that transfers collection data from your **local Supabase database** to the **remote Supabase database**. This system can handle any Payload CMS collection with minimal configuration.

### Key Features

- Migrates collection data from **local development database** to **remote production database**
- Supports migration of any collection type stored in Supabase
- Handles different field structures automatically
- Provides options for batch processing and error handling
- Supports collection-specific data transformations
- Maintains idempotency (can be run multiple times safely)
- Includes verification to ensure all documents are properly migrated

### How It Works

1. Connects to both local and remote Payload CMS instances
2. Retrieves collection data from your local Supabase database
3. For each item, either creates a new record or updates an existing one in the remote database
4. Provides detailed logging of the migration process
5. Verifies that all documents were properly migrated

### Usage

#### Basic Usage

We provide two main approaches for migrating data:

1. **Standard Migration** - Updates existing documents and creates new ones:

```bash
pnpm --filter @kit/content-migrations migrate:collections:remote
```

2. **Clean Migration** - Removes all documents from remote before migrating (recommended for fixing issues):

```bash
pnpm --filter @kit/content-migrations cleanup:and:migrate:remote
```

> **Note for Windows Users**: All migration scripts use `cross-env` to ensure environment variables work correctly across all platforms, including Windows.

The cleanup and migrate command:

1. Deletes all existing documents from the remote database
2. Connects to your local Supabase database (using development environment variables)
3. Connects to your remote Supabase database (using production environment variables)
4. Transfers all documents from local to remote
5. Verifies that all documents were properly migrated

#### Adding a New Collection

To add a new collection to the migration process, update the `COLLECTIONS_TO_MIGRATE` array in `src/scripts/migrate-collections-local-to-remote.ts`:

```typescript
const COLLECTIONS_TO_MIGRATE = [
  {
    name: 'documentation',
    options: { matchField: 'slug', updateExisting: true },
  },
  {
    name: 'your-new-collection',
    options: { matchField: 'slug', updateExisting: true },
  },
];
```

#### Configuration Options

Each collection can be configured with the following options:

- `matchField`: Field to use for matching documents between local and remote (default: 'slug')
- `updateExisting`: Whether to update documents that already exist in the remote database (default: true)
- `skipExisting`: Whether to skip documents that already exist in the remote database (default: false)
- `batchSize`: Number of documents to process in each batch (default: 50)
- `transformData`: Optional function to transform document data before migration
- `logLevel`: Level of detail in logging ('minimal', 'normal', or 'verbose')

#### Custom Data Transformations

You can apply custom transformations to your data before migration:

```typescript
{
  name: 'blog',
  options: {
    matchField: 'slug',
    transformData: (data) => {
      // Remove sensitive data
      delete data.internalNotes;

      // Add migration metadata
      data.migratedAt = new Date().toISOString();

      return data;
    },
  },
}
```

#### Troubleshooting Migration Issues

If you encounter issues with the migration process, such as:

- Missing documents in the remote database
- Duplicate documents in the remote database
- Documents with incorrect content

The recommended approach is to use the cleanup and migrate script:

```bash
pnpm --filter @kit/content-migrations cleanup:and:migrate:remote
```

This script will:

1. Delete all existing documents from the remote database
2. Migrate all documents from the local database to the remote database
3. Verify that all documents were properly migrated

## Implementation Details

The migration system consists of several components:

1. **Utility Function**: `migrateCollectionLocalToRemote` in `utils/migrate-collection-local-to-remote.ts`
2. **Main Script**: `migrate-collections-local-to-remote.ts` in `scripts/`
3. **Enhanced Payload Client**: Updated to support environment-specific connections and query filtering

### Technical Architecture

```
packages/content-migrations/
├── src/
│   ├── utils/
│   │   ├── migrate-collection-local-to-remote.ts  # Core migration utility
│   │   └── payload-client.ts                      # Enhanced Payload client
│   └── scripts/
│       └── migrate-collections-local-to-remote.ts # Main migration script
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:

   - Ensure your PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD are correct in both .env.development and .env.production
   - Verify that the user has appropriate permissions in both environments

2. **Connection Issues**:

   - Check that both local and remote Payload CMS servers are running
   - Verify the PAYLOAD_PUBLIC_SERVER_URL in both environment files

3. **Data Validation Errors**:
   - If documents fail to migrate due to validation errors, use the transformData option to modify the data to meet the validation requirements

### Logging and Debugging

The migration system provides detailed logging at different levels:

- `minimal`: Only essential information and errors
- `normal`: Standard progress information (default)
- `verbose`: Detailed information about each document processed

## Next Steps

1. **Automate Migrations**:

   - Consider integrating migrations into your CI/CD pipeline
   - Create a pre-deployment check to ensure content is synchronized

2. **Extend to Other Collections**:

   - Add more collections to the migration process as needed
   - Implement collection-specific transformations for complex data

3. **Monitoring and Reporting**:
   - Enhance logging and reporting for better visibility into migration status
   - Implement notification mechanisms for failed migrations
