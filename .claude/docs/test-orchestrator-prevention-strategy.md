# Test Orchestrator Stuck State Prevention Strategy

## Problem Analysis

The test orchestrator can get stuck in "running" state when:
1. E2E tests fail to complete due to resource contention
2. Server overwhelmed by parallel requests (9 shards × 4 workers = 36 concurrent browsers)
3. Response times exceed Playwright timeouts (20s vs 34+ second actual responses)
4. Test orchestrator waits indefinitely for results that never arrive

## Prevention Strategies

### 1. Execution Timeout Management

**Add orchestrator-level timeouts:**
```javascript
// In test-orchestrator.md
const ORCHESTRATOR_TIMEOUT = 25 * 60 * 1000; // 25 minutes max
const E2E_PHASE_TIMEOUT = 20 * 60 * 1000;    // 20 minutes max for E2E
const UNIT_PHASE_TIMEOUT = 5 * 60 * 1000;    // 5 minutes max for unit tests

// Implement timeout wrapper for Task delegations
async function delegateWithTimeout(agentType, prompt, timeout) {
  return Promise.race([
    Task({ subagent_type: agentType, prompt }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Agent ${agentType} timeout after ${timeout}ms`)), timeout)
    )
  ]);
}
```

### 2. Resource-Aware E2E Execution

**Replace parallel execution with sequential batching:**
```yaml
# Instead of: 9 shards in parallel
# Use: 3 batches of 3 shards each

execution_strategy:
  mode: "sequential_batches"
  batch_size: 3
  max_concurrent_shards: 3
  shard_timeout: "10m"
  
batches:
  batch_1: [shard1, shard2, shard3]  # Accessibility + Auth
  batch_2: [shard4, shard5, shard6]  # Admin + Smoke + Teams  
  batch_3: [shard7, shard8, shard9]  # Invitations + Quick + Billing
```

### 3. State Monitoring and Cleanup

**Add periodic state health checks:**
```bash
# New script: .claude/scripts/test-state-monitor.sh
monitor_test_state() {
    local status_file="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
    local results_file="/tmp/.claude_test_results.json"
    
    if [ -f "$results_file" ]; then
        local start_time=$(jq -r '.startTime' "$results_file")
        local current_time=$(date -u +%s)
        local elapsed=$((current_time - $(date -d "$start_time" +%s)))
        
        # If running for more than 30 minutes, mark as failed
        if [ $elapsed -gt 1800 ] && [ "$(jq -r '.status' "$results_file")" = "running" ]; then
            echo "timeout|$current_time|0|0|0" > "$status_file"
            jq '.status = "timeout" | .phase = "cleanup"' "$results_file" > "${results_file}.tmp"
            mv "${results_file}.tmp" "$results_file"
            echo "⚠️ Test orchestrator timeout detected and cleaned up"
        fi
    fi
}
```

### 4. Graceful Degradation

**Add fallback strategies for resource contention:**
```javascript
// In e2e-parallel-agent.md
const FALLBACK_STRATEGIES = {
  resource_contention: {
    action: "reduce_concurrency",
    new_batch_size: 1,
    increase_timeouts: true,
    timeout_multiplier: 3
  },
  
  server_overload: {
    action: "sequential_execution", 
    restart_server: true,
    wait_between_shards: "30s"
  },
  
  repeated_failures: {
    action: "abort_with_partial_results",
    minimum_successful_shards: 3,
    report_infrastructure_issue: true
  }
};
```

### 5. Enhanced Error Handling

**Add specific recovery procedures:**
```bash
# Detect common failure patterns
detect_failure_pattern() {
    local logs="$1"
    
    # Pattern 1: Server timeout cascade
    if grep -q "Timeout.*exceeded.*page.goto" "$logs" | wc -l | [ $(cat) -gt 5 ]; then
        echo "server_overload"
    
    # Pattern 2: Resource contention  
    elif grep -q "EADDRINUSE\|port.*already in use" "$logs"; then
        echo "port_conflict"
    
    # Pattern 3: Database connection issues
    elif grep -q "ECONNREFUSED.*5432\|database.*timeout" "$logs"; then
        echo "database_connection"
    
    else
        echo "unknown"
    fi
}
```

### 6. Proactive Health Monitoring

**Add pre-flight resource checks:**
```bash
# Enhanced infrastructure validation
validate_resources() {
    echo "🔍 Resource availability check..."
    
    # Check available memory
    local available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
    if [ $available_mem -lt 30 ]; then
        echo "⚠️ Low memory: ${available_mem}% available"
        return 1
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if [ $(echo "$cpu_load > 4.0" | bc) -eq 1 ]; then
        echo "⚠️ High CPU load: ${cpu_load}"
        return 1
    fi
    
    # Check server response time
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/healthcheck)
    if [ $(echo "$response_time > 2.0" | bc) -eq 1 ]; then
        echo "⚠️ Slow server response: ${response_time}s"
        return 1  
    fi
    
    echo "✅ Resources adequate for testing"
    return 0
}
```

## Implementation Priority

### Phase 1: Immediate (This Week)
1. **Add orchestrator timeouts** - Prevent indefinite running states
2. **Implement batch execution** - Reduce resource contention  
3. **Add state monitoring** - Auto-cleanup stuck states

### Phase 2: Short Term (Next Sprint)
4. **Enhanced error handling** - Better failure pattern detection
5. **Resource validation** - Pre-flight resource checks
6. **Fallback strategies** - Graceful degradation paths

### Phase 3: Long Term (Next Month)  
7. **Production-like testing** - Dedicated test environment
8. **Resource isolation** - Containerized test execution
9. **Performance monitoring** - Real-time resource tracking

## Benefits

- **Eliminates stuck states** - Tests complete or timeout gracefully
- **Improves reliability** - Better success rates through resource management  
- **Faster debugging** - Clear failure patterns and recovery procedures
- **Better user experience** - Predictable test execution times
- **Reduced maintenance** - Automatic cleanup and recovery

## Files to Update

1. `.claude/agents/test/test-orchestrator.md` - Add timeout wrappers
2. `.claude/agents/test/e2e-parallel-agent.md` - Implement batch execution
3. `.claude/scripts/test-state-monitor.sh` - New monitoring script  
4. `.claude/commands/test.md` - Add resource validation calls
5. `apps/e2e/playwright.config.ts` - Increase timeout configurations

## Success Metrics

- **Zero stuck states** - No tests running > 30 minutes
- **Higher success rate** - >80% E2E test pass rate
- **Predictable timing** - Test execution within ±20% of estimates
- **Better resource utilization** - <80% CPU/memory peak usage