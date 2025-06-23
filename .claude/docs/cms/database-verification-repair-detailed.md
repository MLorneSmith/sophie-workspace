# Detailed Database Verification and Repair Guide

This guide provides in-depth information on verifying and repairing database issues in the content migration system.

## Verification Process

### 1. Schema Verification

Schema verification ensures that all required tables, columns, and constraints exist in the database.

#### Tables and Columns

```sql
-- Verify table existence
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'payload' 
  AND table_name = 'posts'
);

-- Verify column existence
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'payload' 
AND table_name = 'posts';
```

#### Constraints

```sql
-- Verify primary key constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payload.posts'::regclass
AND contype = 'p';

-- Verify foreign key constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payload.posts_rels'::regclass
AND contype = 'f';
```

#### Indexes

```sql
-- Verify indexes
SELECT 
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'payload'
AND tablename = 'posts';
```

### 2. Relationship Verification

Relationship verification ensures that all relationships are consistent between JSONB fields and relationship tables.

#### Orphaned Relationships

```sql
-- Find orphaned relationships in posts_rels
SELECT r.* 
FROM payload.posts_rels r
LEFT JOIN payload.posts p ON r.parent_id = p.id
WHERE p.id IS NULL;
```

#### Missing Relationships

```sql
-- Find missing relationships for categories
SELECT 
  p.id,
  p.title,
  p.category->>'id' AS category_id
FROM payload.posts p
LEFT JOIN payload.posts_rels r 
  ON r.parent_id = p.id 
  AND r.path = 'category'
WHERE 
  p.category IS NOT NULL 
  AND r.id IS NULL;
```

#### Inconsistent Relationships

```sql
-- Find inconsistent relationships
SELECT 
  p.id,
  p.title,
  p.category->>'id' AS jsonb_category_id,
  r.value AS rel_category_id
FROM payload.posts p
JOIN payload.posts_rels r 
  ON r.parent_id = p.id 
  AND r.path = 'category'
WHERE p.category->>'id' != r.value;
```

### 3. Content Verification

Content verification ensures that all required content exists and is properly formatted.

#### Required Fields

```sql
-- Check for missing required fields
SELECT id, title
FROM payload.posts
WHERE title IS NULL OR title = '';
```

#### Data Format

```sql
-- Check for invalid JSON in JSONB fields
SELECT id, title
FROM payload.posts
WHERE 
  (content IS NOT NULL AND jsonb_typeof(content) != 'object')
  OR (metadata IS NOT NULL AND jsonb_typeof(metadata) != 'object');
```

#### Duplicate Content

```sql
-- Check for duplicate slugs
SELECT slug, COUNT(*)
FROM payload.posts
GROUP BY slug
HAVING COUNT(*) > 1;
```

### 4. UUID Table Verification

UUID table verification ensures that all UUID tables have the required columns and constraints.

```sql
-- Check UUID columns in posts table
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_schema = 'payload' 
AND table_name = 'posts'
AND column_name = 'id';
```

## Repair Process

### 1. Schema Repair

#### Create Missing Tables

```sql
-- Create missing table
CREATE TABLE IF NOT EXISTS payload.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Add Missing Columns

```sql
-- Add missing column
ALTER TABLE payload.posts
ADD COLUMN IF NOT EXISTS slug TEXT;
```

#### Add Missing Constraints

```sql
-- Add missing primary key
ALTER TABLE payload.posts
ADD PRIMARY KEY (id);

-- Add missing foreign key
ALTER TABLE payload.posts_rels
ADD CONSTRAINT fk_posts_rels_parent
FOREIGN KEY (parent_id)
REFERENCES payload.posts(id)
ON DELETE CASCADE;
```

### 2. Relationship Repair

#### Fix Orphaned Relationships

```sql
-- Remove orphaned relationships
DELETE FROM payload.posts_rels r
WHERE NOT EXISTS (
  SELECT 1 FROM payload.posts p
  WHERE p.id = r.parent_id
);
```

#### Fix Missing Relationships

```sql
-- Add missing relationships
INSERT INTO payload.posts_rels (id, parent_id, path, order, value, collection)
SELECT 
  uuid_generate_v4(),
  p.id,
  'category',
  0,
  p.category->>'id',
  'categories'
FROM payload.posts p
LEFT JOIN payload.posts_rels r 
  ON r.parent_id = p.id 
  AND r.path = 'category'
WHERE 
  p.category IS NOT NULL 
  AND r.id IS NULL;
```

#### Fix Inconsistent Relationships

```sql
-- Update inconsistent relationships
UPDATE payload.posts_rels r
SET value = p.category->>'id'
FROM payload.posts p
WHERE 
  r.parent_id = p.id 
  AND r.path = 'category'
  AND r.value != p.category->>'id';
```

### 3. Content Repair

#### Fix Missing Required Fields

```sql
-- Fix missing titles
UPDATE payload.posts
SET title = 'Untitled Post'
WHERE title IS NULL OR title = '';
```

#### Fix Invalid Data Format

```sql
-- Fix invalid JSON
UPDATE payload.posts
SET content = '{}'::jsonb
WHERE content IS NOT NULL AND jsonb_typeof(content) != 'object';
```

#### Fix Duplicate Content

```sql
-- Fix duplicate slugs
WITH duplicates AS (
  SELECT slug, array_agg(id) AS ids
  FROM payload.posts
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE payload.posts p
SET slug = p.slug || '-' || p.id
FROM duplicates d
WHERE p.slug = d.slug AND p.id = ANY(d.ids[2:]);
```

### 4. UUID Table Repair

#### Fix UUID Columns

```sql
-- Add UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add UUID column
ALTER TABLE payload.posts
ADD COLUMN IF NOT EXISTS id TEXT PRIMARY KEY DEFAULT uuid_generate_v4();
```

## Automated Repair Scripts

### PowerShell Scripts

#### Comprehensive Relationship Repair

The `relationship-repair.ps1` script provides comprehensive relationship repair functionality:

```powershell
# Run comprehensive relationship repair
./scripts/orchestration/phases/relationship-repair.ps1

# Skip verification for faster execution
./scripts/orchestration/phases/relationship-repair.ps1 -SkipVerification

# Continue on error
./scripts/orchestration/phases/relationship-repair.ps1 -ContinueOnError

# Enable verbose output
./scripts/orchestration/phases/relationship-repair.ps1 -VerboseOutput
```

#### Simplified Relationship Repair

The `relationship-repair-simplified.ps1` script provides a faster, simplified repair approach:

```powershell
# Run simplified relationship repair
./scripts/orchestration/phases/relationship-repair-simplified.ps1

# Skip verification
./scripts/orchestration/phases/relationship-repair-simplified.ps1 -SkipVerification

# Skip fallback system
./scripts/orchestration/phases/relationship-repair-simplified.ps1 -SkipFallback
```

#### Quiz System Repair

The `quiz-system-repair.ps1` script specifically targets quiz-related relationships:

```powershell
# Run quiz system repair
./scripts/orchestration/phases/quiz-system-repair.ps1

# Skip verification
./scripts/orchestration/phases/quiz-system-repair.ps1 -SkipVerification
```

#### UUID Table Repair

The `Fix-UuidTables` function ensures UUID tables have the required columns:

```powershell
# Fix UUID tables
./scripts/orchestration/utils/uuid-tables.ps1
```

### TypeScript Scripts

#### Fix UUID Tables

```typescript
// Run from project root
pnpm --filter @kit/content-migrations run fix:uuid-tables

// With specific tables
pnpm --filter @kit/content-migrations run fix:uuid-tables -- --tables=posts,categories
```

#### Fix Relationships

```typescript
// Fix all relationships
pnpm --filter @kit/content-migrations run fix:relationships

// Fix specific collection relationships
pnpm --filter @kit/content-migrations run fix:relationships -- --collections=posts,categories
```

#### Fix Quiz Relationships

```typescript
// Fix quiz-question relationships
pnpm --filter @kit/content-migrations run fix:quiz-jsonb-sync

// Fix quiz relationships with comprehensive approach
pnpm --filter @kit/content-migrations run fix:quiz-relationships:comprehensive
```

#### Fix S3 Storage Issues

```typescript
// Create fallback files
pnpm --filter @kit/content-migrations run create:fallback-files

// Set up S3 fallback middleware
pnpm --filter @kit/content-migrations run setup:s3-fallback-middleware

// Fix S3 references
pnpm --filter @kit/content-migrations run fix:s3-references
```

### SQL Scripts

#### Fix Relationship Tables

```sql
-- Create relationship repair function
CREATE OR REPLACE FUNCTION payload.repair_relationships()
RETURNS TABLE (
  collection_name text,
  fixed_count int
) AS $$
DECLARE
  collection record;
  fixed int;
BEGIN
  FOR collection IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'payload'
    AND table_name LIKE '%_rels'
  LOOP
    -- Remove orphaned relationships
    EXECUTE format('
      DELETE FROM payload.%I r
      WHERE NOT EXISTS (
        SELECT 1 FROM payload.%I p
        WHERE p.id = r.parent_id
      )',
      collection.table_name,
      replace(collection.table_name, '_rels', '')
    );
    
    GET DIAGNOSTICS fixed = ROW_COUNT;
    
    collection_name := collection.table_name;
    fixed_count := fixed;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the repair function
SELECT * FROM payload.repair_relationships();
```

#### Fix JSONB Fields

```sql
-- Create JSONB repair function
CREATE OR REPLACE FUNCTION payload.repair_jsonb_fields()
RETURNS TABLE (
  collection_name text,
  field_name text,
  fixed_count int
) AS $$
DECLARE
  collection record;
  field record;
  fixed int;
BEGIN
  FOR collection IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'payload'
    AND table_name NOT LIKE '%_rels'
  LOOP
    FOR field IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = collection.table_name
      AND data_type = 'jsonb'
    LOOP
      -- Fix invalid JSONB
      EXECUTE format('
        UPDATE payload.%I
        SET %I = ''{}''::jsonb
        WHERE %I IS NOT NULL AND jsonb_typeof(%I) != ''object''',
        collection.table_name,
        field.column_name,
        field.column_name,
        field.column_name
      );
      
      GET DIAGNOSTICS fixed = ROW_COUNT;
      
      collection_name := collection.table_name;
      field_name := field.column_name;
      fixed_count := fixed;
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the repair function
SELECT * FROM payload.repair_jsonb_fields();
```

## Verification Dependencies

The system uses a dependency-aware verification approach to ensure that verification steps are run in the correct order and that dependencies are satisfied before verification is attempted.

```powershell
# Global verification dependency mapping
$global:verificationDependencies = @{
    "todo_fields" = @{
        "fixFunctions" = @("Fix-TodoFields", "Fix-LexicalFormat")
        "verifyFunction" = "Verify-TodoFields"
        "fixed" = $false
    }
    "quiz_relationships" = @{
        "fixFunctions" = @("Fix-QuizRelationships", "Fix-QuizQuestionRelationships")
        "verifyFunction" = "Verify-QuizRelationships"
        "fixed" = $false
    }
    "uuid_tables" = @{
        "fixFunctions" = @("Fix-UuidTables", "Repair-RelationshipColumns")
        "verifyFunction" = "Verify-UuidTables"
        "fixed" = $false
    }
    "post_content" = @{
        "fixFunctions" = @("Fix-PostLexicalFormat", "Fix-PostImageRelationships")
        "verifyFunction" = "Verify-PostContent"
        "fixed" = $false
    }
}
```

## Monitoring and Logging

### Logging Repair Actions

```powershell
# Log repair actions
function Log-RepairAction {
    param (
        [string]$Collection,
        [string]$Action,
        [int]$Count
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - $Collection - $Action - $Count items"
    
    Add-Content -Path "repair-log.txt" -Value $logEntry
}
```

### Tracking Repair Progress

```powershell
# Track repair progress
function Track-RepairProgress {
    param (
        [string]$Phase,
        [int]$Current,
        [int]$Total
    )
    
    $percentage = [math]::Round(($Current / $Total) * 100)
    Write-Progress -Activity "Repairing $Phase" -Status "$percentage% Complete" -PercentComplete $percentage
}
```

## Best Practices

1. **Always Backup First**: Create a database backup before running repair scripts
2. **Start with Verification**: Always run verification before repair to identify issues
3. **Use Transactions**: Wrap repair operations in transactions to ensure atomicity
4. **Incremental Repair**: Fix issues in small batches to avoid overwhelming the system
5. **Verify After Repair**: Always verify after repair to ensure issues are fixed
6. **Log All Actions**: Keep detailed logs of all repair actions
7. **Monitor Performance**: Watch for performance issues during repair operations
8. **Test in Development**: Always test repair scripts in development before production
9. **Handle Errors Gracefully**: Implement proper error handling in repair scripts
10. **Document Custom Repairs**: Document any custom repair steps for future reference

## Troubleshooting Common Issues

### Relationship Inconsistencies

If relationship verification fails:

1. Run the comprehensive relationship repair script:

   ```powershell
   ./scripts/orchestration/phases/relationship-repair.ps1
   ```

2. If issues persist, run the quiz-specific repair:

   ```powershell
   ./scripts/orchestration/phases/quiz-system-repair.ps1
   ```

3. Check for orphaned relationships:

   ```sql
   SELECT * FROM payload.find_orphaned_relationships();
   ```

### UUID Table Issues

If UUID table verification fails:

1. Run the UUID table fix script:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:uuid-tables
   ```

2. Verify UUID columns:

   ```powershell
   pnpm --filter @kit/content-migrations run uuid:verify:fixed
   ```

### Content Format Issues

If content verification fails:

1. Fix Lexical format issues:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:all-lexical-fields
   ```

2. Fix post-specific issues:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:post-lexical-format
   ```

### S3 Storage Issues

If S3 storage verification fails:

1. Create fallback files:

   ```powershell
   pnpm --filter @kit/content-migrations run create:fallback-files
   ```

2. Set up fallback middleware:

   ```powershell
   pnpm --filter @kit/content-migrations run setup:s3-fallback-middleware
   ```

3. Fix S3 references:

   ```powershell
   pnpm --filter @kit/content-migrations run fix:s3-references
   ```
