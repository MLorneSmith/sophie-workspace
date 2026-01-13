# Feature: Alpha Event Streaming System

## Feature Description

Implement a real-time event streaming system for the Alpha Autonomous Coding workflow that enables the orchestrator to receive live updates from Claude Code sessions running in E2B sandboxes. The system uses Claude Code's native hooks (PostToolUse, SubagentStop, Stop) to capture events and HTTP POST them to a FastAPI server, which broadcasts via WebSocket to the existing Ink TUI. This replaces the current 5-second file polling with sub-second event delivery while maintaining file-based fallback for resilience.

## User Story

As a developer running the Alpha orchestrator
I want to see real-time updates from Claude Code sessions in E2B sandboxes
So that I can monitor progress, detect stalls immediately, and understand what the AI agents are doing without waiting for polling intervals

## Problem Statement

The current Alpha orchestrator has limited visibility into Claude Code sessions running in E2B sandboxes:

1. **5-second polling latency** - File-based polling misses real-time activity
2. **No immediate feedback** - Cannot react to events as they happen
3. **Slow stall detection** - Takes minutes to detect hung sessions (heartbeat checks every 10 minutes)
4. **Limited context** - Only tool names tracked, not detailed event data
5. **Stdout capture unreliable** - Claude Code CLI doesn't output structured events

## Solution Statement

Implement a hook-based HTTP event streaming architecture that:

1. **Uses Claude Code native hooks** - PostToolUse, SubagentStop, Stop hooks fire at exact lifecycle points
2. **HTTP POST to FastAPI server** - Events posted with 2-3 second timeout, fail silently
3. **WebSocket broadcasting** - Server broadcasts events to all connected UI clients
4. **Integrates with existing Ink TUI** - Add WebSocket reader alongside file polling
5. **Maintains fallback mechanism** - File polling continues as resilient backup

## Relevant Files

### Existing Files to Modify

- `.claude/commands/alpha/implement.md` - Add event streaming hooks to YAML frontmatter
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Add WebSocket event source alongside file polling
- `.ai/alpha/scripts/ui/types.ts` - Add event streaming types (WebSocketEvent, EventServerStatus)
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Display real-time events from stream
- `.ai/alpha/scripts/ui/components/EventLog.tsx` - Enhance to show streamed events
- `.ai/alpha/scripts/lib/orchestrator.ts` - Start event server before creating sandboxes
- `.ai/alpha/scripts/lib/sandbox.ts` - Pass ORCHESTRATOR_URL and E2B_SANDBOX_ID env vars
- `.claude/hooks/heartbeat.py` - Enhance to POST events instead of just updating file

### New Files

- `.ai/alpha/scripts/event-server.py` - FastAPI server with WebSocket broadcasting
- `.claude/hooks/event_reporter.py` - Universal hook script that POSTs events to server
- `.claude/hooks/task_progress_stream.py` - Enhanced task progress hook with streaming
- `.claude/hooks/subagent_complete_stream.py` - Enhanced subagent hook with streaming
- `.claude/hooks/feature_complete_stream.py` - Enhanced feature complete hook with streaming
- `.ai/alpha/scripts/ui/hooks/useEventStream.ts` - React hook for WebSocket event subscription
- `.ai/alpha/scripts/ui/components/EventStreamStatus.tsx` - Connection status indicator component

## Impact Analysis

### Dependencies Affected

**New Dependencies Required:**
- `fastapi` (Python) - Event server framework
- `uvicorn` (Python) - ASGI server for FastAPI
- `websockets` (Python) - WebSocket support for FastAPI
- No new npm dependencies needed - existing Ink setup supports WebSocket via native Node.js `ws`

**Packages Consuming This Feature:**
- `.ai/alpha/scripts/` - Orchestrator scripts
- `.claude/hooks/` - Hook scripts executed in sandboxes
- `.claude/commands/alpha/` - Alpha workflow commands

### Risk Assessment

**Medium Risk** - This feature:
- Touches multiple areas (hooks, orchestrator, UI)
- Requires network coordination between sandboxes and local machine
- Adds new Python dependencies for event server
- Has fallback mechanism that limits impact of failures

**Mitigations:**
- All hooks use `|| true` to prevent failures from blocking Claude Code
- File polling remains as primary fallback
- Event server failure is gracefully handled (logged, not crash)
- Short HTTP timeouts (2-3 seconds) prevent blocking

### Backward Compatibility

- Existing file-based progress tracking continues unchanged
- Hooks fail silently if event server unavailable
- UI falls back to file polling if WebSocket disconnects
- No breaking changes to orchestrator CLI interface

### Performance Impact

**Positive Impacts:**
- Reduced file I/O (less frequent polling needed)
- Sub-second event delivery vs 5-second polling
- Immediate stall detection (2 minutes vs 10 minutes)

**Overhead:**
- HTTP POST per tool call (~50-100ms each, async)
- WebSocket connection per UI client
- Event server memory usage (~50MB for Python process)

**Mitigations:**
- HTTP timeouts of 2-3 seconds prevent blocking
- Events buffered in memory (last 1000, then rotation)
- WebSocket broadcast is async

### Security Considerations

**Network Exposure:**
- Event server listens on localhost:9000 (not externally exposed)
- No authentication required (local development tool)
- CORS configured for localhost only

**Data Sensitivity:**
- Tool inputs/outputs may contain code snippets
- No credentials or secrets in event payloads
- Events stored in memory only (not persisted to disk by default)

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/alpha-event-streaming`
- [x] Review existing similar features for patterns (Ink TUI, progress polling)
- [x] Identify all integration points (hooks, orchestrator, UI)
- [x] Define success metrics (latency, delivery rate, graceful degradation)
- [x] Confirm feature doesn't duplicate existing functionality
- [x] Verify all required dependencies are available
- [ ] Plan feature flag strategy (not needed - graceful fallback built-in)

## Documentation Updates Required

- `.ai/alpha/docs/alpha-implementation-system.md` - Add event streaming architecture section
- `CLAUDE.md` - Add event server configuration to environment variables section
- `.ai/ai_docs/context-docs/infrastructure/` - Create `alpha-event-streaming.md` context doc

## Rollback Plan

**How to disable:**
1. Remove hook entries from `.claude/commands/alpha/implement.md` YAML frontmatter
2. Stop event server process if running
3. UI automatically falls back to file polling when WebSocket unavailable

**Monitoring:**
- Event server exposes `/health` endpoint for status checks
- UI displays connection status indicator (green/yellow/red)
- Logs written to stderr on hook failures

**Graceful degradation:**
- Hooks fail silently with `|| true`
- UI shows "Event stream disconnected" but continues working
- File polling remains functional throughout

## Implementation Plan

### Phase 1: Core Infrastructure

Create the FastAPI event server and basic hook infrastructure. This phase establishes the foundation for event streaming without modifying existing functionality.

**Deliverables:**
- FastAPI event server with POST endpoint and WebSocket broadcasting
- Universal hook script for HTTP POST
- Environment variable configuration for sandbox-to-server communication

### Phase 2: Hook Integration

Update the `/alpha:implement` command to use the new event streaming hooks. Existing hooks continue to work alongside new streaming functionality.

**Deliverables:**
- Updated implement.md with event streaming hooks in YAML frontmatter
- Enhanced task_progress hook with streaming
- Enhanced subagent_complete hook with streaming
- Enhanced feature_complete hook with streaming

### Phase 3: UI Integration

Connect the existing Ink TUI to the WebSocket event stream. File polling remains as fallback.

**Deliverables:**
- useEventStream React hook for WebSocket subscription
- EventStreamStatus component for connection indicator
- Updated useProgressPoller to merge file and WebSocket data
- Enhanced SandboxColumn to display streamed events

## Step by Step Tasks

### Step 1: Create FastAPI Event Server

**Files:**
- Create `.ai/alpha/scripts/event-server.py`

**Tasks:**
- Implement FastAPI app with CORS middleware
- Add POST `/api/events` endpoint for receiving events
- Add GET `/api/events` endpoint for querying recent events
- Implement WebSocket `/ws` endpoint for real-time streaming
- Add `/health` endpoint for status checks
- Implement in-memory event storage with rotation (last 1000 events)
- Add WebSocket client management (connect/disconnect tracking)

**Verification:**
```bash
python3 .ai/alpha/scripts/event-server.py &
curl http://localhost:9000/health
curl -X POST http://localhost:9000/api/events -H "Content-Type: application/json" -d '{"sandbox_id":"test","event_type":"test","timestamp":"2026-01-13T00:00:00Z"}'
curl http://localhost:9000/api/events
```

### Step 2: Create Universal Hook Script

**Files:**
- Create `.claude/hooks/event_reporter.py`

**Tasks:**
- Read JSON input from stdin (hook payload)
- Build event payload with sandbox_id, event_type, tool_name, timestamp
- POST to ORCHESTRATOR_URL/api/events with 2-second timeout
- Fail silently (log to stderr, exit 0)
- Use only stdlib (urllib.request, no external dependencies)

**Verification:**
```bash
echo '{"tool_name":"Write","session_id":"test123"}' | ORCHESTRATOR_URL=http://localhost:9000 E2B_SANDBOX_ID=sbx-test HOOK_EVENT_TYPE=post_tool_use python3 .claude/hooks/event_reporter.py
```

### Step 3: Create Streaming Hook Wrappers

**Files:**
- Create `.claude/hooks/task_progress_stream.py`
- Create `.claude/hooks/subagent_complete_stream.py`
- Create `.claude/hooks/feature_complete_stream.py`

**Tasks:**
- Each hook calls existing functionality (task_progress.py, etc.)
- Additionally calls event_reporter.py with appropriate event type
- Handles both file updates and HTTP streaming
- Extracts relevant data from stdin for event payload

**Verification:**
```bash
# Test task progress stream
echo '{}' | ORCHESTRATOR_URL=http://localhost:9000 E2B_SANDBOX_ID=sbx-test python3 .claude/hooks/task_progress_stream.py
```

### Step 4: Update Implement Command Hooks

**Files:**
- Modify `.claude/commands/alpha/implement.md`

**Tasks:**
- Add PostToolUse hook for event_reporter.py with event_type=post_tool_use
- Update existing TodoWrite matcher to use task_progress_stream.py
- Update SubagentStop hook to use subagent_complete_stream.py
- Update Stop hook to use feature_complete_stream.py
- All hooks use `|| true` to prevent blocking

**Verification:**
```bash
# Verify YAML frontmatter parses correctly
head -50 .claude/commands/alpha/implement.md
```

### Step 5: Add Event Stream Types

**Files:**
- Modify `.ai/alpha/scripts/ui/types.ts`

**Tasks:**
- Add `WebSocketEvent` interface for streamed events
- Add `EventServerStatus` type (connected/disconnected/error)
- Add `EventStreamState` interface for hook state
- Export new types for use in components

**Verification:**
```bash
pnpm typecheck
```

### Step 6: Create useEventStream Hook

**Files:**
- Create `.ai/alpha/scripts/ui/hooks/useEventStream.ts`

**Tasks:**
- Implement React hook for WebSocket connection
- Auto-connect on mount, auto-reconnect on disconnect
- Expose connection status, recent events, error state
- Provide event callback for real-time handling
- Handle ping/pong keepalive
- Clean up WebSocket on unmount

**Verification:**
```bash
pnpm typecheck
```

### Step 7: Create EventStreamStatus Component

**Files:**
- Create `.ai/alpha/scripts/ui/components/EventStreamStatus.tsx`

**Tasks:**
- Display connection status indicator (green/yellow/red circle)
- Show "Connected" / "Connecting..." / "Disconnected" text
- Display reconnect countdown when disconnected
- Compact design for header integration

**Verification:**
```bash
pnpm typecheck
```

### Step 8: Integrate Event Stream into UI

**Files:**
- Modify `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts`
- Modify `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`
- Modify `.ai/alpha/scripts/ui/components/EventLog.tsx`
- Modify `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx`

**Tasks:**
- Import and use useEventStream hook in OrchestratorUI
- Merge WebSocket events with file-polled data in useProgressPoller
- Display real-time events in SandboxColumn (last tool, heartbeat from stream)
- Enhance EventLog to show streamed events with "live" indicator
- Add EventStreamStatus to Header component
- Prefer WebSocket data when available, fallback to file data

**Verification:**
```bash
pnpm typecheck
```

### Step 9: Update Orchestrator to Start Event Server

**Files:**
- Modify `.ai/alpha/scripts/lib/orchestrator.ts`

**Tasks:**
- Import spawn from child_process
- Start event-server.py as background process before sandbox creation
- Wait for server to be ready (poll /health endpoint)
- Store process reference for cleanup
- Kill event server on orchestrator exit/cleanup

**Verification:**
```bash
pnpm typecheck
```

### Step 10: Update Sandbox Environment Variables

**Files:**
- Modify `.ai/alpha/scripts/lib/sandbox.ts`

**Tasks:**
- Add ORCHESTRATOR_URL to sandbox environment variables
- Add E2B_SANDBOX_ID to sandbox environment variables
- ORCHESTRATOR_URL should use host.docker.internal or appropriate E2B host
- Test connectivity from sandbox to event server

**Verification:**
```bash
pnpm typecheck
```

### Step 11: Add Python Dependencies

**Files:**
- Modify `.ai/alpha/scripts/requirements.txt` (create if needed)

**Tasks:**
- Add fastapi dependency
- Add uvicorn[standard] dependency
- Add websockets dependency
- Document Python version requirement (3.9+)

**Verification:**
```bash
pip install -r .ai/alpha/scripts/requirements.txt
python3 -c "import fastapi; import uvicorn; import websockets; print('OK')"
```

### Step 12: End-to-End Testing

**Tasks:**
- Start event server manually
- Run `/alpha:implement` on a test feature locally
- Verify events appear in event server logs
- Verify events broadcast to WebSocket clients
- Test graceful degradation (stop server, verify fallback works)
- Test with multiple parallel sandboxes
- Measure event latency (target: <500ms)

**Verification:**
```bash
# Start event server
python3 .ai/alpha/scripts/event-server.py &

# Run orchestrator with test spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# Check event server received events
curl http://localhost:9000/api/events

# Stop server and verify orchestrator continues
kill %1
```

### Step 13: Run Validation Commands

Execute all validation commands to ensure the feature works correctly with zero regressions.

## Testing Strategy

### Unit Tests

**Event Server Tests:**
- POST endpoint accepts valid events
- POST endpoint rejects malformed events
- GET endpoint returns recent events
- WebSocket connection established
- WebSocket broadcasts to multiple clients
- Health endpoint returns correct status

**Hook Script Tests:**
- Reads stdin JSON correctly
- Builds event payload with all required fields
- HTTP POST called with correct URL and headers
- Fails silently on network error
- Exits with code 0 always

**UI Hook Tests:**
- useEventStream connects on mount
- useEventStream reconnects on disconnect
- useEventStream provides connection status
- Events merged correctly with file-polled data

### Integration Tests

**End-to-End Flow:**
1. Start event server
2. Run hook script with mock stdin
3. Verify event appears in server
4. Verify event broadcasts to WebSocket client

**Multi-Sandbox Test:**
1. Start event server
2. Simulate events from 3 sandboxes
3. Verify events routed by sandbox_id
4. Verify UI displays events per sandbox

### E2E Tests

**Full Orchestrator Test:**
1. Run spec-orchestrator.ts with event streaming enabled
2. Verify events stream in real-time to UI
3. Verify file fallback works when event server unavailable
4. Verify stall detection is faster (<2 minutes)

### Edge Cases

- Event server unavailable at startup
- Event server crashes mid-execution
- WebSocket disconnects and reconnects
- High-frequency events (100+ per minute)
- Large event payloads (truncation handling)
- Malformed hook stdin (graceful handling)

## Acceptance Criteria

- [ ] Events appear in UI within 500ms of occurring (vs 5 seconds current)
- [ ] Stall detection triggers within 2 minutes of session hang
- [ ] 99%+ event delivery rate when event server available
- [ ] Orchestrator continues working when event server unavailable
- [ ] UI falls back to file polling when WebSocket disconnects
- [ ] All hooks fail silently (no blocking Claude Code)
- [ ] Event server starts automatically with orchestrator
- [ ] Connection status visible in UI header

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format check
pnpm format

# Python syntax check
python3 -m py_compile .ai/alpha/scripts/event-server.py
python3 -m py_compile .claude/hooks/event_reporter.py
python3 -m py_compile .claude/hooks/task_progress_stream.py
python3 -m py_compile .claude/hooks/subagent_complete_stream.py
python3 -m py_compile .claude/hooks/feature_complete_stream.py

# Event server health check
python3 .ai/alpha/scripts/event-server.py &
sleep 2
curl -f http://localhost:9000/health
kill %1

# Full build
pnpm build
```

## Notes

### Architecture Decision: HTTP POST vs Direct WebSocket from Hooks

The plan uses HTTP POST from hooks rather than direct WebSocket connections because:
1. **Simplicity** - HTTP POST is stateless, no connection management in hooks
2. **Reliability** - Short-lived requests are more resilient to network issues
3. **Stdlib only** - urllib.request is built-in, no dependencies to install in sandbox
4. **Fast timeout** - 2-second timeout prevents blocking Claude Code

The FastAPI server acts as a bridge, converting HTTP POSTs to WebSocket broadcasts.

### E2B Network Considerations

E2B sandboxes may not be able to reach localhost:9000 directly. Options:
1. **host.docker.internal** - Works in Docker environments
2. **Public ngrok tunnel** - For testing, not production
3. **E2B port forwarding** - Configure E2B to expose local port

This will be validated during Step 10 and adjusted as needed.

### Future Enhancements

Not in scope for this feature, but potential future work:
- PostgreSQL persistence for event history
- Event filtering and search in UI
- Historical playback of event streams
- Alerts/notifications for specific event types
- Metrics dashboard (event rates, latencies, errors)
