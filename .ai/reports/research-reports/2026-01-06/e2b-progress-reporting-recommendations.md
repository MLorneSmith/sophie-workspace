# E2B Progress Reporting Recommendations

**Date**: 2026-01-06
**Context**: Improving real-time progress feedback in `alpha-orchestrator.ts`

## Executive Summary

Based on E2B SDK research, the current `onStdout`/`onStderr` callbacks are the **correct approach** for real-time streaming. The perceived delay is caused by application-level buffering in Claude Code, not E2B. Here are 5 concrete recommendations to improve the user experience.

---

## Research Findings Summary

| Aspect | Finding |
|--------|---------|
| SDK Streaming | `onStdout`/`onStderr` are the ONLY real-time options |
| Buffering Source | Process-level (Claude), not E2B SDK |
| E2B CLI Logs | System logs only, NOT stdout/stderr |
| PTY Mode | Available but complex - provides unbuffered output |
| Programmatic Logs | No `sandbox.getLogs()` API exists |

---

## Recommendations

### 1. Write Progress to File + Polling (RECOMMENDED)

**Problem**: Claude Code buffers its output, causing delays in the `onStdout` stream.

**Solution**: Instead of relying solely on stdout streaming, have `/alpha:implement` write progress to a file that the orchestrator polls periodically.

**Implementation**:

```typescript
// In alpha-orchestrator.ts - add polling alongside streaming
async function runFeatureWithProgressPolling(
  sandbox: Sandbox,
  featureId: number,
): Promise<ProgressReport> {
  // Start command in background
  const command = await sandbox.commands.run(
    `stdbuf -oL -eL run-claude "/alpha:implement ${featureId}"`,
    {
      background: true,
      timeoutMs: 1800000,
      envs: getAllEnvVars(),
      onStdout: (data) => {
        // Stream output as backup
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            process.stdout.write(`   │ ${line}\n`);
          }
        }
      },
    }
  );

  // Poll progress file every 10 seconds
  const pollInterval = setInterval(async () => {
    try {
      const result = await sandbox.commands.run(
        `cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
        { timeoutMs: 5000 }
      );
      if (result.stdout) {
        const progress = JSON.parse(result.stdout);
        displayProgressUpdate(progress);
      }
    } catch {
      // Ignore polling errors
    }
  }, 10000);

  // Wait for completion
  const result = await command.wait();
  clearInterval(pollInterval);

  return parseResult(result);
}

function displayProgressUpdate(progress: any) {
  const current = progress.current_task;
  const completed = progress.completed_tasks?.length || 0;
  const total = progress.tasks_total || '?';

  console.log(`   📊 Progress: ${completed}/${total} tasks`);
  if (current) {
    console.log(`   │ Current: ${current.id} - ${current.name}`);
  }
}
```

**Pros**:
- Works regardless of Claude's output buffering
- Provides consistent, structured progress data
- Minimal changes to existing code

**Cons**:
- Adds polling overhead (minimal)
- 10-second granularity

---

### 2. Enhanced Progress File Format

**Current Format** (`.initiative-progress.json`):
```json
{
  "current_task": { "id": "T5", "name": "..." },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "status": "in_progress"
}
```

**Enhanced Format** - Add more granular info:
```json
{
  "feature": {
    "issue_number": 1367,
    "title": "Dashboard Page & Grid Layout"
  },
  "current_task": {
    "id": "T5",
    "name": "Create dashboard data loader",
    "status": "in_progress",
    "started_at": "2026-01-06T10:00:00Z",
    "verification_attempts": 0
  },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "failed_tasks": [],
  "current_group": {
    "id": 2,
    "name": "Data Layer",
    "tasks_total": 4,
    "tasks_completed": 1
  },
  "context_usage_percent": 45,
  "status": "in_progress",
  "last_commit": "abc1234",
  "last_update": "2026-01-06T10:05:00Z",
  "entries": [
    {
      "timestamp": "2026-01-06T10:05:00Z",
      "type": "task_started",
      "message": "Started T5: Create dashboard data loader"
    }
  ]
}
```

**Update `/alpha:implement` to write progress more frequently** - after each task starts, after each verification attempt, after each completion.

---

### 3. Use `script` Command for Forced Unbuffered Output

If real-time stdout is critical, wrap the command in `script`:

```typescript
// Force unbuffered output using script command
const result = await sandbox.commands.run(
  `script -q -c 'run-claude "/alpha:implement ${featureId}"' /dev/null`,
  {
    timeoutMs: 1800000,
    envs: getAllEnvVars(),
    onStdout: (data) => {
      // Will receive output more frequently
      process.stdout.write(`   │ ${data}`);
    },
  }
);
```

**Note**: `script` creates a pseudo-terminal that prevents buffering, but may include ANSI escape codes.

---

### 4. Background Mode with Heartbeat Pattern

Use E2B's background mode for better control over long-running processes:

```typescript
async function runWithHeartbeat(
  sandbox: Sandbox,
  featureId: number
): Promise<ProgressReport> {
  const command = await sandbox.commands.run(
    `stdbuf -oL -eL run-claude "/alpha:implement ${featureId}"`,
    {
      background: true,
      timeoutMs: 1800000,
      envs: getAllEnvVars(),
      onStdout: streamOutput,
      onStderr: streamError,
    }
  );

  console.log(`   📡 Started process (PID: ${command.pid})`);

  // Heartbeat check every 30 seconds
  while (true) {
    await sleep(30000);

    // Check if process is still running
    const psResult = await sandbox.commands.run(
      `ps -p ${command.pid} -o pid= 2>/dev/null || echo "done"`,
      { timeoutMs: 5000 }
    );

    if (psResult.stdout.trim() === 'done') {
      break;
    }

    // Show resource usage
    const statsResult = await sandbox.commands.run(
      `ps -p ${command.pid} -o %cpu,%mem,etime --no-headers 2>/dev/null`,
      { timeoutMs: 5000 }
    );
    if (statsResult.stdout.trim()) {
      console.log(`   💓 Heartbeat: ${statsResult.stdout.trim()}`);
    }
  }

  return await command.wait();
}
```

---

### 5. PTY Mode for True Real-Time (Advanced)

For maximum real-time feedback, use PTY mode:

```typescript
async function runWithPty(
  sandbox: Sandbox,
  featureId: number
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let output = '';

    const pty = await sandbox.pty.create({
      size: { rows: 40, cols: 120 },
      cwd: WORKSPACE_DIR,
      envs: getAllEnvVars(),
      timeout: 1800,
      onData: (data: string) => {
        // Raw PTY output - truly unbuffered
        output += data;

        // Stream to console (may include ANSI codes)
        process.stdout.write(data);

        // Check for completion markers
        if (output.includes('=== Implementation Complete ===')) {
          resolve();
        }
      },
    });

    // Send the command
    await sandbox.pty.sendInput(
      pty.pid,
      new TextEncoder().encode(`run-claude "/alpha:implement ${featureId}"\n`)
    );

    // Timeout fallback
    setTimeout(() => {
      sandbox.pty.kill(pty.pid);
      reject(new Error('PTY timeout'));
    }, 1800000);
  });
}
```

**Pros**: True character-by-character streaming
**Cons**: Complex parsing, ANSI codes, harder completion detection

---

## Recommended Implementation Priority

| Priority | Recommendation | Effort | Impact |
|----------|----------------|--------|--------|
| 1 | Progress file polling (Rec #1) | Medium | High |
| 2 | Enhanced progress format (Rec #2) | Low | Medium |
| 3 | `script` wrapper (Rec #3) | Low | Medium |
| 4 | Background + heartbeat (Rec #4) | Medium | Medium |
| 5 | PTY mode (Rec #5) | High | High |

**Recommended Approach**: Implement #1 (polling) + #2 (enhanced format) for reliable progress updates. Add #3 (`script` wrapper) for improved stdout streaming.

---

## Sample Implementation

Here's a combined approach adding polling to the current orchestrator:

```typescript
// Add to alpha-orchestrator.ts

const POLL_INTERVAL_MS = 10000; // 10 seconds

async function runFeatureImplementation(
  sandbox: Sandbox,
  manifest: InitiativeManifest,
  featureId: number,
  resumeFromTask?: string,
): Promise<ProgressReport> {
  const feature = manifest.features.find((f) => f.id === featureId);

  // ... existing setup code ...

  let lastProgressUpdate = '';
  let pollInterval: NodeJS.Timeout | null = null;

  // Start polling for progress updates
  pollInterval = setInterval(async () => {
    try {
      const result = await sandbox.commands.run(
        `cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
        { timeoutMs: 5000 }
      );

      if (result.stdout && result.stdout !== lastProgressUpdate) {
        lastProgressUpdate = result.stdout;
        const progress = JSON.parse(result.stdout);

        // Display structured progress
        const completed = progress.completed_tasks?.length || 0;
        const total = feature?.task_count || '?';
        const current = progress.current_task;

        console.log(`   ┌─ Progress Update ─────────────────────────`);
        console.log(`   │ Tasks: ${completed}/${total} completed`);
        if (current) {
          console.log(`   │ Current: [${current.id}] ${current.name}`);
          console.log(`   │ Status: ${current.status}`);
        }
        if (progress.context_usage_percent) {
          console.log(`   │ Context: ${progress.context_usage_percent}%`);
        }
        console.log(`   └────────────────────────────────────────────`);
      }
    } catch {
      // Ignore polling errors
    }
  }, POLL_INTERVAL_MS);

  try {
    // Run with script wrapper for better unbuffering
    const result = await sandbox.commands.run(
      `script -q -c 'run-claude "/alpha:implement ${featureId}"' /dev/null`,
      {
        timeoutMs: 1800000,
        envs: getAllEnvVars(),
        onStdout: (data) => {
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              process.stdout.write(`   │ ${line}\n`);
            }
          }
        },
        onStderr: (data) => {
          process.stderr.write(`   │ [ERR] ${data}`);
        },
      }
    );

    // ... existing result handling ...

  } finally {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  }
}
```

---

## E2B CLI Logging (Not Useful for This Case)

The `e2b sandbox logs` command provides **sandbox-level system logs**, not stdout/stderr from commands:

```bash
# Shows system events, not command output
e2b sandbox logs sbx_abc123

# Example output:
# [INFO] Sandbox started
# [INFO] Port 8080 exposed
# [WARN] Memory usage high
```

This is useful for debugging sandbox issues but **not for tracking Claude Code progress**.

---

## Conclusion

The current `onStdout`/`onStderr` approach is correct. To improve user experience:

1. **Add progress file polling** - Reliable, structured updates every 10 seconds
2. **Enhance progress file format** - More granular information
3. **Consider `script` wrapper** - May reduce buffering

The key insight is that buffering happens at the Claude Code process level, not E2B. Polling the progress file bypasses this limitation entirely.
