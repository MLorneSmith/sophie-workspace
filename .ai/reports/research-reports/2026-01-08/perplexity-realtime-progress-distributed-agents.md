# Perplexity Research: Real-Time Progress Reporting in Distributed Agent Systems

**Date**: 2026-01-08
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Research into best practices for real-time progress reporting and polling patterns in distributed agent systems, specifically for an orchestrator managing multiple E2B sandboxes running Claude Code agents. Current challenges include unreliable progress updates via JSON file polling.

---

## 1. Event-Driven vs Polling Patterns

### Recommended Architecture (2024-2025)

The dominant pattern for distributed autonomous AI agents is a **hybrid model**:
- **Push for data-plane telemetry** - Detailed events/traces over message broker or HTTP/WebSocket
- **Pull/heartbeats for control-plane liveness** - Orchestrator periodically validates heartbeats in state store

### Event-Driven (Push) Approach

**Pattern:**
- Agent runs in sandbox with append-only, outbound-only channels
- Message bus options: Kafka, NATS, Pulsar, Redis Streams
- HTTP/WebSocket callback to gateway
- Logging/telemetry sink (OpenTelemetry collector)

**Agent emits:**
- Lifecycle events: `started`, `step_completed`, `tool_called`, `subtask_spawned`, `finished`, `failed`
- Progress metrics: percentage, items processed, latency, tokens, cost
- Governance events: risky action flagged, policy check result, human-review-required

**Strengths:**
- Low latency & high fidelity
- Scales better (consumers subscribe without changing agents)
- Good for multi-agent coordination

**Weaknesses:**
- More complex infrastructure
- Requires careful security/isolation
- Needs durable queues and local buffering

### Polling (Pull) Approach

**Pattern:**
- Orchestrator polls task state store (DB/Redis) that sandbox updates
- Or polls sandbox management API for status

**Strengths:**
- Simpler trust boundary
- Easier for air-gapped or regulated deployments

**Weaknesses:**
- Latency/overhead trade-off
- Poor multi-agent coordination
- Polling storms under large fleet sizes

### When to Use Each

| Scenario | Recommended | Notes |
|----------|-------------|-------|
| High-scale multi-agent workflows | Event-driven push + heartbeat | Default for production systems |
| Highly regulated, restricted egress | Polling + minimal push | Use control-plane polling |
| Small-scale, non-interactive batch | Simple polling | Accept higher latency |
| Mission-critical, high-risk actions | Push + strong stall detection + checkpoint | Add approval workflows |

---

## 2. Heartbeat Mechanisms & Stall Detection

### Optimal Intervals

**Key Parameters:**
- **Heartbeat interval (Th)**: 1-5s for interactive/control-plane; 10-30s for background
- **Failure timeout (Tf)**: 3-5x heartbeat interval, OR >= 10x average RTT
- **Missed heartbeats before failure**: 3-5 consecutive misses

**Recommended Settings by Use Case:**

| Component | Interval | Misses | Detection Time |
|-----------|----------|--------|----------------|
| Control-plane service | 2s | 3 | ~6s |
| Geo-distributed service | 5s | 3-5 | 15-25s |
| Worker/executor (CI runners) | 5-10s | 3-6 | 15-60s |

**Your current 60-second interval is too long** for interactive systems. Consider:
- 10-15s base heartbeat for agents
- 3 missed heartbeats = stall detected (30-45s total)
- Dynamic intervals: shorter when interactive, longer during known long operations

### Heartbeat Payload Best Practices

Include in heartbeat messages:
- Agent ID, task ID
- Current step/phase
- Last successful action timestamp
- Queue length
- Resource usage (CPU/memory)
- Sequence number (monotonic)

### Stall Detection Patterns

**Multi-signal approach:**
1. **Heartbeat for liveness** - Is the agent process alive?
2. **Progress events for activity** - Is work actually happening?
3. **Deeper health checks** - DB reachability, queue lag, resource usage

**Implementation:**
```python
def calculate_timeout(round_trip_time_ms, heartbeat_interval_ms):
    rtt_based_timeout = round_trip_time_ms * 10   # >= 10x RTT
    interval_based_timeout = heartbeat_interval_ms * 3  # >= 3 missed heartbeats
    return max(rtt_based_timeout, interval_based_timeout)
```

### CI/CD System Approaches

**GitHub Actions:**
- Runners maintain persistent connection with periodic status pings
- Jobs have configurable `timeout-minutes` (default 360)
- No-output timeout: 5-30 minutes (cancels inactive jobs)
- Pattern: emit periodic log messages every 1-5 minutes

**GitLab CI/CD:**
- Runners send periodic heartbeats to coordinator
- `job_timeout` for max duration
- Stuck job detection: 10-30 minutes of no output
- Jobs marked stale if runner heartbeats stop

---

## 3. Progress Reporting Patterns

### Structured Progress Format

**Recommended event schema:**
```json
{
  "version": "v1",
  "id": "event-uuid",
  "type": "JOB_PROGRESS",
  "jobId": "job-123",
  "agentId": "agent-456",
  "step": 5,
  "totalSteps": 10,
  "percent": 50,
  "state": "running",
  "message": "Processing file 5 of 10",
  "timestamp": "2026-01-08T12:00:00Z",
  "seq": 42
}
```

**Standard Event Types:**
- `JOB_QUEUED` - Task assigned to agent
- `JOB_STARTED` - Agent began work
- `JOB_PROGRESS` - Incremental progress update
- `JOB_LOG` - Log output from agent
- `JOB_CHECKPOINT` - Checkpoint saved
- `JOB_COMPLETED` - Task finished successfully
- `JOB_FAILED` - Task failed with error

### Liveness vs Progress Distinction

**Liveness signals** (heartbeats):
- "I am alive and responsive"
- Lightweight, frequent (5-15s)
- Independent channel from main data

**Progress signals**:
- "I am making forward progress on the task"
- Heavier, task-specific
- Reset stall timers

**Best practice**: Both signals should reset stall detection, but heartbeats alone (without progress) after extended time should trigger review.

---

## 4. E2B Sandbox Specific Capabilities

### Built-in Monitoring Features

**Lifecycle Events API:**
```javascript
// Get events for specific sandbox
const resp = await fetch(`https://api.e2b.app/events/sandboxes/${sbx.id}`, {
  method: 'GET',
  headers: { 'X-API-Key': E2B_API_KEY }
});
```

**Event Types:**
- `sandbox.lifecycle.created` - Sandbox started
- `sandbox.lifecycle.updated` - Configuration changed (timeout, etc.)
- `sandbox.lifecycle.killed` - Sandbox terminated
- `sandbox.lifecycle.paused` - Sandbox paused
- `sandbox.lifecycle.resumed` - Sandbox resumed

### Webhook Support (Push from E2B)

E2B supports webhooks for lifecycle events:
```javascript
await fetch('https://api.e2b.app/events/webhooks', {
  method: 'POST',
  headers: {
    'X-API-Key': E2B_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Sandbox Webhook',
    url: 'https://your-endpoint.com/webhook',
    enabled: true,
    events: ['sandbox.lifecycle.created', 'sandbox.lifecycle.updated', 'sandbox.lifecycle.killed'],
    signatureSecret: 'secret-for-verification'
  })
});
```

**Webhook payload includes:**
- Sandbox ID, template ID, team ID
- Event type and timestamp
- Custom metadata
- Signature for verification

### Communication Options from Sandbox

1. **Process stdout/stderr streaming** - E2B SDK supports real-time output streaming
2. **File-based progress** - Your current approach (least reliable)
3. **HTTP callbacks** - Agent can POST to external endpoint
4. **E2B lifecycle webhooks** - For sandbox-level events only

**Limitation**: E2B webhooks only cover lifecycle events, not custom application progress. For agent-level progress, you need to implement your own mechanism.

### Recommended E2B Architecture

```
Agent in Sandbox
    |
    v
HTTP POST progress --> Your API Endpoint
    |                        |
    v                        v
E2B Lifecycle Webhooks   Message Queue (NATS/Redis)
    |                        |
    +---------+--------------+
              |
              v
         Orchestrator
              |
              v
     SSE/WebSocket to UI
```

---

## 5. Modern Communication Solutions

### SSE vs WebSocket vs Message Queues

**For sandbox-to-orchestrator (backend):**
- **Prefer message queues** (NATS, Redis Streams)
- Asynchronous, reliable, decoupled
- Handles restarts and bursts
- Provides durability, routing, backpressure

**For orchestrator-to-UI (frontend):**
- **SSE for read-only progress streams** - Simpler, built-in reconnection
- **WebSocket only if bidirectional needed** - More complex but supports interaction

### NATS vs Redis Comparison

| Feature | NATS (JetStream) | Redis Streams |
|---------|------------------|---------------|
| Fire-and-forget | NATS core subjects | Redis pub/sub |
| At-least-once | JetStream | XADD/XREADGROUP |
| Best for | Message-first systems | Redis-already-in-stack |
| Durability | Built-in | Streams only (not pub/sub) |

**Recommendation**: NATS JetStream for agent orchestration (purpose-built, simpler ops)

### Recommended Architecture

```
1. Sandboxed Agent
   |
   v  (Publishes to)
2. Message Bus (NATS JetStream / Redis Streams)
   - Subject: jobs.<jobId>.progress
   - Payload: { jobId, step, totalSteps, percent, state, timestamp, seq }
   |
   v  (Subscribes)
3. Orchestrator / API Layer
   - Normalizes, aggregates, authorizes
   - Persists to DB for replay
   |
   v  (Exposes)
4. SSE/WebSocket to Browser
   - EventSource for read-only progress
   - WebSocket if interactive control needed
```

**Why this works:**
- Queue provides durability and backpressure
- Can replay from sequence on reconnect
- Sandboxes only see message bus (isolation)
- Can scale orchestrators independently

---

## 6. Checkpoint/Resume Patterns

### What to Checkpoint

**Task-level state (outside sandbox):**
- High-level plan (subgoals, progress)
- Key intermediate artifacts
- Tool call history and results
- External side effects committed

**Agent-level control state:**
- Current step index/phase
- Important scratchpad/context
- Relevant IDs and references

### Checkpoint Frequency

**Time-based**: Every N seconds/steps/tokens
**Event-based**: After each high-risk action

**Recommendation**: Checkpoint on:
- Major milestones (phase completion)
- Every 5-10 minutes of work
- Before any side-effect operations
- On graceful shutdown signal

### Implementation Best Practices

1. **Stateless sandboxes; stateful orchestrator**
   - Treat sandbox as ephemeral
   - Orchestrator owns canonical task state in durable store
   - Sandbox: read checkpoint -> do work -> emit events -> request checkpoint update

2. **Idempotent effects**
   - Design tools to be idempotent or transactional
   - Replay after resume should not duplicate side effects

3. **Versioned checkpoints**
   - Include agent version, model version, toolset version
   - On version change, can re-plan from last stable summary

4. **Human-governed resume**
   - For high-impact tasks, route through approval queue

### Resume Protocol

```
1. Load last checkpoint from durable store
2. Verify checkpoint version compatibility
3. Restore agent context/state
4. Resume from last known good step
5. Re-emit "resumed" event with checkpoint ID
6. Continue normal progress reporting
```

---

## 7. Specific Recommendations for Your System

### Immediate Improvements

1. **Reduce heartbeat interval**: 60s -> 15s
2. **Add sequence numbers**: Detect missed updates
3. **Implement HTTP-based progress**: Agent POSTs updates instead of writing files
4. **Use E2B lifecycle webhooks**: Get notified of sandbox death

### Short-term Architecture Changes

1. **Add message queue**: NATS or Redis Streams between agents and orchestrator
2. **Implement proper heartbeat**: Separate from progress, 10-15s interval
3. **Add checkpoint system**: Save state after each major milestone
4. **Improve stall detection**: Multiple missed heartbeats + no progress = stall

### Stall Detection Algorithm

```typescript
interface AgentState {
  lastHeartbeat: Date;
  lastProgress: Date;
  consecutiveMissedHeartbeats: number;
}

function detectStall(agent: AgentState, config: {
  heartbeatInterval: number;  // 15s
  maxMissedHeartbeats: number;  // 3
  maxIdleTime: number;  // 5 minutes
}): 'healthy' | 'warning' | 'stalled' {
  const now = Date.now();
  const heartbeatAge = now - agent.lastHeartbeat.getTime();
  const progressAge = now - agent.lastProgress.getTime();
  
  // Check heartbeat health
  if (heartbeatAge > config.heartbeatInterval * config.maxMissedHeartbeats) {
    return 'stalled';  // No heartbeat = definitely stalled
  }
  
  // Check progress health
  if (progressAge > config.maxIdleTime) {
    return 'warning';  // Alive but no progress = possible stall
  }
  
  return 'healthy';
}
```

---

## Sources & Citations

1. Distributed systems heartbeat patterns and best practices
2. CI/CD system progress monitoring (GitHub Actions, GitLab CI)
3. E2B Documentation - Lifecycle Events API: https://e2b.dev/docs/sandbox/lifecycle-events-api
4. E2B Documentation - Lifecycle Webhooks: https://e2b.dev/docs/sandbox/lifecycle-events-webhooks
5. SSE vs WebSocket comparison for real-time applications
6. NATS JetStream vs Redis Streams for message queuing
7. Agent orchestration architecture patterns

---

## Key Takeaways

1. **Hybrid push+pull is the 2024-2025 best practice** - Use event-driven push for telemetry, polling/heartbeats for liveness

2. **Your 60-second polling is too slow** - Move to 10-15s heartbeats with 3-miss stall detection (30-45s total)

3. **E2B has lifecycle webhooks** - Use them for sandbox-level events, but implement your own progress reporting

4. **File-based progress is unreliable** - Switch to HTTP POST from agent or message queue

5. **Use message queues as source of truth** - NATS JetStream or Redis Streams provide durability and replay

6. **Separate liveness from progress** - Heartbeats prove agent is alive; progress proves work is happening

7. **Implement checkpointing** - Save state on milestones, enable resume from last checkpoint

---

## Related Searches

- E2B SDK process streaming and output callbacks
- NATS JetStream setup for TypeScript orchestrators
- Implementing SSE progress endpoints in Next.js
- Claude Code agent checkpoint format design
