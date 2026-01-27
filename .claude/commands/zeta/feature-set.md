---
description: Decompose complex initiatives into multiple coherent features with dependency mapping, GitHub integration, and coordinated execution planning
argument-hint: [initiative-description]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Feature Set Decomposition

Decompose complex multi-feature initiatives into 3-8 logical features with dependency mapping and GitHub tracking. Creates master plan + feature stubs for `/feature:feature` → `/implement` workflow.

## Instructions

IMPORTANT: You're creating a decomposition plan for a complex initiative that spans multiple features.
IMPORTANT: This is strategic planning - identifying feature boundaries and dependencies, not implementing features.
IMPORTANT: The output will be used to create `/feature:feature` plans for each identified feature.

### Step 1: Interview User

Use AskUserQuestion to gather initiative context:

| Question | Header | Options |
|----------|--------|---------|
| What type of initiative? | Initiative | New system, Major enhancement, Integration, Migration/Refactor |
| Expected feature count? | Complexity | 3-5 features, 6-8 features, 8+ features (split recommended) |
| Primary domains affected? | Domain | Database/Schema, API/Services, UI/Frontend, Infrastructure (multiSelect) |
| Risk level? | Risk | Low, Medium, High |

Follow-up as needed: Initiative Summary, Problem Statement, Scope & Constraints, Success Criteria, Integration Points, Risks & Concerns.

Extract: `initiativeTitle`, `problemStatement`, `scope`, `successCriteria`

### Step 2: Read Relevant Context Documentation

Use the conditional documentation system:

```bash
# Load context for this initiative decomposition
/conditional_docs implement "[brief summary of the initiative focusing on key technical areas]"
```

Then read the suggested documentation files to understand:
- Project architecture and existing patterns
- How similar systems are structured
- Best practices for the areas involved
- Constraints and technical considerations

### Step 3: Research Codebase Architecture

Understanding the existing architecture is critical for good decomposition:

- **Read** `README.md` and `CLAUDE.md` for project structure and conventions
- **Explore** the codebase using Task agent with `subagent_type=Explore` to:
  - Understand current architecture layers (database, service, API, UI)
  - Identify domain boundaries (auth, content, billing, canvas, etc.)
  - Find existing patterns and component separation
  - Map integration points with external systems

### Step 4: Analyze Initiative for Feature Boundaries

Decompose the initiative into logical features based on:

**Architecture-Based Boundaries:**
- Separate database/schema layer changes from service layer
- Separate API/server action layer from UI layer
- Identify each bounded domain (e.g., auth system, payment processing)

**Dependency Patterns:**
- Which work is strictly sequential (must complete before other work)
- Which work can run in parallel
- Shared infrastructure or coordination points

**Scope Patterns:**
- Each feature should be independently reviewable
- Features should not have circular dependencies
- Complex features (>1 week work) may need further decomposition

**Naming Conventions:**
- Use clear, descriptive feature names
- Prefix with system area if helpful (e.g., "Database: Presentation Storage Optimization")
- Avoid generic names ("Phase 1", "Component A")

### Step 5: Create Dependency Graph

Build the dependency model showing:

**Explicit Dependencies:**
- Feature A must complete before Feature B can start
- Feature C is blocked by Feature B
- Features D, E, F can run in parallel

**Shared Resources:**
- Database migrations that affect multiple features
- Shared API contracts
- UI components or patterns used by multiple features

**Coordination Points:**
- Where features integrate
- Integration testing needs
- Cross-feature validation

### Step 6: Group into Implementation Phases

Create a phased execution plan:

**Phase 1: Foundation**
- Infrastructure setup, database changes, service-layer foundation
- Features with no dependencies (critical path)

**Phase 2: Core Implementation**
- Features that depend on Phase 1
- Can include parallel work where dependencies allow

**Phase 3: Integration & Polish**
- Features that integrate multiple Phase 2 components
- Testing, optimization, documentation

Rationale: Why this sequence? (dependencies, risk mitigation, delivery value)

### Step 7: Validate Decomposition

Ensure the decomposition is complete and logical:

**Validation Checklist:**
- [ ] 3-8 features identified (well-scoped, not too granular)
- [ ] All initiative requirements covered by features
- [ ] Dependencies are explicit and accurate
- [ ] No circular dependencies
- [ ] Phases are logically sequenced
- [ ] Each feature is independently implementable
- [ ] Clear success criteria for each feature
- [ ] Effort estimates are realistic

If validation fails, refine the decomposition.

### Step 8: Create GitHub Issues

After user reviews and approves the decomposition:

1. **Create master feature-set issue** using the `GitHub Issue Creation` process
2. **Create feature stub issues** for each identified feature
3. **Link all issues** with dependency information
4. **Create github-mapping.md** to track issue relationships
5. **Rename plan file** from `pending-overview.md` to `<issue#>-overview.md`

### Step 9: Report Results

Follow the `Report` section to properly report the results of your work.

## Master Feature Set Plan Format

The output will be a master plan document with this structure:

```markdown
# Feature Set: [Initiative Name]

## Executive Summary
[1-2 paragraph overview of the initiative and decomposition strategy]

## Problem Statement
[What problem is being solved]

## Success Criteria
[How success will be measured]

## Feature Breakdown
[For each identified feature:]

### Feature: [Feature Name]
**Purpose**: [What this feature does]
**Dependencies**: [Features that must complete first]
**Implementation Phase**: [Phase 1/2/3]
**Effort Estimate**: [Rough estimate: S/M/L/XL]
**Description**: [Detailed description ready for `/feature:feature` command]

## Dependency Graph

[Visual or list format showing:
- Sequential dependencies (A → B → C)
- Parallel opportunities (D || E || F)
- Integration points (where features come together)]

## Implementation Strategy

### Phase 1: [Phase Name]
[Features in this phase and rationale]

### Phase 2: [Phase Name]
[Features in this phase and rationale]

### Phase 3: [Phase Name]
[Features in this phase and rationale]

## Risk Assessment
[Known risks, mitigation strategies]

## Next Steps
[How to proceed: use `/feature:feature` command on each feature]

## GitHub Issues
[Links to master feature-set issue and individual feature issues]
```

## GitHub Issue Creation

After user approves the decomposition, create GitHub issues for tracking.

### Step 1: Create Master Feature Set Issue

```bash
# Create master feature-set issue with overview and dependency graph
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: <initiativeTitle>" \
  --body "<master-plan-content-from-overview.md>" \
  --label "type:feature-set" \
  --label "status:planning" \
  --label "priority:<priority>" \
  --label "area:<primary-domain>"

# Capture the master issue number from output
# The gh CLI will output the URL in format: https://github.com/MLorneSmith/2025slideheroes/issues/<number>
MASTER_ISSUE_NUMBER=<captured-from-output>

# Rename the overview file to include issue number
# OLD: .ai/specs/feature-sets/<initiative-slug>/pending-overview.md
# NEW: .ai/specs/feature-sets/<initiative-slug>/<issue#>-overview.md
mv .ai/specs/feature-sets/<slug>/pending-overview.md \
   .ai/specs/feature-sets/<slug>/${MASTER_ISSUE_NUMBER}-overview.md
```

### Step 2: Create Individual Feature Stub Issues

For each identified feature in the decomposition:

```bash
# Create feature stub issue linked to master
# Note: These are stubs - full plans created via /feature:feature command
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature: <featureName>" \
  --body "## Feature Stub

**Part of Feature Set**: #${MASTER_ISSUE_NUMBER}
**Implementation Phase**: <phase-number>
**Dependencies**: <list-of-blocking-feature-issues-or-none>
**Effort Estimate**: <S|M|L|XL>

### Description
<feature-description-from-decomposition>

### Purpose
<what-this-feature-does>

---
*This is a feature stub created by \`/feature-set\`. Run \`/feature:feature <description>\` to create the full implementation plan.*" \
  --label "type:feature" \
  --label "status:blocked" \
  --label "priority:<priority>" \
  --label "area:<feature-area>"

# Capture feature issue number for dependency mapping
FEATURE_<N>_ISSUE=<captured-from-output>
```

### Step 3: Update Master Issue with Feature Links

```bash
# Comment on master issue with all feature issue links and dependency graph
gh issue comment ${MASTER_ISSUE_NUMBER} \
  --repo MLorneSmith/2025slideheroes \
  --body "## Feature Issues Created

### Phase 1: Foundation
- #<feature-1-issue> - <feature-1-name>
- #<feature-2-issue> - <feature-2-name>

### Phase 2: Core Implementation
- #<feature-3-issue> - <feature-3-name> (blocked by #<feature-1-issue>)
- #<feature-4-issue> - <feature-4-name> (parallel)

### Phase 3: Integration
- #<feature-5-issue> - <feature-5-name> (blocked by #<feature-3-issue>, #<feature-4-issue>)

---
**Dependency Graph**:
\`\`\`
#<f1> ──┬──> #<f3> ──┐
        │           ├──> #<f5>
#<f2> ──┴──> #<f4> ──┘
\`\`\`

**Next Steps**: Run \`/feature:feature\` on each stub to create detailed implementation plans."
```

### Step 4: Create GitHub Mapping File

Save the issue mapping for reference:

```bash
# Create mapping file for tracking
cat > .ai/specs/feature-sets/<slug>/github-mapping.md << 'EOF'
# GitHub Issue Mapping

## Master Issue
- **Feature Set**: #<MASTER_ISSUE_NUMBER> - <initiativeTitle>

## Feature Issues

| Phase | Issue | Feature | Status | Dependencies |
|-------|-------|---------|--------|--------------|
| 1 | #<issue> | <name> | blocked | none |
| 1 | #<issue> | <name> | blocked | none |
| 2 | #<issue> | <name> | blocked | #<dep1> |
| 2 | #<issue> | <name> | blocked | #<dep1> |
| 3 | #<issue> | <name> | blocked | #<dep2>, #<dep3> |

## Workflow

1. Unblock Phase 1 features: `gh issue edit #<issue> --remove-label "status:blocked" --add-label "status:ready"`
2. Run `/feature:feature <description>` for each feature to create detailed plans
3. Run `/implement <issue#>` to execute each plan
4. Update dependencies as features complete
EOF
```

## Feature Status Workflow

| Action | Command |
|--------|---------|
| Unblock feature | `gh issue edit #<issue> --remove-label "status:blocked" --add-label "status:ready"` |
| Complete feature | `gh issue close #<issue> --comment "✅ Complete"` |
| Close master | `gh issue close #<master> --comment "🎉 Feature Set complete"` |

Traceability: Feature Set → Features → Issues → Implementations

## Plan Storage

Master feature set plans are stored in:
```
.ai/specs/feature-sets/[initiative-slug]/
├── pending-overview.md      # Master plan (before GitHub issue creation)
├── <issue#>-overview.md     # Master plan (after GitHub issue creation)
├── dependency-graph.md      # Visual dependency mapping
├── github-mapping.md        # Issue tracking and workflow reference
└── notes.md                 # Implementation notes
```

**Filename Convention**:
- Use `pending-overview.md` initially when creating the plan
- After GitHub issue creation, rename to `<issue#>-overview.md`
- Example: `pending-overview.md` → `42-overview.md`

Individual features are then created using `/feature:feature` command.

## Integration with Existing Workflow

**Complete Workflow:**
```
/feature-set "complex initiative"
    ↓ Analysis & Decomposition
Master Plan + Feature Stubs
    ↓ User review & approval
For each feature:
    /feature:feature [feature-name]
        ↓ Creates detailed plan
    /implement [issue-number]
        ↓ Executes plan
```

## Initiative Input

$ARGUMENTS

## Report

After creating the feature set plan and GitHub issues, report:

- **Master plan created**: `.ai/specs/feature-sets/<slug>/<issue#>-overview.md`
- **Master GitHub issue**: #<master-issue-number>
- **Feature stub issues created**: List all feature issues with their numbers
- **Dependency mapping**: `.ai/specs/feature-sets/<slug>/github-mapping.md`
- **Total features identified**: <count>
- **Phases**: <count> phases with parallel/sequential breakdown

**Summary**:
- Summarize the decomposition in 2-3 sentences
- Highlight any risks or concerns identified
- Note any features that may need further decomposition

**Next Steps**:
1. Review the master plan and feature stubs
2. Unblock Phase 1 features: `gh issue edit #<issue> --remove-label "status:blocked" --add-label "status:ready"`
3. Run `/feature:feature <description>` on each feature to create detailed implementation plans
4. Run `/implement <issue#>` to execute each plan

## Related Commands

- **`/feature:feature`**: Create detailed implementation plan for a single feature
- **`/implement`**: Execute a feature or bug fix plan
- **`/diagnose`**: Investigate and document root causes
- **`/conditional_docs`**: Load relevant documentation for a task
