# Deep Debug Phase 1: Investigation & Research

**Phase 1 of Deep Debug Workflow: Investigation & Research**

This workflow is automatically invoked by `/deep-debug` when investigation is needed.

- GitHub issue number: `123` (preferred format)
- Issue ID: `ISSUE-123`
- Local file: `.claude/issues/2025-01-06-ISSUE-123.md`
- GitHub URL: `https://github.com/MLorneSmith/2025slideheroes/issues/123`

This command launches an intensive investigation for complex issues, combining systematic research, enhanced diagnostics, and pattern analysis.

## 1. Adopt Role

Load the enhanced investigation mindset:

```
/read .claude/roles/qa-testing-engineer.md
```

## 2. Load Issue Specification & Context

### 2.1 Locate and Load Issue

```typescript
// Parse reference and load issue (same as debug-issue)
let issuePath, issueContent, githubIssue;

if (/^\d+$/.test(reference)) {
  // GitHub issue number (e.g., "123") - preferred format
  githubIssue = await mcp__github__get_issue({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    issue_number: parseInt(reference),
  });
  issueContent = githubIssue.body;

  // Also find local file if exists
  issuePath = findLocalIssueFile(`ISSUE-${reference}`);
}
// ... other reference formats
```

### 2.2 Extract Issue Metadata

```typescript
const issue = parseIssueSpecification(issueContent);
const {
  id,
  severity,
  type,
  affectedFiles,
  reproductionSteps,
  environment,
  errorPatterns,
} = issue;
```

### 2.3 Context Research Phase

**Use Context7 MCP for comprehensive research:**

```typescript
// Research similar issues and solutions
const researchTopics = [
  `${issue.type} debugging patterns`,
  `${framework} ${issue.type} common causes`,
  `${issue.summary} troubleshooting`,
  `performance debugging ${technology_stack}`,
];

const researchFindings = [];
for (const topic of researchTopics) {
  const libraryId = await mcp__context7__resolve_library_id({
    libraryName: topic,
  });

  const docs = await mcp__context7__get_library_docs({
    context7CompatibleLibraryID: libraryId,
    topic: topic,
    tokens: 4000,
  });

  researchFindings.push({
    topic,
    findings: docs,
    relevanceScore: calculateRelevance(docs, issue),
  });
}
```

## 3. Enhanced Diagnostic Collection

### 3.1 Production Observability (New Relic)

**When to use New Relic MCP**: For production issues, performance problems, API errors, or when you need real-time system metrics.

```typescript
// Query recent error patterns
const errorTraces = await mcp__newrelic__get_error_traces({
  app_name: determineAppName(issue.affectedFiles),
  since: '2 hours ago',
  limit: 20,
});

// Get transaction traces for performance issues
if (issue.type === 'performance') {
  const transactionTraces = await mcp__newrelic__get_transaction_traces({
    app_name: determineAppName(issue.affectedFiles),
    since: '1 hour ago',
    limit: 15,
  });
}

// Query specific logs related to the issue
const relevantLogs = await mcp__newrelic__query_newrelic_logs({
  nrql: `SELECT * FROM Log WHERE message LIKE '%${issue.errorKeywords}%' SINCE 2 hours ago LIMIT 50`,
});

// Get OpenTelemetry traces for distributed tracing
const otelTraces = await mcp__newrelic__get_otel_traces({
  service_name: 'slideheroes-web',
  since: '1 hour ago',
  limit: 10,
});
```

### 3.2 Advanced Browser Analysis

**Use Cloudflare Playwright MCP for complex UI investigations:**

```typescript
// Navigate to issue location
await mcp__cloudflare_playwright__browser_navigate({
  url: constructIssueURL(issue.reproductionSteps),
});

// Comprehensive diagnostic capture
const diagnosticData = {
  // Better than screenshot - gives semantic information
  pageSnapshot: await mcp__cloudflare_playwright__browser_snapshot(),

  // Console monitoring
  consoleMessages: await mcp__cloudflare_playwright__browser_console_messages(),

  // Network analysis
  networkRequests: await mcp__cloudflare_playwright__browser_network_requests(),

  // Performance baseline
  performanceTimings: await capturePerformanceTimings(),
};

// Reproduce issue steps with monitoring
for (const step of issue.reproductionSteps) {
  console.log(`Executing step: ${step}`);

  if (step.includes('click')) {
    const element = identifyElement(step);
    await mcp__cloudflare_playwright__browser_click({
      element: element.description,
      ref: element.selector,
    });
  } else if (step.includes('type')) {
    const input = identifyInput(step);
    await mcp__cloudflare_playwright__browser_type({
      element: input.description,
      ref: input.selector,
      text: input.value,
    });
  }

  // Capture state after each step
  const stepState = await mcp__cloudflare_playwright__browser_snapshot();
  diagnosticData.stepStates.push({
    step,
    state: stepState,
    timestamp: new Date().toISOString(),
  });
}

// Final error capture
const errorScreenshot =
  await mcp__cloudflare_playwright__browser_take_screenshot();
```

### 3.3 Local Browser Analysis Supplement

**Use Browser Tools MCP for additional local context:**

```typescript
// Comprehensive local browser state
const localBrowserData = {
  consoleErrors: await mcp__browser_tools__getConsoleErrors(),
  consoleLogs: await mcp__browser_tools__getConsoleLogs(),
  networkErrors: await mcp__browser_tools__getNetworkErrors(),
  networkLogs: await mcp__browser_tools__getNetworkLogs(),

  // Performance audits
  accessibilityAudit: await mcp__browser_tools__runAccessibilityAudit(),
  performanceAudit: await mcp__browser_tools__runPerformanceAudit(),
  seoAudit: await mcp__browser_tools__runSEOAudit(),
  bestPracticesAudit: await mcp__browser_tools__runBestPracticesAudit(),
};

// Take local screenshot for comparison
const localScreenshot = await mcp__browser_tools__takeScreenshot();
```

### 3.4 Database Deep Analysis

```typescript
// Comprehensive database diagnostics
const dbAnalysis = await mcp__postgres__pg_analyze_database({
  analysisType: 'performance',
  connectionString: process.env.DATABASE_URL,
});

const dbMonitoring = await mcp__postgres__pg_monitor_database({
  includeQueries: true,
  includeLocks: true,
  includeTables: true,
  includeReplication: true,
  alertThresholds: {
    connectionPercentage: 80,
    cacheHitRatio: 0.95,
    longRunningQuerySeconds: 30,
  },
});

// Query performance analysis
const queryPerformance = await mcp__postgres__pg_manage_query({
  operation: 'get_slow_queries',
  minDuration: 100,
  limit: 20,
  includeNormalized: true,
});

// Get statistics for affected tables
const affectedTables = extractTablesFromIssue(issue);
for (const table of affectedTables) {
  const tableStats = await mcp__postgres__pg_execute_query({
    operation: 'select',
    query: `SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup 
             FROM pg_stat_user_tables WHERE tablename = $1`,
    parameters: [table],
  });
}
```

## 4. Issue Clustering & Pattern Analysis

### 4.1 Identify Related Issues

```typescript
// Search for similar issues in GitHub
const similarIssues = await mcp__github__search_issues({
  q: `repo:MLorneSmith/2025slideheroes is:issue ${issue.type} ${extractKeywords(issue.summary)}`,
  sort: 'created',
  order: 'desc',
  per_page: 20,
});

// Analyze patterns
const issuePatterns = analyzeIssuePatterns(similarIssues.items, issue);
const clusterAnalysis = {
  relatedIssues: issuePatterns.related,
  commonPatterns: issuePatterns.patterns,
  potentialRootCause: issuePatterns.rootCause,
  recommendedClusterAction: issuePatterns.clusterAction,
};
```

### 4.2 System-wide Pattern Detection

```typescript
// Check for system-wide indicators
const systemPatterns = {
  // Recent deployments that might be related
  recentDeployments: await getRecentDeployments(),

  // Configuration changes
  recentConfigChanges: await getConfigChanges(),

  // Dependencies updates
  recentDependencyUpdates: await getDependencyUpdates(),

  // Infrastructure changes
  infrastructureEvents: await getInfrastructureEvents(),
};
```

## 5. Research Synthesis & Analysis

### 5.1 Synthesize Research Findings

```typescript
const researchSynthesis = {
  knownPatterns: researchFindings
    .filter((f) => f.relevanceScore > 0.7)
    .map((f) => f.findings),

  recommendedSolutions: extractSolutions(researchFindings),

  bestPractices: extractBestPractices(researchFindings),

  warningsAndCaveats: extractWarnings(researchFindings),
};
```

### 5.2 Cross-Reference with Local Data

```typescript
const crossAnalysis = {
  // Compare external research with our diagnostic data
  diagnosticAlignment: compareWithDiagnostics(
    researchSynthesis,
    diagnosticData,
  ),

  // Check if known solutions apply to our context
  applicableSolutions: filterApplicableSolutions(
    researchSynthesis.recommendedSolutions,
    issue,
    systemContext,
  ),

  // Identify gaps in our understanding
  knowledgeGaps: identifyKnowledgeGaps(researchSynthesis, diagnosticData),
};
```

## 6. Comprehensive Investigation Report

### 6.1 Generate Investigation Report

Create a detailed investigation document:

```markdown
# Deep Investigation Report: [Issue ID]

**Phase**: 1 - Investigation & Research
**Investigator**: Claude QA Engineer
**Date**: [ISO timestamp]
**Duration**: [investigation duration]

## Executive Summary

[One paragraph summary of findings]

## Research Findings

### External Knowledge Base

- **Patterns Identified**: [number] similar issues found
- **Known Solutions**: [number] potential solutions identified
- **Best Practices**: [key recommendations]
- **Risk Factors**: [potential complications]

### Diagnostic Data Analysis

#### Production Metrics (New Relic)

- **Error Frequency**: [errors per hour/day]
- **Performance Impact**: [latency/throughput metrics]
- **Affected Users**: [user impact analysis]
- **Service Dependencies**: [affected services]

#### Browser Behavior Analysis (Playwright)

- **User Flow Interruption**: [where users get stuck]
- **Console Error Patterns**: [specific error messages]
- **Network Failure Points**: [failed requests]
- **Performance Bottlenecks**: [timing analysis]

#### Database Impact Analysis

- **Query Performance**: [slow query analysis]
- **Connection Health**: [connection pool status]
- **Data Integrity**: [any data inconsistencies]
- **Index Effectiveness**: [index usage analysis]

### Issue Clustering Analysis

- **Related Issues**: [list of similar issues]
- **Pattern Confidence**: [high/medium/low]
- **Root Cause Hypothesis**: [preliminary assessment]
- **Cluster Recommendation**: [individual vs batch resolution]

## Investigation Findings

### Confirmed Observations

1. [Fact 1 with supporting evidence]
2. [Fact 2 with supporting evidence]
3. [Fact 3 with supporting evidence]

### Working Hypotheses

1. **Primary Hypothesis**: [most likely cause]
   - Evidence: [supporting data]
   - Confidence: [percentage]
2. **Secondary Hypothesis**: [alternative cause]
   - Evidence: [supporting data]
   - Confidence: [percentage]

### Risk Assessment

- **User Impact**: [current impact level]
- **Business Impact**: [revenue/reputation implications]
- **Technical Debt**: [long-term implications]
- **Security Implications**: [any security concerns]

## Recommended Next Steps

### Immediate Actions Required

1. [Urgent action 1]
2. [Urgent action 2]

### Phase 2 Preparation

- **Root Cause Analysis Focus**: [specific areas to investigate]
- **Architecture Review Requirements**: [components to examine]
- **Solution Design Constraints**: [limitations to consider]

### Additional Investigation Needed

- [Area 1 requiring deeper analysis]
- [Area 2 requiring specialized expertise]
- [Area 3 requiring additional data]

## Tools Used

- New Relic MCP: [specific queries and results]
- Cloudflare Playwright MCP: [interaction testing results]
- Browser Tools MCP: [local diagnostic results]
- Context7 Research MCP: [research topics and findings]
- PostgreSQL MCP: [database analysis results]

## Appendices

### A. Research Documentation

[Links to Context7 findings and external resources]

### B. Diagnostic Raw Data

[Structured data from all MCP tools]

### C. Pattern Analysis Details

[Detailed clustering and pattern analysis]

---

_Investigation completed by Claude Deep Debug System_
_Ready for Phase 2: Root Cause Analysis & Solution Design_
```

## 7. GitHub Issue Update

### 7.1 Update Issue with Findings

```typescript
// Add investigation findings to GitHub issue
const investigationComment = generateInvestigationComment(investigationReport);

await mcp__github__add_issue_comment({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: githubIssue.number,
  body: investigationComment,
});

// Update labels
const currentLabels = githubIssue.labels.map((l) => l.name);
const newLabels = [
  ...currentLabels,
  'deep-debug-phase-1-complete',
  'research-complete',
  ...generatePatternLabels(clusterAnalysis),
];

await mcp__github__update_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: githubIssue.number,
  labels: newLabels,
});
```

### 7.2 Create Investigation Branch

```typescript
// Create investigation branch for potential fixes
const branchName = `investigation/issue-${githubIssue.number}`;
await createInvestigationBranch(branchName);

// Document investigation state
const investigationState = {
  issueId: issue.id,
  phase: '1-complete',
  branchName,
  nextPhase: 'root-cause-analysis',
  investigationData: investigationReport,
};

await saveInvestigationState(investigationState);
```

## 8. Post-Investigation Actions

### 8.1 Summary Output

```
🔍 Deep Investigation Complete!

📋 Issue: ISSUE-${issueNumber}
🧪 Research Sources: ${researchFindings.length}
📊 Diagnostic Tools Used: ${toolsUsed.length}
🔗 Related Issues: ${clusterAnalysis.relatedIssues.length}
📈 Confidence Level: ${overallConfidence}%

Investigation Highlights:
• ${topFinding1}
• ${topFinding2}
• ${topFinding3}

Next Steps:
1. Review investigation report: .claude/investigations/ISSUE-${issueNumber}-phase1.md
2. Proceed to root cause analysis: /deep-debug-phase-2 ${issueNumber}
3. GitHub issue updated with findings: ${githubUrl}

⚠️  ${urgentRecommendations.length} urgent actions identified
```

### 8.2 Knowledge Base Updates

```typescript
// Update pattern library with new findings
if (clusterAnalysis.newPatterns.length > 0) {
  await updatePatternLibrary(clusterAnalysis.newPatterns);
}

// Add to research database
await addToResearchDatabase({
  issueType: issue.type,
  researchFindings: researchSynthesis,
  effectiveTools: toolsUsed,
  investigationDuration: duration,
});
```

## Context Management

### Focus Strategies

1. **Systematic Tool Usage**: Use MCP tools in logical sequence
2. **Research-First Approach**: Leverage external knowledge before deep diving
3. **Pattern Recognition**: Look for similarities with known issues
4. **Evidence-Based Analysis**: Support hypotheses with concrete data

### Investigation Scope Control

- Maximum 2 hours for Phase 1 investigation
- Focus on data collection and initial analysis
- Defer solution design to Phase 2
- Document all findings for handoff to next phase

## Integration Notes

### For Phase 2 Handoff

Phase 1 provides:

- Comprehensive diagnostic data
- Research-backed hypotheses
- Issue clustering analysis
- Risk assessment and business impact
- Prioritized investigation areas for Phase 2

### Quality Gates

Before proceeding to Phase 2:

- [ ] All relevant MCP tools executed
- [ ] Research findings documented and synthesized
- [ ] Issue clustering analysis complete
- [ ] GitHub issue updated with findings
- [ ] Investigation report generated
- [ ] Next phase preparation complete
