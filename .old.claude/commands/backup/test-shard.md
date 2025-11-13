---
name: test-shard
description: Run a specific E2E test shard directly
usage: /test-shard <shard-number>
arguments:
  - shard-number: Shard to run (1-9)
options:
  - headed: Run with visible browser
  - debug: Enable debug output
  - retry: Retry on failure
---

# Test Shard Command

Run a specific E2E test shard in isolation for targeted testing and debugging.

## Usage

```bash
/test-shard 3              # Run shard 3 (Admin tests)
/test-shard 2 --headed     # Run shard 2 with visible browser
/test-shard 7 --debug      # Run shard 7 with debug output
/test-shard 1 --retry      # Run shard 1 with retry on failure
```

## Direct Execution

This command runs a single E2E shard without any orchestration, perfect for debugging specific test failures.

### Execution Flow

```bash
# 1. Validate shard number (1-9)
SHARD_NUM=$1
if [[ $SHARD_NUM -lt 1 || $SHARD_NUM -gt 9 ]]; then
    echo "❌ Invalid shard number. Must be 1-9"
    exit 1
fi

# 2. Check infrastructure
echo "🔍 Checking infrastructure for shard $SHARD_NUM..."
curl -s http://127.0.0.1:55321/rest/v1/ || {
    echo "⚠️ Supabase not running. Starting..."
    cd apps/e2e && npx supabase start
}

# 3. Clean processes for this shard
pkill -f "test:shard${SHARD_NUM}" || true

# 4. Set options
[[ "$HEADED" == "true" ]] && export HEADED=true
[[ "$DEBUG" == "true" ]] && export DEBUG=pw:api
[[ "$RETRY" == "true" ]] && MAX_RETRIES=2 || MAX_RETRIES=1

# 5. Run the shard
for attempt in $(seq 1 $MAX_RETRIES); do
    echo "🚀 Running shard $SHARD_NUM (attempt $attempt)..."
    pnpm --filter web-e2e test:shard${SHARD_NUM}
    if [ $? -eq 0 ]; then
        echo "✅ Shard $SHARD_NUM passed!"
        exit 0
    fi
done

echo "❌ Shard $SHARD_NUM failed after $MAX_RETRIES attempts"
exit 1
```

## Shard Details

| Shard | Test Focus | Command | Tests |
|-------|------------|---------|-------|
| 1 | Accessibility (Large) | `test:shard1` | 13 |
| 2 | Authentication | `test:shard2` | 10 |
| 3 | Admin | `test:shard3` | 9 |
| 4 | Smoke Tests | `test:shard4` | 9 |
| 5 | Accessibility (Simple) | `test:shard5` | 6 |
| 6 | Team Accounts | `test:shard6` | 6 |
| 7 | Account + Invitations | `test:shard7` | 8 |
| 8 | Quick Tests | `test:shard8` | 3 |
| 9 | Billing | `test:shard9` | 2 |

## Benefits

- **Surgical Testing**: Test exactly what you need
- **Fast Debugging**: Isolate problematic tests
- **Resource Efficient**: Run only one shard
- **CI Integration**: Re-run failed shards only

## Examples

### Debug authentication issues

```bash
/test-shard 2 --headed --debug
```

### Quick smoke test

```bash
/test-shard 4
```

### Retry flaky billing tests

```bash
/test-shard 9 --retry
```

### Test accessibility with visible browser

```bash
/test-shard 1 --headed
```

## Troubleshooting

### Infrastructure Issues

```bash
# If shard fails with "webServer timeout"
cd apps/e2e && npx supabase start
/test-shard $SHARD_NUM

# If port conflicts occur
lsof -ti:3000-3010 | xargs kill -9
/test-shard $SHARD_NUM
```

### Debug Mode

```bash
# Enable maximum debugging
export DEBUG=pw:api
export PWDEBUG=1
/test-shard $SHARD_NUM --headed --debug
```

## Expected Output

```
🎯 Testing Shard 3 (Admin)
==========================
🔍 Infrastructure: ✅ Ready
🚀 Running 9 tests...

✅ admin › user management › list users
✅ admin › user management › create user
✅ admin › user management › edit user
✅ admin › user management › delete user
✅ admin › settings › update config
✅ admin › settings › view logs
✅ admin › dashboard › view metrics
✅ admin › dashboard › export data
✅ admin › security › manage roles

📊 Shard 3 Results:
   Passed: 9/9
   Duration: 2m 58s
   Status: ✅ SUCCESS
```

## Notes

- Single shard execution is ideal for debugging
- Infrastructure must be running (Supabase)
- Each shard runs independently
- Use `/test-e2e` to run all shards in parallel
