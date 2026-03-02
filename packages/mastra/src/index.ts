/**
 * @kit/mastra — SlideHeroes Mastra integration package.
 *
 * Provides the Mastra singleton, agent definitions,
 * and model routing configuration.
 */

export * from "./agents";
export { getRunTokenUsage } from "./config/spike-tracing";
export { PORTKEY_GATEWAY_URL } from "./gateway/portkey-gateway";
export {
	getMastra,
	getMastraMemory,
	getPgVector,
	type MastraWorkingMemory,
	MastraWorkingMemorySchema,
} from "./mastra";
// persistence/agent-results is server-only — import via "@kit/mastra/persistence".
// Do NOT re-export runtime values here; it would impose "server-only" on the entire package.
export type {
	AgentId,
	AgentRun,
	AgentRunStatus,
	AgentRunTokenUsage,
	AgentSuggestion,
	AgentSuggestionPriority,
	AgentSuggestionStatus,
	AgentSuggestionType,
	CreateAgentRunInput,
	CreateAgentSuggestionInput,
	GetSuggestionsFilters,
	SupabaseClientLike,
	UpdateAgentRunInput,
} from "./persistence/agent-results";
// isSuggestionStale is server-only — import via "@kit/mastra/persistence"
// RAG utilities moved to deep-import "@kit/mastra/rag" to avoid client-side bundling
export * from "./resilience";
// Agent output transformers (explicit exports to avoid collision with "./types")
export {
	type BuildDocumentOptions,
	buildTipTapDocument,
	transformEditorReview,
	transformEditorSlideAction,
	transformPartnerReview,
	transformPartnerSlideReview,
	transformValidatorClaim,
	transformValidatorReview,
	transformValidatorSlideReview,
	transformWhispererReview,
	transformWhispererSlideNotes,
} from "./transformers";

// TipTap-compatible agent output types
export * from "./types";
export {
	audienceProfilingWorkflow,
	createAudienceProfilingWorkflow,
	createPostProcessWorkflow,
	postProcessWorkflow,
} from "./workflows";
