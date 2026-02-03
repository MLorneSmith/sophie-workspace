# Chore: Initiative Workflow Improvements

## Chore Description

Document and implement improvements to the `/initiative` orchestrator workflow based on issues identified during the user dashboard initiative (#1244). The improvements address six priority areas:

1. **Manifest Accessibility (P1)**: Research manifest saved locally is inaccessible in E2B sandbox - fix by creating a dedicated GitHub issue for the manifest
2. **Correct Sandbox Command (P2)**: Use `/sandbox/initiative-implement` instead of generic `/implement` in sandbox
3. **Implementation Timeout (P3)**: Increase timeout from 10 minutes to 30 minutes for complex features
4. **Verification Steps (P4)**: Add validation that plans were written and GitHub issues updated correctly
5. **Agent Opacity (P5)**: Reduce black-box behavior of delegated agents by adding explicit verification
6. **Progress Streaming (P6)**: Parse and display progress markers from sandbox output in real-time

## Relevant Files

Use these files to resolve the chore:

### Primary Initiative Commands
- `.claude/commands/initiative.md` - Main orchestrator that needs updates for P1, P2, P3, P4, P5, P6
- `.claude/commands/initiative-feature.md` - Feature planning command that needs P4 verification updates
- `.claude/commands/sandbox/initiative-implement.md` - Sandbox implementation command (currently unused - needs integration)

### Initiative Agents
- `.claude/agents/initiative/initiative-research.md` - Research agent that creates the manifest
- `.claude/agents/initiative/initiative-decomposition.md` - Decomposition agent

### E2B Sandbox Infrastructure
- `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` - Sandbox CLI that runs `run-claude` command

### New Files

- `.ai/ai_docs/tool-docs/initiative-workflow.md` - Documentation of the complete workflow
- `.ai/ai_docs/context-docs/development/initiative-patterns.md` - Context doc for conditional loading

## Impact Analysis

### Dependencies Affected
- `/initiative` command - core orchestrator being modified
- `/initiative-feature` command - receives new verification requirements
- `/sandbox/initiative-implement` command - needs proper integration
- `initiative-research` agent - manifest output location changes
- `initiative-decomposition` agent - must reference new manifest location
- E2B sandbox CLI - no changes needed (already supports all features)

### Risk Assessment
**Medium Risk** - Changes touch the entire initiative workflow but:
- No database changes required
- No breaking changes to external APIs
- Changes are additive (new verification steps)
- Existing functionality preserved with improvements

### Backward Compatibility
- Existing initiative commands continue to work
- New manifest storage in GitHub issues is additive
- Timeout increases are non-breaking
- Verification steps fail gracefully with warnings

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/initiative-workflow-improvements`
- [ ] Review existing initiative workflow documentation
- [ ] Identify all test initiatives in GitHub issues
- [ ] Document current manifest storage locations

## Documentation Updates Required
- `.ai/ai_docs/tool-docs/initiative-workflow.md` - NEW: Complete workflow documentation
- `.ai/ai_docs/context-docs/development/initiative-patterns.md` - NEW: Context doc for conditional loading
- `.claude/commands/initiative.md` - Update inline documentation
- `.claude/commands/initiative-feature.md` - Update inline documentation
- `.claude/agents/initiative/initiative-research.md` - Update manifest output documentation
- `CLAUDE.md` - Add reference to initiative workflow documentation

## Rollback Plan
- All changes are to markdown command files and documentation
- Git revert of the commit restores previous behavior
- No database migrations involved
- No infrastructure changes required

## Step by Step Tasks

### Task 1: Create Initiative Workflow Documentation
Create comprehensive documentation for the initiative workflow.

- [ ] Create `.ai/ai_docs/tool-docs/initiative-workflow.md` with:
  - Complete workflow diagram
  - Phase descriptions (Research, Decomposition, Planning, Implementation, Completion)
  - State variable reference
  - Error recovery procedures
  - Best practices and gotchas

- [ ] Create `.ai/ai_docs/context-docs/development/initiative-patterns.md` with:
  - YAML frontmatter (tags, dependencies, cross-references)
  - Common patterns for initiative usage
  - Integration with conditional docs system

### Task 2: Fix Manifest Accessibility (P1 - Critical)
Change manifest storage from local file to GitHub issue for sandbox accessibility.

**Modify `.claude/agents/initiative/initiative-research.md`:**
- [ ] Update Step 4 (Synthesize into Manifest) to output manifest content for GitHub issue creation
- [ ] Add structured JSON output that includes full manifest content
- [ ] Keep local file as backup but primary output is for GitHub issue

**Modify `.claude/commands/initiative.md`:**
- [ ] In Phase 1.4 (Parse Research Output), extract full manifest content from agent output
- [ ] In Phase 2.4 (Create GitHub Issues), add step to create dedicated manifest issue:
  ```bash
  # Create manifest issue FIRST (before master issue)
  MANIFEST_ISSUE=$(gh issue create \
    --repo slideheroes/2025slideheroes \
    --title "Research Manifest: ${initiative}" \
    --body "${manifestContent}" \
    --label "type:research" \
    --label "status:active" \
    | grep -oE '[0-9]+$')

  # Reference manifest issue in master issue body
  ```
- [ ] Update `manifestPath` variable to use GitHub issue reference: `github:issue:${MANIFEST_ISSUE}`
- [ ] Update all manifest path references to use GitHub issue URL pattern

**Modify `.claude/commands/initiative-feature.md`:**
- [ ] Update Step 3 (Load Research Manifest) to fetch from GitHub issue:
  ```bash
  # If manifest path starts with "github:issue:"
  gh issue view <manifest-issue-number> --json body -q .body
  ```

**Modify `.claude/commands/sandbox/initiative-implement.md`:**
- [ ] Update Step 3 (Load Research Manifest) to fetch from GitHub issue
- [ ] Handle both local file path and GitHub issue reference formats

### Task 3: Use Correct Sandbox Implement Command (P2 - High)
Update orchestrator to use manifest-aware implementation command.

**Modify `.claude/commands/initiative.md`:**
- [ ] In Phase 4.3.1 (Implement Feature), change:
  ```diff
  - ${SANDBOX_CLI} run-claude "/implement #${featureIssue}" --sandbox ${sandboxId}
  + ${SANDBOX_CLI} run-claude "/sandbox/initiative-implement ${featureIssue} --manifest github:issue:${MANIFEST_ISSUE}" --sandbox ${sandboxId}
  ```
- [ ] Add documentation explaining why `/sandbox/initiative-implement` is used over `/implement`

### Task 4: Increase Implementation Timeout (P3 - High)
Add effort-based timeout configuration.

**Modify `.claude/commands/initiative.md`:**
- [ ] Define timeout mapping based on feature effort:
  ```typescript
  const EFFORT_TIMEOUT = {
    'S': 900000,   // 15 minutes for Small
    'M': 1800000,  // 30 minutes for Medium
    'L': 2700000,  // 45 minutes for Large
    'XL': 3600000  // 60 minutes for Extra Large
  };
  ```
- [ ] Pass appropriate timeout to sandbox CLI based on feature effort
- [ ] Document timeout configuration in Phase 4 header

### Task 5: Add Verification Steps (P4 - Medium)
Add explicit validation after planning phase.

**Modify `.claude/commands/initiative.md`:**
- [ ] After Phase 3.1 (Plan Each Feature), add verification:
  ```typescript
  // Verify plan file exists
  const planExists = await Bash(`test -f "${planFilePath}" && echo "exists"`);

  // Verify GitHub issue has substantial content (>1000 chars indicates full plan)
  const issueBodyLength = await Bash(`gh issue view ${issueNumber} --json body -q '.body | length'`);

  // Verify labels were updated
  const labels = await Bash(`gh issue view ${issueNumber} --json labels -q '.labels[].name'`);
  const hasPlannedLabel = labels.includes('status:planned');
  ```
- [ ] Add verification summary before user approval gate
- [ ] Fail gracefully with warnings if verification fails (allow retry)

**Modify `.claude/commands/initiative-feature.md`:**
- [ ] Add explicit verification output in structured JSON:
  ```json
  {
    "verification": {
      "plan_file_created": true,
      "plan_file_path": "...",
      "plan_file_size_bytes": 5432,
      "github_issue_updated": true,
      "github_issue_body_length": 8234,
      "labels_updated": true,
      "skills_invoked": ["frontend-design"],
      "conditional_docs_loaded": ["file1.md", "file2.md"]
    }
  }
  ```

### Task 6: Reduce Agent Opacity (P5 - Medium)
Improve visibility into delegated agent behavior.

**Modify `.claude/commands/initiative.md`:**
- [ ] In Phase 3.1, add explicit instructions to agent about verification:
  ```typescript
  Task(general-purpose, prompt: `
  ...
  VERIFICATION REQUIREMENTS:
  1. You MUST call Skill({ skill: "frontend-design" }) if this is a UI feature
  2. You MUST call SlashCommand({ command: '/conditional_docs ...' })
  3. You MUST read all files returned by conditional_docs
  4. You MUST include verification data in your JSON output

  If any verification step fails, include the failure in your output.
  `)
  ```
- [ ] Parse verification data from agent output
- [ ] Log verification results for debugging

**Alternative approach - consider for future:**
- Document option to execute `/initiative-feature` directly in orchestrator instead of delegation
- This would give full visibility but loses parallelization benefits

### Task 7: Add Progress Streaming (P6 - Low)
Display real-time progress from sandbox.

**Modify `.claude/commands/initiative.md`:**
- [ ] In Phase 4.3.1, add progress parsing documentation:
  ```markdown
  The sandbox outputs progress markers in format:
  [PROGRESS] <message>

  Parse these markers and display status:
  - [PROGRESS] Starting task: <name> → Update todo list
  - [PROGRESS] Completed: <name> → Mark task complete
  - [PROGRESS] Validation: <command> - PASSED → Log success
  - [PROGRESS] Validation: <command> - FAILED → Log failure
  ```
- [ ] Note: Actual parsing happens in real-time via `onStdout` callback in sandbox CLI
- [ ] Document progress marker format for sandbox commands

### Task 8: Update Command Profile for Conditional Docs
Register initiative commands with conditional docs system.

- [ ] Update `.claude/config/command-profiles.yaml` to add:
  ```yaml
  profiles:
    initiative:
      description: "Orchestrate complete feature development lifecycle"
      defaults:
        - "development/initiative-patterns.md"
      rules:
        - keywords: ["dashboard", "ui", "component", "frontend"]
          files:
            - "development/shadcn-ui-components.md"
          priority: high
        - keywords: ["database", "schema", "rls", "migration"]
          files:
            - "infrastructure/auth-implementation.md"
          priority: high
  ```

### Task 9: Run Validation Commands
Verify all changes work correctly.

- [ ] Run `pnpm lint:fix` to ensure no lint errors in markdown
- [ ] Run `pnpm format:fix` to ensure consistent formatting
- [ ] Review all modified files for consistency
- [ ] Test `/initiative --quick` with a small test initiative to verify:
  - Manifest issue is created
  - Manifest is accessible via GitHub issue view
  - Timeout is configurable
  - Verification steps run
  - Progress markers display

## Validation Commands

```bash
# Lint and format
pnpm lint:fix
pnpm format:fix

# Verify command files are valid markdown
cat .claude/commands/initiative.md | head -20
cat .claude/commands/initiative-feature.md | head -20
cat .claude/commands/sandbox/initiative-implement.md | head -20

# Verify new documentation exists
test -f .ai/ai_docs/tool-docs/initiative-workflow.md && echo "Workflow docs exist"
test -f .ai/ai_docs/context-docs/development/initiative-patterns.md && echo "Patterns doc exists"

# Verify command profiles updated
grep -q "initiative:" .claude/config/command-profiles.yaml && echo "Command profile exists"

# Manual test: Run a quick initiative to verify workflow
# /initiative "Test feature" --quick
```

## Notes

### Manifest GitHub Issue Format
The manifest issue should have a consistent format:
- Title: `Research Manifest: <Initiative Name>`
- Labels: `type:research`, `status:active`
- Body: Full markdown manifest content
- Referenced by: Master feature-set issue and all feature issues

### Progress Marker Format
Standardized progress markers for sandbox visibility:
```
[PROGRESS] Phase: <phase-name>
[PROGRESS] Starting task: <task-name>
[PROGRESS] Files: Creating <file-path>
[PROGRESS] Files: Modifying <file-path>
[PROGRESS] Completed: <task-name>
[PROGRESS] Validation: <command> - PASSED|FAILED
[PROGRESS] Implementation: <X>/<N> tasks complete
```

### Timeout Configuration
| Effort | Timeout | Use Case |
|--------|---------|----------|
| S | 15 min | Simple card components, minor updates |
| M | 30 min | Data loaders, complex components |
| L | 45 min | Multi-file features, integrations |
| XL | 60 min | Large features, full-page implementations |

### Future Improvements (Not in Scope)
- Resume/checkpoint support for interrupted initiatives
- Per-feature sandbox isolation
- Automated rollback on feature failure
