---
description: Orchestrate complete feature development lifecycle from research through implementation, review, and documentation with E2B sandbox isolation
argument-hint: [initiative-description]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Orchestrator

Orchestrate the complete lifecycle of a large feature initiative:
1. **Research** - Gather comprehensive knowledge about unfamiliar technologies
2. **Decomposition** - Break initiative into manageable features
3. **Planning** - Create detailed plans for each feature
4. **Implementation** - Execute plans in isolated E2B sandbox
5. **Review** - Validate implementations against specifications
6. **Documentation** - Capture knowledge for future reference

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    /initiative ORCHESTRATOR WORKFLOW                     │
│                                                                          │
│  LOCAL EXECUTION (Your machine)                                          │
│  ════════════════════════════════                                        │
│                                                                          │
│  /initiative "local-first architecture with RxDB encrypted sync"         │
│       │                                                                  │
│       │  ╔═══════════════════════════════════════════════════════════╗   │
│       │  ║  PHASE 1: INTERVIEW & RESEARCH (Local - Fast)             ║   │
│       │  ╚═══════════════════════════════════════════════════════════╝   │
│       │                                                                  │
│       ├─> Interview user (scope, technologies, constraints)              │
│       ├─> Launch research agents IN PARALLEL:                            │
│       │       • Task(perplexity-expert): Technology research             │
│       │       • Task(context7-expert): Library documentation             │
│       │       • Task(Explore): Codebase patterns                         │
│       ├─> Create research manifest: .ai/research/<slug>/manifest.md      │
│       ├─> [PROGRESS] Research complete ✓                                 │
│       │                                                                  │
│       │  ╔═══════════════════════════════════════════════════════════╗   │
│       │  ║  PHASE 2: DECOMPOSITION (Local)                           ║   │
│       │  ╚═══════════════════════════════════════════════════════════╝   │
│       │                                                                  │
│       ├─> Task(general-purpose): /initiative-feature-set                 │
│       │       • Load research manifest                                   │
│       │       • Decompose into features                                  │
│       │       • Create GitHub issues                                     │
│       │       • Return: feature list + dependency graph                  │
│       ├─> [PROGRESS] Decomposition: N features across M phases ✓         │
│       │                                                                  │
│       │  [GATE] ─────────────────────────────────────────────────────    │
│       │  │  User approves decomposition? (Y/n)                           │
│       │  └───────────────────────────────────────────────────────────    │
│       │                                                                  │
│  ═══════════════════════════════════════════════════════════════════════ │
│                                                                          │
│  E2B SANDBOX EXECUTION (Cloud - Isolated & Safe)                         │
│  ═══════════════════════════════════════════════                         │
│       │                                                                  │
│       │  ╔═══════════════════════════════════════════════════════════╗   │
│       │  ║  PHASE 3: FEATURE LOOP (in E2B sandbox)                   ║   │
│       │  ╚═══════════════════════════════════════════════════════════╝   │
│       │                                                                  │
│       ├─> Create sandbox from slideheroes-claude-agent template          │
│       ├─> Sync research manifest to sandbox                              │
│       │                                                                  │
│       │  FOR EACH feature (in dependency order):                         │
│       │                                                                  │
│       │    [PROGRESS] Feature M/N: <name>                                │
│       │                                                                  │
│       │    /initiative-feature #<issue> --manifest <path>                │
│       │         └─> Creates detailed implementation plan                 │
│       │                                                                  │
│       │    [GATE] ─────────────────────────────────────────────────────  │
│       │    │  User approves plan? (Y/n)                                  │
│       │    └───────────────────────────────────────────────────────────  │
│       │                                                                  │
│       │    /initiative-implement #<issue> --manifest <path>              │
│       │         └─> Implements feature + runs validations                │
│       │                                                                  │
│       │    Task(review-expert): "#<issue>"                               │
│       │         └─> Reviews implementation, returns JSON                 │
│       │                                                                  │
│       │    [GATE] ─────────────────────────────────────────────────────  │
│       │    │  Review passed? Fix blocking issues?                        │
│       │    └───────────────────────────────────────────────────────────  │
│       │                                                                  │
│       │    Task(documentation-expert, background): "#<issue>"            │
│       │         └─> Creates documentation                                │
│       │                                                                  │
│       │    [PROGRESS] Feature M/N complete ✓                             │
│       │                                                                  │
│       │  END FOR EACH                                                    │
│       │                                                                  │
│       │  ╔═══════════════════════════════════════════════════════════╗   │
│       │  ║  PHASE 4: COMPLETION                                      ║   │
│       │  ╚═══════════════════════════════════════════════════════════╝   │
│       │                                                                  │
│       ├─> Commit all changes in sandbox                                  │
│       ├─> Push branch to origin                                          │
│       ├─> Create PR                                                      │
│       ├─> Collect documentation-expert outputs                           │
│       ├─> Present command-profiles.yaml update suggestions               │
│       ├─> Close master feature-set issue                                 │
│       └─> [PROGRESS] Initiative complete: N/N features shipped ✓         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Instructions

### Phase 1: Interview & Research

#### Step 1.1: Parse Initiative Description

```typescript
const initiative = "$ARGUMENTS";
const slug = initiative
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .substring(0, 30);
```

#### Step 1.2: Interview User

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
//
// Example input: "local-first architecture with RxDB"
// Example generated question: "Should the local-first sync prioritize offline-first
// (data available immediately, syncs when online) or real-time collaboration
// (sync conflicts handled live)?"
//
// To generate the dynamic question:
// 1. Parse the initiative description: "${initiative}"
// 2. Identify ambiguous terms, unclear scope, or missing success criteria
// 3. Generate a targeted question that clarifies the most important ambiguity
// 4. Provide 2-4 options that represent distinct approaches or interpretations
{
  question: "<GENERATED: Analyze initiative description and create clarifying question>",
  header: "Clarify",
  options: [
    { label: "<Option 1>", description: "<Approach/interpretation 1>" },
    { label: "<Option 2>", description: "<Approach/interpretation 2>" }
    // Add more options as needed based on the initiative
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

#### Step 1.3: Launch Research Agents (PARALLEL)

**CRITICAL**: Launch all three research agents simultaneously for speed:

```typescript
// Launch all 3 agents in PARALLEL with a single message containing multiple Task calls
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
```

#### Step 1.4: Collect Research Results

Wait for all research agents to complete:

```typescript
// Get results from all background agents
const perplexityResults = AgentOutputTool(agentId: perplexityAgentId);
const context7Results = AgentOutputTool(agentId: context7AgentId);
const exploreResults = AgentOutputTool(agentId: exploreAgentId);
```

#### Step 1.5: Create Research Manifest

Create the research manifest directory and file:

```bash
mkdir -p .ai/research/<slug>
```

Write manifest using the template from `.ai/research/_templates/manifest-template.md`:

```markdown
# Research Manifest: <Initiative Name>

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | <initiative description> |
| **Technologies** | <from research> |
| **Research Date** | <today's date> |
| **GitHub Issue** | #<pending - will be updated> |
| **Status** | active |

## Research Reports
- [Perplexity Research](../../reports/research-reports/<date>/perplexity-<slug>.md)
- [Context7 Documentation](../../reports/research-reports/<date>/context7-<slug>.md)
- [Codebase Patterns](../../reports/research-reports/<date>/explore-<slug>.md)

## Key Findings Summary
<Synthesize findings from all three research agents>

### Technology Overview
<From perplexity-expert>

### Recommended Patterns
<From context7-expert code examples>

### Code Examples
<Key examples from context7-expert>

## Gotchas & Warnings
<Critical issues from perplexity-expert>

## Existing Codebase Patterns
<From Explore agent>

## Feature Mapping
<Will be populated after decomposition>
```

Save research reports:
```bash
mkdir -p .ai/reports/research-reports/<date>
# Save each agent's output as separate report
```

**[PROGRESS]** Research complete ✓

---

### Phase 2: Decomposition

#### Step 2.1: Run Feature-Set Decomposition

Delegate to /initiative-feature-set with research manifest:

```typescript
Task(general-purpose, prompt: `
  Execute the /initiative-feature-set command:

  /initiative-feature-set "${initiative}" --manifest .ai/research/${slug}/manifest.md

  This will:
  1. Load the research manifest
  2. Decompose the initiative into features
  3. Create GitHub issues (master + feature stubs)
  4. Return structured JSON with feature list and dependencies

  Return the JSON output for orchestrator consumption.
`)
```

#### Step 2.2: Parse Decomposition Results

Extract from the structured output:
- Master feature-set issue number
- Feature list with issue numbers
- Dependency graph
- Phase assignments

#### Step 2.3: Update Research Manifest

Update the manifest with feature mapping:

```markdown
## Feature Mapping
| Feature | Issue | Research Sections |
|---------|-------|-------------------|
| <feature-1> | #<n> | Technology Overview, Pattern 1 |
| <feature-2> | #<n> | Code Example 1, Gotcha 2 |
```

**[PROGRESS]** Decomposition complete: N features across M phases ✓

#### Step 2.4: User Approval Gate

```typescript
// Present decomposition summary and ask for approval
AskUserQuestion({
  question: "Approve this decomposition to proceed with planning and implementation?",
  header: "Approve",
  options: [
    { label: "Yes, proceed", description: "Start feature loop in E2B sandbox" },
    { label: "Modify scope", description: "Adjust feature boundaries" },
    { label: "Cancel", description: "Stop and review manually" }
  ]
})
```

**[GATE]** User approves decomposition? (Y/n)

---

### Phase 3: Feature Loop (E2B Sandbox)

#### Step 3.1: Create E2B Sandbox

```bash
# Create sandbox using the project's template
./.claude/skills/e2b-sandbox/scripts/sandbox create --timeout 3600
```

Capture sandbox ID for subsequent operations.

#### Step 3.2: Sync Research Manifest to Sandbox

```bash
# Copy manifest to sandbox
# The sandbox script handles file sync internally
```

#### Step 3.3: Feature Loop

Process features in dependency order (Phase 1 first, then Phase 2, etc.):

```typescript
for (const feature of features.sortedByDependency()) {
  // Check dependencies are complete
  if (!feature.dependenciesMet()) {
    // Handle blocked feature
    continue;
  }

  console.log(`[PROGRESS] Feature ${current}/${total}: ${feature.name}`);

  // === PLANNING ===
  const planResult = await runInSandbox(`
    /initiative-feature ${feature.issueNumber} --manifest ${manifestPath}
  `);

  // [GATE] User approves plan?
  const planApproval = await AskUserQuestion({
    question: `Approve plan for "${feature.name}"?`,
    header: "Plan",
    options: [
      { label: "Approve", description: "Proceed with implementation" },
      { label: "Revise", description: "Request changes to plan" },
      { label: "Skip", description: "Skip this feature for now" }
    ]
  });

  if (planApproval === "Skip") continue;
  if (planApproval === "Revise") {
    // Handle revision loop
  }

  // === IMPLEMENTATION ===
  const implResult = await runInSandbox(`
    /initiative-implement ${feature.issueNumber} --manifest ${manifestPath}
  `);

  // === REVIEW ===
  const reviewResult = await Task(review-expert, `${feature.issueNumber}`);

  // [GATE] Review passed?
  if (!reviewResult.success) {
    const reviewAction = await AskUserQuestion({
      question: `Review found blocking issues. How to proceed?`,
      header: "Review",
      options: [
        { label: "Fix issues", description: "Attempt to fix blocking issues" },
        { label: "Skip feature", description: "Mark as needs-work, continue" },
        { label: "Pause initiative", description: "Stop and review manually" }
      ]
    });
    // Handle based on choice
  }

  // === DOCUMENTATION (Background) ===
  Task(documentation-expert, `${feature.issueNumber}`, run_in_background: true);

  console.log(`[PROGRESS] Feature ${current}/${total} complete ✓`);
}
```

---

### Phase 4: Completion

#### Step 4.1: Commit and Push Changes

```bash
# In sandbox:
git add -A
git commit -m "feat(<scope>): implement <initiative-name>

<list of features implemented>

Closes #<master-issue>
Refs #<feature-1>, #<feature-2>, ...

[agent: initiative-orchestrator]
"

git push origin <branch-name>
```

#### Step 4.2: Create Pull Request

```bash
gh pr create \
  --title "feat: <initiative-name>" \
  --body "$(cat <<'EOF'
## Initiative: <name>

### Features Implemented
- [ ] #<feature-1>: <name>
- [ ] #<feature-2>: <name>
...

### Research Manifest
See `.ai/research/<slug>/manifest.md`

### Documentation Created
- <doc-1>
- <doc-2>

---
Generated by /initiative orchestrator
EOF
)"
```

#### Step 4.3: Collect Documentation Outputs

Wait for all documentation-expert background agents:

```typescript
const docResults = [];
for (const docAgentId of documentationAgentIds) {
  const result = await AgentOutputTool(agentId: docAgentId);
  docResults.push(result);
}
```

#### Step 4.4: Present Profile Update Suggestions

If documentation-expert agents suggested command-profiles.yaml updates:

```typescript
if (docResults.some(r => r.suggested_profile_updates?.length > 0)) {
  AskUserQuestion({
    question: "Apply suggested command-profiles.yaml updates?",
    header: "Updates",
    options: [
      { label: "Apply all", description: "Add all new keywords and files" },
      { label: "Review each", description: "Approve updates individually" },
      { label: "Skip", description: "Don't update profiles" }
    ]
  });
}
```

#### Step 4.5: Close Master Issue

```bash
gh issue close <master-issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --comment "Initiative complete: N/N features shipped. PR: #<pr-number>"
```

#### Step 4.6: Kill Sandbox

```bash
./.claude/skills/e2b-sandbox/scripts/sandbox kill <sandbox-id>
```

**[PROGRESS]** Initiative complete: N/N features shipped ✓

---

## Output Format

### Final Summary

```
## Initiative Complete

### Summary
- **Initiative**: <name>
- **Features shipped**: N/N
- **Master issue**: #<number> (closed)
- **PR created**: #<pr-number>

### Features
| # | Feature | Issue | Status |
|---|---------|-------|--------|
| 1 | <name> | #<n> | ✓ Complete |
| 2 | <name> | #<n> | ✓ Complete |

### Documentation Created
- <path-1>
- <path-2>

### Research Manifest
`.ai/research/<slug>/manifest.md`

### Profile Updates Applied
- Added keywords: <list>
- Added files: <list>

### Next Steps
1. Review PR: <url>
2. Merge when ready
3. Delete feature branch after merge
```

---

## Error Handling

### Research Failure
If research agents fail, proceed with available results and note gaps.

### Decomposition Failure
If feature-set fails, present error and allow manual decomposition.

### Implementation Failure
If implementation fails with validation errors:
1. Present error details
2. Offer options: retry, skip, or pause

### Review Blocking Issues
If review finds blockers:
1. Show issues with severity
2. Offer: fix, skip, or pause

### Sandbox Timeout
If sandbox times out:
1. Save work state
2. Offer: resume in new sandbox or pause

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/initiative-feature-set` | Decompose initiative into features |
| `/initiative-feature` | Create detailed plan for a feature |
| `/initiative-implement` | Execute a feature plan |
| `/feature-set` | Standalone decomposition (no orchestrator) |
| `/feature` | Standalone feature planning |
| `/implement` | Standalone implementation |
| `/sandbox` | Manual sandbox operations |

## Related Agents

| Agent | Purpose |
|-------|---------|
| `review-expert` | Delegated implementation review |
| `documentation-expert` | Delegated documentation creation |
| `perplexity-expert` | Web research for technologies |
| `context7-expert` | Library documentation lookup |
| `Explore` | Codebase pattern exploration |

---

## Initiative Input

$ARGUMENTS
