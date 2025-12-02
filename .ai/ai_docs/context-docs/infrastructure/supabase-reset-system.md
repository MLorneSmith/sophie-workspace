---
# Identity
id: "supabase-reset-system"
title: "Supabase Reset & Payload Seeding System"
version: "1.0.0"
category: "implementation"

# Discovery
description: "Complete local database reset workflow including Supabase database reset, Payload CMS migrations, and seed file generation for development environments"
tags: ["supabase", "payload", "seeding", "reset", "database", "migrations", "local-development", "cms"]

# Relationships
dependencies:
  - id: "database-seeding-strategy"
    type: "prerequisite"
    description: "Dual-mode seeding approach (local vs remote)"
cross_references:
  - id: "database-patterns"
    type: "related"
    description: "RLS patterns and migration workflows"
  - id: "docker-setup"
    type: "related"
    description: "Docker environment for local Supabase"

# Maintenance
created: "2025-12-02"
last_updated: "2025-12-02"
author: "create-context"
---

# Supabase Reset & Payload Seeding System

## Overview

SlideHeroes implements a comprehensive two-tier database reset and seeding system optimized for local development:

1. **Supabase Layer**: Manages PostgreSQL database, authentication, and core business data
2. **Payload CMS Layer**: Manages content collections (courses, lessons, posts, quizzes)

The system is orchestrated via the `/supabase-reset` slash command, which coordinates:
- Docker container management
- Database schema reset via migrations
- Payload schema creation and migrations
- Content seeding with dependency resolution

**Key Statistics**:
- 60+ Payload tables created
- 252 records seeded across 12 content collections
- 5-phase workflow with validation at each step

## System Architecture

### Two-Tier Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────┤
│  PUBLIC Schema (Supabase)      │  PAYLOAD Schema (CMS)      │
│  ├─ auth.users                 │  ├─ payload.users          │
│  ├─ accounts                   │  ├─ payload.courses        │
│  ├─ memberships                │  ├─ payload.course_lessons │
│  ├─ subscriptions              │  ├─ payload.course_quizzes │
│  ├─ testimonials               │  ├─ payload.posts          │
│  └─ onboarding                 │  ├─ payload.media          │
│                                │  ├─ payload.downloads      │
│                                │  └─ ... (60+ tables)       │
└─────────────────────────────────────────────────────────────┘
```

### Component Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Reset Command | `.claude/commands/supabase-reset.md` | Orchestrates reset workflow |
| Supabase Config | `apps/web/supabase/config.toml` | Database ports, seed paths |
| SQL Seeds | `apps/web/supabase/seeds/*.sql` | Auth users, accounts, test data |
| Payload Seed Engine | `apps/payload/src/seed/seed-engine/` | Content seeding orchestrator |
| Seed Data (JSON) | `apps/payload/src/seed/seed-data/` | Converted content files |
| Raw Seed Data | `apps/payload/src/seed/seed-data-raw/` | Markdown/YAML sources |
| Helper Scripts | `.ai/ai_scripts/database/` | Validation and cleanup utilities |

## Complete Reset Workflow

### Phase 1: Environment Validation

**Purpose**: Pre-flight checks before destructive operations

**Validations**:
1. Docker daemon running
2. Supabase CLI available
3. Required bash scripts exist
4. Payload configuration consistency (collections match between configs)

**Script**: `.ai/ai_scripts/database/validate-payload-config.sh`

```bash
# Validates that payload.config.ts and payload.seeding.config.ts
# have matching collection definitions
```

### Phase 2: Supabase Reset

**Purpose**: Clean database slate with schema applied

**Steps**:
1. Cleanup conflicting ports (54521-54527)
2. Stop existing Supabase instance
3. Start Supabase containers
4. Reset database with migrations applied

**Key Commands**:
```bash
# Port cleanup (prevents conflicts)
bash .ai/ai_scripts/development/cleanup-ports.sh 54521 54527

# Start Supabase
cd apps/web && npx supabase start

# Reset database (applies all migrations + seeds)
echo "n" | npx supabase db reset
```

**What `supabase db reset` Does**:
1. Drops entire local database
2. Applies all migrations from `apps/web/supabase/migrations/`
3. Runs seed files configured in `config.toml`:
   - `./seeds/01_main_seed.sql` - Core test users
   - `./seeds/02_e2e_test_users.sql` - E2E test users

### Phase 3: Payload Schema & Migrations

**Purpose**: Create CMS tables in the payload schema

**Critical Migration**: `20250327_create_payload_schema.sql`
- Creates the `payload` schema
- Drops existing payload schema with CASCADE (clean slate)
- Includes production safety guard

**Running Migrations**:
```bash
cd apps/payload
DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54522/postgres?sslmode=disable" \
  NODE_TLS_REJECT_UNAUTHORIZED=0 \
  pnpm run payload migrate --forceAcceptWarning
```

**Expected Result**: 60+ tables in the payload schema

### Phase 4: Content Seeding

**Purpose**: Populate Payload collections with content

**Seed Engine Flow**:
```
JSON Files → Seed Engine → Dependency Resolution → Database Insert
```

**Commands**:
```bash
# Seed all collections
pnpm --filter payload seed:run

# Dry-run validation
pnpm --filter payload seed:dry

# Seed specific collections
pnpm --filter payload seed:courses

# Verbose output
pnpm --filter payload seed:validate --verbose
```

### Phase 5: Verification

**Purpose**: Validate final database state

**Checks**:
1. Supabase status (all services running)
2. Database connectivity
3. Record counts per collection

## Payload Seed Engine

### Dependency-Based Seed Order

Collections are seeded in strict order based on foreign key dependencies:

```typescript
// Level 0: Independent (no foreign keys)
'users', 'media', 'downloads'

// Level 1: Depend on Level 0
'posts', 'courses', 'private', 'quiz-questions', 'survey-questions'

// Level 2: Depend on Level 0-1
'course-quizzes', 'documentation'

// Level 3: Depend on Level 0-2
'course-lessons', 'surveys'
```

### Circular Reference Handling

Some collections have bidirectional relationships:

```typescript
// course-lessons.quiz_id → course-quizzes
// course-quizzes.lesson → course-lessons (circular!)

CIRCULAR_REFERENCES = {
  'course-lessons': {
    fields: ['quiz_id', 'survey_id'],
    targetCollection: 'course-quizzes',
  },
  'course-quizzes': {
    fields: ['lesson'],
    targetCollection: 'course-lessons',
  },
}
```

**Resolution**: Two-pass seeding
1. First pass: Skip circular reference fields
2. Second pass: Resolve and update circular references

### Reference Pattern

Seed data uses reference patterns for foreign keys:

```json
{
  "title": "Lesson 1",
  "course": "{ref:courses:ddm}",
  "quiz_id": "{ref:course-quizzes:lesson-1-quiz}"
}
```

**Pattern Format**: `{ref:collection:identifier}`
- `collection`: Target collection slug
- `identifier`: The `_ref` field value in target record

### Collection Configurations

Each collection has a configuration in `seed-engine/config.ts`:

```typescript
COLLECTION_CONFIGS = {
  'course-lessons': {
    name: 'course-lessons',
    dataFile: 'course-lessons.json',
    processor: 'content',
    dependencies: ['courses', 'course-quizzes', 'media', 'downloads'],
  },
  // ...
}
```

## Seed Data Sources

### Raw Data Location

`apps/payload/src/seed/seed-data-raw/`

```
seed-data-raw/
├── courses/           # Course definitions (YAML)
├── lessons/           # Lesson content (Markdown)
├── quizzes/           # Quiz definitions (YAML)
├── posts/             # Blog posts (Markdown)
├── documentation/     # Help docs (Markdown)
├── mappings/          # Reference mapping files
└── bpm/               # Business process models
```

### Conversion to JSON

Raw files are converted to Payload-ready JSON:

```bash
# Convert raw data to JSON
pnpm --filter payload seed:convert

# Dry-run conversion
pnpm --filter payload seed:convert:dry
```

**Conversion System Location**: `apps/payload/src/seed/seed-conversion/`

### Final JSON Seeds

`apps/payload/src/seed/seed-data/`

| File | Records | Description |
|------|---------|-------------|
| users.json | 1 | CMS admin user |
| media.json | 24 | Image/video references |
| downloads.json | 20 | Downloadable files |
| posts.json | 8 | Blog articles |
| courses.json | 1 | Course definition |
| course-lessons.json | 25 | Lesson content |
| course-quizzes.json | 20 | Quiz definitions |
| quiz-questions.json | 94 | Quiz questions |
| survey-questions.json | 32 | Survey questions |
| surveys.json | 3 | Survey definitions |
| documentation.json | 19 | Help documentation |
| private.json | 5 | Private content |

## Configuration Files

### Supabase Config (`apps/web/supabase/config.toml`)

```toml
[db]
port = 54522           # Database port (custom to avoid conflicts)
major_version = 17     # PostgreSQL version

[db.seed]
sql_paths = ['./seeds/*.sql']  # Seed files to run on reset

[api]
schemas = ["public", "storage", "graphql_public", "payload"]
extra_search_path = ["public", "extensions", "payload"]
```

### Payload Seeding Config (`apps/payload/src/payload.seeding.config.ts`)

- PostgreSQL adapter with serverless pooling
- Max 2 connections (serverless-optimized)
- All 12 content collections configured
- Production safety blocking

## Command Reference

### Primary Commands

```bash
# Full reset + seed (recommended daily workflow)
/supabase-reset

# Reset without seeding
/supabase-reset --schema-only

# Fresh Payload migrations (after config changes)
/supabase-reset --regenerate-payload-migrations

# Verbose logging
/supabase-reset --verbose
```

### Manual Commands

```bash
# Start Supabase
pnpm supabase:web:start

# Reset database only
pnpm supabase:web:reset

# Generate TypeScript types (after schema changes)
pnpm supabase:web:typegen

# Seed Payload CMS
pnpm --filter payload seed:run

# Convert raw data
pnpm --filter payload seed:convert
```

## Helper Scripts

### Validation Scripts

| Script | Purpose |
|--------|---------|
| `validate-payload-config.sh` | Check collection consistency |
| `validate-seeding-config.sh` | Verify environment and imports |

### Cleanup Scripts

| Script | Purpose |
|--------|---------|
| `cleanup-ports.sh` | Kill processes on Supabase ports |
| `cleanup-payload-tables.sh` | Truncate Payload tables (prevent duplicates) |

### Migration Scripts

| Script | Purpose |
|--------|---------|
| `regenerate-payload-migrations.sh` | Delete and regenerate all Payload migrations |

## Troubleshooting

### Common Issues

**1. Port Conflicts**
```
ERROR: Port 54521 already in use
```
**Solution**: Script auto-cleans, or manually:
```bash
lsof -ti:54521 | xargs kill -9
```

**2. Collection Not Found During Seeding**
```
ERROR: Collection 'downloads' can't be found
```
**Solution**: Migration-config mismatch. Use:
```bash
/supabase-reset --regenerate-payload-migrations
```

**3. Duplicate Records**
```
ERROR: Duplicate records detected (2x expected)
```
**Solution**: Cleanup failed. Run full reset:
```bash
/supabase-reset --regenerate-payload-migrations
```

**4. Migration Already Applied**
```
ERROR: Migration failed - table already exists
```
**Solution**: Schema drift. Regenerate migrations:
```bash
/supabase-reset --regenerate-payload-migrations
```

**5. Payload Schema Not Found**
```
ERROR: Payload schema not found after Supabase reset
```
**Solution**: Check migration `20250327_create_payload_schema.sql` exists

### Recovery Procedure

If reset fails mid-process:

1. Check which phase failed via progress output
2. Stop Supabase: `cd apps/web && npx supabase stop`
3. Kill processes: `pkill -f "supabase"`
4. Full restart: `/supabase-reset --regenerate-payload-migrations`

## Best Practices

### When to Use Each Flag

| Scenario | Command |
|----------|---------|
| Daily development | `/supabase-reset` |
| Just need schema (no content) | `/supabase-reset --schema-only` |
| Added new Payload collection | `/supabase-reset --regenerate-payload-migrations` |
| Modified collection schema | `/supabase-reset --regenerate-payload-migrations` |
| Debugging issues | `/supabase-reset --verbose` |
| After Payload CMS upgrade | `/supabase-reset --regenerate-payload-migrations` |

### Maintaining Seed Data

1. **Edit raw files** in `seed-data-raw/` (Markdown, YAML)
2. **Run conversion**: `pnpm --filter payload seed:convert`
3. **Test seeding**: `pnpm --filter payload seed:dry`
4. **Apply**: `pnpm --filter payload seed:run`

### Adding New Collections

1. Add collection to `payload.config.ts`
2. Add collection to `payload.seeding.config.ts`
3. Create `collection-name.json` in `seed-data/`
4. Add configuration to `seed-engine/config.ts`:
   - Add to `SEED_ORDER` at appropriate level
   - Add to `COLLECTION_CONFIGS` with dependencies
   - Add to `PRODUCTION_COLLECTIONS`
5. Run: `/supabase-reset --regenerate-payload-migrations`

## Environment Variables

### Required for Seeding

```bash
# PostgreSQL connection (auto-set for local)
DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54522/postgres?sslmode=disable"

# Payload secret
PAYLOAD_SECRET="your-secret-key"

# Environment (blocks production seeding)
NODE_ENV="development"

# SSL disabled for local Supabase
PAYLOAD_ENABLE_SSL=false
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Local Supabase Ports

| Port | Service |
|------|---------|
| 54521 | Supabase API |
| 54522 | PostgreSQL |
| 54523 | Supabase Studio |
| 54524 | Inbucket (email) |
| 54525 | Analytics |
| 54526 | Meta |
| 54527 | Functions |

## Quick Reference

### Expected Seeding Results

```
✅ Supabase Reset Complete!

**Phase Results:**
✅ Phase 1: Environment validated
✅ Phase 2: Supabase started and database reset
✅ Phase 3: Payload migrations applied (60 tables)
✅ Phase 4: Seeding complete (252/252 records)
✅ Phase 5: Database verified

**Record Counts:**
- users: 1
- media: 24
- downloads: 20
- posts: 8
- courses: 1
- course_lessons: 25
- course_quizzes: 20
- quiz_questions: 94
- survey_questions: 32
- surveys: 3
- documentation: 19
- private: 5
```

### File Structure Summary

```
apps/web/supabase/
├── config.toml               # Supabase configuration
├── seeds/                    # SQL seed files (auth, accounts)
├── schemas/                  # Schema source files
└── migrations/               # Applied migrations

apps/payload/src/seed/
├── seed-data/                # JSON seed files (Payload)
├── seed-data-raw/            # Raw source files
├── seed-conversion/          # Raw → JSON conversion
└── seed-engine/              # Seeding orchestrator
    ├── config.ts             # Seed order & configs
    ├── core/                 # Orchestrator logic
    ├── loaders/              # JSON file loading
    ├── processors/           # Data processors
    ├── resolvers/            # Reference resolution
    └── validators/           # Post-seed validation

.ai/ai_scripts/database/
├── validate-payload-config.sh
├── validate-seeding-config.sh
├── cleanup-payload-tables.sh
└── regenerate-payload-migrations.sh
```

## Related Documentation

- **Seeding Strategy**: `infrastructure/database-seeding.md` - Dual-mode seeding approach
- **Database Patterns**: `development/database-patterns.md` - RLS and migration patterns
- **Slash Command**: `.claude/commands/supabase-reset.md` - Full command implementation
