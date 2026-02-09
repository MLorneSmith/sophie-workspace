/**
 * Council v2 Orchestrator
 * 
 * Runs multi-agent deliberations using Clawdbot sessions_spawn.
 * This is designed to be called from a Clawdbot session.
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import type {
  AgentId,
  AgentTurn,
  ConsensusType,
  DebateRound,
  DebateSession,
  DebateStatus,
  Stance,
  Vote,
  VotingRound,
} from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import { buildTurnPrompt, buildVotingPrompt, buildSynthesisPrompt } from './prompts.js';

const DATA_DIR = join(process.env.HOME || '~', 'clawd/data/council');

/**
 * Generate a unique debate ID
 */
function generateId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Get turn order for a round (rotates starting position)
 */
function getTurnOrder(roundNumber: number): AgentId[] {
  const agents: AgentId[] = ['claude', 'gpt', 'glm'];
  const rotation = (roundNumber - 1) % 3;
  return [...agents.slice(rotation), ...agents.slice(0, rotation)];
}

/**
 * Parse an agent's response into structured format
 */
function parseTurnResponse(response: string, agentId: AgentId, roundNumber: number): AgentTurn {
  // Extract position
  const positionMatch = response.match(/## Position\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
  const position = positionMatch?.[1]?.trim() || 'Position not provided';

  // Extract responses to others
  const responsesMatch = response.match(/## Responses to Others\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
  const responsesText = responsesMatch?.[1]?.trim() || '';
  
  const responses: { agentId: AgentId; stance: Stance; comment: string }[] = [];
  const responseLines = responsesText.split('\n').filter(l => l.startsWith('-'));
  for (const line of responseLines) {
    const match = line.match(/@(\w+):\s*(agree|disagree|partial)\s*[—-]\s*(.*)/i);
    if (match) {
      responses.push({
        agentId: match[1].toLowerCase() as AgentId,
        stance: match[2].toLowerCase() as Stance,
        comment: match[3].trim(),
      });
    }
  }

  // Extract reasoning
  const reasoningMatch = response.match(/## Reasoning\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
  const reasoning = reasoningMatch?.[1]?.trim() || 'Reasoning not provided';

  // Extract confidence
  const confidenceMatch = response.match(/## Confidence\s*\n\s*(\d)/i);
  const confidence = Math.min(5, Math.max(1, parseInt(confidenceMatch?.[1] || '3', 10))) as 1 | 2 | 3 | 4 | 5;

  return {
    agentId,
    roundNumber,
    position,
    responses,
    reasoning,
    confidence,
    timestamp: new Date().toISOString(),
    rawResponse: response,
  };
}

/**
 * Parse voting response
 */
function parseVotingResponse(response: string, agentId: AgentId, otherAgents: AgentId[]): Vote {
  const positionMatch = response.match(/## Final Position\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
  const finalPosition = positionMatch?.[1]?.trim() || 'Position not provided';

  const confidenceMatch = response.match(/## Confidence\s*\n\s*(\d)/i);
  const confidence = Math.min(5, Math.max(1, parseInt(confidenceMatch?.[1] || '3', 10)));

  const agreements: { agentId: AgentId; stance: Stance }[] = [];
  const agreementMatch = response.match(/## Agreement with Other Agents\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
  if (agreementMatch) {
    for (const other of otherAgents) {
      const stanceMatch = agreementMatch[1].match(new RegExp(`@${other}:\\s*(agree|partial|disagree)`, 'i'));
      if (stanceMatch) {
        agreements.push({
          agentId: other,
          stance: stanceMatch[1].toLowerCase() as Stance,
        });
      }
    }
  }

  return { agentId, finalPosition, confidence, agreements };
}

/**
 * Detect consensus from voting round
 */
function detectConsensus(votes: Vote[]): { reached: boolean; type: ConsensusType } {
  // Count mutual agreements
  let agreeCount = 0;
  let partialCount = 0;

  for (const vote of votes) {
    for (const agreement of vote.agreements) {
      if (agreement.stance === 'agree') agreeCount++;
      if (agreement.stance === 'partial') partialCount++;
    }
  }

  // 6 total agreement pairs (each of 3 agents rates 2 others)
  if (agreeCount >= 5) {
    return { reached: true, type: 'strong' };
  } else if (agreeCount >= 3 || (agreeCount >= 2 && partialCount >= 2)) {
    return { reached: true, type: 'soft' };
  }

  return { reached: false, type: 'none' };
}

/**
 * Save debate session to disk
 */
function saveSession(session: DebateSession): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const path = join(DATA_DIR, `${session.id}.json`);
  writeFileSync(path, JSON.stringify(session, null, 2));
}

/**
 * Load debate session from disk
 */
function loadSession(id: string): DebateSession | null {
  const path = join(DATA_DIR, `${id}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * List all debate sessions
 */
export function listSessions(): DebateSession[] {
  if (!existsSync(DATA_DIR)) return [];
  const { readdirSync } = require('fs');
  const files = readdirSync(DATA_DIR).filter((f: string) => f.endsWith('.json'));
  return files.map((f: string) => loadSession(f.replace('.json', ''))).filter(Boolean) as DebateSession[];
}

/**
 * Create a new debate session
 */
export function createSession(topic: string, context?: string): DebateSession {
  const session: DebateSession = {
    id: generateId(),
    topic,
    context,
    status: 'active',
    config: { ...DEFAULT_CONFIG },
    rounds: [],
    humanInjections: [],
    createdAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

/**
 * Run a single agent turn
 * 
 * NOTE: This function is meant to be called from within a Clawdbot session.
 * In practice, you would use sessions_spawn to call the agent.
 * This is a placeholder that shows the expected interface.
 */
export async function runAgentTurn(
  session: DebateSession,
  agentId: AgentId,
  roundNumber: number,
  previousTurns: AgentTurn[],
  callAgent: (model: string, prompt: string) => Promise<string>
): Promise<AgentTurn> {
  const agent = session.config.agents.find(a => a.id === agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const turnOrder = getTurnOrder(roundNumber);
  const prompt = buildTurnPrompt(session, agent, roundNumber, turnOrder, previousTurns);
  
  const response = await callAgent(agent.model, prompt);
  return parseTurnResponse(response, agentId, roundNumber);
}

/**
 * Run a complete deliberation round
 */
export async function runRound(
  session: DebateSession,
  roundNumber: number,
  callAgent: (model: string, prompt: string) => Promise<string>
): Promise<DebateRound> {
  const turnOrder = getTurnOrder(roundNumber);
  const round: DebateRound = {
    roundNumber,
    turns: [],
    startedAt: new Date().toISOString(),
  };

  for (const agentId of turnOrder) {
    const turn = await runAgentTurn(session, agentId, roundNumber, round.turns, callAgent);
    round.turns.push(turn);
    
    // Update session and save after each turn
    session.rounds = [...session.rounds.filter(r => r.roundNumber !== roundNumber), round];
    saveSession(session);
  }

  round.completedAt = new Date().toISOString();
  return round;
}

/**
 * Run the voting phase
 */
export async function runVotingPhase(
  session: DebateSession,
  callAgent: (model: string, prompt: string) => Promise<string>
): Promise<VotingRound> {
  session.status = 'voting';
  saveSession(session);

  const votes: Vote[] = [];
  
  for (const agent of session.config.agents) {
    const prompt = buildVotingPrompt(session, agent);
    const response = await callAgent(agent.model, prompt);
    const otherAgents = session.config.agents.filter(a => a.id !== agent.id).map(a => a.id);
    const vote = parseVotingResponse(response, agent.id, otherAgents);
    votes.push(vote);
  }

  const consensus = detectConsensus(votes);
  const votingRound: VotingRound = {
    votes,
    consensusReached: consensus.reached,
    consensusType: consensus.type,
  };

  session.votingRound = votingRound;
  saveSession(session);
  
  return votingRound;
}

/**
 * Run the synthesis phase
 */
export async function runSynthesisPhase(
  session: DebateSession,
  callAgent: (model: string, prompt: string) => Promise<string>
): Promise<void> {
  if (!session.votingRound) throw new Error('Voting phase must complete first');
  
  session.status = 'synthesizing';
  saveSession(session);

  // Use GLM (Synthesizer) for synthesis
  const synthesizer = session.config.agents.find(a => a.id === 'glm');
  if (!synthesizer) throw new Error('Synthesizer agent not found');

  const prompt = buildSynthesisPrompt(session, session.votingRound);
  const response = await callAgent(synthesizer.model, prompt);

  // Parse synthesis response
  const consensusSummaryMatch = response.match(/## Consensus Summary\s*\n([\s\S]*?)(?=\n## |\$)/i);
  const disagreementSummaryMatch = response.match(/## Disagreement Summary\s*\n([\s\S]*?)(?=\n## |\$)/i);
  const recommendationMatch = response.match(/## Recommendation\s*\n([\s\S]*?)(?=\n## |\$)/i);
  
  // Parse key insights
  const insightsMatch = response.match(/## Key Insights\s*\n([\s\S]*?)(?=\n## |\$)/i);
  const keyInsights: { agentId: AgentId; insight: string }[] = [];
  if (insightsMatch) {
    for (const agentId of ['claude', 'gpt', 'glm'] as AgentId[]) {
      const insightMatch = insightsMatch[1].match(new RegExp(`@${agentId}:\\s*(.+)`, 'i'));
      if (insightMatch) {
        keyInsights.push({ agentId, insight: insightMatch[1].trim() });
      }
    }
  }

  session.synthesis = {
    synthesizerId: 'glm',
    consensusSummary: consensusSummaryMatch?.[1]?.trim(),
    disagreementSummary: disagreementSummaryMatch?.[1]?.trim(),
    keyInsights,
    recommendation: recommendationMatch?.[1]?.trim() || 'No recommendation provided',
    createdAt: new Date().toISOString(),
  };

  session.status = 'complete';
  session.completedAt = new Date().toISOString();
  saveSession(session);
}

/**
 * Run a complete debate
 */
export async function runDebate(
  topic: string,
  context: string | undefined,
  callAgent: (model: string, prompt: string) => Promise<string>,
  options?: { maxRounds?: number }
): Promise<DebateSession> {
  const session = createSession(topic, context);
  const maxRounds = options?.maxRounds || session.config.maxRounds;

  console.log(`Starting debate: ${session.id}`);
  console.log(`Topic: ${topic}`);

  // Run deliberation rounds
  for (let round = 1; round <= maxRounds; round++) {
    console.log(`\n--- Round ${round} ---`);
    await runRound(session, round, callAgent);
    
    // Could add early consensus detection here
  }

  // Voting phase
  console.log('\n--- Voting Phase ---');
  await runVotingPhase(session, callAgent);

  // Synthesis phase
  console.log('\n--- Synthesis Phase ---');
  await runSynthesisPhase(session, callAgent);

  console.log('\n--- Debate Complete ---');
  console.log(`Consensus: ${session.votingRound?.consensusType || 'none'}`);
  console.log(`Recommendation: ${session.synthesis?.recommendation}`);

  return session;
}

/**
 * Inject human input into an active debate
 */
export function injectHumanInput(sessionId: string, message: string, targetAgent?: AgentId): void {
  const session = loadSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.status === 'complete' || session.status === 'cancelled') {
    throw new Error(`Cannot inject into ${session.status} session`);
  }

  session.humanInjections.push({
    message,
    injectedAt: new Date().toISOString(),
    targetAgent,
  });
  saveSession(session);
}

/**
 * Get a debate session by ID
 */
export function getSession(id: string): DebateSession | null {
  return loadSession(id);
}
