#!/usr/bin/env npx ts-node
/**
 * Council v2 CLI
 * 
 * Simple command-line interface for running debates.
 * 
 * Usage:
 *   npx ts-node src/cli.ts start "Topic to debate"
 *   npx ts-node src/cli.ts list
 *   npx ts-node src/cli.ts view <session-id>
 *   npx ts-node src/cli.ts inject <session-id> "Human input"
 */

import { createSession, getSession, listSessions, runDebate } from './orchestrator.js';

async function main() {
  const [,, command, ...args] = process.argv;

  switch (command) {
    case 'start': {
      const topic = args[0];
      if (!topic) {
        console.error('Usage: council start "Topic to debate"');
        process.exit(1);
      }
      
      console.log('Starting debate...');
      console.log('Note: This CLI is for demonstration. In practice, use Clawdbot sessions_spawn.');
      
      // Create session without running (actual running needs Clawdbot integration)
      const session = createSession(topic);
      console.log(`Created session: ${session.id}`);
      console.log(`Topic: ${session.topic}`);
      console.log(`Status: ${session.status}`);
      console.log('\nTo run this debate, use Clawdbot with the orchestrator.');
      break;
    }

    case 'list': {
      const sessions = listSessions();
      if (sessions.length === 0) {
        console.log('No debate sessions found.');
        break;
      }
      console.log('Debate Sessions:');
      console.log('----------------');
      for (const session of sessions) {
        console.log(`${session.id} | ${session.status.padEnd(12)} | ${session.topic.slice(0, 50)}`);
      }
      break;
    }

    case 'view': {
      const id = args[0];
      if (!id) {
        console.error('Usage: council view <session-id>');
        process.exit(1);
      }
      
      const session = getSession(id);
      if (!session) {
        console.error(`Session ${id} not found`);
        process.exit(1);
      }
      
      console.log('='.repeat(60));
      console.log(`Debate: ${session.id}`);
      console.log('='.repeat(60));
      console.log(`Topic: ${session.topic}`);
      console.log(`Status: ${session.status}`);
      console.log(`Created: ${session.createdAt}`);
      console.log(`Completed: ${session.completedAt || 'In progress'}`);
      
      if (session.rounds.length > 0) {
        console.log('\n--- Rounds ---');
        for (const round of session.rounds) {
          console.log(`\nRound ${round.roundNumber}:`);
          for (const turn of round.turns) {
            console.log(`  @${turn.agentId} (${turn.confidence}/5): ${turn.position}`);
          }
        }
      }
      
      if (session.votingRound) {
        console.log('\n--- Voting ---');
        console.log(`Consensus: ${session.votingRound.consensusType || 'none'}`);
        for (const vote of session.votingRound.votes) {
          console.log(`  @${vote.agentId}: ${vote.finalPosition}`);
        }
      }
      
      if (session.synthesis) {
        console.log('\n--- Synthesis ---');
        if (session.synthesis.consensusSummary) {
          console.log(`Consensus: ${session.synthesis.consensusSummary}`);
        }
        if (session.synthesis.disagreementSummary) {
          console.log(`Disagreement: ${session.synthesis.disagreementSummary}`);
        }
        console.log(`Recommendation: ${session.synthesis.recommendation}`);
      }
      break;
    }

    default:
      console.log('Council v2 CLI');
      console.log('');
      console.log('Commands:');
      console.log('  start <topic>      Create a new debate session');
      console.log('  list               List all debate sessions');
      console.log('  view <id>          View a debate session');
      console.log('  inject <id> <msg>  Inject human input into active debate');
  }
}

main().catch(console.error);
