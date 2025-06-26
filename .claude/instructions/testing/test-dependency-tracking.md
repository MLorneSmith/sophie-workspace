# Test Dependency Tracking System

This system tracks dependencies between different test types to ensure logical test progression and maximize test value.

## Test Type Hierarchy

```
Unit Tests (Foundation)
    ↓
Integration Tests (Service Level) 
    ↓
E2E Tests (User Level)
    ↓
Performance Tests (System Level)

Accessibility Tests (Parallel - UI Components)
Security Tests (Parallel - All Levels)
```

## Dependency Rules

### Unit Tests → Integration Tests
**Rule**: Integration tests should have corresponding unit tests for components they test

**Scoring Impact**:
- Unit tests exist: +3 points for integration tests
- Unit tests missing: -2 points for integration tests

**Rationale**: Unit tests validate individual components work correctly before testing their integration

**Example**:
```typescript
// Good: Unit test exists
File: ai/canvas/generate-ideas.ts (has unit tests)
Integration test: ai/canvas/generate-ideas.integration.ts
Bonus: +3 points

// Warning: Missing foundation
File: payment/process-payment.ts (no unit tests)
Integration test: payment/process-payment.integration.ts  
Penalty: -2 points
```

### Integration Tests → E2E Tests
**Rule**: E2E workflows should have integration tests for the APIs they depend on

**Scoring Impact**:
- Integration tests exist: +2 points for E2E tests
- Integration tests missing: -1 point for E2E tests

**Rationale**: E2E tests are more reliable when underlying APIs are already validated

**Example**:
```typescript
// Good: API integration tested
API: /api/courses/[id]/lessons (has integration tests)
E2E test: course-completion-workflow.e2e.ts
Bonus: +2 points

// Warning: Untested API dependency
API: /api/payments/process (no integration tests)
E2E test: payment-flow.e2e.ts
Penalty: -1 point
```

### Unit Tests → E2E Tests (Indirect)
**Rule**: E2E tests for complex workflows benefit from unit tests on business logic

**Scoring Impact**:
- Unit tests exist for key business logic: +1 point for E2E tests
- Unit tests missing for critical logic: 0 points (neutral)

**Rationale**: E2E tests are more stable when business logic is unit tested

### E2E Tests → Performance Tests
**Rule**: Performance tests should have E2E tests for the workflows they measure

**Scoring Impact**:
- E2E tests exist for workflow: +2 points for performance tests
- E2E tests missing: -1 point for performance tests

**Rationale**: Performance tests need realistic user workflows to be meaningful

**Example**:
```typescript
// Good: Workflow already tested
E2E test: ai-canvas-creation.e2e.ts (exists)
Performance test: ai-canvas-performance.perf.ts
Bonus: +2 points

// Warning: Workflow not validated
E2E test: course-video-streaming.e2e.ts (missing)
Performance test: video-streaming-performance.perf.ts
Penalty: -1 point
```

## Special Cases

### Accessibility Tests (UI Components)
**Dependencies**: Unit tests for UI components (recommended but not required)

**Scoring Impact**:
- Component unit tests exist: +1 point for accessibility tests
- Component unit tests missing: 0 points (neutral)

**Rationale**: Accessibility tests can be valuable even without unit tests

### Security Tests (Cross-cutting)
**Dependencies**: No hard dependencies, but benefits from existing tests

**Scoring Impact**:
- Any existing tests: +1 point for security tests
- No existing tests: 0 points (neutral)

**Rationale**: Security tests provide value regardless of other test coverage

## Dependency Detection Algorithm

```typescript
interface TestDependency {
  testType: string;
  file: string;
  dependencies: DependencyCheck[];
  score: number;
}

interface DependencyCheck {
  requiredTestType: string;
  requiredFile: string;
  exists: boolean;
  impact: number; // points added/subtracted
  severity: 'required' | 'recommended' | 'optional';
}

function calculateDependencyScore(file: string, testType: string): number {
  const dependencies = getDependencies(file, testType);
  let score = 0;
  
  for (const dep of dependencies) {
    if (dep.exists) {
      score += dep.impact; // positive bonus
    } else {
      if (dep.severity === 'required') {
        score += dep.impact; // negative penalty
      }
      // recommended/optional don't penalize, just don't bonus
    }
  }
  
  return score;
}

function getDependencies(file: string, testType: string): DependencyCheck[] {
  const dependencies: DependencyCheck[] = [];
  
  switch (testType) {
    case 'integration':
      // Check for unit tests
      const unitTestFile = file.replace(/\.(ts|tsx)$/, '.test.$1');
      dependencies.push({
        requiredTestType: 'unit',
        requiredFile: unitTestFile,
        exists: testExists(unitTestFile),
        impact: testExists(unitTestFile) ? +3 : -2,
        severity: 'recommended'
      });
      break;
      
    case 'e2e':
      // Check for integration tests of APIs used
      const apiEndpoints = getApiEndpointsUsed(file);
      for (const api of apiEndpoints) {
        const integrationTestFile = api.replace(/\.ts$/, '.integration.ts');
        dependencies.push({
          requiredTestType: 'integration',
          requiredFile: integrationTestFile,
          exists: testExists(integrationTestFile),
          impact: testExists(integrationTestFile) ? +2 : -1,
          severity: 'recommended'
        });
      }
      break;
      
    case 'performance':
      // Check for E2E tests of workflows being measured
      const workflowFile = file.replace(/\.perf\.ts$/, '.e2e.ts');
      dependencies.push({
        requiredTestType: 'e2e',
        requiredFile: workflowFile,
        exists: testExists(workflowFile),
        impact: testExists(workflowFile) ? +2 : -1,
        severity: 'recommended'
      });
      break;
      
    case 'accessibility':
      // Check for component unit tests
      if (isUIComponent(file)) {
        const componentTestFile = file.replace(/\.(tsx)$/, '.test.$1');
        dependencies.push({
          requiredTestType: 'unit',
          requiredFile: componentTestFile,
          exists: testExists(componentTestFile),
          impact: testExists(componentTestFile) ? +1 : 0,
          severity: 'optional'
        });
      }
      break;
  }
  
  return dependencies;
}
```

## Dependency Tracking in Test Selection

### Display Dependency Information

```typescript
console.log(`
🎯 Test Selection with Dependencies:

Selected: ${testType} test for ${file}
Score: ${totalScore} points

Dependency Analysis:
${dependencies.map(dep => 
  `${dep.exists ? '✅' : '❌'} ${dep.requiredTestType} test for ${dep.requiredFile} (${dep.impact > 0 ? '+' : ''}${dep.impact} pts)`
).join('\n')}

${missingDependencies.length > 0 ? `
⚠️ Missing Recommended Dependencies:
${missingDependencies.map(dep => 
  `- Consider writing ${dep.requiredTestType} test for ${dep.requiredFile} first`
).join('\n')}
` : '✅ All recommended dependencies satisfied'}
`);
```

### Suggest Prerequisite Tests

When a test has missing dependencies with negative impact:

```typescript
if (hasCriticalMissingDependencies(selectedTest)) {
  console.log(`
💡 Suggestion: Consider writing prerequisite tests first:

1. ${missingDeps[0].requiredTestType} test for ${missingDeps[0].requiredFile}
2. Then return to write ${selectedTest.testType} test for ${selectedTest.file}

This will provide better test stability and coverage.

Continue anyway? Use /write-tests --force to override dependency warnings.
`);
}
```

## Dependency Validation Examples

### Example 1: Integration Test with Good Dependencies
```
File: ai/canvas/generate-ideas.integration.ts
Dependencies:
✅ Unit test exists: generate-ideas.test.ts (+3 pts)
✅ Component tests exist (+1 pt)
Total dependency bonus: +4 points
```

### Example 2: E2E Test with Missing Dependencies
```
File: payment-flow.e2e.ts
Dependencies:
❌ Integration test missing: /api/payments/process.integration.ts (-1 pt)
❌ Unit tests missing: payment-processor.test.ts (0 pts - not critical for E2E)
⚠️ Consider writing integration tests for payment APIs first
Total dependency penalty: -1 point
```

### Example 3: Performance Test with Dependencies
```
File: ai-canvas-performance.perf.ts
Dependencies:
✅ E2E test exists: ai-canvas-workflow.e2e.ts (+2 pts)
✅ Integration tests exist for APIs (+1 pt)
Total dependency bonus: +3 points
```

## Dependency Override Options

Users can override dependency warnings:

```bash
# Force test creation despite missing dependencies
/write-tests --force

# Show dependency analysis without creating tests
/write-tests --analyze-dependencies

# Create missing dependencies first (guided workflow)
/write-tests --resolve-dependencies
```

## Benefits of Dependency Tracking

1. **Logical Test Progression**: Ensures solid foundation before complex tests
2. **Higher Test Reliability**: Tests with dependencies are more stable
3. **Better ROI**: Foundation tests enable multiple higher-level tests
4. **Guided Development**: Suggests optimal test writing order
5. **Quality Assurance**: Prevents building unreliable test suites

---
*This system ensures tests are built on solid foundations for maximum reliability and value*