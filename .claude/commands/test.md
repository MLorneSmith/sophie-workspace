---
name: test
description: Comprehensive test execution using specialized agents with parallel E2E support
usage: /test [options]
options:
  - all: Run all tests (unit + E2E) in parallel (default)
  - unit: Run only unit tests
  - e2e: Run only E2E tests
  - group: Run specific E2E group (1-4)
  - coverage: Include coverage reporting
  - watch: Run in watch mode (unit tests only)
  - quick: Run smoke tests only
  - cleanup: Clean test environment before running
---

# Test Command

Executes comprehensive test suites using specialized agents for parallel execution and optimal performance.

## Command Structure

```yaml
command: /test
options:
  all: true        # Run both unit and E2E tests (default)
  unit: false      # Run only unit tests
  e2e: false       # Run only E2E tests  
  group: null      # Run specific E2E group (1-4)
  coverage: false  # Include coverage reporting
  watch: false     # Watch mode for unit tests
  quick: false     # Smoke tests only
  cleanup: true    # Clean environment first
```

## Execution Flow

### 1. Environment Preparation
```yaml
initialization:
  task: "Prepare test environment"
  actions:
    - "Verify working directory"
    - "Clean test ports and processes"
    - "Initialize status tracking"
  status_file: "/tmp/.claude_test_status_${GIT_ROOT//\//_}"
  cleanup_agent: "test-cleanup-agent"
```

### 2. Launch Test Orchestrator
```yaml
orchestrator:
  agent: "test-orchestrator"
  role: "Coordinate all test execution"
  responsibilities:
    - "Delegate to unit-test-agent and e2e-parallel-agent"
    - "Track progress with TodoWrite"
    - "Aggregate results from both test types"
    - "Update statusline with real counts"
```

### 3. Test Execution Phases

#### Phase 1: Unit Tests
```yaml
unit_test_phase:
  agent: "unit-test-agent"
  parallel: true  # Uses Turbo for parallel workspace execution
  commands:
    - "pnpm test:unit"  # Runs via Turbo, excludes E2E
  expected_duration: "2-3m"
  workspaces:
    - "web"
    - "payload"
    - "packages/*"
  status_tracking: true
```

#### Phase 2: E2E Tests (Parallel Shards)
```yaml
e2e_test_phase:
  coordinator: "e2e-parallel-agent"
  parallel_shards: 9
  total_duration_estimate: "10-15m"
  
  shards:
    - id: 1
      name: "Accessibility Large"
      command: "pnpm --filter web-e2e test:shard1"
      tests: 13
      
    - id: 2
      name: "Authentication"
      command: "pnpm --filter web-e2e test:shard2"
      tests: 10
      
    - id: 3
      name: "Admin"
      command: "pnpm --filter web-e2e test:shard3"
      tests: 9
      
    - id: 4
      name: "Smoke"
      command: "pnpm --filter web-e2e test:shard4"
      tests: 9
      
    - id: 5
      name: "Accessibility Simple"
      command: "pnpm --filter web-e2e test:shard5"
      tests: 6
      
    - id: 6
      name: "Team Accounts"
      command: "pnpm --filter web-e2e test:shard6"
      tests: 6
      
    - id: 7
      name: "Account + Invitations"
      command: "pnpm --filter web-e2e test:shard7"
      tests: 8
      
    - id: 8
      name: "Quick Tests"
      command: "pnpm --filter web-e2e test:shard8"
      tests: 3
      
    - id: 9
      name: "Billing"
      command: "pnpm --filter web-e2e test:shard9"
      tests: 2
```

### 4. Status Updates
```yaml
status_management:
  update_file: "/tmp/.claude_test_status_"
  format: "status|timestamp|passed|failed|total"
  wrapper_script: "/home/msmith/projects/2025slideheroes/.claude/statusline/test-wrapper.sh"
  
  statusline_integration:
    component: "test"
    display_rules:
      success: "🟢 test (time_ago)"
      running: "⟳ test"
      failed: "🔴 test:failed_count (time_ago)"
    update_frequency: "real-time"
```

## Agent Task Definitions

### Test Orchestrator Task
```yaml
task:
  subagent_type: "test-orchestrator"
  description: "Coordinate comprehensive test execution"
  prompt: |
    Coordinate test execution by delegating to specialized agents:
    
    1. **Initialize TodoWrite**
       - Create todos for Unit Tests and E2E Tests phases
       - Track progress throughout execution
    
    2. **Delegate Unit Tests to unit-test-agent**
       Instructions for unit-test-agent:
       - Execute: pnpm test:unit
       - Use Turbo for parallel workspace execution
       - Parse output for actual test counts
       - Return pass/fail statistics
       - Target: 2-3 minutes completion
    
    3. **Delegate E2E Tests to e2e-parallel-agent** (if unit tests pass)
       Instructions for e2e-parallel-agent:
       - Execute 9 shards using pnpm --filter web-e2e test:shard[1-9]
       - Run shards in parallel with run_in_background: true
       - Monitor progress with BashOutput
       - Update todos in real-time
       - Return consolidated results
       - Target: 10-15 minutes completion
    
    4. **Aggregate Results**
       - Combine unit test results from unit-test-agent
       - Combine E2E results from e2e-parallel-agent
       - Calculate total statistics
    
    5. **Update Statusline**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Set TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
       - Format: "status|timestamp|passed|failed|total"
       - Update with actual aggregated counts
    
    6. **Generate Final Report**
       - Show unit test results
       - Show E2E test results (by shard)
       - Total test statistics
       - Any failure details
    
    IMPORTANT: You coordinate and delegate. The subagents execute.
    Use TodoWrite to track all phases and provide visibility.
```

### Unit Test Agent Task
```yaml
task:
  subagent_type: "unit-test-agent"
  description: "Execute unit tests across all workspaces"
  prompt: |
    Execute unit tests using Turbo-optimized parallel execution:
    
    1. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Kill any existing vitest processes: pkill -f vitest || true
    
    2. **Execute Tests**
       - Run: cd $GIT_ROOT && pnpm test:unit 2>&1 | tee /tmp/unit_output.log
       - This uses Turbo to run tests in parallel across workspaces
       - Wait for completion (timeout 5 minutes)
    
    3. **Parse Output**
       - Look for Vitest patterns per workspace
       - Extract: "Test Files: X passed, Y failed"
       - Sum totals across all workspaces
    
    4. **Return Results**
       - Total tests run
       - Total passed
       - Total failed
       - Duration
       - Any failure details
    
    Return actual test counts from Vitest/Turbo output.
```

### E2E Parallel Agent Task
```yaml
task:
  subagent_type: "e2e-parallel-agent"
  description: "Coordinate parallel E2E test execution"
  prompt: |
    Execute E2E tests using 9 parallel shards:
    
    1. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Kill existing test processes: pkill -f "playwright|3000|3001" || true
       - Initialize TodoWrite with 9 shard tasks
    
    2. **Launch All Shards in Parallel**
       - Execute each with run_in_background: true:
         - pnpm --filter web-e2e test:shard1
         - pnpm --filter web-e2e test:shard2
         - pnpm --filter web-e2e test:shard3
         - pnpm --filter web-e2e test:shard4
         - pnpm --filter web-e2e test:shard5
         - pnpm --filter web-e2e test:shard6
         - pnpm --filter web-e2e test:shard7
         - pnpm --filter web-e2e test:shard8
         - pnpm --filter web-e2e test:shard9
    
    3. **Monitor Progress**
       - Use BashOutput to check each shard's output
       - Update todos as shards complete
       - Parse Playwright output: "X passed", "Y failed"
    
    4. **Aggregate Results**
       - Sum results from all 9 shards
       - Total: 85 tests expected
       - Report by shard and overall
    
    5. **Return Consolidated Results**
       - Total tests: sum of all shards
       - Total passed/failed/skipped
       - Duration per shard
       - Any failure details
```


## Output Format

### Success Output
```yaml
test_results:
  status: "success"
  timestamp: "2024-01-15T10:30:00Z"
  total_duration: "4m 15s"
  parallel_time_saved: "7m 45s"
  
  summary:
    total_tests: 362  # Actual count from test output
    passed: 362
    failed: 0
    skipped: 12
    
  unit_tests:
    status: "success"
    total: 245  # From Vitest output
    passed: 245
    failed: 0
    skipped: 12
    duration: "45s"
    coverage:
      statements: 78.5
      branches: 72.3
      functions: 81.2
      lines: 79.1
      
  e2e_tests:
    status: "success"
    total: 85  # From Playwright output (actual E2E test count)
    passed: 85
    failed: 0
    parallel_shards: 9
    duration: "12m 30s"
    
    by_shard:
      shard_1:
        name: "Accessibility Large"
        passed: 13
        duration: "3m 05s"
      shard_2:
        name: "Authentication"
        passed: 10
        duration: "2m 50s"
      shard_3:
        name: "Admin"
        passed: 9
        duration: "2m 10s"
      # ... remaining shards
        
  next_steps:
    - "All tests passing - ready for deployment"
    - "Code coverage meets requirements"
```

### Failure Output
```yaml
test_results:
  status: "failed"
  timestamp: "2024-01-15T10:30:00Z"
  
  summary:
    total_tests: 308
    passed: 306
    failed: 2
    skipped: 12
    
  failures:
    - type: "unit"
      test: "calculateDiscount utility"
      file: "src/utils/pricing.test.ts:45"
      error: "Expected 10 but received 15"
      
    - type: "e2e"
      test: "team billing › upgrade subscription"
      file: "tests/team-billing/upgrade.spec.ts"
      group: 3
      error: "Timeout waiting for Stripe webhook"
      screenshot: "/tmp/failures/billing-upgrade.png"
      
  commands_to_fix:
    - "Review pricing calculation logic"
    - "Check Stripe webhook configuration"
    - "Run '/test --group 3' after fixes"
```

## Performance Metrics

```yaml
performance_analysis:
  execution_mode: "parallel"
  
  time_comparison:
    sequential_estimate: "12m 00s"
    parallel_actual: "4m 15s"
    improvement: "64.6%"
    
  resource_usage:
    peak_cpu: "85%"
    peak_memory: "2.8GB"
    parallel_processes: 8
    
  optimization_suggestions:
    - "Consider adding 5th group for better balance"
    - "Group 3 (billing) is slowest - investigate"
    - "Unit tests could benefit from Vitest parallelization"
```

## Error Recovery

```yaml
error_handling:
  port_conflicts:
    action: "Run cleanup agent"
    retry: true
    max_attempts: 3
    
  test_timeouts:
    action: "Kill hung process and retry"
    timeout_limits:
      unit: "5m"
      e2e_group: "10m"
      
  infrastructure_failures:
    supabase_start_failure:
      action: "Stop all instances and retry"
    server_start_failure:
      action: "Try alternative port"
      
  flaky_tests:
    detection: "Track across multiple runs"
    action: "Automatic retry with isolation"
    max_retries: 2
```

## Integration Points

```yaml
integrations:
  ci_cd:
    github_actions: true
    pre_merge: "required"
    deployment_gate: true
    
  statusline:
    component: "test"
    real_time_updates: true
    wrapper_script: "test-wrapper.sh"
    
  reporting:
    junit_xml: true
    html_report: true
    coverage_report: true
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Run cleanup before tests
/test --cleanup

# Or manually free ports
lsof -ti:3000 | xargs -r kill -9
```

**Supabase Won't Start**
```bash
# Reset Supabase completely
npx supabase stop --project-id e2e
docker system prune -f
npx supabase start --project-id e2e
```

**Tests Hanging**
```bash
# Find and kill test processes
ps aux | grep -E "(playwright|vitest)" | awk '{print $2}' | xargs kill -9
```

## Notes

- Parallel E2E execution reduces total time by ~70%
- Each E2E group runs on its own port (3000-3003)
- Statusline updates in real-time during execution
- Cleanup agent ensures clean state between runs
- Test results are aggregated for comprehensive reporting
- Intelligent retry logic for flaky tests
- Supports both local and CI environments