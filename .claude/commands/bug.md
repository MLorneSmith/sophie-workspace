---
description: Create a bug fix plan from a GitHub diagnosis issue. Fetches diagnosis, analyzes root cause, and creates structured fix plan with reproduction steps and validation
argument-hint: [issue-number]
model: sonnet
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Bug Planning

Create a new plan in .ai/specs/*.md to resolve the `Bug` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

1. **Fetch Bug Diagnosis from GitHub**: If $ARGUMENTS contains a GitHub issue number (e.g., `123` or `#123`), fetch the bug diagnosis:
   ```typescript
   // Extract issue number from arguments
   const issueNumber = $ARGUMENTS.replace('#', '').trim();

   // Fetch the bug diagnosis from GitHub
   const issue = await mcp__github__get_issue({
     owner: 'MLorneSmith',
     repo: '2025slideheroes',
     issue_number: parseInt(issueNumber)
   });

   // Extract relevant information from the diagnosis
   const bugDiagnosis = issue.body; // Full diagnosis in markdown
   const bugTitle = issue.title.replace('Bug Diagnosis: ', ''); // Remove prefix
   const bugLabels = issue.labels; // severity, type, etc.
   ```

2. **Create Bug Fix Plan**:
   - IMPORTANT: You're writing a plan to resolve a bug based on the `Bug` that will add value to the application.
   - IMPORTANT: The `Bug` describes the bug that will be resolved but remember we're not resolving the bug, we're creating the plan that will be used to resolve the bug based on the `Plan Format` below.
   - You're writing a plan to resolve a bug, it should be thorough and precise so we fix the root cause and prevent regressions.
   - Create the plan in the `.ai/specs/*.md` file. Name it appropriately based on the `Bug`.
   - Use the plan format below to create the plan. 
   - Research the codebase to understand the bug, reproduce it, and put together a plan to fix it.
   - IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to fix the bug.
   - Use your reasoning model: THINK HARD about the bug, its root cause, and the steps to fix it properly.
   - IMPORTANT: Be surgical with your bug fix, solve the bug at hand and don't fall off track.
   - IMPORTANT: We want the minimal number of changes that will fix and address the bug.
   - Don't use decorators. Keep it simple.
   - If you need a new library, use `pnpm add <package>` (or `pnpm add -D <package>` for dev dependencies) in the appropriate workspace. For workspace-specific packages, use `pnpm --filter <workspace> add <package>`. Be sure to report all new dependencies in the `Notes` section of the `Plan Format`.
   - Respect requested files in the `Relevant Files` section.
   - Start your research by reading the `README.md` file.
  
3. **Report**
   -  Summarize the work you've just done in a concise bullet point list.
   - Include a path to the plan you created in the `.ai/specs/*.md` file.

## Relevant Files

Focus on the following files:
- `README.md` - Contains the project overview and instructions.
- `apps/web` - Contains the Next.js SaaS application
- `apps/payload` - Contains the Payload CMS for content management
- `apps/e2e` - Contains Playwright E2E tests
- `.ai/adws/**` - Contains the AI Developer Workflow (ADW) scripts.

Ignore all other files in the codebase.

## Plan Format

```md
# Bug Fix: <bug name>

**Related Diagnosis**: #<diagnosis_issue_number>

## Bug Description
<describe the bug in detail, including symptoms and expected vs actual behavior - summarize from the diagnosis issue>

## Problem Statement
<clearly define the specific problem that needs to be solved - based on the diagnosis>

## Solution Statement
<describe the proposed solution approach to fix the bug - based on the root cause analysis from diagnosis>

## Steps to Reproduce
<list exact steps to reproduce the bug - from diagnosis issue>

## Root Cause Analysis
<summarize the root cause analysis from the diagnosis issue>

## Relevant Files
Use these files to fix the bug:

<find and list the files that are relevant to the bug describe why they are relevant in bullet points. If there are new files that need to be created to fix the bug, list them in an h3 'New Files' section.>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to fix the bug. Order matters, start with the foundational shared changes required to fix the bug then move on to the specific changes required to fix the bug. Include tests that will validate the bug is fixed with zero regressions. Your last step should be running the `Validation Commands` to validate the bug is fixed with zero regressions.>

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

<list commands you'll use to validate with 100% confidence the bug is fixed with zero regressions. every command must execute without errors so be specific about what you want to run to validate the bug is fixed with zero regressions. Include commands to reproduce the bug before and after the fix.>
- `cd app/server && uv run pytest` - Run server tests to validate the bug is fixed with zero regressions

## Notes
<optionally list any additional notes or context that are relevant to the bug that will be helpful to the developer>
```

## Create Bug Fix Issue on GitHub

After creating the plan, create a new GitHub issue with "Bug Fix:" prefix and link to the diagnosis issue:

```typescript
// Create new bug fix issue on GitHub
const fixIssueTitle = bugTitle.startsWith('Bug Fix:')
  ? bugTitle
  : `Bug Fix: ${bugTitle}`;

const fixIssue = await mcp__github__create_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  title: fixIssueTitle,
  body: planContent,
  labels: ['bug-fix', 'ready-to-implement', severity, issueType],
  assignees: [],
});

const fixIssueNumber = fixIssue.number;
const fixIssueUrl = fixIssue.html_url;

// Add comment to diagnosis issue linking to the fix plan
await mcp__github__create_issue_comment({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: parseInt(issueNumber),
  body: `Fix plan created: #${fixIssueNumber}`
});

// Update diagnosis issue to mark it as diagnosed
await mcp__github__update_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: parseInt(issueNumber),
  labels: [...bugLabels, 'diagnosed'],
  state: 'closed'
});

// Also save to local .ai/specs/ for reference
const slug = bugTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
const filename = `.ai/specs/bug-fix-${fixIssueNumber}-${slug}.md`;
await writeFile(filename, planContent);
```

## Bug
$ARGUMENTS - Expected format: GitHub issue number (e.g., `123` or `#123`) from the diagnosis issue