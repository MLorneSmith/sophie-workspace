---
description: Create a bug fix plan from a GitHub diagnosis issue. Fetches diagnosis, analyzes root cause, and creates structured fix plan with reproduction steps and validation
argument-hint: [issue-number]
model: sonnet
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Bug Planning

Create a new plan in .ai/specs/*.md to resolve the `Bug` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

IMPORTANT: You're writing a plan to resolve a bug based on the `Bug` that will add value to the application.
IMPORTANT: The `Bug` describes the bug that will be resolved but remember we're not resolving the bug, we're creating the plan that will be used to resolve the bug based on the `Plan Format` below.
You're writing a plan to resolve a bug, it should be thorough and precise so we fix the root cause and prevent regressions.

1. **Fetch Bug Diagnosis from GitHub**: If $ARGUMENTS contains a GitHub issue number (e.g., `123` or `#123`), fetch the bug diagnosis using GitHub CLI:
   ```bash
   # Extract issue number and fetch the diagnosis issue
   gh issue view <issue-number> \
     --repo MLorneSmith/2025slideheroes \
     --json body,title,labels \
     --jq '{body: .body, title: .title, labels: [.labels[].name]}'
   ```

   If no issue number provided, interview the user for bug details (see step 2).

2. **Interview user** (if no GitHub issue provided). Ask the user for:
   1. **Bug Description**: Brief description of the bug
   2. **Bug Type**:
      - `logic`: Logic or business rule error
      - `ui`: User interface bug
      - `performance`: Performance issue
      - `security`: Security vulnerability
      - `data`: Data integrity issue
   3. **Severity**: `critical`, `high`, `medium`, `low`

3. **Parse bug data**. From the GitHub issue or user interview, extract and define the following variables:
   ```typescript
   const bugTitle = '[Brief description for GitHub title]'; // e.g., "Fix authentication timeout"
   const bugType = '[logic|ui|performance|security|data]';
   const severity = '[critical|high|medium|low]';
   const diagnosisIssueNumber = '[issue-number]'; // If from GitHub, otherwise null
   ```

4. **Research the codebase** and put together a plan to fix the bug.
   - Start your research by reading the `README.md` file.
   - Research the codebase to understand the bug, reproduce it, and put together a plan to fix it.

5. **Create the plan** in the `.ai/specs/*.md` file.
   - Use the `Plan Format` below to create the plan.
   - IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to fix the bug.
   - Use your reasoning model: THINK HARD about the bug, its root cause, and the steps to fix it properly.
   - IMPORTANT: Be surgical with your bug fix, solve the bug at hand and don't fall off track.
   - IMPORTANT: We want the minimal number of changes that will fix and address the bug.
   - Don't use decorators. Keep it simple.
   - If you need a new library, use `pnpm add <package>` (or `pnpm add -D <package>` for dev dependencies) in the appropriate workspace. For workspace-specific packages, use `pnpm --filter <workspace> add <package>`. Be sure to report all new dependencies in the `Notes` section of the `Plan Format`.
   - Respect requested files in the `Relevant Files` section.
   - Name the plan using the following naming convention:
     - 'Bug Fix: `bugTitle`'

6. **Create the plan on GitHub** using the `GitHub Issue Creation` process

7. **When you finish creating the plan** for the bug fix, follow the `Report` section to properly report the results of your work.

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

<list commands you'll use to validate with 100% confidence the bug is fixed with zero regressions. every command must execute without errors so be specific about what you want to run to validate the bug is fixed with zero regressions. Include commands to reproduce the bug before and after the fix. Don't validate with curl commands.>

## Notes
<optionally list any additional notes or context that are relevant to the bug that will be helpful to the developer>
```

## GitHub Issue Creation

Use the GitHub CLI (`gh`) to create the bug fix issue:

```bash
# Create bug fix issue on GitHub with 'Bug Fix:' prefix and appropriate labels
# If the issue title doesn't start with 'Bug Fix:', add the prefix
# Convert severity and bugType to lowercase for label compatibility
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Bug Fix: <bugTitle>" \
  --body "<issue-content>" \
  --label "bug-fix" \
  --label "ready-to-implement" \
  --label "<severity>" \
  --label "<bugType>"

# Capture the issue URL and number from the output
# The gh CLI will output the URL in format: https://github.com/MLorneSmith/2025slideheroes/issues/<number>

# If this bug fix was created from a diagnosis issue, add comment to link them
# and close the diagnosis issue
gh issue comment <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --body "Fix plan created: #<fixIssueNumber>"

gh issue edit <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "diagnosed"

gh issue close <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --comment "Diagnosis complete. Fix plan: #<fixIssueNumber>"
```

## Bug
$ARGUMENTS

## Report

- Summarize the work you've just done in a concise bullet point list.
- Include a path to the plan you created in the `.ai/specs/*.md` file.
- Report the GitHub issue #