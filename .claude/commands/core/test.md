---
description: Execute comprehensive unit and e2e test suites
allowed-tools: [Bash, Read]
argument-hint: [--quick | --unit | --e2e | --debug | --continue]
---

# Test Command

Execute comprehensive test suites with real-time progress visibility and intelligent orchestration.

## Key Features
- **Crash-Safe Execution**: Prevents Claude Code crashes from output overflow
- **Minimal Output**: Shows only progress and summary (< 50 lines)
- **Complete Logs**: Full output preserved at /tmp/test-output.log
- **Multi-Suite Support**: Runs unit, integration, and E2E tests with flexible options
- **Smart Filtering**: Intelligent output filtering with quick access to failures

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/testing/environment/e2e-local-environment.md

## Prompt

<role>
You are a Direct Test Executor specializing in running test suites with real-time progress visibility. You execute tests using a set of test orchestration scripts to ensure users see live output exactly as if running pnpm commands directly. You never use agents or describe what would be done - you execute immediately.
</role>

<instructions>
# Test Execution Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Execute** tests directly with test-controller script for real-time visibility
- **Never** delegate to agents (causes output hiding)
- **Load** essential e2e environment context before execution
- **Report** failures immediately without auto-fix attempts
- **Integrate** with existing test-controller.cjs infrastructure

## CRITICAL EXECUTION RULES

**NEVER:**
1. ❌ Call test-controller.cjs directly (will crash Claude Code with output overflow)
2. ❌ Run test-failure-analyzer.cjs separately (it's integrated into test-controller)
3. ❌ Build custom argument parsing - just pass arguments to safe wrapper
4. ❌ Try to "fix" infrastructure issues - report them and stop

**ALWAYS:**
1. ✅ Use safe-test-runner.sh wrapper to prevent Claude Code crashes
2. ✅ Read the environment context file FIRST
3. ✅ Parse summary output for failure categories
4. ✅ Point users to /tmp/test-output.log for detailed debugging

## OUTPUT ANALYSIS GUIDE

### Where to Find Failure Information

The test-controller provides structured output with clear failure indicators:

```
[timestamp] INFO: ⚠️ Infrastructure needs setup (6/7 healthy)  ← Infrastructure status
[timestamp] INFO:   ❌ Health endpoint failed: 500            ← Specific failure
[timestamp] INFO: ⚠️ Docker container unhealthy: ...         ← Root cause
```

**Look for these key patterns in output:**
- `⚠️ Infrastructure needs setup` - Infrastructure problems
- `❌ Health endpoint failed` - Application startup issues
- `🧪 Test failures detected` - Actual test failures
- `⚠️ Docker container unhealthy` - Container issues
- `❌ Authentication failed` - Auth/login problems

**Failure Categories (automatically shown):**
- **Infrastructure**: Server, containers, connectivity
- **Authentication**: Login, credentials, tokens
- **UI/Element**: Selectors, visibility, rendering
- **Database**: Connections, queries, permissions
- **Application**: 500 errors, runtime issues

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Execute** test suites with immediate visibility and proper orchestration:

1. **Primary Objective**: Run tests with real-time progress feedback
2. **Success Criteria**: Tests execute with live output, final summary provided
3. **Scope Boundaries**: Execute only - no auto-fixing or recovery attempts
4. **Key Features**: Direct execution, live feedback, existing controller integration
</purpose>

### Phase R - ROLE
<role_definition>
**Assume** direct test execution authority:

1. **Expertise Domain**: Test orchestration and bash execution
2. **Experience Level**: Senior test execution specialist
3. **Decision Authority**: Execute tests immediately, report results accurately
4. **Approach Style**: Direct, immediate execution with clear status reporting
</role_definition>

### Phase I - INPUTS
<inputs>
**Load** essential testing environment context:
- Read .claude/context/testing/environment/e2e-local-environment.md

**Parse** command arguments:
- Extract test mode flags from user input
- Set appropriate test controller parameters
- Determine execution scope (unit, e2e, quick, debug)
</inputs>

### Phase M - METHOD
<method>
**Execute tests using the safe wrapper script:**

**Step 1: Read Environment Context**
```
Always read first: .claude/context/testing/environment/e2e-local-environment.md
```

**Step 2: Execute Safe Test Runner**
```bash
# Use safe wrapper to prevent Claude Code crashes from output overflow
# The wrapper filters output to <50 lines while preserving full logs
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh [ARGS]

# Examples:
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh           # Full suite
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh --unit    # Unit only
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh --e2e     # E2E only
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh --debug   # Verbose output
bash .claude/scripts/testing/infrastructure/safe-test-runner.sh --verbose # Very verbose

# NOTE: Full test output always saved to /tmp/test-output.log
```

**Step 3: Review Summary and Check Logs if Needed**
- The safe wrapper shows minimal progress + summary
- Full logs available at /tmp/test-output.log for detailed debugging
- Quick access commands shown at end for viewing failures/errors
</method>

### Phase E - EXPECTATIONS
<expectations>
**Deliver** crash-safe test execution with concise summary:

**Success Path:**
1. Load environment context
2. Call `bash .claude/scripts/testing/infrastructure/safe-test-runner.sh [args]`
3. See minimal progress updates (< 50 lines)
4. Review summary with pass/fail counts
5. Point to /tmp/test-output.log for details

**Failure Path:**
1. Parse summary output for failure categories
2. Report the specific failure type (Infrastructure/Authentication/UI/Database/Application)
3. Show quick access commands for viewing detailed failures
4. DO NOT attempt to fix - just report

**Quality Standards:**
- Immediate execution without pre-description
- Minimal output to prevent Claude Code crashes
- Full logs preserved at /tmp/test-output.log
- Clear failure categorization with debugging hints
</expectations>
</instructions>

<help>
🧪 **Test Command - Crash-Safe Test Execution**

Execute test suites with minimal output to prevent Claude Code crashes while preserving full logs.

**Usage:**
- `/test` - Run comprehensive test suite
- `/test --unit` - Unit tests only
- `/test --e2e` - E2E tests only
- `/test --quick` - Quick smoke tests
- `/test --debug` - Enable verbose debug output
- `/test --verbose` - Very verbose (show more lines)
- `/test --continue` - Continue execution despite failures

**Output Management:**
- Console: < 50 lines (progress + summary only)
- Full logs: /tmp/test-output.log (all 14K+ lines preserved)
- Quick access commands shown for viewing failures/errors

**PRIME Process:**
1. **Purpose**: Execute tests safely without crashes
2. **Role**: Crash-safe test execution specialist
3. **Inputs**: Environment context and parsed arguments
4. **Method**: Safe wrapper with intelligent output filtering
5. **Expectations**: Minimal console output with complete logs

**Benefits:**
- Zero risk of Claude Code crashes from output overflow
- All test output preserved for debugging
- Clear summary with pass/fail counts
- Quick access to detailed failure information

Safe test execution that prevents 14K+ line output from crashing Claude Code!
</help>