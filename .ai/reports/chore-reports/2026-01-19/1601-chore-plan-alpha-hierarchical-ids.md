# Chore: Implement S#.I#.F#.T# Hierarchical ID System for Alpha Workflow

## Chore Description

Refactor the Alpha autonomous coding workflow to use a hierarchical ID system (`S#.I#.F#.T#`) instead of creating individual GitHub issues for each initiative and feature. This change:

1. **Eliminates GitHub issue clutter** - Only the Spec gets a GitHub issue; initiatives, features, and tasks use semantic hierarchical IDs
2. **Introduces a clear numbering convention** - `S1362.I1.F2.T3` format that's self-documenting and traceable
3. **Updates the Spec GitHub issue** - With initiative/feature summaries via comments or body edits
4. **Simplifies orchestration** - Manifest uses stable semantic IDs, not mutable GitHub issue numbers

### ID Format

```
S1362.I1.F2.T3
│     │  │  └── Task 3
│     │  └───── Feature 2 (of Initiative 1)
│     └──────── Initiative 1 (of Spec 1362)
└────────────── Spec GitHub Issue #1362
```

### Directory Naming Convention

**Before:**
```
.ai/alpha/specs/1362-Spec-user-dashboard-home/
├── 1363-Initiative-dashboard-foundation/
│   ├── 1367-Feature-dashboard-page-grid/
```

**After:**
```
.ai/alpha/specs/S1362-Spec-user-dashboard-home/
├── S1362.I1-Initiative-dashboard-foundation/
│   ├── S1362.I1.F1-Feature-dashboard-page-grid/
```

## Relevant Files

### Slash Commands (Primary Changes)

- `.claude/commands/alpha/spec.md` - Keep GitHub issue creation; update directory naming to `S#-Spec-*`
- `.claude/commands/alpha/initiative-decompose.md` - **Remove GitHub issue creation**, use `S#.I#` IDs, add Spec issue comment
- `.claude/commands/alpha/feature-decompose.md` - **Remove GitHub issue creation**, use `S#.I#.F#` IDs, add Spec issue comment
- `.claude/commands/alpha/task-decompose.md` - Use `S#.I#.F#.T#` IDs in tasks.json
- `.claude/commands/alpha/implement.md` - Update to use semantic IDs for lookups

### Scripts (Secondary Changes)

- `.ai/alpha/scripts/generate-spec-manifest.ts` - Update ID handling for semantic format
- `.ai/alpha/scripts/lib/manifest.ts` - Update types and ID resolution
- `.ai/alpha/scripts/lib/feature.ts` - Update feature lookup by semantic ID
- `.ai/alpha/scripts/lib/work-queue.ts` - Update dependency resolution with semantic IDs
- `.ai/alpha/scripts/resolve-feature-paths.sh` - Update path resolution patterns

### Templates (Metadata Updates)

- `.ai/alpha/templates/spec.md` - Update metadata format
- `.ai/alpha/templates/initiative.md` - Replace `Initiative ID: #123` with `Initiative ID: S#.I#`
- `.ai/alpha/templates/feature.md` - Replace `Feature ID: 1363-F1` with `Feature ID: S#.I#.F#`
- `.ai/alpha/templates/initiative-overview.md` - Update table column headers
- `.ai/alpha/templates/feature-overview.md` - Update table column headers

### Schema Files

- `.ai/alpha/templates/tasks.schema.json` - Update metadata schema for semantic IDs

### New Files

- `.ai/alpha/docs/hierarchical-ids.md` - Document the new ID system and conventions

## Impact Analysis

### Dependencies Affected

- **spec-orchestrator.ts** - Uses feature IDs from manifest; change to semantic format
- **alpha-orchestrator.ts** (legacy) - May need updates if still used
- **Progress files** (`.initiative-progress.json`) - Reference feature/task IDs
- **GitHub issue references** - Dependencies currently use `#1367` format, will change to `S#.I#.F#`

### Risk Assessment

**Medium Risk**
- Touches core workflow infrastructure (all 5 slash commands)
- Requires consistent updates across multiple scripts and templates
- Existing decomposed specs (like #1362) may need migration guidance
- No database changes or breaking API changes

### Backward Compatibility

- **Existing specs**: Can remain with old naming (migration optional)
- **New specs**: Will use new naming convention
- **Orchestrator**: Needs to handle both old (`1367-Feature-*`) and new (`S#.I#.F#-Feature-*`) patterns during transition
- **Migration path**: Document manual migration steps for existing specs if needed

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/alpha-hierarchical-ids`
- [ ] Review existing spec #1362 structure as reference
- [ ] Identify all regex patterns that parse issue numbers from directory names
- [ ] Back up example spec directory for testing
- [ ] Verify no active orchestration runs in progress

## Documentation Updates Required

- [ ] `.ai/alpha/docs/hierarchical-ids.md` - New document explaining ID system
- [ ] `.ai/alpha/docs/alpha-implementation-system.md` - Update examples with new IDs
- [ ] `CLAUDE.md` - Add brief mention of Alpha ID convention
- [ ] Update all command file headers with new ID format examples

## Rollback Plan

1. **Git revert**: All changes are in tracked files; simple `git revert` of commit
2. **No database migrations**: No data persistence changes
3. **No external dependencies**: Changes are local to Alpha workflow
4. **Monitoring**: Test with dry-run orchestrator flag before actual execution

## Step by Step Tasks

### Step 1: Create ID System Documentation

Document the new hierarchical ID system before implementation.

- Create `.ai/alpha/docs/hierarchical-ids.md` with:
  - ID format specification (`S#.I#.F#.T#`)
  - Shorthand conventions (omit prefix within context)
  - Directory naming examples
  - Migration guidance for existing specs

### Step 2: Update Templates with Semantic ID Placeholders

Update metadata tables in all templates to use semantic ID format.

- `.ai/alpha/templates/spec.md`:
  - Change `| **Spec ID** | #<issue-number> |` pattern to show `S#` format

- `.ai/alpha/templates/initiative.md`:
  - Change `| **Initiative ID** | #<issue-number> |` to `| **Initiative ID** | S<spec#>.I<priority> |`
  - Update "Blocks" and "Blocked By" format examples

- `.ai/alpha/templates/feature.md`:
  - Change `| **Feature ID** | <initiative-#>-F<n> |` to `| **Feature ID** | S<spec#>.I<init#>.F<priority> |`
  - Update dependency reference format

- `.ai/alpha/templates/tasks.schema.json`:
  - Update `feature_id`, `initiative_id`, `spec_id` to be string type for semantic IDs
  - Add ID format validation pattern

### Step 3: Update `/alpha:spec` Command

Modify spec creation to use `S#` naming convention.

- Update directory creation from `pending-Spec-<slug>` to remain same (no change needed until issue created)
- Update final rename from `<issue-#>-Spec-<slug>` to `S<issue-#>-Spec-<slug>`
- Keep GitHub issue creation (Spec is the only level that gets an issue)
- Update validation commands to use new naming

### Step 4: Update `/alpha:initiative-decompose` Command

Remove GitHub issue creation; use semantic IDs instead.

- **Remove** all `gh issue create` commands for initiatives
- **Remove** label creation for `type:initiative`, `alpha:initiative`
- Update directory naming from `pending-Initiative-<slug>` → `S<spec#>.I<priority>-Initiative-<slug>`
- Update initiative.md metadata to use `S#.I#` format
- **Add** GitHub issue comment on Spec issue with initiatives summary table:
  ```markdown
  ## Initiatives Decomposed

  | ID | Name | Est. Weeks | Priority | Dependencies |
  |----|------|------------|----------|--------------|
  | S1362.I1 | Dashboard Foundation | 2-3 | 1 | None |
  | S1362.I2 | Progress Visualization | 2 | 2 | S1362.I1 |
  ```
- Update Report format to show semantic IDs

### Step 5: Update `/alpha:feature-decompose` Command

Remove GitHub issue creation; use semantic IDs instead.

- **Remove** all `gh issue create` commands for features
- **Remove** label creation for `type:feature`, `alpha:feature`, `parent:<init-#>`
- Update directory naming to `S<spec#>.I<init#>.F<priority>-Feature-<slug>`
- Update feature.md metadata to use `S#.I#.F#` format
- Update dependency references from `#1367` to `S#.I#.F#` format
- **Add** GitHub issue comment on Spec issue with features summary:
  ```markdown
  ## Features Decomposed for S1362.I1

  | ID | Name | Days | Priority | Dependencies |
  |----|------|------|----------|--------------|
  | S1362.I1.F1 | Dashboard Page & Grid | 4 | 1 | None |
  | S1362.I1.F2 | Presentation Table | 3 | 2 | S1362.I1.F1 |
  ```
- Update Report format to show semantic IDs

### Step 6: Update `/alpha:task-decompose` Command

Use semantic task IDs in tasks.json.

- Update tasks.json metadata:
  - `feature_id`: `"S1362.I1.F1"` (string, not number)
  - `initiative_id`: `"S1362.I1"` (string)
  - `spec_id`: `"S1362"` (string)
- Update task IDs from `T1`, `T2` to `S1362.I1.F1.T1`, `S1362.I1.F1.T2` (full qualified)
- Update dependency references in `blocked_by` and `blocks` arrays
- Shorthand still allowed within same feature context

### Step 7: Update `/alpha:implement` Command

Update feature lookup to use semantic IDs.

- Update feature directory search pattern:
  - Old: `find .ai/alpha/specs -name "<feature-id>-Feature-*"`
  - New: Also match `S*.I*.F*-Feature-*` pattern
- Update progress file to use semantic IDs
- Update commit messages to reference semantic IDs

### Step 8: Update `generate-spec-manifest.ts`

Update manifest generation for semantic IDs.

- Update `findSpecDir()` to match both `S#-Spec-*` and `#-Spec-*` patterns
- Update `findInitiativeDirectories()` regex: `/^S?\d+(?:\.I\d+)?-Initiative-/`
- Update `findFeatureDirectories()` regex: `/^S?\d+(?:\.I\d+\.F\d+)?-Feature-/`
- Update `FeatureEntry.id` to be string type for semantic IDs
- Update `InitiativeEntry.id` to be string type for semantic IDs
- Update dependency resolution to handle semantic ID format
- Keep backward compatibility for old-format directories during transition

### Step 9: Update Orchestrator Library Files

Update supporting library files for semantic IDs.

- `.ai/alpha/scripts/lib/manifest.ts`:
  - Update type definitions for string IDs
  - Update ID parsing functions

- `.ai/alpha/scripts/lib/feature.ts`:
  - Update feature lookup by semantic ID

- `.ai/alpha/scripts/lib/work-queue.ts`:
  - Update dependency resolution with semantic format

- `.ai/alpha/scripts/resolve-feature-paths.sh`:
  - Update glob patterns for both old and new naming

### Step 10: Update Implementation System Documentation

Update alpha-implementation-system.md with new ID examples.

- Update all example IDs from `#1367` to `S1362.I1.F1` format
- Update directory structure examples
- Update dependency graph examples
- Add migration notes for existing specs

### Step 11: Run Validation Commands

Execute validation to confirm all changes work correctly.

- Run typecheck on updated scripts
- Test manifest generation with dry run
- Verify slash command parsing works
- Test with a sample new spec (dry run mode)

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# TypeScript type checking for all scripts
pnpm typecheck

# Lint the modified TypeScript files
pnpm lint:fix

# Verify manifest generation script compiles and runs help
tsx .ai/alpha/scripts/generate-spec-manifest.ts --help 2>&1 || tsx .ai/alpha/scripts/generate-spec-manifest.ts 2>&1 | head -5

# Verify spec-orchestrator compiles
tsx .ai/alpha/scripts/spec-orchestrator.ts --help 2>&1 || tsx .ai/alpha/scripts/spec-orchestrator.ts 2>&1 | head -5

# Validate JSON schema is valid
node -e "JSON.parse(require('fs').readFileSync('.ai/alpha/templates/tasks.schema.json', 'utf-8')); console.log('Schema valid')"

# Verify slash command files have no syntax errors (markdown linting)
pnpm --filter @kit/lint exec biome check .claude/commands/alpha/*.md --diagnostic-level=error || true

# Test that existing spec directory is still found (backward compatibility)
test -d ".ai/alpha/specs/1362-Spec-user-dashboard-home" && echo "Old format spec found (backward compat OK)"

# Run unit tests if any exist for alpha scripts
pnpm test:unit -- alpha 2>/dev/null || echo "No alpha unit tests found (OK)"
```

## Notes

### Transition Period

During transition, both old (`1367-Feature-*`) and new (`S1362.I1.F1-Feature-*`) naming conventions should be supported. The orchestrator should auto-detect format based on directory name pattern.

### Shorthand Convention

Within a context, prefixes can be omitted:
- Inside `S1362` spec: reference `I1.F2.T3` (S1362 implicit)
- Inside `S1362.I1` initiative: reference `F2.T3` (S1362.I1 implicit)
- Cross-spec references: always use full `S1362.I1.F2.T3`

### Example Mappings

| Old Format | New Format |
|------------|------------|
| `1362-Spec-user-dashboard` | `S1362-Spec-user-dashboard` |
| `1363-Initiative-foundation` | `S1362.I1-Initiative-foundation` |
| `1367-Feature-dashboard-page` | `S1362.I1.F1-Feature-dashboard-page` |
| Task `T1` in feature 1367 | `S1362.I1.F1.T1` |

### GitHub Issue Updates

Instead of creating separate issues, append structured comments to the Spec issue:

```markdown
## [Decomposition Update] Initiatives Created

| ID | Name | Priority | Est. Weeks |
|----|------|----------|------------|
| S1362.I1 | Dashboard Foundation | 1 | 2-3 |
| S1362.I2 | Progress Visualization | 2 | 2 |

_Decomposed on 2026-01-19 by /alpha:initiative-decompose_
```
