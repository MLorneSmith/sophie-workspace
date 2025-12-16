---
description: Conduct research phase for /initiative orchestrator - interviews user, launches research agents, creates manifest
argument-hint: [initiative-description] [--quick]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Research Sub-Agent

Handles Phase 1 (Interview & Research) of the `/initiative` workflow. This sub-agent:
1. Parses the initiative description and flags
2. Interviews the user to gather context
3. Launches research agents (full or quick mode)
4. Collects and synthesizes research results
5. Creates the research manifest
6. Returns structured JSON output for the orchestrator

## Why This Exists

The research phase involves launching multiple background agents and collecting their outputs, which consumes significant context. By delegating this to a sub-agent, the main orchestrator preserves context for the decomposition and implementation phases.

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

console.log(`📋 Initiative: ${initiative}`);
console.log(`📁 Slug: ${slug}`);
console.log(`📅 Date: ${todayDate}`);
console.log(`🚀 Mode: ${quickMode ? 'QUICK' : 'FULL'}`);
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
```

### Step 3: Launch Research Agents

**Mode determines which research agents to launch:**

```typescript
if (quickMode) {
  // QUICK MODE: Only explore codebase, skip external research
  console.log("🚀 QUICK MODE: Launching codebase exploration only");

  Task(Explore, prompt: `
    Explore this codebase for patterns relevant to: ${initiative}
    Focus on:
    - Similar implementations
    - Data fetching patterns
    - State management approaches
    - Testing patterns
    Return file paths and pattern descriptions.
  `, run_in_background: true)

} else {
  // FULL MODE: Launch all three research agents simultaneously
  console.log("📚 FULL MODE: Launching all research agents in parallel");

  Task(perplexity-expert, prompt: `
    Research best practices for: ${initiative}
    Focus on:
    - Implementation patterns for 2024-2025
    - Common pitfalls and gotchas
    - Security considerations
    - Performance optimizations
    Return structured findings.
  `, run_in_background: true)

  Task(context7-expert, prompt: `
    Get comprehensive documentation for libraries involved in: ${initiative}
    Focus on:
    - API references and examples
    - Migration guides if applicable
    - TypeScript integration
    - React/Next.js patterns
    Return key code examples.
  `, run_in_background: true)

  Task(Explore, prompt: `
    Explore this codebase for patterns relevant to: ${initiative}
    Focus on:
    - Similar implementations
    - Data fetching patterns
    - State management approaches
    - Testing patterns
    Return file paths and pattern descriptions.
  `, run_in_background: true)
}
```

### Step 4: Collect Research Results

Wait for research agents to complete:

```typescript
if (quickMode) {
  // QUICK MODE: Only collect Explore results
  const exploreResults = TaskOutput(agentId: exploreAgentId);
  const perplexityResults = null;
  const context7Results = null;

  console.log("🚀 QUICK MODE: Codebase exploration complete");

} else {
  // FULL MODE: Collect all three results
  const perplexityResults = TaskOutput(agentId: perplexityAgentId);
  const context7Results = TaskOutput(agentId: context7AgentId);
  const exploreResults = TaskOutput(agentId: exploreAgentId);

  console.log("📚 FULL MODE: All research complete");
}
```

### Step 5: Create Research Manifest

Create the initiative directory:

```bash
mkdir -p .ai/reports/feature-reports/<date>/<slug>/research
```

**Synthesize research into manifest.** This is the key value-add of this sub-agent - distilling research into actionable summary.

Write manifest file using Write tool:

**Full Mode Manifest:**

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
<Synthesized from perplexity-expert - 3-5 bullet points>

### Recommended Patterns
<Synthesized from context7-expert - key patterns with brief explanations>

### Code Examples
<2-3 most relevant code examples from context7-expert>

### Gotchas & Warnings
<Critical issues from perplexity-expert - bulleted list>

### Existing Codebase Patterns
<Synthesized from Explore agent - relevant files and patterns>

## Feature Mapping
<Will be populated after decomposition>
```

**Quick Mode Manifest:**

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

⚠️ **Quick Mode**: External research (Perplexity, Context7) was skipped.
Decomposition is based on codebase patterns only.

## Existing Codebase Patterns
<Synthesized from Explore agent - relevant files and patterns>

## Feature Mapping
<Will be populated after decomposition>
```

Save individual research reports:

```bash
# Save each agent's full output to research subdirectory
# Example: .ai/reports/feature-reports/2024-12-16/local-first-rxdb/research/perplexity-local-first-rxdb.md
```

### Step 6: Return Structured Output

**CRITICAL**: Return structured JSON for orchestrator consumption.

```json
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
```

## Output Requirements

The sub-agent MUST output:

1. **Structured JSON** (for orchestrator parsing) - output at the END
2. **Progress messages** (for user visibility) - output during execution

### Progress Messages Format

```
[RESEARCH] Starting initiative research...
[RESEARCH] Mode: FULL|QUICK
[RESEARCH] Interviewing user...
[RESEARCH] Launching research agents...
[RESEARCH] Waiting for agents to complete...
[RESEARCH] Synthesizing research results...
[RESEARCH] Creating manifest...
[RESEARCH] ✓ Research phase complete
```

### JSON Output Format

Output the JSON block at the very end, clearly marked:

```
=== RESEARCH OUTPUT ===
{
  "success": true,
  ...
}
=== END RESEARCH OUTPUT ===
```

## Error Handling

If any research agent fails:
- Continue with available results
- Note the failure in the manifest
- Set `success: true` if manifest was created (even with partial results)
- Set `success: false` only if manifest creation failed

## Initiative Input

$ARGUMENTS
