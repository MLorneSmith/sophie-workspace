---
description: Execute comprehensive unit and e2e test suites
allowed-tools: [Bash, Read]
argument-hint: [--quick | --unit | --e2e | --debug | --continue]
---

# Test Command

Execute comprehensive test suites with real-time progress visibility and intelligent orchestration.

## Key Features
- **Real-Time Execution**: Direct bash execution with live progress visibility
- **Intelligent Orchestration**: Uses existing test-controller.cjs for organized execution
- **Multi-Suite Support**: Runs unit, integration, and E2E tests with flexible options
- **No Agent Buffering**: Direct tool usage prevents output hiding and confusion
- **Immediate Feedback**: See test results as they happen, with final summary

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
1. ❌ Wrap test-controller.cjs in custom bash logic or complex scripts
2. ❌ Run test-failure-analyzer.cjs separately (it's integrated into test-controller)
3. ❌ Build custom argument parsing - just pass arguments directly
4. ❌ Try to "fix" infrastructure issues - report them and stop

**ALWAYS:**
1. ✅ Call test-controller.cjs directly with simple `node` command
2. ✅ Read the environment context file FIRST
3. ✅ Parse test-controller output for failure categories
4. ✅ Suggest debugging steps based on the failure type shown

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
**Execute tests using the test-controller directly:**

**Step 1: Read Environment Context**
```
Always read first: .claude/context/testing/environment/e2e-local-environment.md
```

**Step 2: Execute Test Controller Directly**
```bash
# Simple execution - let test-controller handle ALL complexity
node .claude/scripts/testing/infrastructure/test-controller.cjs [ARGS]

# Examples:
node .claude/scripts/testing/infrastructure/test-controller.cjs           # Full suite
node .claude/scripts/testing/infrastructure/test-controller.cjs --unit    # Unit only
node .claude/scripts/testing/infrastructure/test-controller.cjs --e2e     # E2E only
node .claude/scripts/testing/infrastructure/test-controller.cjs --debug   # Verbose

# With debug environment variable if needed
DEBUG_TEST=true node .claude/scripts/testing/infrastructure/test-controller.cjs --debug
```

**Step 3: Let Controller Output Guide Next Steps**
- The test-controller automatically categorizes failures
- DO NOT run separate failure analyzers
- Simply report what the controller shows
</method>

### Phase E - EXPECTATIONS
<expectations>
**Deliver** real-time test execution with final summary:

**Success Path:**
1. Load environment context
2. Call `node .claude/scripts/testing/infrastructure/test-controller.cjs [args]`
3. Let it run with live output
4. Report final status

**Failure Path:**
1. Parse test-controller output for failure categories
2. Report the specific failure type (Infrastructure/Authentication/UI/Database/Application)
3. Suggest debugging options based on failure category
4. DO NOT attempt to fix - just report

**Quality Standards:**
- Immediate execution without pre-description
- Direct output visibility
- Clear failure categorization
</expectations>
</instructions>

<help>
🧪 **Test Command - Real-Time Test Execution**

Execute test suites with immediate progress visibility and organized orchestration.

**Usage:**
- `/test` - Run comprehensive test suite
- `/test --unit` - Unit tests only
- `/test --e2e` - E2E tests only
- `/test --quick` - Quick smoke tests
- `/test --debug` - Enable verbose debug output
- `/test --continue` - Continue execution despite failures

**PRIME Process:**
1. **Purpose**: Execute tests with live feedback
2. **Role**: Direct test execution specialist
3. **Inputs**: Environment context and parsed arguments
4. **Method**: Direct bash execution with controller integration
5. **Expectations**: Real-time output with final summary

**Requirements:**
- Uses existing .claude/scripts/testing/infrastructure/test-controller.cjs
- Loads unified E2E environment configuration
- No agent delegation (preserves output visibility)

Experience immediate test feedback exactly like running pnpm commands directly!
</help>