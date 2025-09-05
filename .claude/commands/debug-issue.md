# Debug Issue Command

Usage: `/debug-issue [issue_reference]`

- GitHub issue number: `123` (preferred format from log-issue command)
- Issue ID: `ISSUE-123`
- Local file: `.claude/z.archive/issues/2025-01-06-ISSUE-123.md`
- GitHub URL: `https://github.com/MLorneSmith/2025slideheroes/issues/123`
- Legacy format: `ISSUE-1234567-abc` (for older local-only issues)

This command reads an issue specification and launches a focused debugging session to resolve it.

**CRITICAL**: Always review GitHub issue comments for the most current status and implementation progress, as issue descriptions may be outdated.

## 1. Fetch Issue from GitHub (FIRST PRIORITY)

**Always start by fetching the issue to understand what you're debugging:**

### 1.1 Direct GitHub Fetch

```bash
# Parse the issue reference
if [[ "$issue_reference" =~ ^[0-9]+$ ]]; then
  issue_number=$issue_reference
elif [[ "$issue_reference" =~ ^ISSUE-([0-9]+)$ ]]; then
  issue_number=${BASH_REMATCH[1]}
elif [[ "$issue_reference" =~ ^#([0-9]+)$ ]]; then
  issue_number=${BASH_REMATCH[1]}
elif [[ "$issue_reference" =~ github\.com/.*/issues/([0-9]+) ]]; then
  issue_number=${BASH_REMATCH[1]}
else
  # Legacy local format
  issue_id=$issue_reference
fi

# Simple, direct fetch with comments included
if [ -n "$issue_number" ]; then
  gh issue view $issue_number --repo MLorneSmith/2025slideheroes --json number,title,body,state,labels,assignees,createdAt,updatedAt,comments > /tmp/issue-$issue_number.json
  
  if [ $? -eq 0 ]; then
    echo "✅ Fetched issue #$issue_number with comments from GitHub"
    
    # Display issue summary immediately
    jq -r '"\n📋 Issue #\(.number): \(.title)\n📊 State: \(.state)\n🏷️ Labels: \(.labels | map(.name) | join(", "))\n💬 Comments: \(.comments | length)"' /tmp/issue-$issue_number.json
  else
    echo "❌ Failed to fetch issue #$issue_number from GitHub"
    exit 1
  fi
fi
```

### 1.2 Parse Issue Reference

The command supports multiple reference formats:

```bash
# Examples of supported formats:
/debug-issue 30              # GitHub issue #30
/debug-issue ISSUE-30        # ISSUE-30 format  
/debug-issue "#30"           # Hash format
/debug-issue "https://github.com/MLorneSmith/2025slideheroes/issues/30"  # Full URL
/debug-issue ISSUE-1234567-abc  # Legacy local-only format
```

### 1.3 Display Issue Content and Comments

Load the issue content from GitHub or local file:

```bash
if [ -n "$issue_number" ]; then
  # Extract content from GitHub issue JSON
  issue_title=$(jq -r '.title' /tmp/issue-$issue_number.json)
  issue_body=$(jq -r '.body' /tmp/issue-$issue_number.json)
  issue_state=$(jq -r '.state' /tmp/issue-$issue_number.json)
  issue_labels=$(jq -r '.labels[].name' /tmp/issue-$issue_number.json | tr '\n' ' ')
  
  echo "📋 Issue #$issue_number: $issue_title"
  echo "📊 State: $issue_state"
  echo "🏷️ Labels: $issue_labels"
else
  # For legacy local-only issues
  issue_file=$(find .claude/z.archive/issues -name "*-${issue_id}.md" | head -1)
  
  if [ -z "$issue_file" ]; then
    echo "❌ Local issue file not found: $issue_id"
    exit 1
  fi
  
  echo "📁 Using local issue file: $issue_file"
fi
```

### 1.4 Parse Issue Data

```typescript
// For GitHub issues
if (issueNumber) {
  const issueJson = JSON.parse(await readFile(`/tmp/issue-${issueNumber}.json`));
  const issue = {
    id: `ISSUE-${issueNumber}`,
    title: issueJson.title,
    body: issueJson.body,
    state: issueJson.state,
    labels: issueJson.labels.map(l => l.name),
    // Parse additional fields from the body
    severity: extractSeverity(issueJson.body),
    type: extractType(issueJson.labels),
    affectedFiles: extractAffectedFiles(issueJson.body),
    diagnosticData: extractDiagnosticData(issueJson.body),
    reproductionSteps: extractReproductionSteps(issueJson.body),
    suggestedAreas: extractSuggestedAreas(issueJson.body),
  };
} else {
  // For legacy local files
  const issueContent = await readFile(issuePath);
  const issue = parseIssueSpecification(issueContent);
}
```

### 1.5 Review GitHub Issue Comments (Critical Step)

**IMPORTANT**: Always review GitHub issue comments for status updates, implementation progress, and current context:

```bash
# Review all comments on the GitHub issue for latest status
gh issue view ${issue_number} --repo MLorneSmith/2025slideheroes --comments

# This will show:
# - Implementation status updates
# - Progress reports
# - Current phase information
# - Next steps and priorities
# - Technical decisions made
# - Blockers and resolutions
```

**Why This Is Critical**:

- GitHub issue descriptions may be outdated
- Comments contain the most current status and context
- Implementation progress is tracked in comments
- Status updates override initial issue description
- Comments reveal actual current state vs original problem

**What to Look For**:

- **Status Update Comments**: "IMPLEMENTATION STATUS UPDATE", "Progress Update", etc.
- **Current Phase Information**: What's completed vs what's pending
- **Next Steps**: Specific tasks and priorities for current session
- **Technical Context**: Decisions, approaches, and discoveries
- **Blockers and Solutions**: Known issues and their resolutions

## 2. Adopt Debug Role

**After understanding the issue, adopt the debugging mindset:**

```
/read .claude/context/roles/debug-engineer.md
```

## 3. Load Context Documentation (Based on Issue Analysis)

**Only load context relevant to the specific issue you're debugging:**

### 3.1 Selective Context Loading

**Based on the issue type from section 1, load ONLY relevant documentation:**

### 3.2 Core Context (Optional)

**Only if needed for the specific issue:**

```
# Load if debugging patterns are relevant:
.claude/docs/debugging/common-patterns.md
.claude/docs/debugging/debugging-system-overview.md
```

### 3.3 Issue-Specific Context

**Load documentation based on the actual issue content from section 1:**

```typescript
// Based on issue analysis, select relevant docs from the inventory:
const contextMap = {
  // Frontend/UI issues
  ui: [
    '.claude/docs/ui/component-patterns.md',
    '.claude/docs/ui/accessibility.md',
    '.claude/docs/ui/responsive-design.md',
    '.claude/docs/architecture/state-management.md',
  ],

  // Backend/Database issues
  database: [
    '.claude/docs/data/database-schema.md',
    '.claude/docs/data/supabase-patterns.md',
    '.claude/docs/debugging/database-debugging.md',
    '.claude/docs/security/authorization-patterns.md', // For RLS issues
  ],

  // Performance issues
  performance: [
    '.claude/docs/debugging/performance-debugging.md',
    '.claude/docs/architecture/performance-optimization.md',
    '.claude/docs/data/react-query-patterns.md', // For caching issues
  ],

  // Integration issues
  integration: [
    '.claude/docs/debugging/integration-debugging.md',
    '.claude/docs/architecture/system-design.md',
    '.claude/docs/architecture/service-patterns.md',
    '.claude/docs/ai/portkey-integration.md', // For AI service issues
  ],

  // Type/Build issues
  typescript: [
    '.claude/docs/debugging/error-handling.md',
    '.claude/docs/testing/unit-testing-patterns.md',
  ],

  // Authentication issues
  auth: [
    '.claude/docs/security/authentication-patterns.md',
    '.claude/docs/security/authorization-patterns.md',
    '.claude/docs/data/supabase-patterns.md',
  ],

  // CMS issues
  cms: [
    '.claude/docs/cms/payload-patterns.md',
    '.claude/docs/cms/database-verification-repair.md',
    '.claude/docs/cms/content-migration-troubleshooting.md',
  ],

  // Testing issues
  testing: [
    '.claude/docs/testing/unit-testing-prioritization-plan.md',
    '.claude/docs/testing/context/testing-fundamentals.md',
    '.claude/docs/testing/context/mocking-and-typescript.md',
    '.claude/docs/testing/context/testing-examples.md',
  ],
};

// Note: Use the inventory to discover additional relevant docs not listed here
```

### 3.4 Loading Strategy

1. **Be highly selective** - Only load what's directly relevant to the issue
2. **Skip generic documentation** unless specifically needed
3. **Load in parallel** when loading multiple docs
4. **Check test cases** only if debugging a specific component with tests

### 3.5 Context Loading Example

```typescript
// Example: Only load what's needed based on issue analysis
if (issue.labels.includes('database') || issue.body.includes('RLS')) {
  // Load database-specific docs
  await parallelRead([
    '.claude/docs/data/supabase-patterns.md',
    '.claude/docs/debugging/database-debugging.md'
  ]);
}
// Otherwise, skip unnecessary context loading
```

## 4. Issue Analysis & Planning

### 4.1 Review Diagnostic Data

Analyze the pre-collected diagnostic information:

1. **Error Patterns**: Look for specific error messages
2. **Performance Metrics**: Identify bottlenecks
3. **Query Analysis**: Find inefficient queries
4. **Network Issues**: Check failed requests
5. **Console Output**: Review warnings and errors

### 4.2 Create Debug Plan

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

### 4.3 Set Up Debug Environment

```bash
# Checkout relevant branch if needed
git checkout [branch]

# Ensure environment matches issue report
export NODE_ENV=[reported_environment]

# Start necessary services
pnpm dev
```

## 5. Reproduction & Investigation

### 5.1 Reproduce the Issue

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

### 5.2 Deep Dive Investigation

Based on issue type, perform targeted investigation:

#### For Runtime Errors

1. Set breakpoints in suspected functions
2. Add console.log statements for variable inspection
3. Check error boundaries and try-catch blocks
4. Verify async/await handling

#### For Performance Issues

1. Profile the application
2. Check React DevTools for re-renders
3. Analyze bundle size
4. Review database query plans

#### For Database Issues

1. Test queries in isolation
2. Check RLS policies
3. Verify indexes
4. Monitor connection pool

#### For Type Errors

1. Run targeted type checking
2. Check interface definitions
3. Verify API response shapes
4. Review type assertions

### 5.3 Compare with Baseline

```typescript
// Compare current state with issue report
const comparison = {
  original: issue.diagnosticData,
  current: currentDiagnosticData,
  differences: findDifferences(issue.diagnosticData, currentDiagnosticData),
};
```

## 6. Solution Implementation

### 6.1 Implement Fix

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

### 6.2 Add Defensive Measures

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

### 6.3 Create Tests

```typescript
// Create regression test
const testFile = `${affectedFile}.test.ts`;
const testContent = generateRegressionTest(issue);
await writeFile(testFile, testContent);
```

## 7. Verification & Documentation

### 7.1 Verify Fix

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

### 7.2 Update Issue Documentation

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

### 7.3 Update Issue Status

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

## 8. Post-Debug Actions

### 8.1 Create PR if Needed

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

### 8.2 Knowledge Base Update

If the issue revealed a gap:

1. Update debugging documentation
2. Add to common patterns
3. Create troubleshooting guide
4. Update team runbook

### 8.3 Summary Output

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
.claude/z.archive/issues/patterns/
├── slow-query-pattern.md
├── memory-leak-pattern.md
├── cors-error-pattern.md
└── type-mismatch-pattern.md
```
