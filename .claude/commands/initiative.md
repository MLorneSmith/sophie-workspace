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

**IMPORTANT: Issue Number Prefix Convention**

After creating the master issue, rename all directories to include the issue number prefix.
This ensures consistent organization and easy navigation.

```bash
# Step 1: Create master issue FIRST (before renaming directories)
MASTER_ISSUE=$(gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: ${initiative}" \
  --body-file .ai/specs/feature-sets/${slug}/pending-overview.md \
  --label "type:feature-set" \
  --label "status:planning" \
  | grep -oE '[0-9]+$')

echo "Created master issue: #${MASTER_ISSUE}"

# Step 2: Rename directories with issue number prefix
# Feature specs directory
if [ -d ".ai/specs/feature-sets/${slug}" ]; then
  mv ".ai/specs/feature-sets/${slug}" ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}"
  echo "Renamed specs dir: ${MASTER_ISSUE}-${slug}"
fi

# Feature reports directory (same date)
if [ -d ".ai/reports/feature-reports/${todayDate}/${slug}" ]; then
  mv ".ai/reports/feature-reports/${todayDate}/${slug}" \
     ".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}"
  echo "Renamed reports dir: ${MASTER_ISSUE}-${slug}"
fi

# Step 3: Update file references inside renamed directories
mv ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/pending-overview.md" \
   ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/${MASTER_ISSUE}-overview.md"

# Step 4: Create feature stub issues with smart initial status
# Features with no dependencies start as "status:ready"
# Features with dependencies start as "status:blocked"
for feature in features; do
  # Determine initial status based on dependencies
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

  echo "Created feature issue: #${FEATURE_ISSUE} (${INITIAL_STATUS})"
  featureIssues+=($FEATURE_ISSUE)
done

# Step 5: Update manifest path variable to use new directory name
manifestPath=".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}/manifest.md"
```

**Final Directory Structure:**
```
.ai/specs/feature-sets/
└── <issue#>-<slug>/          # e.g., 1165-user-dashboard-home/
    ├── <issue#>-overview.md
    └── dependency-graph.md

.ai/reports/feature-reports/YYYY-MM-DD/
└── <issue#>-<slug>/          # e.g., 1165-user-dashboard-home/
    ├── manifest.md
    └── research/
```

**[PROGRESS]** Decomposition complete: N features across M phases ✓

---

## Phase 3: Feature Loop (E2B Sandbox or Local)

### Constants

Define sandbox CLI path at the start of Phase 3:
```typescript
const SANDBOX_CLI = ".claude/skills/e2b-sandbox/scripts/sandbox";
```

### Step 3.0: Sandbox Selection

```typescript
AskUserQuestion({
  question: "Implementation requires code changes. Where should changes be made?",
  header: "Environment",
  options: [
    { label: "E2B Sandbox (Recommended)", description: "Isolated cloud environment - changes are safe to experiment" },
    { label: "Local (Direct)", description: "Changes made directly to your working directory" },
    { label: "Abort", description: "Stop initiative - issues are created, can resume later" }
  ]
})
```

**If "Abort"**: Stop. GitHub issues are created and can be implemented later.

---

### Path A: E2B Sandbox Mode

#### Step 3.1: Create Sandbox

```bash
${SANDBOX_CLI} create --template slideheroes-claude-agent --timeout 3600
```

Capture `sandboxId` from output (e.g., `ikm4xe1i9bh19b5dlasoq`).

#### Step 3.2: Create Feature Branch

Use the `exec` command to run git commands directly in the sandbox:

```bash
${SANDBOX_CLI} exec ${sandboxId} "git fetch origin && git checkout dev && git pull origin dev && git checkout -b feature/${masterIssueNumber}-${slug} && git push -u origin feature/${masterIssueNumber}-${slug}"
```

**Note**: Use `exec` for git commands, NOT `run-claude`. The Claude CLI may not be available in the sandbox.

#### Step 3.3: Feature Loop

**For EACH feature (in dependency order):**

##### 3.3.0: Plan Feature

Run the `/sandbox/initiative-feature` command to create a detailed plan:

```bash
${SANDBOX_CLI} run-claude "/sandbox/initiative-feature #<feature-issue> --manifest ${manifestPath}" --sandbox ${sandboxId}
```

Parse output for:
- `success: true` - Planning succeeded
- `plan.file_path` - Location of detailed plan file

**If planning fails**: Log error, skip feature, continue to next.

##### 3.3.1: Implement Feature

Run the `/sandbox/initiative-implement` command to execute the plan:

```bash
${SANDBOX_CLI} run-claude "/sandbox/initiative-implement #<feature-issue> --manifest ${manifestPath}" --sandbox ${sandboxId}
```

Parse output for:
- `success: true` - Implementation succeeded
- `validation.all_passed` - All checks passed
- `ready_for_review: true` - Ready for user review

**If `run-claude` fails** (Claude CLI not found):
- Fall back to local mode for this feature
- Or use `exec` to run git and shell commands directly

##### 3.3.2: User Review Gate

After implementation, get the dev server URL and ask for approval:

```bash
# Start dev server in sandbox (background)
${SANDBOX_CLI} exec ${sandboxId} "pnpm dev &" --timeout 30000

# Get the public URL for port 3000
${SANDBOX_CLI} url ${sandboxId} 3000
```

Present to user:

```typescript
AskUserQuestion({
  question: `Feature #<issue> implemented. Review at dev URL above.\n\nApprove implementation?`,
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
**If "Skip feature"**: Revert changes in sandbox: `${SANDBOX_CLI} exec ${sandboxId} "git checkout ."`

##### 3.3.3: Commit Feature

```bash
${SANDBOX_CLI} exec ${sandboxId} "git add -A && git commit -m 'feat(<scope>): <feature-description>

Part of #${masterIssueNumber}
Implements #<feature-issue>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>'"
```

##### 3.3.4: Progress
```
[PROGRESS] Feature X/N: <name> ✓ COMPLETE
```

##### 3.3.5: Unblock Dependent Features

After feature completion, update dependent features from `status:blocked` to `status:ready`:

```bash
# For each feature that depends on the completed feature
for dependent_issue in ${dependents_of_completed_feature}; do
  # Check if ALL dependencies of this dependent are now complete
  all_deps_complete=true
  for dep in ${dependencies_of[$dependent_issue]}; do
    if ! is_complete($dep); then
      all_deps_complete=false
      break
    fi
  done

  # If all dependencies complete, unblock this feature
  if [ "$all_deps_complete" = true ]; then
    gh issue edit ${dependent_issue} \
      --repo MLorneSmith/2025slideheroes \
      --add-label "status:ready" \
      --remove-label "status:blocked"
    echo "Unblocked feature #${dependent_issue}"
  fi
done
```

#### Step 3.4: Push All Changes

After all features are committed:

```bash
${SANDBOX_CLI} exec ${sandboxId} "git push origin feature/${masterIssueNumber}-${slug}"
```

---

### Path B: Local Mode

#### Step 3.1L: Create Feature Branch Locally

```bash
git checkout dev
git pull origin dev
git checkout -b feature/${masterIssueNumber}-${slug}
git push -u origin feature/${masterIssueNumber}-${slug}
```

#### Step 3.2L: Feature Loop

**For EACH feature (in dependency order):**

##### 3.2L.1: Implement Feature

Use the `/implement` slash command directly:

```
/implement #<feature-issue>
```

##### 3.2L.2: User Review

After implementation, ask for approval:

```typescript
AskUserQuestion({
  question: `Feature #<issue> implemented locally. Run 'pnpm dev' to test.\n\nApprove implementation?`,
  header: "Review",
  options: [
    { label: "Approve", description: "Implementation looks good, continue to commit" },
    { label: "Request changes", description: "Describe what needs fixing" },
    { label: "Skip feature", description: "Move to next feature without committing" }
  ]
})
```

##### 3.2L.3: Commit Feature

Execute git commit directly:

```bash
git add -A && git commit -m "feat(<scope>): <feature-description>

Part of #${masterIssueNumber}
Implements #<feature-issue>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

##### 3.2L.4: Unblock Dependent Features

Same as Step 3.3.5 - update dependent features from `status:blocked` to `status:ready` when all their dependencies are complete.

#### Step 3.3L: Push All Changes

```bash
git push origin feature/${masterIssueNumber}-${slug}
```

---

## Phase 4: Completion

### Step 4.1: Create Pull Request (DIRECT)

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

### Step 4.2: Update Master Issue

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

### Step 4.3: Kill Sandbox (if used)

If sandbox mode was used:

```bash
${SANDBOX_CLI} kill ${sandboxId}
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

| Command | Purpose | Mode |
|---------|---------|------|
| `/sandbox/initiative-feature` | Create detailed plan using research manifest | E2B Sandbox |
| `/sandbox/initiative-implement` | Execute plan with manifest context | E2B Sandbox |
| `/implement` | Self-contained implementation (does own planning) | Local |
| `/review` | Review implementation against spec | Both |

**Mode Notes**:
- **E2B Sandbox**: Uses `/sandbox/initiative-feature` → `/sandbox/initiative-implement` sequence with manifest
- **Local Mode**: Uses `/implement` directly (handles its own planning internally)

---

## Initiative Input

$ARGUMENTS
