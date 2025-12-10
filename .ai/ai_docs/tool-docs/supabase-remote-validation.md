# Supabase Remote Database Validation

**Purpose**: Validate tables and records exist in a remote Supabase database using the Supabase CLI. Essential for scripts that need to verify Payload CMS migrations ran successfully or that seeding completed correctly.

**Related Files**:

- `.ai/ai_docs/tool-docs/supabase-cli.md` - General Supabase CLI reference
- `.ai/ai_docs/tool-docs/psql-integration.md` - psql commands for local development
- `.claude/commands/supabase-seed-remote.md` - Remote database seeding command
- `apps/web/supabase/` - Migrations and configuration

## Quick Validation Commands

```bash
# Count Payload tables using Supabase CLI (recommended - no credentials needed)
npx supabase inspect db table-stats --linked 2>&1 | grep -c "payload\."

# List all Payload tables with sizes
npx supabase inspect db table-stats --linked 2>&1 | grep "payload\."

# Check if specific table exists
npx supabase inspect db table-stats --linked 2>&1 | grep -q "payload.users" && echo "EXISTS" || echo "MISSING"
```

## Validation Approaches

### 1. Supabase CLI `inspect` Command (Recommended)

The `supabase inspect db table-stats --linked` command is the best approach for validating remote tables:

```bash
cd apps/web

# Get table count for payload schema
PAYLOAD_TABLE_COUNT=$(npx supabase inspect db table-stats --linked 2>&1 | grep -c "payload\.")

if [ "$PAYLOAD_TABLE_COUNT" -lt 60 ]; then
  echo "ERROR: Expected 60+ Payload tables, found $PAYLOAD_TABLE_COUNT"
  exit 1
fi

echo "✓ Found $PAYLOAD_TABLE_COUNT Payload tables"
```

**Advantages**:

- Uses `--linked` flag (project already configured)
- No DATABASE_URI or credentials needed
- Shows both `payload` and `public` schema tables
- Includes row counts for data validation

**Limitations**:

- Output is table-formatted, requires grep/awk parsing
- Cannot run arbitrary SQL queries

### 2. Direct psql with information_schema

For more precise queries, use psql with the connection string:

```bash
cd apps/payload
source .env.production

# Count tables in payload schema
TABLE_COUNT=$(psql "$DATABASE_URI" -t -c "
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema='payload';
" 2>/dev/null | tr -d ' ')

echo "Payload tables: $TABLE_COUNT"

# Check if specific tables exist
psql "$DATABASE_URI" -t -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema='payload'
  AND table_name IN ('users', 'media', 'courses', 'posts')
  ORDER BY table_name;
"
```

**Advantages**:

- Full SQL query flexibility
- Can query specific tables by name
- Precise counts without parsing

**Limitations**:

- Requires DATABASE_URI from .env.production
- Requires psql to be installed
- SSL/TLS configuration may be needed

### 3. Hybrid Approach (Best of Both)

Use CLI for quick validation, fall back to psql for detailed checks:

```bash
# Quick validation (no credentials)
echo "Validating Payload tables..."
PAYLOAD_TABLE_COUNT=$(npx supabase inspect db table-stats --linked 2>&1 | grep -c "payload\.")

if [ "$PAYLOAD_TABLE_COUNT" -lt 60 ]; then
  echo "ERROR: Expected 60+ Payload tables, found $PAYLOAD_TABLE_COUNT"
  exit 1
fi

# Detailed validation (with credentials)
cd apps/payload && source .env.production
psql "$DATABASE_URI" -c "
  SELECT
    'users' as collection, COUNT(*) as records FROM payload.users
  UNION ALL SELECT 'media', COUNT(*) FROM payload.media
  UNION ALL SELECT 'courses', COUNT(*) FROM payload.courses
  ORDER BY collection;
"
```

## Complete Validation Script

### Validate Payload Tables After Migration

```bash
#!/bin/bash
# validate-payload-tables.sh

cd apps/web

echo "Validating Payload tables in remote database..."

# 1. Quick count using Supabase CLI
PAYLOAD_TABLE_COUNT=$(npx supabase inspect db table-stats --linked 2>&1 | grep -c "payload\.")

if [ "$PAYLOAD_TABLE_COUNT" -lt 60 ]; then
  echo "ERROR: Expected 60+ Payload tables, found $PAYLOAD_TABLE_COUNT"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check Payload migration output for errors"
  echo "2. Verify DATABASE_URI is correct"
  echo "3. Try: pnpm --filter payload run payload migrate"
  exit 1
fi

# 2. Check for critical tables
CRITICAL_TABLES="payload.users payload.media payload.courses payload.posts payload.downloads"
MISSING_TABLES=""

for table in $CRITICAL_TABLES; do
  if ! npx supabase inspect db table-stats --linked 2>&1 | grep -q "$table "; then
    MISSING_TABLES="$MISSING_TABLES $table"
  fi
done

if [ -n "$MISSING_TABLES" ]; then
  echo "ERROR: Critical tables missing:$MISSING_TABLES"
  exit 1
fi

echo "✓ Payload tables validated ($PAYLOAD_TABLE_COUNT tables found)"
echo "✓ All critical tables present"
```

### Validate Seeded Data Counts

```bash
#!/bin/bash
# validate-seeded-data.sh

cd apps/payload
source .env.production

echo "Validating seeded data..."

# Expected counts from seed engine
VALIDATION_RESULT=$(psql "$DATABASE_URI" -c "
  SELECT
    collection,
    actual,
    expected,
    CASE
      WHEN actual = expected THEN 'OK'
      WHEN actual > expected THEN 'EXTRA'
      ELSE 'MISSING'
    END as status
  FROM (
    SELECT 'users' as collection, COUNT(*)::int as actual, 1 as expected FROM payload.users
    UNION ALL SELECT 'media', COUNT(*)::int, 24 FROM payload.media
    UNION ALL SELECT 'downloads', COUNT(*)::int, 23 FROM payload.downloads
    UNION ALL SELECT 'posts', COUNT(*)::int, 8 FROM payload.posts
    UNION ALL SELECT 'courses', COUNT(*)::int, 1 FROM payload.courses
    UNION ALL SELECT 'course_lessons', COUNT(*)::int, 25 FROM payload.course_lessons
    UNION ALL SELECT 'course_quizzes', COUNT(*)::int, 20 FROM payload.course_quizzes
    UNION ALL SELECT 'quiz_questions', COUNT(*)::int, 94 FROM payload.quiz_questions
    UNION ALL SELECT 'survey_questions', COUNT(*)::int, 32 FROM payload.survey_questions
    UNION ALL SELECT 'surveys', COUNT(*)::int, 3 FROM payload.surveys
    UNION ALL SELECT 'documentation', COUNT(*)::int, 19 FROM payload.documentation
    UNION ALL SELECT 'private_posts', COUNT(*)::int, 5 FROM payload.private_posts
  ) counts
  ORDER BY collection;
" 2>/dev/null)

echo "$VALIDATION_RESULT"

# Check for issues
if echo "$VALIDATION_RESULT" | grep -q "MISSING"; then
  echo ""
  echo "WARNING: Some expected records are missing"
  exit 1
fi

echo ""
echo "✓ Seeded data validation complete"
```

## Available inspect Commands

The Supabase CLI provides several inspection commands:

```bash
# Table statistics (most useful for validation)
supabase inspect db table-stats --linked

# Database overall stats
supabase inspect db db-stats --linked

# Index statistics
supabase inspect db index-stats --linked

# Role information
supabase inspect db role-stats --linked

# Generate full report
supabase inspect report --linked
```

### Output Format Options

```bash
# Pretty-printed table (default)
supabase inspect db table-stats --linked

# JSON output (may not work for all commands)
supabase inspect db table-stats --linked -o json

# YAML output
supabase inspect db table-stats --linked -o yaml
```

**Note**: JSON/YAML output may not be available for all inspect commands. Use grep/awk for parsing the default table output.

## Parsing Table Stats Output

The `table-stats` output format:

```
   Name                    | Table size | Index size | Total size | Estimated row count | Seq scans
  -------------------------|------------|------------|------------|---------------------|-----------
   payload.users           | 16 kB      | 64 kB      | 80 kB      | 1                   | 7
   payload.media           | 16 kB      | 64 kB      | 80 kB      | 24                  | 7
```

### Extract Specific Information

```bash
# Get table names only
npx supabase inspect db table-stats --linked 2>&1 | \
  grep "payload\." | \
  awk '{print $1}'

# Get row counts for payload tables
npx supabase inspect db table-stats --linked 2>&1 | \
  grep "payload\." | \
  awk '{print $1, $8}'

# Find tables with data (row count > 0)
npx supabase inspect db table-stats --linked 2>&1 | \
  grep "payload\." | \
  awk '$8 > 0 {print $1, $8}'

# Get total row count across all payload tables
npx supabase inspect db table-stats --linked 2>&1 | \
  grep "payload\." | \
  awk '{sum += $8} END {print "Total rows:", sum}'
```

## Schema Validation

### Verify Schema Exists

```bash
cd apps/payload
source .env.production

SCHEMA_EXISTS=$(psql "$DATABASE_URI" -t -c "
  SELECT COUNT(*) FROM information_schema.schemata
  WHERE schema_name='payload';
" 2>/dev/null | tr -d ' ')

if [ "$SCHEMA_EXISTS" != "1" ]; then
  echo "ERROR: Payload schema does not exist"
  exit 1
fi
```

### List All Schemas

```bash
npx supabase inspect db table-stats --linked 2>&1 | \
  awk '{print $1}' | \
  cut -d. -f1 | \
  sort -u
```

## Connection Requirements

### Using --linked Flag

The `--linked` flag uses the project configuration from `apps/web/supabase/.temp/project-ref`:

```bash
cd apps/web

# Verify project is linked
npx supabase projects list --linked

# If not linked, run:
npx supabase link --project-ref ldebzombxtszzcgnylgq
```

### Using --db-url Flag

For explicit connection:

```bash
# URL must be percent-encoded
supabase inspect db table-stats --db-url "postgresql://user:pass@host:port/db"
```

## Error Handling

### Common Errors

```bash
# Error: Project not linked
if ! npx supabase projects list --linked 2>/dev/null | grep -q "ldebzombxtszzcgnylgq"; then
  echo "ERROR: Project not linked to remote"
  echo "Run: npx supabase link --project-ref ldebzombxtszzcgnylgq"
  exit 1
fi

# Error: Connection timeout
if ! timeout 30 npx supabase inspect db table-stats --linked 2>&1 | head -1; then
  echo "ERROR: Connection to remote database timed out"
  exit 1
fi

# Error: No tables found
if [ "$PAYLOAD_TABLE_COUNT" -eq 0 ]; then
  echo "ERROR: No Payload tables found"
  echo "Payload migrations may not have run"
  exit 1
fi
```

### Retry Logic

```bash
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  RESULT=$(npx supabase inspect db table-stats --linked 2>&1)

  if echo "$RESULT" | grep -q "payload\."; then
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Retry $RETRY_COUNT/$MAX_RETRIES..."
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: Failed to validate tables after $MAX_RETRIES attempts"
  exit 1
fi
```

## Integration with Seeding Scripts

### Pre-Seed Validation

```bash
# Verify tables exist before seeding
echo "Pre-seed validation..."
TABLE_COUNT=$(npx supabase inspect db table-stats --linked 2>&1 | grep -c "payload\.")

if [ "$TABLE_COUNT" -lt 60 ]; then
  echo "ERROR: Payload tables not ready for seeding"
  echo "Run migrations first: pnpm --filter payload run payload migrate"
  exit 1
fi

# Proceed with seeding
pnpm run seed:run:remote
```

### Post-Seed Validation

```bash
# Verify seeding completed
echo "Post-seed validation..."

# Check row counts using table-stats
USERS_ROW=$(npx supabase inspect db table-stats --linked 2>&1 | \
  grep "payload.users " | awk '{print $8}')

if [ "$USERS_ROW" -lt 1 ]; then
  echo "ERROR: No users seeded"
  exit 1
fi

echo "✓ Seeding validated"
```

## Best Practices

1. **Use `--linked` over `--db-url`** - Credentials are already configured
2. **Validate before and after** - Check table count before/after migrations
3. **Check critical tables explicitly** - Don't just rely on counts
4. **Add timeouts** - Remote connections can be slow
5. **Log validation results** - For debugging failed deployments
6. **Use grep -c for counts** - More reliable than parsing table output

## Related Documentation

- **Supabase CLI**: `.ai/ai_docs/tool-docs/supabase-cli.md`
- **psql Integration**: `.ai/ai_docs/tool-docs/psql-integration.md`
- **Remote Seeding**: `.claude/commands/supabase-seed-remote.md`
- **Database Patterns**: `.ai/ai_docs/context-docs/development/database-patterns.md`
