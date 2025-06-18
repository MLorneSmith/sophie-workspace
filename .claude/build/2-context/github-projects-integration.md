# GitHub Projects Integration Guide for AAFD v2.0

## Overview

This guide provides Claude Code with instructions on how to use GitHub Projects as an integral part of the AI-Assisted Feature Development (AAFD) v2.0 methodology. The project board serves as the single source of truth for all feature development activities.

## Project Structure

### Single Project Approach

We use **ONE GitHub Project** called "Feature Development" for all features. This provides:

- Unified view of all development work
- Easy tracking of cross-cutting dependencies
- Consistent workflow enforcement
- Simplified metrics and reporting

### Project Views

1. **Planning Board (Table View)**

   - Purpose: Track features from idea through planning phases
   - Columns: Idea → PRD → Chunks → Stories → Ready → Blocked
   - Use: Feature breakdown and preparation

2. **Sprint Board (Kanban View)**

   - Purpose: Manage active development work
   - Columns: Ready → In Progress → Review → Done
   - Use: Daily development tracking

3. **Timeline View (Roadmap)**

   - Purpose: Visualize feature schedules and dependencies
   - Use: Sprint planning and delivery tracking

4. **Priority Matrix (Table View)**
   - Purpose: Data-driven prioritization
   - Axes: Priority vs Story Points
   - Use: Sprint planning decisions

## Custom Fields Reference

### Core Fields

1. **Feature Type** (Single Select)

   - Options: Epic, Story, Task, Bug, Spike
   - Usage: Set based on issue hierarchy

2. **Priority** (Single Select)

   - Options: Critical, High, Medium, Low
   - Usage: Business priority, not technical complexity

3. **Story Points** (Single Select)

   - Options: 1, 2, 3, 5, 8, 13, 21
   - Usage: Complexity estimation for stories only

4. **AAFD Stage** (Single Select)

   - Options: Idea, PRD, Chunks, Validation, Stories, Sprint Planning, Implementation, Review, Ready, Blocked
   - Usage: Track which phase of AAFD process
   - Note: Ready and Blocked are special statuses for queue management and impediments

5. **AI Context Status** (Single Select)

   - Options: Fresh, Loaded, Stale, Needs Refresh
   - Usage: Track context freshness for Claude sessions

6. **Primary Technical Domain** (Single Select)

   - Options: Frontend, Backend, Database, AI, DevOps, Testing
   - Usage: Primary area of work

7. **Implementation Phase** (Single Select)

   - Options: Analysis, Design, Implementation, Testing, Documentation
   - Usage: Current work focus within a story

8. **Agent Assignment** (Single Select)

   - Options: Product Owner, Scrum Master, Builder 1, Builder 2, Reviewer
   - Usage: Track which virtual agent owns the work

9. **Cross-cutting Dependencies** (Text)

   - Usage: List related features/components affected
   - Format: "auth-system, user-dashboard, api-gateway"

10. **Sprint** (Single Select)

    - Options: Sprint 1 through Sprint 12
    - Usage: Assign stories and tasks to specific 1-2 week development iterations
    - Apply to: Stories, Tasks, Bugs
    - Note: Add more sprint options as needed via GitHub web interface

11. **Milestone** (GitHub Milestone)
    - Usage: Group epics and features into major releases or product versions
    - Apply to: Epics and Features (not individual stories)
    - Examples: "v2.0 Release", "Q1 2025 Features", "MVP Launch"
    - Timeline: Typically spans multiple sprints (1-3 months)

## Phase-Specific Instructions

### Phase 1: Idea to PRD

**When creating a new feature:**

1. Create an Epic issue using the Feature Epic template
2. Set initial fields:
   - Feature Type: `Epic`
   - AAFD Stage: `Idea`
   - Priority: Based on business value
   - AI Context Status: `Fresh`
3. Move to Planning Board "Idea" column
4. After PRD creation, update:
   - AAFD Stage: `PRD`
   - Move to "PRD" column

### Phase 2: PRD Chunking

**When breaking down PRDs:**

1. Create 2-4 Chunk issues linked to Epic
2. Set fields for each chunk:
   - Feature Type: `Story`
   - AAFD Stage: `Chunking`
   - Inherit Priority from Epic
   - Document Cross-cutting Dependencies
3. Move Epic to "Chunks" column
4. Keep chunks in "Chunks" column during analysis

### Phase 3: Stakeholder Validation

**During validation:**

1. Update AAFD Stage: `Validation`
2. Add validation notes to issue comments
3. Adjust Priority based on feedback
4. Document any scope changes

### Phase 4: User Story Creation

**When creating user stories:**

1. Convert or create new issues from chunks
2. Set fields:
   - Feature Type: `Story`
   - AAFD Stage: `Stories`
   - Add Story Points estimate
   - Set Primary Technical Domain
3. Move to "Stories" column
4. Link to parent chunk/epic

### Phase 5: Sprint Planning

**When planning sprints:**

1. Select stories within capacity
2. Set fields:
   - AAFD Stage: `Sprint Planning`
   - Sprint: Select current sprint (e.g., `Sprint 1`)
   - Agent Assignment: Assign virtual agent
   - Implementation Phase: `Analysis`
3. Move to "Ready" column

### Phase 6: Sprint Execution

**During implementation:**

1. Move story to Sprint Board "In Progress"
2. Update fields:
   - AAFD Stage: `Implementation`
   - AI Context Status: Update based on session
   - Implementation Phase: Progress through phases
3. Create PRs linked to story
4. Move to "Review" when PR ready

### Phase 7: Review & Retrospective

**During review:**

1. Update AAFD Stage: `Review`
2. Complete code review via PR
3. Run quality checks
4. Move to "Done" when merged
5. Add retrospective notes to epic

## Automation Rules

### Context Staleness

- Trigger: Story inactive > 7 days
- Action: Set AI Context Status to `Stale`

### PR-Based Movement

- Trigger: PR opened → Move to "In Progress"
- Trigger: PR ready for review → Move to "Review"
- Trigger: PR merged → Move to "Done"

### Stage Transitions

- Trigger: AAFD Stage change
- Action: Move to appropriate column

## Working with the CLI

### Common Commands

```bash
# List all items in project
gh project item-list 1 --owner MLorneSmith --limit 100

# View specific issue
gh issue view [number] --repo MLorneSmith/2025slideheroes

# Create new issue and add to project
gh issue create --repo MLorneSmith/2025slideheroes --project 1

# Update custom fields
gh project item-edit --id [ITEM_ID] --field-id [FIELD_ID] --project-id 1
```

### Field Updates via CLI

```bash
# Update AAFD Stage
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwHOAT_OfM4A7J1O"
    itemId: "[ITEM_ID]"
    fieldId: "[AAFD_STAGE_FIELD_ID]"
    value: { singleSelectOptionId: "[OPTION_ID]" }
  }) {
    projectV2Item { id }
  }
}'
```

## Sprint and Milestone Strategy

### Using Both Fields Effectively

**Milestone** (Strategic Level):

- Set on Epics when creating features
- Represents major releases or feature bundles
- Helps with long-term planning and communication
- Example: "v2.0 - AI Features" containing multiple AI-related epics

**Sprint** (Tactical Level):

- Set on Stories and Tasks during sprint planning
- Represents 1-2 week development iterations
- Helps with day-to-day execution tracking
- Example: "Sprint 3" containing 3-5 stories from different epics

### Example Hierarchy

```
Milestone: v2.0 Release (Q1 2025)
├── Epic: AI Presentation Generator → Milestone: v2.0 Release
│   ├── Story: Generate outline from topic → Sprint: Sprint 3
│   ├── Story: AI content suggestions → Sprint: Sprint 3
│   └── Story: Export AI templates → Sprint: Sprint 4
└── Epic: Advanced Analytics → Milestone: v2.0 Release
    ├── Story: Usage dashboard → Sprint: Sprint 4
    └── Story: Export analytics → Sprint: Sprint 5
```

## Best Practices

### 1. Maintain Traceability

- Always link stories to chunks
- Link chunks to epics
- Reference related issues in Cross-cutting Dependencies

### 2. Keep Context Fresh

- Update AI Context Status after each session
- Document context requirements in issues
- Use `.claude/build/3-output` for detailed context

### 3. Use Consistent Naming

- Epics: `[EPIC] {Feature Name}`
- Chunks: `[CHUNK-{#}] {Epic Name} - {Chunk Focus}`
- Stories: `[STORY] As a {user}, I want {feature}`

### 4. Regular Updates

- Update Implementation Phase as you progress
- Move items through columns promptly
- Add progress notes to issues

### 5. Sprint Discipline

- Only pull stories into sprint that have:
  - Complete acceptance criteria
  - Story point estimates
  - Identified dependencies
  - Clear technical approach

## Local Output Sync

The `.claude/build/4-output` directory should mirror project structure:

```
4-output/
├── contexts/
│   ├── discovery/
│   │   └── {feature-slug}/
│   │       ├── business-context.md
│   │       ├── user-research.md
│   │       ├── competitive-analysis.md
│   │       ├── market-trends.md
│   │       └── discovery-summary.md
│   ├── epics/
│   ├── chunks/
│   └── stories/
└── {epic-name}/
    ├── 1-prd/
    ├── 2-chunks/
    ├── 3-validation/
    ├── 4-stories/
    ├── 5-sprints/
    └── 6-retrospective/
```

When updating project items, also update corresponding local files to maintain consistency.

## Troubleshooting

### Issue: Can't find custom field IDs

Solution: Use `gh project field-list 1 --owner MLorneSmith` to get field IDs

### Issue: Automation not working

Solution: Check GitHub Actions permissions and workflow files

### Issue: Context becoming stale

Solution: Set up weekly context refresh sessions

### Issue: Too many items in project

Solution: Archive completed epics older than 3 months

## Quick Reference Card

| AAFD Phase   | GitHub Action   | Key Fields to Update                    |
| ------------ | --------------- | --------------------------------------- |
| New Idea     | Create Epic     | Feature Type, Priority, **Milestone**   |
| PRD Complete | Update Epic     | AAFD Stage → PRD                        |
| Chunking     | Create Chunks   | Link to Epic, Dependencies              |
| Validation   | Add Comments    | Priority adjustments                    |
| Stories      | Create Stories  | Story Points, Domain                    |
| Sprint       | Assign Sprint   | **Sprint**, Agent, Implementation Phase |
| Active Dev   | Update Progress | Context Status, Phase                   |
| Complete     | Close Issue     | Move to Done                            |

## Integration with Claude Sessions

When starting a new Claude session:

1. Check issue's AI Context Status
2. If Stale, refresh context from issue description
3. Load relevant files from `.claude/build/4-output`
4. Update AI Context Status to `Loaded`
5. After session, update to `Fresh` with timestamp

This ensures efficient context management across AI-assisted development sessions.
