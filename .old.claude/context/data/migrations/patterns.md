---
# Identity
id: "database-migration-patterns"
title: "Database Migration Patterns"
version: "1.0.0"
category: "pattern"

# Discovery
description: "Advanced migration patterns, zero-downtime strategies, and detailed examples for complex database changes"
tags: ["migrations", "patterns", "zero-downtime", "database", "postgresql", "examples"]

# Relationships
dependencies: ["database-migrations"]
cross_references:
  - id: "database-migrations"
    type: "prerequisite"
    description: "Core migration concepts and setup"
  - id: "database-migration-cicd"
    type: "related"
    description: "CI/CD deployment patterns"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Database Migration Patterns

## Zero-Downtime Migration Strategies

### Multi-Phase Migration Pattern

For breaking changes that require zero-downtime deployment:

#### Phase 1: Add New Structure

```sql
-- Deploy: Add new column alongside old
ALTER TABLE public.users ADD COLUMN email_normalized VARCHAR(255);
CREATE INDEX CONCURRENTLY idx_users_email_normalized ON public.users(email_normalized);
```

#### Phase 2: Dual Write (Application Change)

```typescript
// Update application to write both columns
await db.update({
  email: userEmail,
  email_normalized: userEmail.toLowerCase().trim()
});
```

#### Phase 3: Backfill Data

```sql
-- Migration: Backfill existing data
UPDATE public.users
SET email_normalized = LOWER(TRIM(email))
WHERE email_normalized IS NULL;

-- Verify backfill
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.users WHERE email_normalized IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % rows missing', null_count;
  END IF;
END $$;
```

#### Phase 4: Add Constraints

```sql
-- Deploy: Make new column required
ALTER TABLE public.users ALTER COLUMN email_normalized SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_email_normalized_unique UNIQUE(email_normalized);
```

#### Phase 5: Remove Old Structure

```sql
-- Final migration after app no longer uses old column
ALTER TABLE public.users DROP COLUMN email;
ALTER TABLE public.users RENAME COLUMN email_normalized TO email;
```

## Complex Table Creation Examples

### Complete User System

```sql
-- Users table with soft delete and audit
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON public.users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login_at) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Email validation
ALTER TABLE public.users ADD CONSTRAINT users_email_valid
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

### JSONB Preferences with Indexes

```sql
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JSONB indexes for performance
CREATE INDEX idx_profiles_preferences ON public.user_profiles USING gin(preferences);
CREATE INDEX idx_profiles_theme ON public.user_profiles((preferences->>'theme'));
CREATE INDEX idx_profiles_language ON public.user_profiles((preferences->>'language'));

-- Partial indexes for common queries
CREATE INDEX idx_profiles_dark_theme ON public.user_profiles((preferences->>'theme'))
  WHERE preferences->>'theme' = 'dark';
```

## Data Migration Patterns

### Safe Data Transformation

```sql
BEGIN;

-- Create temporary column
ALTER TABLE public.orders ADD COLUMN total_cents INTEGER;

-- Transform data with validation
UPDATE public.orders
SET total_cents = ROUND(total_amount * 100)::INTEGER
WHERE total_amount IS NOT NULL;

-- Verify transformation
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.orders
  WHERE total_amount IS NOT NULL AND total_cents IS NULL;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Data transformation failed for % rows', invalid_count;
  END IF;
END $$;

-- Make new column required
ALTER TABLE public.orders ALTER COLUMN total_cents SET NOT NULL;

-- Drop old column (in later migration)
-- ALTER TABLE public.orders DROP COLUMN total_amount;

COMMIT;
```

### Batch Processing for Large Tables

```sql
-- Process in batches to avoid long locks
DO $$
DECLARE
  batch_size INTEGER := 10000;
  processed INTEGER := 0;
  total INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM public.large_table WHERE processed = FALSE;

  WHILE processed < total LOOP
    UPDATE public.large_table
    SET
      new_field = complex_calculation(old_field),
      processed = TRUE
    WHERE id IN (
      SELECT id FROM public.large_table
      WHERE processed = FALSE
      LIMIT batch_size
    );

    processed := processed + batch_size;
    RAISE NOTICE 'Processed % of % rows', processed, total;

    -- Optional: pause between batches
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

## Advanced RLS Patterns

### Hierarchical Team Access

```sql
-- Teams with parent/child relationships
CREATE POLICY "hierarchical_access" ON public.documents
  FOR SELECT USING (
    EXISTS (
      WITH RECURSIVE team_hierarchy AS (
        -- Direct team membership
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()

        UNION

        -- Parent team access
        SELECT parent_id FROM public.accounts
        JOIN team_hierarchy ON accounts.id = team_hierarchy.account_id
        WHERE parent_id IS NOT NULL
      )
      SELECT 1 FROM team_hierarchy
      WHERE team_hierarchy.account_id = documents.team_id
    )
  );
```

### Time-based Access Control

```sql
CREATE POLICY "temporal_access" ON public.content
  FOR SELECT USING (
    -- Public after publish date
    (published_at IS NOT NULL AND published_at <= NOW())
    OR
    -- Author always has access
    (author_id = auth.uid())
    OR
    -- Editors before publish
    EXISTS (
      SELECT 1 FROM public.content_editors
      WHERE content_id = content.id AND editor_id = auth.uid()
    )
  );
```

## Testing Migration Patterns

### Migration Validation

```sql
-- Include validation in every migration
DO $$
BEGIN
  -- Check table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'new_table') THEN
    RAISE EXCEPTION 'Migration failed: table not created';
  END IF;

  -- Check column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'new_column') THEN
    RAISE EXCEPTION 'Migration failed: column not created';
  END IF;

  -- Check index exists
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                 WHERE schemaname = 'public'
                 AND tablename = 'users'
                 AND indexname = 'idx_users_new') THEN
    RAISE EXCEPTION 'Migration failed: index not created';
  END IF;

  RAISE NOTICE 'Migration validation passed';
END $$;
```

### Rollback Testing

```sql
-- Test rollback in transaction
BEGIN;

-- Apply migration
ALTER TABLE public.users ADD COLUMN test_field TEXT;

-- Test the change
INSERT INTO public.users (email, test_field)
VALUES ('test@example.com', 'test_value');

-- Verify
SELECT test_field FROM public.users WHERE email = 'test@example.com';

-- Rollback to test
ROLLBACK;

-- Verify rollback
-- Should error: column "test_field" does not exist
```

## Performance Optimization Patterns

### Index Creation Strategy

```sql
-- Create indexes CONCURRENTLY in production
CREATE INDEX CONCURRENTLY idx_large_table_field ON public.large_table(field);

-- Partial indexes for common queries
CREATE INDEX idx_orders_pending ON public.orders(created_at)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- Composite indexes for multi-column queries
CREATE INDEX idx_users_search ON public.users(email, name)
  WHERE deleted_at IS NULL;

-- Expression indexes
CREATE INDEX idx_users_email_lower ON public.users(LOWER(email));
```

### Constraint Addition Strategy

```sql
-- Add NOT VALID constraint first (no table scan)
ALTER TABLE public.large_table
  ADD CONSTRAINT check_positive_amount
  CHECK (amount > 0) NOT VALID;

-- Validate in separate transaction (can be done during low traffic)
ALTER TABLE public.large_table
  VALIDATE CONSTRAINT check_positive_amount;
```

## Common Pitfalls & Solutions

| Pattern | Problem | Solution |
|---------|---------|----------|
| Adding NOT NULL | Blocks on NULL check | Add with DEFAULT, then remove DEFAULT |
| Dropping column | Breaks old app code | Ignore in app first, drop later |
| Renaming column | Breaks references | Add new, dual write, migrate, drop old |
| Adding FK constraint | Locks both tables | Use NOT VALID, validate separately |
| Large data update | Long transaction | Process in batches |
| Index on large table | Blocks writes | Use CONCURRENTLY |
