---
description: Orchestrate complete feature development lifecycle from research through implementation, review, and documentation with E2B sandbox isolation
argument-hint: [initiative-description] [--quick]
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

## Flags

| Flag | Description |
|------|-------------|
| `--quick` | **Simplified workflow**. Skip external research agents (perplexity, context7). Use codebase patterns only. Best for familiar technologies or smaller initiatives. |

### When to Use `--quick` Mode

✅ **Use `--quick` when:**
- Technologies are already familiar (existing patterns in codebase)
- Initiative is straightforward (1-3 features expected)
- External research would be redundant
- Speed is more important than comprehensive research

❌ **Don't use `--quick` when:**
- Introducing new/unfamiliar technologies
- Complex integration work
- Security-sensitive implementations
- Performance-critical features needing best practices

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
│       │  ║  PHASE 1: INTERVIEW & RESEARCH (DELEGATED TO SUB-AGENT)   ║   │
│       │  ╚═══════════════════════════════════════════════════════════╝   │
│       │                                                                  │
│       ├─> Task(general-purpose): /initiative-research                    │
│       │       • Interview user (scope, technologies, constraints)        │
│       │       • Launch research agents (perplexity, context7, Explore)   │
│       │       • Synthesize research into manifest                        │
│       │       • Return: manifest path + research summary JSON            │
│       ├─> [PROGRESS] Research complete ✓ (context preserved)             │
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

## State Variables (Track Throughout)

**CRITICAL**: Track these variables throughout execution. If any required variable is empty at the start of a phase, STOP and backfill the missing value.

| Variable | Set In | Value | Status |
|----------|--------|-------|--------|
| `slug` | Step 1.1 | Initiative slug (kebab-case, max 30 chars) | ⬜ |
| `todayDate` | Step 1.1 | Today's date (YYYY-MM-DD format) | ⬜ |
| `quickMode` | Step 1.1 | `true` if `--quick` flag passed, else `false` | ⬜ |
| `manifestPath` | Step 1.5 | `.ai/reports/feature-reports/{todayDate}/{slug}/manifest.md` | ⬜ |
| `masterIssueNumber` | Step 2.1 | GitHub issue number from feature-set | ⬜ |
| `featureIssues[]` | Step 2.1 | Array of feature issue numbers | ⬜ |
| `branchName` | Step 2.5 | `feature/{slug}` or custom | ⬜ |
| `sandboxId` | Step 3.1 | E2B sandbox ID from creation | ⬜ |
| `prNumber` | Step 4.2 | GitHub PR number from creation | ⬜ |

**How to Use:**
- Update this table as you progress through each step
- Check at phase boundaries: before Phase 2, Phase 3, Phase 4
- If a variable is missing, search back to find where it should have been set
- Print this table for reference during long implementation sessions

---

## Pre-Phase Assertions

### Pre-Phase 2 Assertions

**STOP if any of these are false. Resolve before proceeding.**

**Full Mode:**
- [ ] User has been interviewed (Question 1, 2, 3 completed)
- [ ] Research agents have completed (perplexity, context7, Explore)
- [ ] Research manifest exists at `.ai/reports/feature-reports/<date>/<slug>/manifest.md` and is readable
- [ ] Research reports saved to `.ai/reports/feature-reports/<date>/<slug>/research/`

**Quick Mode (simplified requirements):**
- [ ] User has been interviewed (Question 1, 2, 3 completed)
- [ ] Explore agent has completed (perplexity, context7 skipped)
- [ ] Research manifest exists at `.ai/reports/feature-reports/<date>/<slug>/manifest.md` and is readable
- [ ] Codebase patterns report saved to `.ai/reports/feature-reports/<date>/<slug>/research/`

**If assertion fails**: Go back to Phase 1 and complete the missing steps. Do not proceed to Phase 2.

### Pre-Phase 3 Assertions

**STOP if any of these are false. Resolve before proceeding.**

- [ ] `masterIssueNumber` is set (from feature-set decomposition)
- [ ] `featureIssues[]` has at least one issue number
- [ ] `manifestPath` exists and is readable
- [ ] User has approved decomposition (approval gate passed)
- [ ] GitHub issues have been created (`issues_created: true` in JSON output)

**If assertion fails**: Go back to Phase 2 and verify decomposition completed successfully. Do not proceed to Phase 3.

### E2B Sandbox Requirement (Enforced in Step 3.0)

**⛔ E2B Sandbox is MANDATORY for Phase 3 feature implementations.**

Step 3.0 includes a hard-stop assertion that BLOCKS execution unless:
1. An E2B sandbox is successfully created, OR
2. User explicitly overrides with "SKIP (unsafe)" option

This cannot be rationalized away or skipped silently. The user MUST make an explicit choice.

### Pre-Phase 4 Assertions

**STOP if any of these are false. Resolve before proceeding.**

- [ ] All features processed (each feature has ✓ complete status)
- [ ] `sandboxId` is set (sandbox created and alive)
- [ ] All feature branches merged to feature branch
- [ ] Documentation tasks completed (background documentation agents finished)

**If assertion fails**: Resume feature loop or handle incomplete features. Do not proceed to Phase 4.

---

## Instructions

### Phase 1: Interview & Research (DELEGATED TO SUB-AGENT)

**Context Optimization**: Phase 1 is delegated to `/initiative-research` sub-agent to preserve orchestrator context for decomposition and implementation phases. The sub-agent handles:
- User interview
- Research agent coordination (perplexity, context7, Explore)
- Research synthesis
- Manifest creation

#### Step 1.1: Parse Arguments (Orchestrator)

```typescript
const args = "$ARGUMENTS";
const quickMode = args.includes('--quick');
const initiative = args.replace('--quick', '').trim();
const slug = initiative
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .substring(0, 30);
const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
```

#### Step 1.2: Delegate Research to Sub-Agent

**CRITICAL**: Delegate the entire research phase to preserve orchestrator context.

```typescript
// Launch research sub-agent
const researchAgent = Task(general-purpose, prompt: `
  Execute the /initiative-research command to conduct the research phase.

  /initiative-research "${initiative}"${quickMode ? ' --quick' : ''}

  This will:
  1. Interview the user about technologies and scope
  2. Launch research agents (perplexity, context7, Explore) - or just Explore in quick mode
  3. Collect and synthesize research results
  4. Create the research manifest at .ai/reports/feature-reports/${todayDate}/${slug}/manifest.md
  5. Return structured JSON with manifest path and research summary

  Execute this command and return the full output including the JSON block.
`)
```

#### Step 1.3: Parse Research Output

Extract structured data from the sub-agent's output:

```typescript
// Look for JSON block in output
// Format: === RESEARCH OUTPUT === { ... } === END RESEARCH OUTPUT ===
const researchOutput = parseJSONFromOutput(researchAgent.output);

// Extract key variables for orchestrator
const manifestPath = researchOutput.manifest_path;
const researchSummary = researchOutput.research_summary;

// Update state variables
slug = researchOutput.initiative.slug;
todayDate = researchOutput.date;
```

#### Step 1.4: Validate Research Completion

**VERIFY that research phase completed successfully:**

```typescript
if (!researchOutput.success) {
  throw new Error("Research phase failed. Cannot proceed to decomposition.");
}

// Verify manifest file exists
const manifestExists = await fileExists(manifestPath);
if (!manifestExists) {
  throw new Error(`Manifest not found at ${manifestPath}`);
}
```

**[PROGRESS]** Research complete ✓ (delegated to sub-agent)

---

### Phase 2: Decomposition

#### Step 2.1: Execute /initiative-feature-set in DRY-RUN mode (MANDATORY)

**Do NOT manually decompose. The sub-command handles critical decomposition logic.**

**IMPORTANT**: First call uses dry-run mode (default). NO GitHub issues are created yet.

Execute the feature-set decomposition sub-command in dry-run mode:

```typescript
Task(general-purpose, prompt: `
  YOU MUST execute the /initiative-feature-set command in dry-run mode. This is not optional.

  /initiative-feature-set "${initiative}" --manifest .ai/reports/feature-reports/${todayDate}/${slug}/manifest.md

  This will:
  1. Load the research manifest
  2. Decompose the initiative into features
  3. Create LOCAL plan files only (NO GitHub issues yet)
  4. Return structured JSON with feature list and dependencies

  Do NOT skip this step. Do NOT add --create-issues flag yet.
  Return the full JSON output for orchestrator consumption.
`)
```

#### Validation After Dry-Run Execution

**VERIFY that decomposition completed successfully:**

- [ ] Plan file exists: `.ai/specs/feature-sets/<slug>/pending-overview.md`
- [ ] Structured JSON output received with `issues_created: false`
- [ ] Feature list is complete and well-scoped
- [ ] Dependencies are logical and correct

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

**[PROGRESS]** Decomposition complete (dry-run): N features across M phases ✓

#### Step 2.4: User Approval Gate

```typescript
// Present decomposition summary and ask for approval
// CRITICAL: This gate MUST complete BEFORE any GitHub issues are created
AskUserQuestion({
  question: "Approve this decomposition? GitHub issues will be created if you proceed.",
  header: "Approve",
  options: [
    { label: "Yes, create issues", description: "Create GitHub issues and proceed to implementation" },
    { label: "Modify scope", description: "Adjust feature boundaries before creating issues" },
    { label: "Cancel", description: "Stop without creating any GitHub issues" }
  ]
})
```

**[GATE]** User approves decomposition? (Y/n)

**If user selects "Cancel"**: Stop immediately. No GitHub issues created. User can review local plan files.

**If user selects "Modify scope"**: Revise decomposition and return to Step 2.1.

**If user selects "Yes, create issues"**: Proceed to Step 2.4.1 to create GitHub issues.

#### Step 2.4.1: Create GitHub Issues DIRECTLY (ONLY after user approval)

**CRITICAL**: This step ONLY executes after explicit user approval in Step 2.4.

**⚠️ IMPORTANT**: Execute GitHub operations DIRECTLY in the orchestrator. Do NOT delegate to Task() agents as GitHub CLI operations fail silently in sub-agents.

```bash
# Step 1: Create master feature-set issue DIRECTLY
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Feature Set: ${initiative}" \
  --body-file .ai/specs/feature-sets/${slug}/pending-overview.md \
  --label "type:feature-set" \
  --label "status:planning"

# Capture the master issue number from the output URL
# Example output: https://github.com/MLorneSmith/2025slideheroes/issues/123
MASTER_ISSUE_NUMBER=<extract-from-output>

# Step 2: Rename overview file with issue number
mv .ai/specs/feature-sets/${slug}/pending-overview.md \
   .ai/specs/feature-sets/${slug}/${MASTER_ISSUE_NUMBER}-overview.md

# Step 3: For each feature from the decomposition, create stub issues DIRECTLY
# Do NOT use Task() for this - execute gh commands directly
for feature in features:
  gh issue create \
    --repo MLorneSmith/2025slideheroes \
    --title "Feature: ${feature.name}" \
    --body "## Feature Stub

**Part of Feature Set**: #${MASTER_ISSUE_NUMBER}
**Phase**: ${feature.phase}
**Dependencies**: ${feature.dependencies || 'none'}
**Effort**: ${feature.effort}

### Description
${feature.description}

---
*Stub created by /initiative. Run /initiative-feature to create full plan.*" \
    --label "type:feature" \
    --label "status:blocked"

# Step 4: Comment on master issue with feature links DIRECTLY
gh issue comment ${MASTER_ISSUE_NUMBER} \
  --repo MLorneSmith/2025slideheroes \
  --body "## Feature Issues Created

<feature-list-with-phases-and-dependencies>

**Next Steps**: Proceed with E2B sandbox execution."

# Step 5: Create github-mapping.md file
# Write the mapping directly using Write tool, NOT cat heredoc in bash
```

**Why Direct Execution?**
- Task() delegation for GitHub operations often fails silently
- Sub-agents may not have proper GitHub CLI authentication
- Direct execution ensures operations complete and can be verified immediately
- Error handling is immediate rather than delayed

#### Validation After GitHub Issue Creation

**VERIFY that GitHub issues were created successfully:**

- [ ] Master issue created (GitHub issue #<number> exists)
- [ ] Feature stub issues created (count matches expected from decomposition)
- [ ] `.ai/specs/<slug>/github-mapping.md` file exists
- [ ] Structured JSON output received with `issues_created: true`

**If any validation fails:**

```bash
# Check GitHub for created issues
gh issue list --repo MLorneSmith/2025slideheroes --label "area:feature-set-<slug>"

# Check for mapping file
ls -la .ai/specs/<slug>/github-mapping.md
```

If issues are missing or mapping file doesn't exist:
1. Check error logs from the Task agent
2. Retry the sub-command execution with `--create-issues`
3. Do NOT proceed until all validation passes

---

### Step 2.5: Create Feature Branch (MANDATORY)

**This step MUST execute before Phase 3. Work happens on isolated branch, not dev/main.**

#### Option 1: Manual Branch Creation

```bash
git checkout -b feature/${slug}
```

#### Option 2: Sandbox-Based Creation

Use the `/sandbox feature` command which creates branch automatically:

```bash
/sandbox feature "${initiative}"
```

#### Validation

**Run this to confirm you're on the correct branch:**

```bash
git branch --show-current
```

**Expected output**: `feature/<slug>` (NOT `dev` or `main`)

**If output is wrong:**
- STOP
- Run `git checkout -b feature/${slug}` to create correct branch
- Do NOT proceed to Phase 3 until on correct branch

#### State Tracking

Update the state variables table:
- `branchName` = output of `git branch --show-current`

**[PROGRESS]** Feature branch created: <branch-name> ✓

---

### Phase 3: Feature Loop (E2B Sandbox)

#### Step 3.0: HARD STOP - E2B Sandbox Assertion

**⛔ BLOCKING ASSERTION - DO NOT PROCEED WITHOUT USER OVERRIDE**

```typescript
// This assertion BLOCKS execution until sandbox is confirmed or user explicitly overrides
const SANDBOX_REQUIRED = true;

if (SANDBOX_REQUIRED && !sandboxId) {
  // HARD STOP - Cannot proceed without sandbox
  const override = AskUserQuestion({
    question: "⚠️ E2B Sandbox is REQUIRED for Phase 3. Skip sandbox at your own risk?",
    header: "⛔ SANDBOX",
    options: [
      { label: "Create sandbox now", description: "Recommended: Create E2B sandbox before proceeding" },
      { label: "SKIP (unsafe)", description: "⚠️ DANGEROUS: Run locally without isolation. Code executes on your machine." },
      { label: "Abort initiative", description: "Stop initiative and review manually" }
    ]
  });

  if (override === "Create sandbox now") {
    // Proceed to Step 3.1
  } else if (override === "SKIP (unsafe)") {
    console.warn("⚠️ USER OVERRIDE: Proceeding without E2B sandbox");
    console.warn("   All code will execute in local environment");
    console.warn("   This is NOT recommended for production codebases");
    // Set flag for local execution
    sandboxId = "LOCAL_OVERRIDE";
  } else {
    // Abort
    throw new Error("Initiative aborted: E2B sandbox required");
  }
}
```

**Why E2B Sandbox is Required:**
1. **Isolation**: Feature implementations run in isolated environment
2. **Safety**: Mistakes don't affect your local codebase until reviewed
3. **Rollback**: Easy to discard failed implementations
4. **Parallel Safety**: Multiple features can be worked on without conflicts

**Escape Hatch**: User can explicitly override by selecting "SKIP (unsafe)" but this is STRONGLY discouraged.

#### Step 3.1: Create E2B Sandbox

**This step is NOT optional unless user explicitly overrode in Step 3.0.**

```bash
# Create sandbox using the project's template
/sandbox feature "${initiative}"
```

This command will:
1. Create isolated E2B sandbox with slideheroes-claude-agent template
2. Set up sandbox environment with dependencies
3. Return sandbox ID (capture this)

#### Required Output

You MUST capture and record:
- `sandboxId` = ID of created sandbox
- Sandbox status = "running"

**Validation**:

If you cannot provide a sandbox ID, STOP and troubleshoot before proceeding:

```bash
# Check sandbox status
/sandbox list
```

**If sandbox creation fails:**
1. Review error message
2. Check E2B account status and quota
3. Try again with explicit timeout: `/sandbox create --timeout 7200`
4. If still failing, return to Step 3.0 and ask user whether to skip sandbox

**[PROGRESS]** E2B sandbox created: sandboxId=<id> ✓

#### Step 3.2: Sync Research Manifest to Sandbox

```bash
# Copy manifest to sandbox
# The sandbox script handles file sync internally
```

#### Step 3.3: Feature Loop

Process features in dependency order. Use `/sandbox feature` workflow for each feature:

**For EACH feature (in dependency order):**

**1. Create Sandbox Feature**

```bash
/sandbox feature "#<issue> <description>" --manifest ${manifestPath}
```

This command:
- Plans the feature using `/initiative-feature`
- Implements the feature using `/initiative-implement`
- Runs validation
- Returns structured output with results

**Example:**
```bash
/sandbox feature "#42 Add OAuth2 social login" --manifest .ai/research/oauth-login/manifest.md
```

**2. User Approval Gate**

After plan is generated:

```typescript
AskUserQuestion({
  question: `Approve plan for feature "#<issue>"?`,
  header: "Plan",
  options: [
    { label: "Approve", description: "Proceed with implementation" },
    { label: "Revise", description: "Request changes to plan" },
    { label: "Skip", description: "Skip this feature for now" }
  ]
})
```

If "Revise": Address feedback and re-run `/sandbox feature` for this issue
If "Skip": Continue to next feature

**3. Implementation & Review**

After approval:

```bash
/sandbox continue <sandbox-id>
```

This will:
- Execute implementation
- Run validation tests
- Return review results

If review has blocking issues:

```typescript
AskUserQuestion({
  question: `Review found blocking issues. How to proceed?`,
  header: "Review",
  options: [
    { label: "Fix issues", description: "Attempt to fix blocking issues" },
    { label: "Skip feature", description: "Mark as needs-work, continue" },
    { label: "Pause initiative", description: "Stop and review manually" }
  ]
})
```

**4. Commit & Document**

After review passes:

```bash
/sandbox approve <sandbox-id>
```

This will:
- Commit changes with proper message
- Push to feature branch
- Start documentation (background)

**5. Progress Checkpoint**

```
[PROGRESS] Feature X/N: <name> ✓ COMPLETE
  - Branch: feature/<slug>
  - Sandbox: <sandbox-id>
  - Changes: <file count> files
  - Status: Ready for PR
```

**6. Continue to Next Feature**

Loop back to step 1 with next feature in dependency order

---

### Phase 4: Completion

**⚠️ IMPORTANT**: Execute ALL GitHub operations DIRECTLY in this phase. Do NOT delegate to Task() agents.

#### Step 4.1: Commit and Push Changes

```bash
# In sandbox (or local if sandbox was skipped):
git add -A
git commit -m "feat(<scope>): implement <initiative-name>

<list of features implemented>

Closes #<master-issue>
Refs #<feature-1>, #<feature-2>, ...

[agent: initiative-orchestrator]
"

git push origin <branch-name>
```

#### Step 4.2: Create Pull Request DIRECTLY

**Execute this gh command DIRECTLY - do NOT delegate to Task() agent.**

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
See `.ai/reports/feature-reports/<date>/<slug>/manifest.md`

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

#### Step 4.5: Close Master Issue DIRECTLY

**Execute this gh command DIRECTLY - do NOT delegate to Task() agent.**

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
`.ai/reports/feature-reports/<date>/<slug>/manifest.md`

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
| `/initiative-research` | **Phase 1 sub-agent**: Interview, research, manifest creation |
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
