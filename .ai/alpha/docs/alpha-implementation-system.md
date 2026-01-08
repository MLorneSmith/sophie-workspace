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
- `SUPABASE_SANDBOX_DB_URL` - Sandbox database connection URL
- `SUPABASE_ACCESS_TOKEN` - CLI access token for linking

**Payload CMS Seeding (for test data)**:
- `PAYLOAD_SECRET` - Payload CMS secret key
- `SEED_USER_PASSWORD` - Password for seeded test users
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret key
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `PAYLOAD_PUBLIC_MEDIA_BASE_URL` - R2 media bucket URL
- `PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL` - R2 downloads bucket URL

See `supabase-sandbox-integration-plan.md` for detailed setup instructions.

## Database Seeding

### Overview

At orchestration startup, the sandbox database is automatically seeded with Payload CMS data. This provides test users, media files, courses, and other content for development.

### Seeding Flow

```
1. Database Reset (schema only)
   └── DROP/CREATE public schema
   └── Apply Supabase migrations

2. Create First Sandbox
   └── Clone repo, setup environment

3. Seed Database via First Sandbox
   └── Run Payload migrations (60+ tables)
   └── Run Payload seeding (257 records)
   └── Verify seeded data

4. Create Remaining Sandboxes
   └── All sandboxes share the seeded database
```

### Seeded Content

After seeding, the database contains:
- **1 admin user** - For authentication testing
- **24 media files** - R2-hosted images with URLs
- **23 downloads** - R2-hosted documents
- **8 posts** - Blog content
- **1 course** with 25 lessons and 20 quizzes
- **94 quiz questions** - Various question types
- **3 surveys** with 32 survey questions
- **19 documentation pages**
- **5 private posts**

### Skipping Seeding

Use `--skip-db-seed` to skip seeding when resuming:
```bash
tsx spec-orchestrator.ts 1362 --skip-db-seed
```

The orchestrator also auto-detects if the database is already seeded (checks for `payload.users`) and skips seeding automatically on resume.

### Seeding Failures

If seeding fails:
1. Check `PAYLOAD_SECRET` and `SEED_USER_PASSWORD` are set
2. Check R2 credentials for media files
3. Verify `SUPABASE_SANDBOX_DB_URL` is accessible
4. Check Payload migration logs for errors

Use `--skip-db-reset --skip-db-seed` to skip both reset and seeding when debugging.

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

📊 Spec #1362: user dashboard home
   Initiatives: 4
   Features: 13
   Tasks: 108
   Progress: 0/13 features
   Sandboxes: 3

🎯 Next feature: #1367 - Dashboard Page & Grid Layout

📦 Creating sandbox sbx-a...
   ID: sbx_abc123
   Checking out branch: alpha/spec-1362

   ⏳ Waiting 20s before next sandbox...

📦 Creating sandbox sbx-b...
   ID: sbx_def456
   Checking out branch: alpha/spec-1362

   ⏳ Waiting 20s before next sandbox...

📦 Creating sandbox sbx-c...
   ID: sbx_ghi789
   Checking out branch: alpha/spec-1362

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
