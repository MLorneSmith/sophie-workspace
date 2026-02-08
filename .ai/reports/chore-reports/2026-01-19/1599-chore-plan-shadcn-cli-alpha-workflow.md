# Chore: Add shadcn-cli component discovery to Alpha workflow commands

## Chore Description

Integrate shadcn-cli component discovery guidance into the Alpha autonomous coding workflow. This enhances feature-decompose and task-decompose commands to leverage the shadcn CLI for finding and selecting UI components before implementation.

The Alpha workflow currently designs UI features without systematically checking what components already exist in shadcn/ui or the configured community registries (@magicui, @aceternity, @kibo-ui, @reui, @phucbm, @scrollxui, @gaia, @moleculeui). This leads to:
- Missed opportunities to use high-quality existing components
- Custom implementations when better alternatives exist
- Inconsistent component selection across features

By adding component discovery steps, the workflow will:
1. Search shadcn/ui and configured registries for relevant components
2. Preview component code before architectural decisions
3. Document component selections in feature.md files
4. Generate tasks that include component installation when needed

## Relevant Files

Use these files to resolve the chore:

### Primary Files to Modify

- **`.claude/commands/alpha/feature-decompose.md`** - Add Step 4.5 "Component Discovery" in Phase 2 (Architecture & Validation) between Step 4 (Assess Complexity) and Step 5 (Design Architecture). This is where UI architecture decisions are made, making it the ideal place for component selection.

- **`.claude/commands/alpha/task-decompose.md`** - Add UI Component Task Handling section with guidance on checking component availability and creating installation tasks. The task decomposer needs to know how to handle UI component tasks.

### Reference Files (Read-Only)

- **`packages/ui/components.json`** - Contains configured registries (@magicui, @aceternity, etc.) that should be referenced in the guidance.

- **`.ai/ai_docs/tool-docs/shadcn-cli.md`** - Comprehensive shadcn CLI documentation with command syntax, registry usage, and best practices. Use as source for accurate command examples.

- **`packages/ui/CLAUDE.md`** - Existing UI component guidelines that should be consistent with new workflow guidance.

### New Files

None - this chore modifies existing files only.

## Impact Analysis

### Dependencies Affected

- **alpha-task-decomposer sub-agent** - Will need to understand new UI component task handling patterns
- **code-architect sub-agent** - Will benefit from component discovery informing architecture decisions
- **Features created via Alpha workflow** - Will now include Component Strategy sections
- **tasks.json output** - May include new `requires_ui_component` and `installation_command` fields

No version constraints or breaking changes - this is additive guidance only.

### Risk Assessment

**Low Risk**:
- Changes are additive documentation/guidance only
- No code execution changes
- No breaking changes to existing workflow
- Commands remain backward compatible (new steps are optional best practices)
- Well-defined integration points (specific steps in existing phases)

### Backward Compatibility

- Existing features created without component discovery will continue to work
- No migration needed for in-progress specs/initiatives/features
- New guidance is advisory, not enforced
- All existing command arguments and outputs remain unchanged

## Pre-Chore Checklist

Before starting implementation:
- [x] Create feature branch: `chore/shadcn-cli-alpha-workflow`
- [x] Review components.json for accurate registry list
- [x] Read shadcn-cli.md for accurate command syntax
- [x] Identify insertion points in feature-decompose.md (after Step 4)
- [x] Identify insertion points in task-decompose.md (new section)

## Documentation Updates Required

- **`.claude/commands/alpha/feature-decompose.md`** - Add Step 4.5 and Component Strategy template
- **`.claude/commands/alpha/task-decompose.md`** - Add UI Component Task Handling section
- **No CHANGELOG.md update needed** - This is internal workflow tooling
- **No user-facing docs needed** - Affects AI workflow only

## Rollback Plan

- Revert commits to feature-decompose.md and task-decompose.md
- No database or configuration changes to undo
- No monitoring needed - workflow changes are immediately visible in command behavior

## Step by Step Tasks

### Step 1: Update feature-decompose.md - Add Component Discovery Step

Add a new Step 4.5 "Component Discovery" in Phase 2 (Architecture & Validation) between Step 4 (Assess Complexity) and Step 5 (Design Architecture).

Insert the following content after the "Step 4: Assess Complexity" section and before "Step 5: Design Architecture":

```markdown
#### Step 4.5: Discover Available Components

Before designing architecture, explore shadcn/ui and configured registries for components that match feature requirements.

**4.5.1: Search Official shadcn/ui Components**

From the packages/ui directory, search for components matching feature needs:

\`\`\`bash
cd packages/ui

# Search for feature-relevant terms
npx shadcn@latest search -q "[feature-keyword]"

# Examples for common feature types:
# Dashboard: npx shadcn@latest search -q "card"
# Forms: npx shadcn@latest search -q "form"
# Data display: npx shadcn@latest search -q "table"
\`\`\`

**4.5.2: Explore Configured Community Registries**

For enhanced UI features (animations, effects, specialized components), search configured registries:

\`\`\`bash
# MagicUI - Animated components with Framer Motion
npx shadcn@latest search @magicui -q "[keyword]"

# Aceternity - Modern UI with 3D effects
npx shadcn@latest search @aceternity -q "[keyword]"

# Kibo UI - Component library
npx shadcn@latest search @kibo-ui -q "[keyword]"

# Additional configured registries
npx shadcn@latest search @reui -q "[keyword]"
npx shadcn@latest search @scrollxui -q "[keyword]"
npx shadcn@latest search @moleculeui -q "[keyword]"
npx shadcn@latest search @gaia -q "[keyword]"
npx shadcn@latest search @phucbm -q "[keyword]"
\`\`\`

**4.5.3: Preview Promising Components**

Before including in architecture, preview implementation details:

\`\`\`bash
# View official component code
npx shadcn@latest view [component-name]

# View registry component code
npx shadcn@latest view @magicui/[component-name]
\`\`\`

**4.5.4: Document Component Selections**

Add a **Component Strategy** section to feature.md after "Architecture Decision":

\`\`\`markdown
### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| [element] | [component] | shadcn/ui | [why this choice] |
| [element] | @magicui/[name] | @magicui | [why this choice] |

**Components to Install** (if not already in packages/ui):
- [ ] \`npx shadcn@latest add [component]\`
- [ ] \`npx shadcn@latest add @registry/[component]\`
\`\`\`

**Decision Criteria**:
- **Official shadcn/ui first** - For standard UI patterns (forms, dialogs, cards, tables)
- **Community registry** - When feature needs animations, effects, or specialized behavior
- **Custom component** - Only when no suitable component exists in any registry
```

### Step 2: Update feature-decompose.md - Add Component Strategy to Feature Template

In the "Step 9: Create Feature Documents" section, add Component Strategy to the required sections list.

Find the line:
```markdown
**Required sections in feature.md**:
```

Add "Component Strategy (from Step 4.5)" to the bullet list after "Architecture Decision".

### Step 3: Update task-decompose.md - Add UI Component Task Handling

Add a new section for UI Component Task Handling in the Instructions section. Insert after the existing sub-agent delegation guidance, before the Report section.

Add the following content:

```markdown
### UI Component Task Handling

**Identifying Component Tasks**:
Tasks that create or integrate UI components should check shadcn availability before creating custom implementations.

**Before Creating a UI Component Task**:
1. Check if component exists in `packages/ui/src/shadcn/`
2. Search shadcn CLI: `npx shadcn@latest search -q "[component]"`
3. Search configured registries if official component not found
4. If found, create installation task as prerequisite

**Component Installation Task Template**:
\`\`\`json
{
  "id": "T2",
  "name": "Install [component] from shadcn",
  "requires_ui_component": true,
  "component_source": "shadcn/ui | @magicui | @aceternity | etc",
  "installation_command": "cd packages/ui && npx shadcn@latest add [component] -y",
  "action": { "verb": "Install", "target": "[component] component" },
  "outputs": [
    { "type": "new", "path": "packages/ui/src/shadcn/[component].tsx" }
  ],
  "verification_command": "test -f packages/ui/src/shadcn/[component].tsx && grep -q './[component]' packages/ui/package.json",
  "post_install_steps": [
    "Update packages/ui/package.json exports if not auto-added",
    "Run pnpm typecheck to verify"
  ]
}
\`\`\`

**Component Task Best Practices**:
- Always install components before tasks that use them
- Verify exports are added to packages/ui/package.json
- Run typecheck after installation to catch import issues
- Document component choice rationale in task context

**Configured Registries Reference**:
| Registry | Namespace | Specialty |
|----------|-----------|-----------|
| Official | (none) | Core UI components |
| MagicUI | @magicui | Animated components |
| Aceternity | @aceternity | Modern UI effects |
| Kibo UI | @kibo-ui | Component library |
| ReUI | @reui | Component library |
| ScrollX UI | @scrollxui | Scroll effects |
| Molecule UI | @moleculeui | Component library |
| Gaia | @gaia | Component library |
| PhucBM | @phucbm | Component library |
```

### Step 4: Validate Changes

Run validation commands to ensure changes don't break markdown formatting and files are correctly modified.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify feature-decompose.md contains new Step 4.5
grep -q "Step 4.5: Discover Available Components" .claude/commands/alpha/feature-decompose.md && echo "✅ Step 4.5 added to feature-decompose.md" || echo "❌ Step 4.5 missing"

# Verify Component Strategy section mentioned in feature template
grep -q "Component Strategy" .claude/commands/alpha/feature-decompose.md && echo "✅ Component Strategy mentioned" || echo "❌ Component Strategy missing"

# Verify task-decompose.md contains UI Component Task Handling
grep -q "UI Component Task Handling" .claude/commands/alpha/task-decompose.md && echo "✅ UI Component section added to task-decompose.md" || echo "❌ UI Component section missing"

# Verify configured registries are mentioned
grep -q "@magicui" .claude/commands/alpha/feature-decompose.md && echo "✅ Registry @magicui referenced" || echo "❌ Registry @magicui missing"

# Verify markdown syntax is valid (no broken links or formatting)
head -50 .claude/commands/alpha/feature-decompose.md
head -50 .claude/commands/alpha/task-decompose.md

# Verify YAML frontmatter is intact
head -10 .claude/commands/alpha/feature-decompose.md | grep -q "^---" && echo "✅ Frontmatter intact" || echo "❌ Frontmatter broken"
head -10 .claude/commands/alpha/task-decompose.md | grep -q "^---" && echo "✅ Frontmatter intact" || echo "❌ Frontmatter broken"

# Run linting on markdown files (if markdownlint available)
pnpm lint:fix 2>/dev/null || echo "Lint completed or not configured"
```

## Notes

- The component discovery step is positioned strategically between complexity assessment and architecture design because:
  1. Complexity is already assessed, so we know what we're building
  2. Architecture decisions can now be informed by available components
  3. Code-architect sub-agents benefit from knowing what's available

- The registries listed match those configured in `packages/ui/components.json`

- Component installation tasks should always precede tasks that use those components in the execution order

- This chore follows the "additive documentation" pattern - no existing behavior is changed, only enhanced with new guidance

- Future enhancement: Consider creating an `alpha-component-discovery` sub-agent that automates the search process
