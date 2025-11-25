---
description: Decompose complex initiatives into multiple coherent features with dependency mapping, GitHub integration, and coordinated execution planning
argument-hint: [initiative-description]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Feature Set Decomposition

Break down large, complex multi-feature initiatives into manageable, independently implementable features with explicit dependency mapping and integrated GitHub tracking. Creates a master feature set plan and individual feature stubs ready for `/feature` command expansion.

## Overview

The `/feature-set` command analyzes high-level work requests, decomposes them into 3-8 logical feature boundaries, maps dependencies, and creates a coordinated execution plan that integrates seamlessly with the existing `/feature` → `/implement` workflow.

**Key Benefits:**
- Reduces planning time by 40-60%
- Ensures no work is missed
- Identifies dependencies explicitly
- Enables parallel execution where possible
- Creates traceable GitHub issue structure

## Instructions

IMPORTANT: You're creating a decomposition plan for a complex initiative that spans multiple features.
IMPORTANT: This is strategic planning - identifying feature boundaries and dependencies, not implementing features.
IMPORTANT: The output will be used to create `/feature` plans for each identified feature.

### Step 1: Interview User

Gather the initiative context by asking for:

1. **Initiative Summary**: High-level description of what's being built
2. **Problem Statement**: What problem does this solve?
3. **Scope & Constraints**: Boundaries, technical constraints, external dependencies
4. **Success Criteria**: How we'll measure if this initiative is successful
5. **Integration Points**: Which existing systems does this connect to?
6. **Timeline**: Expected overall timeline
7. **Risks & Concerns**: Known risks or blockers
8. **Team Familiarity**: Which areas of codebase is the team comfortable with?

Extract and define:
```typescript
const initiativeTitle = '[Brief description]'; // e.g., "Real-time Collaboration System"
const problemStatement = '[What problem is this solving]';
const scope = '[Initiative boundaries and constraints]';
const successCriteria = '[Measurable success indicators]';
```

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

## Relevant Files to Reference

### Command Structure
- `.claude/commands/feature.md` - Feature planning command to understand integration
- `.claude/commands/implement.md` - Implementation command workflow
- `.claude/commands/diagnose.md` - Diagnosis patterns for reference

### Configuration
- `.claude/config/command-profiles.yaml` - Add feature-set routing profile
- `CLAUDE.md` - Project standards and patterns

### Documentation Sources
- `.ai/ai_docs/context-docs/development/` - Architecture and patterns
- `.ai/ai_docs/context-docs/infrastructure/` - Infrastructure patterns
- `.ai/specs/` - Where feature set plans will be stored

### New Files to Create
- `.claude/commands/feature-set.md` - This command (the structure itself)
- `.claude/config/command-profiles.yaml` - Update with feature-set profile
- `.ai/ai_docs/context-docs/development/feature-set-workflow.md` - Usage documentation
- `CLAUDE.md` - Update with feature-set guidance

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
**Description**: [Detailed description ready for `/feature` command]

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
[How to proceed: use `/feature` command on each feature]

## GitHub Issues
[Links to master feature-set issue and individual feature issues]
```

## Feature Stub Format

For each identified feature, generate a GitHub issue stub:

**Title**: `Feature: [Feature Name]`
**Body**: Detailed description from the master plan
**Labels**: `feature`, `from-feature-set`, `[phase]`
**Links**: Reference to master feature-set issue

## GitHub Integration

Create:
1. **Master Feature Set Issue**: Comprehensive overview with all features listed
2. **Individual Feature Issues**: One per identified feature with links to master
3. **Dependency Graph**: Visual or explicit in master issue

This creates full traceability: Feature Set → Features → Issues → Implementations

## Pre-Decomposition Checklist

Before creating the feature set plan:
- [ ] Verify you have read the recommended context documents
- [ ] Understand the initiative requirements thoroughly
- [ ] Research codebase architecture and existing patterns
- [ ] Validate feature boundaries with team familiarity
- [ ] Confirm scope and timeline are realistic
- [ ] Identify all integration points
- [ ] Validate decomposition against checklist

## Plan Storage

Master feature set plans are stored in:
```
.ai/specs/feature-sets/[initiative-slug]/
├── overview.md          # Master plan
├── dependency-graph.md  # Visual dependency mapping
└── notes.md            # Implementation notes
```

Individual features are then created using `/feature` command.

## Integration with Existing Workflow

**Complete Workflow:**
```
/feature-set "complex initiative"
    ↓ Analysis & Decomposition
Master Plan + Feature Stubs
    ↓ User review & approval
For each feature:
    /feature [feature-name]
        ↓ Creates detailed plan
    /implement [issue-number]
        ↓ Executes plan
```

## Key Principles

1. **Logical Boundaries**: Features map to architectural/domain boundaries, not arbitrary divisions
2. **Clear Dependencies**: All dependencies are explicit, enabling optimal parallelization
3. **Independent Implementation**: Each feature can be implemented, tested, and reviewed separately
4. **Traceability**: Complete linking from initiative → features → issues → code
5. **Flexibility**: Can adjust decomposition based on team feedback before implementation

## Decision Framework

**When to use `/feature-set`:**
- Complex initiatives requiring 3+ features
- Multiple systems/layers involved
- Unclear feature boundaries
- High dependency complexity
- Large team requiring clear coordination

**When to use `/feature` directly:**
- Single, well-defined feature
- Simple, isolated functionality
- Clear implementation approach
- No complex dependencies

## Example Decompositions

### Example 1: Real-Time Collaboration System
```
Foundation Phase:
- Feature: Database Schema for Real-Time Sync
- Feature: Conflict Resolution Service

Core Features (Parallel):
- Feature: Presence Indicators UI
- Feature: Live Cursor Tracking
- Feature: Real-Time Awareness Service

Integration Phase:
- Feature: Multi-User Synchronization Tests
- Feature: Performance Optimization
```

### Example 2: Payment System Integration
```
Phase 1:
- Feature: Stripe API Integration Service
- Feature: Subscription Database Schema

Phase 2 (Sequential):
- Feature: Billing Checkout Flow
- Feature: Payment Status Management
- Feature: Invoice Generation

Phase 3:
- Feature: Subscription Renewal Automation
- Feature: Payment Analytics & Reporting
```

## Common Pitfalls to Avoid

**Too Granular**: Creating features that are too small (< 1 day work each)
- Solution: Combine related small features into logical groups

**Circular Dependencies**: Feature A depends on B, B depends on A
- Solution: Identify shared infrastructure, create separate feature for it

**Missing Coordination**: Features that look independent but require integration work
- Solution: Add explicit integration features or note in dependencies

**Unclear Boundaries**: Overlapping feature scopes that could be clearer
- Solution: Review with team, refine based on architecture knowledge

**Unbalanced Load**: One phase has all the work, others are empty
- Solution: Look for opportunities to parallelize or redistribute work

## Success Metrics

The feature-set command is successful when:

1. **Complete Coverage**: All initiative requirements covered by identified features
2. **Clear Boundaries**: Each feature has distinct, non-overlapping scope
3. **Accurate Dependencies**: Dependency graph reflects actual constraints
4. **Optimal Sequencing**: Phases are logically ordered for delivery value
5. **Implementable**: Each feature is independently reviewable and completable
6. **Team Confidence**: Team agrees decomposition is logical and realistic

## Notes

This command is designed to be used for **complex strategic decomposition**, not for incremental feature planning. It works best when:

- Initiative requirements are well-understood
- Team has domain knowledge of affected areas
- Architecture is established and documented
- Dependencies can be explicitly identified

The output feeds directly into the existing `/feature` → `/implement` workflow, maintaining consistency with project standards.

## Related Commands

- **`/feature`**: Create detailed implementation plan for a single feature
- **`/implement`**: Execute a feature or bug fix plan
- **`/diagnose`**: Investigate and document root causes
- **`/conditional_docs`**: Load relevant documentation for a task
