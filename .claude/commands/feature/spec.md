---
allowed-tools: Bash, Read, Write, LS
---

# Feature Specification

Create a comprehensive feature specification document.

## Usage
```
/feature:spec <feature_name>
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress. Just do them and move on.

### Input Validation
1. **Validate feature name format:**
   - Must contain only lowercase letters, numbers, and hyphens
   - Must start with a letter
   - No spaces or special characters allowed
   - If invalid, tell user: "❌ Feature name must be kebab-case (lowercase letters, numbers, hyphens only). Examples: user-auth, payment-v2, notification-system"

2. **Check for existing specification:**
   - Check if `.claude/specs/$ARGUMENTS.md` already exists
   - If it exists, ask user: "⚠️ Feature specification '$ARGUMENTS' already exists. Do you want to overwrite it? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "Use a different name or run: /feature:plan $ARGUMENTS to create an implementation plan from the existing specification"

3. **Verify directory structure:**
   - Check if `.claude/specs/` directory exists
   - If not, create it first
   - If unable to create, tell user: "❌ Cannot create specs directory. Please manually create: .claude/specs/"

## Instructions

You are creating a comprehensive Feature Specification for: **$ARGUMENTS**

Follow this structured approach:

### 1. Discovery & Context
- Ask clarifying questions about the feature "$ARGUMENTS"
- Understand the problem being solved
- Identify target users and use cases
- Gather constraints and requirements

### 2. Feature Specification Structure
Create a comprehensive specification with these sections:

#### Executive Summary
- Brief overview and business value

#### Problem Statement
- What problem are we solving?
- Why is this important now?
- Impact on users/business

#### User Stories
- Primary user personas
- Detailed user journeys
- Acceptance criteria for each story

#### Requirements
**Functional Requirements**
- Core features and capabilities
- User interactions and workflows

**Non-Functional Requirements**
- Performance expectations
- Security considerations
- Scalability needs
- Accessibility requirements

#### Success Criteria
- Measurable outcomes
- Key metrics and KPIs
- Definition of success

#### Technical Considerations
- Architecture implications
- Integration points
- Technology constraints

#### Risk Assessment
- Technical risks
- Business risks
- Mitigation strategies

#### Dependencies
- External service dependencies
- Internal system dependencies
- Third-party libraries

#### Out of Scope
- What we're explicitly NOT building
- Future enhancements

#### Timeline Estimate
- Research phase
- Implementation effort
- Testing requirements
- Total duration

### 3. File Format with Frontmatter
Save the completed specification to: `.claude/specs/$ARGUMENTS.md` with this exact structure:

```markdown
---
name: $ARGUMENTS
description: [Brief one-line description of the feature]
status: draft
created: [Current ISO date/time]
type: feature-spec
---

# Feature Specification: $ARGUMENTS

## Executive Summary
[Content...]

## Problem Statement
[Content...]

## User Stories
### Story 1: [Title]
**As a** [user type]
**I want** [functionality]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

[Continue with all sections...]
```

### 4. Frontmatter Guidelines
- **name**: Use the exact feature name (same as $ARGUMENTS)
- **description**: Write a concise one-line summary of what this feature provides
- **status**: Always start with "draft" for new specifications
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
  - Never use placeholder text
  - Must be actual system time in ISO 8601 format
- **type**: Always use "feature-spec" to distinguish from other document types

### 5. Quality Checks

Before saving the specification, verify:
- [ ] All sections are complete (no placeholder text)
- [ ] User stories include clear acceptance criteria
- [ ] Success criteria are measurable
- [ ] Dependencies are clearly identified
- [ ] Risks are assessed with mitigation strategies
- [ ] Out of scope items are explicitly listed

### 6. Post-Creation

After successfully creating the specification:
1. Confirm: "✅ Feature specification created: .claude/specs/$ARGUMENTS.md"
2. Show brief summary of what was captured
3. Suggest next step: "Ready to create implementation plan? Run: /feature:plan $ARGUMENTS"

## Error Recovery

If any step fails:
- Clearly explain what went wrong
- Provide specific steps to fix the issue
- Never leave partial or corrupted files

Conduct a thorough brainstorming session before writing the specification. Ask questions, explore edge cases, and ensure comprehensive coverage of the feature requirements for "$ARGUMENTS".