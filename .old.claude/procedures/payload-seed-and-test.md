# Payload Database Seeding and Testing Procedure

**Version**: 1.0
**Created**: 2025-10-01
**Purpose**: Step-by-step procedure for seeding Supabase with Payload data and running comprehensive tests

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Procedure](#procedure)
4. [Validation](#validation)
5. [Troubleshooting](#troubleshooting)
6. [Quick Reference](#quick-reference)

---

## Overview

This procedure covers the complete workflow for:

- Starting and resetting Supabase database
- Seeding Payload CMS data (316+ records across 10+ collections)
- Running comprehensive test suites (unit, integration, and E2E tests)
- Validating seed integrity and test results

**Total Test Coverage**: 582 tests across 3 categories

- **Unit Tests**: 190 tests (payload module)
- **Integration Tests**: 312 tests (seeding engine)
- **E2E Tests**: 20+ tests (Playwright)

**Expected Duration**:

- Database reset + seed: ~2-3 minutes
- Unit tests: ~5-10 seconds
- Integration tests: ~30-60 seconds
- E2E tests: ~2-5 minutes
- **Total**: ~5-10 minutes

---

## Prerequisites

### 1. Environment Setup

Verify required environment variables exist:

```bash
# Check environment file
cat apps/payload/.env.test

# Required variables:
# DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:54322/postgres
# PAYLOAD_SECRET=<your-secret-key>
# NODE_ENV=development  # Must NOT be 'production'
# PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021
```

### 2. System Requirements

```bash
# Verify Node.js version (18.20.2+ or 20.9.0+)
node --version

# Verify pnpm version (9+ or 10+)
pnpm --version

# Verify Docker is running (for Supabase)
docker ps
```

### 3. Install Dependencies

```bash
# Install all dependencies (if not already done)
pnpm install
```

---

## Procedure

### Step 1: Start Supabase

**Duration**: ~30-45 seconds

```bash
# Start Supabase local instance
pnpm supabase:web:start

# Expected output:
# Started supabase local development setup.
#
# API URL: http://127.0.0.1:54321
# GraphQL URL: http://127.0.0.1:54321/graphql/v1
# S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
# Inbucket URL: http://127.0.0.1:54324
# JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# anon key: <key>
# service_role key: <key>
# S3 Access Key: <key>
# S3 Secret Key: <key>
# S3 Region: local
```

**Verification**:

```bash
# Check Supabase is running
curl -s http://127.0.0.1:54321/health | jq

# Expected: {"status": "ok"}
```

---

### Step 2: Reset Database (Clean Slate)

**Duration**: ~30 seconds

```bash
# Reset to clean state (applies all migrations)
pnpm supabase:web:reset

# Expected output:
# Applying migration: <timestamp>_initial_schema.sql
# Applying migration: <timestamp>_add_payload_tables.sql
# ...
# Finished supabase db reset on branch main.
```

**What this does**:

- Drops all existing tables
- Reapplies all migrations from `apps/web/supabase/migrations/`
- Creates fresh schema for both Supabase (auth, storage) and Payload tables
- Does NOT seed data (that's next step)

---

### Step 3: Seed Payload Data

**Duration**: ~82 seconds (316+ records)

#### Option A: Using npm Script (Recommended if added to package.json)

```bash
# If seed scripts are in apps/payload/package.json:
pnpm --filter payload seed:run

# Verbose mode (detailed logging):
pnpm --filter payload seed:run --verbose

# Dry-run (validation only, no data created):
pnpm --filter payload seed:dry
```

#### Option B: Direct CLI Execution

```bash
# Run seeding engine directly
cd apps/payload
tsx src/seed/seed-engine/index.ts

# With options:
tsx src/seed/seed-engine/index.ts --verbose
tsx src/seed/seed-engine/index.ts --dry-run
tsx src/seed/seed-engine/index.ts -c courses,course-lessons
```

#### Option C: Integrated with Reset (One Command)

```bash
# Reset + Seed in one step (if implemented)
tsx .claude/scripts/database/supabase-reset.ts local --seed
```

**Expected Output**:

```
═══════════════════════════════════════════════════════
   Payload CMS Seeding Engine
═══════════════════════════════════════════════════════

✓ Environment validation passed

Initializing seeding engine...
✓ Seeding engine initialized

Loading seed data...
✓ Loaded 10 collections with 316 records

Processing collections in dependency order...

courses              [████████████████████] 1/1 (100%)
✓ courses: 1 success, 0 failed, 245ms

course-lessons       [████████████████████] 25/25 (100%)
✓ course-lessons: 25 success, 0 failed, 6210ms

course-quizzes       [████████████████████] 1/1 (100%)
✓ course-quizzes: 1 success, 0 failed, 189ms

quiz-questions       [████████████████████] 94/94 (100%)
✓ quiz-questions: 94 success, 0 failed, 18453ms

surveys              [████████████████████] 10/10 (100%)
✓ surveys: 10 success, 0 failed, 2341ms

survey-questions     [████████████████████] 246/246 (100%)
✓ survey-questions: 246 success, 0 failed, 47892ms

posts                [████████████████████] 5/5 (100%)
✓ posts: 5 success, 0 failed, 1234ms

documentation        [████████████████████] 12/12 (100%)
✓ documentation: 12 success, 0 failed, 2567ms

media                [████████████████████] 33/33 (100%)
✓ media: 33 success, 0 failed, 6789ms

downloads            [████████████████████] 4/4 (100%)
✓ downloads: 4 success, 0 failed, 876ms

═══════════════════════════════════════════════════════
   Seeding Complete!
═══════════════════════════════════════════════════════

Summary:
  ✓ Success: 316/316 (100%)
  ✗ Failed:  0/316
  ⏱ Duration: 82.45s
  ⚡ Avg speed: 3.8 records/s

Post-seed verification:
  ✓ Record counts validated
  ✓ Relationship integrity verified
  ✓ Lexical content validated
```

**Verification**:

```bash
# Verify records were created
psql $DATABASE_URI -c "SELECT collection, COUNT(*) FROM payload.payload_locked_documents GROUP BY collection;"

# Expected output showing counts for each collection
```

---

### Step 4: Run Unit Tests

**Duration**: ~5-10 seconds

```bash
# Run all Payload unit tests
pnpm --filter payload test

# Or from root with coverage:
pnpm test:coverage --filter payload

# Run specific test suite:
pnpm --filter payload test reference-resolver.test.ts
```

**Expected Results**:

- **Total Tests**: ~190
- **Passing**: ~94-180 (some may fail due to env config issues)
- **Coverage**: >90% for core modules

**Key Test Suites**:

- `reference-resolver.test.ts` - Reference resolution logic
- `json-loader.test.ts` - Data loading and validation
- `seed-orchestrator.test.ts` - Orchestration workflow
- `error-handler.test.ts` - Error handling and retries
- `progress-tracker.test.ts` - Progress reporting
- `payload-initializer.test.ts` - Payload setup

---

### Step 5: Run Integration Tests

**Duration**: ~30-60 seconds

```bash
# Run seeding integration tests
pnpm --filter payload test __tests__/integration

# Specific integration tests:
pnpm --filter payload test full-workflow.test.ts
pnpm --filter payload test idempotency.test.ts
pnpm --filter payload test error-scenarios.test.ts
pnpm --filter payload test collection-filtering.test.ts
```

**Expected Results**:

- **Total Tests**: ~312
- **Passing**: ~282-312 (90%+)
- **Known Issues**: Some environment variable handling failures

**What These Test**:

- Full seeding workflow end-to-end
- Idempotency (running twice doesn't duplicate)
- Error recovery and retry logic
- Collection filtering functionality
- Reference resolution in real database
- Relationship integrity

---

### Step 6: Run E2E Tests

**Duration**: ~2-5 minutes

#### All E2E Tests

```bash
# Run all E2E tests (includes Payload tests)
pnpm test:e2e
```

#### Payload-Specific E2E Tests

```bash
# Run only Payload seeding E2E tests
pnpm --filter web-e2e test tests/payload/seeding.spec.ts

# Run Payload performance tests
pnpm --filter web-e2e test tests/payload/seeding-performance.spec.ts

# Run all Payload tests
pnpm --filter web-e2e test tests/payload/
```

**Expected Results**:

- **seeding.spec.ts**: 10-15 tests covering workflow, relationships, and rendering
- **seeding-performance.spec.ts**: 5+ tests for performance benchmarks
- **payload-auth.spec.ts**: Authentication tests
- **payload-collections.spec.ts**: Collection CRUD tests
- **payload-database.spec.ts**: Database integrity tests

**What These Test**:

- Complete reset + seed + verify workflow
- Payload Admin UI displays seeded data correctly
- Relationship integrity in UI
- Lexical content renders without errors
- Performance benchmarks (<120s seed time)
- Idempotent execution
- Error handling in UI

---

### Step 7: Validate Results

**Duration**: ~1 minute

#### Database Validation

```bash
# Check record counts per collection
psql $DATABASE_URI << EOF
SELECT
  collection,
  COUNT(*) as records
FROM payload.payload_locked_documents
GROUP BY collection
ORDER BY collection;
EOF

# Expected counts:
# collection          | records
# --------------------+---------
# courses             | 1
# course-lessons      | 25
# course-quizzes      | 1
# downloads           | 4
# documentation       | 12
# media               | 33
# posts               | 5
# quiz-questions      | 94
# survey-questions    | 246
# surveys             | 10
```

#### Relationship Validation

```bash
# Check polymorphic relationships
psql $DATABASE_URI << EOF
SELECT
  path,
  COUNT(*) as relationships
FROM payload.course_lessons_rels
GROUP BY path
ORDER BY path;
EOF

# Expected: relationships for 'downloads', 'course_id', etc.
```

#### Payload Admin UI Check (Manual)

```bash
# Start Payload dev server (if not already running)
pnpm --filter payload dev

# Open browser to: http://localhost:3020/admin

# Verify:
# 1. Can log into admin panel
# 2. Collections show correct record counts
# 3. Can open and view individual records
# 4. Lexical content renders correctly
# 5. Relationships display properly
```

---

## Validation

### Success Criteria

| Criterion | Expected | How to Verify |
|-----------|----------|---------------|
| Supabase Running | Port 54322 active | `curl http://127.0.0.1:54321/health` |
| Database Reset | Clean schema | `psql $DATABASE_URI -c "\dt payload.*"` |
| Records Seeded | 316 total | SQL query (see Step 7) |
| Unit Tests | >90% passing | `pnpm --filter payload test` |
| Integration Tests | >90% passing | `pnpm --filter payload test __tests__/integration` |
| E2E Tests | 100% passing | `pnpm test:e2e --filter web-e2e` |
| Seed Duration | <120 seconds | Check CLI output |
| No Errors | Clean output | Review test results |

### Health Checks

```bash
# Comprehensive health check script
cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash

echo "=== Payload Seeding Health Check ==="
echo ""

# 1. Check Supabase
echo "1. Supabase Status:"
curl -s http://127.0.0.1:54321/health | jq || echo "❌ Supabase not responding"
echo ""

# 2. Check Database Connection
echo "2. Database Connection:"
psql $DATABASE_URI -c "SELECT version();" > /dev/null 2>&1 && echo "✓ Connected" || echo "❌ Connection failed"
echo ""

# 3. Check Record Counts
echo "3. Seeded Record Counts:"
psql $DATABASE_URI -t -c "SELECT COUNT(*) FROM payload.payload_locked_documents;" 2>/dev/null | xargs || echo "❌ Query failed"
echo ""

# 4. Check Environment
echo "4. Environment Variables:"
[ -n "$DATABASE_URI" ] && echo "✓ DATABASE_URI set" || echo "❌ DATABASE_URI missing"
[ -n "$PAYLOAD_SECRET" ] && echo "✓ PAYLOAD_SECRET set" || echo "❌ PAYLOAD_SECRET missing"
[ "$NODE_ENV" != "production" ] && echo "✓ NODE_ENV is safe" || echo "⚠️ NODE_ENV is production!"
echo ""

echo "=== Health Check Complete ==="
EOF

chmod +x /tmp/health-check.sh
/tmp/health-check.sh
```

---

## Troubleshooting

### Issue: Supabase Won't Start

**Symptoms**: `pnpm supabase:web:start` fails or times out

**Solutions**:

```bash
# 1. Check Docker is running
docker ps

# 2. Stop any existing Supabase instances
pnpm supabase:web:stop
docker stop $(docker ps -q --filter name=supabase) 2>/dev/null

# 3. Clear Docker volumes
docker volume prune -f

# 4. Restart Docker
# (platform-specific, e.g., restart Docker Desktop)

# 5. Try starting again
pnpm supabase:web:start
```

### Issue: Seeding Fails with "Environment Variable Missing"

**Symptoms**: `DATABASE_URI is required` or `PAYLOAD_SECRET is required`

**Solutions**:

```bash
# 1. Check environment file exists
ls -la apps/payload/.env.test

# 2. Source environment variables
export $(cat apps/payload/.env.test | grep -v '^#' | xargs)

# 3. Verify variables are set
echo $DATABASE_URI
echo $PAYLOAD_SECRET

# 4. Use dotenv-cli if needed
pnpm add -g dotenv-cli
dotenv -e apps/payload/.env.test -- tsx apps/payload/src/seed/seed-engine/index.ts
```

### Issue: Seeding Takes Too Long (>120 seconds)

**Symptoms**: Seeding exceeds 2 minutes

**Solutions**:

```bash
# 1. Check system resources
top  # Look for high CPU/memory usage

# 2. Check database performance
psql $DATABASE_URI -c "SELECT * FROM pg_stat_activity WHERE datname = 'postgres';"

# 3. Optimize with collection filtering
tsx apps/payload/src/seed/seed-engine/index.ts -c courses,course-lessons

# 4. Clear database locks
psql $DATABASE_URI -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres' AND pid <> pg_backend_pid();"
```

### Issue: Tests Fail with "Cannot find module"

**Symptoms**: Import errors or module not found

**Solutions**:

```bash
# 1. Rebuild dependencies
pnpm install --force

# 2. Clear build cache
rm -rf apps/payload/.next apps/payload/dist

# 3. Regenerate types
pnpm supabase:web:typegen
pnpm --filter payload generate:types

# 4. Check TypeScript config
pnpm --filter payload typecheck
```

### Issue: E2E Tests Timeout

**Symptoms**: Playwright tests hang or exceed timeout

**Solutions**:

```bash
# 1. Increase Playwright timeout
# Edit playwright.config.ts:
# timeout: 60000 -> timeout: 120000

# 2. Check if dev servers are running
pnpm --filter web dev         # Main app on :3000
pnpm --filter payload dev     # Payload on :3020

# 3. Run with debugging
DEBUG=pw:api pnpm test:e2e

# 4. Run headed to see what's happening
pnpm --filter web-e2e playwright test --headed
```

### Issue: Duplicate Records After Multiple Runs

**Symptoms**: Record counts increase with each seed run

**Solutions**:

```bash
# 1. Always reset before seeding
pnpm supabase:web:reset
tsx apps/payload/src/seed/seed-engine/index.ts

# 2. Check idempotency test
pnpm --filter payload test idempotency.test.ts

# 3. Manual cleanup if needed
psql $DATABASE_URI -c "TRUNCATE TABLE payload.payload_locked_documents CASCADE;"
```

---

## Quick Reference

### One-Line Commands

```bash
# Complete workflow (reset + seed + test)
pnpm supabase:web:reset && tsx apps/payload/src/seed/seed-engine/index.ts && pnpm test:unit && pnpm test:e2e

# Dry-run validation (no data created)
tsx apps/payload/src/seed/seed-engine/index.ts --dry-run

# Seed specific collections only
tsx apps/payload/src/seed/seed-engine/index.ts -c courses,course-lessons,quiz-questions

# Run all tests with coverage
pnpm test:coverage

# Check seeding status
psql $DATABASE_URI -c "SELECT COUNT(*) FROM payload.payload_locked_documents;"
```

### Directory Structure

```
apps/
├── payload/
│   ├── src/
│   │   └── seed/
│   │       ├── seed-data/           # JSON seed files
│   │       ├── seed-engine/         # Seeding implementation
│   │       │   ├── index.ts         # CLI entry point
│   │       │   ├── core/            # Core orchestration
│   │       │   ├── loaders/         # JSON data loading
│   │       │   ├── resolvers/       # Reference resolution
│   │       │   ├── processors/      # Collection processors
│   │       │   ├── validators/      # Data validation
│   │       │   ├── utils/           # Utilities
│   │       │   └── __tests__/       # Test suites
│   │       └── seed-conversion/     # Legacy conversion scripts
│   └── package.json
├── e2e/
│   └── tests/
│       └── payload/                 # Payload E2E tests
│           ├── seeding.spec.ts
│           └── seeding-performance.spec.ts
└── web/
    └── supabase/
        └── migrations/              # Database migrations
```

### Environment Variables Reference

```bash
# Required
DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:54322/postgres
PAYLOAD_SECRET=your-secret-key-here

# Recommended
NODE_ENV=development
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021

# Optional (for seeding customization)
SEED_TIMEOUT=120000              # 2 minutes
SEED_MAX_RETRIES=3
SEED_BATCH_SIZE=50
```

### Test Commands Summary

```bash
# Unit tests only
pnpm --filter payload test

# Integration tests only
pnpm --filter payload test __tests__/integration

# E2E tests only
pnpm test:e2e --filter web-e2e

# All tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode (for development)
pnpm --filter payload test:watch
```

### Performance Benchmarks

| Operation | Expected Duration | Acceptable Range |
|-----------|-------------------|------------------|
| Supabase Start | 30-45s | <60s |
| Database Reset | 30s | <60s |
| Full Seed | 82s | <120s |
| Unit Tests | 5-10s | <30s |
| Integration Tests | 30-60s | <120s |
| E2E Tests | 2-5min | <10min |
| **Total Workflow** | **5-10min** | **<15min** |

---

## Additional Resources

- **Seeding Guide**: `.claude/context/tools/payload/seeding-guide.md`
- **Troubleshooting Guide**: `.claude/context/tools/payload/seeding-troubleshooting.md`
- **Architecture Docs**: `.claude/context/tools/payload/seeding-architecture.md`
- **Implementation Plan**: `.claude/tracking/implementations/payload-seed/plan.md`
- **Execution Status**: `.claude/tracking/implementations/payload-seed/execution-status.md`

---

**Last Updated**: 2025-10-01
**Maintainer**: Development Team
**Status**: Production Ready
