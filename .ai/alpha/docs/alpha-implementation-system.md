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
tsx spec-orchestrator.ts 1362   ← Run with Spec ID (GitHub issue number)

S1362 (user-dashboard-home)
├── S1362.I1 (dashboard-foundation)
│   ├── S1362.I1.F1 ← Sandbox A takes this
│   ├── S1362.I1.F2 ← Sandbox B takes this
│   ├── S1362.I1.F3 ← Next available sandbox takes this
│   └── S1362.I1.F4
├── S1362.I2 (activity-feed)
│   ├── S1362.I2.F1 [blocked by S1362.I1]
│   └── ...
└── S1362.I3 (coaching-integration)
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
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [S1362.I1.F1] [S1362.I1.F2] [S1362.I1.F3] [S1362.I2.F1*] [S1362.I2.F2*] [S1362.I3.F1] │
│       ↑            ↑                             * blocked by S1362.I1                  │
│       │            └── Sandbox B grabs this                                             │
│       └────────────── Sandbox A grabs this                                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
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

The Alpha system uses **hierarchical semantic IDs** for local tracking:
- Format: `S<spec#>.I<init-priority>.F<feat-priority>.T<task-priority>`
- Example: `S1362.I1.F2.T3` = Spec #1362, Initiative priority 1, Feature priority 2, Task priority 3

**Directory naming convention:**
- Specs: `S<spec#>-Spec-<slug>/` (e.g., `S1362-Spec-user-dashboard-home/`)
- Initiatives: `S<spec#>.I<priority>-Initiative-<slug>/` (e.g., `S1362.I1-Initiative-dashboard-foundation/`)
- Features: `S<spec#>.I#.F<priority>-Feature-<slug>/` (e.g., `S1362.I1.F2-Feature-presentation-outline/`)

```
.ai/alpha/
├── scripts/
│   ├── generate-spec-manifest.ts    # Aggregates spec into manifest
│   ├── spec-orchestrator.ts         # Main orchestration script
│   ├── generate-initiative-manifest.ts  # (Legacy - per-initiative)
│   └── alpha-orchestrator.ts        # (Legacy - per-initiative)
├── templates/
│   └── *.schema.json
├── docs/
│   ├── alpha-implementation-system.md  # This file
│   └── hierarchical-ids.md             # ID system documentation
└── specs/
    └── S<spec-id>-Spec-<name>/         # e.g., S1362-Spec-user-dashboard-home/
        ├── spec-manifest.json          # Spec-level manifest
        ├── research-library/
        └── S<spec-id>.I<priority>-Initiative-<name>/   # e.g., S1362.I1-Initiative-dashboard-foundation/
            ├── initiative.md
            └── S<spec-id>.I#.F<priority>-Feature-<name>/   # e.g., S1362.I1.F2-Feature-presentation-outline/
                ├── feature.md
                └── tasks.json          # Contains S1362.I1.F2.T1, T2, T3, etc.

.claude/commands/alpha/
├── spec.md
├── initiative-decompose.md
├── feature-decompose.md
├── task-decompose.md
└── implement.md
```

**Note:** The system also supports legacy numeric ID formats for backward compatibility (e.g., `1362-Spec-*`, `1363-Initiative-*`).

## Dependency Handling

### Feature Dependencies

Features can depend on other features using **semantic F# references** within the same initiative:

```markdown
### Blocked By
- F1: Activity Database Schema (needs table to insert into)
```

Or using **full semantic IDs** for cross-initiative dependencies:

```markdown
### Blocked By
- S1362.I1.F2: Dashboard Grid Layout (needs grid component)
```

**Legacy support**: GitHub issue numbers (`#1367`) are still supported for backward compatibility.

**Dependency Resolution Process:**

The `generate-spec-manifest.ts` script uses a **two-pass process**:

1. **Pass 1 - Collection**: Collects all features and builds a mapping:
   - Extracts Feature ID from metadata (e.g., `| **Feature ID** | S1362.I1.F1 |`)
   - Maps short `F#` → full semantic ID within same initiative

2. **Pass 2 - Resolution**: Resolves references:
   - `F1` in initiative S1362.I1 → resolves to `S1362.I1.F1`
   - Full semantic IDs (`S1362.I1.F2`) are used directly
   - Legacy issue numbers (`#1367`) are still supported

**Important**: All IDs are now **strings** (semantic IDs like `S1362.I1.F1` or legacy numeric strings like `"1367"`).

Example output from manifest generation:
```
🔗 Pass 2: Resolving dependencies...
   Activity Recording Service: depends on [S1362.I1.F1]
   Activity Feed Component: depends on [S1362.I1.F2]
```

The orchestrator:
1. Extracts dependencies from `feature.md` files (F#, semantic IDs, or legacy #issue formats)
2. Resolves internal F# references to full semantic IDs
3. Won't assign a feature until all dependencies are `completed`
4. Skips blocked features, assigns next available one

### Initiative Dependencies

Features can also depend on entire initiatives:

```markdown
### Blocked By
- S1362.I1 (Requires dashboard foundation initiative complete)
```

When initiative S1362.I1 has all features completed, features blocked by it become available.

**Legacy format**: `#1363` (GitHub issue number) is still supported for backward compatibility.

## Branch Strategy

All sandboxes work on the same spec branch:

```
Branch: alpha/S1362   (or alpha/spec-1362 for legacy)

Sandbox A ────commit────commit────push────
                                    │
Sandbox B ────commit────commit─────push────
                                    │
                                    ▼
                              alpha/S1362
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
[S1362.I1.F1 🗄️] [S1362.I1.F2] [S1362.I1.F3 🗄️] [S1362.I2.F1] [S1362.I2.F2 🗄️]
        ↓
Sandbox A takes S1362.I1.F1 (DB feature)
Sandbox B takes S1362.I1.F2 (non-DB feature) - runs in parallel
Sandbox C waits - cannot take S1362.I1.F3 until S1362.I1.F1 completes
```

When a database feature is `in_progress`:
- Other sandboxes can only pick up non-database features
- Ensures only one sandbox modifies the database at a time
- Prevents migration filename conflicts

### Task-Level Database Handling

Database tasks in `tasks.json` have:
```json
{
  "id": "S1362.I1.F1.T3",
  "name": "Create user_activities table schema",
  "requires_database": true,
  "migration_name_prefix": "S1362_I1_F1_T3"
}
```

The `migration_name_prefix` uses the semantic ID (with underscores replacing dots) to ensure unique migration filenames across parallel features.

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
   /alpha:task-decompose S1362.I1   # or legacy: /alpha:task-decompose 1363
   /alpha:task-decompose S1362.I2
   /alpha:task-decompose S1362.I3
   ```

2. Generate the spec manifest:
   ```bash
   tsx .ai/alpha/scripts/generate-spec-manifest.ts 1362   # Uses GitHub issue number
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

📊 Spec S1362: user dashboard home
   Initiatives: 4
   Features: 13
   Tasks: 108
   Progress: 0/13 features
   Sandboxes: 3

🎯 Next feature: S1362.I1.F1 - Dashboard Page & Grid Layout

📦 Creating first sandbox...

📦 Creating sandbox sbx-a...
   ID: sbx_abc123
   Checking out branch: alpha/S1362
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
   Checking out branch: alpha/S1362
   Setting up Supabase CLI...
   ✅ Supabase CLI linked to sandbox project

   ⏳ Waiting 20s before next sandbox...

📦 Creating sandbox sbx-c...
   ID: sbx_ghi789
   Checking out branch: alpha/S1362
   Setting up Supabase CLI...
   ✅ Supabase CLI linked to sandbox project

══════════════════════════════════════════════════════════════════════
   SANDBOXES READY
══════════════════════════════════════════════════════════════════════
   sbx-a: sbx_abc123
   sbx-b: sbx_def456
   sbx-c: sbx_ghi789
   Branch: alpha/S1362

══════════════════════════════════════════════════════════════════════
   IMPLEMENTATION
══════════════════════════════════════════════════════════════════════

   ┌── [sbx-a] Feature S1362.I1.F1: Dashboard Page & Grid Layout
   │   Tasks: 20
   │   Progress polling every 30s...
   │   Running: /alpha:implement S1362.I1.F1

   ┌─ 📊 [sbx-a] Progress Update ───────────────────────────────────
   │ Tasks: [████████░░░░░░░░░░░░] 8/20 (40%)
   │ Phase: executing
   │ Current: 🔄 [S1362.I1.F1.T9] Create dashboard loader
   │ Group: Data Layer (2/4)
   │ Context: 📈 25%
   │ Heartbeat: 💓 12s ago
   └───────────────────────────────────────────────────────────────

   │   ... [more progress updates] ...
   └── ✅ completed (20/20 tasks)

   ┌── [sbx-b] Feature S1362.I1.F2: Presentation Outline Table
   │   Tasks: 12
   │   Running: /alpha:implement S1362.I1.F2
   │   ... [implementation output with progress polling] ...
   └── ✅ completed (12/12 tasks)

   ┌── [sbx-c] Feature S1362.I1.F3: Quick Actions Panel
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

🌿 Branch: alpha/S1362
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
| GitHub issue IDs (numbers) | Semantic IDs (strings: S#.I#.F#) |
| `1363-Initiative-*` directories | `S1362.I1-Initiative-*` directories |

Migrate by:
1. Generate spec manifest: `tsx generate-spec-manifest.ts <spec-id>`
2. Use new orchestrator: `tsx spec-orchestrator.ts <spec-id>`

**Note:** The system supports both legacy numeric IDs (e.g., `1367`) and new semantic IDs (e.g., `S1362.I1.F1`) for backward compatibility.

## Orchestrator Event Streaming

### Overview

The orchestrator emits real-time events for database operations and other setup tasks to the event server. These events are displayed in the UI dashboard, providing visibility into orchestrator-side operations that were previously hidden when running in UI mode (where console output is suppressed).

### Event Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR EVENT STREAMING                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Orchestrator (local)                     Event Server (local)              │
│  ┌─────────────────────────┐             ┌─────────────────────────┐       │
│  │ Database Operations     │             │                         │       │
│  │ - Capacity check        │  HTTP POST  │ FastAPI Server          │       │
│  │ - Schema reset          │────────────►│ - /api/events endpoint  │       │
│  │ - Migration apply       │             │ - Event storage         │       │
│  │ - Payload seeding       │             │ - WebSocket broadcast   │       │
│  └─────────────────────────┘             └──────────┬──────────────┘       │
│                                                      │                      │
│                                                      │ WebSocket            │
│                                                      ▼                      │
│                                          ┌─────────────────────────┐       │
│                                          │ UI Dashboard (Ink)      │       │
│                                          │ - EventLog component    │       │
│                                          │ - Real-time display     │       │
│                                          └─────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event Types

Database operation events emitted by the orchestrator:

| Event Type | Icon | Color | Description |
|------------|------|-------|-------------|
| `db_capacity_check` | 📊 | cyan | Database capacity check started |
| `db_capacity_ok` | ✅ | green | Capacity within limits |
| `db_capacity_warning` | ⚠️ | yellow | Approaching capacity limit |
| `db_reset_start` | 🔄 | yellow | Database reset initiated |
| `db_reset_complete` | ✅ | green | Database reset finished |
| `db_migration_start` | 📦 | cyan | Migration application started |
| `db_migration_complete` | ✅ | green | Migrations applied successfully |
| `db_seed_start` | 🌱 | green | Database seeding started |
| `db_seed_complete` | ✅ | green | Seeding finished |
| `db_verify` | 🔍 | cyan | Verification of seeded data |

### Implementation

The event emitter uses a fire-and-forget pattern:

```typescript
// Fire event without blocking
emitOrchestratorEvent("db_reset_start", "Resetting sandbox database...");

// With optional details
emitOrchestratorEvent("db_capacity_ok", "Capacity OK: 45MB / 500MB", {
  sizeMB: 45,
  limitMB: 500
});
```

**Key characteristics:**
- Non-blocking: Uses `fetch()` without awaiting
- Graceful degradation: Silently catches errors if event server is unavailable
- Special `sandbox_id`: Uses "orchestrator" to distinguish from sandbox events
- Timestamps: ISO 8601 format generated at emission time

### Files

| File | Purpose |
|------|---------|
| `.ai/alpha/scripts/lib/event-emitter.ts` | Event emission utility |
| `.ai/alpha/scripts/lib/database.ts` | Integration point for DB events |
| `.ai/alpha/scripts/ui/types.ts` | Event type definitions |
| `.ai/alpha/scripts/ui/components/EventLog.tsx` | Event display (icons, colors) |
| `.ai/alpha/scripts/event-server.py` | Event server (receives and broadcasts) |

### Troubleshooting

If database events don't appear in the UI:

1. **Event server not running**: The orchestrator starts the event server automatically. Check logs for startup errors.

2. **Port conflict**: Event server uses port 9000. Ensure no other process is using it:
   ```bash
   lsof -ti:9000
   ```

3. **WebSocket connection**: Check UI status indicator shows "connected" to event server.

4. **Graceful degradation**: If event server is unavailable, the orchestrator continues normally - events are simply not displayed. This is by design to prevent blocking.
