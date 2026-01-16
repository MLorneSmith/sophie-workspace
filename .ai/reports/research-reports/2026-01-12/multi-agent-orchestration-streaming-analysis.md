# Multi-Agent Orchestration: Stdout/Event Streaming Research Report

**Date:** 2026-01-12
**Project:** multi-agent-orchestration by @solanyn
**Research Focus:** Understanding how they capture and stream Claude Code stdout/events from orchestrator to UI
**Purpose:** Inform implementation of similar patterns in SlideHeroes Alpha workflow orchestrator

---

## Executive Summary

The multi-agent-orchestration project implements **hook-based event capture** combined with **WebSocket broadcasting** to stream Claude Code agent output in real-time. They do NOT capture raw stdout—instead, they use Claude Agent SDK hooks to intercept structured events (tool use, responses, thinking blocks) and broadcast them via WebSocket to a Vue3 frontend.

**Key Insight:** The communication is **event-driven, not stdout-based**. The Claude Agent SDK provides hooks that fire at specific lifecycle points, and these hooks are used to capture structured data that's then persisted to PostgreSQL and broadcast via WebSocket.

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Vue 3 + TypeScript)               │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Agent List   │  │ Event Stream  │  │ Orchestrator Chat │   │
│  │ (Sidebar)    │  │ (Center)      │  │ (Right Panel)     │   │
│  └──────────────┘  └───────────────┘  └───────────────────┘   │
│                          ▲                                       │
│                          │ WebSocket /ws                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                 Backend (FastAPI + Python)                       │
│                          │                                       │
│  ┌──────────────────────▼──────────────────────┐               │
│  │      WebSocket Manager (Broadcast Hub)      │               │
│  │  - broadcast_agent_log()                    │               │
│  │  - broadcast_orchestrator_chat()            │               │
│  │  - broadcast_agent_updated()                │               │
│  │  - broadcast_agent_status_change()          │               │
│  └──────────┬────────────────────┬─────────────┘               │
│             │                    │                              │
│  ┌──────────▼─────────┐  ┌──────▼──────────────┐              │
│  │ Orchestrator Svc   │  │  Agent Manager      │              │
│  │ - Orchestrator     │  │  - Command Agents   │              │
│  │   hooks            │  │  - Subagent hooks   │              │
│  │ - process_user_    │  │  - create_agent()   │              │
│  │   message()        │  │  - command_agent()  │              │
│  └────────────────────┘  └─────────────────────┘              │
│             │                    │                              │
│  ┌──────────▼────────────────────▼──────────────┐             │
│  │    Claude Agent SDK (ClaudeSDKClient)        │             │
│  │    - Hooks: PreToolUse, PostToolUse, Stop,   │             │
│  │      UserPromptSubmit, SubagentStop,         │             │
│  │      PreCompact                               │             │
│  │    - Messages: AssistantMessage,             │             │
│  │      TextBlock, ThinkingBlock,               │             │
│  │      ToolUseBlock, ResultMessage             │             │
│  └──────────────────────────────────────────────┘             │
│             │                                                   │
│  ┌──────────▼─────────────────────────────────┐               │
│  │   PostgreSQL Database (NeonDB)             │               │
│  │   - orchestrator_agents (singleton)        │               │
│  │   - agents (managed agents)                │               │
│  │   - agent_logs (hook events + responses)   │               │
│  │   - orchestrator_chat (3-way conversation) │               │
│  │   - system_logs (application logs)         │               │
│  └────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## How Event Streaming Works

### 1. Hook-Based Event Capture

The Claude Agent SDK provides **hooks** that intercept events at specific lifecycle points. The project registers custom hook handlers that:

1. **Capture event data** (tool name, input, output, thinking, text blocks)
2. **Persist to database** (PostgreSQL for durability)
3. **Broadcast via WebSocket** (real-time updates to frontend)
4. **Generate AI summaries** (async background task using Claude Haiku)

#### Hook Types Registered

**For Orchestrator Agent** (`orchestrator_hooks.py`):
- `PreToolUse` - Before orchestrator uses a management tool
- `PostToolUse` - After orchestrator completes tool use
- `Stop` - When orchestrator session stops

**For Command Agents** (`command_agent_hooks.py`):
- `PreToolUse` - Before agent uses a tool (Read, Write, Bash, etc.)
- `PostToolUse` - After agent completes tool use (captures file changes)
- `UserPromptSubmit` - When agent receives a prompt
- `Stop` - When agent session stops
- `SubagentStop` - When a subagent (nested agent) stops
- `PreCompact` - Before context window compaction

### 2. Example Hook Implementation

Here's how `PreToolUse` hook captures tool calls:

```python
def create_pre_tool_hook(
    agent_id: uuid.UUID,
    agent_name: str,
    task_slug: str,
    entry_counter: Dict[str, int],
    logger: OrchestratorLogger,
    ws_manager: WebSocketManager
) -> HookCallback:
    """Create PreToolUse hook that logs every tool call before execution."""

    async def hook(
        input_data: Dict[str, Any],
        tool_use_id: Optional[str],
        context: Any
    ) -> Dict[str, Any]:
        """PreToolUse hook implementation"""
        tool_name = input_data.get("tool_name", "unknown")
        tool_input = input_data.get("tool_input", {})

        payload = {
            "tool_name": tool_name,
            "tool_input": tool_input,
            "tool_use_id": tool_use_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        entry_index = entry_counter["count"]
        entry_counter["count"] += 1

        # 1. Persist to database
        log_id = await insert_hook_event(
            agent_id=agent_id,
            task_slug=task_slug,
            entry_index=entry_index,
            event_type="PreToolUse",
            payload=payload,
            content=f"Using tool: {tool_name}"
        )

        # 2. Broadcast via WebSocket (real-time)
        await ws_manager.broadcast_agent_log({
            "id": str(log_id),
            "agent_id": str(agent_id),
            "agent_name": agent_name,
            "task_slug": task_slug,
            "entry_index": entry_index,
            "event_category": "hook",
            "event_type": "PreToolUse",
            "content": f"Using tool: {tool_name}",
            "summary": f"Using tool: {tool_name}",
            "payload": payload,
            "timestamp": payload["timestamp"]
        })

        # 3. Generate AI summary (async background task)
        asyncio.create_task(
            _summarize_and_update(log_id, agent_id, "PreToolUse", payload, logger, ws_manager)
        )

        return {}

    return hook
```

**Key Points:**
1. Hooks are **synchronous capture points** - they fire during agent execution
2. Database writes are **awaited** to ensure persistence before broadcasting
3. WebSocket broadcasts are **awaited** for immediate UI updates
4. AI summarization is **fire-and-forget** (asyncio.create_task) to avoid blocking

---

## 3. Message Block Streaming (AssistantMessage)

In addition to hooks, the project also captures **AssistantMessage** blocks as they stream from the Claude SDK:

```python
# From orchestrator_service.py:process_user_message()
async with ClaudeSDKClient(options=options) as client:
    await client.query(user_message)

    # Iterate through ALL messages (THE CORE LOOP)
    async for message in client.receive_response():

        # Handle SystemMessage (informational metadata)
        if isinstance(message, SystemMessage):
            # Store system metadata (tools, session_id, cwd)
            # ...continue (don't process as output)

        # Process AssistantMessage blocks
        if isinstance(message, AssistantMessage):
            for block in message.content:

                # Capture and stream text responses
                if isinstance(block, TextBlock):
                    response_text += block.text

                    # Save TextBlock chunk to database immediately
                    message_id = await insert_chat_message(
                        orchestrator_agent_id=orch_uuid,
                        sender_type="orchestrator",
                        receiver_type="user",
                        message=block.text,
                        agent_id=None,
                        metadata={"type": "text_chunk"}
                    )

                    # Broadcast chunk to event stream
                    await self.ws_manager.broadcast({
                        "type": "orchestrator_chat",
                        "message": {
                            "id": str(message_id),
                            "orchestrator_agent_id": str(orch_uuid),
                            "sender_type": "orchestrator",
                            "receiver_type": "user",
                            "message": block.text,
                            "metadata": {"type": "text_chunk"},
                            "timestamp": datetime.now().isoformat()
                        }
                    })

                # Capture thinking blocks
                elif isinstance(block, ThinkingBlock):
                    # Save to system_logs + broadcast
                    # ...

                # Track tool usage
                elif isinstance(block, ToolUseBlock):
                    # Save to system_logs + broadcast
                    # ...

        # Capture final session ID and usage
        elif isinstance(message, ResultMessage):
            final_session_id = message.session_id
            usage_data = message.usage
            cost = getattr(message, "total_cost_usd", 0.0)

            # Update costs in database + broadcast update
            await update_orchestrator_costs(orch_uuid, input_tokens, output_tokens, cost)
            await ws_manager.broadcast_orchestrator_updated({...})
```

**Key Points:**
- The SDK provides an **async iterator** `client.receive_response()` that yields messages as they arrive
- **TextBlocks are chunked** - each chunk is saved and broadcast immediately for streaming effect
- **ThinkingBlocks and ToolUseBlocks** are captured but not shown in chat (shown in event stream)
- **ResultMessage** contains final costs/tokens and is used to update totals

---

## 4. WebSocket Broadcasting Pattern

The `WebSocketManager` class manages all active connections and provides typed broadcast methods:

```python
class WebSocketManager:
    """Manages WebSocket connections and broadcasts events to all connected clients"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}

    async def broadcast(self, data: dict, exclude: WebSocket = None):
        """Broadcast JSON data to all connected clients (except optionally one)"""
        if not self.active_connections:
            return

        # Add timestamp if not present
        if "timestamp" not in data:
            data["timestamp"] = datetime.now().isoformat()

        disconnected = []

        for connection in self.active_connections:
            if connection == exclude:
                continue

            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Failed to broadcast to client: {e}")
                disconnected.append(connection)

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

    # Typed broadcast methods for different event types
    async def broadcast_agent_log(self, log_data: dict):
        """Broadcast agent log entry"""
        await self.broadcast({"type": "agent_log", "log": log_data})

    async def broadcast_agent_created(self, agent_data: dict):
        """Broadcast agent creation event"""
        await self.broadcast({"type": "agent_created", "agent": agent_data})

    async def broadcast_orchestrator_chat(self, message_data: dict):
        """Broadcast orchestrator chat message"""
        await self.broadcast({"type": "orchestrator_chat", "message": message_data})

    # ... 10+ more typed broadcast methods
```

**WebSocket Event Types:**
- `agent_log` - Hook events and response blocks from command agents
- `orchestrator_chat` - Chat messages between user and orchestrator
- `agent_created` / `agent_updated` / `agent_deleted` - Agent lifecycle events
- `agent_status_changed` - Status transitions (idle → executing → idle)
- `orchestrator_updated` - Cost/token updates for orchestrator
- `thinking_block` / `tool_use_block` - Real-time thought process display
- `error` - Error notifications

---

## 5. Frontend Event Handling

The Vue3 frontend uses **Pinia store** for state management and connects to WebSocket:

```typescript
// chatService.ts - WebSocket connection with typed callbacks
export const connectWebSocket = (callbacks: {
  onAgentLog?: (log: AgentLog) => void;
  onOrchestratorChat?: (message: OrchestratorChatMessage) => void;
  onAgentCreated?: (agent: Agent) => void;
  onAgentUpdated?: (agentId: string, agent: Partial<Agent>) => void;
  onAgentDeleted?: (agentId: string) => void;
  onAgentStatusChanged?: (agentId: string, oldStatus: string, newStatus: string) => void;
  onOrchestratorUpdated?: (data: OrchestratorUpdate) => void;
  onThinkingBlock?: (data: ThinkingBlockData) => void;
  onToolUseBlock?: (data: ToolUseBlockData) => void;
  onError?: (error: ErrorData) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}): WebSocket => {
  const ws = new WebSocket(WEBSOCKET_URL);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    callbacks.onConnectionChange?.(true);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Route messages to appropriate callbacks
    switch (data.type) {
      case 'agent_log':
        callbacks.onAgentLog?.(data.log);
        break;
      case 'orchestrator_chat':
        callbacks.onOrchestratorChat?.(data.message);
        break;
      case 'agent_created':
        callbacks.onAgentCreated?.(data.agent);
        break;
      // ... handle all event types
    }
  };

  return ws;
};
```

**Pinia Store Integration:**
```typescript
// orchestratorStore.ts
export const useOrchestratorStore = defineStore('orchestrator', {
  state: () => ({
    agents: [] as Agent[],
    events: [] as AgentLog[],
    chatMessages: [] as OrchestratorChatMessage[],
    orchestrator: null as OrchestratorAgent | null,
    wsConnection: null as WebSocket | null,
    isConnected: false,
  }),

  actions: {
    connectWebSocket() {
      this.wsConnection = connectWebSocket({
        onAgentLog: (log) => {
          this.events.unshift(log); // Add to top of event stream
        },
        onOrchestratorChat: (message) => {
          this.chatMessages.push(message); // Append to chat
        },
        onAgentCreated: (agent) => {
          this.agents.push(agent); // Add to sidebar
        },
        onAgentUpdated: (agentId, updates) => {
          const agent = this.agents.find(a => a.id === agentId);
          if (agent) Object.assign(agent, updates);
        },
        onOrchestratorUpdated: (data) => {
          if (this.orchestrator) {
            this.orchestrator.input_tokens = data.input_tokens;
            this.orchestrator.output_tokens = data.output_tokens;
            this.orchestrator.total_cost = data.total_cost;
          }
        },
        // ... other callbacks
      });
    }
  }
});
```

---

## Key Design Patterns

### 1. Three-Phase Logging Pattern

Every orchestrator interaction follows this pattern:

```
PHASE 1: PRE-EXECUTION
├─ Insert user message to database
├─ Broadcast user message via WebSocket
└─ Log to application logs

PHASE 2: EXECUTION (with streaming)
├─ Create Claude SDK client with hooks
├─ Query agent with user message
├─ For each message block (TextBlock, ThinkingBlock, ToolUseBlock):
│  ├─ Insert to database immediately
│  ├─ Broadcast via WebSocket immediately
│  └─ Generate AI summary (background task)
└─ Capture ResultMessage with costs

PHASE 3: POST-EXECUTION
├─ Update session_id (if new)
├─ Update costs in database
├─ Broadcast cost update via WebSocket
└─ Return response to caller
```

### 2. Database-First Persistence

**All events are persisted to PostgreSQL BEFORE broadcasting:**
- Ensures durability (events survive backend restarts)
- Enables historical queries (event stream can be reconstructed)
- Supports pagination and filtering
- Provides audit trail

**Database Schema:**
```sql
-- Orchestrator singleton
CREATE TABLE orchestrator_agents (
  id UUID PRIMARY KEY,
  session_id TEXT UNIQUE,
  status VARCHAR(50),
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  total_cost NUMERIC(10,6) DEFAULT 0.0,
  metadata JSONB DEFAULT '{}',
  ...
);

-- Command agents (many per orchestrator)
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  orchestrator_agent_id UUID REFERENCES orchestrator_agents(id),
  name VARCHAR(255) NOT NULL,
  session_id TEXT,
  status VARCHAR(50),
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  total_cost NUMERIC(10,6) DEFAULT 0.0,
  ...
);

-- Unified event log (hooks + response blocks)
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  task_slug VARCHAR(255),
  entry_index INTEGER,
  event_category VARCHAR(50), -- 'hook' or 'response'
  event_type VARCHAR(100),    -- 'PreToolUse', 'TextBlock', etc.
  content TEXT,
  summary TEXT,               -- AI-generated summary
  payload JSONB,              -- Full event data
  ...
);

-- 3-way conversation log
CREATE TABLE orchestrator_chat (
  id UUID PRIMARY KEY,
  orchestrator_agent_id UUID REFERENCES orchestrator_agents(id),
  agent_id UUID REFERENCES agents(id),
  sender_type VARCHAR(50),    -- 'user', 'orchestrator', 'agent'
  receiver_type VARCHAR(50),
  message TEXT,
  summary TEXT,
  metadata JSONB,
  ...
);
```

### 3. Async Background Summarization

AI summaries are generated **asynchronously** to avoid blocking:

```python
# Fire-and-forget async task
asyncio.create_task(
    self._summarize_and_update_chat(chat_id, user_message)
)

async def _summarize_and_update_chat(self, chat_id: uuid.UUID, message: str) -> None:
    """Generate AI summary for chat message and update database (background task)."""
    try:
        # Build event data for summarization
        event_data = {"content": message}

        # Generate AI summary (uses Claude Haiku for speed/cost)
        summary = await summarize_event(event_data, "text")

        # Update database with summary
        if summary and summary.strip():
            await update_chat_summary(chat_id, summary)
    except Exception as e:
        self.logger.error(f"Failed to generate summary: {e}")
```

**Benefits:**
- **Non-blocking** - Doesn't slow down message processing
- **Cost-effective** - Uses Claude Haiku (cheap, fast)
- **Fault-tolerant** - Failures don't crash main flow
- **Improves UX** - 15-word summaries make event stream scannable

---

## Session Management & Resumption

### Starting a Fresh Session

```bash
# Backend starts without --session flag
uv run python backend/main.py

# Creates new orchestrator in database
# session_id is NULL until first interaction completes
```

### Resuming an Existing Session

```bash
# Backend starts with --session flag
uv run python backend/main.py --session sess_abc123...

# Looks up orchestrator by session_id
# Resumes Claude SDK session
# All previous context is preserved
```

**Session Flow:**

1. **First Interaction:**
   - Backend creates orchestrator with `session_id = NULL`
   - User sends first message
   - Claude SDK initializes session, returns `session_id`
   - Backend updates database with `session_id`

2. **Subsequent Interactions:**
   - Backend passes `session_id` to Claude SDK
   - SDK resumes session with full context
   - No need to re-establish system prompt or tools

3. **Resumption After Restart:**
   - Start backend with `--session <session_id>`
   - Backend fetches orchestrator from database
   - Orchestrator service initialized with existing `session_id`
   - First query resumes SDK session automatically

---

## Cost Tracking

**Cost tracking is automated at two levels:**

### 1. Per-Interaction Costs

Every `ResultMessage` from Claude SDK contains:
```python
result_message.total_cost_usd  # Top-level field (preferred)
result_message.usage.total_cost_usd  # Fallback if top-level is 0
result_message.usage.input_tokens
result_message.usage.output_tokens
```

These are extracted and **accumulated** in database:

```python
# Orchestrator costs
await update_orchestrator_costs(
    orchestrator_agent_id=orch_uuid,
    input_tokens=input_tokens,
    output_tokens=output_tokens,
    cost_usd=cost_usd
)

# Agent costs
await update_agent_costs(
    agent_id=agent_id,
    input_tokens=input_tokens,
    output_tokens=output_tokens,
    cost_usd=cost_usd
)
```

Database uses **accumulation pattern:**
```sql
UPDATE orchestrator_agents
SET
  input_tokens = input_tokens + $1,
  output_tokens = output_tokens + $2,
  total_cost = total_cost + $3
WHERE id = $4;
```

### 2. Real-Time UI Updates

Costs are broadcast via WebSocket immediately:

```python
# After updating costs in DB
await self.ws_manager.broadcast_orchestrator_updated({
    "id": str(orch_uuid),
    "input_tokens": orchestrator.input_tokens,
    "output_tokens": orchestrator.output_tokens,
    "total_cost": float(orchestrator.total_cost),
    "updated_at": orchestrator.updated_at.isoformat()
})
```

Frontend displays in header:
```
Orchestrator | Tokens: 12,345 | Cost: $1.23 | Status: idle
```

---

## File Tracking Integration

The system tracks **file changes** made by agents using git diffs:

### Implementation

```python
# file_tracker.py
class FileTracker:
    """Tracks file operations using git diff and provides change summaries."""

    def __init__(self, agent_id: uuid.UUID, agent_name: str, working_dir: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.working_dir = working_dir
        self.baseline_snapshot = self._capture_git_snapshot()
        self.read_files: Set[str] = set()

    def on_read(self, file_path: str):
        """Track file read operation."""
        self.read_files.add(file_path)

    async def generate_file_changes_summary(self) -> List[Dict[str, Any]]:
        """Generate summary of modified files with git diff."""
        current_snapshot = self._capture_git_snapshot()

        changes = []
        for file_path in current_snapshot.keys():
            if file_path not in self.baseline_snapshot:
                # New file
                diff_output = self._get_git_diff(file_path)
                changes.append({
                    "file": file_path,
                    "status": "created",
                    "diff": diff_output
                })
            elif current_snapshot[file_path] != self.baseline_snapshot[file_path]:
                # Modified file
                diff_output = self._get_git_diff(file_path)
                changes.append({
                    "file": file_path,
                    "status": "modified",
                    "diff": diff_output
                })

        return changes
```

### Hook Integration

File tracking is attached to `PostToolUse` hook for Read/Write/Edit tools:

```python
def create_post_tool_file_tracking_hook(
    file_tracker: FileTracker,
    agent_id: uuid.UUID,
    agent_name: str,
    logger: OrchestratorLogger
) -> HookCallback:
    """Create PostToolUse hook for file tracking."""

    async def hook(input_data: Dict[str, Any], tool_use_id: Optional[str], context: Any) -> Dict[str, Any]:
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Track Read operations
        if tool_name == "Read" and "file_path" in tool_input:
            file_tracker.on_read(tool_input["file_path"])

        return {}

    return hook
```

### Database Storage

File changes are stored in `agent_logs.payload`:

```python
# When ResultMessage is received (end of agent execution)
file_metadata = {
    "file_changes": modified_files_summary,  # List of diffs
    "read_files": read_files_summary,        # List of read files
    "total_files_modified": len(modified_files_summary),
    "total_files_read": len(read_files_summary),
    "generated_at": datetime.now(timezone.utc).isoformat()
}

# Update the last TextBlock's payload with file tracking data
await update_log_payload(last_text_block_id, file_metadata)
```

---

## Applicability to SlideHeroes Alpha Workflow

### What We Can Adopt

#### 1. **Hook-Based Event Capture** ✅ HIGHLY RECOMMENDED

**Adopt:** Use Claude Agent SDK hooks to capture events at lifecycle points.

**Implementation:**
```python
# In our orchestrator
def create_task_hooks(task_id: str, sandbox_id: str):
    """Create hooks for Alpha task execution."""

    async def pre_tool_hook(input_data, tool_use_id, context):
        # Capture tool use
        await log_task_event(task_id, "tool_use", {
            "tool": input_data.get("tool_name"),
            "input": input_data.get("tool_input")
        })
        # Broadcast to UI via WebSocket
        await ws_broadcast("task_event", {...})
        return {}

    async def text_block_hook(input_data, tool_use_id, context):
        # Capture agent response
        await log_task_event(task_id, "response", {
            "text": input_data.get("text")
        })
        # Broadcast to UI
        await ws_broadcast("task_response", {...})
        return {}

    return {
        "PreToolUse": [{"hooks": [pre_tool_hook]}],
        "PostToolUse": [{"hooks": [text_block_hook]}],
        # ... other hooks
    }
```

**Benefits:**
- **Structured data** instead of raw stdout
- **Real-time capture** at exact event points
- **Type safety** with known event schemas
- **No parsing** required (data is already structured)

#### 2. **WebSocket Broadcasting Pattern** ✅ RECOMMENDED

**Adopt:** Use FastAPI WebSocket endpoint + broadcast manager for real-time updates.

**Implementation:**
```python
# websocket_manager.py
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def broadcast_task_event(self, task_id: str, event_type: str, data: dict):
        """Broadcast task event to all connected clients."""
        await self.broadcast({
            "type": "task_event",
            "task_id": task_id,
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })

# main.py
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
```

**Benefits:**
- **Real-time updates** with sub-second latency
- **Multiple clients** can watch same orchestrator
- **Automatic reconnection** handling
- **Typed events** with clear schemas

#### 3. **Database-First Persistence** ✅ RECOMMENDED

**Adopt:** Persist all events to database before/during broadcasting.

**Why:**
- Durability - survive restarts
- Historical queries - reconstruct state
- Debugging - audit trail of all events
- Pagination - load older events on demand

**Schema:**
```sql
CREATE TABLE alpha_tasks (
  id UUID PRIMARY KEY,
  feature_id UUID NOT NULL,
  sandbox_id TEXT NOT NULL,
  status VARCHAR(50),
  session_id TEXT,
  ...
);

CREATE TABLE alpha_task_events (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES alpha_tasks(id),
  event_type VARCHAR(100),
  event_data JSONB,
  timestamp TIMESTAMPTZ,
  ...
);
```

#### 4. **Async Background Summarization** ⚠️ OPTIONAL

**Consider:** AI summaries for long outputs, but may not be necessary for Alpha.

**Trade-offs:**
- **Pro:** Makes event stream more scannable
- **Pro:** Reduces cognitive load for users
- **Con:** Adds API costs (even with Haiku)
- **Con:** Adds complexity

**Recommendation:** Start without, add later if event stream becomes noisy.

#### 5. **Three-Phase Logging Pattern** ✅ RECOMMENDED

**Adopt:** Pre-execution, execution, post-execution phases.

**Implementation:**
```python
async def execute_task(task_id: str, command: str):
    # PHASE 1: PRE-EXECUTION
    await log_task_event(task_id, "command_received", {"command": command})
    await ws_broadcast("task_status", {"status": "executing"})

    # PHASE 2: EXECUTION (with streaming)
    async with ClaudeSDKClient(options=options) as client:
        await client.query(command)

        async for message in client.receive_response():
            # Capture blocks + broadcast
            if isinstance(message, TextBlock):
                await log_task_event(task_id, "text", {"text": message.text})
                await ws_broadcast("task_text", {...})
            # ... other block types

    # PHASE 3: POST-EXECUTION
    await update_task_status(task_id, "completed")
    await update_task_costs(task_id, input_tokens, output_tokens, cost)
    await ws_broadcast("task_completed", {...})
```

---

### What We Should NOT Adopt

#### 1. **Orchestrator → Agent Hierarchy** ❌ NOT APPLICABLE

**Their Pattern:** One orchestrator manages multiple command agents.

**Our Pattern:** One orchestrator manages parallel sandbox tasks (flat hierarchy).

**Why Not:**
- We don't need agents creating other agents
- Our sandboxes are isolated E2B containers
- Our orchestrator directly commands tasks, not intermediary agents

#### 2. **Chat Interface** ❌ NOT NEEDED

**Their Pattern:** User chats with orchestrator in natural language.

**Our Pattern:** Orchestrator auto-executes predefined tasks from JSON.

**Why Not:**
- Our UI is task-centric (task list + logs), not chat-centric
- Users don't interact with orchestrator directly
- Orchestrator reads from `tasks.json`, not user input

#### 3. **MCP Server for Management Tools** ❌ OVERKILL

**Their Pattern:** Register management tools as MCP server for orchestrator.

**Our Pattern:** Direct Python functions for task management.

**Why Not:**
- We don't need tools exposed to Claude agents
- Our orchestrator is pure Python logic, not Claude-driven
- Simpler to use direct function calls

---

## Implementation Roadmap for Alpha

### Phase 1: Core Infrastructure (Week 1)

1. **Setup FastAPI Backend**
   - Install FastAPI, Uvicorn, asyncpg
   - Create basic API structure
   - Add CORS configuration

2. **Implement WebSocket Manager**
   - `WebSocketManager` class
   - `connect()`, `disconnect()`, `broadcast()` methods
   - Typed broadcast methods (`broadcast_task_event`, `broadcast_task_status`)

3. **Database Schema**
   - Create `alpha_orchestrator`, `alpha_tasks`, `alpha_task_events` tables
   - Setup asyncpg connection pool
   - Implement basic CRUD operations

### Phase 2: Hook Integration (Week 2)

1. **Create Hook Handlers**
   - `create_task_pre_tool_hook()` - Capture tool use
   - `create_task_post_tool_hook()` - Capture tool results
   - `create_task_text_block_hook()` - Capture responses
   - `create_task_stop_hook()` - Capture completion

2. **Register Hooks with Claude SDK**
   - Update `ClaudeAgentOptions` to include hooks
   - Test hook firing with simple tasks
   - Verify database persistence

3. **WebSocket Broadcasting**
   - Connect hooks to WebSocket broadcasts
   - Test real-time updates in browser console
   - Verify event ordering

### Phase 3: Frontend Integration (Week 3)

1. **Vue3 WebSocket Client**
   - Create `WebSocketService` with typed callbacks
   - Implement auto-reconnect logic
   - Add connection status indicator

2. **Pinia Store**
   - Create `useAlphaStore` with tasks/events state
   - Connect WebSocket callbacks to store mutations
   - Add computed properties for filtering

3. **UI Components**
   - **TaskList Component** - Show all tasks with status
   - **TaskLog Component** - Show events for selected task
   - **OrchestratorStatus Component** - Show overall progress

### Phase 4: Testing & Refinement (Week 4)

1. **End-to-End Testing**
   - Test multi-task execution with parallel sandboxes
   - Verify event ordering across tasks
   - Test WebSocket reconnection handling

2. **Performance Testing**
   - Test with 10+ parallel tasks
   - Measure WebSocket latency
   - Optimize database queries

3. **Error Handling**
   - Add retry logic for failed broadcasts
   - Add graceful degradation for disconnected clients
   - Add error recovery for hook failures

---

## Code Examples for Alpha

### 1. Alpha Task Hook Registration

```python
# alpha_hooks.py
from typing import Dict, Any, Optional, Callable, Awaitable
import uuid
from datetime import datetime, timezone

HookCallback = Callable[[Dict[str, Any], Optional[str], Any], Awaitable[Dict[str, Any]]]

def create_alpha_task_hooks(
    task_id: uuid.UUID,
    task_name: str,
    ws_manager: WebSocketManager,
    db_client: asyncpg.Pool
) -> Dict[str, Any]:
    """Create hooks for Alpha task execution."""

    entry_counter = {"count": 0}

    async def pre_tool_hook(input_data: Dict[str, Any], tool_use_id: Optional[str], context: Any):
        """Capture tool use before execution."""
        tool_name = input_data.get("tool_name", "unknown")
        tool_input = input_data.get("tool_input", {})

        entry_index = entry_counter["count"]
        entry_counter["count"] += 1

        # Persist to database
        event_id = await db_client.fetchval(
            """
            INSERT INTO alpha_task_events (id, task_id, entry_index, event_type, event_data, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """,
            uuid.uuid4(), task_id, entry_index, "PreToolUse",
            {"tool_name": tool_name, "tool_input": tool_input, "tool_use_id": tool_use_id},
            datetime.now(timezone.utc)
        )

        # Broadcast via WebSocket
        await ws_manager.broadcast_task_event(
            task_id=str(task_id),
            event_type="tool_use",
            data={
                "id": str(event_id),
                "task_name": task_name,
                "tool": tool_name,
                "entry_index": entry_index,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

        return {}

    async def text_block_hook(input_data: Dict[str, Any], tool_use_id: Optional[str], context: Any):
        """Capture text response blocks."""
        # Similar pattern to pre_tool_hook
        # ...
        return {}

    return {
        "PreToolUse": [{"hooks": [pre_tool_hook]}],
        # Add other hooks
    }
```

### 2. Alpha WebSocket Manager

```python
# alpha_websocket_manager.py
from fastapi import WebSocket
from typing import List, Dict, Any
import json
from datetime import datetime

class AlphaWebSocketManager:
    """Manages WebSocket connections for Alpha orchestrator."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ WebSocket connected | Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"❌ WebSocket disconnected | Total: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Broadcast to all connected clients."""
        if not self.active_connections:
            return

        if "timestamp" not in data:
            data["timestamp"] = datetime.now().isoformat()

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Failed to broadcast: {e}")
                disconnected.append(connection)

        # Clean up
        for ws in disconnected:
            self.disconnect(ws)

    # Typed broadcast methods
    async def broadcast_task_event(self, task_id: str, event_type: str, data: dict):
        """Broadcast task event."""
        await self.broadcast({
            "type": "task_event",
            "task_id": task_id,
            "event_type": event_type,
            "data": data
        })

    async def broadcast_task_status(self, task_id: str, old_status: str, new_status: str):
        """Broadcast task status change."""
        await self.broadcast({
            "type": "task_status_changed",
            "task_id": task_id,
            "old_status": old_status,
            "new_status": new_status
        })

    async def broadcast_orchestrator_progress(self, progress: dict):
        """Broadcast overall orchestrator progress."""
        await self.broadcast({
            "type": "orchestrator_progress",
            "progress": progress
        })
```

### 3. Alpha Main FastAPI App

```python
# alpha_main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from alpha_websocket_manager import AlphaWebSocketManager
import asyncpg

app = FastAPI(title="Alpha Orchestrator API")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global instances
ws_manager = AlphaWebSocketManager()
db_pool = None

@app.on_event("startup")
async def startup():
    """Initialize database pool."""
    global db_pool
    db_pool = await asyncpg.create_pool(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        database="alpha"
    )
    print("✅ Database pool initialized")

@app.on_event("shutdown")
async def shutdown():
    """Close database pool."""
    if db_pool:
        await db_pool.close()
    print("❌ Database pool closed")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await ws_manager.connect(websocket)

    try:
        while True:
            # Keep alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "websocket_connections": len(ws_manager.active_connections)
    }

@app.post("/start_orchestration")
async def start_orchestration(feature_id: str):
    """Start Alpha orchestration for a feature."""
    # Load tasks.json
    # Create orchestrator session
    # Start task execution with hooks
    # Return orchestrator_id
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000)
```

### 4. Frontend WebSocket Client

```typescript
// alphaWebSocket.ts
export type TaskEvent = {
  type: "task_event";
  task_id: string;
  event_type: string;
  data: {
    id: string;
    task_name: string;
    tool?: string;
    text?: string;
    entry_index: number;
    timestamp: string;
  };
};

export type TaskStatusChanged = {
  type: "task_status_changed";
  task_id: string;
  old_status: string;
  new_status: string;
  timestamp: string;
};

export type OrchestratorProgress = {
  type: "orchestrator_progress";
  progress: {
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    in_progress_tasks: number;
  };
  timestamp: string;
};

export type AlphaWebSocketMessage =
  | TaskEvent
  | TaskStatusChanged
  | OrchestratorProgress;

export class AlphaWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: {
    onTaskEvent?: (event: TaskEvent) => void;
    onTaskStatusChanged?: (event: TaskStatusChanged) => void;
    onOrchestratorProgress?: (event: OrchestratorProgress) => void;
    onConnectionChange?: (isConnected: boolean) => void;
  };

  constructor(url: string, callbacks: typeof this.callbacks) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("✅ Alpha WebSocket connected");
      this.callbacks.onConnectionChange?.(true);
    };

    this.ws.onclose = () => {
      console.log("❌ Alpha WebSocket disconnected");
      this.callbacks.onConnectionChange?.(false);
      // Auto-reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as AlphaWebSocketMessage;

      switch (data.type) {
        case "task_event":
          this.callbacks.onTaskEvent?.(data);
          break;
        case "task_status_changed":
          this.callbacks.onTaskStatusChanged?.(data);
          break;
        case "orchestrator_progress":
          this.callbacks.onOrchestratorProgress?.(data);
          break;
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

---

## Conclusion

The multi-agent-orchestration project demonstrates a **production-ready pattern** for capturing and streaming Claude Agent SDK events in real-time. The key insight is that they **do NOT capture stdout**—instead, they use:

1. **Claude Agent SDK Hooks** - Structured event capture at lifecycle points
2. **WebSocket Broadcasting** - Real-time push to frontend clients
3. **Database-First Persistence** - Durability and historical queries
4. **Async Message Streaming** - Real-time text block streaming from `receive_response()`

This pattern is **directly applicable** to our Alpha workflow orchestrator. We should adopt:

✅ **Hook-based event capture** - For structured data at exact event points
✅ **WebSocket broadcasting** - For real-time UI updates
✅ **Database-first persistence** - For durability and audit trail
✅ **Three-phase logging** - For clear execution phases

We should **NOT adopt:**

❌ **Orchestrator → Agent hierarchy** - Not needed for flat sandbox architecture
❌ **Chat interface** - Not needed for auto-execution workflow
❌ **MCP server for tools** - Overkill for direct Python functions

**Next Steps:**

1. Implement `AlphaWebSocketManager` with typed broadcast methods
2. Create hook handlers for task execution events
3. Setup asyncpg database pool + schema
4. Build Vue3 WebSocket client with auto-reconnect
5. Create Pinia store for task/event state management
6. Test end-to-end with multi-task parallel execution

---

## References

- **Project**: https://github.com/solanyn/multi-agent-orchestration
- **Key Files Analyzed**:
  - `apps/orchestrator_3_stream/backend/main.py` - FastAPI app structure
  - `apps/orchestrator_3_stream/backend/modules/orchestrator_service.py` - Orchestrator logic
  - `apps/orchestrator_3_stream/backend/modules/agent_manager.py` - Agent lifecycle
  - `apps/orchestrator_3_stream/backend/modules/command_agent_hooks.py` - Hook implementations
  - `apps/orchestrator_3_stream/backend/modules/websocket_manager.py` - WebSocket broadcasting
  - `apps/orchestrator_3_stream/frontend/src/stores/orchestratorStore.ts` - Frontend state
  - `apps/orchestrator_3_stream/frontend/src/services/chatService.ts` - WebSocket client
  - `apps/orchestrator_3_stream/app_docs/full-stack-architecture-summary.md` - Architecture docs
