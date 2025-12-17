---
description: Orchestrate complete feature development lifecycle from research through implementation, review, and documentation with E2B sandbox isolation
argument-hint: [initiative-description] [--quick]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, SlashCommand]
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
| `skipImplementation` | Step 1.1.5 | true if E2B prerequisites missing and user chose to continue |
| `manifestPath` | Phase 1 | Local path to research manifest (backup) |
| `manifestContent` | Phase 1 | Full manifest markdown content |
| `manifestIssueNumber` | Phase 2 | GitHub issue number containing manifest (P1 fix) |
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

### Step 1.1.5: Early E2B Credential Check

**CRITICAL**: Check E2B prerequisites BEFORE doing any work. Fail fast if credentials are missing.

```bash
# Run the prerequisite check script
.ai/bin/check-e2b-prerequisites --json
```

**Parse the JSON output:**
- If `success: false`, display the missing items and fix instructions
- Ask user whether to continue (planning only) or abort

```typescript
AskUserQuestion({
  question: "E2B sandbox prerequisites are missing. How would you like to proceed?",
  header: "E2B Setup",
  options: [
    { label: "Continue with planning only", description: "Create plans but skip implementation phase" },
    { label: "Abort", description: "Stop and fix prerequisites first" }
  ]
})
```

**If credentials are set (`success: true`)**: Continue to interview.
**If "Abort"**: Stop immediately with fix instructions.
**If "Continue with planning only"**: Set `skipImplementation = true` and proceed.

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
- `manifestPath` from `manifest_path` (local backup)
- `manifestContent` from `manifest_content` (FULL markdown content for GitHub issue)
- `researchSummary` from `research_summary`

**CRITICAL (P1 Fix)**: The `manifestContent` field contains the full manifest that will be stored in a GitHub issue for sandbox accessibility.

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

Create manifest issue FIRST (for sandbox accessibility), then master issue, then feature stubs.

```bash
# Step 1: Create MANIFEST ISSUE FIRST (P1 Fix - Critical for sandbox accessibility)
# This issue contains the full research manifest content so it's accessible from E2B sandbox
MANIFEST_ISSUE=$(gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Research Manifest: ${initiative}" \
  --body "${manifestContent}" \
  --label "type:research" \
  --label "status:active" \
  | grep -oE '[0-9]+$')

echo "Created manifest issue: #${MANIFEST_ISSUE}"
manifestIssueNumber=${MANIFEST_ISSUE}

# Step 2: Create master issue with reference to manifest
MASTER_ISSUE=$(gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: ${initiative}" \
  --body "$(cat << BODY_EOF
$(cat .ai/specs/feature-sets/${slug}/pending-overview.md)

---
## Research Manifest
See #${MANIFEST_ISSUE} for complete research manifest.
BODY_EOF
)" \
  --label "type:feature-set" \
  --label "status:planning" \
  | grep -oE '[0-9]+$')

echo "Created master issue: #${MASTER_ISSUE}"

# Step 3: Rename directories with issue number prefix
if [ -d ".ai/specs/feature-sets/${slug}" ]; then
  mv ".ai/specs/feature-sets/${slug}" ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}"
fi

if [ -d ".ai/reports/feature-reports/${todayDate}/${slug}" ]; then
  mv ".ai/reports/feature-reports/${todayDate}/${slug}" \
     ".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}"
fi

# Step 4: Update file references
mv ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/pending-overview.md" \
   ".ai/specs/feature-sets/${MASTER_ISSUE}-${slug}/${MASTER_ISSUE}-overview.md"

# Step 5: Create feature stub issues
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
    --body "<stub-body with parent ref #${MASTER_ISSUE} and manifest ref #${MANIFEST_ISSUE}>" \
    --label "type:feature" \
    --label "${INITIAL_STATUS}" \
    | grep -oE '[0-9]+$')

  featureIssues+=($FEATURE_ISSUE)
done

# Step 6: Update manifest path to use GitHub issue reference (P1 Fix)
# This format tells commands to fetch from GitHub instead of local file
manifestPath="github:issue:${MANIFEST_ISSUE}"

# Local backup path (for reference only)
localManifestPath=".ai/reports/feature-reports/${todayDate}/${MASTER_ISSUE}-${slug}/manifest.md"
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
// CRITICAL: Pass --master-issue so the command knows where to save files
// P5 Fix: Include explicit verification requirements in prompt
Task(general-purpose, prompt: `
Run the /initiative-feature command to create a detailed plan for feature #${featureIssue}.

Command: /initiative-feature ${featureIssue} --manifest ${manifestPath} --master-issue ${masterIssueNumber}

This will:
1. Fetch the feature stub from GitHub
2. Load the research manifest for context
3. Invoke frontend-design skill (if UI feature)
4. Conduct additional research (if complex feature)
5. Create a detailed implementation plan
6. Update the GitHub issue with the FULL plan content (not a local file reference)
7. Mark the issue as "status:planned"

IMPORTANT: The plan must be EMBEDDED in the GitHub issue body, not referenced as a local file path.
The sandbox clones from GitHub and won't have access to local files.

=== VERIFICATION REQUIREMENTS (P5 Fix) ===

You MUST perform and report on these verification steps:

1. **Skill Invocation**: If this is a UI/frontend feature (dashboard, component, widget, card, chart, layout, grid), you MUST invoke the frontend-design skill:
   \`\`\`typescript
   Skill({ skill: "frontend-design" })
   \`\`\`
   Report in output: skills_invoked: ["frontend-design"]

2. **Conditional Documentation**: You MUST load relevant context documentation:
   \`\`\`typescript
   SlashCommand({ command: '/conditional_docs initiative-feature "<feature-title>"' })
   \`\`\`
   Report in output: conditional_docs_loaded: ["file1.md", "file2.md"]

3. **Research Manifest**: You MUST read the research manifest from: ${manifestPath}
   Report in output: research_sections_used: ["section1", "section2"]

4. **Plan File Creation**: After writing the plan file, verify it exists and has content:
   \`\`\`bash
   test -f "<plan-file-path>" && wc -c < "<plan-file-path>"
   \`\`\`
   Report in output: plan_file_size_bytes: <size>

5. **GitHub Issue Update**: After updating the issue, verify body length:
   \`\`\`bash
   gh issue view ${featureIssue} --json body -q '.body | length'
   \`\`\`
   Report in output: github_issue_body_length: <length>

If ANY verification step fails, include the failure details in your output:
\`\`\`json
{
  "verification": {
    "failures": ["skill_not_invoked", "docs_not_loaded"]
  }
}
\`\`\`

=== END VERIFICATION REQUIREMENTS ===

After completion, return the JSON output from the command with all verification data.
`)
```

Parse output for:
- `success: true` - Planning succeeded
- `plan.file_path` - Location of local plan file (backup)
- `github_updated: true` - GitHub issue updated
- `plan_embedded_in_issue: true` - Full plan is in GitHub (REQUIRED)
- `skills_invoked` - List of skills used (e.g., ["frontend-design"])
- `verification` - Verification data from agent (P4 fix)

**If planning fails**: Log error, ask user whether to retry or skip.

#### 3.1.1: Verify Planning Output (P4 Fix)

**CRITICAL**: Validate that planning agent completed successfully before proceeding.

```typescript
// P4 Fix: Explicit verification after planning
const verifyPlanningOutput = async (featureIssue: number, planFilePath: string) => {
  const verification = {
    plan_file_exists: false,
    plan_file_size: 0,
    github_issue_updated: false,
    github_body_length: 0,
    labels_correct: false,
    verification_passed: false
  };

  // Verify plan file exists and has content
  const planExists = await Bash(`test -f "${planFilePath}" && wc -c < "${planFilePath}"`);
  verification.plan_file_exists = planExists.success;
  verification.plan_file_size = parseInt(planExists.stdout) || 0;

  // Verify GitHub issue has substantial content (>1000 chars indicates full plan)
  const issueBodyLength = await Bash(
    `gh issue view ${featureIssue} --repo MLorneSmith/2025slideheroes --json body -q '.body | length'`
  );
  verification.github_body_length = parseInt(issueBodyLength.stdout) || 0;
  verification.github_issue_updated = verification.github_body_length > 1000;

  // Verify labels were updated to "status:planned"
  const labels = await Bash(
    `gh issue view ${featureIssue} --repo MLorneSmith/2025slideheroes --json labels -q '.labels[].name'`
  );
  verification.labels_correct = labels.stdout.includes('status:planned');

  // Overall verification
  verification.verification_passed = (
    verification.plan_file_exists &&
    verification.plan_file_size > 500 &&
    verification.github_issue_updated &&
    verification.labels_correct
  );

  return verification;
};

// Run verification
const verificationResult = await verifyPlanningOutput(featureIssue, planFilePath);

// Log verification results
console.log(`[VERIFICATION] Feature #${featureIssue}:`);
console.log(`  Plan file exists: ${verificationResult.plan_file_exists} (${verificationResult.plan_file_size} bytes)`);
console.log(`  GitHub updated: ${verificationResult.github_issue_updated} (${verificationResult.github_body_length} chars)`);
console.log(`  Labels correct: ${verificationResult.labels_correct}`);
console.log(`  PASSED: ${verificationResult.verification_passed}`);

// Fail gracefully with warning if verification fails
if (!verificationResult.verification_passed) {
  console.warn(`[WARNING] Verification failed for feature #${featureIssue}`);
  // Ask user whether to retry or continue
  AskUserQuestion({
    question: `Planning verification failed for #${featureIssue}. How to proceed?`,
    options: [
      { label: "Retry planning", description: "Run /initiative-feature again" },
      { label: "Continue anyway", description: "Proceed despite verification failure" },
      { label: "Skip feature", description: "Move to next feature" }
    ]
  });
}
```

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

// P3 Fix: Effort-based timeout configuration (in milliseconds)
const EFFORT_TIMEOUT = {
  'S': 900000,    // 15 minutes for Small
  'M': 1800000,   // 30 minutes for Medium
  'L': 2700000,   // 45 minutes for Large
  'XL': 3600000   // 60 minutes for Extra Large
};

// Default timeout if effort not specified
const DEFAULT_TIMEOUT = 1800000; // 30 minutes
```

**Timeout Guidelines**:
| Effort | Timeout | Use Case |
|--------|---------|----------|
| S | 15 min | Simple card components, minor updates |
| M | 30 min | Data loaders, complex components |
| L | 45 min | Multi-file features, integrations |
| XL | 60 min | Large features, full-page implementations |

### Step 4.0: Verify Prerequisites (or Skip)

**If `skipImplementation` was set in Step 1.1.5**: Skip Phase 4 entirely and go to Phase 5 (partial completion).

Otherwise, verify environment using the utility script:

```bash
# Use the prerequisite check utility script
.ai/bin/check-e2b-prerequisites
```

**If script exits with code 0**: All prerequisites met, continue.
**If script exits with code 1**: Prerequisites missing, display output and stop.

The script checks:
- `E2B_API_KEY` - Required for sandbox creation
- `GITHUB_TOKEN` or `GH_TOKEN` - Required for git operations in sandbox
- `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` - Required for Claude Code
- Sandbox CLI exists at `.claude/skills/e2b-sandbox/scripts/sandbox`
- Template `slideheroes-claude-agent` exists (if API key is set)

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

**P2 Fix**: Use `/sandbox/initiative-implement` instead of `/implement` to leverage manifest context.
**P3 Fix**: Use effort-based timeout for appropriate feature complexity.

Determine timeout based on feature effort (from plan):
```typescript
// Get effort from feature plan (S, M, L, XL)
const featureEffort = feature.effort || 'M'; // Default to Medium if not specified
const timeout = EFFORT_TIMEOUT[featureEffort] || DEFAULT_TIMEOUT;
```

Run `/sandbox/initiative-implement` in the sandbox with manifest context:

```bash
# P2 Fix: Use /sandbox/initiative-implement with manifest reference
# P3 Fix: Pass effort-based timeout
${SANDBOX_CLI} run-claude "/sandbox/initiative-implement ${featureIssue} --manifest github:issue:${MANIFEST_ISSUE}" \
  --sandbox ${sandboxId} \
  --timeout ${timeout}
```

**Why `/sandbox/initiative-implement` instead of `/implement`:**
- Loads research manifest for implementation guidance
- Outputs structured JSON for orchestrator consumption
- Designed for E2B sandbox environment
- References pre-gathered research patterns and gotchas

**P6 Fix: Progress Streaming**

The sandbox outputs progress markers that can be parsed for real-time status:

```
[PROGRESS] Phase: Implementation
[PROGRESS] Starting task: <task-name>
[PROGRESS] Files: Creating <file-path>
[PROGRESS] Files: Modifying <file-path>
[PROGRESS] Completed: <task-name>
[PROGRESS] Validation: <command> - PASSED|FAILED
[PROGRESS] Implementation: <X>/<N> tasks complete
```

**Parse progress markers as they stream:**
```typescript
// Parse sandbox output for progress markers
const parseProgress = (line: string) => {
  if (line.startsWith('[PROGRESS]')) {
    const progressMatch = line.match(/\[PROGRESS\]\s+(.+?):\s+(.+)/);
    if (progressMatch) {
      const [_, type, detail] = progressMatch;
      switch (type) {
        case 'Phase':
          console.log(`📍 Phase: ${detail}`);
          break;
        case 'Starting task':
          console.log(`🔄 Starting: ${detail}`);
          // Update todo list
          TodoWrite([...todos, { content: detail, status: 'in_progress', activeForm: `Implementing ${detail}` }]);
          break;
        case 'Completed':
          console.log(`✅ Completed: ${detail}`);
          // Mark todo as complete
          break;
        case 'Validation':
          const passed = detail.includes('PASSED');
          console.log(`${passed ? '✅' : '❌'} Validation: ${detail}`);
          break;
        case 'Implementation':
          console.log(`📊 Progress: ${detail}`);
          break;
        case 'Files':
          console.log(`📁 ${detail}`);
          break;
      }
    }
  }
};

// Note: Actual parsing happens via onStdout callback in sandbox CLI
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
