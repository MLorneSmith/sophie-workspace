# Build Feature Command Improvements

## Overview

This document outlines recommended improvements to the `/build-feature` command to address identified gaps in the AI-Assisted Feature Development methodology.

## Context Path Inconsistencies ✅ FIXED

**Issue**: The process used different context path patterns between phases.

**Resolution**: Updated all phases to use consistent path structure:

- Phase outputs: `.claude/build/4-output/{epic-name}/{phase-number}-{phase-name}/`
- Context files: `.claude/build/4-output/contexts/{type}/{id}/`

## Remaining Gaps to Address

### 1. Agent Coordination & Multi-Agent Execution

**Current State**: The build-feature command operates in a single-agent mode.

**Proposed Enhancement**:

```typescript
// Add agent coordination capabilities
interface AgentCoordinator {
  // Manage multiple agents working in parallel
  async executeParallelAgents(agents: Agent[], context: Context): Promise<Results>;

  // Synchronize results from multiple agents
  async synchronizeResults(results: Results[]): Promise<MergedResult>;

  // Handle agent handoffs between phases
  async handoffContext(fromAgent: Agent, toAgent: Agent, context: Context): Promise<void>;
}

// Example: Parallel story implementation
async function executeParallelStoryImplementation(storyIds: number[]) {
  const agents = storyIds.map(id => ({
    type: 'builder',
    storyId: id,
    context: loadStoryContext(id)
  }));

  // Execute builders in parallel
  const results = await agentCoordinator.executeParallelAgents(agents, sprintContext);

  // Reviewer agent validates all results
  const reviewedResults = await reviewerAgent.validateImplementations(results);

  // Fixer agent addresses any issues
  if (reviewedResults.hasIssues) {
    await fixerAgent.resolveIssues(reviewedResults.issues);
  }
}
```

### 2. Real MCP Tool Integration

**Current State**: Command shows pseudocode but lacks actual MCP tool usage examples.

**Proposed Enhancement**:

```typescript
// Add real MCP tool integration examples
async function executeMCPOperations(phase: string, context: any) {
  switch (phase) {
    case 'discovery':
      // Use perplexity for market research
      const marketData = await mcp.perplexity.ask({
        messages: [
          {
            role: 'user',
            content: `Research market trends for ${context.featureName}`,
          },
        ],
      });

      // Use GitHub to check existing features
      const existingFeatures = await mcp.github.search_issues({
        q: `is:issue label:feature ${context.featureName}`,
      });
      break;

    case 'implementation':
      // Create feature branch
      await mcp.github.create_branch({
        owner: 'MLorneSmith',
        repo: '2025slideheroes',
        branch: `feature/${context.storyId}`,
        from_branch: 'main',
      });

      // Run tests with proper error capture
      const testResults = await mcp.browser_tools.getConsoleErrors();

      // Check performance impact
      const perfMetrics = await mcp.newrelic.query_newrelic_logs({
        nrql: `SELECT * FROM Transaction WHERE name = '${context.endpoint}'`,
      });
      break;
  }
}
```

### 3. Rollback & Recovery Mechanisms

**Current State**: No rollback capabilities between phases.

**Proposed Enhancement**:

```typescript
// Add rollback and recovery system
interface PhaseCheckpoint {
  phase: string;
  timestamp: Date;
  state: any;
  artifacts: string[];
  gitCommit: string;
}

class PhaseManager {
  private checkpoints: Map<string, PhaseCheckpoint> = new Map();

  async saveCheckpoint(phase: string, state: any) {
    // Save current state
    const checkpoint: PhaseCheckpoint = {
      phase,
      timestamp: new Date(),
      state,
      artifacts: await this.collectArtifacts(phase),
      gitCommit: await this.createBackupCommit(phase),
    };

    this.checkpoints.set(phase, checkpoint);
    await this.persistCheckpoint(checkpoint);
  }

  async rollbackToPhase(targetPhase: string) {
    const checkpoint = this.checkpoints.get(targetPhase);
    if (!checkpoint) throw new Error(`No checkpoint for phase: ${targetPhase}`);

    // Restore git state
    await bash(`git checkout ${checkpoint.gitCommit}`);

    // Restore artifacts
    await this.restoreArtifacts(checkpoint.artifacts);

    // Update GitHub issues
    await this.resetIssueStates(targetPhase);

    console.log(`✅ Rolled back to ${targetPhase} checkpoint`);
  }
}
```

### 4. Session State Management

**Current State**: Context is loaded fresh each time, no session continuity.

**Proposed Enhancement**:

```typescript
// Add session state management
interface SessionState {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  currentPhase: string;
  completedSteps: string[];
  pendingActions: Action[];
  decisions: Decision[];
  workingMemory: Map<string, any>;
}

class SessionManager {
  private currentSession: SessionState;

  async resumeSession(reference: string) {
    // Check for existing session
    const sessionPath = `.claude/sessions/${reference}-session.json`;
    if (await fileExists(sessionPath)) {
      this.currentSession = await loadJson(sessionPath);

      console.log(
        `📂 Resuming session from ${this.formatTimeDiff(this.currentSession.lastActivity)}`,
      );
      console.log(
        `✅ Completed: ${this.currentSession.completedSteps.join(', ')}`,
      );
      console.log(
        `⏳ Pending: ${this.currentSession.pendingActions.length} actions`,
      );

      // Restore working memory
      await this.restoreWorkingMemory();
    } else {
      this.currentSession = await this.createNewSession(reference);
    }
  }

  async saveSession() {
    this.currentSession.lastActivity = new Date();
    await saveJson(
      `.claude/sessions/${this.currentSession.sessionId}-session.json`,
      this.currentSession,
    );
  }
}
```

### 5. Progress Visualization

**Current State**: Text-only progress updates.

**Proposed Enhancement**:

```typescript
// Add visual progress tracking
class ProgressVisualizer {
  async displayPhaseProgress(epicName: string) {
    const phases = [
      { name: 'Discovery', status: 'complete', duration: '2h' },
      { name: 'PRD', status: 'complete', duration: '1h' },
      { name: 'Chunking', status: 'complete', duration: '30m' },
      { name: 'Validation', status: 'in-progress', completion: 60 },
      { name: 'Stories', status: 'pending' },
      { name: 'Sprint', status: 'pending' },
      { name: 'Implementation', status: 'pending' },
    ];

    console.log('\n📊 Feature Progress Dashboard\n');
    console.log('━'.repeat(60));

    for (const phase of phases) {
      const icon = this.getStatusIcon(phase.status);
      const bar = this.getProgressBar(
        phase.completion || (phase.status === 'complete' ? 100 : 0),
      );

      console.log(
        `${icon} ${phase.name.padEnd(15)} ${bar} ${phase.duration || ''}`,
      );
    }

    console.log('━'.repeat(60));

    // Show story-level progress
    await this.displayStoryProgress(epicName);
  }

  private getProgressBar(percent: number): string {
    const filled = '█'.repeat(Math.floor(percent / 5));
    const empty = '░'.repeat(20 - filled.length);
    return `[${filled}${empty}] ${percent}%`;
  }
}
```

### 6. Interactive Mode Enhancements

**Current State**: Limited interactivity during phases.

**Proposed Enhancement**:

```typescript
// Add interactive decision points
class InteractiveMode {
  async promptForDecision(options: DecisionOption[]) {
    console.log('\n🤔 Decision Required:\n');

    options.forEach((opt, idx) => {
      console.log(`${idx + 1}. ${opt.label}`);
      console.log(`   ${opt.description}`);
      console.log(`   Impact: ${opt.impact}\n`);
    });

    const choice = await this.getUserInput(
      'Select option (or "explain" for more info): ',
    );

    if (choice === 'explain') {
      await this.explainOptions(options);
      return this.promptForDecision(options);
    }

    return options[parseInt(choice) - 1];
  }

  async confirmCriticalAction(action: string, impact: string) {
    console.log(`\n⚠️  Critical Action: ${action}`);
    console.log(`Impact: ${impact}`);

    const response = await this.getUserInput('Proceed? (yes/no/explain): ');

    if (response === 'explain') {
      await this.explainImpact(action, impact);
      return this.confirmCriticalAction(action, impact);
    }

    return response === 'yes';
  }
}
```

### 7. Error Recovery & Diagnostics

**Current State**: Basic error messages without recovery options.

**Proposed Enhancement**:

```typescript
// Add comprehensive error handling
class ErrorRecovery {
  async handlePhaseError(error: PhaseError) {
    console.log(`\n❌ Error in ${error.phase}: ${error.message}\n`);

    // Analyze error type
    const diagnosis = await this.diagnoseError(error);

    console.log(`🔍 Diagnosis: ${diagnosis.summary}`);
    console.log(`📍 Root Cause: ${diagnosis.rootCause}\n`);

    // Suggest recovery options
    const recoveryOptions = await this.getRecoveryOptions(diagnosis);

    console.log('🛠️  Recovery Options:');
    recoveryOptions.forEach((option, idx) => {
      console.log(`${idx + 1}. ${option.action}`);
      console.log(`   - ${option.description}`);
      console.log(`   - Success Rate: ${option.successRate}%\n`);
    });

    // Execute chosen recovery
    const choice = await this.promptUser('Select recovery option: ');
    await this.executeRecovery(recoveryOptions[choice - 1]);
  }

  async diagnoseError(error: PhaseError): Promise<Diagnosis> {
    // Check common issues
    if (error.message.includes('not found')) {
      return this.diagnoseMissingContext(error);
    }

    if (error.message.includes('GitHub API')) {
      return this.diagnoseGitHubIssue(error);
    }

    // Use AI to analyze complex errors
    return this.aiDiagnosis(error);
  }
}
```

### 8. Phase Transition Validation

**Current State**: No validation between phase transitions.

**Proposed Enhancement**:

```typescript
// Add phase transition gates
class PhaseTransitionValidator {
  private readonly gates = {
    'discovery->ideation': [
      { check: 'hasUserPersonas', message: 'User personas must be defined' },
      {
        check: 'hasMarketResearch',
        message: 'Market research must be completed',
      },
      {
        check: 'hasBusinessContext',
        message: 'Business context must be documented',
      },
    ],
    'ideation->chunking': [
      { check: 'hasPRD', message: 'PRD must be created and saved' },
      { check: 'hasEpicIssue', message: 'GitHub Epic must be created' },
      {
        check: 'hasTechnicalReqs',
        message: 'Technical requirements must be defined',
      },
    ],
    // ... more transitions
  };

  async validateTransition(
    from: string,
    to: string,
    context: any,
  ): Promise<ValidationResult> {
    const key = `${from}->${to}`;
    const gates = this.gates[key];

    if (!gates) {
      return { valid: true, message: 'No gates defined for transition' };
    }

    console.log(`\n🚦 Validating transition: ${from} → ${to}\n`);

    const results = [];
    for (const gate of gates) {
      const passed = await this.checkGate(gate.check, context);
      results.push({ gate: gate.check, passed, message: gate.message });

      console.log(`${passed ? '✅' : '❌'} ${gate.message}`);
    }

    const allPassed = results.every((r) => r.passed);

    if (!allPassed) {
      console.log('\n⚠️  Cannot proceed to next phase. Fix the issues above.');
      return {
        valid: false,
        failedGates: results.filter((r) => !r.passed),
        message: 'Phase transition validation failed',
      };
    }

    console.log('\n✅ All validation gates passed!');
    return { valid: true, message: 'Ready for next phase' };
  }
}
```

### 9. Deployment Phase Addition

**Current State**: Process ends at implementation, no deployment phase.

**Proposed Enhancement**:

```typescript
// Add deployment phase
async function executeDeploymentPhase(storyIds: number[]) {
  console.log(`🚀 Starting Deployment Phase\n`);

  // Pre-deployment checks
  console.log('📋 Pre-deployment Checklist:');
  const checks = [
    { name: 'All tests passing', command: 'pnpm test' },
    { name: 'Type checking clean', command: 'pnpm typecheck' },
    { name: 'No linting errors', command: 'pnpm lint' },
    { name: 'Build successful', command: 'pnpm build' },
    { name: 'Performance benchmarks met', validator: checkPerformance },
    { name: 'Security scan passed', validator: checkSecurity },
  ];

  for (const check of checks) {
    const passed = check.command
      ? await runCommand(check.command)
      : await check.validator();

    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) {
      console.log('🛑 Deployment blocked until all checks pass');
      return;
    }
  }

  // Create deployment PR
  console.log('\n📝 Creating Deployment PR...');
  const pr = await mcp.github.create_pull_request({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    title: `Deploy: ${epicName}`,
    head: `feature/${epicName}`,
    base: 'main',
    body: await generateDeploymentPRBody(storyIds),
  });

  // Monitor deployment
  console.log('\n📊 Monitoring Deployment...');
  await monitorDeployment(pr.number);

  // Post-deployment verification
  console.log('\n🔍 Post-deployment Verification...');
  await verifyDeployment(epicName);
}
```

### 10. Continuous Feedback Loop

**Current State**: Limited feedback collection mechanism.

**Proposed Enhancement**:

```typescript
// Add continuous feedback system
class FeedbackCollector {
  async collectPhaseFeedback(phase: string, context: any) {
    const feedback = {
      phase,
      timestamp: new Date(),
      epicName: context.epicName,
      metrics: await this.collectMetrics(phase),
      userFeedback: null,
      suggestions: [],
    };

    // Collect metrics
    console.log('\n📊 Phase Metrics:');
    console.log(`Duration: ${feedback.metrics.duration}`);
    console.log(`Iterations: ${feedback.metrics.iterations}`);
    console.log(`Issues Found: ${feedback.metrics.issuesFound}`);

    // Optional user feedback
    if (await this.promptForFeedback()) {
      feedback.userFeedback = await this.collectUserFeedback();
      feedback.suggestions = await this.collectSuggestions();
    }

    // Save feedback
    await this.saveFeedback(feedback);

    // Apply learnings to next iteration
    await this.applyLearnings(feedback);
  }

  async generateRetrospective(epicName: string) {
    const feedbacks = await this.loadAllFeedback(epicName);

    console.log(`\n📋 ${epicName} Retrospective\n`);
    console.log('What went well:');
    feedbacks
      .filter((f) => f.metrics.success)
      .forEach((f) => {
        console.log(`- ${f.phase}: ${f.metrics.successReason}`);
      });

    console.log('\nWhat could improve:');
    feedbacks
      .filter((f) => f.suggestions.length > 0)
      .forEach((f) => {
        f.suggestions.forEach((s) => console.log(`- ${f.phase}: ${s}`));
      });

    console.log('\nKey Metrics:');
    console.log(`Total Duration: ${this.calculateTotalDuration(feedbacks)}`);
    console.log(`Velocity: ${this.calculateVelocity(feedbacks)} points/day`);
    console.log(`Quality Score: ${this.calculateQualityScore(feedbacks)}/10`);
  }
}
```

## Implementation Priorities

1. **High Priority** (Critical for process integrity):

   - Phase transition validation
   - Session state management
   - Error recovery mechanisms

2. **Medium Priority** (Enhances usability):

   - Progress visualization
   - Interactive mode enhancements
   - Rollback capabilities

3. **Low Priority** (Nice to have):
   - Multi-agent coordination
   - Continuous feedback loop
   - Advanced diagnostics

## Next Steps

1. Implement high-priority enhancements first
2. Test each enhancement in isolation
3. Update all phase prompts to reference new capabilities
4. Create integration tests for phase transitions
5. Document new features in user guide

## Conclusion

These improvements will transform the build-feature command from a basic orchestrator to a robust, production-ready system that can handle complex feature development with proper error handling, state management, and visualization capabilities.
