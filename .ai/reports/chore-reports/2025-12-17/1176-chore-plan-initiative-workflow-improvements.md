# Chore: Implement Initiative Workflow Improvements (P0-P3)

## Chore Description

The `/initiative` workflow successfully orchestrated an 8-feature implementation but revealed 10 critical gaps in visibility, user review, database handling, command execution, and file organization. This chore implements all recommendations from the initiative workflow analysis (Part 3: Recommendations) across four implementation phases:

- **P0 (Critical)**: Rebuild E2B template to enable slash command execution in sandboxes
- **P1 (Core)**: Improve visibility, add user review gate, enhance database handling
- **P2 (Consolidation)**: Fix directory naming, labels, documentation loading
- **P3 (Enhancement)**: Add research phases, skill suggestions, VS Code monitoring

## Relevant Files

### Command Files (Primary Focus)
- `.claude/commands/initiative.md` - Master orchestrator, needs issue creation before directory creation, user review gate, progress markers
- `.claude/commands/initiative-feature.md` - Feature planning command, needs research phase, database detection, conditional docs fix, skill suggestions
- `.claude/commands/initiative-implement.md` - Feature implementation, needs database migration handling, progress markers
- `.claude/skills/e2b-sandbox/scripts/build-template.ts` - E2B template builder, **FIXED** but needs rebuild (added `--setting-sources user,project` flag)
- `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` - Sandbox CLI wrapper, needs command expansion, dev server URL output, status tracking

### Configuration Files
- `.claude/config/command-profiles.yaml` - Already has `e2b` and `sandbox` keywords in chore profile
- `.claude/config/initiative-skills.yaml` - **NEW** file needed for skill-to-feature mappings
- `.claude/hooks/initiative-db-check.sh` - **NEW** hook for pre-implementation database analysis

### Helper Scripts
- `.ai/scripts/expand-command.ts` - **NEW** helper to expand slash commands locally before sandbox execution

### GitHub & Documentation
- Repository GitHub labels - Need to create `type:feature-set` label
- `.ai/reports/feature-reports/` - Need to reorganize with issue number prefixes
- `.ai/specs/feature-sets/` - Need to align naming with feature-reports

## Impact Analysis

### Dependencies Affected

**Slash Commands:**
- `/initiative` - Orchestrator (calls all sub-commands, affected by all changes)
- `/initiative-feature` - Feature planning (direct changes needed)
- `/initiative-implement` - Feature implementation (integration with database handling)
- `/conditional_docs` - Documentation routing (used by `/initiative-feature`)

**Build System:**
- E2B template build process - Must rebuild after template.ts changes
- Claude Code CLI integration - Depends on `--setting-sources` flag (already added)

**GitHub Workflow:**
- Issue creation flow - Timing changed (master issue created before directories)
- Label system - New `type:feature-set` label needed
- PR creation - May include dev server URL in PR body

**Database System:**
- Schema detection - New functionality to identify when migrations needed
- Supabase integration - Must work in sandbox environment
- RLS policy handling - May need examples for new table creation

### Risk Assessment

**Low Risk** (Isolated Changes):
- E2B template rebuild - Only affects how slash commands work in sandbox (already fixed in code)
- Directory naming with issue number prefix - Backward compatible, only affects new initiatives
- Creating `type:feature-set` label - Safe, non-breaking change

**Medium Risk** (Workflow Changes):
- User review gate - Adds new interaction point, must handle approvals/rejections properly
- Master issue creation order - Changes when directories are created, must ensure issue creation succeeds
- Progress markers - Adds output parsing, must not break existing output
- Slash command expansion - New code path, must preserve existing behavior

**High Risk** (Database Integration):
- Database change detection - Must identify schema changes accurately
- Migration handling in sandbox - Supabase must be available, migrations must apply cleanly
- Type regeneration - Must happen after migrations, types must match schema

### Backward Compatibility

**Breaking Changes**: None for users. All changes are additive or improve existing workflows.

**Migration Path**:
- Existing initiatives in `.ai/specs/feature-sets/` without issue number prefixes continue to work
- New initiatives will use issue number prefixes
- Both naming conventions can coexist during transition

**Feature Flags**: None needed. All phases are independent enough that earlier phases don't depend on later ones.

## Pre-Chore Checklist

Before starting implementation:
- [ ] Read all files in `.claude/commands/` directory
- [ ] Verify `.claude/skills/e2b-sandbox/scripts/build-template.ts` has `--setting-sources` flag (already added per analysis)
- [ ] Check GitHub labels exist or can be created
- [ ] Review E2B API for `startDevServer()` capabilities
- [ ] Verify Supabase CLI works in sandbox environment
- [ ] Confirm `AskUserQuestion` tool works in sandbox
- [ ] Review existing `.ai/reports/feature-reports/` structure

## Documentation Updates Required

### Code Changes
- **Add comments** to `.claude/commands/initiative.md` explaining new issue-first flow
- **Add comments** to `.claude/commands/initiative-feature.md` explaining new research phase and database detection
- **Add comments** to `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` explaining command expansion and dev server handling

### Documentation Files
- Update `CLAUDE.md` with new workflow diagrams (optional, can be skipped per CLAUDE.md guidance on not creating docs)
- Add notes to `.ai/ai_docs/context-docs/README.md` about initiative workflow improvements (optional)

### Internal Notes
- Add links to issue #1166 (user dashboard home) as example of workflow
- Document discovered issues in plan files for future reference

## Rollback Plan

**Rollback is straightforward** because changes are additive:

1. **Template changes**: Previous template still in E2B repo history
   ```bash
   git revert <commit-adding-setting-sources>
   # Rebuild template: tsx .claude/skills/e2b-sandbox/scripts/build-template.ts
   ```

2. **Command changes**: Previous versions in git history
   ```bash
   git show HEAD~1:.claude/commands/initiative.md > .claude/commands/initiative.md
   ```

3. **Directory naming**: Both naming conventions supported during transition, nothing to roll back

4. **GitHub labels**: Can be deleted if needed
   ```bash
   gh label delete type:feature-set
   ```

**Rollback Risk**: Very low. Each phase can be rolled back independently without affecting others.

## Step by Step Tasks

### Phase P0: Critical Fixes (E2B Template)

#### P0.1: Rebuild E2B Template with Fixed Settings Flag

The fix has already been applied to `.claude/skills/e2b-sandbox/scripts/build-template.ts` (per research report Section 3.3). Now rebuild to deploy the fix.

**Tasks:**
1. Run the template build script:
   ```bash
   tsx .claude/skills/e2b-sandbox/scripts/build-template.ts
   ```
2. Verify the build completes successfully with no errors
3. The new template will be deployed to E2B on next sandbox creation
4. Confirm by checking that next `/initiative` run can execute slash commands in sandbox

**Why This Works:**
- The `--setting-sources user,project` flag tells Claude Code to load project `.claude/` settings
- Without this flag, custom slash commands aren't discovered
- This was the root cause of Issues C and D

---

### Phase P1: Core Improvements

#### P1.1: Add User Review Gate with Live Dev Server

**File**: `.claude/commands/initiative.md`

**Change Location**: Phase 3.3.4 (after implementation completes)

**Implementation:**
1. After feature implementation completes in sandbox:
   - Start dev server: `const devUrl = await startDevServer(sandbox);`
   - Output dev URL to user with clear instructions

2. Use `AskUserQuestion` to pause for user review:
   ```markdown
   Feature has been implemented and is running at: {devUrl}

   Please review the implementation:
   - Test the feature in the browser
   - Check for bugs or UI issues
   - Verify all functionality works as expected
   ```

3. Handle user responses:
   - **Approve**: Continue to review and merge phases
   - **Request Changes**: Capture feedback, run additional implementation prompts, loop back to dev server
   - **Reject**: Discard sandbox branch and move to next feature

**Benefits:**
- User can see feature running before code is merged
- Catches integration issues that code review might miss
- Speeds up feedback loop (live testing vs reading code)

**Potential Issues:**
- Dev server startup time (add timeout, default 5 minutes)
- Sandbox dev URL stability (E2B should keep sandbox running)
- User must be available during review window (timeout to auto-approve after 30 minutes?)

---

#### P1.2: Add Progress Markers to Sandbox Implementation

**File**: `.claude/commands/initiative-implement.md`

**Change Location**: Feature implementation prompt section

**Implementation:**
1. Add progress marker instructions to Claude Code sandbox prompt:
   ```
   IMPORTANT: Output progress markers as you work so the user can see what's happening:

   [PROGRESS] Starting task: <name>
   [PROGRESS] Created: <file path>
   [PROGRESS] Modified: <file path>
   [PROGRESS] Validation: <command name> - PASS/FAIL

   For example:
   [PROGRESS] Starting task: Create dashboard component
   [PROGRESS] Created: apps/web/app/home/[account]/_components/dashboard.tsx
   [PROGRESS] Modified: apps/web/app/home/[account]/page.tsx
   [PROGRESS] Validation: pnpm typecheck - PASS
   ```

2. Parse progress markers in orchestrator:
   - Extract `[PROGRESS]` lines from stdout
   - Display in real-time to user with formatting
   - Show summary at end

**Benefits:**
- User sees real-time implementation progress
- Can diagnose failures faster
- Builds confidence in running workflow

---

#### P1.3: Add Database Impact Detection to Feature Planning

**File**: `.claude/commands/initiative-feature.md`

**Change Location**: Planning phase (new section before final plan)

**Implementation:**
1. After loading conditional docs (Step 5), add database analysis step:
   ```markdown
   ### Step 5.5: Database Impact Analysis

   Analyze the feature requirements to determine database needs:
   - Are you querying existing tables?
   - Do you need new tables or columns?
   - What RLS policies are needed?
   - Will schema migrations be required?

   If schema changes are needed, include in the feature plan:
   1. Schema file path and definition
   2. Migration name
   3. RLS policy requirements
   4. Data seeding requirements
   ```

2. Pass this analysis to planning context so Claude Code considers DB impact

**Benefits:**
- Prevents database surprises during implementation
- Allows sandbox to apply migrations proactively
- Ensures local review can include DB changes

---

#### P1.4: Pass Database Context to Claude Code

**File**: `.claude/commands/initiative-implement.md`

**Change Location**: Feature implementation prompt

**Implementation:**
1. If feature has database changes, fetch context:
   ```typescript
   // Get relevant table schemas, RLS policies, type definitions
   const dbContext = `
   ## Database Context for This Feature

   ### Relevant Tables
   ${await getTableSchemas(feature.tables)}

   ### RLS Policies
   ${await getRLSPolicies(feature.tables)}

   ### Generated TypeScript Types
   ${await getTypeDefinitions(feature.tables)}
   `;
   ```

2. Prepend to feature implementation prompt

**Benefits:**
- Claude Code has full context of data model
- Can write proper RLS policies
- Type-safe database queries

---

### Phase P2: Consolidation & Cleanup

#### P2.1: Create Master Issue First, Then Create Directories

**File**: `.claude/commands/initiative.md`

**Change Location**: Phase 2 (Decomposition)

**Implementation:**
1. After decomposition (step 2.2: user approval), create master issue first:
   ```bash
   gh issue create \
     --repo slideheroes/2025slideheroes \
     --title "Initiative: <name>" \
     --body "Master issue for $NUM features..." \
     --label "type:feature-set" \
     --label "status:in-progress"
   ```

2. Extract issue number from output:
   ```
   https://github.com/slideheroes/2025slideheroes/issues/1234
   # Extract: 1234
   ```

3. Create directories with issue number prefix:
   ```bash
   .ai/reports/feature-reports/2025-12-17/1234-initiative-name/
   .ai/specs/feature-sets/1234-initiative-name/
   ```

4. Then create feature-specific issues (step 2.5)

**Benefits:**
- Single source of truth for directory naming
- Easier to find related files
- GitHub links are straightforward

---

#### P2.2: Create `type:feature-set` GitHub Label

**File**: GitHub repository settings

**Implementation:**
1. Create label via CLI:
   ```bash
   gh label create "type:feature-set" \
     --description "Multi-feature initiative" \
     --color "7057ff"
   ```

2. Update `.claude/commands/initiative.md` to handle missing label gracefully:
   ```bash
   # Try to create label if it doesn't exist
   gh label create "type:feature-set" \
     --description "Multi-feature initiative" \
     --color "7057ff" 2>/dev/null || true
   ```

**Benefits:**
- Semantic distinction between single features and initiatives
- Better issue organization on GitHub
- Makes initiatives easier to track

---

#### P2.3: Fix Conditional Documentation Loading in Feature Planning

**File**: `.claude/commands/initiative-feature.md`

**Change Location**: Step 5 (Load Conditional Documentation)

**Problems to Fix:**
- `slashCommand` is wrong tool name (should be `SlashCommand`)
- Slash commands may not work in sandbox context
- No evidence docs were being loaded

**Solution:**
Since slash commands don't reliably work in sandbox, load conditional docs in **orchestrator** (before calling sandbox):

```typescript
// In main orchestrator (not in sandbox):
const conditionalDocs = await SlashCommand({
  command: '/conditional_docs feature "<feature-summary>"'
});

// Pass docs in the sandbox prompt:
const prompt = `
## Project Context Documentation

${conditionalDocs}

## Feature to Implement

${featureDetails}
`;

await sandbox.runClaude(prompt);
```

**Benefits:**
- Reliable documentation loading (no sandbox context issues)
- Cleaner separation of concerns (research outside sandbox, implementation inside)
- Claude Code in sandbox focuses on implementation, not documentation lookup

---

#### P2.4: Add Feature-Specific Research Phase

**File**: `.claude/commands/initiative-feature.md`

**Change Location**: Between conditional docs (Step 5) and planning (Step 6)

**Implementation:**
Add new Step 5.5:

```markdown
### Step 5.5: Identify Knowledge Gaps

Based on feature requirements and manifest, identify what you don't know:

1. **Check Manifest Coverage**: Does the manifest cover this feature's needs?
2. **Identify Unknowns**: What technologies, patterns, or APIs need clarification?
3. **Targeted Research**: Use codebase exploration for specific queries

Example research triggers:
- Feature uses library not mentioned in manifest (e.g., Cal.com API)
- Complex integration with third-party service
- Security-sensitive functionality
- Real-time/streaming requirements
- Unusual database patterns

If research needed, ask user for context or research the codebase.
```

**Benefits:**
- Prevents "unknown unknowns" during implementation
- Better feature plans with complete knowledge
- Catches integration challenges early

---

#### P2.5: Add Skill Suggestions to Feature Planning

**File**: `.claude/commands/initiative-feature.md` and `.claude/config/initiative-skills.yaml`

**Implementation - Part 1: Create Skill Mappings**

New file: `.claude/config/initiative-skills.yaml`

```yaml
# Skill recommendations by feature type
skill_mappings:
  ui_components:
    - skill: "frontend-design"
      relevance: "HIGH"
      reason: "Dashboard/form UI components"
    - skill: "frontend-debugging"
      relevance: "MEDIUM"
      reason: "Testing component behavior"

  database_features:
    - skill: "local-first-db"
      relevance: "HIGH"
      reason: "Offline-first data persistence"

  full_stack:
    - skill: "frontend-design"
      relevance: "MEDIUM"
      reason: "UI components if creating interface"
    - skill: "frontend-debugging"
      relevance: "MEDIUM"
      reason: "E2E test validation"

  integration:
    - skill: "frontend-debugging"
      relevance: "HIGH"
      reason: "Integration testing"

  performance:
    - skill: "frontend-debugging"
      relevance: "HIGH"
      reason: "Performance profiling"
```

**Implementation - Part 2: Add to Feature Planning**

Update `.claude/commands/initiative-feature.md`:

```markdown
### Step 4: Load Recommended Skills

Based on feature type, load relevant skills:

Types and their suggested skills:
- **Dashboard/Form UI**: frontend-design
- **Data Persistence**: local-first-db
- **Integration Testing**: frontend-debugging
- **Performance Optimization**: frontend-debugging

If feature matches a type, invoke:
\`\`\`
Skill({ skill: "frontend-design" });
\`\`\`
```

**Benefits:**
- User is reminded of available tools
- Speeds up feature implementation
- Better code quality with appropriate tools

---

### Phase P3: Enhancements

#### P3.1: Add VS Code Web Monitoring Option

**File**: `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts`

**Implementation:**
After starting implementation, optionally start VS Code Web for monitoring:

```typescript
// After starting implementation:
if (options.monitor === true) {
  const vscodeUrl = await sandbox.startVSCode();
  console.log(`
  Monitor implementation in VS Code Web:
  ${vscodeUrl}

  Watch files being created and modified in real-time.
  `);
}
```

**How to Use:**
```bash
./sandbox run-claude "<prompt>" --monitor
```

**Benefits:**
- Real-time file visibility during implementation
- Can see test failures and build errors immediately
- Opens new debugging possibilities

---

#### P3.2: Implement Periodic Git Status Output

**File**: `.claude/commands/initiative-implement.md`

**Implementation:**
Add background process for periodic git status in sandbox:

```typescript
// Background git status monitoring
setInterval(async () => {
  const status = await sandbox.exec('git status --short');
  if (status) {
    console.log(`[STATUS] Git changes:\n${status}`);
  }
}, 60000); // Every 60 seconds
```

**Benefits:**
- Shows incremental progress
- Can spot stalled implementations
- Useful for long-running features

---

#### P3.3: Create Command Expansion Helper

**File**: `.ai/scripts/expand-command.ts` (NEW)

**Purpose**: Expand slash commands locally before passing to sandbox

**Implementation**: Create helper script that takes a slash command like `/initiative-feature 1166 --manifest <path>` and expands it to full prompt text.

**Why**: Some slash commands might not work reliably in sandbox context. This helper ensures they're expanded with full context before execution.

```typescript
// Example usage:
// expand-command.ts /conditional_docs feature "add dark mode"
// Output: Full prompt text that would be executed
```

---

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

### P0: Template Rebuild Validation

```bash
# 1. Verify template was built successfully
ls -la .claude/skills/e2b-sandbox/build/

# 2. Check that build-template.ts contains --setting-sources flag
grep -n "setting-sources" .claude/skills/e2b-sandbox/scripts/build-template.ts

# 3. Verify no TypeScript errors in template build
tsx --check .claude/skills/e2b-sandbox/scripts/build-template.ts
```

### P1: Core Improvements Validation

```bash
# 1. Syntax check all modified command files
for file in initiative.md initiative-feature.md initiative-implement.md; do
  echo "Checking $file..."
  # Just verify it reads without errors (no real syntax check for markdown)
  test -f ".claude/commands/$file" || echo "MISSING: $file"
done

# 2. Verify command-profiles.yaml is valid YAML
python3 -c "import yaml; yaml.safe_load(open('.claude/config/command-profiles.yaml'))"

# 3. Test new helper script compiles
tsx --check .ai/scripts/expand-command.ts 2>/dev/null || echo "Script check failed or doesn't exist yet"
```

### P2: Consolidation Validation

```bash
# 1. Create a test initiative and verify directory naming
# (Manual test: run /initiative with test data)

# 2. Verify GitHub label can be created
gh label create "type:feature-set" \
  --description "Multi-feature initiative" \
  --color "7057ff" 2>&1 | grep -i "already exists\|created" || echo "Label creation failed"

# 3. Verify conditional docs router works
/conditional_docs feature "test feature with dashboard ui"

# 4. Check YAML syntax for new skill mappings (when created)
python3 -c "import yaml; yaml.safe_load(open('.claude/config/initiative-skills.yaml'))" 2>/dev/null || echo "Skill mappings file doesn't exist yet"
```

### P3: Enhancements Validation

```bash
# 1. Verify VS Code integration helper exists (when created)
grep -l "startVSCode" .claude/skills/e2b-sandbox/scripts/sandbox-cli.ts || echo "VS Code integration not yet added"

# 2. Check for periodic git status implementation
grep -l "setInterval.*git status" .claude/commands/initiative-implement.md || echo "Periodic git status not yet added"

# 3. Final code quality check on all modified files
pnpm typecheck 2>&1 | grep -i "error" && echo "TypeScript errors found!" || echo "No TypeScript errors"
pnpm lint ".claude/commands/" 2>&1 | grep -i "error" && echo "Lint errors found!" || echo "No lint errors"
```

### Full Integration Test (Post-Implementation)

```bash
# 1. Run complete /initiative workflow
# (This is a manual test - create a test initiative and track it through full workflow)

# 2. Verify E2B template was deployed
# (Create a new sandbox and test that /conditional_docs works inside it)

# 3. Test user review gate
# (Run /initiative with feature that has database changes, approve at review gate)

# 4. Verify database migrations work in sandbox
# (Check that database types were regenerated after migration)

# 5. Confirm all issues are closed/updated on GitHub
gh issue list \
  --repo slideheroes/2025slideheroes \
  --state closed \
  --label "type:feature-set" \
  | wc -l
```

## Notes

### Implementation Order Matters

- **P0 must be done first**: Template rebuild enables slash commands in sandbox
- **P1 can be done in any order**: Each improvement is independent
- **P2 should be done together**: Directory naming changes and label creation work together
- **P3 is optional**: Enhancements that improve UX but aren't critical

### Testing Strategy

Each phase should be tested immediately after implementation:

1. **P0**: Run `/initiative` and verify slash commands work in sandbox (e.g., `/conditional_docs` should output documentation)
2. **P1**: Run `/initiative` on a small test initiative and verify user review gate works
3. **P2**: Run `/initiative` and verify directories are created with issue number prefix
4. **P3**: Test new features with small manual workflows

### Known Limitations

1. **Dev Server Availability**: E2B's `startDevServer()` must return a stable public URL
2. **Timeout Handling**: User review gate needs timeout handling (what happens if user doesn't respond?)
3. **Database Sandbox**: Sandbox Supabase instance must have enough resources for migrations
4. **Slash Command Expansion**: Some commands with complex arguments may need manual expansion

### Future Improvements

1. **Database Seeding**: Automatically seed data for new tables during feature implementation
2. **E2E Testing**: Generate E2E tests for new features automatically
3. **Performance Analysis**: Compare performance before/after feature
4. **Cost Analysis**: Track API calls and estimate costs per feature
5. **CI/CD Integration**: Hook into GitHub Actions for automatic testing/deployment

### References

- Original Analysis Report: `.ai/reports/research-reports/2025-12-17/initiative-workflow-analysis.md`
- E2B Documentation: https://e2b.dev/docs
- Claude Code CLI: `/help` in Claude Code terminal
- GitHub CLI: `gh --help`

