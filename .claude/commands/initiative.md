---
description: Orchestrate complete feature development lifecycle from research through implementation, review, and documentation with E2B sandbox isolation
argument-hint: [initiative-description] [--quick]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Orchestrator

Orchestrate the complete lifecycle of a large feature initiative:
1. **Research** - Gather comprehensive knowledge about technologies (delegated to `initiative-research` agent)
2. **Decomposition** - Break initiative into features (delegated to `initiative-decomposition` agent)
3. **Planning** - Create detailed plans for each feature
4. **Implementation** - Execute plans in isolated E2B sandbox
5. **Review** - Validate implementations against specifications
6. **Documentation** - Capture knowledge for future reference

## Flags

| Flag | Description |
|------|-------------|
| `--quick` | Skip external research (Perplexity, Context7). Use codebase patterns only. |

## Architecture

```
/initiative (this orchestrator)
    │
    ├── [Phase 1] Task(initiative-research) ──> manifest.md
    │       └── Uses: Context7, Perplexity, Explore agent
    │
    ├── [Phase 2] Task(initiative-decomposition) ──> feature list + GitHub issues
    │       └── Uses: Research manifest, creates dependency graph
    │
    ├── [Phase 3] E2B Sandbox Loop
    │       └── For each feature: plan → implement → review → commit
    │
    └── [Phase 4] Completion
            └── PR creation, issue closure, documentation collection
```

## State Variables

Track these throughout execution:

| Variable | Set In | Description |
|----------|--------|-------------|
| `slug` | Step 1.1 | Initiative slug (kebab-case, max 30 chars) |
| `todayDate` | Step 1.1 | Today's date (YYYY-MM-DD) |
| `quickMode` | Step 1.1 | true if --quick flag passed |
| `manifestPath` | Phase 1 | Path to research manifest |
| `masterIssueNumber` | Phase 2 | GitHub issue number for feature-set |
| `featureIssues[]` | Phase 2 | Array of feature issue numbers |
| `sandboxId` | Phase 3 | E2B sandbox ID |
| `branchName` | Phase 3 | Feature branch name |
| `prNumber` | Phase 4 | Pull request number |

---

## Phase 1: Interview & Research

### Step 1.1: Parse Arguments

```typescript
const args = "$ARGUMENTS";
const quickMode = args.includes('--quick');
const initiative = args.replace('--quick', '').trim();
const slug = initiative.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
const todayDate = new Date().toISOString().split('T')[0];
```

### Step 1.2: Interview User (DIRECT - Do Not Delegate)

**CRITICAL**: Conduct interview directly in orchestrator. User interaction is unreliable in sub-agents.

Ask these questions using AskUserQuestion:

1. **Technologies**: "What technologies or libraries are involved?"
   - Options: "Specify below", "Research needed"

2. **Clarifying Question**: Generate based on initiative description
   - Identify ambiguous terms or key decisions
   - Options: Context-specific choices

3. **Expected Size**: "How many features do you expect?"
   - Options: "Small (1-3)", "Medium (4-7)", "Large (8+)"

Capture responses:
```typescript
const interviewResults = {
  technologies: "<response>",
  clarification: "<response>",
  expectedSize: "<response>"
};
```

### Step 1.3: Delegate Research to Sub-Agent

**USE TASK TOOL** with `initiative-research` subagent type:

```typescript
Task(initiative-research, prompt: `
{
  "initiative": "${initiative}",
  "slug": "${slug}",
  "date": "${todayDate}",
  "mode": "${quickMode ? 'quick' : 'full'}",
  "interview": {
    "technologies": "${interviewResults.technologies}",
    "clarification": "${interviewResults.clarification}",
    "expectedSize": "${interviewResults.expectedSize}"
  }
}
`)
```

**DO NOT use SlashCommand** - it expands inline and defeats context preservation.

### Step 1.4: Parse Research Output

Look for JSON block in agent output:
```
=== RESEARCH OUTPUT ===
{ ... }
=== END RESEARCH OUTPUT ===
```

Extract:
- `manifestPath` from `manifest_path`
- `researchSummary` from `research_summary`

### Step 1.5: Validate Research

- [ ] `success: true` in output
- [ ] Manifest file exists at `manifestPath`
- [ ] Research reports exist in research directory

**[PROGRESS]** Research complete ✓

---

## Phase 2: Decomposition

### Step 2.1: Delegate Decomposition (Dry-Run)

**USE TASK TOOL** with `initiative-decomposition` subagent type:

```typescript
Task(initiative-decomposition, prompt: `
{
  "initiative": "${initiative}",
  "slug": "${slug}",
  "date": "${todayDate}",
  "manifest_path": "${manifestPath}",
  "create_issues": false
}
`)
```

### Step 2.2: Parse Decomposition Output

Look for JSON block:
```
=== DECOMPOSITION OUTPUT ===
{ ... }
=== END DECOMPOSITION OUTPUT ===
```

Extract:
- Feature list with phases and dependencies
- Plan file path
- Dependency graph

### Step 2.3: User Approval Gate

Present decomposition summary, then ask:

```typescript
AskUserQuestion({
  question: "Approve this decomposition? GitHub issues will be created if you proceed.",
  header: "Approve",
  options: [
    { label: "Yes, create issues", description: "Create GitHub issues and proceed" },
    { label: "Modify scope", description: "Adjust feature boundaries" },
    { label: "Cancel", description: "Stop without creating issues" }
  ]
})
```

**If "Cancel"**: Stop. No GitHub issues created.
**If "Modify scope"**: Discuss changes, re-run decomposition.
**If "Yes"**: Proceed to create issues.

### Step 2.4: Create GitHub Issues (DIRECT - After Approval)

**Execute GitHub operations DIRECTLY in orchestrator**. Do NOT delegate to Task().

```bash
# Create master issue
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: ${initiative}" \
  --body-file .ai/specs/feature-sets/${slug}/pending-overview.md \
  --label "type:feature-set" \
  --label "status:planning"

# Capture issue number, rename file
MASTER_ISSUE=<from-output>
mv .ai/specs/feature-sets/${slug}/pending-overview.md \
   .ai/specs/feature-sets/${slug}/${MASTER_ISSUE}-overview.md

# Create feature stub issues (loop)
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature: <name>" \
  --body "<stub-body>" \
  --label "type:feature" \
  --label "status:blocked"
```

**[PROGRESS]** Decomposition complete: N features across M phases ✓

---

## Phase 3: Feature Loop (E2B Sandbox)

### Step 3.0: Sandbox Assertion

**BLOCKING**: E2B sandbox is required for implementation.

```typescript
AskUserQuestion({
  question: "E2B Sandbox is required for Phase 3. How to proceed?",
  header: "Sandbox",
  options: [
    { label: "Create sandbox", description: "Recommended: Create E2B sandbox" },
    { label: "SKIP (unsafe)", description: "Run locally without isolation" },
    { label: "Abort", description: "Stop initiative" }
  ]
})
```

### Step 3.1: Create E2B Sandbox

```bash
./.claude/skills/e2b-sandbox/scripts/sandbox create \
  --template slideheroes-claude-agent --timeout 3600
```

Capture `sandboxId` from output.

### Step 3.2: Create Feature Branch (In Sandbox)

```bash
./.claude/skills/e2b-sandbox/scripts/sandbox run-claude \
  "git checkout -b feature/${slug} && git push -u origin feature/${slug}" \
  --sandbox ${sandboxId}
```

### Step 3.3: Feature Loop

**For EACH feature (in dependency order):**

#### 3.3.1: Generate Plan
```bash
./sandbox run-claude "/initiative-feature #<issue> --manifest ${manifestPath}" \
  --sandbox ${sandboxId}
```

#### 3.3.2: User Approval
Display plan summary, ask for approval.

#### 3.3.3: Implement
```bash
./sandbox run-claude "/initiative-implement #<issue> --manifest ${manifestPath}" \
  --sandbox ${sandboxId}
```

#### 3.3.4: Review
```bash
./sandbox run-claude "/review #<issue>" --sandbox ${sandboxId}
```

#### 3.3.5: Commit
```bash
./sandbox run-claude "/commit initiative-orchestrator feat <scope>" \
  --sandbox ${sandboxId}
```

#### 3.3.6: Progress
```
[PROGRESS] Feature X/N: <name> ✓ COMPLETE
```

---

## Phase 4: Completion

### Step 4.1: Push Changes
```bash
# In sandbox
git push origin feature/${slug}
```

### Step 4.2: Create Pull Request (DIRECT)
```bash
gh pr create \
  --title "feat: ${initiative}" \
  --body "## Initiative: ${initiative}

### Features Implemented
<feature-list>

### Research Manifest
.ai/reports/feature-reports/${todayDate}/${slug}/manifest.md

---
Generated by /initiative orchestrator"
```

### Step 4.3: Close Master Issue (DIRECT)
```bash
gh issue close ${masterIssueNumber} \
  --repo MLorneSmith/2025slideheroes \
  --comment "Initiative complete: N/N features. PR: #${prNumber}"
```

### Step 4.4: Kill Sandbox
```bash
./sandbox kill ${sandboxId}
```

**[PROGRESS]** Initiative complete: N/N features shipped ✓

---

## Final Summary Template

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

### Research Manifest
.ai/reports/feature-reports/<date>/<slug>/manifest.md

### Next Steps
1. Review PR: <url>
2. Merge when ready
```

---

## Related Agents

| Agent | Purpose | Invocation |
|-------|---------|------------|
| `initiative-research` | Research phase | `Task(initiative-research, prompt: "{json}")` |
| `initiative-decomposition` | Decomposition phase | `Task(initiative-decomposition, prompt: "{json}")` |
| `review-expert` | Implementation review | `Task(review-expert, prompt: "#<issue>")` |
| `documentation-expert` | Documentation creation | `Task(documentation-expert, prompt: "#<issue>")` |
| `Explore` | Codebase exploration | `Task(Explore, prompt: "...")` |

## Related Commands

| Command | Purpose |
|---------|---------|
| `/initiative-feature` | Create detailed plan for a feature |
| `/initiative-implement` | Execute a feature plan |
| `/review` | Review implementation |

---

## Initiative Input

$ARGUMENTS
