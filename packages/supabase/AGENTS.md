- **Storage buckets MUST validate access** using account_id in the path structure.
  See `apps/web/supabase/schemas/16-storage.sql` for proper implementation.
- **Use locks if required**: Database locks prevent race conditions and timing attacks in concurrent operations.
  Make sure to take these into account for all database operations.
- **Never modify database.types.ts**: Instead, use the Supabase CLI using our package.json scripts
  to re-generate the types after resetting the DB

- **Type safety**: Always regenerate types after schema changes
