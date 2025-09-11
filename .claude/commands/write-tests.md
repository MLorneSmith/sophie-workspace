# Write Tests Command (Unified)

Usage: `/write-tests [options]` 

This unified command intelligently selects the most important test to write based on business priorities, CI/CD pipeline requirements, and current context.

## Quick Usage

```bash
/write-tests                           # Intelligent auto-selection
/write-tests --type=unit              # Force unit tests (backward compatible)
/write-tests --type=e2e               # Force E2E tests
/write-tests --type=accessibility     # Force accessibility tests
/write-tests --type=integration       # Force integration tests
/write-tests --type=performance       # Force performance tests
/write-tests --stage=pr               # Optimize for PR validation
/write-tests --stage=staging          # Optimize for staging deployment
/write-tests --file=path/to/file.ts   # Force specific file
/write-tests --priority=p1            # Focus on P1 business critical files
/write-tests 3                        # Process 3 files (batch size)
```

## 1. Adopt Role

Load the appropriate testing role based on selected test type:

```
/read .claude/context/roles/comprehensive-test-writer.md
```

## 2. Session-Focused Test Type Selection

### 2.1 Context Detection

```typescript
// Detect current development context
const context = {
  // Git context
  currentBranch: await getCurrentBranch(),
  recentChanges: await getRecentlyModifiedFiles(),
  
  // CI/CD stage detection
  stage: detectCiCdStage(),
  
  // User preferences
  testType: args.type,
  targetFile: args.file,
  priority: args.priority,
  batchSize: args.batchSize || 3  // Default to multiple tests of same type
};
```

### 2.2 Individual Test Scoring Algorithm (Session-Focused)

```typescript
// Score EVERY individual test possibility across ALL test types
function calculateIndividualTestPriority(file: string, testType: string, context: Context): number {
  let score = 0;
  
  // Business Priority (from existing checklist)
  score += getBusinessPriority(file); // P1=10, P2=5, P3=1
  
  // CI/CD Stage Requirements for this specific test
  score += getCiCdStageRequirements(file, testType, context.stage); // 0-15 points
  
  // Coverage Gap Severity for this specific file/test type combination
  score += getCoverageGapScore(file, testType); // 0-10 points
  
  // Recent Changes Context (specific file relevance)
  if (context.recentChanges.includes(file)) score += 8;
  if (isRelatedToRecentChanges(file, context.recentChanges)) score += 3;
  
  // Test Dependencies (prerequisites for THIS specific test)
  score += getTestDependencyScore(file, testType); // -5 to +5 points
  
  // Risk/Impact factor (critical path, revenue impact, etc.)
  score += getRiskImpactScore(file, testType); // 0-5 points
  
  return score;
}

// Find the HIGHEST scoring individual test across all types
function selectSessionLeadTest(context: Context): { file: string, testType: string, score: number } {
  const allPossibleTests = [];
  
  // Generate all possible test combinations
  for (const testType of ['unit', 'e2e', 'accessibility', 'integration', 'performance']) {
    const candidateFiles = getCandidateFiles(testType, context);
    for (const file of candidateFiles) {
      allPossibleTests.push({
        file,
        testType,
        score: calculateIndividualTestPriority(file, testType, context)
      });
    }
  }
  
  // Return the highest scoring individual test
  return allPossibleTests.sort((a, b) => b.score - a.score)[0];
}

// AFTER lead test selected, fill session with same test type in priority order
function fillSessionWithSameType(leadTest: TestTarget, context: Context): TestTarget[] {
  const sameTypeTests = getCandidateFiles(leadTest.testType, context)
    .map(file => ({
      file,
      testType: leadTest.testType,
      score: calculateIndividualTestPriority(file, leadTest.testType, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, context.batchSize);
    
  return sameTypeTests;
}
```

### 2.3 Selection Output (Individual Test Priority)

```typescript
// Display individual test selection rationale
console.log(`
🎯 Highest Priority Individual Test Selected:

Lead Test: ${leadTest.testType} test for ${leadTest.file}
Score: ${leadTest.score} points
Reason: ${getSelectionReason(leadTest)}

Score Breakdown:
- Business Priority (P${priority}): +${businessPoints} pts
- CI/CD Stage Requirements: +${cicdPoints} pts
- Coverage Gap: +${coveragePoints} pts
- Recent Changes: +${changesPoints} pts
- Test Dependencies: +${depPoints} pts
- Risk/Impact: +${riskPoints} pts
TOTAL: ${leadTest.score} points

Session Plan (${leadTest.testType} tests in priority order):
${sessionTargets.map((target, i) => `${i+1}. ${target.file} (${target.score} pts)`).join('\n')}

Top alternatives from other test types:
${topAlternatives.map(alt => `- ${alt.testType} test for ${alt.file} (${alt.score} pts)`).join('\n')}

📚 Loading ${leadTest.testType} testing context for session...
`);
```

## 3. Test Type Specific Workflows

### 3.1 Unit Tests (Default/Backward Compatible)

When unit tests are selected, follow the established workflow:

```
/read .claude/context/standards/testing/testing-fundamentals.md
/read .claude/context/standards/testing/mocking-and-typescript.md
/read .claude/context/standards/testing/testing-examples.md
```

**Process:**
1. Read unit test checklist and prioritization plan
2. Identify target file and create test case documentation
3. Analyze source file and dependencies
4. Write comprehensive unit tests with Vitest
5. Verify TypeScript compilation: `pnpm --filter web typecheck`
6. Update tracking documentation

### 3.2 E2E Tests (Playwright)

When E2E tests are selected:

```
/read .claude/context/standards/testing/e2e-testing-fundamentals.md
```

**Process:**
1. Identify critical user workflows in target area
2. Create Page Object Models if needed
3. Write Playwright tests focusing on user journeys
4. Test across browser matrix (Chromium, Firefox, WebKit)
5. Verify tests pass: `pnpm --filter e2e playwright test`
6. Update E2E test tracking

### 3.3 Accessibility Tests (axe-core)

When accessibility tests are selected:

```
/read .claude/context/standards/testing/accessibility-testing-fundamentals.md
```

**Process:**
1. Identify UI components and pages needing a11y testing
2. Create accessibility test scenarios
3. Write axe-core integration tests
4. Test WCAG 2.1 AA compliance
5. Verify tests pass: `pnpm --filter e2e a11y:test`
6. Update accessibility tracking

### 3.4 Integration Tests

When integration tests are selected:

```
/read .claude/context/standards/testing/integration-testing-fundamentals.md
```

**Process:**
1. Identify API endpoints and service interactions
2. Create integration test scenarios
3. Write tests for data flow and service communication
4. Mock external dependencies appropriately
5. Verify tests pass with integration test suite
6. Update integration test tracking

### 3.5 Performance Tests

When performance tests are selected:

```
/read .claude/context/standards/testing/performance-testing-fundamentals.md
```

**Process:**
1. Identify performance-critical paths
2. Create performance benchmarks and budgets
3. Write performance tests (bundle size, load times, Core Web Vitals)
4. Verify performance thresholds
5. Update performance tracking

## 4. Priority Matrix Integration

### 4.1 Business Priority Detection

```typescript
// Read existing checklist priorities
const priorities = {
  p1: [
    'ai/canvas/**',
    'storyboard/**', 
    'course/lessons/**',
    'auth/**',
    'payments/**'
  ],
  p2: [
    'course/management/**',
    'user/**',
    'admin/**'
  ],
  p3: [
    'analytics/**',
    'integrations/**'
  ]
};
```

### 4.2 CI/CD Stage Detection

```typescript
function detectCiCdStage(): string {
  if (process.env.GITHUB_REF === 'refs/heads/main') return 'production';
  if (process.env.GITHUB_REF === 'refs/heads/staging') return 'staging'; 
  if (process.env.GITHUB_REF?.startsWith('refs/heads/')) return 'dev';
  
  // Local development context
  const branch = getCurrentBranch();
  if (branch === 'main') return 'production';
  if (branch === 'staging') return 'staging';
  return 'dev';
}
```

### 4.3 Test Requirements by Stage

```typescript
const stageRequirements = {
  pr: ['unit', 'accessibility', 'security'],
  dev: ['unit', 'integration', 'e2e_smoke', 'accessibility'],
  staging: ['unit', 'integration', 'e2e_full', 'performance', 'accessibility'],
  production: ['all_tests_passing', 'security_audit', 'load_test']
};
```

## 5. Session-Focused Implementation Flow

### 5.1 Main Command Logic (Session-Focused)

```typescript
async function executeWriteTests(args: CommandArgs) {
  // 1. Context Detection
  const context = await detectContext(args);
  
  // 2. Find HIGHEST PRIORITY individual test across all test types
  const leadTest = args.file && args.type
    ? { file: args.file, testType: args.type, score: 'manual' }
    : await selectSessionLeadTest(context);
  
  // 3. Fill session with same test type in priority order
  const sessionTargets = args.file
    ? [leadTest]
    : await fillSessionWithSameType(leadTest, context);
  
  // 4. Load ONLY the documentation for the selected test type (efficient context usage)
  await loadTestTypeDocumentation(leadTest.testType);
  
  // 5. Execute test creation for all targets of the same type (in priority order)
  for (const target of sessionTargets) {
    console.log(`\n🧪 Creating ${target.testType} test ${currentIndex}/${sessionTargets.length}: ${target.file} (${target.score} pts)`);
    
    await executeTestWorkflow(target.testType, target, context);
    await updateTestTracking(target.testType, target);
    
    // Check context window usage between tests
    if (await isContextWindowConstrained()) {
      console.log(`⚠️ Context window getting full, completed ${completedTests}/${sessionTargets.length} tests`);
      console.log(`Recommend starting new session for remaining ${remainingTests.length} tests of same type`);
      break;
    }
  }
  
  // 6. Session summary and next session suggestion
  await generateSessionSummary(leadTest.testType, completedTests);
  await suggestNextHighestPriorityTest(context, completedTests);
}
```

### 5.2 Backward Compatibility

```typescript
// Maintain existing write-unit-tests behavior
if (!args.type && !args.stage && !args.priority) {
  // Default to unit test behavior for backward compatibility
  selection.type = 'unit';
  console.log('ℹ️ Using unit tests (default). Use --type to specify other test types.');
}
```

## 6. Automatic Template Selection and Documentation

### 6.1 Template Selection Logic

```typescript
function selectTestTemplate(testType: string, file: string): string {
  const templateMap = {
    unit: 'unit-test-template',
    e2e: 'e2e-test-template', 
    accessibility: 'accessibility-test-template',
    integration: 'integration-test-template',
    performance: 'performance-test-template'
  };
  
  const templateSection = templateMap[testType];
  return extractTemplateSection(templateSection);
}

function getTestCaseDocumentationPath(testType: string, file: string): string {
  const pathMap = {
    unit: `.claude/instructions/testing/test-cases/${mirrorSourcePath(file)}/${getBasename(file)}.test-cases.md`,
    e2e: `.claude/instructions/testing/test-cases/e2e/${getWorkflowName(file)}.test-cases.md`,
    accessibility: `.claude/instructions/testing/test-cases/a11y/${getComponentName(file)}.test-cases.md`,
    integration: `.claude/instructions/testing/test-cases/integration/${getServiceName(file)}.test-cases.md`,
    performance: `.claude/instructions/testing/test-cases/performance/${getFeatureName(file)}.test-cases.md`
  };
  
  return pathMap[testType];
}
```

### 6.2 Test Case Documentation Creation

```typescript
async function createTestCaseDocumentation(testType: string, file: string, sessionTargets: Target[]) {
  // 1. Select appropriate template
  const template = selectTestTemplate(testType, file);
  
  // 2. Fill template with file-specific information
  const documentation = fillTemplate(template, {
    filename: getBasename(file),
    filepath: file,
    testType: testType,
    priority: getBusinessPriority(file),
    relatedTests: getRelatedTests(file, testType)
  });
  
  // 3. Save to appropriate location
  const docPath = getTestCaseDocumentationPath(testType, file);
  await ensureDirectoryExists(path.dirname(docPath));
  await writeFile(docPath, documentation);
  
  // 4. Add cross-references
  await addCrossReferences(file, testType, docPath);
}
```

### 6.3 Cross-Reference System

```typescript
async function addCrossReferences(file: string, testType: string, docPath: string) {
  const relatedTests = {
    unit: findUnitTests(file),
    integration: findIntegrationTests(file),
    e2e: findE2eTests(file),
    accessibility: findAccessibilityTests(file), 
    performance: findPerformanceTests(file)
  };
  
  // Update all related test case documents to reference this new test
  for (const [type, tests] of Object.entries(relatedTests)) {
    for (const test of tests) {
      await updateRelatedTestsSection(test.docPath, testType, docPath);
    }
  }
  
  // Update unified tracking system
  await updateUnifiedTracking(file, testType, docPath);
}
```

### 6.4 Unified Tracking Updates

Update the comprehensive tracking system:

```typescript
async function updateUnifiedTracking(file: string, testType: string, docPath: string) {
  // Update main checklist
  await updateComprehensiveChecklist(file, testType, 'in_progress');
  
  // Update test coverage matrix
  await updateCoverageMatrix(getFeatureArea(file), testType, '+1');
  
  // Update priority queue (remove completed test)
  await updatePriorityQueue(file, testType, 'completed');
  
  // Update cross-reference matrix
  await updateCrossReferenceMatrix(file, testType, docPath);
}
```

### 6.5 Template Auto-Fill Logic

```typescript
function fillTemplate(template: string, context: TemplateContext): string {
  return template
    .replace(/\[filename\]/g, context.filename)
    .replace(/\[file-path\]/g, context.filepath)
    .replace(/\[YYYY-MM-DD\]/g, new Date().toISOString().split('T')[0])
    .replace(/\[test-type\]/g, context.testType)
    .replace(/\[priority\]/g, context.priority)
    .replace(/\[framework\]/g, getFramework(context.testType))
    .replace(/\[related-tests\]/g, formatRelatedTests(context.relatedTests));
}

function getFramework(testType: string): string {
  const frameworks = {
    unit: 'Vitest',
    e2e: 'Playwright',
    accessibility: 'axe-core with Playwright',
    integration: 'Playwright Request',
    performance: 'Lighthouse CI'
  };
  
  return frameworks[testType] || 'TBD';
}
```

## 7. Session-Focused Context Window Management

### 7.1 Efficient Context Usage Strategy

**Session-Focused Benefits:**
- ✅ Load context docs for ONE test type only
- ✅ Maintain consistent testing mindset throughout session
- ✅ Reuse loaded framework knowledge across multiple tests  
- ✅ Avoid context switching overhead between test types
- ✅ More tests completed per session

**Context Loading Strategy:**
```typescript
// EFFICIENT: Load once per session
if (selectedTestType === 'e2e') {
  await loadOnce('.claude/context/standards/testing/e2e-testing-fundamentals.md');
  // Now write 3-5 E2E tests using this loaded context
}

// INEFFICIENT: Don't do this in a single session
// Load e2e docs → write 1 E2E test → Load unit docs → write 1 unit test → Load a11y docs...
```

### 7.2 Session Batch Sizing

- **Default**: 3 tests of same type (balanced approach)
- **Simple utilities**: Up to 5 tests (low context per test)
- **Complex integrations**: 1-2 tests (high context per test)
- **Manual override**: `--batch-size=N` or number parameter

### 7.3 Context Window Monitoring

Between each test in the session:
```typescript
// Monitor context usage and adjust session scope
const contextStatus = await assessContextWindow();
if (contextStatus.usage > 0.8) {
  console.log('🔄 Context window at 80%, completing current test and ending session');
  await completeCurrentTest();
  await suggestNextSession(remainingTargets);
  return;
}
```

### 7.4 Session Completion Strategies

**Natural completion** (all targets done):
1. Complete all tests of selected type
2. Update tracking for all completed work
3. Suggest next most important test type for future session

**Early completion** (context constrained):
1. Complete current test in progress
2. Update tracking for completed work only
3. Save remaining targets to priority queue
4. Suggest immediate follow-up session with same test type

## 8. Session-Focused Example Workflows

### 8.1 Intelligent Session Selection Example

```bash
$ /write-tests

🔍 Analyzing testing priorities for session focus...

Context detected:
- Branch: feature/ai-improvements
- Recent changes: ai/canvas/generate-ideas.ts, storyboard/service.ts
- Stage: dev (preparing for PR)
- Test type coverage gaps: E2E (20%), Unit (60%), A11y (10%)

🎯 Highest Priority Individual Test Selected:

Lead Test: E2E test for ai/canvas/generate-ideas-workflow.e2e.ts
Score: 28 points
Reason: P1 business priority + recent changes + missing E2E coverage + CI/CD dev stage

Session Plan (E2E tests in priority order):
1. ai/canvas/generate-ideas-workflow.e2e.ts (28 pts) - Lead test
2. ai/storyboard/creation-flow.e2e.ts (25 pts) - P1, recent changes
3. course/lesson-navigation.e2e.ts (22 pts) - P1, coverage gap

Top alternatives from other test types:
- Unit test for ai/canvas/generate-ideas.ts (24 pts)
- Accessibility test for CourseProgressBar.tsx (20 pts)

📚 Loading E2E testing context...

Creating E2E test 1/3: AI Canvas idea generation workflow...
✅ Test 1 complete

Creating E2E test 2/3: Storyboard creation flow...
✅ Test 2 complete  

Creating E2E test 3/3: Course lesson navigation...
✅ Test 3 complete

🎯 Session complete! Next recommended session: Accessibility tests for P1 components
```

### 8.2 Manual Session Override Example

```bash
$ /write-tests --type=accessibility 3

🎯 Manual session selection: Accessibility tests
Batch size: 3 tests
Auto-selecting highest priority accessibility targets...

Session targets:
1. CourseProgressBar.tsx (P1, missing a11y tests)
2. AICanvasToolbar.tsx (P1, basic a11y only)
3. LessonVideoPlayer.tsx (P1, keyboard nav issues)

📚 Loading accessibility testing context...

Creating accessibility test 1/3: CourseProgressBar WCAG compliance...
✅ Test 1 complete

Creating accessibility test 2/3: AICanvasToolbar keyboard navigation...
✅ Test 2 complete

Creating accessibility test 3/3: LessonVideoPlayer screen reader support...
✅ Test 3 complete

🎯 Session complete! 3 P1 components now have comprehensive a11y coverage
```

### 8.3 Context-Aware Session Management Example

```bash
$ /write-tests --stage=staging

🎯 Staging deployment optimization session
Selected: Performance tests (required for staging validation)
Auto-selecting performance test targets...

Session targets:
1. Course loading performance budgets
2. AI Canvas rendering performance  
3. Video streaming Core Web Vitals

📚 Loading performance testing context...

Creating performance test 1/3: Course loading budgets...
✅ Test 1 complete

Creating performance test 2/3: AI Canvas rendering...
⚠️ Context window at 75%, completing current test...
✅ Test 2 complete

🔄 Context window at 85%, ending session after 2/3 tests
Remaining: Video streaming Core Web Vitals

💡 Suggest starting new session: /write-tests --type=performance --continue
```

## 9. Migration from write-unit-tests

Existing workflows continue to work:

```bash
# These all work the same as before
/write-tests --type=unit
/write-tests --type=unit 3
/write-tests --type=unit --file=specific.ts
```

New capabilities added on top:

```bash
# New intelligent capabilities
/write-tests                    # Auto-select most important
/write-tests --type=e2e        # Other test types
/write-tests --stage=staging   # Context optimization
```

## Key Workflow Notes

- **Session-focused efficiency**: Selects ONE test type per session for optimal context usage
- **Intelligent test type selection**: Auto-selects most valuable test TYPE, then multiple targets within that type
- **Context window optimized**: Load documentation once, write 3-5 related tests
- **Backward compatible**: Existing unit test workflows unchanged (`--type=unit`)
- **Comprehensive coverage**: Supports all test types in CI/CD pipeline
- **Smart session management**: Monitors context usage and suggests follow-up sessions
- **Context aware**: Considers git state, CI/CD stage, business priorities
- **Batch processing**: Default 3 tests per session, adjustable based on complexity
- **Maintainable**: Builds on existing checklist and documentation systems
- **Extensible**: Easy to add new test types and selection criteria

### Session Management Features

- **Auto-batching**: Automatically groups related tests of same type
- **Context monitoring**: Stops before context window exhaustion
- **Session continuity**: Suggests follow-up sessions for remaining work
- **Progress tracking**: Maintains state across multiple sessions
- **Intelligent defaults**: Balances session size with test complexity