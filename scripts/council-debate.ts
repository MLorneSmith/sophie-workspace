#!/usr/bin/env npx ts-node
/**
 * Council Debate Orchestrator
 * 
 * Runs a multi-agent debate between Claude, GPT, and GLM.
 * Posts updates to Mission Control in real-time.
 * 
 * Usage:
 *   npx ts-node scripts/council-debate.ts --topic "Should we use SSR or CSR?"
 *   npx ts-node scripts/council-debate.ts --debate-id "abc123"
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const MISSION_CONTROL_URL = process.env.MISSION_CONTROL_URL || "http://localhost:3001";
const GLM_API_KEY = process.env.GLM_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Try to get Anthropic key from env or Claude CLI OAuth
function getAnthropicKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  // Try Claude CLI OAuth credentials
  const credPath = path.join(os.homedir(), ".claude", ".credentials.json");
  try {
    const creds = JSON.parse(fs.readFileSync(credPath, "utf-8"));
    if (creds.claudeAiOauth?.accessToken) {
      console.log("  ℹ️  Using Claude CLI OAuth token");
      return creds.claudeAiOauth.accessToken;
    }
  } catch {
    // ignore
  }
  return undefined;
}

const ANTHROPIC_API_KEY = getAnthropicKey();

const AGENTS = {
  claude: {
    name: "Claude",
    role: "Reasoner",
    description: "Focuses on logical analysis, first principles thinking, and identifying assumptions",
  },
  gpt: {
    name: "GPT",
    role: "Pragmatist",
    description: "Focuses on practical implementation, real-world constraints, and actionable recommendations",
  },
  glm: {
    name: "GLM",
    role: "Synthesizer",
    description: "Focuses on finding common ground, bridging perspectives, and holistic solutions",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Mission Control API
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mcFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${MISSION_CONTROL_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mission Control error: ${res.status} ${text}`);
  }
  return res.json();
}

async function createDebate(topic: string, context?: string) {
  const data = await mcFetch("/api/council/debates", {
    method: "POST",
    body: JSON.stringify({ topic, context }),
  });
  return data.debate;
}

async function createRound(debateId: string, roundNumber: number) {
  const data = await mcFetch(`/api/council/debates/${debateId}/rounds`, {
    method: "POST",
    body: JSON.stringify({ roundNumber }),
  });
  return data.round;
}

async function createTurn(debateId: string, roundNumber: number, agentId: string, agentRole: string) {
  const data = await mcFetch(`/api/council/debates/${debateId}/turns`, {
    method: "POST",
    body: JSON.stringify({ roundNumber, agentId, agentRole, status: "thinking" }),
  });
  return data.turn;
}

async function updateTurn(
  debateId: string,
  turnId: string,
  update: {
    status?: string;
    position?: string;
    reasoning?: string;
    confidence?: number;
    responses?: Array<{ agentId: string; stance: string; comment: string }>;
  }
) {
  const body: Record<string, unknown> = { turnId, ...update };
  if (update.responses) {
    body.responses = update.responses; // API will stringify
  }
  await mcFetch(`/api/council/debates/${debateId}/turns`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function completeRound(_debateId: string, _roundNumber: number) {
  // Round completion is implicit when all turns are done
  // No PATCH endpoint currently exists
  return;
}

async function addSynthesis(
  debateId: string,
  synthesis: {
    consensusSummary: string;
    disagreementSummary: string;
    keyInsights: Array<{ agentId: string; insight: string }>;
    recommendation: string;
  }
) {
  await mcFetch(`/api/council/debates/${debateId}/synthesis`, {
    method: "POST",
    body: JSON.stringify({
      ...synthesis,
      keyInsights: JSON.stringify(synthesis.keyInsights),
    }),
  });
}

async function completeDebate(debateId: string, consensusType: string, recommendation: string) {
  await mcFetch(`/api/council/debates/${debateId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "complete",
      consensusType,
      recommendation,
      completedAt: new Date().toISOString(),
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM Calls
// ─────────────────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    // Fallback: use GPT with Claude's persona
    console.log("    ⚠️  No ANTHROPIC_API_KEY, using GPT as fallback for Claude");
    return callGPT(
      systemPrompt + "\n\nNote: You are roleplaying as Claude for this response.",
      userPrompt
    );
  }
  
  // OAuth tokens (sk-ant-oat*) use Bearer auth, API keys use x-api-key
  const isOAuthToken = ANTHROPIC_API_KEY.startsWith("sk-ant-oat");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  };
  
  if (isOAuthToken) {
    headers["Authorization"] = `Bearer ${ANTHROPIC_API_KEY}`;
  } else {
    headers["x-api-key"] = ANTHROPIC_API_KEY;
  }
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${text}`);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  return textBlock?.text || "";
}

async function callGPT(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content || "";
}

async function callGLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GLM_API_KEY) {
    throw new Error("GLM_API_KEY not set");
  }
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4-plus",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAgent(agentId: string, systemPrompt: string, userPrompt: string): Promise<string> {
  switch (agentId) {
    case "claude":
      return callClaude(systemPrompt, userPrompt);
    case "gpt":
      return callGPT(systemPrompt, userPrompt);
    case "glm":
      return callGLM(systemPrompt, userPrompt);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Debate Logic
// ─────────────────────────────────────────────────────────────────────────────

interface TurnResult {
  position: string;
  reasoning: string;
  confidence: number;
  responses?: Array<{ agentId: string; stance: string; comment: string }>;
}

function parseAgentResponse(response: string): TurnResult {
  // Try to parse structured response
  try {
    const positionMatch = response.match(/POSITION:\s*([\s\S]*?)(?=REASONING:|CONFIDENCE:|$)/i);
    const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)(?=CONFIDENCE:|RESPONSES:|$)/i);
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d)/i);
    const responsesMatch = response.match(/RESPONSES:\s*([\s\S]*?)$/i);

    const position = positionMatch?.[1]?.trim() || response.slice(0, 500);
    const reasoning = reasoningMatch?.[1]?.trim() || "";
    const confidence = parseInt(confidenceMatch?.[1] || "3", 10);

    let responses: TurnResult["responses"] = undefined;
    if (responsesMatch) {
      const respText = responsesMatch[1];
      const respLines = respText.split(/\n/).filter((l) => l.trim());
      responses = respLines
        .map((line) => {
          const m = line.match(/@(\w+):\s*(\w+)\s*[–-]\s*(.*)/);
          if (m) {
            return { agentId: m[1].toLowerCase(), stance: m[2].toLowerCase(), comment: m[3].trim() };
          }
          return null;
        })
        .filter(Boolean) as TurnResult["responses"];
    }

    return { position, reasoning, confidence, responses };
  } catch {
    return { position: response.slice(0, 500), reasoning: "", confidence: 3 };
  }
}

async function runRound(
  debateId: string,
  roundNumber: number,
  topic: string,
  context: string | undefined,
  previousRounds: Array<{ agentId: string; position: string }[]>
): Promise<Array<{ agentId: string; result: TurnResult }>> {
  console.log(`\n📢 Starting Round ${roundNumber}...`);

  // Create round in Mission Control
  await createRound(debateId, roundNumber);

  const results: Array<{ agentId: string; result: TurnResult }> = [];
  const agentIds = ["claude", "gpt", "glm"] as const;

  for (const agentId of agentIds) {
    const agent = AGENTS[agentId];
    console.log(`  🤖 ${agent.name} (${agent.role}) thinking...`);

    // Create turn (status: thinking)
    const turn = await createTurn(debateId, roundNumber, agentId, agent.role);

    // Build prompt
    const systemPrompt = `You are ${agent.name}, acting as the ${agent.role} in a council debate.
${agent.description}.

Respond in this format:
POSITION: [Your clear position on the topic, 1-3 sentences]
REASONING: [Your key reasoning, 2-4 sentences]
CONFIDENCE: [1-5, where 5 is most confident]
${
  roundNumber > 1
    ? `RESPONSES: [Respond to other agents, one per line]
@claude: [agree|disagree|partial] – [brief comment]
@gpt: [agree|disagree|partial] – [brief comment]
@glm: [agree|disagree|partial] – [brief comment]`
    : ""
}`;

    let userPrompt = `Topic: ${topic}`;
    if (context) userPrompt += `\nContext: ${context}`;

    if (previousRounds.length > 0) {
      userPrompt += `\n\nPrevious positions:`;
      for (let i = 0; i < previousRounds.length; i++) {
        userPrompt += `\n\nRound ${i + 1}:`;
        for (const p of previousRounds[i]) {
          if (p.agentId !== agentId) {
            userPrompt += `\n@${p.agentId}: ${p.position}`;
          }
        }
      }
    }

    try {
      const response = await callAgent(agentId, systemPrompt, userPrompt);
      const result = parseAgentResponse(response);

      // Update turn in Mission Control
      await updateTurn(debateId, turn.id, {
        status: "complete",
        position: result.position,
        reasoning: result.reasoning,
        confidence: result.confidence,
        responses: result.responses,
      });

      results.push({ agentId, result });
      console.log(`    ✓ Position: ${result.position.slice(0, 80)}...`);
    } catch (err) {
      console.error(`    ✗ Error: ${err}`);
      await updateTurn(debateId, turn.id, {
        status: "complete",
        position: `Error: ${err}`,
        confidence: 0,
      });
      results.push({ agentId, result: { position: `Error: ${err}`, reasoning: "", confidence: 0 } });
    }
  }

  // Complete round
  await completeRound(debateId, roundNumber);
  console.log(`  ✓ Round ${roundNumber} complete`);

  return results;
}

async function generateSynthesis(
  debateId: string,
  topic: string,
  allRounds: Array<Array<{ agentId: string; result: TurnResult }>>
) {
  console.log(`\n📝 Generating synthesis...`);

  // Use Claude to generate synthesis
  const systemPrompt = `You are synthesizing a council debate between Claude, GPT, and GLM.
Analyze their positions and generate a synthesis.

Respond in JSON format:
{
  "consensusSummary": "Areas of agreement (1-2 sentences)",
  "disagreementSummary": "Key disagreements (1-2 sentences, or 'N/A' if none)",
  "consensusType": "strong|soft|none",
  "keyInsights": [
    {"agentId": "claude", "insight": "Key insight from Claude"},
    {"agentId": "gpt", "insight": "Key insight from GPT"},
    {"agentId": "glm", "insight": "Key insight from GLM"}
  ],
  "recommendation": "Final recommendation based on the debate (2-3 sentences)"
}`;

  let userPrompt = `Topic: ${topic}\n\nDebate summary:\n`;
  for (let i = 0; i < allRounds.length; i++) {
    userPrompt += `\nRound ${i + 1}:`;
    for (const { agentId, result } of allRounds[i]) {
      userPrompt += `\n@${agentId}: ${result.position}`;
      if (result.responses) {
        for (const r of result.responses) {
          userPrompt += `\n  → @${r.agentId}: ${r.stance} – ${r.comment}`;
        }
      }
    }
  }

  try {
    const response = await callClaude(systemPrompt, userPrompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const synthesis = JSON.parse(jsonMatch[0]);

    await addSynthesis(debateId, {
      consensusSummary: synthesis.consensusSummary,
      disagreementSummary: synthesis.disagreementSummary,
      keyInsights: synthesis.keyInsights,
      recommendation: synthesis.recommendation,
    });

    await completeDebate(debateId, synthesis.consensusType, synthesis.recommendation);

    console.log(`  ✓ Synthesis complete: ${synthesis.consensusType} consensus`);
    console.log(`  📌 Recommendation: ${synthesis.recommendation}`);

    return synthesis;
  } catch (err) {
    console.error(`  ✗ Synthesis error: ${err}`);
    await completeDebate(debateId, "none", "Synthesis failed");
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function runDebate(options: { topic?: string; context?: string; debateId?: string; rounds?: number }) {
  const { topic, context, debateId: existingDebateId, rounds = 2 } = options;

  if (!topic && !existingDebateId) {
    throw new Error("Either --topic or --debate-id is required");
  }

  let debateId = existingDebateId;
  let debateTopic = topic || "";

  // Create or fetch debate
  if (!debateId) {
    console.log(`\n🎯 Creating debate: "${topic}"`);
    const debate = await createDebate(topic!, context);
    debateId = debate.id;
    debateTopic = debate.topic;
    console.log(`  ✓ Debate created: ${debateId}`);
  } else {
    console.log(`\n🎯 Resuming debate: ${debateId}`);
    const data = await mcFetch(`/api/council/debates/${debateId}`);
    debateTopic = data.debate.topic;
  }

  // At this point debateId is definitely defined
  const finalDebateId = debateId!;

  // Run rounds
  const allRounds: Array<Array<{ agentId: string; result: TurnResult }>> = [];

  for (let r = 1; r <= rounds; r++) {
    const previousPositions = allRounds.map((round) =>
      round.map(({ agentId, result }) => ({ agentId, position: result.position }))
    );
    const roundResults = await runRound(finalDebateId, r, debateTopic, context, previousPositions);
    allRounds.push(roundResults);
  }

  // Generate synthesis
  await generateSynthesis(finalDebateId, debateTopic, allRounds);

  console.log(`\n✅ Debate complete!`);
  console.log(`   View at: ${MISSION_CONTROL_URL}/council`);
}

// Parse CLI args
const args = process.argv.slice(2);
const options: { topic?: string; context?: string; debateId?: string; rounds?: number } = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--topic" && args[i + 1]) {
    options.topic = args[++i];
  } else if (args[i] === "--context" && args[i + 1]) {
    options.context = args[++i];
  } else if (args[i] === "--debate-id" && args[i + 1]) {
    options.debateId = args[++i];
  } else if (args[i] === "--rounds" && args[i + 1]) {
    options.rounds = parseInt(args[++i], 10);
  }
}

runDebate(options).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
