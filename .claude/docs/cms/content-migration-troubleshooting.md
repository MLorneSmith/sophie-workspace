# Content Migration Troubleshooting

## Common Issues and Solutions

### Relationship Inconsistencies

**Symptoms:**

- API errors when fetching related content
- Missing relationships in admin UI
- Inconsistent query results

**Solutions:**

1. Run the relationship repair script:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:relationships
   ```

2. Verify relationship consistency:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:relationships
   ```

3. For persistent issues, use the consolidated fix:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:relationships:consolidated
   ```

### UUID Table Issues

**Symptoms:**

- Database errors about missing UUID columns
- Inconsistent UUID generation
- Foreign key constraint failures

**Solutions:**

1. Run the UUID table fix script:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:uuid-tables
   ```

2. For remote environments:

   ```powershell
   ./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipCore -SkipPosts -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads
   ```

### Migration Failures

**Symptoms:**

- Script errors during migration
- Incomplete data migration
- Database constraint violations

**Solutions:**

1. Check logs for specific error messages
2. Run with verbose output:

   ```powershell
   ./scripts/reset-and-migrate.ps1 -Verbose
   ```

3. Try running specific phases:

   ```powershell
   # Run only setup phase
   ./scripts/orchestration/phases/setup.ps1
   
   # Run only processing phase
   ./scripts/orchestration/phases/processing.ps1
   ```

4. For persistent issues, use the clean migration approach:

   ```powershell
   pnpm --filter @kit/content-migrations cleanup:and:migrate:remote
   ```

### Payload Schema Issues

**Symptoms:**

- Payload admin UI errors
- Missing fields or collections
- Schema validation errors

**Solutions:**

1. Reset Payload schema:

   ```powershell
   ./scripts/database-reset/apply-payload-migrations.sh
   ```

2. Check Payload migration files for errors
3. Verify schema consistency:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:schema
   ```

## Diagnostic Commands

### Database Inspection

Check database tables and relationships:

```sql
-- List all tables in payload schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'payload' 
ORDER BY table_name;

-- Check relationship tables
SELECT * FROM payload.posts_rels LIMIT 10;

-- Check for orphaned relationships
SELECT r.* 
FROM payload.posts_rels r
LEFT JOIN payload.posts p ON r.parent_id = p.id
WHERE p.id IS NULL;
```

### Content Verification

Verify content counts and integrity:

```powershell
# Verify all content
./scripts/remote-migration/content/verify-remote-content.ps1 -VerifyAll

# Verify specific content types
./scripts/remote-migration/content/verify-remote-content.ps1 -VerifyPosts -VerifyCourses
```

## Recovery Strategies

### Database Backup and Restore

Always create a backup before major migrations:

```bash
# Create backup
pg_dump -h localhost -U postgres -d your_database -f backup.sql

# Restore from backup
psql -h localhost -U postgres -d your_database -f backup.sql
```

### Incremental Migration

For large datasets, use incremental migration:

```powershell
# Migrate core tables first
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipPosts -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads

# Then migrate posts
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipCore -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads

# Continue with other content types
```

### Manual Fixes

For specific issues, use direct database fixes:

```sql
-- Fix missing relationship entries
INSERT INTO payload.posts_rels (id, parent_id, path, order, value, collection)
SELECT 
  uuid_generate_v4(), 
  p.id, 
  'category', 
  0, 
  p.category->>'id', 
  'categories'
FROM 
  payload.posts p
LEFT JOIN 
  payload.posts_rels r ON r.parent_id = p.id AND r.path = 'category'
WHERE 
  r.id IS NULL AND p.category IS NOT NULL;
```

## Prevention Strategies

1. **Regular Testing**: Test migrations in development before production
2. **Validation Scripts**: Run validation before and after migrations
3. **Incremental Approach**: Migrate in small, manageable chunks
4. **Logging**: Implement comprehensive logging for debugging
5. **Rollback Plan**: Always have a rollback strategy
6. **Documentation**: Document all custom migration steps

## Advanced Troubleshooting

### Relationship Data Integrity Issues

**Symptoms:**

- Inconsistent relationship data between JSONB fields and _rels tables
- API errors with "Cannot read properties of undefined" when fetching related content
- Missing or duplicate relationships

**Solutions:**

1. Run the comprehensive relationship integrity check:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:relationships:comprehensive
   ```

2. Apply the consolidated relationship fix:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:relationships:consolidated
   ```

3. For collection-specific issues:

   ```powershell
   # Fix quiz-question relationships
   pnpm --filter @kit/content-migrations run repair:quiz-relationships
   
   # Fix course-module relationships
   pnpm --filter @kit/content-migrations run repair:course-relationships
   ```

### Database Constraint Violations

**Symptoms:**

- SQL errors about foreign key constraints
- Unique constraint violations
- NOT NULL constraint failures

**Solutions:**

1. Identify constraint violations:

   ```sql
   -- Check for foreign key violations
   SELECT 
     conrelid::regclass AS table_name,
     conname AS constraint_name,
     pg_get_constraintdef(oid) AS constraint_definition
   FROM pg_constraint
   WHERE contype = 'f'
   AND connamespace = 'payload'::regnamespace;
   ```

2. Fix constraint violations:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:constraints
   ```

3. For persistent issues, reset and rebuild the affected tables:

   ```powershell
   ./scripts/database-reset/reset-specific-tables.ps1 -Tables "posts,posts_rels"
   ```

### Performance Issues During Migration

**Symptoms:**

- Extremely slow migration process
- Timeouts during migration
- High CPU/memory usage

**Solutions:**

1. Use batch processing for large collections:

   ```powershell
   pnpm --filter @kit/content-migrations run migrate:batch-size=100
   ```

2. Disable triggers temporarily during bulk operations:

   ```sql
   -- Disable triggers
   ALTER TABLE payload.posts DISABLE TRIGGER ALL;
   
   -- Run operations
   
   -- Re-enable triggers
   ALTER TABLE payload.posts ENABLE TRIGGER ALL;
   ```

3. Use the optimized migration script for large datasets:

   ```powershell
   ./scripts/remote-migration/content/migrate-content-optimized.ps1
   ```

### Version Control and Migration History

**Symptoms:**

- Confusion about which migrations have been applied
- Inconsistent database state between environments
- Migration conflicts

**Solutions:**

1. Check migration history:

   ```sql
   SELECT * FROM payload._migrations ORDER BY timestamp;
   ```

2. Reset migration history (use with caution):

   ```powershell
   pnpm --filter @kit/content-migrations run reset:migration-history
   ```

3. Generate migration report:

   ```powershell
   pnpm --filter @kit/content-migrations run report:migrations
   ```
