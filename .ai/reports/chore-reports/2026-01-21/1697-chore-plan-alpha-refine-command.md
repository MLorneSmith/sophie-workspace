# Chore: Implement /alpha:refine command for post-implementation debugging

## Chore Description

Create a new `/alpha:refine` slash command and supporting orchestrator infrastructure to enable targeted debugging and fine-tuning of Alpha implementations after human review. This command leverages the existing spec/initiative/feature/task context to provide intelligent, context-aware refinement capabilities within E2B sandboxes.

The refinement workflow addresses the gap between initial implementation (via `/alpha:implement`) and production-ready code by enabling:
- Bug fixes discovered during human review
- Visual/UI polish and refinements
- Functional behavior adjustments
- Edge case handling

**Key Design Decisions:**
1. **Execute in E2B sandbox** - Continue work on the implementation branch that only exists in the sandbox
2. **Leverage spec-manifest.json** - Branch name and sandbox state already tracked there
3. **Create specialized debugger sub-agent** - Not reuse `/diagnose` directly (too heavyweight with GitHub issue creation)
4. **Invoke skills based on issue type** - Frontend-debugging, frontend-design, react-best-practices
5. **Reuse existing infrastructure** - Tasks.json verification commands, research library, orchestrator patterns

## Relevant Files

Use these files to resolve the chore:

### Existing Infrastructure to Reference/Extend

- `.ai/alpha/scripts/spec-orchestrator.ts` - Main orchestrator to extend with `--refine` mode
- `.ai/alpha/scripts/lib/sandbox.ts` - Contains `createReviewSandbox()` pattern to adapt for refinement
- `.ai/alpha/scripts/types/orchestrator.types.ts` - Type definitions for `SpecManifest`, `SandboxInstance`
- `.ai/alpha/scripts/lib/manifest.ts` - Manifest loading/saving utilities
- `.ai/alpha/scripts/lib/orchestrator.ts` - Core orchestration logic

### Alpha Commands to Reference

- `.claude/commands/alpha/implement.md` - Implementation command pattern (progress file, heartbeat, checkpoints)
- `.claude/commands/alpha/spec.md` - Spec loading patterns
- `.claude/commands/alpha/task-decompose.md` - Task structure reference

### Skills to Integrate

- `.claude/skills/frontend-debugging/SKILL.md` - Frontend debugging patterns (if exists)
- `.claude/commands/diagnose.md` - Diagnosis patterns to adapt (not reuse directly)

### New Files

- `.claude/commands/alpha/refine.md` - New slash command for refinement workflow
- `.ai/alpha/scripts/refine-orchestrator.ts` - Lightweight orchestrator for refinement mode
- `.ai/alpha/scripts/types/refine.types.ts` - Types for refinement workflow
- `.ai/alpha/scripts/lib/refine.ts` - Refine-specific utilities

## Impact Analysis

### Dependencies Affected

- **spec-orchestrator.ts** - May need minor updates to support `--refine` flag or coordination
- **spec-manifest.json schema** - New `refinements` array to track refinement history
- **SandboxInstance type** - May need `refinement_mode` flag
- **No breaking changes to existing workflows** - Purely additive

### Risk Assessment

**Low Risk** - This is additive tooling that:
- Does not modify existing implementation flow
- Uses established patterns from existing orchestrator
- Isolated to new files with minimal touch points
- No database migrations required
- No API changes

### Backward Compatibility

- **Full backward compatibility** - New command, no changes to existing behavior
- Existing specs work unchanged
- `spec-manifest.json` additions are optional fields
- Orchestrator `--refine` mode is opt-in

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/alpha-refine-command`
- [ ] Review existing orchestrator code patterns
- [ ] Verify E2B API supports sandbox reconnection
- [ ] Check for existing refinement tracking in spec-manifest.json
- [ ] Identify test spec to validate with

## Documentation Updates Required

- **CLAUDE.md** - Add `/alpha:refine` to commands list
- `.ai/alpha/docs/alpha-implementation-system.md` - Add refinement workflow section
- `.claude/commands/alpha/refine.md` - Self-documenting command
- No migration guides needed (new feature)

## Rollback Plan

- Delete new files: `refine.md`, `refine-orchestrator.ts`, `refine.types.ts`, `refine.ts`
- Revert any changes to existing files
- No database migrations to rollback
- Git revert single commit or feature branch

## Step by Step Tasks

### Step 1: Create Type Definitions

Create `.ai/alpha/scripts/types/refine.types.ts` with:

- `RefineOptions` interface - Command-line options for refine mode
- `RefinementEntry` interface - Track individual refinements
- `RefineIssueType` enum - Visual, functional, performance, polish
- `RefineSkillMapping` type - Map issue types to skills
- Export from `types/index.ts`

**Files:**
- Create: `.ai/alpha/scripts/types/refine.types.ts`
- Modify: `.ai/alpha/scripts/types/index.ts` (add export)

### Step 2: Extend SpecManifest Schema

Update `orchestrator.types.ts` to add optional `refinements` array to `SpecManifest`:

```typescript
export interface SpecManifest {
  // ... existing fields
  refinements?: RefinementEntry[];
}
```

**Files:**
- Modify: `.ai/alpha/scripts/types/orchestrator.types.ts`

### Step 3: Create Refine Utilities Library

Create `.ai/alpha/scripts/lib/refine.ts` with:

- `loadRefinementContext()` - Load spec, feature, tasks context
- `detectIssueType()` - Classify issue from description
- `selectSkillsForIssue()` - Map issue type to relevant skills
- `saveRefinementEntry()` - Add entry to spec-manifest.json
- `getBranchFromManifest()` - Extract implementation branch name

**Files:**
- Create: `.ai/alpha/scripts/lib/refine.ts`

### Step 4: Create Refine Orchestrator Script

Create `.ai/alpha/scripts/refine-orchestrator.ts` with:

- CLI argument parsing (spec-id, --issue, --feature, --timeout, --interactive)
- Load spec-manifest.json for branch name and sandbox state
- Attempt to reconnect to existing sandbox (if still alive)
- Create fresh sandbox on implementation branch if expired
- Run `/alpha:refine` command in sandbox
- Interactive mode - keep sandbox alive for iterative fixes
- Print review URLs (VS Code, dev server)

**Key differences from spec-orchestrator.ts:**
- Single sandbox only (not multi-sandbox work queue)
- Interactive mode with user input handling
- No feature queue processing
- Lighter weight - optimized for quick iterations

**Files:**
- Create: `.ai/alpha/scripts/refine-orchestrator.ts`

### Step 5: Create /alpha:refine Slash Command

Create `.claude/commands/alpha/refine.md` with:

**Metadata:**
```yaml
---
description: Debug and fine-tune Alpha implementation after review
argument-hint: <S#|spec-#> [--issue "description"] [--feature S#.I#.F#]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, Skill, WebFetch]
---
```

**Command Flow:**
1. **Phase 0: Load Implementation Context**
   - Read spec-manifest.json for branch name, progress
   - Load affected feature context if --feature provided
   - Use AskUserQuestion if --issue not provided

2. **Phase 1: Diagnosis**
   - Invoke appropriate skills based on issue type:
     - Visual/UI → `/frontend-debugging`
     - Design quality → `/frontend-design`
     - React patterns → `/react-best-practices`
   - Use playwright_inspect.py for UI issues (screenshot, console, network)
   - Trace code paths for functional issues

3. **Phase 2: Fix Implementation**
   - Create lightweight fix tasks if needed
   - Edit files to fix issues
   - Run verification commands from tasks.json
   - Capture before/after screenshots for visual fixes

4. **Phase 3: Commit & Report**
   - Commit with `fix(alpha):` prefix
   - Update spec-manifest.json with refinement entry
   - Report fix summary with commit hash

**Skill Invocation Section:**
```markdown
## Skill Invocation Based on Issue Type

| Issue Type | Keywords | Skills to Invoke |
|------------|----------|------------------|
| Visual/UI bug | "rendering", "layout", "CSS", "doesn't show" | Skill: frontend-debugging |
| Design quality | "design", "colors", "spacing", "responsive" | Skill: frontend-design |
| Component issue | "component", "React", "state", "props" | Skill: react-best-practices |
| Performance | "slow", "loading", "timeout" | Skill: frontend-debugging (Lighthouse) |
```

**Files:**
- Create: `.claude/commands/alpha/refine.md`

### Step 6: Add CLI Entry Point

Update `.ai/alpha/scripts/cli/index.ts` to add `refine` subcommand:

- Parse `refine <spec-id>` command
- Forward to refine-orchestrator.ts
- Support same flags as spec-orchestrator where applicable

**Files:**
- Modify: `.ai/alpha/scripts/cli/index.ts`

### Step 7: Update Alpha Implementation System Documentation

Update `.ai/alpha/docs/alpha-implementation-system.md` to add:

- New section: "## Post-Implementation Refinement"
- Document the refinement workflow
- Add refine-orchestrator.ts to components list
- Document skill invocation patterns
- Add troubleshooting for common refinement scenarios

**Files:**
- Modify: `.ai/alpha/docs/alpha-implementation-system.md`

### Step 8: Validation - Run Validation Commands

Execute all validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# 1. Verify TypeScript compilation
pnpm typecheck

# 2. Verify lint passes
pnpm lint

# 3. Verify new files exist
test -f .claude/commands/alpha/refine.md && echo "✓ refine.md exists"
test -f .ai/alpha/scripts/refine-orchestrator.ts && echo "✓ refine-orchestrator.ts exists"
test -f .ai/alpha/scripts/types/refine.types.ts && echo "✓ refine.types.ts exists"
test -f .ai/alpha/scripts/lib/refine.ts && echo "✓ refine.ts exists"

# 4. Verify type exports work
grep -q "refine" .ai/alpha/scripts/types/index.ts && echo "✓ Types exported"

# 5. Verify command is valid markdown with frontmatter
head -20 .claude/commands/alpha/refine.md | grep -q "description:" && echo "✓ Valid frontmatter"

# 6. Verify orchestrator script has required imports
grep -q "import.*SpecManifest" .ai/alpha/scripts/refine-orchestrator.ts && echo "✓ Orchestrator has manifest import"

# 7. Test that orchestrator can parse --help (syntax check)
cd .ai/alpha/scripts && npx tsx refine-orchestrator.ts --help 2>&1 | grep -q -E "(Usage|Error)" && echo "✓ Orchestrator runs"
```

## Notes

### Branch Name Storage

The implementation branch is already stored in `spec-manifest.json`:
```json
{
  "sandbox": {
    "branch_name": "alpha/spec-S1362",
    "sandbox_ids": ["sbx_abc123"],
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

The `/alpha:refine` command extracts this automatically - no additional tracking needed.

### Skill Invocation Patterns

The command should use explicit `Skill` tool invocation based on detected issue type:
```markdown
IF issue involves frontend:
    Invoke Skill tool with skill="frontend-debugging"

IF issue involves design aesthetics:
    Invoke Skill tool with skill="frontend-design"
```

This allows Claude Code to load specialized context for the refinement task.

### Why Not Reuse /diagnose Directly

The existing `/diagnose` command:
- Creates GitHub issues (not wanted for quick fixes)
- Designed for standalone bug investigation
- Doesn't have access to Alpha spec/feature/task context
- More heavyweight process than needed

Instead, `/alpha:refine` creates a lightweight debugging sub-agent that:
- Understands the spec structure
- Can read tasks.json for verification commands
- Has access to research library context
- Doesn't create external artifacts

### Interactive Mode

The refine-orchestrator supports interactive mode where:
1. Sandbox stays alive indefinitely
2. User can run multiple `/alpha:refine` iterations
3. User controls when to terminate sandbox
4. Useful for iterative polish cycles

### Existing createReviewSandbox Pattern

The `sandbox.ts` already has `createReviewSandbox()` which:
- Creates lightweight sandbox
- Checks out implementation branch
- Builds workspace packages
- Does NOT setup Supabase CLI (not needed for review)

This pattern can be reused/adapted for refinement sandboxes.
