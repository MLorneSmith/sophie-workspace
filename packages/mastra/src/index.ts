/**
 * @kit/mastra — SlideHeroes Mastra integration package.
 *
 * Provides the Mastra singleton, agent definitions,
 * and model routing configuration.
 */

export {
	getMastra,
	getMastraMemory,
	getPgVector,
	MastraWorkingMemorySchema,
	type MastraWorkingMemory,
} from "./mastra";
export { PORTKEY_GATEWAY_URL } from "./gateway/portkey-gateway";
export { getRunTokenUsage } from "./config/spike-tracing";
export {
	SLIDEHEROES_EMBEDDINGS_INDEX,
	embedDocument,
	querySimilar,
} from "./rag";
export {
	audienceProfilingWorkflow,
	createAudienceProfilingWorkflow,
	postProcessWorkflow,
	createPostProcessWorkflow,
} from "./workflows";
export * from "./resilience";
export * from "./agents";
// persistence/agent-results is server-only — import via "@kit/mastra/persistence".
// Do NOT re-export runtime values here; it would impose "server-only" on the entire package.
export type {
	AgentId,
	AgentRunStatus,
	AgentSuggestionType,
	AgentSuggestionPriority,
	AgentSuggestionStatus,
	AgentRunTokenUsage,
	AgentRun,
	AgentSuggestion,
	CreateAgentRunInput,
	UpdateAgentRunInput,
	CreateAgentSuggestionInput,
	GetSuggestionsFilters,
	SupabaseClientLike,
} from "./persistence/agent-results";
