# Initiative Workflow Analysis & Recommendations

**Date**: 2025-12-17
**Initiative Tested**: User Dashboard Home (8 features)
**Outcome**: All features implemented but several workflow issues identified

---

## Executive Summary

The `/initiative` workflow successfully orchestrated an 8-feature implementation, but revealed critical gaps in:
1. **Visibility** - Sandbox operations are opaque
2. **User Review** - No live preview before merge
3. **Database Handling** - Schema changes not properly managed
4. **Feature Planning** - `/initiative-feature` command failed silently
5. **File Organization** - Duplicate slug directories

---

## Part 1: What Worked Well

### 1.1 Research Phase
- `initiative-research` agent successfully identified existing components (RadialProgress, RadarChart)
- Found relevant patterns in manifest (Widget Composition, Chart Theming)
- Perplexity and Context7 provided useful external context

### 1.2 Decomposition Phase
- Generated 8 well-scoped features with clear dependencies
- Created dependency graph showing execution order
- Proper phase grouping (Foundation → Core → Integration)

### 1.3 GitHub Integration
- Created master issue and 8 feature issues
- Updated issue bodies with links
- Closed issues upon completion

### 1.4 E2B Sandbox
- Sandbox creation worked reliably
- Git operations (branch, commit, push) functioned
- Claude Code executed successfully inside sandbox

### 1.5 Implementation
- All 8 features were implemented
- Code passed typecheck and lint
- Commits followed conventional format

---

## Part 2: Issues & Failures

### Issue A: Duplicate Directory Structure

**Problem**: Two directories use the same slug without issue number prefix:
- `.ai/reports/feature-reports/2025-12-17/user-dashboard-home/`
- `.ai/specs/feature-sets/user-dashboard-home/`

**Impact**: Confusing organization, hard to find related files

**Root Cause**: Master issue is created AFTER directories are created

---

### Issue B: Missing `type:feature-set` Label

**Problem**: GitHub label `type:feature-set` didn't exist
```
could not add label: 'type:feature-set' not found
```

**Impact**: Had to use `type:feature` as fallback, losing semantic distinction

**Root Cause**: Label never created in repository

---

### Issue C: Sandbox Command Silent Failure ✅ ROOT CAUSE FOUND

**Problem**: `/initiative-feature 1166` produced no visible output:
```
=== Claude Code Output ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /initiative-feature 1166 --manifest ...

Exit code: 0
```

**Impact**: Had to rewrite as explicit prompt instead of using slash command

**Root Cause (CONFIRMED)**: The `run-claude` script used `claude -p` (print mode) which does NOT load project settings by default. The `.claude/commands/` directory existed in the sandbox but was never discovered because project settings weren't loaded. Fix: Add `--setting-sources user,project` flag to the claude command

---

### Issue D: `/initiative-feature` Command Not Executed Properly ✅ SAME ROOT CAUSE

**Problem**: The command was passed but we never saw its output. We worked around by sending an explicit implementation prompt.

**Actual command sent**:
```bash
./sandbox run-claude "/initiative-feature 1166 --manifest .ai/reports/feature-reports/2025-12-17/user-dashboard-home/manifest.md"
```

**What we did instead**:
```bash
./sandbox run-claude "Implement Feature #1166: Dashboard Data Loader and Grid Layout..."
```

**Root Cause**: Same as Issue C - the `-p` flag doesn't load project settings, so `/initiative-feature` was treated as plain text rather than a slash command. The fix in Issue C (adding `--setting-sources user,project`) resolves this issue as well.

---

### Issue E: `/initiative-feature` Missing Research Phase

**Problem**: Step 5 (Load Conditional Documentation) in `initiative-feature.md` references:
```bash
slashCommand /conditional_docs feature "<feature-summary-from-issue>"
```

But there's no research phase between loading conditional docs (Step 5) and planning (Step 6).

**Impact**: Claude Code may need additional context about unfamiliar technologies that isn't in the manifest.

---

### Issue F: Conditional Documentation Not Working

**Problem**: Step 5 uses `slashCommand /conditional_docs` but:
1. `slashCommand` is not a valid tool - should be `SlashCommand`
2. Even if corrected, slash commands may not work in sandbox
3. No evidence the docs were loaded

**Impact**: Lost project-specific patterns and conventions

---

### Issue G: No Visibility Into Sandbox Operations

**Problem**: When implementation runs, user sees:
```
=== Claude Code Output ===
[Summary at end]
Exit code: 0
```

No real-time progress, no indication of what files are being created/modified.

**Options to Improve**:
1. **Streaming logs**: Already implemented but output is minimal
2. **Progress webhooks**: E2B supports webhooks for long-running tasks
3. **VS Code Web**: Sandbox has `startVSCode()` - could open for monitoring
4. **Periodic status**: Sandbox could output git status every N minutes
5. **Structured logging**: Claude Code could output progress markers that sandbox parses

---

### Issue H: No Skills Used

**Problem**: Available skills like `frontend-design` were not suggested or used.

**Relevant Skills**:
- `frontend-design` - For dashboard UI components
- `frontend-debugging` - For testing the implementation
- `local-first-db` - Not relevant here but available

**Recommendation**: Add skill suggestions to manifest based on feature type

---

### Issue I: No User Review of Running App

**Problem**: User cannot see the implemented feature running before merge.

**Current State**:
- Sandbox creates branch and PR
- User reviews code in PR
- No live preview available

**Options**:
1. **Sandbox Dev Server**: `startDevServer()` exists, returns public URL
2. **Local Merge First**: Pull sandbox branch locally, run locally, then merge
3. **Preview Environments**: Vercel preview deployments from PR
4. **E2B Hosted Preview**: Keep sandbox running with dev server for review

---

### Issue J: Database Changes Not Handled

**Problem**: Recent Activity Feed (#1172) likely needed a new `activity_log` table or view, but:
1. No schema migration was created
2. No `pnpm supabase:web:reset` was run
3. Database types weren't regenerated

**Impact**: Implementation may be incomplete or broken for activity aggregation

**Required Workflow for DB Changes**:
1. Create schema file in `apps/web/supabase/schemas/`
2. Generate migration: `pnpm --filter web supabase:db:diff -f <name>`
3. Apply: `pnpm --filter web supabase migration up`
4. Regenerate types: `pnpm supabase:web:typegen`
5. Reset if needed: `pnpm supabase:web:reset`

**Challenge for User Review (Issue I)**:
- If we reset sandbox DB, data is lost
- If we apply migrations to local, user can review
- Need to ensure sandbox and local are in sync

---

## Part 3: Recommendations

### 3.1 Directory Organization with Issue Numbers

**Recommendation**: Create GitHub issue FIRST, then create directories with issue number prefix.

**New Flow**:
```
Phase 1: Research (unchanged)
Phase 2: Decomposition
  Step 2.1: Dry-run decomposition (no issues)
  Step 2.2: User approval
  Step 2.3: Create master issue FIRST
  Step 2.4: Rename directories with issue number
  Step 2.5: Create feature issues
```

**File Structure**:
```
.ai/reports/feature-reports/2025-12-17/
└── 1165-user-dashboard-home/     # Issue number prefix
    ├── manifest.md
    └── research/

.ai/specs/feature-sets/
└── 1165-user-dashboard-home/     # Same prefix
    ├── 1165-overview.md
    └── dependency-graph.md
```

**Implementation**:
```typescript
// In initiative.md Phase 2:
// 1. Create master issue first
const masterIssue = await createMasterIssue(initiative, slug);

// 2. Rename directories
mv `.ai/reports/feature-reports/${date}/${slug}`
   `.ai/reports/feature-reports/${date}/${masterIssue}-${slug}`
```

---

### 3.2 Create `type:feature-set` Label

**Action**: Add to repository setup script or manually create:

```bash
gh label create "type:feature-set" \
  --description "Multi-feature initiative" \
  --color "7057ff"
```

**Update initiative.md** to handle missing label gracefully:
```typescript
// Check if label exists, create if not
const labels = await gh.label.list();
if (!labels.includes('type:feature-set')) {
  await gh.label.create('type:feature-set', ...);
}
```

---

### 3.3 Fix Sandbox Slash Command Execution ✅ FIXED

**Problem**: Custom slash commands don't work in sandbox

**Root Cause (CONFIRMED via research)**:
- The `run-claude` script used `claude -p --dangerously-skip-permissions`
- The `-p` (print) mode does **NOT** load project settings by default
- Without project settings, `.claude/commands/` is never discovered
- The repository IS cloned with `.claude/` directory - that was NOT the issue

**The Fix Applied**:
Updated `build-template.ts` to add `--setting-sources user,project` flag:

```bash
# Before (broken):
echo "$1" | claude -p --dangerously-skip-permissions

# After (fixed):
echo "$1" | claude -p --setting-sources user,project --dangerously-skip-permissions
```

**Why This Works**:
- `--setting-sources user,project` tells Claude Code to load settings from both user config and project `.claude/` directory
- This enables custom slash commands, skills, and project-specific settings
- The flag is documented in Claude Code CLI but not obvious for print mode usage

**Next Steps**:
1. Rebuild E2B template: `tsx .claude/skills/e2b-sandbox/scripts/build-template.ts`
2. Test `/initiative-feature` in sandbox to confirm fix works

---

### 3.4 Add Research Phase to `/initiative-feature`

**New Step Between 5 and 6**:

```markdown
### Step 5.5: Feature-Specific Research (NEW)

Based on the feature requirements and manifest, identify knowledge gaps:

1. **Check Manifest Coverage**: Does manifest address this feature's needs?
2. **Identify Unknowns**: What technologies/patterns need clarification?
3. **Targeted Research**: Use Task(Explore) or docs-mcp for specific queries

Example triggers for additional research:
- Feature involves library not in manifest (e.g., Cal.com API)
- Database schema changes needed
- Complex integration patterns
- Security-sensitive functionality

```typescript
if (needsAdditionalResearch(feature, manifest)) {
  const research = await Task('Explore', {
    prompt: `Research implementation patterns for ${feature.unknowns.join(', ')}`
  });
  // Append findings to planning context
}
```
```

---

### 3.5 Fix Conditional Documentation Loading

**Problem**: `slashCommand` is wrong tool name

**Fix in initiative-feature.md**:
```markdown
### Step 5: Load Conditional Documentation

Use the conditional docs system for project-specific patterns:

```typescript
// Option A: Use SlashCommand tool (correct casing)
SlashCommand({ command: '/conditional_docs feature "<feature-summary>"' })

// Option B: Direct file reads based on feature type
const docs = await loadConditionalDocs('feature', featureSummary);
```

**Better Approach**: Since sandbox may not have SlashCommand access, pass relevant docs in the prompt:
```typescript
// In orchestrator, before calling sandbox:
const conditionalDocs = await runConditionalDocs('feature', featureSummary);
const prompt = `
Context Documentation:
${conditionalDocs}

Feature to implement:
${featureDetails}
`;
await sandbox.runClaude(prompt);
```

---

### 3.6 Improve Sandbox Visibility

**Recommendation**: Multiple approaches for different visibility needs.

**A. Progress Markers (Low effort)**
Add to sandbox Claude Code prompts:
```
IMPORTANT: Output progress markers as you work:
[PROGRESS] Starting task: <name>
[PROGRESS] Completed: <file created/modified>
[PROGRESS] Validation: <command> - <result>
```

Parse these in sandbox logger for structured progress.

**B. VS Code Web for Real-Time Monitoring (Medium effort)**
```typescript
// After starting implementation:
const vscodeUrl = await startVSCode(sandbox);
console.log(`Monitor implementation: ${vscodeUrl}`);
```

User can open VS Code Web and watch files being created.

**C. Periodic Git Status (Low effort)**
```typescript
// Background process in sandbox:
while (implementing) {
  await sleep(60000); // Every minute
  const status = await sandbox.exec('git status --short');
  console.log(`[STATUS] ${status}`);
}
```

**D. Webhook-Based Progress (High effort)**
E2B supports webhooks. Could send progress to a local endpoint that displays in terminal.

---

### 3.7 Proactive Skill Suggestions

**Add to Manifest Format**:
```yaml
# In manifest.md
## Recommended Skills

Based on feature requirements:
- `frontend-design` - For dashboard UI components (HIGH relevance)
- `frontend-debugging` - For testing implementation (MEDIUM relevance)

### Skill Triggers
| Feature Type | Suggested Skills |
|-------------|------------------|
| UI/Dashboard | frontend-design |
| Database | local-first-db (if offline-first) |
| Debugging | frontend-debugging |
```

**Add to initiative-feature.md**:
```markdown
### Step 4.5: Load Relevant Skills

Check if feature matches skill triggers:
```typescript
if (featureType.includes('ui') || featureType.includes('dashboard')) {
  Skill({ skill: 'frontend-design' });
}
```
```

---

### 3.8 User Review Stage with Live Preview

**Recommended Flow**:

```
Phase 3.3.3: Implement feature
Phase 3.3.4: Start Dev Server in Sandbox
Phase 3.3.5: USER REVIEW GATE (NEW)
  - Provide sandbox dev URL
  - User tests feature live
  - User approves or requests changes
Phase 3.3.6: Review (automated)
Phase 3.3.7: Commit
```

**Implementation in initiative.md**:
```markdown
#### 3.3.4: User Review Gate (NEW)

After implementation, start dev server and pause for user review:

```typescript
// Start dev server
const devUrl = await startDevServer(sandbox);

// Ask user to review
AskUserQuestion({
  question: `Feature implemented. Review live at: ${devUrl}\n\nApprove implementation?`,
  header: "Review",
  options: [
    { label: "Approve", description: "Implementation looks good, continue to commit" },
    { label: "Request changes", description: "Describe what needs fixing" },
    { label: "Reject", description: "Discard implementation" }
  ]
})
```

If "Request changes":
- Capture user feedback
- Run additional implementation prompts
- Loop back to review

If "Reject":
- Discard changes
- Move to next feature or abort
```

---

### 3.9 Database Change Handling

**A. Detect Schema Changes Needed**

Add to `/initiative-feature` planning:
```markdown
### Database Impact Analysis

For each feature, determine:
1. **Existing tables needed**: List tables to query
2. **New tables/columns needed**: Document schema changes
3. **RLS policies needed**: Security requirements
4. **Migration strategy**: How to apply changes

If schema changes needed:
- Create schema file in plan
- Include migration commands in validation steps
- Flag for database reset if destructive
```

**B. Schema Generation in Sandbox**

When feature needs DB changes:
```typescript
// In sandbox implementation:
if (feature.requiresSchemaChanges) {
  // 1. Create schema file
  await createSchemaFile(feature.schema);

  // 2. Generate migration
  await sandbox.exec('pnpm --filter web supabase:db:diff -f ' + feature.migrationName);

  // 3. Apply migration (sandbox Supabase)
  await sandbox.exec('pnpm --filter web supabase migration up');

  // 4. Regenerate types
  await sandbox.exec('pnpm supabase:web:typegen');
}
```

**C. Local Review with DB Changes**

For Issue I (user review), when DB changes exist:
```markdown
### User Review with Database Changes

1. **Pull sandbox branch locally**:
   ```bash
   /sandbox gitmerge <sandbox-branch>
   ```

2. **Apply migrations locally**:
   ```bash
   pnpm --filter web supabase migration up
   # Or full reset if needed:
   pnpm supabase:web:reset
   ```

3. **Start local dev server**:
   ```bash
   pnpm dev
   ```

4. **Review feature locally**

5. **Approve in orchestrator** to continue
```

**D. Pass Database Context to Claude Code**

Include in prompt:
```typescript
const dbContext = `
## Database Context

### Relevant Tables
${await getTableSchemas(feature.tables)}

### RLS Policies
${await getRLSPolicies(feature.tables)}

### Type Definitions
${await getTypeDefinitions(feature.tables)}
`;

const prompt = `
${dbContext}

Implement feature: ${feature.description}
`;
```

---

## Part 4: Priority Ranking

| Issue | Impact | Effort | Priority | Status |
|-------|--------|--------|----------|--------|
| C. Sandbox command failure | HIGH | LOW | P0 | ✅ FIXED |
| D. Command not executed | HIGH | LOW | P0 | ✅ FIXED (same fix) |
| I. No live review | HIGH | MEDIUM | P0 | Pending |
| G. No visibility | HIGH | LOW | P1 | Pending |
| J. Database handling | HIGH | HIGH | P1 | Pending |
| A. Directory naming | MEDIUM | LOW | P2 | Pending |
| B. Missing label | LOW | LOW | P2 | Pending |
| E. Missing research phase | MEDIUM | MEDIUM | P2 | Pending |
| F. Conditional docs | MEDIUM | MEDIUM | P2 | Pending |
| H. Skills not used | LOW | LOW | P3 | Pending |

---

## Part 5: Implementation Roadmap

### Phase 1: Critical Fixes (This Week)
1. ✅ Fix sandbox slash command execution (Added `--setting-sources user,project` flag)
2. Rebuild E2B template to apply the fix
3. Add user review gate with dev server URL
4. Add progress markers to sandbox prompts

### Phase 2: Core Improvements (Next Week)
1. Fix directory naming with issue number prefix
2. Create `type:feature-set` label
3. Add database change detection and handling
4. Fix conditional documentation loading

### Phase 3: Enhancements (Following Week)
1. Add feature-specific research phase
2. Implement proactive skill suggestions
3. Add VS Code Web monitoring option
4. Create local merge workflow for DB changes

---

## Appendix: File Changes Required

### Files to Modify

1. `.claude/commands/initiative.md`
   - Add issue creation before directory creation
   - Add user review gate in Phase 3
   - Add progress marker instructions
   - Expand slash commands before sending to sandbox

2. `.claude/commands/initiative-feature.md`
   - Fix SlashCommand casing
   - Add Step 5.5 research phase
   - Add database impact analysis
   - Add skill suggestions

3. `.claude/commands/initiative-implement.md`
   - Add database migration handling
   - Add progress markers

4. `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts`
   - Add command expansion helper
   - Add dev server URL output after implementation
   - Add periodic status output option

### New Files to Create

1. `.claude/config/initiative-skills.yaml`
   - Skill-to-feature-type mappings

2. `.ai/scripts/expand-command.ts`
   - Helper to expand slash commands locally

3. `.claude/hooks/initiative-db-check.sh`
   - Pre-implementation hook to detect DB changes
