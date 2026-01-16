# Supabase Sandbox Integration Plan

## Executive Summary

Enable database operations in E2B sandboxes by using a dedicated Supabase cloud project (free tier) with remote CLI commands. Since E2B cannot run Docker, we use Supabase CLI's `--linked` mode which works without Docker.

**Approach**: Option A - Sequential Database Runs
- One orchestration run at a time
- Database reset at start of each run
- Lock file prevents concurrent access
- All DB operations go through remote Supabase CLI

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ALPHA ORCHESTRATOR                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ 1. Acquire Lock │ ← Prevents concurrent orchestration runs               │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 2. Reset Sandbox│ ← Clean database state for this run                    │
│  │    Database     │   (DROP SCHEMA public CASCADE; + migrations)           │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 3. Create       │                                                        │
│  │    Sandboxes    │ ← E2B sandboxes with Supabase CLI pre-installed        │
│  └────────┬────────┘                                                        │
│           ▼                                                                 │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                     WORK QUEUE                                 │         │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │         │
│  │  │ Feature 1367 │ │ Feature 1368 │ │ Feature 1369 │ ...       │         │
│  │  │ requires_db: │ │ requires_db: │ │ requires_db: │           │         │
│  │  │    false     │ │    true      │ │    false     │           │         │
│  │  └──────────────┘ └──────────────┘ └──────────────┘           │         │
│  └────────────────────────────────────────────────────────────────┘         │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │ SANDBOX ASSIGNMENT                                              │        │
│  │                                                                 │        │
│  │  DB Features: Assigned to ONE sandbox only (sequential)         │        │
│  │  Non-DB Features: Assigned to ANY available sandbox (parallel)  │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 4. Release Lock │ ← Allows next orchestration run                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Inside E2B Sandbox (for DB features):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  /alpha:implement <feature-id>                                              │
│                                                                             │
│  Task: "Create user_activities table"                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │ 1. Write SQL schema file (apps/web/supabase/schemas/)           │        │
│  │ 2. Generate migration:                                          │        │
│  │    supabase db diff --linked -f create_user_activities_table    │        │
│  │ 3. Apply migration:                                             │        │
│  │    supabase db push --linked                                    │        │
│  │ 4. Generate types:                                              │        │
│  │    supabase gen types typescript --linked > database.types.ts   │        │
│  │ 5. Verify types exist                                           │        │
│  │ 6. Commit changes                                               │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Infrastructure Setup

#### 1.1 Create Dedicated Supabase Sandbox Project

**Manual steps** (one-time setup):

1. Go to https://supabase.com/dashboard
2. Create new project in your organization:
   - Name: `slideheroes-alpha-sandbox`
   - Region: Same as production (us-east-1)
   - Database Password: Generate strong password
3. Note the following credentials:
   - Project Reference ID (e.g., `abcdefghijklmnopqrst`)
   - URL: `https://abcdefghijklmnopqrst.supabase.co`
   - Anon Key
   - Service Role Key
   - Database URL (Connection Pooler - Session mode)

**Cost**: Free tier includes:
- 500MB database storage
- 2 projects total
- Unlimited API requests

#### 1.2 Store Credentials Securely

Add to local `.env` (not committed):

```bash
# Sandbox Supabase Project (for E2B development)
SUPABASE_SANDBOX_PROJECT_REF=abcdefghijklmnopqrst
SUPABASE_SANDBOX_URL=https://abcdefghijklmnopqrst.supabase.co
SUPABASE_SANDBOX_ANON_KEY=eyJ...
SUPABASE_SANDBOX_SERVICE_ROLE_KEY=eyJ...
SUPABASE_SANDBOX_DB_URL=postgresql://postgres.abcdefghijklmnopqrst:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Add to `.env.example` (committed):

```bash
# Sandbox Supabase Project (for E2B development)
# Create a free Supabase project for Alpha orchestrator testing
SUPABASE_SANDBOX_PROJECT_REF=
SUPABASE_SANDBOX_URL=
SUPABASE_SANDBOX_ANON_KEY=
SUPABASE_SANDBOX_SERVICE_ROLE_KEY=
SUPABASE_SANDBOX_DB_URL=
```

#### 1.3 Update E2B Template

Update `e2b.Dockerfile` to include Supabase CLI:

```dockerfile
# Add Supabase CLI
RUN npm install -g supabase
```

Or install at sandbox startup (slower but doesn't require template rebuild):

```bash
npm install -g supabase
```

### Phase 2: Task Decomposition Updates

#### 2.1 Add `requires_database` Flag to Tasks Schema

Update `.ai/alpha/templates/tasks.schema.json`:

```json
{
  "task": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" },
      "requires_database": {
        "type": "boolean",
        "default": false,
        "description": "True if task creates/modifies database schema or requires DB access"
      }
    }
  }
}
```

#### 2.2 Update Task Decomposer to Detect DB Tasks

In `.claude/commands/alpha/task-decompose.md`, add detection logic:

**Database Task Indicators**:
- Task mentions: migration, schema, table, column, RLS, policy, index, constraint
- Action verb: `Create` with target containing "table", "schema", "migration"
- Output files in `apps/web/supabase/schemas/` or `apps/web/supabase/migrations/`
- Verification command includes `supabase`

**Example detected tasks**:
```json
{
  "id": "T3",
  "name": "Create user_activities table schema",
  "requires_database": true,
  "action": { "verb": "Create", "target": "user_activities table" },
  "outputs": [
    { "type": "schema", "path": "apps/web/supabase/schemas/30-user-activities.sql" }
  ],
  "verification_command": "pnpm supabase:web:typegen && grep 'user_activities' apps/web/lib/database.types.ts"
}
```

#### 2.3 Update Feature Manifest

Add `requires_database` flag to feature metadata in `feature.md` template:

```markdown
| **Requires Database** | Yes/No |
```

And in `tasks.json`:

```json
{
  "metadata": {
    "feature_id": 1370,
    "requires_database": true,
    "database_tasks": ["T3", "T5", "T8"]
  }
}
```

#### 2.4 Update Spec Manifest Generator

In `generate-spec-manifest.ts`, aggregate database requirements:

```typescript
interface FeatureEntry {
  // ... existing fields
  requires_database: boolean;
  database_tasks: string[];
}
```

### Phase 3: Orchestrator Changes

#### 3.1 Add Locking Mechanism

Create lock file to prevent concurrent orchestration runs:

```typescript
// Lock file path
const ORCHESTRATOR_LOCK_FILE = '.ai/alpha/.orchestrator-lock';

interface OrchestratorLock {
  spec_id: number;
  started_at: string;
  pid: number;
  hostname: string;
}

async function acquireLock(specId: number): Promise<boolean> {
  const lockPath = path.join(projectRoot, ORCHESTRATOR_LOCK_FILE);

  if (fs.existsSync(lockPath)) {
    const lock: OrchestratorLock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    const lockAge = Date.now() - new Date(lock.started_at).getTime();
    const MAX_LOCK_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (lockAge < MAX_LOCK_AGE_MS) {
      console.error(`❌ Another orchestration run is active:`);
      console.error(`   Spec: #${lock.spec_id}`);
      console.error(`   Started: ${lock.started_at}`);
      console.error(`   Host: ${lock.hostname}`);
      console.error(`\n   To force override, delete: ${lockPath}`);
      return false;
    }

    console.log(`⚠️ Stale lock detected (${Math.round(lockAge / 3600000)}h old), overriding...`);
  }

  const lock: OrchestratorLock = {
    spec_id: specId,
    started_at: new Date().toISOString(),
    pid: process.pid,
    hostname: os.hostname(),
  };

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
  return true;
}

function releaseLock(): void {
  const lockPath = path.join(projectRoot, ORCHESTRATOR_LOCK_FILE);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
  }
}
```

#### 3.2 Add Database Reset Function

Reset sandbox database at orchestration start:

```typescript
async function resetSandboxDatabase(): Promise<void> {
  console.log('🔄 Resetting sandbox database...');

  const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
  if (!dbUrl) {
    console.log('   ⚠️ SUPABASE_SANDBOX_DB_URL not set, skipping database reset');
    return;
  }

  // Option 1: Use psql directly (requires psql installed)
  // Option 2: Use Supabase CLI (preferred)

  const resetScript = `
    -- Reset public schema
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
    COMMENT ON SCHEMA public IS 'standard public schema';

    -- Note: auth and storage schemas are managed by Supabase
    -- We only reset user-created schemas
  `;

  // Write reset script to temp file
  const resetScriptPath = '/tmp/reset-sandbox-db.sql';
  fs.writeFileSync(resetScriptPath, resetScript);

  try {
    // Execute via psql (or via Supabase Management API)
    execSync(`psql "${dbUrl}" -f ${resetScriptPath}`, { stdio: 'pipe' });
    console.log('   ✅ Database schema reset');

    // Apply base migrations from local project
    console.log('   📦 Applying base migrations...');
    execSync(`supabase db push --db-url "${dbUrl}"`, {
      cwd: path.join(projectRoot, 'apps/web'),
      stdio: 'pipe'
    });
    console.log('   ✅ Base migrations applied');

  } catch (error) {
    console.error(`   ❌ Database reset failed: ${error}`);
    throw error;
  }
}
```

#### 3.3 Update Environment Variables Injection

Modify `getAllEnvVars()` in `spec-orchestrator.ts`:

```typescript
function getAllEnvVars(): Record<string, string> {
  const envs: Record<string, string> = {};

  // ... existing code ...

  // Sandbox Supabase credentials (for DB operations in E2B)
  const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
  const sandboxUrl = process.env.SUPABASE_SANDBOX_URL;
  const sandboxAnonKey = process.env.SUPABASE_SANDBOX_ANON_KEY;
  const sandboxServiceKey = process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY;
  const sandboxDbUrl = process.env.SUPABASE_SANDBOX_DB_URL;

  if (sandboxProjectRef) {
    envs.SUPABASE_SANDBOX_PROJECT_REF = sandboxProjectRef;
  }
  if (sandboxUrl) {
    envs.NEXT_PUBLIC_SUPABASE_URL = sandboxUrl; // Override main URL
    envs.SUPABASE_URL = sandboxUrl;
  }
  if (sandboxAnonKey) {
    envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = sandboxAnonKey;
    envs.SUPABASE_ANON_KEY = sandboxAnonKey;
  }
  if (sandboxServiceKey) {
    envs.SUPABASE_SERVICE_ROLE_KEY = sandboxServiceKey;
  }
  if (sandboxDbUrl) {
    envs.DATABASE_URL = sandboxDbUrl;
    envs.SUPABASE_SANDBOX_DB_URL = sandboxDbUrl;
  }

  return envs;
}
```

#### 3.4 Add DB Feature Serialization

Modify work queue to serialize database features:

```typescript
interface FeatureEntry {
  // ... existing fields
  requires_database: boolean;
}

/**
 * Get the next available feature.
 * Database features are only assigned if no other DB feature is in_progress.
 */
function getNextAvailableFeature(manifest: SpecManifest): FeatureEntry | null {
  // Check if any DB feature is currently in progress
  const dbFeatureInProgress = manifest.feature_queue.some(
    f => f.status === 'in_progress' && f.requires_database
  );

  for (const feature of manifest.feature_queue) {
    if (feature.status !== 'pending' && feature.status !== 'failed') {
      continue;
    }

    if (feature.assigned_sandbox) {
      continue;
    }

    // Serialize DB features: only one at a time
    if (feature.requires_database && dbFeatureInProgress) {
      continue; // Wait for current DB feature to complete
    }

    const depsComplete = feature.dependencies.every(depId => {
      return completedFeatureIds.has(depId) || completedInitiativeIds.has(depId);
    });

    if (depsComplete) {
      return feature;
    }
  }

  return null;
}
```

### Phase 4: E2B Sandbox Setup

#### 4.1 Update Sandbox Creation

Add Supabase CLI setup to `createSandbox()`:

```typescript
async function createSandbox(
  manifest: SpecManifest,
  label: string,
  timeout: number,
): Promise<SandboxInstance> {
  // ... existing sandbox creation ...

  // Setup Supabase CLI if credentials are available
  const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
  if (sandboxProjectRef) {
    console.log(`   Setting up Supabase CLI...`);

    // Install Supabase CLI (if not in template)
    await sandbox.commands.run('npm install -g supabase', { timeoutMs: 120000 });

    // Link to sandbox project
    await sandbox.commands.run(
      `cd ${WORKSPACE_DIR}/apps/web && supabase link --project-ref ${sandboxProjectRef}`,
      {
        timeoutMs: 30000,
        envs: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || '' }
      }
    );

    console.log(`   ✅ Supabase CLI linked to sandbox project`);
  }

  // ... rest of sandbox creation ...
}
```

#### 4.2 Pre-link in E2B Template (Alternative)

If we want to avoid linking at runtime, add to `e2b.Dockerfile`:

```dockerfile
# Pre-configure Supabase CLI (project ref will be set at runtime)
RUN npm install -g supabase

# Create supabase config directory
RUN mkdir -p /home/user/project/apps/web/.supabase
```

And at runtime, just inject the project ref via environment variable.

### Phase 5: Implement.md Updates

#### 5.1 Add Database Task Handling

Update `.claude/commands/alpha/implement.md` to handle database tasks:

```markdown
### Database Task Handling

When a task has `requires_database: true`:

1. **Check Supabase CLI availability**:
   ```bash
   supabase --version
   ```

2. **Verify project is linked**:
   ```bash
   supabase projects list | grep -q "$SUPABASE_SANDBOX_PROJECT_REF"
   ```

3. **Execute DB task pattern**:

   For schema creation:
   ```bash
   # 1. Write schema SQL (task handles this)
   # 2. Generate migration diff
   supabase db diff --linked -f <migration_name>

   # 3. Apply migration
   supabase db push --linked

   # 4. Generate types
   supabase gen types typescript --linked > apps/web/lib/database.types.ts
   ```

4. **Verification commands for DB tasks**:
   ```bash
   # Verify table exists
   supabase db diff --linked 2>&1 | grep -q "No changes" || echo "Schema differences detected"

   # Verify types generated
   grep -q "table_name" apps/web/lib/database.types.ts

   # Type check
   pnpm typecheck
   ```

5. **Error handling**:
   - If migration fails, check for conflicts
   - If type generation fails, ensure project is linked
   - Log detailed error for debugging
```

#### 5.2 Add DB-Specific Verification

```markdown
### DB Task Verification Pattern

```typescript
// In tasks.json for DB tasks
{
  "id": "T3",
  "name": "Create user_activities table",
  "requires_database": true,
  "verification_command": "supabase db diff --linked 2>&1 | grep -q 'No changes' && grep -q 'user_activities' apps/web/lib/database.types.ts",
  "verification_timeout_ms": 60000
}
```
```

### Phase 6: Human-in-the-Loop Review

#### 6.1 Post-Orchestration Database State

After orchestration completes, the sandbox database contains all schema changes made during the run. The reviewer can:

1. **Connect to sandbox database via Supabase Studio**:
   - Go to https://supabase.com/dashboard
   - Select `slideheroes-alpha-sandbox` project
   - Use Table Editor to inspect tables
   - Use SQL Editor to run queries

2. **View applied migrations**:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
   ```

3. **Compare with expected schema**:
   - Review migration files in `apps/web/supabase/migrations/`
   - Verify tables, columns, RLS policies exist

#### 6.2 Review Commands

Add to orchestrator summary output:

```
═══════════════════════════════════════════════════════════════════════
   REVIEW YOUR WORK
═══════════════════════════════════════════════════════════════════════

🔗 Review URLs:
   VS Code:    https://sbx-xxx.e2b.dev:8080
   Dev Server: https://sbx-xxx.e2b.dev:3000

📊 Database Review:
   Supabase Studio: https://supabase.com/dashboard/project/abcdefghijklmnopqrst

   Verify schema:
     - Table Editor: Check created tables
     - SQL Editor: Run validation queries
     - Migrations: Review applied versions

   Local verification:
     supabase db diff --linked  # Should show "No changes"

═══════════════════════════════════════════════════════════════════════
```

### Phase 7: Documentation

#### 7.1 Update alpha-implementation-system.md

Add section:

```markdown
## Database Operations

The Alpha Implementation System supports database schema modifications via a dedicated Supabase sandbox project.

### How It Works

1. **Sequential Execution**: Database features run one at a time to avoid migration conflicts
2. **Remote Supabase CLI**: Uses `--linked` mode (no Docker required in E2B)
3. **Reset Between Runs**: Database is reset at orchestration start
4. **Locking**: Prevents concurrent orchestration runs

### Environment Variables

Required for database operations:
- `SUPABASE_SANDBOX_PROJECT_REF`: Project reference ID
- `SUPABASE_SANDBOX_URL`: Project URL
- `SUPABASE_SANDBOX_ANON_KEY`: Anonymous key
- `SUPABASE_SANDBOX_SERVICE_ROLE_KEY`: Service role key
- `SUPABASE_SANDBOX_DB_URL`: Database connection URL
- `SUPABASE_ACCESS_TOKEN`: CLI access token (for linking)

### Task Marking

Tasks are automatically detected as database tasks if they:
- Create/modify schema files
- Generate migrations
- Mention tables, columns, RLS, policies

Mark tasks explicitly with `requires_database: true` in tasks.json.

### Review Workflow

After orchestration:
1. Access Supabase Studio to review schema
2. Run `supabase db diff --linked` to verify no pending changes
3. Review generated migrations in `apps/web/supabase/migrations/`
```

## Implementation Checklist

### Infrastructure (One-Time Setup)
- [ ] Create Supabase sandbox project (MANUAL - see instructions below)
- [ ] Store credentials in local `.env` (MANUAL)
- [x] Update `.env.example` with placeholders
- [ ] Generate Supabase CLI access token (MANUAL)

### Code Changes

#### Phase 1: Environment Setup ✅
- [x] Update `spec-orchestrator.ts` to inject sandbox credentials
- [x] Add lock file mechanism to orchestrator
- [x] Add database reset function

#### Phase 2: Task Decomposition ✅
- [x] Update `tasks.schema.json` with `requires_database` field
- [x] Update `task-decompose.md` to detect DB tasks
- [x] Update `generate-spec-manifest.ts` to aggregate DB flags

#### Phase 3: Orchestrator ✅
- [x] Add `requires_database` to `FeatureEntry` type
- [x] Modify `getNextAvailableFeature()` to serialize DB features
- [x] Add Supabase CLI setup to `createSandbox()`
- [x] Add database reset to orchestration startup

#### Phase 4: Implement Command ✅
- [x] Update `implement.md` with DB task handling
- [x] Add DB-specific verification patterns
- [x] Handle Supabase CLI errors gracefully (retry logic in orchestrator)

#### Phase 5: E2B Template (Optional)
- [ ] Add Supabase CLI to `e2b.Dockerfile` (not needed - using pnpm exec)
- [ ] Rebuild and push template (not needed)

#### Phase 6: Documentation ✅
- [x] Update `alpha-implementation-system.md`
- [x] Add troubleshooting guide (in implement.md)
- [x] Update orchestrator help output (DB indicators in manifest output)

### Testing
- [ ] Test database reset function locally (requires credentials)
- [ ] Test single DB feature in E2B sandbox (requires credentials)
- [ ] Test mixed DB/non-DB features (requires credentials)
- [x] Test orchestrator locking mechanism (dry-run verified)
- [x] Test manifest generation with DB flags (verified)
- [ ] Verify human-in-the-loop review workflow (requires credentials)

## Manual Setup Instructions

To complete the infrastructure setup, follow these steps:

### 1. Create Supabase Sandbox Project

1. Go to https://supabase.com/dashboard
2. Create new project:
   - Name: `slideheroes-alpha-sandbox`
   - Region: Same as production (us-west-2)
   - Database Password: Generate strong password
3. Wait for project to provision (1-2 minutes)

### 2. Get Project Credentials

From the Supabase dashboard, navigate to Settings > API and copy:
- **Project Reference ID** (from URL: `https://supabase.com/dashboard/project/<ref>`)
- **Project URL** (e.g., `https://xxxxx.supabase.co`)
- **Anon Key** (safe for browser)
- **Service Role Key** (server-only, keep secret)

Navigate to Settings > Database and copy:
- **Connection String** (Session Mode pooler)

### 3. Generate CLI Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate new access token
3. Save the token securely

### 4. Configure Local Environment

Add to your `.env` file:

```bash
# Sandbox Supabase Project (for E2B development)
SUPABASE_SANDBOX_PROJECT_REF=<your-project-ref>
SUPABASE_SANDBOX_URL=https://<your-project-ref>.supabase.co
SUPABASE_SANDBOX_ANON_KEY=<your-anon-key>
SUPABASE_SANDBOX_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_SANDBOX_DB_URL=postgresql://postgres.<your-project-ref>:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres
SUPABASE_ACCESS_TOKEN=<your-cli-access-token>
```

### 5. Verify Setup

Run the orchestrator in dry-run mode:

```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run
```

If credentials are configured, you should see:
```
🔄 Checking sandbox database...
   ✅ Database accessible
```

## Critical Edge Case Handling

Based on architecture review, these edge cases require explicit handling:

### Edge Case 1: Database Reset Fails Mid-Operation

**Problem**: If reset is interrupted (process killed, network failure), database is in partial state and lock prevents new runs.

**Solution**: Track reset state in lock file, auto-release on failure.

```typescript
interface OrchestratorLock {
  spec_id: number;
  started_at: string;
  pid: number;
  hostname: string;
  reset_in_progress?: boolean;  // NEW: Track reset state
  reset_started_at?: string;    // NEW: When reset began
}

async function resetSandboxDatabase(): Promise<void> {
  const lockPath = path.join(projectRoot, ORCHESTRATOR_LOCK_FILE);

  // Mark reset in progress
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  lock.reset_in_progress = true;
  lock.reset_started_at = new Date().toISOString();
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));

  try {
    // Execute reset...
    await executeReset();

    // Mark reset complete
    lock.reset_in_progress = false;
    lock.reset_started_at = undefined;
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
  } catch (error) {
    // On failure, release lock entirely so next run can retry
    console.error('❌ Database reset failed, releasing lock for retry');
    releaseLock();
    throw error;
  }
}

// In acquireLock(), check for stale reset:
if (existingLock.reset_in_progress) {
  const resetAge = Date.now() - new Date(existingLock.reset_started_at).getTime();
  if (resetAge > 10 * 60 * 1000) { // 10 minutes
    console.log('⚠️ Stale reset detected, overriding lock...');
    // Proceed with new lock
  }
}
```

### Edge Case 2: Supabase CLI Auth Expires During Run

**Problem**: Access token expires mid-run, causing 401 errors on DB operations.

**Solution**: Wrap Supabase commands with retry logic that re-authenticates on auth failure.

```typescript
async function runSupabaseCommand(
  sandbox: Sandbox,
  command: string,
  retries = 1
): Promise<CommandResult> {
  try {
    return await sandbox.commands.run(command, {
      timeoutMs: 120000,
      envs: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for auth errors
    if (retries > 0 && (
      errorMessage.includes('401') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('token expired')
    )) {
      console.log('   ⚠️ Auth expired, re-linking project...');

      // Re-link the project
      await sandbox.commands.run(
        `cd ${WORKSPACE_DIR}/apps/web && supabase link --project-ref ${process.env.SUPABASE_SANDBOX_PROJECT_REF}`,
        {
          timeoutMs: 30000,
          envs: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN }
        }
      );

      // Retry the command
      return runSupabaseCommand(sandbox, command, retries - 1);
    }

    throw error;
  }
}
```

### Edge Case 3: Migration Name Conflicts

**Problem**: Multiple features generate migrations with similar timestamps, causing git conflicts.

**Solution**: Include feature ID in migration filename to guarantee uniqueness.

```typescript
// In implement.md DB task handling:
const migrationName = `${featureId}_${taskId}_${sanitizedDescription}`;
// Example: 1367_T3_create_user_activities

await runSupabaseCommand(
  sandbox,
  `supabase db diff --linked -f ${migrationName}`
);
```

**Implementation in tasks.json**:
```json
{
  "id": "T3",
  "name": "Create user_activities table",
  "requires_database": true,
  "migration_name_prefix": "1367_T3",  // Pre-computed by task decomposer
  "verification_command": "..."
}
```

### Edge Case 4: Free Tier Storage Limit

**Problem**: Database reaches 500MB limit mid-orchestration, causing all DB operations to fail.

**Solution**: Pre-check database size before starting orchestration.

```typescript
async function checkDatabaseCapacity(): Promise<boolean> {
  const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
  if (!dbUrl) return true; // Skip check if no DB configured

  try {
    const result = execSync(
      `psql "${dbUrl}" -t -c "SELECT pg_database_size('postgres')"`,
      { encoding: 'utf-8' }
    );

    const sizeBytes = parseInt(result.trim(), 10);
    const sizeMB = sizeBytes / (1024 * 1024);
    const limitMB = 500;
    const warningThreshold = 450;

    console.log(`📊 Sandbox database size: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`);

    if (sizeMB > warningThreshold) {
      console.warn(`⚠️ Database near capacity (${sizeMB.toFixed(1)}MB / ${limitMB}MB)`);
      console.warn('   Consider running database reset or cleanup before proceeding.');

      if (sizeMB > limitMB * 0.95) {
        console.error('❌ Database at capacity. Reset required before orchestration.');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn('⚠️ Could not check database size:', error);
    return true; // Proceed anyway, will fail on actual DB operation
  }
}
```

### Edge Case 5: Sandbox Crashes Without Lock Release

**Problem**: Sandbox process killed unexpectedly, lock file remains.

**Solution**: Already handled by 24h stale timeout. Add manual override command.

```bash
# Manual lock release command (document in help output)
rm -f .ai/alpha/.orchestrator-lock

# Or use orchestrator flag
tsx spec-orchestrator.ts 1362 --force-unlock
```

**Implementation**:
```typescript
if (options.forceUnlock) {
  console.log('🔓 Force releasing lock...');
  releaseLock();
}
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database reset fails mid-operation | 🔴 High | Track reset state in lock, auto-release on failure |
| Supabase CLI auth expires | 🟡 Medium | Retry with re-authentication on 401 errors |
| Migration name conflicts | 🟡 Medium | Include feature_id + task_id in migration names |
| Free tier limits exceeded | 🟡 Medium | Pre-check database size, warn at 90% capacity |
| Sandbox crashes without lock release | 🟢 Low | 24h stale timeout + --force-unlock flag |
| Concurrent orchestration attempts | 🟢 Low | Lock file prevents concurrent runs |

## Cost Analysis

**Supabase Free Tier**:
- 500MB database storage: Sufficient for schema testing (no production data)
- 2 projects: One for sandbox, one for production
- Unlimited API requests: No cost concern
- No compute limits for testing

**E2B Costs**: No additional cost from this feature

**Total Additional Cost**: $0 (using free tier)

## Future Enhancements

1. **Supabase Branching** (Pro plan, $25/mo): Create isolated branches per orchestration run
2. **Parallel DB Operations**: With branching, DB features could run in parallel
3. **Automatic Schema Snapshots**: Save schema state before/after each run
4. **Migration Conflict Detection**: Detect conflicts before applying
