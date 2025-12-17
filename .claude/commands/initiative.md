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
3. **Planning** - Create detailed plans for each feature (local agents for context preservation)
4. **Implementation** - Execute plans in isolated E2B sandbox
5. **Completion** - Create PR, close issues, cleanup

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
    │       └── User approval gate
    │
    ├── [Phase 3] Feature Planning Loop (LOCAL - context preservation)
    │       └── For each feature: Task(general-purpose) with /initiative-feature
    │       └── Creates detailed plans in GitHub issues
    │       └── User approval gate (all plans ready)
    │
    ├── [Phase 4] Implementation Loop (E2B SANDBOX - isolation)
    │       └── Create sandbox ONCE for all features
    │       └── For each feature: run-claude "/implement #<issue>"
    │       └── User review gate per feature
    │       └── Commit and unblock dependents
    │
    └── [Phase 5] Completion
            └── Push changes, create PR, close issues, kill sandbox
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
| `sandboxId` | Phase 4 | E2B sandbox ID |
| `branchName` | Phase 4 | Feature branch name |
| `prNumber` | Phase 5 | Pull request number |

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

**[PROGRESS]** Phase 1 complete: Research gathered ✓

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

**IMPORTANT: Issue Number Prefix Convention**

After creating the master issue, rename all directories to include the issue number prefix.

```bash
# Step 1: Create master issue FIRST
MASTER_ISSUE=$(gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: ${initiative}" \
  --body-file .ai/specs/feature-sets/${slug}/pending-overview.md \
  --label "type:feature-set" \
  --label "status:planning" \
  | grep -oE '[0-9]+$')

echo "Created master issue: #${MASTER_ISSUE}"

# Step 2: Rename directories with issue number prefix
if [ -d ".ai/specs/feature-sets/${slug}" ]; then
  mv ".ai/specs/feature-sets/${slug}" ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}"
fi

if [ -d ".ai/reports/feature-reports/${todayDate}/${slug}" ]; then
  mv ".ai/reports/feature-reports/${todayDate}/${slug}" \
     ".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}"
fi

# Step 3: Update file references
mv ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/pending-overview.md" \
   ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/${MASTER_ISSUE}-overview.md"

# Step 4: Create feature stub issues
# Features with no dependencies start as "status:ready"
# Features with dependencies start as "status:blocked"
for feature in features; do
  if [ -z "${feature_dependencies[$feature]}" ]; then
    INITIAL_STATUS="status:ready"
  else
    INITIAL_STATUS="status:blocked"
  fi

  FEATURE_ISSUE=$(gh issue create \
    --repo MLorneSmith/2025slideheroes \
    --title "Feature: <name>" \
    --body "<stub-body with parent ref #${MASTER_ISSUE}>" \
    --label "type:feature" \
    --label "${INITIAL_STATUS}" \
    | grep -oE '[0-9]+$')

  featureIssues+=($FEATURE_ISSUE)
done

# Step 5: Update manifest path
manifestPath=".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}/manifest.md"
```

**[PROGRESS]** Phase 2 complete: N features decomposed, GitHub issues created ✓

---

## Phase 3: Feature Planning (LOCAL)

**WHY LOCAL**: Planning happens locally (not in sandbox) because:
1. No code is written - just markdown plans
2. Context preservation - agents retain research manifest
3. User interaction works reliably (fails in sandbox)
4. Faster - no sandbox startup overhead
5. GitHub CLI is already authenticated locally

### Step 3.1: Plan Each Feature

**For EACH feature (in dependency order):**

```typescript
// Use general-purpose agent to run /initiative-feature command
Task(general-purpose, prompt: `
Run the /initiative-feature command to create a detailed plan for feature #${featureIssue}.

Command: /initiative-feature ${featureIssue} --manifest ${manifestPath}

This will:
1. Fetch the feature stub from GitHub
2. Load the research manifest for context
3. Create a detailed implementation plan
4. Update the GitHub issue with the plan
5. Mark the issue as "status:planned"

After completion, return the JSON output from the command.
`)
```

Parse output for:
- `success: true` - Planning succeeded
- `plan.file_path` - Location of detailed plan file
- `github_updated: true` - GitHub issue updated

**If planning fails**: Log error, ask user whether to retry or skip.

### Step 3.2: User Approval Gate (All Plans)

After ALL features are planned, present summary:

```typescript
AskUserQuestion({
  question: `All ${featureCount} feature plans created. Review plans in GitHub issues.\n\nProceed to implementation?`,
  header: "Approve Plans",
  options: [
    { label: "Yes, start implementation", description: "Create E2B sandbox and begin coding" },
    { label: "Revise plans", description: "I need to update some plans first" },
    { label: "Abort", description: "Stop here - plans are created, can resume later" }
  ]
})
```

**If "Abort"**: Stop. Plans exist in GitHub issues for later implementation.
**If "Revise plans"**: Allow user to make changes, then re-confirm.
**If "Yes"**: Proceed to sandbox implementation.

**[PROGRESS]** Phase 3 complete: All feature plans created and approved ✓

---

## Phase 4: Implementation (E2B SANDBOX)

### Constants

```typescript
const SANDBOX_CLI = ".claude/skills/e2b-sandbox/scripts/sandbox";
```

### Step 4.0: Verify Prerequisites

Before creating sandbox, verify environment:

```bash
# Check E2B API key
if [ -z "$E2B_API_KEY" ]; then
  echo "ERROR: E2B_API_KEY not set"
  exit 1
fi

# Check GitHub token for sandbox
if [ -z "$GITHUB_TOKEN" ] && [ -z "$GH_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN or GH_TOKEN not set (needed for sandbox git operations)"
  exit 1
fi

# Check template exists
${SANDBOX_CLI} templates 2>/dev/null | grep -q "slideheroes-claude-agent" || {
  echo "ERROR: E2B template 'slideheroes-claude-agent' not found"
  echo "Rebuild template with: pnpm e2b:build:prod"
  exit 1
}
```

**If prerequisites fail**: Output error with fix instructions and stop.

### Step 4.1: Create Sandbox

```bash
${SANDBOX_CLI} create --template slideheroes-claude-agent --timeout 3600
```

Capture `sandboxId` from output (e.g., `ikm4xe1i9bh19b5dlasoq`).

### Step 4.2: Create Feature Branch

```bash
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git fetch origin && git checkout dev && git pull origin dev && git checkout -b feature/${masterIssueNumber}-${slug} && git push -u origin feature/${masterIssueNumber}-${slug}"
```

**IMPORTANT**: Commands must specify the project directory (`/home/user/project`).

### Step 4.3: Implementation Loop

**For EACH feature (in dependency order):**

#### 4.3.1: Implement Feature

Run `/implement` in the sandbox:

```bash
${SANDBOX_CLI} run-claude "/implement #${featureIssue}" --sandbox ${sandboxId}
```

Parse output for:
- `success: true` - Implementation succeeded
- Validation results
- Files changed

**If implementation fails**: Log error, ask user whether to retry or skip.

#### 4.3.2: User Review Gate

After implementation, get the dev server URL:

```bash
# Start dev server in sandbox (background)
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && pnpm dev &" --timeout 30000

# Get the public URL for port 3000
${SANDBOX_CLI} url ${sandboxId} 3000
```

Present to user:

```typescript
AskUserQuestion({
  question: `Feature #${featureIssue} implemented. Review at dev URL above.\n\nApprove implementation?`,
  header: "Review",
  options: [
    { label: "Approve", description: "Implementation looks good, continue to commit" },
    { label: "Request changes", description: "Describe what needs fixing" },
    { label: "Skip feature", description: "Move to next feature without committing" }
  ]
})
```

**If "Approve"**: Commit changes.
**If "Request changes"**: Capture feedback, run additional implementation, loop back.
**If "Skip feature"**: Revert changes: `${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git checkout ."`

#### 4.3.3: Commit Feature

```bash
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git add -A && git commit -m 'feat(<scope>): <feature-description>

Part of #${masterIssueNumber}
Implements #${featureIssue}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>'"
```

#### 4.3.4: Unblock Dependent Features

Update dependent features from `status:blocked` to `status:ready`:

```bash
# For each feature that depends on the completed feature
for dependent_issue in ${dependents_of_completed_feature}; do
  # Check if ALL dependencies are complete
  all_deps_complete=true
  for dep in ${dependencies_of[$dependent_issue]}; do
    if ! is_complete($dep); then
      all_deps_complete=false
      break
    fi
  done

  if [ "$all_deps_complete" = true ]; then
    gh issue edit ${dependent_issue} \
      --repo MLorneSmith/2025slideheroes \
      --add-label "status:ready" \
      --remove-label "status:blocked"
  fi
done
```

#### 4.3.5: Progress

```
[PROGRESS] Feature X/N: <name> ✓ COMPLETE
```

### Step 4.4: Push All Changes

After all features are committed:

```bash
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && git push origin feature/${masterIssueNumber}-${slug}"
```

**[PROGRESS]** Phase 4 complete: All features implemented ✓

---

## Phase 5: Completion

### Step 5.1: Create Pull Request (DIRECT)

Execute directly in orchestrator (not in sandbox):

```bash
gh pr create \
  --repo MLorneSmith/2025slideheroes \
  --title "feat: ${initiative}" \
  --body "## Initiative: ${initiative}

### Features Implemented
$(for issue in ${featureIssues}; do echo "- #${issue}"; done)

### Parent Issue
Closes #${masterIssueNumber}

### Research Manifest
.ai/reports/feature-reports/${todayDate}/${masterIssueNumber}-${slug}/manifest.md

---
🤖 Generated by /initiative orchestrator"
```

Capture `prNumber` from output.

### Step 5.2: Update Master Issue

```bash
gh issue comment ${masterIssueNumber} \
  --repo MLorneSmith/2025slideheroes \
  --body "## Implementation Complete

PR created: #${prNumber}

### Features Implemented
| Feature | Issue | Status |
|---------|-------|--------|
$(for i, issue in enumerate(featureIssues); do echo "| Feature $i | #${issue} | ✓ |"; done)

🤖 Generated by /initiative orchestrator"
```

### Step 5.3: Kill Sandbox

```bash
${SANDBOX_CLI} kill ${sandboxId}
```

**[PROGRESS]** Phase 5 complete: Initiative finished ✓

---

## Final Summary Template

```
## Initiative Complete

### Summary
- **Initiative**: <name>
- **Features shipped**: N/N
- **Master issue**: #<number>
- **PR created**: #<pr-number>

### Features
| # | Feature | Issue | Status |
|---|---------|-------|--------|
| 1 | <name> | #<n> | ✓ Complete |

### Research Manifest
.ai/reports/feature-reports/<date>/<issue#>-<slug>/manifest.md

### Next Steps
1. Review PR: <url>
2. Merge when ready
```

---

## Error Recovery

### Sandbox Creation Fails

```
ERROR: E2B sandbox creation failed

Possible causes:
1. E2B_API_KEY not set or invalid
2. Template 'slideheroes-claude-agent' not found
3. E2B service unavailable

Fix: Rebuild template with `pnpm e2b:build:prod` (requires GITHUB_TOKEN)

For individual features, use:
  /feature #<issue>   → Create plan
  /implement #<issue> → Execute plan
```

### GitHub Auth Missing in Sandbox

```
ERROR: GitHub operations failing in sandbox

The sandbox needs GH_TOKEN to push changes.
Ensure GITHUB_TOKEN or GH_TOKEN is set in your environment before running /initiative.
```

---

## Related Agents

| Agent | Purpose | Phase |
|-------|---------|-------|
| `initiative-research` | Research phase | 1 |
| `initiative-decomposition` | Decomposition phase | 2 |
| `general-purpose` | Run /initiative-feature for planning | 3 |
| `Explore` | Codebase exploration | 1, 3 |

## Related Commands

| Command | Purpose | Environment |
|---------|---------|-------------|
| `/initiative-feature` | Create detailed plan using research manifest | Local |
| `/sandbox/initiative-implement` | Execute plan with manifest context | E2B Sandbox |
| `/feature` | Standalone feature planning | Local |
| `/implement` | Standalone implementation | Local |

---

## Initiative Input

$ARGUMENTS
