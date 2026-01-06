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

### Step 4: Conduct Research

#### Step 4.1: Explore the Codebase

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

#### Step 4.2: Create Spec Directory Structure

**BEFORE launching research agents**, create the spec directory to store research artifacts:

```bash
# Create spec directory with research-library (MUST run before research agents)
mkdir -p .ai/alpha/specs/pending-Spec-<project-slug>/research-library
```

This ensures research agents have a destination for their findings.

#### Step 4.3: Conduct External Research

Identify gaps in your understanding after codebase exploration. Use research sub-agents to fill knowledge gaps:

**When to use each sub-agent:**

| Gap Type | Sub-Agent | Example Queries |
|----------|-----------|-----------------|
| Library/Framework docs | `alpha-context7` | "How does Next.js App Router handle streaming?" |
| Best practices | `alpha-perplexity` | "Best practices for real-time dashboards 2025" |
| Industry patterns | `alpha-perplexity` | "How do SaaS platforms implement activity feeds?" |
| API documentation | `alpha-context7` | "Supabase RLS policies for multi-tenant apps" |
| Integration guides | `alpha-context7` | "Cal.com embed SDK usage" |

**Launch research agents in parallel:**

```
Task tool with subagent_type=alpha-context7
prompt: |
  SPEC_DIR: .ai/alpha/specs/pending-Spec-<project-slug>
  Research: [Library/framework documentation needed]
  Topics: [specific topics to investigate]
  Save findings to: ${SPEC_DIR}/research-library/
```

```
Task tool with subagent_type=alpha-perplexity
prompt: |
  SPEC_DIR: .ai/alpha/specs/pending-Spec-<project-slug>
  Research: [Best practices or industry patterns needed]
  Questions: [specific questions to answer]
  Save findings to: ${SPEC_DIR}/research-library/
```

**Research triggers** (launch research if any apply):
- [ ] Using a library/framework not yet in the codebase
- [ ] Implementing a pattern with no existing examples
- [ ] Integrating with an external service
- [ ] Unclear on best practices for the domain
- [ ] Technical approach has multiple valid options

### Step 5: Identify Relevant Context Documentation

Use the conditional-docs-router sub-agent to identify relevant context:
```
Task tool with subagent_type=conditional-docs-router
prompt: "command: feature, task: <brief-summary-of-project>"
```

### Step 6: Read Suggested Context Documents

**CRITICAL**: You MUST read each context document returned by the conditional-docs-router.

The router returns file paths in the format:
- `development/architecture-overview.md`
- `development/shadcn-ui-components.md`
- etc.

**For each file path returned**, use the Read tool:
```
Read tool with file_path: .ai/ai_docs/context-docs/<path-from-router>
```

**Example**: If router returns `development/react-query-patterns.md`, read:
```
.ai/ai_docs/context-docs/development/react-query-patterns.md
```

Read ALL suggested files (typically 3-7 files) to understand:
- Architectural patterns and conventions
- Component library usage
- Data fetching strategies
- Testing approaches
- Integration patterns

**Do NOT skip this step** - these documents contain critical project-specific guidance.

### Step 7: Conduct Additional External Research (if needed)

After reading context documents, if knowledge gaps remain, conduct additional targeted research:

**Gap Assessment Checklist:**
- [ ] Do I understand all technical constraints?
- [ ] Do I know the recommended patterns for this domain?
- [ ] Do I have documentation for all proposed libraries?
- [ ] Do I understand integration requirements with external services?

**If gaps remain, launch additional research:**

```
Task tool with subagent_type=alpha-context7
prompt: |
  SPEC_DIR: .ai/alpha/specs/pending-Spec-<project-slug>
  Research: [Specific library documentation gap]
  Context: After reading context docs, I still need clarity on [specific topic]
  Save findings to: ${SPEC_DIR}/research-library/
```

```
Task tool with subagent_type=alpha-perplexity
prompt: |
  SPEC_DIR: .ai/alpha/specs/pending-Spec-<project-slug>
  Research: [Specific best practice or pattern gap]
  Context: After reading context docs, I need industry guidance on [specific topic]
  Save findings to: ${SPEC_DIR}/research-library/
```

**Note**: All research from Steps 4.3 and 7 is saved to `${SPEC_DIR}/research-library/` and will be incorporated into the spec in Step 8.

### Step 8: Read Research Library

**CRITICAL**: Before creating the spec, you MUST read all research files saved by the research agents.

```bash
# List all research files
ls -la ${SPEC_DIR}/research-library/
```

**For each file in research-library/**, use the Read tool:
```
Read tool with file_path: ${SPEC_DIR}/research-library/<filename>.md
```

These files contain valuable external research (Cal.com integration patterns, dashboard design best practices, etc.) that should inform the spec document. Extract key findings and incorporate them into:
- Section 7 (Technical Context) - integration patterns, API details
- Section 5 (Solution Overview) - design patterns and best practices
- Section 11 (Appendices) - reference the research files

**Do NOT skip this step** - the research agents gathered information you need.

### Step 9: Create the Spec Document

Write the spec document to the directory created in Step 4.2:

```bash
# Spec directory already exists from Step 4.2
# Write the spec document to:
# File: .ai/alpha/specs/pending-Spec-<project-slug>/spec.md
```

Fill in ALL sections from the template - no placeholders. Ensure decomposition hints provide clear starting points.

### Step 10: Create GitHub Issue

Create a GitHub issue for tracking:

```bash
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Spec: <project-name>" \
  --body "$(cat .ai/alpha/specs/pending-Spec-<project-slug>/spec.md)" \
  --label "type:spec" \
  --label "status:draft" \
  --label "alpha:spec"
```

### Step 11: Rename Spec Directory

After issue creation, rename the directory with the issue number:
```bash
mv .ai/alpha/specs/pending-Spec-<project-slug> .ai/alpha/specs/<issue-#>-Spec-<project-slug>
```

**Final structure:**
```
.ai/alpha/specs/<issue-#>-Spec-<project-slug>/
├── spec.md                    # The spec document
├── research-library/          # Research artifacts from sub-agents
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
test -d .ai/alpha/specs/<issue-#>-Spec-<project-slug> && echo "✓ Spec directory created"
test -s .ai/alpha/specs/<issue-#>-Spec-<project-slug>/spec.md && echo "✓ Spec file created"
test -d .ai/alpha/specs/<issue-#>-Spec-<project-slug>/research-library && echo "✓ Research library created"

# Verify GitHub issue was created
gh issue view <issue-#> --repo MLorneSmith/2025slideheroes

# Verify all required sections are present in spec
grep -E "^## [0-9]+\." .ai/alpha/specs/<issue-#>-Spec-<project-slug>/spec.md | wc -l
# Should return 11 (all 11 sections from template)
```

## Project Description

$ARGUMENTS

## Report

When complete, provide:

- **Summary**: Brief overview of the captured specification (2-3 sentences)
- **Spec Directory**: Path to `.ai/alpha/specs/<issue-#>-Spec-<project-slug>/`
- **Spec File**: Path to `.ai/alpha/specs/<issue-#>-Spec-<project-slug>/spec.md`
- **GitHub Issue**: Issue number and URL (e.g., `#123 - https://github.com/...`)
- **Key Decisions**: Major scope/design decisions made during the interview
- **Personas Identified**: Primary and secondary user personas
- **Risk Highlights**: Top 2-3 risks identified
- **Open Questions**: Unresolved items requiring follow-up
- **Next Step**: Command to run next: `/alpha:initiative-decompose <issue-#>`
