---
description: Conduct research phase for /initiative orchestrator - interviews user, launches research tools, creates manifest
argument-hint: [initiative-description] [--quick]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Research Sub-Agent

Handles Phase 1 (Interview & Research) of the `/initiative` workflow. This sub-agent:
1. Parses the initiative description and flags
2. Interviews the user to gather context
3. Executes research using CLI tools (full or quick mode)
4. Collects and synthesizes research results
5. Creates the research manifest
6. Returns structured JSON output for the orchestrator

## Why This Exists

The research phase involves multiple research operations and collecting outputs, which consumes significant context. By delegating this to a sub-agent, the main orchestrator preserves context for the decomposition and implementation phases.

## Research Tools Quick Reference

| Tool | Use For | How to Use |
|------|---------|------------|
| **Context7** | Library documentation, API references | `Bash: .ai/bin/context7-get-context <owner> <repo> --topic "<topic>" --tokens 2500` |
| **Perplexity Chat** | Best practices, Q&A with citations | `Bash: .ai/bin/perplexity-chat "<question>" --model sonar-pro --show-citations` |
| **Perplexity Search** | Find specific resources | `Bash: .ai/bin/perplexity-search "<query>" --domains <d1,d2> --num-results 10` |
| **Explore Agent** | Codebase pattern discovery | `Task(Explore, prompt: "...")` |

**IMPORTANT - Tool Restrictions**:
- ✅ Use direct Bash commands for Context7 and Perplexity (NOT Task agents)
- ✅ Task(Explore) works because it's a first-level agent call from this sub-agent
- ❌ Do NOT use `Task(perplexity-expert)` or `Task(context7-expert)` - agents within agents don't work
- ❌ Do NOT use `docs-mcp` or any MCP-based research tools (mcp__docs-mcp__*) - they are unreliable in this context
- ❌ Do NOT use WebFetch or WebSearch for research - use the CLI tools above instead

## Instructions

### Step 1: Parse Arguments

```typescript
const args = "$ARGUMENTS";
const quickMode = args.includes('--quick');
const initiative = args.replace('--quick', '').trim();
const slug = initiative
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .substring(0, 30);
const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

console.log(`[RESEARCH] Starting initiative research...`);
console.log(`[RESEARCH] Initiative: ${initiative}`);
console.log(`[RESEARCH] Slug: ${slug}`);
console.log(`[RESEARCH] Date: ${todayDate}`);
console.log(`[RESEARCH] Mode: ${quickMode ? 'QUICK' : 'FULL'}`);
```

### Step 2: Interview User

Use AskUserQuestion to gather context:

```typescript
// Question 1: Technologies
{
  question: "What technologies or libraries are involved in this initiative?",
  header: "Technologies",
  options: [
    { label: "Specify in next question", description: "I'll describe the technologies" },
    { label: "Research needed", description: "I'm not sure, please research" }
  ]
}

// Question 2: Dynamic Clarification (GENERATE FROM INITIATIVE DESCRIPTION)
// Analyze the initiative description and generate a context-aware clarifying question.
// The question should help understand, flesh out, and define:
// - Ambiguous terms or scope
// - Key decision points that affect implementation
// - Expected outcomes or success criteria
// - Technical trade-offs that need resolution
{
  question: "<GENERATED: Analyze initiative description and create clarifying question>",
  header: "Clarify",
  options: [
    { label: "<Option 1>", description: "<Approach/interpretation 1>" },
    { label: "<Option 2>", description: "<Approach/interpretation 2>" }
  ]
}

// Question 3: Feature count expectation
{
  question: "How many features do you expect this initiative to produce?",
  header: "Size",
  options: [
    { label: "Small (1-3 features)", description: "Focused initiative" },
    { label: "Medium (4-7 features)", description: "Standard initiative" },
    { label: "Large (8+ features)", description: "Complex initiative" }
  ]
}
```

Capture interview results:
```typescript
const interviewResults = {
  technologies: "<user response>",
  clarification: "<user response>",
  expectedSize: "<user response>"
};

console.log(`[RESEARCH] Interview complete`);
```

### Step 3: Create Report Directory

**CRITICAL**: Create the directory structure FIRST before any research.

```bash
# Create directory structure
mkdir -p .ai/reports/feature-reports/$(date +%Y-%m-%d)/<slug>/research
```

Use the Bash tool to create this directory with the actual slug value.

### Step 4: Execute Research

**Mode determines research approach:**

#### QUICK MODE

```typescript
if (quickMode) {
  console.log("[RESEARCH] QUICK MODE: Launching codebase exploration only");

  // Only run Explore agent for codebase patterns
  Task(Explore, prompt: `
    Explore this codebase for patterns relevant to: ${initiative}

    Focus on:
    - Similar implementations (components, pages, features)
    - Data fetching patterns (loaders, server actions, React Query)
    - State management approaches
    - UI component patterns (shadcn/ui usage)
    - Testing patterns

    Return:
    1. File paths with brief descriptions
    2. Pattern summaries
    3. Recommended approaches based on existing code
  `)

  // Save explore results
  // Use Write tool to save to: .ai/reports/feature-reports/<date>/<slug>/research/explore-<slug>.md
}
```

#### FULL MODE

```typescript
if (!quickMode) {
  console.log("[RESEARCH] FULL MODE: Executing research tools");

  // Step 4a: Identify libraries to research based on interview
  // Extract library names from user's technology response
  // Common mappings:
  // - "shadcn charts" → owner: "shadcn", repo: "ui", topic: "charts"
  // - "recharts" → owner: "recharts", repo: "recharts"
  // - "react query" → owner: "TanStack", repo: "query"
  // - "supabase" → owner: "supabase", repo: "supabase-js"
  // - "next.js" → owner: "vercel", repo: "next.js"

  // Step 4b: Run Context7 for library documentation
  // Execute 1-3 Context7 calls based on identified libraries
  console.log("[RESEARCH] Fetching library documentation via Context7...");

  // Example Context7 calls (adapt based on initiative):
  Bash(command: `.ai/bin/context7-get-context <owner> <repo> --topic "<relevant-topic>" --tokens 3000`)

  // Save Context7 results using Write tool to:
  // .ai/reports/feature-reports/<date>/<slug>/research/context7-<slug>.md

  // Step 4c: Run Perplexity for best practices
  console.log("[RESEARCH] Researching best practices via Perplexity...");

  Bash(command: `.ai/bin/perplexity-chat "Best practices for ${initiative} in Next.js 15 with TypeScript. Focus on: 1) Implementation patterns 2) Common pitfalls 3) Performance considerations 4) Security best practices" --model sonar-pro --show-citations`)

  // Save Perplexity results using Write tool to:
  // .ai/reports/feature-reports/<date>/<slug>/research/perplexity-<slug>.md

  // Step 4d: Run Explore agent for codebase patterns
  console.log("[RESEARCH] Exploring codebase patterns...");

  Task(Explore, prompt: `
    Explore this codebase for patterns relevant to: ${initiative}

    Focus on:
    - Similar implementations (components, pages, features)
    - Data fetching patterns (loaders, server actions, React Query)
    - State management approaches
    - UI component patterns (shadcn/ui usage)
    - Database schema patterns
    - Testing patterns

    Return:
    1. File paths with brief descriptions
    2. Pattern summaries with code snippets
    3. Recommended approaches based on existing code
  `)

  // Save explore results using Write tool to:
  // .ai/reports/feature-reports/<date>/<slug>/research/explore-<slug>.md

  console.log("[RESEARCH] All research complete");
}
```

### Step 5: Synthesize Research into Manifest

**This is the key value-add** - distilling research into an actionable summary.

Read all research reports and synthesize into a manifest:

**Full Mode Manifest Template:**

```markdown
# Research Manifest: <Initiative Name>

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | <initiative description> |
| **Mode** | full |
| **Technologies** | <from interview + research> |
| **Research Date** | <today's date> |
| **GitHub Issue** | #<pending - will be updated> |
| **Status** | active |

## Interview Summary
- **Technologies**: <from Question 1>
- **Clarification**: <from Question 2>
- **Expected Size**: <from Question 3>

## Research Reports
- [Perplexity Research](./research/perplexity-<slug>.md)
- [Context7 Documentation](./research/context7-<slug>.md)
- [Codebase Patterns](./research/explore-<slug>.md)

## Key Findings Summary

### Technology Overview
<Synthesized from Perplexity - 3-5 bullet points on recommended approach>

### Recommended Patterns
<Synthesized from Context7 - key patterns with brief explanations>

### Code Examples
<2-3 most relevant code examples from Context7 or codebase>

### Gotchas & Warnings
<Critical issues from Perplexity - bulleted list by severity>

### Existing Codebase Patterns
<Synthesized from Explore agent - relevant files and patterns>

| Pattern | Location | Relevance |
|---------|----------|-----------|
| <pattern name> | <file path> | <why relevant> |

## Feature Mapping
<Will be populated after decomposition>

## Dependencies & Prerequisites
<List any prerequisites identified during research>

## Security Considerations
<Security-related findings from research>

## Performance Considerations
<Performance-related findings from research>
```

**Quick Mode Manifest Template:**

```markdown
# Research Manifest: <Initiative Name>

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | <initiative description> |
| **Mode** | quick |
| **Technologies** | <inferred from codebase> |
| **Research Date** | <today's date> |
| **GitHub Issue** | #<pending - will be updated> |
| **Status** | active |

## Interview Summary
- **Technologies**: <from Question 1>
- **Clarification**: <from Question 2>
- **Expected Size**: <from Question 3>

## Research Reports
- [Codebase Patterns](./research/explore-<slug>.md)

> **Quick Mode**: External research (Perplexity, Context7) was skipped.
> Decomposition is based on codebase patterns only.

## Existing Codebase Patterns
<Synthesized from Explore agent - relevant files and patterns>

| Pattern | Location | Relevance |
|---------|----------|-----------|
| <pattern name> | <file path> | <why relevant> |

## Feature Mapping
<Will be populated after decomposition>
```

Write manifest using Write tool to: `.ai/reports/feature-reports/<date>/<slug>/manifest.md`

### Step 6: Return Structured Output

**CRITICAL**: Return structured JSON for orchestrator consumption.

```
[RESEARCH] Synthesizing research results...
[RESEARCH] Creating manifest...
[RESEARCH] ✓ Research phase complete
```

Output the JSON block at the very end, clearly marked:

```
=== RESEARCH OUTPUT ===
{
  "success": true,
  "initiative": {
    "title": "<Initiative Name>",
    "slug": "<slug>",
    "description": "<initiative description>"
  },
  "mode": "full|quick",
  "date": "<YYYY-MM-DD>",
  "manifest_path": ".ai/reports/feature-reports/<date>/<slug>/manifest.md",
  "research_dir": ".ai/reports/feature-reports/<date>/<slug>/research/",
  "interview": {
    "technologies": "<user response>",
    "clarification": "<user response>",
    "expected_size": "<user response>"
  },
  "research_summary": {
    "technology_overview": "<2-3 sentence summary>",
    "key_patterns": ["<pattern 1>", "<pattern 2>"],
    "gotchas": ["<gotcha 1>", "<gotcha 2>"],
    "relevant_files": ["<file 1>", "<file 2>"]
  }
}
=== END RESEARCH OUTPUT ===
```

## Context7 Library Reference

Common library mappings for Context7:

| Technology | Owner | Repo | Common Topics |
|------------|-------|------|---------------|
| Next.js | vercel | next.js | routing, server-actions, middleware, caching |
| React | facebook | react | hooks, state, components, context |
| Recharts | recharts | recharts | charts, radar, radial, bar |
| shadcn/ui | shadcn | ui | components, charts, forms |
| TanStack Query | TanStack | query | queries, mutations, caching |
| Supabase JS | supabase | supabase-js | auth, database, storage, rls |
| Tailwind CSS | tailwindlabs | tailwindcss | utilities, responsive, dark-mode |
| Zod | colinhacks | zod | schemas, validation, inference |

## Error Handling

If any research tool fails:
- Continue with available results
- Note the failure in the manifest under a "Research Gaps" section
- Set `success: true` if manifest was created (even with partial results)
- Set `success: false` only if manifest creation failed

```typescript
if (context7Failed) {
  // Add to manifest:
  // ## Research Gaps
  // - Context7 documentation fetch failed: <error message>
  // - Recommendation: Manually review library docs at <url>
}
```

## Initiative Input

$ARGUMENTS
