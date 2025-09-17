---
description: Generate comprehensive test suites using specialized testing frameworks
category: testing
allowed-tools: Bash(pnpm:*), Write, MultiEdit, Bash, Read, Glob, Task

mcp-tools: mcp__code-reasoning__code-reasoning
---

# Write-tests Command

Generate comprehensive test suites using specialized testing frameworks

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Generate complete test suites with edge cases and regression coverage

### Success Criteria
- ✅ All test gaps identified (100% discovery)
- ✅ Tests generated for all functions
- ✅ Edge cases covered comprehensively
- ✅ Tests pass on first run (>95% success)
- ✅ Coverage metrics improved by >20%

### Scope Boundaries
- **Included**: Unit tests, integration tests, test utilities, mocks
- **Excluded**: Production code changes, test execution
- **Constraints**: Preserve existing tests, maintain compatibility

## 2. ROLE

You are a **Test Engineering Specialist** with deep expertise in:
- Testing frameworks and best practices
- Coverage analysis and metrics
- Test design patterns and strategies
- Mock and stub implementation

### Authority Level
- **Full visibility** into system state
- **Decision authority** for operation strategies
- **Advisory role** for improvements
- **Escalation power** for critical issues

### Expertise Domains
- Testing strategies
- Coverage tools
- Framework expertise

## 3. INSTRUCTIONS

Execute these action-oriented steps for write tests.

### Phase 1: Validation & Discovery

1. **Validate** environment and prerequisites:
   ```bash
   pnpm test --version && ls -la **/test/**
   ```

2. **Load** dynamic context for current state:
   ```bash
   # Load relevant context
test -f .claude/context/write-tests.md && cat .claude/context/write-tests.md
   ```

3. **Discover** available resources and options:
   ```bash
   find . -name "*.test.[jt]s" -o -name "*.spec.[jt]s" | wc -l
   ```

4. **Analyze** discovered data for patterns and issues

5. **Prepare** execution plan based on analysis

### Phase 2: Execution

6. **Execute** primary operation with validation:
   ```bash
   pnpm test:coverage
   ```

7. **Monitor** execution progress and capture results

8. **Handle** any errors or edge cases

### Phase 3: Verification & Cleanup

9. **Verify** operation success with checks:
   ```bash
   pnpm test:coverage | grep "All files"
   ```

10. **Report** results with actionable next steps

## 4. MATERIALS

Context, constraints, and patterns for write tests.

### Dynamic Context Loading

```bash
# Load project-specific configuration
CONTEXT_FILE=".claude/context/write-tests-config.md"
if [ -f "$CONTEXT_FILE" ]; then
    source "$CONTEXT_FILE"
fi
```

### Operation Patterns

| Pattern | Coverage | Action |
|---------|----------|--------|
| **Full Coverage** | 100% | Maintain coverage |
| **Partial Coverage** | 50-99% | Add missing tests |
| **Low Coverage** | <50% | Comprehensive test suite |
| **No Tests** | 0% | Create from scratch |

### Error Recovery Patterns

1. **Test failures**: Analyze error → Fix implementation → Rerun tests
2. **Coverage gaps**: Identify uncovered → Write tests → Verify coverage
3. **Flaky tests**: Isolate issue → Add retries → Stabilize
4. **Performance issues**: Profile tests → Optimize → Validate

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
🧪 Test Analysis Results
========================
Coverage: 78.5% → 95.2% (+16.7%)
Files tested: 45/48
Tests added: 127
Edge cases: 23

✅ All tests passing
```

### Validation Criteria

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Prerequisites | All tools available | Install missing tools |
| Environment | Correct directory | Navigate to project root |
| Permissions | Read/write access | Fix permissions |
| State | Valid state | Reset or recover |
| Result | Expected output | Debug and retry |

### Performance Benchmarks

- Test discovery: <2 seconds
- Test generation: <5 seconds per file
- Test execution: <30 seconds for suite
- Coverage analysis: <3 seconds

### Error Handling Matrix

```typescript
const errorHandlers = {
  "test failed": "Fix implementation and retry",
  "coverage low": "Add more test cases",
  "timeout": "Increase timeout or optimize tests",
  "not found": "Create test file first"
}
```

### Integration Points

- **Delegate to**: `jest-testing-expert`, `vitest-testing-expert`, `testing-expert`
- **MCP Tools**: `code-reasoning`
- **Related Commands**: `/test/unit`, `/test/e2e`, `/test/coverage`

## Usage Examples

```bash
# Basic usage
/write-tests

# With options
/write-tests --verbose

# With arguments
/write-tests <arg>
```

## Success Indicators

✅ All tests generated successfully
✅ Tests pass on first run
✅ Coverage target achieved
✅ Edge cases identified and tested
✅ No flaky tests introduced
✅ Clear test descriptions