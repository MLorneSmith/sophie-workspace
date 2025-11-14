---
description: Diagnose the root cause of a bug or issue when user reports unexpected behavior, errors, or performance problems. Creates structured diagnosis in .ai/specs/ and GitHub issue
model: sonnet
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, Bash(gh *)]
---

# Bug Diagnosis

Identify the root cause of a bug or problem with the code base. Create a new plan in .ai/specs/*.md to describe the bug diagnosis using the exact specified markdown `Plan Format`. Follow the `Instructions` to systematically identify the root cause of the problem and to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

IMPORTANT: You're creating a diagnostic report to identify the root cause of a bug or issue.
IMPORTANT: This is about diagnosis and investigation, not fixing. The diagnosis will inform a separate bug fix plan.
You're creating a thorough diagnostic report that will help developers understand and fix the root cause.

1. **Interview user**. Ask the user for:
   1. **Issue Description**: Brief description
   2. **Nature of Issue**: Is it a bug, performance, error, regression, or integration problem?
   3. **Issue Type**:
      - `bug`: Something broken
      - `performance`: Slow or inefficient
      - `error`: Explicit error messages
      - `regression`: Previously working feature broken
      - `integration`: Third-party service issues
   4. **Severity**: `critical`, `high`, `medium`, `low`
   5. **Expected vs Actual**: What should happen vs what happens
   6. **Environment**: Development/staging/production
   7. **First Noticed**: When the issue started

2. **Parse user provided data**. From the data provided by the user, extract and define the following variables:
   ```typescript
   const issueTitle = '[Brief description for GitHub title]'; // e.g., "Login fails with 500 error"
   const issueType = '[bug|performance|error|regression|integration]';
   const severity = '[critical|high|medium|low]';
   const affectedFiles = ['file1.ts', 'file2.tsx']; // List of files affected
   const reproductionSteps = ['Step 1', 'Step 2', 'Step 3']; // Steps to reproduce
   ```

3. **Gather system information**:
   - Get current git branch and last commit
   - Check for recent changes to affected files using git log
   - Get package versions from package.json
   - Capture environment details (Node version, database version, etc.)

4. **Run relevant diagnostic tools** (when applicable):
   - **Browser/UI issues**: Use browser developer tools, check console errors, network tab
   - **Database issues**: Check database logs, query performance, connection status
   - **Performance issues**: Run performance profiling, check memory usage
   - If specialized MCP tools are available (Cloudflare, PostgreSQL), use them for deeper analysis
   - If tools are not available, gather diagnostic data through standard commands and logs

5. **Research the issue**:
   - Start by reading the `README.md` file to understand the project context
   - Use the Task tool with `subagent_type=Explore` to investigate the codebase
   - Search for error messages, stack traces, and related code patterns
   - Identify affected components and their dependencies

6. **Discover related previous issues**:
   ```bash
   # Search for related issues using GitHub CLI
   # Search by error message or keywords
   gh issue list \
     --repo MLorneSmith/2025slideheroes \
     --search "<error-keywords>" \
     --state all \
     --limit 20

   # Search by affected files or components
   gh issue list \
     --repo MLorneSmith/2025slideheroes \
     --search "<component-name>" \
     --state all \
     --limit 20

   # Categorize found issues:
   # - Direct predecessors: Same problem, previously closed
   # - Infrastructure issues: Related setup/config problems
   # - Similar symptoms: Similar errors or behaviors
   # - Same component: Same files/components affected
   # - Possible regressions: Previously fixed, might have returned
   ```

7. **Create the bug diagnosis** in the `.ai/specs/*.md` file:
   - Use the `Plan Format` below to create the diagnosis
   - IMPORTANT: Replace every <placeholder> with actual diagnostic data
   - Include all relevant evidence, logs, and analysis
   - Name the diagnosis using the following naming convention:
     - 'Bug Diagnosis: `issueTitle`'

8. **Create the issue on GitHub** using the `GitHub Issue Creation` process

9. **When you finish creating the diagnosis**, follow the `Report` section to properly report the results of your work


## Plan Format

```md
# Bug Diagnosis: [Title]

**ID**: ISSUE-[github_issue_number] (or ISSUE-[timestamp]-[hash] if local only)
**Created**: [ISO timestamp]
**Reporter**: [user/system]
**Severity**: [critical|high|medium|low]
**Status**: new
**Type**: [bug|performance|error|regression|integration]

## Summary

[One paragraph description of the issue]

## Environment

- **Application Version**: [version]
- **Environment**: [development|staging|production]
- **Browser**: [if applicable]
- **Node Version**: [version]
- **Database**: [PostgreSQL version]
- **Last Working**: [date/commit if known]

## Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Diagnostic Data

### Console Output
```

[Console errors/logs from diagnostic tools]

```

### Network Analysis
```

[Network errors/failed requests]

```

### Database Analysis
```

[Slow queries, locks, performance metrics]

```

### Performance Metrics
```

[Performance audit results]

```

### Screenshots
[Links to screenshots if captured]

## Error Stack Traces
```

[Any stack traces found]

```

## Related Code
- **Affected Files**:
  - [file1.ts]
  - [file2.tsx]
- **Recent Changes**: [git commits affecting these files]
- **Suspected Functions**: [specific functions/components]

## Related Issues & Context

### Direct Predecessors
[Issues that describe the same/very similar problem, especially if closed]
- #[number] ([STATUS]): "[Title]" - [Brief description of similarity]

### Related Infrastructure Issues
[Issues affecting the same infrastructure/setup]
- #[number]: "[Title]" - [How it relates]

### Similar Symptoms
[Issues with similar error patterns or behaviors]
- #[number]: "[Title]" - [Common symptoms]

### Same Component
[Issues affecting the same files/components]
- #[number]: "[Title]" - [Affected areas]

### Historical Context
[Summary of pattern if multiple related issues found]
[Note if this appears to be a regression of a previously fixed issue]

## Initial Analysis
[Automated analysis based on diagnostic data]

## Suggested Investigation Areas
1. [Area 1 based on diagnostics]
2. [Area 2 based on patterns]
3. [Area 3 based on logs]

## Additional Context
[Any other relevant information]

---
*Generated by Claude Debug Assistant*
*Tools Used: [List of tools and commands used during diagnosis]*
```

## Pre-Diagnosis Checklist

Before starting diagnosis:
- [ ] Gather initial user report and symptoms
- [ ] Identify severity and environment
- [ ] Collect reproduction steps from user
- [ ] Check if similar issues were reported before
- [ ] Verify the issue is reproducible

## GitHub Issue Creation

Use the GitHub CLI (`gh`) to create the diagnosis issue:

```bash
# Create diagnosis issue on GitHub with 'Bug Diagnosis:' prefix and appropriate labels
# If the issue title doesn't start with 'Bug Diagnosis:', add the prefix
# Convert severity and issueType to lowercase for label compatibility
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Bug Diagnosis: <issueTitle>" \
  --body "<issue-content>" \
  --label "issue" \
  --label "needs-investigation" \
  --label "<severity>" \
  --label "<issueType>"

# Capture the issue URL and number from the output
# The gh CLI will output the URL in format: https://github.com/MLorneSmith/2025slideheroes/issues/<number>
```

## Report

- Summarize the work you've just done in a concise bullet point list.
- Include a path to the diagnosis you created in the `.ai/specs/*.md` file.
- Report the GitHub issue #