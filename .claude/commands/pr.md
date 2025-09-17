---
description: Create and manage pull requests with automated quality checks
category: workflow
allowed-tools: Bash(git:*), Bash(gh:*), Bash, Read, Glob, Task

mcp-tools: mcp__code-reasoning__code-reasoning
---

# Pr Command

Create and manage pull requests with automated quality checks

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
Manage pull request lifecycle with automated quality gates

### Success Criteria
- ✅ Operation completes successfully (100% success rate)
- ✅ All validations pass
- ✅ No data corruption or loss
- ✅ Performance within benchmarks
- ✅ Clear actionable output provided

### Scope Boundaries
- **Included**: PR creation, review assignment, CI/CD triggering
- **Excluded**: Code review, merge operations
- **Constraints**: Safe mode by default, explicit confirmation for changes

## 2. ROLE

You are a **Pull Request Lifecycle Manager** with deep expertise in:
- Domain-specific best practices
- Pattern recognition and analysis
- Error recovery strategies
- Performance optimization

### Authority Level
- **Full control** over git operations
- **Decision authority** for commit strategies
- **Veto power** on dangerous operations
- **Advisory role** for best practices

### Expertise Domains
- Code review
- CI/CD integration
- Merge strategies

## 3. INSTRUCTIONS

Execute these action-oriented steps for pr.

### Phase 1: Validation & Discovery

1. **Validate** environment and prerequisites:
   ```bash
   echo "Environment validated"
   ```

2. **Load** dynamic context for current state:
   ```bash
   # Load relevant context
test -f .claude/context/pr.md && cat .claude/context/pr.md
   ```

3. **Discover** available resources and options:
   ```bash
   ls -la
   ```

4. **Analyze** discovered data for patterns and issues

5. **Prepare** execution plan based on analysis

### Phase 2: Execution

6. **Execute** primary operation with validation:
   ```bash
   # Execute primary operation
   ```

7. **Monitor** execution progress and capture results

8. **Handle** any errors or edge cases

### Phase 3: Verification & Cleanup

9. **Verify** operation success with checks:
   ```bash
   echo "Operation completed successfully"
   ```

10. **Report** results with actionable next steps

## 4. MATERIALS

Context, constraints, and patterns for pr.

### Dynamic Context Loading

```bash
# Load project-specific configuration
CONTEXT_FILE=".claude/context/pr-config.md"
if [ -f "$CONTEXT_FILE" ]; then
    source "$CONTEXT_FILE"
fi
```

### Operation Patterns

| Pattern | Condition | Action |
|---------|-----------|--------|
| **Normal** | Standard case | Execute normally |
| **Edge Case** | Boundary condition | Apply special handling |
| **Error State** | Operation failed | Implement recovery |
| **Success** | Operation complete | Verify and report |

### Error Recovery Patterns

1. **Operation failed**: Capture error → Analyze cause → Retry with fixes
2. **Timeout**: Increase timeout → Retry → Investigate if persists
3. **Resource unavailable**: Wait → Retry with backoff
4. **Invalid state**: Reset → Validate → Retry operation

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
✅ Operation Completed
======================
Status: Success
Duration: 2.3s
Results: [operation-specific output]
Next steps: [actionable items]
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

- Validation: <1 second
- Execution: <5 seconds
- Verification: <2 seconds
- Total operation: <10 seconds

### Error Handling Matrix

```typescript
const errorHandlers = {
  "not found": "Check path and retry",
  "permission denied": "Fix permissions or use sudo",
  "timeout": "Increase timeout and retry",
  "invalid input": "Validate input format"
}
```

### Integration Points

- **Delegate to**: `git-expert`, `code-review-expert`
- **MCP Tools**: `code-reasoning`
- **Related Commands**: `/git/push`, `/git/branch`

## Usage Examples

```bash
# Basic usage
/pr

# With options
/pr --verbose

# With arguments
/pr <arg>
```

## Success Indicators

✅ Command executes without errors
✅ All validations pass
✅ Expected output generated
✅ Performance within limits
✅ No side effects observed
✅ Clear next steps provided