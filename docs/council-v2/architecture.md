# Council v2: Multi-Agent Deliberation System

## Overview

Council v2 is a multi-agent deliberation system where three LLM agents (Claude, GPT, GLM) run simultaneously, debate topics, and converge on agreed outputs. The system uses structured turn-taking with a synthesis phase to produce high-quality consensus answers.

## Design Goals

1. **Model diversity**: Leverage different model strengths (Claude's reasoning, GPT's coding, GLM's efficiency)
2. **Structured deliberation**: Clear turn-taking with explicit agreement/disagreement
3. **Convergence**: Detect and surface consensus vs. persistent disagreement
4. **Transparency**: Full transcript of reasoning, not just final answer
5. **Human-in-the-loop**: Allow injection of clarifications or steering

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Council Orchestrator                     │
│                     (Clawdbot Main Session)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │   Claude    │    │    GPT      │    │    GLM      │         │
│   │   Agent     │    │   Agent     │    │   Agent     │         │
│   │ (Reasoner)  │    │ (Pragmatist)│    │(Synthesizer)│         │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                 │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Debate State   │                          │
│                    │   (JSON/DB)     │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Mission Control │
                    │   (UI + API)     │
                    └─────────────────┘
```

---

## Agent Roles

| Agent | Model | Role | Strengths |
|-------|-------|------|-----------|
| **Claude** | anthropic/claude-opus-4-5 | Reasoner | Deep analysis, nuanced thinking, structured arguments |
| **GPT** | openai/gpt-4o | Pragmatist | Practical solutions, implementation focus, balanced views |
| **GLM** | zai/glm-4.7 | Synthesizer | Efficient processing, finding common ground, summarization |

Roles can be configured per-debate. The "Synthesizer" role is particularly important for the consensus phase.

---

## Message Protocol

### Turn Structure

Each turn consists of:
1. **Position statement** — Agent's current view on the topic
2. **Response to others** — Explicit agreement/disagreement with prior points
3. **Evidence/reasoning** — Supporting arguments
4. **Confidence level** — 1-5 scale on their position

### Message Format

```typescript
interface AgentTurn {
  agentId: 'claude' | 'gpt' | 'glm';
  roundNumber: number;
  position: string;           // Core position (1-3 sentences)
  responses: {
    agentId: string;
    stance: 'agree' | 'disagree' | 'partial';
    comment: string;
  }[];
  reasoning: string;          // Full argument
  confidence: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
}
```

### Addressing Protocol

Agents address each other explicitly:
- `@claude` / `@gpt` / `@glm` for direct responses
- Must acknowledge prior points before introducing new arguments
- Cannot ignore direct questions from other agents

---

## Orchestration Flow

### Round-Robin with Synthesis

```
┌─────────────────────────────────────────────────────────┐
│                    DELIBERATION PHASE                    │
│                                                          │
│  Round 1:  Claude → GPT → GLM                           │
│  Round 2:  GPT → GLM → Claude  (rotate start)           │
│  Round 3:  GLM → Claude → GPT                           │
│  ...                                                     │
│  (max 5 rounds or until consensus detected)             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    VOTING PHASE                          │
│                                                          │
│  Each agent states:                                      │
│  1. Final position (1 sentence)                         │
│  2. Confidence (1-5)                                    │
│  3. Agreement with other agents (agree/partial/disagree)│
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SYNTHESIS PHASE                        │
│                                                          │
│  GLM (Synthesizer) produces:                            │
│  1. Consensus summary (if agreement ≥2/3)               │
│  2. Disagreement summary (if no consensus)              │
│  3. Key insights from each perspective                  │
│  4. Recommended action/conclusion                       │
└─────────────────────────────────────────────────────────┘
```

### Consensus Detection

Consensus is detected when:
- **Strong consensus**: All 3 agents agree (stance = 'agree')
- **Soft consensus**: 2 agents agree, 1 partial
- **No consensus**: 2+ agents disagree

Early termination conditions:
- Strong consensus reached in any round
- Max rounds (5) exhausted
- Human intervention signals stop

---

## Data Model

### Debate Session

```typescript
interface DebateSession {
  id: string;                    // cuid
  topic: string;                 // The question or topic
  context?: string;              // Additional context/constraints
  status: 'active' | 'voting' | 'synthesizing' | 'complete' | 'cancelled';
  config: {
    maxRounds: number;           // default: 5
    agents: AgentConfig[];       // which models + roles
    consensusThreshold: number;  // default: 2 (out of 3)
  };
  rounds: DebateRound[];
  votingRound?: VotingRound;
  synthesis?: Synthesis;
  createdAt: string;
  completedAt?: string;
  humanInjections: HumanInjection[];
}

interface DebateRound {
  roundNumber: number;
  turns: AgentTurn[];
  startedAt: string;
  completedAt?: string;
}

interface VotingRound {
  votes: {
    agentId: string;
    finalPosition: string;
    confidence: number;
    agreements: { agentId: string; stance: string }[];
  }[];
  consensusReached: boolean;
  consensusType?: 'strong' | 'soft' | 'none';
}

interface Synthesis {
  synthesizerId: string;         // which agent did synthesis
  consensusSummary?: string;
  disagreementSummary?: string;
  keyInsights: { agentId: string; insight: string }[];
  recommendation: string;
  createdAt: string;
}

interface HumanInjection {
  message: string;
  injectedAt: string;
  targetAgent?: string;          // optional: direct to specific agent
}
```

---

## Implementation Strategy

### Phase 1: Orchestrator Core (using Clawdbot)

The orchestrator runs as a Clawdbot session that:
1. Spawns sub-agents for each model using `sessions_spawn`
2. Manages turn order and round progression
3. Collects and parses responses
4. Detects consensus
5. Triggers synthesis

```typescript
// Pseudocode for orchestrator
async function runDebate(topic: string, context?: string) {
  const session = createDebateSession(topic, context);
  
  for (let round = 1; round <= session.config.maxRounds; round++) {
    const turnOrder = getTurnOrder(round);
    
    for (const agentId of turnOrder) {
      const prompt = buildPrompt(session, agentId, round);
      const response = await sessions_spawn({
        task: prompt,
        model: getModelForAgent(agentId),
        label: `council-${session.id}-${agentId}`,
      });
      
      const turn = parseTurn(response, agentId, round);
      session.rounds[round - 1].turns.push(turn);
      
      // Check for early consensus
      if (detectEarlyConsensus(session)) {
        break;
      }
    }
  }
  
  // Voting phase
  await runVotingPhase(session);
  
  // Synthesis phase
  await runSynthesisPhase(session);
  
  return session;
}
```

### Phase 2: Storage

**Option A: JSON files** (simple, good for MVP)
- Store in `~/clawd/data/council/debates/{id}.json`
- Easy to inspect and debug
- No DB dependency

**Option B: Mission Control DB** (better for UI integration)
- Add Prisma models for DebateSession, Round, Turn
- Full query capabilities
- Better for production

**Recommendation**: Start with JSON files, migrate to DB when UI is built.

### Phase 3: API Endpoints

```
POST   /api/council/debates           # Start new debate
GET    /api/council/debates           # List debates
GET    /api/council/debates/:id       # Get debate status + transcript
POST   /api/council/debates/:id/inject # Human injection
DELETE /api/council/debates/:id       # Cancel debate
```

### Phase 4: UI

- Real-time debate viewer (WebSocket or SSE)
- Agent avatars with role badges
- Turn-by-turn transcript with stance indicators
- Consensus meter visualization
- Human injection input

---

## Prompt Engineering

### Initial Position Prompt

```
You are {AGENT_NAME}, participating in a structured deliberation with two other AI agents.

Your role: {ROLE_DESCRIPTION}

Topic: {TOPIC}
Context: {CONTEXT}

This is Round {N}. You are going {FIRST|SECOND|THIRD}.

{PREVIOUS_TURNS if any}

Provide your response in this format:

## Position
[Your core position on the topic in 1-3 sentences]

## Responses to Others
{For each prior agent this round:}
- @{agent}: [agree|disagree|partial] — [1-2 sentence response]

## Reasoning
[Your full argument, 2-4 paragraphs]

## Confidence
[1-5, where 1=very uncertain, 5=highly confident]
```

### Synthesis Prompt

```
You are the Synthesizer for this Council deliberation.

Topic: {TOPIC}

Full Transcript:
{ALL_ROUNDS}

Voting Results:
{VOTING_ROUND}

Your task:
1. If consensus was reached, summarize the agreed position
2. If no consensus, summarize the key disagreements
3. Extract the most valuable insight from each agent
4. Provide a final recommendation

Format your response as:

## Consensus Summary
[If applicable]

## Disagreement Summary
[If no consensus]

## Key Insights
- @claude: [insight]
- @gpt: [insight]
- @glm: [insight]

## Recommendation
[Your final recommendation based on the deliberation]
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Agent times out | Skip turn, note in transcript, continue |
| Circular arguments | Detect repetition, force voting phase |
| One agent dominates | Track word count, prompt others to respond |
| Deadlock after max rounds | Proceed to synthesis with "no consensus" |
| Human injection mid-round | Insert as special turn, all agents acknowledge |
| Model API failure | Retry 2x, then skip with error note |

---

## Success Metrics

1. **Convergence rate**: % of debates reaching soft/strong consensus
2. **Turn efficiency**: Average rounds to consensus
3. **Insight quality**: Human rating of synthesis usefulness
4. **Diversity score**: Measure of perspective variance before synthesis

---

## Open Questions

1. Should agents have access to web search during deliberation?
2. Should there be a "devil's advocate" role that always disagrees?
3. How to handle topics that require code execution or verification?
4. Should synthesis be done by a 4th agent (mediator) or one of the 3?

---

## Next Steps

1. [ ] Review and finalize this architecture
2. [ ] Build minimal orchestrator using sessions_spawn
3. [ ] Create JSON storage for debate sessions
4. [ ] Test with simple factual topic (e.g., "Best programming language for X")
5. [ ] Add API endpoints to Mission Control
6. [ ] Build basic UI viewer
