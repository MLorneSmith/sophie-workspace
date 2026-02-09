/**
 * Council v2 Type Definitions
 */

export type AgentId = 'claude' | 'gpt' | 'glm';
export type Stance = 'agree' | 'disagree' | 'partial';
export type DebateStatus = 'active' | 'voting' | 'synthesizing' | 'complete' | 'cancelled';
export type ConsensusType = 'strong' | 'soft' | 'none';

export interface AgentConfig {
  id: AgentId;
  model: string;
  role: string;
  roleDescription: string;
}

export interface AgentResponse {
  agentId: AgentId;
  stance: Stance;
  comment: string;
}

export interface AgentTurn {
  agentId: AgentId;
  roundNumber: number;
  position: string;
  responses: AgentResponse[];
  reasoning: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
  rawResponse?: string;
}

export interface DebateRound {
  roundNumber: number;
  turns: AgentTurn[];
  startedAt: string;
  completedAt?: string;
}

export interface Vote {
  agentId: AgentId;
  finalPosition: string;
  confidence: number;
  agreements: { agentId: AgentId; stance: Stance }[];
}

export interface VotingRound {
  votes: Vote[];
  consensusReached: boolean;
  consensusType?: ConsensusType;
}

export interface Synthesis {
  synthesizerId: AgentId;
  consensusSummary?: string;
  disagreementSummary?: string;
  keyInsights: { agentId: AgentId; insight: string }[];
  recommendation: string;
  createdAt: string;
}

export interface HumanInjection {
  message: string;
  injectedAt: string;
  targetAgent?: AgentId;
}

export interface DebateConfig {
  maxRounds: number;
  agents: AgentConfig[];
  consensusThreshold: number;
}

export interface DebateSession {
  id: string;
  topic: string;
  context?: string;
  status: DebateStatus;
  config: DebateConfig;
  rounds: DebateRound[];
  votingRound?: VotingRound;
  synthesis?: Synthesis;
  createdAt: string;
  completedAt?: string;
  humanInjections: HumanInjection[];
}

// Default agent configurations
export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'claude',
    model: 'anthropic/claude-opus-4-5',
    role: 'Reasoner',
    roleDescription: 'You excel at deep analysis, nuanced thinking, and structured arguments. You consider multiple perspectives and edge cases.',
  },
  {
    id: 'gpt',
    model: 'openai/gpt-4o',
    role: 'Pragmatist',
    roleDescription: 'You focus on practical solutions and implementation. You balance idealism with real-world constraints.',
  },
  {
    id: 'glm',
    model: 'zai/glm-4.7',
    role: 'Synthesizer',
    roleDescription: 'You excel at finding common ground and summarizing key points. You identify areas of agreement and bridge differences.',
  },
];

export const DEFAULT_CONFIG: DebateConfig = {
  maxRounds: 5,
  agents: DEFAULT_AGENTS,
  consensusThreshold: 2,
};
