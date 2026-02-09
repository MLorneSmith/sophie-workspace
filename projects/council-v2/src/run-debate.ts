#!/usr/bin/env node
/**
 * Council v2 - Run Debate via Clawdbot
 * 
 * This script is meant to be run from within a Clawdbot session.
 * It uses the sessions_spawn tool to call each agent.
 * 
 * Usage (from Clawdbot):
 *   exec: node ~/clawd/projects/council-v2/src/run-debate.js "Topic to debate"
 */

import { execSync } from 'child_process';
import { 
  createSession, 
  getSession,
  type DebateSession 
} from './orchestrator.js';
import { buildTurnPrompt, buildVotingPrompt, buildSynthesisPrompt } from './prompts.js';
import type { AgentId, AgentTurn, Vote, Stance, AgentConfig } from './types.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.env.HOME || '', 'clawd/data/council');

/**
 * Call an agent using a simple HTTP request to Clawdbot gateway
 * This is a workaround since we can't use sessions_spawn directly from Node
 */
async function callAgentViaGateway(model: string, prompt: string, label: string): Promise<string> {
  // Write prompt to temp file
  const tempFile = `/tmp/council-prompt-${Date.now()}.txt`;
  writeFileSync(tempFile, prompt);
  
  // Use curl to call the gateway API
  // Note: This assumes the gateway is running and accessible
  try {
    const result = execSync(`
      curl -s -X POST "http://localhost:3033/api/chat" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLAWDBOT_API_KEY" \
        -d @- << 'ENDJSON'
{
  "model": "${model}",
  "messages": [{"role": "user", "content": $(cat ${tempFile} | jq -Rs .)}],
  "max_tokens": 4096
}
ENDJSON
    `, { encoding: 'utf-8', timeout: 120000 });
    
    const parsed = JSON.parse(result);
    return parsed.choices?.[0]?.message?.content || parsed.content || result;
  } catch (error) {
    console.error(`Error calling ${model}:`, error);
    throw error;
  }
}

/**
 * Simpler approach: Write instructions for Clawdbot to follow
 */
function generateDebateScript(topic: string, context?: string): string {
  const session = createSession(topic, context);
  
  const script = `# Council v2 Debate Script
# Session: ${session.id}
# Topic: ${topic}

## Instructions for Clawdbot

Run this debate by spawning sub-agents for each turn. After each response, 
update the session file at: ${DATA_DIR}/${session.id}.json

### Round 1

**Turn 1: Claude (Reasoner)**
\`\`\`
sessions_spawn:
  model: anthropic/claude-opus-4-5
  label: council-${session.id}-claude-r1
  task: |
${buildTurnPrompt(session, session.config.agents[0], 1, ['claude', 'gpt', 'glm'], []).split('\n').map(l => '    ' + l).join('\n')}
\`\`\`

After Claude responds, parse the response and add to session.rounds[0].turns.

**Turn 2: GPT (Pragmatist)**
[Wait for Claude's response, then build prompt with Claude's turn included]

**Turn 3: GLM (Synthesizer)**  
[Wait for GPT's response, then build prompt with both turns included]

### Subsequent Rounds
Repeat for rounds 2-5 (or until consensus detected).

### Voting Phase
After final round, run voting prompts for each agent.

### Synthesis Phase
Run synthesis prompt with GLM.

---
Session created. Use the orchestrator functions to manage state.
`;

  // Save script alongside session
  const scriptPath = join(DATA_DIR, `${session.id}-script.md`);
  writeFileSync(scriptPath, script);
  
  return session.id;
}

// Simple debate runner that outputs prompts for manual/Clawdbot execution
async function main() {
  const topic = process.argv[2];
  const context = process.argv[3];
  
  if (!topic) {
    console.log('Council v2 Debate Runner');
    console.log('');
    console.log('Usage: node run-debate.js "Topic to debate" ["Optional context"]');
    console.log('');
    console.log('This will create a debate session and output the prompts for each turn.');
    process.exit(1);
  }
  
  console.log('Creating debate session...');
  const sessionId = generateDebateScript(topic, context);
  
  console.log(`\nSession created: ${sessionId}`);
  console.log(`Script saved to: ${DATA_DIR}/${sessionId}-script.md`);
  console.log(`\nTo run this debate interactively, use the council-runner Clawdbot skill.`);
}

main().catch(console.error);
