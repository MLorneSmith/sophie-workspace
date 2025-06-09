# Deep Debug Phase 2: Root Cause Analysis & Solution Design

**Phase 2 of Deep Debug Workflow: Root Cause Analysis & Solution Design**

This workflow is automatically invoked by `/deep-debug` when Phase 1 investigation is complete.

- GitHub issue number: `123` (preferred format)
- Issue ID: `ISSUE-123`
- Local file: `.claude/issues/2025-01-06-ISSUE-123.md`
- GitHub URL: `https://github.com/MLorneSmith/2025slideheroes/issues/123`

This command performs deep root cause analysis and designs comprehensive technical solutions based on Phase 1 investigation findings.

## 1. Adopt Role

Load the systems architecture mindset:

```
/read .claude/roles/systems-architect-engineer.md
```

## 2. Load Investigation Context

### 2.1 Verify Phase 1 Completion

```typescript
// Load GitHub issue and verify Phase 1 completion
const githubIssue = await mcp__github__get_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: parseInt(reference),
});

// Check for Phase 1 completion
const hasPhase1Label = githubIssue.labels.some(
  (l) => l.name === 'deep-debug-phase-1-complete',
);

if (!hasPhase1Label) {
  throw new Error(
    'Phase 1 investigation must be completed first. Run /deep-debug-phase-1',
  );
}
```

### 2.2 Load Investigation Data

```typescript
// Load Phase 1 investigation report
const investigationState = await loadInvestigationState(issueNumber);
const investigationReport = investigationState.investigationData;

// Extract key findings
const {
  researchFindings,
  diagnosticData,
  clusterAnalysis,
  workingHypotheses,
  confirmedObservations,
} = investigationReport;
```

### 2.3 Load Related System Context

```typescript
// Load affected system components
const affectedComponents = await analyzeAffectedComponents(
  investigationReport.affectedFiles,
);

// Read system architecture documentation
const systemContext = await loadSystemContext([
  '.claude/core/project-overview.md',
  '.claude/architecture/*.md',
  'README.md',
]);
```

## 3. Deep Root Cause Analysis

### 3.1 Hypothesis Testing & Validation

```typescript
// Test each hypothesis from Phase 1
const hypothesisTests = [];

for (const hypothesis of workingHypotheses) {
  const testResults = await validateHypothesis(hypothesis, {
    diagnosticData,
    systemContext,
    codeAnalysis: await analyzeAffectedCode(hypothesis.affectedFiles),
  });

  hypothesisTests.push({
    hypothesis,
    testResults,
    confidence: calculateConfidence(testResults),
    evidence: gatherSupportingEvidence(testResults),
  });
}

// Rank hypotheses by confidence and evidence
const rankedHypotheses = hypothesisTests.sort(
  (a, b) => b.confidence - a.confidence,
);
```

### 3.2 System Flow Analysis

```typescript
// Create detailed sequence diagrams showing failure flows
const systemFlows = await analyzeSystemFlows({
  normalFlow: await traceNormalFlow(investigationReport.reproductionSteps),
  failureFlow: await traceFailureFlow(investigationReport.reproductionSteps),
  affectedServices: affectedComponents.services,
  dataFlow: await analyzeDataFlow(affectedComponents.databases),
});

// Generate sequence diagram in markdown
const sequenceDiagram = generateSequenceDiagram(systemFlows);
```

### 3.3 Architecture Vulnerability Assessment

```typescript
// Analyze architectural weaknesses
const architecturalAnalysis = {
  // Single points of failure
  spof: await identifySinglePointsOfFailure(affectedComponents),

  // Coupling and dependency issues
  coupling: await analyzeCouplingIssues(affectedComponents),

  // Scalability bottlenecks
  scalability: await identifyScalabilityIssues(diagnosticData.performance),

  // Security implications
  security: await assessSecurityImplications(investigationReport),

  // Data consistency risks
  dataConsistency: await analyzeDataConsistencyRisks(
    affectedComponents.databases,
  ),
};
```

### 3.4 Code-Level Root Cause Analysis

```typescript
// Deep dive into affected code
const codeAnalysis = {};

for (const file of investigationReport.affectedFiles) {
  const fileContent = await readFile(file);

  codeAnalysis[file] = {
    // Static analysis
    staticIssues: await analyzeCodeStatically(fileContent),

    // Dependency analysis
    dependencies: await analyzeDependencies(fileContent),

    // Performance hotspots
    performanceIssues: await identifyPerformanceIssues(fileContent),

    // Error handling gaps
    errorHandling: await analyzeErrorHandling(fileContent),

    // Type safety issues
    typeSafety: await analyzeTypeSafety(fileContent),
  };
}
```

### 3.5 External Factor Analysis

```typescript
// Analyze external contributing factors
const externalFactors = {
  // Third-party service issues
  thirdPartyServices: await analyzeThirdPartyServices(diagnosticData),

  // Infrastructure problems
  infrastructure: await analyzeInfrastructure(diagnosticData.newRelic),

  // Configuration issues
  configuration: await analyzeConfiguration(),

  // Timing and race conditions
  timingIssues: await analyzeTimingIssues(diagnosticData.playwright),

  // Environmental factors
  environment: await analyzeEnvironmentalFactors(
    investigationReport.environment,
  ),
};
```

## 4. Root Cause Determination

### 4.1 Evidence Synthesis

```typescript
const rootCauseAnalysis = {
  // Primary root cause (highest confidence)
  primaryCause: {
    description: determinePrimaryCause(rankedHypotheses),
    evidence: gatherPrimaryEvidence(rankedHypotheses[0]),
    confidence: rankedHypotheses[0].confidence,
    systemImpact: analyzeSystemImpact(rankedHypotheses[0]),
  },

  // Contributing factors
  contributingFactors: identifyContributingFactors([
    ...architecturalAnalysis,
    ...externalFactors,
    ...codeAnalysis,
  ]),

  // Cascade effects
  cascadeEffects: analyzeCascadeEffects(rankedHypotheses[0], systemFlows),
};
```

### 4.2 Impact Assessment

```typescript
const impactAssessment = {
  // User impact
  userImpact: {
    affectedUsers: calculateAffectedUsers(diagnosticData),
    userExperience: assessUserExperienceImpact(investigationReport),
    businessProcess: assessBusinessProcessImpact(investigationReport),
  },

  // System impact
  systemImpact: {
    performance: assessPerformanceImpact(diagnosticData.performance),
    reliability: assessReliabilityImpact(architecturalAnalysis),
    scalability: assessScalabilityImpact(architecturalAnalysis.scalability),
    security: assessSecurityImpact(architecturalAnalysis.security),
  },

  // Business impact
  businessImpact: {
    revenue: estimateRevenueImpact(investigationReport),
    reputation: assessReputationImpact(investigationReport),
    compliance: assessComplianceImpact(architecturalAnalysis.security),
  },
};
```

## 5. Solution Architecture Design

### 5.1 Solution Strategy Development

```typescript
const solutionStrategy = {
  // Immediate fixes (hotfixes)
  immediateFixes: designImmediateFixes(rootCauseAnalysis.primaryCause),

  // Short-term solutions (tactical)
  shortTermSolutions: designShortTermSolutions(rootCauseAnalysis),

  // Long-term architectural improvements (strategic)
  longTermImprovements: designLongTermImprovements(architecturalAnalysis),

  // Prevention measures
  preventionMeasures: designPreventionMeasures(rootCauseAnalysis),
};
```

### 5.2 Technical Solution Design

```typescript
const technicalSolution = {
  // Code changes required
  codeChanges: {
    fixes: designCodeFixes(codeAnalysis, rootCauseAnalysis.primaryCause),
    refactoring: designRefactoring(architecturalAnalysis.coupling),
    newComponents: designNewComponents(solutionStrategy.longTermImprovements),
    testing: designTestingStrategy(rootCauseAnalysis),
  },

  // Infrastructure changes
  infrastructureChanges: {
    scaling: designScalingChanges(architecturalAnalysis.scalability),
    monitoring: designMonitoringImprovements(diagnosticData),
    deployment: designDeploymentStrategy(solutionStrategy),
    backup: designBackupStrategy(architecturalAnalysis.dataConsistency),
  },

  // Configuration changes
  configurationChanges: {
    performance: designPerformanceConfig(diagnosticData.performance),
    security: designSecurityConfig(architecturalAnalysis.security),
    reliability: designReliabilityConfig(architecturalAnalysis.spof),
  },
};
```

### 5.3 Implementation Planning

```typescript
const implementationPlan = {
  // Phase-based implementation
  phases: [
    {
      phase: 'Emergency Response',
      duration: '1-2 hours',
      actions: solutionStrategy.immediateFixes,
      risks: assessImplementationRisks(solutionStrategy.immediateFixes),
      rollback: designRollbackPlan(solutionStrategy.immediateFixes),
    },
    {
      phase: 'Tactical Solution',
      duration: '1-3 days',
      actions: solutionStrategy.shortTermSolutions,
      risks: assessImplementationRisks(solutionStrategy.shortTermSolutions),
      rollback: designRollbackPlan(solutionStrategy.shortTermSolutions),
    },
    {
      phase: 'Strategic Improvement',
      duration: '1-4 weeks',
      actions: solutionStrategy.longTermImprovements,
      risks: assessImplementationRisks(solutionStrategy.longTermImprovements),
      rollback: designRollbackPlan(solutionStrategy.longTermImprovements),
    },
  ],

  // Resource requirements
  resources: {
    engineering: calculateEngineeringHours(implementationPlan.phases),
    testing: calculateTestingHours(technicalSolution.codeChanges.testing),
    infrastructure: calculateInfrastructureCosts(
      technicalSolution.infrastructureChanges,
    ),
    monitoring: calculateMonitoringRequirements(
      technicalSolution.infrastructureChanges.monitoring,
    ),
  },

  // Dependencies and constraints
  dependencies: identifyDependencies(technicalSolution),
  constraints: identifyConstraints(systemContext, businessRequirements),

  // Success criteria
  successCriteria: defineSuccessCriteria(rootCauseAnalysis, impactAssessment),
};
```

### 5.4 Risk Assessment & Mitigation

```typescript
const riskAssessment = {
  // Implementation risks
  implementationRisks: assessImplementationRisks(implementationPlan),

  // Technical risks
  technicalRisks: assessTechnicalRisks(technicalSolution),

  // Business risks
  businessRisks: assessBusinessRisks(
    implementationPlan,
    impactAssessment.businessImpact,
  ),

  // Mitigation strategies
  mitigationStrategies: designMitigationStrategies({
    ...implementationRisks,
    ...technicalRisks,
    ...businessRisks,
  }),
};
```

## 6. Solution Architecture Document

### 6.1 Generate Comprehensive Solution Document

```markdown
# Solution Architecture Document: [Issue ID]

**Phase**: 2 - Root Cause Analysis & Solution Design
**Architect**: Claude Systems Engineer
**Date**: [ISO timestamp]
**Status**: Solution Designed

## Executive Summary

### Root Cause Summary

[One paragraph describing the primary root cause and key contributing factors]

### Solution Overview

[One paragraph describing the overall solution approach and expected outcomes]

### Implementation Timeline

- **Emergency Response**: [timeframe] - [critical fixes]
- **Tactical Solution**: [timeframe] - [comprehensive resolution]
- **Strategic Improvement**: [timeframe] - [long-term prevention]

## Root Cause Analysis

### Primary Root Cause

**Cause**: [Detailed description of the primary root cause]

**Evidence**:

- [Evidence item 1 with supporting data]
- [Evidence item 2 with supporting data]
- [Evidence item 3 with supporting data]

**Confidence Level**: [percentage]%

### Contributing Factors

1. **[Factor 1]**: [Description and impact]
2. **[Factor 2]**: [Description and impact]
3. **[Factor 3]**: [Description and impact]

### System Flow Analysis

#### Normal Flow Sequence

\`\`\`mermaid
sequenceDiagram
[Generated sequence diagram for normal flow]
\`\`\`

#### Failure Flow Sequence

\`\`\`mermaid
sequenceDiagram
[Generated sequence diagram showing where failure occurs]
\`\`\`

### Architectural Vulnerabilities

- **Single Points of Failure**: [List identified SPOFs]
- **Coupling Issues**: [Tight coupling problems]
- **Scalability Bottlenecks**: [Performance limitations]
- **Security Gaps**: [Security vulnerabilities]
- **Data Consistency Risks**: [Data integrity issues]

## Impact Assessment

### Current Impact

- **Users Affected**: [number/percentage] users
- **Performance Impact**: [latency/throughput degradation]
- **Business Impact**: [revenue/reputation/compliance implications]
- **System Reliability**: [uptime/error rate impact]

### Projected Impact Without Fix

- **Week 1**: [escalation scenario]
- **Month 1**: [longer-term implications]
- **Quarter 1**: [business-level consequences]

## Solution Architecture

### Solution Strategy

#### Immediate Fixes (Emergency Response)

1. **[Fix 1]**: [Description, timeline, risk level]
2. **[Fix 2]**: [Description, timeline, risk level]
3. **[Fix 3]**: [Description, timeline, risk level]

#### Short-term Solutions (Tactical)

1. **[Solution 1]**: [Description, timeline, scope]
2. **[Solution 2]**: [Description, timeline, scope]
3. **[Solution 3]**: [Description, timeline, scope]

#### Long-term Improvements (Strategic)

1. **[Improvement 1]**: [Description, timeline, benefits]
2. **[Improvement 2]**: [Description, timeline, benefits]
3. **[Improvement 3]**: [Description, timeline, benefits]

### Technical Implementation Details

#### Code Changes Required

**Files to Modify**:

- `[file1.ts]`: [specific changes needed]
- `[file2.tsx]`: [specific changes needed]
- `[file3.js]`: [specific changes needed]

**New Components**:

- `[component1]`: [purpose and integration]
- `[component2]`: [purpose and integration]

**Refactoring Required**:

- [Refactoring area 1]: [scope and justification]
- [Refactoring area 2]: [scope and justification]

#### Infrastructure Changes

**Scaling Requirements**:

- [Resource scaling needs]

**Monitoring Enhancements**:

- [New monitoring requirements]

**Configuration Updates**:

- [Performance configurations]
- [Security configurations]
- [Reliability configurations]

#### Database Changes

**Schema Changes**:

- [Any schema modifications needed]

**Index Optimizations**:

- [Index changes for performance]

**Query Optimizations**:

- [Specific query improvements]

### Implementation Plan

#### Phase 1: Emergency Response (1-2 hours)

**Objective**: Stop the bleeding, restore basic functionality

**Actions**:

1. [Emergency action 1] - [time estimate]
2. [Emergency action 2] - [time estimate]
3. [Emergency action 3] - [time estimate]

**Success Criteria**:

- [Criterion 1]
- [Criterion 2]

**Rollback Plan**:

- [Rollback step 1]
- [Rollback step 2]

#### Phase 2: Tactical Solution (1-3 days)

**Objective**: Comprehensive resolution of immediate issue

**Actions**:

1. [Tactical action 1] - [time estimate]
2. [Tactical action 2] - [time estimate]
3. [Tactical action 3] - [time estimate]

**Success Criteria**:

- [Criterion 1]
- [Criterion 2]

**Dependencies**:

- [Dependency 1]
- [Dependency 2]

#### Phase 3: Strategic Improvement (1-4 weeks)

**Objective**: Long-term prevention and system strengthening

**Actions**:

1. [Strategic action 1] - [time estimate]
2. [Strategic action 2] - [time estimate]
3. [Strategic action 3] - [time estimate]

**Success Criteria**:

- [Criterion 1]
- [Criterion 2]

## Risk Assessment

### Implementation Risks

| Risk     | Probability    | Impact         | Mitigation            |
| -------- | -------------- | -------------- | --------------------- |
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |

### Technical Risks

| Risk     | Probability    | Impact         | Mitigation            |
| -------- | -------------- | -------------- | --------------------- |
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |

### Business Risks

| Risk     | Probability    | Impact         | Mitigation            |
| -------- | -------------- | -------------- | --------------------- |
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [Mitigation strategy] |

## Testing Strategy

### Unit Testing

- [Testing approach for individual components]
- [Coverage requirements]
- [Mock/stub strategies]

### Integration Testing

- [Testing approach for system interactions]
- [Test data requirements]
- [Environment setup]

### Performance Testing

- [Load testing approach]
- [Performance benchmarks]
- [Regression testing]

### User Acceptance Testing

- [UAT scenarios]
- [User feedback collection]
- [Success criteria]

## Monitoring & Alerting

### New Monitoring Requirements

- [Metric 1]: [threshold and alerting]
- [Metric 2]: [threshold and alerting]
- [Metric 3]: [threshold and alerting]

### Dashboard Updates

- [Dashboard 1]: [new panels/metrics]
- [Dashboard 2]: [new panels/metrics]

### Alert Refinements

- [Alert 1]: [updated conditions]
- [Alert 2]: [updated conditions]

## Success Criteria

### Technical Success Criteria

- [ ] [Specific technical outcome 1]
- [ ] [Specific technical outcome 2]
- [ ] [Specific technical outcome 3]

### Business Success Criteria

- [ ] [Specific business outcome 1]
- [ ] [Specific business outcome 2]
- [ ] [Specific business outcome 3]

### Performance Success Criteria

- [ ] [Specific performance target 1]
- [ ] [Specific performance target 2]
- [ ] [Specific performance target 3]

## Resource Requirements

### Engineering Hours

- **Emergency Response**: [hours] hours
- **Tactical Solution**: [hours] hours
- **Strategic Improvement**: [hours] hours
- **Total**: [hours] hours

### Infrastructure Costs

- **Additional Resources**: $[amount]/month
- **One-time Costs**: $[amount]
- **Cost Savings**: $[amount]/month (from efficiency gains)

### External Dependencies

- [Dependency 1]: [requirements and timeline]
- [Dependency 2]: [requirements and timeline]

## Next Steps

### Immediate Actions (Next 1-2 hours)

1. [Action 1]
2. [Action 2]
3. [Action 3]

### Phase 3 Preparation

- **Implementation Team Assignment**: [team/individuals]
- **Environment Preparation**: [requirements]
- **Stakeholder Communication**: [communication plan]

### Decision Points

- [Decision 1]: [decision required and stakeholders]
- [Decision 2]: [decision required and stakeholders]

## Appendices

### A. Technical Analysis Details

[Detailed technical findings and code analysis]

### B. Research References

[Context7 research findings and external resources]

### C. Alternative Solutions Considered

[Other solutions evaluated and reasons for rejection]

---

_Solution designed by Claude Deep Debug System_
_Ready for Phase 3: Implementation & Verification_
```

## 7. GitHub Issue Update

### 7.1 Update Issue with Solution Architecture

```typescript
// Create solution architecture comment
const solutionComment = `## 🏗️ Solution Architecture Complete

**Root Cause Identified**: ${rootCauseAnalysis.primaryCause.description}
**Confidence Level**: ${rootCauseAnalysis.primaryCause.confidence}%

**Solution Strategy**:
- ⚡ Emergency Response: ${implementationPlan.phases[0].duration}
- 🔧 Tactical Solution: ${implementationPlan.phases[1].duration}  
- 🏛️ Strategic Improvement: ${implementationPlan.phases[2].duration}

**Impact Assessment**:
- Users Affected: ${impactAssessment.userImpact.affectedUsers}
- Business Impact: ${impactAssessment.businessImpact.revenue}
- System Impact: ${impactAssessment.systemImpact.performance}

**Next Steps**:
1. Review solution architecture document
2. Approve implementation plan
3. Proceed to Phase 3: \`/deep-debug-phase-3 ${issueNumber}\`

📋 **Full Solution Document**: [View Architecture Document](.claude/solutions/ISSUE-${issueNumber}-solution.md)`;

await mcp__github__add_issue_comment({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: githubIssue.number,
  body: solutionComment,
});

// Update labels
const currentLabels = githubIssue.labels.map((l) => l.name);
const newLabels = [
  ...currentLabels.filter((l) => !l.includes('deep-debug-phase')),
  'deep-debug-phase-2-complete',
  'solution-designed',
  `impact-${impactAssessment.businessImpact.severity.toLowerCase()}`,
  `complexity-${implementationPlan.complexity.toLowerCase()}`,
];

await mcp__github__update_issue({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: githubIssue.number,
  labels: newLabels,
});
```

### 7.2 Create Solution Branch and Milestone

```typescript
// Create solution implementation branch
const solutionBranch = `solution/issue-${githubIssue.number}`;
await createSolutionBranch(solutionBranch, investigationState.branchName);

// Create milestone for tracking implementation
const milestone = await mcp__github__create_milestone({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  title: `Issue ${githubIssue.number} Resolution`,
  description: `Implementation milestone for: ${issue.title}`,
  due_on: calculateDueDate(implementationPlan.phases),
});

// Update investigation state
const updatedState = {
  ...investigationState,
  phase: '2-complete',
  solutionBranch,
  milestone: milestone.number,
  solutionData: {
    rootCauseAnalysis,
    technicalSolution,
    implementationPlan,
    riskAssessment,
  },
};

await saveInvestigationState(updatedState);
```

## 8. Post-Analysis Actions

### 8.1 Summary Output

```
🏗️ Solution Architecture Complete!

📋 Issue: ISSUE-${issueNumber}
🎯 Root Cause: ${rootCauseAnalysis.primaryCause.description}
📊 Confidence: ${rootCauseAnalysis.primaryCause.confidence}%
⚡ Emergency Response: ${implementationPlan.phases[0].duration}
🔧 Full Resolution: ${implementationPlan.phases[1].duration}
🏛️ Strategic Improvement: ${implementationPlan.phases[2].duration}

Impact Assessment:
• Users: ${impactAssessment.userImpact.affectedUsers}
• Performance: ${impactAssessment.systemImpact.performance}
• Business: ${impactAssessment.businessImpact.severity}

Implementation Plan:
• Engineering Hours: ${implementationPlan.resources.engineering} hours
• Implementation Risks: ${riskAssessment.overallRisk}
• Success Probability: ${implementationPlan.successProbability}%

Next Steps:
1. Review solution document: .claude/solutions/ISSUE-${issueNumber}-solution.md
2. Stakeholder approval for implementation plan
3. Begin implementation: /deep-debug-phase-3 ${issueNumber}

📁 Branch Created: ${solutionBranch}
🎯 Milestone: ${milestone.title}
```

### 8.2 Knowledge Base & Pattern Updates

```typescript
// Update architectural pattern library
if (architecturalAnalysis.newPatterns.length > 0) {
  await updateArchitecturalPatterns(architecturalAnalysis.newPatterns);
}

// Add to solution pattern database
await addToSolutionPatterns({
  issueType: issue.type,
  rootCause: rootCauseAnalysis.primaryCause,
  solution: technicalSolution,
  effectiveness: implementationPlan.successProbability,
});

// Update risk assessment database
await updateRiskDatabase({
  riskFactors: riskAssessment,
  mitigationStrategies: riskAssessment.mitigationStrategies,
  effectiveness: 'TBD', // Will be updated after Phase 3
});
```

## Context Management

### Analysis Depth Control

- Focus on root cause determination over symptom analysis
- Balance thoroughness with actionability
- Prioritize high-impact, low-risk solutions
- Document assumptions and confidence levels

### Solution Scope Management

- Design solutions appropriate to impact level
- Consider implementation constraints and resources
- Plan for both immediate relief and long-term prevention
- Include rollback strategies for all changes

## Integration Notes

### For Phase 3 Handoff

Phase 2 provides:

- Definitive root cause analysis with evidence
- Comprehensive technical solution design
- Detailed implementation plan with phases
- Risk assessment and mitigation strategies
- Success criteria and monitoring plan
- Resource requirements and timeline

### Quality Gates

Before proceeding to Phase 3:

- [ ] Root cause identified with >80% confidence
- [ ] Solution architecture documented
- [ ] Implementation plan detailed with phases
- [ ] Risk assessment complete with mitigations
- [ ] Success criteria defined and measurable
- [ ] GitHub issue updated with solution
- [ ] Stakeholder approval received (if required)
- [ ] Solution branch created and ready
