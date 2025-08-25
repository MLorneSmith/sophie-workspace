---
name: test
description: Comprehensive test execution using specialized agents with parallel E2E support
usage: /test [options]
options:
  - all: Run all tests (unit + E2E) in parallel (default)
  - unit: Run only unit tests
  - e2e: Run only E2E tests
  - shard: Run specific E2E shard (1-9)
  - coverage: Include coverage reporting
  - watch: Run in watch mode (unit tests only)
  - quick: Run smoke tests only
  - cleanup: Clean test environment before running
  - debug: Enable debug mode with verbose output
---

# Test Command

Executes comprehensive test suites using specialized agents for parallel execution and optimal performance.

## Direct Agent Access Commands

For more focused testing, use these direct commands:
- `/test-unit` - Run unit tests only (bypasses orchestrator)
- `/test-e2e` - Run E2E tests only (bypasses orchestrator)  
- `/test-shard N` - Run specific E2E shard (1-9)
- `/test-infra` - Validate/fix infrastructure without running tests

These commands provide faster, more targeted testing when you don't need the full suite.

## Command Structure

```yaml
command: /test
options:
  all: true        # Run both unit and E2E tests (default)
  unit: false      # Run only unit tests
  e2e: false       # Run only E2E tests  
  shard: null      # Run specific E2E shard (1-9)
  coverage: false  # Include coverage reporting
  watch: false     # Watch mode for unit tests
  quick: false     # Smoke tests only
  cleanup: true    # Clean environment first
  debug: false     # Enable verbose debug output
```

## Execution Flow

### 1. Pre-flight Checks (Critical)
```yaml
preflight_checks:
  task: "Validate infrastructure and environment"
  required_before_tests: true
  
  infrastructure_validation:
    - name: "Supabase E2E Instance"
      check: "npx supabase status 2>&1"
      recovery: "cd apps/e2e && npx supabase start"
      ports: [55321, 55322, 55323, 55324, 55325]
      timeout: 120000
      error_message: "Supabase E2E instance not running - auto-starting..."
    
    - name: "Port Availability"
      check: "lsof -i :3000-3020"
      recovery: "kill -9 $(lsof -ti:3000-3020) 2>/dev/null || true"
      error_message: "Ports in use - cleaning up..."
    
  process_cleanup:
    - "pkill -f 'playwright|vitest|next-server' || true"
    - "pkill -f 'test:shard[1-9]' || true"
    - "sleep 2"  # Allow processes to terminate
    - "kill -9 $(ps aux | grep -E 'playwright|3000|3001' | grep -v grep | awk '{print $2}') 2>/dev/null || true"
    
  environment_validation:
    - check: "Test .env.test exists"
      file: "apps/web/.env.test"
      required_vars:
        - "NEXT_PUBLIC_SUPABASE_URL"
        - "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        - "DATABASE_URL"
    - check: "Verify Supabase connectivity"
      command: "curl -s http://127.0.0.1:55321/rest/v1/ -o /dev/null -w '%{http_code}' | grep -q 200"
      error_message: "Cannot connect to Supabase - check if it's running on port 55321"
```

### 2. Environment Preparation
```yaml
initialization:
  task: "Prepare test environment"
  depends_on: "preflight_checks"
  actions:
    - "Verify working directory"
    - "Initialize status tracking"
    - "Clear previous test artifacts"
  status_file: "/tmp/.claude_test_status_${GIT_ROOT//\//_}"
  cleanup_agent: "test-cleanup-agent"
```

### 3. Launch Test Orchestrator
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

### 4. Test Execution Phases

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

### 5. Status Updates
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

## Command Execution

### Primary Implementation
When the /test command is invoked, use the Task tool to delegate to test-orchestrator:

```javascript
// THIS IS THE CORRECT IMPLEMENTATION FOR /test COMMAND
Task({
  subagent_type: "test-orchestrator",
  description: "Coordinate test execution",
  prompt: `Execute comprehensive test suite with enhanced visibility and parallel execution.
  
    Options: ${JSON.stringify(options)}
    
    Key Requirements:
    1. Perform pre-flight infrastructure checks first
    2. Use TodoWrite for progress tracking with frequent updates
    3. Delegate unit tests to unit-test-agent
    4. Delegate E2E tests to e2e-parallel-agent (9 shards)
    5. Aggregate and report results
    6. Handle infrastructure failures gracefully
    
    If --debug flag is present or DEBUG_TEST=true, enable verbose output.
    Target completion: 15-20 minutes total.`
})
```

## Agent Task Definitions

### Test Orchestrator Task
```yaml
task:
  subagent_type: "test-orchestrator"
  description: "Coordinate comprehensive test execution with enhanced visibility and infrastructure validation"
  prompt: |
    Coordinate test execution by delegating to specialized agents with ENHANCED VISIBILITY:
    
    DEBUG MODE: Check if --debug option or DEBUG_TEST=true environment variable is set.
    If debug mode is active, enable verbose output and detailed logging.
    
    1. **Pre-flight Infrastructure Checks** (CRITICAL - DO THIS FIRST)
       - Check Supabase E2E status: npx supabase status
       - If Supabase not running: cd apps/e2e && npx supabase start
       - Verify ports 55321-55327 are accessible
       - Clean stuck processes: pkill -f 'playwright|vitest|next-server' || true
       - Verify environment files exist: apps/web/.env.test
       - STOP if infrastructure fails - report specific error
    
    2. **Initialize TodoWrite with Enhanced Visibility**
       - Create detailed todos showing delegation status
       - Include: "🔍 Pre-flight checks", "📦 Unit Tests: Ready to delegate", "🌐 E2E Tests: Ready to delegate"
       - Show estimated time for each phase
       - Track progress throughout execution with frequent updates
    
    3. **Delegate Unit Tests to unit-test-agent** (WITH VISIBILITY)
       - FIRST update TodoWrite: "📦 Unit Tests: Delegating to unit-test-agent..."
       - THEN delegate to unit-test-agent using Task tool
       Instructions for unit-test-agent:
       - Execute: pnpm test:unit
       - Use Turbo for parallel workspace execution
       - Parse output for actual test counts
       - Return pass/fail statistics
       - Target: 2-3 minutes completion
       - If fails with connection error, report infrastructure issue
    
    4. **Delegate E2E Tests to e2e-parallel-agent** (if unit tests pass) (WITH VISIBILITY)
       - FIRST update TodoWrite: "🌐 E2E Tests: Delegating to e2e-parallel-agent for 9-shard execution..."
       - THEN delegate to e2e-parallel-agent using Task tool
       Instructions for e2e-parallel-agent:
       - FIRST verify dev servers can start (test with curl)
       - Execute 9 shards using pnpm --filter web-e2e test:shard[1-9]
       - Run shards in parallel with run_in_background: true
       - Monitor progress with BashOutput
       - Update todos in real-time
       - If webServer timeout occurs, report as infrastructure failure
       - Return consolidated results
       - Target: 10-15 minutes completion
    
    5. **Aggregate Results**
       - Combine unit test results from unit-test-agent
       - Combine E2E results from e2e-parallel-agent
       - Calculate total statistics
       - Include infrastructure status in report
    
    6. **Update Statusline**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Set TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
       - Format: "status|timestamp|passed|failed|total"
       - Update with actual aggregated counts
    
    7. **Generate Final Report**
       - Infrastructure status (Supabase, ports, environment)
       - Unit test results
       - E2E test results (by shard)
       - Total test statistics
       - Any failure details with specific recovery steps
    
    IMPORTANT: Infrastructure validation is CRITICAL. Many test failures
    are actually infrastructure issues (Supabase not running, ports blocked).
    Always check infrastructure FIRST and report specific errors.
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
  description: "Coordinate parallel E2E test execution with infrastructure checks"
  prompt: |
    Execute E2E tests using 9 parallel shards:
    
    1. **Pre-E2E Infrastructure Validation** (CRITICAL)
       - Verify Supabase E2E is running: curl http://127.0.0.1:55321/rest/v1/
       - Test dev server startup: pnpm --filter=web dev:test (background, wait 10s, curl localhost:3000)
       - If server doesn't respond in 30s, STOP and report:
         "E2E Infrastructure Failure: Dev server failed to start. Check:
          1. Supabase E2E status (npx supabase status)
          2. Port availability (lsof -i :3000-3020)
          3. Environment variables in .env.test"
       - Kill test server after validation
    
    2. **Setup**
       - Set GIT_ROOT=$(git rev-parse --show-toplevel)
       - Aggressive cleanup: kill -9 $(ps aux | grep -E 'playwright|3000|3001' | grep -v grep | awk '{print $2}') 2>/dev/null || true
       - Initialize TodoWrite with 9 shard tasks + infrastructure check
    
    3. **Launch All Shards in Parallel**
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
    
    4. **Monitor Progress**
       - Use BashOutput to check each shard's output
       - Watch for "webServer timeout" - this means infrastructure failure
       - Update todos as shards complete
       - Parse Playwright output: "X passed", "Y failed"
    
    5. **Handle Infrastructure Failures**
       - If any shard shows "webServer timeout":
         - Kill all shards immediately
         - Report: "E2E tests failed due to infrastructure issue"
         - Suggest: "Run 'cd apps/e2e && npx supabase start' then retry"
    
    6. **Aggregate Results**
       - Sum results from all 9 shards
       - Total: 85 tests expected
       - Report by shard and overall
       - Include any infrastructure issues
    
    7. **Return Consolidated Results**
       - Infrastructure status
       - Total tests: sum of all shards
       - Total passed/failed/skipped
       - Duration per shard
       - Any failure details with context
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
  infrastructure_failures:
    supabase_not_running:
      detection: "failed to inspect container" or "connection refused :55321"
      action: "cd apps/e2e && npx supabase start"
      auto_fix: true
      retry_tests: true
      
    webserver_timeout:
      detection: "webServer timeout" in Playwright output
      likely_cause: "Supabase not running or port conflict"
      actions:
        - "Check Supabase: npx supabase status"
        - "Start if needed: cd apps/e2e && npx supabase start"
        - "Clean ports: kill -9 $(lsof -ti:3000-3020)"
      auto_fix: true
      
  port_conflicts:
    detection: "address already in use"
    action: "Aggressive cleanup: kill -9 all processes on ports"
    retry: true
    max_attempts: 3
    
  test_timeouts:
    action: "Kill hung process and retry"
    timeout_limits:
      unit: "5m"
      e2e_group: "10m"
    special_handling:
      lighthouse_timeout: "Skip lighthouse tests on timeout"
      
  stuck_processes:
    detection: "Multiple playwright processes running"
    action: "pkill -9 -f playwright && sleep 2"
    
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

**E2E Tests Fail with "webServer timeout"**
```bash
# This usually means Supabase E2E is not running
cd apps/e2e
npx supabase status  # Check status
npx supabase start   # Start if not running

# Then retry tests
/test --e2e
```

**Port Already in Use**
```bash
# Aggressive cleanup
kill -9 $(lsof -ti:3000-3020) 2>/dev/null || true
pkill -f "next-server" || true

# Then retry
/test --cleanup
```

**Supabase Won't Start**
```bash
# Full reset of E2E Supabase
cd apps/e2e
npx supabase stop
docker ps -a | grep supabase | awk '{print $1}' | xargs docker rm -f
docker system prune -f
npx supabase start
```

**Tests Hanging**
```bash
# Nuclear option - kill everything
pkill -9 -f "playwright|vitest|next-server|3000|3001"
sleep 2
/test --cleanup
```

**Dev Server Won't Start**
```bash
# Check what's blocking it
lsof -i :3000  # Check port usage
ps aux | grep next-server  # Check for stuck Next.js processes

# Verify environment
cat apps/web/.env.test  # Ensure env vars are set
curl http://127.0.0.1:55321/rest/v1/  # Test Supabase connectivity
```

## Notes

- **CRITICAL**: Most E2E failures are infrastructure issues (Supabase not running)
- Pre-flight checks prevent confusing timeout errors
- Parallel E2E execution reduces total time by ~70%
- Each E2E group runs on its own port (3000-3003)
- Statusline updates in real-time during execution
- Cleanup agent ensures clean state between runs
- Test results are aggregated for comprehensive reporting
- Intelligent retry logic for flaky tests
- Automatic infrastructure recovery for common issues
- Supports both local and CI environments

## Infrastructure Dependencies

```yaml
required_services:
  supabase_e2e:
    ports: [55321, 55322, 55323, 55324, 55325]
    start_command: "cd apps/e2e && npx supabase start"
    health_check: "curl http://127.0.0.1:55321/rest/v1/"
    
  dev_servers:
    web:
      port: 3000
      command: "pnpm --filter=web dev:test"
    payload:
      port: 3020  
      command: "pnpm --filter=payload dev:test"
      
environment_files:
  - "apps/web/.env.test"
  - "apps/e2e/.env.local"
```