# Chore: Integrate agent-browser CLI for Visual Validation in Alpha Workflow

## Chore Description

Integrate the `agent-browser` CLI tool into the Alpha Autonomous Coding workflow to provide visual validation of UI implementations. The Alpha workflow currently validates code correctness (typecheck, lint) but lacks validation that UI components actually render and function correctly. This chore adds browser-based visual verification at key points in the `/alpha:implement` command and enhances the `tasks.json` schema to support visual verification specifications.

**Key Integration Points:**
1. **`/alpha:implement` command** - Add visual verification step after UI task completion
2. **`tasks.json` schema** - Add `visual_verification` field for UI tasks
3. **`spec-orchestrator.ts`** - Add post-feature visual validation before marking complete

**agent-browser** is an AI-optimized headless browser CLI that uses accessibility-first semantic selectors (ARIA roles, labels) instead of fragile CSS selectors, making it ideal for automated UI validation in AI-driven workflows.

## Relevant Files

Use these files to resolve the chore:

### Alpha Workflow Commands
- `.claude/commands/alpha/implement.md` - Primary integration point for visual verification step during task execution
- `.claude/commands/alpha/task-decompose.md` - Reference for understanding task structure and how to enhance schema

### Alpha Scripts & Infrastructure
- `.ai/alpha/scripts/spec-orchestrator.ts` - Add post-feature validation hooks
- `.ai/alpha/scripts/lib/` - Library modules for orchestrator (potential new validation module)
- `.ai/alpha/templates/` - Schema templates that may need `visual_verification` field

### Documentation
- `.ai/ai_docs/tool-docs/agent-browser.md` - agent-browser CLI reference documentation
- `.ai/alpha/docs/alpha-implementation-system.md` - System architecture documentation to update

### Testing Reference
- `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md` - Existing E2E patterns for reference
- `apps/e2e/` - Existing Playwright infrastructure (complementary, not replacing)

### New Files

- `.ai/alpha/scripts/lib/visual-validation.ts` - New module for agent-browser integration utilities
- `.ai/alpha/templates/visual-verification.schema.json` - JSON schema for visual verification config

## Impact Analysis

### Dependencies Affected

| Component | Impact | Notes |
|-----------|--------|-------|
| `/alpha:implement` | MODIFIED | Add visual verification phase |
| `tasks.json` schema | EXTENDED | New optional `visual_verification` field |
| `alpha-task-decomposer` agent | UPDATED | Generate visual verification specs for UI tasks |
| `spec-orchestrator.ts` | EXTENDED | Post-feature validation hook |
| E2B sandboxes | NONE | agent-browser runs inside existing sandboxes |

- **agent-browser** must be installed in E2B sandbox template
- Does NOT replace Playwright E2E tests - complementary tool for quick validation
- No breaking changes to existing task execution

### Risk Assessment

**Medium Risk** - Touches multiple Alpha workflow components but changes are additive

- **Why Medium**:
  - Modifies core `/alpha:implement` command flow
  - Adds new schema fields (backward compatible - optional)
  - Requires agent-browser installation in sandboxes
  - New validation step could slow execution if misconfigured

- **Mitigations**:
  - Visual verification is opt-in via `visual_verification` field
  - Timeouts prevent hung browser processes
  - Falls back gracefully if agent-browser unavailable

### Backward Compatibility

- **Fully backward compatible** - All changes are additive
- Existing `tasks.json` files without `visual_verification` continue to work
- Visual verification is **optional** - only runs when specified
- No changes to existing verification_command behavior

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/agent-browser-alpha-integration`
- [ ] Verify agent-browser is installed globally: `agent-browser --version`
- [ ] Verify agent-browser works in E2B sandbox template
- [ ] Review existing `/alpha:implement` flow for integration points
- [ ] Identify sample UI tasks for testing the integration

## Documentation Updates Required

| Document | Update Needed |
|----------|---------------|
| `.ai/alpha/docs/alpha-implementation-system.md` | Add visual validation section |
| `.claude/commands/alpha/implement.md` | Add visual verification phase documentation |
| `.claude/commands/alpha/task-decompose.md` | Document `visual_verification` schema |
| `.ai/ai_docs/tool-docs/agent-browser.md` | Add Alpha workflow integration examples |
| `CLAUDE.md` | Add agent-browser to pre-approved commands section |

## Rollback Plan

**Rollback Procedure:**
1. Remove `visual_verification` field from any generated `tasks.json` files
2. Revert changes to `/alpha:implement` command
3. Remove new `visual-validation.ts` module
4. Revert orchestrator changes

**No database migrations** - all changes are file-based

**Monitoring:**
- Watch for increased task execution time (visual verification should add <30s per UI task)
- Monitor for browser process timeouts in sandbox logs
- Check for agent-browser installation failures in new sandboxes

## Step by Step Tasks

### Step 1: Add agent-browser to E2B Sandbox Template

Update the E2B sandbox setup to include agent-browser:

- Verify agent-browser works in sandbox environment
- Add installation to sandbox provisioning script (if not already global)
- Test basic commands: `agent-browser open`, `agent-browser snapshot`, `agent-browser screenshot`

### Step 2: Create Visual Validation Utility Module

Create `.ai/alpha/scripts/lib/visual-validation.ts`:

- Export `runVisualVerification(config: VisualVerificationConfig)` function
- Handle browser startup with timeout protection
- Parse accessibility snapshots for element verification
- Capture screenshots to specified output paths
- Return structured validation result

```typescript
interface VisualVerificationConfig {
  route: string;
  baseUrl?: string;
  waitMs?: number;
  checks?: VisualCheck[];
  screenshot?: boolean;
  outputDir?: string;
}

interface VisualCheck {
  command: 'is visible' | 'find role' | 'snapshot';
  target?: string;
  flags?: string;
}

interface VisualVerificationResult {
  passed: boolean;
  screenshotPath?: string;
  snapshotPath?: string;
  errors: string[];
  duration: number;
}
```

### Step 3: Define Visual Verification Schema

Create `.ai/alpha/templates/visual-verification.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "route": { "type": "string", "description": "Route to navigate to for verification" },
    "wait_ms": { "type": "integer", "default": 3000 },
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "command": { "enum": ["is visible", "find role", "find label", "snapshot"] },
          "target": { "type": "string" },
          "flags": { "type": "string" }
        }
      }
    },
    "expected_elements": {
      "type": "array",
      "items": { "type": "string" }
    },
    "screenshot": { "type": "boolean", "default": true }
  },
  "required": ["route"]
}
```

### Step 4: Update `/alpha:implement` Command

Modify `.claude/commands/alpha/implement.md` to add visual verification phase:

- Add "UI Task Detection" section after Phase 1 (Load Context)
- Add "Visual Verification" substep in Phase 2 (Execute Tasks) for UI tasks
- Define criteria for identifying UI tasks:
  - Outputs include `*.tsx` in app routes
  - Task name contains "component", "page", "layout"
  - Has `visual_verification` field in tasks.json
- Add verification flow:
  1. Ensure dev server running
  2. Run agent-browser commands from `visual_verification` config
  3. Capture screenshot for documentation
  4. Fail task if critical checks fail

### Step 5: Update Task Decomposer to Generate Visual Verification

Update the `alpha-task-decomposer` agent instructions:

- When decomposing UI tasks (components, pages), include `visual_verification` field
- Auto-generate route based on file path
- Include common checks: heading visible, no console errors
- Set `screenshot: true` for documentation

Example output in tasks.json:
```json
{
  "id": "T5",
  "name": "Create dashboard page layout",
  "requires_ui": true,
  "visual_verification": {
    "route": "/home/dashboard",
    "wait_ms": 3000,
    "checks": [
      { "command": "is visible", "target": "Dashboard" },
      { "command": "find role", "target": "heading" }
    ],
    "screenshot": true
  }
}
```

### Step 6: Add Post-Feature Validation to Orchestrator (Optional Enhancement)

Update `spec-orchestrator.ts` to add visual validation after feature completion:

- After all tasks complete for a feature, run consolidated visual check
- Capture feature completion screenshot
- Store in `.ai/alpha/validation/<feature-id>/` directory
- Log validation result to orchestrator output

### Step 7: Update Documentation

Update all affected documentation:

- `.ai/alpha/docs/alpha-implementation-system.md` - Add visual validation section
- `.claude/commands/alpha/implement.md` - Document visual verification phase
- `.ai/ai_docs/tool-docs/agent-browser.md` - Add Alpha workflow examples
- `CLAUDE.md` - Add agent-browser commands to pre-approved list

### Step 8: Create Integration Test

Create a test feature to validate the integration:

- Use an existing UI feature or create a simple test case
- Run `/alpha:implement` with visual verification enabled
- Verify screenshots are captured
- Verify validation output in progress file

### Step 9: Run Validation Commands

Execute all validation commands to ensure the chore is complete.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Verify agent-browser is available
agent-browser --version

# 2. Verify new files exist
test -f .ai/alpha/scripts/lib/visual-validation.ts && echo "✓ visual-validation.ts exists"
test -f .ai/alpha/templates/visual-verification.schema.json && echo "✓ schema exists"

# 3. TypeScript compilation check
pnpm typecheck

# 4. Lint check
pnpm lint

# 5. Verify implement.md contains visual verification section
grep -q "Visual Verification" .claude/commands/alpha/implement.md && echo "✓ implement.md updated"

# 6. Verify documentation updated
grep -q "agent-browser" .ai/alpha/docs/alpha-implementation-system.md && echo "✓ system docs updated"

# 7. Test agent-browser basic functionality (requires running server)
# Start dev server first: pnpm dev
# agent-browser open http://localhost:3000
# agent-browser snapshot -i -c
# agent-browser screenshot test-validation.png
# rm test-validation.png

# 8. Verify no regressions in existing Alpha workflow
# Run a simple task decomposition to verify schema compatibility
# /alpha:task-decompose <existing-feature-id> --dry-run
```

## Notes

### agent-browser vs Playwright

| Aspect | agent-browser | Playwright |
|--------|--------------|------------|
| **Use Case** | Quick AI-driven validation | Full E2E test suites |
| **Interface** | CLI (shell commands) | Node.js/Python API |
| **Selectors** | Accessibility-first (roles, labels) | CSS/XPath/role hybrid |
| **Integration** | Alpha workflow automation | CI/CD pipelines |
| **Maintenance** | Low - semantic selectors | Higher - DOM-dependent |

**agent-browser complements, not replaces, Playwright E2E tests.**

### Timeout Considerations

- Set 30-second timeout for visual verification per task
- Use `agent-browser wait` judiciously to avoid unnecessary delays
- Kill browser process if verification exceeds timeout
- Log timeout as warning, don't block task completion

### Screenshot Storage

- Store in `.ai/alpha/validation/<spec-id>/<feature-id>/`
- Gitignore validation screenshots (large binary files)
- Consider cleanup strategy for old validation artifacts

### Future Enhancements (Out of Scope)

- Visual regression testing (comparing screenshots)
- Accessibility audit integration (axe-core via agent-browser)
- Video recording of task execution
- Integration with review workflow for visual evidence
