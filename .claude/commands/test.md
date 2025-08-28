---
name: test
description: Execute tests using deterministic script-based orchestration (no LLM agents)
usage: /test [options]
options:
  - all: Run all tests (unit + E2E) in parallel (default)
  - unit: Run only unit tests
  - e2e: Run only E2E tests
  - debug: Enable debug mode with verbose output
  - continue: Continue running even if tests fail
---

# Test Command (Deterministic Version)

Executes comprehensive test suites using deterministic bash/Node.js scripts for predictable, fast execution without LLM intervention.

## Quick Start

The `/test` command now uses a script-based approach:

```bash
# Run all tests (default)
/test

# Run only unit tests
/test --unit

# Run only E2E tests  
/test --e2e

# Enable debug mode
/test --debug

# Continue on failures
/test --continue
```

## Architecture

### Script-Based Execution
```
/test command
    ↓
test-runner.sh (simple bash wrapper)
    ↓
test-controller.js (Node.js orchestrator)
    ├── InfrastructureChecker - validates environment
    ├── UnitTestRunner - runs unit tests with JSON parsing
    ├── E2ETestRunner - coordinates 9 parallel shards
    └── TestStatus - tracks progress and generates reports
```

### Key Components

1. **test-runner.sh** - Simple bash wrapper that parses arguments
2. **test-controller.js** - Main Node.js orchestrator with:
   - Deterministic execution flow
   - Structured JSON output parsing
   - Parallel shard coordination
   - Automatic infrastructure recovery

## Execution Flow

### Phase 1: Infrastructure Validation
```yaml
checks:
  - Supabase E2E status (auto-start if needed)
  - Port availability (auto-cleanup)
  - Environment files (auto-create from example)
recovery: automatic
timeout: 2 minutes
```

### Phase 2: Unit Tests
```yaml
executor: pnpm test:unit
parallelization: Turbo (workspace-level)
output_parsing: JSON/regex patterns
timeout: 5 minutes
expected: ~245 tests across 21 workspaces
```

### Phase 3: E2E Tests
```yaml
executor: 9 parallel shards (individual Bash commands)
execution_method: |
  Each shard runs as separate Bash tool call with:
  - run_in_background: true
  - timeout: 600000 (10 minutes)
  - BashOutput polling for completion
commands:
  - pnpm --filter web-e2e test:shard1  # 13 tests
  - pnpm --filter web-e2e test:shard2  # 10 tests  
  - pnpm --filter web-e2e test:shard3  # 9 tests
  - pnpm --filter web-e2e test:shard4  # 9 tests
  - pnpm --filter web-e2e test:shard5  # 6 tests
  - pnpm --filter web-e2e test:shard6  # 6 tests
  - pnpm --filter web-e2e test:shard7  # 8 tests
  - pnpm --filter web-e2e test:shard8  # 3 tests
  - pnpm --filter web-e2e test:shard9  # 2 tests
timeout: 10 minutes per shard (vs 2 minute bash timeout)
total_expected: 66 E2E tests
timeout_fix: "Individual Bash commands avoid 2-minute bash session limits"
```

### Phase 4: Result Aggregation
```yaml
output:
  - Infrastructure status
  - Unit test results (pass/fail/skip counts)
  - E2E shard results (detailed breakdown)
  - Overall summary with success rate
  - Fix suggestions for failures
files:
  status: /tmp/.claude_test_status_*
  results: /tmp/.claude_test_results.json
```

## Implementation

When the `/test` command is invoked, use the Task tool to execute tests via the test-orchestrator agent:

```yaml
task:
  subagent_type: "test-orchestrator"
  description: "Execute comprehensive test suite"
  prompt: |
    Execute comprehensive testing based on the user's options:
    
    Options from user request:
    - --unit: Run only unit tests
    - --e2e: Run only E2E tests  
    - --all: Run both (default)
    - --debug: Enable debug mode with verbose output (sets DEBUG_TEST=true)
    - --continue: Continue on failures
    
    IMPORTANT: If --debug is specified, set DEBUG_TEST=true environment variable
    
    Follow your test execution protocol:
    1. Initialize and perform pre-flight checks
    2. If unit tests requested: Delegate to unit-test-agent
    3. If E2E tests requested: Delegate to e2e-parallel-agent (with timeout fixes)
    4. Aggregate results and provide comprehensive report
    5. Update TodoWrite throughout execution
    
    CRITICAL TIMEOUT FIXES IMPLEMENTED:
    - E2E shards run as individual Bash commands (not bash loops)
    - Each shard: run_in_background=true, timeout=600000 (10min)
    - BashOutput polling replaces wait loops
    - Native OpenTelemetry logging via hooks (no custom TypeScript logging)
    
    Execute tests according to the options provided.
```

## Native Logging with OpenTelemetry + Hooks

**REPLACED COMPLEX CUSTOM SYSTEM**: The previous TypeScript-based logging system has been replaced with Claude Code's native capabilities:

### What Was Removed
- ❌ `.claude/utils/agent-logger.ts` (580 lines of custom logging)
- ❌ `.claude/utils/agent-task-logger.ts` (complex Task tool wrapping)  
- ❌ `.claude/utils/agent-execution-wrapper.ts` (execution tracking)
- ❌ `.claude/utils/agent-log-viewer.ts` (custom log analysis)
- ❌ TypeScript initialization complexity that failed to work

### What Was Added
- ✅ `.claude/hooks/post-tool-use.py` (simple Python hook)
- ✅ Native OpenTelemetry environment variable configuration
- ✅ Claude Code's built-in tracing and logging capabilities

### Usage
```bash
# Enable debug mode with native logging
DEBUG_TEST=true /test

# OpenTelemetry will be configured automatically via environment variables
# Task delegation logging captured via post-tool-use.py hook
# All logging flows through Claude Code's native systems
```

The script will:
1. Validate and fix infrastructure automatically
2. Run unit tests and parse output
3. Launch E2E shards in parallel
4. Aggregate results and update status
5. Generate comprehensive report
6. Exit with appropriate code (0 = success, 1 = failure)

## Status Tracking

### Real-time Updates
```javascript
// Status file format
{
  "phase": "unit_tests|e2e_tests|complete",
  "status": "running|success|failed",
  "unit": { "total": 245, "passed": 245, "failed": 0 },
  "e2e": { 
    "total": 66, 
    "passed": 65, 
    "failed": 1,
    "shards": {
      "shard_1": { "passed": 13, "failed": 0 },
      // ... other shards
    }
  }
}
```

### Statusline Integration
```bash
# Status file location
/tmp/.claude_test_status_${PROJECT_ROOT//\//_}

# Format: status|timestamp|passed|failed|total
success|1705329600|310|0|310
```

## Error Handling

### Infrastructure Failures
```javascript
const ERROR_FIXES = {
  'supabase_not_running': 'cd apps/e2e && npx supabase start',
  'port_conflict': 'pkill -f "playwright|next-server"',
  'env_missing': 'cp apps/web/.env.example apps/web/.env.test',
  'webserver_timeout': 'npx supabase status && npx supabase start'
}
```

### Automatic Recovery
- Supabase not running → Auto-start
- Ports blocked → Auto-cleanup
- Missing .env.test → Auto-create
- Stuck processes → Auto-kill

## Performance

### Improvements Over Agent-Based Approach
```yaml
metric: execution_time
  old_agent_based: 20-30 minutes (with LLM round-trips)
  new_deterministic: 10-15 minutes (direct execution)
  improvement: 50-66% faster

metric: predictability
  old_agent_based: Variable (depends on LLM decisions)
  new_deterministic: Consistent (same input = same output)
  improvement: 100% deterministic

metric: reliability
  old_agent_based: Flaky (parsing issues, approval prompts)
  new_deterministic: Stable (structured parsing, no prompts)
  improvement: Significantly more reliable
```

## Troubleshooting

### Common Issues and Fixes

**All tests timing out:**
```bash
# Check Supabase
cd apps/e2e && npx supabase status
npx supabase start  # If not running

# Clean all processes
pkill -f "playwright|vitest|next-server"
```

**Port conflicts:**
```bash
# Find and kill processes on test ports
lsof -ti:3000-3020 | xargs kill -9
```

**Infrastructure check fails:**
```bash
# Manual infrastructure setup
cd apps/e2e
npx supabase stop
npx supabase start
cp apps/web/.env.example apps/web/.env.test
```

## Benefits of Deterministic Approach

1. **No LLM Round-trips** - Direct script execution
2. **No Approval Prompts** - All commands pre-approved
3. **Predictable Execution** - Same results every time
4. **Faster Performance** - 50%+ speed improvement
5. **Better Error Messages** - Structured error handling
6. **Easier Debugging** - Clear logs and state files
7. **Simpler Maintenance** - Scripts vs complex prompts

## Migration from Agent-Based System

The old agent-based system is preserved in:
- `.claude/commands/test.md.backup` - Original command
- `.claude/agents/test/test-orchestrator.md` - Orchestrator agent
- `.claude/agents/test/unit-test-agent.md` - Unit test agent
- `.claude/agents/test/e2e-parallel-agent.md` - E2E agent

To revert if needed:
```bash
mv .claude/commands/test.md.backup .claude/commands/test.md
```

## Files

### Core Scripts
- `.claude/scripts/test-runner.sh` - Bash wrapper
- `.claude/scripts/test-controller.js` - Node.js orchestrator

### Status Files
- `/tmp/.claude_test_status_*` - Statusline integration
- `/tmp/.claude_test_results.json` - Detailed results

## Notes

- Tests run WITHOUT any LLM intervention
- Execution time reduced by >50%
- No approval prompts during execution
- Structured JSON parsing (not regex)
- Automatic infrastructure recovery
- Clear, actionable error messages
- Full backwards compatibility with existing test scripts