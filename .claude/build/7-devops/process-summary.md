# Feature Development Phases Summary

## Overview

AI-Assisted Feature Development is our methodology designed for solo developers working with Claude Code. It consists of 7 main phases that transform ideas into production-ready features, starting with comprehensive user discovery.

---

## Phase 0: User Discovery & Research

**Description**: Conduct interactive user interviews and market research to validate feature ideas and generate comprehensive context for PRD creation.

**Input**:

- Raw feature idea or user request
- Initial user feedback or pain points
- Business objectives and constraints

**Output**:

- Discovery summary with validated requirements
- Business context documentation
- User research insights and personas
- Competitive analysis report
- Market trends analysis
- Generated context files ready for PRD phase

**Templates Used**:

- User Discovery Interview Prompt
- Business Context Template
- User Research Template
- Competitive Analysis Template
- Market Trends Template
- Discovery Summary Template

**Activities**:

- **Interactive User Interview**: Guided Q&A session covering:
  - Core feature idea and problem statement
  - Target user identification and characterization
  - Business value proposition and success metrics
  - User journey mapping and workflow analysis
  - Technical constraints and timeline requirements
- **Market Research**: Using AI tools (Perplexity, Exa) to research:
  - Competitive landscape and feature comparison
  - User behavior patterns and industry trends
  - Technical implementation best practices
  - Market positioning opportunities
- **Context File Generation**: Automated creation of:
  - `.claude/build/contexts/discovery/{feature-slug}/business-context.md`
  - `.claude/build/contexts/discovery/{feature-slug}/user-research.md`
  - `.claude/build/contexts/discovery/{feature-slug}/competitive-analysis.md`
  - `.claude/build/contexts/discovery/{feature-slug}/market-trends.md`
- **GitHub Issue Creation**: Discovery issue with proper labels and tracking

---

## Phase 1: Ideation & PRD Creation

**Description**: Transform validated discovery results into structured Product Requirements Documents (PRDs) that serve as the foundation for development.

**Input**:

- Discovery summary and validated requirements from Phase 0
- Generated context files (business, user research, competitive analysis, market trends)
- Existing codebase patterns and technical constraints

**Output**:

- GitHub Epic issue with formal PRD
- Technical requirements specification
- Acceptance criteria definition
- Cross-cutting concerns identification

**Templates Used**:

- Feature Planning Prompt (XML-structured)
- Feature Epic GitHub Issue Template

**Activities**:

- Load discovery context files and research results
- Apply Feature Planning Prompt to synthesize discovery into structured PRD
- Technical Feasibility Review with reference to existing codebase
- Create GitHub Epic issue linking to discovery issue
- PRD Documentation incorporating market research and user insights
- Competitive positioning and differentiation strategy
- Scope validation based on discovery findings

---

## Phase 2: Technical Chunking & Analysis

**Description**: Break PRDs into logical implementation chunks with dependency analysis, enabling parallel work streams where possible.

**Input**:

- Validated PRD from Phase 1
- Current codebase analysis
- Technical constraint documentation

**Output**:

- 2-4 feature chunks with clear boundaries
- Cross-cutting dependency documentation
- Parallel implementation strategy
- Risk assessment for each chunk

**Templates Used**:

- Implementation Planning Prompt
- Chunk documentation templates

**Activities**:

- PRD Structure Analysis using Sequential Thinking
- Cross-cutting Concern Identification via codebase review
- Logical Chunking into 2-4 parallel work streams
- Dependency Mapping between chunks
- Chunk Validation for completeness and feasibility
- **Stakeholder Validation**: Review chunks with team/users for alignment

---

## Phase 3: Stakeholder Validation

**Description**: Validate technical chunks with stakeholders to ensure alignment with business goals and user needs before proceeding to story creation.

**Input**:

- Technical chunks from Phase 2
- Business requirements and constraints
- User feedback and priorities

**Output**:

- Validated and prioritized chunks
- Adjusted scope based on feedback
- Risk mitigation strategies
- Go/no-go decision for each chunk

**Templates Used**:

- Stakeholder Review Template
- Chunk Priority Matrix
- Risk Assessment Template

**Activities**:

- **Present Chunk Overview**: Share technical approach with stakeholders
  - Explain the rationale for chunk boundaries
  - Demonstrate how chunks deliver user value
  - Highlight dependencies and risks
- **Gather Feedback**: Collect input on priorities and concerns
  - Business value validation
  - Technical approach review
  - Resource and timeline considerations
- **Adjust Scope**: Refine chunks based on feedback
  - Reprioritize features within chunks
  - Adjust chunk boundaries if needed
  - Document any scope changes
- **Risk Assessment**: Identify and plan for potential issues
  - Technical risks and mitigation strategies
  - Business risks and contingency plans
  - Dependencies on external teams or systems

---

## Phase 4: User Story Creation & Refinement

**Description**: Transform technical chunks into clear user stories that capture user needs and guide implementation towards better code quality.

**Input**:

- Validated technical chunks from Phase 2.5
- User personas and their needs
- Business context and goals
- Stakeholder feedback and priorities

**Output**:

- User stories in standard format for each chunk
- Acceptance criteria for each story
- Refined stories based on user feedback
- Clear understanding of user value

**Templates Used**:

- User Story Template: "As a [persona], I want to [action], so that [benefit]"
- Acceptance Criteria Template
- Story Refinement Checklist

**Activities**:

- **Define User Stories**: Create stories from chunks using the standard template
  - Identify the persona (who needs this feature)
  - Define the desired action (what they want to do)
  - Clarify the benefit (why it matters to them)
- **Write Acceptance Criteria**: Define testable conditions for story completion
- **Iterate with User**: Review and refine stories based on feedback
  - Validate that stories capture real user needs
  - Ensure technical approach aligns with user expectations
  - Adjust scope and priorities based on discussion
- **Code Quality Focus**: Ensure stories guide towards maintainable, testable code

---

## Phase 5: Sprint Planning with Test-Driven Design

**Description**: Create focused sprints from user stories and plan implementation using test-driven development (TDD) principles.

**Input**:

- Refined user stories from Phase 3
- Technical dependencies and constraints
- Developer capacity (hours available)
- Testing requirements

**Output**:

- Sprint plan with 1-2 week iterations
- Test specifications for each story
- Implementation sequence based on TDD
- Context requirements for Claude Code sessions

**Templates Used**:

- Sprint Planning Template
- Test Specification Template
- TDD Implementation Guide
- Context Loading Checklist

**Activities**:

- **Sprint Creation Logic**:
  - Group related user stories into cohesive sprints
  - Size sprints based on complexity (aim for 1-2 weeks)
  - Sequence sprints to minimize dependencies
  - Include buffer time for testing and refinement
- **Test-Driven Design Planning**:
  - Write test specifications before implementation
  - Define unit tests for business logic
  - Plan integration tests for user workflows
  - Create test data and fixtures
- **Implementation Approach**:
  - Red: Write failing tests first
  - Green: Implement minimum code to pass tests
  - Refactor: Improve code quality while maintaining tests
- **Context Preparation**: Document what Claude Code needs for each sprint

---

## Phase 6: Implementation & Review

**Description**: Execute implementation using Test-Driven Development and validate feature quality through systematic review and feedback loops.

**Input**:

- Sprint plan and test specifications from Phase 5
- Story context files and technical notes
- TDD implementation requirements

**Output**:

- Working, tested implementation
- Updated documentation and context files
- Pull requests with code review
- Validated features ready for deployment

**Templates Used**:

- Implementation Prompt (TDD-focused)
- Test Specification Template
- Code Review Checklist
- Feature Validation Template

**Activities**:

- **TDD Implementation Cycle**: Red-Green-Refactor approach
  - Write failing tests first based on acceptance criteria
  - Implement minimum code to pass tests
  - Refactor for code quality while maintaining tests
- **Continuous Integration**: Automated testing and quality checks
- **Code Review**: PR-based review process with quality gates
- **Feature Validation**: Testing against original acceptance criteria
- **Documentation Updates**: Keep context files and progress current

---

## GitHub Projects Integration

Each phase integrates with GitHub Projects through:

- **Planning Board**: Discovery → PRD → Chunks → Validation → Stories → Sprint Planning → Ready → Done
- **Sprint Board**: Ready → In Progress → Review → Done
- **Discovery Tracking**: Discovery Status field tracks interview and research progress
- **Context Management**: AI Context Status and Context Files Path fields
- **Automated Transitions**: Based on PR status, issue labels, and AAFD stage
- **Metrics Tracking**: Story points, velocity, cycle time, and discovery-to-delivery lead time

---

## Key Success Factors

1. **User-Centric Discovery**: Every feature starts with validated user research and market analysis
2. **Systematic Context Management**: Every phase includes context preservation for AI sessions
3. **Structured Prompts**: XML-based prompts ensure consistent AI interactions
4. **Research-Informed Decisions**: AI-assisted market research provides competitive intelligence
5. **Incremental Progress**: Small, testable changes with frequent validation
6. **Stakeholder Alignment**: Regular validation ensures development stays on track
7. **Automation**: GitHub Projects automation reduces manual overhead
8. **Continuous Improvement**: Regular retrospectives refine the process
