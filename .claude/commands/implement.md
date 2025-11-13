---
description: Execute implementation of a plan from GitHub issue. Fetches plan, follows step-by-step tasks, runs validation commands, and reports completion with git stats
argument-hint: [issue-number]
model: sonnet
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash(git *), Bash(gh *), Bash(pnpm *), Task, TodoWrite]
---

# Implement the following plan
Follow the `Instructions` to implement the `Plan` then `Report` the completed work.

## Instructions

1. **Fetch Implementation Plan from GitHub**: If $ARGUMENTS contains a GitHub issue number (e.g., `123` or `#123`), fetch the plan:
   ```typescript
   // Extract issue number from arguments
   const issueNumber = $ARGUMENTS.replace('#', '').trim();

   // Fetch the implementation plan from GitHub
   const issue = await mcp__github__get_issue({
     owner: 'MLorneSmith',
     repo: '2025slideheroes',
     issue_number: parseInt(issueNumber)
   });

   // Extract the plan content and metadata
   const planContent = issue.body; // Full plan in markdown
   const planTitle = issue.title; // e.g., "Bug Fix: Login fails with 500 error"
   const planLabels = issue.labels; // severity, type, etc.
   const issueUrl = issue.html_url;
   ```

2. **Implement the Plan**:
   - Read the plan carefully and think hard about the implementation
   - Follow the "Step by Step Tasks" section in order, top to bottom
   - Execute the "Validation Commands" to ensure zero regressions
   - Track progress using TodoWrite for complex implementations

3. **Update GitHub Issue**:
   ```typescript
   // Add progress comments as you work (optional but recommended for long implementations)
   await mcp__github__create_issue_comment({
     owner: 'MLorneSmith',
     repo: '2025slideheroes',
     issue_number: parseInt(issueNumber),
     body: '🔄 Implementation in progress...\n\n' + progressUpdate
   });
   ```

## Plan
If $ARGUMENTS is not a GitHub issue number, treat it as the plan content directly:
$ARGUMENTS

## Report

After completing the implementation:

1. **Create completion summary**:
   - Summarize the work you've just done in a concise bullet point list
   - Report the files and total lines changed with `git diff --stat`

2. **Post completion report to GitHub**:
   ```typescript
   // Create completion report
   const completionReport = `
   ## ✅ Implementation Complete

   ### Summary
   [Bullet point list of what was implemented]

   ### Files Changed
   \`\`\`
   [Output from git diff --stat]
   \`\`\`

   ### Validation
   [Results from running the Validation Commands]

   ---
   *Implementation completed by Claude*
   `;

   // Post report as comment
   await mcp__github__create_issue_comment({
     owner: 'MLorneSmith',
     repo: '2025slideheroes',
     issue_number: parseInt(issueNumber),
     body: completionReport
   });

   // Update labels and close the issue
   await mcp__github__update_issue({
     owner: 'MLorneSmith',
     repo: '2025slideheroes',
     issue_number: parseInt(issueNumber),
     labels: [...planLabels, 'implemented'],
     state: 'closed'
   });
   ```