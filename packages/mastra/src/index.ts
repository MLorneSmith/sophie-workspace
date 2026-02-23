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
export * from "./agents";
