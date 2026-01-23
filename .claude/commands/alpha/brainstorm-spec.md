---
description: Brainstorm and design a spec input through guided conversation. Precedes /alpha:spec
argument-hint: [idea-or-topic]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, WebFetch, WebSearch, AskUserQuestion, Write]
---

# Alpha: Brainstorm Spec Input

Guide the user through a structured brainstorming session to create a well-formed input for `/alpha:spec`. This command helps clarify requirements, explore approaches, and document design decisions before formal spec creation.

## Context

The Alpha autonomous coding process:
1. **Brainstorm Spec** (this command) - Collaborative design session to clarify the idea
2. **Spec** - Capture formal project specification
3. **Initiatives** - Break spec into major initiatives
4. **Features** - Decompose each initiative into vertical slices
5. **Tasks** - Break features into atomic implementable tasks
6. **Implement** - Execute each task in a sandboxed environment

## Initial Topic

$ARGUMENTS

---

## Phase 1: Understand the Idea

### 1.1 Research External Context (If Applicable)

If the user's idea involves external services, libraries, or technologies:

1. Use WebFetch to retrieve documentation from provided URLs
2. Use WebSearch if you need to understand what a service/technology does
3. Summarize findings before proceeding with questions

### 1.2 Explore Existing Codebase

Use the Task tool with `subagent_type=code-explorer` to understand relevant existing patterns:

```
Task tool with subagent_type=code-explorer
prompt: "Explore [relevant area] in this codebase. Find:
1. Existing similar implementations
2. Patterns and conventions used
3. Integration points
4. Data structures and schemas
Return SPECIFIC FILE PATHS."
```

### 1.3 Conduct User Interview

Ask **4-6 questions**, one at a time, to understand the idea. Use AskUserQuestion with multiple choice options when possible.

**Question Categories:**

| Category | Sample Questions |
|----------|------------------|
| **Use Case** | "What's the primary use case?" (with 4-5 options based on research) |
| **Scope** | "What formats/inputs should be supported?" |
| **Data Model** | "How should data be scoped?" (user/team/both) |
| **UX Flow** | "Where in the flow should this happen?" |
| **Intelligence** | "How smart/automated should this be?" |
| **Constraints** | "What limits should we enforce?" |

**Interview Principles:**
- One question per message
- Prefer multiple choice (2-4 options) over open-ended
- Build each question on previous answers
- Listen for requirements mentioned in free-form responses
- 4-6 questions total (don't over-interview)

---

## Phase 2: Synthesize Design

### 2.1 Present Design Summary

After gathering requirements, present the design in a structured format:

```markdown
## Design Summary

Based on our conversation, here's what I'd recommend:

### Key Capabilities
1. [Capability 1] - [Brief description]
2. [Capability 2] - [Brief description]
3. [Capability 3] - [Brief description]

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Area 1] | [Choice] | [Why] |
| [Area 2] | [Choice] | [Why] |

### Constraints
- [Constraint 1]
- [Constraint 2]

### Out of Scope (v1)
- [Exclusion 1]
- [Exclusion 2]
```

### 2.2 Validate with User

Ask: "Does this capture your vision? Anything to adjust?"

Iterate until the user confirms the design.

---

## Phase 3: Create Spec Input

### 3.1 Generate Spec Input Text

Format the validated design as input for `/alpha:spec`:

```
[Project Name]

[1-2 sentence summary of what this project does]

KEY CAPABILITIES:
1. [Capability 1] - [Description with enough detail for spec author]
2. [Capability 2] - [Description]
3. [Capability 3] - [Description]

[OPTIONAL SECTION - Include if applicable]:
- CONSTRAINTS/LIMITS: [Any hard limits, quotas, or boundaries]
- INTEGRATION POINTS: [External services, APIs, SDKs]
- USER FLOW: [Step-by-step flow if UX-focused]
- DATA MODEL: [Key entities and relationships if data-focused]

OUT OF SCOPE:
- [Exclusion 1] (reason or deferral note)
- [Exclusion 2]
```

### 3.2 Save Design Document

Create the brainstorming report directory if needed:

```bash
mkdir -p .ai/reports/brainstorming
```

Write the design document:

```
File: .ai/reports/brainstorming/YYYY-MM-DD-<topic-slug>-design.md
```

**Document Structure:**

```markdown
# [Project Name] - Spec Input

**Date:** YYYY-MM-DD
**Status:** Ready for `/alpha:spec`

## Summary

[2-3 sentences describing the project]

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Decision 1] | [Choice] | [Why] |
| [Decision 2] | [Choice] | [Why] |

## Spec Input

Copy the text below and run: `/alpha:spec [Project Name]`

---

```
[Full spec input text here]
```

---

## Next Step

Run:
```bash
/alpha:spec [Project Name]
```

The spec command will interview you for remaining details (risks, personas, success metrics) and conduct research on the codebase and any external dependencies.
```

---

## Phase 4: Report

Provide a brief completion summary:

```markdown
## Brainstorming Complete

**Design Document:** `.ai/reports/brainstorming/YYYY-MM-DD-<topic-slug>-design.md`

**Key Decisions:**
- [Decision 1]: [Choice]
- [Decision 2]: [Choice]

**Next Step:** Run `/alpha:spec [Project Name]`
```

---

## Key Principles

- **One question at a time** - Don't overwhelm the user
- **Multiple choice preferred** - Easier to answer, faster iteration
- **Research first** - Understand external dependencies before asking questions
- **YAGNI ruthlessly** - Push back on scope creep, suggest v1 boundaries
- **Listen actively** - Capture requirements mentioned in free-form responses
- **Iterate design** - Present, validate, adjust until confirmed

---

## Example Session Flow

```
1. User: "use brainstorming to help me create a spec for integrating Ragie"
2. Agent: [Fetches Ragie docs, explores codebase]
3. Agent: "What's the primary use case?" [4 options based on research]
4. User: Selects option 3
5. Agent: "What file formats should be supported?" [4 options]
6. User: Selects option 4
7. Agent: "How should uploads be scoped?" [3 options]
8. User: Selects option 1
9. Agent: "Where should the upload UX live?" [4 options]
10. User: Selects option 4
11. Agent: "How intelligent should extraction be?" [4 options]
12. User: Provides nuanced answer combining options
13. Agent: [Presents design summary]
14. User: "Add upload limits"
15. Agent: [Updates design, presents again]
16. User: "Looks good, save it"
17. Agent: [Saves to .ai/reports/brainstorming/, provides next step]
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User's idea is vague | Start with WebSearch to understand the domain, then ask clarifying questions |
| User gives long free-form responses | Extract key requirements, confirm understanding, continue with focused questions |
| External service has no docs | Use WebSearch to find official documentation URL first |
| Design keeps changing | Summarize current state, ask "Is this the direction you want?" before continuing |
| User wants to skip to spec | Confirm minimum viable understanding, save abbreviated design doc |

---

## Relevant Files

- `.ai/reports/brainstorming/` - Output directory for design documents
- `.claude/commands/alpha/spec.md` - The spec command this prepares input for
- `.claude/skills/brainstorming/SKILL.md` - Core brainstorming methodology
