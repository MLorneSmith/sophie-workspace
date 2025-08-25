---
name: test-infra
description: Validate and fix test infrastructure without running tests
usage: /test-infra [options]
options:
  - fix: Automatically fix detected issues
  - reset: Full reset of test infrastructure
  - status: Show detailed status only
---

# Test Infrastructure Command

Validate, diagnose, and fix test infrastructure issues without running any tests.

## Usage

```bash
/test-infra           # Check infrastructure status
/test-infra --fix     # Auto-fix detected issues
/test-infra --reset   # Full infrastructure reset
/test-infra --status  # Detailed status report
```

## Infrastructure Components

### 1. Supabase E2E Instance
- **Port Range**: 55321-55327
- **Location**: `apps/e2e`
- **Health Check**: REST API on port 55321

### 2. Development Servers
- **Web App**: Port 3000 (with alternatives 3100-3800)
- **Payload CMS**: Port 3020
- **E2E Shards**: Ports 3001-3009

### 3. Environment Files
- `apps/web/.env.test`
- `apps/e2e/.env.local`
- Required variables validation

### 4. Process Management
- Playwright processes
- Vitest processes
- Next.js dev servers
- Docker containers

## Validation Checks

```yaml
infrastructure_checks:
  supabase:
    - name: "Supabase E2E Status"
      command: "cd apps/e2e && npx supabase status"
      expected: "Running"
      fix: "npx supabase start"
      
  ports:
    - name: "Port Availability"
      ports: [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009]
      check: "lsof -i:PORT"
      fix: "kill -9 $(lsof -ti:PORT)"
      
  environment:
    - name: "Test Environment Files"
      files:
        - path: "apps/web/.env.test"
          required_vars:
            - NEXT_PUBLIC_SUPABASE_URL
            - NEXT_PUBLIC_SUPABASE_ANON_KEY
            - DATABASE_URL
        - path: "apps/e2e/.env.local"
          required_vars:
            - SUPABASE_URL
            - SUPABASE_ANON_KEY
            
  processes:
    - name: "Clean Processes"
      patterns: ["playwright", "vitest", "next-server"]
      check: "ps aux | grep PATTERN"
      fix: "pkill -f PATTERN"
      
  connectivity:
    - name: "Supabase REST API"
      url: "http://127.0.0.1:55321/rest/v1/"
      expected_status: 200
      
    - name: "Supabase Auth"
      url: "http://127.0.0.1:55321/auth/v1/health"
      expected_status: 200
```

## Auto-Fix Actions

When run with `--fix`, the following issues are automatically resolved:

### 1. Start Supabase
```bash
if ! curl -s http://127.0.0.1:55321/rest/v1/; then
    echo "🔧 Starting Supabase E2E..."
    cd apps/e2e && npx supabase start
    sleep 10  # Wait for services
fi
```

### 2. Clear Ports
```bash
echo "🔧 Clearing test ports..."
for port in $(seq 3000 3010); do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "  Clearing port $port..."
        kill -9 $(lsof -ti:$port) 2>/dev/null || true
    fi
done
```

### 3. Clean Processes
```bash
echo "🔧 Cleaning stuck processes..."
pkill -f "playwright|vitest|next-server" || true
docker ps -q --filter "name=supabase" | xargs -r docker kill 2>/dev/null || true
```

### 4. Fix Environment
```bash
if [ ! -f "apps/web/.env.test" ]; then
    echo "🔧 Creating .env.test from example..."
    cp apps/web/.env.example apps/web/.env.test
    # Update with test values
    sed -i 's|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321|' apps/web/.env.test
fi
```

## Reset Mode

Full infrastructure reset with `--reset`:

```bash
# 1. Stop everything
echo "🛑 Stopping all test infrastructure..."
cd apps/e2e && npx supabase stop --all
pkill -9 -f "playwright|vitest|next-server" || true

# 2. Clean Docker
echo "🐳 Cleaning Docker containers..."
docker ps -a | grep supabase | awk '{print $1}' | xargs -r docker rm -f
docker system prune -f

# 3. Clear temp files
echo "📁 Clearing temp files..."
rm -rf /tmp/e2e_*
rm -rf /tmp/.claude_test_*
rm -rf apps/e2e/test-results

# 4. Restart fresh
echo "🚀 Starting fresh infrastructure..."
cd apps/e2e && npx supabase start
```

## Status Report Format

```yaml
Test Infrastructure Status Report
==================================
Timestamp: 2024-01-15T10:30:00Z

Supabase E2E:
  Status: ✅ Running
  Version: 1.123.4
  Services:
    - REST API: ✅ http://127.0.0.1:55321
    - Auth: ✅ http://127.0.0.1:55322
    - Storage: ✅ http://127.0.0.1:55323
    - Realtime: ✅ http://127.0.0.1:55324
    - Database: ✅ postgresql://127.0.0.1:55325

Ports:
  Available: ✅ 3000-3010 clear
  In Use: None

Environment:
  apps/web/.env.test: ✅ Valid (8 variables)
  apps/e2e/.env.local: ✅ Valid (5 variables)

Processes:
  Playwright: ✅ None running
  Vitest: ✅ None running
  Next.js: ✅ None running

Docker:
  Containers: 7 Supabase containers running
  Memory: 1.2GB used
  CPU: 12% average

Recommendations:
  - All systems operational
  - Ready for test execution
```

## Common Issues & Solutions

### Issue: Supabase won't start
```bash
# Solution: Full Docker reset
docker stop $(docker ps -q --filter "name=supabase")
docker rm $(docker ps -aq --filter "name=supabase")
docker volume prune -f
cd apps/e2e && npx supabase start
```

### Issue: Port conflicts persist
```bash
# Solution: Find and kill specific process
lsof -i :3000 | grep LISTEN
# Note the PID and kill it specifically
kill -9 <PID>
```

### Issue: Environment variables missing
```bash
# Solution: Regenerate from example
cp apps/web/.env.example apps/web/.env.test
# Manually add test-specific values
```

## Integration with Test Commands

This infrastructure validation is automatically run by:
- `/test` - Full validation before test suite
- `/test-e2e` - E2E-specific validation
- CI/CD pipelines - Pre-test validation

## Benefits

- **Preventive Diagnostics**: Catch issues before tests fail
- **Automatic Fixes**: Resolve common issues without manual intervention
- **Clear Reporting**: Understand infrastructure state at a glance
- **Time Saving**: Avoid debugging test failures caused by infrastructure

## Notes

- Run this before test sessions to ensure clean state
- Use `--fix` for automatic resolution of common issues
- Use `--reset` when infrastructure is severely broken
- Infrastructure issues cause 80% of E2E test failures