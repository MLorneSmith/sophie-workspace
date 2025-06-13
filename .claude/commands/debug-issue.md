# Debug Issue Command

Usage: `/debug-issue [issue_reference]`

- GitHub issue number: `123` (preferred format from log-issue command)
- Issue ID: `ISSUE-123`
- Local file: `.claude/issues/2025-01-06-ISSUE-123.md`
- GitHub URL: `https://github.com/MLorneSmith/2025slideheroes/issues/123`
- Legacy format: `ISSUE-1234567-abc` (for older local-only issues)

This command reads an issue specification and launches a focused debugging session to resolve it.

## 1. Adopt Role

Load the debugging mindset:

```
/read .claude/roles/full-stack-engineer.md
```

## 2. Load Issue Specification

### 2.1 Auto-Sync and Locate Issue

Use the auto-sync service to fetch/cache issues automatically:

```bash
# First, run auto-sync to ensure we have the latest issue data
.claude/scripts/sync-issue.sh ${issue_reference}

# The script will:
# 1. Detect if it's a GitHub issue (number, ISSUE-123, #123, URL)
# 2. Auto-fetch from GitHub if needed
# 3. Create/update local cache file
# 4. Handle fallbacks gracefully
```

### 2.2 Parse Issue Reference

The auto-sync service handles all reference formats:

```bash
# Examples of supported formats:
.claude/scripts/sync-issue.sh 30              # GitHub issue #30
.claude/scripts/sync-issue.sh ISSUE-30        # ISSUE-30 format
.claude/scripts/sync-issue.sh "#30"           # Hash format
.claude/scripts/sync-issue.sh "https://github.com/MLorneSmith/2025slideheroes/issues/30"  # Full URL
.claude/scripts/sync-issue.sh "2025-06-13-ISSUE-30.md"  # Direct local file (legacy)
```

### 2.3 Load Synced Issue

After auto-sync completes, read the local file:

```bash
# Auto-sync creates files in format: YYYY-MM-DD-ISSUE-{number}.md
# Find the synced file
issue_file=$(find .claude/issues -name "*-ISSUE-${issue_number}.md" | head -1)

if [ -z "$issue_file" ]; then
  echo "❌ Issue file not found after auto-sync"
  exit 1
fi

echo "📁 Using issue file: $issue_file"
```

### 2.2 Read and Parse Issue

```typescript
// Read the issue specification
const issueContent = await readFile(issuePath);
const issue = parseIssueSpecification(issueContent);

// Extract key information
const {
  id,
  severity,
  type,
  affectedFiles,
  diagnosticData,
  reproductionSteps,
  suggestedAreas,
} = issue;
```

### 2.3 Load Context Docs

Based on issue type, load relevant debugging docs:

```typescript
const contextDocs = {
  bug: ['.claude/docs/debugging/common-patterns.md'],
  performance: ['.claude/docs/debugging/performance-debugging.md'],
  error: ['.claude/docs/debugging/error-handling.md'],
  database: ['.claude/docs/debugging/database-debugging.md'],
  integration: ['.claude/docs/debugging/integration-debugging.md'],
};

// Read relevant context
for (const doc of contextDocs[issue.type]) {
  await readFile(doc);
}
```

## 3. Issue Analysis & Planning

### 3.1 Review Diagnostic Data

Analyze the pre-collected diagnostic information:

1. **Error Patterns**: Look for specific error messages
2. **Performance Metrics**: Identify bottlenecks
3. **Query Analysis**: Find inefficient queries
4. **Network Issues**: Check failed requests
5. **Console Output**: Review warnings and errors

### 3.2 Create Debug Plan

Based on issue analysis:

```markdown
## Debug Plan for [Issue ID]

### Priority 1: Immediate Actions

- [ ] Reproduce issue locally
- [ ] Verify diagnostic data is current
- [ ] Check recent code changes

### Priority 2: Root Cause Analysis

- [ ] Investigate [suggested area 1]
- [ ] Test hypothesis: [based on diagnostics]
- [ ] Check related components

### Priority 3: Solution Implementation

- [ ] Implement fix for root cause
- [ ] Add error handling/logging
- [ ] Create tests to prevent regression

### Priority 4: Verification

- [ ] Test fix in development
- [ ] Re-run diagnostic tools
- [ ] Update documentation
```

### 3.3 Set Up Debug Environment

```bash
# Checkout relevant branch if needed
git checkout [branch]

# Ensure environment matches issue report
export NODE_ENV=[reported_environment]

# Start necessary services
pnpm dev
```

## 4. Reproduction & Investigation

### 4.1 Reproduce the Issue

Follow the documented reproduction steps:

```typescript
// Use MCP tools to monitor while reproducing
mcp__browser - tools__wipeLogs(); // Clear logs

// Execute reproduction steps
for (const step of issue.reproductionSteps) {
  console.log(`Executing: ${step}`);
  // Perform step
}

// Capture new diagnostic data
const currentErrors = (await mcp__browser) - tools__getConsoleErrors();
const currentNetwork = (await mcp__browser) - tools__getNetworkErrors();
```

### 4.2 Deep Dive Investigation

Based on issue type, perform targeted investigation:

#### For Runtime Errors:

1. Set breakpoints in suspected functions
2. Add console.log statements for variable inspection
3. Check error boundaries and try-catch blocks
4. Verify async/await handling

#### For Performance Issues:

1. Profile the application
2. Check React DevTools for re-renders
3. Analyze bundle size
4. Review database query plans

#### For Database Issues:

1. Test queries in isolation
2. Check RLS policies
3. Verify indexes
4. Monitor connection pool

#### For Type Errors:

1. Run targeted type checking
2. Check interface definitions
3. Verify API response shapes
4. Review type assertions

### 4.3 Compare with Baseline

```typescript
// Compare current state with issue report
const comparison = {
  original: issue.diagnosticData,
  current: currentDiagnosticData,
  differences: findDifferences(issue.diagnosticData, currentDiagnosticData),
};
```

## 5. Solution Implementation

### 5.1 Implement Fix

Based on root cause analysis:

```typescript
// Read affected files
for (const file of issue.affectedFiles) {
  await readFile(file);
}

// Apply fixes based on issue type
switch (issue.type) {
  case 'error':
    // Add error handling
    // Fix logic errors
    // Add validation
    break;
  case 'performance':
    // Optimize queries
    // Add caching
    // Implement lazy loading
    break;
  case 'database':
    // Fix queries
    // Update RLS policies
    // Add indexes
    break;
}
```

### 5.2 Add Defensive Measures

```typescript
// Add logging for future debugging
logger.info('Fixed issue context', {
  issueId: issue.id,
  action: 'specific_action',
  timestamp: new Date(),
});

// Add error tracking
if (error) {
  errorReporter.capture(error, {
    issueId: issue.id,
    context: debugContext,
  });
}

// Add performance monitoring
performance.mark('issue-fix-start');
// ... operation ...
performance.measure('issue-fix', 'issue-fix-start');
```

### 5.3 Create Tests

```typescript
// Create regression test
const testFile = `${affectedFile}.test.ts`;
const testContent = generateRegressionTest(issue);
await writeFile(testFile, testContent);
```

## 6. Verification & Documentation

### 6.1 Verify Fix

Re-run diagnostic tools to confirm resolution:

```typescript
// Clear and re-test
mcp__browser - tools__wipeLogs();

// Reproduce original steps
// Should no longer see the issue

// Run diagnostic tools
const verificationResults = {
  consoleErrors: (await mcp__browser) - tools__getConsoleErrors(),
  networkErrors: (await mcp__browser) - tools__getNetworkErrors(),
  performance: (await mcp__browser) - tools__runPerformanceAudit(),
};

// For database fixes
const dbVerification = await mcp__postgres__pg_analyze_database({
  analysisType: 'performance',
});
```

### 6.2 Update Issue Documentation

Create resolution report:

```markdown
## Resolution Report

**Issue ID**: [ID]
**Resolved Date**: [timestamp]
**Resolver**: Claude Debug Assistant

### Root Cause

[Detailed explanation of what caused the issue]

### Solution Implemented

[Description of the fix]

### Files Modified

- [file1.ts] - [brief description of changes]
- [file2.tsx] - [brief description of changes]

### Verification Results

- ✅ Issue no longer reproducible
- ✅ No new errors introduced
- ✅ Performance metrics improved/maintained
- ✅ Tests added to prevent regression

### Lessons Learned

[Key takeaways for preventing similar issues]
```

### 6.3 Update Issue Status

```typescript
// Update local issue file
issue.status = 'resolved';
issue.resolvedDate = new Date().toISOString();
issue.resolution = resolutionReport;

// Update GitHub if applicable
if (issue.githubNumber) {
  await mcp__github__update_issue({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    issue_number: issue.githubNumber,
    state: 'closed',
    body: issue.body + '\n\n' + resolutionReport,
  });
}
```

## 7. Post-Debug Actions

### 7.1 Create PR if Needed

```bash
# Create branch for fix
git checkout -b fix/issue-${issueId}

# Commit changes
git add [modified_files]
git commit -m "fix: resolve ${issue.title}

- ${bulletPoint1}
- ${bulletPoint2}

Fixes #${issue.githubNumber}"

# Create PR
gh pr create --title "Fix: ${issue.title}" --body "..."
```

### 7.2 Knowledge Base Update

If the issue revealed a gap:

1. Update debugging documentation
2. Add to common patterns
3. Create troubleshooting guide
4. Update team runbook

### 7.3 Summary Output

```
✅ Issue Resolved Successfully!

📋 Issue: ISSUE-1234567-abc
🔧 Root Cause: [brief description]
💡 Solution: [brief description]
📁 Modified Files: 3
✅ Tests Added: 2
🚀 Status: Ready for review

Next Steps:
1. Review PR: [PR link]
2. Deploy to staging for verification
3. Monitor for regressions
```

## Context Management

### Focus Strategies

1. **Single Issue Focus**: Work on one issue at a time
2. **Relevant Context**: Only load files mentioned in issue
3. **Incremental Changes**: Make small, testable changes
4. **Regular Verification**: Test after each change

### When to Stop

- Issue is resolved and verified
- Hit context limits (suggest continuing in new session)
- Need additional information not in issue spec
- Discovered this is actually multiple issues

## Integration with Log-Issue

### Feedback Loop

- Update issue specs with new findings
- Add discovered patterns to diagnostics
- Improve reproduction steps
- Document workarounds if no fix possible

### Pattern Library

Build a library of issue patterns:

```
.claude/issues/patterns/
├── slow-query-pattern.md
├── memory-leak-pattern.md
├── cors-error-pattern.md
└── type-mismatch-pattern.md
```
