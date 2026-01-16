---
description: Create detailed feature plan using research manifest from /initiative workflow. Updates GitHub issue with plan and marks as planned
argument-hint: [issue-number] --manifest [path] --master-issue [number]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, Skill, SlashCommand]
---

# Initiative Feature Planning

Create a detailed implementation plan for a feature that is part of an `/initiative` workflow. Uses pre-generated research manifest for context and updates the GitHub issue with the complete plan.

## When to Use This Command

| Scenario | Use This Command | Use Instead |
|----------|------------------|-------------|
| Part of `/initiative` workflow | ✅ Called automatically by orchestrator | - |
| Planning a single feature in an existing initiative | ✅ Use standalone with `--manifest` flag | - |
| Planning a brand new feature (not part of initiative) | ❌ | Use `/feature` |
| Re-planning a feature after changes | ✅ Use standalone with existing manifest | - |

### Standalone Usage

If you have an existing initiative manifest and want to plan (or re-plan) a single feature:

```bash
/initiative-feature 1273 --manifest github:issue:1267 --master-issue 1268
```

This is useful when:
- A feature plan needs revision after user feedback
- Adding a new feature to an existing initiative
- Re-running planning after manifest updates

### Integration with /initiative

When called by `/initiative`, this command receives:
- GitHub issue number for the feature stub
- Manifest reference (GitHub issue or local path)
- Master issue number for the parent feature-set

The orchestrator collects the output JSON and continues to implementation phase.

## Key Differences from /feature

| Aspect | /feature | /initiative-feature |
|--------|----------|---------------------|
| Research | Does own codebase exploration | Loads research manifest |
| Input | Feature description | GitHub issue number + master issue |
| Output | Structured JSON + GitHub issue (full plan embedded) | |
| Interview | Full user interview | Minimal (context from orchestrator) |
| Context | Standalone command | Part of /initiative workflow |
| Skills | Manual invocation | Auto-invokes frontend-design for UI |

## Instructions

IMPORTANT: This command is called by `/initiative` orchestrator with research context already gathered.
IMPORTANT: Load and use the research manifest - do NOT duplicate research.
IMPORTANT: Output must be structured for orchestrator consumption.
IMPORTANT: The full plan MUST be embedded in the GitHub issue body - not referenced as a local file path.

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Issue number**: The GitHub issue number for this feature
- **Manifest path**: Path to research manifest (look for `--manifest` flag)
- **Master issue number**: Parent feature-set issue number (look for `--master-issue` flag)

```typescript
// Expected format:
// $ARGUMENTS = "1235 --manifest .ai/reports/feature-reports/2025-12-17/1234-user-dashboard/manifest.md --master-issue 1234"

const args = "$ARGUMENTS";

// Extract manifest path
const manifestMatch = args.match(/--manifest\s+(\S+)/);
const manifestPath = manifestMatch ? manifestMatch[1] : null;

// Extract master issue number
const masterMatch = args.match(/--master-issue\s+(\d+)/);
const masterIssueNumber = masterMatch ? masterMatch[1] : null;

// Extract feature issue number (remaining after removing flags)
const issueNumber = args
  .replace(/--manifest\s+\S+/, '')
  .replace(/--master-issue\s+\d+/, '')
  .trim()
  .replace('#', '');

// Derive initiative slug from manifest path
// e.g., ".ai/reports/.../1234-user-dashboard/manifest.md" -> "user-dashboard"
const slugMatch = manifestPath?.match(/\/(\d+)-([^/]+)\/manifest\.md$/);
const initiativeSlug = slugMatch ? slugMatch[2] : 'unknown';
```

**CRITICAL**: If `--master-issue` is not provided, extract it from the manifest path (the number prefix).

### Step 2: Fetch GitHub Issue

Load the feature stub issue created by `/initiative`:

```bash
gh issue view <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body,title,labels,number,url
```

Extract from issue:
- Feature title and description
- Parent feature-set issue reference (verify matches --master-issue)
- Initial scope/requirements
- Feature type and priority

**Derive feature slug from title:**
```typescript
// "Feature: Dashboard Layout Grid and Data Loader" -> "dashboard-layout"
const featureSlug = title
  .replace(/^Feature:\s*/i, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .substring(0, 30)
  .replace(/-+$/, '');
```

### Step 3: Load Research Manifest

**P1 Fix**: Manifest can be a local file path OR a GitHub issue reference.

```typescript
// Check if manifest is a GitHub issue reference
if (manifestPath && manifestPath.startsWith('github:issue:')) {
  // Extract issue number and fetch from GitHub
  const issueNumber = manifestPath.replace('github:issue:', '');
  // Fetch manifest from GitHub issue
}
```

**If manifest is GitHub issue reference (`github:issue:<number>`):**

```bash
# Fetch manifest content from GitHub issue
gh issue view <manifest-issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body \
  -q .body
```

**If manifest is local file path:**

```bash
cat <manifest-path>
```

Extract from manifest:
- Technology overview
- Recommended patterns
- Gotchas and warnings
- Code examples
- Feature-specific research sections

This research informs your planning - use it extensively.

### Step 4: Detect Feature Type and Invoke Skills

**CRITICAL**: Analyze the feature to determine if specialized skills should be invoked.

**UI/Frontend Detection Keywords:**
- dashboard, component, widget, card, chart, graph, table, form
- button, modal, dialog, panel, sidebar, navigation
- layout, grid, responsive, styling, design
- radial, spider, radar, progress, visualization

**If UI/Frontend feature detected:**
```typescript
Skill({ skill: "frontend-design" })
```

Read the skill output and apply its guidelines to the plan.

**Database Detection Keywords:**
- schema, migration, table, column, RLS, policy
- query, index, foreign key, constraint

**If database changes detected:**
- Flag for schema file creation
- Include migration commands in validation

### Step 5: Load Conditional Documentation

Use the conditional docs system for project-specific patterns:

```typescript
SlashCommand({ command: '/conditional_docs initiative-feature "<feature-title>"' })
```

Read suggested documentation files to understand:
- Existing patterns to follow
- Integration points
- Testing conventions

### Step 6: Feature-Specific Research (MANDATORY for Complex Features)

**MANDATORY RESEARCH TRIGGERS** - If ANY of these apply, you MUST conduct additional research:

1. **External Libraries**: Feature uses library not covered in manifest
2. **External Services**: Integration with Cal.com, Stripe, external APIs
3. **Security Features**: Authentication, authorization, encryption, permissions
4. **Database Schema**: New tables, columns, or RLS policies needed
5. **Performance Critical**: Caching, pagination, real-time updates
6. **Complex UI**: Charts, visualizations, complex state management

**Research Tools:**

**Context7 CLI** - For library documentation:
```bash
# Search for libraries
.ai/bin/context7-search "library-name"

# Get documentation for specific topic
.ai/bin/context7-get-context <owner> <repo> --topic <topic> --tokens 3000
```

**Perplexity CLI** - For best practices:
```bash
# Get AI-generated answer with citations
.ai/bin/perplexity-chat "What are the best practices for X?"
```

**Task(Explore)** - For codebase patterns:
```typescript
Task('Explore', {
  prompt: `Find existing patterns for <specific-pattern>.
           Focus on: code examples, integration points.`
})
```

**REQUIRED OUTPUT** if research was performed:
```md
## Additional Research Conducted

### Research Topic 1: <topic>
- **Source**: Context7 / Perplexity / Explore agent
- **Key Findings**: <summary>
- **Applied To**: <how this informs the plan>
```

### Step 7: Research-Informed Planning

Using research manifest findings AND skill guidelines (if invoked), create the implementation plan.

**CRITICAL: Progress Markers**

Output progress markers throughout planning:

```
[PROGRESS] Planning: Loading manifest from <path>
[PROGRESS] Planning: Analyzing feature #<issue>
[PROGRESS] Planning: Invoking frontend-design skill (if UI feature)
[PROGRESS] Planning: Conducting additional research (if triggered)
[PROGRESS] Planning: Designing solution approach
[PROGRESS] Planning: Creating plan file
[PROGRESS] Planning: Updating GitHub issue with full plan
```

**Research-Guided Approach:**
- Apply technology patterns from manifest
- Apply design guidelines from frontend-design skill (if invoked)
- Reference code examples for implementation
- Consider gotchas when designing solution
- Follow recommended patterns from research

### Step 8: Create Plan File

**Directory**: `.ai/specs/feature-sets/<master-issue#>-<initiative-slug>/`
**Filename**: `<feature-issue#>-<feature-slug>.md`

Example: `.ai/specs/feature-sets/1234-user-dashboard/1235-dashboard-layout.md`

```bash
# Create directory if needed
mkdir -p ".ai/specs/feature-sets/${masterIssueNumber}-${initiativeSlug}"

# Write plan file
cat > ".ai/specs/feature-sets/${masterIssueNumber}-${initiativeSlug}/${issueNumber}-${featureSlug}.md" << 'EOF'
<plan-content>
EOF
```

Use the Plan Format below, enhanced with research context and skill guidelines.

### Step 9: Update GitHub Issue (FULL PLAN EMBEDDED)

**CRITICAL**: The GitHub issue body MUST contain the COMPLETE plan content. Do NOT reference local file paths.

The sandbox clones from GitHub and won't have access to local files. The plan must be fully readable from the GitHub issue.

```bash
# Update issue with FULL plan content (not a file reference)
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --body "$(cat << 'PLAN_EOF'
<FULL PLAN CONTENT HERE - NOT A FILE PATH REFERENCE>
PLAN_EOF
)"

# Add labels
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "status:planned" \
  --remove-label "status:ready"
```

**The issue body should contain:**
1. Full feature description
2. Solution approach
3. All implementation tasks
4. Validation commands
5. Acceptance criteria

**NOT acceptable:**
- `**Plan File**: .ai/specs/features/...` (local path reference)
- Links to local files
- Abbreviated plans

### Step 10: Generate Structured Output

**CRITICAL**: Output structured JSON for orchestrator:

```
=== PLANNING OUTPUT ===
{
  "success": true,
  "feature": {
    "issue_number": 1235,
    "title": "Dashboard Layout Grid and Data Loader",
    "slug": "dashboard-layout",
    "url": "https://github.com/MLorneSmith/2025slideheroes/issues/1235"
  },
  "initiative": {
    "master_issue": 1234,
    "slug": "user-dashboard"
  },
  "plan": {
    "file_path": ".ai/specs/feature-sets/1234-user-dashboard/1235-dashboard-layout.md",
    "file_size_bytes": 5432,
    "phases": 3,
    "tasks": 12
  },
  "skills_invoked": ["frontend-design"],
  "research_conducted": true,
  "validation_commands": [
    "pnpm typecheck",
    "pnpm lint:fix",
    "pnpm build"
  ],
  "dependencies": {
    "packages": [],
    "features": []
  },
  "database_impact": {
    "requires_changes": false,
    "new_tables": [],
    "modified_tables": [],
    "schema_file": null,
    "rls_policies": [],
    "migration_commands": []
  },
  "estimated_files": [
    "apps/web/app/home/(user)/page.tsx",
    "apps/web/app/home/(user)/_components/dashboard-grid.tsx"
  ],
  "research_sections_used": [
    "Technology Overview",
    "Code Examples - Data Loading Pattern",
    "Gotchas - User ID context"
  ],
  "github_updated": true,
  "plan_embedded_in_issue": true,
  "verification": {
    "plan_file_created": true,
    "plan_file_path": ".ai/specs/feature-sets/1234-user-dashboard/1235-dashboard-layout.md",
    "plan_file_size_bytes": 5432,
    "github_issue_updated": true,
    "github_issue_body_length": 8234,
    "labels_updated": true,
    "skills_invoked": ["frontend-design"],
    "conditional_docs_loaded": ["development/shadcn-ui-components.md", "development/react-query-patterns.md"]
  }
}
=== END PLANNING OUTPUT ===
```

**P4 Fix**: The `verification` block provides explicit data for orchestrator validation. Include:
- `plan_file_created`: Boolean - was the plan file successfully written
- `plan_file_path`: String - full path to plan file
- `plan_file_size_bytes`: Number - size of plan file (should be >500 bytes)
- `github_issue_updated`: Boolean - was the GitHub issue updated
- `github_issue_body_length`: Number - length of issue body (should be >1000 chars)
- `labels_updated`: Boolean - was status:planned label added
- `skills_invoked`: Array - which skills were loaded
- `conditional_docs_loaded`: Array - which context docs were loaded

## Plan Format

The plan should follow this structure (to be embedded in GitHub issue):

```md
# Feature: <feature name>

**Parent Initiative**: #<master-issue-number>
**Feature Issue**: #<feature-issue-number>
**Phase**: <phase number>
**Effort**: <S/M/L>
**Dependencies**: <list or "None">

---

## Description

<detailed description of what this feature does>

## User Story

As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Solution Approach

<describe the technical approach, referencing patterns from research>

## Research Applied

### From Manifest
- <key pattern or insight applied>

### From Skills
- <guidelines from frontend-design skill if invoked>

### Additional Research
- <findings from Context7/Perplexity if conducted>

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `path/to/file.tsx` | Description |

### Modified Files
| File | Changes |
|------|---------|
| `path/to/existing.tsx` | What changes |

## Database Impact

- **Schema Changes**: Yes/No
- **New Tables**: <list or "None">
- **New RLS Policies**: <list or "None">
- **Migration Commands**: <commands or "N/A">

## Implementation Tasks

### Task 1: <name>
- [ ] Subtask 1
- [ ] Subtask 2

### Task 2: <name>
- [ ] Subtask 1
- [ ] Subtask 2

<continue for all tasks>

## Testing Strategy

- **Unit Tests**: <what to test>
- **Integration Tests**: <what to test>
- **E2E Tests**: <what to test>

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All validation commands pass

## Validation Commands

\`\`\`bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
\`\`\`

---
*Plan generated by /initiative-feature*
*Skills used: <list>*
*Research conducted: <yes/no>*
```

## Error Handling

- **Issue not found**: Return error status with message
- **Manifest not found**: Return warning, proceed with standard /feature approach
- **Master issue not provided**: Extract from manifest path or return error
- **GitHub update failure**: Include in output, don't fail entire planning
- **Skill invocation failure**: Log warning, continue without skill

## Related Commands

- **`/initiative`**: Main orchestrator (calls this command)
- **`/feature`**: Standalone version (without orchestrator)
- **`/implement`**: Execute this plan in sandbox

## Initiative Input

$ARGUMENTS
