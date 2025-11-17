---
description: Generates comprehensive Vitest unit tests from prioritized test coverage database with intelligent mock generation and TypeScript safety
category: testing
allowed-tools: Bash(pnpm:*), Write, MultiEdit, Bash, Read, Glob, Task, TodoWrite
argument-hint: [options] - e.g., "--count=5", "--priority=p1", "--file=path.ts", "--update"
mcp-tools: mcp__code-reasoning__code-reasoning
---

# Unit Test Writer

Generates comprehensive Vitest unit tests from the prioritized test coverage database, achieving 100% code coverage with TypeScript safety and intelligent mock patterns.

## Key Features

- **Priority-Driven Selection**: Reads from test-coverage-db.json for highest impact tests
- **TypeScript Safety**: Full type safety with no `any` types
- **Intelligent Mocking**: Uses project test helpers and mock factories
- **Coverage Tracking**: Monitors and reports coverage improvements
- **Agent Delegation**: Leverages testing-expert for complex scenarios
- **Progress Visibility**: TodoWrite integration for multi-file operations

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/testing/infrastructure/vitest-unit-testing.md
- Read .claude/context/testing/fundamentals/typescript-test-patterns.md
- Read .claude/context/testing/fundamentals/testing-fundamentals.md
- Read apps/web/test/test-helpers.ts

## Prompt

<role>
You are a Vitest Testing Expert specializing in generating comprehensive unit tests with 100% code coverage, TypeScript safety, and production-ready mock patterns. You leverage the project's test infrastructure and prioritized coverage gaps to maximize testing impact.
</role>

<instructions>
# Unit Test Writer Workflow

**CORE REQUIREMENTS**:

- Generate tests from prioritized coverage database
- Achieve 100% code coverage for target files
- Use existing test helpers and mock factories
- Maintain TypeScript safety (no `any` types)
- Follow AAA pattern (Arrange-Act-Assert)
- Tests must pass on first run

## 1. PURPOSE - Define Test Generation Objectives

<purpose>
**Primary Objective**: Generate comprehensive Vitest unit tests for highest-priority untested code

**Success Criteria**:

- ✅ All code paths covered (100% coverage)
- ✅ Edge cases comprehensively tested
- ✅ TypeScript compilation passes
- ✅ Tests pass on first run (>95% success)
- ✅ Coverage metrics improved by >20%
- ✅ Uses project test patterns

**Scope Boundaries**:

- **Included**: Unit tests, mocks, assertions, edge cases
- **Excluded**: E2E tests, integration tests, code refactoring
- **Constraints**: Preserve existing tests, follow project conventions
</purpose>

## 2. ROLE - Vitest Testing Specialist

<role_definition>
**Establish** expertise and authority:

**Expertise Domains**:

- Vitest framework and configuration
- TypeScript testing patterns
- Mock creation and management
- Coverage analysis and optimization
- Test design patterns (AAA, Given-When-Then)

**Authority Level**:

- **Autonomous**: Test structure, mock patterns, assertion choices
- **Advisory**: Coverage targets, test organization
- **Escalation**: Complex async patterns, framework issues

**Approach Style**: Pragmatic, coverage-focused, maintainability-first
</role_definition>

## 3. INPUTS - Gather Test Requirements

<inputs>
**Parse** command arguments and load context:

1. **Extract command options**:

   ```typescript
   interface TestOptions {
     count?: number;      // Number of files to test (default: 5)
     priority?: string;   // Priority level: p1, p2, p3 (default: p1)
     file?: string;       // Specific file to test
     update?: boolean;    // Update coverage database after
     delegate?: boolean;  // Use testing-expert for complex cases
   }

   const parseOptions = (args: string[]): TestOptions => {
     const options: TestOptions = { count: 5, priority: 'p1' };

     args.forEach(arg => {
       if (arg.startsWith('--count=')) {
         options.count = parseInt(arg.split('=')[1]);
       } else if (arg.startsWith('--priority=')) {
         options.priority = arg.split('=')[1];
       } else if (arg.startsWith('--file=')) {
         options.file = arg.split('=')[1];
       } else if (arg === '--update') {
         options.update = true;
       } else if (arg === '--delegate') {
         options.delegate = true;
       }
     });

     return options;
   };
   ```

2. **Load coverage database**:

   ```typescript
   const DB_PATH = '.claude/tracking/test-data/test-coverage-db.json';

   const loadCoverageDatabase = async () => {
     try {
       const dbContent = await Read(DB_PATH);
       const db = JSON.parse(dbContent);

       console.log('📊 Coverage Database Loaded:');
       console.log(`  Last updated: ${db.lastUpdated}`);
       console.log(`  Priority files: ${db.priorityQueue.length}`);
       console.log(`  Critical gaps: ${db.criticalGaps.length}`);

       return db;
     } catch (error) {
       console.error('⚠️ No coverage database found');
       console.log('Run /test-discovery --update first');
       throw new Error('Coverage database required');
     }
   };
   ```

3. **Select target files**:

   ```typescript
   const selectTargetFiles = (db: CoverageDatabase, options: TestOptions) => {
     let targets: TestTarget[] = [];

     if (options.file) {
       // Specific file requested
       targets = [{ file: options.file, score: 100 }];
     } else {
       // Select from priority queue
       const minScore = options.priority === 'p1' ? 80 :
                        options.priority === 'p2' ? 50 : 0;

       targets = db.priorityQueue
         .filter(item => item.score >= minScore)
         .slice(0, options.count);
     }

     console.log(`🎯 Selected ${targets.length} files for testing`);
     return targets;
   };
   ```

4. **Load test helpers and patterns**:

   ```typescript
   // Load project test infrastructure
   const testHelpers = await Read('apps/web/test/test-helpers.ts');
   const testTypes = await Read('apps/web/test/test-types.d.ts');

   // Extract mock patterns
   const mockPatterns = {
     supabase: extractPattern(testHelpers, 'createMockSupabaseClient'),
     action: extractPattern(testHelpers, 'createMockAction'),
     results: extractPattern(testHelpers, 'successResult|errorResult')
   };
   ```

</inputs>

## 4. METHOD - Systematic Test Generation

<method>
**Execute** test generation workflow:

### Step 1: Initialize Progress Tracking

```typescript
const initializeTracking = (targets: TestTarget[]) => {
  const todos = targets.map((target, index) => ({
    content: `Generate tests for ${target.file}`,
    activeForm: `Generating tests for ${target.file}`,
    status: index === 0 ? 'in_progress' : 'pending'
  }));

  TodoWrite({ todos });
};
```

### Step 2: Analyze Source File

For each target file, analyze structure and paths:

```typescript
const analyzeSourceFile = async (filePath: string) => {
  const content = await Read(filePath);

  // Extract function signatures
  const functions = extractFunctions(content);
  const classes = extractClasses(content);
  const exports = extractExports(content);

  // Analyze code paths
  const paths = analyzeCodePaths(content);

  // Identify dependencies
  const imports = extractImports(content);
  const externalDeps = imports.filter(isExternal);

  return {
    filePath,
    functions,
    classes,
    exports,
    paths,
    dependencies: externalDeps,
    complexity: calculateCyclomaticComplexity(content)
  };
};
```

### Step 3: Generate Test Structure

Create comprehensive test suite:

```typescript
const generateTestSuite = (analysis: FileAnalysis): string => {
  const testPath = analysis.filePath.replace(/\.tsx?$/, '.test.ts');

  let testContent = `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
`;

  // Add test helper imports
  testContent += `import {
  castActionResult,
  expectSuccess,
  expectError,
  createMockSupabaseClient,
  createMockAction
} from '@/test/test-helpers';
import type { ActionResult } from '@/test/test-types';
`;

  // Import the module under test
  const moduleName = path.basename(analysis.filePath, path.extname(analysis.filePath));
  testContent += `import { ${analysis.exports.join(', ')} } from './${moduleName}';
`;

  // Mock external dependencies
  analysis.dependencies.forEach(dep => {
    testContent += generateMock(dep);
  });

  // Generate describe blocks
  analysis.functions.forEach(func => {
    testContent += generateFunctionTests(func, analysis.paths);
  });

  analysis.classes.forEach(cls => {
    testContent += generateClassTests(cls, analysis.paths);
  });

  return testContent;
};
```

### Step 4: Generate Individual Tests

Create tests for each code path:

```typescript
const generateFunctionTests = (func: FunctionInfo, paths: CodePath[]): string => {
  let tests = `
describe('${func.name}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
`;

  // Schema validation tests
  if (func.hasSchema) {
    tests += generateSchemaTests(func);
  }

  // Happy path tests
  tests += `
  describe('Core Functionality', () => {
    it('should ${describeFunction(func)} with valid input', async () => {
      // Arrange
      const input = ${generateValidInput(func)};
      ${generateMockSetup(func)}

      // Act
      const result = ${func.isAsync ? 'await ' : ''}${func.name}(input);

      // Assert
      ${generateAssertions(func, 'success')}
    });
  });
`;

  // Edge cases
  tests += `
  describe('Edge Cases', () => {
    it('should handle null input gracefully', async () => {
      // Arrange & Act & Assert
      ${func.throws ?
        `await expect(${func.name}(null)).rejects.toThrow();` :
        `const result = await ${func.name}(null);
      expect(result).toEqual(${generateNullResponse(func)});`}
    });

    it('should handle empty input', async () => {
      const result = await ${func.name}(${generateEmptyInput(func)});
      expect(result).toBeDefined();
    });
  });
`;

  // Error scenarios
  tests += `
  describe('Error Scenarios', () => {
    it('should handle service failures', async () => {
      // Arrange
      ${generateFailureMock(func)}

      // Act
      const result = await ${func.name}(${generateValidInput(func)});

      // Assert
      ${func.returnsActionResult ?
        `expect(expectError(result)).toContain('error');` :
        `expect(result).toBeNull();`}
    });
  });
`;

  tests += '});\n';
  return tests;
};
```

### Step 5: Generate Mock Implementations

Use project patterns for mocks:

```typescript
const generateMock = (dependency: string): string => {
  // Use project's mock patterns
  if (dependency.includes('supabase')) {
    return `
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}));
`;
  }

  if (dependency.includes('@kit/next/actions')) {
    return `
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: 'Validation failed' };
        }
      }
      const mockUser = { id: 'test-123', email: 'test@example.com' };
      return fn(result.data, mockUser);
    };
  }),
}));
`;
  }

  // Generic mock
  return `vi.mock('${dependency}');\n`;
};
```

### Step 6: Complex Case Delegation

Delegate complex scenarios to testing-expert:

```typescript
const handleComplexCase = async (analysis: FileAnalysis) => {
  if (analysis.complexity > 10 || analysis.hasAsyncGenerators) {
    console.log('🤖 Delegating to testing-expert for complex case...');

    await Task({
      subagent_type: 'testing-expert',
      description: 'Generate complex async tests',
      prompt: `
        Generate comprehensive tests for complex file:
        File: ${analysis.filePath}
        Complexity: ${analysis.complexity}
        Special patterns: ${analysis.specialPatterns.join(', ')}

        Requirements:
        - Handle all async patterns
        - Test error boundaries
        - Cover race conditions
        - Use project test helpers
      `
    });
  }
};
```

### Step 7: Write Test Files

Save generated tests:

```typescript
const writeTestFile = async (testPath: string, content: string) => {
  // Ensure TypeScript compilation
  const formattedContent = await formatTypeScript(content);

  await Write(testPath, formattedContent);

  console.log(`✅ Test file created: ${testPath}`);
};
```

### Step 8: Verify Test Execution

Run tests to ensure they pass:

```typescript
const verifyTests = async (testFiles: string[]) => {
  console.log('🧪 Running generated tests...');

  const testCommand = `pnpm vitest run ${testFiles.join(' ')} --coverage`;
  const result = await Bash(testCommand);

  if (result.exitCode === 0) {
    console.log('✅ All tests passing!');

    // Extract coverage metrics
    const coverage = extractCoverage(result.stdout);
    console.log(`📊 Coverage achieved: ${coverage}%`);
  } else {
    console.error('❌ Some tests failed');
    console.log(result.stderr);
  }

  return result.exitCode === 0;
};
```

### Step 9: Update Coverage Database

If requested, update the database:

```typescript
const updateCoverageDatabase = async (testedFiles: string[]) => {
  const db = await loadCoverageDatabase();

  // Remove tested files from priority queue
  db.priorityQueue = db.priorityQueue.filter(
    item => !testedFiles.includes(item.file)
  );

  // Update timestamp
  db.lastUpdated = new Date().toISOString();

  // Add test generation history
  db.history = db.history || [];
  db.history.push({
    timestamp: new Date().toISOString(),
    filesGenerated: testedFiles.length,
    files: testedFiles
  });

  await Write(DB_PATH, JSON.stringify(db, null, 2));
  console.log('💾 Coverage database updated');
};
```

</method>

## 5. EXPECTATIONS - Validate & Deliver Results

<expectations>
**Validate** generated tests and report outcomes:

### Output Specification

Generated test files should:

- Be placed next to source files with `.test.ts` extension
- Import from project test helpers
- Use TypeScript with full type safety
- Follow AAA pattern
- Include comprehensive assertions

### Validation Checks

```typescript
const validateGeneratedTests = async (testFiles: string[]) => {
  const validationResults = {
    typecheck: false,
    linting: false,
    execution: false,
    coverage: 0
  };

  // TypeScript compilation
  const typecheckResult = await Bash('pnpm typecheck');
  validationResults.typecheck = typecheckResult.exitCode === 0;

  // Linting
  const lintResult = await Bash('pnpm lint');
  validationResults.linting = lintResult.exitCode === 0;

  // Test execution
  const testResult = await Bash(`pnpm vitest run ${testFiles.join(' ')} --coverage`);
  validationResults.execution = testResult.exitCode === 0;

  // Coverage extraction
  validationResults.coverage = extractCoverage(testResult.stdout);

  return validationResults;
};
```

### Success Reporting

```typescript
const reportSuccess = (results: TestGenerationResults) => {
  console.log(`
✅ **Unit Test Generation Complete**

📊 Results Summary:
- Files tested: ${results.filesGenerated}
- Tests created: ${results.totalTests}
- Test cases: ${results.totalCases}
- Coverage achieved: ${results.coverage}%
- All tests passing: ${results.allPassing ? '✅' : '❌'}

📁 Generated Files:
${results.testFiles.map(f => `  - ${f}`).join('\n')}

🎯 Coverage Breakdown:
- Statements: ${results.statements}%
- Branches: ${results.branches}%
- Functions: ${results.functions}%
- Lines: ${results.lines}%

${results.coverage >= 100 ? '🏆 100% COVERAGE ACHIEVED!' :
  results.coverage >= 70 ? '✅ Met project threshold (70%)' :
  '⚠️ Below project threshold (70%)'}

Next steps:
${results.coverage < 100 ? '- Run with --count=10 for more coverage' : ''}
${results.criticalGaps > 0 ? '- Address critical gaps with --priority=p1' : ''}
${results.needsUpdate ? '- Update database with --update flag' : ''}
  `);
};
```

### Error Handling

```typescript
const handleErrors = (error: Error, context: any) => {
  console.error('❌ Test generation failed:', error.message);

  // Specific error recovery
  if (error.message.includes('Coverage database')) {
    console.log('💡 Run: /test-discovery --update');
  } else if (error.message.includes('TypeScript')) {
    console.log('💡 Fix type errors and retry');
  } else if (error.message.includes('Import')) {
    console.log('💡 Check import paths and aliases');
  }

  // Cleanup partial files if needed
  if (context.partialFiles) {
    console.log('🧹 Cleaning up partial files...');
    // Remove incomplete test files
  }
};
```

</expectations>

## Dynamic Context Loading

<context_loading>
When additional context needed:

```typescript
const loadDynamicContext = async (fileType: string) => {
  const contextResult = await Task({
    subagent_type: 'context-discovery-expert',
    description: 'Load testing context',
    prompt: `
      Find relevant context for unit testing:
      File type: ${fileType}
      Command: unit-test-writer
      Token budget: 4000
      Focus: vitest patterns, mock strategies, ${fileType} testing
    `
  });

  // Execute returned Read commands
  for (const readCmd of contextResult.readCommands) {
    await Read(readCmd.path);
  }
};
```

</context_loading>

## Agent Delegation

<delegation>
Complex scenarios requiring specialized expertise:
```typescript
const delegateToExpert = async (scenario: string, context: any) => {
  const scenarios = {
    'complex-async': 'testing-expert',
    'react-hooks': 'react-expert',
    'database': 'database-expert',
    'typescript': 'typescript-expert'
  };

  const agent = scenarios[scenario] || 'testing-expert';

  await Task({
    subagent_type: agent,
    description: `Handle ${scenario} testing`,
    prompt: `Generate tests for ${scenario}: ${JSON.stringify(context)}`
  });
};

```
</delegation>

## Error Handling
<error_handling>
### Common Issues
1. **No coverage database**: Run `/test-discovery --update` first
2. **Type errors**: Fix source TypeScript errors before testing
3. **Import failures**: Check path aliases in vitest.config.ts
4. **Mock conflicts**: Clear mocks between tests

### Recovery Procedures
```typescript
// Automatic recovery attempts
const recoverFromError = async (error: Error) => {
  if (error.message.includes('database')) {
    console.log('📊 Running test discovery...');
    await Bash('node .claude/commands/test-discovery.js --update');
    return true;
  }

  if (error.message.includes('import')) {
    console.log('🔧 Checking vitest config...');
    const config = await Read('vitest.config.ts');
    // Validate and fix if possible
  }

  return false;
};
```

</error_handling>
</instructions>

<patterns>
### Testing Patterns
- **AAA Pattern**: Arrange-Act-Assert for clarity
- **Factory Functions**: Reusable test data creation
- **Mock Isolation**: Clear mocks between tests
- **Type Safety**: No `any` types in tests
- **Project Helpers**: Use existing test utilities

### Anti-Patterns to Avoid

- Testing implementation details
- Hardcoded test values
- Skipping error scenarios
- Ignoring TypeScript errors
- Creating redundant mocks
</patterns>

<help>
🧪 **Vitest Unit Test Writer**

Generate comprehensive unit tests from prioritized coverage gaps with 100% coverage target.

**Usage:**

- `/testwriters:unit-test-writer` - Test top 5 priority files
- `/testwriters:unit-test-writer --count=10` - Test 10 files
- `/testwriters:unit-test-writer --file=path/to/file.ts` - Test specific file
- `/testwriters:unit-test-writer --priority=p2` - Test P2 priority files
- `/testwriters:unit-test-writer --update` - Update database after

**Process:**

1. Load coverage database from test-discovery
2. Select highest priority untested files
3. Analyze code paths and complexity
4. Generate comprehensive test suites
5. Verify tests pass and meet coverage

**Features:**

- Priority-based file selection
- TypeScript type safety
- Project test helper integration
- Coverage tracking
- Agent delegation for complex cases

Your path to 100% test coverage!
</help>
