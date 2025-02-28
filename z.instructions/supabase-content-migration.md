# Supabase Content Migration Guide

This document outlines the process for migrating content from a local Supabase database to a remote Supabase database, as well as the challenges we've encountered and solutions we've implemented.

## Current Process

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

For migrating actual content/data (not just schema), we've explored several approaches:

1. **Data Dump and Execute**:

   - We can dump data from specific tables in the local database:
     ```bash
     supabase db dump --data-only --local -f data_dump.sql --exclude [tables_to_exclude]
     ```
   - However, executing this dump on the remote database has proven challenging due to CLI version differences and command syntax issues.

2. **Custom Script Approach** (Recommended):
   - Create a TypeScript script that:
     - Connects to both local and remote Supabase instances
     - Fetches data from the local database
     - Inserts/upserts the data into the remote database
   - This approach provides more control and error handling

## Challenges and Solutions

### CLI Version Issues

**Challenge**: The installed Supabase CLI (v2.12.1) has different command syntax than the latest version (v2.15.8).

**Solution Options**:

1. ~~Update the Supabase CLI~~ - Not viable as global installation is not supported
2. Use custom scripts with the Supabase JavaScript client
3. Use direct database connections if possible

### Data Migration Specifics

**Challenge**: Different content types require different migration approaches.

**Solution**:

- Create specific migration scripts for each content type (testimonials, documentation, etc.)
- Use the Supabase admin client for write access to the remote database
- Implement proper error handling and logging

## Next Steps

1. **Create Migration Scripts**:

   - Implement a script for testimonials migration
   - Extend the approach to other content types as needed

2. **Determine Migration Triggers**:

   - Decide when migrations should run (manual, CI/CD, post-deployment)
   - Consider automating migrations as part of the deployment process

3. **Testing and Verification**:

   - Develop a process to verify successful migrations
   - Implement rollback mechanisms for failed migrations

4. **Documentation**:
   - Update this guide with successful approaches
   - Document any environment-specific considerations

## Example: Testimonials Migration Script

```typescript
// packages/content-migrations/src/scripts/migrate-testimonials.ts
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

async function migrateTestimonials() {
  console.log('Starting testimonials migration...');

  // Get local client
  const localClient = getSupabaseServerClient();

  // Get remote client (admin for write access)
  const remoteClient = getSupabaseServerAdminClient();

  try {
    // Get testimonials from local database
    const { data: testimonials, error } = await localClient
      .from('testimonials')
      .select('*');

    if (error) {
      throw error;
    }

    console.log(`Found ${testimonials.length} testimonials to migrate`);

    // Insert testimonials into remote database
    const { error: insertError } = await remoteClient
      .from('testimonials')
      .upsert(testimonials, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      throw insertError;
    }

    console.log('Successfully migrated testimonials to remote database');
  } catch (error) {
    console.error('Error migrating testimonials:', error);
  }
}

// Run the migration
migrateTestimonials();
```

## Conclusion

Content migration between Supabase instances requires a combination of CLI tools for schema synchronization and custom scripts for data migration. By following the approaches outlined in this document, we can ensure that both schema and content are properly synchronized between environments.
