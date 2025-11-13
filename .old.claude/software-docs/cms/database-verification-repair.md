# Database Verification and Repair Strategies

## Verification Approaches

### Schema Verification

Verify database schema structure:

```powershell
# Verify all schemas
pnpm --filter @kit/content-migrations run verify:schema

# Verify specific collections
pnpm --filter @kit/content-migrations run verify:schema --collections=posts,categories
```

### Relationship Verification

Verify relationship consistency:

```powershell
# Verify all relationships
pnpm --filter @kit/content-migrations run verify:relationships

# Verify specific collection relationships
pnpm --filter @kit/content-migrations run verify:relationships --collections=posts,categories
```

### Content Verification

Verify content integrity:

```powershell
# Verify all content
pnpm --filter @kit/content-migrations run verify:content

# Verify specific content types
pnpm --filter @kit/content-migrations run verify:content --types=posts,courses
```

### UUID Table Verification

Verify UUID table structure:

```powershell
# Verify all UUID tables
pnpm --filter @kit/content-migrations run verify:uuid-tables

# Verify specific UUID tables
pnpm --filter @kit/content-migrations run verify:uuid-tables --tables=posts,categories
```

## Repair Strategies

### Schema Repair

Fix schema issues:

```powershell
# Repair all schemas
pnpm --filter @kit/content-migrations run repair:schema

# Repair specific collection schemas
pnpm --filter @kit/content-migrations run repair:schema --collections=posts,categories
```

### Relationship Repair

Fix relationship inconsistencies:

```powershell
# Repair all relationships
pnpm --filter @kit/content-migrations run repair:relationships

# Repair specific collection relationships
pnpm --filter @kit/content-migrations run repair:relationships --collections=posts,categories

# Use simplified relationship repair for better performance
pnpm --filter @kit/content-migrations run repair:relationships:simplified
```

### Content Repair

Fix content issues:

```powershell
# Repair all content
pnpm --filter @kit/content-migrations run repair:content

# Repair specific content types
pnpm --filter @kit/content-migrations run repair:content --types=posts,courses
```

### UUID Table Repair

Fix UUID table issues:

```powershell
# Repair all UUID tables
pnpm --filter @kit/content-migrations run fix:uuid-tables

# Repair specific UUID tables
pnpm --filter @kit/content-migrations run fix:uuid-tables --tables=posts,categories
```

## Comprehensive Verification and Repair

### Full Database Verification

Run comprehensive verification:

```powershell
# Verify entire database
./scripts/remote-migration/content/verify-remote-content.ps1 -VerifyAll

# Verify with verbose output
./scripts/remote-migration/content/verify-remote-content.ps1 -VerifyAll -VerboseOutput
```

### Full Database Repair

Run comprehensive repair:

```powershell
# Repair entire database
./scripts/orchestration/phases/relationship-repair.ps1

# Repair with specific options
./scripts/orchestration/phases/relationship-repair.ps1 -SkipVerification -ContinueOnError
```

### Simplified Repair Process

For better performance:

```powershell
# Run simplified repair
./scripts/orchestration/phases/relationship-repair-simplified.ps1

# Skip verification for faster execution
./scripts/orchestration/phases/relationship-repair-simplified.ps1 -SkipVerification
```

## SQL-Based Verification

### Schema Verification Queries

```sql
-- Check table existence
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'payload' 
  AND table_name = 'posts'
);

-- Check column existence
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'payload' 
  AND table_name = 'posts' 
  AND column_name = 'title'
);

-- Check constraint existence
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'payload.posts'::regclass;
```

### Relationship Verification Queries

```sql
-- Check for orphaned relationships
SELECT r.* 
FROM payload.posts_rels r
LEFT JOIN payload.posts p ON r.parent_id = p.id
WHERE p.id IS NULL;

-- Check for missing relationships
SELECT p.id
FROM payload.posts p
LEFT JOIN payload.posts_rels r ON r.parent_id = p.id AND r.path = 'category'
WHERE p.category IS NOT NULL AND r.id IS NULL;

-- Check for relationship consistency
SELECT p.id, p.category->>'id' AS jsonb_category_id, r.value AS rel_category_id
FROM payload.posts p
JOIN payload.posts_rels r ON r.parent_id = p.id AND r.path = 'category'
WHERE p.category->>'id' != r.value;
```

## Automated Verification Functions

### Database Functions

Create verification functions in the database:

```sql
-- Create verification function for relationship consistency
CREATE OR REPLACE FUNCTION payload.verify_relationship_consistency()
RETURNS TABLE (
  collection_name text,
  document_id text,
  relationship_path text,
  jsonb_value text,
  rel_value text,
  is_consistent boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'posts' AS collection_name,
    p.id AS document_id,
    'category' AS relationship_path,
    p.category->>'id' AS jsonb_value,
    r.value AS rel_value,
    (p.category->>'id' = r.value) AS is_consistent
  FROM
    payload.posts p
  JOIN
    payload.posts_rels r ON r.parent_id = p.id AND r.path = 'category'
  WHERE
    p.category IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

### Using Verification Functions

```sql
-- Run verification function
SELECT * FROM payload.verify_relationship_consistency() WHERE NOT is_consistent;
```

## Best Practices

1. **Regular Verification**: Run verification scripts regularly to catch issues early
2. **Incremental Repair**: Fix issues in small batches to avoid overwhelming the system
3. **Backup Before Repair**: Always create a backup before running repair scripts
4. **Verify After Repair**: Always verify after repair to ensure issues are fixed
5. **Use Transactions**: Wrap repair operations in transactions to ensure atomicity
6. **Log Repair Actions**: Keep detailed logs of repair actions for auditing
7. **Test in Development**: Test verification and repair scripts in development before production
