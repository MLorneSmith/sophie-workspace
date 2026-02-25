# Council Debate Orchestration (Hybrid Pattern)

## Architecture

```
User Request / Webhook
    │
    ▼
Main Session (Sophie)
    │
    └── sessions_spawn → Orchestrator Sub-Agent
                              │
                              ├── sessions_spawn(opus) → Claude turn
                              ├── sessions_spawn(gpt-5.2) → GPT turn
                              └── sessions_spawn(GLM) → GLM turn
                              │
                              └── Posts to Mission Control + Announces result
```

## Triggering a Debate

### From Main Session (Direct Ask)
When user says "Have the council debate X":

```typescript
sessions_spawn({
  task: `COUNCIL ORCHESTRATOR

Debate Topic: "${topic}"
Context: "${context || 'None provided'}"

You are orchestrating a council debate. Follow these steps exactly:

1. CREATE DEBATE
   POST http://localhost:3001/api/council/debates
   Body: {"topic": "${topic}", "context": "${context}"}
   Save the debate ID.

2. RUN 2 ROUNDS
   For each round (1-2):
   
   a) Spawn Claude (Reasoner):
      sessions_spawn({
        model: "opus",
        task: "COUNCIL MEMBER: Claude the Reasoner..."
      })
   
   b) Spawn GPT (Pragmatist):
      sessions_spawn({
        model: "openai-codex/gpt-5.2",
        task: "COUNCIL MEMBER: GPT the Pragmatist..."
      })
   
   c) Spawn GLM (Synthesizer):
      sessions_spawn({
        model: "GLM",
        task: "COUNCIL MEMBER: GLM the Synthesizer..."
      })
   
   d) Post each turn to Mission Control:
      POST /api/council/debates/{id}/turns

3. GENERATE SYNTHESIS
   After round 2, synthesize all positions into:
   - consensusSummary, disagreementSummary
   - consensusType (strong|soft|none)
   - keyInsights, recommendation
   
   POST /api/council/debates/{id}/synthesis

4. COMPLETE DEBATE
   PATCH /api/council/debates/{id}
   Body: {"status": "complete", ...}

5. ANNOUNCE TO DISCORD
   Post summary to #general with the recommendation.

IMPORTANT: Wait for each spawn to complete before continuing.
`,
  label: `council-debate-${debateId}`,
  runTimeoutSeconds: 600  // 10 min max for full debate
})
```

### From Webhook
Webhook calls main session, which spawns the orchestrator.

## Council Member Prompts

### Claude (Reasoner) - Round 1
```
COUNCIL MEMBER: Claude the Reasoner

You are participating in a council debate as the logical analyst.

DEBATE TOPIC: {topic}
CONTEXT: {context}

Your role: Apply first-principles thinking. Break down the problem logically.
Focus on the fundamental truths and build reasoning from there.

Respond in this EXACT format (no other text):
POSITION: [Your clear position, 1-3 sentences]
REASONING: [Your logical analysis, 2-4 sentences]
CONFIDENCE: [1-5, where 5 is very confident]
```

### Claude (Reasoner) - Round 2+
```
COUNCIL MEMBER: Claude the Reasoner

DEBATE TOPIC: {topic}
CONTEXT: {context}

PREVIOUS POSITIONS:
- GPT (Pragmatist): {gpt_position}
- GLM (Synthesizer): {glm_position}
- Your previous position: {claude_prev_position}

Consider the other perspectives. Update or strengthen your position.

Respond in this EXACT format:
POSITION: [Updated position, 1-3 sentences]
REASONING: [Updated reasoning considering others, 2-4 sentences]
RESPONSES:
  - To GPT: [Your response to their pragmatic view]
  - To GLM: [Your response to their synthesis]
CONFIDENCE: [1-5]
```

### GPT (Pragmatist)
Same format, but role is:
```
Your role: Focus on practical implementation. Consider real-world constraints,
resources, timelines, and what actually works in practice.
```

### GLM (Synthesizer)
Same format, but role is:
```
Your role: Find common ground and holistic solutions. Look for ways to 
integrate different perspectives into a coherent recommendation.
```

## Mission Control API

```bash
# Create debate
POST /api/council/debates
{"topic": "...", "context": "..."}
→ Returns {id, topic, status: "active", ...}

# Post turn
POST /api/council/debates/{id}/turns
{
  "roundNumber": 1,
  "agentId": "claude|gpt|glm",
  "agentRole": "Reasoner|Pragmatist|Synthesizer",
  "status": "complete",
  "position": "...",
  "reasoning": "...",
  "confidence": 4,
  "responses": {...}  // Round 2+
}

# Post synthesis
POST /api/council/debates/{id}/synthesis
{
  "consensusSummary": "...",
  "disagreementSummary": "...",
  "consensusType": "strong|soft|none",
  "keyInsights": [
    {"agentId": "claude", "insight": "..."},
    ...
  ],
  "recommendation": "..."
}

# Complete debate
PATCH /api/council/debates/{id}
{
  "status": "complete",
  "consensusType": "soft",
  "recommendation": "Final recommendation text",
  "completedAt": "2026-02-07T17:00:00Z"
}
```

## Progress Updates (Optional)

Orchestrator can post progress to Discord thread:
```
message({
  action: "send",
  target: "#council-debates",
  message: "🎭 Council debate started: {topic}\n⏳ Round 1 in progress..."
})
```

Updates at key moments:
- Debate started
- Round N complete
- Synthesis generated
- Final result
