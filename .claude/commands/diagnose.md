---
description: Diagnose the root cause of a bug or issue when user reports unexpected behavior, errors, or performance problems. Creates structured diagnosis in .ai/specs/ and GitHub issue
model: sonnet
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, Bash(gh *)]
---

# Bug Diagnosis

Identify the root cause of a bug or problem with the code base. Create a new plan in .ai/specs/*.md to describe the bug diagnosis using the exact specified markdown `Plan Format`. Follow the `Instructions` to systematically identify the root cause of the problem and to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

1. Interview user. Ask the user for:
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

2. Parse user provided data. From the data provided by the user, extract and define the following variables:
   ```typescript
   const issueTitle = '[Brief description for GitHub title]'; // e.g., "Login fails with 500 error"
   const issueType = '[bug|performance|error|regression|integration]';
   const severity = '[critical|high|medium|low]';
   const affectedFiles = ['file1.ts', 'file2.tsx']; // List of files affected
   const reproductionSteps = ['Step 1', 'Step 2', 'Step 3']; // Steps to reproduce
   ```

3.  Gather system information
    1.  Get current git branch and last commit
    2.  Check for recent changes to affected files
    3.  Get package versions
   
4. Run relevant diagnostic tools
   1. If Browser/UI issue
      1. Use Cloudflare MCP tool to diagnose issue
   2. If Database issue
      1. Use postgres mcp server to diagnose issue

5. Research issue
   1. Use the research-expert agent to research this issue

6. Discover any related previous issue(s)
   ```typescript
    // Search for related issues using multiple strategies
    const relatedIssues = await findRelatedIssues({
    keywords: extractKeywords(issueTitle, issueDescription),
    component: identifyComponent(issueDescription),
    errorPattern: extractErrorPattern(errorMessage),
    affectedFiles: extractAffectedFiles(issueDescription)
    });

    // Categorize found issues
    const categorized = {
    directPredecessors: [], // Same problem, previously closed
    infrastructureIssues: [], // Related setup/config problems
    similarSymptoms: [], // Similar errors or behaviors
    sameComponent: [], // Same files/components affected
    possibleRegressions: [] // Previously fixed, might have returned
    };
    ```

7. Create the bug diagnosis using the `Plan Format`

8. Create the issue on Github using the `Github Issue Creation` process


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

[Console errors/logs from MCP tools]

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
*Tools Used: [List of MCP tools used]*
*Playwright Session: [Include session info if Playwright MCP was used]*
```

## GitHub Issue Creation

```typescript
// Create issue on GitHub with 'Bug Diagnosis:' prefix
const githubTitle = issueTitle.startsWith('Bug Diagnosis:')
  ? issueTitle
  : `Bug Diagnosis: ${issueTitle}`;

const issue = await mcp__github__create_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  title: githubTitle,
  body: issueContent,
  labels: ['issue', severity, issueType, 'needs-investigation'],
  assignees: [],
});

const issueNumber = issue.number;
const issueId = `ISSUE-${issueNumber}`;
const githubUrl = issue.html_url;

// GitHub is the authoritative source
```