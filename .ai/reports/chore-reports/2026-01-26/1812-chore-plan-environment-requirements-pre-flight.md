# Chore: Environment Requirements Pre-Flight System for Alpha Orchestrator

## Chore Description

Implement a generalized system that captures required environment variables during the Alpha workflow decomposition phase, aggregates them in the spec manifest, and prompts users interactively before implementation starts in sandboxes. This addresses the current limitation where Claude cannot ask for credentials during implementation (sandboxes run non-interactively).

**Problem**: The Alpha orchestrator (spec-orchestrator.ts) runs features in isolated E2B sandboxes where Claude cannot prompt the user interactively. When decomposition identifies external service requirements (e.g., Cal.com API keys), these needs are documented but never escalate to user action before the run begins.

**Solution**: Build a four-part system that:
1. Extends task schemas to capture `required_env_vars` metadata
2. Updates decomposers to extract environment variable requirements from research files
3. Aggregates all requirements in the spec manifest
4. Provides an interactive pre-flight check before orchestrator starts (Option A: CLI table with choices)

## Relevant Files

**Core Orchestrator Files**:
- `.ai/alpha/scripts/spec-orchestrator.ts` - CLI entry point, currently line 80+ for CLI parsing
- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration logic (line 1382+ for startup flow)
- `.ai/alpha/scripts/lib/environment.ts` - Environment variable management (lines 275-293 for existing checkEnvironment())
- `.ai/alpha/scripts/cli/index.ts` - CLI argument parsing and help text

**Schema & Type Files**:
- `.ai/alpha/templates/tasks.schema.json` - Task decomposition schema (define new required_env_vars field)
- `.ai/alpha/scripts/types/orchestrator.types.ts` - TypeScript interfaces (update SpecManifest)

**Manifest & Configuration Files**:
- `.ai/alpha/scripts/lib/manifest.ts` - Manifest generation (lines 682-722 for SpecManifest structure)
- `.ai/alpha/scripts/generate-spec-manifest.ts` - Standalone script for manifest generation

**Decomposition Files**:
- `.claude/agents/alpha/task-decomposer.md` - Task decomposer agent (Phase 1, Step 1.3 for research file reading)
- `.claude/commands/alpha/feature-decompose.md` - Feature decomposition command

**Research Files Example**:
- `.ai/alpha/specs/S1692-Spec-user-dashboard/research-library/context7-calcom.md` - Contains "## Environment Variables Required" section with CAL_OAUTH_CLIENT_ID, CAL_API_URL, etc.

### New Files Required

If not already present, these files need to be created or significantly modified:
- `.ai/alpha/scripts/lib/env-requirements.ts` - New module for extracting and validating env var requirements
- `.ai/alpha/scripts/lib/pre-flight.ts` - New module for interactive pre-flight check logic

## Impact Analysis

### Dependencies Affected

**Immediate dependencies**:
- `spec-orchestrator.ts` - Will call new pre-flight check before `orchestrate()`
- `orchestrator.ts` - Will consume `required_env_vars` from manifest for validation
- `manifest.ts` - Will include new `required_env_vars` array in SpecManifest type
- `environment.ts` - Will add new validation functions

**Secondary dependencies**:
- Task decomposers - Need to extract requirements from research files
- Feature decomposition - Documentation needs "Required Credentials" section
- CLI parsing - May need new `--skip-pre-flight` or `--env-file` options

**Dependent processes**:
- E2B sandbox environment injection - Will reference required_env_vars from manifest
- Development server startup - CI/CD pipelines should not be affected (already pass env vars)

### Risk Assessment

**Risk Level**: **Medium**

**Why Medium Risk**:
- **Low Scope**: Changes isolated to orchestrator startup and decomposition workflows
- **Non-Breaking**: New fields are optional, existing specs work without them
- **Reversible**: Pre-flight check can be skipped with flag if needed
- **Well-Defined**: Clear patterns exist in environment.ts for validation
- **Tested**: Can validate with existing S1692 spec that has Cal.com requirements

**Mitigation Strategies**:
- Start with Option A (interactive CLI) - simplest, most reliable
- Add `--skip-pre-flight` flag for CI/CD pipelines that pre-populate env vars
- Extensive logging of what env vars are detected/missing
- Dry-run mode (`--dry-run`) should show pre-flight check output
- Capture validation state in manifest to prevent re-prompting on resume

### Backward Compatibility

**Breaking Changes**: None

- New `required_env_vars` field is optional in task schema
- Existing specs without this field continue to work (no pre-flight check needed)
- No changes to existing APIs or orchestrator options
- CLI remains compatible with all existing commands

**Compatibility Strategy**:
- New system is purely additive - no existing behavior changes
- Decomposers will be updated over time to populate `required_env_vars`
- Specs created before this chore simply won't have pre-flight validation
- Pre-flight check gracefully handles missing metadata

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/alpha-env-pre-flight`
- [ ] Review spec-orchestrator.ts entry point flow (lines 1-119)
- [ ] Review environment.ts validation patterns (lines 275-293)
- [ ] Review existing checkEnvironment() function usage
- [ ] Check if task.schema.json already has required_env_vars field
- [ ] Review how manifest.ts aggregates feature metadata
- [ ] Understand how research-library files document env vars (search for "Environment Variables Required")

## Documentation Updates Required

**Documentation to create/update**:
1. **CLAUDE.md** - Add section explaining new `required_env_vars` system
2. **task-decomposer.md** - Add step for extracting env requirements from research files
3. **alpha-implementation-system.md** - Add section on pre-flight validation
4. **CLI help text** (cli/index.ts) - Document new pre-flight check and `--skip-pre-flight` flag
5. **Feature template** (.claude/commands/alpha/feature-decompose.md) - Add "Required Credentials" section example
6. **Research template** - Add "Environment Variables Required" standard section

**Comments & Inline Documentation**:
- Document the `required_env_vars` structure in types
- Add JSDoc comments to new pre-flight functions
- Comment complex validation logic in env-requirements.ts

## Rollback Plan

If pre-flight system causes issues:

1. **Immediate Rollback** (5 minutes):
   - Revert `.ai/alpha/scripts/spec-orchestrator.ts` and `orchestrator.ts`
   - Comment out pre-flight check calls
   - Run existing specs without pre-flight validation

2. **Database/State Rollback** (if manifest saved):
   - Delete `required_env_vars` field from affected `spec-manifest.json` files
   - Reset manifest: `tsx generate-spec-manifest.ts <spec-id> --reset`

3. **Monitoring**:
   - Check orchestrator logs for env var validation failures
   - Monitor sandbox startup failures (may indicate missing env vars)
   - Look for "Pre-flight check failed" messages in console

4. **Recovery Procedure**:
   - Run with `--skip-pre-flight` flag to bypass check
   - Manually populate `.env` file with required variables
   - Run orchestrator again normally

## Step by Step Tasks

### Step 1: Extend Task Schema with `required_env_vars` Field

**What**: Add new optional field to `.ai/alpha/templates/tasks.schema.json` to capture environment variable requirements.

**Instructions**:
1. Open `.ai/alpha/templates/tasks.schema.json`
2. Find the `metadata` section (around line 8-98)
3. Add new field after `database_tasks` (around line 87):

```json
"required_env_vars": {
  "type": "array",
  "description": "Environment variables/credentials this feature requires at runtime",
  "items": {
    "type": "object",
    "required": ["name", "description", "source"],
    "properties": {
      "name": {
        "type": "string",
        "pattern": "^[A-Z][A-Z0-9_]+$",
        "description": "Environment variable name (e.g., CAL_OAUTH_CLIENT_ID)"
      },
      "description": {
        "type": "string",
        "description": "What this credential is used for"
      },
      "source": {
        "type": "string",
        "description": "Where to obtain this credential (URL or instructions)"
      },
      "required": {
        "type": "boolean",
        "default": true,
        "description": "If false, feature can degrade gracefully without this"
      },
      "scope": {
        "type": "string",
        "enum": ["client", "server", "both"],
        "description": "Where variable is used (affects NEXT_PUBLIC_ prefix)"
      }
    }
  }
}
```

4. Verify JSON syntax with: `pnpm --filter web jq . .ai/alpha/templates/tasks.schema.json`

**Why this step first**: Schema defines the contract that all subsequent code follows. Must be established before implementation can populate this data.

### Step 2: Add Type Definitions to SpecManifest

**What**: Update TypeScript types to include required_env_vars in the manifest structure.

**Instructions**:
1. Open `.ai/alpha/scripts/types/orchestrator.types.ts`
2. Find the `SpecManifest` interface (around line 59)
3. Add new field in `metadata` section after `research_dir`:

```typescript
required_env_vars?: {
  name: string;
  description: string;
  source: string;
  required: boolean;
  scope: 'client' | 'server' | 'both';
  features: string[]; // Which features need this
}[];
```

4. Run: `pnpm typecheck` to verify no errors

**Why**: TypeScript types must be in place before manifest generation code can use them.

### Step 3: Create `env-requirements.ts` Module

**What**: New module to extract environment variable requirements from research files.

**Instructions**:
1. Create file: `.ai/alpha/scripts/lib/env-requirements.ts`
2. Implement function to extract env vars from markdown "Environment Variables Required" sections:

```typescript
/**
 * Extract required environment variables from research files
 * Searches for "## Environment Variables Required" section in markdown
 */
export function extractEnvRequirementsFromResearch(
  researchDir: string,
): RequiredEnvVar[] {
  const vars: RequiredEnvVar[] = [];
  const researchFiles = fs.readdirSync(researchDir).filter(f => f.endsWith('.md'));

  for (const file of researchFiles) {
    const content = fs.readFileSync(path.join(researchDir, file), 'utf-8');

    // Match "## Environment Variables Required" section
    const match = content.match(/## Environment Variables Required\s*\n\s*```env\n([\s\S]*?)\n```/i);
    if (!match) continue;

    // Parse env var block (lines like: VAR_NAME=description or VAR_NAME=value with comment)
    const envBlock = match[1];
    const lines = envBlock.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    for (const line of lines) {
      const [name, rest] = line.split('=');
      if (!name || !name.match(/^[A-Z][A-Z0-9_]*$/)) continue;

      vars.push({
        name: name.trim(),
        description: `${path.basename(file)}: ${rest?.trim() || 'Required credential'}`,
        source: `See research: ${file}`,
        required: true,
        scope: name.startsWith('NEXT_PUBLIC_') ? 'client' : 'server',
      });
    }
  }

  return vars;
}

/**
 * Aggregate all required env vars from a spec
 * De-duplicates and combines from multiple features
 */
export function aggregateRequiredEnvVars(manifest: SpecManifest): RequiredEnvVar[] {
  const varsMap = new Map<string, RequiredEnvVar & { features: Set<string> }>();

  for (const feature of manifest.feature_queue) {
    const tasksPath = path.join(manifest.metadata.spec_dir, feature.tasks_file);
    if (!fs.existsSync(tasksPath)) continue;

    const tasksJson = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const featureVars = tasksJson.metadata.required_env_vars || [];

    for (const v of featureVars) {
      if (varsMap.has(v.name)) {
        varsMap.get(v.name)!.features.add(feature.id);
      } else {
        varsMap.set(v.name, { ...v, features: new Set([feature.id]) });
      }
    }
  }

  return Array.from(varsMap.values()).map(v => ({
    ...v,
    features: Array.from(v.features),
  }));
}

/**
 * Validate that required env vars are present
 * Returns list of missing vars
 */
export function validateRequiredEnvVars(required: RequiredEnvVar[]): MissingEnvVar[] {
  return required
    .filter(v => v.required && !process.env[v.name])
    .map(v => ({
      name: v.name,
      description: v.description,
      source: v.source,
      scope: v.scope,
    }));
}

interface RequiredEnvVar {
  name: string;
  description: string;
  source: string;
  required: boolean;
  scope: 'client' | 'server' | 'both';
}

interface MissingEnvVar {
  name: string;
  description: string;
  source: string;
  scope: 'client' | 'server' | 'both';
}
```

3. Export from `lib/index.ts`
4. Run: `pnpm typecheck`

**Why**: Extraction logic is reusable and testable in isolation before integration.

### Step 4: Create `pre-flight.ts` Module with Interactive Check (Option A)

**What**: Interactive pre-flight check displayed before orchestrator starts.

**Instructions**:
1. Create file: `.ai/alpha/scripts/lib/pre-flight.ts`
2. Implement interactive check (using readline for terminal UI):

```typescript
import * as readline from 'node:readline';
import * as process from 'node:process';
import { validateRequiredEnvVars } from './env-requirements.js';

/**
 * Display interactive pre-flight check table
 * Prompts user for missing environment variables
 */
export async function runPreFlightCheck(
  spec: SpecManifest,
  manifest: SpecManifest,
  log: (...args: unknown[]) => void,
): Promise<{
  proceed: boolean;
  envVarsSet: Record<string, string>;
}> {
  // Get all required env vars from manifest
  const required = manifest.metadata.required_env_vars || [];
  if (required.length === 0) {
    log('✅ No external service requirements detected');
    return { proceed: true, envVarsSet: {} };
  }

  const missing = validateRequiredEnvVars(required);
  if (missing.length === 0) {
    log('✅ All required environment variables are set');
    return { proceed: true, envVarsSet: {} };
  }

  // Display table of missing variables
  log('\n══════════════════════════════════════════════════════════════════════════════');
  log('   ALPHA SPEC ORCHESTRATOR - PRE-FLIGHT CHECK');
  log('══════════════════════════════════════════════════════════════════════════════');
  log(`\n📋 Spec ${manifest.metadata.spec_id}: ${manifest.metadata.spec_name}`);
  log(`   Features: ${manifest.feature_queue.length}`);
  log('\n🔑 Required Environment Variables:\n');

  // Build table
  const headers = ['Variable', 'Status', 'Features Using', 'Source'];
  const rows = missing.map(v => [
    v.name,
    '❌',
    v.features.slice(0, 2).join(', ') + (v.features.length > 2 ? ` (+${v.features.length - 2})` : ''),
    v.source,
  ]);

  printTable(log, headers, rows);

  log(`\n⚠️  Missing ${missing.length} required credential${missing.length > 1 ? 's' : ''}.\n`);

  // Prompt for action
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`Options:\n  1. Enter values now (interactive)\n  2. Add to .env file and re-run\n  3. Continue without (features will fail)\n  4. Skip this check\n\nChoice [1-4]: `, async answer => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          // Interactively prompt for each missing var
          const envVars: Record<string, string> = {};
          for (const v of missing) {
            const rl2 = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            await new Promise<void>(res => {
              rl2.question(`Enter ${v.name} (from: ${v.source}): `, input => {
                rl2.close();
                if (input.trim()) {
                  envVars[v.name] = input.trim();
                  process.env[v.name] = input.trim();
                }
                res();
              });
            });
          }
          log('\n✅ Environment variables set, proceeding...\n');
          resolve({ proceed: true, envVarsSet: envVars });
          break;

        case '2':
          log('\nAdd these to .env file:');
          for (const v of missing) {
            log(`  ${v.name}=<value>  # ${v.description}`);
          }
          log('\nThen re-run the orchestrator.\n');
          resolve({ proceed: false, envVarsSet: {} });
          break;

        case '3':
          log('\n⚠️  Proceeding without env vars. Features may fail if they require them.\n');
          resolve({ proceed: true, envVarsSet: {} });
          break;

        case '4':
          log('\n⏭️  Skipping pre-flight check.\n');
          resolve({ proceed: true, envVarsSet: {} });
          break;

        default:
          log('\n❌ Invalid choice. Aborting.\n');
          resolve({ proceed: false, envVarsSet: {} });
      }
    });
  });
}

function printTable(
  log: (...args: unknown[]) => void,
  headers: string[],
  rows: string[][],
): void {
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i]?.length || 0)));

  // Header
  log('   ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' │ '));
  log('   ' + Array(colWidths.reduce((a, w) => a + w + 3, 0)).fill('─').join(''));

  // Rows
  for (const row of rows) {
    log('   ' + row.map((cell, i) => cell.padEnd(colWidths[i])).join(' │ '));
  }
  log('');
}
```

3. Export from `lib/index.ts`
4. Add unit test placeholder

**Why**: Pre-flight check must be interactive only when running in CLI (not in tests/CI).

### Step 5: Update Manifest Generation to Include required_env_vars

**What**: Modify `generateSpecManifest()` to aggregate required env vars from all features.

**Instructions**:
1. Open `.ai/alpha/scripts/lib/manifest.ts`
2. Find the manifest building section (around line 682)
3. After features are loaded, aggregate env vars:

```typescript
import { aggregateRequiredEnvVars } from './env-requirements.js';

// ... in generateSpecManifest function, around line 680 ...
const manifest: SpecManifest = {
  metadata: {
    spec_id: specSemanticId,
    spec_name: specName,
    generated_at: new Date().toISOString(),
    spec_dir: specDir,
    research_dir: path.join(specDir, 'research-library'),
    required_env_vars: aggregateRequiredEnvVars({
      metadata: { spec_dir: specDir, research_dir: path.join(specDir, 'research-library') },
      feature_queue: featureQueue,
    } as SpecManifest), // Temporary cast for aggregation
  },
  // ... rest of manifest
};
```

4. Run: `pnpm typecheck`

**Why**: Aggregation happens when manifest is generated, not on every orchestrator run.

### Step 6: Integrate Pre-Flight Check into Orchestrator Startup

**What**: Call pre-flight check in `spec-orchestrator.ts` before `orchestrate()`.

**Instructions**:
1. Open `.ai/alpha/scripts/spec-orchestrator.ts`
2. Add import at top (around line 5):

```typescript
import { runPreFlightCheck } from './lib/pre-flight.js';
```

3. Find where `orchestrate()` is called (around line 119)
4. Add pre-flight check before orchestrate call:

```typescript
// After parseArgs() and validation
const options = parseArgs();

// NEW: Run pre-flight check
if (!options.dryRun && !options.skipPreFlight) {
  const manifest = loadManifest(specDirOrNull);
  if (manifest && manifest.metadata.required_env_vars?.length > 0) {
    const { log } = createLogger(false); // Use non-UI logger
    const result = await runPreFlightCheck(specId, manifest, log);

    if (!result.proceed) {
      process.exit(1);
    }
  }
}

// Continue with orchestrate()
await orchestrate(options);
```

5. Add `--skip-pre-flight` flag to CLI parser (lib/cli/index.ts)
6. Run: `pnpm typecheck`

**Why**: Check happens once before any work starts, ideal insertion point.

### Step 7: Update Task Decomposer to Extract Environment Requirements

**What**: Modify task-decomposer.md to extract required_env_vars from research files.

**Instructions**:
1. Open `.claude/agents/alpha/task-decomposer.md`
2. In Phase 1, Step 1.3 (around line 60), add:

```markdown
### Extract Environment Requirements

After loading research files, scan for "## Environment Variables Required" sections:

\`\`\`bash
# For each research file in RESEARCH_DIR
for file in ${RESEARCH_DIR}/*.md; do
  grep -A 20 "## Environment Variables Required" "$file"
done
\`\`\`

Parse the environment block (usually in \`\`\`env block format):
\`\`\`
CAL_OAUTH_CLIENT_ID=your_oauth_client_id
CAL_API_URL=https://api.cal.com/v2
\`\`\`

For each variable found:
- Extract the name (e.g., CAL_OAUTH_CLIENT_ID)
- Infer description from context or research section
- Record the source (e.g., "Cal.com settings → Developer apps")
- Note if it's optional (has default value) or required
- Track which research file documented it
```

3. In the output section, add these to tasks.json metadata:

```json
"metadata": {
  "required_env_vars": [
    {
      "name": "CAL_OAUTH_CLIENT_ID",
      "description": "Cal.com OAuth client identifier for booking widget",
      "source": "https://cal.com/settings/developer → OAuth apps",
      "required": true,
      "scope": "server"
    }
  ]
}
```

**Why**: Decomposer is the right place to extract this - it already reads research files and creates tasks.json.

### Step 8: Update Feature Decomposition Documentation

**What**: Add "Required Credentials" section to feature template guidance.

**Instructions**:
1. Open `.claude/commands/alpha/feature-decompose.md`
2. Add section in output specification (find where feature.md structure is documented)
3. Add guidance:

```markdown
### Required Credentials Section

If the feature requires external service credentials:

\`\`\`markdown
## Required Credentials

This feature requires the following external service credentials to function:

| Variable | Description | Source | Required |
|----------|-------------|--------|----------|
| CAL_OAUTH_CLIENT_ID | Cal.com OAuth client ID | https://cal.com/settings/developer | Yes |
| CAL_API_URL | Cal.com API endpoint | Default: https://api.cal.com/v2 | No |

\`\`\`

The task decomposer will automatically extract these during decomposition.
```

**Why**: Standardizes how credentials are documented in features.

### Step 9: Create Unit Tests for Env Requirements Module

**What**: Add tests for env extraction and validation logic.

**Instructions**:
1. Create: `.ai/alpha/scripts/lib/__tests__/env-requirements.spec.ts`
2. Test cases:

```typescript
describe('env-requirements', () => {
  describe('extractEnvRequirementsFromResearch', () => {
    it('should extract env vars from markdown section', () => {
      // Mock research file with "## Environment Variables Required"
      // Verify vars are extracted with correct names/descriptions
    });

    it('should handle missing section gracefully', () => {
      // No "## Environment Variables Required" section
      // Should return empty array
    });
  });

  describe('validateRequiredEnvVars', () => {
    it('should identify missing required vars', () => {
      // Set some env vars, leave others missing
      // Verify missing are correctly identified
    });

    it('should not report optional vars as missing', () => {
      // Optional var not set
      // Should not appear in missing list
    });
  });

  describe('aggregateRequiredEnvVars', () => {
    it('should deduplicate env vars from multiple features', () => {
      // Multiple features require same var
      // Should appear once in aggregated list with multiple features listed
    });
  });
});
```

3. Run: `pnpm --filter web test:unit -- env-requirements.spec.ts`

**Why**: Tests ensure extraction logic handles edge cases correctly.

### Step 10: Test with Existing S1692 Spec

**What**: Validate the system works with real spec that has Cal.com requirements.

**Instructions**:
1. Regenerate S1692 manifest:
   ```bash
   tsx .ai/alpha/scripts/generate-spec-manifest.ts 1692
   ```

2. Verify manifest includes required_env_vars:
   ```bash
   jq '.metadata.required_env_vars' .ai/alpha/specs/S1692-Spec-user-dashboard/spec-manifest.json
   ```

3. Run orchestrator with dry-run to test pre-flight:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run
   ```

4. Verify output includes "Pre-flight Check" section with Cal.com variables
5. Test interactive flow (without --dry-run):
   - Run orchestrator
   - When prompted, choose option "2" (add to .env)
   - Verify it shows the required variables
   - Exit and verify can run with `--skip-pre-flight` flag

**Why**: Real spec validates system works end-to-end before declaring complete.

### Step 11: Run Validation Commands

Execute these commands to validate the chore is complete with zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

### Pre-Implementation Verification

```bash
# Verify schema file exists and is valid JSON
jq . .ai/alpha/templates/tasks.schema.json > /dev/null && echo "✅ Schema valid"

# Verify task decomposer exists
test -f .claude/agents/alpha/task-decomposer.md && echo "✅ Task decomposer exists"

# Verify orchestrator entry point
test -f .ai/alpha/scripts/spec-orchestrator.ts && echo "✅ Orchestrator exists"
```

### Post-Implementation Verification

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests for new modules
pnpm --filter web test:unit -- env-requirements.spec.ts

# Test regenerate manifest with S1692
tsx .ai/alpha/scripts/generate-spec-manifest.ts 1692

# Verify manifest has required_env_vars field
jq 'has("metadata.required_env_vars")' .ai/alpha/specs/S1692-Spec-user-dashboard/spec-manifest.json

# Test dry-run orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run

# Format code
pnpm format

# Full typecheck again
pnpm typecheck

# Verify no broken imports
tsx .ai/alpha/scripts/spec-orchestrator.ts --help
```

**Expected Result**: All commands succeed, pre-flight system functional with S1692 spec, zero regressions.

## Notes

### Key Implementation Patterns

1. **Reuse existing validation**: The environment.ts module already has `validateSupabaseConfig()` and similar patterns - follow these patterns for consistency
2. **Research file parsing**: Look for "## Environment Variables Required" section (used in context7-calcom.md) - standardize this format
3. **Interactive prompts**: Use readline for terminal UI (Node.js built-in, no new dependencies)
4. **Manifest aggregation**: Similar to how database_task_count is calculated in manifest.ts

### Related Files & Patterns

- **Database validation pattern**: `environment.ts:133-191` - validateSupabaseConfig() provides clear error messages
- **Manifest aggregation pattern**: `manifest.ts:637-639` - How global_priority is calculated from all features
- **Environment injection pattern**: `environment.ts:319-437` - getAllEnvVars() shows how to collect and pass env vars to sandboxes
- **CLI pattern**: `cli/index.ts:131-147` - Shows how help text is structured

### Future Enhancements (Out of Scope)

- Auto-detect variables from research files using AI
- Store credentials securely in keychain
- Support environment profiles (dev, staging, prod)
- Integration with Supabase vault for secrets
- CI/CD integration to pre-populate from GitHub secrets

### Testing with S1692

The S1692 user dashboard spec is perfect for testing this because:
- Has research file with Cal.com requirements: `.ai/alpha/specs/S1692-Spec-user-dashboard/research-library/context7-calcom.md`
- Feature S1692.I4.F1 documents Cal.com foundation setup
- Clear environment variable requirements documented
- Good test case for pre-flight check

---

*Chore Plan created for implementation*
*Task: Environment Requirements Pre-Flight System for Alpha Orchestrator*
*Type: Tooling | Priority: High | Risk: Medium*
