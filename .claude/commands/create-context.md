---
description: Create a new context documentation file based on a topic provided by the user. Interviews user, researches topic, creates context file, and updates command-profiles.yaml
argument-hint: [topic-name]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, Edit, Write, AskUserQuestion, SlashCommand]
---

# Create Context Documentation

Create a new context documentation file in `.ai/ai_docs/context-docs/` following the established format and patterns. This command interviews the user, researches the topic using multiple sources, creates the documentation, and updates the routing configuration.

## Instructions

IMPORTANT: You're creating a context documentation file that will be used by the conditional documentation routing system to provide relevant context for future tasks.

### Step 1: Interview the User

Use the `AskUserQuestion` tool to gather information about the context documentation they want to create:

**Questions to ask:**

1. **Topic Name**: What is the primary topic? (e.g., "React Query", "Docker Setup", "E2E Testing")

2. **Category**: Which category does this belong to?
   - `development` - Code patterns, architecture, frameworks, libraries
   - `infrastructure` - DevOps, deployment, authentication, databases
   - `testing+quality` - Testing strategies, quality assurance, CI/CD

3. **Purpose**: What problem does this documentation solve? Who will use it?

4. **Key Concepts**: What are 3-5 key concepts or areas this documentation should cover?

5. **Topic Type**: Is this topic primarily:
   - `external` - External libraries, frameworks, APIs, or industry standards (benefits from web research)
   - `internal` - Project-specific patterns, architecture, or conventions (no external research needed)
   - `hybrid` - Combines external technologies with project-specific implementation (selective research)

6. **Related Topics**: What existing topics does this relate to? (auth, database, UI, testing, etc.)

7. **Priority**: When should this documentation be loaded?
   - `high` - Load whenever keywords match (critical reference)
   - `medium` - Load for relevant tasks (common reference)
   - `low` - Load only when specifically needed (specialized reference)

### Step 2: Parse User Data

From the interview responses, define the following variables:

```typescript
const topicTitle = '[Human readable title]'; // e.g., "React Query Patterns"
const topicId = '[kebab-case-id]'; // e.g., "react-query-patterns"
const category = '[development|infrastructure|testing+quality]';
const topicType = '[external|internal|hybrid]'; // Determines if research is needed
const description = '[One-line description for frontmatter]';
const tags = ['tag1', 'tag2', 'tag3']; // Keywords for discovery
const relatedTopics = ['existing-topic-1', 'existing-topic-2']; // For cross-references
const priority = '[high|medium|low]';
const keywords = ['keyword1', 'keyword2']; // For command-profiles.yaml routing
```

### Step 3: Load Related Context Documentation

Use the conditional documentation system to find related existing context files:

```bash
# This helps identify patterns and potential cross-references
slashCommand /conditional_docs feature "[topic name and related concepts]"
```

Read the suggested documents to:
- Understand the format and depth expected
- Identify potential cross-references
- Avoid duplicating existing content
- Find dependencies this doc should reference

### Step 4: Research the Topic (Conditional)

**IMPORTANT**: External research is only valuable for certain topic types. Use the `topicType` from Step 2 to determine what research is needed.

#### When to Research

| Topic Type | Research Approach |
|------------|-------------------|
| `external` | **Full research** - Launch all three research agents in parallel |
| `hybrid` | **Selective research** - Use Context7 for library docs + Perplexity for best practices |
| `internal` | **Skip research** - Proceed directly to Step 5 (codebase exploration) |

**Examples by Topic Type:**

- **External**: React Query, Tailwind CSS, Stripe API, OAuth2, WebSocket protocols
- **Internal**: Project file organization, team coding conventions, custom hooks architecture, deployment workflow
- **Hybrid**: "How we use Supabase RLS", "Our React Query patterns", "Authentication implementation"

#### 4a. If `topicType === 'internal'`: Skip to Step 5

No external research needed. The documentation will be based entirely on codebase exploration and team knowledge.

#### 4b. If `topicType === 'external'` or `topicType === 'hybrid'`: Launch Research Agents

Launch research agents in PARALLEL using the Task tool:

##### Context7 Expert (for library/framework documentation)

**Use when**: `topicType === 'external'` OR `topicType === 'hybrid'`

```typescript
Task({
  subagent_type: "context7-expert",
  prompt: `Research documentation for [topic].

  Focus on:
  - Official documentation and API references
  - Best practices and recommended patterns
  - Configuration options and examples
  - Common pitfalls and solutions

  Return a structured summary with code examples where relevant.`
})
```

##### Perplexity Expert (for real-time technical research)

**Use when**: `topicType === 'external'` OR `topicType === 'hybrid'`

```typescript
Task({
  subagent_type: "perplexity-expert",
  prompt: `Research current best practices for [topic] in 2025.

  Focus on:
  - Latest version features and changes
  - Community-recommended patterns
  - Performance considerations
  - Security best practices

  Provide citations and sources for key information.`
})
```

##### Exa Expert (for technical content discovery)

**Use when**: `topicType === 'external'` ONLY (skip for hybrid topics)

```typescript
Task({
  subagent_type: "exa-expert",
  prompt: `Find high-quality technical resources about [topic].

  Search for:
  - Technical blog posts with implementation details
  - GitHub repositories with examples
  - Stack Overflow solutions for common issues
  - Conference talks or technical deep-dives

  Return summaries of the most valuable resources found.`
})
```

### Step 5: Explore Existing Codebase (Conditional)

**IMPORTANT**: If the topic relates to patterns, technologies, or conventions used in this codebase, explore the existing implementation before writing documentation.

#### When to Explore

Explore the codebase when the topic involves:
- **Code patterns** (e.g., server actions, data fetching, component structure)
- **Project conventions** (e.g., file organization, naming, error handling)
- **Integrations** (e.g., Supabase, Payload CMS, authentication)
- **Infrastructure** (e.g., Docker setup, CI/CD, deployment)
- **Testing patterns** (e.g., E2E setup, mocking strategies)

Skip codebase exploration when the topic is:
- Purely external (e.g., general TypeScript features, React concepts)
- Not yet implemented in the project
- Theoretical/conceptual documentation

#### How to Explore

Use the Task tool with the `Explore` agent to search the codebase:

```typescript
Task({
  subagent_type: "Explore",
  prompt: `Explore the SlideHeroes codebase for [topic] implementations and patterns.

  Search for:
  1. **Existing implementations**: Find files that implement or use [topic]
  2. **Patterns and conventions**: Identify how [topic] is typically used in this project
  3. **Configuration**: Find any config files related to [topic]
  4. **Examples**: Locate good examples that could be referenced in documentation

  Specific searches to perform:
  - Search for imports/usage of [related libraries or keywords]
  - Find files in relevant directories (apps/web, packages/*, etc.)
  - Look for type definitions related to [topic]
  - Check for existing tests that demonstrate usage

  Return:
  - List of relevant files with their purposes
  - Code snippets showing project-specific patterns
  - Any conventions or standards observed
  - Gaps or inconsistencies that documentation should address

  Thoroughness: medium`
})
```

#### What to Document from Exploration

From the codebase exploration, capture:

1. **File Locations**: Where this topic is implemented
   ```
   - apps/web/app/api/... - API routes
   - packages/features/... - Feature implementations
   - apps/web/lib/... - Utility functions
   ```

2. **Project-Specific Patterns**: How the team has implemented this
   ```typescript
   // Example from codebase showing the pattern
   ```

3. **Conventions Observed**: Naming, structure, error handling
   - File naming convention
   - Function/component patterns
   - Error handling approach

4. **Integration Points**: How this connects to other parts of the system
   - Dependencies it uses
   - What depends on it
   - Configuration requirements

5. **Gaps Identified**: Areas that need documentation
   - Undocumented patterns
   - Inconsistent implementations
   - Missing error handling

Use these findings to populate the "SlideHeroes-Specific Patterns" section of the context file.

### Step 6: Create the Context File

Create the context documentation file in the appropriate category directory.

**File Location**: `.ai/ai_docs/context-docs/[category]/[topic-id].md`

**File Format**:

```md
---
# Identity
id: "[topic-id]"
title: "[Topic Title]"
version: "1.0.0"
category: "[pattern|implementation|standards|reference]"

# Discovery
description: "[One-line description]"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]

# Relationships
dependencies: ["related-id-1", "related-id-2"]
cross_references:
  - id: "[related-doc-id]"
    type: "related"
    description: "[How it relates]"
  - id: "[prereq-doc-id]"
    type: "prerequisite"
    description: "[Why it's a prerequisite]"

# Maintenance
created: "[YYYY-MM-DD]"
last_updated: "[YYYY-MM-DD]"
author: "create-context"
---

# [Topic Title]

## Overview

[2-3 paragraph introduction covering:
- What this topic is about
- Why it's important for the SlideHeroes project
- Key benefits or capabilities]

## Key Concepts

### [Concept 1]

[Explanation with code examples if applicable]

### [Concept 2]

[Explanation with code examples if applicable]

### [Concept 3]

[Explanation with code examples if applicable]

## Implementation Details

### [Implementation Area 1]

```typescript
// Code example showing the pattern
```

### [Implementation Area 2]

```typescript
// Code example showing the pattern
```

## Best Practices

- **[Practice 1]**: [Explanation]
- **[Practice 2]**: [Explanation]
- **[Practice 3]**: [Explanation]

## Common Pitfalls

### [Pitfall 1]

**Problem**: [Description of the issue]

**Solution**: [How to avoid or fix it]

### [Pitfall 2]

**Problem**: [Description of the issue]

**Solution**: [How to avoid or fix it]

## SlideHeroes-Specific Patterns

[Document any project-specific implementations, conventions, or patterns related to this topic]

## Related Documentation

- [Link to related internal docs]
- [Link to external resources]

## Quick Reference

[Cheat sheet or quick lookup table for common operations]
```

### Step 7: Update Command Profiles

Update `.claude/config/command-profiles.yaml` to include routing rules for the new context documentation.

**Add to relevant command profiles** (implement, diagnose, feature, chore, bug-plan):

1. Read the current command-profiles.yaml
2. For each relevant profile, add a new rule:

```yaml
# Add under the appropriate profile's rules section
- keywords: ["keyword1", "keyword2", "keyword3"]
  files:
    - "[category]/[topic-id].md"
  priority: [high|medium|low]
```

**Guidelines for which profiles to update:**

- `implement`: If doc helps with implementation tasks
- `diagnose`: If doc helps troubleshoot issues
- `feature`: If doc helps plan new features
- `chore`: If doc helps with maintenance tasks
- `bug-plan`: If doc helps plan bug fixes

Use the Edit tool to add the new rules to command-profiles.yaml.

### Step 8: Validate the Context File

After creating the file:

1. **Verify frontmatter** is valid YAML
2. **Check file exists** at the correct path
3. **Test routing** by running:
   ```bash
   slashCommand /conditional_docs implement "[topic keywords]"
   ```
4. **Verify** the new file appears in the routing results

## Topic

$ARGUMENTS

## Category Types Reference

| Category | Subcategory Type | Use For |
|----------|-----------------|---------|
| `development` | `pattern` | Code patterns, conventions |
| `development` | `implementation` | How-to guides, tutorials |
| `development` | `reference` | API docs, specifications |
| `infrastructure` | `implementation` | Setup guides, configuration |
| `infrastructure` | `standards` | Security policies, best practices |
| `testing+quality` | `standards` | Testing strategies, quality gates |
| `testing+quality` | `implementation` | Testing frameworks, tooling |

## Existing Context Files Reference

**Development:**
- `architecture-overview.md` - System architecture
- `database-patterns.md` - RLS, migrations, type-safety
- `server-actions.md` - API patterns, validation
- `react-query-patterns.md` - Data fetching, caching
- `react-query-advanced.md` - Infinite queries, real-time
- `shadcn-ui-components.md` - Component library
- `makerkit-integration.md` - Template patterns

**Infrastructure:**
- `auth-overview.md` - Authentication system
- `auth-implementation.md` - Auth code patterns
- `auth-security.md` - Security model
- `auth-configuration.md` - Environment setup
- `auth-troubleshooting.md` - Common auth issues
- `docker-setup.md` - Container architecture
- `docker-troubleshooting.md` - Container diagnostics
- `vercel-deployment.md` - Deployment guide
- `database-seeding.md` - Seeding strategies
- `enhanced-logger.md` - Logging system
- `ci-cd-complete.md` - CI/CD pipeline
- `production-security.md` - Security best practices
- `e2b-sandbox.md` - E2B cloud sandboxes

**Testing+Quality:**
- `fundamentals.md` - Core testing principles
- `e2e-testing.md` - Playwright E2E patterns
- `integration-testing.md` - Integration test strategies
- `accessibility-testing.md` - A11y testing guide
- `performance-testing.md` - Performance metrics
- `vitest-configuration.md` - Vitest setup

## Report

When complete, report:

1. **File Created**: Path to the new context documentation file
2. **Category**: Which category the file was placed in
3. **Topic Type**: `external`, `internal`, or `hybrid`
4. **Routing Updated**: Which command profiles were updated
5. **Keywords Added**: List of keywords that will trigger this documentation
6. **Cross-References**: Which existing docs this new doc references
7. **Codebase Exploration**: Summary of project-specific patterns found (if applicable)
8. **Research Sources**: Summary of what was learned from each research agent (or "Skipped - internal topic" if not applicable)

**Example 1: External topic (full research)**

```
## Context Documentation Created

**File**: `.ai/ai_docs/context-docs/development/websocket-patterns.md`
**Category**: development
**Topic Type**: external
**Type**: implementation

### Routing Configuration Updated

Added to command-profiles.yaml:
- `implement`: keywords ["websocket", "realtime", "socket", "ws"]
- `feature`: keywords ["websocket", "realtime", "live updates"]
- `diagnose`: keywords ["websocket", "connection", "socket error"]

### Cross-References
- `react-query-advanced.md` (related: real-time data)
- `server-actions.md` (prerequisite: server-side patterns)

### Codebase Exploration Summary
- Found existing WebSocket implementation in `packages/features/realtime/`
- Identified pattern: uses Socket.io client with React context provider
- Documented 3 project-specific conventions for connection handling
- Added code examples from `apps/web/lib/socket-client.ts`

### Research Summary
- **Context7**: Found official Socket.io docs, React integration patterns
- **Perplexity**: 2025 best practices for WebSocket in Next.js
- **Exa**: Found 3 high-quality blog posts on scaling WebSockets
```

**Example 2: Internal topic (no external research)**

```
## Context Documentation Created

**File**: `.ai/ai_docs/context-docs/development/project-file-organization.md`
**Category**: development
**Topic Type**: internal
**Type**: pattern

### Routing Configuration Updated

Added to command-profiles.yaml:
- `implement`: keywords ["file structure", "organization", "directory"]
- `feature`: keywords ["new feature", "where to put", "file location"]

### Cross-References
- `architecture-overview.md` (prerequisite: system architecture)
- `server-actions.md` (related: action file placement)

### Codebase Exploration Summary
- Documented route structure in `apps/web/app/`
- Identified patterns: `_components/`, `_lib/`, `_lib/server/`
- Found 15 examples of feature-specific component directories
- Catalogued naming conventions across 8 package types

### Research Summary
- Skipped - internal topic (project-specific conventions only)
```
