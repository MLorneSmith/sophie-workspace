/**
 * Agent definitions for SlideHeroes.
 *
 * Includes research foundation agent and launch agents
 * (Partner, Validator, Whisperer, Editor).
 */

export {
	EditorRedundancyPairSchema,
	type EditorReview,
	EditorReviewSchema,
	type EditorSlideAction,
	EditorSlideActionSchema,
	editorAgent,
} from "./editor-agent";

export {
	type PartnerReview,
	PartnerReviewSchema,
	type PartnerSlideReview,
	PartnerSlideReviewSchema,
	PartnerSlideScoresSchema,
	PartnerTopIssueSchema,
	partnerAgent,
} from "./partner-agent";
export {
	AGENT_CATALOG,
	type AgentCatalogEntry,
	getAgent,
	LAUNCH_AGENTS,
	type LaunchAgentId,
} from "./registry";
export { researchAgent } from "./research-agent";
export {
	type ValidatorClaim,
	ValidatorClaimSchema,
	ValidatorCriticalFlagSchema,
	type ValidatorReview,
	ValidatorReviewSchema,
	type ValidatorSlideReview,
	ValidatorSlideReviewSchema,
	validatorAgent,
} from "./validator-agent";
export {
	type WhispererReview,
	WhispererReviewSchema,
	type WhispererSlideNotes,
	WhispererSlideNotesSchema,
	whispererAgent,
} from "./whisperer-agent";
