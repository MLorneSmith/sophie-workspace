# Agent Logger Integration Guide

## Quick Start for Test Command

The agent logger is designed to automatically track all agent executions when the Task tool is used.

## How to Enable Logging in Test Command

When `/test` command uses the Task tool to execute test-orchestrator:

```typescript
import { executeTaskWithLogging, initializeTestLogging, generateTestReport } from '.claude/utils/agent-task-logger';

// 1. Initialize logging at start
await initializeTestLogging();

// 2. Wrap Task tool execution with logging
const result = await executeTaskWithLogging({
  subagent_type: "test-orchestrator",
  description: "Execute comprehensive test suite",
  prompt: "..."
}, originalTaskExecutor);

// 3. Generate report after completion
await generateTestReport();
```

## Enable Debug Mode

Set environment variable for verbose logging:

```bash
export DEBUG_TEST=true
/test
```

## View Logs After Execution

### Using the CLI viewer:

```bash
# View all recent logs
cd .claude/utils && pnpm tsx agent-log-viewer.ts view

# View logs for specific agent
cd .claude/utils && pnpm tsx agent-log-viewer.ts view --agent-id <agent-id>

# Follow logs in real-time
cd .claude/utils && pnpm tsx agent-log-viewer.ts view --follow

# Analyze performance
cd .claude/utils && pnpm tsx agent-log-viewer.ts analyze

# Find errors
cd .claude/utils && pnpm tsx agent-log-viewer.ts errors

# Show execution tree
cd .claude/utils && pnpm tsx agent-log-viewer.ts tree <session-id>
```

### Export logs:

```bash
# Export as JSON
cd .claude/utils && pnpm tsx agent-log-viewer.ts export json test-logs.json

# Export as CSV
cd .claude/utils && pnpm tsx agent-log-viewer.ts export csv test-logs.csv
```

## Log Storage Locations

- **JSON Logs**: `.claude/logs/agents/[date]/[session-id]/[agent-id].jsonl`
- **SQLite Database**: `.claude/logs/agents/agent-logs.db`
- **Reports**: `.claude/logs/agents/reports/test-report-[date].json`

## What Gets Logged

For each agent execution:
- Start/completion timestamps
- All tool calls with parameters and results
- Decision points
- Errors with stack traces
- Performance metrics (duration, memory)
- Parent-child relationships
- Execution context and metadata

## Integration in Claude Code

When Claude uses the `/test` command, the logging will automatically capture:

1. **test-orchestrator** execution
2. **unit-test-agent** delegation and results
3. **e2e-parallel-agent** with all 9 shards
4. Tool calls within each agent
5. Any errors or failures

## Example Log Output

```
[10:23:45.123] 🚀 Agent started: test-orch
[10:23:45.234] 🔧 Tool called: TodoWrite by test-orch
[10:23:45.456] 🔧 Tool called: Bash by test-orch
[10:23:46.789] 🔧 Tool called: Task by test-orch
[10:23:46.890] 🚀 Agent started: unit-test
[10:23:47.012] 🔧 Tool called: Bash by unit-test
[10:24:15.123] ✅ Agent completed: unit-test (28.2s)
[10:24:15.234] 🔧 Tool called: Task by test-orch
[10:24:15.345] 🚀 Agent started: e2e-paral
...
```

## Performance Analysis Output

```
📊 Performance Analysis

Agent ID          Duration (ms)  Tool Calls  Decisions  Errors
test-orchestrat   45000          12          5          0
unit-test-agent   28000          8           2          0
e2e-parallel-ag   120000         45          9          1

🔧 Tool Usage

Tool              Calls  Avg Duration  Total Duration
Bash              65     1500ms        97500ms
TodoWrite         12     50ms          600ms
Task              2      74000ms       148000ms
```

## Debugging Failed Tests

When tests fail, use the error analyzer:

```bash
# Find all errors
cd .claude/utils && pnpm tsx agent-log-viewer.ts errors

# Filter by pattern
cd .claude/utils && pnpm tsx agent-log-viewer.ts errors --pattern "timeout"

# Get errors for specific session
cd .claude/utils && pnpm tsx agent-log-viewer.ts errors --session-id <id>
```

## Best Practices

1. **Enable logging by default** for test commands to track performance over time
2. **Use debug mode** when troubleshooting failures
3. **Review execution trees** to understand agent orchestration
4. **Monitor tool call patterns** to identify optimization opportunities
5. **Archive old logs** periodically (automatic after 30 days)

## Troubleshooting

### Logs not appearing?
- Check if `.claude/logs/agents/` directory exists
- Verify SQLite is installed: `npm list sqlite3`
- Check permissions on log directory

### Too many logs?
- Logs auto-rotate after 30 days
- Manually clean: `rm -rf .claude/logs/agents/2024-*`

### Performance impact?
- Logging adds <5ms overhead per operation
- Disable debug mode for production: `unset DEBUG_TEST`

## Next Steps

The logger is ready to use. When the `/test` command is invoked:

1. The Task tool execution will be automatically wrapped with logging
2. All subagent activities will be tracked
3. Results will be aggregated in reports
4. Use the CLI viewer to analyze execution patterns

This provides complete visibility into test execution without requiring any changes to existing agents.