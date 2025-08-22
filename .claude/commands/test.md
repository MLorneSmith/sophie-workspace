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
    - "Manage parallel execution"
    - "Monitor agent progress"
    - "Aggregate results"
    - "Update statusline"
```

### 3. Test Execution Phases

#### Phase 1: Unit Tests
```yaml
unit_test_phase:
  agent: "unit-test-agent"
  parallel: false
  commands:
    - "pnpm test"  # Excludes E2E tests
  expected_duration: "45s"
  workspaces:
    - "web"
    - "payload"
    - "packages/*"
  status_tracking: true
```

#### Phase 2: E2E Tests (Parallel Groups)
```yaml
e2e_test_phase:
  coordinator: "e2e-parallel-agent"
  parallel_groups: 4
  total_duration_estimate: "3-4m"
  
  groups:
    - id: 1
      name: "Quick Tests"
      agent: "e2e-runner-agent"
      port: 3000
      tests:
        - "tests/smoke"
        - "tests/healthcheck.spec.ts"
        - "tests/authentication"
      duration: "2m"
      
    - id: 2
      name: "User Flows"
      agent: "e2e-runner-agent"
      port: 3001
      tests:
        - "tests/account"
        - "tests/onboarding"
        - "tests/invitations"
      duration: "3m"
      
    - id: 3
      name: "Billing"
      agent: "e2e-runner-agent"
      port: 3002
      tests:
        - "tests/team-billing"
        - "tests/user-billing"
        - "tests/team-accounts"
      duration: "3m"
      
    - id: 4
      name: "Admin & A11y"
      agent: "e2e-runner-agent"
      port: 3003
      tests:
        - "tests/admin"
        - "tests/accessibility"
      duration: "2m"
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
    Execute comprehensive test suite with real commands and proper statusline updates:
    
    1. **Initialize Environment**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Set TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
       - Run cleanup if ports 3000-3003 or 54321-54326 are in use
    
    2. **Run Unit Tests** (IMPORTANT: Use actual commands)
       - Mark status as running: echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"
       - Execute: cd $GIT_ROOT && pnpm test 2>&1 | tee /tmp/unit_test_output.log
       - Parse ACTUAL output for test counts (look for "Test Files" or test count patterns)
       - Update status file with real counts
    
    3. **Run E2E Tests** (IMPORTANT: Use actual Playwright commands)
       - Change to E2E directory: cd $GIT_ROOT/apps/e2e
       - Start Supabase if needed: npx supabase start --project-id e2e
       - Execute ALL E2E tests: npx playwright test --reporter=list 2>&1 | tee /tmp/e2e_output.log
       - Parse ACTUAL Playwright output for test counts
       - Look for patterns like "X passed", "X failed", "X skipped"
    
    4. **Parse Real Test Results**
       - Unit tests: Extract from Vitest output (Test Files: X passed, Y failed)
       - E2E tests: Extract from Playwright output (X passed, Y failed, Z skipped)
       - Calculate totals: passed, failed, skipped
    
    5. **Update Statusline** (CRITICAL)
       - Format: "status|timestamp|passed|failed|total"
       - If all pass: echo "success|$(date +%s)|$PASSED|0|$TOTAL" > "$TEST_STATUS_FILE"
       - If failures: echo "failed|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
       - MUST use actual test counts from command output
    
    6. **Generate Report**
       - Show actual test counts (not estimates)
       - Include both unit and E2E results
       - List any failures with details
    
    IMPORTANT: You MUST run actual test commands and parse real output.
    Do NOT use placeholder or estimated numbers.
    The statusline file MUST be updated with real test counts.
```

### Unit Test Agent Task
```yaml
task:
  subagent_type: "unit-test-agent"
  description: "Execute unit tests across all workspaces"
  prompt: |
    Run ACTUAL unit tests and parse real output:
    
    1. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Set TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
    
    2. **Execute Tests** (MUST use actual commands)
       - Run: cd $GIT_ROOT && pnpm test 2>&1 | tee /tmp/unit_output.log
       - Wait for completion (timeout 5 minutes)
    
    3. **Parse REAL Output**
       - Look for Vitest patterns: "Test Files: X passed, Y failed"
       - Alternative: "X passed", "Y failed", "Z skipped"
       - Extract actual numbers from output
    
    4. **Update Status File**
       - During: echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"
       - After: echo "status|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
    
    Return actual test counts, not estimates.
```

### E2E Parallel Agent Task
```yaml
task:
  subagent_type: "e2e-parallel-agent"
  description: "Coordinate parallel E2E test execution"
  prompt: |
    Run ACTUAL E2E tests with Playwright:
    
    1. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - cd $GIT_ROOT/apps/e2e
    
    2. **Start Infrastructure**
       - Run: npx supabase start --project-id e2e
       - Wait for Supabase to be ready
    
    3. **Execute E2E Tests** (MUST use actual command)
       - Run: npx playwright test --reporter=list 2>&1 | tee /tmp/e2e_output.log
       - Alternative for parallel: npx playwright test --workers=4
    
    4. **Parse REAL Playwright Output**
       - Look for: "X passed", "Y failed", "Z skipped"
       - Extract actual test counts
       - Count individual test cases, not just files
    
    5. **Cleanup**
       - Stop test servers
       - npx supabase stop --project-id e2e
    
    Return actual E2E test counts from Playwright output.
```

### E2E Runner Agent Tasks (per group)
```yaml
task_template:
  subagent_type: "e2e-runner-agent"
  description: "Run E2E test group {GROUP_ID}"
  environment:
    GROUP_ID: "{1-4}"
    PORT: "{3000-3003}"
    TEST_PATHS: "{group_specific_tests}"
  prompt: |
    Execute E2E test group {GROUP_ID}:
    1. Start Next.js server on port {PORT}
    2. Wait for server readiness
    3. Run Playwright tests: {TEST_PATHS}
    4. Parse test results
    5. Save to $TEST_RESULTS_DIR/e2e_group{GROUP_ID}.json
    6. Cleanup server and resources
```

### Cleanup Agent Task
```yaml
task:
  subagent_type: "test-cleanup-agent"
  description: "Clean test environment"
  prompt: |
    Ensure clean test environment:
    1. Kill processes on ports 3000-3003, 54321-54326
    2. Stop any Supabase instances
    3. Terminate zombie test processes
    4. Clean test artifacts older than 1 day
    5. Verify all ports are free
    6. Report cleanup status
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
    total: 117  # From Playwright output (actual E2E test count)
    passed: 117
    failed: 0
    parallel_groups: 4
    duration: "3m 30s"
    
    by_group:
      group_1:
        name: "Quick Tests"
        passed: 15
        duration: "2m 05s"
      group_2:
        name: "User Flows"
        passed: 22
        duration: "2m 50s"
      group_3:
        name: "Billing"
        passed: 18
        duration: "3m 10s"
      group_4:
        name: "Admin & A11y"
        passed: 8
        duration: "1m 55s"
        
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