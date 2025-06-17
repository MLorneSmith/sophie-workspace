# Feature Development Phases Summary

## Overview

AI-Assisted Feature Development is our methodology designed for solo developers working with Claude Code. It consists of 5 main phases that transform ideas into production-ready features.

---

## Phase 1: Ideation & PRD Creation

**Description**: Transform feature ideas into structured Product Requirements Documents (PRDs) that serve as the foundation for development.

**Input**:

- Feature idea or user request
- Business context and requirements
- Existing codebase patterns

**Output**:

- GitHub Epic issue with formal PRD
- Technical requirements specification
- Acceptance criteria definition
- Cross-cutting concerns identification

**Templates Used**:

- Feature Planning Prompt (XML-structured)
- Feature Epic GitHub Issue Template

**Activities**:

- Create GitHub Issue using Feature Epic template
- Apply Feature Planning Prompt to convert idea to structured PRD
- Technical Feasibility Review with reference to existing codebase
- PRD Documentation in GitHub issue description
- Initial scope validation and business alignment

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

## Phase 6: Review & Retrospective

**Description**: Validate implementation quality and improve development process through systematic review and feedback loops.

**Input**:

- Completed sprint deliverables
- Test results and quality metrics
- Development experience feedback

**Output**:

- Validated, production-ready features
- Quality assurance documentation
- Process improvement recommendations
- Updated methodology guidelines

**Templates Used**:

- Feature Retrospective Template
- Monthly Methodology Review Template
- Quality Checklist Template

**Activities**:

- Feature Validation against acceptance criteria
- Code Quality Review with automated tools
- Integration Testing in full application context
- User Experience Testing with real usage scenarios
- Process Retrospective for methodology improvement

---

## GitHub Projects Integration

Each phase integrates with GitHub Projects through:

- **Planning Board**: Idea → PRD → Chunks → Stories → Ready → Blocked
- **Sprint Board**: Ready → In Progress → Review → Done
- **Automated Transitions**: Based on PR status, issue labels, and activity
- **Context Management**: AI Context Status field tracks freshness
- **Metrics Tracking**: Story points, velocity, and cycle time

---

## Key Success Factors

1. **Systematic Context Management**: Every phase includes context preservation for AI sessions
2. **Structured Prompts**: XML-based prompts ensure consistent AI interactions
3. **Incremental Progress**: Small, testable changes with frequent validation
4. **Stakeholder Alignment**: Regular validation ensures development stays on track
5. **Automation**: GitHub Projects automation reduces manual overhead
6. **Continuous Improvement**: Regular retrospectives refine the process
