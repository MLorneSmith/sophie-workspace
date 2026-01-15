# Alpha Implementation System

The Alpha Implementation System orchestrates autonomous code implementation across E2B sandboxes using Claude Code sessions.

## Overview

This system is the final piece of the Alpha Autonomous Coding workflow:

1. **Spec** (`/alpha:spec`) - Define what to build
2. **Initiative Decompose** (`/alpha:initiative-decompose`) - Break into initiatives
3. **Feature Decompose** (`/alpha:feature-decompose`) - Break into features
4. **Task Decompose** (`/alpha:task-decompose`) - Break into atomic tasks
5. **Implement** (`spec-orchestrator.ts` + `/alpha:implement`) - **Build it all**

## Architecture

### Spec-Level Orchestration

The orchestrator runs at the **Spec level**, not Initiative level:

```
tsx spec-orchestrator.ts 1362   ← Run with Spec ID

Spec #1362 (user-dashboard-home)
├── Initiative #1363 (dashboard-foundation)
│   ├── Feature #1367 ← Sandbox A takes this
│   ├── Feature #1368 ← Sandbox B takes this
│   ├── Feature #1369 ← Next available sandbox takes this
│   └── Feature #1370
├── Initiative #1364 (activity-feed)
│   ├── Feature #1371 [blocked by #1363]
│   └── ...
└── Initiative #1365 (coaching-integration)
    └── ...
```

**Key benefits:**
- **Single command** implements all features across all initiatives
- **Automatic progress tracking** - stop and restart anytime
- **Dependency-aware** - features only run when their dependencies complete
- **Work queue pattern** - sandboxes dynamically pull next available feature
- **Real-time progress polling** - see task progress during feature execution
- **Stall detection** - automatically detects hung Claude sessions

### Work Queue with Dependency Checking

Sandboxes don't get upfront feature assignments. Instead, they pull from a shared queue:

```
Feature Queue (priority order):
┌────────────────────────────────────────────────────────────────┐
│ [F1367] [F1368] [F1369] [F1370] [F1371*] [F1372*] [F1373] ... │
│    ↑       ↑                      * blocked by #1363          │
│    │       └── Sandbox B grabs this                           │
│    └────────── Sandbox A grabs this                           │
└────────────────────────────────────────────────────────────────┘
```

When a sandbox finishes a feature:
1. It asks for the next feature
2. Queue checks: Is the feature pending? Are all dependencies complete?
3. If yes → assign it. If no → check next feature in queue.

This means:
- **No idle sandboxes** - if there's unblocked work, a sandbox will pick it up
- **Dependencies respected** - blocked features wait until dependencies complete
- **Load balanced** - faster sandbox takes more work automatically

## Components

### 1. Spec Manifest Generator

**Location**: `.ai/alpha/scripts/generate-spec-manifest.ts`

Aggregates all initiatives and features under a spec into a single manifest.

**Usage**:
```bash
tsx .ai/alpha/scripts/generate-spec-manifest.ts <spec-id>
```

**Output**: `spec-manifest.json` in the spec directory with:
- All initiatives and their status
- Ordered feature queue (by initiative priority, then feature priority)
- Feature dependencies
- Progress tracking state

### 2. Spec Orchestrator

**Location**: `.ai/alpha/scripts/spec-orchestrator.ts`

TypeScript script that:
- Takes **Spec ID** (not Initiative ID)
- Creates E2B sandboxes with work queue pattern
- Sandboxes dynamically pull features when ready
- Respects feature and initiative dependencies
- Auto-resumes from where it left off

**Usage**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id> [options]

Options:
  --sandboxes <n>, -s   Number of sandboxes (default: 3, max: 3)
  --timeout <s>         Sandbox timeout in seconds (default: 3600)
  --dry-run             Show execution plan without running
```

**Example**:
```bash
# Preview execution plan
tsx spec-orchestrator.ts 1362 --dry-run

# Run with 3 sandboxes (default)
tsx spec-orchestrator.ts 1362

# Single sandbox mode
tsx spec-orchestrator.ts 1362 -s 1

# Two sandbox mode
tsx spec-orchestrator.ts 1362 -s 2

# Re-run to continue (automatic resume)
tsx spec-orchestrator.ts 1362
```

### 3. Alpha Implement Command

**Location**: `.claude/commands/alpha/implement.md`

Slash command run inside E2B sandbox to implement a single feature's tasks.

**Usage** (inside sandbox):
```
/alpha:implement <feature-id>
```

**Responsibilities**:
- Load feature tasks from tasks.json
- Execute tasks in group order
- Run verification commands
- Update progress file
- Make commits after each group
- Exit cleanly at 60% context usage

## Workflow

### Complete Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                     ALPHA IMPLEMENTATION                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Generate Spec Manifest                                       │
│     └─→ tsx generate-spec-manifest.ts 1362                       │
│                                                                  │
│  2. Start Orchestrator                                           │
│     └─→ tsx spec-orchestrator.ts 1362                            │
│                                                                  │
│  3. Orchestrator Actions:                                        │
│     ├─→ Create E2B sandboxes (3 by default)                      │
│     ├─→ All sandboxes share branch: alpha/spec-1362              │
│     ├─→ Progress polling displays real-time task updates         │
│     └─→ Sandboxes pull features from queue                       │
│                                                                  │
│  4. Work Queue Loop:                                             │
│     ├─→ Sandbox asks: "What's next?"                            │
│     ├─→ Queue finds first pending feature with deps met          │
│     ├─→ Sandbox runs: /alpha:implement <feature-id>              │
│     ├─→ On completion: update manifest, ask for next            │
│     └─→ Repeat until queue empty                                │
│                                                                  │
│  5. On Completion or Interrupt:                                  │
│     ├─→ Progress saved to spec-manifest.json                    │
│     └─→ Changes pushed to GitHub                                │
│                                                                  │
│  6. Resume (if needed):                                          │
│     └─→ Re-run same command - auto-continues from checkpoint    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Automatic Resume

The orchestrator automatically resumes from where it left off:

```bash
# First run - completes features 1-5, then interrupted
tsx spec-orchestrator.ts 1362
# Progress: 5/13 features completed

# Second run - continues from feature 6
tsx spec-orchestrator.ts 1362
# Reads spec-manifest.json, sees 5 completed, starts from 6
```

No `--resume` flag needed - the system always reads current progress.

## File Structure

```
.ai/alpha/
├── scripts/
│   ├── generate-spec-manifest.ts    # Aggregates spec into manifest
│   ├── spec-orchestrator.ts         # Main orchestration script
│   ├── generate-initiative-manifest.ts  # (Legacy - per-initiative)
│   └── alpha-orchestrator.ts        # (Legacy - per-initiative)
├── templates/
│   └── *.schema.json
└── specs/
    └── <spec-id>-Spec-<name>/
        ├── spec-manifest.json       # Spec-level manifest
        ├── research-library/
        └── <init-id>-Initiative-<name>/
            ├── initiative.md
            └── <feature-id>-Feature-<name>/
                ├── feature.md
                └── tasks.json

.claude/commands/alpha/
├── spec.md
├── initiative-decompose.md
├── feature-decompose.md
├── task-decompose.md
└── implement.md
```

## Dependency Handling

### Feature Dependencies

Features can depend on other features within the same initiative using **internal F# references**:

```markdown
### Blocked By
- F1: Activity Database Schema (needs table to insert into)
```

Or using **GitHub issue numbers** (optional):

```markdown
### Blocked By
- #1367 (Dashboard Page must exist first)
```

**Dependency Resolution Process:**

The `generate-spec-manifest.ts` script uses a **two-pass process**:

1. **Pass 1 - Collection**: Collects all features and builds a mapping:
   - Extracts Feature ID from metadata (e.g., `| **Feature ID** | 1365-F1 |`)
   - Maps `initiative_id-F#` → `feature_id` (e.g., `1365-1` → `1373`)

2. **Pass 2 - Resolution**: Resolves internal references:
   - `F1` in initiative 1365 → looks up `1365-1` → returns feature #1373
   - GitHub issue numbers (`#1367`) are used directly

**Important**: The mapping uses **Feature ID** (e.g., `1365-F1`), not **Priority**. This ensures correct resolution even if priorities are duplicated or out of order.

Example output from manifest generation:
```
🔗 Pass 2: Resolving dependencies...
   Activity Recording Service: depends on [1373]
   Activity Feed Component: depends on [1374]
```

The orchestrator:
1. Extracts dependencies from `feature.md` files (both F# and #issue formats)
2. Resolves internal F# references to actual feature IDs
3. Won't assign a feature until all dependencies are `completed`
4. Skips blocked features, assigns next available one

### Initiative Dependencies

Features can also depend on entire initiatives:

```markdown
### Blocked By
- #1363 (Requires dashboard foundation initiative complete)
```

When initiative #1363 has all features completed, features blocked by it become available.

## Branch Strategy

All sandboxes work on the same spec branch:

```
Branch: alpha/spec-1362

Sandbox A ────commit────commit────push────
                                    │
Sandbox B ────commit────commit─────push────
                                    │
                                    ▼
                            alpha/spec-1362
                            (all work combined)
```

Sandboxes coordinate via git:
1. Each sandbox pulls latest before starting a feature
2. Each sandbox pushes after completing a feature
3. Sequential pushes avoid merge conflicts

## Progress Tracking

### Spec Manifest Progress

The `spec-manifest.json` tracks:
- Overall spec status
- Each initiative's status
- Each feature's status (pending/in_progress/completed/failed)
- Which sandbox is working on what
- Next feature to implement
- Last completed feature

### Feature Progress File

Inside sandbox, `.initiative-progress.json` tracks:
- Current task being executed (with status and started_at timestamp)
- Current execution group
- Completed tasks list
- Failed tasks list
- Context usage percentage
- Heartbeat timestamp (for stall detection)
- Phase (loading_context, executing, verifying, committing, etc.)

### Progress Polling & Stall Detection

The orchestrator provides real-time visibility into feature execution:

**Progress Polling** (every 30 seconds):
- Reads `.initiative-progress.json` from sandbox
- Displays structured progress: task completion, current task, group progress
- Shows context usage percentage
- Displays heartbeat age (indicates if session is still active)

**Stall Detection** (every 60 seconds):
- Checks if heartbeat timestamp is older than 10 minutes
- Checks if current task stuck in "starting" status for too long
- Logs warning if stall is detected

**Heartbeat Protocol**:
- The `/alpha:implement` command updates `last_heartbeat` periodically
- During long operations (file reads, sub-agent calls), heartbeat is updated
- Allows orchestrator to distinguish "working" from "stuck"

Example progress display:
```
   ┌─ 📊 [sbx-a] Progress Update ───────────────────────────────────
   │ Tasks: [████████░░░░░░░░░░░░] 8/20 (40%)
   │ Phase: verifying
   │ Current: 🔄 [T9] Create data loader
   │ Verification: attempt 2
   │ Group: Data Layer (2/4)
   │ Context: 📈 35%
   │ Heartbeat: 💓 15s ago
   └───────────────────────────────────────────────────────────────
```

## Error Handling

### Context Limit
When Claude Code reaches 60% context usage:
1. Current state saved
2. Session exits cleanly
3. Orchestrator marks feature as partial
4. Re-runs feature from checkpoint

### Feature Failure
When a feature fails:
1. Marked as `failed` in manifest
2. Error message recorded
3. Sandbox moves to next feature
4. Failed features can be retried on re-run

### Sandbox Timeout
E2B sandbox has configurable timeout (default 1 hour):
1. Manifest saved continuously
2. Re-run orchestrator to continue
3. Picks up from next pending feature

## Environment Variables

**Required**:
- `E2B_API_KEY` - E2B platform access
- `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` - Claude access

**Optional**:
- `GITHUB_TOKEN` - For git push

**Sandbox Database (for features requiring database work)**:
- `SUPABASE_SANDBOX_PROJECT_REF` - Sandbox project reference ID
- `SUPABASE_SANDBOX_URL` - Sandbox project URL
- `SUPABASE_SANDBOX_ANON_KEY` - Sandbox anon key
- `SUPABASE_SANDBOX_SERVICE_ROLE_KEY` - Sandbox service role key
- `SUPABASE_SANDBOX_DB_URL` - Sandbox database connection URL (**IMPORTANT**: Must be kept current - see Troubleshooting below)
- `SUPABASE_ACCESS_TOKEN` - CLI access token for linking

**⚠️ Credential Maintenance**: The `SUPABASE_SANDBOX_DB_URL` contains the database password which may need periodic updates. If you see "password authentication failed" errors, obtain the current password from Supabase Dashboard > Project Settings > Database and update the `.env` file.

**Payload CMS Seeding (for test data)**:
- `PAYLOAD_SECRET` - Payload CMS secret key
- `SEED_USER_PASSWORD` - Password for seeded test users
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret key
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_MEDIA_BUCKET` - R2 media bucket name
- `R2_DOWNLOADS_BUCKET` - R2 downloads bucket name
- `R2_REGION` - R2 region (e.g., `auto`)
- `PAYLOAD_PUBLIC_MEDIA_BASE_URL` - R2 media bucket CDN URL
- `PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL` - R2 downloads bucket CDN URL

**Implementation Reference**: See `supabase-sandbox-integration-plan.md` for the original design document and detailed manual setup instructions.

## Database Seeding (Supabase Sandbox Integration)

### Overview

At orchestration startup, the sandbox database is automatically reset and seeded with Payload CMS data. This provides a clean, reproducible database state with test users, media files, courses, and other content for development.

The seeding system is based on the `/supabase-reset` slash command but adapted for remote Supabase sandbox projects (since E2B cannot run Docker for local Supabase).

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SANDBOX DATABASE LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Local Machine (orchestrator)         E2B Sandbox                           │
│  ┌─────────────────────────┐         ┌─────────────────────────┐           │
│  │ 1. Check DB capacity    │         │                         │           │
│  │ 2. Reset public schema  │─────────┤ Remote Supabase         │           │
│  │    (DROP CASCADE)       │  psql   │ Sandbox Project         │           │
│  │ 3. Apply migrations     │─────────┤                         │           │
│  └─────────────────────────┘         └─────────────────────────┘           │
│           │                                     ▲                           │
│           ▼                                     │                           │
│  ┌─────────────────────────┐                   │                           │
│  │ 4. Create First Sandbox │                   │                           │
│  └─────────────────────────┘                   │                           │
│           │                                     │                           │
│           ▼                                     │                           │
│  ┌─────────────────────────┐                   │                           │
│  │ 5. Seed via Sandbox     │───────────────────┘                           │
│  │    - Payload migrate    │    NODE_TLS_REJECT_UNAUTHORIZED=0             │
│  │    - Payload seed:run   │    (SSL handling for remote DB)               │
│  └─────────────────────────┘                                               │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────┐                                               │
│  │ 6. Create Remaining     │  All sandboxes share the seeded database      │
│  │    Sandboxes            │                                               │
│  └─────────────────────────┘                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Seeding Flow (Detailed)

```
1. Database Reset (orchestrator, local)
   └── Check database capacity (warn if >450MB of 500MB limit)
   └── DROP SCHEMA public CASCADE
   └── CREATE SCHEMA public with grants
   └── Apply Supabase migrations via `supabase db push`

2. Create First Sandbox
   └── Clone repo, setup environment
   └── Link Supabase CLI to sandbox project

3. Seed Database via First Sandbox
   └── Run Payload migrations:
       cd apps/payload && NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning
   └── Run Payload seeding:
       cd apps/payload && NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run seed:run --force
   └── Verify seeded data (check payload.users count)

4. Create Remaining Sandboxes
   └── All sandboxes share the seeded database
   └── No additional seeding required
```

### SSL Handling

Remote Supabase connections require SSL. The orchestrator handles this by:
- Setting `NODE_TLS_REJECT_UNAUTHORIZED=0` for Payload commands (allows self-signed certs)
- Adding `?sslmode=require` to DATABASE_URI for Payload CMS
- Using the Supabase pooler connection string (Session mode) for reliability

### Seeded Content

After seeding, the database contains (257 records across 12 collections):

| Collection | Records | Description |
|------------|---------|-------------|
| `users` | 1 | Admin user for authentication testing |
| `media` | 24 | R2-hosted images with CDN URLs |
| `downloads` | 20 | R2-hosted documents (PDFs, etc.) |
| `posts` | 8 | Blog content |
| `courses` | 1 | Complete course structure |
| `course_lessons` | 25 | Course lesson content |
| `course_quizzes` | 20 | Quiz definitions |
| `quiz_questions` | 94 | Various question types |
| `surveys` | 3 | Survey definitions |
| `survey_questions` | 32 | Survey question content |
| `documentation` | 19 | Documentation pages |
| `private` | 5 | Private/restricted posts |

**Note**: Media files are pre-uploaded to Cloudflare R2 buckets. Seeding only inserts database records with R2 URLs - it does not upload files.

### R2 Storage Integration

The seeding process uses production R2 buckets for media files:
- Media URLs are stored in `payload.media.url` column
- Download URLs are stored in `payload.downloads.url` column
- The `PAYLOAD_PUBLIC_MEDIA_BASE_URL` and `PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL` environment variables provide CDN base URLs

This approach avoids file upload complexity while providing realistic test data.

### Auto-Detection of Seeded Database

On resume, the orchestrator automatically detects if seeding has already occurred:

```typescript
// Checks if payload.users has any records
const result = psql "${dbUrl}" -c "SELECT COUNT(*) FROM payload.users"
if (count > 0) {
  // Skip seeding - database already has data
}
```

This prevents duplicate records on orchestration restart.

### Skipping Reset and Seeding

Use command-line flags to control database operations:

```bash
# Skip both reset and seeding (for debugging)
tsx spec-orchestrator.ts 1362 --skip-db-reset --skip-db-seed

# Skip only seeding (run reset but keep existing data pattern)
tsx spec-orchestrator.ts 1362 --skip-db-seed

# Normal operation (reset + seed on first run, auto-skip seed on resume)
tsx spec-orchestrator.ts 1362
```

### Seeding Failures

If seeding fails, check these common causes:

| Error | Cause | Fix |
|-------|-------|-----|
| "Migration failed" | Missing Payload schema | Check Supabase migrations include `create_payload_schema.sql` |
| "Collection not found" | Migration/config mismatch | Update Payload migrations to match config |
| "Connection refused" | Wrong DB URL | Verify `SUPABASE_SANDBOX_DB_URL` is correct |
| "SSL required" | Missing SSL in connection | Orchestrator handles this automatically |
| "Permission denied" | Wrong credentials | Check `SUPABASE_SANDBOX_SERVICE_ROLE_KEY` |
| "User already exists" | Duplicate seeding | Use `--force` flag or reset database |
| "password authentication failed" | Expired or incorrect DB password | Get current password from Supabase Dashboard > Project Settings > Database and update `SUPABASE_SANDBOX_DB_URL` in `.env` |

**Debug commands**:
```bash
# Check if Payload schema exists
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='payload'"

# Check seeded data counts
psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='payload'"
```

## Database Feature Handling

### Overview

Features that include database tasks (schema changes, migrations, RLS policies) require special handling:

1. **Sandbox Supabase Project** - A dedicated Supabase project for E2B sandboxes
2. **Serialized Execution** - Only one database feature runs at a time
3. **Type Generation** - TypeScript types generated after schema changes

### Identifying Database Features

The manifest includes database indicators:
- `requires_database: true` - Feature has database tasks
- `database_task_count: N` - Number of DB tasks in feature

In feature queue output:
```
   ⏳ [1] #1367: Dashboard Page & Grid Layout 🗄️
                                              ↑ Database indicator
```

### Serialization Logic

Database features are serialized to prevent migration conflicts:

```
Feature Queue:
[F1367 🗄️] [F1368] [F1369 🗄️] [F1370] [F1371 🗄️]
    ↓
Sandbox A takes F1367 (DB feature)
Sandbox B takes F1368 (non-DB feature) - runs in parallel
Sandbox C waits - cannot take F1369 until F1367 completes
```

When a database feature is `in_progress`:
- Other sandboxes can only pick up non-database features
- Ensures only one sandbox modifies the database at a time
- Prevents migration filename conflicts

### Task-Level Database Handling

Database tasks in `tasks.json` have:
```json
{
  "id": "T3",
  "name": "Create user_activities table schema",
  "requires_database": true,
  "migration_name_prefix": "1367_T3"
}
```

The `migration_name_prefix` ensures unique migration filenames across parallel features.

### Orchestrator Startup

On startup, the orchestrator:
1. **Checks database capacity** - Warns if sandbox DB is near 500MB limit
2. **Resets database** (optional) - Clean slate for each run
3. **Sets up Supabase CLI** - Links each sandbox to the sandbox project

Use `--skip-db-reset` to skip database reset when resuming a partially complete run.

## Prerequisites

Before running the orchestrator:

1. Complete task decomposition for all features in all initiatives:
   ```bash
   /alpha:task-decompose 1363
   /alpha:task-decompose 1364
   /alpha:task-decompose 1365
   ```

2. Generate the spec manifest:
   ```bash
   tsx .ai/alpha/scripts/generate-spec-manifest.ts 1362
   ```

3. Set environment variables:
   ```bash
   export E2B_API_KEY=<your-key>
   export GITHUB_TOKEN=<your-token>
   # Claude auth auto-detected from ~/.claude/.credentials.json
   ```

## Example Run

```bash
$ tsx spec-orchestrator.ts 1362

══════════════════════════════════════════════════════════════════════
   ALPHA SPEC ORCHESTRATOR
══════════════════════════════════════════════════════════════════════

🔒 Acquired orchestrator lock

📊 Checking sandbox database...
   📊 Sandbox database size: 45.2MB / 500MB
🔄 Resetting sandbox database...
   ✅ Database schema reset
   📦 Applying base migrations...
   ✅ Base migrations applied

📊 Spec #1362: user dashboard home
   Initiatives: 4
   Features: 13
   Tasks: 108
   Progress: 0/13 features
   Sandboxes: 3

🎯 Next feature: #1367 - Dashboard Page & Grid Layout

📦 Creating first sandbox...

📦 Creating sandbox sbx-a...
   ID: sbx_abc123
   Checking out branch: alpha/spec-1362
   Setting up Supabase CLI...
   Found Supabase CLI: 2.x.x
   Linking to sandbox project: abcdefghijklmnop
   ✅ Supabase CLI linked to sandbox project

🌱 Seeding sandbox database...
   📦 Running Payload migrations...
   ✅ Payload migrations complete
   🌱 Running Payload seeding...
   ✅ Payload seeding complete
   🔍 Verifying seeded data...
   ✅ Verified: 1 user(s) seeded

   ⏳ Waiting 20s before next sandbox...

📦 Creating sandbox sbx-b...
   ID: sbx_def456
   Checking out branch: alpha/spec-1362
   Setting up Supabase CLI...
   ✅ Supabase CLI linked to sandbox project

   ⏳ Waiting 20s before next sandbox...

📦 Creating sandbox sbx-c...
   ID: sbx_ghi789
   Checking out branch: alpha/spec-1362
   Setting up Supabase CLI...
   ✅ Supabase CLI linked to sandbox project

══════════════════════════════════════════════════════════════════════
   SANDBOXES READY
══════════════════════════════════════════════════════════════════════
   sbx-a: sbx_abc123
   sbx-b: sbx_def456
   sbx-c: sbx_ghi789
   Branch: alpha/spec-1362

══════════════════════════════════════════════════════════════════════
   IMPLEMENTATION
══════════════════════════════════════════════════════════════════════

   ┌── [sbx-a] Feature #1367: Dashboard Page & Grid Layout
   │   Tasks: 20
   │   Progress polling every 30s...
   │   Running: /alpha:implement 1367

   ┌─ 📊 [sbx-a] Progress Update ───────────────────────────────────
   │ Tasks: [████████░░░░░░░░░░░░] 8/20 (40%)
   │ Phase: executing
   │ Current: 🔄 [T9] Create dashboard loader
   │ Group: Data Layer (2/4)
   │ Context: 📈 25%
   │ Heartbeat: 💓 12s ago
   └───────────────────────────────────────────────────────────────

   │   ... [more progress updates] ...
   └── ✅ completed (20/20 tasks)

   ┌── [sbx-b] Feature #1368: Presentation Outline Table
   │   Tasks: 12
   │   Running: /alpha:implement 1368
   │   ... [implementation output with progress polling] ...
   └── ✅ completed (12/12 tasks)

   ┌── [sbx-c] Feature #1369: Quick Actions Panel
   │   Tasks: 6
   │   ...
   └── ✅ completed (6/6 tasks)

... [continues until all features done] ...

🔄 Preparing sandbox for complete review...
   sbx-a: Pulling latest changes...
   sbx-a: ✅ Has complete code
   sbx-b: Stopping (partial code only)...
   sbx-c: Stopping (partial code only)...

🚀 Starting dev server for review...
   sbx-a: Dev server starting...
   Waiting for dev server to start (30s)...

══════════════════════════════════════════════════════════════════════
   SUMMARY
══════════════════════════════════════════════════════════════════════

📊 Results:
   Initiatives: 4/4
   Features: 13/13
   Failed: 0
   Tasks: 108/108

🌿 Branch: alpha/spec-1362
⏱️ Duration: 35 minutes

══════════════════════════════════════════════════════════════════════
   REVIEW YOUR WORK
══════════════════════════════════════════════════════════════════════

🔗 Review URLs (sandboxes kept alive for review):

   sbx-a:
      VS Code:    https://sbx_abc123-8080.e2b.dev
      Dev Server: https://sbx_abc123-3000.e2b.dev

──────────────────────────────────────────────────────────────────────
⚠️  IMPORTANT: Sandboxes are still running!
   When done reviewing, manually kill them with:

   npx e2b sandbox kill sbx_abc123

──────────────────────────────────────────────────────────────────────

📊 Database Review:
   Supabase Studio: https://supabase.com/dashboard/project/abcdefghijklmnop

══════════════════════════════════════════════════════════════════════

🔓 Released orchestrator lock
✅ Spec implementation complete!
```

## Migration from Initiative-Level Orchestrator

The old `alpha-orchestrator.ts` still exists for backwards compatibility but is deprecated.

| Old (Initiative-level) | New (Spec-level) |
|------------------------|------------------|
| `tsx alpha-orchestrator.ts 1363` | `tsx spec-orchestrator.ts 1362` |
| Run per initiative | Run once per spec |
| `initiative-manifest.json` | `spec-manifest.json` |
| `--resume` flag needed | Auto-resume |
| Upfront feature assignment | Dynamic work queue |

Migrate by:
1. Generate spec manifest: `tsx generate-spec-manifest.ts <spec-id>`
2. Use new orchestrator: `tsx spec-orchestrator.ts <spec-id>`
