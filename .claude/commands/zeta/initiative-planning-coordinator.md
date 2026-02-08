---
description: Coordinate feature planning for all features in an initiative with skill access
argument-hint: --manifest [issue#] --features [issue#,issue#,...] --master [issue#] --slug [slug] --date [YYYY-MM-DD]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, Skill, SlashCommand]
---

# Initiative Planning Coordinator

Coordinate feature planning for ALL features in an initiative. This command is called by `/initiative` orchestrator and has access to skills and documentation routing that regular agents don't have.

## Purpose

This coordinator solves two problems from the original `/initiative` workflow:

1. **Context Exhaustion**: Previously, 9 parallel agents returned verbose output that exhausted the orchestrator's context. This coordinator returns only compact JSON.

2. **Skill Access**: Previously, skills like `frontend-design` were "auto-denied" in subagents. This coordinator has explicit Skill tool access.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--manifest` | Yes | GitHub issue number containing research manifest |
| `--features` | Yes | Comma-separated list of feature issue numbers |
| `--master` | Yes | Master feature-set issue number |
| `--slug` | Yes | Initiative slug (kebab-case) |
| `--date` | Yes | Date for directory structure (YYYY-MM-DD) |

## Example Usage

```bash
/initiative-planning-coordinator --manifest 1256 --features 1258,1259,1260,1261,1262,1263,1264,1265,1266 --master 1257 --slug user-dashboard-home --date 2025-12-17
```

## Execution Protocol

### Step 1: Parse Arguments

```typescript
const args = "$ARGUMENTS";

// Parse manifest issue
const manifestMatch = args.match(/--manifest\s+(\d+)/);
const manifestIssue = manifestMatch ? parseInt(manifestMatch[1]) : null;

// Parse feature issues
const featuresMatch = args.match(/--features\s+([\d,]+)/);
const featureIssues = featuresMatch
  ? featuresMatch[1].split(',').map(n => parseInt(n.trim()))
  : [];

// Parse master issue
const masterMatch = args.match(/--master\s+(\d+)/);
const masterIssue = masterMatch ? parseInt(masterMatch[1]) : null;

// Parse slug
const slugMatch = args.match(/--slug\s+(\S+)/);
const slug = slugMatch ? slugMatch[1] : null;

// Parse date
const dateMatch = args.match(/--date\s+(\d{4}-\d{2}-\d{2})/);
const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
```

Validate all required arguments are present.

### Step 2: Initialize Todo List

```typescript
TodoWrite([
  { content: "Load research manifest from GitHub", status: "in_progress", activeForm: "Loading research manifest" },
  { content: "Detect feature types and load skills", status: "pending", activeForm: "Detecting feature types" },
  { content: "Load conditional documentation", status: "pending", activeForm: "Loading documentation" },
  ...featureIssues.map(issue => ({
    content: `Plan feature #${issue}`,
    status: "pending",
    activeForm: `Planning feature #${issue}`
  })),
  { content: "Return planning summary", status: "pending", activeForm: "Returning summary" }
])
```

### Step 3: Fetch Research Manifest (ONCE)

```bash
gh issue view ${manifestIssue} \
  --repo slideheroes/2025slideheroes \
  --json body -q '.body' > /tmp/manifest-${manifestIssue}.md
```

Read and cache the manifest content. This is shared context for ALL features.

Mark todo complete, move to next.

### Step 4: Analyze Features and Load Skills

Fetch all feature stubs to determine which skills to load:

```bash
for issue in ${featureIssues}; do
  gh issue view ${issue} --repo slideheroes/2025slideheroes --json title -q '.title'
done
```

**Skill Detection Logic:**

```typescript
const featureTitles = await fetchAllFeatureTitles();
const titleText = featureTitles.join(' ').toLowerCase();

const skillsToLoad = [];

// UI/Frontend features
if (/dashboard|card|chart|component|layout|grid|radial|spider|table|button|modal|form/i.test(titleText)) {
  skillsToLoad.push('frontend-design');
}

// Local-first features
if (/offline|local-first|sync|rxdb|dexie|indexeddb/i.test(titleText)) {
  skillsToLoad.push('local-first-db');
}

// Testing features
if (/test|debug|playwright|browser|e2e/i.test(titleText)) {
  skillsToLoad.push('webapp-testing');
}
```

**Load detected skills:**

```typescript
for (const skill of skillsToLoad) {
  Skill({ skill: skill })
}
```

**IMPORTANT**: Read and save the skill output. This content guides ALL feature planning.

Mark todo complete, move to next.

### Step 5: Load Conditional Documentation (ONCE)

```typescript
SlashCommand({ command: '/conditional_docs initiative-feature "' + slug + '"' })
```

Read the suggested documentation files. This is shared context for all features.

Mark todo complete, move to next.

### Step 6: Plan Each Feature (Sequential Loop)

For each feature issue:

#### 6a: Fetch Feature Stub

```bash
gh issue view ${featureIssue} \
  --repo slideheroes/2025slideheroes \
  --json title,body,labels \
  -q '{title: .title, body: .body, labels: [.labels[].name]}'
```

Extract:
- Feature title and description
- Phase number
- Dependencies
- Effort estimate

#### 6b: Check for Feature-Specific Research Needs

Research triggers:
- External library not covered in manifest
- Integration with external service (Cal.com, Stripe, etc.)
- Security-sensitive functionality
- Performance-critical component

If triggered:

```bash
# Context7 for library docs
.ai/bin/context7-get-context <owner> <repo> --topic "<topic>" --tokens 2500

# Perplexity for best practices
.ai/bin/perplexity-chat "Best practices for <topic>" --model sonar-pro
```

#### 6c: Create Implementation Plan

Using cached resources:
- Research manifest content
- Skill guidelines (if loaded)
- Conditional documentation
- Feature-specific research (if conducted)

Create a detailed plan following the template in the `initiative-planning` agent definition.

#### 6d: Write Plan File

```bash
mkdir -p .ai/reports/feature-reports/${date}

cat > ".ai/reports/feature-reports/${date}/${featureIssue}-feature-plan-${featureSlug}.md" << 'EOF'
<plan content>
EOF
```

#### 6e: Update GitHub Issue

**CRITICAL**: Embed the FULL plan in the GitHub issue body.

```bash
gh issue edit ${featureIssue} \
  --repo slideheroes/2025slideheroes \
  --body "$(cat << 'PLAN_EOF'
<FULL PLAN CONTENT HERE>
PLAN_EOF
)"
```

#### 6f: Update Labels

```bash
gh issue edit ${featureIssue} \
  --repo slideheroes/2025slideheroes \
  --add-label "status:planned" \
  --remove-label "status:blocked" \
  --remove-label "status:ready"
```

#### 6g: Mark Feature Complete

Update todo to mark this feature as completed, mark next feature as in_progress.

### Step 7: Return Compact Output

**CRITICAL**: Return ONLY this JSON structure. The orchestrator needs minimal information.

```
=== PLANNING OUTPUT ===
{
  "success": true,
  "features_planned": 9,
  "issues_updated": [1258, 1259, 1260, 1261, 1262, 1263, 1264, 1265, 1266],
  "skills_used": ["frontend-design"],
  "conditional_docs_loaded": ["development/architecture-overview.md"],
  "research_conducted": {
    "context7_queries": 2,
    "perplexity_queries": 1
  },
  "plan_files": [
    ".ai/reports/feature-reports/2025-12-17/1258-feature-plan-data-loader.md"
  ],
  "errors": []
}
=== END PLANNING OUTPUT ===
```

**DO NOT include in output:**
- Full plan content
- Verbose status messages
- File contents
- Research findings

## Error Handling

If a feature fails to plan:

1. Log the error
2. Add to `errors` array
3. Continue with remaining features
4. Return success if majority planned

```json
{
  "success": true,
  "features_planned": 8,
  "issues_updated": [1258, 1259, 1260, 1261, 1262, 1264, 1265, 1266],
  "errors": [
    { "issue": 1263, "error": "GitHub API timeout", "recoverable": true }
  ]
}
```

## Plan Template

Each feature plan should follow this structure (embedded in GitHub issue):

```markdown
## Feature: <Feature Name>

**Parent**: #<master-issue>
**Research Manifest**: #<manifest-issue>
**Phase**: <phase-number>
**Effort**: <S/M/L/XL>
**Dependencies**: <list or "None">

---

## Overview
<description informed by research>

## Solution Approach
<technical approach from manifest patterns and skill guidelines>

## Research Applied

### From Manifest
- <patterns applied>

### From Skills
- <guidelines from frontend-design if loaded>

### Additional Research
- <context7/perplexity findings if conducted>

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `path/to/file.tsx` | Description |

## Implementation Tasks

### Task 1: <name>
- [ ] Subtask 1
- [ ] Subtask 2

## Validation Commands

\`\`\`bash
pnpm typecheck
pnpm lint:fix
pnpm build
\`\`\`

## Acceptance Criteria
- [ ] All validation commands pass
- [ ] Feature works as specified

---
*Plan generated by /initiative-planning-coordinator*
```

## Related

- **Called by**: `/initiative` orchestrator (Phase 3)
- **Uses agent**: `initiative-planning` subagent type
- **Creates plans for**: `/sandbox/initiative-implement` command

## Input

$ARGUMENTS
