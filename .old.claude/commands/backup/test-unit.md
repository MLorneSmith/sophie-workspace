---
name: test-unit
description: Direct access to unit-test-agent for running unit tests only
usage: /test-unit [options]
options:
  - coverage: Include coverage reporting
  - watch: Run in watch mode
  - workspace: Run tests for specific workspace only
  - debug: Enable debug mode with verbose output
---

# Test Unit Command

Direct invocation of the unit-test-agent for running unit tests across all workspaces without the orchestrator overhead.

## Usage

```bash
/test-unit                    # Run all unit tests
/test-unit --coverage        # Run with coverage reporting
/test-unit --watch          # Run in watch mode (development)
/test-unit --workspace web  # Run tests for specific workspace
/test-unit --debug          # Enable debug mode with verbose output
```

## Direct Agent Invocation

This command bypasses the test-orchestrator and directly invokes the unit-test-agent for faster, focused unit test execution.

### Task Definition

```yaml
task:
  subagent_type: "unit-test-agent"
  description: "Execute unit tests directly"
  prompt: |
    Execute unit tests with the following configuration:
    
    1. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Kill any existing vitest processes: pkill -f vitest || true
       - Check for DEBUG_TEST environment variable
    
    2. **Execution Options**
       - Default: Run all workspaces with pnpm test:unit
       - Coverage: Use pnpm test:coverage if --coverage specified
       - Watch: Use pnpm vitest watch if --watch specified
       - Workspace: Use pnpm --filter {workspace} test if --workspace specified
       - Debug: Enable verbose output and timing if --debug or DEBUG_TEST=true
    
    3. **Progress Tracking**
       - Use TodoWrite to track workspace-level progress
       - Update in real-time as each workspace completes
       - Show test counts and timing per workspace
    
    4. **Output Requirements**
       - Total tests run, passed, failed
       - Duration per workspace and total
       - Coverage metrics if --coverage
       - Clear failure details with file:line references
    
    5. **Success Criteria**
       - Complete within 3 minutes
       - Clear pass/fail statistics
       - No hanging processes
       
    Return structured results with actionable feedback.
```

## Benefits

- **Faster Feedback**: Skip orchestrator overhead for quick unit test runs
- **Development Mode**: Support for watch mode during development
- **Focused Testing**: Target specific workspaces
- **Direct Control**: More granular control over test execution

## Examples

### Run all unit tests quickly

```bash
/test-unit
```

### Run with coverage for CI

```bash
/test-unit --coverage
```

### Development mode for specific workspace

```bash
/test-unit --workspace web --watch
```

### Debug failing tests

```bash
/test-unit --debug
```

## Expected Output

```
🧪 Unit Test Results (Direct Execution)
=====================================
✅ Web: 45/45 tests passed (38s)
✅ Payload: 8/8 tests passed (12s)
✅ Packages: 12/12 tests passed (15s)

📊 Total: 65/65 tests passed
⏱️  Duration: 1m 5s (3x faster than full suite)
📈 Coverage: 78.5% statements, 72.3% branches
```

## Notes

- Bypasses test-orchestrator for speed
- Best for rapid development feedback
- Use `/test` for comprehensive testing with E2E
- Automatically uses Turbo for parallel execution
