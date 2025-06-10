# AAFD v2.0 Methodology Implementation Plan

## Executive Summary

This implementation plan outlines the step-by-step process to implement the AI-Assisted Feature Development (AAFD) v2.0 methodology for the SlideHeroes project. The plan covers directory structure setup, GitHub Projects configuration, prompt system implementation, context management, and automated workflows.

## Implementation Overview

### Timeline: 2-3 weeks

### Effort: ~20-25 hours

### Phases: 4 distinct implementation phases

---

## Phase 1: Foundation Setup (Week 1, 6-8 hours)

### 1.1 Directory Structure Creation

**Objective**: Establish the file system foundation for methodology artifacts

**Tasks**:

```bash
# Core methodology directories under .claude/build
mkdir -p .claude/build/methodology
mkdir -p .claude/build/contexts
mkdir -p .claude/build/contexts/session-templates
mkdir -p .claude/build/contexts/stories
mkdir -p .claude/build/contexts/epics
mkdir -p .claude/build/contexts/sprints
mkdir -p .claude/build/prompt-library
mkdir -p .claude/build/roles
mkdir -p .claude/build/workflows

# Documentation and templates under .claude/build
mkdir -p .claude/build/templates/github
mkdir -p .claude/build/templates/contexts
mkdir -p .claude/build/docs/methodology
```

**Files to Create**:

- `.claude/build/methodology/README.md` - Methodology overview and usage guide
- `.claude/build/contexts/README.md` - Context management guide
- `.claude/build/prompt-library/README.md` - Prompt library index and usage
- `.claude/build/templates/README.md` - Template collection overview

### 1.2 GitHub Projects Configuration

**Objective**: Set up comprehensive project management infrastructure

#### Step 1: Create GitHub Project

1. Navigate to repository Settings > Projects
2. Create new Project (Beta) named "SlideHeroes Feature Development"
3. Set project description: "AAFD v2.0 methodology project board for feature planning and execution"

#### Step 2: Configure Custom Fields

Create the following custom fields in GitHub Projects:

```yaml
Custom Fields Configuration:
  - Feature Type:
      type: single_select
      options: ['Epic', 'Story', 'Task', 'Bug', 'Spike']

  - Priority:
      type: single_select
      options: ['Critical', 'High', 'Medium', 'Low']

  - Story Points:
      type: single_select
      options: ['1', '2', '3', '5', '8', '13', '21']

  - AI Context Status:
      type: single_select
      options: ['Fresh', 'Loaded', 'Stale', 'Needs Refresh']

  - Technical Domain:
      type: multi_select
      options: ['Frontend', 'Backend', 'Database', 'AI', 'DevOps', 'Testing']

  - Implementation Phase:
      type: single_select
      options:
        ['Analysis', 'Design', 'Implementation', 'Testing', 'Documentation']

  - Cross-cutting Dependencies:
      type: text
      description: 'List of related features/components'
```

#### Step 3: Create Project Views

**Planning Board (Kanban)**:

- Columns: Idea → PRD → Chunks → Stories → Ready → Blocked
- Filter: All open issues
- Group by: Feature Type
- Sort by: Priority

**Sprint Board (Kanban)**:

- Columns: Ready → In Progress → Review → Done
- Filter: Issues assigned to current sprint
- Group by: Technical Domain
- Sort by: Story Points

**Timeline View (Gantt)**:

- X-axis: Target completion dates
- Y-axis: Stories grouped by Epic
- Dependencies: Visualize blocking relationships

**Priority Matrix (Table)**:

- Columns: Title, Priority, Story Points, Technical Domain, Status
- Sort by: Priority (Critical → Low), then Story Points (descending)
- Filter options: Technical Domain, Implementation Phase

### 1.3 Initial Workflow Setup

**Create Workflow Documentation**:

File: `.claude/build/workflows/development-workflow.md`

```markdown
# AAFD v2.0 Development Workflow

## Phase 1: Feature Planning

1. Create Epic issue using template
2. Apply Feature Planning Prompt
3. Move to "PRD" column

## Phase 2: Technical Analysis

1. Apply Implementation Planning Prompt
2. Create chunk issues
3. Move to "Chunks" column

## Phase 3: Story Creation

1. Break chunks into user stories
2. Create story issues with context
3. Move to "Stories" column

## Phase 4: Sprint Planning

1. Estimate story points
2. Select stories for sprint
3. Move to "Ready" column

## Phase 5: Implementation

1. Load context using session prompts
2. Implement with Claude Code
3. Move through In Progress → Review → Done
```

---

## Phase 2: Prompt System Implementation (Week 1-2, 8-10 hours)

### 2.1 Core Prompt Library Creation

**Objective**: Implement the XML-based prompt system for consistent AI interactions

#### Create Feature Planning Prompt

File: `.claude/build/prompt-library/feature-planning.xml`

```xml
<prompt>
  <task>Convert feature idea into implementable PRD for SlideHeroes with Claude Code</task>

  <context>
    <project_info>
      <name>SlideHeroes</name>
      <type>SaaS Platform for AI-Powered Presentation Creation</type>
      <stack>Next.js 15, TypeScript, Supabase, Payload CMS, Portkey AI Gateway</stack>
      <architecture>Turborepo monorepo with web app, Payload CMS, and shared packages</architecture>
    </project_info>
    <technical_constraints>
      <security>Always use RLS, never expose API keys, use server actions for AI/external APIs</security>
      <validation>Use Zod schemas everywhere for input validation</validation>
      <components>Prefer Server Components, use enhanceAction for server actions</components>
      <patterns>Follow existing patterns in /apps/web/ and /packages/</patterns>
    </technical_constraints>
  </context>

  <!-- Full prompt content from methodology document -->
</prompt>
```

#### Create Implementation Planning Prompt

File: `.claude/build/prompt-library/implementation-planning.xml`

#### Create Session Loading Prompt

File: `.claude/build/prompt-library/session-loading.xml`

### 2.2 Context Management Templates

**Objective**: Create standardized context preservation system

#### Story Context Template

File: `.claude/build/templates/contexts/story-context-template.md`

```markdown
# Story Context: {{STORY_TITLE}}

## Story Overview

**ID**: {{STORY_ID}}
**Epic**: {{PARENT_EPIC}}
**Status**: {{CURRENT_STATUS}}
**Sprint**: {{SPRINT_ASSIGNMENT}}

## Story Description

**As a** {{USER_TYPE}}
**I want** {{FUNCTIONALITY}}
**So that** {{BENEFIT}}

## Acceptance Criteria

{{ACCEPTANCE_CRITERIA_LIST}}

## Technical Requirements

### Frontend Requirements

{{FRONTEND_REQUIREMENTS}}

### Backend Requirements

{{BACKEND_REQUIREMENTS}}

### Database Requirements

{{DATABASE_REQUIREMENTS}}

## Implementation Context

### Files to Understand

{{CONTEXT_FILES}}

### Similar Implementations

{{REFERENCE_IMPLEMENTATIONS}}

### Claude Code Session Requirements

- **Primary Role**: {{PRIMARY_ROLE}}
- **Context Files**: {{CONTEXT_FILE_LIST}}
- **Documentation**: {{RELEVANT_DOCS}}
```

#### Session Template for AI Engineer

File: `.claude/build/contexts/session-templates/ai-engineer.md`

```markdown
# AI Engineer Session Template

## Pre-Session Context Loading

1. Load AI Engineer role: `/read .claude/build/roles/ai-engineer.md`
2. Review project standards: `/read CLAUDE.md`
3. Load story context: `/read .claude/build/contexts/stories/story-{{ID}}/context.md`
4. Review AI integration patterns: `/read apps/web/app/home/(user)/ai/`

## AI Integration Standards

- Use Portkey AI Gateway for all AI requests
- Implement proper error handling for AI service failures
- Track AI usage for billing purposes
- Use enhanceAction for all server actions
- Validate prompts and responses with Zod schemas

## Common AI Patterns in Codebase

- Outline generation: `apps/web/app/home/(user)/ai/canvas/_actions/`
- Content suggestions: `packages/ai-gateway/src/`
- Usage tracking: `packages/supabase/src/schema/ai-usage.schema.ts`

## Session Checklist

- [ ] Context fully loaded
- [ ] Story requirements understood
- [ ] Implementation approach planned
- [ ] Test strategy defined
- [ ] Progress tracking ready
```

### 2.3 Role-Specific Templates

Create role templates for different types of development work:

**Files to Create**:

- `.claude/build/contexts/session-templates/ui-engineer.md`
- `.claude/build/contexts/session-templates/data-engineer.md`
- `.claude/build/contexts/session-templates/architecture-engineer.md`

---

## Phase 3: GitHub Integration & Automation (Week 2, 4-6 hours)

### 3.1 Issue Templates

**Objective**: Standardize issue creation with methodology-aligned templates

#### Epic Template

File: `.github/ISSUE_TEMPLATE/feature-epic.yml`

```yaml
name: Feature Epic
description: Large feature requiring multiple stories and sprints
title: '[EPIC] '
labels: ['epic', 'needs-refinement']

body:
  - type: input
    id: epic-title
    attributes:
      label: Epic Title
      description: Brief, descriptive title for the feature
      placeholder: 'AI-Powered Presentation Outline Generator'
    validations:
      required: true

  - type: textarea
    id: business-context
    attributes:
      label: Business Context
      description: Problem statement and business value
      placeholder: |
        **Problem**: What problem does this feature solve?
        **User Impact**: How will this benefit users?
        **Business Value**: What is the expected business impact?
    validations:
      required: true

  - type: textarea
    id: user-stories
    attributes:
      label: High-Level User Stories
      description: User stories that will be broken down into implementable stories
      placeholder: |
        - As a SlideHeroes user, I want to generate presentation outlines using AI so that I can quickly structure my content
        - As a user, I want to customize generated outlines so that they match my specific presentation needs
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Epic-Level Acceptance Criteria
      description: High-level criteria that define epic completion
      placeholder: |
        - [ ] Users can generate AI-powered presentation outlines
        - [ ] Generated outlines integrate with existing canvas system
        - [ ] Outline generation completes within acceptable time limits
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      description: Business priority for this epic
      options:
        - Critical
        - High
        - Medium
        - Low
    validations:
      required: true

  - type: checkboxes
    id: technical-domains
    attributes:
      label: Technical Domains
      description: Which areas of the system will this epic touch?
      options:
        - label: Frontend (React components, UI)
        - label: Backend (Server actions, APIs)
        - label: Database (Schema changes, queries)
        - label: AI (AI integration, prompts)
        - label: DevOps (Build, deployment)
        - label: Testing (Test implementation)
```

#### User Story Template

File: `.github/ISSUE_TEMPLATE/user-story.yml`

```yaml
name: User Story
description: Implementable user story for development
title: '[STORY] '
labels: ['story', 'ready-for-estimation']

body:
  - type: input
    id: story-title
    attributes:
      label: Story Title
      description: Clear, concise title for the story
      placeholder: 'Generate AI Presentation Outline'
    validations:
      required: true

  - type: textarea
    id: story-description
    attributes:
      label: Story Description
      description: Standard user story format
      placeholder: |
        **As a** {type of user}
        **I want** {some goal or functionality}
        **So that** {some reason or benefit}
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: Specific, testable criteria for story completion
      placeholder: |
        - [ ] User can access outline generator from canvas page
        - [ ] User can input presentation topic (required field)
        - [ ] AI generates outline with 3-7 main sections
        - [ ] Generated outline appears in canvas outline panel
    validations:
      required: true

  - type: textarea
    id: technical-tasks
    attributes:
      label: Technical Tasks
      description: Detailed tasks for implementation
      placeholder: |
        - [ ] Create OutlineGeneratorDialog component with form validation
        - [ ] Implement generateOutlineAction server action with Portkey integration
        - [ ] Add AI usage tracking to user account
        - [ ] Write unit tests for outline generation logic
    validations:
      required: true
```

### 3.2 GitHub Actions Workflows

#### Context Staleness Detection

File: `.github/workflows/context-staleness.yml`

```yaml
name: Context Staleness Detection

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  detect-stale-context:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Detect Stale Issues
        uses: actions/github-script@v7
        with:
          script: |
            const { data: issues } = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              labels: 'story',
              sort: 'updated',
              direction: 'asc'
            });

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            for (const issue of issues) {
              const lastUpdated = new Date(issue.updated_at);
              if (lastUpdated < oneWeekAgo) {
                // Add stale-context label
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['stale-context']
                });

                // Add comment with refresh checklist
                await github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  body: `🤖 This story has been inactive for over a week. Consider refreshing the context before resuming development.

Context refresh checklist:
- [ ] Review story relevance and acceptance criteria
- [ ] Update technical approach if needed
- [ ] Refresh file paths and dependencies
- [ ] Update progress notes with current status
- [ ] Verify development environment is ready

Use the context refresh protocol in .claude/build/docs/methodology/context-management.md`
                });
              }
            }
```

#### Project Board Automation

File: `.github/workflows/project-automation.yml`

```yaml
name: Project Board Automation

on:
  issues:
    types: [opened, closed, reopened]
  pull_request:
    types: [opened, closed, merged, ready_for_review]

jobs:
  update-project-board:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-assign to project
        uses: actions/add-to-project@v0.4.0
        with:
          project-url: https://github.com/users/USERNAME/projects/PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set initial status
        uses: actions/github-script@v7
        if: github.event.action == 'opened' && github.event.issue
        with:
          script: |
            // Auto-set initial status based on issue labels
            const issue = context.payload.issue;
            const labels = issue.labels.map(label => label.name);

            let status = 'Idea';
            if (labels.includes('epic')) status = 'Idea';
            if (labels.includes('story')) status = 'Stories';

            // Update project item status
            // Note: This requires additional setup with GitHub Projects API
```

---

## Phase 4: Testing & Validation (Week 2-3, 6-8 hours)

### 4.1 Sample Feature Implementation

**Objective**: Validate methodology with a real feature implementation

#### Choose Test Feature: "AI Slide Title Suggestions"

**Why This Feature**:

- Small enough to complete in 1-2 sprints
- Touches AI integration (testing AI Engineer role)
- Requires frontend and backend changes
- Has clear user value
- Allows testing full methodology workflow

#### Implementation Steps

**Step 1: Epic Creation (30 minutes)**

1. Create Epic issue using new template
2. Apply Feature Planning Prompt
3. Document PRD in issue
4. Move to "PRD" column in GitHub Projects

**Step 2: Story Breakdown (1 hour)**

1. Apply Implementation Planning Prompt
2. Create 2-3 user stories:
   - Generate AI slide title suggestions
   - Apply suggestions to slide
   - Track AI usage for billing
3. Set up story context files
4. Move to "Stories" column

**Step 3: Sprint Planning (30 minutes)**

1. Estimate story points
2. Create sprint milestone
3. Assign stories to sprint
4. Move to "Ready" column

**Step 4: Implementation (4-6 hours)**

1. Load context using AI Engineer session template
2. Implement first story with Claude Code
3. Document progress in context files
4. Test and validate implementation
5. Move through project board columns

**Step 5: Retrospective (30 minutes)**

1. Complete feature retrospective template
2. Identify methodology improvements
3. Update templates and processes
4. Document lessons learned

### 4.2 Methodology Validation

**Validation Criteria**:

#### Process Effectiveness

- [ ] Epic creation takes < 30 minutes with template
- [ ] Story breakdown is comprehensive and actionable
- [ ] Context loading enables productive Claude Code sessions
- [ ] Progress tracking maintains development continuity
- [ ] GitHub Projects automation reduces manual overhead

#### Quality Outcomes

- [ ] Implemented feature meets all acceptance criteria
- [ ] Code follows project standards in CLAUDE.md
- [ ] Tests are comprehensive and passing
- [ ] Documentation is complete and accurate
- [ ] No technical debt introduced

#### Developer Experience

- [ ] Context loading is efficient and comprehensive
- [ ] Prompts produce consistent, high-quality outputs
- [ ] Project board provides clear development status
- [ ] Ceremony overhead is minimal but valuable
- [ ] AI collaboration is productive and focused

### 4.3 Refinement Based on Testing

**Post-Implementation Improvements**:

1. **Prompt Refinement**

   - Update prompts based on actual usage
   - Add project-specific examples
   - Improve context loading efficiency

2. **Template Updates**

   - Refine issue templates based on user experience
   - Update context templates with lessons learned
   - Improve automation rules

3. **Process Optimization**
   - Streamline ceremony structure
   - Improve context management workflows
   - Optimize GitHub Projects configuration

---

## Implementation Schedule

### Week 1: Foundation & Setup

- **Days 1-2**: Directory structure and GitHub Projects setup
- **Days 3-4**: Create core prompt templates
- **Day 5**: Initial workflow documentation

### Week 2: Integration & Automation

- **Days 1-2**: GitHub issue templates and automation
- **Days 3-4**: Context management system
- **Day 5**: Begin sample feature implementation

### Week 3: Testing & Refinement

- **Days 1-3**: Complete sample feature implementation
- **Days 4-5**: Validation, retrospective, and methodology refinement

---

## Success Metrics

### Immediate (End of Implementation)

- [ ] All methodology artifacts created and functional
- [ ] GitHub Projects configured with automation
- [ ] Sample feature successfully implemented using methodology
- [ ] Context management system working effectively

### Short-term (1 month post-implementation)

- [ ] Methodology used for all feature development
- [ ] Context loading time reduced to < 5 minutes
- [ ] Story estimates within 25% of actual effort
- [ ] Developer satisfaction with process high

### Long-term (3 months post-implementation)

- [ ] Consistent feature delivery velocity
- [ ] Improved code quality metrics
- [ ] Reduced technical debt accumulation
- [ ] Enhanced AI collaboration productivity

---

## Risk Mitigation

### Process Complexity Risk

**Risk**: Methodology becomes too complex for solo developer
**Mitigation**: Start with core features, add complexity gradually

### Adoption Resistance Risk

**Risk**: Developer abandons methodology due to overhead
**Mitigation**: Focus on value-add activities, automate routine tasks

### Context Management Risk

**Risk**: Context becomes stale or overwhelming
**Mitigation**: Automated staleness detection, clear refresh protocols

### Tool Integration Risk

**Risk**: GitHub Projects limitations affect methodology effectiveness
**Mitigation**: Fallback manual processes, regular tool evaluation

---

## Next Steps

1. **Begin Phase 1**: Create directory structure and GitHub Projects
2. **Set up automation**: Configure workflows and project automation
3. **Implement sample feature**: Validate methodology with real development
4. **Iterate and improve**: Refine based on practical experience
5. **Document lessons learned**: Update methodology design document

---

## Conclusion

This implementation plan provides a structured approach to deploying the AAFD v2.0 methodology for SlideHeroes development. The phased approach allows for gradual adoption while validating effectiveness through practical implementation.

The methodology will evolve based on real-world usage, with regular refinements to improve developer experience and feature delivery outcomes.
