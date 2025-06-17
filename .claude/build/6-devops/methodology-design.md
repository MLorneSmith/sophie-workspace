# AI-Assisted Feature Development (AAFD) v2.0 Methodology

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Principles](#core-principles)
3. [GitHub Projects Integration Strategy](#github-projects-integration-strategy)
4. [Structured Prompt System Design](#structured-prompt-system-design)
5. [Workflow Phases](#workflow-phases)
6. [Context Management Protocols](#context-management-protocols)
7. [Ceremonies & Rituals](#ceremonies--rituals)
8. [Implementation Templates](#implementation-templates)
9. [Getting Started Guide](#getting-started-guide)
10. [Appendices](#appendices)

---

## Executive Summary

### Overview

The AI-Assisted Feature Development (AAFD) v2.0 methodology is a hybrid development approach specifically designed for solo developers working with Claude Code. It combines the structured planning of traditional methodologies (Scrum, Waterfall, Kanban) with AI-native development practices, leveraging GitHub Projects for rigorous planning and progress tracking.

### Target Audience

- Solo developers building SaaS applications
- Teams of 1-3 developers using AI coding assistants
- Projects requiring structured planning with flexible execution
- Developers seeking to maximize AI collaboration effectiveness

### Key Differentiators

1. **AI-Native Design**: Every process optimized for AI collaboration
2. **Context Preservation**: Systematic approach to maintaining AI context across sessions
3. **GitHub Projects Integration**: Leverages native GitHub tooling for project management
4. **Structured Prompts**: XML-based prompt system ensuring consistent AI interactions
5. **Solo-Optimized**: Minimal overhead while maintaining development rigor

### Methodology Comparison

| Aspect             | Traditional Scrum | Waterfall | Kanban | AAFD v2.0 |
| ------------------ | ----------------- | --------- | ------ | --------- |
| Planning Rigor     | Medium            | High      | Low    | High      |
| Flexibility        | Medium            | Low       | High   | High      |
| AI Integration     | None              | None      | None   | Native    |
| Solo Developer Fit | Poor              | Poor      | Good   | Excellent |
| Context Management | Manual            | Manual    | Manual | Automated |
| Ceremony Overhead  | High              | Medium    | Low    | Low       |

---

## Core Principles

### 1. Conversation-Driven Development

- Features evolve through structured dialog with AI
- Every development decision is explicitly discussed and documented
- AI serves as both implementation partner and technical reviewer

### 2. Incremental Progress with Continuous Validation

- Small, testable changes with frequent validation
- Every commit moves toward a working feature
- Regular checkpoints prevent technical debt accumulation

### 3. Context Preservation as First-Class Citizen

- AI context is systematically maintained across sessions
- Development state is always recoverable
- Historical decisions are preserved and accessible

### 4. Rigorous Planning, Flexible Execution

- Comprehensive upfront planning using structured prompts
- Flexible implementation that adapts to discoveries
- Regular retrospectives to improve process

### 5. GitHub-Native Project Management

- Leverages GitHub Projects for all planning and tracking
- Issues, PRs, and commits are the source of truth
- Automation reduces manual overhead

---

## GitHub Projects Integration Strategy

### Project Board Structure

#### Primary Views

**1. Planning Board (Kanban)**

```
Columns: Idea → PRD → Chunks → Stories → Ready → Blocked
Purpose: Track feature progression from concept to implementation-ready
Automation: Auto-move based on issue labels and PR status
```

**2. Sprint Board (Kanban)**

```
Columns: Ready → In Progress → Review → Done
Purpose: Track active development work
Automation: Auto-move based on PR status and reviews
```

**3. Timeline View (Gantt)**

```
Purpose: Visualize dependencies and delivery timelines
Use Case: Planning feature releases and identifying bottlenecks
```

**4. Priority Matrix (Table)**

```
Axes: Impact (High/Medium/Low) vs Effort (1,2,3,5,8,13 points)
Purpose: Prioritization decisions and capacity planning
```

### Custom Fields Configuration

```yaml
# GitHub Projects Custom Fields
fields:
  - name: 'Feature Type'
    type: 'single_select'
    options: ['Epic', 'Story', 'Task', 'Bug', 'Spike']

  - name: 'Priority'
    type: 'single_select'
    options: ['Critical', 'High', 'Medium', 'Low']

  - name: 'Story Points'
    type: 'single_select'
    options: ['1', '2', '3', '5', '8', '13', '21']

  - name: 'AI Context Status'
    type: 'single_select'
    options: ['Fresh', 'Loaded', 'Stale', 'Needs Refresh']

  - name: 'Technical Domain'
    type: 'multi_select'
    options: ['Frontend', 'Backend', 'Database', 'AI', 'DevOps', 'Testing']

  - name: 'Cross-cutting Dependencies'
    type: 'text'
    description: 'List of related features/components'

  - name: 'Implementation Phase'
    type: 'single_select'
    options:
      ['Analysis', 'Design', 'Implementation', 'Testing', 'Documentation']
```

### Automation Rules

```yaml
# GitHub Projects Automation
automations:
  - name: 'Auto-assign domain labels'
    trigger: 'Issue created'
    condition: 'File paths in description contain pattern'
    action: 'Set Technical Domain field'

  - name: 'Move to In Progress'
    trigger: 'PR opened'
    condition: 'PR references issue'
    action: 'Move issue to In Progress column'

  - name: 'Move to Review'
    trigger: 'PR ready for review'
    condition: 'PR not in draft'
    action: 'Move issue to Review column'

  - name: 'Move to Done'
    trigger: 'PR merged'
    condition: 'All linked issues resolved'
    action: 'Move issue to Done column'

  - name: 'Context staleness alert'
    trigger: 'Weekly schedule'
    condition: 'Issue inactive > 7 days'
    action: 'Set AI Context Status to Stale'
```

---

## Structured Prompt System Design

### XML Framework Foundation

Following the Parker Rex pattern, all prompts use structured XML for consistency and tool integration:

```xml
<prompt>
  <task>Brief description of what the prompt accomplishes</task>

  <context>
    <project_info>{PROJECT_CONTEXT}</project_info>
    <codebase_patterns>{EXISTING_PATTERNS}</codebase_patterns>
    <technical_constraints>{CONSTRAINTS}</technical_constraints>
  </context>

  <instructions>
    <step number="1">
      <title>Step Title</title>
      <description>Detailed description of the step</description>
    </step>
    <!-- Additional steps -->
  </instructions>

  <input>
    <!-- Input parameters -->
  </input>

  <output_format>
    <!-- Structured output specification -->
  </output_format>

  <example>
    <!-- Example input and output -->
  </example>
</prompt>
```

### Core Prompt Library

#### 1. Feature Planning Prompt

```xml
<prompt>
  <task>Convert feature idea into implementable PRD for solo developer with Claude Code</task>

  <context>
    <project_info>
      <name>SlideHeroes</name>
      <type>SaaS Platform for Presentation Creation</type>
      <stack>Next.js 15, TypeScript, Supabase, Payload CMS</stack>
      <architecture>Turborepo monorepo with web app and CMS</architecture>
    </project_info>
    <codebase_patterns>{EXISTING_PATTERNS}</codebase_patterns>
    <technical_constraints>
      <security>Always use RLS, never expose API keys</security>
      <validation>Use Zod schemas everywhere</validation>
      <components>Prefer Server Components, use enhanceAction for server actions</components>
    </technical_constraints>
  </context>

  <instructions>
    <step number="1">
      <title>Analyze Feature Scope</title>
      <description>Identify core objectives, target users, and desired outcomes. Consider impact on existing features and technical dependencies.</description>
    </step>

    <step number="2">
      <title>Define Technical Requirements</title>
      <description>Specify required libraries, APIs, database changes, and file modifications. Reference existing codebase patterns.</description>
    </step>

    <step number="3">
      <title>Create Acceptance Criteria</title>
      <description>Define testable criteria that determine feature completion. Include user experience and technical requirements.</description>
    </step>

    <step number="4">
      <title>Identify Cross-cutting Concerns</title>
      <description>List shared components, utilities, or patterns that may need updates. Consider authentication, routing, and data models.</description>
    </step>
  </instructions>

  <input>
    <feature_idea>{FEATURE_DESCRIPTION}</feature_idea>
    <user_stories>{USER_NEEDS}</user_stories>
    <business_context>{BUSINESS_REQUIREMENTS}</business_context>
  </input>

  <output_format>
    <prd>
      <title>{FEATURE_NAME}</title>
      <executive_summary>{BRIEF_DESCRIPTION}</executive_summary>

      <objectives>
        <objective priority="high">{PRIMARY_OBJECTIVE}</objective>
        <objective priority="medium">{SECONDARY_OBJECTIVE}</objective>
      </objectives>

      <user_stories>
        <story>As a {USER_TYPE}, I want {FUNCTIONALITY} so that {BENEFIT}</story>
      </user_stories>

      <acceptance_criteria>
        <criterion testable="true">{TESTABLE_REQUIREMENT}</criterion>
      </acceptance_criteria>

      <technical_requirements>
        <libraries>{REQUIRED_LIBRARIES}</libraries>
        <database_changes>{SCHEMA_MODIFICATIONS}</database_changes>
        <api_endpoints>{NEW_ENDPOINTS}</api_endpoints>
        <file_changes>
          <read_only>{FILES_TO_REFERENCE}</read_only>
          <writeable>{FILES_TO_MODIFY}</writeable>
        </file_changes>
      </technical_requirements>

      <cross_cutting_concerns>
        <concern>{SHARED_COMPONENT_IMPACT}</concern>
      </cross_cutting_concerns>

      <success_metrics>
        <metric type="technical">{PERFORMANCE_METRIC}</metric>
        <metric type="user">{USER_EXPERIENCE_METRIC}</metric>
      </success_metrics>
    </prd>
  </output_format>
</prompt>
```

#### 2. Implementation Planning Prompt

```xml
<prompt>
  <task>Break feature PRD into implementable stories with dependency analysis and Claude Code context requirements</task>

  <context>
    <methodology>AAFD v2.0 - Solo developer with AI assistant</methodology>
    <session_management>Context preservation across multiple development sessions</session_management>
  </context>

  <instructions>
    <step number="1">
      <title>Analyze PRD Structure</title>
      <description>Identify logical implementation units and cross-cutting functionality. Reference existing codebase patterns for similar features.</description>
    </step>

    <step number="2">
      <title>Create User Stories</title>
      <description>Break PRD into 2-4 implementable user stories. Each story should be completable in 1-3 development sessions.</description>
    </step>

    <step number="3">
      <title>Define Technical Tasks</title>
      <description>For each story, create 3-7 atomic technical tasks. Include specific file paths, functions, and test requirements.</description>
    </step>

    <step number="4">
      <title>Estimate Effort</title>
      <description>Assign story points (1,2,3,5,8,13) based on complexity, unknowns, and dependencies.</description>
    </step>

    <step number="5">
      <title>Plan Context Requirements</title>
      <description>Identify files, documentation, and context needed for Claude Code to implement each story effectively.</description>
    </step>
  </instructions>

  <input>
    <prd_content>{PRD_XML}</prd_content>
    <current_codebase>{RELEVANT_FILES}</current_codebase>
    <similar_features>{EXISTING_PATTERNS}</similar_features>
  </input>

  <output_format>
    <implementation_plan>
      <epic_summary>
        <title>{EPIC_TITLE}</title>
        <total_points>{ESTIMATED_POINTS}</total_points>
        <estimated_sessions>{SESSION_COUNT}</estimated_sessions>
      </epic_summary>

      <stories>
        <story id="story_1">
          <title>{STORY_TITLE}</title>
          <description>As a {USER}, I want {GOAL} so that {BENEFIT}</description>
          <acceptance_criteria>
            <criterion>{TESTABLE_CRITERION}</criterion>
          </acceptance_criteria>
          <technical_tasks>
            <task>
              <description>{TASK_DESCRIPTION}</description>
              <files_to_modify>{FILE_PATHS}</files_to_modify>
              <estimated_time>{HOURS}</estimated_time>
            </task>
          </technical_tasks>
          <story_points>{POINTS}</story_points>
          <dependencies>{BLOCKING_STORIES}</dependencies>
          <context_requirements>
            <files_to_read>{CONTEXT_FILES}</files_to_read>
            <role_to_load>{CLAUDE_ROLE}</role_to_load>
            <documentation>{RELEVANT_DOCS}</documentation>
          </context_requirements>
        </story>
      </stories>

      <cross_cutting_concerns>
        <concern>
          <description>{SHARED_COMPONENT}</description>
          <affected_stories>{STORY_IDS}</affected_stories>
          <implementation_notes>{COORDINATION_NOTES}</implementation_notes>
        </concern>
      </cross_cutting_concerns>

      <implementation_order>
        <phase number="1">
          <stories>{STORY_IDS}</stories>
          <rationale>{WHY_THIS_ORDER}</rationale>
        </phase>
      </implementation_order>
    </implementation_plan>
  </output_format>
</prompt>
```

#### 3. Implementation Session Prompt

```xml
<prompt>
  <task>Execute story implementation with full context loading and quality standards</task>

  <pre_conditions>
    <context_loading>
      <load_role>{RELEVANT_CLAUDE_ROLE}</load_role>
      <read_files>{CONTEXT_FILES}</read_files>
      <review_standards>Read CLAUDE.md for project standards</review_standards>
      <load_story_context>Read story context from .claude/contexts/story-{id}/</load_story_context>
    </context_loading>
  </pre_conditions>

  <instructions>
    <step number="1">
      <title>Load Context and Standards</title>
      <description>Load relevant Claude role, read project standards from CLAUDE.md, and review story context files.</description>
    </step>

    <step number="2">
      <title>Understand Existing Patterns</title>
      <description>Review similar implementations in codebase. Identify patterns for components, server actions, database operations, and testing.</description>
    </step>

    <step number="3">
      <title>Implement with Tests</title>
      <description>Implement feature following project standards. Write tests using existing test patterns. Use enhanceAction for server actions.</description>
    </step>

    <step number="4">
      <title>Validate Against Acceptance Criteria</title>
      <description>Test implementation against story acceptance criteria. Ensure all functionality works as specified.</description>
    </step>

    <step number="5">
      <title>Update Documentation</title>
      <description>Update relevant documentation, add code comments, and document any architectural decisions.</description>
    </step>

    <step number="6">
      <title>Prepare for Review</title>
      <description>Run linting, type checking, and tests. Create PR with clear description and context.</description>
    </step>
  </instructions>

  <input>
    <story_context>{STORY_DETAILS}</story_context>
    <acceptance_criteria>{CRITERIA_LIST}</acceptance_criteria>
    <technical_tasks>{TASK_LIST}</technical_tasks>
    <context_files>{FILES_TO_LOAD}</context_files>
  </input>

  <implementation_standards>
    <code_quality>
      <no_any_types>Use proper TypeScript typing</no_any_types>
      <use_zod>Validate all inputs with Zod schemas</use_zod>
      <server_components>Prefer Server Components over Client Components</server_components>
      <rls_security>Always use Row Level Security, never bypass</rls_security>
    </code_quality>

    <patterns>
      <server_actions>Wrap all server actions with enhanceAction</server_actions>
      <error_handling>Implement user-friendly error messages</error_handling>
      <file_structure>Follow existing file naming and organization patterns</file_structure>
    </patterns>
  </implementation_standards>

  <output_requirements>
    <working_feature>All acceptance criteria met</working_feature>
    <tests_passing>Unit and integration tests pass</tests_passing>
    <linting_clean>No linting or type errors</linting_clean>
    <documentation_updated>Relevant docs and comments added</documentation_updated>
    <pr_ready>Pull request with clear description</pr_ready>
  </output_requirements>
</prompt>
```

---

## Workflow Phases

### Phase 1: Ideation & PRD Creation

**Objective**: Transform feature ideas into structured Product Requirements Documents (PRDs)

**Inputs**:

- Feature idea or user request
- Business context and requirements
- Existing codebase patterns

**Process**:

1. **Create GitHub Issue** using Feature Epic template
2. **Apply Feature Planning Prompt** to convert idea to structured PRD
3. **Technical Feasibility Review** with reference to existing codebase
4. **Stakeholder Validation** (for team environments)
5. **PRD Documentation** in GitHub issue description

**Outputs**:

- GitHub Epic issue with formal PRD
- Technical requirements specification
- Acceptance criteria definition
- Cross-cutting concerns identification

**GitHub Projects Integration**:

- Issue created in "Idea" column
- Auto-assigned "Epic" feature type
- Priority set based on business impact
- Technical domain tags applied

**Example PRD Structure**:

```markdown
# Epic: AI-Powered Presentation Outline Generator

## Executive Summary

Enable users to generate presentation outlines using AI, integrated with the existing canvas system.

## User Stories

- As a SlideHeroes user, I want to generate a presentation outline from a brief description so that I can quickly start building my presentation
- As a user, I want to customize the generated outline so that it matches my specific needs

## Acceptance Criteria

- [ ] User can input presentation topic and key points
- [ ] AI generates structured outline with sections and subsections
- [ ] Generated outline integrates with existing canvas system
- [ ] User can edit and refine generated outline
- [ ] Outline generation completes within 10 seconds

## Technical Requirements

- **AI Integration**: Use Portkey AI Gateway for outline generation
- **Database**: Extend outline schema to include AI metadata
- **Frontend**: Create outline generation dialog component
- **Backend**: New server action for AI outline generation

## Files to Modify

- `apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.action.ts`
- `apps/web/app/home/(user)/ai/canvas/_components/OutlineGenerator.tsx`
- `packages/supabase/src/schema/outline.schema.ts`

## Cross-cutting Concerns

- AI usage tracking and billing
- Error handling for AI service failures
- Rate limiting for AI requests
```

### Phase 2: Technical Chunking & Analysis

**Objective**: Break PRDs into logical implementation chunks with dependency analysis

**Inputs**:

- Validated PRD from Phase 1
- Current codebase analysis
- Technical constraint documentation

**Process**:

1. **PRD Structure Analysis** using Sequential Thinking
2. **Cross-cutting Concern Identification** via codebase review
3. **Logical Chunking** into 2-4 parallel work streams
4. **Dependency Mapping** between chunks
5. **Chunk Validation** for completeness and feasibility

**Outputs**:

- 2-4 feature chunks with clear boundaries
- Cross-cutting dependency documentation
- Parallel implementation strategy
- Risk assessment for each chunk

**GitHub Projects Integration**:

- Move epic to "Chunks" column
- Create child issues for each chunk
- Link chunks to parent epic
- Document dependencies in issue descriptions

**Example Chunk Structure**:

```markdown
# Chunk 1: AI Service Integration

**Scope**: Backend AI integration with Portkey
**Dependencies**: None (foundational)
**Files**: Server actions, AI client setup
**Estimated Points**: 5

# Chunk 2: Frontend Outline Generator

**Scope**: User interface for outline generation
**Dependencies**: Chunk 1 (AI service)
**Files**: React components, form handling
**Estimated Points**: 8

# Chunk 3: Canvas Integration

**Scope**: Integration with existing canvas system
**Dependencies**: Chunks 1 & 2
**Files**: Canvas components, state management
**Estimated Points**: 3
```

### Phase 3: Story Refinement & Estimation

**Objective**: Convert chunks into implementable user stories with detailed technical tasks

**Inputs**:

- Validated chunks from Phase 2
- Codebase pattern analysis
- Similar feature implementations

**Process**:

1. **Extract Features** from each chunk
2. **Create User Stories** following "As a... I want... so that..." format
3. **Define Technical Tasks** as atomic implementation steps
4. **Estimate Story Points** using fibonacci sequence (1,2,3,5,8,13)
5. **Priority Assignment** based on dependencies and business value

**Outputs**:

- 3-8 implementable user stories
- Detailed technical task breakdowns
- Story point estimates for capacity planning
- Priority-ordered backlog

**GitHub Projects Integration**:

- Move chunks to "Stories" column
- Create user story issues linked to chunks
- Add story points and priority fields
- Set up dependency relationships

**Example User Story**:

```markdown
# Story: Generate AI Presentation Outline

## Description

As a SlideHeroes user, I want to generate a presentation outline using AI so that I can quickly create structured content for my presentation.

## Acceptance Criteria

- [ ] User can access outline generator from canvas page
- [ ] User can input presentation topic (required field)
- [ ] User can add optional key points or requirements
- [ ] AI generates outline with 3-7 main sections
- [ ] Each section includes 2-4 subsections
- [ ] Generated outline appears in canvas outline panel
- [ ] User receives feedback during generation process
- [ ] Generation completes within 10 seconds or shows progress

## Technical Tasks

- [ ] Create `OutlineGeneratorDialog` component with form validation
- [ ] Implement `generateOutlineAction` server action with Portkey integration
- [ ] Add AI usage tracking to user account
- [ ] Create outline validation schema with Zod
- [ ] Integrate generated outline with canvas state management
- [ ] Add error handling for AI service failures
- [ ] Implement loading states and progress indicators
- [ ] Write unit tests for outline generation logic

## Story Points: 5

## Priority: High

## Dependencies: None

## Context Requirements for Implementation

- **Role**: AI Engineer
- **Files to Read**:
  - `apps/web/app/home/(user)/ai/canvas/_components/OutlinePanel.tsx`
  - `packages/ai-gateway/src/outline-generator.ts`
  - Similar AI integration patterns
- **Documentation**: Portkey AI Gateway integration guide
```

### Phase 4: Sprint Planning & Execution

**Objective**: Plan and execute development sprints with capacity-based story selection

**Inputs**:

- Prioritized story backlog
- Developer capacity (points per sprint)
- Sprint duration (typically 1-2 weeks)

**Process**:

1. **Capacity Planning** based on historical velocity
2. **Story Selection** within capacity limits
3. **Implementation Order** considering dependencies
4. **Context Preparation** for AI development sessions
5. **Sprint Execution** with daily progress tracking

**Outputs**:

- Sprint backlog with selected stories
- Implementation plan with session scheduling
- Context preparation checklist
- Daily progress tracking

**GitHub Projects Integration**:

- Move selected stories to "Ready" column
- Create sprint milestone
- Link stories to sprint milestone
- Set up automated progress tracking

**Sprint Planning Example**:

```markdown
# Sprint 1: AI Outline Generation Foundation

**Duration**: 2 weeks
**Capacity**: 13 story points
**Goal**: Implement core AI outline generation functionality

## Selected Stories

1. **Generate AI Presentation Outline** (5 points) - Primary feature
2. **Handle AI Service Errors** (3 points) - Error handling
3. **Track AI Usage for Billing** (3 points) - Business requirement
4. **Outline Generation Loading States** (2 points) - UX improvement

## Implementation Schedule

- **Week 1**: Stories 1-2 (Focus on core functionality)
- **Week 2**: Stories 3-4 (Polish and business requirements)

## Context Preparation

- Load AI Engineer role
- Review existing AI integration patterns
- Set up Portkey development environment
- Prepare test data for outline generation
```

### Phase 5: Review & Retrospective

**Objective**: Validate implementation quality and improve development process

**Inputs**:

- Completed sprint deliverables
- Test results and quality metrics
- Development experience feedback

**Process**:

1. **Feature Validation** against acceptance criteria
2. **Code Quality Review** with automated tools
3. **Integration Testing** in full application context
4. **User Experience Testing** with real usage scenarios
5. **Process Retrospective** for methodology improvement

**Outputs**:

- Validated, production-ready features
- Quality assurance documentation
- Process improvement recommendations
- Updated methodology guidelines

**GitHub Projects Integration**:

- Move completed stories to "Done" column
- Close related issues and PRs
- Update project metrics and velocity
- Document lessons learned

---

## Context Management Protocols

### AI Context Preservation Strategy

**Challenge**: Claude Code sessions are stateless, requiring context to be reloaded for each development session.

**Solution**: Systematic context management using file-based storage and structured loading protocols.

### Context File Structure

```
.claude/contexts/
├── story-{id}/
│   ├── context.md          # Story details and acceptance criteria
│   ├── technical-notes.md  # Implementation decisions and patterns
│   ├── files.txt          # Relevant file paths for context loading
│   ├── progress.md        # Development progress and next steps
│   └── dependencies.md    # Cross-cutting concerns and relationships
├── feature-{id}/
│   ├── prd.md             # Product Requirements Document
│   ├── architecture.md    # Technical architecture decisions
│   └── stories.md         # Related story summaries
└── session-templates/
    ├── ai-engineer.md     # Context loading template for AI features
    ├── ui-engineer.md     # Context loading template for frontend work
    └── data-engineer.md   # Context loading template for backend work
```

### Session Start Protocol

**Objective**: Ensure Claude Code has full context for productive development sessions

**Process**:

1. **Load Relevant Role**: Read appropriate `.claude/roles/{role}.md` file
2. **Review Project Standards**: Read `CLAUDE.md` for project-specific guidelines
3. **Load Story Context**: Read story context files from `.claude/contexts/story-{id}/`
4. **Review Related Files**: Read key implementation files listed in context
5. **Check Progress**: Review previous session notes and implementation progress

**Template Session Start**:

```markdown
# Development Session Start Checklist

## Context Loading

- [ ] Load AI Engineer role: `/read .claude/roles/ai-engineer.md`
- [ ] Review project standards: `/read CLAUDE.md`
- [ ] Load story context: `/read .claude/contexts/story-123/context.md`
- [ ] Review technical notes: `/read .claude/contexts/story-123/technical-notes.md`
- [ ] Check progress: `/read .claude/contexts/story-123/progress.md`

## File Context

- [ ] Read existing patterns: `/read {pattern-files}`
- [ ] Review related components: `/read {component-files}`
- [ ] Check test examples: `/read {test-files}`

## Current Task

- **Story**: {Story Title}
- **Current Task**: {Specific Task}
- **Acceptance Criteria**: {Relevant Criteria}
- **Files to Modify**: {Target Files}

## Next Steps

1. {Specific next action}
2. {Validation steps}
3. {Testing requirements}
```

### Progress Tracking

**Objective**: Maintain development continuity across sessions

**Implementation**:

1. **Session Notes**: Document decisions and progress after each session
2. **Implementation Log**: Track completed tasks and remaining work
3. **Decision Record**: Document technical decisions and reasoning
4. **Blocker Documentation**: Record obstacles and resolution approaches

**Progress Template**:

```markdown
# Story Progress: {Story Title}

## Current Status

- **Phase**: {Implementation/Testing/Review}
- **Completion**: {X}% complete
- **Last Session**: {Date}
- **Next Session Plan**: {Planned activities}

## Completed Tasks

- [x] {Task description} - {Date completed}
- [x] {Task description} - {Date completed}

## Remaining Tasks

- [ ] {Task description} - {Estimated effort}
- [ ] {Task description} - {Dependencies}

## Technical Decisions

### {Decision Date}: {Decision Title}

**Context**: {Why decision was needed}
**Options Considered**:

1. {Option A} - Pros/Cons
2. {Option B} - Pros/Cons
   **Decision**: {Chosen approach and reasoning}

## Blockers and Challenges

### {Date}: {Blocker Title}

**Description**: {Detailed blocker description}
**Impact**: {How it affects progress}
**Resolution**: {Planned approach}
**Status**: {Open/Resolved}

## Files Modified

- `{file-path}` - {Description of changes}
- `{file-path}` - {Description of changes}

## Next Session Preparation

- **Context Files**: {Files to read}
- **Focus Area**: {Primary work area}
- **Validation Plan**: {How to test progress}
```

### Context Staleness Management

**Problem**: Context becomes stale when development pauses for extended periods

**Solution**: Automated staleness detection and refresh protocols

**Implementation**:

1. **Staleness Detection**: GitHub Actions to identify inactive stories
2. **Context Refresh**: Systematic review and update of context files
3. **Knowledge Transfer**: Documentation updates for context restoration

**Staleness Indicators**:

- Story inactive for > 7 days
- Related files modified by other work
- Dependencies changed or resolved
- Project standards updated

**Refresh Protocol**:

```markdown
# Context Refresh Checklist for Story {ID}

## Staleness Assessment

- [ ] Review story status and current relevance
- [ ] Check if acceptance criteria still valid
- [ ] Verify technical approach still appropriate
- [ ] Confirm file paths and dependencies current

## Context Updates

- [ ] Update technical notes with recent changes
- [ ] Refresh file list with current paths
- [ ] Update progress with current status
- [ ] Review and update dependencies

## Implementation Readiness

- [ ] Confirm context files accurate
- [ ] Verify development environment ready
- [ ] Check related stories for coordination needs
- [ ] Plan next development session
```

---

## Ceremonies & Rituals

### Weekly Planning (30 minutes)

**Objective**: Strategic planning and priority alignment for upcoming week

**Participants**: Solo developer (with optional stakeholder input)

**Agenda**:

1. **Velocity Review** (5 min)

   - Review completed story points from previous week
   - Calculate rolling average velocity
   - Identify factors affecting productivity

2. **Backlog Prioritization** (10 min)

   - Review and reorder story priorities
   - Consider business value and technical dependencies
   - Move high-priority stories to "Ready" status

3. **Capacity Planning** (10 min)

   - Plan story selection for upcoming week
   - Consider scheduled meetings and non-development time
   - Account for context switching overhead

4. **Context Preparation** (5 min)
   - Identify stories requiring context refresh
   - Plan session preparation activities
   - Schedule complex implementation sessions

**Tools**:

- GitHub Projects for backlog review
- Velocity tracking dashboard
- Calendar for capacity planning

**Outputs**:

- Updated story priorities
- Week sprint plan
- Context preparation checklist

### Daily Check-in with Claude (5 minutes)

**Objective**: Maintain development momentum and identify blockers

**Process**:

1. **Progress Review**

   - Update GitHub Projects with current progress
   - Review todo list with Claude
   - Document completed tasks

2. **Blocker Identification**

   - Identify technical obstacles
   - Plan research or learning activities
   - Schedule complex problem-solving sessions

3. **Session Planning**
   - Plan next implementation session
   - Identify required context loading
   - Set specific session objectives

**Daily Check-in Template**:

```markdown
# Daily Check-in: {Date}

## Yesterday's Progress

- **Completed**: {Tasks completed}
- **Blockers Hit**: {Obstacles encountered}
- **Context Notes**: {Important decisions or learnings}

## Today's Plan

- **Primary Focus**: {Main task or story}
- **Session Goal**: {Specific objective}
- **Context Needed**: {Files or documentation to review}

## Blockers and Questions

- **Technical**: {Technical challenges}
- **Process**: {Methodology questions}
- **Research**: {Learning needs}

## GitHub Updates Needed

- [ ] Update story progress
- [ ] Move cards on project board
- [ ] Update issue comments with progress
```

### Feature Retrospective (15 minutes per feature)

**Objective**: Capture learnings and improve development process

**Timing**: After each major feature completion

**Process**:

1. **Feature Review** (5 min)

   - Review original acceptance criteria vs delivered functionality
   - Assess code quality and technical debt
   - Evaluate user experience and business value

2. **Process Analysis** (5 min)

   - What worked well in the development process?
   - What caused delays or inefficiencies?
   - How effective was AI collaboration?

3. **Methodology Updates** (5 min)
   - What process improvements should be made?
   - How can AI prompts be refined?
   - What context management improvements are needed?

**Retrospective Template**:

```markdown
# Feature Retrospective: {Feature Name}

## Feature Summary

- **Original Estimate**: {Story points}
- **Actual Effort**: {Story points}
- **Development Time**: {Calendar days}
- **Quality Assessment**: {Code quality, test coverage, etc.}

## What Went Well

- **Technical**: {Successful patterns, tools, approaches}
- **Process**: {Effective ceremonies, planning activities}
- **AI Collaboration**: {Productive AI interactions}

## What Could Improve

- **Technical**: {Code quality issues, technical debt}
- **Process**: {Inefficient activities, missing steps}
- **AI Collaboration**: {Context issues, prompt problems}

## Action Items

- [ ] **Process**: {Specific process improvement}
- [ ] **Prompts**: {Prompt template updates}
- [ ] **Context**: {Context management improvements}
- [ ] **Tools**: {Tool configuration changes}

## Methodology Updates

### Prompt Improvements

- **{Prompt Name}**: {Specific improvements needed}

### Context Management

- **{Context Type}**: {Management improvements}

### GitHub Projects

- **{Field/Automation}**: {Configuration updates}
```

### Monthly Methodology Review (45 minutes)

**Objective**: Comprehensive methodology assessment and evolution

**Process**:

1. **Metrics Review** (15 min)

   - Velocity trends and productivity metrics
   - Code quality and technical debt metrics
   - Feature delivery and business value assessment

2. **Process Effectiveness** (15 min)

   - Ceremony value and time investment analysis
   - AI collaboration effectiveness review
   - Context management success rate

3. **Methodology Evolution** (15 min)
   - Update methodology documentation
   - Refine prompt templates based on experience
   - Improve GitHub Projects configuration

**Monthly Review Template**:

```markdown
# Monthly Methodology Review: {Month Year}

## Productivity Metrics

- **Average Velocity**: {Points per week}
- **Velocity Trend**: {Improving/Stable/Declining}
- **Feature Delivery**: {Features completed}
- **Technical Debt**: {Debt introduced vs resolved}

## Process Assessment

### Ceremonies

- **Weekly Planning**: {Effectiveness rating 1-5}
- **Daily Check-ins**: {Effectiveness rating 1-5}
- **Feature Retrospectives**: {Effectiveness rating 1-5}

### AI Collaboration

- **Context Loading**: {Success rate}
- **Prompt Effectiveness**: {Average satisfaction 1-5}
- **Session Productivity**: {Productive sessions %}

### GitHub Projects

- **Automation Effectiveness**: {Issues resolved automatically}
- **Context Management**: {Staleness incidents}
- **Planning Accuracy**: {Estimate vs actual variance}

## Improvement Opportunities

### High Impact

1. **{Improvement Area}**: {Specific action and expected benefit}
2. **{Improvement Area}**: {Specific action and expected benefit}

### Medium Impact

1. **{Improvement Area}**: {Specific action and expected benefit}

## Methodology Updates

### Documentation Changes

- [ ] Update methodology design document
- [ ] Revise prompt templates
- [ ] Improve context management protocols

### Tool Configuration

- [ ] GitHub Projects automation updates
- [ ] Issue template improvements
- [ ] Integration tool configuration

## Next Month Focus

- **Primary Improvement**: {Top priority improvement}
- **Experiment**: {Process experiment to try}
- **Measurement**: {Key metric to track}
```

---

## Implementation Templates

### GitHub Issue Templates

#### Feature Epic Template

```markdown
---
name: Feature Epic
about: Large feature requiring multiple stories
title: '[EPIC] '
labels: ['epic', 'needs-refinement']
assignees: ''
---

## Epic Summary

Brief description of the feature and its business value.

## Business Context

### Problem Statement

What problem does this feature solve?

### User Impact

How will this feature benefit users?

### Business Value

What is the expected business impact?

## User Stories

High-level user stories that will be broken down into implementable stories:

- As a {user type}, I want {goal} so that {benefit}
- As a {user type}, I want {goal} so that {benefit}

## Acceptance Criteria

Epic-level criteria that define completion:

- [ ] {High-level criterion}
- [ ] {High-level criterion}

## Technical Overview

### Architecture Impact

How will this feature affect the current architecture?

### Required Technologies

What new technologies or libraries are needed?

### Database Changes

What database schema changes are required?

### API Changes

What new API endpoints or changes are needed?

## Cross-cutting Concerns

### Security

What security considerations are relevant?

### Performance

What performance implications should be considered?

### Testing

What testing strategy is needed?

### Documentation

What documentation updates are required?

## Implementation Approach

### Phase 1: {Phase Name}

- {High-level implementation step}
- {High-level implementation step}

### Phase 2: {Phase Name}

- {High-level implementation step}
- {High-level implementation step}

## Success Metrics

How will we measure the success of this feature?

- **Technical**: {Performance/quality metrics}
- **User**: {User experience metrics}
- **Business**: {Business impact metrics}

## Dependencies

- [ ] {Dependency description}
- [ ] {Dependency description}

## Risks and Mitigation

### Technical Risks

- **Risk**: {Description}
  - **Impact**: {High/Medium/Low}
  - **Mitigation**: {Approach}

### Business Risks

- **Risk**: {Description}
  - **Impact**: {High/Medium/Low}
  - **Mitigation**: {Approach}

---

## Epic Metadata

- **Estimated Size**: {T-shirt size: XS/S/M/L/XL}
- **Priority**: {Critical/High/Medium/Low}
- **Target Release**: {Release version or date}
- **Technical Domain**: {Frontend/Backend/Database/AI/DevOps}
```

#### User Story Template

```markdown
---
name: User Story
about: Implementable user story for development
title: '[STORY] '
labels: ['story', 'ready-for-estimation']
assignees: ''
---

## Story Description

**As a** {type of user}
**I want** {some goal or functionality}
**So that** {some reason or benefit}

## Acceptance Criteria

Specific, testable criteria that define when this story is complete:

- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}

## Technical Tasks

Detailed technical tasks required for implementation:

- [ ] {Specific technical task}
  - **Files to modify**: {File paths}
  - **Estimated time**: {Hours}
- [ ] {Specific technical task}
  - **Files to modify**: {File paths}
  - **Estimated time**: {Hours}

## Implementation Notes

### Existing Patterns

Reference similar implementations in the codebase:

- **Pattern**: {Description of similar feature}
- **Location**: {File paths to reference}

### Technical Approach

- **Frontend**: {React components, state management}
- **Backend**: {Server actions, API endpoints}
- **Database**: {Schema changes, queries}
- **Testing**: {Test strategy and coverage}

## Context Requirements

Information needed for Claude Code implementation:

### Role to Load

- **Primary**: {AI Engineer/UI Engineer/Data Engineer}
- **Secondary**: {Additional role if needed}

### Files to Read for Context

- `{file-path}` - {Why this file is relevant}
- `{file-path}` - {Why this file is relevant}

### Documentation to Review

- {Documentation section or external docs}

## Dependencies

- **Blocking Stories**: #{Issue numbers that must be completed first}
- **Related Stories**: #{Issue numbers for coordination}
- **External Dependencies**: {Third-party services, APIs, etc.}

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No linting or type errors
- [ ] Accessibility requirements met
- [ ] Performance requirements met

---

## Story Metadata

- **Story Points**: {To be estimated}
- **Priority**: {Critical/High/Medium/Low}
- **Sprint**: {Sprint assignment}
- **Epic**: #{Link to parent epic}
- **Technical Domain**: {Frontend/Backend/Database/AI/DevOps}
```

### Prompt Templates

#### Context Loading Template

```xml
<context_loading_prompt>
  <task>Load complete context for productive Claude Code development session</task>

  <session_info>
    <story_id>{STORY_ID}</story_id>
    <story_title>{STORY_TITLE}</story_title>
    <development_phase>{Analysis/Implementation/Testing/Review}</development_phase>
    <estimated_session_time>{HOURS}</estimated_session_time>
  </session_info>

  <context_loading_checklist>
    <step number="1">
      <action>Load Primary Role</action>
      <command>/read .claude/roles/{PRIMARY_ROLE}.md</command>
      <purpose>Set appropriate mental model for development work</purpose>
    </step>

    <step number="2">
      <action>Review Project Standards</action>
      <command>/read CLAUDE.md</command>
      <purpose>Understand project-specific patterns and constraints</purpose>
    </step>

    <step number="3">
      <action>Load Story Context</action>
      <command>/read .claude/contexts/story-{STORY_ID}/context.md</command>
      <purpose>Understand story requirements and acceptance criteria</purpose>
    </step>

    <step number="4">
      <action>Review Technical Notes</action>
      <command>/read .claude/contexts/story-{STORY_ID}/technical-notes.md</command>
      <purpose>Understand previous technical decisions and approaches</purpose>
    </step>

    <step number="5">
      <action>Check Progress</action>
      <command>/read .claude/contexts/story-{STORY_ID}/progress.md</command>
      <purpose>Understand current implementation status and next steps</purpose>
    </step>

    <step number="6">
      <action>Load Implementation Context</action>
      <files>{CONTEXT_FILES_LIST}</files>
      <purpose>Understand existing patterns and implementation approaches</purpose>
    </step>
  </context_loading_checklist>

  <session_readiness_check>
    <understanding>
      <story_requirements>Can you summarize the story requirements?</story_requirements>
      <acceptance_criteria>What are the key acceptance criteria?</acceptance_criteria>
      <technical_approach>What technical approach will you use?</technical_approach>
      <current_progress>What is the current implementation status?</current_progress>
    </understanding>

    <implementation_plan>
      <next_tasks>What are the immediate next tasks?</next_tasks>
      <file_changes>Which files need to be modified?</file_changes>
      <testing_approach>How will you validate the implementation?</testing_approach>
      <potential_blockers>What challenges do you anticipate?</potential_blockers>
    </implementation_plan>
  </session_readiness_check>

  <quality_standards_reminder>
    <code_standards>
      <typescript>Use proper TypeScript typing, no 'any' types</typescript>
      <validation>Validate all inputs with Zod schemas</validation>
      <components>Prefer Server Components over Client Components</components>
      <security>Always use Row Level Security, never bypass</security>
      <actions>Wrap all server actions with enhanceAction</actions>
    </code_standards>

    <testing_standards>
      <unit_tests>Write unit tests for business logic</unit_tests>
      <integration_tests>Test user workflows end-to-end</integration_tests>
      <accessibility>Ensure components meet accessibility standards</accessibility>
      <performance>Consider performance implications</performance>
    </testing_standards>
  </quality_standards_reminder>
</context_loading_prompt>
```

### Context File Templates

#### Story Context Template

```markdown
# Story Context: {Story Title}

## Story Overview

**ID**: {Story ID}
**Epic**: {Parent Epic Title}
**Status**: {Current Status}
**Assignee**: {Developer Name}
**Sprint**: {Sprint Assignment}

## Story Description

**As a** {user type}
**I want** {functionality}
**So that** {benefit}

## Acceptance Criteria

- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}

## Business Context

### Problem Statement

{Description of the problem this story solves}

### User Impact

{How this story benefits users}

### Success Metrics

- **Technical**: {Performance or quality metrics}
- **User**: {User experience metrics}
- **Business**: {Business impact metrics}

## Technical Requirements

### Frontend Requirements

- {Component requirements}
- {State management needs}
- {User interaction patterns}

### Backend Requirements

- {Server action requirements}
- {API endpoint needs}
- {Data processing logic}

### Database Requirements

- {Schema changes needed}
- {Query requirements}
- {Data migration needs}

## Implementation Approach

### Architecture Overview

{High-level technical approach}

### Key Components

- **{Component Name}**: {Purpose and functionality}
- **{Component Name}**: {Purpose and functionality}

### Integration Points

- **{System/Component}**: {How this story integrates}
- **{System/Component}**: {How this story integrates}

## Dependencies

### Blocking Dependencies

- **{Dependency}**: {Why it blocks this story}

### Related Stories

- **#{Story ID}**: {Relationship description}

### External Dependencies

- **{Service/API}**: {Dependency description}

## Risk Assessment

### Technical Risks

- **{Risk}**: {Impact and mitigation approach}

### Implementation Risks

- **{Risk}**: {Impact and mitigation approach}

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No linting or type errors
- [ ] Performance requirements met
- [ ] Accessibility requirements met

## Context for Claude Code

### Primary Role

{AI Engineer/UI Engineer/Data Engineer}

### Secondary Roles

{Additional roles if needed}

### Key Files to Understand

- `{file-path}` - {Why this file is important for context}
- `{file-path}` - {Why this file is important for context}

### Similar Implementations

- **{Feature Name}**: Located in `{file-path}` - {How it's similar}
- **{Pattern Name}**: Located in `{file-path}` - {Reusable pattern}

### Documentation to Review

- {Project documentation sections}
- {External API documentation}
- {Library documentation}
```

---

## Getting Started Guide

### Prerequisites

Before implementing AAFD v2.0, ensure you have:

1. **GitHub Repository** with Issues and Projects enabled
2. **Claude Code** development environment
3. **Project Structure** following MakerKit/SlideHeroes patterns
4. **Development Tools**:
   - Git for version control
   - Node.js and package manager (pnpm)
   - Code editor with TypeScript support

### Setup Checklist

#### Phase 1: Repository Setup (30 minutes)

**1. Create Methodology Directory Structure**

```bash
mkdir -p .claude/build
mkdir -p .claude/methodology
mkdir -p .claude/contexts
mkdir -p .claude/contexts/session-templates
mkdir -p .claude/prompt-library
```

**2. Create GitHub Project**

- Navigate to repository Settings > Projects
- Create new Project (Beta)
- Configure custom fields as specified in methodology
- Set up project views (Planning, Sprint, Timeline, Priority Matrix)

**3. Configure Issue Templates**

- Create `.github/ISSUE_TEMPLATE/` directory
- Add feature-epic.md and user-story.md templates
- Configure issue template chooser

**4. Set up Project Automation**

- Configure GitHub Actions for staleness detection
- Set up auto-labeling based on file paths
- Configure automatic project board movement

#### Phase 2: Prompt System Setup (45 minutes)

**1. Create Prompt Library**

```bash
# Create prompt templates directory
mkdir -p .claude/prompt-library

# Add core prompts
touch .claude/prompt-library/feature-planning.xml
touch .claude/prompt-library/implementation-planning.xml
touch .claude/prompt-library/implementation-session.xml
touch .claude/prompt-library/context-loading.xml
```

**2. Customize Prompts for Your Project**

- Copy prompt templates from methodology document
- Customize with your project's specific patterns
- Add project-specific technical constraints
- Include your technology stack details

**3. Create Context Templates**

```bash
# Create context management templates
touch .claude/contexts/session-templates/ai-engineer.md
touch .claude/contexts/session-templates/ui-engineer.md
touch .claude/contexts/session-templates/data-engineer.md
```

#### Phase 3: First Feature Implementation (2-3 hours)

**1. Choose a Simple Feature**
Select a feature that:

- Has clear user value
- Touches multiple parts of the system
- Is small enough to complete in 1-2 sprints
- Allows testing of the full methodology

**2. Follow Complete Workflow**

- Create Epic using feature planning prompt
- Break into chunks and stories
- Estimate and prioritize
- Implement first story with full context loading
- Document experience and lessons learned

**3. Refine Based on Experience**

- Update prompt templates based on what worked
- Adjust context management based on actual needs
- Refine GitHub Projects configuration
- Document process improvements

### Example First Feature: Simple AI Integration

**Feature**: Add AI-powered text suggestions to an existing form

**Why It's Good for Testing**:

- Touches AI integration patterns
- Requires frontend and backend changes
- Has clear user value
- Small enough to complete quickly

**Implementation Steps**:

1. **Epic Creation** (15 minutes)

   - Use feature planning prompt to create PRD
   - Create GitHub Epic issue
   - Set priority and initial estimates

2. **Story Breakdown** (30 minutes)

   - Use implementation planning prompt
   - Create 2-3 user stories
   - Set up story context files

3. **Implementation** (4-6 hours)

   - Load context using session template
   - Implement first story with Claude Code
   - Document progress and decisions
   - Test and validate

4. **Retrospective** (15 minutes)
   - Review what worked well
   - Identify methodology improvements
   - Update templates and processes

### Common Pitfalls and Solutions

#### Context Loading Issues

**Problem**: Claude Code sessions start slowly due to context loading overhead
**Solution**:

- Prepare context files thoroughly
- Create session-specific context summaries
- Use batch file reading commands

#### Estimation Accuracy

**Problem**: Story point estimates are consistently off
**Solution**:

- Track actual vs estimated time
- Calibrate story point scale based on experience
- Account for context switching overhead

#### GitHub Projects Complexity

**Problem**: Project board becomes too complex to maintain
**Solution**:

- Start with simple views and add complexity gradually
- Focus on automation to reduce manual overhead
- Regular cleanup of completed items

#### Prompt Template Drift

**Problem**: Prompt templates become outdated or inconsistent
**Solution**:

- Regular prompt template reviews
- Version control for prompt templates
- Documentation of prompt evolution

### Success Metrics

#### Short-term (1-2 months)

- **Consistency**: Using methodology for all feature development
- **Context Efficiency**: Reduced session startup time
- **Planning Accuracy**: Story estimates within 25% of actual

#### Medium-term (3-6 months)

- **Velocity Stability**: Consistent story point delivery
- **Quality Improvement**: Reduced bugs and technical debt
- **Process Efficiency**: Streamlined ceremonies and automation

#### Long-term (6+ months)

- **Feature Delivery**: Faster time-to-market for new features
- **Code Quality**: Improved maintainability and test coverage
- **Developer Experience**: Higher satisfaction and productivity

---

## Appendices

### Appendix A: Tool Configurations

#### GitHub Projects Field Configuration (JSON)

```json
{
  "fields": [
    {
      "name": "Feature Type",
      "type": "single_select",
      "options": [
        {
          "name": "Epic",
          "description": "Large feature spanning multiple sprints"
        },
        { "name": "Story", "description": "User-facing functionality" },
        { "name": "Task", "description": "Technical work item" },
        { "name": "Bug", "description": "Defect requiring resolution" },
        { "name": "Spike", "description": "Research or investigation work" }
      ]
    },
    {
      "name": "Priority",
      "type": "single_select",
      "options": [
        { "name": "Critical", "description": "Blocking or urgent" },
        { "name": "High", "description": "Important for current sprint" },
        { "name": "Medium", "description": "Nice to have" },
        { "name": "Low", "description": "Future consideration" }
      ]
    },
    {
      "name": "Story Points",
      "type": "single_select",
      "options": [
        { "name": "1", "description": "Trivial change" },
        { "name": "2", "description": "Simple change" },
        { "name": "3", "description": "Moderate complexity" },
        { "name": "5", "description": "Complex change" },
        { "name": "8", "description": "Very complex" },
        { "name": "13", "description": "Epic-sized work" },
        { "name": "21", "description": "Needs breakdown" }
      ]
    },
    {
      "name": "AI Context Status",
      "type": "single_select",
      "options": [
        { "name": "Fresh", "description": "Recently updated context" },
        { "name": "Loaded", "description": "Ready for development" },
        { "name": "Stale", "description": "Needs context refresh" },
        { "name": "Needs Refresh", "description": "Context out of date" }
      ]
    },
    {
      "name": "Technical Domain",
      "type": "multi_select",
      "options": [
        { "name": "Frontend", "description": "React components and UI" },
        { "name": "Backend", "description": "Server actions and APIs" },
        { "name": "Database", "description": "Schema and data operations" },
        { "name": "AI", "description": "AI integration and prompts" },
        { "name": "DevOps", "description": "Build and deployment" },
        { "name": "Testing", "description": "Test implementation" }
      ]
    }
  ]
}
```

#### GitHub Actions Workflow for Staleness Detection

```yaml
# .github/workflows/context-staleness.yml
name: Context Staleness Detection

on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM
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
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['stale-context']
                });
                
                await github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  body: `🤖 This story has been inactive for over a week. Consider refreshing the context before resuming development.\n\nContext refresh checklist:\n- [ ] Review story relevance\n- [ ] Update technical approach\n- [ ] Refresh file paths\n- [ ] Update progress notes`
                });
              }
            }
```

### Appendix B: Reference Templates

#### Complete User Story Example

```markdown
# Story: AI-Powered Slide Content Suggestions

## Description

**As a** SlideHeroes user
**I want** to receive AI-powered content suggestions when creating slides
**So that** I can quickly generate relevant, high-quality slide content

## Acceptance Criteria

- [ ] User can click "Get AI Suggestions" button on slide editor
- [ ] System prompts user for slide topic/context
- [ ] AI generates 3-5 content suggestions within 5 seconds
- [ ] User can preview suggestions before applying
- [ ] User can apply suggestion to current slide with one click
- [ ] System tracks AI usage for billing purposes
- [ ] Error handling for AI service failures with user-friendly messages

## Technical Tasks

- [ ] Create `SlideSuggestionsDialog` component with topic input form
  - **Files**: `apps/web/app/home/(user)/editor/_components/SlideSuggestionsDialog.tsx`
  - **Estimated time**: 2 hours
- [ ] Implement `generateSlideSuggestionsAction` server action
  - **Files**: `apps/web/app/home/(user)/editor/_actions/slide-suggestions.action.ts`
  - **Estimated time**: 3 hours
- [ ] Add AI usage tracking to user account
  - **Files**: `packages/supabase/src/schema/ai-usage.schema.ts`
  - **Estimated time**: 1 hour
- [ ] Create suggestion preview and application UI
  - **Files**: `apps/web/app/home/(user)/editor/_components/SuggestionPreview.tsx`
  - **Estimated time**: 2 hours
- [ ] Implement error handling and loading states
  - **Files**: Multiple component files
  - **Estimated time**: 1 hour
- [ ] Write unit tests for suggestion logic
  - **Files**: `apps/web/app/home/(user)/editor/_actions/slide-suggestions.test.ts`
  - **Estimated time**: 1.5 hours

## Implementation Notes

### Existing Patterns

- **AI Integration**: Reference `apps/web/app/home/(user)/ai/canvas/_actions/` for Portkey patterns
- **Dialog Components**: Reference `packages/ui/src/dialog.tsx` for modal patterns
- **Server Actions**: Reference existing `enhanceAction` usage in editor actions

### Technical Approach

- **Frontend**: React component with Zod form validation and React Query for state
- **Backend**: Portkey AI Gateway integration with usage tracking
- **Database**: Extend ai_usage table with slide suggestion metrics
- **Testing**: Unit tests for AI response parsing and error handling

## Context Requirements

### Role to Load

- **Primary**: AI Engineer
- **Secondary**: UI Engineer (for component work)

### Files to Read for Context

- `apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.action.ts` - AI integration pattern
- `apps/web/app/home/(user)/editor/_components/SlideEditor.tsx` - Editor context
- `packages/ai-gateway/src/slide-generator.ts` - Existing AI functionality
- `CLAUDE.md` - Project standards and patterns

### Documentation to Review

- Portkey AI Gateway configuration
- SlideHeroes editor architecture
- AI usage billing requirements

## Dependencies

- **Blocking Stories**: None
- **Related Stories**: #123 (AI Usage Dashboard), #124 (Editor Performance)
- **External Dependencies**: Portkey AI Gateway service availability

## Story Points: 8

## Priority: High

## Sprint: Sprint 12

## Epic: #120 (AI-Powered Content Creation)

## Technical Domain: AI, Frontend
```

### Appendix C: Quick Reference

#### Methodology Phase Summary

| Phase                 | Duration  | Inputs         | Outputs                 | GitHub Status          |
| --------------------- | --------- | -------------- | ----------------------- | ---------------------- |
| 1. Ideation & PRD     | 1-2 hours | Feature idea   | Formal PRD              | Epic in "Idea"         |
| 2. Technical Chunking | 30-60 min | PRD            | Implementation chunks   | Chunks in "Chunks"     |
| 3. Story Refinement   | 1-2 hours | Chunks         | User stories with tasks | Stories in "Stories"   |
| 4. Sprint Planning    | 30 min    | Stories        | Sprint backlog          | Stories in "Ready"     |
| 5. Implementation     | Variable  | Sprint backlog | Working features        | Stories move to "Done" |

#### Context Loading Quick Commands

```bash
# Load AI Engineer role for AI feature work
/read .claude/roles/ai-engineer.md

# Load UI Engineer role for frontend work
/read .claude/roles/ui-engineer.md

# Load Data Engineer role for backend/database work
/read .claude/roles/data-engineer.md

# Load project standards
/read CLAUDE.md

# Load story context
/read .claude/contexts/story-{id}/context.md

# Load progress notes
/read .claude/contexts/story-{id}/progress.md
```

#### Story Point Calibration

| Points | Complexity   | Examples                            | Time Estimate |
| ------ | ------------ | ----------------------------------- | ------------- |
| 1      | Trivial      | Copy changes, simple styling        | 1-2 hours     |
| 2      | Simple       | Basic component, simple form        | 2-4 hours     |
| 3      | Moderate     | Component with logic, server action | 4-8 hours     |
| 5      | Complex      | Feature with multiple parts         | 1-2 days      |
| 8      | Very Complex | Complex feature with integration    | 2-3 days      |
| 13     | Epic-sized   | Multi-component feature             | 1 week+       |

#### Emergency Procedures

**Context Loss Recovery**:

1. Check `.claude/contexts/story-{id}/` for saved context
2. Review GitHub issue for requirements
3. Check commit history for recent changes
4. Use context refresh checklist

**Blocked Development**:

1. Document blocker in story progress file
2. Update GitHub issue with blocker details
3. Move to "Blocked" column in GitHub Projects
4. Schedule research session or seek help

**Quality Issues**:

1. Run full test suite: `pnpm test`
2. Check linting: `pnpm lint:fix`
3. Run type checking: `pnpm typecheck`
4. Review against project standards in CLAUDE.md

---

## Document Versioning

**Version**: 1.0
**Last Updated**: {Current Date}
**Next Review**: {Date + 3 months}

**Change Log**:

- v1.0: Initial methodology design and documentation
- Future versions will track methodology evolution and improvements

**Contributors**:

- Methodology design based on analysis of Scrum, Kanban, and Parker Rex prompt system
- Adapted for solo developer + Claude Code collaboration
- Integrated with GitHub Projects for comprehensive project management

---

_This methodology document is a living specification that should evolve based on practical experience and changing development needs. Regular reviews and updates ensure continued effectiveness and relevance._
