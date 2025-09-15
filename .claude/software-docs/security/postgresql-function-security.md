# PostgreSQL Function Security Standards

## Overview

This document outlines security standards for creating PostgreSQL functions in the SlideHeroes application, with a focus on preventing schema poisoning attacks.

## Critical Security Requirements

### 1. Always Set Explicit Search Path

**Every PostgreSQL function MUST include an explicit `search_path` setting** to prevent schema poisoning attacks.

```sql
CREATE OR REPLACE FUNCTION schema_name.function_name(...)
RETURNS ...
LANGUAGE plpgsql
SET search_path = ''  -- REQUIRED: Prevents schema poisoning
AS $$
BEGIN
  -- Function body
END;
$$;
```

### 2. Why Search Path Matters

Without an explicit search path:

- Functions inherit the search path of the calling session
- Attackers can create malicious objects in other schemas
- These malicious objects could be executed instead of intended ones
- Particularly dangerous for `SECURITY DEFINER` functions

### 3. Function Creation Template

Use this template for all new functions:

```sql
-- Standard function with search_path
CREATE OR REPLACE FUNCTION public.my_function(
  param1 TYPE,
  param2 TYPE
)
RETURNS return_type
LANGUAGE plpgsql
SET search_path = ''  -- Always include this
AS $$
DECLARE
  -- Declarations
BEGIN
  -- Always use fully qualified table names
  SELECT column FROM public.table_name WHERE ...;

  -- Not just table_name
  INSERT INTO public.other_table (...) VALUES (...);

  RETURN result;
END;
$$;

-- For SECURITY DEFINER functions (extra caution needed)
CREATE OR REPLACE FUNCTION public.privileged_function(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with owner's privileges
SET search_path = ''  -- CRITICAL for security
AS $$
BEGIN
  -- Function body
END;
$$;
```

### 4. Fully Qualified Names

When `search_path = ''`, you MUST use fully qualified names:

```sql
-- ✅ Correct
SELECT * FROM public.users WHERE id = user_id;
INSERT INTO public.certificates (...) VALUES (...);
UPDATE public.ai_usage_allocations SET ...;

-- ❌ Incorrect (will fail with empty search_path)
SELECT * FROM users WHERE id = user_id;
INSERT INTO certificates (...) VALUES (...);
UPDATE ai_usage_allocations SET ...;
```

### 5. Common Patterns

#### Trigger Functions

```sql
CREATE OR REPLACE FUNCTION public.my_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

#### Functions Returning Tables

```sql
CREATE OR REPLACE FUNCTION public.get_user_data(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$;
```

#### Functions with Dynamic SQL

```sql
CREATE OR REPLACE FUNCTION public.dynamic_query_function(table_name TEXT)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Always sanitize and use format with %I for identifiers
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN ...', table_name);
END;
$$;
```

## Security Checklist

Before creating any function:

- [ ] Added `SET search_path = ''` to function definition
- [ ] Used fully qualified table names (schema.table)
- [ ] For `SECURITY DEFINER` functions, extra review completed
- [ ] Dynamic SQL properly sanitized with `format()` and `%I`
- [ ] Function tested with empty search path
- [ ] No reliance on implicit schema resolution

## Migration Pattern

When fixing existing functions:

```sql
-- Get current function definition
\sf schema.function_name

-- Recreate with search_path
CREATE OR REPLACE FUNCTION schema.function_name(...)
...
SET search_path = ''  -- Add this line
AS $$
...
$$;
```

## Testing

Always test functions after setting search_path:

```sql
-- Set empty search path in session
SET search_path = '';

-- Test your function
SELECT public.my_function(...);

-- Reset search path
RESET search_path;
```

## References

- [PostgreSQL CREATE FUNCTION Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [OWASP PostgreSQL Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PostgreSQL_Security_Cheat_Sheet.html)

## Issue Reference

This standard was created in response to ISSUE-145: Security Warning - Function Search Path Mutable
