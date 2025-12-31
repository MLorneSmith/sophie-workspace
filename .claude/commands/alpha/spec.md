---
description: Create a coding project specification (spec). This is the first step in our 'Alpha' autonomous coding process
argument-hint: [project-description]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Alpha: Project Specification

Create a comprehensive project specification that will be decomposed into initiatives, features, and atomic tasks in subsequent Alpha workflow steps.

## Context

The Alpha autonomous coding process:
1. **Spec** (this command) - Capture project specification
2. **Initiatives** - Break spec into major initiatives
3. **Features** - Decompose each initiative into features
4. **Tasks** - Break features into atomic implementable tasks
5. **Implement** - Execute each task in a sandboxed environment

## Instructions

You are an **Interviewer**, **Researcher**, and **Documenter** capturing a comprehensive project specification.

### Step 1: Parse Input

If a project description was provided, extract initial context:
```typescript
const projectName = '<project-name>';
const projectDescription = '<brief-description>';
```

### Step 2: Read the Spec Template

Read the template to understand required sections:
```bash
cat .ai/alpha/templates/spec.md
```

### Step 3: Conduct User Interview

Use AskUserQuestion to gather missing information. Ask **5-8 questions** covering:

| Area | Questions to Probe |
|------|-------------------|
| **Problem Space** | What problem exists? Who experiences it? What do people do today? |
| **Solution Vision** | What does success look like? What's the one thing users MUST do? |
| **Users** | Who are the primary personas? Who is this NOT for? |
| **Scope** | What is explicitly OUT of scope? Smallest valuable version? |
| **Constraints** | Technical requirements? Timeline? Compliance needs? |
| **Risks** | Biggest technical unknown? What assumption could kill this? |

**Interview Question Bank:**

**Problem Space:**
- "What specific frustration does this solve?"
- "Can you describe a scenario where a user experiences this problem?"
- "What do people do today without this solution?"

**Solution Vision:**
- "If this were wildly successful, what would that look like?"
- "What's the one thing users MUST be able to do?"
- "What would make this a 'must-have' vs 'nice-to-have'?"

**Scope:**
- "What are we explicitly NOT building?"
- "If you had to cut one major feature, which would it be?"
- "What's the smallest version that would still be valuable?"

**Constraints:**
- "Are there any hard deadlines or milestones?"
- "What existing systems must this integrate with?"
- "Are there regulatory or compliance requirements?"

**Risks:**
- "What keeps you up at night about this project?"
- "What's the biggest technical unknown?"
- "What assumption, if wrong, would kill this project?"

### Step 4: Explore the Codebase

Use the Task tool with `subagent_type=code-explorer` to understand existing patterns and data structures:

1. **Architecture exploration**: Understand overall project structure, key directories, and conventions
2. **Domain exploration**: Find existing implementations similar to the project scope
3. **Data model exploration**: Identify relevant database tables, schemas, and relationships
4. **Integration points**: Discover APIs, services, and external dependencies

Launch multiple code-explorer agents in parallel for efficiency:
```
Task tool with subagent_type=code-xplorer
prompt: "Explore the <domain-area> implementation patterns in this codebase"
```


### Step 5: Identify Relevant Context Documentation

Use the conditional-docs-router sub-agent to identify relevant context:
```
Task tool with subagent_type=conditional-docs-router
prompt: "command: feature, task: <brief-summary-of-project>"
```

### Step 6: Read Suggested Context Documents

Read each context document suggested by the conditional-docs-router sub-agent to understand project patterns and constraints.

### Step 7: Conduct External Research (if needed)

For additional context, use research sub-agents:
- `subagent_type=perplexity-expert` - For best practices, industry patterns
- `subagent_type=context7-expert` - For library documentation

### Step 8: Create the Spec Document

Create the spec in a nested directory structure that will contain all related initiatives, features, and tasks:

```bash
# Create spec directory (initially with pending- prefix)
mkdir -p .ai/alpha/specs/pending-<project-slug>

# Create the spec document
# File: .ai/alpha/specs/pending-<project-slug>/spec.md
```

Fill in ALL sections from the template - no placeholders. Ensure decomposition hints provide clear starting points.

### Step 9: Create GitHub Issue

Create a GitHub issue for tracking:

```bash
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Spec: <project-name>" \
  --body "$(cat .ai/alpha/specs/pending-<project-slug>/spec.md)" \
  --label "type:spec" \
  --label "status:draft" \
  --label "alpha:spec"
```

### Step 10: Rename Spec Directory

After issue creation, rename the directory with the issue number:
```bash
mv .ai/alpha/specs/pending-<project-slug> .ai/alpha/specs/<issue-#>-<project-slug>
```

**Final structure:**
```
.ai/alpha/specs/<issue-#>-<project-slug>/
├── spec.md                    # The spec document
└── README.md                  # (Created later) Initiatives overview
```

## Pre-Spec Checklist

Before finalizing, verify:

- [ ] Problem statement is specific and quantified
- [ ] Success metrics are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Scope boundaries are explicit (in AND out)
- [ ] At least one primary persona with goals and pain points
- [ ] Technical constraints documented
- [ ] Key risks identified with owners
- [ ] Open questions captured for follow-up
- [ ] Decomposition hints provide clear initiative candidates

## Relevant Files

- `.ai/alpha/templates/spec.md` - Spec template (required)
- `.ai/alpha/specs/` - Root directory for all specs
- `README.md` - Project overview
- `CLAUDE.md` - Development patterns and conventions

## Validation Commands

After creating the spec, verify:

```bash
# Verify spec directory and file exist
test -d .ai/alpha/specs/<issue-#>-<project-slug> && echo "✓ Spec directory created"
test -s .ai/alpha/specs/<issue-#>-<project-slug>/spec.md && echo "✓ Spec file created"

# Verify GitHub issue was created
gh issue view <issue-#> --repo MLorneSmith/2025slideheroes

# Verify all required sections are present in spec
grep -E "^## [0-9]+\." .ai/alpha/specs/<issue-#>-<project-slug>/spec.md | wc -l
# Should return 11 (all 11 sections from template)
```

## Project Description

$ARGUMENTS

## Report

When complete, provide:

- **Summary**: Brief overview of the captured specification (2-3 sentences)
- **Spec Directory**: Path to `.ai/alpha/specs/<issue-#>-<project-slug>/`
- **Spec File**: Path to `.ai/alpha/specs/<issue-#>-<project-slug>/spec.md`
- **GitHub Issue**: Issue number and URL (e.g., `#123 - https://github.com/...`)
- **Key Decisions**: Major scope/design decisions made during the interview
- **Personas Identified**: Primary and secondary user personas
- **Risk Highlights**: Top 2-3 risks identified
- **Open Questions**: Unresolved items requiring follow-up
- **Next Step**: Command to run next: `/alpha:initiative-decompose <issue-#>`
