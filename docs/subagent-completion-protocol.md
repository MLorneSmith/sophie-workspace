# Sub-Agent Completion Protocol

When you complete a task, write a completion file to notify Sophie.

## File Location

```
~/clawd/state/completions/{runId}.json
```

Use your run ID from the environment or generate a UUID if not available.

## File Format

```json
{
  "agent": "coder",
  "task": "Brief description of the task",
  "status": "done",
  "result": "Brief summary of what was accomplished",
  "timestamp": "2026-02-25T20:42:43Z",
  "runtime_seconds": 120,
  "sessionKey": "your-session-key-if-known"
}
```

## Status Values

- `done` — Task completed successfully
- `error` — Task failed with an error
- `blocked` — Task blocked, needs human input

## Example

```bash
cat > ~/clawd/state/completions/$(uuidgen | tr '[:upper:]' '[:lower:]').json << 'EOF'
{
  "agent": "coder",
  "task": "Implement user authentication",
  "status": "done",
  "result": "Added JWT auth with refresh tokens. PR #123 created.",
  "timestamp": "2026-02-25T21:00:00Z",
  "runtime_seconds": 180
}
EOF
```

## When to Write

- **Always** write a completion file when your task finishes
- Write it as your **last action** before the final response
- This is critical for Sophie to know your work is done

## Why This Matters

The OpenClaw announce system is unreliable. Writing to a file ensures Sophie gets notified.
