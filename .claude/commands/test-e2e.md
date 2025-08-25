---
name: test-e2e
description: Direct access to e2e-parallel-agent for running E2E tests only
usage: /test-e2e [options]
options:
  - shard: Run specific shard (1-9)
  - headed: Run tests in headed mode (visible browser)
  - debug: Enable debug mode with verbose output
  - retry: Enable automatic retry for flaky tests
---

# Test E2E Command

Direct invocation of the e2e-parallel-agent for running E2E tests without the orchestrator overhead.

## Usage

```bash
/test-e2e                  # Run all E2E tests (9 shards parallel)
/test-e2e --shard 3       # Run specific shard only
/test-e2e --headed        # Run with visible browser
/test-e2e --debug         # Enable debug mode
/test-e2e --retry         # Auto-retry flaky tests
```

## Direct Agent Invocation

This command bypasses the test-orchestrator and directly invokes the e2e-parallel-agent for focused E2E test execution.

### Task Definition
```yaml
task:
  subagent_type: "e2e-parallel-agent"
  description: "Execute E2E tests directly"
  prompt: |
    Execute E2E tests with the following configuration:
    
    1. **Pre-flight Infrastructure Validation** (CRITICAL)
       - Verify Supabase E2E is running on port 55321
       - If not running: cd apps/e2e && npx supabase start
       - Clean stuck processes: pkill -f 'playwright|next-server'
       - Check ports 3000-3010 availability
       - Verify apps/web/.env.test exists
    
    2. **Execution Options**
       - Default: Run all 9 shards in parallel
       - Shard: Run only specified shard if --shard N provided
       - Headed: Set HEADED=true for visible browser if --headed
       - Debug: Enable DEBUG=pw:api if --debug or DEBUG_TEST=true
       - Retry: Enable retry logic for flaky tests if --retry
    
    3. **Shard Configuration**
       - Shard 1: Accessibility Large (13 tests)
       - Shard 2: Authentication (10 tests)
       - Shard 3: Admin (9 tests)
       - Shard 4: Smoke (9 tests)
       - Shard 5: Accessibility Simple (6 tests)
       - Shard 6: Team Accounts (6 tests)
       - Shard 7: Account + Invitations (8 tests)
       - Shard 8: Quick Tests (3 tests)
       - Shard 9: Billing (2 tests)
    
    4. **Progress Tracking**
       - Use TodoWrite to show shard-level progress
       - Update in real-time as shards complete
       - Show estimated time remaining
       - Report infrastructure issues immediately
    
    5. **Error Handling**
       - Detect webServer timeout → report Supabase issue
       - Port conflicts → rotate through 3000-3010
       - Flaky tests → retry once if --retry enabled
       - Always provide specific fix commands
    
    6. **Output Requirements**
       - Total tests run, passed, failed per shard
       - Infrastructure status
       - Parallel speedup metrics
       - Specific failure details with screenshots
       
    Return structured results with clear infrastructure status.
```

## Benefits

- **Faster E2E Testing**: Skip unit tests when not needed
- **Shard Control**: Test specific areas quickly
- **Debug Support**: Visible browser and detailed logs
- **Infrastructure Focus**: Clear reporting of setup issues

## Examples

### Run all E2E tests
```bash
/test-e2e
```

### Test specific shard
```bash
/test-e2e --shard 2  # Run authentication tests only
```

### Debug with visible browser
```bash
/test-e2e --headed --debug
```

### Run with retry for CI
```bash
/test-e2e --retry
```

## Shard Reference

| Shard | Name | Tests | Typical Duration |
|-------|------|-------|-----------------|
| 1 | Accessibility Large | 13 | 3-4 min |
| 2 | Authentication | 10 | 2-3 min |
| 3 | Admin | 9 | 2-3 min |
| 4 | Smoke | 9 | 2 min |
| 5 | Accessibility Simple | 6 | 2 min |
| 6 | Team Accounts | 6 | 2 min |
| 7 | Account + Invitations | 8 | 2-3 min |
| 8 | Quick Tests | 3 | 1 min |
| 9 | Billing | 2 | 2 min |

## Expected Output

```
🌐 E2E Test Results (Direct Execution)
======================================
Infrastructure: ✅ Supabase running on 55321

Shard Results:
✅ Shard 1 (Accessibility Large): 13/13 passed (3:12)
✅ Shard 2 (Authentication): 10/10 passed (2:45)
✅ Shard 3 (Admin): 9/9 passed (2:58)
✅ Shard 4 (Smoke): 9/9 passed (1:52)
✅ Shard 5 (Accessibility Simple): 6/6 passed (1:48)
✅ Shard 6 (Team Accounts): 6/6 passed (2:05)
✅ Shard 7 (Account + Invitations): 8/8 passed (2:35)
✅ Shard 8 (Quick Tests): 3/3 passed (0:52)
✅ Shard 9 (Billing): 2/2 passed (1:55)

📊 Total: 66/66 tests passed
⏱️  Duration: 12m 34s (parallel)
🚀 Speedup: 3.6x faster than sequential
```

## Notes

- Infrastructure validation is critical
- Most E2E failures are infrastructure-related
- Use `/test` for full test suite with unit tests
- Shards run on different ports to avoid conflicts