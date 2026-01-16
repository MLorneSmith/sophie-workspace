# Alpha Event Streaming Implementation Plan

**Date:** 2026-01-12
**Status:** Validated - Ready for Implementation
**Research Sources:**
- `.ai/reports/research-reports/2026-01-12/multi-agent-orchestration-streaming-analysis.md`
- `.ai/reports/research-reports/2026-01-12/claude-code-hooks-research.md`

---

## Executive Summary

This plan outlines how to implement real-time event streaming from Claude Code sessions running in E2B sandboxes back to the Alpha orchestrator. The approach uses Claude Code's native hooks system combined with HTTP POST callbacks to a FastAPI event server.

**Key Insight:** Claude Code hooks fire at exact lifecycle points and receive structured JSON data via stdin. Hook scripts can POST this data to an external server for real-time monitoring.

---

## Problem Statement

The current Alpha orchestrator has limited visibility into what Claude Code sessions are doing inside E2B sandboxes:

1. **Stdout capture is unreliable** - Claude Code CLI doesn't output structured events
2. **Progress file polling is slow** - 30-second intervals miss real-time activity
3. **No immediate feedback** - Orchestrator can't react to events as they happen
4. **Stall detection is delayed** - Takes minutes to detect hung sessions

---

## Solution: Hook-Based HTTP Event Streaming

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ E2B Sandbox (Claude Code + /alpha:implement)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PostToolUse Hook → POST /api/events (every tool call)      │ │
│  │ SubagentStop Hook → POST /api/events (parallel tasks)      │ │
│  │ Stop Hook → POST /api/events (session complete)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTP POST (2-3 sec timeout)
┌─────────────────────────────────────────────────────────────────┐
│ FastAPI Event Server (local machine, port 9000)                  │
│  POST /api/events → Event Router → WebSocket broadcast          │
│                                  → PostgreSQL (optional)         │
│                                  → File logging                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Ink TUI or React Dashboard)                            │
│  Real-time event stream, sandbox status, progress bars          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Claude Code Hooks Available

### Hook Types for E2B Monitoring

| Hook | When It Fires | Use For | Frequency |
|------|---------------|---------|-----------|
| `PostToolUse` | After every tool call | **Heartbeats**, progress tracking | HIGH |
| `SubagentStop` | When Task tool completes | **Parallel task tracking** | MEDIUM |
| `Stop` | When Claude finishes | **Session completion** | MEDIUM |
| `PreToolUse` | Before tool calls | Optional validation | HIGH |

### Hook Configuration Levels

**1. Global Level** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "python3 heartbeat.py || true", "timeout": 3 }]
      }
    ]
  }
}
```

**2. Slash Command Level** (YAML frontmatter in `.claude/commands/*.md`):
```yaml
---
hooks:
  PostToolUse:
    - matcher: "TodoWrite"
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress.py || true"
          timeout: 3
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_complete.py || true"
          timeout: 3
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/feature_complete.py || true"
          timeout: 5
---
```

### Hook Payload (JSON via stdin)

```json
// PostToolUse receives:
{
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.ts" },
  "tool_response": { "success": true },
  "session_id": "abc123"
}

// SubagentStop receives:
{
  "session_id": "abc123",
  "stop_hook_active": false,
  "transcript_path": "/path/to/transcript.jsonl"
}
```

### Environment Variables Available

| Variable | Description |
|----------|-------------|
| `CLAUDE_PROJECT_DIR` | Project root directory |
| `CLAUDE_TOOL` | Name of the tool being used |
| `CLAUDE_SESSION_ID` | Current session identifier |
| `ORCHESTRATOR_URL` | (Custom) URL to POST events to |
| `E2B_SANDBOX_ID` | (Custom) Sandbox identifier |

---

## Implementation Components

### Component 1: FastAPI Event Server

**File:** `.ai/alpha/scripts/event-server.py`

```python
#!/usr/bin/env python3
"""FastAPI event server for Alpha orchestrator."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import json

app = FastAPI(title="Alpha Event Server")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory event storage (replace with PostgreSQL for persistence)
events: List[Dict[str, Any]] = []
ws_clients: List[WebSocket] = []

class Event(BaseModel):
    sandbox_id: str
    event_type: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    timestamp: str
    data: Optional[Dict[str, Any]] = None

@app.post("/api/events")
async def receive_event(event: Event):
    """Receive events from sandbox hook scripts."""
    event_dict = event.dict()
    event_dict["received_at"] = datetime.now().isoformat()
    events.append(event_dict)

    # Keep only last 1000 events in memory
    if len(events) > 1000:
        events.pop(0)

    # Broadcast to all WebSocket clients
    disconnected = []
    for ws in ws_clients:
        try:
            await ws.send_json({"type": "event", "event": event_dict})
        except Exception:
            disconnected.append(ws)

    for ws in disconnected:
        ws_clients.remove(ws)

    return {"status": "ok", "event_id": len(events)}

@app.get("/api/events")
async def get_events(sandbox_id: Optional[str] = None, limit: int = 100):
    """Get recent events, optionally filtered by sandbox."""
    filtered = events
    if sandbox_id:
        filtered = [e for e in events if e.get("sandbox_id") == sandbox_id]
    return {"events": filtered[-limit:]}

@app.get("/api/events/stream")
async def event_stream(sandbox_id: Optional[str] = None):
    """Server-Sent Events stream for real-time updates."""
    # Implement SSE if WebSocket not suitable
    pass

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time event streaming."""
    await websocket.accept()
    ws_clients.append(websocket)
    print(f"✅ WebSocket connected | Total: {len(ws_clients)}")

    try:
        while True:
            # Keep alive - receive pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_clients.remove(websocket)
        print(f"❌ WebSocket disconnected | Total: {len(ws_clients)}")

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "websocket_clients": len(ws_clients),
        "events_in_memory": len(events)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
```

### Component 2: Hook Script (HTTP POST)

**File:** `.claude/hooks/event_reporter.py`

```python
#!/usr/bin/env python3
"""Universal hook script that POSTs events to orchestrator."""

import json
import sys
import urllib.request
import os
from datetime import datetime, timezone

def main():
    # Configuration from environment
    orchestrator_url = os.environ.get("ORCHESTRATOR_URL", "http://localhost:9000")
    sandbox_id = os.environ.get("E2B_SANDBOX_ID", "unknown")
    event_type = os.environ.get("HOOK_EVENT_TYPE", "unknown")

    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        input_data = {}

    # Build event payload
    event = {
        "sandbox_id": sandbox_id,
        "event_type": event_type,
        "tool_name": input_data.get("tool_name"),
        "tool_input": input_data.get("tool_input"),
        "tool_response": input_data.get("tool_response"),
        "session_id": input_data.get("session_id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": input_data
    }

    # POST to orchestrator (fire and forget)
    try:
        req = urllib.request.Request(
            f"{orchestrator_url}/api/events",
            data=json.dumps(event).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            pass
    except Exception as e:
        # Log to stderr but don't fail
        print(f"Event POST failed: {e}", file=sys.stderr)

    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Component 3: Updated Implement Command Hooks

**File:** `.claude/commands/alpha/implement.md` (hooks section)

```yaml
---
hooks:
  PostToolUse:
    - matcher: ""
      hooks:
        - type: command
          command: "HOOK_EVENT_TYPE=post_tool_use python3 $CLAUDE_PROJECT_DIR/.claude/hooks/event_reporter.py || true"
          timeout: 3
    - matcher: "TodoWrite"
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress.py || true"
          timeout: 3
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: "HOOK_EVENT_TYPE=subagent_stop python3 $CLAUDE_PROJECT_DIR/.claude/hooks/event_reporter.py || true"
          timeout: 3
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_complete.py || true"
          timeout: 3
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: "HOOK_EVENT_TYPE=stop python3 $CLAUDE_PROJECT_DIR/.claude/hooks/event_reporter.py || true"
          timeout: 5
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/feature_complete.py || true"
          timeout: 5
---
```

### Component 4: Sandbox Environment Setup

**File:** `.ai/alpha/scripts/lib/sandbox.ts` (update `createSandbox`)

```typescript
// In createSandbox function, add to envs:
const envs = {
    ...getAllEnvVars(),
    // Event server configuration
    ORCHESTRATOR_URL: process.env.ORCHESTRATOR_URL || `http://host.docker.internal:9000`,
    E2B_SANDBOX_ID: sandbox.sandboxId,
};
```

### Component 5: Orchestrator Integration

**File:** `.ai/alpha/scripts/lib/orchestrator.ts` (update to start event server)

```typescript
// In orchestrate function, before creating sandboxes:

// Start event server in background
const eventServerProcess = spawn('python3', [
    path.join(getProjectRoot(), '.ai/alpha/scripts/event-server.py')
], {
    detached: true,
    stdio: 'ignore'
});

// Wait for server to be ready
await waitForServer('http://localhost:9000/health', 10000);

log('✅ Event server started on port 9000');
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (2-3 hours)

1. ✅ Create FastAPI event server (`event-server.py`)
2. ✅ Create universal hook script (`event_reporter.py`)
3. ✅ Update sandbox creation to pass environment variables
4. ✅ Test HTTP POST from hook to server

### Phase 2: Hook Integration (2-3 hours)

1. Update `/alpha:implement` hooks to use event reporter
2. Keep existing progress file updates as fallback
3. Add PreToolUse hook for tool validation (optional)
4. Test with single sandbox execution

### Phase 3: UI Integration (3-4 hours)

1. Add WebSocket client to existing Ink TUI
2. Display real-time events in sandbox panels
3. Show tool usage, progress, and heartbeats
4. Add connection status indicator

### Phase 4: Robustness (2-3 hours)

1. Add graceful fallback when event server unavailable
2. Implement event persistence (PostgreSQL or file)
3. Add retry logic for failed HTTP posts
4. Test with multiple parallel sandboxes

---

## Event Types

| Event Type | Source Hook | Data Included |
|------------|-------------|---------------|
| `post_tool_use` | PostToolUse | tool_name, tool_input, tool_response |
| `subagent_stop` | SubagentStop | session_id, transcript_path |
| `stop` | Stop | session_id, final status |
| `task_progress` | PostToolUse (TodoWrite) | task_id, status, completed_tasks |
| `heartbeat` | PostToolUse | timestamp, tool_count |

---

## Guidelines

### Do's

- ✅ Always use `|| true` to prevent hook failures from blocking Claude
- ✅ Keep HTTP timeouts short (2-3 seconds)
- ✅ Use `urllib.request` (built-in, no dependencies)
- ✅ Fail silently on HTTP errors
- ✅ Include sandbox_id in all events for routing
- ✅ Use atomic file writes for any file-based fallback

### Don'ts

- ❌ Don't use `requests` library (requires installation)
- ❌ Don't let hook failures crash Claude Code
- ❌ Don't use long timeouts (blocks Claude execution)
- ❌ Don't skip the fallback progress file mechanism
- ❌ Don't assume event server is always available

---

## Testing Plan

### Unit Tests

1. Event server endpoint tests (POST, GET, WebSocket)
2. Hook script tests (mock stdin, verify HTTP call)
3. Environment variable handling tests

### Integration Tests

1. Single sandbox with hooks → event server → WebSocket
2. Multiple parallel sandboxes with event routing
3. Event server unavailable (graceful degradation)
4. High-frequency events (100+ per minute)

### Manual Testing

1. Run `/alpha:implement` locally with event server
2. Verify events appear in real-time
3. Kill event server mid-execution (should continue)
4. Check fallback progress file still works

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event latency | < 500ms from hook fire to UI update |
| Hook overhead | < 100ms per hook execution |
| Event delivery rate | > 99% when server available |
| Graceful degradation | 100% continued operation when server down |

---

## Related Files

- Research: `.ai/reports/research-reports/2026-01-12/multi-agent-orchestration-streaming-analysis.md`
- Research: `.ai/reports/research-reports/2026-01-12/claude-code-hooks-research.md`
- Current hooks: `.claude/hooks/task_progress.py`
- Current hooks: `.claude/hooks/subagent_complete.py`
- Current hooks: `.claude/hooks/feature_complete.py`
- Implement command: `.claude/commands/alpha/implement.md`
- Orchestrator: `.ai/alpha/scripts/lib/orchestrator.ts`
- Sandbox: `.ai/alpha/scripts/lib/sandbox.ts`

---

## Next Steps

1. Review this plan and confirm approach
2. Implement Phase 1 (Core Infrastructure)
3. Test with single sandbox
4. Iterate based on results
