# Chore: Add Skill Guidance to Alpha Workflow Commands

## Chore Description

Enhance the Alpha autonomous coding workflow by adding guidance on when to invoke specialized skills (`frontend-design` and `react-best-practices`) during feature implementation. Currently, the `/alpha:implement` command executes tasks without awareness of these skills that could significantly improve the quality of frontend code output.

This chore adds:
1. A new section in `/alpha:implement` that detects frontend tasks and invokes appropriate skills
2. Optional metadata field in `tasks.json` schema to flag UI tasks during decomposition
3. Guidance in `/alpha:task-decompose` to populate the UI task metadata

## Relevant Files

Use these files to resolve the chore:

- `.claude/commands/alpha/implement.md` - Primary file to modify. This is where the skill invocation guidance will be added. Needs a new section after "Task Implementation Guidelines" (around line 640) that explains how to detect frontend tasks and invoke skills.

- `.claude/commands/alpha/task-decompose.md` - Secondary file to modify. Needs guidance for the decomposer to add `ui_task` and `skill_hints` metadata when creating frontend-related tasks.

- `.ai/alpha/templates/tasks.schema.json` - May need to update the task schema to include optional `ui_task` and `skill_hints` fields for frontend task flagging.

### New Files

None required - this is an enhancement to existing files.

## Impact Analysis

This chore affects the Alpha autonomous coding workflow, specifically how implementation tasks are executed.

### Dependencies Affected

- `/alpha:implement` command - users and orchestrator invoke this
- `/alpha:task-decompose` command - creates tasks.json files
- `alpha-task-decomposer` sub-agent - reads task decompose command
- `spec-orchestrator.ts` - launches implement command in sandboxes

No external package dependencies are affected.

### Risk Assessment

**Low Risk**: This change is additive documentation/guidance only.
- Does not modify any runtime code
- Does not change existing behavior - only adds optional enhancements
- Skills are already available and working
- Changes are to slash command markdown files only
- No database or migration impact

### Backward Compatibility

Fully backward compatible:
- New `ui_task` and `skill_hints` fields in tasks.json are optional
- Existing tasks.json files without these fields will work unchanged
- Skill invocation guidance is advisory, not mandatory
- No breaking changes to any APIs or interfaces

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/alpha-skill-guidance`
- [ ] Review existing skill documentation in Claude Code
- [ ] Verify `frontend-design` and `react-best-practices` skills are available
- [ ] Review current implement.md structure for best insertion point

## Documentation Updates Required

- `.claude/commands/alpha/implement.md` - Add new "Frontend Task Skill Invocation" section
- `.claude/commands/alpha/task-decompose.md` - Add guidance for UI task metadata
- `.ai/alpha/docs/alpha-implementation-system.md` - Consider adding note about skill support
- No CHANGELOG needed (internal tooling)
- No migration guides needed (additive change)

## Rollback Plan

**Simple rollback via git revert:**
1. Revert the commit that adds skill guidance
2. No database changes to undo
3. No configuration changes to undo

**Monitoring:**
- No runtime monitoring needed - this is documentation/guidance only
- Manual verification via dry-run of implement command

## Step by Step Tasks

### Step 1: Update /alpha:implement with Skill Invocation Section

Add a new section to `.claude/commands/alpha/implement.md` after the "Task Implementation Guidelines" section (around line 640):

- Add `### Frontend Task Skill Invocation` header
- Document signals that indicate a frontend task:
  - Task outputs include `.tsx` files in `_components/` directories
  - Task action involves: "Create component", "Build UI", "Design interface"
  - Task touches: pages, layouts, panels, cards, forms, modals, dialogs
- Provide skill invocation templates for `frontend-design` and `react-best-practices`
- Add a decision table mapping task types to skills

### Step 2: Add Skill Selection Heuristics Table

In the same section of implement.md, add a clear heuristics table:

| Task Type | Skill | Trigger Signal |
|-----------|-------|----------------|
| New UI component | `frontend-design` | Creates new `.tsx` in `_components/` |
| Page layout | `frontend-design` | Creates `page.tsx` or layout |
| Data-fetching component | `react-best-practices` | Uses loader, suspense, or RSC patterns |
| Interactive form | Both | Creates form with validation |
| Performance-critical | `react-best-practices` | Mentioned in constraints |

### Step 3: Update /alpha:task-decompose with UI Task Flagging Guidance

Add a new section to `.claude/commands/alpha/task-decompose.md`:

- Add `### UI Task Flagging` section
- Document optional metadata fields: `ui_task: boolean` and `skill_hints: string[]`
- Provide example of task with skill hints
- Make it clear these fields are optional and used by implement command

### Step 4: Update Tasks Schema (Optional)

If a tasks.schema.json exists, update it to include optional fields:

```json
{
  "ui_task": {
    "type": "boolean",
    "description": "Indicates task creates UI components"
  },
  "skill_hints": {
    "type": "array",
    "items": { "type": "string" },
    "description": "Suggested skills to invoke: frontend-design, react-best-practices"
  }
}
```

### Step 5: Run Validation Commands

Execute all validation commands to ensure changes don't break anything.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify implement.md is valid markdown and contains new section
grep -q "Frontend Task Skill Invocation" .claude/commands/alpha/implement.md && echo "✓ Skill section added to implement.md"

# Verify task-decompose.md is valid and contains UI flagging section
grep -q "UI Task Flagging" .claude/commands/alpha/task-decompose.md && echo "✓ UI flagging section added to task-decompose.md"

# Verify the skill names are correctly referenced
grep -q "frontend-design" .claude/commands/alpha/implement.md && echo "✓ frontend-design skill referenced"
grep -q "react-best-practices" .claude/commands/alpha/implement.md && echo "✓ react-best-practices skill referenced"

# Run linting on markdown files (if available)
pnpm lint 2>/dev/null || echo "Lint check complete (or not configured for .md files)"

# Verify no syntax issues in markdown
cat .claude/commands/alpha/implement.md > /dev/null && echo "✓ implement.md is readable"
cat .claude/commands/alpha/task-decompose.md > /dev/null && echo "✓ task-decompose.md is readable"
```

## Notes

- The skills `frontend-design` and `react-best-practices` are example-skills that come bundled with Claude Code. They are invoked via `/frontend-design` and `/react-best-practices` slash commands.

- The skill invocation should be proactive but not mandatory - if the task decomposer doesn't add skill hints, the implement command can still detect frontend tasks based on file patterns.

- Consider future enhancement: auto-detection of framework-specific patterns (e.g., detecting shadcn/ui component usage could trigger additional guidance).

- This chore aligns with the Alpha workflow's philosophy of maximizing implementation quality through intelligent tooling.
