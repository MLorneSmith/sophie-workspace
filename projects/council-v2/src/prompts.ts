/**
 * Council v2 Prompt Templates
 */

import type { AgentConfig, AgentId, AgentTurn, DebateSession, VotingRound } from './types.js';

/**
 * Build the prompt for an agent's turn in a debate round
 */
export function buildTurnPrompt(
  session: DebateSession,
  agent: AgentConfig,
  roundNumber: number,
  turnOrder: AgentId[],
  previousTurns: AgentTurn[]
): string {
  const position = turnOrder.indexOf(agent.id) + 1;
  const positionLabel = position === 1 ? 'FIRST' : position === 2 ? 'SECOND' : 'THIRD';
  
  let previousTurnsText = '';
  if (previousTurns.length > 0) {
    previousTurnsText = '\n## Previous Turns This Round\n\n';
    for (const turn of previousTurns) {
      const otherAgent = session.config.agents.find(a => a.id === turn.agentId);
      previousTurnsText += `### @${turn.agentId} (${otherAgent?.role || 'Agent'})\n`;
      previousTurnsText += `**Position:** ${turn.position}\n`;
      previousTurnsText += `**Reasoning:** ${turn.reasoning}\n`;
      previousTurnsText += `**Confidence:** ${turn.confidence}/5\n\n`;
    }
  }

  // Include previous rounds summary if not round 1
  let previousRoundsText = '';
  if (roundNumber > 1 && session.rounds.length > 0) {
    previousRoundsText = '\n## Previous Rounds Summary\n\n';
    for (const round of session.rounds) {
      previousRoundsText += `### Round ${round.roundNumber}\n`;
      for (const turn of round.turns) {
        previousRoundsText += `- **@${turn.agentId}**: ${turn.position} (confidence: ${turn.confidence}/5)\n`;
      }
      previousRoundsText += '\n';
    }
  }

  // Include human injections if any
  let injectionsText = '';
  if (session.humanInjections.length > 0) {
    injectionsText = '\n## Human Input\n\n';
    for (const injection of session.humanInjections) {
      injectionsText += `> ${injection.message}\n\n`;
    }
  }

  return `You are ${agent.id.toUpperCase()}, participating in a structured deliberation with two other AI agents.

**Your Role:** ${agent.role}
${agent.roleDescription}

---

## Topic
${session.topic}

${session.context ? `## Context\n${session.context}\n` : ''}
${injectionsText}
---

This is **Round ${roundNumber}**. You are going **${positionLabel}**.
${previousRoundsText}
${previousTurnsText}
---

Provide your response in this EXACT format:

## Position
[Your core position on the topic in 1-3 sentences]

## Responses to Others
${previousTurns.length > 0 
  ? previousTurns.map(t => `- @${t.agentId}: [agree|disagree|partial] — [1-2 sentence response to their position]`).join('\n')
  : '[No other agents have spoken yet this round]'
}

## Reasoning
[Your full argument, 2-4 paragraphs. Be specific and substantive.]

## Confidence
[A single number from 1-5, where 1=very uncertain, 5=highly confident]

---
Remember: Stay in character as ${agent.role}. Address other agents directly with @mentions. Be substantive, not generic.`;
}

/**
 * Build the prompt for the voting phase
 */
export function buildVotingPrompt(
  session: DebateSession,
  agent: AgentConfig
): string {
  let roundsSummary = '';
  for (const round of session.rounds) {
    roundsSummary += `### Round ${round.roundNumber}\n`;
    for (const turn of round.turns) {
      roundsSummary += `**@${turn.agentId}**: ${turn.position}\n`;
      if (turn.responses.length > 0) {
        for (const resp of turn.responses) {
          roundsSummary += `  - Re @${resp.agentId}: ${resp.stance} — ${resp.comment}\n`;
        }
      }
      roundsSummary += `  Confidence: ${turn.confidence}/5\n\n`;
    }
  }

  const otherAgents = session.config.agents.filter(a => a.id !== agent.id);

  return `You are ${agent.id.toUpperCase()} in the VOTING PHASE of a Council deliberation.

## Topic
${session.topic}

## Full Deliberation Transcript
${roundsSummary}

---

It's time to cast your final vote. Provide your response in this EXACT format:

## Final Position
[Your final position in exactly ONE sentence]

## Confidence
[A single number from 1-5]

## Agreement with Other Agents
${otherAgents.map(a => `- @${a.id}: [agree|partial|disagree]`).join('\n')}

---
Be decisive. This is your final word.`;
}

/**
 * Build the prompt for the synthesis phase
 */
export function buildSynthesisPrompt(
  session: DebateSession,
  votingRound: VotingRound
): string {
  let roundsSummary = '';
  for (const round of session.rounds) {
    roundsSummary += `### Round ${round.roundNumber}\n`;
    for (const turn of round.turns) {
      roundsSummary += `**@${turn.agentId}** (${turn.confidence}/5): ${turn.position}\n`;
      roundsSummary += `${turn.reasoning}\n\n`;
    }
  }

  let votingSummary = '### Voting Results\n';
  for (const vote of votingRound.votes) {
    votingSummary += `**@${vote.agentId}** (${vote.confidence}/5): ${vote.finalPosition}\n`;
    votingSummary += `  Agreements: ${vote.agreements.map(a => `@${a.agentId}=${a.stance}`).join(', ')}\n`;
  }
  votingSummary += `\n**Consensus:** ${votingRound.consensusType || 'none'}\n`;

  return `You are the SYNTHESIZER for this Council deliberation.

## Topic
${session.topic}

## Full Deliberation
${roundsSummary}

${votingSummary}

---

Your task is to produce a final synthesis. Provide your response in this EXACT format:

## Consensus Summary
[If consensus was reached, summarize the agreed position. If no consensus, write "No consensus reached."]

## Disagreement Summary
[If there was disagreement, summarize the key points of contention. If full consensus, write "N/A".]

## Key Insights
- @claude: [The most valuable insight from Claude's perspective]
- @gpt: [The most valuable insight from GPT's perspective]
- @glm: [The most valuable insight from GLM's perspective]

## Recommendation
[Your final recommendation based on the deliberation. Be actionable and specific.]

---
Be fair to all perspectives. Highlight genuine insights, not just summaries.`;
}
