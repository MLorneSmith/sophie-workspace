# Log Issue Command

Usage: `/log-issue [output_format]` (default: github)

- `github`: Create GitHub issue only, with optional local sync (default)
- `local`: Save to `.claude/issues/` only (no GitHub issue)
- `file`: Same as `local` (alternative syntax)

**New GitHub-First Workflow**: GitHub issues are now the single source of truth. Local files can be synced automatically for search purposes using `/sync-issues` command.

This command documents issues systematically using diagnostic tools and creates a standardized issue specification.

## 1. Adopt Role

Load the issue investigator mindset:

```
/read .claude/roles/full-stack-engineer.md
```

## 2. Initial Information Gathering

### 2.1 User Interview

Ask the user for:

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

### 2.2 Automatic parsing of user provided information

From the data provided by the user, create teh following information:

1. **Issue Title**: Brief description (for filename/GitHub title)
2. **Issue Type**:
   - `bug`: Something broken
   - `performance`: Slow or inefficient
   - `error`: Explicit error messages
   - `regression`: Previously working feature broken
   - `integration`: Third-party service issues
3. **Affected Files**: List of files affected
4. **Reproduction Steps**: List of steps to reproduce

### 2.3 Automatic Context Collection

Gather system information:

```bash
# Get current git branch and last commit
git branch --show-current
git log -1 --oneline

# Check for recent changes to affected files
git log --since="3 days ago" --oneline [affected_files]

# Get package versions
cat package.json | grep version
```

## 3. Diagnostic Tool Execution

Based on issue type, run appropriate MCP diagnostics:

### 3.1 For All Issues

```typescript
// Always capture current state
const diagnostics = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  // Add git info, package versions, etc.
};
```

### 3.2 Browser/UI Issues

**When to use Playwright MCP**: For any browser-related issues, UI problems, performance issues, or when you need to reproduce user interactions.

#### Option A: Local Browser Tools (simple issues)

```typescript
// Capture console state
const consoleErrors = (await mcp__browser) - tools__getConsoleErrors();
const consoleLogs = (await mcp__browser) - tools__getConsoleLogs();
const networkErrors = (await mcp__browser) - tools__getNetworkErrors();

// Visual evidence
const screenshot = (await mcp__browser) - tools__takeScreenshot();

// Performance snapshot
const performanceAudit = (await mcp__browser) - tools__runPerformanceAudit();
```

#### Option B: Cloudflare Playwright MCP (complex UI issues)

**Use when**:

- Issue requires user interaction simulation
- Need to test across different browser states
- Complex multi-step reproduction
- Testing form submissions, navigation, or dynamic content
- Performance issues that require page interaction

```typescript
// Navigate to the problematic page
(await mcp__cloudflare) -
  playwright__browser_navigate({
    url: 'https://your-app.com/problematic-page',
  });

// Take accessibility snapshot for better debugging than screenshots
const pageSnapshot = (await mcp__cloudflare) - playwright__browser_snapshot();

// Capture console messages
const consoleMessages =
  (await mcp__cloudflare) - playwright__browser_console_messages();

// Get network requests to diagnose API issues
const networkRequests =
  (await mcp__cloudflare) - playwright__browser_network_requests();

// For form/interaction issues, simulate the user flow
(await mcp__cloudflare) -
  playwright__browser_click({
    element: 'Submit button',
    ref: "[data-testid='submit-btn']",
  });

// Take screenshot after interaction
const errorScreenshot =
  (await mcp__cloudflare) - playwright__browser_take_screenshot();
```

### 3.3 Database Issues

```typescript
// Database health check
const dbAnalysis = await mcp__postgres__pg_analyze_database({
  analysisType: 'performance',
  connectionString: process.env.DATABASE_URL,
});

// Current database state
const dbMonitor = await mcp__postgres__pg_monitor_database({
  includeQueries: true,
  includeLocks: true,
});

// Recent slow queries
const slowQueries = await mcp__postgres__pg_manage_query({
  operation: 'get_slow_queries',
  minDuration: 100,
  limit: 5,
});
```

### 3.4 API/Worker Issues

```typescript
// Check worker logs
const workerLogs =
  (await mcp__cloudflare) -
  observability__query_worker_observability({
    query: {
      view: 'events',
      parameters: {
        filters: [
          {
            key: '$metadata.error',
            operation: 'exists',
            type: 'string',
          },
        ],
      },
      timeframe: {
        /* last hour */
      },
    },
  });

// Supabase service logs
const supabaseLogs = await mcp__supabase__get_logs({
  project_id: 'project_id',
  service: 'api', // or relevant service
});
```

## 4. Issue Specification Creation

### 4.1 Standard Issue Format

Create a structured issue document:

```markdown
# Issue: [Title]

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

### 4.2 GitHub-First Issue Creation

```typescript
let issueId, issueNumber, githubUrl;

if (outputFormat === 'local' || outputFormat === 'file') {
  // Local-only mode (fallback)
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substr(2, 9);
  issueId = `ISSUE-${timestamp}-${hash}`;

  issueContent = issueContent.replace(
    '**ID**: ISSUE-[github_issue_number]',
    `**ID**: ${issueId}`,
  );

  // Save local file immediately
  const datePrefix = new Date().toISOString().split('T')[0];
  const filename = `.claude/issues/${datePrefix}-${issueId}.md`;
  await writeFile(filename, issueContent);
} else {
  // GitHub-first approach (default)
  const issue = await mcp__github__create_issue({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    title: issueTitle,
    body: issueContent,
    labels: [severity, issueType, 'needs-investigation'],
    assignees: [],
  });

  issueNumber = issue.number;
  issueId = `ISSUE-${issueNumber}`;
  githubUrl = issue.html_url;

  // GitHub is now the authoritative source
  // Local sync is optional and handled separately
}
```

### 4.3 Optional Local Sync

```typescript
// Only create local file if requested or for backup
if (
  outputFormat === 'github-with-local' ||
  process.env.FORCE_LOCAL_BACKUP === 'true'
) {
  const datePrefix = new Date().toISOString().split('T')[0];
  const filename = `.claude/issues/${datePrefix}-ISSUE-${issueNumber}.md`;

  // Add sync metadata to local file
  const localContent = `${issueContent}

---
**GitHub Sync Metadata**
- GitHub Issue: #${issueNumber}
- GitHub URL: ${githubUrl}
- Synced: ${new Date().toISOString()}
- Status: mirror (read-only)`;

  await writeFile(filename, localContent);
}
```

## 5. Post-Creation Actions

### 5.1 Summary Output

**GitHub-First Mode (Default):**

```
✅ Issue logged to GitHub successfully!

🔗 GitHub Issue: https://github.com/MLorneSmith/2025slideheroes/issues/123
🏷️ Issue ID: ISSUE-123
🆔 Reference: 123 (for debug command)

Next Steps:
1. To debug this issue, run: /debug-issue 123
2. To add more information, edit the GitHub issue
3. To share with team, use the GitHub link above

Note: Local file will be auto-created when debugging starts
```

**Local-Only Mode:**

```
✅ Issue logged locally!

📁 Local File: .claude/issues/2025-01-06-ISSUE-1234567-abc.md
🏷️ Issue ID: ISSUE-1234567-abc

Next Steps:
1. To debug this issue, run: /debug-issue ISSUE-1234567-abc
2. To create GitHub issue later, copy content to GitHub manually
```

**Note**: The debug-issue command now prioritizes GitHub issue numbers (e.g., `/debug-issue 123`) over local file IDs.

### 5.2 Index Update

Update `.claude/issues/index.md` with:

- Issue ID
- Title
- Severity
- Status
- Created date
- File path

## 6. Diagnostic Tool Selection Guide

### Choosing the Right Tools

#### Use Playwright MCP when:

- **UI Interaction Issues**: Forms not submitting, buttons not working, navigation problems
- **Multi-step Reproduction**: Issues that require clicking through multiple pages/steps
- **Dynamic Content Problems**: Content that loads after user interaction
- **Performance in Context**: Issues that only manifest during user interaction
- **Cross-browser Testing**: Need to verify behavior across different browser states
- **Authentication Flows**: Login/logout issues, session management problems

#### Use Local Browser Tools when:

- **Simple Console Errors**: Just need to see error messages
- **Static Performance Issues**: Page load performance that doesn't require interaction
- **Basic Screenshots**: Visual documentation of current state

#### Use Database Tools when:

- **Slow Queries**: Performance issues in database operations
- **Data Integrity**: Missing or incorrect data
- **Connection Issues**: Database connectivity problems
- **Migration Problems**: Schema or data migration failures

#### Use Cloudflare Observability when:

- **Worker Errors**: Issues with serverless functions
- **API Rate Limiting**: Performance or quota issues
- **Edge Network Issues**: CDN or edge computing problems

### Example Tool Combinations

**Login Flow Issue**:

1. Playwright MCP to simulate login
2. Cloudflare Observability for worker logs
3. Database tools for user query analysis

**Performance Regression**:

1. Playwright MCP for user interaction performance
2. Local browser tools for basic metrics
3. Database tools for query performance

**Form Submission Bug**:

1. Playwright MCP to interact with form
2. Browser console capture for validation errors
3. Network analysis for API call failures

## 7. Diagnostic Patterns

### Pattern Recognition

Look for common patterns in diagnostic data:

- **Memory Leaks**: Increasing memory usage in performance audits
- **N+1 Queries**: Multiple similar queries in database logs
- **CORS Issues**: Specific network error patterns
- **RLS Violations**: Permission denied errors in Supabase
- **Type Mismatches**: Console errors about undefined properties
- **Interaction Failures**: Elements not responding to clicks/inputs
- **Race Conditions**: Timing-dependent failures in user flows

### Automatic Tagging

Based on patterns found, add tags:

- `#memory-leak`
- `#slow-query`
- `#cors-error`
- `#auth-issue`
- `#type-error`
- `#ui-interaction`
- `#form-validation`
- `#race-condition`

## Context Management

### Information Hierarchy

1. Essential: Error messages, stack traces, reproduction steps
2. Important: Diagnostic tool output, recent changes
3. Helpful: Performance metrics, related issues
4. Optional: Full logs, historical data

### Output Control

- Keep issue specs under 2000 lines
- Summarize verbose tool output
- Link to full logs if needed
- Focus on actionable information

## Integration Notes

### For Debug Command

The debug-issue command expects:

- Standardized issue format
- Diagnostic data already collected
- Clear reproduction steps
- Identified affected areas

### For Team Collaboration

- GitHub integration enables team discussion
- Local files allow offline work
- Standardized format ensures consistency
- Diagnostic data provides objective evidence
