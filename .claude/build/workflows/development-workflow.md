# AAFD v2.0 Development Workflow

## Overview

This document outlines the complete development workflow for implementing features using the AI-Assisted Feature Development (AAFD) v2.0 methodology in SlideHeroes.

## Workflow Phases

### Phase 1: Feature Planning (1-2 hours)

**Objective**: Transform feature ideas into structured Product Requirements Documents (PRDs)

#### Steps:

1. **Create Epic Issue**

   - Use GitHub issue template: Feature Epic
   - Apply Feature Planning Prompt from `.claude/build/prompt-library/feature-planning.xml`
   - Include business context and user impact

2. **Develop PRD**

   - Define clear objectives and user stories
   - Establish acceptance criteria
   - Identify technical requirements
   - Document cross-cutting concerns

3. **Move to Planning Board**
   - Move epic to "PRD" column in GitHub Projects
   - Set priority and technical domain tags
   - Link to any related epics or dependencies

#### Outputs:

- GitHub Epic issue with complete PRD
- Technical requirements specification
- Acceptance criteria definition
- Cross-cutting concerns identification

---

### Phase 2: Technical Analysis (30-60 minutes)

**Objective**: Break PRDs into logical implementation chunks with dependency analysis

#### Steps:

1. **Apply Implementation Planning Prompt**

   - Use `.claude/build/prompt-library/implementation-planning.xml`
   - Analyze PRD structure and identify logical units
   - Reference existing SlideHeroes patterns

2. **Create Implementation Chunks**

   - Break epic into 2-4 parallel work streams
   - Document dependencies between chunks
   - Estimate effort and complexity

3. **Update Project Board**
   - Move epic to "Chunks" column
   - Create child issues for each chunk
   - Document dependencies in issue descriptions

#### Outputs:

- 2-4 feature chunks with clear boundaries
- Cross-cutting dependency documentation
- Parallel implementation strategy
- Risk assessment for each chunk

---

### Phase 3: Story Creation (1-2 hours)

**Objective**: Convert chunks into implementable user stories with detailed technical tasks

#### Steps:

1. **Extract User Stories**

   - Break each chunk into 1-3 user stories
   - Follow "As a... I want... so that..." format
   - Ensure stories are completable in 1-3 sessions

2. **Define Technical Tasks**

   - Create 3-7 atomic implementation steps per story
   - Include specific file paths and functions
   - Reference SlideHeroes patterns and examples

3. **Create Story Context**

   - Use story context template: `.claude/build/templates/contexts/story-context-template.md`
   - Save in `.claude/build/contexts/stories/story-{id}/`
   - Include context requirements for Claude Code

4. **Update Project Board**
   - Move chunks to "Stories" column
   - Create user story issues linked to chunks
   - Set story points and priority

#### Outputs:

- 3-8 implementable user stories
- Detailed technical task breakdowns
- Story point estimates for capacity planning
- Complete context files for each story

---

### Phase 4: Sprint Planning (30 minutes)

**Objective**: Plan and prioritize development sprints with capacity-based story selection

#### Steps:

1. **Estimate Story Points**

   - Use fibonacci sequence (1,2,3,5,8,13)
   - Consider complexity, unknowns, and dependencies
   - Calibrate based on SlideHeroes historical data

2. **Plan Sprint Capacity**

   - Consider available development time
   - Account for context switching overhead
   - Plan for 1-2 week sprint duration

3. **Select Stories for Sprint**

   - Choose stories within capacity limits
   - Respect dependency order
   - Balance technical domains

4. **Update Project Board**
   - Move selected stories to "Ready" column
   - Create sprint milestone
   - Link stories to sprint milestone

#### Outputs:

- Sprint backlog with selected stories
- Implementation plan with session scheduling
- Context preparation checklist
- Sprint goals and timeline

---

### Phase 5: Implementation (Variable)

**Objective**: Execute development with full context loading and quality standards

#### Steps:

##### Session Start Protocol:

1. **Load Context**

   - Use session template: `.claude/build/contexts/session-templates/{role}.md`
   - Load Claude role: `/read .claude/roles/{role}.md`
   - Review project standards: `/read CLAUDE.md`
   - Load story context: `/read .claude/build/contexts/stories/story-{id}/context.md`

2. **Understand Current State**
   - Review progress: `/read .claude/build/contexts/stories/story-{id}/progress.md`
   - Check technical notes: `/read .claude/build/contexts/stories/story-{id}/technical-notes.md`
   - Load relevant codebase files

##### Development Process:

1. **Implement Features**

   - Follow SlideHeroes patterns and standards
   - Use enhanceAction for server actions
   - Implement proper TypeScript typing
   - Add Zod validation for inputs

2. **Write Tests**

   - Unit tests for business logic
   - Integration tests for user workflows
   - Follow existing test patterns

3. **Update Progress**

   - Document decisions in technical notes
   - Update progress file after each session
   - Track completed tasks and remaining work

4. **Quality Checks**
   - Run linting: `pnpm lint:fix`
   - Type checking: `pnpm typecheck`
   - Tests: `pnpm test`
   - Build verification: `pnpm build`

##### Session End Protocol:

1. **Update Context Files**

   - Update progress with completed work
   - Document technical decisions
   - Note any blockers or challenges

2. **Update Project Board**
   - Move story through columns (In Progress → Review → Done)
   - Update GitHub issue with progress
   - Link to relevant commits/PRs

#### Outputs:

- Working features meeting acceptance criteria
- Comprehensive test coverage
- Updated documentation and context
- Clean, production-ready code

---

### Phase 6: Review & Retrospective (15-30 minutes)

**Objective**: Validate implementation quality and improve development process

#### Steps:

1. **Feature Validation**

   - Test against all acceptance criteria
   - Verify integration with existing features
   - Confirm performance requirements met

2. **Code Quality Review**

   - Review code against SlideHeroes standards
   - Check test coverage and quality
   - Verify security and accessibility requirements

3. **Process Retrospective**

   - What worked well in development?
   - What caused delays or inefficiencies?
   - How effective was AI collaboration?
   - What methodology improvements are needed?

4. **Update Methodology**
   - Refine prompt templates based on experience
   - Update context management based on effectiveness
   - Improve GitHub Projects configuration

#### Outputs:

- Validated, production-ready features
- Quality assurance documentation
- Process improvement recommendations
- Updated methodology guidelines

---

## Context Management Best Practices

### Context File Management

- Update context files after each development session
- Document all technical decisions with rationale
- Keep file lists current and relevant
- Use automated staleness detection

### Context Loading Efficiency

- Batch file reading commands for efficiency
- Use session-specific context summaries
- Prepare context files thoroughly before sessions
- Maintain consistent file naming and organization

### Progress Tracking

- Update progress immediately after task completion
- Document blockers and resolution strategies
- Track time estimates vs actual effort
- Maintain development continuity notes

---

## Quality Standards

### Code Quality

- No `any` types - proper TypeScript typing
- Zod schemas for all input validation
- Server Components preferred over Client Components
- Row Level Security for all data access
- enhanceAction wrapper for all server actions

### Testing Standards

- Unit tests for all business logic
- Integration tests for critical user workflows
- Test coverage targets: 80%+ for new code
- Accessibility testing for UI components

### Documentation Standards

- Code comments for complex logic
- API documentation for server actions
- Context files kept up-to-date
- Technical decisions documented with rationale

---

## Troubleshooting

### Context Issues

- **Stale Context**: Use context refresh checklist
- **Missing Context**: Check file paths in context requirements
- **Context Overload**: Prioritize most relevant files for session

### Development Issues

- **Build Failures**: Check linting and type errors first
- **Test Failures**: Review test patterns and setup
- **Performance Issues**: Profile and optimize critical paths

### Process Issues

- **Estimation Accuracy**: Calibrate story points based on actual effort
- **Dependency Blockers**: Identify and resolve critical path issues
- **Scope Creep**: Review and validate against acceptance criteria

---

## Quick Reference

### Essential Commands

```bash
# Development workflow
pnpm dev                    # Start development servers
pnpm typecheck             # Check TypeScript types
pnpm lint:fix              # Fix linting issues
pnpm test                  # Run tests
pnpm build                 # Build for production

# Context loading
/read .claude/roles/{role}.md
/read CLAUDE.md
/read .claude/build/contexts/stories/story-{id}/context.md
```

### File Locations

- **Methodology**: `.claude/build/methodology/`
- **Prompts**: `.claude/build/prompt-library/`
- **Context**: `.claude/build/contexts/`
- **Templates**: `.claude/build/templates/`
- **Stories**: `.claude/build/contexts/stories/`

### GitHub Projects Views

- **Planning Board**: Idea → PRD → Chunks → Stories → Ready → Blocked
- **Sprint Board**: Ready → In Progress → Review → Done
- **Timeline View**: Gantt chart for dependencies
- **Priority Matrix**: Impact vs Effort analysis
