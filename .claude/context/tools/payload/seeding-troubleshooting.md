# Payload CMS Seeding Troubleshooting Guide

**Common issues, solutions, and debugging techniques for the Payload seeding system**

Version: 1.0  
Last Updated: 2025-09-30

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Error Message Reference](#error-message-reference)
- [Debugging Techniques](#debugging-techniques)
- [Performance Issues](#performance-issues)
- [FAQ](#faq)

---

## Quick Diagnostics

Run this checklist first before deep troubleshooting:

```bash
# 1. Check environment variables
echo "DATABASE_URI: ${DATABASE_URI:0:30}..."
echo "PAYLOAD_SECRET: ${PAYLOAD_SECRET:0:10}..."
echo "NODE_ENV: $NODE_ENV"

# 2. Verify Supabase is running
pnpm supabase:web:status

# 3. Test database connection
psql "$DATABASE_URI" -c "SELECT 1;"

# 4. Validate seed data files
find apps/payload/src/seed/seed-data -name "*.json" -exec node -c "JSON.parse(require('fs').readFileSync('{}', 'utf8'))" \; 2>&1 | grep -i error

# 5. Run dry-run validation
pnpm seed:dry

# 6. Check for stale processes
lsof -ti:3020
```

**If all checks pass but seeding still fails**, proceed to specific issue sections below.

---

## Common Issues

### 1. Environment Variables Missing

**Symptom**:
```
✗ Environment validation failed
Missing required environment variables: DATABASE_URI, PAYLOAD_SECRET
```

**Cause**: Required environment variables not set.

**Solution**:

```bash
# Development environment
export DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
export PAYLOAD_SECRET=your-secret-key-here
export NODE_ENV=development

# Or use .env file
echo 'DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres' >> apps/payload/.env
echo 'PAYLOAD_SECRET=your-secret-key-here' >> apps/payload/.env
echo 'NODE_ENV=development' >> apps/payload/.env
```

**Verification**:
```bash
pnpm --filter payload seed:dry
```

---

### 2. Production Environment Block

**Symptom**:
```
✗ SAFETY CHECK FAILED: Seeding is not allowed in production environment
Set NODE_ENV to "development" or "test" to proceed
```

**Cause**: `NODE_ENV=production` prevents accidental production seeding.

**Solution**:

```bash
# For development
export NODE_ENV=development

# For testing
export NODE_ENV=test

# NEVER run seeding with NODE_ENV=production
```

**Why This Matters**: Seeding is designed for development/test data only. Running in production could overwrite real user data.

---

### 3. Supabase Not Running

**Symptom**:
```
✗ Database connection failed
Error: connect ECONNREFUSED 127.0.0.1:54322
```

**Cause**: Supabase local instance not started.

**Solution**:

```bash
# Start Supabase
pnpm supabase:web:start

# Verify it's running
pnpm supabase:web:status

# Expected output:
#   API URL: http://localhost:54321
#   DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#   Status: Running
```

**Alternative**: Check if port 54322 is blocked or already in use:

```bash
lsof -ti:54322
# If process found, kill it or restart Supabase
```

---

### 4. Unresolved References

**Symptom**:
```
✗ course-lessons[lesson-3]: Reference resolution failed
  Unresolved reference: {ref:courses:nonexistent}
  Ensure collection "courses" with identifier "nonexistent" has been seeded.
```

**Cause**: JSON contains `{ref:...}` pattern pointing to non-existent record.

**Solution**:

1. **Find the problematic reference**:
   ```bash
   grep -r "{ref:courses:nonexistent}" apps/payload/src/seed/seed-data/
   ```

2. **Check if target record exists**:
   ```bash
   grep -r '"_ref": "nonexistent"' apps/payload/src/seed/seed-data/courses.json
   ```

3. **Fix the reference**:
   - Option A: Add missing record to `courses.json`
   - Option B: Update reference to point to existing record
   - Option C: Remove reference if not needed

4. **Validate fix**:
   ```bash
   pnpm seed:dry
   ```

**Prevention**: Always validate after editing JSON files:
```bash
pnpm seed:dry  # Before committing changes
```

---

### 5. JSON Parsing Errors

**Symptom**:
```
✗ Failed to load collection: course-lessons
  Unexpected token } in JSON at position 1234
```

**Cause**: Malformed JSON (trailing commas, missing quotes, etc.)

**Solution**:

1. **Find the file with error**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('apps/payload/src/seed/seed-data/course-lessons.json', 'utf8'))"
   ```

2. **Use JSON validator**:
   ```bash
   # Install jq if not available
   cat apps/payload/src/seed/seed-data/course-lessons.json | jq . > /dev/null
   ```

3. **Common JSON mistakes**:
   ```json
   // ❌ WRONG
   {
     "name": "Test",
     "value": 123,  // <- trailing comma
   }
   
   // ✅ CORRECT
   {
     "name": "Test",
     "value": 123
   }
   ```

4. **Fix and validate**:
   ```bash
   pnpm seed:dry
   ```

**Prevention**: Use VSCode JSON validation or ESLint for JSON files.

---

### 6. Payload Initialization Failures

**Symptom**:
```
✗ Initialization failed
Error: Failed to initialize Payload CMS
```

**Cause**: Payload configuration issues or database schema mismatch.

**Solution**:

1. **Reset database with migrations**:
   ```bash
   pnpm supabase:web:reset
   ```

2. **Verify Payload config is valid**:
   ```bash
   pnpm --filter payload generate:types
   ```

3. **Check for migration issues**:
   ```bash
   pnpm --filter web supabase migration list
   ```

4. **Try seeding again**:
   ```bash
   pnpm seed:run
   ```

**Deep Dive**: If issue persists, check:
- `apps/payload/src/payload.config.ts` for syntax errors
- Database user has correct permissions
- PostgreSQL version is compatible (14+)

---

### 7. Timeout Errors

**Symptom**:
```
✗ Seeding operation timed out after 120000ms
```

**Cause**: Seeding takes longer than default timeout (2 minutes).

**Solution**:

1. **Increase timeout**:
   ```bash
   pnpm seed:run --timeout 300000  # 5 minutes
   ```

2. **Use collection filtering** to reduce scope:
   ```bash
   pnpm seed:courses  # Instead of full seed
   ```

3. **Check database performance**:
   ```sql
   -- Connect to database
   psql "$DATABASE_URI"
   
   -- Check for slow queries
   SELECT query, mean_exec_time 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

4. **Restart Supabase** if performance is degraded:
   ```bash
   pnpm supabase:web:stop
   pnpm supabase:web:start
   ```

---

### 8. Permission Errors

**Symptom**:
```
✗ Database error: permission denied for table course_lessons
```

**Cause**: Database user lacks required permissions.

**Solution**:

1. **Check database user**:
   ```bash
   psql "$DATABASE_URI" -c "\du"
   ```

2. **Grant permissions** (if using custom user):
   ```sql
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
   ```

3. **For Supabase local**, use default superuser:
   ```bash
   DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
   ```

---

### 9. Memory Errors

**Symptom**:
```
✗ FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause**: Node.js heap limit exceeded (rare with 316 records).

**Solution**:

1. **Increase Node.js memory**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm seed:run
   ```

2. **Use collection filtering** to reduce memory footprint:
   ```bash
   pnpm seed:run -c courses,course-lessons
   ```

3. **Check for memory leaks**:
   ```bash
   node --inspect apps/payload/src/seed/seed-engine/index.ts
   # Open chrome://inspect in browser
   ```

**When This Happens**: Only with very large datasets (>10,000 records). Current dataset (316 records) should never trigger this.

---

### 10. Duplicate Key Violations

**Symptom**:
```
✗ Database error: duplicate key value violates unique constraint "course_lessons_slug_key"
```

**Cause**: Attempting to seed when data already exists.

**Solution**:

1. **Clean database before seeding**:
   ```bash
   pnpm supabase:web:reset
   pnpm seed:run
   ```

2. **Or use idempotent seeding** (future feature - not yet implemented):
   ```bash
   # This will be available in future versions
   pnpm seed:run --upsert
   ```

3. **Manually clear specific collection**:
   ```sql
   psql "$DATABASE_URI" -c "TRUNCATE TABLE payload.course_lessons CASCADE;"
   ```

**Prevention**: Always reset before full seed, or use collection filtering.

---

## Error Message Reference

### Format

All error messages follow this pattern:

```
[LEVEL] [Component][Collection][Record]: Message
  Additional context
  Suggested action
```

**Example**:
```
✗ course-lessons[lesson-3]: Reference resolution failed
  Unresolved reference: {ref:courses:nonexistent}
  Ensure collection "courses" with identifier "nonexistent" has been seeded.
```

### Error Levels

- `✗` **ERROR**: Critical failure, seeding stopped
- `⚠` **WARN**: Non-critical issue, seeding continues
- `ℹ` **INFO**: Informational message
- `✓` **SUCCESS**: Operation completed successfully

### Common Error Prefixes

| Prefix | Component | Meaning |
|--------|-----------|---------|
| `Environment validation failed` | CLI | Missing or invalid environment variables |
| `SAFETY CHECK FAILED` | CLI | Production seeding blocked |
| `Database connection failed` | Initializer | Cannot connect to PostgreSQL |
| `Failed to load collection` | JSON Loader | JSON parsing or file read error |
| `Validation failed` | Data Validator | Pre-seed validation errors |
| `Reference resolution failed` | Reference Resolver | Unresolved `{ref:...}` pattern |
| `Database error` | Processor | Payload API or PostgreSQL error |
| `Initialization failed` | Orchestrator | Payload initialization error |

---

## Debugging Techniques

### 1. Verbose Logging

Enable detailed per-record logging:

```bash
pnpm seed:run --verbose
```

**Output includes**:
- Each record being processed
- Reference resolution details
- Database query information
- Timing for each operation

**Use When**: Debugging specific record failures or understanding flow.

---

### 2. Dry-Run Validation

Validate without side effects:

```bash
pnpm seed:dry
```

**What It Checks**:
- JSON file parsing
- Reference pattern syntax
- Dependency ordering
- Required fields presence

**Use When**: Before committing JSON changes or debugging data issues.

---

### 3. Collection Filtering

Test specific collections in isolation:

```bash
# Test only users collection
pnpm seed:run -c users

# Test courses and dependencies
pnpm seed:run -c courses,course-lessons
```

**Use When**: Isolating which collection is causing issues.

---

### 4. Database Inspection

Check database state directly:

```sql
-- Connect to database
psql "$DATABASE_URI"

-- List all tables
\dt payload.*

-- Count records per collection
SELECT 'courses' as collection, COUNT(*) FROM payload.courses
UNION ALL
SELECT 'course_lessons', COUNT(*) FROM payload.course_lessons
UNION ALL
SELECT 'quiz_questions', COUNT(*) FROM payload.quiz_questions;

-- Check relationships
SELECT parent_id, path, downloads_id, courses_id
FROM payload.course_lessons_rels
LIMIT 10;
```

**Use When**: Verifying data was created correctly or debugging relationships.

---

### 5. Reference Cache Inspection

Add debug logging to see cache state:

```typescript
// In seed-orchestrator.ts (temporary debugging)
const stats = this.resolver.getCacheStats();
console.log('Cache contains', stats.size, 'entries');
console.log('Collections:', stats.collections.join(', '));
```

**Use When**: Debugging reference resolution issues.

---

### 6. JSON Validation Script

Create a validation script:

```bash
#!/bin/bash
# validate-seed-data.sh

for file in apps/payload/src/seed/seed-data/*.json; do
  echo "Validating $file..."
  node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" || exit 1
done

echo "All JSON files valid!"
```

**Use When**: Pre-commit validation or CI/CD checks.

---

## Performance Issues

### Slow Seeding (>2 minutes)

**Symptom**: Seeding takes longer than expected.

**Diagnosis**:

1. **Check slowest collections**:
   ```bash
   pnpm seed:run --verbose | grep "Duration:"
   ```

2. **Monitor database performance**:
   ```sql
   SELECT query, calls, mean_exec_time, total_exec_time
   FROM pg_stat_statements
   WHERE query LIKE '%INSERT%' OR query LIKE '%SELECT%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Check system resources**:
   ```bash
   # CPU usage
   top -p $(pgrep -f "seed-engine")
   
   # Memory usage
   ps aux | grep seed-engine
   ```

**Solutions**:

1. **Use collection filtering**:
   ```bash
   pnpm seed:courses  # Only seed what you need
   ```

2. **Increase database resources** (Docker):
   ```yaml
   # docker-compose.yml
   services:
     postgres:
       environment:
         POSTGRES_MAX_CONNECTIONS: 100
         POSTGRES_SHARED_BUFFERS: 256MB
   ```

3. **Restart Supabase** to clear cache:
   ```bash
   pnpm supabase:web:restart
   ```

---

### High Memory Usage

**Symptom**: Node process uses >1GB RAM.

**Diagnosis**:

```bash
node --expose-gc --trace-gc apps/payload/src/seed/seed-engine/index.ts
```

**Solutions**:

1. **Use collection filtering** to reduce memory footprint
2. **Increase heap size**: `NODE_OPTIONS="--max-old-space-size=4096"`
3. **Check for memory leaks** in custom processors

---

## FAQ

### Q: Can I run seeding multiple times?

**A**: Currently, no (idempotency not yet implemented). Running twice will cause duplicate key violations. Always reset database first:

```bash
pnpm supabase:web:reset
pnpm seed:run
```

**Future**: Idempotent seeding with `--upsert` flag (planned feature).

---

### Q: How do I add a new collection to seeding?

**A**: Follow these steps:

1. **Create JSON file**:
   ```bash
   touch apps/payload/src/seed/seed-data/my-collection.json
   ```

2. **Add to config**:
   ```typescript
   // apps/payload/src/seed/seed-engine/config.ts
   export const COLLECTION_CONFIGS = {
     'my-collection': {
       name: 'my-collection',
       dataFile: 'my-collection.json',
       processor: 'content',
       dependencies: ['users'],  // Collections this depends on
     },
   };
   ```

3. **Add to seed order**:
   ```typescript
   export const SEED_ORDER = [
     // ... existing collections
     'my-collection',  // Add in correct dependency order
   ];
   ```

4. **Validate and test**:
   ```bash
   pnpm seed:dry
   pnpm seed:run -c my-collection
   ```

---

### Q: How do I handle large Lexical content?

**A**: Large Lexical content is supported. Current largest is `survey-questions.json` (246 records, 15,000+ lines).

**Tips**:
- Keep Lexical JSON well-formatted for readability
- Use markdown conversion utilities to generate Lexical
- Validate Lexical structure before seeding

---

### Q: Can I seed production?

**A**: **NO**. Seeding is blocked in production (`NODE_ENV=production`). This is a safety feature.

**If you need production data**, use:
- Database backups/restores
- Data migration scripts
- Manual admin UI entry

---

### Q: What happens if a record fails?

**A**: Depends on error type:

- **Transient errors** (network, locks): Retried 3 times with backoff
- **Validation errors**: Record skipped, seeding continues
- **Critical errors** (missing refs): Seeding stops immediately

**Check logs** for specific failure details.

---

### Q: How do I clear seeded data?

**A**: Use Supabase reset:

```bash
pnpm supabase:web:reset  # Drops all data, reapplies migrations
```

**Or clear specific collections**:

```sql
TRUNCATE TABLE payload.course_lessons CASCADE;
```

---

### Q: Can I modify seed data while seeding is running?

**A**: Not recommended. JSON files are loaded at start, so changes won't be reflected mid-run.

**Best Practice**: Stop seeding, modify files, restart:

```bash
# Ctrl+C to stop
# Edit JSON files
pnpm seed:run  # Restart
```

---

### Q: What's the difference between `seed:run` and `seed:dry`?

**A**:

| Command | Creates Records | Validates Data | Updates Database |
|---------|----------------|----------------|------------------|
| `seed:run` | ✅ Yes | ✅ Yes | ✅ Yes |
| `seed:dry` | ❌ No | ✅ Yes | ❌ No |

**Use `seed:dry`** for testing without side effects.

---

## Still Stuck?

1. **Check logs** with `--verbose` flag
2. **Review implementation plan**: `.claude/tracking/implementations/payload-seed/plan.md`
3. **Search test files** for examples: `apps/payload/src/seed/seed-engine/**/*.test.ts`
4. **Open GitHub issue** with:
   - Error message (full output)
   - Command used
   - Environment details (`node -v`, `pnpm -v`)
   - JSON data causing issue (sanitized)

---

## See Also

- [Seeding Guide](./seeding-guide.md) - Complete usage guide
- [Seeding Architecture](./seeding-architecture.md) - Technical details
- [Implementation Plan](./../../../tracking/implementations/payload-seed/plan.md) - Design decisions
